import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { Colors } from '../constants/theme';
import { useAuthStore } from '../store/authStore';

export default function Header() {
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = Colors[colorScheme];
  const { user, isAuthenticated, logout } = useAuthStore();

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
      <Text style={[styles.title, { color: themeColors.text }]}>Painel de Gestão — Better Meet</Text>

      {isAuthenticated && (
        <View style={styles.userArea}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: themeColors.backgroundElement, borderColor: themeColors.backgroundSelected },
            ]}
          >
            <Text style={[styles.avatarText, { color: themeColors.text }]}>{initials}</Text>
          </View>
          <TouchableOpacity accessibilityRole="button" onPress={logout}>
            <Text style={[styles.logoutText, { color: themeColors.backgroundSelected }]}>Sair</Text>
          </TouchableOpacity>
        </View>
      )}
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
    gap: 12,
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
});
