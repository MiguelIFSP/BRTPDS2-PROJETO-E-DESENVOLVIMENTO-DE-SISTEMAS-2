import type { TipoLembrete } from '@prisma/client';
import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../../config/env.ts';
import { instanteNoFuso } from '../../utils/fusoHorario.ts';
import { gerarIcs, type MetodoIcs } from './ics.ts';
import {
  templates,
  type EmailMontado,
  type ReuniaoEmail,
} from './templates.ts';

export type Destinatario = {
  nome: string;
  email: string;
  // só no convite: vira os botões Aceitar/Recusar.
  tokenResposta?: string | null;
};

// Links dos botões, ou nada se faltar o endereço público da API ou o token
// (convite criado antes do recurso).
const linksResposta = (token?: string | null) => {
  if (!env.API_PUBLIC_URL || !token) return undefined;
  const base = `${env.API_PUBLIC_URL}/api/convites/${encodeURIComponent(token)}`;
  return {
    aceitar: `${base}?resposta=aceitar`,
    recusar: `${base}?resposta=recusar`,
  };
};

let transporter: Transporter | null = null;
let avisouDesligado = false;

// Sem credenciais o envio fica desligado; avisa uma vez só, para não poluir o
// log a cada reunião criada.
const obterTransporter = () => {
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
    if (!avisouDesligado) {
      console.warn(
        'E-mail desligado: defina GMAIL_USER e GMAIL_APP_PASSWORD no .env para enviar convites e lembretes.',
      );
      avisouDesligado = true;
    }
    return null;
  }
  transporter ??= nodemailer.createTransport({
    service: 'gmail',
    auth: { user: env.GMAIL_USER, pass: env.GMAIL_APP_PASSWORD },
  });
  return transporter;
};

const descricaoIcs = (reuniao: ReuniaoEmail) =>
  [
    `Pauta: ${reuniao.pauta}`,
    ...(reuniao.descricao ? [reuniao.descricao] : []),
    `Comissão: ${reuniao.comissao}`,
  ].join('\n');

const icsPara = (
  metodo: MetodoIcs,
  reuniao: ReuniaoEmail,
  destinatario: Destinatario,
) => ({
  method: metodo,
  filename: metodo === 'CANCEL' ? 'cancelamento.ics' : 'convite.ics',
  content: gerarIcs(metodo, {
    reuniaoId: reuniao.id,
    titulo: reuniao.titulo,
    descricao: descricaoIcs(reuniao),
    local: reuniao.local,
    inicio: instanteNoFuso(reuniao.data, reuniao.horaInicio, env.TZ_REUNIOES),
    fim: instanteNoFuso(reuniao.data, reuniao.horaFim, env.TZ_REUNIOES),
    organizador: { nome: reuniao.organizador, email: env.GMAIL_USER ?? '' },
    participante: { nome: destinatario.nome, email: destinatario.email },
  }),
});

/** Envia um e-mail. Devolve false se o envio está desligado ou falhou. */
const enviar = async (
  destinatario: Destinatario,
  email: EmailMontado,
  ics?: ReturnType<typeof icsPara>,
) => {
  const transporte = obterTransporter();
  if (!transporte) return false;
  try {
    await transporte.sendMail({
      from: { name: env.MAIL_FROM_NAME, address: env.GMAIL_USER! },
      to: { name: destinatario.nome, address: destinatario.email },
      subject: email.assunto,
      text: email.texto,
      html: email.html,
      ...(ics ? { icalEvent: ics } : {}),
    });
    return true;
  } catch (error) {
    console.error(
      `Falha ao enviar "${email.assunto}" para ${destinatario.email}:`,
      error,
    );
    return false;
  }
};

// Um e-mail por pessoa, em sequência: cada .ics leva o próprio participante, e
// o Gmail limita conexões simultâneas.
const enviarParaCada = async (
  destinatarios: Destinatario[],
  montar: (destinatario: Destinatario) => {
    email: EmailMontado;
    ics?: ReturnType<typeof icsPara>;
  },
) => {
  let enviados = 0;
  for (const destinatario of destinatarios) {
    const { email, ics } = montar(destinatario);
    if (await enviar(destinatario, email, ics)) enviados += 1;
  }
  return enviados;
};

export const emailService = {
  estaLigado: () => Boolean(env.GMAIL_USER && env.GMAIL_APP_PASSWORD),

  enviarConvite: (reuniao: ReuniaoEmail, destinatarios: Destinatario[]) =>
    enviarParaCada(destinatarios, (destinatario) => ({
      email: templates.convite(
        reuniao,
        linksResposta(destinatario.tokenResposta),
      ),
      ics: icsPara('REQUEST', reuniao, destinatario),
    })),

  enviarAtualizacao: (
    reuniao: ReuniaoEmail,
    destinatarios: Destinatario[],
    aviso: { titulo: string; mensagem: string },
  ) =>
    enviarParaCada(destinatarios, (destinatario) => ({
      email: templates.atualizacao(reuniao, aviso),
      ics: icsPara('REQUEST', reuniao, destinatario),
    })),

  enviarExclusao: (reuniao: ReuniaoEmail, destinatarios: Destinatario[]) =>
    enviarParaCada(destinatarios, (destinatario) => ({
      email: templates.exclusao(reuniao),
      ics: icsPara('CANCEL', reuniao, destinatario),
    })),

  enviarLembrete: (
    reuniao: ReuniaoEmail,
    destinatario: Destinatario,
    tipo: TipoLembrete,
  ) => enviar(destinatario, templates.lembrete(reuniao, tipo)),

  /**
   * Dispara sem segurar a resposta HTTP: o e-mail sai depois que a operação no
   * banco já foi confirmada, e uma falha só vai para o log. Com o e-mail
   * desligado nem chama `envio`, que costuma consultar o banco.
   */
  emSegundoPlano(envio: () => Promise<unknown>) {
    if (!obterTransporter()) return;
    void envio().catch((error: unknown) =>
      console.error('Falha no envio de e-mails:', error),
    );
  },
};
