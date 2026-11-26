# Diagnóstico de presença e ata

- Data: 2026-11-25.
- Unidade: presenca-ata-final.
- Etapa: Inception — análise de requisitos com conferência do código existente.
- Referência: arquivos locais da branch finalGu, identificada por `.git/HEAD`; não foi possível consultar o diff porque `git` não está no PATH.
- Escopo: API de dados e app Better Meet. Sem alterações de implementação nesta etapa.
- Caminhos abaixo relativos a `sistema/`, salvo indicação contrária.

## 1. Presença: diagnóstico confirmado

| Ponto | Evidência | Comportamento atual |
|---|---|---|
| Horário inicial | `api/prisma/schema.prisma:233` | Não existe `dataInicio`. A reunião usa `data`, `horaInicio` e `horaFim`; o instante é calculado por `instanteNoFuso` com `TZ_REUNIOES`. |
| Entrada antecipada | `api/src/utils/fusoHorario.ts:57` e `api/src/services/reuniaoService.ts:537` | Tolerância de 15 minutos. O estado `CHECKIN_ABERTO` permite entrada antes do início. |
| Saída antecipada | `api/src/services/reuniaoService.ts:572` | A consulta nem seleciona data, início, fim ou status. Não verifica o início da reunião. |
| Saída sem entrada | `api/src/services/reuniaoService.ts:602` | Já recusa com 409. Repetir saída preserva o primeiro horário. |
| Repetição de entrada | `api/src/services/reuniaoService.ts:530` | Retorna o registro existente antes de validar a janela. A alteração precisa preservar idempotência sem permitir contornar a nova validação. |
| Interface | `better-meet/src/components/ReuniaoCheckIn.tsx` e `src/utils/janelaCheckIn.ts` | Repete a tolerância de 15 minutos; se já houver registro, mostra saída sem avaliar horário. O cálculo não possui atualização periódica própria. |
| Biometria e copiar código | `better-meet/package.json` | Não declara `expo-local-authentication` nem `expo-clipboard`. |
| Código de presença | `api/prisma/schema.prisma`, controllers e services de reunião | Não há campo, geração, exibição restrita ou validação do código. Entrar/sair não validam corpo com código. |
| Marcação pelo administrador | Rotas de reunião e `ReuniaoRegistro` | Não existem endpoints para marcar entrada/saída por outra pessoa nem autoria individual de cada marcação. |
| Prévia de lista | `better-meet/src/hooks/useListaPresencaPreview.ts` e `src/services/listaPresencaService.ts` | A prévia usa mocks em memória. Marcar a lista demonstrativa não cria presença no banco e não dá elegibilidade para votar na ata. |

## 2. Votação supostamente dependente do presidente

**O problema específico não foi reproduzido no código atual. Não há evidência para atribuir uma causa raiz definitiva ao relato.**

Constatações verificáveis:

1. `api/src/routes/ataRoutes.ts` aplica `requireAtaEditor` somente à edição. A rota de voto exige autenticação, sem exigir papel de presidente.
2. `ataService.loadAccess` exige vínculo atual com a comissão e `ReuniaoRegistro` da própria pessoa. Não depende de voto, entrada ou autorização anterior do presidente.
3. `api/src/services/ataService.ts:93` libera voto quando existe conteúdo salvo e a ata não está exportada. `vote`, na linha 151, não consulta voto do presidente.
4. `api/tests/ata.test.mjs:384` começa com zero votos, define o papel como `MEMBRO` e recebe 200 no primeiro voto. Esse teste passou nesta análise.
5. O teste de componente “integrante comum vota quando a API autoriza” também passou.

Há fatores de interface que merecem regressões específicas, sem tratá-los como causa comprovada do relato:

