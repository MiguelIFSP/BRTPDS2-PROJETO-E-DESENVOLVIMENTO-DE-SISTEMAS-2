- **Incremento:** Apresentação final (AF) — refatoração de código
- **Escopo:** U8 app-auth-integracao (`better-meet`), RF-R26 a R34, R50 e R51
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** aed2702
- **Data de revisão:** 2026-11-20
- **Responsável(eis):** [nome de quem revisa e aprova]
- **Estado:** Proposta — Functional Design, aguardando aprovação
- **Fontes:** [business-logic-model.md](business-logic-model.md); GUIA_DE_CODIFICACAO.md (EX-14, RN-05, RN-20 a RN-22, ZS-01, UI-09); requirements.md

# U8 — Regras de negócio

Legenda de corte: **OBR** = obrigatório; **SDT** = se der tempo. **[DEP-U1]** = depende do contrato da U1, ainda não escrito (`u1-api-auth-protecao/functional-design/` vazio).

## 1. Regras numeradas

| ID | Regra | RF-R | Corte |
|---|---|---|---|
| RA-01 | O token de sessão nunca vai ao `AsyncStorage`. Nativo: `expo-secure-store`. Web: cookie de sessão ou `localStorage` (D2). | R26 | OBR |
| RA-02 | O `authStore` persiste só `user` (exibição). `token` existe só em memória; `isAuthenticated` é derivado da sessão restaurada, não persistido. | R26 | OBR |
| RA-03 | Toda autenticação passa pelo `authClient` (`src/lib/authClient.ts`); proibido hash, token ou sessão à mão no app. | R26 | OBR |
| RA-04 | O cadastro não cria sessão. Depois dele o app mostra a tela de confirmação de e-mail. | R28 | OBR |
| RA-05 | Resposta 403 no login significa e-mail não confirmado: o app mostra aviso e reenvio, não "senha incorreta". | R28 | OBR |
| RA-06 | Reenvio de confirmação e de recuperação tem intervalo mínimo de 60 s no app (botão desabilitado com contagem); a API limita por conta própria (429). | R27, R28 | OBR |
| RA-07 | O login pede só e-mail. Nenhum rótulo, placeholder ou schema aceita "usuário". | R29 | OBR |
| RA-08 | Recuperação em duas etapas; o app nunca envia nova senha junto do e-mail; `forgotPassword(email, newPassword)` é removida. | R27 | OBR |
| RA-09 | A mensagem após pedir recuperação é a mesma para e-mail cadastrado ou não (inclui 404/422 vindos da API; 429 e rede têm mensagem própria). | R27 | OBR |
| RA-10 | 401 em requisição enviada com credencial de sessão executa `expireSession()` (logout). 401 sem credencial não executa. Um logout por rajada. | R32 | OBR |
| RA-11 | Após `expireSession()`, o `/login` mostra "Sua sessão expirou. Entre novamente." uma vez. As telas não tratam 401 uma a uma (RN-05). | R32 | OBR |
| RA-12 | Erro de rede (status 0) e 5xx nunca deslogam; só 401. | R32 | OBR |
| RA-13 | Ao restaurar a sessão, o `role` e os dados vêm de `GET /api/usuarios/me` (C2), não do valor guardado. Falha de rede mantém o guardado. | R26 | OBR |
| RA-14 | O app não conhece segredo: sem `MONITORING_API_KEY`, `clientSecret`, `BETTER_AUTH_SECRET`. Só URLs e o esquema `bettermeet://`. | R30, R33 | OBR |
| RA-15 | Relato de erro à monitoring usa a sessão do usuário (C3); sem sessão, não envia. 4xx e 401 da monitoring não geram novo relato (anti-loop, já existente). | R33 | OBR |
| RA-16 | Exclusão de conta mantém as mensagens de 409 (grupos pendentes e sucessor) e avisa que a autoria vira "usuário removido" (C7). | R34 | OBR |
| RA-17 | Depois de excluir a conta ou sair, a sessão guardada e a flag de biometria da conta são apagadas e a navegação é `router.replace('/login')`. | R26, R34 | OBR |
| RA-18 | A regra de senha forte existe uma vez em `commonSchema.ts` do app; formulários de cadastro, troca e redefinição a usam; a mensagem exibida é a primeira por campo. | R50 | SDT |
| RA-19 | Biometria é opcional, desligada por padrão, e só liga depois de login por e-mail/senha ou social e com hardware e biometria cadastrada. | R31 | SDT |
| RA-20 | A biometria só libera a sessão já guardada. Nunca guarda, envia nem substitui senha; a API não aceita "biometria aprovada" (RN-21). | R31 | SDT |
| RA-21 | Com biometria ligada, desbloqueio ao abrir e após 5 min em segundo plano; 3 falhas oferecem entrar com e-mail e senha. | R31 | SDT |
| RA-22 | Ação sensível (registrar presença, votar, excluir conta) pede `confirm()` só se a biometria está ligada; recusa cancela a ação, que não chega à API. | R31 | SDT |
| RA-23 | Face ID não funciona no Expo Go: teste em build de desenvolvimento no plano manual. `app.json` declara `faceIDPermission` em pt-BR. | R31 | SDT |
| RA-24 | Login social só pelo Google, via `expo-web-browser` e `bettermeet://`; botão visível só quando o modo de sessão suporta (D7). Cancelar o navegador não é erro. | R30 | SDT |
| RA-25 | `npx expo install --check` e `npx expo-doctor` sem pendência de patch do SDK 58, registrados no relatório. | R51 | SDT |
| RA-26 | Telas de pilha da U8 usam `BackButton`; fim de fluxo usa `router.replace`; sem pilha (link externo), o Voltar vai a `/login` (RN-22). | R27, R28 | OBR |
| RA-27 | Cada tela de autenticação segue UI-09: uma tarefa por tela, ação principal visível, `keyboardType`, `autoComplete` e `textContentType` corretos, "próximo" entre campos, 44 px mínimos, `ConfirmDialog` para confirmações. | R27 a R30 | OBR |
| RA-28 | Erro de campo some ao digitar (hook da U5, RF-R41) nos formulários de autenticação. Depende de a U5 fase 1 estar entregue. | R29 | OBR |

