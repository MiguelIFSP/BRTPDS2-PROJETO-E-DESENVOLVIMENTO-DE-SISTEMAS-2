```text
Incremento: Entrega 4 — Di3
Escopo: RF16; RNF44; UC17, UC18 e UC19
Branch: development
Commit: 18c26a6e1b9301a177c1bb5fd09aff1d0de7ffa0
Data de revisão: 2026-11-12
Responsável(eis): Cauê Watanabe de Campos
Estado: Parcial
Fontes: sistema/api/tests/votacaoSchema.test.mjs; sistema/better-meet/src/components/__tests__/VotacoesDaReuniao.test.tsx; sistema/better-meet/package.json
```

O requisito e os diagramas estão em [votacoes.md](votacoes.md).

# Testes de votações

## O que foi testado

| ID | RF/RNF e UC | Rota ou tela | Cenário verificado | Arquivo ou passos | Status |
|---|---|---|---|---|---|
| CT-RF16-01 | RF16, UC18 | `votacaoSchema` da API, usado no `POST /reunioes/:id/votacoes` | Título "Aprovar a pauta" e opções "Sim" e "Não" passam | `sistema/api/tests/votacaoSchema.test.mjs` | Passou |
| CT-RF16-02 | RF16, UC18, RN-VT01 | O mesmo schema | Uma opção só falha com "Informe pelo menos duas opções." "Sim" e " sim " falham com "As opções não podem se repetir." | O mesmo arquivo | Passou |
| CT-RF16-03 | RF16, UC17 e UC18 | `VotacoesDaReuniao` | O botão "Nova votação" só aparece com `canManage`. O toque no card chama `router.push` para `/votacao/[id]` | `sistema/better-meet/src/components/__tests__/VotacoesDaReuniao.test.tsx` | Não executado |
| CT-RF16-04 | RF16, UC18, UC19, UC20 e UC21 | `POST`, `GET`, `DELETE` das rotas de votação | Sucesso, 401, 403, 404 e 409 | Nenhum teste localizado | Não executado |
| CT-RNF44-01 | RNF44, UC19 | `VotacaoVoto` | Duas gravações da mesma pessoa na mesma votação não criam duas linhas | Inspeção da UK. Sem teste de banco | Não executado |

Não há teste de autenticação, autorização, estado encerrado, opção de outra votação nem falha de rede. Esses caminhos foram lidos no código e estão na tabela de Saída de [votacoes.md](votacoes.md). Não foram executados.

## Como rodar

Na pasta `sistema/api`:

```bash
npm test -- tests/votacaoSchema.test.mjs
```

Na pasta `sistema/better-meet`:

```bash
npx jest --runInBand src/components/__tests__/VotacoesDaReuniao.test.tsx
```

O segundo comando depende de `react-native-reanimated/jest/resolver`, configurado em `package.json`.

## Resultado

Execução de 2026-11-12, no commit `18c26a6e1b9301a177c1bb5fd09aff1d0de7ffa0`:

- API: 1 suíte, 2 testes, os dois aprovados. CT-RF16-01 e CT-RF16-02.
- App: a suíte não abriu. O Jest encerrou com `Module react-native-reanimated/jest/resolver in the resolver option was not found.` O diretório desse resolver não estava em `node_modules`. CT-RF16-03 não chegou às asserções.
- Falhas de produto encontradas nesta execução: nenhuma. A falha do app é de ambiente de teste.
- CT-RF16-04 e CT-RNF44-01 continuam sem execução.
- Evidência: saída do comando da API nesta revisão. Nenhum token nem dado pessoal foi registrado.
