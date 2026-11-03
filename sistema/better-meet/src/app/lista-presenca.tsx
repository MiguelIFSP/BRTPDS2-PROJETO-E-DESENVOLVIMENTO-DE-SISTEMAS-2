import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Platform, Share, StyleSheet, Text, View } from 'react-native';
import * as yup from 'yup';

import ListaPresencaView from '@/components/presenca/ListaPresencaView';
import ListaPresencaEditor from '@/components/presenca/ListaPresencaEditor';
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
import {
  formatListaPresencaCsv,
  getResumoPresenca,
  mergeMarcacoesPresenca,
  type MarcacaoPresenca,
} from '@/utils/marcacoesPresenca';

type ListaPresencaForm = { observacoes: string };

/**
 * Prévia navegável: usa exemplos locais para demonstrar versões, observações
 * e compartilhamento. Não consulta a API nem grava dados no aparelho.
 */
export default function ListaPresencaScreen() {
  const { reuniaoId } = useLocalSearchParams<{ reuniaoId?: string }>();
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
  const [observacoes, setObservacoes] = useState(
    selectedLista?.observacoes ?? '',
  );
  const [marcacoes, setMarcacoes] = useState<MarcacaoPresenca[]>([]);
  const [pendingVersionId, setPendingVersionId] = useState<number | null>(null);
  const [errors, setErrors] = useState<FieldErrors<ListaPresencaForm>>({});
  const [pendingData, setPendingData] = useState<GerarListaPresencaData | null>(
    null,
  );
  const marcacoesExibidas = selectedLista
    ? mergeMarcacoesPresenca(
        selectedLista.snapshot.membros,
        selectedLista.marcacoes ?? [],
        marcacoes,
      )
    : [];
  const resumo = getResumoPresenca(
    selectedLista?.snapshot.membros ?? [],
    marcacoesExibidas,
  );
  const hasUnsavedChanges =
    marcacoes.length > 0 || observacoes !== (selectedLista?.observacoes ?? '');

  const handleSelectVersion = (id: number) => {
    if (id === selectedId) return;
    if (hasUnsavedChanges) {
      setPendingVersionId(id);
      return;
    }
    selectVersion(id);
    setObservacoes(versoes.find((lista) => lista.id === id)?.observacoes ?? '');
  };

  const discardChanges = () => {
    if (pendingVersionId === null) return;
    selectVersion(pendingVersionId);
    setMarcacoes([]);
    setObservacoes(
      versoes.find((lista) => lista.id === pendingVersionId)?.observacoes ?? '',
    );
    setErrors({});
    setPendingVersionId(null);
  };

  // O Drawer mantém a tela montada: restaurar no foco torna explícito que
  // as versões simuladas são descartadas ao sair e voltar para a prévia.
  useFocusEffect(
    useCallback(() => {
      const listaInicial = resetPreview();
      setObservacoes(listaInicial?.observacoes ?? '');
      setMarcacoes([]);
      setPendingVersionId(null);
      setErrors({});
      setPendingData(null);
      return () => setPendingData(null);
    }, [resetPreview]),
  );

  const prepareGeneration = async () => {
    setFeedback(null);
    try {
      const values = await listaPresencaSchema.validate(
        { observacoes, presencas: marcacoesExibidas },
        { abortEarly: false, stripUnknown: true },
      );
      setErrors({});
      setPendingData({
        observacoes: values.observacoes ?? '',
        presencas: values.presencas ?? [],
      });
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        setErrors(toFieldErrors<ListaPresencaForm>(error));
      }
    }
  };

  const handleGenerate = () => {
    if (!pendingData) return;
    generateVersion(pendingData);
    setObservacoes(pendingData.observacoes?.trim() ?? '');
    setMarcacoes([]);
    setPendingData(null);
    setFeedback({
      type: 'success',
      message: 'Lista simulada salva em uma nova versão nesta prévia.',
    });
  };

  const handleShare = async () => {
    if (!selectedLista || isSharing || hasUnsavedChanges) return;
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

  const handleExportCsv = async () => {
    if (!selectedLista || isSharing || hasUnsavedChanges) return;
    setIsSharing(true);
    setFeedback(null);
    try {
      const csv =
        '\uFEFF"Prévia — dados fictícios"\r\n' +
        formatListaPresencaCsv(selectedLista).replace(/^\uFEFF/, '');
      if (Platform.OS === 'web') {
        if (
          typeof document === 'undefined' ||
          typeof URL.createObjectURL !== 'function'
        ) {
          throw new Error('Este navegador não permite baixar a lista em CSV.');
        }
        const url = URL.createObjectURL(
          new Blob([csv], { type: 'text/csv;charset=utf-8' }),
        );
        const link = document.createElement('a');
        try {
          link.href = url;
          link.download = `lista-presenca-previa-v${selectedLista.versao}.csv`;
          document.body.appendChild(link);
          link.click();
        } finally {
          link.remove();
          URL.revokeObjectURL(url);
        }
        setFeedback({
          type: 'success',
          message: 'CSV da versão simulada exportado.',
        });
      } else {
        await Share.share({
          title: 'Lista de presença — CSV de demonstração',
          message: csv,
        });
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Não foi possível exportar o exemplo.'),
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
        {reuniaoId !== undefined ? (
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            Esta prévia apresenta a reunião de exemplo. O acesso à reunião
            selecionada será ligado na integração.
          </Text>
        ) : null}
      </Card>
      <FeedbackBanner feedback={feedback} />
      <Card tone="tinted">
        <SectionLabel label="Resumo da revisão" />
        <Text style={[styles.body, { color: colors.text }]}>
          {resumo.convidados} pessoas na lista · {resumo.presentes} presentes ·{' '}
          {resumo.adesao}% de adesão
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          Atrasados e quem saiu antes contam como comparecimento. As marcações
          não alteram as respostas aos convites.
        </Text>
      </Card>
      <Card>
        <SectionLabel label="Revisar lista de presença" />
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          Marque a presença de cada participante, inclusive em reuniões
          presenciais. Os horários permanecem os dos registros originais.
        </Text>
        {selectedLista ? (
          <ListaPresencaEditor
            membros={selectedLista.snapshot.membros}
            marcacoes={marcacoesExibidas}
            errors={errors}
            onChange={(values) => {
              setMarcacoes(values);
              setErrors({});
            }}
          />
        ) : null}
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
          label="Salvar lista simulada"
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
            onPress={() => handleSelectVersion(lista.id)}
          />
        ))}
      </View>
      {selectedLista ? (
        <>
          {hasUnsavedChanges ? (
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              Salve a revisão para compartilhar as marcações atuais.
            </Text>
          ) : null}
          <Button
            label={
              Platform.OS === 'web'
                ? 'Copiar exemplo para compartilhar'
                : 'Compartilhar exemplo'
            }
            variant="secondary"
            icon="share-outline"
            isLoading={isSharing}
            disabled={hasUnsavedChanges}
            onPress={() => void handleShare()}
          />
          <Button
            label={
              Platform.OS === 'web'
                ? 'Exportar exemplo em CSV'
                : 'Compartilhar CSV em texto'
            }
            variant="secondary"
            icon="download-outline"
            isLoading={isSharing}
            disabled={hasUnsavedChanges}
            onPress={() => void handleExportCsv()}
          />
          <SectionLabel label="Versão salva" />
          <ListaPresencaView lista={selectedLista} />
        </>
      ) : null}
      <ConfirmDialog
        visible={pendingData !== null}
        title="Salvar lista simulada?"
        message="As marcações e observações serão guardadas em uma nova versão nesta tela, preservando o histórico. Ao sair e voltar, os exemplos iniciais serão restaurados."
        variant="info"
        confirmLabel="Salvar versão simulada"
        onConfirm={handleGenerate}
        onCancel={() => setPendingData(null)}
      />
      <ConfirmDialog
        visible={pendingVersionId !== null}
        title="Descartar alterações desta revisão?"
        message="As marcações e observações ainda não salvas serão descartadas ao abrir outra versão."
        variant="warning"
        confirmLabel="Descartar e trocar"
        onConfirm={discardChanges}
        onCancel={() => setPendingVersionId(null)}
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
