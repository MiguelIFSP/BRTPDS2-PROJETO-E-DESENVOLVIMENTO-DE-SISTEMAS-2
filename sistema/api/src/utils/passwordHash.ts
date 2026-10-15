import crypto from 'node:crypto';

// SHA-256 sem salt NÃO é adequado para senha (EX-14). Fica isolado aqui só para
// manter compatíveis as senhas já gravadas até a migração para o Better Auth,
// que vai substituir este arquivo inteiro.
export const hashPassword = (password: string): string =>
  crypto.createHash('sha256').update(password).digest('hex');

export const verifyPassword = (
  password: string,
  passwordHash: string,
): boolean => hashPassword(password) === passwordHash;
