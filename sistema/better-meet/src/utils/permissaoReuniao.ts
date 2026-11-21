import type { AuthUser } from '@/store/authStore';

type ReuniaoGerivel = {
  criadoPorUserId?: number | null;
  participantes?: { userId: number; papel: string }[];
};

/**
 * Espelha `podeGerirReuniao` da API: Administrador da plataforma, autor da
 * reunião ou Administrador da comissão. A API é quem autoriza de verdade; aqui
 * só decidimos se os botões aparecem.
 */
export function podeGerirReuniao(
  user: Pick<AuthUser, 'id' | 'role'> | null | undefined,
  reuniao: ReuniaoGerivel | null | undefined,
) {
  if (!user || !reuniao) return false;
  if (user.role === 'ADMIN' || reuniao.criadoPorUserId === user.id) return true;
  return (
    reuniao.participantes?.some(
      (participante) =>
        participante.userId === user.id &&
        participante.papel === 'ADMINISTRADOR',
    ) ?? false
  );
}