- A tela de ata carrega ao ganhar foco e ao pedir atualização. Uma pessoa que já está nela não recebe automaticamente o texto recém-salvo por outra pessoa: `better-meet/src/app/(tabs)/(reunioes)/ata/[id].tsx`.
- `AtaReuniao.tsx:37` inicializa o rascunho a partir das props uma vez; `:49` calcula `dirty` para todos os papéis. Se o conteúdo recebido mudar sem remontagem, até um leitor pode ser considerado portador de alteração local e ter o voto desabilitado. O recarregamento atual remonta o componente; portanto essa hipótese não comprova o relato original.
- A presença da prévia demonstrativa não é a presença persistida exigida pela API.
- Os mocks de alguns testes do app combinam `exportada: true` com `podeEditar/podeVotar: true`, estado que a API não deveria produzir. Esses casos devem ser corrigidos para representar estados reais.

Na implementação, acrescentar cenários com dois participantes e presidente sem voto, atualização do texto remoto, nenhum voto anterior, reprovação como primeiro voto e presença persistida/manual. Se o comportamento relatado depender de outra versão ou de uma sequência de uso não coberta, registrar essa limitação em vez de declarar uma causa inventada.

## 3. Aprovação e exportação

| Ponto | Diagnóstico |
|---|---|
| Regra existente | `ataAprovada`, em `api/src/services/ataService.ts:13`: aprovações maiores que metade dos registros de presença, para a versão atual. A metade exata não aprova. |
| Bloqueio de PDF | Já existe na API (`exportar`, 409) e no botão do app (`podeExportar`). Testes correspondentes passaram. |
| Controle persistido | `Reuniao` já contém `ataExportadaAt` e `ataVersaoExportada`. Não criar campos equivalentes duplicados. |
| Trava sequencial | `save` e `vote` já retornam 409 quando a leitura encontra `ataExportadaAt`. Os testes sequenciais passaram. |
| Ordem da exportação | `AtaReuniao.tsx:132` chama a API para travar antes de `exportAtaPdf`, na linha 135. Se gerar/compartilhar falhar, a ata continua travada sem PDF concluído. |
| Concorrência | Os `updateMany` de `save` e `vote` condicionam por id/versão, sem `ataExportadaAt: null`. Exportar não incrementa `versaoAta`. Logo, uma operação que leu a ata antes da exportação pode escrever depois dela. Achado por inspeção; os testes existentes não simulam essa intercalação. |
| Aprovação concorrente | `exportar` conta votos antes da escrita que trava a reunião. É necessário serializar a verificação com votos/edições e com alterações de presença que afetem o denominador. |
| Mensagem contraditória | `AtaReuniao.tsx:234` mostra “Você pode alterá-lo.” sempre que existe voto, inclusive depois da exportação. |
| Exportação no navegador | `ataPdf.web.ts` usa `window.print()`. O retorno/`afterprint` não comprova que o usuário salvou ou imprimiu o documento. O fluxo deve diferenciar preparação, confirmação e falha. |

## 4. Verificação executada

| Subsistema | Suítes | Resultado |
|---|---|---|
| API | `tests/ata.test.mjs`, `tests/reuniaoCheckIn.test.mjs` | 96 testes aprovados, 2 suítes, código de saída 0. |
| App | `src/components/__tests__/AtaReuniao.test.tsx`, `src/components/__tests__/ReuniaoCheckIn.test.tsx` | 39 testes aprovados, 2 suítes, código de saída 0. |

API executada via `runCLI` do Jest, com a configuração existente exceto `globalSetup`, `cache: false`, `runInBand` e caminhos explícitos. A remoção de `globalSetup` foi somente na configuração em memória: evita o `migrate deploy` do banco de testes durante este diagnóstico. As duas suítes simulam Prisma/autenticação; nenhum banco foi utilizado.

App executado com:

```text
node node_modules/jest/bin/jest.js --runInBand --no-cache --runTestsByPath src/components/__tests__/AtaReuniao.test.tsx src/components/__tests__/ReuniaoCheckIn.test.tsx
```

Esses 135 testes validam o comportamento atual, não os requisitos novos. Não houve execução do aplicativo, teste em aparelho, migração, lint, typecheck ou validação geral do SDK nesta etapa.

