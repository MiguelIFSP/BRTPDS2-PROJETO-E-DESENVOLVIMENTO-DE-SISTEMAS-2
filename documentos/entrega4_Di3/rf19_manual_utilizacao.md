# RF19 — Disponibilizar o manual de utilização

```text
Incremento: Entrega 4 — Di3
Escopo: RF19 — disponibilizar o manual de utilização
Branch: main
Commit: c45226bd62a95c97cf51ea41140678243b56806d
Data de revisão: 2026-11-13
Responsável(eis): Miguel Augusto Baptista
Estado: Parcial (implementado; sem testes de interface ou de download)
Fontes: sistema/better-meet/src/utils/downloadManualUsuario.ts; sistema/better-meet/src/utils/firstAccessWelcome.ts; sistema/better-meet/src/utils/__tests__/firstAccessWelcome.test.ts; sistema/better-meet/src/components/PrimeiroAcessoDialog.tsx; sistema/better-meet/src/app/_layout.tsx; sistema/better-meet/src/app/usuario.tsx; sistema/better-meet/src/app/(tabs)/mais/index.tsx; sistema/better-meet/src/services/usuarioService.ts; sistema/better-meet/src/store/authStore.ts; sistema/better-meet/metro.config.js; sistema/better-meet/package.json; sistema/better-meet/jest.setup.ts; sistema/better-meet/assets/manual/Manual-do-Usuario-Better-Meet.pdf (só a existência; o conteúdo do PDF não foi lido)
```


## Descrição

O sistema deve disponibilizar ao usuário o manual de utilização do Better Meet em formato PDF, acessível pela seção de ajuda. No primeiro acesso após o cadastro, o sistema apresenta um aviso perguntando se o usuário deseja conhecer o funcionamento do sistema. Se aceitar, é direcionado à área do manual; se preferir não visualizar, o aviso é fechado sem impedir a navegação normal.

## Critérios de aceitação

1. Após o cadastro, quando a conta cadastrada entra no aplicativo, o sistema apresenta o aviso de boas-vindas (o cadastro não autentica a conta: depois dele o app redireciona ao login).
2. O aviso (título “Bem-vindo ao Better Meet!”) oferece as opções **“Sim, quero aprender”** e **“Não / Fechar”**.
3. Ao escolher **“Sim, quero aprender”**, o usuário é direcionado à área de ajuda e o botão de download recebe um destaque visual temporário.
4. Ao escolher **“Não / Fechar”**, tocar fora do cartão ou usar o botão voltar do sistema, o aviso é fechado e o usuário pode continuar usando o sistema.
5. O usuário pode acessar e baixar o manual posteriormente pela área de ajuda.
6. O arquivo disponibilizado é um PDF.
7. Se houver falha ao baixar ou salvar o arquivo, o sistema informa que a operação não foi concluída.

## Regras de negócio

- **RN-MU01:** A indicação de primeiro acesso é associada à conta criada.
- **RN-MU02:** O aviso é apresentado somente quando existe uma indicação pendente para a conta autenticada.
- **RN-MU03:** Qualquer forma de fechar o aviso remove a indicação pendente. A opção de aprender direciona à área do manual; a opção de fechar não redireciona.
- **RN-MU04:** A seção **Ajuda** da aba **Mais** disponibiliza o botão **“Baixar manual do usuário (PDF)”**.
- **RN-MU05:** O sistema informa o resultado da operação e não apresenta falha como sucesso.

## Observação de implementação

A indicação de primeiro acesso é armazenada localmente pelo aplicativo (`AsyncStorage`, chave `better-meet:first-access-welcome:<id da conta>`, valor `pending`) e não é sincronizada entre instalações ou navegadores. A disponibilização do PDF usa o arquivo `sistema/better-meet/assets/manual/Manual-do-Usuario-Better-Meet.pdf`, incluído no aplicativo (o Metro foi configurado para tratar `pdf` como asset). Se a gravação da indicação falhar no cadastro, o app apenas registra um aviso no console e o cadastro continua como sucesso; nesse caso o aviso não aparece.

O destaque temporário do botão é uma animação de borda com 4 pulsos (cerca de 1,1 s cada), acionada pelo parâmetro de rota `highlightManual=1`.

## Atores

Administrador (`Role.ADMIN`) e Usuário comum (`Role.USER`). O código não diferencia os papéis neste fluxo; ambos têm associação própria com o UC29 no diagrama.

## Persistência de dados

