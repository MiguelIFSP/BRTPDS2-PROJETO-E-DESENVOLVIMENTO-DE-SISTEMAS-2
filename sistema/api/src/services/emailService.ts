import { env } from '../config/env.ts';
import { AppError } from '../errors/AppError.ts';
import { codigoRecuperacaoEmailSchema } from '../schemas/emailSchema.ts';

const EMAIL_TIMEOUT_MS = 10_000;
const EMAIL_ERROR_MESSAGE =
  'Não foi possível enviar o código de recuperação. Tente novamente mais tarde.';

function buildEmailRequest(emailDestinatario: string, codigo: string) {
  // O contrato do provedor fica aqui para não afetar quem solicita o envio.
  const body = {
    from: env.EMAIL_FROM,
    to: [emailDestinatario],
    subject: 'Código de recuperação de senha — Better Meet',
    html: `<html lang="pt-BR"><body>
      <h1>Recuperação de senha</h1>
      <p>Seu código de recuperação do Better Meet é:</p>
      <p><strong>${codigo}</strong></p>
      <p>Não compartilhe este código. Se você não solicitou a recuperação, ignore este e-mail.</p>
    </body></html>`,
    text: `Seu código de recuperação do Better Meet é: ${codigo}. Não compartilhe este código. Se você não solicitou a recuperação, ignore este e-mail.`,
  };

  return {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.EMAIL_API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'BetterMeet/1.0',
    },
    body: JSON.stringify(body),
    // Impede que um redirecionamento encaminhe código e credencial a outro destino.
    redirect: 'error',
    signal: AbortSignal.timeout(EMAIL_TIMEOUT_MS),
  } satisfies RequestInit;
}

export const emailService = {
  /** Envia um código já gerado; a validade e o consumo pertencem à recuperação. */
  async enviarCodigoRecuperacao(
    emailDestinatario: string,
    codigo: string,
  ): Promise<void> {
    const values = await codigoRecuperacaoEmailSchema.validate(
      { emailDestinatario, codigo },
      { stripUnknown: true },
    );

    try {
      const response = await fetch(
        env.EMAIL_API_URL,
        buildEmailRequest(values.emailDestinatario, values.codigo),
      );
      // Só precisamos do status; não guardamos dados devolvidos pelo provedor.
      await response.body?.cancel();
      if (!response.ok) {
        throw new AppError(500, EMAIL_ERROR_MESSAGE);
      }
    } catch {
      // Erros do provedor podem conter dados pessoais ou credenciais.
      throw new AppError(500, EMAIL_ERROR_MESSAGE);
    }
  },
};
