import {
  StatusConviteReuniao,
  TipoNotificacao,
  type Prisma,
  type Role,
} from '@prisma/client';
import prisma from '../config/database.ts';
import { AppError } from '../errors/AppError.ts';
import { emailService, type Destinatario } from './email/emailService.ts';
import type { ReuniaoEmail } from './email/templates.ts';
import { PRISMA_ERROR, isPrismaError } from '../utils/prismaErrors.ts';
import { gerarTokenResposta } from '../utils/tokenResposta.ts';

type CreateReuniaoData = {
  comissaoId: number;
  convidados?: number[] | undefined;
  titulo: string;
  pauta: string;
  descricao?: string | undefined;
  local: string;
  data: string;
  horaInicio: string;
  horaFim: string;
};

const reuniaoSelect = {
  id: true,
  comissaoId: true,
  titulo: true,
  pauta: true,
  descricao: true,
  local: true,
  data: true,
  horaInicio: true,
  horaFim: true,
  status: true,
  criadoPorUserId: true,
  comissao: { select: { id: true, nome: true } },
  convites: { select: { id: true, status: true } },
} satisfies Prisma.ReuniaoSelect;

const conviteSelect = {
  id: true,
  reuniaoId: true,
  status: true,
  reuniao: {
    select: {
      titulo: true,
      pauta: true,
      descricao: true,
      local: true,
      data: true,
      horaInicio: true,
      horaFim: true,
      comissao: { select: { nome: true } },
      criadoPor: { select: { name: true } },
    },
  },
} satisfies Prisma.ConviteReuniaoSelect;

const reuniaoListSelect = {
  ...reuniaoSelect,
  convites: {
    select: {
      id: true,
      userId: true,
      status: true,
      user: { select: { name: true } },
    },
  },
  comissao: {
    select: {
      id: true,
      nome: true,
      equipe: {
        select: {
          userId: true,
          papel: true,
          user: { select: { name: true, email: true } },
        },
      },
    },
  },
  registros: {
    select: {
      id: true,
      userId: true,
      entradaAt: true,
      saidaAt: true,
    },
  },
} satisfies Prisma.ReuniaoSelect;

const assertMembroDaComissao = async (comissaoId: number, userId: number) => {
  const comissao = await prisma.comissao.findUnique({
    where: { id: comissaoId },
    select: {
      id: true,
      organizacao: { select: { status: true } },
      equipe: { select: { userId: true } },
    },
  });

  if (!comissao) {
    throw new AppError(404, 'Comissão não encontrada.');
  }
  if (comissao.organizacao.status !== 'ACEITA') {
    throw new AppError(
      409,
      'A organização da comissão ainda não foi aprovada.',
    );
  }
  if (!comissao.equipe.some((membro) => membro.userId === userId)) {
    throw new AppError(403, 'Você não é membro desta comissão.');
  }
  return comissao;
};

// Dados que alimentam o aviso de edição ou exclusão. Quem recusou o convite
// não participa mais da reunião e não é avisado.
const reuniaoAvisoSelect = {
  criadoPorUserId: true,
  titulo: true,
  pauta: true,
  descricao: true,
  local: true,
  data: true,
  horaInicio: true,
  horaFim: true,
  criadoPor: { select: { name: true } },
  comissao: { select: { nome: true } },
  convites: {
    where: { status: { not: StatusConviteReuniao.RECUSADO } },
    select: { userId: true },
  },
} satisfies Prisma.ReuniaoSelect;

type ReuniaoAviso = Prisma.ReuniaoGetPayload<{
  select: typeof reuniaoAvisoSelect;
}>;

// Criador e convidados, menos quem fez a alteração (um ADMIN que não criou
// a reunião também avisa o criador).
const destinatariosDoAviso = (reuniao: ReuniaoAviso, actorId: number) =>
  [
    ...new Set([
      reuniao.criadoPorUserId,
      ...reuniao.convites.map((convite) => convite.userId),
    ]),
  ].filter((id) => id !== actorId);

const formatarData = (data: string) => data.split('-').reverse().join('/');

const paraEmail = (reuniaoId: number, reuniao: ReuniaoAviso): ReuniaoEmail => ({
  id: reuniaoId,
  titulo: reuniao.titulo,
  pauta: reuniao.pauta,
  descricao: reuniao.descricao,
  local: reuniao.local,
  data: reuniao.data,
  horaInicio: reuniao.horaInicio,
  horaFim: reuniao.horaFim,
  comissao: reuniao.comissao.nome,
  organizador: reuniao.criadoPor.name,
});

