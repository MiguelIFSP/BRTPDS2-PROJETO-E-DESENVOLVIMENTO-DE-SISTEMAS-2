import { StatusConviteReuniao } from '@prisma/client';
import * as yup from 'yup';
import { env } from '../config/env.ts';
import {
  dataExistenteRule,
  fimNaoPassadoRule,
  horaRule,
  horarioFinalPosteriorRule,
  idRule,
  inicioNaoPassadoRule,
} from './commonSchema.ts';

export const reuniaoSchema = yup
  .object({
    comissaoId: idRule('A comissão informada é inválida.').required(
      'Informe a comissão.',
    ),
    convidados: yup
      .array()
      .of(idRule('Um dos convidados é inválido.').defined())
      .ensure()
      .test(
        'convidados-unicos',
        'Não é possível repetir convidados.',
        (value) => new Set(value ?? []).size === (value ?? []).length,
      ),
    titulo: yup
      .string()
      .trim()
      .required('O título da reunião é obrigatório.')
      .max(80, 'O título da reunião deve ter no máximo 80 caracteres.'),
    pauta: yup
      .string()
      .trim()
      .required('A pauta da reunião é obrigatória.')
      .max(1000, 'A pauta deve ter no máximo 1000 caracteres.'),
    descricao: yup
      .string()
      .trim()
      .max(2000, 'A descrição deve ter no máximo 2000 caracteres.')
      .optional(),
    // Texto livre: endereço, link da chamada ou os dois (reunião híbrida).
    local: yup
      .string()
      .trim()
      .required('Informe o local ou o link da reunião.')
      .max(500, 'O local deve ter no máximo 500 caracteres.'),
    data: dataExistenteRule(),
    horaInicio: horaRule('inicial'),
    horaFim: horaRule('final'),
  })
  .test(horarioFinalPosteriorRule())
  .test(inicioNaoPassadoRule(env.TZ_REUNIOES))
  .test(fimNaoPassadoRule(env.TZ_REUNIOES));

export const respostaConviteSchema = yup.object({
  status: yup
    .string<StatusConviteReuniao>()
    .oneOf(
      [StatusConviteReuniao.ACEITO, StatusConviteReuniao.RECUSADO],
      'O convite deve ser aceito ou recusado.',
    )
    .required('Informe a resposta do convite.'),
});

export const conviteMembrosReuniaoSchema = yup.object({
  convidados: yup
    .array()
    .of(idRule('Um dos convidados é inválido.').defined())
    .min(1, 'Selecione pelo menos um membro.')
    .required('Selecione pelo menos um membro.')
    .test(
      'convidados-unicos',
      'Não é possível repetir convidados.',
      (value) => new Set(value ?? []).size === (value ?? []).length,
    ),
});

export const edicaoReuniaoSchema = reuniaoSchema.omit(['comissaoId']);
