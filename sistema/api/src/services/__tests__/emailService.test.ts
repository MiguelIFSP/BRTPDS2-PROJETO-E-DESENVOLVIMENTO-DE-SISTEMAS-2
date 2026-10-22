import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import { AppError } from '../../errors/AppError.ts';

const EMAIL_CONFIG = {
  EMAIL_API_URL: 'https://email.exemplo.test/messages',
  EMAIL_API_KEY: 'chave-ficticia-exclusiva-dos-testes',
  EMAIL_FROM: 'Better Meet <remetente@exemplo.test>',
};

const SEND_ERROR_MESSAGE =
  'Não foi possível enviar o código de recuperação. Tente novamente mais tarde.';

jest.unstable_mockModule('../../config/env.ts', () => ({ env: EMAIL_CONFIG }));

const { emailService } = await import('../emailService.ts');

const fetchMock = jest.spyOn(globalThis, 'fetch');
const consoleErrorMock = jest
  .spyOn(console, 'error')
  .mockImplementation(() => {});
const consoleWarnMock = jest
  .spyOn(console, 'warn')
  .mockImplementation(() => {});
const consoleLogMock = jest.spyOn(console, 'log').mockImplementation(() => {});

const getRequest = () => {
  const chamada = fetchMock.mock.calls[0];
  if (!chamada) {
    throw new Error('O teste esperava uma requisição HTTP.');
  }

  const [url, options] = chamada;
  if (!options || typeof options.body !== 'string') {
    throw new Error('O teste esperava um corpo JSON na requisição HTTP.');
  }

  const body: unknown = JSON.parse(options.body);
  return { url, options, body };
};

const expectNoSensitiveLogs = (valoresSensiveis: string[]) => {
  const registros = [
    ...consoleErrorMock.mock.calls,
    ...consoleWarnMock.mock.calls,
    ...consoleLogMock.mock.calls,
  ]
    .flat()
    .map((valor) =>
      valor instanceof Error ? valor.message : JSON.stringify(valor),
    )
    .join('\n');

  for (const valor of valoresSensiveis) {
    expect(registros).not.toContain(valor);
  }
};

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(new Response(null, { status: 202 }));
  consoleErrorMock.mockClear();
  consoleWarnMock.mockClear();
  consoleLogMock.mockClear();
});

afterAll(() => {
  fetchMock.mockRestore();
  consoleErrorMock.mockRestore();
  consoleWarnMock.mockRestore();
  consoleLogMock.mockRestore();
});