const buscarDestinatarios = async (
  userIds: number[],
): Promise<Destinatario[]> => {
  if (userIds.length === 0) return [];
  const usuarios = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { name: true, email: true },
  });
  return usuarios.map((usuario) => ({
    nome: usuario.name,
    email: usuario.email,
  }));
};

// Convite por e-mail (com .ics) para quem acabou de ser convidado.
const enviarConvites = (reuniaoId: number, convidados: number[]) => {
  if (convidados.length === 0) return;
  emailService.emSegundoPlano(async () => {
    const reuniao = await prisma.reuniao.findUnique({
      where: { id: reuniaoId },
      select: reuniaoAvisoSelect,
    });
    if (!reuniao) return;
    // Cada convidado recebe o token do próprio convite nos botões do e-mail.
    const convites = await prisma.conviteReuniao.findMany({
      where: { reuniaoId, userId: { in: convidados } },
      select: {
        tokenResposta: true,
        user: { select: { name: true, email: true } },
      },
    });
    await emailService.enviarConvite(
      paraEmail(reuniaoId, reuniao),
      convites.map((convite) => ({
        nome: convite.user.name,
        email: convite.user.email,
        tokenResposta: convite.tokenResposta,
      })),
    );
  });
};

const mudouHorario = (
  antes: ReuniaoAviso,
  depois: Omit<CreateReuniaoData, 'comissaoId'>,
) =>
  antes.data !== depois.data ||
  antes.horaInicio !== depois.horaInicio ||
  antes.horaFim !== depois.horaFim;

// Só gera aviso quando algo mudou; remarcação tem prioridade sobre os detalhes.
const avisoDeAtualizacao = (
  antes: ReuniaoAviso,
  depois: Omit<CreateReuniaoData, 'comissaoId'>,
) => {
  if (mudouHorario(antes, depois)) {
    return {
      titulo: 'Reunião remarcada',
      mensagem: `"${depois.titulo}" agora será em ${formatarData(depois.data)}, das ${depois.horaInicio} às ${depois.horaFim}.`,
    };
  }
  if (antes.local !== depois.local) {
    return {
      titulo: 'Local da reunião alterado',
      mensagem: `"${depois.titulo}" agora será em: ${depois.local}`,
    };
  }
  if (
    antes.titulo !== depois.titulo ||
    antes.pauta !== depois.pauta ||
    (antes.descricao ?? null) !== (depois.descricao || null)
  ) {
    return {
      titulo: 'Reunião atualizada',
      mensagem: `Os detalhes de "${depois.titulo}" foram atualizados.`,
    };
  }
  return null;
};

