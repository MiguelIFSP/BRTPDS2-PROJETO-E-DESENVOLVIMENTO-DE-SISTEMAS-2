import { describe, expect, jest, test } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import * as yup from 'yup';
import { AppError } from '../src/errors/AppError.ts';
import { handleError } from '../src/middlewares/errorMiddleware.ts';

const buildApp = (thrower) => {
  const app = express();
  app.use(express.json({ limit: '10b' }));
  app.post('/teste', () => {
    thrower();
  });
  app.use(handleError);
  return app;
};

describe('handleError', () => {
  test('erro desconhecido vira 500 genérico sem a mensagem original', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const response = await request(
      buildApp(() => {
        throw new Error('segredo interno /var/run/docker.sock');
      }),
    ).post('/teste');
    expect(response.status).toBe(500);
    expect(JSON.stringify(response.body)).not.toContain('docker.sock');
    expect(response.body.error).toBe(
      'Erro interno. Tente novamente mais tarde.',
    );
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  test('AppError usa o status e a mensagem próprios', async () => {
    const response = await request(
      buildApp(() => {
        throw new AppError(403, 'Acesso restrito ao administrador.');
      }),
    ).post('/teste');
    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: 'Acesso restrito ao administrador.',
    });
  });

  test('yup.ValidationError vira 400 com a primeira mensagem', async () => {
    const response = await request(
      buildApp(() => {
        throw new yup.ValidationError('Campo inválido.');
      }),
    ).post('/teste');
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Campo inválido.' });
  });

  test('JSON malformado vira 400', async () => {
    const response = await request(buildApp(() => {}))
      .post('/teste')
      .set('Content-Type', 'application/json')
      .send('{x');
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'JSON inválido.' });
  });

  test('corpo acima do limite vira 413 em pt-BR', async () => {
    const response = await request(buildApp(() => {}))
      .post('/teste')
      .send({ texto: 'a'.repeat(100) });
    expect(response.status).toBe(413);
    expect(response.body.error).toBe(
      'Corpo da requisição maior que o permitido.',
    );
  });
});
