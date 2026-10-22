# Relatório de alterações — Lista de presença

## Atualização em 21/10/2026 — revisão manual e preparação da integração

A parte de **Geração de Lista de Presença** passou a permitir marcação manual por participante, observações individuais, resumo de comparecimento, revisão de versões e exportação CSV, mantendo a estrutura existente. A entrega continua sendo um **mockup funcional com dados fictícios e histórico somente em memória**, conforme a orientação de deixar a integração com reuniões para o colega responsável.

O módulo de reuniões não foi criado. Também não foram criados cadastro de convites, registros reais de entrada/saída, models Prisma, tabelas, migrations, controllers ou endpoints de lista de presença. Os contratos e as funções isoladas descritos neste relatório preparam essa conexão sem duplicar a parte dos colegas.

### Alterações no fluxo da tela

1. A rota e o item **Lista de presença (prévia)** continuam os já existentes. A tela abre os mesmos exemplos parcial e final, com aviso de dados fictícios e de descarte ao sair e voltar.
2. O novo editor apresenta cada participante por nome, e-mail e papel e permite selecionar **Presente**, **Atrasado**, **Saiu antes**, **Ausente** ou **Sem resposta**. Os controles usam os componentes, os tokens de tema e a acessibilidade do projeto, incluindo seleção por rádio e identificação da pessoa pelo nome e e-mail.
3. Cada participante pode receber observação opcional de até 2.000 caracteres. A observação geral da versão selecionada é carregada no formulário, preservada quando a revisão altera apenas presenças e pode ser substituída ou limpa explicitamente.
4. O **Resumo da revisão** mostra pessoas incluídas na lista, presentes e percentual de adesão. Presente, Atrasado e Saiu antes contam como comparecimento, uma vez por pessoa. O denominador é o número de pessoas incluídas; recusados já foram excluídos pela consolidação. A lista vazia resulta em zero, sem divisão por zero.
5. **Salvar lista simulada** valida as informações e abre `ConfirmDialog`. Confirmar cria uma nova versão com base na versão selecionada, preservando as anteriores; cancelar mantém a revisão na tela.
6. Trocar de versão com alterações ainda não salvas pede confirmação de descarte. Cancelar conserva a revisão; confirmar abre a versão escolhida e carrega suas observações.
7. Compartilhar texto e exportar CSV usam exclusivamente a versão salva selecionada. Os botões ficam desabilitados enquanto há alterações pendentes, evitando compartilhar um resultado diferente do editor.
8. O parâmetro opcional `reuniaoId` é reconhecido apenas para apresentar o aviso de integração. Ele não carrega uma reunião real nem exibe o identificador na interface.

Ao sair e voltar à tela, o `useFocusEffect` restaura os dois exemplos iniciais. Não há gravação em banco, armazenamento persistente no aparelho ou sincronização entre dispositivos. A autenticação continua pelo fluxo já existente do aplicativo.

### Preservação dos registros e do histórico

As marcações manuais ficam em `ListaPresenca.marcacoes`, separadas de `ListaPresenca.snapshot`. O status mostrado para uma pessoa usa sua marcação manual quando existir e o status original nos demais casos. Essa revisão não modifica resposta a convite, entrada, saída, permanência, flags ou totais dos registros originais.

A versão salva mostra o status efetivo e identifica a marcação manual junto ao status dos registros e à observação individual. Os totais originais continuam identificados como **Nos registros**. Assim, uma presença conferida manualmente não inventa aceite de convite ou horário de participação.

O hook copia cabeçalho, membros, totais e marcações em objetos independentes. Ao revisar uma lista parcial, conserva seu tipo e o instante de geração do exemplo, sem apresentá-la como uma nova coleta dos registros. A revisão de outra pessoa preserva as marcações e observações já salvas na versão de origem. O fluxo demonstrativo anterior de geração pelo hook continua disponível; a tela usa o fluxo de revisão da versão selecionada.

