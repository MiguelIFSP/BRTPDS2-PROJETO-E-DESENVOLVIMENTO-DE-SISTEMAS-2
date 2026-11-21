- **Incremento:** Apresentação final (AF) — refatoração de código
- **Escopo:** plano de alteração (Code Generation, parte 1) da unidade U6 documentacao, fase 1 (onda 1) e fase 2 (onda 3)
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** aed2702
- **Data de revisão:** 2026-11-20
- **Responsável(eis):** [nome de quem revisa e aprova]
- **Estado:** Fases 1 e 2 executadas (passos 1 a 11); passo 12 não executado (é da U9)
- **Fontes:** [unit-of-work.md](../../inception/application-design/refatoracao-ultima-entrega/unit-of-work.md); [unit-of-work-dependency.md](../../inception/application-design/refatoracao-ultima-entrega/unit-of-work-dependency.md); [requirements.md](../../inception/requirements/refatoracao-ultima-entrega/requirements.md) (seção 9); GUIA_DE_DOCUMENTACAO.md (DOC-29 a DOC-31, seção 14); GUIA_DE_CODIFICACAO.md (GT-03, GT-06); PROMPT_AGENTES_IA.md; `wiki-local/LEIA-ME.md`

# U6 documentacao — plano de alteração

Este plano é a fonte única da verdade da parte 2. A unidade só escreve documentos. Caminhos relativos à raiz do repositório (`BRTPDS2-...`), salvo indicação. Documentos em pt-BR, com o cabeçalho padrão do GUIA_DE_DOCUMENTACAO.md (seção 5) nos arquivos novos de `aidlc-docs/`.

## 1. Contexto

### 1.1 Requisitos atribuídos (4)

| Fase | Onda | Requisitos | Corte |
|---|---|---|---|
| 1 | 1 | RF-R77 (`sistema/AGENTS.md` e `sistema/CLAUDE.md`) | obrigatório (P14) |
| 1 | 1 | RF-R81 (plano manual de testes em aparelho) | se der tempo (item 6 do corte) |
| 2 | 3 | RF-R79 (`wiki-local/`) | obrigatório |
| 2 | 3 | RF-R80 (artefatos de `aidlc-docs` defasados) | se der tempo (item 6 do corte) |

### 1.2 Arquivos donos

- `sistema/AGENTS.md`, `sistema/CLAUDE.md` (novos).
- `wiki-local/**` na **raiz do repositório** (o unit-of-work cita o caminho sem a raiz; a pasta real é `wiki-local/`, local, listada em `.git/info/exclude`). A Wiki de origem (GitHub) nunca é alterada.
- `aidlc-docs/construction/refatoracao-ultima-entrega/plano-manual.md` (novo, RF-R81).
- `aidlc-docs` dos subsistemas: `sistema/better-meet/aidlc-docs/inception/reverse-engineering/*` e `sistema/management-better-meet/web/aidlc-docs/**`.
- Autorizado pelo orquestrador para esta unidade: criar `LICENSE` e `documentos/consolidado/`. **Conflito:** o unit-of-work atribui RF-R83 (`LICENSE` e catálogo) à U9. Por isso esses itens ficam no passo 12 (se der tempo) e só executam depois de o orquestrador confirmar por escrito que a U9 não os fará.

### 1.3 O que NÃO pode tocar

- `.env.example` (5 pacotes), `RELATORIO_BUGS.md`, `docker-compose.yml`, `ecosystem.config.js` (U9).
- `aidlc-docs/aidlc-state.md`, `aidlc-docs/audit.md` e os artefatos de `refatoracao-ultima-entrega` já existentes, exceto o `plano-manual.md` novo (orquestrador).
- Qualquer código (`src/`, `package.json`, `app.json`, `prisma/`), `GUIA_DE_CODIFICACAO.md`, `GUIA_DE_DOCUMENTACAO.md`, `PROMPT_*` (guias aprovados; só leitura).
- A Wiki de origem: nada fora de `wiki-local/`.
- Proibido: git de escrita, servidores, build. Esta unidade não precisa de `npm`; a verificação é por inspeção e busca. Não se executam `npm test`, `lint` ou `typecheck` (só código os afeta); se o orquestrador pedir, registrar "não aplicável".

## 2. FASE 1 (onda 1) — roda agora

