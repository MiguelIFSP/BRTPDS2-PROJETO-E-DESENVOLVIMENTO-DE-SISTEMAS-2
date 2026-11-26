import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { criarAuthSimulado, tokenDe } from './sessaoSimulada.mjs';

const disco = new Map();
const fsPromises = {
  mkdir: jest.fn(async () => {}),
  writeFile: jest.fn(async (caminho, dados) => {
    disco.set(String(caminho), dados);
  }),
  readFile: jest.fn(async (caminho) => {
    const dado = disco.get(String(caminho));
    if (!dado) {
      const error = new Error('missing');
      error.code = 'ENOENT';
      throw error;
    }
    return dado;
  }),
  unlink: jest.fn(async (caminho) => {
    disco.delete(String(caminho));
  }),
  rm: jest.fn(async () => {}),
};
const prisma = {
  user: { findUnique: jest.fn() },
  reuniao: { findUnique: jest.fn() },
  comissaoEquipe: { findUnique: jest.fn() },
  arquivoReuniao: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
};
jest.unstable_mockModule('node:fs/promises', () => fsPromises);
jest.unstable_mockModule('../src/config/database.ts', () => ({
  default: prisma,
}));
jest.unstable_mockModule('../src/config/env.ts', () => ({
  env: { TZ_REUNIOES: 'America/Sao_Paulo' },
}));
jest.unstable_mockModule(
  'better-auth/node',
  () => ({
    fromNodeHeaders: (headers) =>
      new Headers(
        Object.entries(headers).flatMap(([key, value]) => {
          if (value === undefined) return [];
          return [
            [key, Array.isArray(value) ? value.join(', ') : String(value)],
          ];
        }),
      ),
  }),
  { virtual: true },
);
jest.unstable_mockModule('../src/lib/auth.ts', criarAuthSimulado);
const { default: reuniaoRoutes } =
  await import('../src/routes/reuniaoRoutes.ts');
const { handleError } = await import('../src/middlewares/errorMiddleware.ts');
const { receberArquivoBinario } =
  await import('../src/middlewares/uploadArquivoMiddleware.ts');
const app = express();
app.use('/api', reuniaoRoutes);
app.use(handleError);

const CRIADOR_ID = 1;
const ADMIN_COMISSAO = 2;
const PARTICIPANTE = 4;
const FORA_ID = 9;
const ADMIN_ID = 50;
const auth = (userId) => ({ Authorization: `Bearer ${tokenDe(userId)}` });
const pessoa = (userId) => ({ id: userId, name: `Pessoa ${userId}` });

let reuniao;
let aceitos;
let papeis;
let arquivos;
let nextId;

beforeEach(() => {
  jest.clearAllMocks();
  disco.clear();
  reuniao = {
    id: 31,
    comissaoId: 7,
    criadoPorUserId: CRIADOR_ID,
    status: 'AGENDADA',
    data: '2099-06-01',
    horaInicio: '10:00',
    horaFim: '12:00',
  };
  aceitos = new Set([PARTICIPANTE]);
  papeis = { [ADMIN_COMISSAO]: 'ADMINISTRADOR' };
  arquivos = [];
  nextId = 1;

  prisma.user.findUnique.mockImplementation(async ({ where }) => ({
    role: where.id === ADMIN_ID ? 'ADMIN' : 'USER',
    email: `usuario${where.id}@example.test`,
  }));
  prisma.reuniao.findUnique.mockImplementation(async ({ select }) => {
    const userId = select.convites.where.userId;
    return {
      ...reuniao,
      convites: aceitos.has(userId) ? [{ id: 1 }] : [],
    };
  });
  prisma.comissaoEquipe.findUnique.mockImplementation(async ({ where }) => {
    const papel = papeis[where.comissaoId_userId.userId];
    return papel ? { papel } : null;
  });
  prisma.arquivoReuniao.findMany.mockImplementation(async () =>
    arquivos.map((arquivo) => ({
      id: arquivo.id,
      nomeOriginal: arquivo.nomeOriginal,
      tamanhoBytes: arquivo.tamanhoBytes,
      createdAt: arquivo.createdAt,
      enviadoPor: pessoa(arquivo.enviadoPorUserId),
    })),
  );
  prisma.arquivoReuniao.create.mockImplementation(async ({ data }) => {
    const arquivo = {
      id: nextId,
      ...data,
      createdAt: new Date('2099-06-01T12:00:00.000Z'),
    };
    nextId += 1;
    arquivos.push(arquivo);
    return {
      id: arquivo.id,
      nomeOriginal: arquivo.nomeOriginal,
      tamanhoBytes: arquivo.tamanhoBytes,
      createdAt: arquivo.createdAt,
      enviadoPor: pessoa(arquivo.enviadoPorUserId),
    };
  });
  prisma.arquivoReuniao.findFirst.mockImplementation(async ({ where }) => {
    const arquivo = arquivos.find(
      (item) => item.id === where.id && item.reuniaoId === where.reuniaoId,
    );
    return arquivo
      ? {
          id: arquivo.id,
          nomeOriginal: arquivo.nomeOriginal,
          nomeArmazenado: arquivo.nomeArmazenado,
          tamanhoBytes: arquivo.tamanhoBytes,
        }
      : null;
  });
  prisma.arquivoReuniao.delete.mockImplementation(async ({ where }) => {
    const indice = arquivos.findIndex((item) => item.id === where.id);
    arquivos.splice(indice, 1);
  });
});

