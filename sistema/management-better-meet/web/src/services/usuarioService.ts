import { API_URL } from '@/config/api';
import type { TemaConta } from '@/store/themeStore';

export const usuarioService = {
  /** UC04: salva o tema preferido na conta de quem está logado. */
  async updateTheme(token: string, userId: number, theme: TemaConta): Promise<void> {
    // A URL base do .env do web ainda não inclui o /api (só o POST /login tem rota fora dele).
    const response = await fetch(`${API_URL}/api/usuarios/${userId}/tema`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ theme }),
    });

    if (!response.ok) {
      const body: unknown = await response.json().catch(() => ({}));
      const apiMessage =
        typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string'
          ? body.error
          : undefined;

      throw new Error(apiMessage ?? 'Não foi possível salvar a preferência de tema.');
    }
  },
};
