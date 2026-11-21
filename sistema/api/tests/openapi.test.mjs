import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from '@jest/globals';
import YAML from 'yaml';

const texto = readFileSync(
  path.join(import.meta.dirname, '..', 'docs', 'openapi.yaml'),
  'utf8',
);
const documento = YAML.parse(texto);

const referencias = (valor) => {
  if (Array.isArray(valor)) return valor.flatMap(referencias);
  if (valor && typeof valor === 'object') {
    return Object.entries(valor).flatMap(([chave, filho]) =>
      chave === '$ref' ? [filho] : referencias(filho),
    );
  }
  return [];
};

const resolve = (ref) =>
  ref
    .replace('#/', '')
    .split('/')
    .reduce((no, parte) => no?.[parte], documento);

describe('docs/openapi.yaml', () => {
  test('é um YAML válido e todo $ref aponta para algo que existe', () => {
    expect(documento.openapi).toMatch(/^3\./);
    for (const ref of new Set(referencias(documento))) {
      expect(resolve(ref)).toBeDefined();
    }
  });

  test.each([
    ['post', '/auth/sign-up/email'],
    ['post', '/auth/sign-in/email'],
    ['post', '/auth/send-verification-email'],
    ['get', '/auth/verify-email'],
    ['post', '/auth/request-password-reset'],
    ['post', '/auth/reset-password'],
    ['get', '/auth/reset-password/{token}'],
    ['post', '/auth/sign-in/social'],
    ['post', '/auth/sign-out'],
    ['get', '/auth/get-session'],
    ['get', '/usuarios/me'],
  ])('documenta %s %s', (metodo, rota) => {
    expect(documento.paths[rota]?.[metodo]).toBeDefined();
  });

  test('a ponte POST /login não aparece mais', () => {
    expect(documento.paths['/login']).toBeUndefined();
  });

  test('POST /usuarios e forgot-password não aparecem mais', () => {
    expect(documento.paths['/usuarios']).toBeUndefined();
    expect(documento.paths['/auth/forgot-password']).toBeUndefined();
    expect(texto).not.toContain('forgot-password');
  });

  test('o 429 e os cabeçalhos set-auth-token e X-Retry-After estão descritos', () => {
    const limite = documento.components.responses.TooManyRequests;
    expect(limite.headers['X-Retry-After']).toBeDefined();
    expect(
      documento.paths['/auth/sign-in/email'].post.responses['200'].headers[
        'set-auth-token'
      ],
    ).toBeDefined();
    expect(
      documento.paths['/auth/sign-in/email'].post.responses['429'],
    ).toBeDefined();
  });

  test('GET /usuarios/me exige autenticação e não devolve senha', () => {
    const me = documento.paths['/usuarios/me'].get;
    expect(me.security).toEqual([{ bearerAuth: [] }]);
    expect(
      Object.keys(documento.components.schemas.UsuarioMe.properties),
    ).toEqual(
      expect.arrayContaining([
        'id',
        'role',
        'emailVerified',
        'themePreference',
      ]),
    );
    expect(
      documento.components.schemas.UsuarioMe.properties.password,
    ).toBeUndefined();
  });
});

describe('docs/openapi.yaml: rotas de domínio da U7', () => {
  test.each([
    ['get', '/reunioes/{id}/votacoes'],
    ['post', '/reunioes/{id}/votacoes'],
    ['get', '/votacoes/{id}'],
    ['delete', '/votacoes/{id}'],
    ['post', '/votacoes/{id}/voto'],
    ['post', '/votacoes/{id}/encerrar'],
    ['post', '/reunioes/{id}/ata/exportar'],
    ['patch', '/reunioes/{id}'],
    ['delete', '/organizacoes/{id}/membros/{userId}'],
  ])('documenta %s %s', (metodo, rota) => {
    expect(documento.paths[rota]?.[metodo]).toBeDefined();
  });

  test('o voto documenta 409 e 410 e a edição de reunião encerrada documenta 409', () => {
    const voto = documento.paths['/votacoes/{id}/voto'].post.responses;
    expect(voto).toHaveProperty('409');
    expect(voto).toHaveProperty('410');
    expect(documento.paths['/reunioes/{id}'].patch.responses).toHaveProperty(
      '409',
    );
  });

  test('a resposta da ata traz aprovação e exportação', () => {
    expect(documento.components.schemas.Ata.properties).toEqual(
      expect.objectContaining({
        aprovada: expect.anything(),
        exportada: expect.anything(),
        exportadaAt: expect.anything(),
        podeExportar: expect.anything(),
      }),
    );
  });
});
