import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

/** Na web, o chamador deve obter confirmação explícita no ConfirmDialog antes de chamar. */
export const confirmPresencaLocal = async (
  isSaida: boolean,
): Promise<boolean> => {
  if (Platform.OS === 'web') return true;
  const [hasHardware, isEnrolled, level] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.getEnrolledLevelAsync(),
  ]);
  if (
    (!hasHardware || !isEnrolled) &&
    level === LocalAuthentication.SecurityLevel.NONE
  ) {
    throw new Error(
      'Configure a biometria ou a senha do aparelho, ou solicite o registro ao administrador da comissão.',
    );
  }
  // Sem biometria, a política nativa permite PIN/senha. Nunca liberamos a ação
  // por indisponibilidade, falha ou cancelamento da autenticação do aparelho.
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: isSaida
      ? 'Confirme sua saída da reunião'
      : 'Confirme sua entrada na reunião',
    cancelLabel: 'Cancelar',
    fallbackLabel: 'Usar senha do aparelho',
    disableDeviceFallback: false,
  });
  if (result.success) return true;
  if (['user_cancel', 'app_cancel', 'system_cancel'].includes(result.error))
    return false;
  throw new Error(
    'Não foi possível confirmar sua identidade. Tente novamente ou solicite o registro ao administrador da comissão.',
  );
};
