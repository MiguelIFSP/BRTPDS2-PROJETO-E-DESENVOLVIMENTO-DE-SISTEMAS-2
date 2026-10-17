import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Platform, Share, StyleSheet, Text, View } from 'react-native';
import * as yup from 'yup';

import ListaPresencaView from '@/components/presenca/ListaPresencaView';
import BackButton from '@/components/ui/BackButton';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import FeedbackBanner from '@/components/ui/FeedbackBanner';
import PageIntro from '@/components/ui/PageIntro';
import Screen from '@/components/ui/Screen';
import SectionLabel from '@/components/ui/SectionLabel';
import TextField from '@/components/ui/TextField';
import { Spacing, Typography } from '@/constants/theme';
import { useFeedback } from '@/hooks/useFeedback';
import { useListaPresencaPreview } from '@/hooks/useListaPresencaPreview';
import { useTheme } from '@/hooks/useTheme';
import { listaPresencaSchema } from '@/schemas/listaPresencaSchema';
import type { GerarListaPresencaData } from '@/services/listaPresencaService';
import { getErrorMessage } from '@/utils/apiClient';
import { toFieldErrors, type FieldErrors } from '@/utils/formErrors';
import {
  formatListaPresencaText,
  STATUS_LISTA_LABELS,
} from '@/utils/listaPresenca';

type ListaPresencaForm = { observacoes: string };

/**
 * Prévia navegável: usa exemplos locais para demonstrar versões, observações
 * e compartilhamento. Não consulta a API nem grava dados no aparelho.
 */
export default function ListaPresencaScreen() {
  const { colors } = useTheme();
  const [feedback, setFeedback] = useFeedback();
  const {
    versoes,
    selectedId,
    selectedLista,
    generateVersion,
    selectVersion,
    resetPreview,
  } = useListaPresencaPreview();
  const [isSharing, setIsSharing] = useState(false);
  const [observacoes, setObservacoes] = useState('');
  const [errors, setErrors] = useState<FieldErrors<ListaPresencaForm>>({});
  const [pendingData, setPendingData] = useState<GerarListaPresencaData | null>(
    null,
  );

  // O Drawer mantém a tela montada: restaurar no foco torna explícito que
  // as versões simuladas são descartadas ao sair e voltar para a prévia.
  useFocusEffect(
    useCallback(() => {
      resetPreview();
      setObservacoes('');
      setErrors({});
      setPendingData(null);
      return () => setPendingData(null);
    }, [resetPreview]),
  );

  const prepareGeneration = async () => {
    setFeedback(null);
    try {
      const values = await listaPresencaSchema.validate(
        { observacoes },
        { abortEarly: false, stripUnknown: true },
      );
      setErrors({});
      setPendingData(
        values.observacoes ? { observacoes: values.observacoes } : {},
      );
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        setErrors(toFieldErrors<ListaPresencaForm>(error));
      }
    }
  };

  const handleGenerate = () => {
    if (!pendingData) return;
    generateVersion(pendingData);
    setObservacoes('');
    setPendingData(null);
    setFeedback({
      type: 'success',
      message: 'Versão simulada criada nesta prévia.',
    });
  };

  const handleShare = async () => {
    if (!selectedLista || isSharing) return;
    setIsSharing(true);
    setFeedback(null);
    try {
      // O aviso acompanha o texto exportado para não confundir a demonstração
      // com uma lista real de presença.
      const text =
        'Prévia — dados fictícios\n\n' + formatListaPresencaText(selectedLista);
      if (Platform.OS === 'web') {
        if (typeof navigator === 'undefined' || !navigator.clipboard) {
          throw new Error(
            'A cópia da lista exige um navegador com acesso à área de transferência.',
          );
        }
        await navigator.clipboard.writeText(text);
        setFeedback({
          type: 'success',
          message: 'Exemplo copiado. Cole o texto para compartilhar.',
        });
      } else {
        await Share.share({
          title: 'Lista de presença — demonstração',
          message: text,
        });
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(
          error,
          'Não foi possível compartilhar o exemplo.',
        ),
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Screen hasForm>
      <BackButton />
      <PageIntro title="Lista de presença" />
      <Card tone="tinted">
        <Badge label="Prévia com dados fictícios" tone="info" />
        <Text style={[styles.body, { color: colors.text }]}>
          Pessoas, datas e registros são exemplos. Você está simulando o papel
          de administrador da comissão. Nenhum dado é salvo no sistema.
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          Ao sair e voltar para esta tela, as versões simuladas são descartadas
          e os dois exemplos iniciais reaparecem.
        </Text>
      </Card>
      <FeedbackBanner feedback={feedback} />
      <Card>
        <SectionLabel label="Simular nova versão" />
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          A simulação reutiliza os registros do exemplo final e mantém as
          versões anteriores enquanto você estiver nesta tela.
        </Text>
        <TextField
          label="Observações (opcional)"
          value={observacoes}
          multiline
          maxLength={2000}
          error={errors.observacoes}
          onChangeText={(value) => {
            setObservacoes(value);
            setErrors({});
          }}
        />
        <Button
          label="Gerar nova versão simulada"
          icon="document-text-outline"
          onPress={() => void prepareGeneration()}
        />
      </Card>
      <SectionLabel label="Histórico de versões" />
      <View style={styles.versions}>
        {versoes.map((lista) => (
          <Chip
            key={lista.id}
            label={`Versão ${lista.versao} — ${STATUS_LISTA_LABELS[lista.status]}`}
            selected={selectedId === lista.id}
            onPress={() => selectVersion(lista.id)}
          />
        ))}
      </View>
      {selectedLista ? (
        <>
          <Button
            label={
              Platform.OS === 'web'
                ? 'Copiar exemplo para compartilhar'
                : 'Compartilhar exemplo'
            }
            variant="secondary"
            icon="share-outline"
            isLoading={isSharing}
            onPress={() => void handleShare()}
          />
          <ListaPresencaView lista={selectedLista} />
        </>
      ) : null}
      <ConfirmDialog
        visible={pendingData !== null}
        title="Gerar nova versão simulada?"
        message="O exemplo será acrescentado somente à memória desta tela. Ao sair e voltar, os exemplos iniciais serão restaurados."
        variant="info"
        confirmLabel="Simular geração"
        onConfirm={handleGenerate}
        onCancel={() => setPendingData(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { ...Typography.body },
  versions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
});
