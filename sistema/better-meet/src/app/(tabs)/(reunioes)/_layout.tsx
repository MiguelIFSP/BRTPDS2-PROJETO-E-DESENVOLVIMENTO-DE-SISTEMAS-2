import { Stack } from 'expo-router/stack';

// aba Reuniões: a raiz (index) é o início do app, onde se listam, criam e
// respondem convites de reuniões. O grupo (reunioes) não entra na URL: "/".
export const unstable_settings = { anchor: 'index' };

export default function Layout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
