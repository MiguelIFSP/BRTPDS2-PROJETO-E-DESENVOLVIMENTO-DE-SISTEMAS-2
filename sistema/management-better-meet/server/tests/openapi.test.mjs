import { readFileSync } from 'node:fs';
import { describe, expect, test } from '@jest/globals';
import YAML from 'yaml';
import {
  ACOES_SUBSISTEMA,
  NOMES_SUBSISTEMA,
} from '../src/schemas/subsystemSchema.ts';

const documento = YAML.parse(
  readFileSync(new URL('../docs/openapi.yaml', import.meta.url), 'utf8'),
);

describe('docs/openapi.yaml', () => {
  test('é um OpenAPI 3 válido e cobre as rotas principais', () => {
    expect(documento.openapi).toMatch(/^3\./);
    expect(Object.keys(documento.paths)).toEqual(
      expect.arrayContaining(['/subsystems/{name}/{action}', '/health']),
    );
  });

  test('os enum de name e action coincidem com o subsystemSchema', () => {
    const parametros =
      documento.paths['/subsystems/{name}/{action}'].post.parameters;
    const enumDe = (nome) =>
      parametros.find((parametro) => parametro.name === nome).schema.enum;
    expect(enumDe('name')).toEqual([...NOMES_SUBSISTEMA]);
    expect(enumDe('action')).toEqual([...ACOES_SUBSISTEMA]);
  });
});
