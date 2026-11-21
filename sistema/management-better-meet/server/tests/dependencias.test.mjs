import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from '@jest/globals';

const raiz = join(import.meta.dirname, '..');
const listar = (pasta) =>
  readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    return statSync(caminho).isDirectory() ? listar(caminho) : [caminho];
  });

describe('sem JWT', () => {
  test('package.json não depende de jsonwebtoken', () => {
    const pacote = JSON.parse(readFileSync(join(raiz, 'package.json'), 'utf8'));
    const todas = { ...pacote.dependencies, ...pacote.devDependencies };
    expect(
      Object.keys(todas).filter((nome) => nome.includes('jsonwebtoken')),
    ).toEqual([]);
  });

  test('src/ não menciona JWT_SECRET nem jsonwebtoken', () => {
    const achados = listar(join(raiz, 'src')).filter((arquivo) =>
      /JWT_SECRET|jsonwebtoken/.test(readFileSync(arquivo, 'utf8')),
    );
    expect(achados).toEqual([]);
  });
});
