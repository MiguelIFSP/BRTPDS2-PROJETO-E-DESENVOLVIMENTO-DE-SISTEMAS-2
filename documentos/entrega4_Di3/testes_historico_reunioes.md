```text
Incremento: Entrega 4 — Di3 — Histórico de reuniões
Escopo: RF18; RNF47 e RNF48; UC26, UC27 e UC28 (identificadores locais)
Branch: main
Commit: 3832724b207dfcfef6954e991f70366a66507389
Data de revisão: 2026-11-13
Responsável(eis): Breno Nobre de Souza
Estado: Parcial
Fontes: sistema/api/tests/reuniaoCheckIn.test.mjs; sistema/better-meet/src/components/__tests__/ReuniaoCheckIn.test.tsx; sistema/api/package.json; sistema/api/package-lock.json; sistema/better-meet/package.json; sistema/better-meet/package-lock.json; sistema/better-meet/src/app/(tabs)/(reunioes)/historico.tsx; sistema/better-meet/src/components/ReuniaoCheckIn.tsx
```

O requisito, os diagramas e o dicionário estão em [historico_reunioes.md](historico_reunioes.md).

**Origem dos resultados.** Este agente não executou nenhum teste e não rodou o app. Todos os resultados abaixo foram informados por Bruno Soares Machado e registrados como recebidos. A data da execução, o commit testado e as contagens de testes não foram informados e por isso não constam.

# Testes de histórico de reuniões

## O que foi testado

| ID | RF/RNF e UC | Rota ou tela | Cenário verificado | Arquivo ou passos | Status |
|---|---|---|---|---|---|
| CT-RF18-01 | RF18, UC26 | `GET /api/reunioes/minhas` (`reuniaoService.listMine`) | `meuRegistro` traz só o registro do usuário autenticado; a reunião sem presença do usuário vem com `meuRegistro` nulo; `registros` não sai na resposta; cada participante traz o próprio `registro` | `sistema/api/tests/reuniaoCheckIn.test.mjs`, bloco "presença ao recarregar reuniões" | Passou (informado por Bruno Soares Machado) |
| CT-RF18-02 | RF18, UC27, RNF47, RNF48 | `POST /api/reunioes/:id/entrar` | `201` na primeira entrada usando o JWT e o horário do servidor, ignorando `userId`, `entradaAt` e `saidaAt` do corpo; repetição `200` e `jaRegistrado: true`; duas requisições simultâneas, `201` e `200` com o mesmo registro; registro existente preservado em reunião `REALIZADA` ou `CANCELADA`; primeira entrada nesses status `409`; `401` sem token e com JWT inválido; `400` para os ids `abc`, `0`, `-1` e `1.5`; `404` reunião inexistente; `403` fora da equipe; `409` organização não aprovada; `500` quando a gravação falha; `P2002` relançado sem registro recuperável | `sistema/api/tests/reuniaoCheckIn.test.mjs`, bloco `POST /api/reunioes/:id/entrar` | Passou (informado por Bruno Soares Machado) |
| CT-RF18-03 | RF18, UC27 e UC28 | `ReuniaoCheckIn` | Entrada com `jaRegistrado` falso e verdadeiro; carga e bloqueio de segundo toque; nova tentativa depois de falha; presença recuperada do servidor; saída; estado encerrado sem reentrada; nenhuma oferta de primeira entrada em reunião `REALIZADA` ou `CANCELADA` | `sistema/better-meet/src/components/__tests__/ReuniaoCheckIn.test.tsx` | Passou (informado por Bruno Soares Machado) |
| CT-RF18-04 | RF18, UC28, RNF47 | `POST /api/reunioes/:id/sair` | `200` com `saidaAt` do servidor, `entradaAt` intacta e corpo ignorado; repetição devolve a primeira saída e não chama `updateMany`; saída sem entrada responde `409` | `sistema/api/tests/reuniaoCheckIn.test.mjs`, bloco `POST /api/reunioes/:id/sair` | Passou (informado por Bruno Soares Machado) |
| CT-RF18-05 | RF18, UC26 | Aba Reuniões e `historico.tsx` | Abrir o histórico, ver só reuniões com presença, da mais recente para a mais antiga (manual) | Roteiro CT-RF18-05 abaixo | Passou (informado por Bruno Soares Machado) |
| CT-RF18-06 | RF18, UC27 | `reuniao/[id].tsx` e `historico.tsx` | Entrar na reunião agendada e ver a reunião no histórico (manual) | Roteiro CT-RF18-06 abaixo | Passou (informado por Bruno Soares Machado) |
| CT-RF18-07 | RF18, UC28 | `reuniao/[id].tsx` | Registrar saída e conferir que a reunião segue no histórico (manual) | Roteiro CT-RF18-07 abaixo | Passou (informado por Bruno Soares Machado) |
| CT-RF18-08 | RF18, UC26 | `historico.tsx` | Histórico vazio para quem nunca registrou presença (manual) | Roteiro CT-RF18-08 abaixo | Passou (informado por Bruno Soares Machado) |
| CT-RF18-09 | RF18, UC26 | `historico.tsx` | Falha de rede ao carregar o histórico e recuperação (manual) | Roteiro CT-RF18-09 abaixo | Passou (informado por Bruno Soares Machado) |

Não há teste automatizado de `historico.tsx` (filtro por `meuRegistro`, ordem decrescente, lista vazia e erro). O arquivo `ReunioesData.test.tsx`, que a versão anterior do documento citava como CT-RF18-01, testa o formulário de nova reunião e não cobre o histórico. Os caminhos `403` por convite não aceito, `404` de comissão inexistente e `404` do registro que some na releitura da saída não têm teste. Foram lidos no código e estão na tabela de Saída de [historico_reunioes.md](historico_reunioes.md).

