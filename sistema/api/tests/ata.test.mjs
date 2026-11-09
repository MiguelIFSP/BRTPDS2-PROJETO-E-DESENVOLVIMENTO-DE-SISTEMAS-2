import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';

const jwtSecret = 'segredo-ficticio-testes-ata';
const prisma = {
  user: { findUnique: jest.fn() },
  reuniao: { findUnique: jest.fn(), updateMany: jest.fn() },
  ataVoto: { findMany: jest.fn(), deleteMany: jest.fn(), upsert: jest.fn() },
  $transaction: jest.fn(),
};
jest.unstable_mockModule('../src/config/database.ts', () => ({
  default: prisma,
}));
jest.unstable_mockModule('../src/config/env.ts', () => ({
  env: { JWT_SECRET: jwtSecret },
}));
const { default: routes } = await import('../src/routes/ataRoutes.ts');
const { handleError } = await import('../src/middlewares/errorMiddleware.ts');
const { ataService } = await import('../src/services/ataService.ts');
const app = express();
app.use(express.json());
app.use('/api', routes);
app.use(handleError);

let papel;
let presente;
let reuniao;
let votos;
const token = jwt.sign(
  { role: 'ADMIN', email: 'participante@example.test', papel: 'ADMINISTRADOR' },
  jwtSecret,
  { subject: '7' },
);
const call = (method, suffix = '', id = '31') =>
  request(app)
    [method](`/api/reunioes/${id}/ata${suffix}`)
    .set('Authorization', `Bearer ${token}`);
const save = (body = {}) =>
  call('put').send({
    conteudoAta: '<p>Decisão aprovada.</p>',
    versaoAta: reuniao.versaoAta,
    ...body,
  });
const vote = (body = {}) =>
  call('post', '/votar').send({
    status: 'APROVADO',
    versaoAta: reuniao.versaoAta,
    ...body,
  });

beforeEach(() => {
  jest.resetAllMocks();
  papel = 'SECRETARIO';
  presente = true;
  reuniao = {
    id: 31,
    titulo: 'Planejamento',
    conteudoAta: '<p>Ata original.</p>',
    versaoAta: 1,
  };
  votos = [];
  prisma.user.findUnique.mockResolvedValue({
    role: 'ADMIN',
    email: 'participante@example.test',
  });
  prisma.reuniao.findUnique.mockImplementation(async () => ({
    ...reuniao,
    comissao: { equipe: papel ? [{ papel }] : [] },
    registros: presente ? [{ id: 12, saidaAt: '2026-11-09T13:00:00Z' }] : [],
  }));
  prisma.$transaction.mockImplementation((callback) => callback(prisma));
  prisma.reuniao.updateMany.mockImplementation(async ({ where, data }) => {
    if (where.versaoAta !== reuniao.versaoAta) return { count: 0 };
    if (data.conteudoAta !== undefined) reuniao.conteudoAta = data.conteudoAta;
    reuniao.versaoAta += data.versaoAta.increment;
    return { count: 1 };
  });
  prisma.ataVoto.findMany.mockImplementation(async ({ where }) =>
    votos.filter((voto) => voto.versaoAta === where.versaoAta),
  );
  prisma.ataVoto.deleteMany.mockImplementation(async () => {
    votos = [];
    return { count: 1 };
  });
  prisma.ataVoto.upsert.mockImplementation(async ({ create, update }) => {
    const existing = votos.find((voto) => voto.userId === create.userId);
    if (existing) Object.assign(existing, update);
    else votos.push(create);
    return existing ?? create;
  });
});

