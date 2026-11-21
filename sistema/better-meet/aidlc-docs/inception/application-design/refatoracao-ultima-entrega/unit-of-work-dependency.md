- **Incremento:** Apresentação final (AF) — refatoração de código
- **Escopo:** dependências, ondas e contratos entre as unidades U1 a U9
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** aed2702
- **Data de revisão:** 2026-11-20
- **Responsável(eis):** [nome de quem revisa e aprova]
- **Estado:** Proposta — aguardando aprovação da Units Generation
- **Fontes:** [unit-of-work.md](unit-of-work.md); [requirements.md](../../requirements/refatoracao-ultima-entrega/requirements.md) (seções 10 e 11)

# Dependências entre unidades

## 1. Ondas

| Onda | Unidades em paralelo | Condição para começar | Condição para terminar |
|---|---|---|---|
| 1 | U1; U2 fase 1; U3 fase 1; U4 fase 1; U5 fase 1; U6 fase 1; U7 fase 1 (RF-R09, R10, R11) | nenhuma | C1, C2, C4 e C5 entregues pela U1; C3 pela U2 |
| 2 | U7 fase 2; U8; U2 fase 2; U3 fase 2; U4 fase 2; U5 fase 2 | C4 (U7 f2); C1 e C2 (U8, U2 f2, U3 f2, U4 f2); C3 (U8, U4 f2); hook de biometria (U5 f2, só a confirmação) | testes verdes ou falhas registradas |
| 3 | U9; U6 fase 2 | ondas 1 e 2 concluídas | relatório final (RF-R84) |

Dentro da onda 2, a U5 fase 2 faz a tela de cada requisito quando a rota da U7 existe: RF-R37 depois de R14, RF-R36 depois de R15, RF-R39 depois de R16, RF-R38 depois de R17 e R18, RF-R44 depois de R19. RF-R35 e RF-R40 dependem de R09 e R10, já entregues na onda 1.

## 2. Matriz de dependências

A linha precisa do que a coluna entrega. Números são os contratos da seção 3.

| Unidade \ Precisa de | U1 | U2 | U5 | U7 | U8 |
|---|---|---|---|---|---|
| U1 api-auth-protecao | — | | | | |
| U2 monitoring | fase 2: C2 | | | | |
| U3 gestao-server | fase 2: C2 | | | | |
| U4 gestao-web | fase 2: C1 | fase 2: C3 | | | |
| U5 app-telas | | | fase 1 antes da fase 2 | fase 2: C6 | fase 2: hook de biometria |
| U6 documentacao | fase 2: tudo | | | | |
| U7 api-dominio | fase 2: C4 e C2 | | | | |
| U8 app-auth-integracao | C1, C2 | C3 | fase 1 concluída | C7 (RF-R34) | — |
| U9 fechamento | todas as anteriores | | | | |

U3 e U4 só dependem de U1 e U2 nas fases 2. U9 depende de todas.

## 3. Contratos

### C1 — Better Auth para o app e o painel (U1 entrega; U8 e U4 consomem)

- Rotas sob `/api/auth/*` do Better Auth: cadastro, login por e-mail e senha, pedido e redefinição de senha por token, verificação e reenvio de e-mail, login social Google, logout, sessão.
- A U1 registra no relatório e no `openapi.yaml` os nomes exatos das rotas e dos corpos, lidos da documentação da versão instalada, e o modo de sessão do app: plugin `expo()` no servidor com `expoClient` (`bettermeet://`) ou, no plano B, `bearer`. O app envia `Authorization: Bearer <token de sessão>`.
- Erros: 403 para e-mail não confirmado, 401 para credencial inválida, 429 para excesso de tentativas, mensagens em pt-BR.
- Variáveis (C5): `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CORS_ORIGINS`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. O app só conhece a URL base e o esquema `bettermeet://`.

### C2 — Validação de sessão (U1 entrega; U2 fase 2, U3 fase 2 e U8 consomem)

