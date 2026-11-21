import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { criarAuthSimulado, tokenDe } from './sessaoSimulada.mjs';

const prisma = {
  user: { findUnique: jest.fn() },
  reuniao: { findUnique: jest.fn(), updateMany: jest.fn() },
  ataVoto: {
    findMany: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn(),
    upsert: jest.fn(),
  },
  $transaction: jest.fn(),
};
jest.unstable_mockModule('../src/config/database.ts', () => ({
  default: prisma,
}));
jest.unstable_mockModule('../src/config/env.ts', () => ({ env: {} }));
jest.unstable_mockModule('../src/lib/auth.ts', criarAuthSimulado);
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
let presentes;
const token = tokenDe(7);
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
    data: '2026-11-11',
    conteudoAta: '<p>Ata original.</p>',
    versaoAta: 1,
    ataExportadaAt: null,
  };
  presentes = 4;
  votos = [];
  prisma.user.findUnique.mockResolvedValue({
    role: 'ADMIN',
    email: 'participante@example.test',
  });
  prisma.reuniao.findUnique.mockImplementation(async () => ({
    ...reuniao,
    _count: { registros: presentes },
    comissao: { equipe: papel ? [{ papel }] : [] },
    registros: presente ? [{ id: 12, saidaAt: '2026-11-09T13:00:00Z' }] : [],
  }));
  prisma.$transaction.mockImplementation((callback) => callback(prisma));
  prisma.reuniao.updateMany.mockImplementation(async ({ where, data }) => {
    if (where.versaoAta !== reuniao.versaoAta) return { count: 0 };
    if (data.ataExportadaAt) {
      if (reuniao.ataExportadaAt) return { count: 0 };
      reuniao.ataExportadaAt = data.ataExportadaAt;
      return { count: 1 };
    }
    if (data.conteudoAta !== undefined) reuniao.conteudoAta = data.conteudoAta;
    reuniao.versaoAta += data.versaoAta.increment;
    return { count: 1 };
  });
  prisma.ataVoto.findMany.mockImplementation(async ({ where }) =>
    votos.filter((voto) => voto.versaoAta === where.versaoAta),
  );
  prisma.ataVoto.count.mockImplementation(
    async ({ where }) =>
      votos.filter(
        (voto) =>
          voto.versaoAta === where.versaoAta && voto.status === where.status,
      ).length,
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
      expect(response.body.dataReuniao).toBe('2026-11-11');
      expect(response.body.podeEditar).toBe(
        ['ADMINISTRADOR', 'SECRETARIO'].includes(cargo),
      );
      expect(response.body.podeVotar).toBe(true);
      const voted = await vote();
      expect(voted.status).toBe(200);
      expect(voted.body.dataReuniao).toBe('2026-11-11');
    },
  );
  test.each(['ADMINISTRADOR', 'SECRETARIO'])(
    '%s presente pode salvar',
    async (cargo) => {
      papel = cargo;
      const saved = await save();
      expect(saved.status).toBe(200);
      expect(saved.body.dataReuniao).toBe('2026-11-11');
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
  test('salva e relê títulos, sublinhado, rasurado, recuo, fonte e alinhamento', async () => {
    const html =
      '<h1>Título</h1><h2>Tópico</h2><h3>Decisão</h3><blockquote><p style="text-align:justify"><u>Texto</u> <s>antigo</s> <span style="font-size:24px">novo</span></p></blockquote>';
    const response = await save({ conteudoAta: html });
    expect(response.status).toBe(200);
    expect(response.body.conteudoAta).toBe(html);
    expect((await call('get')).body.conteudoAta).toBe(html);
  });
  test.each([
    'all',
    'outer',
    'inner',
    'horizontal',
    'vertical',
    'top',
    'bottom',
    'left',
    'right',
    'none',
  ])('preserva tabela com borda %s na gravação e leitura', async (border) => {
    const html = `<table data-ata-border="${border}"><tbody><tr><th><p>Responsável</p></th><th><p>Prazo</p></th></tr><tr><td><p>Ana</p></td><td><p>Sexta</p></td></tr></tbody></table>`;
    expect((await save({ conteudoAta: html })).body.conteudoAta).toBe(html);
    expect((await call('get')).body.conteudoAta).toBe(html);
  });
  test('normaliza fonte e alinhamento nativos sem aceitar atributos legados externos', async () => {
    const response = await save({
      conteudoAta:
        '<div align="center"><font size="5" face="externa" color="red">Texto</font></div>',
    });
    expect(response.body.conteudoAta).toBe(
      '<div style="text-align:center"><span style="font-size:24px">Texto</span></div>',
    );
  });
  test('remove CSS perigoso, fontes fora da escala e atributos inválidos de tabela', async () => {
    const response = await save({
      conteudoAta:
        '<p style="position:fixed;background-image:url(https://example.test/x);font-size:999px;text-align:center" onclick="x()">Ata</p><table data-ata-border="url(javascript:x())" style="background:url(x)"><tr><td colspan="999" rowspan="-1" onmouseover="x()"><span style="font-size:18px;color:red">Decisão</span></td></tr></table>',
    });
    expect(response.body.conteudoAta).toBe(
      '<p style="text-align:center">Ata</p><table data-ata-border="all"><tr><td><span style="font-size:18px">Decisão</span></td></tr></table>',
    );
  });
  test('tabela vazia não disponibiliza ata para votação', async () => {
    expect(
      (
        await save({
          conteudoAta:
            '<table><tbody><tr><td><p><br></p></td></tr></tbody></table>',
        })
      ).status,
    ).toBe(400);
    expect(prisma.reuniao.updateMany).not.toHaveBeenCalled();
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

describe('aprovação por maioria simples dos presentes e exportação', () => {
  const votar = (...status) => {
    votos = status.map((s, indice) => ({
      userId: 20 + indice,
      status: s,
      versaoAta: 1,
    }));
  };

  test('integrante que não é presidente vota e o voto vale', async () => {
    papel = 'MEMBRO';
    const response = await vote();
    expect(response.status).toBe(200);
    expect(response.body.meuVoto).toBe('APROVADO');
  });

  test.each([
    [4, ['APROVADO', 'APROVADO'], false],
    [4, ['APROVADO', 'APROVADO', 'APROVADO'], true],
    [5, ['APROVADO', 'APROVADO'], false],
    [5, ['APROVADO', 'APROVADO', 'APROVADO'], true],
    [3, ['APROVADO', 'REPROVADO', 'REPROVADO'], false],
  ])(
    'com %i presentes e votos %j, aprovada = %s (metade exata não aprova)',
    async (total, lista, esperado) => {
      presentes = total;
      votar(...lista);
      const response = await call('get');
      expect(response.body).toMatchObject({
        presentes: total,
        aprovada: esperado,
        podeExportar: esperado,
        exportada: false,
      });
    },
  );

  test('exportar antes da aprovação responde 409 e não grava', async () => {
    votar('APROVADO', 'REPROVADO');
    const response = await call('post', '/exportar');
    expect(response.status).toBe(409);
    expect(response.body.error).toBe(
      'A ata só pode ser exportada depois de aprovada.',
    );
    expect(prisma.reuniao.updateMany).not.toHaveBeenCalled();
  });

  test('exportar ata aprovada grava a versão e é idempotente', async () => {
    votar('APROVADO', 'APROVADO', 'APROVADO');
    const primeira = await call('post', '/exportar');
    expect(primeira.status).toBe(200);
    expect(primeira.body).toMatchObject({ exportada: true, podeEditar: false });
    expect(prisma.reuniao.updateMany).toHaveBeenCalledWith({
      where: { id: 31, versaoAta: 1, ataExportadaAt: null },
      data: { ataExportadaAt: expect.any(Date), ataVersaoExportada: 1 },
    });
    const segunda = await call('post', '/exportar');
    expect(segunda.status).toBe(200);
    expect(prisma.reuniao.updateMany).toHaveBeenCalledTimes(1);
  });

  test('depois da exportação editar e votar respondem 409', async () => {
    votar('APROVADO', 'APROVADO', 'APROVADO');
    await call('post', '/exportar');
    const edicao = await save();
    expect(edicao.status).toBe(409);
    expect(edicao.body.error).toBe(
      'A ata já foi exportada e não pode mais ser alterada.',
    );
    expect((await vote()).status).toBe(409);
    expect(prisma.ataVoto.upsert).not.toHaveBeenCalled();
  });

  test('ausente não exporta', async () => {
    presente = false;
    votar('APROVADO', 'APROVADO', 'APROVADO');
    expect((await call('post', '/exportar')).status).toBe(403);
  });

  test('editar apaga os votos da versão anterior e a aprovação some', async () => {
    votar('APROVADO', 'APROVADO', 'APROVADO');
    const response = await save();
    expect(response.body).toMatchObject({
      aprovada: false,
      podeExportar: false,
    });
  });
});
