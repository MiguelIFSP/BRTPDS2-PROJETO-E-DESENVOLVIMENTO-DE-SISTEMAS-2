import {
  StatusConviteReuniao,
  StatusMarcacaoPresenca,
  TipoEventoPresenca,
  type PapelComissao,
  type Prisma,
  type Role,
} from '@prisma/client';
import prisma from '../config/database.ts';
import { env } from '../config/env.ts';
import { AppError } from '../errors/AppError.ts';
import { podeGerirReuniao } from './permissaoReuniaoService.ts';
import { estadoDaReuniao, instanteNoFuso } from '../utils/fusoHorario.ts';

type EventoPresencaData = {
  tipo: TipoEventoPresenca;
  hora: string;
  motivo?: string | undefined;
};

const reuniaoSelect = {
  id: true,
  titulo: true,
  data: true,
  horaInicio: true,
  horaFim: true,
  local: true,
  status: true,
  comissaoId: true,
  criadoPorUserId: true,
  criadoPor: { select: { name: true, email: true } },
  comissao: {
    select: {
      id: true,
      nome: true,
      organizacao: { select: { id: true, nome: true } },
      equipe: {
        select: {
          userId: true,
          papel: true,
          user: { select: { name: true, email: true } },
        },
      },
    },
  },
  convites: {
    select: {
      userId: true,
      status: true,
      user: { select: { name: true, email: true } },
    },
  },
  registros: { select: { userId: true, entradaAt: true, saidaAt: true } },
  presencasManuais: {
    select: {
      userId: true,
      status: true,
      observacao: true,
      updatedAt: true,
      marcadoPor: { select: { name: true } },
    },
  },
  eventosPresenca: {
    orderBy: { ocorridoAt: 'asc' },
    select: {
      id: true,
      userId: true,
      tipo: true,
      ocorridoAt: true,
      motivo: true,
      createdAt: true,
      registradoPor: { select: { name: true } },
    },
  },
} satisfies Prisma.ReuniaoSelect;

type ReuniaoLista = Prisma.ReuniaoGetPayload<{ select: typeof reuniaoSelect }>;

const carregarReuniao = async (reuniaoId: number) => {
  const reuniao = await prisma.reuniao.findUnique({
    where: { id: reuniaoId },
    select: reuniaoSelect,
  });
  if (!reuniao) throw new AppError(404, 'Reunião não encontrada.');
  return reuniao;
};

const exigirPermissao = async (
  userId: number,
  role: Role,
  reuniao: Pick<ReuniaoLista, 'criadoPorUserId' | 'comissaoId'>,
) => {
  if (!(await podeGerirReuniao(userId, role, reuniao))) {
    throw new AppError(
      403,
      'Somente quem administra a reunião pode consultar e alterar a lista de presença.',
    );
  }
};

// Antes do início não houve participação a registrar. No instante exato do
// início a lista já pode ser alterada, e continua assim depois do término.
const exigirReuniaoIniciada = (
  reuniao: Pick<ReuniaoLista, 'data' | 'horaInicio'>,
) => {
  const inicio = instanteNoFuso(
    reuniao.data,
    reuniao.horaInicio,
    env.TZ_REUNIOES,
  );
  if (new Date() < inicio) {
    throw new AppError(
      409,
      'A lista de presença só pode ser alterada após o início da reunião.',
    );
  }
};

const participantesDaReuniao = (reuniao: ReuniaoLista) => {
  const porId = new Map<
    number,
    {
      userId: number;
      nome: string;
      email: string;
      papel: PapelComissao | null;
      convite: StatusConviteReuniao | null;
    }
  >();

  for (const convite of reuniao.convites) {
    if (convite.status === StatusConviteReuniao.RECUSADO) continue;
    const vinculo = reuniao.comissao.equipe.find(
      (membro) => membro.userId === convite.userId,
    );
    porId.set(convite.userId, {
      userId: convite.userId,
      nome: convite.user.name,
      email: convite.user.email,
      papel: vinculo?.papel ?? null,
      convite: convite.status,
    });
  }

  const creatorId = reuniao.criadoPorUserId;
  if (creatorId && reuniao.criadoPor) {
    const vinculo = reuniao.comissao.equipe.find(
      (membro) => membro.userId === creatorId,
    );
    porId.set(creatorId, {
      userId: creatorId,
      nome: reuniao.criadoPor.name,
      email: reuniao.criadoPor.email,
      papel: vinculo?.papel ?? null,
      convite: null,
    });
  }

  for (const registro of reuniao.registros) {
    if (porId.has(registro.userId)) continue;
    const vinculo = reuniao.comissao.equipe.find(
      (membro) => membro.userId === registro.userId,
    );
    if (vinculo) {
      porId.set(registro.userId, {
        userId: registro.userId,
        nome: vinculo.user.name,
        email: vinculo.user.email,
        papel: vinculo.papel,
        convite: null,
      });
    }
  }

  return [...porId.values()].sort((left, right) =>
    left.nome.localeCompare(right.nome, 'pt-BR'),
  );
};

