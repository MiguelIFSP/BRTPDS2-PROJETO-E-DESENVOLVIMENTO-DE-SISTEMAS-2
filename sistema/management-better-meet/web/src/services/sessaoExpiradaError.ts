// Erro tipado para 401: as telas checam `instanceof` em vez de procurar texto na
// mensagem, assim trocar o texto não quebra o redirecionamento para o login.
export class SessaoExpiradaError extends Error {
  constructor(message = 'Sessão expirada, faça login novamente.') {
    super(message);
    this.name = 'SessaoExpiradaError';
  }
}
