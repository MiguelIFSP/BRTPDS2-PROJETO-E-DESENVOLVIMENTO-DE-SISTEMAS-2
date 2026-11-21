import { createHash, timingSafeEqual } from 'node:crypto';
import { hashPassword, verifyPassword } from 'better-auth/crypto';

// EXCEÇÃO TEMPORÁRIA ao EX-14 e à busca textual da RF-R02: este é o único
// arquivo que ainda calcula SHA-256 de senha. As contas anteriores ao Better
// Auth guardam esse hash (64 hexadecimais, sem sal); ele só é conferido no
// primeiro login e logo regravado em scrypt (hooks.after de lib/auth.ts).
// O arquivo sai quando a consulta abaixo devolver zero:
//   SELECT COUNT(*) FROM Account WHERE password REGEXP '^[a-f0-9]{64}$';

const HASH_LEGADO = /^[a-f0-9]{64}$/;

export const isHashLegado = (hash: string): boolean => HASH_LEGADO.test(hash);

export const verificarHashLegado = (senha: string, hash: string): boolean => {
  const calculado = createHash('sha256').update(senha).digest();
  const esperado = Buffer.from(hash, 'hex');
  return (
    esperado.length === calculado.length && timingSafeEqual(calculado, esperado)
  );
};

/** Confere a senha contra o hash gravado, legado (SHA-256) ou scrypt. */
export const verificarSenha = async ({
  hash,
  password,
}: {
  hash: string;
  password: string;
}): Promise<boolean> =>
  isHashLegado(hash)
    ? verificarHashLegado(password, hash)
    : verifyPassword({ hash, password });

export const hashSenha = (password: string): Promise<string> =>
  hashPassword(password);
