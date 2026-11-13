- **Incremento:** 3 — entrega3_Di2
- **Escopo:** Testes e pendências do módulo de Ata de Reunião; RF17, RNF45/RNF46, UC22–UC25.
- **Branch:** development
- **Commit:** 945419d84dd6a3dd32aacab736f32f9c7ed806f5
- **Data de revisão:** 2026-11-13
- **Responsável(eis):** [nome de quem revisa e assina]
- **Estado:** Parcial — registro documental aprovado em 2026-11-13; 138 testes direcionados aprovados, integração física pendente.
- **Fontes:** [especificação](ata_reuniao.md); nove arquivos de teste e configurações listados abaixo; schema e migrations do mesmo commit.

# Testes de ata de reunião

## O que foi testado

Nesta revisão foram executadas as nove suítes direcionadas, com **138 testes aprovados e zero falhas**. A aprovação vale para as asserções existentes nos ambientes com mocks/jsdom; não comprova uso físico nem integridade de banco real. São 28 casos documentais: 23 CT-RF17, dois CT-RNF45 e três CT-RNF46. Um caso documental pode reunir várias asserções/test.each; não equivale à contagem de 138 testes Jest executados.

### Fontes de teste e alcance

| Fonte | Arquivo inspecionado | Alcance e limite |
|---|---|---|
| T01 | [api/tests/ata.test.mjs](../../sistema/api/tests/ata.test.mjs) | Express, rotas, JWT, Yup, sanitizador e service reais em Supertest; Prisma e env simulados. $transaction chama a callback diretamente: não prova rollback ou concorrência MySQL |
| T02 | [AtaReuniao.test.tsx](../../sistema/better-meet/src/components/__tests__/AtaReuniao.test.tsx) | Renderização, permissões, salvar/votar, estados e PDF; services, editor/leitor e exportação simulados. Não é E2E da tela de rota nem WebView real |
| T03 | [AtaToolbar.test.tsx](../../sistema/better-meet/src/components/__tests__/AtaToolbar.test.tsx) | Comandos, acessibilidade, ScrollView horizontal, desabilitação e menu de tabelas |
| T04 | [utils/__tests__/ataPdf.test.ts](../../sistema/better-meet/src/utils/__tests__/ataPdf.test.ts) | Caminho nativo com expo-print, expo-sharing e expo-file-system simulados; Android/iOS, base64/cache e falhas |
| T05 | [web-tests/ataEditor.test.ts](../../sistema/better-meet/src/web-tests/ataEditor.test.ts) | Integração do editor Tiptap/React em DOM simulado; edição habilitada/desabilitada |
| T06 | [web-tests/ataHtml.test.ts](../../sistema/better-meet/src/web-tests/ataHtml.test.ts) | DOMPurify e HTML real em jsdom; tags, atributos, CSS, tabelas e normalizações |
| T07 | [web-tests/ataNativeBridge.test.ts](../../sistema/better-meet/src/web-tests/ataNativeBridge.test.ts) | Ponte nativa executada em jsdom, com execCommand simulado; não substitui Android/iOS |
| T08 | [web-tests/ataPdf.test.ts](../../sistema/better-meet/src/web-tests/ataPdf.test.ts) | Template/sanitização e chamadas de janela/impressão simuladas; não gera PDF em navegador real |
| T09 | [web-tests/ataTiptap.test.ts](../../sistema/better-meet/src/web-tests/ataTiptap.test.ts) | Comandos reais do Tiptap em jsdom: marcas, títulos, alinhamentos, recuo, fonte, histórico e tabelas |

Também consultados: package.json/package-lock.json de API/app; API jest.config.mjs; configuração Jest nativa no package.json do app, jest.setup.ts e jest.web.config.cjs; schema.prisma, migrations e funções tratadas na especificação. O carregamento da rota do app não está coberto pelos testes de componente como teste de navegação ponta a ponta.

### Casos funcionais