- [x] **Passo 1 — Levantamento.** Ler `PROMPT_AGENTES_IA.md` (435 linhas), `GUIA_DE_CODIFICACAO.md` seção 9.3 (GT-03), `sistema/better-meet/AGENTS.md` e `CLAUDE.md` e os de `management-better-meet/web/`. Confirmar que `sistema/AGENTS.md` e `sistema/CLAUDE.md` não existem (`Glob`).
- [x] **Passo 2 — RF-R77: `sistema/AGENTS.md`.** Criar com o bloco entre as cercas ```` ```markdown ```` de `PROMPT_AGENTES_IA.md` (sem a nota "Como usar" e sem o cabeçalho de cercas), copiado literalmente, mais, no topo, uma linha curta: "Fonte única das instruções para agentes de IA (GT-03). Ao mudar `GUIA_DE_CODIFICACAO.md`, atualize `PROMPT_AGENTES_IA.md` e este arquivo no mesmo PR." Links relativos ajustados para `../GUIA_DE_CODIFICACAO.md`, `../PROMPT_AGENTES_IA.md`, `../RELATORIO_BUGS.md`. Não repetir as regras específicas de `better-meet/AGENTS.md` (Expo SDK 58), só citá-las.
- [x] **Passo 3 — RF-R77: `sistema/CLAUDE.md`.** Criar com uma linha: `@AGENTS.md` (mesmo formato do `better-meet/CLAUDE.md`).
- [x] **Passo 4 — Verificação do RF-R77.** Inspeção: os dois arquivos existem; o `AGENTS.md` aponta para os guias e o `CLAUDE.md` só aponta para o `AGENTS.md`; comparar o corpo com o bloco do prompt (nenhuma regra perdida, `diff` visual); links relativos resolvem.
- [x] **Passo 5 — RF-R81: plano manual.** Criar `sistema/better-meet/aidlc-docs/construction/refatoracao-ultima-entrega/plano-manual.md` com cabeçalho padrão e tabela por caso: ID `PM-nn`, requisito, aparelho (modelo), versão do sistema, forma de execução (Expo Go ou build de desenvolvimento), passos, resultado esperado, resultado obtido (em branco). Casos mínimos (fontes: requirements e U8 functional design):
  1. Biometria: ligar no perfil, desbloqueio ao abrir, cancelamento, indisponível desabilita (RF-R31; RN-21). Android físico e iOS.
  2. Login social Google: botão, retorno por `bettermeet://`, cancelamento do navegador (RF-R30, R06). Android físico e iOS em build de desenvolvimento.
  3. "Voltar" dos atalhos "Ver comissões" e "Ver organizações" do relatório e botão/gesto de voltar do sistema (RF-R43; RN-22). Android e iOS.
  4. Tema "Sistema" muda com o aparelho (RF-R49; P19).
  5. E-mails reais de verificação e recuperação de senha com o Gmail configurado (RF-R03, R04) e abertura do link `bettermeet://redefinir-senha`.
  6. Botão de entrada só na janela da reunião e fuso no Hermes (RF-R35, R40).
  7. Votação secreta sem lista de quem votou (RF-R38).
  Aparelhos concretos ficam `[A CONFIRMAR]` até a equipe informar modelo e versão.
- [x] **Passo 6 — Fechamento da fase 1.** Conferir por `Glob`/busca que só foram criados os três arquivos; escrever `aidlc-docs/construction/u6-documentacao/code/code-summary.md` (fase 1): arquivos, o que foi conferido e o que ficou `[A CONFIRMAR]`.

## 3. FASE 2 (onda 3) — só depois das ondas 1 e 2

Entrada: relatórios de código das unidades U1 a U5, U7 e U8 em `aidlc-docs/construction/*/code/` e os `openapi.yaml` finais. Não rodar antes de o orquestrador liberar a onda 3. A U9 roda em paralelo; não editar os mesmos arquivos (U9 não toca `wiki-local/`).

- [x] **Passo 7 — Levantamento dos contratos finais.** Ler os `code-summary.md` das unidades e `api/docs/openapi.yaml`, `monitoring-better-meet/docs/openapi.yaml`, `management-better-meet/server/docs/openapi.yaml`. Montar lista interna (no `code-summary.md`) do que mudou para quem usa: login só por e-mail, confirmação de e-mail, recuperação por token, login social, biometria (se entregue), regra de autoria `SetNull`, janela de check-in, saída e marcação de presença, convite, ata (exportação após aprovação), votação (tipo, voto nulo, secreta), relatório do usuário, manual no app. Marcar o que foi cortado (não documentar o que não existe: GUIA_DE_DOCUMENTACAO regra principal, documentar o sistema real).
- [x] **Passo 8 — RF-R79: `wiki-local/wiki/`.** Seguir o padrão de `wiki-local/LEIA-ME.md` (páginas locais com `_` no nome; links e imagens absolutos da Wiki em `wiki/`; mesmas páginas em `preview/` com links locais). Só alterar o que mudou:
  1. `RF16.md` a `RF19.md` e `Caso-de-Uso_-*.md` afetados (entrada, saída, voto, votar na ata, exportar ata, criar votação, consultar votações, acessar manual): atualizar pré-condições, ações e mensagens conforme os contratos reais.
  2. Autenticação: criar página local nova (ex.: `Caso-de-Uso_-Autenticar-no-sistema.md`) e `RF20.md` apenas se a numeração e o modelo do guia permitirem; senão, registrar a lacuna em `Requisitos-a-acrescentar.md` com comentário de instrução. Numeração de RF/UC conforme DOC-12 e a seção 3 do guia, sem renumerar existentes.
  3. `Dicionario-de-Dados-a-acrescentar.md`: campos novos (`tipo` da votação, autoria opcional, tabelas do Better Auth) conferidos no `schema.prisma` final.
  4. `Requisitos-a-acrescentar.md`: RNFs de segurança (scrypt, helmet, limite de tentativas) com métrica, método e versão do catálogo (DOC-22).
  5. Regenerar o espelho em `preview/` e a tabela "O que colar onde" do `LEIA-ME.md` se arquivos entrarem ou saírem; diagramas só se a imagem existir no código-fonte do diagrama (sem inventar).
  6. Verificação: busca por `site|página|clicar` nas páginas; links relativos do `preview/` resolvem; cada afirmação confere com código ou OpenAPI (cabeçalho "Fontes" de cada arquivo novo).
