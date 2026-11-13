import { beforeEach, describe, expect, it } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  clearFirstAccessWelcomePending,
  isFirstAccessWelcomePending,
  markFirstAccessWelcomePending,
} from '@/utils/firstAccessWelcome';

describe('aviso de primeiro acesso', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('fica pendente somente para a conta que acabou de se cadastrar', async () => {
    await markFirstAccessWelcomePending(17);

    await expect(isFirstAccessWelcomePending(17)).resolves.toBe(true);
    await expect(isFirstAccessWelcomePending(18)).resolves.toBe(false);
  });

  it('deixa de aparecer depois que a pessoa escolhe um caminho', async () => {
    await markFirstAccessWelcomePending(17);
    await clearFirstAccessWelcomePending(17);

    await expect(isFirstAccessWelcomePending(17)).resolves.toBe(false);
  });
});
