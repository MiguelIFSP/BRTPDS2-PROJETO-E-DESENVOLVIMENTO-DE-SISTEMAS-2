import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import ReuniaoCheckIn from '@/components/ReuniaoCheckIn';
import { monitoringService } from '@/services/monitoringService';
import {
  reuniaoService,
  type EntradaReuniaoResponse,
} from '@/services/reuniaoService';
import { ApiError } from '@/utils/apiClient';

const registro = {
  id: 12,
  reuniaoId: 31,
  userId: 7,
  entradaAt: '2026-10-21T15:00:00.123Z',
  saidaAt: null,
};
const response: EntradaReuniaoResponse = {
  registro,
  message: 'Presença confirmada.',
  jaRegistrado: false,
};
const props = {
  reuniaoId: 31,
  token: 'jwt-teste',
  status: 'AGENDADA' as const,
};
const checkIn = jest.spyOn(reuniaoService, 'checkIn');
jest
  .spyOn(monitoringService, 'reportRequestFailure')
  .mockImplementation(() => {});

beforeEach(() => {
  checkIn.mockReset();
  checkIn.mockResolvedValue(response);
});

describe('ReuniaoCheckIn', () => {
  it.each([false, true])(
    'confirma presença em resposta com jaRegistrado=%s',
    async (jaRegistrado) => {
      checkIn.mockResolvedValue({ ...response, jaRegistrado });
      await render(<ReuniaoCheckIn {...props} />);
      await fireEvent.press(
        screen.getByRole('button', { name: 'Entrar na Reunião' }),
      );

      expect(checkIn).toHaveBeenCalledWith('jwt-teste', 31);
      expect(await screen.findByText('Presença Confirmada')).toBeOnTheScreen();
      expect(
        screen.queryByRole('button', { name: 'Entrar na Reunião' }),
      ).toBeNull();
    },
  );

  it('mantém loading e impede outro envio enquanto aguarda a API', async () => {
    let finish: (value: EntradaReuniaoResponse) => void = () => {};
    checkIn.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    await render(<ReuniaoCheckIn {...props} />);
    await fireEvent.press(
      screen.getByRole('button', { name: 'Entrar na Reunião' }),
    );

    const button = screen.getByRole('button', { name: 'Entrar na Reunião' });
    expect(button).toBeDisabled();
    expect(screen.getByText('Confirmando presença...')).toBeOnTheScreen();
    await fireEvent.press(button);
    expect(checkIn).toHaveBeenCalledTimes(1);

    await act(() => {
      finish(response);
    });
    expect(await screen.findByText('Presença Confirmada')).toBeOnTheScreen();
  });

  it('permite tentar novamente após falha sem confirmar presença antes do sucesso', async () => {
    checkIn.mockRejectedValueOnce(new ApiError('Sem conexão.', 0));
    await render(<ReuniaoCheckIn {...props} />);
    await fireEvent.press(
      screen.getByRole('button', { name: 'Entrar na Reunião' }),
    );
    expect(await screen.findByText('Sem conexão.')).toBeOnTheScreen();
    expect(screen.queryByText('Presença Confirmada')).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Entrar na Reunião' }),
    ).not.toBeDisabled();

    await fireEvent.press(
      screen.getByRole('button', { name: 'Entrar na Reunião' }),
    );
    expect(await screen.findByText('Presença Confirmada')).toBeOnTheScreen();
    expect(checkIn).toHaveBeenCalledTimes(2);
  });

  it('recupera presença recebida do servidor ao reabrir a tela', async () => {
    await render(
      <ReuniaoCheckIn {...props} status="REALIZADA" meuRegistro={registro} />,
    );
    expect(screen.getByText('Presença Confirmada')).toBeOnTheScreen();
    expect(checkIn).not.toHaveBeenCalled();
  });

  it.each(['REALIZADA', 'CANCELADA'] as const)(
    'não oferece primeira entrada em reunião %s',
    async (status) => {
      await render(<ReuniaoCheckIn {...props} status={status} />);
      expect(
        screen.queryByRole('button', { name: 'Entrar na Reunião' }),
      ).toBeNull();
      expect(checkIn).not.toHaveBeenCalled();
    },
  );
});
