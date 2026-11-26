import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

import { confirmPresencaLocal } from '@/utils/confirmPresencaLocal';

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

it('exige confirmação nativa e permite senha do aparelho', async () => {
  expect(await confirmPresencaLocal(false)).toBe(true);
  expect(auth.authenticateAsync).toHaveBeenCalledWith(
    expect.objectContaining({ disableDeviceFallback: false }),
  );
});
it('sem biometria cadastrada usa autenticação nativa com senha', async () => {
  auth.hasHardwareAsync.mockResolvedValue(false);
  auth.isEnrolledAsync.mockResolvedValue(false);
  auth.getEnrolledLevelAsync.mockResolvedValue(
    LocalAuthentication.SecurityLevel.SECRET,
  );
  expect(await confirmPresencaLocal(true)).toBe(true);
  expect(auth.authenticateAsync).toHaveBeenCalledTimes(1);
});
it('sem biometria e sem senha não autoriza', async () => {
  auth.isEnrolledAsync.mockResolvedValue(false);
  auth.getEnrolledLevelAsync.mockResolvedValue(
    LocalAuthentication.SecurityLevel.NONE,
  );
  await expect(confirmPresencaLocal(false)).rejects.toThrow(/Configure/);
  expect(auth.authenticateAsync).not.toHaveBeenCalled();
});
it('cancelamento e falha não autorizam', async () => {
  auth.authenticateAsync.mockResolvedValueOnce({
    success: false,
    error: 'user_cancel',
  });
  expect(await confirmPresencaLocal(false)).toBe(false);
  auth.authenticateAsync.mockResolvedValueOnce({
    success: false,
    error: 'lockout',
  });
  await expect(confirmPresencaLocal(false)).rejects.toThrow(/identidade/);
});
it('no navegador usa a confirmação explícita do chamador sem API nativa', async () => {
  Platform.OS = 'web';
  expect(await confirmPresencaLocal(false)).toBe(true);
  expect(auth.authenticateAsync).not.toHaveBeenCalled();
});
