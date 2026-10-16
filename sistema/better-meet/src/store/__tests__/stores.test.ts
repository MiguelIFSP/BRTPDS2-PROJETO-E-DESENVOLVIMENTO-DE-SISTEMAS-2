import { beforeEach, describe, expect, it } from '@jest/globals';

import { useAuthStore, type AuthUser } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';

const user: AuthUser = {
  id: 7,
  name: 'Ana Lima',
  email: 'ana@exemplo.com',
  role: 'USER',
  createdAt: '2026-10-01T00:00:00.000Z',
};

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('login guarda usuário e token; logout limpa a sessão', () => {
    useAuthStore.getState().login(user, 'token-1');
    expect(useAuthStore.getState()).toMatchObject({
      user,
      token: 'token-1',
      isAuthenticated: true,
    });

    useAuthStore.getState().logout();
    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  });

  it('updateUser altera só nome e e-mail do usuário logado', () => {
    useAuthStore.getState().login(user, 'token-1');
    useAuthStore
      .getState()
      .updateUser({ name: 'Ana Souza', email: 'ana.souza@exemplo.com' });

    expect(useAuthStore.getState().user).toEqual({
      ...user,
      name: 'Ana Souza',
      email: 'ana.souza@exemplo.com',
    });
  });

  it('updateUser sem sessão não cria usuário', () => {
    useAuthStore.getState().updateUser({ name: 'X', email: 'x@exemplo.com' });
    expect(useAuthStore.getState().user).toBeNull();
  });
});

describe('themeStore.applyUserPreference', () => {
  it.each([
    ['dark', 'dark'],
    ['light', 'light'],
    ['system', 'system'],
    ['roxo', 'system'],
    [null, 'system'],
    [undefined, 'system'],
  ])('"%s" vira "%s"', (value, expected) => {
    useThemeStore.getState().applyUserPreference(value);
    expect(useThemeStore.getState().theme).toBe(expected);
  });
});