Os CT-RF17-01–19 tiveram as suítes vinculadas executadas e aprovadas; as limitações de cobertura permanecem. CT-RF17-20–23 continuam **Não executado**. “Implementado” refere-se ao teste existente, “Parcial” à cobertura existente com lacuna real e “Planejado” ao cenário sem teste automatizado identificado.

| ID | RF / UC | Preparação e ação verificáveis | Resultado esperado conforme código | Fonte / estado da cobertura |
|---|---|---|---|---|
| CT-RF17-01 | RF17 / UC22 | Pessoa vinculada, entrada na reunião; GET com conteúdo salvo e com conteudoAta nulo | 200 com DTO da ata; dataReuniao civil, podeVotar verdadeiro/falso conforme conteúdo; não expõe lista dos votos de terceiros | T01: consulta, primeira gravação e totais; Implementado |
| CT-RF17-02 | RF17 / UC22 | Repetir GET para ADMINISTRADOR, SECRETARIO, FACILITADOR e MEMBRO; renderizar com flags recebidas | 200 para os quatro; podeEditar só nos dois primeiros; leitores sem editor/Salvar | T01/T02; Implementado |
| CT-RF17-03 | RF17 / UC22–UC24 | Requisição sem Bearer, token inválido e User removido após emissão | 401; mensagens “Autenticação necessária.”, “Token inválido ou expirado.” e “Sessão inválida. Entre novamente.”, respectivamente | T01; Implementado; asserts de status não significam cobertura de cada mensagem |
| CT-RF17-04 | RF17 / UC22–UC24 | Ausente, registro de outra reunião, ex-integrante ou apenas Role.ADMIN; tentar GET/PUT/POST e enviar userId/papel forjados no body | 403 quando sem vínculo/entrada; body não troca identidade/papel; nenhum updateMany em negação prévia | T01; Implementado |
| CT-RF17-05 | RF17 / UC22/UC24 | Presença com saidaAt preenchido; consultar e votar com cada papel | 200; ausência de filtro por saída não exclui quem registrou entrada | T01: test.each dos quatro cargos; Implementado |
| CT-RF17-06 | RF17 / UC23 | Salvar com Administrador/Secretário; repetir com Facilitador/Membro e body inválido; chamar service diretamente como leitor | Dois primeiros 200; leitores 403 antes da validação do corpo, sem escrita; service também rejeita | T01/T02; Implementado |
| CT-RF17-07 | RF17 / UC22–UC24 | id abc/0/-1, HTML vazio/marcas sem texto/tabela vazia, tamanho >50.000, versão ausente/inválida | 400; id: “Identificador da reunião inválido.”; vazio visível: “Escreva o conteúdo da ata antes de salvar.”; demais mensagens da tabela de erros RF17 | T01; Implementado |
| CT-RF17-08 | RF17; RNF45 / UC22/UC23 | Inserir conteúdo permitido junto a script/atributos/eventos/CSS não autorizado; consultar HTML legado | Texto permitido preservado; conteúdo e atributos fora da allowlist removidos/normalizados tanto na gravação quanto na leitura | T01/T06; Implementado |
| CT-RF17-09 | RF17 / UC23 | Aplicar marcas, H1/H2/H3, quatro alinhamentos, recuo, tamanhos da escala e undo/redo | Comandos produzem HTML compatível com o sanitizador; toolbar horizontal; editor desabilitado impede manipulação | T03/T05/T07/T09; Parcial — nativo real pendente |
| CT-RF17-10 | RF17 / UC23 | Criar tabela nas dimensões permitidas pela UI, escolher bordas, inserir/remover linha/coluna/tabela e sanitizar | UI 1–10 linhas e 1–6 colunas; estilos permitidos preservados; colspan/rowspan sanitizados. API não impõe a contagem de linhas/colunas da UI | T01/T03/T06/T09; Parcial — renderização física pendente |
| CT-RF17-11 | RF17; RNF46 / UC23/UC24 | Primeira gravação e alteração de HTML normalizado com votos existentes | 200, versão +1, conteúdo sanitizado, deleteMany de todos os votos da reunião na callback de transação, voto liberado | T01/T02; Implementado com Prisma simulado |
| CT-RF17-12 | RF17; RNF46 / UC23 | Salvar HTML normalizado igual ao salvo | 200, versão/votos mantidos, sem deleteMany | T01; Implementado com Prisma simulado |
| CT-RF17-13 | RF17; RNF46 / UC24 | Quatro papéis aprovam/reprovam; repetir status e depois trocar; consultar totais | 200, upsert por reunião/pessoa; não duplica; meuVoto e contagens atuais; UI desabilita repetir status igual | T01/T02; Implementado com Prisma simulado |
| CT-RF17-14 | RF17 / UC24 | Votar antes da primeira gravação; status ausente/fora do enum | Sem conteúdo: 409 “A ata precisa ser redigida e salva antes da votação.”; status inválido: 400 Yup; sem voto persistido | T01; Implementado |
| CT-RF17-15 | RF17; RNF46 / UC23/UC24 | Enviar versão antiga; simular updateMany.count=0 entre leitura e voto | 409 “A ata foi alterada. Atualize a tela antes de salvar ou votar.”; nenhuma confirmação de voto/salvamento | T01/T02; Parcial — concorrência simulada, não duas transações reais |
| CT-RF17-16 | RF17 / UC23/UC24 | Rascunho com votos; cancelar/confirmar salvar, falha de rede e 403/409; tentar recarregar/sair | Confirma reinício de votos; voto desabilitado durante dirty/busy/conflict; erro preserva rascunho; 403/409 bloqueia edição/voto; saída/reload pede descarte | T02; Implementado no componente simulado |
| CT-RF17-17 | RF17 / UC25 | Exportar como leitor/editor, inclusive com rascunho diferente do salvo; simular geração base64 | Usa conteúdo salvo, BetterMeet/título/data/CSS, A4 595×842, escreve e aguarda File no Paths.cache antes de Sharing com MIME/UTI reais | T02/T04/T08; Parcial — PDF físico não gerado pelos mocks |
| CT-RF17-18 | RF17 / UC25 | Disparar duplo clique; Sharing indisponível, Print rejeitado/base64 ausente, escrita pendente/rejeitada ou share rejeitado; tentar novamente | Uma exportação por vez; não compartilha antes de write; erro exibido e flags liberadas; nova tentativa possível | T02/T04; Implementado com serviços nativos simulados |
| CT-RF17-19 | RF17; RNF45 / UC25 | Template com título/data e HTML; popup bloqueado; erro de impressão; afterprint | Sanitiza HTML, escapa título/data; bloqueio mostra “Permita pop-ups para exportar a ata.”; janela fecha em erro/afterprint; só documento da ata é impresso | T08; Parcial — janela/impressão simuladas |
| CT-RF17-20 | RF17 / UC22–UC24 | Provocar rejeição inesperada de consulta/escrita no serviço em ambiente isolado | handleError responde 500 {error: “Erro interno. Tente novamente mais tarde.”}; UI não anuncia sucesso. Efeito transacional real precisa de verificação própria | Caminho no errorMiddleware/API e apiClient/app; Planejado — nenhum caso específico identificado em T01 |
| CT-RF17-21 | RF17 / UC22–UC25 | Roteiro Android abaixo | Leitura/edição/voto/PDF e compartilhamento reais consistentes com o RF17 | Manual; Planejado |
| CT-RF17-22 | RF17 / UC22–UC25 | Roteiro iOS abaixo | Mesmas permissões; editor, margens e compartilhamento reais | Manual; Planejado |
| CT-RF17-23 | RF17 / UC22–UC25 | Roteiro navegador real abaixo | Tiptap, leitura, voto e documento PDF isolado sem interferência da página do app | Manual; Planejado |

