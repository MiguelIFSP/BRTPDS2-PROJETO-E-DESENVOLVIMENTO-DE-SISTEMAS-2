import {
  StatusConviteReuniao,
  TipoNotificacao,
  type Prisma,
  type Role,
} from '@prisma/client';
import prisma from '../config/database.ts';
import { presencaService } from './presencaService.ts';
import { assertRecusaSemPresenca } from './recusaConviteService.ts';
import { env } from '../config/env.ts';
import { AppError } from '../errors/AppError.ts';
import { emailService, type Destinatario } from './emailService.ts';
import type { ReuniaoEmail } from '../utils/emailTemplates.ts';
import { estadoDaReuniao } from '../utils/fusoHorario.ts';
import { USUARIO_REMOVIDO } from '../utils/autoria.ts';
import { PRISMA_ERROR, isPrismaError } from '../utils/prismaErrors.ts';
import { generateTokenResposta } from '../utils/tokenResposta.ts';
import { removerPastaDaReuniao } from './arquivoReuniaoService.ts';
import { podeGerirReuniao } from './permissaoReuniaoService.ts';

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

const apresentarConvite = (
  convite: Prisma.ConviteReuniaoGetPayload<{ select: typeof conviteSelect }>,
) => ({
  id: convite.id,
  reuniaoId: convite.reuniaoId,
  titulo: convite.reuniao.titulo,
  data: convite.reuniao.data,
  horaInicio: convite.reuniao.horaInicio,
  horaFim: convite.reuniao.horaFim,
  usuario: convite.reuniao.criadoPor?.name ?? null,
  status: convite.status,
  pauta: convite.reuniao.pauta,
  descricao: convite.reuniao.descricao,
  local: convite.reuniao.local,
  comissao: convite.reuniao.comissao.nome,
});

const reuniaoListSelect = {
  ...reuniaoSelect,
  criadoPor: { select: { name: true } },
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
      origemEntrada: true,
      origemSaida: true,
      entradaManualPorId: true,
      saidaManualPorId: true,
    },
  },
  // Só quem votou, para saber se o convite ainda pode ser reenviado. Em
  // votação secreta, a opção de cada pessoa nunca sai daqui.
  votacoes: { select: { votos: { select: { userId: true } } } },
} satisfies Prisma.ReuniaoSelect;

// Quem vê a reunião na lista e na tela dela: quem aceitou e quem recusou (que
// pode aceitar de novo até o fim). Convite sem resposta fica no sino.
const STATUS_QUE_VEEM_A_REUNIAO: StatusConviteReuniao[] = [
  StatusConviteReuniao.ACEITO,
  StatusConviteReuniao.RECUSADO,
];

/**
 * Presença registrada ou voto dado na reunião. Quem já participou não pode
 * recusar nem ter o convite reenviado: sairia dos participantes depois de
 * constar na lista de presença ou nas votações.
 */
const hasParticipacao = async (reuniaoId: number, userId: number) => {
  const [registro, votos] = await Promise.all([
    prisma.reuniaoRegistro.findUnique({
      where: { reuniaoId_userId: { reuniaoId, userId } },
      select: { id: true },
    }),
    prisma.votacaoVoto.count({ where: { userId, votacao: { reuniaoId } } }),
  ]);
  return registro !== null || votos > 0;
};

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

/**
 * Convite só pode ser respondido até o fim da reunião (no app e pelo link do
 * e-mail). Depois disso, aceitar ou recusar não muda mais nada.
 */
const isConviteExpirado = (
  reuniao: { data: string; horaFim: string },
  agora = new Date(),
) =>
  // Só o término importa aqui; o início não entra na conta do encerramento.
  estadoDaReuniao(
    { ...reuniao, horaInicio: reuniao.horaFim, status: 'AGENDADA' },
    env.TZ_REUNIOES,
    agora,
  ).estado === 'ENCERRADA';

