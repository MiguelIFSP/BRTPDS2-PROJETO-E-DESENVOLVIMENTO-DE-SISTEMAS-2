import * as yup from 'yup';

export const nomeRule = () =>
  yup
    .string()
    .trim()
    .required('O nome completo é obrigatório.')
    .min(2, 'O nome deve ter pelo menos 2 caracteres.')
    .max(80, 'O nome deve ter no máximo 80 caracteres.');

export const emailRule = () =>
  yup
    .string()
    .trim()
    .lowercase()
    .required('O e-mail é obrigatório.')
    .email('Informe um e-mail válido.')
    .max(160, 'O e-mail deve ter no máximo 160 caracteres.');

// rotulo: como a senha aparece na mensagem ('A senha', 'A nova senha').
export const senhaForteRule = (rotulo = 'A senha') =>
  yup
    .string()
    .required(`${rotulo} é obrigatória.`)
    .min(8, `${rotulo} deve ter pelo menos 8 caracteres.`)
    .max(72, `${rotulo} deve ter no máximo 72 caracteres.`)
    .matches(/[A-Z]/, `${rotulo} deve conter pelo menos uma letra maiúscula.`)
    .matches(/[a-z]/, `${rotulo} deve conter pelo menos uma letra minúscula.`)
    .matches(/[0-9]/, `${rotulo} deve conter pelo menos um número.`);

// Id vindo no corpo da requisição: inteiro positivo, com a mesma mensagem para
// qualquer valor fora disso (texto, decimal, zero ou negativo).
export const idRule = (mensagem: string) =>
  yup.number().typeError(mensagem).integer(mensagem).positive(mensagem);