O manual não persiste dados no banco de dados. O fluxo não chama a API, não usa models Prisma nem cria tabela ou migration; por isso não há diagrama relacional (DER) nem dicionário de dados do banco para este requisito. Os únicos dados gravados ficam **fora do banco**, no armazenamento local do aplicativo (`AsyncStorage`):

| Armazenamento | Chave | Valor | Escrita | Leitura | Remoção |
|---|---|---|---|---|---|
| `AsyncStorage` do app | `better-meet:first-access-welcome:<userId>` | `pending` | `markFirstAccessWelcomePending`, em `UsuarioScreen`, após o cadastro | `isFirstAccessWelcomePending`, em `PrimeiroAcessoDialog` | `clearFirstAccessWelcomePending`, ao fechar ou aceitar o aviso |

O estado de tela (`manualFeedback`, `isDownloadingManual`, animação `pulse`, `welcomeUserId`) também não é persistido. Na gravação em Android e iOS, o PDF é gravado no diretório escolhido pelo usuário; isso é um arquivo no dispositivo, não um registro no banco.

## Diagramas e testes relacionados

- Casos de uso: [DCU-Manual.svg](Diagramas/DCU-Manual.svg) (UC29).
- Sequências: [DS-Acessar-Manual.svg](Diagramas/DS-Acessar-Manual.svg) (download) e [DS-Primeiro-Acesso-Manual.svg](Diagramas/DS-Primeiro-Acesso-Manual.svg) (cadastro, aviso e redirecionamento).
- Classes: [DC-Manual.svg](Diagramas/DC-Manual.svg); ver [diagrama_classes_manual.md](diagrama_classes_manual.md).
- Caso de uso detalhado: [uc29_acessar_baixar_manual.md](uc29_acessar_baixar_manual.md). Compatibilidade: [rnf49_compatibilidade_manual.md](rnf49_compatibilidade_manual.md).

| ID | Cenário | Arquivo | Status |
|---|---|---|---|
| CT-RF19-01 | A indicação fica pendente só para a conta que acabou de se cadastrar | `sistema/better-meet/src/utils/__tests__/firstAccessWelcome.test.ts` (Jest, `jest-expo`) | Existe no código; não executado nesta revisão |
| CT-RF19-02 | A indicação deixa de existir depois de limpar | O mesmo arquivo | Existe no código; não executado nesta revisão |
| CT-RF19-03 | Aviso, destaque do botão e download do PDF (Web, Android e iOS) | Nenhum teste automatizado localizado | Não executado |

## Divergências encontradas

| Item | Documento (versão anterior) | Código atual | Situação |
|---|---|---|---|
| Momento do aviso | Dava a entender que o aviso surge logo após o cadastro | O cadastro não autentica: mostra toast e leva ao login. O aviso aparece quando a conta cadastrada entra | Documento corrigido |
| Ator | UC29 citava “Usuário autenticado” | O guia proíbe esse ator; o fluxo vale para Administrador e Usuário comum | Documento corrigido |
| Formas de fechar | Só “Não / Fechar” | Tocar no fundo e o botão voltar também fecham e removem a indicação | Documento corrigido |
| Gravação nativa | Descrevia só a escolha do diretório e `File.write()` | Também reutiliza arquivo homônimo, cria o arquivo `application/pdf` se não existir e rejeita PDF vazio com erro | Documento corrigido |
| Falha na Web | Informava erro em qualquer falha | O código só detecta ausência de `document` ou de `asset.uri`; falha do navegador depois do `click()` não é detectada | Documento corrigido; limitação do código |
| Falha ao registrar a indicação | Não citada | O erro no cadastro é só `console.warn`; o aviso não aparece nessa conta | Documento corrigido |
| Testes | Nenhum citado | Há apenas `firstAccessWelcome.test.ts`; sem teste do diálogo, da tela Mais ou do download | Registrado |
| Documentação anterior do manual | [entrega3_Di2/manual_usuario.md](../entrega3_Di2/manual_usuario.md) e `testes_manual_usuario.md` | Não foram relidos nesta revisão; não alterados | Fora do escopo |

## Marcações restantes

- **[A CONFIRMAR]** O conteúdo e a atualidade do PDF `Manual-do-Usuario-Better-Meet.pdf` não foram lidos nesta revisão; só a existência e o nome do arquivo.
- **[A CONFIRMAR]** Execução dos testes e do fluxo nas três plataformas (ver RNF49).
