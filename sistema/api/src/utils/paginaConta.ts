import { escapeHtml, layoutPagina } from './paginaHtml.ts';

// Página aberta no navegador ao fim do link de confirmação de e-mail. O Better
// Auth grava a confirmação e redireciona para cá, com ?error=<código> se o
// link não valeu. O app não é aberto daqui: a pessoa volta a ele e entra.

const VOLTAR_AO_APP =
  'Volte ao app Better Meet e entre com seu e-mail e senha.';

const RESULTADOS = {
  confirmado: {
    titulo: 'E-mail confirmado',
    texto: `Tudo certo: seu e-mail foi confirmado. ${VOLTAR_AO_APP}`,
  },
  expirado: {
    titulo: 'Link expirado',
    texto: `Este link de confirmação venceu e o e-mail não foi confirmado. ${VOLTAR_AO_APP} Ao tentar entrar, enviamos um novo link.`,
  },
  invalido: {
    titulo: 'Link inválido',
    texto: `Não foi possível confirmar o e-mail com este link. ${VOLTAR_AO_APP} Se o e-mail ainda não estiver confirmado, ao tentar entrar enviamos um novo link.`,
  },
} as const satisfies Record<string, { titulo: string; texto: string }>;

export type ResultadoConfirmacao = keyof typeof RESULTADOS;

/** Classifica o ?error do redirecionamento; o valor nunca vai para a página. */
export const getResultadoConfirmacao = (
  erro: unknown,
): ResultadoConfirmacao => {
  if (erro === undefined || erro === '') return 'confirmado';
  return erro === 'TOKEN_EXPIRED' ? 'expirado' : 'invalido';
};

export const paginaConta = {
  emailConfirmado: (resultado: ResultadoConfirmacao) => {
    const { titulo, texto } = RESULTADOS[resultado];
    return layoutPagina(
      titulo,
      `<h1>${escapeHtml(titulo)}</h1><p>${escapeHtml(texto)}</p>`,
    );
  },
};