### Casos não funcionais e de integridade

| ID | RNF / UC | Métrica e método | Resultado esperado | Estado / obtido |
|---|---|---|---|---|
| CT-RNF45-01 | RNF45 / UC22/UC23/UC25 | Executar as entradas proibidas/permitidas de T01/T06/T08; comparar HTML e DOM | Zero tags/eventos/URLs/CSS fora da política conservados; preservação da formatação autorizada | Testes Implementados; Aprovado nas suítes direcionadas |
| CT-RNF45-02 | RNF45 / UC22/UC25 | Conferir props/CSP de AtaLeitura e executar CT-RF17-21–23 com HTML adversarial em banco isolado | Leitura não editável; nenhuma execução de script ou navegação externa pelos vetores cobertos | Configuração Implementada; execução real Planejada e Não executado |
| CT-RNF46-01 | RNF46 / UC23/UC24 | Confrontar schema/migrations e, em MySQL isolado, SHOW CREATE TABLE/SHOW INDEX de Reuniao e AtaVoto; tentar duplicidade reunião/pessoa | UK real impede duplicidade; LONGTEXT/versão/FKs coincidem com DDL; não pressupor índices implícitos pelo nome | Inspeção concluída; teste em banco Não executado (conexão indisponível) |
| CT-RNF46-02 | RNF46 / UC23/UC24 | Executar T01: reset/idempotência, upsert, versão antiga e count=0; verificar chamadas | Nenhuma confirmação de versão antiga; mudança normalizada apaga votos; repetição não duplica | Testes com mocks Implementados; Aprovado nas asserções existentes |
| CT-RNF46-03 | RNF46 / UC23/UC24 | Em MySQL isolado, preparar duas sessões sobre mesma versão e teste de falha entre alteração e remoção de votos | Zero voto confirmado em versão antiga; zero atualização parcial após falha; resultados da corrida explicáveis pelo controle de versão | Planejado — harness de concorrência/falha não identificado; Não executado |