export const reuniaoService = {
  async listMine(userId: number) {
    const reunioes = await prisma.reuniao.findMany({
      where: {
        OR: [
          { criadoPorUserId: userId },
          {
            convites: {
              some: {
                userId,
                status: StatusConviteReuniao.ACEITO,
              },
            },
          },
        ],
      },
      orderBy: [{ data: 'asc' }, { horaInicio: 'asc' }],
      select: reuniaoListSelect,
    });
    return reunioes.map(({ registros, comissao, convites, ...reuniao }) => ({
      ...reuniao,
      comissao: { id: comissao.id, nome: comissao.nome },
      // Todos os convites, inclusive pendentes e recusados: o organizador
      // acompanha as respostas e a tela de convidar esconde quem já tem convite.
      convites: convites.map(({ user, ...convite }) => ({
        ...convite,
        nome: user.name,
      })),
      meuRegistro:
        registros.find((registro) => registro.userId === userId) ?? null,
      participantes: comissao.equipe
        .filter(
          (membro) =>
            membro.userId === reuniao.criadoPorUserId ||
            convites.some(
              (convite) =>
                convite.userId === membro.userId &&
                convite.status === StatusConviteReuniao.ACEITO,
            ),
        )
        .map((membro) => ({
          userId: membro.userId,
          nome: membro.user.name,
          email: membro.user.email,
          papel: membro.papel,
          registro:
            registros.find((registro) => registro.userId === membro.userId) ??
            null,
        })),
    }));
  },

  async update(
    userId: number,
    role: Role,
    reuniaoId: number,
    data: Omit<CreateReuniaoData, 'comissaoId'>,
  ) {
    const reuniao = await prisma.reuniao.findUnique({
      where: { id: reuniaoId },
      select: reuniaoAvisoSelect,
    });
    if (!reuniao) {
      throw new AppError(404, 'Reunião não encontrada.');
    }
    if (role !== 'ADMIN' && reuniao.criadoPorUserId !== userId) {
      throw new AppError(403, 'Você não pode editar esta reunião.');
    }

    const aviso = avisoDeAtualizacao(reuniao, data);
    const destinatarios = destinatariosDoAviso(reuniao, userId);

    try {
      const atualizada = await prisma.$transaction(async (transaction) => {
        const atualizada = await transaction.reuniao.update({
          where: { id: reuniaoId },
          data: {
            titulo: data.titulo,
            pauta: data.pauta,
            descricao: data.descricao || null,
            local: data.local,
            data: data.data,
            horaInicio: data.horaInicio,
            horaFim: data.horaFim,
          },
          select: reuniaoSelect,
        });
        if (aviso && destinatarios.length > 0) {
          await transaction.notificacao.createMany({
            data: destinatarios.map((destinatarioId) => ({
              userId: destinatarioId,
              tipo: TipoNotificacao.REUNIAO_ATUALIZADA,
              reuniaoId,
              ...aviso,
            })),
          });
        }
        // Lembretes já enviados valiam para o horário antigo.
        if (mudouHorario(reuniao, data)) {
          await transaction.lembreteEnviado.deleteMany({
            where: { reuniaoId },
          });
        }
        return atualizada;
      });

      if (aviso && destinatarios.length > 0) {
        emailService.emSegundoPlano(async () =>
          emailService.enviarAtualizacao(
            paraEmail(reuniaoId, {
              ...reuniao,
              ...data,
              descricao: data.descricao || null,
            }),
            await buscarDestinatarios(destinatarios),
            aviso,
          ),
        );
      }
      return atualizada;
    } catch (error) {
      if (isPrismaError(error, PRISMA_ERROR.RECORD_NOT_FOUND)) {
        throw new AppError(404, 'Reunião não encontrada.');
      }
      throw error;
    }
  },

  async delete(userId: number, role: Role, reuniaoId: number) {
    const reuniao = await prisma.reuniao.findUnique({
      where: { id: reuniaoId },
      select: reuniaoAvisoSelect,
    });
    if (!reuniao) {
      throw new AppError(404, 'Reunião não encontrada.');
    }
    if (role !== 'ADMIN' && reuniao.criadoPorUserId !== userId) {
      throw new AppError(403, 'Você não pode remover esta reunião.');
    }

    const destinatarios = destinatariosDoAviso(reuniao, userId);

    try {
      // Avisa antes de apagar, na mesma transação: os convites somem junto com
      // a reunião, e o aviso não pode ser gravado se a exclusão falhar.
      await prisma.$transaction(async (transaction) => {
        if (destinatarios.length > 0) {
          await transaction.notificacao.createMany({
            data: destinatarios.map((destinatarioId) => ({
              userId: destinatarioId,
              tipo: TipoNotificacao.REUNIAO_EXCLUIDA,
              reuniaoId,
              titulo: 'Reunião excluída',
              mensagem: `"${reuniao.titulo}", marcada para ${formatarData(reuniao.data)} às ${reuniao.horaInicio}, foi excluída.`,
            })),
          });
        }
        await transaction.reuniao.delete({ where: { id: reuniaoId } });
      });

      if (destinatarios.length > 0) {
        emailService.emSegundoPlano(async () =>
          emailService.enviarExclusao(
            paraEmail(reuniaoId, reuniao),
            await buscarDestinatarios(destinatarios),
          ),
        );
      }
      return { avisados: destinatarios.length };
    } catch (error) {
      if (isPrismaError(error, PRISMA_ERROR.RECORD_NOT_FOUND)) {
        throw new AppError(404, 'Reunião não encontrada.');
      }
      throw error;
    }
  },

  async checkIn(userId: number, reuniaoId: number) {
    const reuniao = await prisma.reuniao.findUnique({
      where: { id: reuniaoId },
      select: {
        comissaoId: true,
        status: true,
        criadoPorUserId: true,
        convites: { select: { userId: true, status: true } },
      },
    });
    if (!reuniao) {
      throw new AppError(404, 'Reunião não encontrada.');
    }

    await assertMembroDaComissao(reuniao.comissaoId, userId);
    if (
      reuniao.criadoPorUserId !== userId &&
      reuniao.convites !== undefined &&
      !reuniao.convites.some(
        (convite) =>
          convite.userId === userId &&
          convite.status === StatusConviteReuniao.ACEITO,
      )
    ) {
      throw new AppError(
        403,
        'Aceite o convite antes de registrar sua entrada na reunião.',
      );
    }

    const where = { reuniaoId_userId: { reuniaoId, userId } };
    const existente = await prisma.reuniaoRegistro.findUnique({ where });
    // Uma repetição confirma a primeira entrada, mesmo após o encerramento.
    if (existente) return { registro: existente, jaRegistrado: true };

    if (reuniao.status !== 'AGENDADA') {
      throw new AppError(409, 'Esta reunião não está disponível para entrada.');
    }

    try {
      // O banco gera entradaAt: o cliente não controla o horário da presença.
      const registro = await prisma.reuniaoRegistro.create({
        data: { reuniaoId, userId },
      });
      return { registro, jaRegistrado: false };
    } catch (error) {
      // Duas requisições podem consultar antes da primeira gravação. A chave
      // única decide qual cria; a outra devolve o mesmo registro sem alterá-lo.
      if (isPrismaError(error, PRISMA_ERROR.UNIQUE_VIOLATION)) {
        const registro = await prisma.reuniaoRegistro.findUnique({ where });
        if (registro) return { registro, jaRegistrado: true };
      }
      throw error;
    }
  },

  async checkOut(userId: number, reuniaoId: number) {
    const reuniao = await prisma.reuniao.findUnique({
      where: { id: reuniaoId },
      select: {
        comissaoId: true,
        criadoPorUserId: true,
        convites: { select: { userId: true, status: true } },
      },
    });
    if (!reuniao) {
      throw new AppError(404, 'Reunião não encontrada.');
    }

    await assertMembroDaComissao(reuniao.comissaoId, userId);
    if (
      reuniao.criadoPorUserId !== userId &&
      reuniao.convites !== undefined &&
      !reuniao.convites.some(
        (convite) =>
          convite.userId === userId &&
          convite.status === StatusConviteReuniao.ACEITO,
      )
    ) {
      throw new AppError(
        403,
        'Aceite o convite antes de registrar sua saída na reunião.',
      );
    }

    const where = { reuniaoId_userId: { reuniaoId, userId } };
    const existente = await prisma.reuniaoRegistro.findUnique({ where });
    if (!existente) {
      throw new AppError(409, 'Registre sua entrada antes de sair da reunião.');
    }
    if (existente.saidaAt) {
      return { registro: existente, jaRegistrado: true };
    }

    const atualizado = await prisma.reuniaoRegistro.updateMany({
      where: { reuniaoId, userId, saidaAt: null },
      data: { saidaAt: new Date() },
    });
    const registro = await prisma.reuniaoRegistro.findUnique({ where });
    if (!registro) {
      throw new AppError(404, 'Registro de presença não encontrado.');
    }

    return { registro, jaRegistrado: atualizado.count === 0 };
  },

  async listPendingInvites(userId: number) {
    const convites = await prisma.conviteReuniao.findMany({
      where: { userId, status: StatusConviteReuniao.PENDENTE },
      orderBy: { createdAt: 'desc' },
      select: conviteSelect,
    });

    return convites.map((convite) => ({
      id: convite.id,
      reuniaoId: convite.reuniaoId,
      titulo: convite.reuniao.titulo,
      data: convite.reuniao.data,
      horaInicio: convite.reuniao.horaInicio,
      horaFim: convite.reuniao.horaFim,
      usuario: convite.reuniao.criadoPor.name,
      status: convite.status,
      pauta: convite.reuniao.pauta,
      descricao: convite.reuniao.descricao,
      local: convite.reuniao.local,
      comissao: convite.reuniao.comissao.nome,
    }));
  },

  async inviteMembers(
    actorId: number,
    role: Role,
    reuniaoId: number,
    convidados: number[],
  ) {
    const reuniao = await prisma.reuniao.findUnique({
      where: { id: reuniaoId },
      select: {
        criadoPorUserId: true,
        comissaoId: true,
        comissao: { select: { equipe: { select: { userId: true } } } },
      },
    });
    if (!reuniao) throw new AppError(404, 'Reunião não encontrada.');
    if (role !== 'ADMIN' && reuniao.criadoPorUserId !== actorId) {
      throw new AppError(
        403,
        'Você não pode convidar membros para esta reunião.',
      );
    }

    const membros = new Set(
      reuniao.comissao.equipe.map((membro) => membro.userId),
    );
    if (
      convidados.some(
        (userId) => userId === reuniao.criadoPorUserId || !membros.has(userId),
      )
    ) {
      throw new AppError(
        400,
        'Convide apenas membros da comissão, sem incluir o criador.',
      );
    }

    // Só quem ainda não tinha convite recebe o e-mail.
    const existentes = await prisma.conviteReuniao.findMany({
      where: { reuniaoId, userId: { in: convidados } },
      select: { userId: true },
    });
    const jaConvidados = new Set(existentes.map((convite) => convite.userId));
    const novos = convidados.filter((userId) => !jaConvidados.has(userId));

    const resultado = await prisma.conviteReuniao.createMany({
      data: novos.map((userId) => ({
        reuniaoId,
        userId,
        tokenResposta: gerarTokenResposta(),
      })),
      skipDuplicates: true,
    });
    enviarConvites(reuniaoId, novos);
    return { message: `${resultado.count} convite(s) enviado(s).` };
  },

  async create(userId: number, data: CreateReuniaoData) {
    const comissao = await assertMembroDaComissao(data.comissaoId, userId);
    const membrosDaComissao = new Set(
      comissao.equipe.map((membro) => membro.userId),
    );
    const userIds = [...new Set(data.convidados ?? [])];
    if (userIds.some((convidadoId) => convidadoId === userId)) {
      throw new AppError(400, 'O criador não precisa receber convite.');
    }
    if (userIds.some((convidadoId) => !membrosDaComissao.has(convidadoId))) {
      throw new AppError(
        400,
        'Todos os convidados precisam participar da comissão.',
      );
    }

    const criada = await prisma.$transaction(async (transaction) => {
      try {
        return await transaction.reuniao.create({
          data: {
            comissaoId: data.comissaoId,
            titulo: data.titulo,
            pauta: data.pauta,
            descricao: data.descricao || null,
            local: data.local,
            data: data.data,
            horaInicio: data.horaInicio,
            horaFim: data.horaFim,
            criadoPorUserId: userId,
            convites: {
              create: userIds.map((membroId) => ({
                userId: membroId,
                tokenResposta: gerarTokenResposta(),
              })),
            },
          },
          select: reuniaoSelect,
        });
      } catch (error) {
        if (isPrismaError(error, PRISMA_ERROR.RECORD_NOT_FOUND)) {
          throw new AppError(404, 'Comissão não encontrada.');
        }
        throw error;
      }
    });
    enviarConvites(criada.id, userIds);
    return criada;
  },

  /** Convite do botão do e-mail, com o que a página de resposta mostra. */
  buscarConvitePorToken(token: string) {
    return prisma.conviteReuniao.findUnique({
      where: { tokenResposta: token },
      select: {
        id: true,
        userId: true,
        status: true,
        user: { select: { name: true } },
        reuniao: {
          select: {
            titulo: true,
            data: true,
            horaInicio: true,
            horaFim: true,
            local: true,
            status: true,
            comissao: { select: { nome: true } },
          },
        },
      },
    });
  },

  /** Resposta pelo botão do e-mail: as mesmas regras do app. */
  async respondInviteByToken(token: string, status: StatusConviteReuniao) {
    const convite = await prisma.conviteReuniao.findUnique({
      where: { tokenResposta: token },
      select: { id: true, userId: true },
    });
    if (!convite) {
      throw new AppError(404, 'Convite não encontrado.');
    }
    return this.respondInvite(convite.userId, convite.id, status);
  },

  async respondInvite(
    userId: number,
    inviteId: number,
    status: StatusConviteReuniao,
  ) {
    const convite = await prisma.conviteReuniao.findUnique({
      where: { id: inviteId },
      select: {
        userId: true,
        status: true,
        reuniao: { select: { status: true } },
      },
    });

    if (!convite) {
      throw new AppError(404, 'Convite não encontrado.');
    }
    if (convite.userId !== userId) {
      throw new AppError(403, 'Você não pode responder a este convite.');
    }
    if (convite.reuniao.status === 'CANCELADA') {
      throw new AppError(
        409,
        'Não é possível responder a um convite cancelado.',
      );
    }
    if (convite.status !== StatusConviteReuniao.PENDENTE) {
      throw new AppError(409, 'Este convite já foi respondido.');
    }

    try {
      const atualizado = await prisma.conviteReuniao.update({
        where: { id: inviteId },
        data: { status, respondidoAt: new Date() },
        select: conviteSelect,
      });

      return {
        id: atualizado.id,
        reuniaoId: atualizado.reuniaoId,
        titulo: atualizado.reuniao.titulo,
        data: atualizado.reuniao.data,
        horaInicio: atualizado.reuniao.horaInicio,
        horaFim: atualizado.reuniao.horaFim,
        usuario: atualizado.reuniao.criadoPor.name,
        status: atualizado.status,
        pauta: atualizado.reuniao.pauta,
        descricao: atualizado.reuniao.descricao,
        local: atualizado.reuniao.local,
        comissao: atualizado.reuniao.comissao.nome,
      };
    } catch (error) {
      if (isPrismaError(error, PRISMA_ERROR.RECORD_NOT_FOUND)) {
        throw new AppError(404, 'Convite não encontrado.');
      }
      throw error;
    }
  },
};
