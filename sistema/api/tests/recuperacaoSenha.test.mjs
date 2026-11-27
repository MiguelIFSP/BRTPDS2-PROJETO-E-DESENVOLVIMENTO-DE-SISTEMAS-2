import { afterAll, beforeEach, describe, expect, test } from '@jest/globals';
import { bancoDisponivel, prepararAmbiente } from './ambienteIntegracao.mjs';

const describeBanco = bancoDisponivel() ? describe : describe.skip;

describeBanco(
  'recuperação de senha com código de 6 dígitos (Better Auth real)',
  () => {
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
      ambiente.api('post', '/api/auth/email-otp/request-password-reset', {
        corpo: { email },
      });
    const redefinir = (corpo) =>
      ambiente.api('post', '/api/auth/email-otp/reset-password', { corpo });
    // o código sai no e-mail, em texto, para a pessoa digitar no app.
    const codigoDoEmail = () =>
      ambiente.enviados.find((e) => e.tipo === 'redefinicao').extras[0];
    const registroDoCodigo = (email) =>
      ambiente.prisma.verification.findFirst({
        where: { identifier: `forget-password-otp-${email}` },
      });
    const senhaGravada = async (userId) =>
      (
        await ambiente.prisma.account.findFirst({
          where: { userId, providerId: 'credential' },
        })
      ).password;
    const codigoErrado = (codigo) =>
      String((Number(codigo) + 1) % 1_000_000).padStart(6, '0');

    const pedirCodigo = async (email) => {
      await pedir(email);
      await ambiente.aguardarEmails();
      return codigoDoEmail();
    };

    test('pedido de conta existente e de inexistente devolve corpo e status idênticos', async () => {
      const existente = novoEmail('existe');
      await ambiente.criarConta({ email: existente });

      const a = await pedir(existente);
      const b = await pedir(novoEmail('naoexiste'));
      await ambiente.aguardarEmails();

      expect(a.status).toBe(200);
      expect(a.status).toBe(b.status);
      expect(a.body).toEqual(b.body);
      expect(ambiente.enviados).toEqual([
        expect.objectContaining({ tipo: 'redefinicao', para: existente }),
      ]);
    });

    test('o código tem 6 dígitos, vale 15 minutos e é guardado com hash', async () => {
      const email = novoEmail('formato');
      await ambiente.criarConta({ email });

      const codigo = await pedirCodigo(email);
      const registro = await registroDoCodigo(email);

      expect(codigo).toMatch(/^\d{6}$/);
      expect(registro.value).not.toContain(codigo);
      const minutos = (registro.expiresAt.getTime() - Date.now()) / 60_000;
      expect(minutos).toBeGreaterThan(14);
      expect(minutos).toBeLessThanOrEqual(15);
    });

    test('código válido redefine a senha em scrypt; o segundo uso falha', async () => {
      const email = novoEmail('redefine');
      const user = await ambiente.criarConta({ email });
      const otp = await pedirCodigo(email);

      const primeira = await redefinir({ email, otp, password: 'Nova12345' });
      await ambiente.aguardarEmails();
      const segunda = await redefinir({ email, otp, password: 'Outra12345' });

      expect(primeira.status).toBe(200);
      expect(await senhaGravada(user.id)).toMatch(/^[a-f0-9]+:[a-f0-9]+$/);
      expect(segunda.status).toBe(400);
      expect(segunda.body.error).toBe('Código inválido ou expirado.');
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
      const otp = await pedirCodigo(email);

      await redefinir({ email, otp, password: 'Nova12345' });
      await ambiente.aguardarEmails();

      expect(
        (await ambiente.api('get', '/api/usuarios/me', { bearer })).status,
      ).toBe(401);
      expect(ambiente.enviados.map((e) => e.tipo)).toEqual([
        'redefinicao',
        'senhaAlterada',
      ]);
    });

    test('redefinição sem código é recusada (400) e não muda a senha', async () => {
      const email = novoEmail('semcodigo');
      const user = await ambiente.criarConta({ email });
      const antes = await senhaGravada(user.id);

      const resposta = await redefinir({ email, password: 'Nova12345' });

      expect(resposta.status).toBe(400);
      expect(resposta.body.error).toBe('Informe o código de 6 dígitos.');
      expect(await senhaGravada(user.id)).toBe(antes);
    });

    test('o código de uma conta não troca a senha de outra', async () => {
      const dona = novoEmail('dona');
      const outra = novoEmail('outra');
      await ambiente.criarConta({ email: dona });
      const user = await ambiente.criarConta({ email: outra });
      const antes = await senhaGravada(user.id);
      const otp = await pedirCodigo(dona);

      const resposta = await redefinir({
        email: outra,
        otp,
        password: 'Nova12345',
      });

      expect(resposta.status).toBe(400);
      expect(await senhaGravada(user.id)).toBe(antes);
    });

    test('três códigos errados invalidam o código, mesmo o certo depois', async () => {
      const email = novoEmail('tentativas');
      const user = await ambiente.criarConta({ email });
      const antes = await senhaGravada(user.id);
      const otp = await pedirCodigo(email);

      for (let i = 0; i < 3; i += 1) {
        const errada = await redefinir({
          email,
          otp: codigoErrado(otp),
          password: 'Nova12345',
        });
        expect(errada.status).toBe(400);
        expect(errada.body.code).toBe('INVALID_OTP');
      }
      const certa = await redefinir({ email, otp, password: 'Nova12345' });

      expect(certa.status).toBe(403);
      expect(certa.body.code).toBe('TOO_MANY_ATTEMPTS');
      expect(certa.body.error).toBe(
        'Muitas tentativas com este código. Peça um novo código.',
      );
      expect(await senhaGravada(user.id)).toBe(antes);
    });

    test('um novo pedido substitui o código anterior', async () => {
      const email = novoEmail('novopedido');
      await ambiente.criarConta({ email });
      const primeiro = await pedirCodigo(email);
      ambiente.enviados.length = 0;
      const segundo = await pedirCodigo(email);

      if (primeiro !== segundo) {
        const antigo = await redefinir({
          email,
          otp: primeiro,
          password: 'Nova12345',
        });
        expect(antigo.status).toBe(400);
      }
      const novo = await redefinir({
        email,
        otp: segundo,
        password: 'Nova12345',
      });
      expect(novo.status).toBe(200);
    });

    test('código vencido é recusado', async () => {
      const email = novoEmail('vencido');
      await ambiente.criarConta({ email });
      const otp = await pedirCodigo(email);
      await ambiente.prisma.verification.updateMany({
        where: { identifier: `forget-password-otp-${email}` },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      const resposta = await redefinir({ email, otp, password: 'Nova12345' });

      expect(resposta.status).toBe(400);
      expect(resposta.body.code).toBe('OTP_EXPIRED');
      expect(resposta.body.error).toBe('Código inválido ou expirado.');
    });

    test('senha fraca na redefinição responde 400 e o código continua valendo', async () => {
      const email = novoEmail('fraca');
      await ambiente.criarConta({ email });
      const otp = await pedirCodigo(email);

      const fraca = await redefinir({ email, otp, password: 'fraca' });
      const forte = await redefinir({ email, otp, password: 'Nova12345' });

      expect(fraca.status).toBe(400);
      expect(fraca.body.error).toMatch(/8 caracteres|maiúscula/);
      expect(forte.status).toBe(200);
    });

    test('conta só com Google recebe aviso próprio, sem código e sem criar senha', async () => {
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
      expect(await registroDoCodigo(email)).toBeNull();
      expect(
        await ambiente.prisma.account.count({
          where: { userId: user.id, providerId: 'credential' },
        }),
      ).toBe(0);
    });

    test.each([
      ['post', '/api/auth/request-password-reset'],
      ['post', '/api/auth/reset-password'],
      ['get', '/api/auth/reset-password/qualquer-token'],
      ['post', '/api/auth/forgot-password'],
      ['post', '/api/auth/forget-password/email-otp'],
      ['post', '/api/auth/sign-in/email-otp'],
      ['post', '/api/auth/email-otp/send-verification-otp'],
      ['post', '/api/auth/email-otp/check-verification-otp'],
      ['post', '/api/auth/email-otp/verify-email'],
      ['post', '/api/auth/email-otp/request-email-change'],
      ['post', '/api/auth/email-otp/change-email'],
    ])('%s %s não é usada e responde 404', async (metodo, caminho) => {
      const email = novoEmail('rota');
      await ambiente.criarConta({ email });

      const resposta = await ambiente.api(metodo, caminho, {
        corpo:
          metodo === 'post'
            ? {
                email,
                type: 'sign-in',
                otp: '123456',
                newPassword: 'Nova12345',
              }
            : undefined,
      });
      await ambiente.aguardarEmails();

      expect(resposta.status).toBe(404);
      expect(resposta.body.error).toBe('Rota não encontrada.');
      expect(ambiente.enviados).toEqual([]);
    });
  },
);
