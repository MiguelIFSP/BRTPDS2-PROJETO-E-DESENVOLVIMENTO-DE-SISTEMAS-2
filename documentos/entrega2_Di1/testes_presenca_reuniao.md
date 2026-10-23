# Testes da presença em reuniões (API)

Data: 23-10-2026.

## O que foi testado

Registro de entrada e saída de integrantes nas reuniões agendadas:

| Rota | Regra verificada |
|---|---|
| `POST /api/reunioes/:id/entrar` | Usuário e horário vêm do token e do servidor, ignorando o corpo. A repetição devolve 200 com o primeiro registro, inclusive em duas requisições simultâneas. Reunião REALIZADA ou CANCELADA preserva a presença existente e recusa a primeira entrada. Exige autenticação, token válido e id inteiro positivo (`abc`, `0`, `-1`, `1.5` recusados). Reunião inexistente responde 404. Quem não integra a comissão é recusado, mesmo com presença anterior. Exige organização aprovada. Falha na gravação não confirma presença. |
| `POST /api/reunioes/:id/sair` | Usuário e horário vêm do token e do servidor, sem alterar a entrada. A repetição mantém o primeiro horário de saída. Saída sem entrada registrada é recusada. |
| Listagem das reuniões do usuário | O `meuRegistro` traz só a presença do usuário autenticado, a lista interna de registros não sai na resposta e cada participante vem com a própria presença. |

Arquivo: `sistema/api/tests/reuniaoCheckIn.test.mjs` (Jest + Supertest). O banco é simulado (mock do Prisma) e o token é assinado com um segredo fictício; nenhum registro é lido ou gravado no banco.

## Como rodar

Em `sistema/api`:

```bash
npm test -- --runInBand reuniaoCheckIn
```

## Resultado

Execução de 23-10-2026, primeira rodada:

- 1 suíte, 22 testes: 21 aprovados, 1 falha.
- Falha: o teste da listagem estava desatualizado. O `reuniaoService.listMine` passou a devolver comissão, convites e participantes com a presença de cada um, e o mock do teste não trazia esses dados. Não era defeito do código.

Correção: o teste foi reescrito para o comportamento atual, mantendo o que ele protege (o `meuRegistro` é só do usuário e a lista interna de registros não sai na resposta).

Execução após a correção: 1 suíte, 22 testes aprovados, 0 falhas.
