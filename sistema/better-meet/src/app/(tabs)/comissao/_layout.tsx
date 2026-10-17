import { Stack } from 'expo-router/stack';

// lista -> detalhe: o detalhe empilha sobre a lista (com a animação nativa)
// e o "Voltar" desempilha. A lista fica sempre por baixo, mesmo abrindo o
// detalhe direto pela URL.
export const unstable_settings = { anchor: 'index' };

export default function Layout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
