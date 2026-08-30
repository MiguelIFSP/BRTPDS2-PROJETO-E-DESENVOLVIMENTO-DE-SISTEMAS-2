import react from "react";
import { View, Text, StatusBar, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "./Header";

const HOME_BG = '#FFFFFF'; // Fundo branco da página inicial
const TEXT_DARK = '#1A1A1A'; // Texto preto suave
const TEXT_MUTED = '#666666'; // Texto cinza suave

export default function HomeScreen() {
    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={"#F0FAF9"} />
            <Header />

            <View style={styles.contentContainer}>
                <Text style={styles.greetingText}>
                    Olá, usuário 👋
                </Text>

                <Text style={styles.mainTitleText}>
                    Suas próximas reuniões
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1, // Ocupa toda a tela
    backgroundColor: HOME_BG, // Fundo branco padrão
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