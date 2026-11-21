- **Incremento:** Apresentação final (AF) — refatoração de código
- **Escopo:** plano de alteração (Code Generation, parte 1) da unidade U9 fechamento (raiz, configurações, relatórios)
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** aed2702 (base; alterações das unidades anteriores ainda sem commit)
- **Data de revisão:** 2026-11-21
- **Responsável(eis):** [nome de quem revisa e aprova]
- **Estado:** Parte 2 executada (passos 1 a 11); S1 a S4 não executados. Ver [code-summary](../u9-fechamento/code/code-summary.md)
- **Fontes:** [unit-of-work.md](../../inception/application-design/refatoracao-ultima-entrega/unit-of-work.md); [unit-of-work-dependency.md](../../inception/application-design/refatoracao-ultima-entrega/unit-of-work-dependency.md); [unit-of-work-story-map.md](../../inception/application-design/refatoracao-ultima-entrega/unit-of-work-story-map.md); [requirements.md](../../inception/requirements/refatoracao-ultima-entrega/requirements.md) (RF-R22, R25, R61, R76, R78, R82 a R85); code-summary de [U1](../u1-api-auth-protecao/code/code-summary.md), [U2](../u2-monitoring/code/code-summary.md), [U3](../u3-gestao-server/code/code-summary.md), [U4](../u4-gestao-web/code/code-summary.md), [U5](../u5-app-telas/code/code-summary.md); [plano da U8](u8-app-auth-integracao-code-generation-plan.md); AGENTS.md (regras 29, 30, 31, 100)

# Plano de alteração — U9 fechamento

Fonte única da parte 2 da U9. Só documentos foram escritos. Regras gerais: sem git de escrita (os commits são do usuário), sem `npm run dev`/`start`, sem `expo export` nem build; docker liberado; comentários só explicam o porquê; textos em pt-BR. Esta unidade roda **por último** (onda 3): cada passo tem um portão (grep ou teste) que diz se o item pode ser feito; o que não puder vira exceção registrada no relatório final, não é forçado.

## 1. Contexto

### 1.1 Requisitos atribuídos (9)

| RF-R | Resumo | Corte |
|---|---|---|
| R22 | Remover a ponte `POST /login` (e `/api/login`) | OC |
| R25 | `.env.example` e `TZ` da `api` | O* |
| R61 | Rotas da monitoring para `/api` | OC |
| R76 | `config/api.ts` do painel e consumo de `/login` | OC |
| R78 | `RELATORIO_BUGS.md` | O |
| R82 | `.env.example` dos demais pacotes, `docker-compose.yml`, `ecosystem.config.js` | O |
| R83 | `LICENSE` e catálogo de softwares | S6 |
| R84 | Tabela de resultados de `npm test`, `lint`, `typecheck` | O |
| R85 | Registro de P20 | S6 |

### 1.2 Arquivos donos

Raiz de `sistema/`: `docker-compose.yml`, `ecosystem.config.js`, `start-all.ps1` (desvio: não está na lista do unit-of-work, mas preenche `EXPO_PUBLIC_MONITORING_API_KEY` e roda `npm run build`; ver passo 4); os cinco `.env.example` (`api`, `monitoring-better-meet`, `management-better-meet/server`, `management-better-meet/web`, `better-meet`); `api/src/server.ts` (e, por extensão do RF-R22, os arquivos da ponte listados no passo 7); `monitoring-better-meet/src/app.ts`, `src/routes/**`, `docs/openapi.yaml`, `tests/*` e `contexto-api-monitoramento.md` só no que tem o prefixo; `management-better-meet/web/src/config/api.ts`; consumidores do prefixo (`better-meet/src/config/api.ts` e `services/monitoringService.ts`, `api/src/services/monitoringService.ts`, `management-better-meet/server/src/services/monitoringReporterService.ts`); `documentos/consolidado/softwares_e_licencas.md` (novo; a pasta `documentos/consolidado/` ainda não existe); `RELATORIO_BUGS.md` (raiz do repositório); `aidlc-docs/construction/refatoracao-ultima-entrega/relatorio-final.md`; relatório em `aidlc-docs/construction/u9-fechamento/code/code-summary.md`. **`LICENSE` não é criado** (ver 1.4). `aidlc-state.md` e `audit.md` são do orquestrador.

### 1.3 Estado real herdado das unidades

