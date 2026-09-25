import type { PapelComissao, PapelOrganizacao } from '@prisma/client';
import prisma from '../config/database.ts';
import { MESES_CRESCIMENTO, lastMonthKeys, yearMonthKey } from './organizacaoService.ts';

const TEMAS = ['light', 'dark', 'system'] as const;
type Tema = (typeof TEMAS)[number];

// quantos usuarios entram no ranking de mais ativos.
const TOP_ATIVOS = 5;

// papeis "de responsabilidade" que o relatorio destaca.
const PAPEIS_ORG_DESTAQUE: PapelOrganizacao[] = ['CRIADOR', 'GERENTE', 'MODERADOR'];
const PAPEIS_COMISSAO_DESTAQUE: PapelComissao[] = ['ADMINISTRADOR', 'FACILITADOR', 'SECRETARIO'];

export const usuarioService = {
  // relatorio do admin: agregados sobre todos os usuarios da plataforma.
  async getReport() {
    const usuarios = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        themePreference: true,
        organizacoes: { select: { papel: true, organizacao: { select: { id: true, nome: true } } } },
        comissoes: { select: { papel: true, comissao: { select: { id: true, nome: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const porRole = { ADMIN: 0, USER: 0 };
    const crescimentoPorMes: Record<string, number> = Object.fromEntries(lastMonthKeys(MESES_CRESCIMENTO).map((key) => [key, 0]));
    const porTema = Object.fromEntries(TEMAS.map((tema) => [tema, 0])) as Record<Tema, number>;
    // quantos usuarios distintos tem cada papel em pelo menos uma org/comissao.
    const usuariosPorPapelOrganizacao = Object.fromEntries(PAPEIS_ORG_DESTAQUE.map((papel) => [papel, 0])) as Record<string, number>;
    const usuariosPorPapelComissao = Object.fromEntries(PAPEIS_COMISSAO_DESTAQUE.map((papel) => [papel, 0])) as Record<string, number>;
    let comOrganizacao = 0;
    let comComissao = 0;
    let totalVinculosOrganizacao = 0;
    let totalVinculosComissao = 0;

    for (const usuario of usuarios) {
      porRole[usuario.role] += 1;

      const key = yearMonthKey(usuario.createdAt);
      if (key in crescimentoPorMes) {
        crescimentoPorMes[key] = (crescimentoPorMes[key] ?? 0) + 1;
      }

      // null/valor desconhecido = segue o sistema (default do schema).
      const tema = TEMAS.includes(usuario.themePreference as Tema) ? (usuario.themePreference as Tema) : 'system';
      porTema[tema] += 1;

      if (usuario.organizacoes.length > 0) comOrganizacao += 1;
      if (usuario.comissoes.length > 0) comComissao += 1;
      totalVinculosOrganizacao += usuario.organizacoes.length;
      totalVinculosComissao += usuario.comissoes.length;

      for (const papel of new Set(usuario.organizacoes.map((vinculo) => vinculo.papel))) {
        if (papel in usuariosPorPapelOrganizacao) usuariosPorPapelOrganizacao[papel] = (usuariosPorPapelOrganizacao[papel] ?? 0) + 1;
      }
      for (const papel of new Set(usuario.comissoes.map((vinculo) => vinculo.papel))) {
        if (papel in usuariosPorPapelComissao) usuariosPorPapelComissao[papel] = (usuariosPorPapelComissao[papel] ?? 0) + 1;
      }
    }

    const total = usuarios.length;
    const ranking = usuarios
      .map((usuario) => ({
        id: usuario.id,
        name: usuario.name,
        organizacoes: usuario.organizacoes.length,
        comissoes: usuario.comissoes.length,
      }))
      .filter((usuario) => usuario.organizacoes + usuario.comissoes > 0)
      .sort((a, b) => b.organizacoes + b.comissoes - (a.organizacoes + a.comissoes))
      .slice(0, TOP_ATIVOS);

    return {
      total,
      porRole,
      crescimentoPorMes: Object.entries(crescimentoPorMes).map(([mes, quantidade]) => ({ mes, quantidade })),
      engajamento: {
        comOrganizacao,
        semOrganizacao: total - comOrganizacao,
        comComissao,
        mediaOrganizacoesPorUsuario: total > 0 ? totalVinculosOrganizacao / total : 0,
        mediaComissoesPorUsuario: total > 0 ? totalVinculosComissao / total : 0,
      },
      usuariosPorPapelOrganizacao,
      usuariosPorPapelComissao,
      maisAtivos: ranking,
      porTema,
      usuarios: usuarios.map((usuario) => ({
        id: usuario.id,
        name: usuario.name,
        email: usuario.email,
        role: usuario.role,
        createdAt: usuario.createdAt,
        organizacoes: usuario.organizacoes.map((vinculo) => ({ ...vinculo.organizacao, papel: vinculo.papel })),
        comissoes: usuario.comissoes.map((vinculo) => ({ ...vinculo.comissao, papel: vinculo.papel })),
      })),
    };
  },
};