### Compartilhamento e CSV

| Plataforma       | Texto da versão salva                                                        | CSV da versão salva                                                                                |
| ---------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Navegador        | Copia o texto para a área de transferência, com feedback de sucesso ou erro. | Baixa `lista-presenca-previa-v<versao>.csv` por `Blob`, link temporário e liberação da URL criada. |
| Aplicativo móvel | Abre o compartilhamento de texto do sistema.                                 | Abre o compartilhamento do sistema com o conteúdo CSV como texto; não cria arquivo CSV nativo.     |

As duas saídas identificam a demonstração e incluem as marcações salvas. O CSV contém cabeçalho da reunião, versão, autoria, observações gerais, dados das pessoas, status efetivo, observação individual e registros originais de participação.

O formato usa BOM UTF-8 para acentos, separador `;`, final de linha CRLF e escape de aspas, separadores e quebras de linha nas células. Textos que uma planilha poderia interpretar como fórmulas recebem proteção com apóstrofo, inclusive nomes, e-mails, cabeçalhos e observações. PDF, assinatura digital, envio automático de e-mail e link público continuam fora da entrega.

### Validação e núcleo de marcação preparados na API

- O contrato `MarcacaoPresenca` contém `usuarioId`, um dos cinco status existentes e `observacao` opcional. Não cria entidade de banco ou novo papel de usuário.
- Os schemas do app e da API validam identificadores positivos e seguros, status, texto livre com trim e limite de 2.000 caracteres, formato dos objetos e duplicidade. A validação com `stripUnknown: true` remove autoria, papel, snapshot, horários e outros campos fora do contrato.
- No app, `presencas` é opcional para preservar o contrato demonstrativo de geração. No schema de salvamento preparado na API, `presencas` é obrigatório e pode ser uma lista vazia. O futuro `POST` de geração automática precisa de validação própria das observações, sem exigir marcação manual.
- `applyMarcacoesPresenca(snapshot, anteriores, novas)` valida ambos os lotes antes de mesclar, rejeita pessoas externas, duplicidades e origem inválida e retorna cópias na ordem das pessoas da lista. Não consulta banco nem altera o snapshot. Os conflitos do núcleo usam `AppError(409, ...)`; não há endpoint expondo esse comportamento nesta etapa.
- A função de consolidação automática já existente permanece isolada e preservada. A revisão manual complementa seu resultado.

### Inventário completo desta atualização

Os caminhos abaixo correspondem às mudanças de 21/10/2026 em relação à versão já registrada no repositório. A entrega original de 16/10/2026 está preservada ao final. São **11 arquivos modificados, 10 arquivos acrescentados e 2 arquivos removidos da raiz**.

#### Arquivos modificados — 11