| Unidade | Estado | Efeito na U9 |
|---|---|---|
| U1 | Concluída; ponte `POST /login` ainda existe (JWT por `JWT_SECRET`, 5/min); `JWT_SECRET` obrigatória; `.env` local ganhou `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CORS_ORIGINS` | Variáveis do passo 2 |
| U2 | Fase 1 concluída (passos 1 a 14); fase 2 (RF-R56 e R62, passos 15 a 20) **não iniciada**: monitoring ainda valida JWT, `JWT_SECRET` e `better-auth` ainda lá | Portão do passo 7 e do passo 5 |
| U3 | Fase 1 concluída; fase 2 (RF-R64 e R67) **não iniciada**; `JWT_SECRET` opcional ainda lida | Portão do passo 7 |
| U4 | Fase 1 concluída; fase 2 (RF-R70 e R72) **não iniciada**; `MONITORING_API_KEY` ainda em `config/api.ts`, `monitoringService.ts` e `jest.setup.ts`; `login.tsx` inalterado (usa `/login`) | Portões dos passos 6 e 7 |
| U5 | Fase 1 concluída; fase 2 não iniciada | Sem efeito nos arquivos da U9 |
| U7 | Sem code-summary disponível ao escrever este plano | Ler `src/config/env.ts` da `api` e o resumo no passo 1 |
| U8 | Plano escrito, não executado | Portões dos passos 5 e 6 (chave da monitoring no app) |

### 1.4 Decisão sobre `LICENSE`

O usuário **ainda não escolheu a licença** (S09, GT-06, RF-R83). A U9 **não cria `LICENSE`**, não sugere texto padrão e não escolhe por conta própria. O catálogo de softwares e licenças das **dependências** é feito normalmente (passo 9); a linha "licença do projeto" nele fica `[PENDENTE — escolha do usuário]`. A pendência é registrada no relatório final.

## 2. Passos

- [x] **Passo 1 — Portões e inventário (somente leitura).** Preencher a tabela de portões no `code-summary`, com a saída de cada busca:
  (a) U2 fase 2: `Grep jsonwebtoken|JWT_SECRET|better-auth` em `monitoring-better-meet/src`, `package.json` e `.env.example` → vazio abre a remoção;
  (b) U3 fase 2: idem em `management-better-meet/server/src` e `package.json`;
  (c) U4 fase 2: `Grep "/login|MONITORING_API_KEY|x-api-key"` em `management-better-meet/web/src` e `jest.setup.ts` → vazio abre R76;
  (d) U8: `Grep "MONITORING_API_KEY|x-api-key|identifier|/login"` em `better-meet/src` → vazio abre a remoção da chave do `.env.example` do app;
  (e) `Grep "/monitoring-better-meet"` em todos os pacotes (fora de `node_modules`) para listar os consumidores do prefixo;
  (f) ler o `src/config/env.ts` de cada pacote e o code-summary de U7 (se existir): lista de variáveis lidas é a fonte do passo 2.
  Critério: tabela de portões (aberto/fechado) por item. Passos 5, 6 e 7 só rodam com o portão aberto.

