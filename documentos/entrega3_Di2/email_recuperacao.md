# Envio de código de recuperação por API HTTP

Data: 21/10/2026. Referências: UC02 (recuperação de conta) e EX-13 (configurações e segredos).

## Comportamento entregue

O serviço `sistema/api/src/services/emailService.ts` expõe `emailService.enviarCodigoRecuperacao(emailDestinatario, codigo)`. Ele recebe um código já gerado, normaliza o e-mail pela regra compartilhada e exige uma string com exatamente seis algarismos, preservando zeros iniciais. Entradas inválidas são recusadas antes de chamar o provedor.

O envio usa o `fetch` nativo do Node, por `POST`, com `Authorization: Bearer <chave>`, `Content-Type: application/json` e `User-Agent`. O corpo segue o [contrato de envio do Resend](https://resend.com/docs/api-reference/emails/send-email): `from`, `to`, `subject`, `html` e `text`. A mensagem é em português e contém o código em HTML simples e em uma alternativa de texto.

A requisição tem limite de dez segundos e rejeita redirecionamentos, evitando encaminhar o código e a credencial para outro destino. Respostas fora de 2xx, falhas de rede e encerramento por tempo excedido geram um `AppError` com mensagem genérica. O serviço não registra o código, a chave, o destinatário ou os detalhes devolvidos pelo provedor. O corpo da resposta é descartado; uma resposta de sucesso significa aceite pelo provedor, sem garantir entrega na caixa de entrada.

Não há SMTP, senha do Google, SDK adicional nem implementação de uma API fictícia da Novasoft. `novasoft.contato@gmail.com` é a conta de contato do projeto.

## Configuração

Preencha estas variáveis **somente em `sistema/api/.env`**, tomando como referência o `.env.example` versionado:

```dotenv
EMAIL_API_URL="https://api.resend.com/emails"
EMAIL_API_KEY="sua-chave-do-provedor-aqui"
EMAIL_FROM="Better Meet <recuperacao@seu-dominio.example>"
```

Os valores acima são exemplos. O código lê todas as variáveis em `src/config/env.ts`. As três são obrigatórias: a ausência de qualquer uma impede a inicialização da API. A URL deve usar HTTPS e não pode conter usuário, senha ou fragmento. Os erros de configuração não exibem o valor informado.

O `.env` real não foi lido nem alterado nesta implementação. Ele está ignorado pelo Git; o `.env.example` contém somente instruções e valores fictícios. Nenhuma dessas credenciais deve ir para variáveis `EXPO_PUBLIC_*` ou para o aplicativo.

No Resend, o remetente precisa pertencer a um [domínio próprio verificado](https://resend.com/docs/dashboard/domains/introduction). Não basta preencher `EMAIL_FROM` com `novasoft.contato@gmail.com`, pois o projeto não controla o domínio `gmail.com`. O [domínio de testes do Resend](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain) também tem restrições de destinatário. O envio real depende de uma chave válida e de um remetente autorizado no provedor.

## Troca de provedor

`EMAIL_API_URL` é o endpoint completo, sem URL padrão escondida no código. Um serviço compatível com o contrato atual pode ser configurado pela URL, chave e remetente do `.env`.

Para um provedor com outro contrato, adapte a função interna `buildEmailRequest` em `emailService.ts`. Ela concentra o corpo e os cabeçalhos; a assinatura usada pela recuperação permanece a mesma. Trocar apenas a URL não torna APIs diferentes compatíveis: [SendGrid](https://www.twilio.com/docs/sendgrid/api-reference/mail-send/mail-send) usa outro formato de corpo, e [Brevo](https://developers.brevo.com/docs/send-a-transactional-email) possui seu próprio formato e mecanismo de autenticação. Consulte a documentação do provedor escolhido antes da troca.

Exemplo de chamada em uma futura integração do backend:

```ts
import { emailService } from "./emailService.ts";

await emailService.enviarCodigoRecuperacao(emailCadastrado, codigoGerado);
```

## Limite desta etapa

Esta alteração implementa o serviço de envio solicitado. Ainda não gera nem grava códigos, não controla validade, uso único ou tentativas e não altera rotas, telas ou senhas. O fluxo antigo de recuperação ainda troca a senha sem confirmar a posse do e-mail; criar o serviço não corrige esse fluxo automaticamente.

A integração de UC02 deverá solicitar o código antes de aceitar a nova senha, manter resposta genérica para e-mails não cadastrados, limitar solicitações e tentativas e consumir o código junto com a troca de senha. O guia estabelece o fluxo de recuperação do Better Auth (EX-14); este serviço pode ser chamado pelo mecanismo de envio dessa integração. Não foram criados modelos Prisma, migrations nem endpoints nesta etapa.

## Verificação reproduzível

Execute em `sistema/api`:

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run lint
npx.cmd prettier --check src/config/env.ts src/config/__tests__/env.test.ts src/schemas/emailSchema.ts src/services/emailService.ts src/services/__tests__/emailService.test.ts ../../documentos/entrega3_Di2/email_recuperacao.md
```

Os testes do serviço simulam `fetch` e a configuração, sem enviar mensagens. Os testes de inicialização usam apenas variáveis fictícias e desativam a leitura de `.env`. Não há conexão ao banco de desenvolvimento.

Os cenários cobrem contrato HTTP e configuração, normalização do destinatário, zeros iniciais, recusa de entradas malformadas, cancelamento da resposta, limite de tempo, falhas HTTP/rede e ausência de vazamento de informações. A configuração é verificada com variáveis ausentes e URLs inadequadas.

### Resultados em 21/10/2026

| Verificação                                              | Resultado                                                                                                    |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Testes do serviço de e-mail                              | 28 aprovados, nenhuma falha.                                                                                 |
| Testes de configuração                                   | 13 aprovados, nenhuma falha.                                                                                 |
| `npm.cmd test` completo da API                           | 111 testes aprovados em 5 suítes, nenhuma falha; inclui os 41 novos e os 70 existentes de lista de presença. |
| `npm.cmd run typecheck`                                  | Aprovado.                                                                                                    |
| `npm.cmd run lint`                                       | Aprovado.                                                                                                    |
| Prettier nos cinco arquivos TypeScript e neste documento | Aprovado.                                                                                                    |
| `git diff --check`                                       | Aprovado.                                                                                                    |

Não foi realizado envio real, pois não foram fornecidos chave de API e remetente autorizado. Não houve alteração do banco, envio de mensagens ou testes contra serviços externos. Nenhum `package.json` ou lockfile foi alterado.
