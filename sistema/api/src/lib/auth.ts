import { expo } from '@better-auth/expo';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { bearer, emailOTP } from 'better-auth/plugins';
import * as yup from 'yup';
import prisma from '../config/database.ts';
import { env } from '../config/env.ts';
import { CODIGO_DADOS_INVALIDOS } from './authErros.ts';
import {
  cadastroAuthSchema,
  nomeAuthSchema,
  redefinicaoSenhaCodigoSchema,
  redefinicaoSenhaSchema,
} from '../schemas/authSchema.ts';
import { emailService } from '../services/emailService.ts';
import {
  hashSenha,
  isHashLegado,
  verificarSenha,
} from '../utils/senhaLegada.ts';

// Cabeçalho que o betterAuthMiddleware preenche com o IP já resolvido pelo
// Express (que respeita TRUST_PROXY); o valor enviado pelo cliente é descartado.
export const CABECALHO_IP = 'x-better-meet-ip';

const SETE_DIAS = 60 * 60 * 24 * 7;
const UM_DIA = 60 * 60 * 24;

const validar = async (schema: yup.AnyObjectSchema, corpo: unknown) => {
  try {
    await schema.validate(corpo ?? {}, { stripUnknown: true });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      throw new APIError('BAD_REQUEST', {
        message: error.errors[0] ?? 'Dados inválidos.',
        code: CODIGO_DADOS_INVALIDOS,
      });
    }
    throw error;
  }
};

const regrasPorRota = {
  '/sign-up/email': cadastroAuthSchema,
  '/email-otp/reset-password': redefinicaoSenhaCodigoSchema,
  '/change-password': redefinicaoSenhaSchema,
  '/update-user': nomeAuthSchema.partial(),
} satisfies Record<string, yup.AnyObjectSchema>;

const isRota = (caminho: string): caminho is keyof typeof regrasPorRota =>
  caminho in regrasPorRota;

// Conta antiga: confere o SHA-256 no primeiro login e regrava em scrypt. A
// troca só acontece se o hash gravado ainda for o legado (compare-and-set).
const regravarSenhaLegada = async (userId: number, senha: string) => {
  const conta = await prisma.account.findFirst({
    where: { userId, providerId: 'credential' },
    select: { id: true, password: true },
  });
  if (!conta?.password || !isHashLegado(conta.password)) return;
  await prisma.account.updateMany({
    where: { id: conta.id, password: conta.password },
    data: { password: await hashSenha(senha) },
  });
};

const idNumericoFalso = (id: string) =>
  String(
    100 +
      ([...id].reduce((soma, letra) => soma + letra.charCodeAt(0), 0) % 900),
  );

const destinatarioDe = (user: { name: string; email: string }) => ({
  nome: user.name,
  email: user.email,
});

// Destino de todo link de confirmação de e-mail: uma página da própria API
// (mesma origem do link, que o Better Auth já trata como confiável). O app não
// é aberto pelo link, porque o navegador não segue o redirecionamento para
// bettermeet:// e a aba ficava em branco.
const PAGINA_EMAIL_CONFIRMADO = '/api/conta/email-confirmado';

const comPaginaDeConfirmacao = (url: string) => {
  const link = new URL(url);
  link.searchParams.set(
    'callbackURL',
    new URL(PAGINA_EMAIL_CONFIRMADO, link.origin).toString(),
  );
  return link.toString();
};

// A recuperação de senha é só por código (plugin emailOTP). Ficam desligados o
// fluxo antigo por link e as rotas do plugin que o app não usa (entrar e trocar
// e-mail por código). /reset-password/:token não entra aqui porque tem
// parâmetro; ele é recusado no hooks.before.
const ROTAS_DESLIGADAS = [
  '/request-password-reset',
  '/reset-password',
  '/forget-password/email-otp',
  '/sign-in/email-otp',
  '/email-otp/send-verification-otp',
  '/email-otp/check-verification-otp',
  '/email-otp/verify-email',
  '/email-otp/request-email-change',
  '/email-otp/change-email',
];

const QUINZE_MINUTOS = 15 * 60;

// Conta sem senha (só Google) não recebe código: o plugin criaria uma senha
// nova para ela. Recebe o aviso para entrar com o Google.
const enviarCodigoRedefinicao = async (email: string, codigo: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  });
  if (!user) return;
  const credencial = await prisma.account.findFirst({
    where: { userId: user.id, providerId: 'credential' },
    select: { id: true },
  });
  if (!credencial) {
    await prisma.verification.deleteMany({
      where: { identifier: `forget-password-otp-${email}` },
    });
    await emailService.enviarRedefinicaoContaSocial(destinatarioDe(user));
    return;
  }
  await emailService.enviarRedefinicaoSenha(destinatarioDe(user), codigo);
};

