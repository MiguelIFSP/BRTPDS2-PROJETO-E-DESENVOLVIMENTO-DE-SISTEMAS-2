- **Incremento:** Apresentação final (AF) — refatoração de código para a entrega de 2026-11-27
- **Escopo:** bugs 1 a 11 e pendências P1 a P22 do `RELATORIO_BUGS.md`; Better Auth completo; retornos funcionais Di2 e Di3; proteção da API (EX-19) e convenções de interface (UI-09) em `api`, `better-meet`, `monitoring-better-meet` e `management-better-meet` (servidor e web), mais a documentação local (`wiki-local`, `aidlc-docs`)
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** aed2702
- **Data de revisão:** 2026-11-20
- **Responsável(eis):** 
- **Estado:** Proposta — aguardando aprovação dos requisitos (Requirements Analysis, profundidade padrão do AI-DLC v1)
- **Fontes:** [aidlc-state.md](../../../aidlc-state.md); [RELATORIO_BUGS.md](../../../../../../RELATORIO_BUGS.md); [GUIA_DE_CODIFICACAO.md](../../../../../../GUIA_DE_CODIFICACAO.md); [PROMPT_AGENTES_IA.md](../../../../../../PROMPT_AGENTES_IA.md); [analise-retornos-professor.md](../revisao-padroes-entrega-final/analise-retornos-professor.md); leitura do código atual de `sistema/` no commit aed2702

# Requisitos — Refatoração para a última entrega

## 1. Resumo

A entrega final é em 2026-11-27, e restam 7 dias a partir de 2026-11-20. O usuário decidiu o escopo em [aidlc-state.md](../../../aidlc-state.md): Better Auth completo (hash scrypt, recuperação com token, e-mail confirmado, login social e biometria), bugs 1 a 11, pendências P1 a P22, retornos funcionais das entregas Di2 e Di3, proteção da API (EX-19) e convenções de interface (UI-09). As verificações dos sub-agentes são `npm test`, lint e typecheck; não há `expo export` nem servidores de desenvolvimento.

O documento tem 85 requisitos (RF-R01 a RF-R85) agrupados por subsistema. A seção 3 mostra o estado real do código conferido nesta data, e as seções 4 a 9 trazem os requisitos. As dependências, o plano de paralelismo, os riscos e o corte de prioridade estão nas seções 10 a 13.

Convenções: "Origem" cita o item do relatório de bugs (bug N), a pendência (P N), o retorno do professor (F N) ou a regra do guia. Prioridade: Crítica (segurança ou perda de função), Alta, Média ou Baixa. `[A CONFIRMAR NO CÓDIGO]` marca o que não foi verificado nesta análise.

## 2. Premissas e restrições

- Sem commit, merge, push ou git de escrita pelos sub-agentes; Wiki de origem intocada (só `wiki-local/`); docker e migrations do Prisma liberados.
- Verificação de cada requisito por `npm test`, `npm run lint` e `npm run typecheck` do subsistema, mais inspeção de arquivo quando o critério disser "inspeção" ou "busca textual". A `monitoring-better-meet`, o servidor da gestão e o painel web não têm hoje todos esses scripts (RF-R58, RF-R65 e RF-R75 os criam).
- Os guias já descrevem o padrão-alvo (EX-14 a EX-22, RN-20 a RN-22, UI-09, YP-05, GT-06); este documento só diz o que falta no código para cumpri-los.
- Mensagens ao usuário em pt-BR, com vocabulário de aplicativo (NM-02).

## 3. Estado real do código conferido em 2026-11-20

A tabela resume o que foi verificado antes de redigir os requisitos.

