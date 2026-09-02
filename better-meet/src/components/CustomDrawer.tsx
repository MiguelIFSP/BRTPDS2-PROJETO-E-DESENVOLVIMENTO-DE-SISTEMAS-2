import React from 'react'; // Não precisamos mais do useState
import { View, Text, TouchableOpacity, StyleSheet, Switch, useColorScheme, Appearance } from 'react-native';
import { DrawerContentScrollView } from 'expo-router/drawer';
import { Colors } from '../constants/theme';
import { Icon } from 'expo-router';
import IconAndTitle from './IconAndTitle';
import { useRouter } from 'expo-router';  

export default function CustomDrawer(props: any) {
  const router = useRouter();
  // O hook sempre terá a verdade sobre o tema atual do app
  const currentTheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = Colors[currentTheme];
  
  // Variável para controlar o Switch
  const isDarkMode = currentTheme === 'dark';

  // Função que realmente muda o tema do aplicativo inteiro
  const toggleSwitch = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    Appearance.setColorScheme(newTheme);
  };

  return (
    <DrawerContentScrollView 
      {...props} 
      style={[styles.drawerContainer, { backgroundColor: themeColors.background }]}
    >
      {/* Topo do Menu: Logo */}
      <View style={styles.header}>
        <IconAndTitle />
      </View>

      {/* ... (Todo o bloco de Links de Navegação continua igual) ... */}
      <TouchableOpacity 
        style={styles.menuItem} 
        onPress={() => router.push('/status')}
      >
        <Text style={[styles.menuText, { color: themeColors.textSecondary }]}>Status do Sistema</Text>
      </TouchableOpacity>
      {/* Substitua apenas o bloco do toggle e do footer por este: */}
      <View style={[styles.footer, { borderTopColor: themeColors.textSecondary + '40' }]}>
        <View style={[styles.themeToggleContainer, { borderColor: themeColors.textSecondary + '40' }]}>
          <Text style={[styles.themeText, { color: themeColors.text }]}>
            {isDarkMode ? '🌙' : '☀️'} Modo Escuro
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
  drawerContainer: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 40,
    marginBottom: 20,
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  menuItems: {
    paddingHorizontal: 16,
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
  },
  activeItem: {
    // A cor de fundo vem dinamicamente pelo style array no JSX
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 40,
    paddingHorizontal: 24,
    paddingTop: 24,
    borderTopWidth: 1,
  },
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
  themeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  slogan: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
  }
});