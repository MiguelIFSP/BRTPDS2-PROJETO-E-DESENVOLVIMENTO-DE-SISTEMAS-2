import { createHash } from 'node:crypto';
import { afterAll, beforeEach, describe, expect, test } from '@jest/globals';
import { bancoDisponivel, prepararAmbiente } from './ambienteIntegracao.mjs';

const describeBanco = bancoDisponivel() ? describe : describe.skip;
const sha256 = (senha) => createHash('sha256').update(senha).digest('hex');

describeBanco(
  'senha legada, troca de senha e de e-mail (Better Auth real)',
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
    const senhaGravada = async (userId) =>
      (
        await ambiente.prisma.account.findFirst({
          where: { userId, providerId: 'credential' },
        })
      ).password;

    test('conta com SHA-256 entra e passa a ter scrypt; o segundo login usa scrypt', async () => {
      const email = novoEmail('legada');
      const user = await ambiente.criarConta({
        email,
        hash: sha256('Senha123'),
      });
      expect(await senhaGravada(user.id)).toMatch(/^[a-f0-9]{64}$/);

      const primeiro = await ambiente.entrar(email);
      expect(primeiro.resposta.status).toBe(200);
      const regravada = await senhaGravada(user.id);
      expect(regravada).toMatch(/^[a-f0-9]+:[a-f0-9]+$/);

      const segundo = await ambiente.entrar(email);
      expect(segundo.resposta.status).toBe(200);
      expect(await senhaGravada(user.id)).toBe(regravada);
    });

    test('senha errada em conta legada recusa e não altera Account.password', async () => {
      const email = novoEmail('legadaerrada');
      const user = await ambiente.criarConta({
        email,
        hash: sha256('Senha123'),
      });

      const { resposta } = await ambiente.entrar(email, 'Errada123');

      expect(resposta.status).toBe(401);
      expect(await senhaGravada(user.id)).toBe(sha256('Senha123'));
    });

    test('a mesma senha gera hashes diferentes em duas contas', async () => {
      const a = await ambiente.criarConta({ email: novoEmail('sal') });
      const b = await ambiente.criarConta({ email: novoEmail('sal') });

      expect(await senhaGravada(a.id)).not.toBe(await senhaGravada(b.id));
    });

    describe('PATCH /usuarios/:id/senha', () => {
      let user;
      let email;
      let bearer;
      beforeEach(async () => {
        email = novoEmail('troca');
        user = await ambiente.criarConta({ email });
        ({ bearer } = await ambiente.entrar(email));
      });

      const trocar = (token, corpo) =>
        ambiente.api('patch', `/api/usuarios/${user.id}/senha`, {
          bearer: token,
          corpo,
        });

      test('senha atual errada responde 401', async () => {
        const resposta = await trocar(bearer, {
          currentPassword: 'Errada123',
          newPassword: 'Nova12345',
        });

        expect(resposta.status).toBe(401);
        expect(resposta.body.error).toBe('Senha atual incorreta.');
      });

      test('nova senha igual à atual responde 400', async () => {
        const resposta = await trocar(bearer, {
          currentPassword: 'Senha123',
          newPassword: 'Senha123',
        });

        expect(resposta.status).toBe(400);
        expect(resposta.body.error).toBe(
          'A nova senha deve ser diferente da atual.',
        );
      });

      test('nova senha fraca responde 400', async () => {
        const resposta = await trocar(bearer, {
          currentPassword: 'Senha123',
          newPassword: 'fraca',
        });

        expect(resposta.status).toBe(400);
      });

      test('sucesso grava scrypt, encerra as outras sessões e avisa por e-mail', async () => {
        const outra = (await ambiente.entrar(email)).bearer;
        expect(
          (await ambiente.api('get', '/api/usuarios/me', { bearer: outra }))
            .status,
        ).toBe(200);

        const resposta = await trocar(bearer, {
          currentPassword: 'Senha123',
          newPassword: 'Nova12345',
        });
        await ambiente.aguardarEmails();

        expect(resposta.status).toBe(200);
        expect(resposta.body.message).toBe('Senha alterada com sucesso.');
        expect(
          (await ambiente.api('get', '/api/usuarios/me', { bearer: outra }))
            .status,
        ).toBe(401);
        // a sessão antiga também cai: o token novo vem na resposta e no cabeçalho.
        expect(
          (await ambiente.api('get', '/api/usuarios/me', { bearer })).status,
        ).toBe(401);
        expect(resposta.body.token).toEqual(expect.any(String));
        expect(resposta.headers['set-auth-token']).toBe(resposta.body.token);
        expect(
          (
            await ambiente.api('get', '/api/usuarios/me', {
              bearer: resposta.body.token,
            })
          ).status,
        ).toBe(200);
        expect(
          (await ambiente.entrar(email, 'Nova12345')).resposta.status,
        ).toBe(200);
        expect((await ambiente.entrar(email, 'Senha123')).resposta.status).toBe(
          401,
        );
        expect(ambiente.enviados).toEqual([
          expect.objectContaining({ tipo: 'senhaAlterada', para: email }),
        ]);
      });

      test('sem sessão responde 401', async () => {
        const resposta = await trocar(undefined, {
          currentPassword: 'Senha123',
          newPassword: 'Nova12345',
        });

        expect(resposta.status).toBe(401);
      });
    });

    describe('PATCH /usuarios/:id (troca de e-mail)', () => {
      test('mantém o e-mail antigo até a confirmação e envia o link ao novo', async () => {
        const antigo = novoEmail('antigo');
        const novo = novoEmail('novo');
        const user = await ambiente.criarConta({ email: antigo });
        const { bearer } = await ambiente.entrar(antigo);

        const resposta = await ambiente.api(
          'patch',
          `/api/usuarios/${user.id}`,
          {
            bearer,
            corpo: { nome: 'Nome Novo', email: novo },
          },
        );
        await ambiente.aguardarEmails();

        expect(resposta.status).toBe(200);
        expect(resposta.body).toMatchObject({
          name: 'Nome Novo',
          email: antigo,
          emailConfirmacaoPendente: true,
        });
        expect(ambiente.enviados).toEqual([
          expect.objectContaining({ tipo: 'verificacao', para: novo }),
        ]);
        expect((await ambiente.entrar(antigo)).resposta.status).toBe(200);
        expect(
          await ambiente.prisma.user.count({ where: { email: novo } }),
        ).toBe(0);

        const link = new URL(ambiente.enviados[0].extras[0]);
        expect(link.searchParams.get('callbackURL')).toBe(
          'http://localhost:3333/api/conta/email-confirmado',
        );
        const confirmacao = await ambiente.api(
          'get',
          link.pathname + link.search,
        );
        expect(confirmacao.status).toBe(302);
        expect(confirmacao.headers.location).toBe(
          'http://localhost:3333/api/conta/email-confirmado',
        );
        expect(
          (await ambiente.prisma.user.findUnique({ where: { id: user.id } }))
            .email,
        ).toBe(novo);
      });

      test('e-mail de outra conta responde 409', async () => {
        const dono = novoEmail('dono');
        const outro = novoEmail('outro');
        const user = await ambiente.criarConta({ email: dono });
        await ambiente.criarConta({ email: outro });
        const { bearer } = await ambiente.entrar(dono);

        const resposta = await ambiente.api(
          'patch',
          `/api/usuarios/${user.id}`,
          {
            bearer,
            corpo: { nome: 'Nome', email: outro },
          },
        );

        expect(resposta.status).toBe(409);
        expect(resposta.body.error).toBe('Este e-mail já está cadastrado.');
      });

      test('só o nome: grava na hora, sem pedir confirmação', async () => {
        const email = novoEmail('somenome');
        const user = await ambiente.criarConta({ email });
        const { bearer } = await ambiente.entrar(email);

        const resposta = await ambiente.api(
          'patch',
          `/api/usuarios/${user.id}`,
          {
            bearer,
            corpo: { nome: 'Outro Nome', email },
          },
        );
        await ambiente.aguardarEmails();

        expect(resposta.body).toMatchObject({
          name: 'Outro Nome',
          emailConfirmacaoPendente: false,
        });
        expect(ambiente.enviados).toEqual([]);
      });
    });

    test('excluir o User apaga Session e Account em cascata', async () => {
      const email = novoEmail('cascata');
      const user = await ambiente.criarConta({ email });
      await ambiente.entrar(email);
      expect(
        await ambiente.prisma.session.count({ where: { userId: user.id } }),
      ).toBeGreaterThan(0);

      await ambiente.prisma.user.delete({ where: { id: user.id } });

      expect(
        await ambiente.prisma.session.count({ where: { userId: user.id } }),
      ).toBe(0);
      expect(
        await ambiente.prisma.account.count({ where: { userId: user.id } }),
      ).toBe(0);
    });
  },
);
