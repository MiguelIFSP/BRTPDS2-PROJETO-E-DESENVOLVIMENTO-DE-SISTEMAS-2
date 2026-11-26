import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import Card from '@/components/ui/Card';
import FeedbackBanner from '@/components/ui/FeedbackBanner';
import SectionLabel from '@/components/ui/SectionLabel';
import { FontFamily, Spacing, Typography } from '@/constants/theme';
import { useFeedback } from '@/hooks/useFeedback';
import { useTheme } from '@/hooks/useTheme';
import {
  rotuloDeVotos,
  votacaoService,
  type VotacaoDetalhe,
} from '@/services/votacaoService';
import { getErrorMessage } from '@/utils/apiClient';

type RelatorioVotacoesProps = {
  token: string;
  reuniaoId: number;
};

const rotuloDoTipo = (votacao: VotacaoDetalhe) =>
  votacao.tipo === 'SECRETA' ? 'Secreta' : 'Aberta';

// Placar oficial, na aba de votações, depois que o horário da reunião passa.
// A API omite quem votou na secreta e, na aberta, só manda os nomes para quem gere.
export default function RelatorioVotacoes({
  token,
  reuniaoId,
}: RelatorioVotacoesProps) {
  const { colors } = useTheme();
  const [votacoes, setVotacoes] = useState<VotacaoDetalhe[]>([]);
  const [pronto, setPronto] = useState(false);
  const [feedback, setFeedback] = useFeedback();

  const carregar = useCallback(async () => {
    const relatorio = await votacaoService.relatorio(token, reuniaoId);
    setVotacoes(relatorio.votacoes);
  }, [token, reuniaoId]);

  useFocusEffect(
    useCallback(() => {
      let cancelado = false;
      setPronto(false);
      void carregar()
        .then(() => {
          if (!cancelado) setPronto(true);
        })
        .catch((error: unknown) => {
          if (cancelado) return;
          setFeedback({
            type: 'error',
            message: getErrorMessage(
              error,
              'Não foi possível carregar os resultados.',
            ),
          });
        });
      return () => {
        cancelado = true;
      };
    }, [carregar, setFeedback]),
  );

  return (
    <Card>
      <SectionLabel label="Resultados" />
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        Placar oficial da reunião. Na votação secreta ninguém vê quem votou.
      </Text>
      <FeedbackBanner feedback={feedback} />
      {!pronto ? null : votacoes.length === 0 ? (
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Nenhuma votação nesta reunião.
        </Text>
      ) : (
        votacoes.map((votacao) => (
          <View key={votacao.id} style={styles.bloco}>
            <Text style={[styles.titulo, { color: colors.text }]}>
              {votacao.titulo}
            </Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              {rotuloDoTipo(votacao)} · {rotuloDeVotos(votacao.totalVotos)}
            </Text>
            {votacao.opcoes.map((opcao) => (
              <View key={opcao.id} style={styles.opcao}>
                <Text style={[styles.texto, { color: colors.text }]}>
                  {opcao.texto} · {opcao.votos ?? 0}
                </Text>
                {opcao.votantes?.map((votante) => (
                  <Text
                    key={votante.userId}
                    style={[styles.nome, { color: colors.textSecondary }]}
                  >
                    {votante.nome}
                  </Text>
                ))}
              </View>
            ))}
            <Text style={[styles.texto, { color: colors.text }]}>
              Nulos · {votacao.nulos ?? 0}
            </Text>
          </View>
        ))
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  hint: { ...Typography.bodySmall },
  bloco: { gap: Spacing.xs },
  titulo: { ...Typography.body, fontFamily: FontFamily.semiBold },
  meta: { ...Typography.bodySmall },
  opcao: { gap: Spacing.xs },
  texto: { ...Typography.body },
  nome: { ...Typography.bodySmall, marginLeft: Spacing.md },
});
