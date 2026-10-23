# Testes do detalhe e da edição de organizações e comissões

Data: 23-10-2026.

## O que foi testado

Regras de permissão das rotas de detalhe e edição, ligadas ao UC02 (gerenciar comissões) e à manutenção de organizações:

| Rota | Regra verificada |
|---|---|
| `GET /api/organizacoes/:id` | Membro vê o detalhe, com os membros ordenados por papel (criador, gerente, moderador, membro). Quem não é membro recebe 403. Admin da plataforma vê sem ser membro. Organização inexistente responde 404. Id malformado responde 400 antes de consultar o banco. |
| `PATCH /api/organizacoes/:id` | Criador, gerente e admin da plataforma renomeiam, com o nome sem espaços nas pontas. Membro comum e quem não é membro recebem 403, sem gravar nada. Nome vazio responde 400. |
| `GET /api/comissoes/:id` | Membro da organização vê a equipe ordenada por papel (administrador, facilitador, secretário, membro). Quem não é membro da organização recebe 403. Admin da plataforma vê sem a consulta de participação. Comissão inexistente responde 404. |
| `PATCH /api/comissoes/:id` | Administrador e facilitador alteram nome e descrição; a comissão não muda de organização, mesmo que o corpo envie `organizacaoId`, e a descrição vazia é gravada como nula. Secretário, membro e quem não está na equipe recebem 403, sem gravar nada. Comissão inexistente responde 404. |

Arquivo: `sistema/api/tests/organizacaoComissaoDetalhe.test.mjs` (Jest + Supertest). O banco é simulado (mock do Prisma) e o token é assinado com um segredo fictício; nenhum registro é lido ou gravado no banco.

## Como rodar

Em `sistema/api`:

```bash
npm test -- --runInBand organizacaoComissaoDetalhe
```

## Resultado

- 1 suíte, 21 testes aprovados, 0 falhas.
- Nenhum defeito encontrado nas regras testadas.