## Como rodar

**Testes automatizados.** Ambiente: Node 24 (24.15.0 na máquina desta revisão), Jest 30.5.2 e Supertest 7.3.1 na API; Jest 30.5.2, `jest-expo` 58.0.14 e `@testing-library/react-native` 14.1.0 no app (versões dos `package-lock.json` do commit consultado). Os testes da API substituem o Prisma por mocks e não acessam o MySQL. Os do app substituem `reuniaoService` e `monitoringService` e não acessam a API. Em `sistema/api`:

```bash
npm test -- tests/reuniaoCheckIn.test.mjs
```

Em `sistema/better-meet`:

```bash
npx jest --runInBand src/components/__tests__/ReuniaoCheckIn.test.tsx
```

**Testes manuais.** Ambiente: API de dados em execução e o app Better Meet instalado num aparelho Android, ambos apontando para o mesmo banco de teste. Aparelho: Samsung Galaxy S25+, com Android 17 e One UI 9 (informado por Bruno Soares Machado). Dados necessários:

- Conta A, membro da equipe de uma comissão de organização com status `ACEITA`, criadora de uma reunião `AGENDADA` com `horaFim` no futuro.
- Conta B, na mesma equipe, com convite `ACEITO` para essa reunião, e sem nenhuma presença registrada.
- Conta C, criadora de uma reunião `REALIZADA` e de uma segunda `AGENDADA` com data posterior, com presença já registrada nas duas.
- Nenhum token, senha ou dado pessoal real é anotado nas evidências.

### CT-RF18-05 — Consultar o histórico em ordem decrescente

Ambiente: Samsung Galaxy S25+, Android 17, One UI 9.

1. Entrar no app com a conta C.
2. Abrir a aba **Reuniões** e tocar no botão do relógio ("Histórico de reuniões").
3. Conferir o título da tela, o subtítulo "Reuniões em que sua presença foi registrada." e a seção "Reuniões que você participou".
4. Conferir os cards das duas reuniões da conta C.
5. Tocar num card.

Resultado esperado: aparece "Carregando seu histórico..." e depois um card por reunião com presença, sem reunião sem presença. A reunião de data mais recente vem primeiro; a mais antiga vem depois. Cada card mostra título, "data às início até fim", "Comissão: nome" e "Presença registrada em dd/mm/aaaa às hh:mm". O toque no card abre a página da reunião.

Resultado obtido: Passou (informado por Bruno Soares Machado).

### CT-RF18-06 — Entrar na reunião e vê-la no histórico

Ambiente: Samsung Galaxy S25+, Android 17, One UI 9.

1. Entrar no app com a conta B e abrir a reunião agendada, a partir da aba **Reuniões**.
2. No card **Presença**, tocar em **Entrar na Reunião**.
3. Voltar à aba **Reuniões** e abrir o histórico pelo botão do relógio.

Resultado esperado: durante o envio o botão mostra "Confirmando presença..." e fica desabilitado. Depois aparecem o selo "Presença ativa" e o botão **Registrar saída**. A reunião aparece no histórico da conta B, com "Presença registrada em" e o horário da entrada. Um novo toque rápido no botão não cria outra entrada.

Resultado obtido: Passou (informado por Bruno Soares Machado).

### CT-RF18-07 — Registrar saída e manter a reunião no histórico

Ambiente: Samsung Galaxy S25+, Android 17, One UI 9.

1. Com a conta B ainda com a presença ativa da CT-RF18-06, abrir a página da reunião.
2. Tocar em **Registrar saída**.
3. Abrir o histórico.

Resultado esperado: durante o envio o botão mostra "Registrando saída...". Depois aparece o selo "Saída registrada" e os botões somem. A reunião continua no histórico, com o mesmo horário de entrada de antes.

Resultado obtido: Passou (informado por Bruno Soares Machado).

### CT-RF18-08 — Histórico vazio

Ambiente: Samsung Galaxy S25+, Android 17, One UI 9.

1. Entrar no app com uma conta que nunca registrou presença em nenhuma reunião.
2. Abrir o histórico pelo botão do relógio.

Resultado esperado: depois do carregamento, o texto "Você ainda não participou de nenhuma reunião." e nenhum card. Nenhum banner de erro.

Resultado obtido: Passou (informado por Bruno Soares Machado).

### CT-RF18-09 — Falha de rede ao carregar o histórico

Ambiente: Samsung Galaxy S25+, Android 17, One UI 9.

1. Entrar no app com a conta C e manter o histórico fechado.
2. Desligar a rede do aparelho (modo avião).
3. Abrir o histórico.
4. Religar a rede e puxar a tela para baixo para atualizar.

Resultado esperado: no passo 3, banner de erro com "Não foi possível conectar ao servidor. Verifique sua conexão." e nenhum card. No passo 4, o indicador de atualização aparece, o banner é substituído e os cards da conta C voltam.

Resultado obtido: Passou (informado por Bruno Soares Machado).

## Resultado

Resultados informados por Bruno Soares Machado, sem data, commit nem contagem de testes:

- CT-RF18-01 a CT-RF18-04 (automatizados): Passou.
- CT-RF18-05 a CT-RF18-09 (manuais): Passou.
- Falhas e defeitos encontrados: nenhum informado.
- Não executado: teste de integração contra o MySQL real da UK `ReuniaoRegistro_reuniaoId_userId_key` (RNF47); teste automatizado de `historico.tsx`.
- Evidências: não foram anexadas capturas nem logs. Quando existirem, registrar o caminho aqui, sem tokens nem dados pessoais.
