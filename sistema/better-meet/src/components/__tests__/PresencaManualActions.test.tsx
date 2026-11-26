import { beforeEach, expect, it, jest } from '@jest/globals';
import { useEffect as mockUseEffect } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import PresencaManualActions from '@/components/PresencaManualActions';
import {
  reuniaoService,
  type ReuniaoParticipante,
} from '@/services/reuniaoService';

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => mockUseEffect(callback, [callback]),
}));
const participante: ReuniaoParticipante = {
  userId: 7,
  nome: 'Ana',
  email: 'ana@example.test',
  papel: 'MEMBRO',
  registro: null,
};
const registro = {
  id: 12,
  reuniaoId: 31,
  userId: 7,
  entradaAt: '2026-06-15T13:00:00Z',
  saidaAt: null,
};
const register = jest.spyOn(reuniaoService, 'registerPresencaManual');
const reload = jest.fn<() => Promise<void>>();
beforeEach(() => {
  register
    .mockReset()
    .mockResolvedValue({
      registro,
      message: 'Presença registrada.',
      jaRegistrado: false,
    });
  reload.mockReset().mockResolvedValue(undefined);
});
it.each([false, true])(
  'confirma registro manual, saída=%s, e atualiza a lista',
  async (saida) => {
    await render(
      <PresencaManualActions
        token="jwt"
        reuniaoId={31}
        participante={{ ...participante, registro: saida ? registro : null }}
        disabled={false}
        onRegistered={reload}
      />,
    );
    await fireEvent.press(
      screen.getByLabelText(
        saida ? 'Marcar saída de Ana' : 'Marcar entrada de Ana',
      ),
    );
    expect(register).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('Código de Presença')).toBeNull();
    await fireEvent.press(screen.getByLabelText('Registrar pelo participante'));
    expect(register).toHaveBeenCalledWith(
      'jwt',
      31,
      7,
      saida ? 'sair' : 'entrar',
    );
    expect(reload).toHaveBeenCalledTimes(1);
  },
);
it('desabilita antes do início e esconde ação depois da saída', async () => {
  const view = await render(
    <PresencaManualActions
      token="jwt"
      reuniaoId={31}
      participante={participante}
      disabled
      onRegistered={reload}
    />,
  );
  expect(screen.getByLabelText('Marcar entrada de Ana')).toBeDisabled();
  await view.rerender(
    <PresencaManualActions
      token="jwt"
      reuniaoId={31}
      participante={{
        ...participante,
        registro: { ...registro, saidaAt: '2026-06-15T14:00:00Z' },
      }}
      disabled={false}
      onRegistered={reload}
    />,
  );
  expect(screen.queryByLabelText('Marcar saída de Ana')).toBeNull();
});
