import type { Ref } from 'react';

export type AtaEditorHandle = { getHtml: () => Promise<string> };
export type AtaEditorProps = {
  initialHtml: string;
  onChange: (html: string) => void;
  disabled: boolean;
  ref?: Ref<AtaEditorHandle>;
};
export type AtaFormat =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'alignLeft'
  | 'alignCenter'
  | 'alignRight'
  | 'alignJustify'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulletList'
  | 'orderedList'
  | 'indent'
  | 'outdent'
  | 'fontIncrease'
  | 'fontDecrease'
  | 'undo'
  | 'redo';
export type AtaTableAction =
  'addRow' | 'addColumn' | 'deleteRow' | 'deleteColumn' | 'deleteTable';
