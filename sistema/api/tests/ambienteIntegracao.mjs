import { randomUUID } from 'node:crypto';
import { jest } from '@jest/globals';
import request from 'supertest';
import { urlBancoTeste } from './globalSetupBanco.mjs';

export const bancoDisponivel = () =>
  process.env.BANCO_TESTE_DISPONIVEL === 'sim';

// Sobe a API de verdade (Express + Better Auth + Prisma) contra o banco de
// teste, com o envio de e-mail simulado: cada e-mail "enviado" vira um item de
// `enviados`. Cada arquivo de teste usa um sufixo de e-mail próprio e só apaga
// o que criou, porque os arquivos rodam em paralelo no mesmo banco.
export const prepararAmbiente = async ({
  rateLimit = false,
  extraEnv = {},
} = {}) => {
  Object.assign(process.env, {
    DATABASE_URL: urlBancoTeste(),
    BETTER_AUTH_SECRET: 'segredo-de-teste-com-mais-de-32-caracteres!',
    BETTER_AUTH_URL: 'http://localhost:3333',
    CORS_ORIGINS: 'http://painel.test',
    NODE_ENV: 'test',
    TRUST_PROXY: '1',
    RATE_LIMIT_ENABLED: rateLimit ? 'true' : 'false',
    ...extraEnv,
  });

  const enviados = [];
  const pendentes = [];
  const registrar =
    (tipo) =>
    async (destinatario, ...extras) => {
      enviados.push({ tipo, para: destinatario.email, extras });
      return true;
    };
  jest.unstable_mockModule('../src/services/emailService.ts', () => ({
    emailService: {
      runInBackground: (envio) => {
        pendentes.push(Promise.resolve().then(envio));
      },
      enviarVerificacaoEmail: registrar('verificacao'),
      enviarRedefinicaoSenha: registrar('redefinicao'),
      enviarRedefinicaoContaSocial: registrar('redefinicaoSocial'),
      enviarAvisoSenhaAlterada: registrar('senhaAlterada'),
      enviarAvisoCadastroExistente: registrar('cadastroExistente'),
    },
  }));

  const { criarApp } = await import('../src/app.ts');
  const { default: prisma } = await import('../src/config/database.ts');
  const { hashSenha } = await import('../src/utils/senhaLegada.ts');
  const app = criarApp();

  const sufixo = `${randomUUID().slice(0, 8)}@integracao.test`;
  const emailDe = (nome) => `${nome}.${sufixo}`;
  // cada teste usa um IP próprio para o limite de tentativas não vazar entre eles.
  let contadorIp = 0;
  const novoIp = () =>
    `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${++contadorIp % 250}`;

  const aguardarEmails = async () => {
    while (pendentes.length > 0) await pendentes.shift();
  };

  const api = (metodo, caminho, { corpo, bearer, ip = novoIp() } = {}) => {
    const chamada = request(app)
      [metodo](caminho)
      .set('X-Forwarded-For', ip)
      .set('Content-Type', 'application/json');
    if (bearer) chamada.set('Authorization', `Bearer ${bearer}`);
    return corpo ? chamada.send(corpo) : chamada;
  };

  // Cria uma conta já confirmada com senha em scrypt (ou em SHA-256 legado).
  const criarConta = async ({
    nome = 'Conta Teste',
    email,
    senha = 'Senha123',
    confirmada = true,
    role = 'USER',
    hash,
  }) => {
    const user = await prisma.user.create({
      data: { name: nome, email, emailVerified: confirmada, role },
    });
    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: String(user.id),
        providerId: 'credential',
        password: hash ?? (await hashSenha(senha)),
      },
    });
    return user;
  };

  const entrar = async (email, senha = 'Senha123') => {
    const resposta = await api('post', '/api/auth/sign-in/email', {
      corpo: { email, password: senha },
    });
    return { resposta, bearer: resposta.headers['set-auth-token'] };
  };

  const limpar = async () => {
    const donos = await prisma.user.findMany({
      where: { email: { endsWith: sufixo } },
      select: { id: true },
    });
    await prisma.user.deleteMany({
      where: { id: { in: donos.map((dono) => dono.id) } },
    });
    await prisma.verification.deleteMany({
      where: { identifier: { contains: sufixo } },
    });
  };

  return {
    app,
    prisma,
    enviados,
    aguardarEmails,
    api,
    emailDe,
    novoIp,
    criarConta,
    entrar,
    limpar,
    encerrar: async () => {
      await limpar();
      await prisma.$disconnect();
    },
  };
};
