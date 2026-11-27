// Código dos erros que já trazem a mensagem final em pt-BR (hooks.before de auth.ts).
export const CODIGO_DADOS_INVALIDOS = 'DADOS_INVALIDOS';

export type ErroAuthTraduzido = {
  status: number;
  error: string;
  code?: string;
};

const MENSAGEM_PADRAO = 'Não foi possível concluir a operação.';

// Códigos do Better Auth que o app precisa tratar; o teste de configuração
// falha se algum deles deixar de existir na versão instalada.
export const ERROS_AUTH = {
  INVALID_EMAIL_OR_PASSWORD: {
    status: 401,
    error: 'E-mail ou senha inválidos.',
  },
  EMAIL_NOT_VERIFIED: {
    status: 403,
    error: 'Confirme seu e-mail para entrar. Enviamos um novo link.',
  },
  INVALID_TOKEN: { status: 400, error: 'Link ou código inválido ou expirado.' },
  TOKEN_EXPIRED: { status: 400, error: 'Link ou código inválido ou expirado.' },
  PASSWORD_TOO_SHORT: {
    status: 400,
    error: 'A senha deve ter entre 8 e 72 caracteres.',
  },
  PASSWORD_TOO_LONG: {
    status: 400,
    error: 'A senha deve ter entre 8 e 72 caracteres.',
  },
  INVALID_EMAIL: { status: 400, error: 'Informe um e-mail válido.' },
  INVALID_PASSWORD: { status: 401, error: 'Senha atual incorreta.' },
  USER_ALREADY_EXISTS: {
    status: 409,
    error: 'Este e-mail já está cadastrado.',
  },
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: {
    status: 409,
    error: 'Este e-mail já está cadastrado.',
  },
  SESSION_EXPIRED: { status: 401, error: 'Sessão inválida. Entre novamente.' },
  FIELD_NOT_ALLOWED: { status: 400, error: 'Campo não permitido.' },
  PROVIDER_NOT_FOUND: { status: 404, error: 'Rota não encontrada.' },
  INVALID_OTP: { status: 400, error: 'Código inválido ou expirado.' },
  OTP_EXPIRED: { status: 400, error: 'Código inválido ou expirado.' },
  TOO_MANY_ATTEMPTS: {
    status: 403,
    error: 'Muitas tentativas com este código. Peça um novo código.',
  },
} as const satisfies Record<string, { status: number; error: string }>;

const isCodigoMapeado = (codigo: string): codigo is keyof typeof ERROS_AUTH =>
  codigo in ERROS_AUTH;

/**
 * Converte um erro do Better Auth no formato da API: { error, code } com a
 * mensagem em pt-BR. O detalhe de códigos não mapeados vai só para o log.
 */
export const traduzirErroAuth = (
  status: number,
  corpo: { code?: unknown; message?: unknown } | null,
  retryAfter?: string | null,
): ErroAuthTraduzido => {
  const codigo = typeof corpo?.code === 'string' ? corpo.code : undefined;
  const mensagem = typeof corpo?.message === 'string' ? corpo.message : '';

  if (status === 429) {
    return {
      status,
      error: retryAfter
        ? `Muitas tentativas. Tente novamente em ${retryAfter} segundos.`
        : 'Muitas tentativas. Tente novamente em instantes.',
      code: 'RATE_LIMITED',
    };
  }
  if (codigo === CODIGO_DADOS_INVALIDOS) {
    return { status, error: mensagem, code: codigo };
  }
  // Rota inexistente ou desligada (disabledPaths em auth.ts): o Better Auth
  // responde 404 em texto puro, sem código.
  if (status === 404 && !codigo) {
    return { status, error: 'Rota não encontrada.' };
  }
  if (codigo && isCodigoMapeado(codigo)) {
    const mapeado = ERROS_AUTH[codigo];
    return { status: mapeado.status, error: mapeado.error, code: codigo };
  }

  console.warn(
    `Erro do Better Auth sem tradução (status ${status}, código ${codigo ?? 'nenhum'}): ${mensagem}`,
  );
  return {
    status,
    error: MENSAGEM_PADRAO,
    ...(codigo ? { code: codigo } : {}),
  };
};