## 5. Documentação que a implementação afetará

- RFs/casos de uso de presença: início permitido, código, autenticação local, marcação por administrador e repetição sem alterar horários.
- `documentos/entrega2_Di1/testes_presenca_reuniao.md`: atualmente diz que o corpo é ignorado. Atualizar o contrato e adicionar cenários negativos e concorrentes.
- RF16 e UC17–UC20, descritos em `documentos/entrega4_Di3/ata_reuniao.md`: voto independente, cálculo de maioria, exportação e finalização da versão.
- RNF44/RNF45 e requisitos de segurança, compatibilidade e acessibilidade: biometria/fallback, SDK 58, proteção do código e consistência das transações.
- `documentos/entrega4_Di3/testes_ata_reuniao.md`: primeiro voto de participante, atualização remota, exportação negada, falha de PDF e disputa entre voto/edição/exportação.
- `documentos/entrega4_Di3/dados_ata_reuniao.md`, dicionário geral e diagrama relacional: campos de presença e auditoria; reutilização dos campos de exportação.
- Diagramas UML de casos de uso, classes e sequência: participante, administrador da comissão, confirmação local, validação do código, registro manual e finalização. Classes e métodos devem corresponder ao código final.
- `api/docs/openapi.yaml`: corpos, permissões, respostas e novos endpoints; `documentos/consolidado/softwares_e_licencas.md`: dependências adicionadas.
- Manual e registro de testes da entrega final: instruções para código/biometria e evidências reais em Android, iOS e web. Os documentos de AI-DLC não substituem os documentos da entrega.

## 6. Referências técnicas consultadas

- [LocalAuthentication no Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/local-authentication/): instalação, autenticação, fallback e configuração Face ID.
- [Clipboard no Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/clipboard/): copiar o código nas plataformas suportadas.

Face ID exige build de desenvolvimento no iOS; não é validado pelo Expo Go. A confirmação web será explícita e não será apresentada como biometria.

## 7. Implementação e verificação — 26/11/2026

A solicitação posterior do usuário autorizou executar diretamente as correções, dispensando os checkpoints de planejamento. As seções anteriores preservam o diagnóstico da análise inicial; não descrevem o estado final do código.

### Alterações entregues

- Presença própria exige início atingido no fuso da reunião, vínculo/convite válidos e código de seis dígitos. O horário é do servidor. Saída sem entrada é recusada. Repetições preservam horários e autoria.
- Código criptograficamente aleatório na criação; reuniões antigas podem receber código pela ação do administrador. Consulta e renovação são restritas ao ADMINISTRADOR atual da comissão; o papel global ADMIN não concede esse acesso.
- Entrada e saída manuais para outros participantes, por administrador da comissão, sem código/biometria do participante e com auditoria separada de entrada/saída. Correções após o término são permitidas. Novas presenças são recusadas depois da finalização, pois alterariam o denominador da maioria.
- App solicita PIN em ConfirmDialog e autenticação local. No aparelho, permite biometria ou senha nativa; cancelamento/falha não envia requisição. Sem credencial local, orienta configurar o aparelho ou recorrer ao administrador. No navegador, usa confirmação explícita. Biometria não é coletada nem enviada à API.
- Botões de presença atualizam com o relógio e ficam desabilitados antes do início, com horário visível. Administrador recebe card de código, copiar/renovar e ações por participante; a lista usa registros persistidos.
- A votação continua sem qualquer dependência do presidente. Corrigidos o estado de rascunho indevido de leitores e a falta de atualização com a tela aberta. Texto/votos são consultados a cada cinco segundos enquanto a tela tem foco; rascunhos locais são preservados e divergência de versão exige atualização.
- Aprovação segue a regra existente: mais da metade dos presentes aprovou a versão atual. O cliente usa a decisão do servidor. PDF é bloqueado antes da aprovação. A geração precede a finalização; no navegador há confirmação de que o PDF foi salvo/impresso.
- A confirmação de exportação exige a versão utilizada no arquivo. Voto, edição, finalização e registros de presença usam bloqueio da mesma reunião dentro da transação. Finalização impede novas edições/votos; o app mostra badge e bloqueia ações.
- OpenAPI e catálogo de licenças atualizados. Dependências adicionadas: expo-local-authentication 58.0.3 e expo-clipboard 58.0.4.