| Arquivo                                                                   | Alteração                                                                                                                                                                                               |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RELATORIO_LISTA_PRESENCA.md`                                             | Consolida o estado atual, inventário, fluxo manual, contratos, testes, limites e remoção das cópias da raiz, preservando a evidência anterior.                                                          |
| `documentos/entrega3_Di2/lista_presenca.md`                               | Atualiza regras RN-LP16 a RN-LP19, requisitos, casos de uso, contratos, diagramas e cenários de teste para marcação manual, adesão, versões e CSV. Separa recursos atuais das propostas de API e banco. |
| `sistema/better-meet/src/app/lista-presenca.tsx`                          | Coordena editor, resumo, observações, validação, confirmação de salvamento/descarte, bloqueio de compartilhamento com revisão pendente e exportação CSV por plataforma.                                 |
| `sistema/better-meet/src/components/presenca/ListaPresencaView.tsx`       | Apresenta resumo efetivo, marcações, observações individuais e status original, preservando horários e totais da origem.                                                                                |
| `sistema/better-meet/src/hooks/useListaPresencaPreview.ts`                | Revisa a versão selecionada em cópias independentes, mescla marcações, preserva/limpa observações conforme a entrada e devolve a versão inicial no reset.                                               |
| `sistema/better-meet/src/hooks/__tests__/useListaPresencaPreview.test.ts` | Acrescenta cenários de revisão parcial, independência dos snapshots, seleção da origem, preservação de marcações/observações e limpeza explícita.                                                       |
| `sistema/better-meet/src/schemas/listaPresencaSchema.ts`                  | Acrescenta validação de marcações, status, identificadores seguros, observação individual e duplicidade, mantendo observações gerais.                                                                   |
| `sistema/better-meet/src/schemas/__tests__/listaPresencaSchema.test.ts`   | Verifica normalização, remoção de campos externos, cinco status, identificadores, duplicidades e limites das observações.                                                                               |
| `sistema/better-meet/src/services/listaPresencaService.ts`                | Acrescenta `marcacoes` à versão, `presencas` ao corpo de dados e o método `save` por `PUT`; preserva consulta `GET` e geração `POST`.                                                                   |
| `sistema/better-meet/src/services/__tests__/listaPresencaService.test.ts` | Verifica o contrato preparado de salvamento e o envio das marcações com o cliente HTTP simulado.                                                                                                        |
| `sistema/better-meet/src/utils/listaPresenca.ts`                          | Inclui resumo, status efetivo, identificação da marcação manual e observação individual no texto compartilhado.                                                                                         |

#### Arquivos acrescentados — 10

| Arquivo                                                                              | Responsabilidade                                                                                                                                       |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `sistema/better-meet/src/components/presenca/ListaPresencaEditor.tsx`                | Editor reutilizável controlado por props, com os cinco status, observação individual e erros por campo.                                                |
| `sistema/better-meet/src/components/presenca/__tests__/listaPresencaEditor.test.tsx` | Cenários de identificação, seleção, preservação das observações, editor controlado, desabilitação, ordem dos erros e lista vazia.                      |
| `sistema/better-meet/src/components/presenca/__tests__/listaPresencaScreen.test.tsx` | Cenários de salvar nova versão, preservar histórico, confirmar descarte, rejeitar observação inválida e bloquear compartilhamento da revisão pendente. |
| `sistema/better-meet/src/utils/marcacoesPresenca.ts`                                 | Tipos de marcação/resumo e funções puras de status efetivo, adesão, mesclagem imutável e formatação CSV.                                               |
| `sistema/better-meet/src/utils/__tests__/marcacoesPresenca.test.ts`                  | Cenários de resumo, marcação sem alteração da origem, mesclagem, rejeição de pessoas/duplicidades e CSV com escape e proteção contra fórmulas.         |
| `sistema/api/src/types/marcacaoPresenca.ts`                                          | Tipo de marcação manual e conjunto dos cinco status, independente de Prisma e reuniões reais.                                                          |
| `sistema/api/src/schemas/listaPresencaSchema.ts`                                     | Schema Yup preparado para o futuro controller de salvamento, com `presencas` e observações gerais.                                                     |
| `sistema/api/src/schemas/__tests__/listaPresencaSchema.test.ts`                      | Testes de normalização, campos externos, listas vazias, identificadores/status, duplicidade e limites dos textos.                                      |
| `sistema/api/src/utils/applyMarcacoesPresenca.ts`                                    | Núcleo puro de validação e mesclagem de marcações, sem aplicação parcial ou alteração dos registros originais.                                         |
| `sistema/api/src/utils/__tests__/applyMarcacoesPresenca.test.ts`                     | Testes de atualização por pessoa, ordem, imutabilidade, participantes externos, duplicidades, status inválidos e origem inválida.                      |

#### Arquivos removidos da raiz — 2

| Arquivo                  | Escopo da remoção solicitada                                                           |
| ------------------------ | -------------------------------------------------------------------------------------- |
| `GUIA_DE_CODIFICACAO.md` | Remove a cópia da raiz do projeto. A cópia `sistema/GUIA_DE_CODIFICACAO.md` permanece. |
| `PROMPT_AGENTES_IA.md`   | Remove a cópia da raiz do projeto. A cópia `sistema/PROMPT_AGENTES_IA.md` permanece.   |

Os padrões existentes foram usados na implementação. Não foram criadas cópias de regras por ferramenta. Os `AGENTS.md` dos subsistemas permanecem.

### Como visualizar e conferir o fluxo atual

1. Em `sistema/better-meet/`, use o procedimento habitual (`npm start` ou `npm run web`) com as variáveis públicas do `.env.example` configuradas. Entre pelo login existente e abra **Lista de presença (prévia)** no menu.
2. Confira as versões **Parcial** e **Final**, seus horários, totais e observações. A versão final inicial tem quatro pessoas na lista, duas com comparecimento e 50% de adesão.
3. No editor, altere uma presença e escreva observações individuais e gerais. Confira o resumo da revisão e os botões de compartilhamento desabilitados enquanto houver alteração.
4. Use **Salvar lista simulada**. Cancelar conserva o formulário; confirmar acrescenta uma nova versão. Confira nela a marcação manual, a observação individual e os horários originais, e reabra a versão anterior para verificar que foi preservada.
5. Faça outra revisão alterando somente uma pessoa. A observação geral da versão de origem deve continuar preenchida. Limpe-a explicitamente, salve e confirme que a versão nova fica sem observações gerais e a anterior mantém o texto.
6. Com uma revisão pendente, tente abrir outra versão. Cancelar o descarte mantém a revisão; **Descartar e trocar** abre a versão escolhida com suas observações.
7. Com a revisão salva, copie/compartilhe o texto e exporte CSV no navegador. Confira acentos, observações, separação entre marcação e registros originais e o aviso de dados fictícios. No celular, confira o compartilhamento textual do sistema.
8. Saia e volte à tela: os dois exemplos iniciais reaparecem e as versões temporárias são descartadas. Confira os temas claro/escuro e a navegação pelos controles acessíveis.

Esse roteiro é uma conferência manual reproduzível, não uma afirmação de teste em aparelho físico. A prévia não exige iniciar a API de lista de presença, pois não existe rota real ligada a ela.

### Contratos disponíveis para o colega integrar

| Ponto              | Contrato preparado                                                                                                | Situação atual                                                               |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Consolidação       | `consolidateListaPresenca(fonte, geradoEm)` recebe reunião, convidados e sessões e produz o snapshot consolidado. | Função pura existente, sem banco ou endpoint.                                |
| Edição             | `ListaPresencaEditor` recebe membros, marcações, erros e `onChange`.                                              | Componente reutilizável sem HTTP próprio.                                    |
| Revisão            | `ListaPresenca.marcacoes` complementa `snapshot`; entrada usa `{ presencas, observacoes? }`.                      | Tipos, schemas e mesclagem disponíveis.                                      |
| Consulta           | `listaPresencaService.listByReuniao(token, reuniaoId)` prepara `GET /reunioes/:id/lista-presenca`.                | Método não chamado pela prévia; rota não implementada.                       |
| Geração automática | `listaPresencaService.generate(token, reuniaoId, data)` prepara `POST` no mesmo caminho.                          | Método reservado à fonte real dos colegas.                                   |
| Salvamento manual  | `listaPresencaService.save(token, reuniaoId, data)` prepara `PUT` no mesmo caminho.                               | Contrato preparado; persistência/versionamento real ainda não implementados. |

Os métodos usam o `apiRequest` único. A URL base existente já inclui `/api`, por isso o prefixo não é repetido nos caminhos do service. `presencas` é o nome na requisição e `marcacoes` é o nome armazenado no contrato da versão; essa diferença está documentada.

O colega precisa fornecer reunião, comissão, convidados/respostas e registros reais e adaptar esses dados aos contratos. A API integrada deve obter o autor da identidade autenticada, conferir autorização e pertencimento das pessoas à lista, persistir versões e documentar endpoints na OpenAPI. O papel “presidente” do roteiro continua relacionado ao `ADMINISTRADOR` da comissão já existente; não foi criado outro papel. A regra proposta também admite `ADMIN` da plataforma e precisa ser aplicada no servidor.

O mockup não comprova autorização real, concorrência, unicidade de versão em banco, disponibilidade de dados reais ou desempenho de uma API integrada. `urlArquivo` permanece reservado no contrato e não representa PDF implementado. O detalhamento técnico, diagramas e critérios de aceitação estão em [documentos/entrega3_Di2/lista_presenca.md](documentos/entrega3_Di2/lista_presenca.md).

### Verificações confirmadas em 21/10/2026

As verificações abaixo não usaram banco de desenvolvimento nem dados reais. Os números de 16/10/2026, preservados no histórico, não são usados como resultado desta atualização.

| Verificação                                                    | Evidência desta atualização                                                                                                              |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| API — `npm test`                                               | **70 testes aprovados em 3 suítes**: 39 da consolidação e 31 dos schemas/marcações manuais.                                              |
| API — `npm run lint`                                           | Aprovado.                                                                                                                                |
| API — `npm run typecheck`                                      | Aprovado com o cliente Prisma gerado a partir do schema existente.                                                                       |
| API — `npm run prisma:generate`                                | Aprovado. Gera somente o cliente local; não aplica migrations nem altera o banco.                                                        |
| App — `npm test -- --runInBand --testTimeout=30000`            | **120 testes aprovados em 13 suítes**, incluindo a interface, o editor, o histórico e os testes que já existiam.                         |
| App — `npm run lint`                                           | Aprovado.                                                                                                                                |
| App — `npm run typecheck`                                      | Aprovado após a regeneração automática do cache de rotas pelo Expo.                                                                      |
| API — conferência auxiliar do núcleo                           | 48 asserções aprovadas em execução auxiliar, sem HTTP ou banco. Não substitui a suíte Jest.                                              |
| App — utilitários de marcação/CSV                              | 18 casos executados em harness auxiliar Node/TypeScript. Essa evidência é do núcleo puro; não é execução das suítes Jest de tela/editor. |
| Prettier nos arquivos de implementação alterados/acrescentados | Aprovado.                                                                                                                                |
| `git diff --check`                                             | Aprovado.                                                                                                                                |

As suítes Jest novas e ampliadas do app incluem tela, editor, hook, schema, service e utilitários. A execução completa passou. Foi usado o limite de 30 segundos por teste somente no comando de validação, porque a compilação e a primeira renderização no ambiente local excederam o padrão de 5 segundos; a configuração do projeto e as asserções foram preservadas. O teste da tela também foi repetido isoladamente após o ajuste das importações de tipos, com seus quatro cenários aprovados, já incluídos no total de 120.

Para reproduzir as verificações formais de cada subsistema após instalar as dependências previstas nos respectivos lockfiles:

```powershell
cd sistema/api
npm test
npm run typecheck
npm run lint
```

```powershell
cd sistema/better-meet
npm test -- --runInBand --testTimeout=30000
npm run typecheck
npm run lint
```

Os comandos acima são instruções de reprodução. A tabela registra somente resultados confirmados nesta atualização. As tentativas e restaurações locais de dependências não alteraram `package.json`, `package-lock.json` ou as versões declaradas no código-fonte.

As dependências locais foram restauradas com `npm ci`; o cliente Prisma foi gerado e o Expo atualizou automaticamente `.expo/types/router.d.ts`, que ainda listava rotas antigas. Esses artefatos ficam em pastas ignoradas pelo Git. Não foram editadas rotas à mão, desativadas opções de TypeScript ou aplicadas migrations. A aparência e o compartilhamento em aparelhos físicos e a exportação web não foram novamente verificados nesta atualização; as verificações de 16/10 permanecem registradas somente no histórico.

### Limites e preservação do projeto

Não houve alteração de `schema.prisma`, migrations, `server.ts`, rotas da API, autenticação, recuperação de senha, Docker, monitoramento ou gestão. `_layout.tsx`, `CustomDrawer.tsx`, os mocks originais, os tipos e o cálculo automático da consolidação fazem parte da base anterior e não foram alterados nesta atualização.

As exclusões solicitadas se limitam aos dois arquivos da raiz listados acima. Nenhum módulo dos colegas foi removido ou substituído. Os comentários anteriores foram preservados, inclusive o bloco inicial de `sistema/better-meet/src/components/CustomDrawer.tsx:1`. Não houve commit, push, publicação ou alteração no banco.

---

## Registro da entrega anterior

Data: 16/10/2026.

Este registro preserva o escopo e a evidência da primeira entrega. As instruções e os resultados desta seção são históricos: o botão de geração, a revisão da origem, a marcação manual e o CSV foram atualizados conforme a seção de 21/10/2026 acima.

### O que foi entregue

Foi criada uma **prévia navegável da lista de presença**, conforme a orientação de usar mockups enquanto outro integrante desenvolve a entidade de reunião. Os dados são fictícios e ficam somente na memória da tela. Não há criação de reunião, envio de convite ou gravação de presença no banco.

A interface segue os componentes, a tipografia e os temas claro/escuro existentes no Better Meet. Comentários em português explicam o funcionamento dos exemplos, do histórico e dos pontos de integração futura.

### Como visualizar

1. Execute o aplicativo pelo procedimento já usado pelo projeto, em `sistema/better-meet/` (`npm start` ou `npm run web`). Mantenha as URLs públicas configuradas conforme o `.env.example` existente.
2. Entre com sua conta pelo fluxo normal do aplicativo.
3. Abra o menu lateral e selecione **Lista de presença (prévia)**.
4. Alterne entre **Versão 1 — Parcial** e **Versão 2 — Final**.
5. Digite observações opcionais e use **Gerar nova versão simulada**. Confirme no diálogo para acrescentar uma versão ao histórico da prévia.
6. No navegador, use **Copiar exemplo para compartilhar**. No celular, use **Compartilhar exemplo** para abrir o compartilhamento de texto do sistema.

Ao sair e voltar à tela, os exemplos iniciais são restaurados. A simulação não precisa de uma reunião real, mas o acesso ao aplicativo continua usando a autenticação existente. O texto compartilhado começa com “Prévia — dados fictícios”.

### Funcionamento da prévia

| Parte           | O que demonstra                                                                              |
| --------------- | -------------------------------------------------------------------------------------------- |
| Aviso de prévia | Identifica pessoas, datas, registros e papel administrativo como simulação.                  |
| Cabeçalho       | Organização, comissão, título, início/fim, local/plataforma, versão e situação.              |
| Tabela          | Nome, e-mail, papel, entrada, saída, permanência e status por pessoa.                        |
| Lista parcial   | Exemplifica a reunião em andamento, com saída pendente e tempo até a geração.                |
| Lista final     | Exemplifica presença completa, saída antecipada com atraso, ausência e convite sem resposta. |
| Totais          | Apresenta convites aceitos, sem resposta e quantidades de cada status.                       |
| Observações     | Texto opcional com validação e limite de 2000 caracteres.                                    |
| Histórico       | Mantém as versões anteriores durante a visita à tela, sem sobrescrevê-las.                   |
| Rodapé          | Nome de quem gerou, data de geração, observações e espaço visual de assinatura.              |

Cada nova versão simulada copia o cenário final de exemplo e recebe suas próprias observações. Isso demonstra o fluxo visual de versionamento; não representa uma nova consulta a registros reais. O relógio do exemplo é fixo para manter a demonstração reproduzível.

### Arquivos existentes que mudaram

| Arquivo                                               | Mudança                                                                                                                          |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `sistema/better-meet/src/app/_layout.tsx`             | Registro da rota `lista-presenca`, seguindo a navegação existente.                                                               |
| `sistema/better-meet/src/components/CustomDrawer.tsx` | Inclusão de um item no menu para abrir a prévia. Os demais itens e fluxos foram preservados.                                     |
| `sistema/api/package.json`                            | Substituição do script de teste vazio por Jest e inclusão de dependências de desenvolvimento para testar a consolidação isolada. |
| `sistema/api/package-lock.json`                       | Registro das dependências de teste. As versões dos pacotes que já existiam no lock foram preservadas.                            |

### Arquivos acrescentados

#### Interface e simulação

Todos os caminhos abaixo são relativos a `sistema/better-meet/`.

| Arquivo                                                    | Responsabilidade                                                                                                                |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/lista-presenca.tsx`                               | Coordena a prévia, formulário, confirmação, seleção de versões e compartilhamento.                                              |
| `src/components/presenca/ListaPresencaView.tsx`            | Renderiza cabeçalho, tabela e rodapé usando os componentes existentes.                                                          |
| `src/components/presenca/ListaPresencaButton.tsx`          | Botão preparado para a futura tela de reunião; demonstra a visibilidade pelos papéis existentes e, por enquanto, abre a prévia. |
| `src/hooks/useListaPresencaPreview.ts`                     | Mantém versões e seleção apenas em memória e restaura os exemplos no foco da tela.                                              |
| `src/mocks/listaPresencaMock.ts`                           | Fornece os exemplos fictícios parcial/final e cópias independentes para novas versões.                                          |
| `src/schemas/listaPresencaSchema.ts`                       | Valida e normaliza observações.                                                                                                 |
| `src/utils/listaPresenca.ts`                               | Formata datas, duração, rótulos e texto para compartilhamento.                                                                  |
| `src/services/listaPresencaService.ts`                     | Define os tipos e as chamadas HTTP previstas para a integração futura. **A tela de prévia não chama esses métodos.**            |
| `src/components/presenca/__tests__/listaPresenca.test.tsx` | Verifica a apresentação da lista e a visibilidade do botão por papel.                                                           |
| `src/hooks/__tests__/useListaPresencaPreview.test.ts`      | Verifica versões, seleção, restauração e independência dos exemplos.                                                            |
| `src/schemas/__tests__/listaPresencaSchema.test.ts`        | Verifica observações, espaços e limite de tamanho.                                                                              |
| `src/services/__tests__/listaPresencaService.test.ts`      | Verifica os caminhos e parâmetros preparados para a futura API, com cliente HTTP simulado.                                      |

