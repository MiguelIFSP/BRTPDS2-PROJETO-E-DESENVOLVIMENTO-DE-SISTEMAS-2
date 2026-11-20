- **Incremento:** Apresentação final (AF) — entrega em 2026-11-27, às 18:00
- **Escopo:** plano de alteração (Code Generation, parte 1) da unidade revisao-padroes-entrega-final
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** 704478f15192f757223c1efce99f43a7a411888c
- **Data de revisão:** 2026-11-20
- **Responsável(eis):** [nome de quem revisa e aprova]
- **Estado:** Executado — 28 de 28 passos concluídos em 2026-11-20; aguardando aprovação das alterações
- **Fontes:** [requirements.md](../../inception/requirements/revisao-padroes-entrega-final/requirements.md); [análise](../../inception/requirements/revisao-padroes-entrega-final/analise-retornos-professor.md); [plano de execução](../../inception/plans/revisao-padroes-entrega-final-execution-plan.md); [verificação no código](../revisao-padroes-entrega-final/verificacao_codigo.md); [code-generation.md](../../../.aidlc-rule-details/construction/code-generation.md); documentação consultada em 2026-11-20 (seção 2.2)

# Plano de alteração — revisão dos padrões

Este plano é a fonte única da verdade para a parte 2 da Code Generation. A execução faz só o que está nos passos abaixo, marca cada passo com `[x]` assim que ele termina e altera os arquivos no lugar, sem criar cópias. Se o escopo mudar, o plano é atualizado e volta para aprovação.

## 1. Contexto da unidade

A unidade cobre os requisitos aprovados no `requirements.md`.

- **Requisitos:** RQ-D01 a RQ-D15, RQ-C01 a RQ-C18, RQ-R01 e os requisitos não funcionais RNQ-01 a RNQ-07.
- **Arquivos alterados (no lugar):** `GUIA_DE_DOCUMENTACAO.md`, `PROMPT_DOCUMENTACAO_IA.md`, `RELATORIO_BUGS.md`, `GUIA_DE_CODIFICACAO.md` e `PROMPT_AGENTES_IA.md`, na raiz do repositório.
- **Arquivos de trabalho criados:** só em `sistema/better-meet/aidlc-docs/construction/revisao-padroes-entrega-final/code/`.
- **O que não muda:** nenhum arquivo de `sistema/` fora do `aidlc-docs/` e nenhum arquivo de `documentos/`. Os locais novos que o guia passa a definir (seção 2.3) não são criados nesta unidade; quem os cria é a unidade de documentação.
- **Dependências:** nenhuma outra unidade. A ordem entre os arquivos segue o plano de execução.

## 2. Decisões do plano

### 2.1 Exemplos do RF06 e do RNF06

Os exemplos das seções 4 a 13 do guia de documentação são reescritos no formato novo e reconferidos no commit `704478f`. O exemplo passa a citar esse commit. As fontes conferidas ficam no resumo da alteração.

### 2.2 Autenticação, sessão e biometria

A documentação abaixo foi lida em 2026-11-20 e orienta as regras EX-14, EX-19, EX-21, EX-22, RN-21 e ZS-01. A página de integração do Better Auth com Expo foi escrita para o SDK 55; a compatibilidade com o SDK 58 fica para a unidade de código conferir.