Os limites acima delimitam a amostra. Não é afirmada proteção contra todo payload possível nem um limite de latência inexistente. A verificação completa de RNF45 e RNF46 permanece **Não executado**: seus subconjuntos automatizados foram aprovados, mas leitor real, banco e concorrência/rollback seguem pendentes.

## Como rodar

### Suítes existentes

Executar com as dependências do lockfile e o Node aceito pelo projeto (API: engines >=24.9.0). Registrar a versão efetivamente usada com node --version no momento da execução. Não há dependência de MySQL em T01 porque database.ts é substituído por mock. Não usar as suítes com mocks como teste das migrations.

Manifestos/locks inspecionados: Jest 30.5.2 nos dois pacotes, Supertest 7.3.1 na API, jest-expo 58.0.14 e @testing-library/react-native 14.1.0 no app. Editor/Expo e demais versões estão na especificação B.4. Execução realizada com Node v24.21.0 e npm 11.19.0, utilizando as dependências presentes no workspace.

No terminal PowerShell, a partir de sistema/api:

```powershell
npm.cmd test -- --runInBand --runTestsByPath tests/ata.test.mjs
```

A partir de sistema/better-meet:

```powershell
npm.cmd test -- --runInBand --runTestsByPath src/components/__tests__/AtaReuniao.test.tsx src/components/__tests__/AtaToolbar.test.tsx src/utils/__tests__/ataPdf.test.ts
npm.cmd run test:web -- --runInBand --runTestsByPath src/web-tests/ataEditor.test.ts src/web-tests/ataHtml.test.ts src/web-tests/ataNativeBridge.test.ts src/web-tests/ataPdf.test.ts src/web-tests/ataTiptap.test.ts
```

Se dependências/client Prisma não estiverem disponíveis, instalar conforme os lockfiles e gerar o client via script prisma:generate da API antes de repetir. Não executar migrate/reset em banco compartilhado para rodar estes testes com mocks. Falha de preparação deve ser registrada separadamente de falha funcional.

