import { afterAll, beforeEach, describe, expect, test } from '@jest/globals';
import { bancoDisponivel, prepararAmbiente } from './ambienteIntegracao.mjs';

const describeBanco = bancoDisponivel() ? describe : describe.skip;

describeBanco(
  'cadastro, e-mail confirmado, login e logout (Better Auth real)',
  () => {
    let ambiente;
    beforeEach(async () => {
      ambiente ??= await prepararAmbiente();
      ambiente.enviados.length = 0;
    });
    afterAll(async () => {
      await ambiente?.encerrar();
    });

    const cadastrar = (email, extra = {}) =>
      ambiente.api('post', '/api/auth/sign-up/email', {
        corpo: { name: 'Ana Souza', email, password: 'Senha123', ...extra },
      });

    // O link de confirmação sai no e-mail; o teste o consome como o navegador faria.
    const urlDaVerificacao = () =>
      ambiente.enviados.find((e) => e.tipo === 'verificacao').extras[0];
    const caminhoDe = (url) => new URL(url).pathname + new URL(url).search;

    test('cadastro cria User USER sem e-mail confirmado, credencial em scrypt e nenhuma sessão', async () => {
      const email = ambiente.emailDe('novo');

      const resposta = await cadastrar(email);
      await ambiente.aguardarEmails();

      expect(resposta.status).toBe(200);
      expect(resposta.body.token ?? null).toBeNull();
      const user = await ambiente.prisma.user.findUnique({ where: { email } });
      expect(user).toMatchObject({
        role: 'USER',
        emailVerified: false,
        themePreference: 'system',
      });
      const conta = await ambiente.prisma.account.findFirst({
        where: { userId: user.id },
      });
      expect(conta.providerId).toBe('credential');
      expect(conta.password).toMatch(/^[a-f0-9]+:[a-f0-9]+$/);
      expect(
        await ambiente.prisma.session.count({ where: { userId: user.id } }),
      ).toBe(0);
      expect(ambiente.enviados.filter((e) => e.tipo === 'verificacao')).toEqual(
        [expect.objectContaining({ para: email })],
      );
    });

    test('cadastro com role no corpo é recusado e nada é criado (o cliente não define o role)', async () => {
      const email = ambiente.emailDe('comrole');

      const resposta = await cadastrar(email, { role: 'ADMIN' });

      expect(resposta.status).toBe(400);
      expect(resposta.body.error).toBe('Campo não permitido.');
      expect(await ambiente.prisma.user.count({ where: { email } })).toBe(0);
    });

    test('cadastro com e-mail repetido responde igual e avisa o dono', async () => {
      const email = ambiente.emailDe('repetido');
      const primeira = await cadastrar(email);
      await ambiente.aguardarEmails();
      ambiente.enviados.length = 0;

      const segunda = await cadastrar(email);
      await ambiente.aguardarEmails();

      expect(segunda.status).toBe(primeira.status);
      // a resposta não pode denunciar que a conta já existia: mesmos campos e
      // mesmos valores de role, tema e formato do id.
      expect(Object.keys(segunda.body).sort()).toEqual(
        Object.keys(primeira.body).sort(),
      );
      const { id: idPrimeira, ...restoPrimeira } = primeira.body.user;
      const { id: idSegunda, ...restoSegunda } = segunda.body.user;
      expect(Object.keys(restoSegunda).sort()).toEqual(
        Object.keys(restoPrimeira).sort(),
      );
      expect(restoSegunda).toMatchObject({
        role: 'USER',
        themePreference: 'system',
        emailVerified: false,
      });
      expect(idPrimeira).toMatch(/^\d+$/);
      expect(idSegunda).toMatch(/^\d+$/);
      expect(ambiente.enviados).toEqual([
        expect.objectContaining({ tipo: 'cadastroExistente', para: email }),
      ]);
      expect(await ambiente.prisma.user.count({ where: { email } })).toBe(1);
    });

    test.each([
      ['nome curto', { name: 'A' }, /nome/i],
      ['senha sem maiúscula', { password: 'senha1234' }, /maiúscula/],
      ['senha curta', { password: 'Ab1' }, /8 caracteres/],
    ])('cadastro recusa %s em pt-BR (400)', async (_caso, extra, mensagem) => {
      const resposta = await cadastrar(ambiente.emailDe('invalido'), extra);

      expect(resposta.status).toBe(400);
      expect(resposta.body.error).toMatch(mensagem);
    });

    test('login de conta não confirmada: 403, mensagem em pt-BR e reenvio do link', async () => {
      const email = ambiente.emailDe('naoconfirmada');
      await ambiente.criarConta({ email, confirmada: false });

      const { resposta } = await ambiente.entrar(email);
      await ambiente.aguardarEmails();

      expect(resposta.status).toBe(403);
      expect(resposta.body.code).toBe('EMAIL_NOT_VERIFIED');
      expect(resposta.body.error).toBe(
        'Confirme seu e-mail para entrar. Enviamos um novo link.',
      );
      expect(ambiente.enviados).toEqual([
        expect.objectContaining({ tipo: 'verificacao', para: email }),
      ]);
    });

    test('o link confirma o e-mail, e o login passa a funcionar; segundo uso do link falha', async () => {
      const email = ambiente.emailDe('confirma');
      await cadastrar(email);
      await ambiente.aguardarEmails();
      const caminho = caminhoDe(urlDaVerificacao());

      const primeiro = await ambiente.api('get', caminho);
      expect(primeiro.status).toBeLessThan(400);
      expect(
        (await ambiente.prisma.user.findUnique({ where: { email } }))
          .emailVerified,
      ).toBe(true);

      const { resposta, bearer } = await ambiente.entrar(email);
      expect(resposta.status).toBe(200);
      expect(bearer).toBeTruthy();

      // o token de verificação é um JWT sem estado: o segundo uso só repete o
      // efeito (já confirmado) e não cria nenhuma conta nem sessão nova.
      const segundo = await ambiente.api('get', caminho);
      expect(segundo.status).toBeLessThan(500);
    });

    test('link de confirmação adulterado redireciona com erro e não confirma', async () => {
      const email = ambiente.emailDe('adulterado');
      await cadastrar(email);
      await ambiente.aguardarEmails();
      const caminho = caminhoDe(urlDaVerificacao()).replace(
        'token=',
        'token=x',
      );

      const resposta = await ambiente.api('get', caminho);

      expect(resposta.status).toBe(302);
      expect(resposta.headers.location).toMatch(/error=invalid_token/i);
      expect(
        (await ambiente.prisma.user.findUnique({ where: { email } }))
          .emailVerified,
      ).toBe(false);
    });

    test('login por e-mail devolve token no corpo e set-auth-token no cabeçalho', async () => {
      const email = ambiente.emailDe('login');
      await ambiente.criarConta({ email });

      const { resposta, bearer } = await ambiente.entrar(email);

      expect(resposta.status).toBe(200);
      expect(resposta.body.token).toEqual(expect.any(String));
      expect(bearer).toEqual(expect.any(String));
      expect(resposta.body.user.email).toBe(email);
      expect(JSON.stringify(resposta.body)).not.toMatch(/password/i);
    });

    test('login pelo nome do usuário falha (só o e-mail identifica)', async () => {
      const email = ambiente.emailDe('pelonome');
      await ambiente.criarConta({ nome: 'Fulano Unico Teste', email });

      const resposta = await ambiente.api('post', '/api/auth/sign-in/email', {
        corpo: { email: 'Fulano Unico Teste', password: 'Senha123' },
      });

      expect(resposta.status).toBe(400);
    });

    test('com o limite de tentativas desligado (desenvolvimento) não há 429', async () => {
      const email = ambiente.emailDe('semlimite');
      await ambiente.criarConta({ email });
      const ip = ambiente.novoIp();

      for (let i = 0; i < 8; i += 1) {
        const resposta = await ambiente.api('post', '/api/auth/sign-in/email', {
          ip,
          corpo: { email, password: 'Errada123' },
        });
        expect(resposta.status).toBe(401);
      }
    });

    test('senha errada responde 401 genérico', async () => {
      const email = ambiente.emailDe('errada');
      await ambiente.criarConta({ email });

      const { resposta } = await ambiente.entrar(email, 'Errada123');

      expect(resposta.status).toBe(401);
      expect(resposta.body.error).toBe('E-mail ou senha inválidos.');
    });

    test('reenvio de verificação responde igual para existente, inexistente e já confirmado', async () => {
      const pendente = ambiente.emailDe('reenvio1');
      const confirmado = ambiente.emailDe('reenvio2');
      await ambiente.criarConta({ email: pendente, confirmada: false });
      await ambiente.criarConta({ email: confirmado });
      const reenviar = (email) =>
        ambiente.api('post', '/api/auth/send-verification-email', {
          corpo: { email },
        });

      const respostas = [
        await reenviar(pendente),
        await reenviar(confirmado),
        await reenviar(ambiente.emailDe('inexistente')),
      ];

      expect(new Set(respostas.map((r) => r.status))).toEqual(new Set([200]));
      expect(new Set(respostas.map((r) => JSON.stringify(r.body))).size).toBe(
        1,
      );
    });

    test('logout invalida a sessão e é idempotente', async () => {
      const email = ambiente.emailDe('logout');
      await ambiente.criarConta({ email });
      const { bearer } = await ambiente.entrar(email);
      expect(
        (await ambiente.api('get', '/api/usuarios/me', { bearer })).status,
      ).toBe(200);

      const saida = await ambiente.api('post', '/api/auth/sign-out', {
        bearer,
        corpo: {},
      });
      expect(saida.status).toBe(200);

      expect(
        (await ambiente.api('get', '/api/usuarios/me', { bearer })).status,
      ).toBe(401);
      const outra = await ambiente.api('post', '/api/auth/sign-out', {
        bearer,
        corpo: {},
      });
      expect(outra.status).toBeLessThan(500);
    });

    test('GET /usuarios/me com o token do login devolve o perfil', async () => {
      const email = ambiente.emailDe('me');
      await ambiente.criarConta({ email, nome: 'Perfil Teste' });
      const { bearer } = await ambiente.entrar(email);

      const resposta = await ambiente.api('get', '/api/usuarios/me', {
        bearer,
      });

      expect(resposta.status).toBe(200);
      expect(resposta.body).toMatchObject({
        name: 'Perfil Teste',
        email,
        role: 'USER',
        emailVerified: true,
      });
      expect(JSON.stringify(resposta.body)).not.toMatch(/password|token/i);
    });

    test('sem GOOGLE_CLIENT_ID/SECRET o login social responde 404 em pt-BR', async () => {
      const resposta = await ambiente.api('post', '/api/auth/sign-in/social', {
        corpo: { provider: 'google' },
      });

      expect(resposta.status).toBe(404);
      expect(resposta.body.error).toBe('Rota não encontrada.');
    });
  },
);