const enviar = (userId, nome, conteudo) =>
  request(app)
    .post('/api/reunioes/31/arquivos')
    .set(auth(userId))
    .set('Content-Type', 'application/octet-stream')
    .set('X-Nome-Arquivo', encodeURIComponent(nome))
    .send(conteudo);

describe('biblioteca da reunião', () => {
  test('quem gere envia e o participante baixa, sem abrir no tipo do conteúdo', async () => {
    const envio = await enviar(
      CRIADOR_ID,
      'pauta final.pdf',
      Buffer.from('abc'),
    );
    expect(envio.status).toBe(201);
    expect(envio.body).toMatchObject({
      nome: 'pauta final.pdf',
      tamanhoBytes: 3,
    });

    const lista = await request(app)
      .get('/api/reunioes/31/arquivos')
      .set(auth(PARTICIPANTE));
    expect(lista.status).toBe(200);
    expect(lista.body.podeEnviar).toBe(false);
    expect(lista.body.arquivos).toHaveLength(1);

    const listaGestor = await request(app)
      .get('/api/reunioes/31/arquivos')
      .set(auth(CRIADOR_ID));
    expect(listaGestor.body.podeEnviar).toBe(true);

    const baixa = await request(app)
      .get(`/api/reunioes/31/arquivos/${envio.body.id}`)
      .set(auth(PARTICIPANTE));
    expect(baixa.status).toBe(200);
    expect(baixa.headers['content-type']).toMatch(/application\/octet-stream/);
    expect(baixa.headers['content-disposition']).toContain('attachment');
    expect(baixa.body).toEqual(Buffer.from('abc'));
  });

  test('participante não envia e quem está fora não vê a biblioteca', async () => {
    expect(
      (await enviar(PARTICIPANTE, 'nota.txt', Buffer.from('x'))).status,
    ).toBe(403);
    const fora = await request(app)
      .get('/api/reunioes/31/arquivos')
      .set(auth(FORA_ID));
    expect(fora.status).toBe(403);
  });

  test('administrador da comissão envia e apaga antes do fim', async () => {
    const envio = await enviar(
      ADMIN_COMISSAO,
      '..\\pasta\\ata.docx',
      Buffer.from('doc'),
    );
    expect(envio.status).toBe(201);
    expect(envio.body.nome).toBe('ata.docx');

    const apagado = await request(app)
      .delete(`/api/reunioes/31/arquivos/${envio.body.id}`)
      .set(auth(ADMIN_COMISSAO));
    expect(apagado.status).toBe(200);
    expect(arquivos).toHaveLength(0);
  });

  test('depois do fim dá para baixar, mas não enviar nem apagar', async () => {
    const envio = await enviar(CRIADOR_ID, 'anexo.bin', Buffer.from('ok'));
    reuniao.data = '2000-01-01';

    const deNovo = await enviar(CRIADOR_ID, 'tarde.bin', Buffer.from('nao'));
    expect(deNovo.status).toBe(409);

    const apagar = await request(app)
      .delete(`/api/reunioes/31/arquivos/${envio.body.id}`)
      .set(auth(CRIADOR_ID));
    expect(apagar.status).toBe(409);

    const baixa = await request(app)
      .get(`/api/reunioes/31/arquivos/${envio.body.id}`)
      .set(auth(PARTICIPANTE));
    expect(baixa.status).toBe(200);
    expect(baixa.body).toEqual(Buffer.from('ok'));
  });

  test('reunião cancelada não aceita arquivo novo', async () => {
    reuniao.status = 'CANCELADA';
    expect((await enviar(ADMIN_ID, 'x.txt', Buffer.from('a'))).status).toBe(
      409,
    );
  });

  test('arquivo vazio recebe 400 e nome ausente também', async () => {
    const vazio = await enviar(CRIADOR_ID, 'vazio.txt', Buffer.alloc(0));
    expect(vazio.status).toBe(400);

    const semNome = await request(app)
      .post('/api/reunioes/31/arquivos')
      .set(auth(CRIADOR_ID))
      .set('Content-Type', 'application/octet-stream')
      .send(Buffer.from('abc'));
    expect(semNome.status).toBe(400);
  });

  test('content-length acima de 25 MB recebe 413 sem ler o corpo', () => {
    const next = jest.fn();
    receberArquivoBinario(
      {
        headers: {
          'content-type': 'application/octet-stream',
          'content-length': String(26 * 1024 * 1024),
          'x-nome-arquivo': encodeURIComponent('grande.bin'),
        },
      },
      {},
      next,
    );
    expect(next.mock.calls[0][0].statusCode).toBe(413);
  });
});
