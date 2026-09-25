// =====================================================================
// CustomDrawer.tsx
// Menu lateral. O Switch de tema chama o backend para salvar a
// preferência do usuário (UC04 — Tema Preferido).
// =====================================================================

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { DrawerContentScrollView } from 'expo-router/drawer';
import { Colors } from '../constants/theme';
import IconAndTitle from './IconAndTitle';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useAppColorScheme } from '../hooks/use-app-color-scheme';
import { API_URL } from '../config/api';
import { reportMobileError } from '../services/monitoringService';

export default function CustomDrawer(props: any) {
  const router = useRouter();
  const currentTheme = useAppColorScheme();
  const themeColors = Colors[currentTheme];
  const { user } = useAuthStore();
  const setTheme = useThemeStore((s) => s.setTheme);

  const isDarkMode = currentTheme === 'dark';

  // =====================================================================
  // toggleSwitch — UC04 (Tema Preferido)
  // 1. Aplica localmente via store (feedback imediato; funciona em
  //    Android, iOS e web — o store cuida do Appearance nativo).
  // 2. Se autenticado, sincroniza com o backend.
  // 3. Se offline, só reporta — tema local continua aplicado.
  // 4. Se a API recusar (401, 500...), avisa o usuário: antes o erro era
  //    engolido e o tema parecia salvo sem ter mudado no banco.
  // Nada aqui é bloqueante: o tema local funciona mesmo sem sincronizar.
  // =====================================================================
  const toggleSwitch = async () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setTheme(newTheme);

    // Sincroniza com o backend (se logado)
    if (!user || !useAuthStore.getState().token) return;

    let response: Response;
    try {
      response = await fetch(`${API_URL}/usuarios/${user.id}/tema`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${useAuthStore.getState().token}`,
        },
        body: JSON.stringify({ theme: newTheme }),
      });
    } catch (networkError) {
      reportMobileError(
        networkError instanceof Error ? networkError.message : 'Falha de rede ao salvar o tema.',
        networkError instanceof Error ? networkError.stack : undefined,
        { context: 'CustomDrawer.toggleSwitch', isBlocking: false }
      );
      return;
    }

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      const message = data.error ?? 'Não foi possível salvar sua preferência de tema.';

      // 400/401 são dado inválido ou sessão expirada, não falha do sistema.
      if (response.status !== 400 && response.status !== 401) {
        reportMobileError(message, undefined, { context: 'CustomDrawer.toggleSwitch', isBlocking: false });
      }

      // Alert.alert não faz nada no react-native-web.
      const aviso = `O tema foi aplicado neste aparelho, mas não foi salvo na sua conta: ${message}`;
      if (Platform.OS === 'web') {
        window.alert(aviso);
      } else {
        Alert.alert('Tema não sincronizado', aviso);
      }
    }
  };

  return (
    <DrawerContentScrollView
      {...props}
      style={[styles.drawerContainer, { backgroundColor: themeColors.background }]}
    >
      <View style={styles.header}>
        <IconAndTitle />
      </View>

      <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/status')}>
        <Text style={[styles.menuText, { color: themeColors.textSecondary }]}>Status do Sistema</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => router.push('/organizacao' as any)}
      >
        <Text style={[styles.menuText, { color: themeColors.textSecondary }]}>
          {user?.role === 'ADMIN' ? 'Solicitar organização' : 'Minha organização'}
        </Text>
      </TouchableOpacity>

      {user?.role === 'ADMIN' ? (
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/organizacoes' as any)}
        >
          <Text style={[styles.menuText, { color: themeColors.textSecondary }]}>
            Organizações
          </Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => router.push('/relatorios' as any)}
      >
        <Text style={[styles.menuText, { color: themeColors.textSecondary }]}>
          Relatórios
        </Text>
      </TouchableOpacity>

      <View style={[styles.footer, { borderTopColor: themeColors.textSecondary + '40' }]}>
        <View
          style={[
            styles.themeToggleContainer,
            { borderColor: themeColors.textSecondary + '40' },
          ]}
        >
          <Text style={[styles.themeText, { color: themeColors.text }]}>
            {isDarkMode ? '🌙 Modo Escuro' : '☀️ Modo Claro'}
          </Text>
          <Switch
            trackColor={{ false: '#767577', true: Colors.light.backgroundSelected }}
            thumbColor={isDarkMode ? '#ffffff' : '#f4f3f4'}
            onValueChange={toggleSwitch}
            value={isDarkMode}
          />
        </View>

        <Text style={[styles.slogan, { color: themeColors.backgroundSelected }]}>
          Better Meetings, Better Results.
        </Text>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  drawerContainer: { flex: 1 },
  header: { padding: 24, paddingTop: 40, marginBottom: 20, alignItems: 'center' },
  menuItem: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, marginBottom: 8 },
  menuText: { fontSize: 16, fontWeight: '600' },
  footer: { marginTop: 40, paddingHorizontal: 24, paddingTop: 24, borderTopWidth: 1 },
  themeToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 24,
    marginBottom: 40,
  },
  themeText: { fontSize: 16, fontWeight: '600' },
  slogan: { fontSize: 12, textAlign: 'center', marginBottom: 24 },
});