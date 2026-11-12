import { useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { RichEditor } from 'react-native-pell-rich-editor';

import type { AtaEditorProps } from '@/components/ata/AtaEditor.types';
import AtaToolbar from '@/components/ata/AtaToolbar';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

import { createAtaTableHtml, getAtaDocumentCss } from '@/utils/ataFormat';
import {
  ATA_NATIVE_BRIDGE,
  parseAtaNativeSelection,
  type AtaNativeSelection,
} from '@/utils/ataNativeBridge';

export default function AtaEditor({
  initialHtml,
  onChange,
  disabled,
  ref,
}: AtaEditorProps) {
  const { colors } = useTheme();
  const editor = useRef<RichEditor>(null);
  const [ready, setReady] = useState(false);
  const [selection, setSelection] = useState<AtaNativeSelection>({
    active: [],
    unavailable: ['undo', 'redo'],
    fontSize: 16,
    inTable: false,
    tableBorder: 'all',
  });
  const command = (script: string) => {
    if (disabled || !ready) return;
    editor.current?.commandDOM(script);
  };
  useImperativeHandle(
    ref,
    () => ({
      // Consulta o documento antes de salvar para incluir a última tecla, sem depender do debounce.
      getHtml: async () => {
        if (!editor.current || !ready)
          throw new Error('Aguarde o editor carregar.');
        return editor.current.getContentHtml();
      },
    }),
    [ready],
  );

  return (
    <View style={styles.container}>
      <AtaToolbar
        disabled={disabled || !ready}
        {...selection}
        onFormat={(action) =>
          command(`window.__ataEditor?.format(${JSON.stringify(action)})`)
        }
        onPrepareTable={() => command('window.__ataEditor?.capture()')}
        onInsertTable={(options) =>
          command(
            `window.__ataEditor?.insert(${JSON.stringify(createAtaTableHtml(options))})`,
          )
        }
        onTableBorder={(border) =>
          command(
            `window.__ataEditor?.table('border', ${JSON.stringify(border)})`,
          )
        }
        onTableAction={(action) =>
          command(`window.__ataEditor?.table(${JSON.stringify(action)})`)
        }
      />
      <View style={[styles.editor, { borderColor: colors.border }]}>
        <RichEditor
          ref={editor}
          initialContentHTML={initialHtml}
          accessibilityLabel="Conteúdo da ata"
          placeholder="Registre os assuntos e as decisões da reunião..."
          initialHeight={320}
          disabled={disabled}
          onChange={onChange}
          onMessage={(message) => {
            const next = parseAtaNativeSelection(message);
            if (next) setSelection(next);
          }}
          pasteAsPlainText
          styleWithCSS={false}
          defaultParagraphSeparator="p"
          allowFileAccess={false}
          allowFileAccessFromFileURLs={false}
          allowUniversalAccessFromFileURLs={false}
          mixedContentMode="never"
          editorStyle={{
            backgroundColor: colors.backgroundElement,
            color: colors.text,
            placeholderColor: colors.textSecondary,
            contentCSSText: `font-size:${Typography.bodyLarge.fontSize}px;line-height:1.5;padding:${Spacing.md}px;`,
            cssText: getAtaDocumentCss('.content'),
          }}
          editorInitializedCallback={() => {
            setReady(true);
            editor.current?.commandDOM(ATA_NATIVE_BRIDGE);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.md },
  editor: { borderWidth: 1, borderRadius: Radius.md, overflow: 'hidden' },
});
