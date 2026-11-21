import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SESSION_KEY = 'bettermeet.session';

// No web não há Keychain nem Keystore: localStorage é o limite aceito (cookie
// entre origens não é confiável com CORS_ORIGINS). Nunca o AsyncStorage.
const isWeb = () => Platform.OS === 'web';

export async function readSession(): Promise<string | null> {
  if (isWeb()) return globalThis.localStorage?.getItem(SESSION_KEY) ?? null;
  return SecureStore.getItemAsync(SESSION_KEY);
}

export async function writeSession(token: string): Promise<void> {
  if (isWeb()) {
    globalThis.localStorage?.setItem(SESSION_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(SESSION_KEY, token);
}

export async function clearSession(): Promise<void> {
  if (isWeb()) {
    globalThis.localStorage?.removeItem(SESSION_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
