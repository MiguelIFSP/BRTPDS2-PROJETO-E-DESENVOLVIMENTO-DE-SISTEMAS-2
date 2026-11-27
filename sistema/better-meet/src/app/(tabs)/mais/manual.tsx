import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';

import ManualPagination from '@/components/manual/ManualPagination';
import BackButton from '@/components/ui/BackButton';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import FeedbackBanner from '@/components/ui/FeedbackBanner';
import PageIntro from '@/components/ui/PageIntro';
import Screen from '@/components/ui/Screen';
import { FontFamily, Radius, Spacing, Typography } from '@/constants/theme';
import { MANUAL_USUARIO } from '@/content/manual/manualUsuario';
import { useFeedback } from '@/hooks/useFeedback';
import { useTheme } from '@/hooks/useTheme';
import { exportManualPdf } from '@/utils/manualPdf';

export default function ManualScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [page, setPage] = useState(0);
  const chapter = MANUAL_USUARIO[page] ?? MANUAL_USUARIO[0]!;
  const totalPages = MANUAL_USUARIO.length;
  const [isExporting, setIsExporting] = useState(false);
  const [feedback, setFeedback] = useFeedback();

  // Sem mensagem de sucesso: a gaveta de compartilhamento e a janela de impressão
  // não informam se o arquivo foi salvo ou se a pessoa cancelou.
  const handleExportPdf = async () => {
    setFeedback(null);
    setIsExporting(true);
    try {
      await exportManualPdf();
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Não foi possível exportar o manual.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Screen key={chapter.id}>
      <BackButton fallbackHref="/mais" />
      <PageIntro title="Manual do usuário" />
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Guia prático para o perfil de usuário comum.
      </Text>
      <Button
        label="Exportar manual em PDF"
        loadingLabel="Preparando PDF..."
        icon="download-outline"
        variant="secondary"
        isLoading={isExporting}
        onPress={() => void handleExportPdf()}
      />
      <FeedbackBanner feedback={feedback} />

      <View style={styles.progress}>
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.pageCount, { color: colors.textSecondary }]}
        >
          Página {page + 1} de {totalPages}
        </Text>
        <View
          accessibilityLabel={`Progresso do manual: página ${page + 1} de ${totalPages}`}
          style={styles.progressTrack}
        >
          {MANUAL_USUARIO.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.progressSegment,
                {
                  backgroundColor:
                    index <= page ? colors.primary : colors.border,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <Card tone="tinted">
        <Text style={[styles.eyebrow, { color: colors.primary }]}>
          CAPÍTULO {String(page + 1).padStart(2, '0')}
        </Text>
        <Text
          accessibilityRole="header"
          style={[styles.chapterTitle, { color: colors.text }]}
        >
          {chapter.title}
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          {chapter.intro}
        </Text>
      </Card>

      {chapter.content.map((block, index) => {
        const key = `${chapter.id}-${index}`;

        if (block.kind === 'image') {
          return (
            <Card key={key} style={styles.figure}>
              <Image
                accessible
                accessibilityLabel={block.alt}
                source={block.source}
                resizeMode="contain"
                style={[
                  styles.illustration,
                  { aspectRatio: block.aspectRatio },
                ]}
              />
              <Text style={[styles.caption, { color: colors.textSecondary }]}>
                {block.caption}
              </Text>
            </Card>
          );
        }

        if (block.kind === 'note') {
          return (
            <Card key={key} tone="tinted">
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>
                {block.title}
              </Text>
              <Text style={[styles.body, { color: colors.text }]}>
                {block.text}
              </Text>
            </Card>
          );
        }

        return (
          <Card key={key}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {block.title}
            </Text>
            {block.text ? (
              <Text style={[styles.body, { color: colors.textSecondary }]}>
                {block.text}
              </Text>
            ) : null}
            {block.steps?.map((step, stepIndex) => (
              <View key={`${key}-step-${stepIndex}`} style={styles.stepRow}>
                <Text style={[styles.stepNumber, { color: colors.primary }]}>
                  {stepIndex + 1}.
                </Text>
                <Text
                  style={[
                    styles.body,
                    styles.stepText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {step}
                </Text>
              </View>
            ))}
          </Card>
        );
      })}

      <ManualPagination
        currentPage={page}
        pageCount={totalPages}
        onPrevious={() => setPage((current) => Math.max(0, current - 1))}
        onNext={() =>
          setPage((current) => Math.min(totalPages - 1, current + 1))
        }
        onFinish={() => router.replace('/mais')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: { ...Typography.body },
  progress: { gap: Spacing.sm },
  pageCount: { ...Typography.bodySmall, textAlign: 'right' },
  progressTrack: { flexDirection: 'row', gap: Spacing.xs },
  progressSegment: { flex: 1, height: 5, borderRadius: Radius.sm },
  eyebrow: { ...Typography.caption, fontFamily: FontFamily.semiBold },
  chapterTitle: { ...Typography.heading2 },
  sectionTitle: { ...Typography.heading3 },
  body: { ...Typography.body, lineHeight: 24 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  stepNumber: { ...Typography.body, fontFamily: FontFamily.bold },
  stepText: { flex: 1 },
  figure: { width: '100%', alignItems: 'center' },
  // height 'auto' anula a altura intrínseca do arquivo, para valer o aspectRatio.
  illustration: { width: '100%', height: 'auto', borderRadius: Radius.md },
  caption: { ...Typography.bodySmall, lineHeight: 20, textAlign: 'center' },
});
