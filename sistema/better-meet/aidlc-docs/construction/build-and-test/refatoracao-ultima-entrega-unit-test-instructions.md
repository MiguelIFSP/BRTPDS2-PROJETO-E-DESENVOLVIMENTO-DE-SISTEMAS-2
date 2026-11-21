- **Incremento:** Apresentação final (AF) — refatoração de código
- **Escopo:** execução dos testes automatizados dos cinco subsistemas
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** aed2702 (base; alterações da refatoração ainda sem commit)
- **Data de revisão:** 2026-11-21
- **Responsável(eis):** [nome de quem revisa e aprova]
- **Estado:** Gerado na etapa Build and Test; resultados reais de 2026-11-21
- **Fontes:** [relatorio-final.md](../refatoracao-ultima-entrega/relatorio-final.md); `package.json` e configuração do Jest de cada subsistema; regra 80 do `AGENTS.md`

# Instruções de testes unitários — refatoração da última entrega

## Executar

### 1. Todos os testes de um subsistema

```bash
cd sistema/api && npm test
cd sistema/better-meet && npm test
cd sistema/monitoring-better-meet && npm test
cd sistema/management-better-meet/server && npm test
cd sistema/management-better-meet/web && npm test
```

Os serviços Node usam Jest 30 com `node --experimental-vm-modules` e Supertest 7; os apps usam Jest 30 com `jest-expo` 58 e React Native Testing Library 14. Na `api` e na monitoring, os testes ficam em `tests/<assunto>.test.mjs` e simulam o banco com `jest.unstable_mockModule`; nos apps, em `__tests__/` ao lado do código. Em `better-meet`, `npm run test:web` roda a configuração web (`jest.web.config.cjs`), fora do `npm test`.

### 2. Resultado esperado (medido em 2026-11-21)

| Subsistema | Suítes | Testes | Falhas |
|---|---|---|---|
| `sistema/api` | 30 | 488 | 0 |
| `sistema/better-meet` | 46 | 320 | 0 |
| `sistema/monitoring-better-meet` | 14 | 105 | 0 |
| `sistema/management-better-meet/server` | 11 | 65 | 0 |
| `sistema/management-better-meet/web` | 6 | 40 | 0 |
| **Total** | **107** | **1018** | **0** |

- **Cobertura:** não medida (os `package.json` não têm o script `--coverage`; a meta do projeto é cobrir as regras de negócio dos services, não um percentual).
- **Relatório:** saída do Jest no terminal; não há pasta de relatório.

### 3. Se algo falhar

1. Rode a suíte sozinha: `npm test -- <arquivo>` (ex.: `npm test -- tests/autoriaBanco.test.mjs` na `api`).
2. Leia a mensagem do Jest, corrija o código (não o teste, salvo teste errado) e rode de novo até passar.
3. Rode o subsistema inteiro e, depois, o lint e o typecheck.

## Observação sobre tempo limite (api)

Na primeira execução de 2026-11-21, cinco subsistemas rodaram ao mesmo tempo na mesma máquina e o teste `autoria opcional e votação no banco › excluir a conta de quem criou reunião e votação responde 200 e anula a autoria` (`api/tests/autoriaBanco.test.mjs`) estourou o limite padrão de 5 s do Jest por falta de CPU (hash scrypt e banco real). Sozinha, a `api` passou com 30 suítes e 488 testes em 11 s. Rode os subsistemas um de cada vez; se a máquina for lenta, use `npm test -- --testTimeout=15000`.

## Histórico de revisões

| Versão | Data | Autor(es) | Alteração |
|---|---|---|---|
| 1.0 | 2026-11-21 | [nomes] | Criação |