- [x] **Passo 9 — RF-R79: verificação de isolamento.** Confirmar com `Glob` e busca que nenhum arquivo foi criado ou alterado fora de `wiki-local/` e dos arquivos do escopo desta unidade (comparar a lista de arquivos tocados no `code-summary.md` com o escopo da seção 1.2). Nenhum acesso à Wiki do GitHub.
- [x] **Passo 10 — RF-R80: `aidlc-docs` dos subsistemas (se der tempo).** Para `sistema/better-meet/aidlc-docs/inception/reverse-engineering/*` (`api-documentation.md`, `architecture.md`, `code-structure.md`, `component-inventory.md`, `dependencies.md`, `technology-stack.md`, `code-quality-assessment.md`, `votacoes.md`, `business-overview.md`) e `sistema/management-better-meet/web/aidlc-docs/**`: atualizar apenas o que mudou (rotas `/api/auth/*`, `GET /api/usuarios/me`, dependências novas, remoção do `jwt` compartilhado, painel sem chave da monitoring), atualizando `Commit`, `Data de revisão` e `Estado` no cabeçalho de cada arquivo tocado. Arquivos intactos não mudam de cabeçalho. Verificação por inspeção; cada dado conferido contra `package.json`/código.
- [x] **Passo 11 — Fechamento da fase 2.** Completar `code-summary.md` (fase 2): arquivos tocados, lacunas `[A CONFIRMAR]`, itens cortados, e o resultado de "nenhum arquivo fora do escopo". Devolver ao orquestrador a lista de pendências para `RELATORIO_BUGS.md` (U9).

## 4. Se der tempo

- [ ] **Passo 12 — `LICENSE` e `documentos/consolidado/` (conflito com a RF-R83 da U9).** Só executar com confirmação do orquestrador de que a U9 não os criará.
  1. `LICENSE` na raiz: licença escolhida pela equipe e compatível com as do catálogo (sistema open-source, GUIA_DE_DOCUMENTACAO seção 14.2). Se a equipe ainda não escolheu, **parar e perguntar** (sugestão neutra: MIT), sem criar o arquivo.
  2. `documentos/consolidado/softwares_e_licencas.md` (DOC-29): cabeçalho padrão; colunas Software, Versão, Licença, Uso, Subsistema, Fonte da licença; todas as dependências diretas dos cinco `package.json` com a versão do lockfile e a licença do `node_modules/<pacote>/package.json` (ler os arquivos, sem `npm install`); incluir Better Auth, `@better-auth/expo`, helmet, express-rate-limit, `expo-secure-store`, `expo-local-authentication`, provedor Google, Node.js, npm, MySQL, Docker, PM2, Java, PlantUML, servidor de e-mail; licença não identificada fica `[A CONFIRMAR]`. Só rodar depois da onda 2 (versões finais dos lockfiles), portanto na onda 3.
  3. Criar a pasta `documentos/consolidado/` só com esse arquivo; não criar diagramas.

## 5. Rastreabilidade

| Requisito | Passos |
|---|---|
| RF-R77 | 1, 2, 3, 4 |
| RF-R81 | 5, 6 |
| RF-R79 | 7, 8, 9, 11 |
| RF-R80 | 7, 10, 11 |
| RF-R83 (só se o orquestrador transferir da U9) | 12 |

## 6. Riscos

| Risco | Mitigação |
|---|---|
| Documentar rota ou tela cortada | O passo 7 lista o que foi entregue; só o entregue entra |
| Cópia do `PROMPT_AGENTES_IA.md` divergir do guia | `AGENTS.md` copia o bloco literal; aviso de atualização em conjunto |
| Wiki de origem alterada por engano | Passo 9; só `wiki-local/` |
| `LICENSE` e catálogo duplicados com a U9 | Passo 12 condicionado à confirmação |
| Aparelhos do plano manual desconhecidos | Campos `[A CONFIRMAR]` até a equipe informar |
