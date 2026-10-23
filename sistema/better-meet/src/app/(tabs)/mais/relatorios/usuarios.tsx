import { useCallback, useState } from 'react';
import { Redirect, useFocusEffect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import InfoRow from '@/components/InfoRow';
import ReportListRow from '@/components/relatorio/ReportListRow';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import FeedbackBanner from '@/components/ui/FeedbackBanner';
import Screen from '@/components/ui/Screen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { Spacing, Typography } from '@/constants/theme';
import { useFeedback } from '@/hooks/useFeedback';
import { useTheme } from '@/hooks/useTheme';
import { papelComissaoLabel } from '@/services/comissaoService';
import { papelLabel } from '@/services/organizacaoService';
import { usuarioService, type UsuarioReport } from '@/services/usuarioService';
import { useAuthStore, type Role } from '@/store/authStore';
import { getErrorMessage } from '@/utils/apiClient';
import { countLabel, formatDate } from '@/utils/format';

type UsuarioItem = UsuarioReport['usuarios'][number];
type RoleChange = { usuario: UsuarioItem; role: Role };

const PERFIL_LABEL = {
  ADMIN: 'Administrador',
  USER: 'Usuário comum',
} satisfies Record<Role, string>;

export default function RelatorioUsuariosScreen() {
  const { colors } = useTheme();
  const { token, currentUserId, isAdmin } = useAuthStore(
    useShallow((state) => ({
      token: state.token,
      currentUserId: state.user?.id,
      isAdmin: state.user?.role === 'ADMIN',
    })),
  );
  const [usuarios, setUsuarios] = useState<UsuarioItem[] | null>(null);
  const [feedback, setFeedback] = useFeedback();
  // o selecionado continua guardado ao fechar, para o painel não esvaziar
  // durante a animação de saída.
  const [selected, setSelected] = useState<UsuarioItem | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [pendingChange, setPendingChange] = useState<RoleChange | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(
    async (isCancelled: () => boolean = () => false) => {
      if (!token || !isAdmin) return;
      try {
        const report = await usuarioService.getReport(token);
        if (isCancelled()) return;
        setUsuarios(report.usuarios);
      } catch (error) {
        if (isCancelled()) return;
        setFeedback({
          type: 'error',
          message: getErrorMessage(
            error,
            'Não foi possível carregar os usuários.',
          ),
        });
      }
    },
    [token, isAdmin, setFeedback],
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void load(() => cancelled);
      return () => {
        cancelled = true;
      };
    }, [load]),
  );

  // lista com dados de outras pessoas: só administrador (a API também recusa).
  if (!isAdmin) return <Redirect href="/mais/relatorios" />;

  const openDetails = (usuario: UsuarioItem) => {
    setSelected(usuario);
    setIsSheetOpen(true);
  };

  // fecha o painel antes de confirmar: dois modais abertos ao mesmo tempo
  // se sobrepõem de forma diferente em cada plataforma.
  const askRoleChange = (usuario: UsuarioItem) => {
    setIsSheetOpen(false);
    setPendingChange({
      usuario,
      role: usuario.role === 'ADMIN' ? 'USER' : 'ADMIN',
    });
  };

  const confirmRoleChange = async () => {
    if (!token || !pendingChange) return;
    const { usuario, role } = pendingChange;
    setIsSaving(true);
    try {
      await usuarioService.updateRole(token, usuario.id, role);
      setUsuarios(
        (current) =>
          current?.map((item) =>
            item.id === usuario.id ? { ...item, role } : item,
          ) ?? null,
      );
      setFeedback({
        type: 'success',
        message: `${usuario.name} agora é ${PERFIL_LABEL[role].toLowerCase()}.`,
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(
          error,
          'Não foi possível alterar o perfil do usuário.',
        ),
      });
    } finally {
      setIsSaving(false);
      setPendingChange(null);
    }
  };

  return (
    <Screen onRefresh={() => load()}>
      <ScreenHeader
        icon="person-outline"
        title="Usuários"
        subtitle={
          usuarios
            ? countLabel(
                usuarios.length,
                'usuário cadastrado',
                'usuários cadastrados',
              )
            : undefined
        }
      />

      <FeedbackBanner feedback={feedback} />

      {usuarios?.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>
          Nenhum usuário encontrado.
        </Text>
      ) : (
        <View style={styles.list}>
          {usuarios?.map((usuario) => (
            <ReportListRow
              key={usuario.id}
              title={usuario.name}
              subtitle={usuario.email}
              badge={
                usuario.role === 'ADMIN'
                  ? { label: PERFIL_LABEL.ADMIN, tone: 'primary' }
                  : undefined
              }
              onPress={() => openDetails(usuario)}
            />
          ))}
        </View>
      )}

      <BottomSheet
        visible={isSheetOpen}
        title={selected?.name ?? ''}
        onClose={() => setIsSheetOpen(false)}
      >
        {selected ? (
          <View style={styles.details}>
            <InfoRow label="E-mail" value={selected.email} />
            <InfoRow label="Perfil" value={PERFIL_LABEL[selected.role]} />
            <InfoRow
              label="Cadastrado em"
              value={formatDate(selected.createdAt)}
            />
            <InfoRow
              label="Organizações"
              value={
                selected.organizacoes.length === 0
                  ? 'Nenhuma'
                  : selected.organizacoes
                      .map((org) => `${org.nome} (${papelLabel(org.papel)})`)
                      .join('\n')
              }
            />
            <InfoRow
              label="Comissões"
              value={
                selected.comissoes.length === 0
                  ? 'Nenhuma'
                  : selected.comissoes
                      .map(
                        (comissao) =>
                          `${comissao.nome} (${papelComissaoLabel(comissao.papel)})`,
                      )
                      .join('\n')
              }
            />
            {/* o próprio perfil não muda por aqui (a API também recusa). */}
            {selected.id !== currentUserId ? (
              <Button
                variant="secondary"
                icon={
                  selected.role === 'ADMIN'
                    ? 'person-outline'
                    : 'shield-checkmark-outline'
                }
                label={
                  selected.role === 'ADMIN'
                    ? 'Tornar usuário comum'
                    : 'Tornar administrador'
                }
                onPress={() => askRoleChange(selected)}
              />
            ) : null}
          </View>
        ) : null}
      </BottomSheet>

      <ConfirmDialog
        visible={pendingChange !== null}
        variant="warning"
        title={
          pendingChange?.role === 'ADMIN'
            ? 'Tornar administrador'
            : 'Tornar usuário comum'
        }
        message={
          pendingChange?.role === 'ADMIN'
            ? `${pendingChange.usuario.name} vai poder aprovar organizações, ver os relatórios de toda a plataforma e alterar o perfil de outras pessoas.`
            : `${pendingChange?.usuario.name ?? ''} perde o acesso de administrador e passa a ver só as organizações e comissões das quais participa.`
        }
        confirmLabel={
          pendingChange?.role === 'ADMIN' ? 'Tornar administrador' : 'Rebaixar'
        }
        isLoading={isSaving}
        onCancel={() => setPendingChange(null)}
        onConfirm={() => void confirmRoleChange()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.sm },
  details: { gap: Spacing.md },
  empty: {
    ...Typography.body,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
});
