import { TipoVotacao } from '@prisma/client';
import * as yup from 'yup';
import { idRule } from './commonSchema.ts';

const MIN_OPCOES = 2;
const MAX_OPCOES = 6;

const opcaoRule = () =>
  yup
    .string()
    .trim()
    .required('Preencha todas as opções.')
    .max(80, 'Cada opção deve ter no máximo 80 caracteres.');

// Título, de 2 a 6 opções sem repetir o texto, tipo e as duas opções de
// resultado parcial e troca de voto (desligadas por padrão).
export const votacaoSchema = yup.object({
  tipo: yup
    .string()
    .trim()
    .oneOf(
      Object.values(TipoVotacao),
      'Escolha se a votação é aberta ou secreta.',
    )
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

const MENSAGEM_VOTO = 'Escolha uma opção ou o voto nulo.';

// Exatamente um dos dois: uma opção ou o voto nulo.
export const votoSchema = yup
  .object({
    opcaoId: idRule(MENSAGEM_VOTO),
    nulo: yup.boolean().typeError(MENSAGEM_VOTO),
  })
  .test('opcao-ou-nulo', MENSAGEM_VOTO, (voto) =>
    voto.nulo === true
      ? voto.opcaoId === undefined
      : voto.opcaoId !== undefined,
  );

export type VotacaoInput = yup.InferType<typeof votacaoSchema>;
export type VotoInput = yup.InferType<typeof votoSchema>;
