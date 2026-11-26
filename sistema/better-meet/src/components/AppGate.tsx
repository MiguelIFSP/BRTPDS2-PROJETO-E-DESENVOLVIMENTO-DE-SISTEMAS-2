import { Stack } from 'expo-router/stack';

import { useAuthStore } from '@/store/authStore';

// Rotas abertas sem login. Ao criar uma, coloque-a aqui; as rotas logadas
// entram no primeiro Protected.
export const PUBLIC_ROUTES = [
  'usuario',
  'recuperar-senha',
  'redefinir-senha',
  'email-confirmado',
] as const;

// Única checagem de login do app (RN-16). Rotas protegidas nem são montadas
// sem o guard, então as abas não carregam deslogado, e um 401 que desloga o
// usuário (apiRequest) leva ao login por aqui.
export default function AppGate() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  // espera a sessão ser restaurada, senão quem está logado iria ao login.
  if (!hasHydrated) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isAuthenticated} redirectTo="/login">
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="manual" />
      </Stack.Protected>
      <Stack.Protected guard={!isAuthenticated} redirectTo="/">
        <Stack.Screen name="login" />
      </Stack.Protected>
      {PUBLIC_ROUTES.map((name) => (
        <Stack.Screen key={name} name={name} />
      ))}
    </Stack>
  );
}