| Item | Estado verificado | Onde |
|---|---|---|
| Better Auth na API | Ausente: o `package.json` da `api` não tem `better-auth`, `helmet` nem `express-rate-limit` | `sistema/api/package.json` |
| Better Auth no app | Ausente; `expo-secure-store` e `expo-local-authentication` não estão no `package.json`; a sessão fica em `AsyncStorage` | `sistema/better-meet/package.json`, `src/store/authStore.ts` |
| Better Auth na monitoring | `better-auth ^1.7.4` está em `dependencies`, instalado e sem nenhum `import` em `src/` | `sistema/monitoring-better-meet` |
| Hash de senha | SHA-256 sem sal | `api/src/utils/passwordHash.ts` |
| Recuperação de senha | `forgotPassword(email, newPassword)` grava a senha só com o e-mail; a tabela `PasswordResetToken` existe e não é usada | `api/src/services/authService.ts`, `schema.prisma` |
| Login | `findFirst` com `OR` de e-mail e nome | `authService.login` |
| Middlewares globais da API | `express.json()` sem limite e `cors({ origin: true })`; sem helmet nem rate limit | `api/src/server.ts:49-50` |
| `POST /login` fora de `/api` | Presente (exceção temporária) | `api/src/server.ts:71` |
| Autoria de reunião e votação | `criadoPorUserId Int` obrigatório, sem `onDelete`; `deleteUser` responde 409 (correção parcial do bug 1) | `schema.prisma:193,304`; `usuarioService.ts:325` |
| Check-in | Só confere `status === 'AGENDADA'`; sem janela de horário | `reuniaoService.ts:500` |
| `isDateTimeInPast` | Usa `new Date(ano, mês, ...)` no fuso do processo | `api/src/schemas/reuniaoSchema.ts:23-41` |
| `removeMember` | Remove só `organizacaoMembro`, não as linhas de `ComissaoEquipe` | `organizacaoService.ts:416` |
| `ensureDefaultAdmin` | `upsert` com `update: { role: 'ADMIN' }` a cada boot | `usuarioService.ts:346` |
| Votação | Sem tipo (aberta ou secreta), sem voto nulo, sem regra de presença; o modelo tem `encerrada`, `VotacaoVoto` e troca de voto por `opcaoId` | `schema.prisma:299-340`, `votacaoService.ts` |
| Ata | Há `AtaVoto` com `versaoAta`; regra de exportação só após aprovação e imutabilidade: `[A CONFIRMAR NO CÓDIGO]` | `schema.prisma:213`, `ataService.ts` |
| 401 no app | `apiRequest` não trata 401; só a tela de status faz logout | `better-meet/src/utils/apiClient.ts:54-76` |
| Chave da monitoring | `EXPO_PUBLIC_MONITORING_API_KEY` exigida em `config/api.ts` do app e do painel web | `better-meet/src/config/api.ts`; `management-better-meet/web/src/config/api.ts` |
| Perfil | Mostra "ID do usuário" | `better-meet/src/app/(tabs)/mais/perfil.tsx:216` |
| `PrimeiroAcessoDialog` | Texto "o site funciona?" na linha 109 | `better-meet/src/components/PrimeiroAcessoDialog.tsx:109` |
| Opacidade manual | `pressed: { opacity: 0.75 }` | `better-meet/src/components/presenca/ListaPresencaEditor.tsx:209` |
| Manual | PDF em `assets/manual` baixado por `downloadManualUsuario`; sem tela de ajuda | `better-meet/src/utils/downloadManualUsuario.ts` |
| Expo | App e painel web já em `~58.0.25` | `package.json` dos dois |
| Monitoring | Sem migrations (script `prisma:push`), `exactOptionalPropertyTypes: false`, sem scripts `lint`, `typecheck` e testes, controllers com funções soltas e `(error as Error).message` no 500, `Number()` no id, `cors()` aberto, rotas em `/monitoring-better-meet` | `monitoring-better-meet/` |
| Gestão, servidor | `requireAuth` lê o `role` do JWT; `cors()` aberto; sem lint, typecheck nem testes | `management-better-meet/server/src/middlewares/auth.ts:31-40` |
| Gestão, web | `fetch` direto em `login.tsx:101`; `AGENTS.md` cita v57; `use-theme.ts`, `use-color-scheme*.ts` e `scripts/reset-project.js` presentes; sem scripts `typecheck` e testes | `management-better-meet/web/` |
| `sistema/AGENTS.md` e `sistema/CLAUDE.md` | Não existem | `sistema/` |
| `LICENSE` e catálogo de softwares | Sem `LICENSE` na raiz nem em `sistema/`; sem `documentos/consolidado/` | raiz do repositório |
| `TZ` | Nem `ecosystem.config.js` nem `docker-compose.yml` definem `TZ` | `sistema/` |

## 4. Requisitos — `api`

### 4.1 Autenticação (Better Auth)

| ID | Requisito | Origem | Critério de aceitação | Prioridade |
|---|---|---|---|---|
| RF-R01 | Montar o Better Auth no Express sob `/api/auth/*`, com adaptador Prisma, plugin `expo()`, `trustedOrigins` com `bettermeet://`, `BETTER_AUTH_SECRET` e `BETTER_AUTH_URL` lidos só em `config/env.ts`, e as tabelas do Better Auth criadas por migration | P7; EX-14; F04, F08 | `package.json` lista `better-auth` e `@better-auth/expo`; `tsc` sem erro; teste de integração com cadastro e login pelo Better Auth retorna sessão; migration aplicada em MySQL de teste | Crítica |
| RF-R02 | Gravar senhas com scrypt (padrão do Better Auth) e remover `utils/passwordHash.ts`; migrar contas antigas com SHA-256: conferir o hash antigo no primeiro login e regravar no formato novo, ou exigir redefinição | P7; EX-14 | Nenhum `createHash('sha256')` para senha em `src/` (busca textual); teste em que a mesma senha gera hashes diferentes; teste de login de conta legada seguido de regravação no formato novo | Crítica |
| RF-R03 | Recuperação de senha só com token enviado ao e-mail cadastrado, de uso único e validade curta (até 30 min), com a mesma resposta para e-mail cadastrado ou não; remover `forgotPassword(email, newPassword)` e a rota pública antiga | Bug 2; P7; F08 | Testes: redefinição sem token recusada; token usado e token vencido recusados; e-mail inexistente responde igual ao cadastrado; a rota antiga não aceita nova senha | Crítica |
| RF-R04 | Exigir e-mail confirmado: envio de verificação no cadastro (`sendOnSignUp`), `requireEmailVerification: true`, reenvio e confirmação da troca de e-mail no perfil; contas legadas seguem a regra definida na migração | F05; EX-21 | Teste: login de conta não confirmada recusado (403); teste de confirmação e de reenvio; envio pelo `emailService` configurado no `.env` | Alta |
| RF-R05 | Login só por e-mail: remover a busca por nome em `authService.login` e o aceite de nome no schema de login | Bug 9; P8; F06; EX-17 | Teste: login com o nome de usuário falha; `authSchema` valida `emailRule()`; busca textual sem `name:` em consulta de login | Alta |
| RF-R06 | Login social por `socialProviders` do Better Auth com provedor gratuito, vínculo por e-mail verificado e sem conta duplicada; `clientSecret` só no `.env` da API | F04; EX-22 | Teste com provedor simulado: e-mail novo cria conta, e-mail existente vincula; `env.ts` valida as chaves; `clientSecret` ausente de `better-meet/` (busca textual) | Média |
| RF-R07 | Definir e implementar como `monitoring-better-meet` e `management-better-meet/server` validam a sessão depois do Better Auth (proposta: rota autenticada da API, como `GET /api/usuarios/me`, que devolve o perfil lido do banco) | EX-14 (migração); bug 3 | Contrato descrito no `openapi.yaml`; teste da rota com token válido, inválido e usuário excluído; o `JWT_SECRET` compartilhado deixa de ser necessário nos outros serviços, ou o requisito registra a exceção | Crítica |

### 4.2 Bugs e regras de domínio

