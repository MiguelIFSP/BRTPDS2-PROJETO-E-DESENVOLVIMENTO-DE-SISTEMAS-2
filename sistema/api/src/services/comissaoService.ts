import type { PapelComissao, Prisma } from '@prisma/client';
import prisma from '../config/database.ts';
import { MESES_CRESCIMENTO, lastMonthKeys, yearMonthKey } from './organizacaoService.ts';

export const PAPEIS_COMISSAO = ['ADMINISTRADOR', 'FACILITADOR', 'SECRETARIO', 'MEMBRO'] as const;

// o que o relatorio precisa de cada comissao: org (nome) e papeis da equipe.
const reportSelect = {
  id: true,
  nome: true,
  descricao: true,
  createdAt: true,
  organizacao: { select: { id: true, nome: true } },
  equipe: { select: { papel: true } },
} satisfies Prisma.ComissaoSelect;

type ComissaoReportRow = Prisma.ComissaoGetPayload<{ select: typeof reportSelect }>;

// mesma ideia do relatorio de organizacoes. comissao nao tem status,
// entao no lugar de "por status" vai "por organizacao".
const buildComissaoReport = (comissoes: ComissaoReportRow[]) => {
  const porOrganizacao = new Map<number, { organizacaoId: number; nome: string; quantidade: number }>();
  for (const comissao of comissoes) {
    const current = porOrganizacao.get(comissao.organizacao.id);
    if (current) {
      current.quantidade += 1;
    } else {
      porOrganizacao.set(comissao.organizacao.id, {
        organizacaoId: comissao.organizacao.id,
        nome: comissao.organizacao.nome,
        quantidade: 1,
      });
    }
  }

  const crescimentoPorMes: Record<string, number> = Object.fromEntries(lastMonthKeys(MESES_CRESCIMENTO).map((key) => [key, 0]));
  for (const comissao of comissoes) {
    const key = yearMonthKey(comissao.createdAt);
    if (key in crescimentoPorMes) {
      crescimentoPorMes[key] = (crescimentoPorMes[key] ?? 0) + 1;
    }
  }

  const distribuicaoPapeis = Object.fromEntries(PAPEIS_COMISSAO.map((papel) => [papel, 0])) as Record<PapelComissao, number>;
  let totalMembros = 0;
  for (const comissao of comissoes) {
    totalMembros += comissao.equipe.length;
    for (const membro of comissao.equipe) {
      distribuicaoPapeis[membro.papel] += 1;
    }
  }

  return {
    total: comissoes.length,
    totalOrganizacoes: porOrganizacao.size,
    porOrganizacao: [...porOrganizacao.values()].sort((a, b) => b.quantidade - a.quantidade),
    crescimentoPorMes: Object.entries(crescimentoPorMes).map(([mes, quantidade]) => ({ mes, quantidade })),
    distribuicaoPapeis,
    mediaMembrosPorComissao: comissoes.length > 0 ? totalMembros / comissoes.length : 0,
    // lista pro drill-down da tela — nao existe endpoint que liste todas as comissoes.
    comissoes: comissoes
      .map((comissao) => ({
        id: comissao.id,
        nome: comissao.nome,
        descricao: comissao.descricao,
        createdAt: comissao.createdAt,
        organizacao: comissao.organizacao,
        membros: comissao.equipe.length,
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
  };
};

export const comissaoService = {
  // relatorio do admin: todas as comissoes.
  async getReport() {
    const comissoes = await prisma.comissao.findMany({ select: reportSelect });
    return buildComissaoReport(comissoes);
  },

  // relatorio do usuario: so as comissoes em que ele esta na equipe.
  async getReportMine(userId: number) {
    const comissoes = await prisma.comissao.findMany({
      where: { equipe: { some: { userId } } },
      select: reportSelect,
    });
    return buildComissaoReport(comissoes);
  },
};
