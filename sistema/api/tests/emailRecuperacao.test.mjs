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
const { emailService } = await import('../src/services/emailService.ts');

const consoleError = jest.spyOn(console, 'error');
const consoleWarn = jest.spyOn(console, 'warn');
const consoleLog = jest.spyOn(console, 'log');

const ana = { nome: 'Ana', email: 'ana@exemplo.test' };
const CODIGO = '482915';

const mensagemEnviada = () => sendMail.mock.calls[0][0];

// Nada do que vai para o log pode conter o código nem a senha de app.
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

describe('emailService.enviarRedefinicaoSenha', () => {
  test('traz o código em destaque, sem botão nem link, pela conta do Gmail configurada', async () => {
    await expect(
      emailService.enviarRedefinicaoSenha(ana, CODIGO),
    ).resolves.toBe(true);

    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(mensagemEnviada()).toMatchObject({
      from: { name: 'Better Meet', address: 'bettermeet@example.test' },
      to: { name: 'Ana', address: 'ana@exemplo.test' },
      text: expect.stringContaining(CODIGO),
    });
    expect(mensagemEnviada().html).toContain(`>${CODIGO}<`);
    expect(mensagemEnviada().html).not.toContain('href=');
    expect(mensagemEnviada().text).not.toMatch(/https?:\/\//);
    expect(mensagemEnviada().text).toContain('15 minutos');
    expect(mensagemEnviada().text).toMatch(/app/);
  });

  test('não traz senha nenhuma e não grava dados sensíveis no log', async () => {
    await emailService.enviarRedefinicaoSenha(ana, CODIGO);

    expect(mensagemEnviada().text).not.toMatch(/senha (é|nova):/i);
    expectSemDadosSensiveis([env.GMAIL_APP_PASSWORD, CODIGO]);
  });

  test('falha do envio não lança e não expõe o erro do provedor', async () => {
    const detalheInterno = 'detalhe-interno-da-conexao';
    sendMail.mockRejectedValueOnce(
      new Error(`${detalheInterno}: ${env.GMAIL_APP_PASSWORD}`),
    );

    await expect(
      emailService.enviarRedefinicaoSenha(ana, CODIGO),
    ).resolves.toBe(false);
  });

  test('com o e-mail desligado não lança no caminho assíncrono', async () => {
    env.GMAIL_USER = undefined;
    env.GMAIL_APP_PASSWORD = undefined;
    const envio = jest.fn();

    expect(() => emailService.runInBackground(envio)).not.toThrow();
    await expect(
      emailService.enviarRedefinicaoSenha(ana, CODIGO),
    ).resolves.toBe(false);
    expect(envio).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });
});

describe('demais e-mails de conta', () => {
  test('a confirmação de e-mail traz o link e a validade de 1 hora', async () => {
    await emailService.enviarVerificacaoEmail(ana, 'http://api.test/v?token=1');

    expect(mensagemEnviada().html).toContain('http://api.test/v?token=1');
    expect(mensagemEnviada().text).toContain('1 hora');
  });

  test('o link do e-mail é escapado no HTML', async () => {
    await emailService.enviarVerificacaoEmail(
      ana,
      'http://api.test/v?a=1&b="2"',
    );

    expect(mensagemEnviada().html).toContain('a=1&amp;b=&quot;2&quot;');
  });

  test('conta só com Google recebe aviso sem link de senha', async () => {
    await emailService.enviarRedefinicaoContaSocial(ana);

    expect(mensagemEnviada().text).toContain('Google');
    expect(mensagemEnviada().html).not.toContain('href=');
  });

  test('aviso de senha alterada e de cadastro existente são enviados ao dono', async () => {
    await emailService.enviarAvisoSenhaAlterada(ana);
    await emailService.enviarAvisoCadastroExistente(ana);

    expect(sendMail).toHaveBeenCalledTimes(2);
    expect(sendMail.mock.calls[0][0].subject).toMatch(/senha foi alterada/);
    expect(sendMail.mock.calls[1][0].to.address).toBe('ana@exemplo.test');
  });
});