A causa específica do relato “só vota depois do presidente” continua sem reprodução comprovada. Há regressões automatizadas para aprovação/reprovação como primeiro voto, chegada de texto remoto e aprovação por membros enquanto o presidente permanece sem voto. Isso não transforma as hipóteses iniciais em causa raiz comprovada.

### Banco e migração

Migration: `api/prisma/migrations/20261126003222_presenca_codigo_auditoria/migration.sql`, gerada com Prisma migrate dev e revisada: somente adição de campos e relações, sem remover tabelas/dados. Mantidos `ataExportadaAt` e `ataVersaoExportada`, que já existiam.

A geração no banco originalmente configurado falhou por falta de permissão para criar shadow database (P3014). A migração foi gerada/aplicada em banco MySQL local isolado; migrate deploy também passou no banco local de testes. O banco configurado no .env do projeto NÃO recebeu esta migração.

Para disponibilizar a mudança no ambiente de uso: executar `npx prisma migrate deploy` e `npx prisma generate` em `sistema/api`, com DATABASE_URL apontando conscientemente para o banco pretendido. Reiniciar a API e reconstruir o app nativo para incorporar o módulo biométrico e a permissão do Face ID.

### Evidência de testes

- API: 438 testes unitários/HTTP aprovados em 25 suítes. Execução Jest usando a configuração do projeto, retirando globalSetup apenas em memória para não migrar o banco configurado. As outras suítes de integração ficaram desabilitadas nesta execução.
- MySQL real local: quatro testes de `api/tests/presencaAtaBanco.test.mjs` aprovados. Cobrem idempotência concorrente, autoria manual, membros aprovando sem voto do presidente e disputa da exportação com voto/edição. O teste exige `PRESENCA_TEST_DATABASE_URL` de banco cujo nome termina em `_test`; sem essa variável é explicitamente pulado. O teste limpa apenas as entidades que criou.
- App: 336 testes aprovados em 48 suítes, incluindo atualização da ata, autenticação local, PIN, bloqueio temporal, registro manual e finalização de PDF.
- Web: 43 testes aprovados em cinco suítes.
- Typecheck e lint da API e do app aprovados; arquivos alterados formatados com Prettier, schema com Prisma format.
- Expo install --check: sem atualizações pendentes em better-meet e management-better-meet/web. Expo Doctor: 20/20 nos dois apps. A primeira execução acusou .expo não ignorado porque Git não estava no PATH; repetida com o Git do GitHub Desktop, passou sem mudança nos .gitignore.
- Git diff --check aprovado. Não houve commit nem publicação.

### Limites da validação e documentação da entrega

Biometria, PIN/senha nativa e Face ID foram cobertos por mocks; ainda precisam de teste em aparelhos físicos, com build de desenvolvimento para Face ID. Os testes Web não comprovam impressão física. O código compartilhado é a confirmação de presença solicitada, não prova geográfica nem impede que alguém repasse o PIN.

Atualizar os documentos listados na seção 5: RFs de presença e RF16/UC17–UC20, RNF44/RNF45 e segurança/autenticação, RNF50–RNF54 de compatibilidade Expo, DER/dicionário de dados, diagramas de classes e sequências e casos de teste de presença/ata. Acrescentar cenários de código renovado, cancelamento biométrico, senha nativa, confirmação Web, autoria manual, voto antes do presidente, PDF sem aprovação/falha/cancelamento, versão desatualizada e concorrência com finalização. No manual, distinguir a lista demonstrativa de presença dos registros reais.