| Fato | Fonte | Uso na regra |
|---|---|---|
| Pacotes `better-auth` e `@better-auth/expo`; plugin `expo()` no servidor e `expoClient` no app; `trustedOrigins` com o esquema do app (`bettermeet://`, do `app.json`) | better-auth.com/docs/integrations/expo | EX-14 e ZS-01 |
| O cliente Expo guarda sessão e cookies no `expo-secure-store` (opção `storage`) | Mesma página | ZS-01: o token deixa de ser persistido no AsyncStorage pelo `authStore` |
| `expo-secure-store` funciona em Android e iOS, e não no web | docs.expo.dev/versions/v58.0.0/sdk/securestore | ZS-01: no web vale o mecanismo do cliente do Better Auth, `[A CONFIRMAR]` na unidade de código |
| Hash padrão `scrypt`, configurável em `emailAndPassword.password` | better-auth.com/docs/authentication/email-password | EX-14 |
| Redefinição com `emailAndPassword.sendResetPassword`; o token é consumido na redefinição; o nome da opção de validade não consta da página | Mesma página | EX-14: validade curta exigida; nome da opção `[A CONFIRMAR]` |
| Verificação com `emailVerification.sendVerificationEmail`, `sendOnSignUp: true` e `emailAndPassword.requireEmailVerification: true` (login bloqueado responde 403) | better-auth.com/docs/concepts/email | EX-21 |
| Verificação do novo e-mail na troca não consta da página | Mesma página | EX-21: `[A CONFIRMAR]` |
| Limite de tentativas embutido (`rateLimit`), ligado em produção e desligado em desenvolvimento; `customRules` por rota; resposta 429 com `X-Retry-After` | better-auth.com/docs/concepts/rate-limit | EX-19: rotas do Better Auth usam o `rateLimit` dele; as demais rotas públicas usam `express-rate-limit` |
| Login social com `socialProviders` (Google, GitHub, Apple e outros) | better-auth.com/docs/concepts/oauth | EX-22 |
| `expo-local-authentication`: `hasHardwareAsync`, `isEnrolledAsync`, `authenticateAsync`; plugin com `faceIDPermission`; Face ID não funciona no Expo Go | docs.expo.dev/versions/v58.0.0/sdk/local-authentication | RN-21: teste em build de desenvolvimento |

### 2.3 Locais definidos pelo guia

O guia passa a definir estes locais. Esta unidade só os descreve.

| Local | Conteúdo | Requisito |
|---|---|---|
| `documentos/consolidado/` | Diagrama de classes oficial (`Diagramas/DC-BetterMeet.puml`), DER oficial (`Diagramas/DER-BetterMeet.puml`), dicionário de classes, dicionário de dados, catálogo de atores com a hierarquia e catálogo de softwares, versões e licenças | RQ-D03, RQ-D06, RQ-D08, RQ-D10, RQ-D13 |
| `documentos/estilo-diagramas.iuml` | Estilo comum, incluído em todo `.puml` com caminho relativo | RQ-D07 |
| `documentos/entrega5_AF/` | Documentos da apresentação final, incluindo apresentação e manual | RQ-D13, RQ-D14 |

O catálogo de softwares e licenças também serve como a tabela central "Tecnologias e versões" (RQ-D10), para não manter duas listas.

### 2.4 Identificadores novos

Nenhum identificador existente é renumerado. Nos guias, a regra nova fica na seção do assunto, como já acontece com a DOC-25. Nos prompts, as regras novas ficam em uma seção nova no fim da lista numerada, para manter a ordem crescente (RQ-C18). Cada seção temática ganha uma linha "Veja também" apontando para elas.

| Arquivo | Identificadores novos |
|---|---|
| `GUIA_DE_DOCUMENTACAO.md` | DOC-26 Redação formal; DOC-27 Dicionário do diagrama de classes; DOC-28 Estilo único dos diagramas; DOC-29 Catálogo de softwares, versões e licenças; DOC-30 Repositório pronto para publicação; DOC-31 Manual de utilização |
| `PROMPT_DOCUMENTACAO_IA.md` | Regras 26 a 31, na mesma ordem |
| `GUIA_DE_CODIFICACAO.md` | EX-19 Proteção da API; EX-20 Ciclo de vida e horários; EX-21 Verificação de e-mail; EX-22 Login social; YP-05 Datas e horários; RN-20 Manual dentro do app; RN-21 Biometria; RN-22 Navegação "Voltar"; UI-09 Convenções de aplicativo móvel; GT-06 Dependências e licenças |
| `PROMPT_AGENTES_IA.md` | Regras 91 a 100, na ordem da linha acima |

Identificadores que mudam de conteúdo, mantendo o número: DOC-17 passa de "uma ficha para cada elipse" para "cada elipse tem o seu RF", que é o mesmo assunto (cobertura das elipses); DOC-23 passa a incluir o plano de testes.

