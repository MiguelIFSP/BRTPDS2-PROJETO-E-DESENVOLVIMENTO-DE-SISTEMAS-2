import { useEffect, useImperativeHandle } from 'react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import { StyleSheet, View } from 'react-native';

import type { AtaEditorProps } from '@/components/ata/AtaEditor.types';
import AtaToolbar from '@/components/ata/AtaToolbar';
import { FontFamily, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { sanitizeAtaHtml } from '@/utils/ataHtml.web';
import { createAtaTableHtml, getAtaDocumentCss } from '@/utils/ataFormat';
import {
  actOnAtaTable,
  ataExtensions,
  formatAta,
  getAtaSelection,
} from '@/utils/ataTiptap.web';

export default function AtaEditor({
  initialHtml,
  onChange,
  disabled,
  ref,
}: AtaEditorProps) {
  const { colors } = useTheme();
  const editor = useEditor({
    extensions: ataExtensions(),
    immediatelyRender: false,
    content: typeof window === 'undefined' ? '' : sanitizeAtaHtml(initialHtml),
    editable: !disabled,
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
    editorProps: {
      attributes: {
        'aria-label': 'Conteúdo da ata',
        role: 'textbox',
        'aria-multiline': 'true',
        style: `min-height:320px;padding:${Spacing.md}px;outline-offset:2px;`,
      },
    },
  });
  const selection = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      current ? getAtaSelection(current) : null,
  });
  useEffect(() => {
    // Alternar o estado de salvamento não é uma alteração do documento.
    editor?.setEditable(!disabled, false);
  }, [editor, disabled]);
  useImperativeHandle(
    ref,
    () => ({
      getHtml: async () => {
        if (!editor) throw new Error('Aguarde o editor carregar.');
        return editor.getHTML();
      },
    }),
    [editor],
  );

  return (
    <View style={styles.container}>
      <AtaToolbar
        disabled={disabled || !editor}
        active={selection?.active ?? []}
        unavailable={selection?.unavailable}
        fontSize={selection?.fontSize}
        inTable={selection?.inTable}
        tableBorder={selection?.tableBorder}
        onFormat={(action) => {
          if (editor && !disabled) formatAta(editor, action);
        }}
        onPrepareTable={() => {}}
        onInsertTable={(options) => {
          if (!disabled)
            editor
              ?.chain()
              .focus()
              .insertContent(
                createAtaTableHtml(options).replaceAll(
                  '<p><br></p>',
                  '<p></p>',
                ),
              )
              .run();
        }}
        onTableBorder={(border) => {
          if (!disabled)
            editor
              ?.chain()
              .focus()
              .updateAttributes('table', { ataBorder: border })
              .run();
        }}
        onTableAction={(action) => {
          if (editor && !disabled) actOnAtaTable(editor, action);
        }}
      />
      <div
        className="ata-editor"
        style={{
          ...editorStyle,
          color: colors.text,
          borderColor: colors.border,
          backgroundColor: colors.backgroundElement,
        }}
      >
        <style>{getAtaDocumentCss('.ata-editor')}</style>
        <EditorContent editor={editor} />
      </div>
    </View>
  );
}

const editorStyle = {
  borderStyle: 'solid',
  borderWidth: 1,
  borderRadius: Radius.md,
  fontFamily: FontFamily.regular,
  fontSize: Typography.bodyLarge.fontSize,
  lineHeight: 1.5,
  overflowWrap: 'anywhere',
} as const;
const styles = StyleSheet.create({ container: { gap: Spacing.md } });
