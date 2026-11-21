import * as yup from 'yup';

export const TIPOS_VOTACAO = ['ABERTA', 'SECRETA'] as const;
export type TipoVotacao = (typeof TIPOS_VOTACAO)[number];

const MIN_OPCOES = 2;
const MAX_OPCOES = 6;

const opcaoRule = () =>
  yup
    .string()
    .trim()
    .required('Preencha todas as opções.')
    .max(80, 'Cada opção deve ter no máximo 80 caracteres.');

// Mesma regra da API: resultado parcial e troca de voto ficam desligados por
// padrão, e o tipo (aberta ou secreta) é escolhido na criação.
export const votacaoSchema = yup.object({
  tipo: yup
    .string()
    .trim()
    .oneOf([...TIPOS_VOTACAO], 'Escolha se a votação é aberta ou secreta.')
    .required('Escolha se a votação é aberta ou secreta.'),
  mostrarParcial: yup
    .boolean()
    .typeError('Informe se o resultado parcial aparece.')
    .default(false),
  permiteTrocaVoto: yup
    .boolean()
    .typeError('Informe se a troca de voto é permitida.')
    .default(false),
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