- [x] **Passo 2 — `.env.example` dos cinco pacotes (RF-R25, RF-R82; C5).** Regra: toda variável lida em `src/config/env.ts` (ou `config/api.ts` no app) tem linha, valor fictício e comentário em pt-BR; nenhuma variável fora do `env.ts`; nenhum segredo real. Conferência por varredura: para cada pacote, comparar os nomes de `env.ts` com as chaves do `.env.example` (Grep e leitura; resultado na tabela do `code-summary`).
  - `sistema/api/.env.example`: acrescentar `BETTER_AUTH_SECRET` (mínimo 32 caracteres; `openssl rand -base64 32`), `BETTER_AUTH_URL` (sem barra final e sem `/api`; alcançável pelo celular), `CORS_ORIGINS` (vírgulas, sem barra final; vazia = nenhuma origem de navegador; incluir a origem do painel web), `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` (ambas ou nenhuma; comentário "login social, opcional"), `TRUST_PROXY` (saltos de proxy, inteiro), `RATE_LIMIT_ENABLED` (`true` liga o limite em desenvolvimento), `NODE_ENV`, `TZ_REUNIOES` (padrão `America/Sao_Paulo`, lida em `env.ts`) e `TZ`. `JWT_SECRET` fica até o passo 7 e some junto com a ponte.
  - `sistema/monitoring-better-meet/.env.example`: acrescentar `CORS_ORIGINS`, `TRUST_PROXY`, `RATE_LIMIT_ENABLED`, `NODE_ENV`, `TZ`; `DATA_API_URL` marcada obrigatória (sem barra final e sem `/api`); corrigir o comentário de `INTERNAL_API_KEY` ("IDÊNTICO ao `EXPO_PUBLIC_MONITORING_API_KEY`" some: a chave é só entre servidores); **remover** `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` e o texto sobre `prisma db push` e "Refinamento futuro" (RF-R62 e RF-R59); anotar o uso de `npm run prisma:deploy`; `JWT_SECRET` some com o passo 7.
  - `sistema/management-better-meet/server/.env.example`: acrescentar `DATA_API_URL` (obrigatória depois da U3 fase 2), `CORS_ORIGINS` (incluir `http://localhost:8081` para `expo start --web`), `TRUST_PROXY`, `RATE_LIMIT_ENABLED`, `NODE_ENV`, `TZ`; manter `PORT`, `MONITORING_API_URL`, `INTERNAL_API_KEY`; `JWT_SECRET` some com o passo 7.
  - `sistema/management-better-meet/web/.env.example`: ler `config/api.ts`; remover `EXPO_PUBLIC_MONITORING_API_KEY` (só com o portão (c) aberto); só URLs públicas.
  - `sistema/better-meet/.env.example`: remover `EXPO_PUBLIC_MONITORING_API_KEY` e o texto da exceção (só com o portão (d) aberto; senão manter e registrar a exceção); `EXPO_PUBLIC_MONITORING_API_URL` termina em `/api` depois do passo 5; as demais URLs permanecem. Conferir que nenhuma variável `EXPO_PUBLIC_*` é segredo (regra 30).
  Teste: nenhum (documento). Verificação: tabela de varredura variável-por-variável por pacote, sem sobra nem falta.

- [x] **Passo 3 — `ecosystem.config.js` (RF-R82; C5).** Em `monitoring` e `management`: `script: 'src/server.ts'`, `node_args: '--experimental-strip-types'` (como já está a `api`; sem `dist/server.js` nem `npm run build`; exige Node 24.9 ou superior, ver `engines` dos pacotes). Definir `env: { TZ: 'America/Sao_Paulo' }` (ou `TZ` de variável de ambiente, com esse valor padrão) nos três processos; manter os nomes `api`, `monitoring` e `management` (a gestão controla o PM2 por esses nomes). Atualizar o comentário do cabeçalho (remove a menção a `npm run build` e `ts-node-dev`; fica só o porquê do PM2). O arquivo continua CommonJS (exceção da regra 9). Teste manual de sintaxe somente por leitura; `node -e "require('./ecosystem.config.js')"` não sobe nada e pode ser usado (sem iniciar processos).

- [x] **Passo 4 — `docker-compose.yml` e `start-all.ps1` (RF-R82).** `docker-compose.yml`: o arquivo só tem os dois bancos MySQL (`db_better_meet`, `db_monitoring`); acrescentar `TZ: America/Sao_Paulo` em `environment` dos dois e comentário curto explicando o porquê (datas de reunião e `TZ_REUNIOES`). Não inventar serviços de API no compose. `start-all.ps1` (desvio de dono, registrar): remover a leitura e a escrita de `EXPO_PUBLIC_MONITORING_API_KEY` (linhas em torno de 72, 345 e 349) e a chamada de `npm run build` da `monitoring` e da gestão (linhas em torno de 375 a 384), só se os portões do passo 1 estiverem abertos; senão registrar como pendência. Conferir também `start-db.ps1`, `start-db.sh` e o `package.json` da raiz de `sistema/` (script `start:all`) por menções a `dist/`, `build` e à chave; ajustar só o necessário.

