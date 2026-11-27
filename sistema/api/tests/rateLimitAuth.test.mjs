import { afterAll, beforeEach, describe, expect, test } from '@jest/globals';
import { bancoDisponivel, prepararAmbiente } from './ambienteIntegracao.mjs';

const describeBanco = bancoDisponivel() ? describe : describe.skip;

// Este arquivo liga RATE_LIMIT_ENABLED; o contador fica no banco (RateLimit),
// por IP e rota, e cada teste usa um IP próprio.
describeBanco(
  'limite de tentativas do Better Auth (RATE_LIMIT_ENABLED=true)',
  () => {
    let ambiente;
    let contador = 0;
    beforeEach(async () => {
      ambiente ??= await prepararAmbiente({ rateLimit: true });
      ambiente.enviados.length = 0;
    });
    afterAll(async () => {
      await ambiente?.encerrar();
    });

    const novoEmail = (nome) => ambiente.emailDe(`${nome}${++contador}`);

    test('o 6º sign-in/email em 1 minuto responde 429 com X-Retry-After e mensagem em pt-BR', async () => {
      const ip = ambiente.novoIp();
      const email = novoEmail('limite');
      await ambiente.criarConta({ email });
      const tentar = () =>
        ambiente.api('post', '/api/auth/sign-in/email', {
          ip,
          corpo: { email, password: 'Errada123' },
        });

      for (let i = 0; i < 5; i += 1) {
        expect((await tentar()).status).toBe(401);
      }
      const sexta = await tentar();

      expect(sexta.status).toBe(429);
      expect(sexta.body.code).toBe('RATE_LIMITED');
      expect(sexta.body.error).toMatch(
        /^Muitas tentativas\. Tente novamente em \d+ segundos\.$/,
      );
      expect(Number(sexta.headers['x-retry-after'])).toBeGreaterThan(0);
    });

    test('o limite é por IP: outro IP continua passando', async () => {
      const email = novoEmail('porip');
      await ambiente.criarConta({ email });
      const ipBloqueado = ambiente.novoIp();
      for (let i = 0; i < 6; i += 1) {
        await ambiente.api('post', '/api/auth/sign-in/email', {
          ip: ipBloqueado,
          corpo: { email, password: 'Errada123' },
        });
      }

      const outro = await ambiente.api('post', '/api/auth/sign-in/email', {
        corpo: { email, password: 'Senha123' },
      });

      expect(outro.status).toBe(200);
    });

    test('o 4º send-verification-email em 5 minutos responde 429', async () => {
      const ip = ambiente.novoIp();
      const email = novoEmail('reenvio');
      const reenviar = () =>
        ambiente.api('post', '/api/auth/send-verification-email', {
          ip,
          corpo: { email },
        });

      for (let i = 0; i < 3; i += 1) {
        expect((await reenviar()).status).toBe(200);
      }

      expect((await reenviar()).status).toBe(429);
    });

    test('o 4º pedido de código de senha em 15 minutos responde 429', async () => {
      const ip = ambiente.novoIp();
      const email = novoEmail('recuperacao');
      const pedir = () =>
        ambiente.api('post', '/api/auth/email-otp/request-password-reset', {
          ip,
          corpo: { email },
        });

      for (let i = 0; i < 3; i += 1) {
        expect((await pedir()).status).toBe(200);
      }

      expect((await pedir()).status).toBe(429);
    });

    test('o 6º cadastro por hora do mesmo IP não passa de 5', async () => {
      const ip = ambiente.novoIp();
      const cadastrar = () =>
        ambiente.api('post', '/api/auth/sign-up/email', {
          ip,
          corpo: {
            name: 'Ana Souza',
            email: novoEmail('cadastro'),
            password: 'Senha123',
          },
        });

      for (let i = 0; i < 5; i += 1) {
        expect((await cadastrar()).status).toBe(200);
      }

      expect((await cadastrar()).status).toBe(429);
    });
  },
);