## 2. Estados de tela

| Tela | Estados |
|---|---|
| `login` | inicial; enviando (botão com `loadingLabel`); erro de campo; erro geral (banner); e-mail não confirmado (aviso + reenvio); sessão expirada (banner); sucesso (toast, depois `replace('/')`); bloqueado por 429 |
| `usuario` (cadastro) | inicial; enviando; erro de campo; e-mail já cadastrado; sucesso -> "Confirme seu e-mail" (com reenvio e contagem) |
| `recuperar-senha` | inicial; enviando; enviado (mensagem única, reenviar após 60 s); erro de rede; 429 |
| `redefinir-senha` | sem token (redireciona); formulário; enviando; token inválido ou vencido (pedir novo link); sucesso -> login |
| `email-confirmado` | sucesso; link inválido ou vencido (reenviar) |
| `AppGate` | carregando; liberado; bloqueado (biometria); sessão expirada (leva ao login) |
| `perfil` (Segurança) | biometria indisponível; desligada; ligada; confirmando; falhou |
| `excluir-conta` | carregando pendências; formulário de sucessores; 409 com lista; aguardando biometria; excluindo; concluído |

## 3. Mensagens em pt-BR

| Situação | Mensagem |
|---|---|
| E-mail vazio ou inválido | A mensagem de `emailRule()` já existente |
| Senha vazia no login | A senha é obrigatória. |
| Credencial inválida (401 no login) | E-mail ou senha incorretos. |
| E-mail não confirmado (403) | Seu e-mail ainda não foi confirmado. Abra o link que enviamos ou peça um novo. |
| Reenviar confirmação, sucesso | Enviamos um novo link para {e-mail}. Veja também a caixa de spam. |
| Cadastro concluído | Quase lá! Enviamos um link de confirmação para {e-mail}. Toque nele para ativar sua conta. |
| E-mail já cadastrado | Este e-mail já está cadastrado. |
| Recuperação enviada (única) | Se este e-mail estiver cadastrado, enviamos um link para redefinir a senha. Ele vale por 30 minutos. |
| Link vencido ou usado | Este link venceu ou já foi usado. Peça um novo. |
| Senha redefinida | Senha redefinida. Entre com a nova senha. |
| Confirmação de e-mail concluída | E-mail confirmado. Agora é só entrar. |
| Sessão expirada | Sua sessão expirou. Entre novamente. |
| Excesso de tentativas (429) | Muitas tentativas. Aguarde alguns minutos e tente de novo. |
| Sem rede | Não foi possível conectar ao servidor. Verifique sua conexão. (já em `NETWORK_ERROR_MESSAGE`) |
| Falha geral de login | Não foi possível entrar. |
| Login social falhou | Não foi possível entrar com o Google. Tente de novo. |
| Biometria indisponível | Biometria indisponível neste aparelho. Cadastre uma nas configurações do aparelho. |
| Prompt ligar biometria | Confirme para ativar a biometria |
| Prompt desbloqueio | Desbloqueie o Better Meet |
| Prompt ação sensível | Confirme para {registrar sua presença / enviar seu voto / excluir sua conta} |
| Biometria recusada | Confirmação cancelada. A ação não foi feita. |
| `faceIDPermission` (app.json) | O Better Meet usa o Face ID para desbloquear o app e confirmar ações. |
| Exclusão: autoria | Reuniões e votações que você criou continuarão existindo, como criadas por "usuário removido". |
| Exclusão: 409 pendências | Escolha quem assume {lista} antes de excluir a conta. |

