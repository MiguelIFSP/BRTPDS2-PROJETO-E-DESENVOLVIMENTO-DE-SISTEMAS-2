import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  getSessionToken,
  restoreSessionToken,
  setSessionToken,
} from '@/lib/authClient';
import * as sessionStorage from '@/lib/sessionStorage';

jest.mock('@/lib/sessionStorage', () => ({
  readSession: jest.fn(),
  writeSession: jest.fn(),
  clearSession: jest.fn(),
}));

const storage = jest.mocked(sessionStorage);

beforeEach(async () => {
  jest.clearAllMocks();
  await setSessionToken(null);
  jest.clearAllMocks();
});

describe('authClient (token de sessão)', () => {
  it('setSessionToken guarda em memória e no armazenamento seguro', async () => {
    await setSessionToken('tok-1');
    expect(getSessionToken()).toBe('tok-1');
    expect(storage.writeSession).toHaveBeenCalledWith('tok-1');
  });

  it('setSessionToken(null) apaga os dois', async () => {
    await setSessionToken('tok-1');
    await setSessionToken(null);
    expect(getSessionToken()).toBeNull();
    expect(storage.clearSession).toHaveBeenCalled();
  });

  it('restoreSessionToken lê do armazenamento seguro para a memória', async () => {
    storage.readSession.mockResolvedValue('guardado');
    expect(await restoreSessionToken()).toBe('guardado');
    expect(getSessionToken()).toBe('guardado');
  });
});