#### Consolidação preparada para receber os dados reais

Todos os caminhos abaixo são relativos a `sistema/api/`.

| Arquivo                                                | Responsabilidade                                                                                                                       |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `src/types/listaPresenca.ts`                           | Descreve os dados esperados de reunião, convidados, entradas/saídas e resultado consolidado. Não cria entidades no banco.              |
| `src/utils/consolidateListaPresenca.ts`                | Função pura que calcula status, duração e totais a partir dos dados recebidos. Não consulta o banco e não está registrada em endpoint. |
| `src/utils/__tests__/consolidateListaPresenca.test.ts` | Testa as regras de consolidação e dados inválidos.                                                                                     |
| `jest.config.js`                                       | Configura os testes ESM/TypeScript da API.                                                                                             |

O núcleo isolado já trata convidados aceitos e pendentes, exclui recusados, soma intervalos sem duplicar sobreposições e distingue listas parciais/finais. Ausência de saída fica explícita, sem inventar horário. Quando há atraso e saída antecipada, o status principal é “Saiu antes” e o atraso permanece indicado separadamente. Os detalhes estão no documento técnico.

#### Documentação

- `documentos/entrega3_Di2/lista_presenca.md`: regras, explicações, requisitos, casos de uso, diagramas, plano de testes e proposta de integração. Distingue o mockup atual da implementação futura com banco e endpoints.
- `RELATORIO_LISTA_PRESENCA.md`: este relatório.