describe('RBAC e presença na ata', () => {
  test.each(['ADMINISTRADOR', 'FACILITADOR', 'SECRETARIO', 'MEMBRO'])(
    '%s presente pode ler e votar, inclusive após sair',
    async (cargo) => {
      papel = cargo;
      const response = await call('get');
      expect(response.status).toBe(200);
      expect(response.body.podeEditar).toBe(
        ['ADMINISTRADOR', 'SECRETARIO'].includes(cargo),
      );
      expect(response.body.podeVotar).toBe(true);
      expect((await vote()).status).toBe(200);
    },
  );
  test.each(['ADMINISTRADOR', 'SECRETARIO'])(
    '%s presente pode salvar',
    async (cargo) => {
      papel = cargo;
      expect((await save()).status).toBe(200);
    },
  );
  test.each(['FACILITADOR', 'MEMBRO'])(
    '%s recebe 403 no middleware mesmo com ADMIN no JWT e corpo inválido',
    async (cargo) => {
      papel = cargo;
      expect((await call('put').send({ papel: 'SECRETARIO' })).status).toBe(
        403,
      );
      expect(prisma.reuniao.updateMany).not.toHaveBeenCalled();
    },
  );
  test.each(['ADMINISTRADOR', 'SECRETARIO', 'FACILITADOR', 'MEMBRO'])(
    '%s ausente não lê, edita ou vota',
    async (cargo) => {
      papel = cargo;
      presente = false;
      expect((await call('get')).status).toBe(403);
      expect((await save()).status).toBe(403);
      expect((await vote()).status).toBe(403);
      expect(prisma.reuniao.updateMany).not.toHaveBeenCalled();
    },
  );
  test('registro de outra reunião não libera acesso e consulta usa o usuário do JWT', async () => {
    presente = false;
    expect((await vote({ userId: 999 })).status).toBe(403);
    expect(prisma.reuniao.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 31 },
        select: expect.objectContaining({
          registros: { where: { userId: 7 }, select: { id: true } },
        }),
      }),
    );
  });
  test('ex-integrante perde o acesso mesmo com presença registrada', async () => {
    papel = null;
    expect((await call('get')).status).toBe(403);
    expect((await save()).status).toBe(403);
    expect((await vote()).status).toBe(403);
  });
  test('service também bloqueia edição sem depender do middleware', async () => {
    papel = 'MEMBRO';
    await expect(
      ataService.save(7, 31, '<p>Texto.</p>', 1),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
  test.each([
    ['get', ''],
    ['put', ''],
    ['post', '/votar'],
  ])('%s exige JWT', async (method, suffix) => {
    expect(
      (await request(app)[method](`/api/reunioes/31/ata${suffix}`)).status,
    ).toBe(401);
  });
  test('token inválido e conta excluída recebem 401', async () => {
    expect(
      (
        await request(app)
          .get('/api/reunioes/31/ata')
          .set('Authorization', 'Bearer invalido')
      ).status,
    ).toBe(401);
    prisma.user.findUnique.mockResolvedValue(null);
    expect((await call('get')).status).toBe(401);
  });
  test('reunião inexistente recebe 404', async () => {
    prisma.reuniao.findUnique.mockResolvedValue(null);
    expect((await call('get')).status).toBe(404);
  });
  test.each(['abc', '0', '-1'])('id %s recebe 400', async (id) => {
    expect((await call('get', '', id)).status).toBe(400);
    expect((await call('put', '', id).send({})).status).toBe(400);
    expect((await call('post', '/votar', id).send({})).status).toBe(400);
  });
});

describe('conteúdo e votação', () => {
  test('cria ata na reunião sem conteúdo e libera os votos', async () => {
    reuniao.conteudoAta = null;
    reuniao.versaoAta = 0;
    expect((await call('get')).body.podeVotar).toBe(false);
    expect((await vote()).status).toBe(409);
    const response = await save();
    expect(response.body).toMatchObject({
      versaoAta: 1,
      podeVotar: true,
      conteudoAta: '<p>Decisão aprovada.</p>',
    });
  });
  test('sanitiza HTML preservando negrito, itálico e listas', async () => {
    const response = await save({
      conteudoAta:
        '<p onclick="alert(1)"><strong>Decisão</strong> <em>final</em></p><ul><li>Item</li></ul><script>alert(1)</script><img src=x onerror=alert(1)><iframe src="https://example.test">segredo</iframe>',
    });
    expect(response.status).toBe(200);
    expect(response.body.conteudoAta).toBe(
      '<p><strong>Decisão</strong> <em>final</em></p><ul><li>Item</li></ul>',
    );
  });
  test('sanitiza também a leitura de HTML legado', async () => {
    reuniao.conteudoAta = '<p onmouseover="x()">Texto</p><script>x()</script>';
    expect((await call('get')).body.conteudoAta).toBe('<p>Texto</p>');
  });
  test.each([
    '',
    '<p><br></p>',
    '<p>&nbsp; &#160; &#xA0;</p>',
    '<script>alert(1)</script>',
    '<svg><script>x()</script></svg>',
  ])('recusa HTML sem texto: %s', async (conteudoAta) => {
    expect((await save({ conteudoAta })).status).toBe(400);
    expect(prisma.reuniao.updateMany).not.toHaveBeenCalled();
  });
  test('limita tamanho do conteúdo', async () => {
    expect((await save({ conteudoAta: 'x'.repeat(50001) })).status).toBe(400);
  });
  test('um voto por usuário: repetir e depois trocar não duplica', async () => {
    await vote({ userId: 999, papel: 'ADMINISTRADOR' });
    await vote();
    const response = await vote({ status: 'REPROVADO' });
    expect(response.body).toMatchObject({
      meuVoto: 'REPROVADO',
      votos: { aprovados: 0, reprovados: 1 },
    });
    expect(votos).toEqual([
      { reuniaoId: 31, userId: 7, status: 'REPROVADO', versaoAta: 1 },
    ]);
  });
  test('mostra totais sem expor os votos individuais dos outros participantes', async () => {
    votos = [{ userId: 8, status: 'APROVADO', versaoAta: 1 }];
    expect((await call('get')).body).toMatchObject({
      meuVoto: null,
      votos: { aprovados: 1, reprovados: 0 },
    });
  });
  test('editar conteúdo limpa votos na mesma transação', async () => {
    await vote();
    const response = await save();
    expect(response.body).toMatchObject({
      versaoAta: 2,
      meuVoto: null,
      votos: { aprovados: 0, reprovados: 0 },
    });
    expect(prisma.ataVoto.deleteMany).toHaveBeenCalledWith({
      where: { reuniaoId: 31 },
    });
  });
  test('salvar o mesmo conteúdo preserva votos e versão', async () => {
    await vote();
    const response = await save({ conteudoAta: reuniao.conteudoAta });
    expect(response.body).toMatchObject({ versaoAta: 1, meuVoto: 'APROVADO' });
    expect(prisma.ataVoto.deleteMany).not.toHaveBeenCalled();
  });
  test('não salva nem vota com versão antiga', async () => {
    expect((await save({ versaoAta: 0 })).status).toBe(409);
    expect((await vote({ versaoAta: 0 })).status).toBe(409);
    expect(prisma.ataVoto.upsert).not.toHaveBeenCalled();
  });
  test('edição concorrente entre leitura e escrita gera conflito sem gravar voto', async () => {
    prisma.reuniao.updateMany.mockResolvedValue({ count: 0 });
    expect((await vote()).status).toBe(409);
    expect((await save()).status).toBe(409);
    expect(prisma.ataVoto.upsert).not.toHaveBeenCalled();
    expect(prisma.ataVoto.deleteMany).not.toHaveBeenCalled();
  });
  test.each([
    { status: 'TALVEZ' },
    { status: '' },
    { versaoAta: -1 },
    { versaoAta: 1.5 },
    { versaoAta: null },
  ])('valida corpo do voto %j', async (body) => {
    expect((await vote(body)).status).toBe(400);
    expect(prisma.ataVoto.upsert).not.toHaveBeenCalled();
  });
  test('versão é obrigatória na edição e no voto', async () => {
    expect(
      (await call('put').send({ conteudoAta: '<p>Teste</p>' })).status,
    ).toBe(400);
    expect(
      (await call('post', '/votar').send({ status: 'APROVADO' })).status,
    ).toBe(400);
  });
});
