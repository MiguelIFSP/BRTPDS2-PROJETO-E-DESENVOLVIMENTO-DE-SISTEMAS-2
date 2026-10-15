import { Tema } from '@prisma/client';
import * as yup from 'yup';
import { emailRule, idRule, nomeRule, senhaForteRule } from './commonSchema.ts';

// Cadastro (create)
export const cadastroUsuarioSchema = yup.object({
  nome: nomeRule(),
  email: emailRule(),
  password: senhaForteRule(),
  // o campo só existe para recusar quem tenta se cadastrar como ADMIN
  role: yup
    .string()
    .oneOf(['USER'], 'A criação de administrador é restrita ao sistema.')
    .default('USER'),
});

// Troca de senha (updatePassword)
export const trocaSenhaSchema = yup.object({
  currentPassword: yup.string().required('A senha atual é obrigatória.'),
  newPassword: senhaForteRule('A nova senha'),
});

// Alteração de dados pessoais (updateProfile — UC03)
export const perfilSchema = yup.object({
  nome: nomeRule(),
  email: emailRule(),
});

// Alteração de tema (updateTheme — UC04)
export const temaSchema = yup.object({
  theme: yup
    .string<Tema>()
    .oneOf(Object.values(Tema), 'Tema inválido. Use: light, dark ou system.')
    .required('Informe o tema desejado.'),
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// Mapa dinâmico id -> id do sucessor. As chaves dependem do usuário, então o
// formato é montado a partir do próprio valor (yup.lazy); com um yup.object()
// sem campos declarados, o stripUnknown apagaria o mapa inteiro.
const sucessoresRule = () =>
  yup.lazy((value: unknown) =>
    yup
      .object(
        Object.fromEntries(
          Object.keys(isRecord(value) ? value : {}).map((key) => [
            key,
            idRule('Sucessor inválido.').required('Sucessor inválido.'),
          ]),
        ),
      )
      .default({}),
  );

export const exclusaoContaSchema = yup.object({
  // organizacaoId -> novoCriadorId
  sucessores: sucessoresRule(),
  // comissaoId -> novoAdministradorId
  sucessoresComissao: sucessoresRule(),
});
