import { afterAll, beforeEach, describe, expect, test } from '@jest/globals';
import { bancoDisponivel, prepararAmbiente } from './ambienteIntegracao.mjs';

const describeBanco = bancoDisponivel() ? describe : describe.skip;

describeBanco('recuperação de senha com token (Better Auth real)', () => {
  let ambiente;
  let contador = 0;
  beforeEach(async () => {
    ambiente ??= await prepararAmbiente();
    ambiente.enviados.length = 0;
  });
  afterAll(async () => {
    await ambiente?.encerrar();
  });

  const novoEmail = (nome) => ambiente.emailDe(`${nome}${++contador}`);
  const pedir = (email) =>
    ambiente.api('post', '/api/auth/request-password-reset', {
      corpo: { email },
    });
  const redefinir = (corpo) =>
    ambiente.api('post', '/api/auth/reset-password', { corpo });
  // o token sai no e-mail, em texto, como o app o receberia para colar.
  const tokenDoEmail = () =>
    ambiente.enviados.find((e) => e.tipo === 'redefinicao').extras[1];
  const senhaGravada = async (userId) =>
    (
      await ambiente.prisma.account.findFirst({
        where: { userId, providerId: 'credential' },
      })
    ).password;

  test('pedido de conta existente e de inexistente devolve corpo e status idênticos', async () => {
    const existente = novoEmail('existe');
    await ambiente.criarConta({ email: existente });

    const a = await pedir(existente);
    const b = await pedir(novoEmail('naoexiste'));
    await ambiente.aguardarEmails();

    expect(a.status).toBe(b.status);
    expect(a.body).toEqual(b.body);
    expect(ambiente.enviados).toEqual([
      expect.objectContaining({ tipo: 'redefinicao', para: existente }),
    ]);
  });

  test('token válido redefine a senha em scrypt; o segundo uso falha', async () => {
    const email = novoEmail('redefine');
    const user = await ambiente.criarConta({ email });
    await pedir(email);
    await ambiente.aguardarEmails();
    const token = tokenDoEmail();

    const primeira = await redefinir({ token, newPassword: 'Nova12345' });
    await ambiente.aguardarEmails();
    const segunda = await redefinir({ token, newPassword: 'Outra12345' });

    expect(primeira.status).toBe(200);
    expect(await senhaGravada(user.id)).toMatch(/^[a-f0-9]+:[a-f0-9]+$/);
    expect(segunda.status).toBe(400);
    expect(segunda.body.error).toBe('Link ou código inválido ou expirado.');
    expect((await ambiente.entrar(email, 'Nova12345')).resposta.status).toBe(
      200,
    );
    expect((await ambiente.entrar(email, 'Outra12345')).resposta.status).toBe(
      401,
    );
  });

  test('redefinir revoga as sessões abertas e envia o aviso de senha alterada', async () => {
    const email = novoEmail('revoga');
    await ambiente.criarConta({ email });
    const { bearer } = await ambiente.entrar(email);
    await pedir(email);
    await ambiente.aguardarEmails();

    await redefinir({ token: tokenDoEmail(), newPassword: 'Nova12345' });
    await ambiente.aguardarEmails();

    expect(
      (await ambiente.api('get', '/api/usuarios/me', { bearer })).status,
    ).toBe(401);
    expect(ambiente.enviados.map((e) => e.tipo)).toEqual([
      'redefinicao',
      'senhaAlterada',
    ]);
  });

  test('redefinição sem token é recusada (400) e não muda a senha', async () => {
    const email = novoEmail('semtoken');
    const user = await ambiente.criarConta({ email });
    const antes = await senhaGravada(user.id);

    const resposta = await redefinir({ newPassword: 'Nova12345' });

    expect(resposta.status).toBe(400);
    expect(await senhaGravada(user.id)).toBe(antes);
  });

  test('POST /api/auth/forgot-password não existe mais (404) e não altera a senha', async () => {
    const email = novoEmail('antiga');
    const user = await ambiente.criarConta({ email });
    const antes = await senhaGravada(user.id);

    const resposta = await ambiente.api('post', '/api/auth/forgot-password', {
      corpo: { email, newPassword: 'Nova12345' },
    });

    expect(resposta.status).toBe(404);
    expect(await senhaGravada(user.id)).toBe(antes);
  });

  test('token vencido é recusado', async () => {
    const email = novoEmail('vencido');
    await ambiente.criarConta({ email });
    await pedir(email);
    await ambiente.aguardarEmails();
    const token = tokenDoEmail();
    await ambiente.prisma.verification.updateMany({
      where: { identifier: `reset-password:${token}` },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const resposta = await redefinir({ token, newPassword: 'Nova12345' });

    expect(resposta.status).toBe(400);
    expect(resposta.body.error).toBe('Link ou código inválido ou expirado.');
  });

  test('o token vale 30 minutos', async () => {
    const email = novoEmail('validade');
    await ambiente.criarConta({ email });
    await pedir(email);
    await ambiente.aguardarEmails();

    const registro = await ambiente.prisma.verification.findFirst({
      where: { identifier: `reset-password:${tokenDoEmail()}` },
    });

    const minutos = (registro.expiresAt.getTime() - Date.now()) / 60_000;
    expect(minutos).toBeGreaterThan(29);
    expect(minutos).toBeLessThanOrEqual(30);
  });

  test('senha fraca na redefinição responde 400 e o token continua valendo', async () => {
    const email = novoEmail('fraca');
    await ambiente.criarConta({ email });
    await pedir(email);
    await ambiente.aguardarEmails();
    const token = tokenDoEmail();

    const fraca = await redefinir({ token, newPassword: 'fraca' });
    const forte = await redefinir({ token, newPassword: 'Nova12345' });

    expect(fraca.status).toBe(400);
    expect(forte.status).toBe(200);
  });

  test('conta só com Google recebe aviso próprio, sem token e sem criar senha', async () => {
    const email = novoEmail('social');
    const user = await ambiente.prisma.user.create({
      data: { name: 'Social', email, emailVerified: true },
    });
    await ambiente.prisma.account.create({
      data: {
        userId: user.id,
        accountId: 'google-sub-123',
        providerId: 'google',
      },
    });

    await pedir(email);
    await ambiente.aguardarEmails();

    expect(ambiente.enviados).toEqual([
      expect.objectContaining({ tipo: 'redefinicaoSocial', para: email }),
    ]);
    expect(
      await ambiente.prisma.account.count({
        where: { userId: user.id, providerId: 'credential' },
      }),
    ).toBe(0);
  });
});
