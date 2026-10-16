import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import ComissaoReportView from '@/components/relatorio/ComissaoReportView';
import OrganizacaoReportView from '@/components/relatorio/OrganizacaoReportView';
import UsuarioReportView from '@/components/relatorio/UsuarioReportView';
import Chip from '@/components/ui/Chip';
import FeedbackBanner, { type Feedback } from '@/components/ui/FeedbackBanner';
import Screen from '@/components/ui/Screen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { Spacing } from '@/constants/theme';
import {
  comissaoService,
  type ComissaoReport,
} from '@/services/comissaoService';
import {
  organizacaoService,
  type Organizacao,
  type OrganizacaoReport,
} from '@/services/organizacaoService';
import { usuarioService, type UsuarioReport } from '@/services/usuarioService';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/utils/apiClient';

type Tab = 'organizacoes' | 'comissoes' | 'usuarios';

// titulo e subtitulo do cabecalho por aba (admin vê tudo; usuário comum, só o que participa).
const TAB_COPY = {
  organizacoes: {
    label: 'Organizações',
    title: 'Relatório de Organizações',
    admin: 'Visão geral de todas as organizações da plataforma.',
    mine: 'Visão geral das organizações das quais você participa.',
  },
  comissoes: {
    label: 'Comissões',
    title: 'Relatório de Comissões',
    admin: 'Visão geral de todas as comissões da plataforma.',
    mine: 'Visão geral das comissões das quais você participa.',
  },
  usuarios: {
    label: 'Usuários',
    title: 'Relatório de Usuários',
    admin: 'Visão geral de todos os usuários da plataforma.',
    mine: '',
  },
} satisfies Record<
  Tab,
  { label: string; title: string; admin: string; mine: string }
>;

const errorFeedback = (error: unknown): Feedback => ({
  type: 'error',
  message: getErrorMessage(error, 'Não foi possível carregar o relatório.'),
});

export default function RelatoriosScreen() {
  const { token, isAdmin } = useAuthStore(
    useShallow((state) => ({
      token: state.token,
      isAdmin: state.user?.role === 'ADMIN',
    })),
  );

  const [tab, setTab] = useState<Tab>('organizacoes');
  const [organizacaoReport, setOrganizacaoReport] =
    useState<OrganizacaoReport | null>(null);
  const [organizacoes, setOrganizacoes] = useState<Organizacao[]>([]);
  const [comissaoReport, setComissaoReport] = useState<ComissaoReport | null>(
    null,
  );
  const [usuarioReport, setUsuarioReport] = useState<UsuarioReport | null>(
    null,
  );
  // um erro por aba: se um relatório falhar, os outros ainda aparecem.
  const [errors, setErrors] = useState<Partial<Record<Tab, Feedback>>>({});

  // useFocusEffect (não useEffect) porque a navegação é por Drawer: a tela fica
  // montada em segundo plano — sem isso, o relatório ficaria desatualizado ao
  // voltar aqui depois de aceitar/recusar uma organização em outra tela.
  // Cada relatório carrega separado: se um falhar, os outros ainda aparecem.
  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      let cancelled = false;
      const setTabError = (key: Tab, feedback: Feedback | undefined) => {
        if (!cancelled)
          setErrors((current) => ({ ...current, [key]: feedback }));
      };

      const loadOrganizacoes = async () => {
        try {
          const [reportData, organizacoesData] = await Promise.all([
            isAdmin
              ? organizacaoService.getReport(token)
              : organizacaoService.getReportMine(token),
            isAdmin
              ? organizacaoService.listAll(token)
              : organizacaoService.listMine(token),
          ]);
          if (cancelled) return;
          setOrganizacaoReport(reportData);
          setOrganizacoes(organizacoesData);
          setTabError('organizacoes', undefined);
        } catch (error) {
          setTabError('organizacoes', errorFeedback(error));
        }
      };
      const loadComissoes = async () => {
        try {
          const data = isAdmin
            ? await comissaoService.getReport(token)
            : await comissaoService.getReportMine(token);
          if (cancelled) return;
          setComissaoReport(data);
          setTabError('comissoes', undefined);
        } catch (error) {
          setTabError('comissoes', errorFeedback(error));
        }
      };
      // relatório de usuários expõe dados de outras pessoas — só admin.
      const loadUsuarios = async () => {
        if (!isAdmin) return;
        try {
          const data = await usuarioService.getReport(token);
          if (cancelled) return;
          setUsuarioReport(data);
          setTabError('usuarios', undefined);
        } catch (error) {
          setTabError('usuarios', errorFeedback(error));
        }
      };
      void loadOrganizacoes();
      void loadComissoes();
      void loadUsuarios();
      return () => {
        cancelled = true;
      };
    }, [token, isAdmin]),
  );

  const tabs: Tab[] = isAdmin
    ? ['organizacoes', 'comissoes', 'usuarios']
    : ['organizacoes', 'comissoes'];
  // se a role mudar (ex.: logout de admin), nunca fica presa numa aba escondida.
  const activeTab = tabs.includes(tab) ? tab : 'organizacoes';
  const copy = TAB_COPY[activeTab];

  return (
    <Screen>
      <ScreenHeader
        icon="bar-chart-outline"
        title={copy.title}
        subtitle={isAdmin ? copy.admin : copy.mine}
      />

      <View style={styles.tabs}>
        {tabs.map((key) => (
          <Chip
            key={key}
            label={TAB_COPY[key].label}
            selected={activeTab === key}
            onPress={() => setTab(key)}
          />
        ))}
      </View>

      <FeedbackBanner feedback={errors[activeTab] ?? null} />

      {activeTab === 'usuarios' ? (
        <UsuarioReportView report={usuarioReport} />
      ) : activeTab === 'comissoes' ? (
        <ComissaoReportView report={comissaoReport} />
      ) : (
        <OrganizacaoReportView
          report={organizacaoReport}
          organizacoes={organizacoes}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
});
