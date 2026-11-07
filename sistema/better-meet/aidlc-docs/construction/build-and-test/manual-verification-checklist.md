# Lista de verificação manual - migração para o Expo SDK 58

Cobre o que os testes automáticos **não** cobrem: `AppGate`, `NativeTabs`, a raiz de navegação, os gestos reais, o teclado e o comportamento nativo. Marque cada item com `[x]` (ok) ou anote o problema ao lado. Faça em **iOS e Android**, em **Expo Go** e em **development build** (decisão do usuário).

## Preparação
- [ ] Expo Go atualizado para a versão que suporta o **SDK 58** (o novo Expo Go só suporta o SDK 58).
- [ ] Development build **novo** gerado a partir desta branch (o do SDK 57 não serve), pelo mesmo caminho que a equipe já usa.
- [ ] `.env` preenchido e as 3 APIs no ar (ver `integration-test-instructions.md`).
- [ ] `npm ci` e `npx expo start` sem erros no terminal.

Registre: aparelho/SO: ____________  | Expo Go ou dev build: ____________

## A. Abertura e login
- [ ] A splash aparece (clara e escura, conforme o tema do aparelho) e some quando as fontes carregam.
- [ ] Sem sessão, o app abre no login (o `AppGate` redireciona).
- [ ] Login funciona; com sessão salva, reabrir o app entra direto, sem piscar o login.
- [ ] Cadastro e "recuperar senha" abrem sem login prévio.
- [ ] Sair (logout) volta ao login.

## B. Navegação e abas (`NativeTabs`, Router 58)
- [ ] As 4 abas aparecem com rótulo sempre visível: Reuniões, Organizações, Comissões, Mais.
- [ ] Ícones: SF Symbols no iOS; Material Symbols no Android (calendário, prédio, grupos, mais).
- [ ] Cores da aba selecionada e não selecionada seguem o tema; o indicador no Android aparece.
- [ ] Em cada aba, abrir um detalhe empilha sobre a lista, e "Voltar" desempilha.
- [ ] Abrir um detalhe por link direto (`bettermeet://...`) deixa a lista por baixo.
- [ ] Trocar de aba e voltar mantém a pilha de cada aba.

## C. Notificações e gestos (`gesture-handler 3`)
- [ ] O sino do cabeçalho abre a aba Reuniões com os convites pendentes (usa `router.navigate` com parâmetro).
- [ ] A lista de avisos abre no painel (BottomSheet) e mostra os avisos.
- [ ] **Arrastar um aviso para a esquerda remove**; **para a direita remove**; soltar antes do limite volta ao lugar.
- [ ] O X de cada aviso remove.
- [ ] "Limpar todas" pede um segundo toque e então limpa.
- [ ] No Android, os gestos funcionam **dentro do painel** (Modal) e não travam a rolagem.

## D. Reuniões
- [ ] Criar reunião: o seletor de data e o de hora abrem e gravam o valor escolhido (iOS e Android).
- [ ] Editar e excluir reunião.
- [ ] Convidar membros, aceitar e recusar um convite.
- [ ] Check-in e check-out.
- [ ] Gerar, salvar e consultar a lista de presença.

## E. Formulários e teclado (`KeyboardAwareScrollView`, `TextField`)
- [ ] Ao focar um campo no fim da tela (login, cadastro, perfil), a tela rola e o campo fica acima do teclado.
- [ ] Trocar de campo com o teclado aberto mantém o campo visível.
- [ ] Campos dentro de um painel (BottomSheet) também ficam visíveis.
- [ ] O botão de mostrar e ocultar senha funciona.

## F. Tema
- [ ] Alternar claro, escuro e sistema (onde a preferência de tema estiver na interface): o app muda na hora, sem fechar.
- [ ] No Android, escolher "sistema" não derruba o app.
- [ ] Fechar e reabrir mantém a escolha.
- [ ] Barras e fundo (incluindo a splash) estão coerentes com o tema.

## G. Organizações, comissões, relatórios e status
- [ ] Listar e abrir organizações e comissões; adicionar e remover membro; mudar papel.
- [ ] Relatórios abrem (`Mais > Relatórios`, incluindo usuários) sem erro.
- [ ] Tela de status carrega; como ADMIN, pedir uma checagem e usar start, stop ou restart.
- [ ] Excluir conta (fluxo com sucessores) chega até o modal; **não confirme em conta real**.

## H. Desempenho e estabilidade
- [ ] Abertura, troca de abas, listas e o arrasto do aviso estão fluidos (sem regressão em relação ao SDK 57).
- [ ] Sem tela vermelha de erro e sem aviso amarelo novo no aparelho.
- [ ] Sem erros nem avisos de depreciação novos no terminal do Metro.

## Resultado
- Itens com falha (anote seção, item, plataforma e o que aconteceu):

  ____________________________________________

- Aprovado para commit e PR?  [ ] Sim  [ ] Não, depende de: ____________
