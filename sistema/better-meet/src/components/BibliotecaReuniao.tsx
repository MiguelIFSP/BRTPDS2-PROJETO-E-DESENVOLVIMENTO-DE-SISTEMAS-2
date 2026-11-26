import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import FeedbackBanner from '@/components/ui/FeedbackBanner';
import SectionLabel from '@/components/ui/SectionLabel';
import { FontFamily, Spacing, Typography } from '@/constants/theme';
import { useFeedback } from '@/hooks/useFeedback';
import { useTheme } from '@/hooks/useTheme';
import {
  arquivoReuniaoService,
  type ArquivoReuniao,
} from '@/services/arquivoReuniaoService';
import { getErrorMessage } from '@/utils/apiClient';

type BibliotecaReuniaoProps = {
  token: string;
  reuniaoId: number;
};

const formatarTamanho = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function BibliotecaReuniao({
  token,
  reuniaoId,
}: BibliotecaReuniaoProps) {
  const { colors } = useTheme();
  const [arquivos, setArquivos] = useState<ArquivoReuniao[]>([]);
  const [podeEnviar, setPodeEnviar] = useState(false);
  const [feedback, setFeedback] = useFeedback();
  const [enviando, setEnviando] = useState(false);
  const [baixandoId, setBaixandoId] = useState<number | null>(null);
  const [apagando, setApagando] = useState<ArquivoReuniao | null>(null);
  const [estaApagando, setEstaApagando] = useState(false);

  const carregar = useCallback(async () => {
    const biblioteca = await arquivoReuniaoService.list(token, reuniaoId);
    setArquivos(biblioteca.arquivos);
    setPodeEnviar(biblioteca.podeEnviar);
  }, [token, reuniaoId]);

  useFocusEffect(
    useCallback(() => {
      let cancelado = false;
      void carregar().catch((error: unknown) => {
        if (cancelado) return;
        setFeedback({
          type: 'error',
          message: getErrorMessage(
            error,
            'Não foi possível carregar a biblioteca.',
          ),
        });
      });
      return () => {
        cancelado = true;
      };
    }, [carregar, setFeedback]),
  );

  const enviar = async () => {
    setEnviando(true);
    try {
      const criado = await arquivoReuniaoService.enviar(token, reuniaoId);
      if (!criado) return;
      setFeedback({ type: 'success', message: 'Arquivo enviado.' });
      await carregar();
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Não foi possível enviar o arquivo.'),
      });
    } finally {
      setEnviando(false);
    }
  };

  const baixar = async (arquivo: ArquivoReuniao) => {
    setBaixandoId(arquivo.id);
    try {
      await arquivoReuniaoService.baixar(
        token,
        reuniaoId,
        arquivo.id,
        arquivo.nome,
      );
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Não foi possível baixar o arquivo.'),
      });
    } finally {
      setBaixandoId(null);
    }
  };

  const apagar = async () => {
    if (!apagando) return;
    setEstaApagando(true);
    try {
      await arquivoReuniaoService.remover(token, reuniaoId, apagando.id);
      setApagando(null);
      setFeedback({ type: 'success', message: 'Arquivo apagado.' });
      await carregar();
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Não foi possível apagar o arquivo.'),
      });
    } finally {
      setEstaApagando(false);
    }
  };

  return (
    <Card>
      <SectionLabel
        label="Biblioteca"
        trailing={arquivos.length > 0 ? String(arquivos.length) : undefined}
      />
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        Os arquivos são só para baixar. O aplicativo não abre o conteúdo.
      </Text>
      <FeedbackBanner feedback={feedback} />
      {arquivos.length === 0 ? (
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Nenhum arquivo nesta reunião.
        </Text>
      ) : (
        arquivos.map((arquivo) => (
          <View key={arquivo.id} style={styles.row}>
            <View style={styles.nome}>
              <Text style={[styles.titulo, { color: colors.text }]}>
                {arquivo.nome}
              </Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>
                {formatarTamanho(arquivo.tamanhoBytes)}
                {arquivo.enviadoPor ? ` · ${arquivo.enviadoPor.name}` : ''}
              </Text>
            </View>
            <Button
              variant="secondary"
              icon="download-outline"
              label="Baixar"
              accessibilityLabel={`Baixar ${arquivo.nome}`}
              isLoading={baixandoId === arquivo.id}
              onPress={() => void baixar(arquivo)}
            />
            {podeEnviar ? (
              <Button
                variant="tertiaryDanger"
                icon="trash-outline"
                label="Apagar"
                accessibilityLabel={`Apagar ${arquivo.nome}`}
                onPress={() => setApagando(arquivo)}
              />
            ) : null}
          </View>
        ))
      )}
      {podeEnviar ? (
        <Button
          icon="cloud-upload-outline"
          label="Enviar arquivo"
          isLoading={enviando}
          loadingLabel="Enviando..."
          onPress={() => void enviar()}
        />
      ) : null}
      <ConfirmDialog
        visible={apagando !== null}
        title="Apagar arquivo"
        message={
          apagando
            ? `Apagar "${apagando.nome}" da biblioteca? Essa ação não pode ser desfeita.`
            : ''
        }
        variant="danger"
        confirmLabel="Apagar"
        isLoading={estaApagando}
        onConfirm={() => void apagar()}
        onCancel={() => setApagando(null)}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  hint: { ...Typography.bodySmall },
  row: { gap: Spacing.sm },
  nome: { gap: Spacing.xs },
  titulo: { ...Typography.body, fontFamily: FontFamily.semiBold },
  meta: { ...Typography.bodySmall },
});
