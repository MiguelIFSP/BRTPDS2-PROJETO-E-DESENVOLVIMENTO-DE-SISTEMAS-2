import { Platform } from 'react-native';

import {
  authenticateLocal,
  isLocalAuthAvailable,
} from '@/utils/autenticacaoLocal';

/** Na web, o chamador deve obter confirmação explícita no ConfirmDialog antes de chamar. */
export const confirmPresencaLocal = async (
  isSaida: boolean,
): Promise<boolean> => {
  if (Platform.OS === 'web') return true;
  if (!(await isLocalAuthAvailable())) {
    throw new Error(
      'Configure a biometria ou a senha do aparelho, ou solicite o registro ao administrador da comissão.',
    );
  }
  // Nunca liberamos a ação por indisponibilidade, falha ou cancelamento da
  // autenticação do aparelho.
  const result = await authenticateLocal(
    isSaida
      ? 'Confirme sua saída da reunião'
      : 'Confirme sua entrada na reunião',
    'Não foi possível confirmar sua identidade. Tente novamente ou solicite o registro ao administrador da comissão.',
  );
  return result === 'success';
};
