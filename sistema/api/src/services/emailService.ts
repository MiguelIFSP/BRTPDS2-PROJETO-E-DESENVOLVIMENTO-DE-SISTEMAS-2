import type { TipoLembrete } from '@prisma/client';
import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env.ts';
import { instanteNoFuso } from '../utils/fusoHorario.ts';
import { buildIcs, type MetodoIcs } from '../utils/ics.ts';
import {
  emailTemplates,
  type EmailMontado,
  type ReuniaoEmail,
} from '../utils/emailTemplates.ts';

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
const getTransporter = () => {
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

const buildAnexoIcs = (
  metodo: MetodoIcs,
  reuniao: ReuniaoEmail,
  destinatario: Destinatario,
) => ({
  method: metodo,
  filename: metodo === 'CANCEL' ? 'cancelamento.ics' : 'convite.ics',
  content: buildIcs(metodo, {
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
const send = async (
  destinatario: Destinatario,
  email: EmailMontado,
  ics?: ReturnType<typeof buildAnexoIcs>,
) => {
  const transporte = getTransporter();
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
const sendToEach = async (
  destinatarios: Destinatario[],
  build: (destinatario: Destinatario) => {
    email: EmailMontado;
    ics?: ReturnType<typeof buildAnexoIcs>;
  },
) => {
  let enviados = 0;
  for (const destinatario of destinatarios) {
    const { email, ics } = build(destinatario);
    if (await send(destinatario, email, ics)) enviados += 1;
  }
  return enviados;
};

export const emailService = {
  isEnabled: () => Boolean(env.GMAIL_USER && env.GMAIL_APP_PASSWORD),

  sendConvite: (reuniao: ReuniaoEmail, destinatarios: Destinatario[]) =>
    sendToEach(destinatarios, (destinatario) => ({
      email: emailTemplates.convite(
        reuniao,
        linksResposta(destinatario.tokenResposta),
      ),
      ics: buildAnexoIcs('REQUEST', reuniao, destinatario),
    })),

  sendAtualizacao: (
    reuniao: ReuniaoEmail,
    destinatarios: Destinatario[],
    aviso: { titulo: string; mensagem: string },
  ) =>
    sendToEach(destinatarios, (destinatario) => ({
      email: emailTemplates.atualizacao(reuniao, aviso),
      ics: buildAnexoIcs('REQUEST', reuniao, destinatario),
    })),

  sendExclusao: (reuniao: ReuniaoEmail, destinatarios: Destinatario[]) =>
    sendToEach(destinatarios, (destinatario) => ({
      email: emailTemplates.exclusao(reuniao),
      ics: buildAnexoIcs('CANCEL', reuniao, destinatario),
    })),

  sendLembrete: (
    reuniao: ReuniaoEmail,
    destinatario: Destinatario,
    tipo: TipoLembrete,
  ) => send(destinatario, emailTemplates.lembrete(reuniao, tipo)),

  /**
   * Dispara sem segurar a resposta HTTP: o e-mail sai depois que a operação no
   * banco já foi confirmada, e uma falha só vai para o log. Com o e-mail
   * desligado nem chama `envio`, que costuma consultar o banco.
   */
  runInBackground(envio: () => Promise<unknown>) {
    if (!getTransporter()) return;
    void envio().catch((error: unknown) =>
      console.error('Falha no envio de e-mails:', error),
    );
  },
};
