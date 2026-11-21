import { createHash } from 'node:crypto';
import { describe, expect, test } from '@jest/globals';

const { hashSenha, isHashLegado, verificarHashLegado, verificarSenha } =
  await import('../src/utils/senhaLegada.ts');

const sha256 = (senha) => createHash('sha256').update(senha).digest('hex');

describe('senhaLegada', () => {
  test('aceita o hash SHA-256 antigo correto e recusa o errado', async () => {
    const hash = sha256('Senha123');
    expect(verificarHashLegado('Senha123', hash)).toBe(true);
    expect(verificarHashLegado('Outra123', hash)).toBe(false);
    await expect(verificarSenha({ hash, password: 'Senha123' })).resolves.toBe(
      true,
    );
    await expect(verificarSenha({ hash, password: 'Errada123' })).resolves.toBe(
      false,
    );
  });

  test('o hash gerado por hashSenha é scrypt e é aceito por verificarSenha', async () => {
    const hash = await hashSenha('Senha123');
    expect(isHashLegado(hash)).toBe(false);
    expect(hash).toMatch(/^[a-f0-9]+:[a-f0-9]+$/);
    await expect(verificarSenha({ hash, password: 'Senha123' })).resolves.toBe(
      true,
    );
    await expect(verificarSenha({ hash, password: 'Errada123' })).resolves.toBe(
      false,
    );
  });

  test('a mesma senha gera hashes diferentes (sal)', async () => {
    const [primeiro, segundo] = await Promise.all([
      hashSenha('Senha123'),
      hashSenha('Senha123'),
    ]);
    expect(primeiro).not.toBe(segundo);
  });

  test('isHashLegado não casa com o formato sal:chave nem com maiúsculas', () => {
    expect(isHashLegado(sha256('x'))).toBe(true);
    expect(isHashLegado(`${'a'.repeat(32)}:${'b'.repeat(128)}`)).toBe(false);
    expect(isHashLegado(sha256('x').toUpperCase())).toBe(false);
    expect(isHashLegado('abc')).toBe(false);
  });
});
