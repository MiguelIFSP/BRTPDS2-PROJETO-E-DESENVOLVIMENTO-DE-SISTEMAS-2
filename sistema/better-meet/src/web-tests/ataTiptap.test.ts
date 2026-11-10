import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { Editor } from '@tiptap/core';

import { createAtaTableHtml } from '@/utils/ataFormat';
import { sanitizeAtaHtml } from '@/utils/ataHtml.web';
import {
  actOnAtaTable,
  ataExtensions,
  formatAta,
  getAtaSelection,
} from '@/utils/ataTiptap.web';

let editor: Editor;
beforeEach(() => {
  editor = new Editor({
    extensions: ataExtensions(),
    content: '<p>Decisões da reunião.</p>',
  });
  editor.commands.selectAll();
});
afterEach(() => editor.destroy());

describe('comandos reais do editor web', () => {
  it('sublinha, rasura, aumenta/diminui fonte e desfaz/refaz', () => {
    formatAta(editor, 'underline');
    formatAta(editor, 'strike');
    formatAta(editor, 'fontIncrease');
    expect(editor.getHTML()).toContain('<u>');
    expect(editor.getHTML()).toContain('<s>');
    expect(editor.getHTML()).toContain('font-size: 18px');
    formatAta(editor, 'fontDecrease');
    expect(editor.getHTML()).toContain('font-size: 16px');
    const html = editor.getHTML();
    formatAta(editor, 'undo');
    expect(editor.getHTML()).not.toBe(html);
    expect(getAtaSelection(editor).unavailable).not.toContain('redo');
    formatAta(editor, 'redo');
    expect(editor.getHTML()).toBe(html);
  });
  it.each([1, 2, 3] as const)('aplica e remove título H%i', (level) => {
    formatAta(editor, `heading${level}`);
    expect(editor.getHTML()).toBe(
      `<h${level}>Decisões da reunião.</h${level}>`,
    );
    expect(getAtaSelection(editor).active).toContain(`heading${level}`);
    formatAta(editor, `heading${level}`);
    expect(editor.getHTML()).toBe('<p>Decisões da reunião.</p>');
  });
  it.each([
    ['alignLeft', 'left'],
    ['alignCenter', 'center'],
    ['alignRight', 'right'],
    ['alignJustify', 'justify'],
  ] as const)(
    'aplica %s e mantém após sanitização/reabertura',
    (action, value) => {
      formatAta(editor, action);
      editor.commands.setContent(sanitizeAtaHtml(editor.getHTML()));
      expect(editor.getHTML()).toContain(`text-align: ${value}`);
    },
  );
  it('recua e remove recuo de parágrafos', () => {
    formatAta(editor, 'indent');
    expect(editor.getHTML()).toContain('<blockquote>');
    formatAta(editor, 'outdent');
    expect(editor.getHTML()).toBe('<p>Decisões da reunião.</p>');
  });
  it('limita fonte à escala de 10 a 48 pixels', () => {
    for (let i = 0; i < 10; i++) formatAta(editor, 'fontIncrease');
    expect(getAtaSelection(editor).fontSize).toBe(48);
    for (let i = 0; i < 10; i++) formatAta(editor, 'fontDecrease');
    expect(getAtaSelection(editor).fontSize).toBe(10);
  });
  it('edita bordas, linhas/colunas e preserva a tabela ao reabrir', () => {
    editor.commands.setContent(
      createAtaTableHtml({ rows: 2, cols: 2, header: true, border: 'bottom' }),
    );
    editor.commands.setTextSelection(4);
    expect(getAtaSelection(editor)).toMatchObject({
      inTable: true,
      tableBorder: 'bottom',
    });
    actOnAtaTable(editor, 'addRow');
    actOnAtaTable(editor, 'addColumn');
    expect(editor.view.dom.querySelectorAll('tr')).toHaveLength(3);
    expect(editor.view.dom.querySelectorAll('tr')[0].children).toHaveLength(3);
    editor.commands.updateAttributes('table', { ataBorder: 'top' });
    editor.commands.setContent(sanitizeAtaHtml(editor.getHTML()));
    expect(
      editor.view.dom.querySelector('table')?.getAttribute('data-ata-border'),
    ).toBe('top');
    editor.commands.setTextSelection(4);
    actOnAtaTable(editor, 'deleteRow');
    actOnAtaTable(editor, 'deleteColumn');
    expect(editor.view.dom.querySelectorAll('tr')).toHaveLength(2);
    expect(editor.view.dom.querySelectorAll('tr')[0].children).toHaveLength(2);
    actOnAtaTable(editor, 'deleteTable');
    expect(editor.view.dom.querySelector('table')).toBeNull();
  });
});
