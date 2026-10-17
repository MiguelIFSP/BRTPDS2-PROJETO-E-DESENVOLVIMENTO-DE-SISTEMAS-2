import { Stack } from 'expo-router/stack';

// aba Reuniões: início (próximas reuniões) -> gerenciar reuniões e convites.
// O grupo (reunioes) não entra na URL: as rotas continuam "/" e "/reuniao".
// O início fica sempre por baixo, mesmo abrindo /reuniao direto pela URL.
export const unstable_settings = { anchor: 'index' };

export default function Layout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