- Rota `GET /api/usuarios/me`, com `Authorization: Bearer <token de sessão do Better Auth>`.
- 200: perfil lido do banco (`id`, `name`, `email`, `role`, e-mail verificado). 401: token ausente, inválido, vencido ou usuário excluído.
- Monitoring e gestão (servidor) chamam essa rota pela URL da API (lida em `env.ts`) para autenticar e para ler o `role`. Até a U1 provar a rota por teste, os dois mantêm o `jwt.verify` atual; a troca é feita na mesma etapa nos dois.
- Contrato publicado no `openapi.yaml` da API (U1, RF-R07).

### C3 — Rota autenticada da monitoring (U2 entrega na fase 1; U8 e U4 consomem na onda 2)

- Rota de relato de erro e de checagem de subsistema autenticada pelo token do usuário (fase 1 por `jwt.verify`; fase 2 por C2). Usuário comum pode reportar erro; a chave interna (`MONITORING_API_KEY`) fica só entre servidores.
- Prefixo `/monitoring-better-meet` mantido até a U9. A U2 publica caminhos e corpos no `openapi.yaml` da monitoring (RF-R63) e no relatório.
- U8 e U4 só removem `EXPO_PUBLIC_MONITORING_API_KEY` quando a rota existir e estiver testada.

### C4 — Migrations do Prisma da API (U1 e U7)

Regras na seção 4.

### C5 — Variáveis de ambiente (todas entregam; U9 consolida)

Cada unidade registra no relatório as variáveis novas (nome, obrigatória, exemplo); a U9 as copia para os `.env.example`, o `docker-compose.yml` e o `ecosystem.config.js`, com `TZ`.

### C6 — Rotas de domínio para as telas (U7 entrega; U5 fase 2 consome)

Janela de check-in (409 com a hora de início), saída e marcação de presença por Administrador, resposta e reenvio de convite, ata (exportação só após aprovação), votação (`tipo`, voto nulo, resultado parcial, troca de voto, sem vínculo voto-pessoa na secreta) e relatório de reuniões do usuário. A U7 documenta cada rota no `openapi.yaml` (RF-R23) e lista no relatório os campos novos das respostas.

### C7 — Regra de autoria (U7 entrega; U8 consome)

`criadoPorUserId` opcional com `onDelete: SetNull`; a API devolve autoria nula e o app exibe "usuário removido". O 409 de sucessão e de grupos pendentes continua, com `details`.

## 4. Regras de migration

1. Só uma unidade é dona do `api/prisma/schema.prisma` e de `api/prisma/migrations/` por vez: U1 na onda 1; U7 a partir da fase 2, depois que a U1 informar "schema liberado" no relatório.
2. A U7 fase 1 (RF-R09, R10, R11) não altera o schema.
3. A U1 cria a 1ª migration (tabelas do Better Auth e ajustes da conta). A U7 cria as seguintes, em ordem: autoria (RF-R08), presença (RF-R15), votação (RF-R17) e ata (RF-R16, se houver coluna). Todas versionadas e aplicáveis a banco com dados.
4. Cada migration é gerada com `prisma migrate dev` no container e conferida com `prisma migrate deploy` em banco populado.
5. A migração das contas legadas (hash SHA-256 e e-mail não confirmado, RF-R02 e R04) é da U1 e testada nos dois caminhos.
6. O banco da monitoring é independente: só a U2 (RF-R59, baseline) mexe no `prisma/` dela.
7. Ninguém edita migration já aplicada; correção vira nova migration.

## 5. Impacto do corte nas unidades

Se faltar prazo, corta-se na ordem da seção 13.2 do requirements. Cortar RF-R31 tira o hook da U8 (a U5 fase 2 omite a confirmação por biometria); cortar RF-R06 e R30 tira o provedor Google e suas chaves de C5; cortar RF-R19 leva junto a RF-R44. Cortar um item não muda o dono dos demais arquivos.
