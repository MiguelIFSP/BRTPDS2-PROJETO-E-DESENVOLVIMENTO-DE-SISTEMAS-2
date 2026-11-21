import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

const raiz = path.join(import.meta.dirname, '..');

// Os testes de integração usam um banco só deles, no mesmo MySQL do
// desenvolvimento (GT-04: nunca o banco de desenvolvimento). Aqui as
// migrations são aplicadas nele antes de a suíte começar.
export const NOME_BANCO_TESTE = 'better_meet_test';

export const urlBancoTeste = () => {
  const { DATABASE_URL } = dotenv.parse(readFileSync(path.join(raiz, '.env')));
  if (!DATABASE_URL) throw new Error('DATABASE_URL não definida no .env.');
  const url = new URL(DATABASE_URL);
  url.pathname = `/${NOME_BANCO_TESTE}`;
  return url.toString();
};

export default async function globalSetup() {
  try {
    execSync('npx prisma migrate deploy', {
      cwd: raiz,
      stdio: 'ignore',
      env: { ...process.env, DATABASE_URL: urlBancoTeste() },
    });
    process.env.BANCO_TESTE_DISPONIVEL = 'sim';
  } catch {
    process.env.BANCO_TESTE_DISPONIVEL = 'nao';
    console.warn(
      `Banco ${NOME_BANCO_TESTE} indisponível: os testes de integração do Better Auth serão pulados. Suba o container do MySQL e crie o banco.`,
    );
  }
}
