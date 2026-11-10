import { mergeAttributes, type Editor } from '@tiptap/core';
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
} from '@tiptap/extension-table';
import { TextAlign } from '@tiptap/extension-text-align';
import { FontSize, TextStyle } from '@tiptap/extension-text-style';
import { StarterKit } from '@tiptap/starter-kit';
import { AllSelection, Selection } from '@tiptap/pm/state';

import type {
  AtaFormat,
  AtaTableAction,
} from '@/components/ata/AtaEditor.types';
import { isAtaTableBorder, nextAtaFontSize } from '@/utils/ataFormat';

const AtaTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      ataBorder: {
        default: 'all',
        parseHTML: (element) => {
          const border = element.getAttribute('data-ata-border');
          return isAtaTableBorder(border) ? border : 'all';
        },
        renderHTML: (attributes) => ({
          'data-ata-border': isAtaTableBorder(attributes.ataBorder)
            ? attributes.ataBorder
            : 'all',
        }),
      },
    };
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'table',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      ['tbody', 0],
    ];
  },
});

export const ataExtensions = () => [
  StarterKit.configure({
    link: false,
    horizontalRule: false,
    trailingNode: false,
    heading: { levels: [1, 2, 3] },
  }),
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  TextStyle,
  FontSize,
  AtaTable.configure({ resizable: false }),
  TableRow,
  TableHeader,
  TableCell,
];

export const getAtaSelection = (editor: Editor) => {
  const active: AtaFormat[] = [];
  for (const format of [
    'bold',
    'italic',
    'underline',
    'strike',
    'bulletList',
    'orderedList',
  ] as const)
    if (editor.isActive(format)) active.push(format);
  for (const level of [1, 2, 3] as const)
    if (editor.isActive('heading', { level })) active.push(`heading${level}`);
  const alignment = (
    [
      ['left', 'alignLeft'],
      ['center', 'alignCenter'],
      ['right', 'alignRight'],
      ['justify', 'alignJustify'],
    ] as const
  ).find(([value]) => editor.isActive({ textAlign: value }));
  active.push(alignment?.[1] ?? 'alignLeft');
  const explicitSize = Number.parseInt(
    String(editor.getAttributes('textStyle').fontSize),
    10,
  );
  const level = editor.getAttributes('heading').level as number | undefined;
  const fontSize = Number.isFinite(explicitSize)
    ? explicitSize
    : level === 1
      ? 32
      : level === 2
        ? 24
        : level === 3
          ? 18
          : 16;
  const unavailable: AtaFormat[] = [];
  if (!editor.can().undo()) unavailable.push('undo');
  if (!editor.can().redo()) unavailable.push('redo');
  if (
    !editor.can().liftListItem('listItem') &&
    !editor.can().lift('blockquote')
  )
    unavailable.push('outdent');
  if (fontSize >= 48) unavailable.push('fontIncrease');
  if (fontSize <= 10) unavailable.push('fontDecrease');
  const border = editor.getAttributes('table').ataBorder;
  return {
    active,
    unavailable,
    fontSize,
    inTable: editor.isActive('table'),
    tableBorder: isAtaTableBorder(border) ? border : ('all' as const),
  };
};

export const formatAta = (editor: Editor, action: AtaFormat) => {
  const chain = editor.chain().focus();
  // Ctrl+A também deve permitir retirar o recuo de um documento inteiro.
  if (
    editor.state.selection instanceof AllSelection &&
    action !== 'undo' &&
    action !== 'redo'
  )
    chain.setTextSelection({
      from: Selection.atStart(editor.state.doc).from,
      to: Selection.atEnd(editor.state.doc).to,
    });
  switch (action) {
    case 'bold':
      return chain.toggleBold().run();
    case 'italic':
      return chain.toggleItalic().run();
    case 'underline':
      return chain.toggleUnderline().run();
    case 'strike':
      return chain.toggleStrike().run();
    case 'heading1':
      return chain.toggleHeading({ level: 1 }).run();
    case 'heading2':
      return chain.toggleHeading({ level: 2 }).run();
    case 'heading3':
      return chain.toggleHeading({ level: 3 }).run();
    case 'bulletList':
      return chain.toggleBulletList().run();
    case 'orderedList':
      return chain.toggleOrderedList().run();
    case 'alignLeft':
      return chain.setTextAlign('left').run();
    case 'alignCenter':
      return chain.setTextAlign('center').run();
    case 'alignRight':
      return chain.setTextAlign('right').run();
    case 'alignJustify':
      return chain.setTextAlign('justify').run();
    case 'indent':
      return editor.isActive('listItem')
        ? chain.sinkListItem('listItem').run()
        : chain.wrapIn('blockquote').run();
    case 'outdent':
      return editor.isActive('listItem')
        ? chain.liftListItem('listItem').run()
        : chain.lift('blockquote').run();
    case 'fontIncrease':
    case 'fontDecrease':
      return chain
        .setFontSize(
          `${nextAtaFontSize(getAtaSelection(editor).fontSize, action === 'fontIncrease' ? 1 : -1)}px`,
        )
        .run();
    case 'undo':
      return chain.undo().run();
    case 'redo':
      return chain.redo().run();
  }
};

export const actOnAtaTable = (editor: Editor, action: AtaTableAction) => {
  const { $from } = editor.state.selection;
  const tableDepth = Array.from(
    { length: $from.depth },
    (_, index) => $from.depth - index,
  ).find((depth) => $from.node(depth).type.name === 'table');
  if (!tableDepth) return;
  const table = $from.node(tableDepth);
  const chain = editor.chain().focus();
  switch (action) {
    case 'addRow':
      if (table.childCount < 10) chain.addRowAfter().run();
      break;
    case 'addColumn':
      if ((table.firstChild?.childCount ?? 0) < 6) chain.addColumnAfter().run();
      break;
    case 'deleteRow':
      chain.deleteRow().run();
      break;
    case 'deleteColumn':
      chain.deleteColumn().run();
      break;
    case 'deleteTable':
      chain.deleteTable().run();
      break;
  }
};
