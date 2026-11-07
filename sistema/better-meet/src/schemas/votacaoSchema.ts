import * as yup from 'yup';

const MIN_OPCOES = 2;
const MAX_OPCOES = 6;

const opcaoRule = () =>
  yup
    .string()
    .trim()
    .required('Preencha todas as opções.')
    .max(80, 'Cada opção deve ter no máximo 80 caracteres.');

// Mesma regra da API.
export const votacaoSchema = yup.object({
  titulo: yup
    .string()
    .trim()
    .required('Informe o título da votação.')
    .min(3, 'O título deve ter pelo menos 3 caracteres.')
    .max(120, 'O título deve ter no máximo 120 caracteres.'),
  opcoes: yup
    .array()
    .of(opcaoRule())
    .required('Informe as opções.')
    .min(MIN_OPCOES, 'Informe pelo menos duas opções.')
    .max(MAX_OPCOES, 'Uma votação pode ter no máximo 6 opções.')
    .test('opcoes-unicas', 'As opções não podem se repetir.', (opcoes) => {
      if (!opcoes) return true;
      const textos = opcoes.map((opcao) => opcao.trim().toLocaleLowerCase());
      return new Set(textos).size === textos.length;
    }),
});

export const MAX_OPCOES_VOTACAO = MAX_OPCOES;
