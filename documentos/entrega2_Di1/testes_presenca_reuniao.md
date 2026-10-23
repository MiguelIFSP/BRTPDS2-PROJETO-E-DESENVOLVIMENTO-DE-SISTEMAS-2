# Testes da presença em reuniões (API)

Data: 23-10-2026.

## O que foi testado

Registro de entrada e saída de integrantes nas reuniões agendadas:

| Rota | Regra verificada |
|---|---|
| `POST /api/reunioes/:id/entrar` | Usuário e horário vêm do token e do servidor, ignorando o corpo. A repetição devolve 200 com o primeiro registro, inclusive em duas requisições simultâneas. Reunião REALIZADA ou CANCELADA preserva a presença existente e recusa a primeira entrada. Exige autenticação, token válido e id inteiro positivo (`abc`, `0`, `-1`, `1.5` recusados). Reunião inexistente responde 404. Quem não integra a comissão é recusado, mesmo com presença anterior. Exige organização aprovada. Falha na gravação não confirma presença. |
| `POST /api/reunioes/:id/sair` | Usuário e horário vêm do token e do servidor, sem alterar a entrada. A repetição mantém o primeiro horário de saída. Saída sem entrada registrada é recusada. |
| Listagem das reuniões do usuário | Traz só o registro de presença do usuário autenticado, sem expor a relação interna. |

Arquivo: `sistema/api/tests/reuniaoCheckIn.test.mjs` (Jest + Supertest). O banco é simulado (mock do Prisma) e o token é assinado com um segredo fictício; nenhum registro é lido ou gravado no banco.

## Como rodar

Em `sistema/api`:

```bash
npm test -- --runInBand reuniaoCheckIn
```

## Resultado

- 1 suíte, 22 testes: 21 aprovados, 1 falha.
- Falha: "busca apenas o registro do usuário autenticado e omite a relação interna". O `reuniaoService.listMine`, em alteração ainda não commitada, passou a ler `comissao.id` da reunião, e o mock do teste não traz a comissão. O teste precisa ser atualizado junto com essa alteração.