| ID | Requisito | Origem | Critério de aceitação | Prioridade |
|---|---|---|---|---|
| RF-R08 | Definir a regra de autoria e implementar a exclusão de conta de quem criou reunião ou votação (proposta: `criadoPorUserId` opcional com `onDelete: SetNull` e exibição "usuário removido"); migration versionada | Bug 1 (parcial); F13 | Teste: excluir usuário com reunião e votação criadas não devolve 500 nem 409 por autoria; migration aplicável a banco com dados; o mapeamento do P2003 para 409 já existente é mantido | Crítica |
| RF-R09 | Limitar o check-in a uma janela em torno do horário da reunião, calculada com `instanteNoFuso` e `TZ_REUNIOES`; fora dela, 409 com a hora de início na mensagem | Bug 5; F39; EX-20 | Testes de borda: 1 s antes e depois do início e do fim; mensagem informa a partir de quando; `reuniaoCheckIn.test.mjs` atualizado | Alta |
| RF-R10 | Trocar `isDateTimeInPast` por comparação com `instanteNoFuso(data, hora, env.TZ_REUNIOES)` e `new Date()`; mover as regras de data (início no futuro, término depois do início) para `commonSchema.ts` | Bug 6; F36; YP-05 | Testes com `TZ=UTC` e `TZ_REUNIOES=America/Sao_Paulo`: reunião à noite para a mesma noite aceita; reunião 2 h no passado recusada; término antes do início recusado | Alta |
| RF-R11 | Em `removeMember`, remover a pessoa das `ComissaoEquipe` da organização na mesma transação, aplicando a regra de sucessão a cada comissão em que ela seja a única administradora | Bug 8; EX-18, EX-19 | Teste: após a remoção, `assertMembroDaComissao` recusa criar reunião, check-in e editar ata; teste de comissão com um só administrador devolve 409 com os grupos pendentes | Alta |
| RF-R12 | `ensureDefaultAdmin` cria o administrador do `.env` só quando não existe nenhum `Role.ADMIN` e nunca altera contas existentes | Bug 10 | Teste: rebaixar o admin padrão e reiniciar não o promove de novo; sem nenhum admin, a conta é criada; senha criada no formato da RF-R02 | Média |
| RF-R13 | Impedir que organização fique sem `CRIADOR` e comissão sem `ADMINISTRADOR` ao excluir conta, sair, ser removido, ser rebaixado ou transferir papel, na mesma transação, com `details` dos grupos pendentes | F13; EX-18 | Testes por operação e por grupo (plataforma, organização, comissão); `usuarioExclusaoAdmin.test.mjs` continua passando | Média |
| RF-R14 | Permitir mudar a resposta ao convite e reenviar convite recusado enquanto a reunião não começou; recusar com 409 ou 410 depois | F38; EX-20 | Testes: aceitar depois de recusar; reenviar recusado; tentativa após o início responde 409 ou 410 | Média |
| RF-R15 | Presença: validar a saída (`checkOut`) na janela da reunião e permitir que o Administrador da comissão marque a presença de um participante, com registro de quem marcou | F39; EX-20 | Testes: saída sem entrada recusada; saída fora da janela recusada; marcação por quem não é Administrador da comissão devolve 403; migration se houver nova coluna | Média |
| RF-R16 | Ata: exportar só depois de aprovada; permitir o voto da ata de quem não é o presidente; depois da exportação ou impressão a aprovação não muda (versão e estado gravados) | F46; EX-20 | Testes: exportação antes da aprovação recusada (409); voto de integrante que não é presidente aceito; alteração de voto após exportação recusada; regra atual em `ataService.ts`: `[A CONFIRMAR NO CÓDIGO]` | Média |
| RF-R17 | Votação: campo `tipo` (aberta ou secreta) em enum Prisma, voto nulo, opção de mostrar o resultado parcial, opção de permitir a troca de voto, voto só de quem registrou entrada e não saiu, nenhuma troca depois do encerramento da votação ou da reunião; migration | F47; EX-20; PR-06 | Testes por transição recusada: voto sem entrada, após saída, após encerramento, troca com troca desligada; voto nulo contado; enum no `schema.prisma` com transições comentadas (PR-09) | Média |
| RF-R18 | Votação secreta: nenhuma rota devolve a ligação entre voto e pessoa, nem ao Administrador da comissão; só os totais | F47; PR-05 | Teste: resposta de `getById` e `listByReuniao` de votação secreta sem `userId` por voto; votação aberta continua listando quem votou | Média |
| RF-R19 | Rota do relatório das reuniões de que a pessoa participou e do resultado das votações da reunião (dados para o PDF ou a tela) | F47, F48 | Teste: devolve só reuniões em que a pessoa tem convite aceito ou registro; ordenação e paginação documentadas no OpenAPI | Baixa |
| RF-R20 | Exigir ao menos um convidado além do Administrador da comissão ao criar reunião | F34 | Teste: criação sem convidados recusada com 400 e mensagem; `reuniaoSchema` atualizado | Baixa |

### 4.3 Proteção, contrato e configuração

