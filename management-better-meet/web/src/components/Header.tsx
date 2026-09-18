import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, Modal, Pressable } from 'react-native';
import { Colors } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

export default function Header() {
  const { theme, toggleTheme } = useThemeStore();
  const themeColors = Colors[theme];
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isProfileVisible, setIsProfileVisible] = useState(false);

  const isDarkMode = theme === 'dark';

  const initials = user
    ? user.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part: string) => part[0]?.toUpperCase() ?? '')
        .join('')
        .slice(0, 2)
    : 'A';

  return (
    <View
      style={[
        styles.headerContainer,
        { backgroundColor: themeColors.background, borderBottomColor: themeColors.backgroundElement },
      ]}
    >
      <Text style={[styles.title, { color: themeColors.text }]}>Painel de Gestão de subsistemas — Better Meet</Text>

      <View style={styles.userArea}>
        <View style={styles.themeToggle}>
          <Text style={{ color: themeColors.text }}>{isDarkMode ? '🌙' : '☀️'}</Text>
          <Switch
            trackColor={{ false: '#767577', true: Colors.light.backgroundSelected }}
            thumbColor={isDarkMode ? '#ffffff' : '#f4f3f4'}
            onValueChange={toggleTheme}
            value={isDarkMode}
          />
        </View>

        {isAuthenticated && (
          <>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Ver perfil"
              onPress={() => setIsProfileVisible(true)}
            >
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: themeColors.backgroundElement, borderColor: themeColors.backgroundSelected },
                ]}
              >
                <Text style={[styles.avatarText, { color: themeColors.text }]}>{initials}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" onPress={logout}>
              <Text style={[styles.logoutText, { color: themeColors.backgroundSelected }]}>Sair</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <Modal visible={isProfileVisible} transparent animationType="fade" onRequestClose={() => setIsProfileVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setIsProfileVisible(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: themeColors.background }]} onPress={() => {}}>
            <View
              style={[
                styles.modalAvatar,
                { backgroundColor: themeColors.backgroundElement, borderColor: themeColors.backgroundSelected },
              ]}
            >
              <Text style={[styles.avatarText, { color: themeColors.text, fontSize: 20 }]}>{initials}</Text>
            </View>

            <Text style={[styles.modalName, { color: themeColors.text }]}>{user?.name ?? 'Administrador'}</Text>
            <Text style={{ color: themeColors.textSecondary }}>{user?.email}</Text>

            <View style={[styles.modalNotice, { borderColor: themeColors.textSecondary + '40' }]}>
              <Text style={{ color: themeColors.text }}>
                Para alterar dados da conta (nome, e-mail, senha), use o aplicativo Better Meet no seu celular — esse
                painel não tem edição de perfil.
              </Text>
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setIsProfileVisible(false)}
              style={[styles.modalCloseButton, { backgroundColor: themeColors.backgroundElement }]}
            >
              <Text style={[styles.modalCloseText, {color: themeColors.text}]}>Fechar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 70,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  userArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  logoutText: {
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modalCard: {
    position: 'absolute',
    top: 78,
    right: 16,
    width: 320,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalName: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalNotice: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    marginBottom: 20,
  },
  modalCloseButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  modalCloseText: {
    fontWeight: '600',
  },
});
