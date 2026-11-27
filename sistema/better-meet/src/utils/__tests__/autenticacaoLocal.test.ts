import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

import {
  authenticateLocal,
  isLocalAuthAvailable,
  isLocalAuthInProgress,
} from '@/utils/autenticacaoLocal';

jest.mock('expo-local-authentication', () => ({
  SecurityLevel: { NONE: 0, SECRET: 1, BIOMETRIC_WEAK: 2, BIOMETRIC_STRONG: 3 },
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  getEnrolledLevelAsync: jest.fn(),
  authenticateAsync: jest.fn(),
}));
const auth = jest.mocked(LocalAuthentication);
const platform = Platform.OS;

beforeEach(() => {
  Platform.OS = 'android';
  jest.resetAllMocks();
  auth.hasHardwareAsync.mockResolvedValue(true);
  auth.isEnrolledAsync.mockResolvedValue(true);
  auth.getEnrolledLevelAsync.mockResolvedValue(
    LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG,
  );
  auth.authenticateAsync.mockResolvedValue({ success: true });
});
afterEach(() => {
  Platform.OS = platform;
});

describe('isLocalAuthAvailable', () => {
  it('com biometria cadastrada está disponível', async () => {
    expect(await isLocalAuthAvailable()).toBe(true);
  });

  it('sem biometria, mas com PIN do aparelho, está disponível', async () => {
    auth.isEnrolledAsync.mockResolvedValue(false);
    auth.getEnrolledLevelAsync.mockResolvedValue(
      LocalAuthentication.SecurityLevel.SECRET,
    );
    expect(await isLocalAuthAvailable()).toBe(true);
  });

  it('sem biometria e sem PIN não está disponível', async () => {
    auth.isEnrolledAsync.mockResolvedValue(false);
    auth.getEnrolledLevelAsync.mockResolvedValue(
      LocalAuthentication.SecurityLevel.NONE,
    );
    expect(await isLocalAuthAvailable()).toBe(false);
  });

  it('na web não está disponível nem consulta a API nativa', async () => {
    Platform.OS = 'web';
    expect(await isLocalAuthAvailable()).toBe(false);
    expect(auth.hasHardwareAsync).not.toHaveBeenCalled();
  });
});

describe('authenticateLocal', () => {
  it('sucesso devolve success e permite o PIN do aparelho', async () => {
    expect(await authenticateLocal('Desbloqueie', 'Falhou.')).toBe('success');
    expect(auth.authenticateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        promptMessage: 'Desbloqueie',
        disableDeviceFallback: false,
      }),
    );
  });

  it('cancelamento devolve cancel, sem sucesso', async () => {
    auth.authenticateAsync.mockResolvedValue({
      success: false,
      error: 'user_cancel',
    });
    expect(await authenticateLocal('Desbloqueie', 'Falhou.')).toBe('cancel');
  });

  it('falha lança a mensagem informada', async () => {
    auth.authenticateAsync.mockResolvedValue({
      success: false,
      error: 'lockout',
    });
    await expect(authenticateLocal('Desbloqueie', 'Falhou.')).rejects.toThrow(
      'Falhou.',
    );
  });

  it('marca o prompt como aberto só enquanto ele está na tela', async () => {
    let resolvePrompt: (value: { success: true }) => void = () => {};
    auth.authenticateAsync.mockReturnValue(
      new Promise((resolve) => {
        resolvePrompt = resolve;
      }),
    );
    const pending = authenticateLocal('Desbloqueie', 'Falhou.');
    expect(isLocalAuthInProgress()).toBe(true);
    resolvePrompt({ success: true });
    await pending;
    expect(isLocalAuthInProgress()).toBe(false);
  });

  it('libera a marca mesmo quando o prompt falha', async () => {
    auth.authenticateAsync.mockRejectedValue(new Error('nativo'));
    await expect(authenticateLocal('Desbloqueie', 'Falhou.')).rejects.toThrow();
    expect(isLocalAuthInProgress()).toBe(false);
  });
});
