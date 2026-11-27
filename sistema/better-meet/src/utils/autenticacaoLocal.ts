import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export type LocalAuthResult = 'success' | 'cancel';

const CANCEL_ERRORS: readonly string[] = [
  'user_cancel',
  'app_cancel',
  'system_cancel',
];

// O prompt nativo (sobretudo a tela de PIN do Android, que é outra Activity)
// leva o app ao segundo plano. Essas idas não podem disparar o bloqueio por
// tempo do useBloqueioApp, senão o app se bloquearia ao ser desbloqueado.
let promptsInProgress = 0;

/**
 * Biometria cadastrada ou, sem ela, PIN/padrão/senha de tela. Na web não há
 * autenticação do aparelho.
 */
export async function isLocalAuthAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const [hasHardware, isEnrolled, level] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.getEnrolledLevelAsync(),
  ]);
  return (
    (hasHardware && isEnrolled) ||
    level !== LocalAuthentication.SecurityLevel.NONE
  );
}

/**
 * Abre o prompt nativo. Cancelar devolve 'cancel'; qualquer outra falha lança
 * `failureMessage`. Nunca devolve sucesso sem a confirmação do aparelho.
 */
export async function authenticateLocal(
  promptMessage: string,
  failureMessage: string,
): Promise<LocalAuthResult> {
  promptsInProgress += 1;
  try {
    // Sem biometria, a política nativa permite PIN/senha do aparelho.
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancelar',
      fallbackLabel: 'Usar senha do aparelho',
      disableDeviceFallback: false,
    });
    if (result.success) return 'success';
    if (CANCEL_ERRORS.includes(result.error)) return 'cancel';
    throw new Error(failureMessage);
  } finally {
    promptsInProgress -= 1;
  }
}

export function isLocalAuthInProgress() {
  return promptsInProgress > 0;
}
