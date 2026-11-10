import type { AtaFormat } from '@/components/ata/AtaEditor.types';
import {
  ATA_FONT_SIZES,
  isAtaTableBorder,
  type AtaTableBorder,
} from '@/utils/ataFormat';

export type AtaNativeSelection = {
  active: AtaFormat[];
  fontSize: number;
  inTable: boolean;
  tableBorder: AtaTableBorder;
  unavailable: AtaFormat[];
};
const COMMANDS: Partial<Record<AtaFormat, string>> = {
  bold: 'bold',
  italic: 'italic',
  underline: 'underline',
  strike: 'strikeThrough',
  alignLeft: 'justifyLeft',
  alignCenter: 'justifyCenter',
  alignRight: 'justifyRight',
  alignJustify: 'justifyFull',
  bulletList: 'insertUnorderedList',
  orderedList: 'insertOrderedList',
  indent: 'indent',
  outdent: 'outdent',
  undo: 'undo',
  redo: 'redo',
};

// Executado dentro da WebView do Pell. O Range é preservado ao abrir o painel
// nativo, e insertHTML participa do histórico do navegador, incluindo tabelas.
export const ATA_NATIVE_BRIDGE = `(() => {
  if (window.__ataEditor) return;
  const root = document.querySelector('[contenteditable]');
  if (!root) return;
  const sizes = ${JSON.stringify(ATA_FONT_SIZES)};
  const commands = ${JSON.stringify(COMMANDS)};
  let savedRange = null;
  let applyingCommand = false;
  const originalInput = root.oninput;
  // O Pell tenta envolver a seleção em um parágrafo no input. Durante undo de
  // tabelas isso altera novamente o DOM e apaga a pilha de redo do navegador.
  root.oninput = function(event) {
    if (!applyingCommand) originalInput?.call(this, event);
  };
  const element = () => {
    const node = window.getSelection()?.anchorNode;
    return node?.nodeType === 1 ? node : node?.parentElement;
  };
  const capture = () => {
    const selection = window.getSelection();
    if (selection?.rangeCount && root.contains(selection.anchorNode) && root.contains(selection.focusNode))
      savedRange = selection.getRangeAt(0).cloneRange();
  };
  const restore = () => {
    root.focus();
    const selection = window.getSelection();
    if (savedRange && root.contains(savedRange.commonAncestorContainer)) {
      selection.removeAllRanges();
      selection.addRange(savedRange);
    } else {
      const range = document.createRange();
      range.selectNodeContents(root);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };
  const report = () => {
    const node = element();
    if (!node || !root.contains(node)) return;
    capture();
    const table = node.closest('table');
    const active = Object.entries(commands).filter(([key, command]) =>
      !['undo', 'redo', 'indent', 'outdent'].includes(key) && document.queryCommandState(command)
    ).map(([key]) => key);
    const heading = node.closest('h1,h2,h3');
    if (heading) active.push('heading' + heading.tagName.slice(1));
    const fontSize = Math.round(parseFloat(getComputedStyle(node).fontSize)) || 16;
    const unavailable = ['undo', 'redo'].filter(command => !document.queryCommandEnabled(command));
    if (fontSize >= 48) unavailable.push('fontIncrease');
    if (fontSize <= 10) unavailable.push('fontDecrease');
    window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'ATA_SELECTION', data: {
      active, fontSize, unavailable, inTable: !!table, tableBorder: table?.getAttribute('data-ata-border') || 'all'
    }}));
  };
  const changed = () => {
    capture();
    report();
    window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'CONTENT_CHANGE', data: root.innerHTML }));
    document.dispatchEvent(new MessageEvent('message', { data: JSON.stringify({ type: 'UPDATE_HEIGHT' }) }));
  };
  const exec = (command, value) => {
    applyingCommand = true;
    try { return document.execCommand(command, false, value); }
    finally { applyingCommand = false; }
  };
  const replaceTable = (table, replacement, rowIndex, colIndex) => {
    const range = document.createRange();
    range.selectNode(table);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    const marker = 'ata-table-' + Date.now();
    if (replacement) replacement.id = marker;
    exec('insertHTML', replacement ? replacement.outerHTML : '<p><br></p>');
    const inserted = document.getElementById(marker);
    if (inserted) {
      inserted.removeAttribute('id');
      const row = inserted.rows[Math.min(rowIndex, inserted.rows.length - 1)];
      const cell = row?.cells[Math.min(colIndex, row.cells.length - 1)];
      if (cell) {
        range.selectNodeContents(cell);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  };
  window.__ataEditor = {
    capture,
    format(action) {
      if (!root.isContentEditable) return;
      restore();
      if (commands[action]) exec(commands[action]);
      else if (/^heading[123]$/.test(action)) {
        const tag = 'h' + action.slice(-1);
        exec('formatBlock', element()?.closest(tag) ? 'p' : tag);
      } else if (action === 'fontIncrease' || action === 'fontDecrease') {
        const current = parseFloat(getComputedStyle(element() || root).fontSize) || 16;
        const size = action === 'fontIncrease' ? sizes.find(size => size > current) || 48 : [...sizes].reverse().find(size => size < current) || 10;
        exec('fontSize', String(sizes.indexOf(size) + 1));
      }
      changed();
    },
    insert(html) {
      if (!root.isContentEditable) return;
      restore();
      exec('insertHTML', html);
      changed();
    },
    table(action, border) {
      if (!root.isContentEditable) return;
      restore();
      const table = element()?.closest('table');
      const cell = element()?.closest('td,th');
      if (!table || !cell) return;
      const rowIndex = cell.parentElement.rowIndex;
      const colIndex = cell.cellIndex;
      const clone = table.cloneNode(true);
      if (action === 'border') clone.setAttribute('data-ata-border', border);
      if (action === 'addRow') {
        if (clone.rows.length >= 10) return;
        const row = clone.insertRow(rowIndex + 1);
        for (let index = 0; index < table.rows[rowIndex].cells.length; index++) row.insertCell().innerHTML = '<p><br></p>';
      }
      if (action === 'addColumn') {
        if (Array.from(clone.rows).some(row => row.cells.length >= 6)) return;
        for (const row of clone.rows) {
          const newCell = document.createElement(row.cells[colIndex]?.tagName || 'td');
          newCell.innerHTML = '<p><br></p>';
          row.insertBefore(newCell, row.cells[colIndex + 1] || null);
        }
      }
      if (action === 'deleteRow') clone.deleteRow(rowIndex);
      if (action === 'deleteColumn') for (const row of clone.rows) if (row.cells[colIndex]) row.deleteCell(colIndex);
      const remove = action === 'deleteTable' || !clone.rows.length || !clone.rows[0].cells.length;
      replaceTable(table, remove ? null : clone, rowIndex, colIndex);
      changed();
    }
  };
  document.addEventListener('selectionchange', report);
  root.addEventListener('input', report);
  root.addEventListener('keyup', report);
  root.addEventListener('touchend', report);
})();`;

