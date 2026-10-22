import { MANAGEMENT_API_URL } from '@/config/api';
import { apiRequest } from '@/utils/apiClient';

// Nomes aceitos pela rota /subsystems/:name/:action da API de Gestão.
export type SubsystemName =
  'api' | 'monitoring' | 'management' | 'database' | 'monitoring-database';
export type SubsystemAction = 'start' | 'stop' | 'restart';

export const managementService = {
  // Restrito a ADMIN (403 para os demais). management/restart responde 202 e
  // derruba a conexão logo depois — o 202 já conta como sucesso no apiRequest.
  runSubsystemAction(
    token: string,
    name: SubsystemName,
    action: SubsystemAction,
  ) {
    return apiRequest<unknown>(`/subsystems/${name}/${action}`, {
      method: 'POST',
      baseUrl: MANAGEMENT_API_URL,
      token,
      fallbackError: 'Não foi possível executar a ação.',
    });
  },
};