Não existem comandos prontos identificados no repositório para CT-RF17-20, CT-RNF46-03 ou os testes manuais. Esses casos são roteiros; automatizá-los é trabalho futuro, não teste implementado nesta entrega.

### Roteiros manuais

Preparação comum: ambiente de teste isolado com API/app do commit do cabeçalho, quatro contas fictícias (uma de cada papel da comissão), reunião e entradas reais em ReuniaoRegistro. Usar a ação de entrada da reunião; a lista demonstrativa em memória não concede acesso. Preparar uma conta sem entrada e outra sem vínculo para negações. Registrar versão do app/Expo Go, sistema operacional/navegador, dispositivo e resultado sem expor credenciais ou participantes reais.

#### CT-RF17-21 — Android

1. Entrar como Facilitador da comissão presente e abrir a ata; repetir como Membro. Confirmar leitura sem toolbar/Salvar. Testar a conta ausente: acesso negado.
2. Como Secretário e depois Administrador da comissão, abrir editor e testar sublinhado, rasurado, quatro alinhamentos, H1/H2/H3, recuo, fonte, undo/redo e barra horizontal.
3. Criar tabela, alternar bordas, inserir/remover linha/coluna e salvar; reabrir como leitor e comparar conteúdo.
4. Aprovar/reprovar com os quatro papéis; trocar voto e verificar totais. Registrar saída e confirmar que a consulta/voto continua permitida enquanto houver vínculo.
5. Com voto existente, editar: cancelar a confirmação preserva estado; confirmar salva a nova versão e reinicia votos. Com outra tela aberta na versão antiga, tentar votar e conferir conflito/reload.
6. Gerar ata longa com títulos, listas e tabela de várias linhas; salvar. Modificar o rascunho e tocar Exportar PDF: documento deve conter a versão salva.
7. Abrir o arquivo na gaveta de compartilhamento/salvamento e conferir BetterMeet, título, data correta, fundo branco, margens, páginas e tabelas sem cortes. Cancelar e exportar novamente.
8. Testar destino de compartilhamento com conta fictícia de teste e guardar evidência sem dados pessoais. Um retorno sem erro não basta para afirmar entrega externa; conferir o arquivo no destino escolhido.

**Esperado:** comportamento do RF17; nenhuma mensagem de recusa de leitura da URI no caminho atual de cache; arquivo legível com formatação preservada. **Obtido:** Não executado — aparelho/ambiente móvel não testados nesta revisão.

#### CT-RF17-22 — iOS

1. Repetir os passos 1–5 do Android no iOS, com as quatro contas fictícias e os mesmos pré-requisitos.
2. Salvar texto longo e tabela; exportar sem rascunho e depois com rascunho diferente. Conferir uso do texto salvo.
3. Abrir prévia e compartilhar/salvar; verificar A4 e margens sem soma das margens CSS às nativas (o template usa pageMargin 0 no iOS).
4. Cancelar a gaveta, exportar novamente e verificar que o arquivo continua disponível para o aplicativo de destino.
5. Registrar cortes, perda de estilos, travamento ou erro de URI se ocorrerem; não presumir equivalência com Android.

**Esperado:** permissões iguais e documento/compartilhamento conforme RF17. **Obtido:** Não executado — dispositivo iOS não disponível para esta revisão.

#### CT-RF17-23 — Navegador real

1. Registrar navegador/versão e abrir o app em ambiente de teste. Repetir consulta/edição/voto com os quatro papéis e negações do Android.
2. Testar no Tiptap marcas, alinhamentos, headings, recuo, fonte, undo/redo e tabela; salvar/reabrir e comparar.
3. Bloquear pop-ups e clicar Exportar PDF; conferir a mensagem. Liberar pop-ups e tentar novamente.
4. Conferir janela contendo apenas BetterMeet, título, data e ata salva. Salvar em PDF pelo diálogo do navegador e inspecionar páginas, texto e bordas.
5. Cancelar impressão, repetir exportação e conferir fechamento da janela após afterprint. Confirmar que o rascunho não foi incluído e que a página completa do app não foi impressa.
6. Para CT-RNF45-02, usar somente fixture adversarial em ambiente isolado e observar console/rede: leitura/PDF não deve executar script nem seguir navegação externa dos vetores da suíte.

