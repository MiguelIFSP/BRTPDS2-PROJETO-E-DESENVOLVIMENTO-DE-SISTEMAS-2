- **Incremento:** Apresentação final (AF) — refatoração de código
- **Escopo:** testes de integração entre as camadas e serviços da refatoração
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** aed2702 (base; alterações da refatoração ainda sem commit)
- **Data de revisão:** 2026-11-21
- **Responsável(eis):** [nome de quem revisa e aprova]
- **Estado:** Gerado na etapa Build and Test; resultados reais de 2026-11-21
- **Fontes:** [relatorio-final.md](../refatoracao-ultima-entrega/relatorio-final.md); [plano-manual.md](../refatoracao-ultima-entrega/plano-manual.md); `sistema/api/tests/`; `sistema/docker-compose.yml`

# Instruções de testes de integração — refatoração da última entrega

## Objetivo

Conferir a interação entre as unidades: rotas, Better Auth, Prisma e o MySQL de teste (`api`), e os contratos entre a `api`, a monitoring, o servidor de gestão e os apps. Nenhum teste usa o banco de desenvolvimento (GT-04): o `globalSetupBanco.mjs` cria e migra o banco `better_meet_test` no MySQL do container.

## Cenários

### Cenário 1: Better Auth com banco real (api)
- **Descrição:** cadastro, e-mail confirmado, login, sessão, troca e recuperação de senha, limite de tentativas e migração do hash SHA-256 antigo.
- **Suítes:** `authFluxos`, `authSenhaEmail`, `recuperacaoSenha`, `rateLimitAuth`, `sessaoMe`, `senhaLegada`, `emailRecuperacao`, `authConfig`.
- **Resultado esperado:** todas passam; as que usam o banco não são puladas (se o banco estiver fora, o `globalSetup` avisa e pula).

### Cenário 2: Autoria opcional e exclusão de conta (api e banco)
- **Descrição:** excluir a conta de quem criou reunião ou votação responde 200 e anula a autoria (SetNull); último administrador e responsáveis pendentes respondem 409.
- **Suítes:** `autoriaBanco`, `usuarioExclusaoAdmin`, `reuniaoAutoria`, `organizacaoRemoverMembro`.

### Cenário 3: Proteção da API (api)
- **Descrição:** `helmet`, CORS restrito, limites de tentativa e de corpo, vínculo atual de quem pede com o recurso.
- **Suítes:** `protecaoApi`, `rateLimitAuth`, `openapi` (contrato do `docs/openapi.yaml` com as rotas).

### Cenário 4: Ciclo de vida de reunião, votação e ata (api)
- **Descrição:** janela de entrada, votação aberta ou secreta, voto nulo, ata aprovada e exportada, com transições recusadas (409 e 410).
- **Suítes:** `reuniaoCheckIn`, `votacaoService`, `ata`, `fusoHorario`, `schemaPrisma`.

### Cenário 5: Monitoring e gestão sob `/api` (monitoring e gestão/server)
- **Descrição:** rotas sob `/api`, chave interna só entre servidores, autenticação por sessão do Better Auth, ponte `POST /login` removida.
- **Suítes:** as 14 suítes da monitoring e as 11 do servidor de gestão (Supertest).

### Cenário 6: Apps contra a API (better-meet e gestão/web)
- **Descrição:** `apiRequest`, sessão no armazenamento seguro, 401 com logout, telas e stores, com `fetch` simulado (`globalThis.fetch`). Não há teste automatizado contra a API real; essa ligação é verificada à mão (ver [plano-manual.md](../refatoracao-ultima-entrega/plano-manual.md)).

## Preparar o ambiente

```bash
cd sistema && docker compose up -d db_better_meet     # container mysql_better_meet_dev
cd sistema/api && cp .env.example .env                 # preencher DATABASE_URL e segredos fictícios
```

O banco `better_meet_test` não precisa ser criado à mão: o `globalSetup` o migra (`prisma migrate deploy` com a `DATABASE_URL` trocada para ele). Se o usuário do MySQL não puder criar bancos, crie-o como root: `CREATE DATABASE better_meet_test;` e conceda acesso ao usuário.

## Executar

```bash
cd sistema/api && npm test
```

O teste de integração da `api` é parte do `npm test` (não há script `test:integration`). Resultado de 2026-11-21: 30 suítes e 488 testes passaram, com o container `mysql_better_meet_dev` de pé e nenhum teste pulado.

## Verificar

- **Logs:** saída do Jest; o aviso "Banco better_meet_test indisponível" indica testes pulados e deve ser tratado como falha da preparação.
- **Fora do alcance automático:** envio real de e-mail (Gmail), login social do Google, links `bettermeet://`, Keychain/Keystore. Vão para o [plano manual](../refatoracao-ultima-entrega/plano-manual.md).

## Limpar

```bash
cd sistema && docker compose stop db_better_meet
```

Os dados de teste ficam no banco `better_meet_test`, apagado e recriado pelas próprias suítes; nada a limpar no banco de desenvolvimento.

## Histórico de revisões

| Versão | Data | Autor(es) | Alteração |
|---|---|---|---|
| 1.0 | 2026-11-21 | [nomes] | Criação |
