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

const escapeHtml = (texto: string) =>
  texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

type ConteudoConta = {
  assunto: string;
  paragrafos: string[];
  botao?: { rotulo: string; url: string };
  // código de uso único que a pessoa digita no app; vai sem link nem botão.
  codigo?: string;
};

const RODAPE_CONTA =
  'Se você não fez esta solicitação, ignore este e-mail. Ele é automático.';

// E-mails de conta nunca levam senha, só o link ou o código de uso único.
const montarEmailConta = ({
  assunto,
  paragrafos,
  botao,
  codigo,
}: ConteudoConta): EmailMontado => {
  const texto = [
    ...paragrafos,
    ...(botao ? [`${botao.rotulo}: ${botao.url}`] : []),
    ...(codigo ? [`Código: ${codigo}`] : []),
    RODAPE_CONTA,
  ].join('\n\n');
  const html = `<!doctype html>
<html lang="pt-BR"><body style="margin:0;padding:24px;background:#f4f6f6;font-family:Arial,Helvetica,sans-serif;color:#1b1f20">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dfe5e5;border-radius:12px;padding:24px">
<h1 style="margin:0 0 16px;font-size:20px">${escapeHtml(assunto)}</h1>
${paragrafos.map((paragrafo) => `<p style="margin:0 0 12px;font-size:15px">${escapeHtml(paragrafo)}</p>`).join('\n')}
${botao ? `<p style="margin:16px 0"><a href="${escapeHtml(botao.url)}" style="display:inline-block;padding:12px 24px;border-radius:8px;background:#00796b;color:#ffffff;font-weight:bold;font-size:15px;text-decoration:none">${escapeHtml(botao.rotulo)}</a></p>` : ''}
${codigo ? `<p style="margin:16px 0;text-align:center"><span style="display:inline-block;padding:12px 24px;border-radius:8px;background:#e0f2f1;color:#00796b;font-family:monospace;font-size:32px;font-weight:bold;letter-spacing:8px">${escapeHtml(codigo)}</span></p>` : ''}
<p style="margin:24px 0 0;font-size:12px;color:#5b6566">${escapeHtml(RODAPE_CONTA)}</p>
</div></body></html>`;
  return { assunto, texto, html };
};

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
  // Os e-mails de conta devolvem false quando o envio está desligado ou falhou;
  // quem chama roda em segundo plano para a resposta não denunciar a conta (BR-11, BR-19).
  enviarVerificacaoEmail: (destinatario: Destinatario, url: string) =>
    send(
      destinatario,
      montarEmailConta({
        assunto: 'Confirme seu e-mail — Better Meet',
        paragrafos: [
          `Olá, ${destinatario.nome}. Confirme que este e-mail é seu para entrar no Better Meet. O link vale por 1 hora.`,
          'Depois de confirmar, volte ao app e entre com seu e-mail e senha.',
        ],
        botao: { rotulo: 'Confirmar e-mail', url },
      }),
    ),

  enviarRedefinicaoSenha: (destinatario: Destinatario, codigo: string) =>
    send(
      destinatario,
      montarEmailConta({
        assunto: 'Código para redefinir sua senha — Better Meet',
        paragrafos: [
          `Olá, ${destinatario.nome}. Recebemos um pedido para redefinir sua senha. Digite este código na tela "Nova senha" do app Better Meet.`,
          'O código vale por 15 minutos e só pode ser usado uma vez. Não compartilhe com ninguém.',
        ],
        codigo,
      }),
    ),

  enviarRedefinicaoContaSocial: (destinatario: Destinatario) =>
    send(
      destinatario,
      montarEmailConta({
        assunto: 'Recuperação de senha — Better Meet',
        paragrafos: [
          `Olá, ${destinatario.nome}. Sua conta entra com o Google e não tem senha do Better Meet. Use o botão de entrar com o Google no app.`,
        ],
      }),
    ),

  enviarAvisoSenhaAlterada: (destinatario: Destinatario) =>
    send(
      destinatario,
      montarEmailConta({
        assunto: 'Sua senha foi alterada — Better Meet',
        paragrafos: [
          `Olá, ${destinatario.nome}. A senha da sua conta foi alterada e as outras sessões foram encerradas. Se não foi você, redefina a senha pelo app e fale com o administrador.`,
        ],
      }),
    ),

  enviarAvisoCadastroExistente: (destinatario: Destinatario) =>
    send(
      destinatario,
      montarEmailConta({
        assunto: 'Tentativa de cadastro com seu e-mail — Better Meet',
        paragrafos: [
          `Olá, ${destinatario.nome}. Alguém tentou criar uma conta com o seu e-mail, que já está cadastrado. Se foi você, entre normalmente ou use "Esqueci minha senha".`,
        ],
      }),
    ),

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

  // `anterior` = nome do administrador que excluiu a conta e escolheu o destinatário.
  sendNovoAdministrador: (destinatario: Destinatario, anterior: string) =>
    send(
      destinatario,
      emailTemplates.novoAdministrador(destinatario.nome, anterior),
    ),

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
