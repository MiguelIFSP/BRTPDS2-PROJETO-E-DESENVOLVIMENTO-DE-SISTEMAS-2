# Testes do manual de utilização

Incremento: Incremento 3 — Manual de utilização (Aula4Thiago)<br>
Escopo: RF18, RNF45 e UC25<br>
Branch: `feature/manual`<br>
Commit: `0146791`<br>
Data de revisão: 2026-11-13<br>
Responsável(eis): [preencher por quem revisar e assinar]<br>
Estado: Não executado — Jest falhou ao carregar configuração antes de iniciar os testes<br>
Fontes: `sistema/better-meet/src/utils/__tests__/firstAccessWelcome.test.ts`; telas e utilitários referenciados em [manual_usuario.md](manual_usuario.md).

## O que foi testado

| ID | RF/RNF e UC | Rota ou tela | Cenário verificado | Arquivo ou passos | Status |
|---|---|---|---|---|---|
| CT-RF18-01 | RF18, UC25 | Cadastro / primeiro acesso | A marcação fica pendente apenas para o ID da conta que acabou de se cadastrar | `sistema/better-meet/src/utils/__tests__/firstAccessWelcome.test.ts` (`fica pendente somente para a conta que acabou de se cadastrar`) | Não executado |
| CT-RF18-02 | RF18, UC25 | Limpeza da marcação local | A função de limpeza remove a marcação pendente quando chamada | `sistema/better-meet/src/utils/__tests__/firstAccessWelcome.test.ts` (`deixa de aparecer depois que a pessoa escolhe um caminho`) | Não executado |
| CT-RF18-03 | RF18, UC25 | Primeiro acesso autenticado | O modal só aparece para sessão autenticada com marcação pendente da mesma conta | Roteiro manual: cadastrar, autenticar e comparar a conta com e sem chave local | Não executado; não foi localizado teste de integração |
| CT-RF18-04 | RF18, UC25 | `PrimeiroAcessoDialog` → Mais | **Sim, quero aprender** remove a marcação, navega para Mais e anima o botão quatro vezes | Roteiro manual em Android/iOS; conferir `highlightManual=1` e feedback visual | Não executado; não foi localizado teste de componente |
| CT-RF18-05 | RF18, UC25 | `PrimeiroAcessoDialog` | **Não / Fechar** fecha o modal e não redireciona a pessoa para Mais | Roteiro manual em Android/iOS | Não executado; não foi localizado teste de componente |
| CT-RF18-06 | RF18, UC25 | Mais → Ajuda (Web) | O botão inicia o download do PDF com o nome definido e apresenta feedback de sucesso | Roteiro manual em navegador; validar nome e abertura do arquivo | Não executado; não foi localizado teste de download |
| CT-RF18-07 | RF18, UC25 | Mais → Ajuda (Android/iOS) | O seletor permite escolher o destino; o PDF é criado ou sobrescrito e a tela apresenta feedback correspondente | Roteiro manual em Android e iOS; comparar o conteúdo salvo com o asset | Não executado; não foi localizado teste de download |
| CT-RNF45-01 | RNF45, UC25 | Mais → Ajuda (Web, Android e iOS) | A mesma versão do PDF é disponibilizada nas três plataformas; falhas não são reportadas como sucesso | Executar CT-RF18-06/07 nas três plataformas e comparar SHA-256 com o asset empacotado | Não executado |

Os dois testes unitários de `firstAccessWelcome.test.ts` existem no código, mas não foram executados pelo Jest nesta revisão. Nenhum resultado é atribuído a eles.

## Como rodar

Em `sistema/better-meet`, com as dependências de teste resolvidas:

```powershell
npm.cmd test -- --runInBand src/utils/__tests__/firstAccessWelcome.test.ts
```

Para CT-RF18-03 a CT-RF18-07 e CT-RNF45-01, usar instalações de navegador, Android e iOS com o asset do commit `0146791`. Não há automação localizada para essas interações; registrar versões dos ambientes, passos executados, resultado e evidência antes de alterar o status.

## Resultado

Execução de 2026-11-13, branch `feature/manual`, commit `0146791`:

- **Comando:** `npm.cmd test -- --runInBand src/utils/__tests__/firstAccessWelcome.test.ts`, executado em `sistema/better-meet`.
- **Resultado:** falha ao carregar o setup do Jest, antes de executar a suíte; 1 suíte falhou ao iniciar e 0 testes foram executados.
- **Erro observado:** `Cannot find module './src/RNGestureHandlerModule' from 'node_modules/react-native-gesture-handler/jestSetup.js'`, importado por `jest.setup.ts`.
- **Falhas funcionais encontradas:** não avaliadas, pois os testes não iniciaram.
- **Testes em navegador, Android e iOS:** não executados.
- **Evidência:** saída do comando de teste desta revisão. Não houve alteração de dependências nem de código para contornar o erro.