### Validações realizadas

Ambiente: Node.js 22.17.1. Os testes não usaram banco de desenvolvimento nem dados reais.

| Verificação                                   | Resultado em 16/10/2026                                                           |
| --------------------------------------------- | --------------------------------------------------------------------------------- |
| API — `npm test`                              | **39 testes aprovados**, em uma suíte de consolidação.                            |
| API — `npm run typecheck`                     | Aprovado.                                                                         |
| API — `npm run lint`                          | Aprovado.                                                                         |
| Aplicativo — `npm test -- --runInBand`        | **64 testes aprovados**, em 10 suítes, incluindo as suítes que já existiam.       |
| Aplicativo — `npm run lint`                   | Aprovado.                                                                         |
| Prettier dos arquivos acrescentados/alterados | Aprovado.                                                                         |
| Aplicativo — exportação Expo para web         | Aprovada; `/lista-presenca` consta entre as 14 rotas exportadas.                  |
| Aplicativo — `npm run typecheck`              | Um erro anterior em `src/utils/__tests__/apiClient.test.ts:16`, explicado abaixo. |

O erro `TS2322` do aplicativo é uma incompatibilidade de tipos no mock de `global.fetch` de um teste existente. A conferência do código original, usando as mesmas dependências e sem os arquivos novos, reproduziu exatamente esse único erro. Esse teste foi preservado para respeitar o limite de não modificar a parte dos colegas. As suítes Jest passam, e a exportação web também concluiu.