| ID | Requisito | Origem | Critério de aceitação | Prioridade |
|---|---|---|---|---|
| RF-R21 | Cabeçalhos de segurança com `helmet()`, CORS restrito a `CORS_ORIGINS` (lido em `env.ts`), limite de tentativas (`express-rate-limit`) nas rotas públicas fora do Better Auth (como convites), `express.json({ limit })` explícito com comentário e resposta 429 em pt-BR | F03; EX-19; EX-05 | Busca textual sem `cors({ origin: true })`; teste com supertest: origem não listada sem `Access-Control-Allow-Origin`, cabeçalhos do helmet presentes, 429 após o limite; `rateLimit` do Better Auth ligado em produção | Alta |
| RF-R22 | Mover o `POST /login` para `/api` (ou removê-lo, com o Better Auth) e retirar a exceção temporária de `server.ts` | P5; EX-12 | `server.ts` sem `app.post('/login')`; o painel web (RF-R72) usa a rota nova; sem referência a `/login` fora de `/api` nos consumidores | Baixa |
| RF-R23 | Atualizar `docs/openapi.yaml` com as rotas novas e alteradas (auth, 429, votação, presença, relatório, rota de perfil da RF-R07) | P15; EX-16 | Todo endpoint novo ou alterado aparece no YAML; o arquivo carrega com `YAML.parse` no teste; revisão por inspeção | Média |
| RF-R24 | Consolidar a regra de senha forte em um único `commonSchema.ts` e revisar o uso de `abortEarly: false` com leitura só de `errors[0]` | P16, P17; YP-03, YP-04 | Busca textual mostra a regra de senha definida uma vez na API; teste do schema; as cópias do app seguem na RF-R50 | Baixa |
| RF-R25 | Atualizar `.env.example` (`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CORS_ORIGINS`, provedor social) e definir `TZ` em `ecosystem.config.js` e `docker-compose.yml` | Bug 6; EX-13 | Inspeção: toda chave nova de `env.ts` está no `.env.example`; `TZ` definido nos dois arquivos | Média |

## 5. Requisitos — `better-meet` (aplicativo)

### 5.1 Autenticação e sessão

| ID | Requisito | Origem | Critério de aceitação | Prioridade |
|---|---|---|---|---|
| RF-R26 | Cliente do Better Auth para Expo (`expoClient`), com a sessão em `expo-secure-store` no Android e iOS e mecanismo próprio no web; trocar o `AsyncStorage` do token no `authStore` e instalar com `npx expo install` | EX-14; ZS-01; P7 | Dependências no `package.json` com versões do SDK 58; typecheck e testes do `authStore` passam; inspeção: token fora do `AsyncStorage` | Crítica |
| RF-R27 | Recuperação de senha em duas etapas: solicitar pelo e-mail e redefinir com o token (link com `bettermeet://` ou código), com mensagem igual para e-mail cadastrado ou não | Bug 2; F08 | Testes de tela e serviço de `recuperar-senha.tsx`; a tela não envia mais "nova senha" junto do e-mail | Crítica |
| RF-R28 | Fluxo de e-mail não confirmado: mensagem explicando a falta, botão de reenvio e tela de confirmação | F05; EX-21 | Teste de tela: resposta 403 mostra o aviso e o reenvio chama o serviço | Alta |
| RF-R29 | Tela de login pede só "E-mail" com `keyboardType="email-address"` e `autoComplete="email"` | Bug 9; P8; F06 | Teste de schema e de tela; busca textual sem "Usuário" no rótulo de login | Alta |
| RF-R30 | Login social no app com `expo-web-browser`, `expo-linking` e o esquema `bettermeet://` | F04; EX-22 | Botão na tela de login chama o cliente Better Auth; teste com cliente simulado; verificação em aparelho no plano manual | Média |
| RF-R31 | Biometria opcional: ligar e desligar no perfil, liberar a sessão guardada, plugin `expo-local-authentication` no `app.json` com `faceIDPermission` em pt-BR, confirmação opcional ao registrar presença e votar | F04, F39; RN-21 | Teste com módulo simulado: indisponível desabilita a opção; `app.json` com o plugin; a biometria nunca grava a senha (inspeção) | Média |
| RF-R32 | Tratar 401 de requisição com token em `apiRequest` chamando `useAuthStore.getState().logout()`, com aviso de sessão expirada no `AppGate` | Bug 7; F29; RN-05 | Teste em `apiClient`: 401 com token chama `logout`; 401 sem token (login errado) não chama | Alta |
| RF-R33 | Remover `EXPO_PUBLIC_MONITORING_API_KEY` e `MONITORING_API_KEY` do app; o app reporta erros e pede checagem por rotas da monitoring autenticadas por sessão (RF-R55) | Bug 4; P6; EX-13 | Busca textual: `MONITORING_API_KEY` ausente em `src/` e no `.env.example`; testes de `monitoringService` atualizados | Alta |
| RF-R34 | Mensagens do app para o 409 da exclusão de conta e para os grupos pendentes continuam claras com a regra de autoria da RF-R08 | Bug 1 | Teste de `excluir-conta.tsx` com 409 de autoria ou de sucessor | Média |

### 5.2 Retornos funcionais e interface