const origensConfiaveis = [
  ...env.CORS_ORIGINS,
  'bettermeet://',
  'bettermeet://*',
  ...(env.NODE_ENV === 'production' ? [] : ['exp://']),
];

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  basePath: '/api/auth',
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: 'mysql' }),
  trustedOrigins: origensConfiaveis,
  disabledPaths: ROTAS_DESLIGADAS,
  // User.id é Int autoincrement e todas as chaves estrangeiras do domínio apontam para ele.
  advanced: {
    database: { generateId: 'serial' },
    ipAddress: { ipAddressHeaders: [CABECALHO_IP] },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 72,
    password: { hash: hashSenha, verify: verificarSenha },
    revokeSessionsOnPasswordReset: true,
    // Vale também para a troca por código: o plugin emailOTP chama este aviso.
    onPasswordReset: async ({ user }) => {
      emailService.runInBackground(() =>
        emailService.enviarAvisoSenhaAlterada(destinatarioDe(user)),
      );
    },
    // Cadastro com e-mail já existente devolve um usuário falso. Ele precisa ter
    // o mesmo formato do real (role, tema e id numérico), senão a resposta entrega
    // que a conta existe.
    customSyntheticUser: ({ coreFields, id }) => ({
      ...coreFields,
      role: 'USER',
      themePreference: 'system',
      id: idNumericoFalso(id),
    }),
    onExistingUserSignUp: async ({ user }) => {
      emailService.runInBackground(() =>
        emailService.enviarAvisoCadastroExistente(destinatarioDe(user)),
      );
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    expiresIn: 60 * 60,
    sendVerificationEmail: async ({ user, url }) => {
      emailService.runInBackground(() =>
        emailService.enviarVerificacaoEmail(
          destinatarioDe(user),
          comPaginaDeConfirmacao(url),
        ),
      );
    },
  },
  user: {
    // O novo e-mail só vale depois de confirmado por link enviado a ele.
    changeEmail: { enabled: true },
    additionalFields: {
      role: { type: 'string', required: false, input: false },
      themePreference: { type: 'string', required: false, input: true },
    },
  },
  session: {
    expiresIn: SETE_DIAS,
    updateAge: UM_DIA,
    // Sem cache: o perfil e a existência da conta são lidos do banco a cada requisição.
    cookieCache: { enabled: false },
  },
  account: {
    accountLinking: { enabled: true, trustedProviders: ['google'] },
  },
  ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? {
        socialProviders: {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        },
      }
    : {}),
  rateLimit: {
    enabled: env.RATE_LIMIT_ATIVO,
    storage: 'database',
    window: 60,
    max: 60,
    customRules: {
      '/sign-in/email': { window: 60, max: 5 },
      '/send-verification-email': { window: 300, max: 3 },
      '/sign-up/email': { window: 3600, max: 5 },
      '/email-otp/request-password-reset': { window: 900, max: 3 },
      '/email-otp/reset-password': { window: 900, max: 5 },
      '/sign-in/social': { window: 60, max: 10 },
      '/verify-email': { window: 60, max: 20 },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path.startsWith('/reset-password/')) {
        throw new APIError('NOT_FOUND');
      }
      if (isRota(ctx.path)) await validar(regrasPorRota[ctx.path], ctx.body);
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== '/sign-in/email') return;
      const userId = ctx.context.newSession?.user.id;
      const body: unknown = ctx.body;
      if (userId === undefined || typeof body !== 'object' || body === null) {
        return;
      }
      const senha = 'password' in body ? body.password : undefined;
      if (typeof senha === 'string') {
        await regravarSenhaLegada(Number(userId), senha);
      }
    }),
  },
  plugins: [
    expo(),
    bearer(),
    emailOTP({
      otpLength: 6,
      expiresIn: QUINZE_MINUTOS,
      // só o hash fica no banco; um novo pedido substitui o código anterior.
      storeOTP: 'hashed',
      allowedAttempts: 3,
      disableSignUp: true,
      // O envio roda fora do caminho da resposta: o tempo não denuncia se a conta existe.
      sendVerificationOTP: async ({ email, otp, type }) => {
        if (type !== 'forget-password') return;
        emailService.runInBackground(() => enviarCodigoRedefinicao(email, otp));
      },
    }),
  ],
});