Para reproduzir a exportação em uma sessão PowerShell sem `.env`, foram usadas somente URLs públicas locais, sem iniciar APIs:

```powershell
cd sistema/better-meet
$env:EXPO_PUBLIC_API_URL = 'http://localhost:3333/api'
$env:EXPO_PUBLIC_MONITORING_API_URL = 'http://localhost:3334/monitoring-better-meet'
npx --no-install expo export --platform web
```

Os arquivos gerados em `dist/` e as dependências em `node_modules/` são artefatos locais ignorados pelo Git. A exportação valida a compilação; o compartilhamento nativo e a aparência em aparelho físico ainda precisam de conferência manual.

### Próxima integração, quando os colegas entregarem os módulos

1. Confirmar os nomes e os tipos reais de reunião, convites, entradas e saídas com os responsáveis.
2. Adaptar os dados ao contrato de entrada da consolidação, sem duplicar os cadastros dos colegas.
3. Implementar persistência e endpoints de lista de presença, com autenticação e autorização no servidor, migration revisada e documentação OpenAPI.
4. Trocar a fonte de exemplos da tela pelo service HTTP e ligar o botão à tela de reunião real.
5. Validar concorrência de versões, permissões, persistência e desempenho em banco exclusivo de teste.

O nome “presidente” do anexo foi relacionado ao papel já existente `ADMINISTRADOR` da comissão, sem acrescentar papéis ao projeto. A autorização definitiva deve ser combinada com a equipe e conferida na API; a visibilidade de um botão não substitui essa proteção.

Não há exportação PDF nesta etapa. O compartilhamento atual é de texto de demonstração; o campo `urlArquivo` fica reservado no contrato futuro.

### Preservação do projeto

Nenhuma entidade, migration, tabela, endpoint existente, fluxo de autenticação ou módulo dos colegas foi removido ou substituído. `schema.prisma`, `server.ts`, Docker, monitoramento e gestão permanecem sem alterações nesta entrega. Comentários históricos anteriores foram preservados, inclusive no início de `CustomDrawer.tsx`.

Não houve commit, push, publicação ou alteração no banco de dados.
