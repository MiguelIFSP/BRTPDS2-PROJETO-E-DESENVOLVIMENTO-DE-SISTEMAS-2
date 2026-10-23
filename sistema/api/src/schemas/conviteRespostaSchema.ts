import * as yup from 'yup';
import { RESPOSTAS_DO_LINK } from '../utils/paginaResposta.ts';

// Formulário da página aberta pelos botões do e-mail de convite.
export const conviteRespostaSchema = yup.object({
  resposta: yup
    .string()
    .required('Escolha aceitar ou recusar o convite.')
    .oneOf([...RESPOSTAS_DO_LINK], 'Resposta inválida.'),
});
