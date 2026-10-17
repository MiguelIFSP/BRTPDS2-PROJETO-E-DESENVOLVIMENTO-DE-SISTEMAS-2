# Relatório de alterações — Lista de presença

Data: 16/10/2026.

## O que foi entregue

Foi criada uma **prévia navegável da lista de presença**, conforme a orientação de usar mockups enquanto outro integrante desenvolve a entidade de reunião. Os dados são fictícios e ficam somente na memória da tela. Não há criação de reunião, envio de convite ou gravação de presença no banco.

A interface segue os componentes, a tipografia e os temas claro/escuro existentes no Better Meet. Comentários em português explicam o funcionamento dos exemplos, do histórico e dos pontos de integração futura.

## Como visualizar

1. Execute o aplicativo pelo procedimento já usado pelo projeto, em `sistema/better-meet/` (`npm start` ou `npm run web`). Mantenha as URLs públicas configuradas conforme o `.env.example` existente.
2. Entre com sua conta pelo fluxo normal do aplicativo.
3. Abra o menu lateral e selecione **Lista de presença (prévia)**.
4. Alterne entre **Versão 1 — Parcial** e **Versão 2 — Final**.
5. Digite observações opcionais e use **Gerar nova versão simulada**. Confirme no diálogo para acrescentar uma versão ao histórico da prévia.
6. No navegador, use **Copiar exemplo para compartilhar**. No celular, use **Compartilhar exemplo** para abrir o compartilhamento de texto do sistema.

Ao sair e voltar à tela, os exemplos iniciais são restaurados. A simulação não precisa de uma reunião real, mas o acesso ao aplicativo continua usando a autenticação existente. O texto compartilhado começa com “Prévia — dados fictícios”.

## Funcionamento da prévia

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

## Arquivos existentes que mudaram

| Arquivo                                               | Mudança                                                                                                                          |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `sistema/better-meet/src/app/_layout.tsx`             | Registro da rota `lista-presenca`, seguindo a navegação existente.                                                               |
| `sistema/better-meet/src/components/CustomDrawer.tsx` | Inclusão de um item no menu para abrir a prévia. Os demais itens e fluxos foram preservados.                                     |
| `sistema/api/package.json`                            | Substituição do script de teste vazio por Jest e inclusão de dependências de desenvolvimento para testar a consolidação isolada. |
| `sistema/api/package-lock.json`                       | Registro das dependências de teste. As versões dos pacotes que já existiam no lock foram preservadas.                            |

## Arquivos acrescentados

### Interface e simulação

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

### Consolidação preparada para receber os dados reais

Todos os caminhos abaixo são relativos a `sistema/api/`.

| Arquivo                                                | Responsabilidade                                                                                                                       |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `src/types/listaPresenca.ts`                           | Descreve os dados esperados de reunião, convidados, entradas/saídas e resultado consolidado. Não cria entidades no banco.              |
| `src/utils/consolidateListaPresenca.ts`                | Função pura que calcula status, duração e totais a partir dos dados recebidos. Não consulta o banco e não está registrada em endpoint. |
| `src/utils/__tests__/consolidateListaPresenca.test.ts` | Testa as regras de consolidação e dados inválidos.                                                                                     |
| `jest.config.js`                                       | Configura os testes ESM/TypeScript da API.                                                                                             |

O núcleo isolado já trata convidados aceitos e pendentes, exclui recusados, soma intervalos sem duplicar sobreposições e distingue listas parciais/finais. Ausência de saída fica explícita, sem inventar horário. Quando há atraso e saída antecipada, o status principal é “Saiu antes” e o atraso permanece indicado separadamente. Os detalhes estão no documento técnico.

### Documentação

- `documentos/entrega3_Di2/lista_presenca.md`: regras, explicações, requisitos, casos de uso, diagramas, plano de testes e proposta de integração. Distingue o mockup atual da implementação futura com banco e endpoints.
- `RELATORIO_LISTA_PRESENCA.md`: este relatório.

## Validações realizadas

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

## Próxima integração, quando os colegas entregarem os módulos

1. Confirmar os nomes e os tipos reais de reunião, convites, entradas e saídas com os responsáveis.
2. Adaptar os dados ao contrato de entrada da consolidação, sem duplicar os cadastros dos colegas.
3. Implementar persistência e endpoints de lista de presença, com autenticação e autorização no servidor, migration revisada e documentação OpenAPI.
4. Trocar a fonte de exemplos da tela pelo service HTTP e ligar o botão à tela de reunião real.
5. Validar concorrência de versões, permissões, persistência e desempenho em banco exclusivo de teste.

O nome “presidente” do anexo foi relacionado ao papel já existente `ADMINISTRADOR` da comissão, sem acrescentar papéis ao projeto. A autorização definitiva deve ser combinada com a equipe e conferida na API; a visibilidade de um botão não substitui essa proteção.

Não há exportação PDF nesta etapa. O compartilhamento atual é de texto de demonstração; o campo `urlArquivo` fica reservado no contrato futuro.

## Preservação do projeto

Nenhuma entidade, migration, tabela, endpoint existente, fluxo de autenticação ou módulo dos colegas foi removido ou substituído. `schema.prisma`, `server.ts`, Docker, monitoramento e gestão permanecem sem alterações nesta entrega. Comentários históricos anteriores foram preservados, inclusive no início de `CustomDrawer.tsx`.

Não houve commit, push, publicação ou alteração no banco de dados.
