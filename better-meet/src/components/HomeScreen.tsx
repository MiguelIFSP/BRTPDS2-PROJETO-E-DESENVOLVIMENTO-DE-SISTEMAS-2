import { View, Text, StatusBar, StyleSheet, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "./Header";
import { Colors } from "@/constants/theme";
import { useAuthStore } from "../store/authStore";

const TEXT_DARK = '#1A1A1A'; // Texto preto suave
const TEXT_MUTED = '#666666'; // Texto cinza suave

export default function HomeScreen() {
  const systemTheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = Colors[systemTheme];
  const { user } = useAuthStore();
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background } ]}>
        <StatusBar barStyle="dark-content" backgroundColor={themeColors.background} />
        <Header />

        <View style={styles.contentContainer}>
            <Text style={styles.greetingText}>
                Olá, {user?.name ?? 'usuário'} 👋
            </Text>

            <Text style={[styles.mainTitleText, { color: themeColors.text }]}>
                Suas próximas reuniões
            </Text>
        </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1, // Ocupa toda a tela
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20, // Espaçamento lateral interno
    paddingTop: 24, // Espaçamento superior interno
  },
  greetingText: {
    fontSize: 16,
    color: TEXT_MUTED,
    marginBottom: 8, // Espaço antes do título principal
  },
  mainTitleText: {
    fontSize: 28, // Título grande e impactante
    fontWeight: 'bold', // Negrito
    color: TEXT_DARK,
    lineHeight: 34, // Espaçamento entre as linhas do título
  },
});