export const parseAtaNativeSelection = (
  message: unknown,
): AtaNativeSelection | null => {
  if (
    !message ||
    typeof message !== 'object' ||
    !('type' in message) ||
    message.type !== 'ATA_SELECTION' ||
    !('data' in message)
  )
    return null;
  const data = message.data;
  if (
    !data ||
    typeof data !== 'object' ||
    !('active' in data) ||
    !Array.isArray(data.active) ||
    !('unavailable' in data) ||
    !Array.isArray(data.unavailable) ||
    !('fontSize' in data) ||
    typeof data.fontSize !== 'number' ||
    !Number.isFinite(data.fontSize) ||
    !('inTable' in data) ||
    typeof data.inTable !== 'boolean' ||
    !('tableBorder' in data)
  )
    return null;
  const formats = new Set([
    ...Object.keys(COMMANDS),
    'heading1',
    'heading2',
    'heading3',
    'fontIncrease',
    'fontDecrease',
  ]);
  return {
    active: data.active.filter(
      (value): value is AtaFormat =>
        typeof value === 'string' && formats.has(value),
    ),
    unavailable: data.unavailable.filter(
      (value): value is AtaFormat =>
        typeof value === 'string' && formats.has(value),
    ),
    fontSize: data.fontSize,
    inTable: data.inTable,
    tableBorder: isAtaTableBorder(data.tableBorder) ? data.tableBorder : 'all',
  };
};