const apresentarLista = (reuniao: ReuniaoLista) => {
  const estado = estadoDaReuniao(reuniao, env.TZ_REUNIOES).estado;
  const participantes = participantesDaReuniao(reuniao);
  const registros = new Map(
    reuniao.registros.map((registro) => [registro.userId, registro]),
  );
  const marcacoes = new Map(
    reuniao.presencasManuais.map((marcacao) => [marcacao.userId, marcacao]),
  );
  const eventos = new Map<number, typeof reuniao.eventosPresenca>();
  for (const evento of reuniao.eventosPresenca) {
    const atuais = eventos.get(evento.userId) ?? [];
    eventos.set(evento.userId, [...atuais, evento]);
  }

  return {
    cabecalho: {
      reuniao: {
        id: reuniao.id,
        titulo: reuniao.titulo,
        data: reuniao.data,
        horaInicio: reuniao.horaInicio,
        horaFim: reuniao.horaFim,
        local: reuniao.local,
        fusoHorario: env.TZ_REUNIOES,
        estado,
        podeExportar: estado === 'ENCERRADA',
      },
      organizacao: reuniao.comissao.organizacao,
      comissao: { id: reuniao.comissao.id, nome: reuniao.comissao.nome },
    },
    participantes: participantes.map((participante) => {
      const registro = registros.get(participante.userId) ?? null;
      const marcacao = marcacoes.get(participante.userId) ?? null;
      return {
        ...participante,
        status:
          marcacao?.status ??
          (registro?.entradaAt
            ? StatusMarcacaoPresenca.PRESENTE
            : 'SEM_MARCACAO'),
        entrada: registro?.entradaAt.toISOString() ?? null,
        saida: registro?.saidaAt?.toISOString() ?? null,
        observacao: marcacao?.observacao ?? null,
        marcadoPor: marcacao?.marcadoPor.name ?? null,
        marcadoEm: marcacao?.updatedAt.toISOString() ?? null,
        eventos: (eventos.get(participante.userId) ?? []).map((evento) => ({
          id: evento.id,
          tipo: evento.tipo,
          ocorridoAt: evento.ocorridoAt.toISOString(),
          motivo: evento.motivo,
          registradoPor: evento.registradoPor.name,
          registradoEm: evento.createdAt.toISOString(),
        })),
      };
    }),
    totais: {
      participantes: participantes.length,
      presentes: participantes.filter((participante) => {
        const marcacao = marcacoes.get(participante.userId);
        return (
          marcacao?.status === StatusMarcacaoPresenca.PRESENTE ||
          (!marcacao &&
            registros.get(participante.userId)?.entradaAt !== undefined)
        );
      }).length,
      ausentes: participantes.filter(
        (participante) =>
          marcacoes.get(participante.userId)?.status ===
          StatusMarcacaoPresenca.AUSENTE,
      ).length,
    },
  };
};

const exigirParticipante = (reuniao: ReuniaoLista, userId: number) => {
  const convite = reuniao.convites.find((item) => item.userId === userId);
  const temRegistro = reuniao.registros.some(
    (registro) => registro.userId === userId,
  );
  const isCreator = reuniao.criadoPorUserId === userId;
  if (
    !isCreator &&
    !temRegistro &&
    (!convite || convite.status === StatusConviteReuniao.RECUSADO)
  ) {
    throw new AppError(404, 'Participante não encontrado nesta reunião.');
  }
};

