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
} from 'react-native';
import { DrawerContentScrollView } from 'expo-router/drawer';
import { Colors } from '../constants/theme';
import IconAndTitle from './IconAndTitle';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useAppColorScheme } from '../hooks/use-app-color-scheme';
import { API_URL } from '../config/api';

export default function CustomDrawer(props: any) {
  const router = useRouter();
  const currentTheme = useAppColorScheme();
  const themeColors = Colors[currentTheme];
  const { user } = useAuthStore();
  const setTheme = useThemeStore((s) => s.setTheme);

  const isDarkMode = currentTheme === 'dark';

  // =====================================================================
  // toggleSwitch — UC04 (Tema Preferido)
  // 1. Aplica localmente via store (funciona em Android, iOS e web)
  // 2. Sincroniza com o backend (se o usuário estiver logado)
  // 3. Se offline, falha silenciosa — preferência local permanece
  // =====================================================================
  const toggleSwitch = async () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setTheme(newTheme);

    const token = useAuthStore.getState().token;
    if (user && token) {
      try {
        await fetch(`${API_URL}/usuarios/${user.id}/tema`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ theme: newTheme }),
        });
      } catch {
        // silencioso — o usuário ainda tem a preferência aplicada localmente
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