### 2.5 Hierarquia de atores

O guia define a regra, o formato e o local do catálogo de atores com a hierarquia. A hierarquia real, com a evidência no código, é trabalho da unidade de documentação. O exemplo do guia fica marcado `[A CONFIRMAR NO CÓDIGO]`.

### 2.6 RELATORIO_BUGS.md

A seção nova recebe os 14 avisos que ainda valem ou estão parciais (RQ-R01) e também os 5 avisos não verificados, marcados como "Não verificado", para que nenhum aviso retirado do guia se perca. Os itens 1 a 11 existentes não são alterados.

### 2.7 Exceções normativas

As exceções temporárias que o código cita (`POST /login` fora de `/api` no EX-12, `EXPO_PUBLIC_MONITORING_API_KEY` no EX-13 e o ESLint do `web` na RN-19 e na regra 82) continuam nos guias como "Exceção temporária", porque são regra. Elas também entram no `RELATORIO_BUGS.md` como pendência.

### 2.8 Verificação

Os arquivos do Build and Test levam o prefixo `revisao-padroes-entrega-final-` e ficam em `construction/build-and-test/`, sem sobrescrever os de outras unidades.

## 3. Passos

### Preparação

- [x] **Passo 1 — Identificadores de antes.** Extrair do commit `704478f` a lista de identificadores dos dois guias (TS, NM, EX, PR, YP, RN, ZS, UI, GT, DOC) e dos números de regra dos dois prompts, em `code/identificadores-antes.md`, para conferir o RNQ-02.
- [x] **Passo 2 — Reconferir o RF06 e o RNF06 no código** (`704478f`): tela da aba Mais, `useThemePreference`, `themeStore`, `usuarioService` do app e da API, rotas, middlewares, controller, `temaSchema`, `schema.prisma`, migrations e testes do tema; `passwordHash.ts` e chamadas para o RNF06. Registrar as fontes no resumo.

### GUIA_DE_DOCUMENTACAO.md

- [x] **Passo 3 — Seções 1 e 2.** Nova DOC-26 (redação formal, com tabela de substituições e proibição de "O mesmo") na seção 1; DOC-06 com os locais da seção 2.3; nova DOC-28 (estilo único) na seção 2; índice "Seções do guia" atualizado. (RQ-D02, RQ-D07)
- [x] **Passo 4 — Seções 4 e 5.** DOC-10 e DOC-11 com generalização de atores, hierarquia única, catálogo completo e local do catálogo; DOC-12 com "Versão" e "Histórico de revisões"; DOC-13 com o conteúdo mínimo ajustado (RF por caso de uso, dicionário de classes, plano de testes, documentos consolidados). (RQ-D03, RQ-D12, RQ-D01)
- [x] **Passo 5 — Seção 6.** DOC-14 reescrita para o formulário padrão (campos e ordem do slide, detalhe técnico dentro dos campos, desvios na Ação); exemplo do RF06 reescrito em redação formal com os dados do passo 2. (RQ-D01, RQ-D02, RQ-D15)
- [x] **Passo 6 — Seção 7.** DOC-15 com limite de cerca de 10 casos de uso, atualização por incremento, generalização de atores no modelo PlantUML e `!include` do estilo; DOC-17 como "cada elipse tem o seu RF", com a tabela de auditoria elipse → RF; exemplos atualizados. (RQ-D03, RQ-D04, RQ-D01)
- [x] **Passo 7 — Seção 8.** DOC-18 com pelo menos uma sequência por RF, participante `objeto:Classe` existente no diagrama de classes e regra de consistência; exemplo ajustado. (RQ-D09, RQ-D05)
- [x] **Passo 8 — Seção 9.** DOC-19 reescrita (classes da implementação, estereótipos de camada, legenda dos módulos sem instância, diagrama consolidado e recortes, sem models do Prisma); nova DOC-27 (dicionário de classes membro a membro); exemplo novo do diagrama de classes da implementação do RF06 com o dicionário. (RQ-D05, RQ-D06)
- [x] **Passo 9 — Seção 10.** DOC-20 e DOC-21 com a separação das classes, a descrição obrigatória por coluna, as restrições em notação relacional com significado, o DER consolidado e os recortes; exemplos ajustados. (RQ-D08)
- [x] **Passo 10 — Seção 11.** DOC-22 com as categorias da aula 1, metas de tempo justificadas e versões tiradas do catálogo (DOC-29); exemplo do RNF06 reconferido. (RQ-D10)
- [x] **Passo 11 — Seção 12.** DOC-23 com a seção "Plano de testes" antes do registro, os tipos de teste da aula 1 e o registro de aparelho, sistema e build; exemplo ajustado. (RQ-D11)
- [x] **Passo 12 — Seção 13.** DOC-24 com as colunas que saíram do formulário (atores, código, testes e status); exemplo ajustado. (RQ-D01)
- [x] **Passo 13 — Seção nova "Entrega final".** DOC-29 (catálogo de softwares, versões e licenças), DOC-30 (repositório pronto para publicação) e DOC-31 (manual de utilização). (RQ-D13, RQ-D14, RQ-D10)
- [x] **Passo 14 — Seções 14 e 15.** Críticas da Di2, da Di3 e dos slides na seção 14; checklist da seção 15 com as regras novas; tabela do DOC-25 conferida. (RQ-D15)
- [x] **Passo 15 — Conferência do arquivo.** Links relativos, identificadores (contra o passo 1) e termos proibidos pela DOC-26 no próprio guia.

