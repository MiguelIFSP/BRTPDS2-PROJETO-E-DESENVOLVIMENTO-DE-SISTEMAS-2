import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from '../constants/theme';
import { useNavigation, useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import IconAndTitle from "./IconAndTitle";
  
export default function Header() {
    const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const themeColors = Colors[colorScheme];
    const navigation = useNavigation<any>();
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();

    const initials = user
      ? user.name
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((part: string) => part[0]?.toUpperCase() ?? '')
          .join('')
          .slice(0, 2)
      : 'A';

    const handleAvatarPress = () => {
      if (isAuthenticated) {
        router.push('/perfil');
        return;
      }

      router.push('/login');
    };

    return (
        <View style={[
            styles.headerContainer,
            { backgroundColor: themeColors.background },
            {borderBlockColor: themeColors.backgroundElement, borderBottomWidth: 1}
          ]}>
            <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
                <Ionicons name="menu" size={30} color={themeColors.text} />
            </TouchableOpacity>
            
            <IconAndTitle />
            
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={isAuthenticated ? 'Abrir perfil do usuário' : 'Abrir login do usuário'}
              onPress={handleAvatarPress}
              style={[
                styles.avatarContainer,
                { backgroundColor: themeColors.backgroundElement },
                { borderColor: themeColors.backgroundSelected, borderWidth: 1 },
              ]}
            >
                <Text style={[styles.avatarText, {color: themeColors.text} ]}>{initials}</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row', // Alinha os itens em linha
    justifyContent: 'space-between', // Espaça uniformemente (esq, centro, dir)
    alignItems: 'center', // Alinha verticalmente no centro
    paddingHorizontal: 16, // Espaçamento nas laterais
    paddingVertical: 12, // Espaçamento em cima/baixo
    height: 70,
    borderBottomWidth: 1,
  },
  menuButton: {
    padding: 8,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20, // Torna circular (metade da largura/altura)
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});