import { useEffect, useImperativeHandle } from 'react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { StyleSheet, View } from 'react-native';

import type {
  AtaEditorProps,
  AtaFormat,
} from '@/components/ata/AtaEditor.types';
import AtaToolbar from '@/components/ata/AtaToolbar';
import { FontFamily, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { sanitizeAtaHtml } from '@/utils/ataHtml.web';

export default function AtaEditor({
  initialHtml,
  onChange,
  disabled,
  ref,
}: AtaEditorProps) {
  const { colors } = useTheme();
  const editor = useEditor({
    extensions: [StarterKit.configure({ link: false, horizontalRule: false })],
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
  const active =
    useEditorState({
      editor,
      selector: ({ editor: current }) =>
        (['bold', 'italic', 'bulletList', 'orderedList'] as const).filter(
          (format) => current?.isActive(format),
        ),
    }) ?? [];
  useEffect(() => {
    editor?.setEditable(!disabled);
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

  const format = (action: AtaFormat) => {
    if (!editor) return;
    const chain = editor.chain().focus();
    if (action === 'bold') chain.toggleBold().run();
    if (action === 'italic') chain.toggleItalic().run();
    if (action === 'bulletList') chain.toggleBulletList().run();
    if (action === 'orderedList') chain.toggleOrderedList().run();
  };
  return (
    <View style={styles.container}>
      <AtaToolbar
        disabled={disabled || !editor}
        active={active}
        onFormat={format}
      />
      <div
        style={{
          ...editorStyle,
          color: colors.text,
          borderColor: colors.border,
          backgroundColor: colors.backgroundElement,
        }}
      >
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
