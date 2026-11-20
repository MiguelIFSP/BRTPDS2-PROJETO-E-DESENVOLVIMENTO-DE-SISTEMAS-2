- **Incremento:** Apresentação final (AF)
- **Escopo:** conferência, no código, dos avisos de "Divergência atual" dos guias e dos fatos ligados aos retornos do professor.
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** 704478f15192f757223c1efce99f43a7a411888c
- **Data de revisão:** 2026-11-20
- **Responsável(eis):** [nome de quem revisa e assina]
- **Estado:** Concluído para os itens listados; os demais estão marcados como "Não verificado".
- **Fontes:** arquivos citados em cada linha; [RELATORIO_BUGS.md](../../../../../RELATORIO_BUGS.md) (revisão de 2026-11-17).

# Verificação no código — revisão dos padrões

## Como foi feito

A verificação usou leitura de arquivos e busca textual no commit acima. Ela não executou testes, typecheck, lint, `expo-doctor`, servidores nem consultas ao banco, e não abriu o app em aparelho. Uma busca textual pode deixar de encontrar uma ocorrência escrita de outra forma; por isso, "Resolvida" significa "nenhuma ocorrência encontrada pela busca descrita".

## 1. Avisos de "Divergência atual" no GUIA_DE_CODIFICACAO.md

A tabela confere cada aviso do guia com o código atual. A coluna "Conclusão" orienta a proposta P-C17 da análise.