| ID | Requisito | Origem | Critério de aceitação | Prioridade |
|---|---|---|---|---|
| RF-R35 | Esconder ou desabilitar o botão de entrada fora da janela da RF-R09, explicando o motivo; a decisão continua da API | Bug 5; RN-16 | Teste de tela em `[id].tsx`: botão ausente antes do início e depois do fim; mensagem com a hora de início | Alta |
| RF-R36 | Tela de presença com saída e marcação pelo Administrador da comissão, e confirmação por biometria quando ligada | F39 | Testes de tela e serviço; mensagens de 409 da API exibidas | Média |
| RF-R37 | Responder de novo ao convite e reenviar convite recusado | F38 | Testes de `ConvitePendenteCard` e do serviço para as duas ações | Média |
| RF-R38 | Votação: escolher o tipo ao criar, opção de voto nulo, resultado parcial e troca de voto conforme a configuração, e esconder quem votou na votação secreta | F47 | Testes de `votacaoSchema` e de tela para os tipos; a lista de votantes some na votação secreta | Média |
| RF-R39 | Ata: exportar só depois de aprovada, votar na ata sem depender do presidente e mostrar a aprovação como definitiva após a exportação | F46 | Testes de `AtaReuniao` e `ataPdf`: botão de exportação desabilitado antes da aprovação | Média |
| RF-R40 | Datas no passado: mensagens de início e término no formulário de reunião alinhadas à RF-R10 | F36; YP-05 | Testes de `reuniaoSchema` do app: início e término no passado recusados no fuso `America/Sao_Paulo` | Média |
| RF-R41 | Remover o erro do campo ao alterá-lo em todos os formulários (hook comum ou `TextField`), com base no `clearFieldError` de `(reunioes)/index.tsx` | F35; YP-04, RN-11 | Teste do hook ou de campo: o erro sai ao digitar, sem novo envio; busca textual das telas que só limpam o erro no envio | Média |
| RF-R42 | Criar e editar reunião em tela própria ou etapas (formulário com mais de cerca de seis campos dividido), ação principal visível, teclado adequado e "próximo" entre campos | F33, F14; UI-09 | Testes de tela por etapa; inspeção de `keyboardType`, `autoComplete` e `textContentType`; `scrollToTopKey` por etapa | Média |
| RF-R43 | "Voltar" de "Ver comissões" e "Ver organizações" do relatório individual devolve à tela de origem | F48; RN-22 | Teste de navegação com `router`; atalhos entre abas abrem na pilha da aba atual | Média |
| RF-R44 | Relatório das reuniões de que a pessoa participou, consumindo a rota da RF-R19 | F48 | Teste de serviço e de tela em `mais/relatorios` | Baixa |
| RF-R45 | Manual dentro do app (Mais > Ajuda), com conteúdo em `src/content/manual/` e os componentes base; o PDF vira exportação opcional | F49; RN-20 | Teste de tela renderiza as seções; typecheck dos módulos de conteúdo; `downloadManualUsuario` mantido só como opcional | Média |
| RF-R46 | Trocar "site" por "aplicativo" em `PrimeiroAcessoDialog.tsx:109` e conferir "página" e "clicar" nos textos | F49; NM-02 | Busca textual por `site`, `página` e `clique` em textos de tela; teste do diálogo | Baixa |
| RF-R47 | Remover "ID do usuário" do perfil | P13; F09; UI-08 | Teste de `perfil.tsx` sem o rótulo; busca textual sem `user.id` exibido | Baixa |
| RF-R48 | Trocar a opacidade manual de `ListaPresencaEditor.tsx` por `PressedOpacity` | P12; RN-07 | Busca textual sem `opacity: 0.75` no arquivo | Baixa |
| RF-R49 | Conferir o `Appearance.setColorScheme` do `themeStore` na opção "Sistema" | P19; UI-01 | Teste do `themeStore` para "Sistema"; verificação em aparelho (`[A CONFIRMAR NO CÓDIGO]`) no plano manual | Baixa |
| RF-R50 | Levantar e consolidar a regra de senha forte e o `abortEarly` nos schemas do app | P16, P17 | Busca textual das cópias da regra; testes de schema | Baixa |
| RF-R51 | Conferir `npx expo install --check` e `expo-doctor` sem pendências de patch do SDK 58 | F41; RN-19 | Resultado dos dois comandos registrado no relatório da unidade; sem versão fora da faixa do SDK | Baixa |

## 6. Requisitos — `monitoring-better-meet`

| ID | Requisito | Origem | Critério de aceitação | Prioridade |
|---|---|---|---|---|
| RF-R52 | Ativar `exactOptionalPropertyTypes: true` e corrigir os erros | P1; TS-01 | `tsc --noEmit` sem erros com a opção ligada | Média |
| RF-R53 | Renomear `status.routes.ts`, `status.controller.ts`, `apiKey.ts` e `jwtAuth.ts` para o padrão `<dominio><Camada>.ts` e atualizar imports | P2; NM-04 | Inspeção da lista de arquivos; `tsc` sem erros | Baixa |
| RF-R54 | Controllers e services como objeto literal exportado, sem `req`/`res` em funções soltas; resposta 500 genérica sem `(error as Error).message` e erro central | P3, P4; EX-02, EX-06 | Busca textual sem `(error as Error).message`; teste do middleware de erro devolve mensagem genérica no 500 | Média |
| RF-R55 | Rota autenticada por sessão (token do usuário) para o app e o painel reportarem erros e pedirem checagem de subsistema; manter a chave interna só entre servidores | Bug 4; P6; EX-13 | Teste: sem token 401, com token de usuário comum aceito para reportar erro; chave interna fora do bundle (busca no app e no web); contrato no OpenAPI | Alta |
| RF-R56 | Validar a sessão pelo contrato da RF-R07, em vez de `jwt.verify` com o `JWT_SECRET` compartilhado | EX-14 | Teste do guard com sessão válida, inválida e usuário excluído; `jsonwebtoken` removido se não houver mais uso | Crítica |
| RF-R57 | Converter `subSystemId` com `parseId` (400 para id inválido) | P22; EX-11 | Teste: `abc`, `0`, `-1` e `1.5` respondem 400 | Baixa |
| RF-R58 | Criar scripts `lint`, `typecheck` e `test` (Jest ou `node --test`) e testes de guard, controller e service de status | P21; GT-04 | `npm run lint`, `npm run typecheck` e `npm test` executam e passam | Média |
| RF-R59 | Gerar o baseline de migrations do Prisma e trocar `prisma:push` por `prisma:migrate` e `prisma:deploy`, preservando os dados | P9; PR-07 | Pasta `prisma/migrations` com baseline; `prisma migrate deploy` aplicado em banco já populado sem perda (docker); `prisma:push` ausente | Média |
| RF-R60 | `helmet`, CORS por `CORS_ORIGINS`, limite de tentativas e limite do corpo; leitura de ambiente em `config/env.ts` | F03; EX-19, EX-13 | Testes iguais aos da RF-R21; busca textual sem `cors()` aberto nem `process.env` fora de `env.ts` | Alta |
| RF-R61 | Mover as rotas para o prefixo `/api`, ajustando os consumidores (app, painel, servidor da gestão, `monitoringService` da API) ou manter a exceção registrada | P5; EX-12 | Busca textual por `/monitoring-better-meet` sem sobras; typecheck dos consumidores; ou nota explícita no OpenAPI | Baixa |
| RF-R62 | Remover a dependência `better-auth` sem uso, caso a monitoring valide a sessão pela API (RF-R56) | RF-R56 | `package.json` sem `better-auth`; `npm ls` sem pendências | Baixa |
| RF-R63 | Criar `docs/openapi.yaml` da monitoring | P15; EX-16 | Arquivo cobre as rotas de status; `YAML.parse` válido | Baixa |

