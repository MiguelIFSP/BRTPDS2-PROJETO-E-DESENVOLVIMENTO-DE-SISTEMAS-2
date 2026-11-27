import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from '@jest/globals';

const raiz = path.join(import.meta.dirname, '..', 'prisma');
const schema = readFileSync(path.join(raiz, 'schema.prisma'), 'utf8');

const bloco = (modelo) =>
  new RegExp(`model ${modelo} \\{[\\s\\S]*?\\n\\}`).exec(schema)?.[0] ?? '';

describe('schema.prisma do Better Auth', () => {
  test('User não guarda senha nem tokens de recuperação', () => {
    const user = bloco('User');
    expect(user).not.toMatch(/\n\s+password\s/);
    expect(user).not.toContain('passwordResetTokens');
    expect(user).toMatch(/emailVerified\s+Boolean\s+@default\(false\)/);
    expect(user).toMatch(/username\s+String\?\s+@unique/);
  });

  test('existem as tabelas do Better Auth e a antiga não existe mais', () => {
    for (const modelo of ['Session', 'Account', 'Verification', 'RateLimit']) {
      expect(bloco(modelo)).not.toBe('');
    }
    expect(schema).not.toContain('model PasswordResetToken');
  });

  test('sessão e conta saem em cascata junto com o usuário', () => {
    for (const modelo of ['Session', 'Account']) {
      expect(bloco(modelo)).toMatch(
        /user\s+User\s+@relation\(fields: \[userId\], references: \[id\], onDelete: Cascade\)/,
      );
    }
  });

  test('a credencial é única por provedor e conta', () => {
    expect(bloco('Account')).toContain('@@unique([providerId, accountId])');
  });
});

describe('migration better_auth', () => {
  const pasta = readdirSync(path.join(raiz, 'migrations')).find((nome) =>
    nome.endsWith('_better_auth'),
  );
  const sql = readFileSync(
    path.join(raiz, 'migrations', pasta ?? '', 'migration.sql'),
    'utf8',
  );

  test('copia as senhas para Account antes de remover User.password', () => {
    const copia = sql.indexOf('INSERT INTO `Account`');
    const remocao = sql.indexOf('DROP COLUMN `password`');
    expect(copia).toBeGreaterThan(-1);
    expect(remocao).toBeGreaterThan(copia);
  });

  test('só administradores entram com o e-mail confirmado', () => {
    expect(sql).toContain(
      "UPDATE `User` SET `emailVerified` = true WHERE `role` = 'ADMIN'",
    );
  });

  test('descarta PasswordResetToken depois da cópia', () => {
    expect(sql.indexOf('DROP TABLE `PasswordResetToken`')).toBeGreaterThan(
      sql.indexOf('INSERT INTO `Account`'),
    );
  });
});

describe('migration nome de usuário', () => {
  const sql = readFileSync(
    path.join(
      raiz,
      'migrations',
      '20261126192000_nome_usuario_unico',
      'migration.sql',
    ),
    'utf8',
  );

  test('adiciona username opcional com índice único para preservar contas existentes', () => {
    expect(sql).toContain('`username` VARCHAR(30) NULL');
    expect(sql).toContain('UNIQUE INDEX `User_username_key`(`username`)');
  });
});
