import type { PapelComissao } from '@/services/comissaoService';
import type { PapelOrganizacao } from '@/services/organizacaoService';
import type { AuthUser, Role } from '@/store/authStore';
import type { Tema } from '@/store/themeStore';
import { apiRequest } from '@/utils/apiClient';

export type UsuarioResumo = { id: number; name: string; email: string };

export type UsuarioReport = {
  total: number;
  porRole: Record<Role, number>;
  crescimentoPorMes: { mes: string; quantidade: number }[];
  engajamento: {
    comOrganizacao: number;
    semOrganizacao: number;
    comComissao: number;
    mediaOrganizacoesPorUsuario: number;
    mediaComissoesPorUsuario: number;
  };
  // quantos usuarios distintos ocupam cada papel em pelo menos uma org/comissao.
  usuariosPorPapelOrganizacao: Partial<Record<PapelOrganizacao, number>>;
  usuariosPorPapelComissao: Partial<Record<PapelComissao, number>>;
  maisAtivos: {
    id: number;
    name: string;
    organizacoes: number;
    comissoes: number;
  }[];
  porTema: Record<Tema, number>;
  usuarios: {
    id: number;
    name: string;
    email: string;
    role: Role;
    createdAt: string;
    organizacoes: { id: number; nome: string; papel: PapelOrganizacao }[];
    comissoes: { id: number; nome: string; papel: PapelComissao }[];
  }[];
};

// comissão em que o usuário é ADMINISTRADOR (GET /usuarios/:id/comissoes-administradas).
export type ComissaoAdministrada = {
  id: number;
  nome: string;
  organizacaoId: number;
  organizacao: { id: number; nome: string };
  equipe: {
    papel: PapelComissao;
    user: { id: number; name: string; email: string };
  }[];
};

// id da organização/comissão -> id de quem assume no lugar do usuário.
export type Sucessores = Record<number, number>;

export type CadastroUsuarioData = {
  nome: string;
  email: string;
  password: string;
};

export type PerfilData = { nome: string; email: string };

type MessageResponse = { message: string };

export const usuarioService = {
  // pública: quem se cadastra ainda não tem token.
  create(usuario: CadastroUsuarioData) {
    return apiRequest<AuthUser>('/usuarios', {
      method: 'POST',
      body: usuario,
      fallbackError: 'Não foi possível criar o usuário.',
    });
  },

  // busca por nome ou e-mail; com organizacaoId, deixa de fora quem já é membro.
  search(token: string, termo: string, organizacaoId?: number) {
    const params = new URLSearchParams({ q: termo });
    if (organizacaoId) params.set('organizacaoId', String(organizacaoId));
    return apiRequest<UsuarioResumo[]>(`/usuarios/busca?${params.toString()}`, {
      token,
      fallbackError: 'Não foi possível buscar usuários.',
    });
  },

  // UC03 — alterar dados pessoais.
  updateProfile(token: string, userId: number, perfil: PerfilData) {
    return apiRequest<AuthUser>(`/usuarios/${userId}`, {
      method: 'PATCH',
      token,
      body: perfil,
      fallbackError: 'Não foi possível salvar os dados.',
    });
  },

  // UC01 — troca de senha.
  updatePassword(
    token: string,
    userId: number,
    currentPassword: string,
    newPassword: string,
  ) {
    return apiRequest<MessageResponse>(`/usuarios/${userId}/senha`, {
      method: 'PATCH',
      token,
      body: { currentPassword, newPassword },
      fallbackError: 'Não foi possível alterar a senha.',
    });
  },

  // UC04 — tema preferido.
  updateTheme(token: string, userId: number, theme: Tema) {
    return apiRequest<{ id: number; themePreference: Tema }>(
      `/usuarios/${userId}/tema`,
      {
        method: 'PATCH',
        token,
        body: { theme },
        fallbackError: 'Não foi possível salvar sua preferência de tema.',
      },
    );
  },

  // promover ou rebaixar outra pessoa (só administrador; a API recusa o próprio perfil).
  updateRole(token: string, userId: number, role: Role) {
    return apiRequest<{ id: number; role: Role }>(`/usuarios/${userId}/role`, {
      method: 'PATCH',
      token,
      body: { role },
      fallbackError: 'Não foi possível alterar o perfil do usuário.',
    });
  },

  getComissoesAdministradas(token: string, userId: number) {
    return apiRequest<ComissaoAdministrada[]>(
      `/usuarios/${userId}/comissoes-administradas`,
      {
        token,
        fallbackError: 'Não foi possível carregar suas comissões.',
      },
    );
  },

  // se o usuário é o único administrador da plataforma (aí a exclusão pede quem assume).
  isUnicoAdministrador(token: string, userId: number) {
    return apiRequest<{ unicoAdministrador: boolean }>(
      `/usuarios/${userId}/unico-administrador`,
      {
        token,
        fallbackError:
          'Não foi possível verificar a administração da plataforma.',
      },
    );
  },

  // novoAdministradorId: obrigatório quando o usuário é o único administrador.
  deletePersonalData(
    token: string,
    userId: number,
    sucessores: Sucessores,
    sucessoresComissao: Sucessores,
    novoAdministradorId?: number,
  ) {
    return apiRequest<MessageResponse>(`/usuarios/${userId}/dados-pessoais`, {
      method: 'DELETE',
      token,
      body: { sucessores, sucessoresComissao, novoAdministradorId },
      fallbackError: 'Não foi possível excluir seus dados pessoais.',
    });
  },

  deleteFullAccount(
    token: string,
    userId: number,
    sucessoresComissao: Sucessores,
    novoAdministradorId?: number,
  ) {
    return apiRequest<MessageResponse>(`/usuarios/${userId}/dados-completos`, {
      method: 'DELETE',
      token,
      body: { sucessoresComissao, novoAdministradorId },
      fallbackError: 'Não foi possível excluir sua conta.',
    });
  },

  // somente admin — a API responde 403 para os demais.
  getReport(token: string) {
    return apiRequest<UsuarioReport>('/usuarios/relatorio', {
      token,
      fallbackError: 'Não foi possível carregar o relatório de usuários.',
    });
  },
};