- [x] **Passo 5 — Rotas da monitoring para `/api` (RF-R61). Portão: passo 1 (e) lista todos os consumidores e os de fora (app, painel, `api`, gestão) já estão prontos para trocar na mesma etapa.** Trocar de uma vez, no mesmo conjunto de edições:
  1. `monitoring-better-meet/src/app.ts`: `export const API_PREFIX = '/api';` (única ocorrência em `src/`; `/health` fica fora do prefixo se já estiver). Remover o comentário de exceção.
  2. `monitoring-better-meet/tests/*.test.mjs`: constantes `base` e `API_PREFIX`; o `openapi.test.mjs` importa a constante, conferir que as chaves de `paths` batem.
  3. `monitoring-better-meet/docs/openapi.yaml`: chaves de `paths` (`/api/status...`) e a nota da descrição; `contexto-api-monitoramento.md`.
  4. Consumidores: `management-better-meet/server/src/services/monitoringReporterService.ts` (`MONITORING_PREFIX`), `api/src/services/monitoringService.ts`, `management-better-meet/web/src/config/api.ts` (RF-R76) e serviços do painel, `better-meet/src/config/api.ts`/`monitoringService.ts` (o app usa só o `.env`, então a troca é do valor de `EXPO_PUBLIC_MONITORING_API_URL`, já feita no passo 2).
  5. `.env.example` e comentários que citam `/monitoring-better-meet`.
  Testes: `npm test` da monitoring (chamada com e sem o prefixo antigo: o antigo deve dar 404 em JSON), `npm test` dos consumidores que simulam a URL (app, painel, gestão, api). Busca final: `/monitoring-better-meet` sem sobras em código, testes, OpenAPI e `.env.example`. **Se algum consumidor ainda não migrou, não executar o passo: registrar a exceção** (nota explícita no `openapi.yaml`, como permite o critério do RF-R61) e manter `API_PREFIX` como está.

- [x] **Passo 6 — Painel web (RF-R76). Portão: U4 fase 2 concluída.** `management-better-meet/web/src/config/api.ts`: URLs com os prefixos novos e sem `MONITORING_API_KEY`; consumo de `/login` já trocado pela U4 (`authClient` do Better Auth). Conferir por busca que não sobra `/login` nem `x-api-key` no painel. `npm run typecheck`, `npm run lint`, `npm test` em `management-better-meet/web/`. Fechado o portão: registrar exceção e não editar `config/api.ts` (é da U4 até a fase 2).

- [x] **Passo 7 — Remover a ponte `POST /login` e `JWT_SECRET` (RF-R22). Portão: os quatro consumidores da ponte já não usam `JWT_SECRET` nem `/login` (passo 1 a, b, c e d). Se qualquer um estiver fechado, não remover; registrar a exceção.** Itens (U1 code-summary, seções 3 e 5):
  1. `api/src/server.ts`: remover `app.post('/login')` e `/api/login` e o comentário da exceção temporária.
  2. `api/src/services/authService.ts` (ponte e `jwt.sign`), `api/src/controllers/authController.ts` (handler da ponte) e `api/src/routes/authRoutes.ts` se a rota da ponte estiver ali.
  3. `api/src/middlewares/rateLimitMiddleware.ts` (limite `5/min` de `/login`).
  4. `api/src/config/env.ts`: remover `JWT_SECRET` do schema de ambiente; `api/package.json`: remover `jsonwebtoken` e `@types/jsonwebtoken` (se não houver outro uso: Grep antes) e atualizar o `package-lock.json` com `npm install`.
  5. `api/tests/ponteLogin.test.mjs`: apagar; ajustar `env.test.mjs` e qualquer teste que cite `JWT_SECRET`; `api/tests/rateLimitAuth.test.mjs` (limite da ponte).
  6. `api/docs/openapi.yaml`: tirar menção à ponte, se houver.
  7. `.env.example` e `.env` de exemplo: remover `JWT_SECRET` dos quatro pacotes que a citam; conferir também `start-all.ps1` ("JWT_SECRET compartilhado").
  8. Antes de remover `src/utils/senhaLegada.ts`: **não remover**; ela depende da consulta de saída do code-summary da U1 (`SELECT COUNT(*) FROM Account WHERE password REGEXP '^[a-f0-9]{64}$';` igual a 0), que só o usuário pode confirmar com o banco real. Registrar como pendência.
  Verificação: em `api/`, `npm test`, `npm run lint`, `npm run typecheck`; Grep `JWT_SECRET|jsonwebtoken` em `sistema/` (fora de `node_modules`) sem ocorrência em código ativo.