| Regra | Aviso no guia | Situação no código | Evidência | Conclusão |
|---|---|---|---|---|
| TS-01 | `monitoring-better-meet` com `exactOptionalPropertyTypes: false` | Continua `false` | `monitoring-better-meet/tsconfig.json:25` | Ainda vale |
| NM-01 | Verbos em português no `comissaoService` do app; tipos `Organization*` | Service usa `getReport`, `listByOrganizacao`, `create`, `addMember`; nenhum tipo `Organization` | `better-meet/src/services/comissaoService.ts:85-144` | Resolvida |
| NM-04 | Hooks em kebab-case; arquivos com ponto na monitoring e na gestão; `api/src/middlewares/auth.ts` | Hooks em camelCase; API com `authMiddleware.ts`; monitoring ainda com `status.routes.ts`, `status.controller.ts`, `apiKey.ts`, `jwtAuth.ts` | `better-meet/src/hooks/`; `api/src/middlewares/`; `monitoring-better-meet/src/` | Parcial (monitoring; gestão não conferida) |
| NM-05 | `themed-text.tsx` e outros em kebab-case | Nenhum desses arquivos existe | `better-meet/src/components/` | Resolvida |
| NM-06 | `forgot-password.tsx` e `explore.tsx` | Existe `recuperar-senha.tsx`; `explore.tsx` não existe | `better-meet/src/app/` | Resolvida |
| EX-01 | Controllers com Prisma; login no `server.ts` | Nenhum controller da API usa `prisma.`; login em `authRoutes.ts` | `api/src/controllers/`; `api/src/routes/authRoutes.ts` | Resolvida |
| EX-02 | Funções soltas e `req`/`res` na monitoring e na gestão | Monitoring exporta `createStatusCheck` solto e usa `res` | `monitoring-better-meet/src/controllers/status.controller.ts` | Ainda vale (monitoring; gestão não conferida) |
| EX-03 | `OrganizacaoError` e `ComissaoError` | Nenhuma ocorrência | `api/src`, `better-meet/src` | Resolvida |
| EX-06 | Monitoring devolve `(error as Error).message` no 500 | Continua | `status.controller.ts:22` e `:30` | Ainda vale |
| EX-08 | `PATCH /usuarios/:id/senha` sem `requireSelf` | A rota declara `requireAuth, requireSelf` | `api/src/routes/usuarioRoutes.ts:37-42` | Resolvida |
| EX-12 | `POST /login` fora de `/api`; monitoring sob `/monitoring-better-meet` | Os dois continuam | `api/src/server.ts:71`; `monitoring-better-meet/src/server.ts:18` | Ainda vale (exceções documentadas) |
| EX-13 | `process.env` espalhado; chave da monitoring em `EXPO_PUBLIC_*` | Nenhum `process.env` fora de `config/env.ts` na API; a chave pública continua (bug 4 do relatório) | `api/src`; `RELATORIO_BUGS.md` item 4 | Parcial |
| EX-14 | SHA-256 sem sal; recuperação só com e-mail e nova senha; sem Better Auth | Os três continuam | `api/src/utils/passwordHash.ts:7`; `api/src/services/authService.ts:34`; `api/package.json` sem `better-auth` | Ainda vale |
| EX-17 | Login aceita nome ou e-mail | Continua | `api/src/services/authService.ts:15` | Ainda vale |
| EX-18 | `deleteUser` exclui o último `ADMIN` | Existe a checagem de outro `ADMIN` e a mensagem de único administrador | `api/src/services/usuarioService.ts:253`, `:270`, `:460` | Resolvida |
| PR-06 | `Organizacao.status` e `User.themePreference` como `String` | `StatusOrganizacao` e `Tema?` | `api/prisma/schema.prisma:89`, `:114` | Resolvida |
| PR-07 | Script `prisma:push`; monitoring sem migrations | API sem `prisma:push`; monitoring com `prisma:push` e sem pasta `migrations` | `monitoring-better-meet/package.json` | Parcial |
| RN-01 | `AGENTS.md` do `web` cita a v57 | Continua (1 ocorrência) | `management-better-meet/web/AGENTS.md` | Ainda vale |
| RN-03 | `ThemedText` e outros com export named | Os arquivos não existem mais | `better-meet/src/components/` | Resolvida |
| RN-04 | `fetch` no login do `web` | Continua | `management-better-meet/web/src/app/login.tsx` | Ainda vale |
| RN-07 | Opacidade `0.7` escrita à mão em 5 arquivos | 1 arquivo, diferente dos citados | `better-meet/src/components/presenca/ListaPresencaEditor.tsx` | Parcial |
| RN-11 | `SuccessDialog` a substituir | Nenhuma ocorrência | `better-meet/src` | Resolvida |
| RN-12 | 18 arquivos com `../` | Nenhum | `better-meet/src` | Resolvida |
| RN-14 | Sobras do template no `better-meet` | `explore.tsx`, `app-tabs.tsx`, `use-color-scheme.ts` e `reset-project.js` não existem | `better-meet/` | Resolvida |
| ZS-04 | Telas desestruturam o store inteiro | Nenhuma ocorrência de `= useAuthStore();` ou `= useThemeStore();` | `better-meet/src` | Resolvida |
| UI-01 | 12 arquivos com `useColorScheme` do React Native | Nenhum | `better-meet/src` | Resolvida |
| UI-02 | Cerca de 95 cores em hex nas telas | Nenhum `.tsx` com literal hex fora do tema | `better-meet/src` | Resolvida |
| UI-03 | `Spacing` na escala antiga; sem `Radius` | `Spacing` com `xxl` e `xxxl`; `Radius` existe | `better-meet/src/constants/theme.ts:151-162` | Resolvida |
| UI-08 | Perfil mostra "ID do usuário" | Continua | `better-meet/src/app/(tabs)/mais/perfil.tsx:216` | Ainda vale |
| GT-03 | `sistema/AGENTS.md` e `sistema/CLAUDE.md` não existem | Continuam sem existir | `sistema/` | Ainda vale |
| EX-16, YP-03 (cópias), YP-04, UI-01 item 3, GT-02 | Diversos | Não conferidos nesta verificação | — | Não verificado |

Resumo da verificação inicial: 16 resolvidas, 4 parciais, 10 ainda valem e 5 não verificadas.

### Acréscimo durante a Code Generation (passo 19)

Ao retirar os avisos do guia, três avisos que não estavam na tabela acima foram encontrados e tratados.

| Regra | Aviso no guia | Situação no código | Evidência | Conclusão |
|---|---|---|---|---|
| EX-11 | `parseOrganizationId`/`parseUserId` no service, `Number()` sem validação e `!subSystemId` na monitoring | Nenhuma ocorrência na API; monitoring usa `Number(req.params.subSystemId)` e `!subSystemId` | `monitoring-better-meet/src/controllers/status.controller.ts:71-75` | Parcial |
| RN-05 | `authHeaders`, `readError` e `parseJson` copiados nos services do app | Nenhuma ocorrência | `better-meet/src/services` | Resolvida |
| GT-04 e RN-14 (web) | Subsistemas sem testes; sobras do template no painel web | Não conferidos | — | Não verificado |

