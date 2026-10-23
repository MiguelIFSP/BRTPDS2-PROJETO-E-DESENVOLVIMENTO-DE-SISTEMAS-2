import {
  StatusConviteReuniao,
  StatusReuniao,
  TipoLembrete,
} from '@prisma/client';
import prisma from '../config/database.ts';
import { env } from '../config/env.ts';
import {
  dataNoFuso,
  instanteNoFuso,
  somarMinutos,
} from '../utils/fusoHorario.ts';
import { PRISMA_ERROR, isPrismaError } from '../utils/prismaErrors.ts';
import { emailService } from './email/emailService.ts';

const INTERVALO_MS = 60_000;
// Lembrete que passou da hora há mais que isso não sai mais (API fora do ar,
// reunião criada em cima da hora). Folga para o atraso do próprio job.
const TOLERANCIA_MINUTOS = 10;
// O das 07h só vai se a reunião começar depois das 08h; antes disso ele
// ficaria colado no de 1 hora antes.
const INICIO_MINIMO_LEMBRETE_MANHA = '08:00';

export type LembreteAgendado = { tipo: TipoLembrete; em: Date };

/** Horários dos lembretes de uma reunião, do mais cedo para o mais tarde. */
export const horariosDosLembretes = (
  data: string,
  horaInicio: string,
  fuso: string,
): LembreteAgendado[] => {
  const inicio = instanteNoFuso(data, horaInicio, fuso);
  return [
    ...(horaInicio > INICIO_MINIMO_LEMBRETE_MANHA
      ? [{ tipo: TipoLembrete.MANHA, em: instanteNoFuso(data, '07:00', fuso) }]
      : []),
    { tipo: TipoLembrete.UMA_HORA, em: somarMinutos(inicio, -60) },
    { tipo: TipoLembrete.QUINZE_MINUTOS, em: somarMinutos(inicio, -15) },
  ];
};

/**
 * Lembretes que estão na hora: já chegou o horário, faz menos que a tolerância
 * e a reunião ainda não começou. Só o último é enviado; os anteriores ficaram
 * redundantes.
 */
export const lembretesNaHora = (
  data: string,
  horaInicio: string,
  fuso: string,
  agora: Date,
) => {
  if (agora >= instanteNoFuso(data, horaInicio, fuso)) return [];
  const limite = somarMinutos(agora, -TOLERANCIA_MINUTOS);
  return horariosDosLembretes(data, horaInicio, fuso).filter(
    (lembrete) => lembrete.em <= agora && lembrete.em > limite,
  );
};

const usuarioSelect = { id: true, name: true, email: true } as const;

/** Uma passada do job: envia os lembretes que estão na hora. */
export const processarLembretes = async (agora = new Date()) => {
  if (!emailService.estaLigado()) return 0;

  const fuso = env.TZ_REUNIOES;
  // Hoje e amanhã cobrem o lembrete de 1 hora de uma reunião logo depois da
  // meia-noite.
  const datas = [
    dataNoFuso(agora, fuso),
    dataNoFuso(somarMinutos(agora, 24 * 60), fuso),
  ];
  const reunioes = await prisma.reuniao.findMany({
    where: { status: StatusReuniao.AGENDADA, data: { in: datas } },
    select: {
      id: true,
      titulo: true,
      pauta: true,
      descricao: true,
      local: true,
      data: true,
      horaInicio: true,
      horaFim: true,
      criadoPor: { select: usuarioSelect },
      comissao: { select: { nome: true } },
      // Pendentes recebem só o convite; lembrete é para quem vai participar.
      convites: {
        where: { status: StatusConviteReuniao.ACEITO },
        select: { user: { select: usuarioSelect } },
      },
      lembretes: { select: { userId: true, tipo: true } },
    },
  });

  let enviados = 0;
  for (const reuniao of reunioes) {
    const naHora = lembretesNaHora(
      reuniao.data,
      reuniao.horaInicio,
      fuso,
      agora,
    );
    const alvo = naHora.at(-1);
    if (!alvo) continue;

    const participantes = [
      reuniao.criadoPor,
      ...reuniao.convites.map((convite) => convite.user),
    ];
    for (const participante of participantes) {
      const jaTratado = reuniao.lembretes.some(
        (lembrete) =>
          lembrete.userId === participante.id && lembrete.tipo === alvo.tipo,
      );
      if (jaTratado) continue;

      // Reserva antes de enviar: a chave única garante um envio só, mesmo
      // com duas instâncias da API rodando o job ao mesmo tempo.
      try {
        await prisma.lembreteEnviado.create({
          data: {
            reuniaoId: reuniao.id,
            userId: participante.id,
            tipo: alvo.tipo,
          },
        });
      } catch (error) {
        if (isPrismaError(error, PRISMA_ERROR.UNIQUE_VIOLATION)) continue;
        throw error;
      }
      const redundantes = naHora.slice(0, -1);
      if (redundantes.length > 0) {
        await prisma.lembreteEnviado.createMany({
          data: redundantes.map((lembrete) => ({
            reuniaoId: reuniao.id,
            userId: participante.id,
            tipo: lembrete.tipo,
            enviado: false,
          })),
          skipDuplicates: true,
        });
      }

      const ok = await emailService.enviarLembrete(
        {
          id: reuniao.id,
          titulo: reuniao.titulo,
          pauta: reuniao.pauta,
          descricao: reuniao.descricao,
          local: reuniao.local,
          data: reuniao.data,
          horaInicio: reuniao.horaInicio,
          horaFim: reuniao.horaFim,
          comissao: reuniao.comissao.nome,
          organizador: reuniao.criadoPor.name,
        },
        { nome: participante.name, email: participante.email },
        alvo.tipo,
      );
      if (ok) {
        enviados += 1;
      } else {
        // Libera a reserva para tentar de novo na próxima passada, enquanto
        // ainda estiver dentro da tolerância.
        await prisma.lembreteEnviado.deleteMany({
          where: {
            reuniaoId: reuniao.id,
            userId: participante.id,
            tipo: alvo.tipo,
          },
        });
      }
    }
  }
  return enviados;
};

let timer: NodeJS.Timeout | null = null;
let rodando = false;

const passada = async () => {
  // Uma passada lenta (muitos e-mails) não pode se sobrepor à próxima.
  if (rodando) return;
  rodando = true;
  try {
    await processarLembretes();
  } catch (error) {
    console.error('Falha ao processar lembretes de reunião:', error);
  } finally {
    rodando = false;
  }
};

export const lembreteService = {
  iniciar() {
    if (timer) return;
    if (!emailService.estaLigado()) {
      console.warn(
        'Lembretes por e-mail desligados (GMAIL_USER/GMAIL_APP_PASSWORD).',
      );
      return;
    }
    void passada();
    timer = setInterval(() => void passada(), INTERVALO_MS);
    console.log('Lembretes por e-mail ativos (verificação a cada minuto).');
  },

  parar() {
    if (timer) clearInterval(timer);
    timer = null;
  },
};
