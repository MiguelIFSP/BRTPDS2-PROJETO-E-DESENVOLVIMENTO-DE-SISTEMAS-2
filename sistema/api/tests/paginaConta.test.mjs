import { describe, expect, test } from '@jest/globals';
import express from 'express';
import request from 'supertest';

const { default: contaRoutes } = await import('../src/routes/contaRoutes.ts');
const app = express();
app.use('/api', contaRoutes);

const abrir = (query = '') =>
  request(app).get(`/api/conta/email-confirmado${query}`);

describe('GET /api/conta/email-confirmado (destino do link de confirmação)', () => {
  test('sem erro, confirma e manda voltar ao app para entrar', async () => {
    const resposta = await abrir();

    expect(resposta.status).toBe(200);
    expect(resposta.headers['content-type']).toMatch(/text\/html/);
    expect(resposta.text).toContain('E-mail confirmado');
    expect(resposta.text).toContain('Volte ao app Better Meet');
    expect(resposta.text).not.toMatch(/bettermeet:\/\//);
  });

  test('link vencido explica como receber outro', async () => {
    const resposta = await abrir('?error=TOKEN_EXPIRED');

    expect(resposta.status).toBe(400);
    expect(resposta.text).toContain('Link expirado');
    expect(resposta.text).toContain('Volte ao app Better Meet');
    expect(resposta.text).not.toContain('E-mail confirmado');
  });

  test.each(['INVALID_TOKEN', 'USER_NOT_FOUND', 'INVALID_USER', 'qualquer'])(
    'erro %s mostra link inválido',
    async (erro) => {
      const resposta = await abrir(`?error=${erro}`);

      expect(resposta.status).toBe(400);
      expect(resposta.text).toContain('Link inválido');
      expect(resposta.text).not.toContain('E-mail confirmado');
    },
  );

  test('o código de erro recebido nunca é escrito na página', async () => {
    const resposta = await abrir('?error=%3Cscript%3Ealert(1)%3C%2Fscript%3E');

    expect(resposta.text).not.toContain('<script>');
    expect(resposta.text).not.toContain('alert(1)');
  });

  test('a página não fica em cache, não é indexada e não roda script', async () => {
    const resposta = await abrir();

    expect(resposta.headers['cache-control']).toBe('no-store');
    expect(resposta.headers['referrer-policy']).toBe('no-referrer');
    expect(resposta.headers['x-robots-tag']).toBe('noindex');
    expect(resposta.headers['content-security-policy']).toContain(
      "default-src 'none'",
    );
  });
});