## 7. Requisitos — `management-better-meet/server`

| ID | Requisito | Origem | Critério de aceitação | Prioridade |
|---|---|---|---|---|
| RF-R64 | Autorizar as ações de administrador com o perfil atual do banco (pela rota da RF-R07), não pelo `role` do JWT | Bug 3 | Teste do `requireAdmin`: usuário rebaixado ou excluído recebe 403 ou 401 mesmo com token ainda válido | Alta |
| RF-R65 | Criar scripts `lint`, `typecheck` e `test` e testes do `requireAuth`, do `requireAdmin` e do controller de subsistemas | P21; GT-04 | Os três comandos executam e passam | Média |
| RF-R66 | `helmet`, CORS por `CORS_ORIGINS`, limite de corpo e limite de tentativas em `/subsystems`, com ambiente em `config/env.ts` | F03; EX-19 | Testes iguais aos da RF-R21 | Alta |
| RF-R67 | Substituir o `jwt.verify` local pelo contrato da RF-R07 e remover a exigência de `JWT_SECRET` no boot | EX-14 | Servidor sobe sem `JWT_SECRET`; teste do guard; ou exceção registrada | Crítica |
| RF-R68 | Conferir os padrões que o relatório marcou como "gestão não conferida" (NM-04, EX-02, EX-06, EX-11, `exactOptionalPropertyTypes`) e corrigir o que divergir | P2, P3 | Lista de divergências no relatório da unidade; busca textual por `(error as Error).message` e `Number(` em ids; `tsc` sem erros | Baixa |
| RF-R69 | Documentar as rotas em `docs/openapi.yaml` e, se a decisão for mover, usar o prefixo `/api` | P15, P5; EX-16 | Arquivo cobre `/subsystems/:name/:action`; `YAML.parse` válido | Baixa |

## 8. Requisitos — `management-better-meet/web`

| ID | Requisito | Origem | Critério de aceitação | Prioridade |
|---|---|---|---|---|
| RF-R70 | Remover `EXPO_PUBLIC_MONITORING_API_KEY` do painel; o painel reporta erros pela rota autenticada da RF-R55 | Bug 4; P6 | Busca textual sem `MONITORING_API_KEY`; `.env.example` sem a variável; typecheck | Alta |
| RF-R71 | Mostrar os cartões dos subsistemas com status "desconhecido" quando a busca de status falha e liberar ao menos a ação de iniciar a monitoring | Bug 11 | Teste ou inspeção de `index.tsx`: lista nunca nula na renderização; botão de iniciar habilitado com status `UNKNOWN` | Baixa |
| RF-R72 | Login pelo serviço central (sem `fetch` direto em `login.tsx`), usando o fluxo do Better Auth e o e-mail como identificador | P11; EX-17 | Busca textual sem `fetch(` em `login.tsx`; typecheck | Alta |
| RF-R73 | Atualizar o `AGENTS.md` do painel para a documentação do SDK 58 | P10; RN-01 | Busca textual sem `v57.0.0` em `AGENTS.md` e `CLAUDE.md` | Baixa |
| RF-R74 | Remover as sobras do template (`use-theme.ts`, `use-color-scheme*.ts`, `scripts/reset-project.js`) e dependências sem uso, se nada as importar | P18; RN-14 | Busca textual confirma que nada importa os arquivos antes de apagar; `tsc` sem erros | Baixa |
| RF-R75 | Criar scripts `typecheck` e `test` no painel e executar `npm install` para resolver `@react-native-vector-icons/ionicons` | Verificação de 2026-11-17; P21 | `npm run typecheck` sem erros; teste mínimo dos serviços de login e de status | Média |
| RF-R76 | Ajustar `config/api.ts` e o consumo de `/login` para as rotas novas da API e da monitoring | P5 | Typecheck; busca textual sem rotas antigas | Baixa |

## 9. Requisitos — documentação e repositório (`wiki-local`, `aidlc-docs`, raiz de `sistema/`)

| ID | Requisito | Origem | Critério de aceitação | Prioridade |
|---|---|---|---|---|
| RF-R77 | Criar `sistema/AGENTS.md` e `sistema/CLAUDE.md` com as instruções únicas para agentes de IA | P14; GT-03 | Os dois arquivos existem e apontam para os guias; inspeção | Baixa |
| RF-R78 | Atualizar `RELATORIO_BUGS.md`, marcando cada bug e pendência corrigidos com o commit e mantendo os que ficaram | Todos os bugs e P | Cada item tem situação atualizada; inspeção | Média |
| RF-R79 | Atualizar `wiki-local/` com as mudanças de autenticação, contratos e telas, sem tocar a Wiki de origem | Escopo | Mudanças só em `wiki-local/`; nenhum arquivo da Wiki de origem alterado | Média |
| RF-R80 | Atualizar os artefatos de `aidlc-docs` defasados dos subsistemas que mudaram (Reverse Engineering) | AI-DLC | Datas, commit e estado atualizados nos artefatos tocados; inspeção | Baixa |
| RF-R81 | Registrar no plano manual os testes que dependem de aparelho (biometria, login social, "Voltar" no Android e iOS, tema "Sistema") | P19; RN-21, RN-22, UI-09 | Lista com aparelho, versão e resultado esperado, no relatório da unidade | Média |
| RF-R82 | Atualizar os `.env.example` dos quatro subsistemas, o `docker-compose.yml` e o `ecosystem.config.js` para as variáveis novas | EX-13 | Toda variável nova listada; inspeção | Média |
| RF-R83 | Adicionar `LICENSE` na raiz e o catálogo de softwares e licenças (`documentos/consolidado/softwares_e_licencas.md`) com as dependências novas (Better Auth, helmet, express-rate-limit, expo-secure-store, expo-local-authentication, provedor social) | S09, S10; GT-06 | Arquivos existem; toda dependência adicionada nesta unidade consta com licença e versão do lockfile | Baixa |
| RF-R84 | Registrar no relatório da unidade o resultado de `npm test`, `npm run lint` e `npm run typecheck` de cada subsistema, com a lista do que não pôde ser verificado | Decisão do usuário | Tabela por subsistema com sucesso, falha ou não executado | Alta |
| RF-R85 | Registrar a pendência histórica P20 (commits antigos na `main`) como só registro, sem ação de código | P20; GT-02 | Linha em `RELATORIO_BUGS.md` marcando "registro histórico, sem ação" | Baixa |

