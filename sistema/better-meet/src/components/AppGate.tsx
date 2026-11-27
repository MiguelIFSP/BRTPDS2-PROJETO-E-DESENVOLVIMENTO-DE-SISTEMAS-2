import { Stack } from 'expo-router/stack';
import { StyleSheet, View } from 'react-native';

import DesbloqueioApp from '@/components/DesbloqueioApp';
import { useBloqueioApp } from '@/hooks/useBloqueioApp';
import { useAuthStore } from '@/store/authStore';
import { useDesbloqueioStore } from '@/store/desbloqueioStore';

// Rotas abertas sem login. Ao criar uma, coloque-a aqui; as rotas logadas
// entram no primeiro Protected.
export const PUBLIC_ROUTES = [
  'usuario',
  'recuperar-senha',
  'redefinir-senha',
] as const;

// Única checagem de login do app (RN-16). Rotas protegidas nem são montadas
// sem o guard, então as abas não carregam deslogado, e um 401 que desloga o
// usuário (apiRequest) leva ao login por aqui.
export default function AppGate() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isLocked = useDesbloqueioStore(
    (state) => state.isLocked && isAuthenticated,
  );
  useBloqueioApp();

  // espera a sessão ser restaurada, senão quem está logado iria ao login.
  if (!hasHydrated) return null;

  return (
    <>
      {/* Bloqueado, a pilha segue montada (a navegação volta igual ao
          desbloquear), mas fica fora do alcance dos leitores de tela. */}
      <View
        style={styles.root}
        accessibilityElementsHidden={isLocked}
        importantForAccessibility={isLocked ? 'no-hide-descendants' : 'auto'}
      >
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={isAuthenticated} redirectTo="/login">
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="lista-presenca" />
          </Stack.Protected>
          <Stack.Protected guard={!isAuthenticated} redirectTo="/">
            <Stack.Screen name="login" />
          </Stack.Protected>
          {PUBLIC_ROUTES.map((name) => (
            <Stack.Screen key={name} name={name} />
          ))}
        </Stack>
      </View>
      {isLocked ? <DesbloqueioApp /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
