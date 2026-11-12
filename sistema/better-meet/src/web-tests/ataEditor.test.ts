import { describe, expect, it, jest } from '@jest/globals';
import { act, createElement, createRef } from 'react';
import { createRoot } from 'react-dom/client';

import AtaEditor from '@/components/ata/AtaEditor.web';
import type { AtaEditorHandle } from '@/components/ata/AtaEditor.types';

jest.mock('@/components/ata/AtaToolbar', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({
    colors: { text: 'black', backgroundElement: 'white', border: 'gray' },
  }),
}));

describe('editor web e estado de salvamento', () => {
  it('alternar disabled não emite alterações nem bloqueia votos após salvar uma tabela', async () => {
    const testGlobal = globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT: boolean;
    };
    const previous = testGlobal.IS_REACT_ACT_ENVIRONMENT;
    testGlobal.IS_REACT_ACT_ENVIRONMENT = true;
    const element = document.createElement('div');
    document.body.append(element);
    const root = createRoot(element);
    const onChange = jest.fn();
    const ref = createRef<AtaEditorHandle>();
    const initialHtml =
      '<p style="text-align:center"><span style="font-size:18px">Decisão</span></p><table data-ata-border="bottom"><tbody><tr><td><p>Prazo</p></td></tr></tbody></table>';
    try {
      for (const disabled of [false, true, false]) {
        await act(async () => {
          root.render(
            createElement(AtaEditor, { ref, initialHtml, onChange, disabled }),
          );
        });
      }
      expect(onChange).not.toHaveBeenCalled();
      expect(await ref.current?.getHtml()).toContain(
        'data-ata-border="bottom"',
      );
      expect(element.querySelector('[contenteditable="true"]')).not.toBeNull();
    } finally {
      await act(async () => root.unmount());
      element.remove();
      testGlobal.IS_REACT_ACT_ENVIRONMENT = previous;
    }
  });
});
