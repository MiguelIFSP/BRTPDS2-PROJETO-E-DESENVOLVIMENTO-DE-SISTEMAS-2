import { randomBytes } from 'node:crypto';

// 32 bytes aleatórios (43 caracteres em base64url): impossível de adivinhar e
// seguro para ir na URL dos botões do e-mail de convite.
export const generateTokenResposta = () =>
  randomBytes(32).toString('base64url');