Total: `api` 25 (RF-R01 a R25), `better-meet` 26 (R26 a R51), `monitoring-better-meet` 12 (R52 a R63), gestão servidor 6 (R64 a R69), gestão web 7 (R70 a R76) e documentação e repositório 9 (R77 a R85).

## 10. Dependências entre subsistemas

A tabela mostra o que um subsistema consome de outro e o que isso impõe na ordem.

| Dependência | Quem produz | Quem consome | Efeito na ordem |
|---|---|---|---|
| Rotas do Better Auth em `/api/auth/*` (login, cadastro, recuperação, verificação, social) | `api` RF-R01 a R06 | `better-meet` RF-R26 a R31; painel web RF-R72 | O contrato (nomes de rota e corpo) deve ser fixado antes das telas, a partir da documentação da versão instalada |
| Validação de sessão pelos outros serviços | `api` RF-R07 | `monitoring` RF-R56; gestão servidor RF-R64 e R67 | Sucessivo: a rota de perfil existe primeiro. Até lá, os dois serviços mantêm o `jwt.verify` atual |
| Rota autenticada de relato de erros e checagem | `monitoring` RF-R55 | `better-meet` RF-R33; painel RF-R70 | Sucessivo: monitoring antes do app e do painel; a chave interna só sai dos clientes quando a rota nova existir |
| Migrations do Prisma da `api` (Better Auth, autoria, votação, presença, ata) | `api` | todos os requisitos que alteram `schema.prisma` | Um dono por vez no `schema.prisma`; as migrations seguem em ordem de timestamp |
| Migrations do Prisma da `monitoring` | `monitoring` RF-R59 | nenhum | Independente; banco próprio |
| Regra de autoria | `api` RF-R08 e pergunta 1 | `better-meet` RF-R34 | A API vem antes |
| Janela de check-in | `api` RF-R09 | `better-meet` RF-R35 | A API vem antes; o app só reflete |
| Votação, ata, presença, relatório | `api` RF-R14 a R20 | `better-meet` RF-R36 a R44 | A API vem antes de cada tela |
| Prefixo `/api` e remoção do `POST /login` | `api` RF-R22; `monitoring` RF-R61 | app, painel, servidor da gestão | Só no fim, depois de todos os consumidores usarem a rota nova |
| `.env.example` e `TZ` | `api` RF-R25; RF-R82 | todos | No fim de cada subsistema |

## 11. Paralelo e sucessivo

A divisão evita que dois sub-agentes editem o mesmo arquivo. Os conjuntos de arquivos são por pasta.

### 11.1 Pode ir em paralelo desde o início (arquivos disjuntos)

| Trilha | Escopo | Arquivos que ela possui |
|---|---|---|
| T1 — `api` autenticação e proteção | RF-R01 a R07, R12, R21, R22, R25 | `api/package.json`, `src/server.ts`, `src/config/env.ts`, `src/services/authService.ts`, `src/services/usuarioService.ts` (create, senha, `ensureDefaultAdmin`), `src/schemas/authSchema.ts`, `prisma/schema.prisma` e a 1ª migration |
| T2 — `monitoring-better-meet` | RF-R52 a R54, R57 a R60, R62, R63 (R55 e R56 depois) | só `monitoring-better-meet/` |
| T3 — gestão servidor | RF-R65, R66, R68, R69 (R64 e R67 depois) | só `management-better-meet/server/` |
| T4 — painel web | RF-R71, R73 a R75 (R70, R72 e R76 depois) | só `management-better-meet/web/` |
| T5 — app, interface sem dependência de API | RF-R41, R42, R43, R45 a R51 | telas e componentes de `better-meet/src`, sem `apiClient.ts`, `authStore.ts`, `authService.ts` nem `config/api.ts` |
| T6 — documentação | RF-R77, R79 a R81, R83 a R85 | `sistema/AGENTS.md`, `sistema/CLAUDE.md`, `wiki-local/`, `aidlc-docs/` |

### 11.2 Precisa ser sucessivo

1. **`api` domínio depois da T1 no `schema.prisma`:** RF-R08 a R11, R13 a R20, R23 e R24 mexem em `reuniaoService.ts`, `organizacaoService.ts`, `votacaoService.ts`, `ataService.ts` e no `schema.prisma`. As correções sem migration (RF-R09, R10 e R11) podem começar junto da T1, por tocarem outros arquivos. As que exigem migration (RF-R08, R15, R17 e, se houver coluna, R16) esperam a T1 liberar o `schema.prisma`. `usuarioService.ts` é compartilhado entre a T1 (senha e `ensureDefaultAdmin`) e a RF-R08 (exclusão), então os dois ficam com o mesmo sub-agente, em ordem.
2. **`app` autenticação depois do contrato da T1:** RF-R26 a R34 mexem em `apiClient.ts`, `authStore.ts`, `authService.ts`, `config/api.ts`, `login.tsx` e `recuperar-senha.tsx`; ficam com um único sub-agente, depois que a T1 fixar as rotas e, para a RF-R33, depois da RF-R55.
3. **`app` telas de domínio** (RF-R35 a R40 e R44) dependem das rotas da `api` correspondentes.
4. **RF-R55 (monitoring) antes de RF-R33 e RF-R70; RF-R07 antes de RF-R56, R64 e R67.**
5. **Fechamento:** RF-R22, R61, R76, R82, R84 e R78 por último, depois de todos os consumidores.