**Esperado:** RF17 e política HTML do RNF45 no conjunto de vetores coberto. **Obtido:** Não executado — navegador real e PDF físico não testados nesta revisão.

### Verificação de MySQL

CT-RNF46-01/03 exigem banco de teste separado. Registrar versão real do servidor, isolamento e estrutura via consultas de leitura antes de qualquer ensaio de escrita. Comparar tipos, UK e ações das FKs com schema/migrations. A simulação de falha no meio da transação requer harness/instrumentação ainda **Planejado**, não uma chamada existente inventada.

## Resultado

Execução em 2026-11-13, Windows/PowerShell, Node v24.21.0 e npm 11.19.0. Os comandos são os da seção Como rodar. Saídas capturadas diretamente das ferramentas; nenhum teste foi adicionado ou alterado.

| Pacote | Suítes | Testes aprovados | Falhas | Tempo Jest | Exit code |
|---|---|---|---|---|---|
| API | 1 | 58 | 0 | 4.303 s | 0 |
| App nativo simulado | 3 | 37 | 0 | 7.854 s | 0 |
| Web/jsdom | 5 | 43 | 0 | 5.875 s | 0 |
| Total | 9 | 138 | 0 | — | 0 |

Não houve snapshots nem coleta de cobertura percentual. A API emitiu ExperimentalWarning sobre VM Modules; o processo terminou com sucesso. Tempos de Jest não são métricas de desempenho do app. Não foi executado build/export Expo, pois a alteração é documental.

### Evidência da execução

**API**

```text
> api@1.0.0 test
> node --experimental-vm-modules node_modules/jest/bin/jest.js --runInBand --runTestsByPath tests/ata.test.mjs

(node:3892) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
Test Suites: 1 passed, 1 total
Tests:       58 passed, 58 total
Snapshots:   0 total
Time:        4.303 s
Ran all test suites within paths "tests/ata.test.mjs".
```

**App**

```text
> better-meet@1.0.0 test
> jest --runInBand --runTestsByPath src/components/__tests__/AtaReuniao.test.tsx src/components/__tests__/AtaToolbar.test.tsx src/utils/__tests__/ataPdf.test.ts


Test Suites: 3 passed, 3 total
Tests:       37 passed, 37 total
Snapshots:   0 total
Time:        7.854 s, estimated 8 s
Ran all test suites within paths "src/components/__tests__/AtaReuniao.test.tsx", "src/components/__tests__/AtaToolbar.test.tsx", "src/utils/__tests__/ataPdf.test.ts".
```

**Web**

```text
> better-meet@1.0.0 test:web
> jest --config jest.web.config.cjs --runInBand --runTestsByPath src/web-tests/ataEditor.test.ts src/web-tests/ataHtml.test.ts src/web-tests/ataNativeBridge.test.ts src/web-tests/ataPdf.test.ts src/web-tests/ataTiptap.test.ts


Test Suites: 5 passed, 5 total
Tests:       43 passed, 43 total
Snapshots:   0 total
Time:        5.875 s
Ran all test suites within paths "src/web-tests/ataEditor.test.ts", "src/web-tests/ataHtml.test.ts", "src/web-tests/ataNativeBridge.test.ts", "src/web-tests/ataPdf.test.ts", "src/web-tests/ataTiptap.test.ts".
```

### Pendências preservadas

