import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_KEY_PREFIX = 'better-meet:first-access-welcome:';

const keyFor = (userId: number) => `${PENDING_KEY_PREFIX}${userId}`;

export function markFirstAccessWelcomePending(userId: number) {
  return AsyncStorage.setItem(keyFor(userId), 'pending');
}

/**
 * O cadastro não devolve o id nem abre sessão, então a boas-vindas dispara no
 * primeiro login da conta neste aparelho. Quem já viu (ou fechou) a
 * apresentação fica com o valor 'done' e não a recebe de novo.
 */
export async function markFirstAccessWelcomeOnFirstLogin(userId: number) {
  const current = await AsyncStorage.getItem(keyFor(userId));
  if (current === null) await markFirstAccessWelcomePending(userId);
}

export async function isFirstAccessWelcomePending(userId: number) {
  return (await AsyncStorage.getItem(keyFor(userId))) === 'pending';
}

// A oferta de desbloqueio espera a apresentação fechar para não abrir dois
// diálogos de uma vez (OfertaDesbloqueioDialog).
const clearedListeners = new Set<(userId: number) => void>();

export function onFirstAccessWelcomeCleared(
  listener: (userId: number) => void,
) {
  clearedListeners.add(listener);
  return () => {
    clearedListeners.delete(listener);
  };
}

export async function clearFirstAccessWelcomePending(userId: number) {
  await AsyncStorage.setItem(keyFor(userId), 'done');
  clearedListeners.forEach((listener) => listener(userId));
}
