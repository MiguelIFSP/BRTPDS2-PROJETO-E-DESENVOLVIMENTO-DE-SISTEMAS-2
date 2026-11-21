import { readFileSync } from 'node:fs';
import { describe, expect, jest, test } from '@jest/globals';
import YAML from 'yaml';
import { createPrismaMock } from './helpers.mjs';

jest.unstable_mockModule('../src/config/database.ts', () => ({
  prisma: createPrismaMock(),
}));
const { createStatusRoutes } = await import('../src/routes/statusRoutes.ts');
const { API_PREFIX } = await import('../src/app.ts');

const documento = YAML.parse(
  readFileSync(new URL('../docs/openapi.yaml', import.meta.url), 'utf8'),
);

// Lê as rotas registradas no roteador real, para o documento nunca ficar defasado.
const rotasRegistradas = () => {
  const router = createStatusRoutes({ strict: (_a, _b, next) => next() });
  return router.stack
    .filter((layer) => layer.route)
    .flatMap((layer) =>
      Object.keys(layer.route.methods).map((method) => ({
        method,
        path: `${API_PREFIX}${layer.route.path.replace(/:(\w+)/g, '{$1}')}`,
      })),
    );
};

describe('docs/openapi.yaml', () => {
  test('é um OpenAPI 3 válido', () => {
    expect(documento.openapi).toMatch(/^3\./);
    expect(documento.paths).toBeDefined();
  });

  test('toda rota registrada aparece em paths', () => {
    const rotas = rotasRegistradas();
    expect(rotas).toHaveLength(6);
    for (const { method, path } of rotas) {
      expect(documento.paths[path]?.[method]).toBeDefined();
    }
  });

  test('cobre /health sem prefixo', () => {
    expect(documento.paths['/health'].get).toBeDefined();
  });

  test('toda rota protegida declara security', () => {
    for (const { method, path } of rotasRegistradas()) {
      expect(documento.paths[path][method].security?.length).toBeGreaterThan(0);
    }
  });

  test('declara os dois esquemas de segurança', () => {
    expect(Object.keys(documento.components.securitySchemes).sort()).toEqual([
      'apiKeyAuth',
      'bearerAuth',
    ]);
  });
});