describe('emailService.enviarCodigoRecuperacao', () => {
  it('envia o código por HTTP com a URL, a chave e o remetente da configuração', async () => {
    await expect(
      emailService.enviarCodigoRecuperacao('ana@exemplo.test', '123456'),
    ).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const { url, options, body } = getRequest();

    expect(url).toBe(EMAIL_CONFIG.EMAIL_API_URL);
    expect(options.method).toBe('POST');
    expect(options.redirect).toBe('error');
    const headers = new Headers(options.headers);
    expect(headers.get('authorization')).toBe(
      `Bearer ${EMAIL_CONFIG.EMAIL_API_KEY}`,
    );
    expect(headers.get('content-type')).toBe('application/json');
    expect(headers.get('user-agent')).toBe('BetterMeet/1.0');
    expect(body).toEqual({
      from: EMAIL_CONFIG.EMAIL_FROM,
      to: ['ana@exemplo.test'],
      subject: expect.any(String),
      html: expect.stringContaining('123456'),
      text: expect.stringContaining('123456'),
    });
    expectNoSensitiveLogs([EMAIL_CONFIG.EMAIL_API_KEY, '123456']);
  });

  it('preserva os zeros iniciais do código no HTML e no texto', async () => {
    await emailService.enviarCodigoRecuperacao('ana@exemplo.test', '001234');

    expect(getRequest().body).toMatchObject({
      html: expect.stringContaining('001234'),
      text: expect.stringContaining('001234'),
    });
  });

  it('aceita uma resposta de sucesso sem exigir que o provedor devolva JSON', async () => {
    fetchMock.mockResolvedValueOnce(new Response('Aceito.', { status: 200 }));

    await expect(
      emailService.enviarCodigoRecuperacao('ana@exemplo.test', '123456'),
    ).resolves.toBeUndefined();
  });

  it.each([200, 400])(
    'libera o corpo da resposta HTTP %i sem ler dados do provedor',
    async (status) => {
      const response = new Response('Conteúdo interno do provedor.', {
        status,
      });
      const body = response.body;
      if (!body) {
        throw new Error('O teste esperava um corpo na resposta HTTP.');
      }

      const cancelMock = jest.spyOn(body, 'cancel');
      const jsonMock = jest.spyOn(response, 'json');
      const textMock = jest.spyOn(response, 'text');
      fetchMock.mockResolvedValueOnce(response);

      const envio = emailService.enviarCodigoRecuperacao(
        'ana@exemplo.test',
        '123456',
      );

      if (status === 200) {
        await expect(envio).resolves.toBeUndefined();
      } else {
        await expect(envio).rejects.toMatchObject({
          statusCode: 500,
          message: SEND_ERROR_MESSAGE,
        });
      }

      expect(cancelMock).toHaveBeenCalledTimes(1);
      expect(jsonMock).not.toHaveBeenCalled();
      expect(textMock).not.toHaveBeenCalled();
    },
  );

  it('usa o e-mail normalizado pela regra compartilhada de validação', async () => {
    await emailService.enviarCodigoRecuperacao(
      '  Ana@Exemplo.TEST  ',
      '123456',
    );

    expect(getRequest().body).toMatchObject({ to: ['ana@exemplo.test'] });
  });

  it('limita a duração da chamada ao provedor a dez segundos', async () => {
    const signal = AbortSignal.abort();
    const timeoutMock = jest
      .spyOn(AbortSignal, 'timeout')
      .mockReturnValue(signal);

    try {
      await emailService.enviarCodigoRecuperacao('ana@exemplo.test', '123456');

      expect(timeoutMock).toHaveBeenCalledWith(10_000);
      expect(getRequest().options.signal).toBe(signal);
    } finally {
      timeoutMock.mockRestore();
    }
  });

  it.each([400, 401, 403, 429, 500, 503])(
    'converte a resposta HTTP %i em erro genérico sem expor os dados do provedor',
    async (status) => {
      const detalheInterno = 'detalhe-interno-do-provedor';
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: detalheInterno,
            apiKey: EMAIL_CONFIG.EMAIL_API_KEY,
            codigo: '123456',
          }),
          { status },
        ),
      );

      const envio = emailService.enviarCodigoRecuperacao(
        'ana@exemplo.test',
        '123456',
      );

      await expect(envio).rejects.toBeInstanceOf(AppError);
      await expect(envio).rejects.toMatchObject({
        statusCode: 500,
        message: SEND_ERROR_MESSAGE,
        details: undefined,
      });
      expectNoSensitiveLogs([
        detalheInterno,
        EMAIL_CONFIG.EMAIL_API_KEY,
        '123456',
      ]);
    },
  );

  it('converte falha de rede em erro genérico sem expor a mensagem interna', async () => {
    const detalheInterno = 'detalhe-interno-da-conexao';
    fetchMock.mockRejectedValueOnce(
      new Error(`${detalheInterno}: ${EMAIL_CONFIG.EMAIL_API_KEY}`),
    );

    const envio = emailService.enviarCodigoRecuperacao(
      'ana@exemplo.test',
      '123456',
    );

    await expect(envio).rejects.toBeInstanceOf(AppError);
    await expect(envio).rejects.toMatchObject({
      statusCode: 500,
      message: SEND_ERROR_MESSAGE,
      details: undefined,
    });
    expectNoSensitiveLogs([
      detalheInterno,
      EMAIL_CONFIG.EMAIL_API_KEY,
      '123456',
    ]);
  });

  it('converte o encerramento por timeout em erro genérico', async () => {
    const signal = AbortSignal.abort(
      new DOMException('Tempo de envio esgotado.', 'TimeoutError'),
    );
    const timeoutMock = jest
      .spyOn(AbortSignal, 'timeout')
      .mockReturnValue(signal);
    fetchMock.mockRejectedValueOnce(signal.reason);

    try {
      const envio = emailService.enviarCodigoRecuperacao(
        'ana@exemplo.test',
        '123456',
      );

      await expect(envio).rejects.toBeInstanceOf(AppError);
      await expect(envio).rejects.toMatchObject({
        statusCode: 500,
        message: SEND_ERROR_MESSAGE,
      });
      expect(getRequest().options.signal).toBe(signal);
      expectNoSensitiveLogs([EMAIL_CONFIG.EMAIL_API_KEY, '123456']);
    } finally {
      timeoutMock.mockRestore();
    }
  });

  it.each([
    '',
    '12345',
    '1234567',
    'abcdef',
    '12 456',
    '123456\n',
    ' 123456 ',
    '１２３４５６',
    '<script>alert(1)</script>',
  ])(
    'recusa o código malformado %j antes de chamar o provedor',
    async (codigo) => {
      await expect(
        emailService.enviarCodigoRecuperacao('ana@exemplo.test', codigo),
      ).rejects.toThrow();

      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each([
    '',
    'sem-arroba',
    'ana@exemplo.test\r\nBcc: outro@exemplo.test',
    '<script>@exemplo.test',
  ])(
    'recusa o destinatário inválido %j antes de chamar o provedor',
    async (email) => {
      await expect(
        emailService.enviarCodigoRecuperacao(email, '123456'),
      ).rejects.toThrow();

      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
});
