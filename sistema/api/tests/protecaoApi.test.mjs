import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, jest, test } from '@jest/globals';
import request from 'supertest';

const env = {
  NODE_ENV: 'test',
  CORS_ORIGINS: ['http://painel.test'],
  RATE_LIMIT_ATIVO: true,
  TRUST_PROXY: undefined,
};
jest.unstable_mockModule('../src/config/env.ts', () => ({ env }));
jest.unstable_mockModule('../src/config/database.ts', () => ({
  default: {
    reuniao: { findUnique: jest.fn(async () => null) },
    conviteReuniao: { findUnique: jest.fn(async () => null) },
  },
}));
jest.unstable_mockModule('../src/lib/auth.ts', () => ({
  CABECALHO_IP: 'x-better-meet-ip',
  auth: {
    api: { getSession: async () => null },
    handler: async () =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
  },
}));
const { criarApp } = await import('../src/app.ts');

describe('CORS', () => {
  const app = criarApp();

  test('origem não listada fica sem Access-Control-Allow-Origin', async () => {
    const response = await request(app)
      .get('/health')
      .set('Origin', 'http://invasor.test');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('origem listada recebe o cabeçalho, com credenciais e cabeçalhos expostos', async () => {
    const response = await request(app)
      .get('/health')
      .set('Origin', 'http://painel.test');

    expect(response.headers['access-control-allow-origin']).toBe(
      'http://painel.test',
    );
    expect(response.headers['access-control-allow-credentials']).toBe('true');
    expect(response.headers['access-control-expose-headers']).toMatch(
      /set-auth-token/,
    );
  });

  test('requisição sem Origin (app nativo, outros serviços) passa', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
  });
});

describe('helmet', () => {
  const app = criarApp();

  test('as rotas da API levam os cabeçalhos de segurança', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBeDefined();
    expect(response.headers['content-security-policy']).toMatch(
      /script-src 'self'(;|$)/,
    );
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  test('a CSP relaxada vale só em /api/docs', async () => {
    const docs = await request(app).get('/api/docs/');

    expect(docs.status).toBe(200);
    expect(docs.headers['content-security-policy']).toMatch(
      /script-src 'self' 'unsafe-inline'/,
    );
    expect(docs.headers['x-content-type-options']).toBe('nosniff');
  });
});

describe('limite de tentativas fora do Better Auth', () => {
  test('o /api/convites responde 429 em pt-BR com X-Retry-After depois de 30 por minuto', async () => {
    const app = criarApp();
    for (let i = 0; i < 30; i += 1) {
      const response = await request(app).get('/api/convites/abc');
      expect(response.status).not.toBe(429);
    }

    const response = await request(app).get('/api/convites/abc');

    expect(response.status).toBe(429);
    expect(response.body.error).toMatch(
      /^Muitas tentativas\. Tente novamente em \d+ segundos\.$/,
    );
    expect(Number(response.headers['x-retry-after'])).toBeGreaterThan(0);
  });

  test('o limite geral do /api responde 429 depois de 300 por minuto', async () => {
    const app = criarApp();
    for (let i = 0; i < 300; i += 1) {
      await request(app).get('/api/nao-existe');
    }

    const response = await request(app).get('/api/nao-existe');

    expect(response.status).toBe(429);
    expect(response.headers['x-retry-after']).toBeDefined();
  });

  test('desligado, o limite não bloqueia (desenvolvimento)', async () => {
    env.RATE_LIMIT_ATIVO = false;
    const app = criarApp();
    let ultimo;
    for (let i = 0; i < 35; i += 1) {
      ultimo = await request(app).get('/api/convites/abc');
    }
    env.RATE_LIMIT_ATIVO = true;

    expect(ultimo.status).not.toBe(429);
  });
});

describe('corpo da requisição', () => {
  const app = criarApp();
  const corpoComTamanho = (bytes) => ({ texto: 'a'.repeat(bytes) });

  test('2 MB responde 413 em pt-BR', async () => {
    const response = await request(app)
      .post('/api/organizacoes')
      .send(corpoComTamanho(2_000_000));

    expect(response.status).toBe(413);
    expect(response.body.error).toBe('Corpo da requisição grande demais.');
  });

  test('500 kB passa do limite do corpo (cabe a ata)', async () => {
    const response = await request(app)
      .post('/api/organizacoes')
      .send(corpoComTamanho(500_000));

    expect(response.status).toBe(401);
    expect(response.status).not.toBe(413);
  });

  test('JSON malformado continua 400', async () => {
    const response = await request(app)
      .post('/api/organizacoes')
      .set('Content-Type', 'application/json')
      .send('{"email": ');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('JSON inválido.');
  });

  test('o handler do Better Auth recusa corpo grande antes de ler', async () => {
    const response = await request(app)
      .post('/api/auth/sign-in/email')
      .send(corpoComTamanho(200_000));

    expect(response.status).toBe(413);
  });
});

describe('Better Auth e rotas inexistentes', () => {
  const app = criarApp();

  test('/api/auth/* chega ao handler do Better Auth', async () => {
    const response = await request(app).get('/api/auth/ok');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });

  test('rota inexistente responde 404 em JSON', async () => {
    const response = await request(app).get('/nao-existe');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Rota não encontrada.');
  });
});

describe('varredura de src/', () => {
  const raiz = path.join(import.meta.dirname, '..', 'src');
  const arquivos = (pasta) =>
    readdirSync(pasta).flatMap((nome) => {
      const caminho = path.join(pasta, nome);
      return statSync(caminho).isDirectory() ? arquivos(caminho) : [caminho];
    });
  const fontes = arquivos(raiz).map((caminho) => ({
    caminho: path.relative(raiz, caminho).replaceAll('\\', '/'),
    texto: readFileSync(caminho, 'utf8'),
  }));
  const comOcorrencia = (padrao) =>
    fontes
      .filter(({ texto }) => padrao.test(texto))
      .map(({ caminho }) => caminho);

  test('CORS nunca usa origin: true nem cors() sem opções', () => {
    expect(comOcorrencia(/origin:\s*true/)).toEqual([]);
    expect(comOcorrencia(/\bcors\(\s*\)/)).toEqual([]);
  });

  test('process.env só é lido em config/env.ts', () => {
    expect(comOcorrencia(/process\.env/)).toEqual(['config/env.ts']);
  });
});