Resumo final: 17 resolvidas, 5 parciais, 10 ainda valem e 7 não verificadas. As 22 pendências (parciais, ainda válidas e não verificadas) estão no `RELATORIO_BUGS.md`, itens P1 a P22.

Observação (NM-08): `api/src/routes/usuarioRoutes.ts:8` tem o comentário de histórico "agora protegido por requireAuth". Pela regra, ele não foi alterado; só o autor pode removê-lo.

## 2. Fatos ligados aos retornos do professor

| Retorno | O que foi conferido | Evidência | Situação |
|---|---|---|---|
| F01 — ícone, nome e splash | `name` "Better Meet", ícone e splash próprios, fundo do ícone adaptativo `#BFEFE9`, splash claro e escuro, favicon | `better-meet/app.json:3-32` | Atende a RN-18 |
| F02 — biblioteca de ícones | Nenhum import de `@expo/vector-icons`; `@react-native-vector-icons/ionicons` ^13.1.5 | `better-meet/src`; `better-meet/package.json:10` | Atende a RN-17 |
| F03 — API mais protegida | `cors({ origin: true })`; sem `helmet` e sem limite de tentativas | `api/src/server.ts:49-50`; `api/package.json` | Sem regra no guia |
| F05 — cadastro de e-mail | Nenhuma verificação de posse do e-mail no schema ou no código | `api/prisma/schema.prisma`; `api/src` | Sem regra no guia |
| F06 — nome como login | Login aceita nome | `api/src/services/authService.ts:15` | Regra existe (EX-17); código diverge |
| F08 — recuperação de senha | Troca a senha só com e-mail e nova senha | `api/src/services/authService.ts:34` | Regra existe (EX-14); código diverge |
| F09 — ocultar ID | Perfil mostra o id | `perfil.tsx:216` | Regra existe (UI-08); código diverge |
| F13 — sistema sem administrador | Checagem do último `ADMIN` existe | `usuarioService.ts:253-270` | Atende a EX-18 na plataforma |
| F29 — sessão | `apiRequest` não trata 401 com logout (bug 7 do relatório) | `better-meet/src/utils/apiClient.ts` | Sem regra no guia |
| F33 — tela grande | O formulário de criação de reunião fica na mesma tela da lista, com campos até perto da linha 924 | `better-meet/src/app/(tabs)/(reunioes)/index.tsx` | Sem regra no guia |
| F35 — erros dos campos | Existe `clearFieldError` nessa tela; o `TextField` não limpa o erro sozinho | `(reunioes)/index.tsx:243`; `components/ui/TextField.tsx` | Sem regra no guia |
| F36, F39 — datas e janelas de horário | `StatusReuniao` tem só `AGENDADA` e `REALIZADA`; check-in sem janela (bugs 5 e 6 do relatório) | `api/prisma/schema.prisma:41-43`; `RELATORIO_BUGS.md` | Sem regra no guia |
| F41 — Expo desatualizado | `expo` ~58.0.25, `expo-router` ~58.0.31; patch mais recente não conferido (sem `expo install --check`) | `better-meet/package.json:18-24` | Sem regra de verificação antes da entrega |
| F48 — "Voltar" dos relatórios | Atalhos "Ver comissões" e "Ver organizações" localizados; o destino da navegação não foi analisado | `components/relatorio/ComissaoReportView.tsx:90`; `OrganizacaoReportView.tsx:75` | Sem regra no guia |
| F49 — "Site" e manual | Texto "o site funciona?" no diálogo de primeiro acesso; aba Mais sem tela de ajuda; manual em PDF | `components/PrimeiroAcessoDialog.tsx:109`; `app/(tabs)/mais/` | Sem regra no guia |
| F51 a F54 — documentação da Di3 | `votacoes.md` tem um RF17 para seis ações e fichas UC21 a UC25 à parte; "O mesmo" em células; "Se passar, chama"; FK em notação `Tabela.coluna → Tabela.id`; quatro diagramas de classes | `documentos/entrega4_Di3/votacoes.md:16-322`, `:100`, `:148`; `historico_reunioes.md:151-153`; `testes_votacoes.md:21`; `dados_ata_reuniao.md:72-75`; `Diagramas/DC-*.puml` | Formatos ensinados pelo modelo atual do guia (ver análise, seção 5) |