export const listaPresencaService = {
  async getByReuniao(userId: number, role: Role, reuniaoId: number) {
    const reuniao = await carregarReuniao(reuniaoId);
    await exigirPermissao(userId, role, reuniao);
    return apresentarLista(reuniao);
  },

  async updateMark(
    actorId: number,
    role: Role,
    reuniaoId: number,
    participanteId: number,
    data: {
      status?: StatusMarcacaoPresenca | 'SEM_MARCACAO' | undefined;
      observacao?: string | undefined;
    },
  ) {
    const reuniao = await carregarReuniao(reuniaoId);
    await exigirPermissao(actorId, role, reuniao);
    exigirParticipante(reuniao, participanteId);
    exigirReuniaoIniciada(reuniao);

    const existente = await prisma.reuniaoPresenca.findUnique({
      where: { reuniaoId_userId: { reuniaoId, userId: participanteId } },
      select: { status: true, observacao: true },
    });
    const status =
      data.status === undefined
        ? (existente?.status ?? null)
        : data.status === 'SEM_MARCACAO'
          ? null
          : data.status;
    const observacao =
      data.observacao === undefined
        ? (existente?.observacao ?? null)
        : data.observacao.trim() || null;

    if (status === null && observacao === null) {
      await prisma.reuniaoPresenca.deleteMany({
        where: { reuniaoId, userId: participanteId },
      });
    } else {
      await prisma.reuniaoPresenca.upsert({
        where: { reuniaoId_userId: { reuniaoId, userId: participanteId } },
        create: {
          reuniaoId,
          userId: participanteId,
          status,
          observacao,
          marcadoPorId: actorId,
        },
        update: { status, observacao, marcadoPorId: actorId },
      });
    }

    return this.getByReuniao(actorId, role, reuniaoId);
  },

  async addEvent(
    actorId: number,
    role: Role,
    reuniaoId: number,
    participanteId: number,
    data: EventoPresencaData,
  ) {
    return prisma.$transaction(async (transaction) => {
      const reuniao = await transaction.reuniao.findUnique({
        where: { id: reuniaoId },
        select: {
          id: true,
          data: true,
          horaInicio: true,
          horaFim: true,
          status: true,
          comissaoId: true,
          criadoPorUserId: true,
          convites: { select: { userId: true, status: true } },
          registros: {
            where: { userId: participanteId },
            select: { entradaAt: true },
          },
        },
      });
      if (!reuniao) throw new AppError(404, 'Reunião não encontrada.');
      await exigirPermissao(actorId, role, reuniao);
      const convite = reuniao.convites.find(
        (item) => item.userId === participanteId,
      );
      if (
        reuniao.criadoPorUserId !== participanteId &&
        !reuniao.registros[0] &&
        (!convite || convite.status === StatusConviteReuniao.RECUSADO)
      ) {
        throw new AppError(404, 'Participante não encontrado nesta reunião.');
      }
      if (reuniao.status === 'CANCELADA') {
        throw new AppError(
          409,
          'Não é possível registrar eventos em uma reunião cancelada.',
        );
      }
      exigirReuniaoIniciada(reuniao);

      const ocorridoAt = instanteNoFuso(
        reuniao.data,
        data.hora,
        env.TZ_REUNIOES,
      );
      const inicio = instanteNoFuso(
        reuniao.data,
        reuniao.horaInicio,
        env.TZ_REUNIOES,
      );
      const fim = instanteNoFuso(
        reuniao.data,
        reuniao.horaFim,
        env.TZ_REUNIOES,
      );
      if (ocorridoAt < inicio || ocorridoAt > fim) {
        throw new AppError(
          400,
          'O horário informado precisa estar dentro do período da reunião.',
        );
      }

      const anterior = await transaction.reuniaoEventoPresenca.findFirst({
        where: { reuniaoId, userId: participanteId },
        orderBy: [{ ocorridoAt: 'desc' }, { id: 'desc' }],
        select: { tipo: true, ocorridoAt: true },
      });
      if (anterior && ocorridoAt <= anterior.ocorridoAt) {
        throw new AppError(
          409,
          'O horário do novo evento precisa ser posterior ao evento anterior.',
        );
      }
      if (
        data.tipo === TipoEventoPresenca.SAIDA &&
        anterior?.tipo === TipoEventoPresenca.SAIDA
      ) {
        throw new AppError(409, 'Registre o retorno antes de uma nova saída.');
      }
      if (
        data.tipo === TipoEventoPresenca.RETORNO &&
        anterior?.tipo !== TipoEventoPresenca.SAIDA
      ) {
        throw new AppError(409, 'Registre uma saída antes do retorno.');
      }
      if (
        data.tipo === TipoEventoPresenca.SAIDA &&
        !reuniao.registros[0]?.entradaAt
      ) {
        const marcacao = await transaction.reuniaoPresenca.findUnique({
          where: { reuniaoId_userId: { reuniaoId, userId: participanteId } },
          select: { status: true },
        });
        if (marcacao?.status !== StatusMarcacaoPresenca.PRESENTE) {
          throw new AppError(
            409,
            'Marque a pessoa como presente antes de registrar a saída.',
          );
        }
      }

      const evento = await transaction.reuniaoEventoPresenca.create({
        data: {
          reuniaoId,
          userId: participanteId,
          tipo: data.tipo,
          ocorridoAt,
          motivo:
            data.tipo === TipoEventoPresenca.SAIDA
              ? data.motivo?.trim() || null
              : null,
          registradoPorId: actorId,
        },
        select: {
          id: true,
          tipo: true,
          ocorridoAt: true,
          motivo: true,
          createdAt: true,
          registradoPor: { select: { name: true } },
        },
      });
      return {
        ...evento,
        ocorridoAt: evento.ocorridoAt.toISOString(),
        createdAt: evento.createdAt.toISOString(),
        registradoPor: evento.registradoPor.name,
      };
    });
  },
};
