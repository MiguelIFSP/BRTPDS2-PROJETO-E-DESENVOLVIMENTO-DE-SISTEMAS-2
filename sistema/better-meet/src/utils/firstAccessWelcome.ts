import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_KEY_PREFIX = 'better-meet:first-access-welcome:';

const keyFor = (userId: number) => `${PENDING_KEY_PREFIX}${userId}`;

export function markFirstAccessWelcomePending(userId: number) {
  return AsyncStorage.setItem(keyFor(userId), 'pending');
}

export async function isFirstAccessWelcomePending(userId: number) {
  return (await AsyncStorage.getItem(keyFor(userId))) === 'pending';
}

export function clearFirstAccessWelcomePending(userId: number) {
  return AsyncStorage.removeItem(keyFor(userId));
}
