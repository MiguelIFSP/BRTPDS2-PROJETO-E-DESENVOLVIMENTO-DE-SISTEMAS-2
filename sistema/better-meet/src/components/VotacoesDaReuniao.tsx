import { useCallback, useState } from 'react';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ValidationError } from 'yup';

import SummaryCard from '@/components/ui/SummaryCard';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import FeedbackBanner from '@/components/ui/FeedbackBanner';
import SectionLabel from '@/components/ui/SectionLabel';
import TextField from '@/components/ui/TextField';
import {
  FontFamily,
  PressedOpacity,
  Spacing,
  TouchTarget,
  Typography,
} from '@/constants/theme';
import { useFeedback } from '@/hooks/useFeedback';
import { useTheme } from '@/hooks/useTheme';
import { monitoringService } from '@/services/monitoringService';
import {
  rotuloDeVotos,
  votacaoService,
  type VotacaoResumo,
} from '@/services/votacaoService';
import { MAX_OPCOES_VOTACAO, votacaoSchema } from '@/schemas/votacaoSchema';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/utils/apiClient';

type VotacoesDaReuniaoProps = {
  reuniaoId: number;
  // Criador da reunião ou admin da plataforma.
  canManage: boolean;
};

type FormErrors = {
  titulo?: string;
  opcoes?: string;
};

const OPCOES_INICIAIS = ['', ''];

const errosDoFormulario = (error: ValidationError): FormErrors => {
  const errors: FormErrors = {};
  for (const item of error.inner.length > 0 ? error.inner : [error]) {
    if (item.path === 'titulo' && !errors.titulo) errors.titulo = item.message;
    if (item.path?.startsWith('opcoes') && !errors.opcoes) {
      errors.opcoes = item.message;
    }
  }
  return errors;
};

const resumoDaVotacao = (votacao: VotacaoResumo) => {
  const estado = votacao.encerrada ? 'Encerrada' : 'Aberta';
  const voto = votacao.votei ? ' · Você votou' : '';
  return `${estado} · ${rotuloDeVotos(votacao.totalVotos)}${voto}`;
};

// Lista de votações da reunião. Criar abre o mesmo tipo de modal dos convites.
// O resultado e o voto ficam na página da votação.
export default function VotacoesDaReuniao({
  reuniaoId,
  canManage,
}: VotacoesDaReuniaoProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const token = useAuthStore((state) => state.token);
  const [votacoes, setVotacoes] = useState<VotacaoResumo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useFeedback();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [opcoes, setOpcoes] = useState(OPCOES_INICIAIS);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      setVotacoes(await votacaoService.listByReuniao(token, reuniaoId));
    } catch (error) {
      monitoringService.reportRequestFailure(
        error,
        'VotacoesDaReuniao.load',
        false,
      );
      setFeedback({
        type: 'error',
        message: getErrorMessage(
          error,
          'Não foi possível carregar as votações.',
        ),
      });
    } finally {
      setIsLoading(false);
    }
  }, [reuniaoId, setFeedback, token]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const resetForm = () => {
    setTitulo('');
    setOpcoes(OPCOES_INICIAIS);
    setFormErrors({});
  };

  const clearOpcoesError = () => {
    setFormErrors((current) =>
      current.opcoes ? { ...current, opcoes: undefined } : current,
    );
  };

  const handleCreate = async () => {
    if (!token) return;
    try {
      votacaoSchema.validateSync({ titulo, opcoes }, { abortEarly: false });
    } catch (error) {
      if (error instanceof ValidationError)
        setFormErrors(errosDoFormulario(error));
      return;
    }
    setFormErrors({});
    setIsSaving(true);
    try {
      await votacaoService.create(token, reuniaoId, {
        titulo: titulo.trim(),
        opcoes: opcoes.map((opcao) => opcao.trim()),
      });
      setIsCreateOpen(false);
      resetForm();
      await load();
      setFeedback({ type: 'success', message: 'Votação criada.' });
    } catch (error) {
      monitoringService.reportRequestFailure(
        error,
        'VotacoesDaReuniao.handleCreate',
        false,
      );
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Não foi possível criar a votação.'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.block}>
      <FeedbackBanner feedback={feedback} />
      <Card>
        <View style={styles.header}>
          <View style={styles.headerLabel}>
            <SectionLabel label="Votações" />
          </View>
          {canManage ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Nova votação"
              onPress={() => {
                resetForm();
                setIsCreateOpen(true);
              }}
              style={({ pressed }) => [
                styles.addButton,
                { backgroundColor: colors.primary },
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="add" size={22} color={colors.onPrimary} />
            </Pressable>
          ) : null}
        </View>

        {isLoading ? (
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Carregando votações...
          </Text>
        ) : votacoes.length === 0 ? (
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Nenhuma votação nesta reunião.
          </Text>
        ) : (
          votacoes.map((votacao) => (
            <SummaryCard
              key={votacao.id}
              icon="bar-chart-outline"
              title={votacao.titulo}
              meta={resumoDaVotacao(votacao)}
              memberNames={[]}
              onPress={() =>
                router.push({
                  pathname: '/votacao/[id]',
                  params: { id: String(votacao.id) },
                })
              }
            />
          ))
        )}
      </Card>

      <BottomSheet
        visible={isCreateOpen}
        title="Nova votação"
        onClose={() => {
          setIsCreateOpen(false);
          resetForm();
        }}
      >
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Os participantes votam e podem trocar o voto até a votação ser
          encerrada.
        </Text>
        <TextField
          label="Título"
          value={titulo}
          error={formErrors.titulo}
          onChangeText={(value) => {
            setTitulo(value);
            setFormErrors((current) =>
              current.titulo ? { ...current, titulo: undefined } : current,
            );
          }}
          maxLength={120}
        />
        {opcoes.map((opcao, index) => (
          <View key={index} style={styles.optionRow}>
            <TextField
              label={`Opção ${index + 1}`}
              value={opcao}
              containerStyle={styles.optionField}
              onChangeText={(value) => {
                setOpcoes((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index ? value : item,
                  ),
                );
                clearOpcoesError();
              }}
              maxLength={80}
            />
            {opcoes.length > 2 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remover opção ${index + 1}`}
                onPress={() => {
                  setOpcoes((current) =>
                    current.filter((_, itemIndex) => itemIndex !== index),
                  );
                  clearOpcoesError();
                }}
                style={({ pressed }) => [
                  styles.removeButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name="close-outline"
                  size={22}
                  color={colors.danger}
                />
              </Pressable>
            ) : null}
          </View>
        ))}
        {formErrors.opcoes ? (
          <Text style={[styles.error, { color: colors.danger }]}>
            {formErrors.opcoes}
          </Text>
        ) : null}
        {opcoes.length < MAX_OPCOES_VOTACAO ? (
          <Button
            variant="secondary"
            icon="add-outline"
            label="Adicionar opção"
            onPress={() => {
              setOpcoes((current) => [...current, '']);
              clearOpcoesError();
            }}
          />
        ) : null}
        <Button
          label="Criar votação"
          isLoading={isSaving}
          loadingLabel="Criando..."
          onPress={() => void handleCreate()}
        />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: Spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerLabel: { flex: 1 },
  addButton: {
    width: TouchTarget.min,
    height: TouchTarget.min,
    borderRadius: TouchTarget.min / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: PressedOpacity },
  hint: { ...Typography.bodySmall },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  optionField: { flex: 1 },
  removeButton: {
    width: TouchTarget.min,
    height: TouchTarget.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    ...Typography.bodySmall,
    fontFamily: FontFamily.medium,
  },
});