- [x] **Passo 8 — `documentos/consolidado/softwares_e_licencas.md` (RF-R83, GT-06).** Criar a pasta e o arquivo (cabeçalho padrão do `GUIA_DE_DOCUMENTACAO.md`: ler antes). Conteúdo: uma tabela por subsistema (`api`, `better-meet`, `monitoring-better-meet`, `management-better-meet/server`, `management-better-meet/web`) com: pacote, versão **do lockfile**, licença (lida do `package.json` de cada pacote em `node_modules`), uso, gratuito e sem assinatura (sim/não), situação (nova, removida, existente). Obrigatórios: `better-auth` e `@better-auth/expo` (1.7.27, MIT), `helmet` 8.3.0, `express-rate-limit` 8.7.5, `expo-secure-store`, `expo-local-authentication` e `expo-web-browser` (só se a U8 os instalou), provedor Google (só se ligado; marcar "OAuth gratuito, credencial no `.env`"), ferramentas dev da U2, U3 e U4 (ESLint, Prettier, Jest, Supertest, `jest-expo`, `@testing-library/react-native`, `eslint-config-prettier`, `typescript-eslint`) e as dependências **removidas** (`jsonwebtoken`, `better-auth` da monitoring, `ts-node-dev`, `expo-device`, `expo-image`, `expo-web-browser` do painel, `@expo/ui`, `expo-symbols` do painel, `expo-glass-effect`, `expo-font` do painel). A extração das versões usa Grep/leitura dos `package-lock.json`; nunca copiar versão de memória. Linha final: "Licença do projeto: [PENDENTE — escolha do usuário]". Se alguma licença não for compatível com projeto open-source (copyleft forte), sinalizar. Sem comando; verificação por inspeção.

- [x] **Passo 9 — `RELATORIO_BUGS.md` (RF-R78, RF-R85).** Ler o arquivo inteiro e, para cada item (bugs 1 a 11, pendências de padrão P1 a P22 da seção "Pendências de padrão" e a verificação), atualizar a situação com base nos code-summary reais: **corrigido** (com a unidade e o arquivo), **parcial**, **aberto** ou **fora de escopo** (F37 e F40). Exemplos já determináveis: bug 2 (recuperação de senha) e 9 (login por nome) corrigidos pela U1; 10 (`ensureDefaultAdmin`) pela U1; bug 6 (fuso) só depois do passo 3 e 4 e da U7; bugs 1, 5 e 8 dependem da U7 fase 2; bug 3 depende da U3 fase 2; bug 4 depende dos portões do passo 1 (d) e do passo 4 do `start-all.ps1`; bug 7 depende da U8 (passos 5, 6 e 11); bug 11 corrigido pela U4. **A coluna "commit" fica `[a preencher após o commit]`**: ninguém além do usuário faz commit, então a U9 não inventa hash; registra "alteração no working tree da branch feature/refatoracao-ultima-entrega". P20 (commits antigos na `main`): linha "registro histórico, sem ação" (RF-R85, S6). Itens que ficaram abertos permanecem, com o motivo.

- [x] **Passo 10 — Verificação final nos cinco pacotes (RF-R84).** Rodar, cada um no seu diretório, `npm test`, `npm run lint`, `npm run typecheck`:
  `sistema/api`, `sistema/better-meet`, `sistema/monitoring-better-meet`, `sistema/management-better-meet/server`, `sistema/management-better-meet/web`. Além disso, nos dois apps (`better-meet` e `management-better-meet/web`): `npx expo install --check` e `npx expo-doctor` (regra 49), registrando a saída. Sem `expo export`, sem `npm run dev`. Os testes de integração da `api` exigem o container `mysql_better_meet_dev` de pé (U1 seção 1: sem banco, são pulados com aviso; registrar "pulados" como "não executado" na tabela, nunca como sucesso). Se algum comando falhar por causa da U9, corrigir; se for de outra unidade, registrar a falha sem esconder.

- [x] **Passo 11 — Relatório final (RF-R84) em `aidlc-docs/construction/refatoracao-ultima-entrega/relatorio-final.md` e `u9-fechamento/code/code-summary.md`.** Conteúdo: (1) tabela por subsistema com os três comandos (sucesso, falha ou não executado) e contagem de suítes e testes; (2) tabela dos 85 RF-R com situação (feito, parcial, cortado, exceção), unidade e passo, conferindo com o [story-map](../../inception/application-design/refatoracao-ultima-entrega/unit-of-work-story-map.md); (3) lista do que não pôde ser verificado (telas e gestos em Android e iOS, biometria, login social, "Voltar" entre abas, tema "Sistema", bundle do Metro, `expo export`, servidores nunca subidos); (4) exceções registradas (RF-R22, R61, R76 se os portões ficaram fechados); (5) pendências para o usuário: escolha da licença, rotacionar o segredo do Better Auth que o histórico do git guarda (U2 seção 6), consulta de SHA-256 antes de remover `senhaLegada.ts`, `migrate resolve --applied 0_init` na monitoring de bancos existentes (U2 seção 8), `npm audit` fora do escopo; (6) comentários de histórico alheios encontrados (U1 seção 9: `server.ts`, `usuarioController.ts`, `usuarioRoutes.ts`), sem remover. Handoff: avisar a U6 fase 2 (RF-R79) para atualizar as **exceções temporárias** das regras 29 e 30 do `AGENTS.md` e do guia (prefixo `/api`, `POST /login`, `EXPO_PUBLIC_MONITORING_API_KEY`) conforme o resultado dos passos 5, 6 e 7.

