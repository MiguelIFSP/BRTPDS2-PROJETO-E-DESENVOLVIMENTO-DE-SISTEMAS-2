import { describe, expect, it } from '@jest/globals';

import appJson from '@/../app.json';

const { expo } = appJson;

describe('app.json', () => {
  it('mantém o esquema bettermeet usado pelos links dos e-mails', () => {
    expect(expo.scheme).toBe('bettermeet');
  });

  it('declara o plugin do expo-secure-store (sessão fora do AsyncStorage)', () => {
    expect(expo.plugins).toContain('expo-secure-store');
  });
});