## 12. Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| Better Auth no Expo SDK 58: a página de integração consultada em 2026-11-20 foi escrita para o SDK 55 (EX-14); `@better-auth/expo` não está instalado em nenhum pacote | RF-R01, R26 e R30 podem exigir ajuste ou não funcionar no SDK 58 | Um sub-agente confere a compatibilidade e as versões no começo da T1; plano B: usar o token do Better Auth por cabeçalho (plugin `bearer`) sem o plugin Expo, e o login social só no web |
| Migração das senhas SHA-256: o hash não converte para scrypt | Contas antigas sem acesso | Conferir o hash antigo no primeiro login e regravar; plano B: exigir a redefinição por e-mail; teste dos dois caminhos (RF-R02) |
| Prazo de 7 dias para 85 requisitos | Itens da lista "se der tempo" ficam de fora | Corte da seção 13; autenticação e bugs primeiro |
| Dois sub-agentes no `schema.prisma` | Conflito de migrations | Um dono do `schema.prisma` por vez (seção 11.2) |
| A validação de sessão dos outros serviços muda ao mesmo tempo que o login | Monitoring e gestão deixam de autenticar | Manter o `jwt.verify` até a RF-R07 estar testada e trocar os dois serviços na mesma etapa |
| E-mails de verificação e de recuperação dependem do Gmail (`GMAIL_USER`, `GMAIL_APP_PASSWORD`) | Sem e-mail configurado, RF-R03 e R04 não são vistas em operação | Testes com `emailService` simulado; o envio real fica no plano manual |
| Limite de tentativas do Better Auth desligado em desenvolvimento por padrão | O teste do 429 não reproduz | Ligar o limite por configuração no teste |
| Sem `expo export`, sem servidor e sem aparelho nesta unidade | Biometria, login social e "Voltar" não são provados | Testes com módulos simulados e plano manual (RF-R81) |
| Monitoring e gestão sem testes | Regressão ao refatorar | RF-R58, R65 e R75 criam a base antes dos demais itens da trilha |

## 13. Priorização e corte

A divisão abaixo é a proposta. Se o prazo não couber, corta-se na ordem da lista "se der tempo", do item 1 em diante; o "obrigatório" não se corta.

### 13.1 Obrigatório

- **Bugs 1 a 11:** RF-R08 a R12 (bugs 1, 5, 6, 8, 10), RF-R03 e R27 (bug 2), RF-R64 (bug 3), RF-R33, R55, R70 (bug 4), RF-R32 (bug 7), RF-R05 e R29 (bug 9), RF-R35 (parte de app do bug 5) e RF-R71 (bug 11).
- **Better Auth essencial:** RF-R01, R02, R04, R07, R26, R28, R56 e R67 (scrypt, e-mail confirmado, sessão nos outros serviços).
- **Proteção da API (EX-19):** RF-R21, R60 e R66.
- **Pendências de padrão:** P1 a P14 e P22 (RF-R52 a R54, R57, R59, R68, R72 a R74, R77, R47, R48 e R46); RF-R22, R61 e R76 só se os consumidores permitirem; testes e scripts mínimos (RF-R58, R65, R75).
- **Retornos funcionais que corrigem erro de regra:** RF-R40 (F36), RF-R41 (F35), RF-R16 e R39 (F46), RF-R17, R18 e R38 (F47), RF-R43 (F48), RF-R46 (F49).
- **Fechamento da unidade:** RF-R78, R79, R82 e R84.

### 13.2 Se der tempo (em ordem de corte, do primeiro a sair)

1. RF-R31 (biometria) e a parte de biometria da RF-R36.
2. RF-R30 e RF-R06 (login social).
3. RF-R45 (manual no app), RF-R44 e RF-R19 (relatório das reuniões do usuário).
4. RF-R14, R15, R36 e R37 (convites e presença completos) e RF-R20 (reunião com convidado).
5. RF-R42 (criação de reunião em etapas) e RF-R13 (EX-18 para organização e comissão).
6. RF-R49, R50, R51, R24, R63, R69, R80, R81, R83 e R85.

F37 (anexos de reunião) e F40 (tela de lista de presença com PDF) não entraram nos requisitos: a análise dos retornos os trata como funcionalidades novas, e o escopo decidido cita só "retornos funcionais Di2/Di3" sem listá-los. Se o usuário quiser, entram como "se der tempo" depois do item 6.

## 14. Perguntas em aberto

Nenhuma pergunta impede começar. As duas abaixo travam apenas os requisitos indicados, e cada uma tem uma proposta adotada por padrão se não houver resposta.

**Pergunta 1 — Regra de autoria na exclusão de conta (RF-R08, RF-R34).** O relatório diz que falta decidir o que acontece com reuniões e votações criadas por quem exclui a conta.

A) `criadoPorUserId` opcional com `onDelete: SetNull` e exibição "usuário removido" (padrão adotado se não houver resposta)
B) Transferir a autoria ao Administrador da comissão, ou ao sucessor indicado na exclusão
C) Apagar em cascata as reuniões e votações criadas
X) Other (descreva depois da tag [Answer]:)

**Pergunta 2 — Provedor do login social (RF-R06, RF-R30).** A conta do provedor e as credenciais precisam ser criadas por quem tem acesso a ele.

A) Google, gratuito, com `clientId` e `clientSecret` do projeto da equipe (padrão adotado)
B) Sem login social nesta entrega, passando RF-R06 e R30 para fora do escopo
X) Other (descreva depois da tag [Answer]:)
