import React from "react";
import { View, Image, Text, TouchableOpacity, StyleSheet, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Typography, Colors } from '../constants/theme';
  
export default function Header() {
    const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const themeColors = Colors[colorScheme];

    return (
        <View style={[styles.headerContainer, { backgroundColor: themeColors.backgroundElement }]}>
            <TouchableOpacity style={styles.menuButton}>
                <Ionicons name="menu" size={30} color={themeColors.text} />
            </TouchableOpacity>
            <View style={styles.iconAndTitle}>
                <Image source={require('../../assets/images/icon.jpeg')} style={styles.logoImage} resizeMode="contain" />
                <Text style={[styles.logoText, {color: themeColors.text} ]}>better</Text>
                <Text style={[styles.logoText, {color: themeColors.textSecondary} ]}>meet</Text>
            </View>
            
            <View style={[styles.avatarContainer, { backgroundColor: themeColors.textSecondary }]}>
                <Text style={styles.avatarText}>AL</Text>
            </View>
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
    height: 70, // Altura fixa para o header
  },
  iconAndTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  menuButton: {
    padding: 8,
  },
  logoImage: {
    width: 45,
    height: 45,
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
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