| Caso/atividade | Resultado | Motivo |
|---|---|---|
| CT-RF17-01–19 | Aprovado nas asserções existentes das suítes vinculadas | Limites de mocks/editor/DOM continuam na tabela de cobertura |
| CT-RF17-20 | Não executado | Sem teste específico de falha inesperada identificado |
| CT-RF17-21–23 | Não executado | Sem sessão própria de Android/iOS/navegador real |
| CT-RNF45-01 | Aprovado | Sanitizadores/template nos testes direcionados |
| CT-RNF45-02 | Não executado | Props/CSP inspecionadas; comportamento físico não ensaiado |
| CT-RNF46-01 em MySQL | Não executado | Schema/DDL inspecionados; conexão recusada na inspeção anterior, sem nova conexão nesta etapa |
| CT-RNF46-02 | Aprovado | Chamadas, versões e conflitos simulados verificados |
| CT-RNF46-03 | Não executado | Harness de concorrência/falha e banco isolado não disponíveis |
| RNF45/RNF46 completos | Não executado | Aprovação dos subconjuntos não comprova as exigências integrais |

Nenhum defeito foi detectado pelas 138 asserções de teste aprovadas; isso não demonstra ausência de defeitos fora da cobertura. Não foram produzidos logs com tokens, senhas ou dados pessoais.

## Histórico preservado

Fonte: ata_reuniao.md anteriormente versionado em e99249376a971507ddb0105884ec34eb6482120f. Os IDs abaixo não foram reutilizados, renumerados nem removidos; a relação é por assunto. Equivalência formal com os novos CT permanece **[A CONFIRMAR]**.

| ID legado | Assunto original preservado | Cobertura atual por assunto |
|---|---|---|
| CT-ATA-01 | Papéis que podem editar e bloqueio dos demais | CT-RF17-02/06 |
| CT-ATA-02 | Presença, vínculo e perda de acesso | CT-RF17-03–05 |
| CT-ATA-03 | HTML permitido e sanitização | CT-RF17-07/08 |
| CT-ATA-04 | Aprovação/reprovação e voto único | CT-RF17-13/14 |
| CT-ATA-05 | Versão, alteração de texto e concorrência | CT-RF17-11/12/15 |
| CT-ATA-06 | Estados e ações da interface | CT-RF17-16 |
| CT-ATA-07 | Formatação ampliada e tabelas | CT-RF17-09/10 |
| CT-ATA-08 | Comandos reais do Tiptap | CT-RF17-09/10 |
| CT-ATA-09 | Barra e menu de tabelas | CT-RF17-09/10 |
| CT-ATA-10 | Alternar salvamento não cria alterações pendentes; ponte nativa preserva histórico e filtra mensagens | CT-RF17-09/16 |
| CT-ATA-11 | PDF em todos os papéis; conteúdo salvo | CT-RF17-17 |
| CT-ATA-12 | Duplicidade, falhas, A4/MIME e correção do cache | CT-RF17-18/21/22 |
| CT-ATA-13 | Cabeçalho/data/bordas, HTML web e pop-up | CT-RF17-19/23 |

Resultados **relatados na fonte anterior**, não reexecutados nem comprovados por logs novos:

| Data registrada anteriormente | Resultado relatado | Limitação |
|---|---|---|
| 2026-11-09 | API 247 testes/13 suites; app 173/21; web 3/1 | Relato histórico da versão anterior do documento |
| 2026-11-10 | API 261/13; app 177/22; web 29/4 | Relato histórico, não resultado desta revisão |
| 2026-11-11 | API 261/13; app 192/23; web 43/5 | Mesmo limite |
| 2026-11-12 | Regressão de PDF/componente: 33 testes; integração relatada API 261 + app 198 + web 43 = 502 testes/41 suites | Mesmos limites; contagens incluem outras funcionalidades |

O texto antigo também afirmava migration aplicada e verificações de tipos/lint/Expo aprovadas. Essas afirmações permanecem apenas como relato histórico; a estrutura física atual e os resultados de execução desta revisão não foram confirmados. O erro de URI de compartilhamento motivou o código que grava base64 em Paths.cache, mas sua correção em cada aparelho deve ser verificada nos roteiros.