### Se der tempo (separado)

- [ ] **S1 — `LICENSE` (RF-R83 parte 1).** **Só depois de o usuário escolher a licença por escrito.** Então: criar `LICENSE` na raiz do repositório com o texto oficial da licença escolhida, nome do titular informado pelo usuário e ano; atualizar a linha do catálogo e o README. Sem a escolha, não criar, nem sugerir padrão.
- [ ] **S2 — Restringir a chave interna da monitoring (passo S3 da U2).** Com app e painel sem a chave, fazer `POST /status/:subSystem/check` aceitar só token; é edição na monitoring (dona U2) e fica como recomendação.
- [ ] **S3 — Atualizar `README.md` (raiz de `sistema/`) e `README.mdcls`** com o novo `.env`, os prefixos e a inicialização por `node --experimental-strip-types`. Conferir se `README.mdcls` é um arquivo intencional (nome fora do padrão).
- [ ] **S4 — Conferir `Wiki` e `wiki-local/`:** nada a editar na U9; só registrar que a U6 fase 2 cuida.

## 3. Rastreabilidade RF-R → passos

| RF-R | Passos | Verificação |
|---|---|---|
| R22 | 1, 7, 10 | testes e Grep `JWT_SECRET|/login`; exceção se portão fechado |
| R25 | 2, 3, 4 | varredura `.env.example` x `env.ts`; `TZ` em `ecosystem.config.js` e `docker-compose.yml` |
| R61 | 1, 5, 10 | Grep `/monitoring-better-meet`; testes dos consumidores; ou nota no OpenAPI |
| R76 | 1, 5, 6, 10 | typecheck e Grep no painel |
| R78 | 9 | inspeção do `RELATORIO_BUGS.md` |
| R82 | 2, 3, 4 | varredura dos cinco `.env.example`, `ecosystem.config.js`, `docker-compose.yml` |
| R83 | 8, S1 | catálogo existe; `LICENSE` só no S1 e depende do usuário |
| R84 | 10, 11 | tabela no relatório final |
| R85 | 9 | linha de P20 em `RELATORIO_BUGS.md` |

## 4. Riscos

1. **Portões fechados.** Com U2, U3, U4 fase 2 e U8 ainda não executadas, os passos 5 a 7 e a remoção da chave dos `.env.example` não podem rodar; o relatório precisa dizer isso com clareza. A ordem segura é: U2/U3/U4 fase 2 e U8 → U9.
2. **Troca de prefixo é atômica.** Mudar a monitoring sem todos os consumidores derruba status, painel e relato de erro do app; por isso o passo 5 é tudo-ou-nada e tem teste de rota antiga (404).
3. **`start-all.ps1` fora da lista de donos.** Ele escreve a chave no `.env` do app e roda `build`; sem ajuste, quem usa o script recria a chave e quebra o `ecosystem.config.js` novo. Edição registrada como desvio; se o usuário preferir, fica de fora e vira nota.
4. **Remoção de `JWT_SECRET`/ponte** pode quebrar quem ainda aponta para ela (painel antigo); o grep do passo 1 é a defesa.
5. **Remoção de `senhaLegada.ts` não é feita** sem a confirmação da consulta no banco real (usuário).
6. **Segredo no histórico do git** (U2 seção 6): só rotação resolve; a U9 apenas avisa.
7. **`RELATORIO_BUGS.md` sem hash de commit**: depende de o usuário commitar; deixar o campo claro.
8. **Testes de integração da `api` pulados** sem o banco: contar como "não executado".
9. **`LICENSE` ausente:** pode custar nota (S09); o relatório destaca que depende da decisão do usuário.
