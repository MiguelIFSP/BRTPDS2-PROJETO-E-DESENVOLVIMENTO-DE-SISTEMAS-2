# RNF49 — Compatibilidade do manual

```text
Incremento: Entrega 4 — Di3
Escopo: RNF49 — compatibilidade do manual (RF19)
Branch: main
Commit: c45226bd62a95c97cf51ea41140678243b56806d
Data de revisão: 2026-11-13
Responsável(eis): Miguel Augusto Baptista
Estado: Parcial (código com fluxos para Web e móvel; não verificado nas três plataformas)
Fontes: sistema/better-meet/src/utils/downloadManualUsuario.ts; sistema/better-meet/src/utils/firstAccessWelcome.ts; sistema/better-meet/src/utils/__tests__/firstAccessWelcome.test.ts; sistema/better-meet/src/components/PrimeiroAcessoDialog.tsx; sistema/better-meet/src/app/_layout.tsx; sistema/better-meet/src/app/usuario.tsx; sistema/better-meet/src/app/(tabs)/mais/index.tsx; sistema/better-meet/src/services/usuarioService.ts; sistema/better-meet/src/store/authStore.ts; sistema/better-meet/metro.config.js; sistema/better-meet/package.json; sistema/better-meet/jest.setup.ts; sistema/better-meet/assets/manual/Manual-do-Usuario-Better-Meet.pdf (só a existência; o conteúdo do PDF não foi lido)
```


## Categoria

Compatibilidade e usabilidade.

## Descrição

O manual deve poder ser baixado ou salvo nas plataformas suportadas pelo sistema, mantendo o formato PDF e um nome de arquivo identificável. O sistema deve informar claramente se a operação foi concluída ou se ocorreu algum erro.

## Critérios de aceitação

- Em cada plataforma suportada (Web, Android e iOS), o usuário consegue obter o arquivo PDF do manual.
- O arquivo disponibilizado corresponde ao manual incluído no aplicativo e mantém o nome `Manual-do-Usuario-Better-Meet.pdf` (constante `MANUAL_FILE_NAME` no código; na gravação nativa, o conteúdo de um arquivo homônimo é substituído).
- Em caso de falha, o sistema apresenta uma mensagem de erro e não informa que o download foi concluído com sucesso.

## Método de verificação

Executar o fluxo manualmente em navegador, Android e iOS. Em cada plataforma, verificar o formato e o nome do arquivo obtido, além da mensagem apresentada pelo aplicativo. Registrar separadamente os resultados de cada ambiente.

## Estado da verificação

Não verificado nas três plataformas nesta documentação. A inspeção do código (commit c45226bd62a95c97cf51ea41140678243b56806d) identifica fluxos específicos, mas não substitui a execução dos testes:

- **Web:** `downloadManualUsuario` cria um link `<a>` com `download="Manual-do-Usuario-Better-Meet.pdf"` e chama `click()`; o resultado é `downloaded` e a mensagem é “Manual em PDF baixado.”. O código só detecta falha se faltar `document` ou `asset.uri`; falha do navegador após o `click()` não é detectada.
- **Android e iOS (mesmo código para ambos):** `Asset.downloadAsync()`, escolha de diretório com `Directory.pickDirectoryAsync()`, criação ou reutilização do arquivo `Manual-do-Usuario-Better-Meet.pdf` (`application/pdf`), leitura dos bytes e `File.write()`; PDF vazio gera erro. A mensagem de sucesso é “Manual em PDF salvo na pasta escolhida.”. O código não distingue Android de iOS.
- **Erro:** a tela **Mais** mostra um banner de erro com a mensagem lançada ou “Não foi possível baixar o manual.”, sem mensagem de sucesso.
- **Testes automatizados:** nenhum cobre este requisito (o único teste do manual é `firstAccessWelcome.test.ts`, que não trata do download).
- **Bibliotecas:** `expo-asset` e `expo-file-system` constam em `package.json`; o `metro.config.js` registra `pdf` como asset. Não foi conferida a compatibilidade dessas bibliotecas em cada sistema operacional.

**[A CONFIRMAR]** Resultado da execução em navegador, Android e iOS; conteúdo do PDF.
