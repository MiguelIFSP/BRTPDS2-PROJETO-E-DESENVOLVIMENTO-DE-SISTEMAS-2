import { beforeEach, describe, expect, jest, test } from '@jest/globals';

const sendMail = jest.fn();
const env = {
  GMAIL_USER: 'bettermeet@example.test',
  GMAIL_APP_PASSWORD: 'senha-de-app-ficticia',
  MAIL_FROM_NAME: 'Better Meet',
};
jest.unstable_mockModule('nodemailer', () => ({
  default: { createTransport: () => ({ sendMail }) },
}));
jest.unstable_mockModule('../src/config/env.ts', () => ({ env }));
const { AppError } = await import('../src/errors/AppError.ts');
const { emailService } = await import('../src/services/emailService.ts');

const MENSAGEM_ERRO =
  'Não foi possível enviar o código de recuperação. Tente novamente mais tarde.';

const consoleError = jest.spyOn(console, 'error');
const consoleWarn = jest.spyOn(console, 'warn');
const consoleLog = jest.spyOn(console, 'log');

const mensagemEnviada = () => sendMail.mock.calls[0][0];

// Nada do que vai para o log pode conter o código ou a senha de app.
const expectSemDadosSensiveis = (valores) => {
  const registros = [
    ...consoleError.mock.calls,
    ...consoleWarn.mock.calls,
    ...consoleLog.mock.calls,
  ]
    .flat()
    .map((valor) =>
      valor instanceof Error ? valor.message : JSON.stringify(valor),
    )
    .join('\n');
  for (const valor of valores) expect(registros).not.toContain(valor);
};

beforeEach(() => {
  jest.resetAllMocks();
  consoleError.mockImplementation(() => {});
  consoleWarn.mockImplementation(() => {});
  consoleLog.mockImplementation(() => {});
  sendMail.mockResolvedValue({});
  env.GMAIL_USER = 'bettermeet@example.test';
  env.GMAIL_APP_PASSWORD = 'senha-de-app-ficticia';
});

describe('emailService.enviarCodigoRecuperacao', () => {
  test('envia o código pela conta do Gmail configurada', async () => {
    await expect(
      emailService.enviarCodigoRecuperacao('ana@exemplo.test', '123456'),
    ).resolves.toBeUndefined();

    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(mensagemEnviada()).toEqual({
      from: { name: 'Better Meet', address: 'bettermeet@example.test' },
      to: 'ana@exemplo.test',
      subject: expect.any(String),
      html: expect.stringContaining('123456'),
      text: expect.stringContaining('123456'),
    });
    expectSemDadosSensiveis([env.GMAIL_APP_PASSWORD, '123456']);
  });

  test('preserva os zeros iniciais do código no HTML e no texto', async () => {
    await emailService.enviarCodigoRecuperacao('ana@exemplo.test', '001234');

    expect(mensagemEnviada()).toMatchObject({
      html: expect.stringContaining('001234'),
      text: expect.stringContaining('001234'),
    });
  });

  test('usa o e-mail normalizado pela regra compartilhada de validação', async () => {
    await emailService.enviarCodigoRecuperacao(
      '  Ana@Exemplo.TEST  ',
      '123456',
    );

    expect(mensagemEnviada()).toMatchObject({ to: 'ana@exemplo.test' });
  });

  test('converte falha do envio em erro genérico sem expor a mensagem interna', async () => {
    const detalheInterno = 'detalhe-interno-da-conexao';
    sendMail.mockRejectedValueOnce(
      new Error(`${detalheInterno}: ${env.GMAIL_APP_PASSWORD}`),
    );

    const envio = emailService.enviarCodigoRecuperacao(
      'ana@exemplo.test',
      '123456',
    );

    await expect(envio).rejects.toBeInstanceOf(AppError);
    await expect(envio).rejects.toMatchObject({
      statusCode: 500,
      message: MENSAGEM_ERRO,
      details: undefined,
    });
    expectSemDadosSensiveis([detalheInterno, env.GMAIL_APP_PASSWORD, '123456']);
  });

  test('recusa com erro genérico quando o e-mail está desligado', async () => {
    env.GMAIL_USER = undefined;
    env.GMAIL_APP_PASSWORD = undefined;

    await expect(
      emailService.enviarCodigoRecuperacao('ana@exemplo.test', '123456'),
    ).rejects.toMatchObject({ statusCode: 500, message: MENSAGEM_ERRO });
    expect(sendMail).not.toHaveBeenCalled();
  });

  test.each([
    '',
    '12345',
    '1234567',
    'abcdef',
    '12 456',
    '123456\n',
    ' 123456 ',
    '１２３４５６',
    '<script>alert(1)</script>',
  ])('recusa o código malformado %j antes de enviar', async (codigo) => {
    await expect(
      emailService.enviarCodigoRecuperacao('ana@exemplo.test', codigo),
    ).rejects.toThrow();

    expect(sendMail).not.toHaveBeenCalled();
  });

  test.each([
    '',
    'sem-arroba',
    'ana@exemplo.test\r\nBcc: outro@exemplo.test',
    '<script>@exemplo.test',
  ])('recusa o destinatário inválido %j antes de enviar', async (email) => {
    await expect(
      emailService.enviarCodigoRecuperacao(email, '123456'),
    ).rejects.toThrow();

    expect(sendMail).not.toHaveBeenCalled();
  });
});
