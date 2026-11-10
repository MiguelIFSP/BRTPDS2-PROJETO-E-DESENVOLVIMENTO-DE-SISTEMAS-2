import { describe, expect, it, jest } from '@jest/globals';
import {
  ATA_NATIVE_BRIDGE,
  parseAtaNativeSelection,
} from '@/utils/ataNativeBridge';

describe('ponte do editor móvel', () => {
  it('não executa a normalização do Pell durante undo/redo, mas mantém o input de digitação', () => {
    const nativeWindow = window as typeof window & {
      __ataEditor?: { format: (action: string) => void };
      ReactNativeWebView?: { postMessage: (message: string) => void };
    };
    const root = document.createElement('div');
    root.setAttribute('contenteditable', 'true');
    root.innerHTML = '<p>Decisão</p>';
    Object.defineProperty(root, 'isContentEditable', { value: true });
    document.body.append(root);
    const originalInput = jest.fn();
    root.oninput = originalInput;
    const postMessage = jest.fn();
    nativeWindow.ReactNativeWebView = { postMessage };
    const originalExec = document.execCommand;
    const originalState = document.queryCommandState;
    const originalEnabled = document.queryCommandEnabled;
    document.execCommand = () => {
      root.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    };
    document.queryCommandState = () => false;
    document.queryCommandEnabled = () => true;
    try {
      window.eval(ATA_NATIVE_BRIDGE);
      nativeWindow.__ataEditor?.format('undo');
      nativeWindow.__ataEditor?.format('redo');
      expect(originalInput).not.toHaveBeenCalled();
      expect(
        postMessage.mock.calls.some(
          ([message]) => JSON.parse(String(message)).type === 'CONTENT_CHANGE',
        ),
      ).toBe(true);
      root.dispatchEvent(new Event('input', { bubbles: true }));
      expect(originalInput).toHaveBeenCalledTimes(1);
    } finally {
      root.remove();
      delete nativeWindow.__ataEditor;
      delete nativeWindow.ReactNativeWebView;
      document.execCommand = originalExec;
      document.queryCommandState = originalState;
      document.queryCommandEnabled = originalEnabled;
    }
  });
  it('filtra mensagens inválidas e comandos desconhecidos da WebView', () => {
    expect(parseAtaNativeSelection({ type: 'LOG', data: {} })).toBeNull();
    expect(
      parseAtaNativeSelection({ type: 'ATA_SELECTION', data: { active: [] } }),
    ).toBeNull();
    expect(
      parseAtaNativeSelection({
        type: 'ATA_SELECTION',
        data: {
          active: ['bold', 'javascript'],
          unavailable: ['undo'],
          fontSize: 18,
          inTable: true,
          tableBorder: 'invalida',
        },
      }),
    ).toEqual({
      active: ['bold'],
      unavailable: ['undo'],
      fontSize: 18,
      inTable: true,
      tableBorder: 'all',
    });
  });
});
