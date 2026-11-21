import { describe, expect, jest, test } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import * as yup from 'yup';
import { AppError } from '../src/errors/AppError.ts';
import { handleError } from '../src/middlewares/errorMiddleware.ts';

const appThatThrows = (error) => {
  const app = express();
  app.use(express.json({ limit: '50b' }));
  app.post('/erro', () => {
    throw error;
  });
  app.use(handleError);
  return app;
};

describe('handleError', () => {
  test('500 é genérico e não vaza a mensagem nem o stack', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const response = await request(
      appThatThrows(new Error('senha do banco: segredo123')),
    ).post('/erro');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: 'Erro interno. Tente novamente mais tarde.',
    });
    expect(response.text).not.toContain('segredo123');
    expect(response.text).not.toContain('at ');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  test('AppError devolve status, mensagem e details', async () => {
    const response = await request(
      appThatThrows(new AppError(409, 'Conflito.', { pendentes: [1] })),
    ).post('/erro');
    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: 'Conflito.', pendentes: [1] });
  });

  test('Yup vira 400 com a primeira mensagem', async () => {
    const error = await yup
      .object({ a: yup.string().required('A é obrigatório.') })
      .validate({})
      .catch((e) => e);
    const response = await request(appThatThrows(error)).post('/erro');
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'A é obrigatório.' });
  });

  test('JSON malformado vira 400', async () => {
    const response = await request(appThatThrows(new Error('x')))
      .post('/erro')
      .set('Content-Type', 'application/json')
      .send('{ quebrado');
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'JSON inválido.' });
  });

  test('corpo grande demais vira 413 em português', async () => {
    const response = await request(appThatThrows(new Error('x')))
      .post('/erro')
      .send({ texto: 'x'.repeat(200) });
    expect(response.status).toBe(413);
    expect(response.body).toEqual({
      error: 'Corpo da requisição grande demais.',
    });
  });
});