// Dados que alimentam o aviso de edição ou exclusão. Quem recusou o convite
// não participa mais da reunião e não é avisado.
const reuniaoAvisoSelect = {
  criadoPorUserId: true,
  comissaoId: true,
  status: true,
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

type ReuniaoLista = Prisma.ReuniaoGetPayload<{
  select: typeof reuniaoListSelect;
}>;

// Mesma forma da lista e da página da reunião: comissão, convites,
// presença de quem está vendo e participantes que aceitaram.
const apresentarReuniao = (reuniao: ReuniaoLista, userId: number) => {
  const { registros, comissao, convites, criadoPor, votacoes, ...dados } =
    reuniao;
  const { estado, aberturaCheckIn, limiteSaida } = estadoDaReuniao(
    reuniao,
    env.TZ_REUNIOES,
  );
  const participaram = new Set([
    ...registros.map((registro) => registro.userId),
    ...votacoes.flatMap((votacao) => votacao.votos.map((voto) => voto.userId)),
  ]);
  const meuConvite = convites.find((convite) => convite.userId === userId);
  return {
    ...dados,
    podeGerirPresenca: comissao.equipe.some(
      (membro) => membro.userId === userId && membro.papel === 'ADMINISTRADOR',
    ),
    usuario: criadoPor?.name ?? null,
    estado,
    janelaCheckIn: {
      abre: aberturaCheckIn.toISOString(),
      fecha: limiteSaida.toISOString(),
    },
    comissao: { id: comissao.id, nome: comissao.nome },
    meuConvite: meuConvite
      ? { id: meuConvite.id, status: meuConvite.status }
      : null,
    convites: convites.map(({ user, ...convite }) => ({
      ...convite,
      nome: user.name,
      // Mesma regra do resendInvite; o app só decide se mostra o botão.
      podeReenviar: !(
        convite.status === StatusConviteReuniao.ACEITO &&
        participaram.has(convite.userId)
      ),
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
  };
};

// Criador e convidados, menos quem fez a alteração (um ADMIN que não criou
// a reunião também avisa o criador).
const destinatariosDoAviso = (reuniao: ReuniaoAviso, actorId: number) =>
  [
    ...new Set([
      reuniao.criadoPorUserId,
      ...reuniao.convites.map((convite) => convite.userId),
    ]),
  ].filter((id): id is number => id !== null && id !== actorId);

const formatDate = (data: string) => data.split('-').reverse().join('/');

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
  organizador: reuniao.criadoPor?.name ?? USUARIO_REMOVIDO,
});

const getDestinatarios = async (userIds: number[]): Promise<Destinatario[]> => {
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

// Convite por e-mail (com .ics) para quem acabou de ser convidado, ou de novo
// para quem teve o convite reenviado (mesmo token, mesmos botões).
const sendConvites = (
  reuniaoId: number,
  convidados: number[],
  isReenvio = false,
) => {
  if (convidados.length === 0) return;
  emailService.runInBackground(async () => {
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
    const enviar = isReenvio
      ? emailService.sendConviteReenviado
      : emailService.sendConvite;
    await enviar(
      paraEmail(reuniaoId, reuniao),
      convites.map((convite) => ({
        nome: convite.user.name,
        email: convite.user.email,
        tokenResposta: convite.tokenResposta,
      })),
    );
  });
};

const hasHorarioChanged = (
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
  if (hasHorarioChanged(antes, depois)) {
    return {
      titulo: 'Reunião remarcada',
      mensagem: `"${depois.titulo}" agora será em ${formatDate(depois.data)}, das ${depois.horaInicio} às ${depois.horaFim}.`,
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
  isConviteExpirado,

  async listMine(userId: number) {
    const reunioes = await prisma.reuniao.findMany({
      where: {
        OR: [
          { criadoPorUserId: userId },
          {
            convites: {
              some: {
                userId,
                status: { in: STATUS_QUE_VEEM_A_REUNIAO },
              },
            },
          },
        ],
      },
      orderBy: [{ data: 'asc' }, { horaInicio: 'asc' }],
      select: reuniaoListSelect,
    });
    return reunioes.map((reuniao) => apresentarReuniao(reuniao, userId));
  },

  async getById(userId: number, role: Role, reuniaoId: number) {
    const reuniao = await prisma.reuniao.findUnique({
      where: { id: reuniaoId },
      select: reuniaoListSelect,
    });
    if (!reuniao) {
      throw new AppError(404, 'Reunião não encontrada.');
    }
    const participa =
      reuniao.criadoPorUserId === userId ||
      reuniao.convites.some(
        (convite) =>
          convite.userId === userId &&
          STATUS_QUE_VEEM_A_REUNIAO.includes(convite.status),
      );
    if (!participa && !(await podeGerirReuniao(userId, role, reuniao))) {
      throw new AppError(403, 'Você não pode ver esta reunião.');
    }
    return apresentarReuniao(reuniao, userId);
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
    if (!(await podeGerirReuniao(userId, role, reuniao))) {
      throw new AppError(403, 'Você não pode editar esta reunião.');
    }
    if (estadoDaReuniao(reuniao, env.TZ_REUNIOES).estado === 'ENCERRADA') {
      throw new AppError(
        409,
        'Esta reunião já terminou e não pode mais ser alterada.',
      );
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
        if (hasHorarioChanged(reuniao, data)) {
          await transaction.lembreteEnviado.deleteMany({
            where: { reuniaoId },
          });
        }
        return atualizada;
      });

      if (aviso && destinatarios.length > 0) {
        emailService.runInBackground(async () =>
          emailService.sendAtualizacao(
            paraEmail(reuniaoId, {
              ...reuniao,
              ...data,
              descricao: data.descricao || null,
            }),
            await getDestinatarios(destinatarios),
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
    if (!(await podeGerirReuniao(userId, role, reuniao))) {
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
              mensagem: `"${reuniao.titulo}", marcada para ${formatDate(reuniao.data)} às ${reuniao.horaInicio}, foi excluída.`,
            })),
          });
        }
        await transaction.reuniao.delete({ where: { id: reuniaoId } });
      });
      await removerPastaDaReuniao(reuniaoId);

      if (destinatarios.length > 0) {
        emailService.runInBackground(async () =>
          emailService.sendExclusao(
            paraEmail(reuniaoId, reuniao),
            await getDestinatarios(destinatarios),
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

  checkIn: presencaService.checkIn,
  checkOut: presencaService.checkOut,

  async listPendingInvites(userId: number) {
    const convites = await prisma.conviteReuniao.findMany({
      where: { userId, status: StatusConviteReuniao.PENDENTE },
      orderBy: { createdAt: 'desc' },
      select: conviteSelect,
    });

    // Convite de reunião que já terminou não pode mais ser respondido.
    return convites
      .filter((convite) => !isConviteExpirado(convite.reuniao))
      .map(apresentarConvite);
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
    if (!(await podeGerirReuniao(actorId, role, reuniao))) {
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
        tokenResposta: generateTokenResposta(),
      })),
      skipDuplicates: true,
    });
    sendConvites(reuniaoId, novos);
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
            codigoPresenca: presencaService.generateCode(),
            convites: {
              create: userIds.map((membroId) => ({
                userId: membroId,
                tokenResposta: generateTokenResposta(),
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
    sendConvites(criada.id, userIds);
    return criada;
  },

  /** Convite do botão do e-mail, com o que a página de resposta mostra. */
  getConviteByToken(token: string) {
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
    await assertRecusaSemPresenca(userId, inviteId, status);

    const convite = await prisma.conviteReuniao.findUnique({
      where: { id: inviteId },
      select: {
        userId: true,
        reuniaoId: true,
        status: true,
        reuniao: { select: { status: true, data: true, horaFim: true } },
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
    if (isConviteExpirado(convite.reuniao)) {
      throw new AppError(
        410,
        'Esta reunião já terminou; o convite não pode mais ser respondido.',
      );
    }

    // Repetir a resposta (ex.: o mesmo botão do e-mail duas vezes) não é erro
    // e não muda a data da resposta.
    if (convite.status === status) {
      const atual = await prisma.conviteReuniao.findUnique({
        where: { id: inviteId },
        select: conviteSelect,
      });
      if (!atual) throw new AppError(404, 'Convite não encontrado.');
      return apresentarConvite(atual);
    }
    if (
      status === StatusConviteReuniao.RECUSADO &&
      (await hasParticipacao(convite.reuniaoId, userId))
    ) {
      throw new AppError(
        409,
        'Você já registrou presença ou votou nesta reunião; o convite não pode mais ser recusado.',
      );
    }

    try {
      const atualizado = await prisma.conviteReuniao.update({
        where: { id: inviteId },
        data: { status, respondidoAt: new Date() },
        select: conviteSelect,
      });
      return apresentarConvite(atualizado);
    } catch (error) {
      if (isPrismaError(error, PRISMA_ERROR.RECORD_NOT_FOUND)) {
        throw new AppError(404, 'Convite não encontrado.');
      }
      throw error;
    }
  },

  /**
   * Reenvio pelo organizador: o convite volta a ficar sem resposta (reaparece
   * no sino) e o e-mail sai de novo com o mesmo link. Quem tinha aceitado sai
   * dos participantes até responder.
   */
  async resendInvite(actorId: number, role: Role, inviteId: number) {
    const convite = await prisma.conviteReuniao.findUnique({
      where: { id: inviteId },
      select: {
        userId: true,
        reuniaoId: true,
        status: true,
        user: { select: { name: true } },
        reuniao: {
          select: {
            criadoPorUserId: true,
            comissaoId: true,
            status: true,
            data: true,
            horaFim: true,
            comissao: { select: { equipe: { select: { userId: true } } } },
          },
        },
      },
    });
    if (!convite) {
      throw new AppError(404, 'Convite não encontrado.');
    }
    const { reuniao } = convite;
    if (!(await podeGerirReuniao(actorId, role, reuniao))) {
      throw new AppError(403, 'Você não pode reenviar convites desta reunião.');
    }
    if (reuniao.status === 'CANCELADA') {
      throw new AppError(
        409,
        'Esta reunião foi cancelada; o convite não pode ser reenviado.',
      );
    }
    if (reuniao.status === 'REALIZADA') {
      throw new AppError(
        409,
        'Esta reunião já foi realizada; o convite não pode ser reenviado.',
      );
    }
    if (isConviteExpirado(reuniao)) {
      throw new AppError(
        410,
        'Esta reunião já terminou; o convite não pode mais ser reenviado.',
      );
    }
    const nome = convite.user.name;
    if (
      !reuniao.comissao.equipe.some(
        (membro) => membro.userId === convite.userId,
      )
    ) {
      throw new AppError(
        409,
        `${nome} não faz mais parte da comissão; o convite não pode ser reenviado.`,
      );
    }
    if (
      convite.status === StatusConviteReuniao.ACEITO &&
      (await hasParticipacao(convite.reuniaoId, convite.userId))
    ) {
      throw new AppError(
        409,
        `${nome} já registrou presença ou votou nesta reunião; o convite não pode ser reenviado.`,
      );
    }

    try {
      await prisma.conviteReuniao.update({
        where: { id: inviteId },
        data: { status: StatusConviteReuniao.PENDENTE, respondidoAt: null },
      });
    } catch (error) {
      if (isPrismaError(error, PRISMA_ERROR.RECORD_NOT_FOUND)) {
        throw new AppError(404, 'Convite não encontrado.');
      }
      throw error;
    }
    sendConvites(convite.reuniaoId, [convite.userId], true);
    return { message: `Convite reenviado para ${nome}.` };
  },
};