Mensagens vindas da API (`error`) em pt-BR continuam prevalecendo quando existirem (padrão atual de `apiRequest`); as acima são `fallbackError` ou textos fixos do app.

## 4. Decisões deste desenho

| ID | Decisão | Alternativa descartada |
|---|---|---|
| D1 | `token` só em memória no `authStore`, para não editar ~35 chamadas da U5 | Remover `token` do store e fazer a U5 trocar todas as telas (conflito de dono e de onda) |
| D2 | Web: cookie do Better Auth; reserva `localStorage` | `AsyncStorage` (proibido pela ZS-01) |
| D3 | Flag de biometria por conta no `expo-secure-store` | AsyncStorage (valor não sensível, mas liga a segurança; secure-store evita adulteração simples) |
| D4 | Bloqueio após 5 min em segundo plano | Bloquear ao sair sempre (incômodo em reuniões) |
| D5 | Sem sessão, relato de erro não é enviado à monitoring | Rota pública na monitoring (volta o problema do Bug 4) |
| D6 | Manual no app só para logado | Manual público (fora do escopo) |
| D7 | Google só onde o modo de sessão permitir (A: todos; B: web) | Obrigar Modo A |

## 5. Pontos a decidir

| ID | Ponto | Recomendação |
|---|---|---|
| P1 | Modo de sessão (A `expoClient` ou B `bearer`) e cabeçalho (Cookie ou Bearer) | Seguir o que a U1 provar no SDK 58; o app já isola em `authClient.ts` |
| P2 | Tipo do `id` (número ou string) | U1 manter inteiro (`generateId: 'serial'`) para não quebrar ~40 telas e serviços da U5 |
| P3 | Rotas novas `redefinir-senha` e `email-confirmado`, e `_layout.tsx` listá-las como públicas | U8 cria (é dona de `_layout.tsx`); confirmar com o orquestrador, pois não estão na lista "dona de" |
| P4 | `AppGate.tsx` não existe hoje; o guard está em `_layout.tsx` | Criar `AppGate` com a lógica de sessão expirada e bloqueio; manter `Stack.Protected` |
| P5 | Link de recuperação como `bettermeet://` ou página web da API, ou código OTP | Link `bettermeet://redefinir-senha` com reserva por página web da API; depende de C1 |
| P6 | Conta legada (SHA-256): redefinição forçada ou regravação no 1º login | Seguir a U1; o app só exibe a mensagem da API |
| P7 | Excluir conta precisa de senha atual, além da biometria? | Manter como hoje; sem nova exigência |
