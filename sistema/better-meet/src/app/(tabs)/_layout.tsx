import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { FontFamily, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

// Barra inferior nativa do app logado: Liquid Glass no iOS, Material 3 no
// Android. Ícones: SF Symbols (iOS) e Material Symbols (Android); na web a
// barra mostra só os rótulos.
export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <NativeTabs
      backgroundColor={colors.background}
      tintColor={colors.primary}
      iconColor={{ default: colors.textSecondary, selected: colors.primary }}
      indicatorColor={withAlpha(colors.primary, 0.18)}
      // no Android, com mais de 3 abas o padrão ("auto") só mostra o nome da
      // aba selecionada; aqui o nome fica sempre visível em todas.
      labelVisibilityMode="labeled"
      labelStyle={{
        default: {
          color: colors.textSecondary,
          fontFamily: FontFamily.semiBold,
        },
        selected: { color: colors.primary, fontFamily: FontFamily.semiBold },
      }}
    >
      <NativeTabs.Trigger name="(reunioes)">
        <NativeTabs.Trigger.Label>Reuniões</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'calendar', selected: 'calendar' }}
          md="calendar_month"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="organizacao">
        <NativeTabs.Trigger.Label>Organizações</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'building.2', selected: 'building.2.fill' }}
          md="apartment"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="comissao">
        <NativeTabs.Trigger.Label>Comissões</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.3', selected: 'person.3.fill' }}
          md="groups"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="mais">
        <NativeTabs.Trigger.Label>Mais</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'ellipsis.circle', selected: 'ellipsis.circle.fill' }}
          md="more_horiz"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
