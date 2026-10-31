import { Stack } from 'expo-router/stack';

// menu "Mais" -> conta, status, relatórios: cada opção empilha sobre o menu
// (com a animação nativa) e o "Voltar" desempilha. O menu fica sempre por
// baixo, mesmo abrindo a opção direto pela URL.
export const unstable_settings = { anchor: 'index' };

export default function Layout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
