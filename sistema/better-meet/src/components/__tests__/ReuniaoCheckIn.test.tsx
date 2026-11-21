import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import ReuniaoCheckIn from '@/components/ReuniaoCheckIn';
import { monitoringService } from '@/services/monitoringService';
import {
  reuniaoService,
  type EntradaReuniaoResponse,
  type SaidaReuniaoResponse,
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
const saidaResponse: SaidaReuniaoResponse = {
  registro: { ...registro, saidaAt: '2026-10-21T16:00:00.000Z' },
  message: 'Saída registrada.',
  jaRegistrado: false,
};
const props = {
  reuniaoId: 31,
  token: 'jwt-teste',
  status: 'AGENDADA' as const,
};
const checkIn = jest.spyOn(reuniaoService, 'checkIn');
const checkOut = jest.spyOn(reuniaoService, 'checkOut');
jest
  .spyOn(monitoringService, 'reportRequestFailure')
  .mockImplementation(() => {});

beforeEach(() => {
  checkIn.mockReset();
  checkIn.mockResolvedValue(response);
  checkOut.mockReset();
  checkOut.mockResolvedValue(saidaResponse);
});

// 10:00 a 11:00 em São Paulo = 13:00 a 14:00 UTC; a entrada abre às 09:45.
const horario = { data: '2026-06-15', horaInicio: '10:00', horaFim: '11:00' };
const agoraEm = (iso: string) => {
  jest.useFakeTimers({
    doNotFake: [
      'nextTick',
      'setImmediate',
      'clearImmediate',
      'setInterval',
      'clearInterval',
      'setTimeout',
      'clearTimeout',
      'queueMicrotask',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'performance',
    ],
    now: new Date(iso),
  });
};

describe('ReuniaoCheckIn: janela de entrada', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('antes da abertura esconde o botão e mostra a hora em que a entrada abre', async () => {
    agoraEm('2026-06-15T12:00:00Z');
    await render(<ReuniaoCheckIn {...props} horario={horario} />);
    expect(
      screen.queryByRole('button', { name: 'Entrar na Reunião' }),
    ).toBeNull();
    expect(screen.getByText('A entrada abre às 09:45.')).toBeOnTheScreen();
  });

  it('1 segundo antes da abertura ainda não mostra o botão', async () => {
    agoraEm('2026-06-15T12:44:59Z');
    await render(<ReuniaoCheckIn {...props} horario={horario} />);
    expect(
      screen.queryByRole('button', { name: 'Entrar na Reunião' }),
    ).toBeNull();
  });

  it('dentro da janela mostra o botão', async () => {
    agoraEm('2026-06-15T12:45:00Z');
    await render(<ReuniaoCheckIn {...props} horario={horario} />);
    expect(
      screen.getByRole('button', { name: 'Entrar na Reunião' }),
    ).toBeOnTheScreen();
  });

  it('depois do fim esconde o botão e avisa que a entrada foi encerrada', async () => {
    agoraEm('2026-06-15T14:00:00Z');
    await render(<ReuniaoCheckIn {...props} horario={horario} />);
    expect(
      screen.queryByRole('button', { name: 'Entrar na Reunião' }),
    ).toBeNull();
    expect(
      screen.getByText('A entrada nesta reunião já foi encerrada.'),
    ).toBeOnTheScreen();
  });

  it('exibe a mensagem do 409 quando a API recusa a entrada', async () => {
    agoraEm('2026-06-15T13:30:00Z');
    checkIn.mockRejectedValue(
      new ApiError(
        'Esta reunião já terminou; não é possível registrar entrada.',
        409,
      ),
    );
    await render(<ReuniaoCheckIn {...props} horario={horario} />);
    await fireEvent.press(
      screen.getByRole('button', { name: 'Entrar na Reunião' }),
    );
    expect(
      await screen.findByText(
        'Esta reunião já terminou; não é possível registrar entrada.',
      ),
    ).toBeOnTheScreen();
  });
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
      expect(await screen.findByText('Presença ativa')).toBeOnTheScreen();
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
    expect(await screen.findByText('Presença ativa')).toBeOnTheScreen();
  });

  it('permite tentar novamente após falha sem confirmar presença antes do sucesso', async () => {
    checkIn.mockRejectedValueOnce(new ApiError('Sem conexão.', 0));
    await render(<ReuniaoCheckIn {...props} />);
    await fireEvent.press(
      screen.getByRole('button', { name: 'Entrar na Reunião' }),
    );
    expect(await screen.findByText('Sem conexão.')).toBeOnTheScreen();
    expect(screen.queryByText('Presença ativa')).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Entrar na Reunião' }),
    ).not.toBeDisabled();

    await fireEvent.press(
      screen.getByRole('button', { name: 'Entrar na Reunião' }),
    );
    expect(await screen.findByText('Presença ativa')).toBeOnTheScreen();
    expect(checkIn).toHaveBeenCalledTimes(2);
  });

  it('recupera presença recebida do servidor ao reabrir a tela', async () => {
    await render(
      <ReuniaoCheckIn {...props} status="REALIZADA" meuRegistro={registro} />,
    );
    expect(screen.getByText('Presença ativa')).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Registrar saída' }),
    ).toBeOnTheScreen();
    expect(checkIn).not.toHaveBeenCalled();
  });

  it('registra a saída e substitui a presença ativa pelo estado encerrado', async () => {
    await render(<ReuniaoCheckIn {...props} meuRegistro={registro} />);
    await fireEvent.press(
      screen.getByRole('button', { name: 'Registrar saída' }),
    );

    expect(checkOut).toHaveBeenCalledWith('jwt-teste', 31);
    expect(await screen.findByText('Saída registrada')).toBeOnTheScreen();
    expect(
      screen.queryByRole('button', { name: 'Registrar saída' }),
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Entrar na Reunião' }),
    ).toBeNull();
  });

  it('mostra estado encerrado recebido do servidor sem permitir reentrada', async () => {
    await render(
      <ReuniaoCheckIn {...props} meuRegistro={saidaResponse.registro} />,
    );

    expect(screen.getByText('Saída registrada')).toBeOnTheScreen();
    expect(
      screen.queryByRole('button', { name: 'Registrar saída' }),
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Entrar na Reunião' }),
    ).toBeNull();
    expect(checkIn).not.toHaveBeenCalled();
    expect(checkOut).not.toHaveBeenCalled();
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
