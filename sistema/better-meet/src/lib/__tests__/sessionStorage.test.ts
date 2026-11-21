import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { clearSession, readSession, writeSession } from '@/lib/sessionStorage';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const secureStore = jest.mocked(SecureStore);
const originalOS = Platform.OS;

afterEach(() => {
  jest.clearAllMocks();
  Platform.OS = originalOS;
});

describe('sessionStorage (nativo)', () => {
  beforeEach(() => {
    Platform.OS = 'android';
  });

  it('grava, lê e apaga pelo SecureStore com a chave da sessão', async () => {
    secureStore.getItemAsync.mockResolvedValue('abc');

    await writeSession('abc');
    expect(secureStore.setItemAsync).toHaveBeenCalledWith(
      'bettermeet.session',
      'abc',
    );
    expect(await readSession()).toBe('abc');
    await clearSession();
    expect(secureStore.deleteItemAsync).toHaveBeenCalledWith(
      'bettermeet.session',
    );
  });

  it('nunca usa o AsyncStorage', async () => {
    const getItem = jest.spyOn(AsyncStorage, 'getItem');
    const setItem = jest.spyOn(AsyncStorage, 'setItem');
    const removeItem = jest.spyOn(AsyncStorage, 'removeItem');

    await writeSession('abc');
    await readSession();
    await clearSession();

    expect(getItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
  });
});

describe('sessionStorage (web)', () => {
  const store = new Map<string, string>();
  const localStorageMock = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  };

  beforeEach(() => {
    Platform.OS = 'web';
    store.clear();
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      configurable: true,
    });
  });

  it('usa o localStorage e não o SecureStore', async () => {
    await writeSession('web-token');
    expect(await readSession()).toBe('web-token');
    await clearSession();
    expect(await readSession()).toBeNull();
    expect(secureStore.setItemAsync).not.toHaveBeenCalled();
  });
});