### PROMPT_DOCUMENTACAO_IA.md

- [x] **Passo 16 — Atualizar o prompt.** Regras 6, 7, 9 a 19 conforme o guia; seção nova com as regras 26 a 31; linhas "Veja também" nas seções temáticas; "Entrega" e "Antes de entregar" atualizados; conferência de links e numeração. (RNQ-01)

### RELATORIO_BUGS.md

- [x] **Passo 17 — Seção "Pendências de padrão".** Tabela com os 14 avisos válidos ou parciais e os 5 não verificados: regra, pendência, evidência (arquivo e linha), situação e data da verificação (2026-11-20, commit `704478f`). Os itens 1 a 11 ficam como estão. (RQ-R01)

### GUIA_DE_CODIFICACAO.md

- [x] **Passo 18 — Introdução e seções 1 e 2.** Linha apontando as pendências para o `RELATORIO_BUGS.md`; avisos retirados de TS-01, NM-01, NM-04, NM-05 e NM-06; NM-02 com o vocabulário de aplicativo. (RQ-C17, RQ-C13)
- [x] **Passo 19 — Seção 3.** EX-05 com o 429; EX-14 com o Better Auth obrigatório e as propriedades da seção 2.2; EX-18 ampliado para organização e comissão; avisos retirados de EX-01, EX-02, EX-03, EX-06, EX-08, EX-14, EX-16, EX-17 e EX-18, mantendo as exceções normativas do EX-12 e do EX-13; novas EX-19, EX-20, EX-21 e EX-22. (RQ-C01, RQ-C02, RQ-C03, RQ-C04, RQ-C05, RQ-C06, RQ-C17)
- [x] **Passo 20 — Seções 4 e 5.** PR-05 com os dados que o papel pode ver; avisos retirados de PR-06, PR-07, YP-03 e YP-04; YP-04 com o erro do campo removido ao alterar o campo; nova YP-05. (RQ-C07, RQ-C08, RQ-C09, RQ-C17)
- [x] **Passo 21 — Seção 6.** RN-01 sem o aviso da v57 e com a checagem do SDK antes da entrega; RN-05 com o logout no 401; RN-11 com o erro do campo; RN-19 com a checagem antes da entrega; avisos retirados de RN-03, RN-04, RN-05, RN-07, RN-12 e RN-14; novas RN-20, RN-21 e RN-22. (RQ-C04, RQ-C09, RQ-C11, RQ-C12, RQ-C14, RQ-C15, RQ-C17)
- [x] **Passo 22 — Seção 7.** ZS-01 com a sessão guardada pelo cliente do Better Auth (seção 2.2) e o `authStore` sem token persistido no AsyncStorage; aviso do ZS-04 retirado. (RQ-C02, RQ-C04)
- [x] **Passo 23 — Seção 8.** Avisos e "Ajustes previstos" retirados de UI-01, UI-02, UI-03 e UI-08; tabela de componentes base da UI-04 com os componentes existentes em `src/components/ui/`; nova UI-09. (RQ-C10, RQ-C17)
- [x] **Passo 24 — Seção 9 e checklists.** Avisos retirados de GT-02, GT-03 e GT-04; GT-03 corrigido; nova GT-06; checklists de revisão de todas as seções com as regras novas e ampliadas. (RQ-C16, RQ-C17)
- [x] **Passo 25 — Conferência do arquivo.** Links, identificadores (contra o passo 1) e busca por "Divergência atual" e "Situação atual" sem ocorrências.

