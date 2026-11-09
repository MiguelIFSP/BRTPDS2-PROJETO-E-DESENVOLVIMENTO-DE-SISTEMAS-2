import { FontFamily, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { sanitizeAtaHtml } from '@/utils/ataHtml.web';

export default function AtaLeitura({ html }: { html: string }) {
  const { colors } = useTheme();
  return (
    <div
      role="document"
      aria-label="Ata em modo de leitura"
      style={{
        ...readerStyle,
        color: colors.text,
        borderColor: colors.border,
        backgroundColor: colors.backgroundElement,
      }}
      dangerouslySetInnerHTML={{
        __html: typeof window === 'undefined' ? '' : sanitizeAtaHtml(html),
      }}
    />
  );
}
const readerStyle = {
  borderWidth: 1,
  borderStyle: 'solid',
  borderRadius: Radius.md,
  padding: Spacing.md,
  fontFamily: FontFamily.regular,
  fontSize: Typography.bodyLarge.fontSize,
  lineHeight: 1.5,
  overflowWrap: 'anywhere',
} as const;
