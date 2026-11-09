import { useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { actions, RichEditor } from 'react-native-pell-rich-editor';

import type {
  AtaEditorProps,
  AtaFormat,
} from '@/components/ata/AtaEditor.types';
import AtaToolbar from '@/components/ata/AtaToolbar';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const ACTIONS = {
  bold: actions.setBold,
  italic: actions.setItalic,
  bulletList: actions.insertBulletsList,
  orderedList: actions.insertOrderedList,
} satisfies Record<AtaFormat, string>;

export default function AtaEditor({
  initialHtml,
  onChange,
  disabled,
  ref,
}: AtaEditorProps) {
  const { colors } = useTheme();
  const editor = useRef<RichEditor>(null);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState<AtaFormat[]>([]);
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
        active={active}
        onFormat={(action) =>
          editor.current?.sendAction(ACTIONS[action], 'result')
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
          }}
          editorInitializedCallback={() => {
            setReady(true);
            editor.current?.registerToolbar((items) => {
              setActive(
                (Object.keys(ACTIONS) as AtaFormat[]).filter((key) =>
                  items.includes(ACTIONS[key]),
                ),
              );
            });
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