### PROMPT_AGENTES_IA.md

- [x] **Passo 26 — Atualizar o prompt.** Regras existentes afetadas (entre elas 11, 22, 30, 31, 35, 40, 48, 49, 53, 59, 66, 74, 79 e 81) conforme o guia, sem avisos de divergência; seção "Git, agentes de IA e testes" (77 a 80) movida para antes de "Atualização de SDK do Expo" (81 e 82); seção nova com as regras 91 a 100; linhas "Veja também" nas seções temáticas; checklist "Antes de entregar" atualizado. (RNQ-01, RQ-C18)
- [x] **Passo 27 — Conferência do arquivo.** Links, numeração crescente sem lacuna nova e correspondência regra a regra com o guia.

### Fechamento

- [x] **Passo 28 — Resumo e estado.** Escrever `code/code-summary.md` (arquivos alterados, requisitos atendidos, fontes conferidas e pontos `[A CONFIRMAR]`); atualizar o `aidlc-state.md`; conferir no `git status` que só os cinco arquivos e o `aidlc-docs/` mudaram.

## 4. Rastreabilidade

A tabela liga cada requisito aos passos que o atendem.

| Requisito | Passos |
|---|---|
| RQ-D01 | 4, 5, 6, 12, 16 |
| RQ-D02 | 3, 5, 15, 16 |
| RQ-D03 | 4, 6, 16 |
| RQ-D04 | 6, 16 |
| RQ-D05 | 7, 8, 16 |
| RQ-D06 | 3, 8, 16 |
| RQ-D07 | 3, 16 |
| RQ-D08 | 3, 9, 16 |
| RQ-D09 | 7, 16 |
| RQ-D10 | 10, 13, 16 |
| RQ-D11 | 11, 16 |
| RQ-D12 | 4, 16 |
| RQ-D13 | 3, 13, 16 |
| RQ-D14 | 13, 16 |
| RQ-D15 | 2, 5 a 14, 16 |
| RQ-C01 | 19, 26 |
| RQ-C02 | 19, 22, 26 |
| RQ-C03 | 19, 26 |
| RQ-C04 | 19, 21, 22, 26 |
| RQ-C05 | 19, 26 |
| RQ-C06 | 19, 26 |
| RQ-C07 | 20, 26 |
| RQ-C08 | 20, 26 |
| RQ-C09 | 20, 21, 26 |
| RQ-C10 | 23, 26 |
| RQ-C11 | 21, 26 |
| RQ-C12 | 21, 26 |
| RQ-C13 | 18, 26 |
| RQ-C14 | 21, 26 |
| RQ-C15 | 21, 26 |
| RQ-C16 | 24, 26 |
| RQ-C17 | 18 a 26 |
| RQ-C18 | 26, 27 |
| RQ-R01 | 17 |
| RNQ-01 | 16, 26, 27 |
| RNQ-02 | 1, 15, 25, 27 |
| RNQ-03 | 15 |
| RNQ-04 | 2, 5 a 12 |
| RNQ-05 | 15, 16, 25, 27 |
| RNQ-06 | Build and Test |
| RNQ-07 | 28 |
