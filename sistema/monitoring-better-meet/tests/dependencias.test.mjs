import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, test } from '@jest/globals';

const raiz = new URL('../', import.meta.url);
const lerRaiz = (arquivo) => readFileSync(new URL(arquivo, raiz), 'utf8');

const arquivosDe = (pasta) =>
  readdirSync(new URL(`${pasta}/`, raiz), { recursive: true })
    .filter((arquivo) => arquivo.endsWith('.ts'))
    .map((arquivo) => lerRaiz(`${pasta}/${arquivo}`));

describe('dependências removidas (RF-R56, RF-R62)', () => {
  const pacote = JSON.parse(lerRaiz('package.json'));
  const declaradas = { ...pacote.dependencies, ...pacote.devDependencies };

  test.each(['better-auth', 'jsonwebtoken', '@types/jsonwebtoken'])(
    'package.json não contém %s',
    (nome) => {
      expect(declaradas).not.toHaveProperty(nome);
    },
  );

  test('src/ não importa better-auth nem jsonwebtoken nem lê JWT_SECRET', () => {
    for (const fonte of arquivosDe('src')) {
      expect(fonte).not.toMatch(/better-auth|jsonwebtoken|JWT_SECRET/);
    }
  });
});
