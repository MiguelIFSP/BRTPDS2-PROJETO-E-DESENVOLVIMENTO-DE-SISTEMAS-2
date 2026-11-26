import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { useEffect as mockUseEffect } from 'react';

import ReuniaoCheckIn from '@/components/ReuniaoCheckIn';
import { reuniaoService } from '@/services/reuniaoService';
import { confirmPresencaLocal } from '@/utils/confirmPresencaLocal';

jest.mock('@/utils/confirmPresencaLocal', () => ({
  confirmPresencaLocal: jest.fn(),
}));
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => mockUseEffect(callback, [callback]),
}));
const confirmLocal = jest.mocked(confirmPresencaLocal);
const registro = {
  id: 12,
  reuniaoId: 31,
  userId: 7,
  entradaAt: '2026-06-15T13:00:00Z',
  saidaAt: null,
};
const props = {
  reuniaoId: 31,
  token: 'jwt-teste',
  status: 'AGENDADA' as const,
  horario: { data: '2026-06-15', horaInicio: '10:00', horaFim: '11:00' },
};
const checkIn = jest.spyOn(reuniaoService, 'checkIn');
const checkOut = jest.spyOn(reuniaoService, 'checkOut');
const open = async (saida = false) => {
  await fireEvent.press(
    screen.getByLabelText(saida ? 'Registrar saída' : 'Entrar na Reunião'),
  );
  await fireEvent.changeText(
    screen.getByLabelText('Código de Presença'),
    '123456',
  );
};
beforeEach(() => {
  jest.useFakeTimers({ now: new Date('2026-06-15T13:30:00Z') });
  checkIn
    .mockReset()
    .mockResolvedValue({
      registro,
      message: 'Presença confirmada.',
      jaRegistrado: false,
    });
  checkOut
    .mockReset()
    .mockResolvedValue({
      registro: { ...registro, saidaAt: '2026-06-15T13:30:00Z' },
      message: 'Saída registrada.',
      jaRegistrado: false,
    });
  confirmLocal.mockReset().mockResolvedValue(true);
});
afterEach(() => {
  jest.useRealTimers();
});

describe('ReuniaoCheckIn', () => {
  it.each([false, true])(
    'bloqueia antes do início inclusive saída=%s, mostra horário e libera no início',
    async (saida) => {
      jest.setSystemTime(new Date('2026-06-15T12:59:59Z'));
      await render(
        <ReuniaoCheckIn {...props} meuRegistro={saida ? registro : null} />,
      );
      const label = saida ? 'Registrar saída' : 'Entrar na Reunião';
      expect(screen.getByLabelText(label)).toBeDisabled();
      expect(screen.getByText(/às 10:00 de 15\/06\/2026/)).toBeTruthy();
      await act(() => jest.advanceTimersByTime(1000));
      expect(screen.getByLabelText(label)).not.toBeDisabled();
    },
  );
  it.each([false, true])(
    'pede PIN e autenticação antes da requisição, saída=%s',
    async (saida) => {
      const updated = jest.fn();
      await render(
        <ReuniaoCheckIn
          {...props}
          meuRegistro={saida ? registro : null}
          onRegistered={updated}
        />,
      );
      await open(saida);
      expect(checkIn).not.toHaveBeenCalled();
      expect(checkOut).not.toHaveBeenCalled();
      expect(confirmLocal).not.toHaveBeenCalled();
      await fireEvent.press(screen.getByLabelText('Confirmar presença'));
      await waitFor(() =>
        expect(saida ? checkOut : checkIn).toHaveBeenCalledWith(
          'jwt-teste',
          31,
          '123456',
        ),
      );
      expect(confirmLocal).toHaveBeenCalledWith(saida);
      expect(confirmLocal.mock.invocationCallOrder[0]).toBeLessThan(
        (saida ? checkOut : checkIn).mock.invocationCallOrder[0]!,
      );
      expect(updated).toHaveBeenCalledTimes(1);
      expect(
        screen.getByText(saida ? 'Saída registrada.' : 'Presença confirmada.'),
      ).toBeTruthy();
    },
  );
  it('não envia se a autenticação for cancelada', async () => {
    confirmLocal.mockResolvedValue(false);
    await render(<ReuniaoCheckIn {...props} />);
    await open();
    await fireEvent.press(screen.getByLabelText('Confirmar presença'));
    expect(checkIn).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Confirmar presença')).not.toBeDisabled();
  });
  it('valida o PIN e remove o erro ao editar', async () => {
    await render(<ReuniaoCheckIn {...props} />);
    await open();
    await fireEvent.changeText(
      screen.getByLabelText('Código de Presença'),
      '12',
    );
    await fireEvent.press(screen.getByLabelText('Confirmar presença'));
    expect(confirmLocal).not.toHaveBeenCalled();
    expect(screen.getByText(/seis dígitos/)).toBeTruthy();
    await fireEvent.changeText(
      screen.getByLabelText('Código de Presença'),
      '123456',
    );
    expect(screen.queryByText(/seis dígitos/)).toBeNull();
  });
  it('informa erro da API e permite nova tentativa', async () => {
    checkIn.mockRejectedValueOnce(new Error('Código de presença inválido.'));
    await render(<ReuniaoCheckIn {...props} />);
    await open();
    await fireEvent.press(screen.getByLabelText('Confirmar presença'));
    expect(
      await screen.findByText('Código de presença inválido.'),
    ).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Confirmar presença'));
    expect(checkIn).toHaveBeenCalledTimes(2);
  });
  it('impede chamadas duplicadas enquanto autentica', async () => {
    let resolve: ((result: boolean) => void) | undefined;
    confirmLocal.mockImplementation(
      () =>
        new Promise<boolean>((done) => {
          resolve = done;
        }),
    );
    await render(<ReuniaoCheckIn {...props} />);
    await open();
    await fireEvent.press(screen.getByLabelText('Confirmar presença'));
    await fireEvent.press(screen.getByLabelText('Confirmar presença'));
    expect(confirmLocal).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolve?.(true);
    });
    expect(checkIn).toHaveBeenCalledTimes(1);
  });
  it('permite saída atrasada, bloqueia entrada depois do fim e reunião cancelada', async () => {
    jest.setSystemTime(new Date('2026-06-15T16:00:00Z'));
    const view = await render(<ReuniaoCheckIn {...props} />);
    expect(screen.getByLabelText('Entrar na Reunião')).toBeDisabled();
    await view.rerender(<ReuniaoCheckIn {...props} meuRegistro={registro} />);
    expect(screen.getByLabelText('Registrar saída')).not.toBeDisabled();
    await view.rerender(
      <ReuniaoCheckIn {...props} meuRegistro={registro} status="CANCELADA" />,
    );
    expect(screen.getByLabelText('Registrar saída')).toBeDisabled();
  });
  it('não oferece nova saída depois de registrada', async () => {
    await render(
      <ReuniaoCheckIn
        {...props}
        meuRegistro={{ ...registro, saidaAt: '2026-06-15T13:30:00Z' }}
      />,
    );
    expect(screen.queryByLabelText('Registrar saída')).toBeNull();
  });
});
