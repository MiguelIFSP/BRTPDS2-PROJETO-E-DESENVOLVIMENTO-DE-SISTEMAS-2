import type { Ref } from 'react';

export type AtaEditorHandle = { getHtml: () => Promise<string> };
export type AtaEditorProps = {
  initialHtml: string;
  onChange: (html: string) => void;
  disabled: boolean;
  ref?: Ref<AtaEditorHandle>;
};
export type AtaFormat = 'bold' | 'italic' | 'bulletList' | 'orderedList';
