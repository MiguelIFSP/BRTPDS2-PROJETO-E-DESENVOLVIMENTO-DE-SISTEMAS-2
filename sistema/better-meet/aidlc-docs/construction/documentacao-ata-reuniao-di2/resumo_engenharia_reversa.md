- **Incremento:** 3 — entrega3_Di2
- **Escopo:** Resumo da inspeção do módulo de Ata de Reunião: editor Rich Text, RBAC, leitura, votação, PDF e evidências para a documentação.
- **Branch:** development
- **Commit:** 945419d84dd6a3dd32aacab736f32f9c7ed806f5
- **Data de revisão:** 2026-11-12
- **Responsável(eis):** [nome de quem revisa e assina]
- **Estado:** Parcial — inspeção estática concluída e aprovada; verificações em execução pendentes.
- **Fontes:** [schema Prisma](../../../../api/prisma/schema.prisma), [serviço da API](../../../../api/src/services/ataService.ts), [componente da ata](../../../src/components/AtaReuniao.tsx), [documento existente](../../../../../documentos/entrega4_Di3/ata_reuniao.md), [guia de documentação](../../../../../GUIA_DE_DOCUMENTACAO.md) e inventário da seção 10.

# Resumo de Reverse Engineering — Ata de Reunião

## 1. Referência, alcance e método

O código consultado é o commit do cabeçalho, ancestral da development. O HEAD observado nesta unidade é e99249376a971507ddb0105884ec34eb6482120f. A comparação dos arquivos de sistema entre esses commits não apresentou diferenças; as mudanças posteriores estão na documentação. Os arquivos funcionais inspecionados também não têm alterações locais. Guias e documentos foram consultados no HEAD atual para considerar os padrões vigentes e números já ocupados.

A aprovação de Workspace Detection foi recebida no arquivo da etapa e confirmada pela mensagem “respondido: (A)”. Ela autorizou esta inspeção. Este arquivo é um resumo da execução do processo; as provas continuam sendo os arquivos de código e as migrations citados. Não substitui a entrega oficial e não autoriza a etapa seguinte por si só.

Foram seguidos os imports do módulo, a autenticação, o tratamento de erros, a entrada na reunião e as variantes nativa e web. Também foram lidos os testes existentes e confrontados documentos e Wiki. A Wiki foi consultada por um clone bare temporário, sem publicação ou alteração remota, no commit 1226e33743b2d27ec16fd6738986faf7ca745a9b. Foram pesquisadas 40 páginas Markdown da Wiki e 42 arquivos textuais versionados de documentos/ nos formatos .md, .puml e .svg para localizar identificadores e referências ao assunto. A leitura detalhada se restringiu às fontes discriminadas na seção 10; a busca textual não equivale à auditoria completa de todos os outros módulos.

Os nove tipos de levantamento sugeridos pela etapa genérica do AI-DLC estão consolidados neste resumo de execução. Não foram criados documentos oficiais em aidlc-docs/, diagramas Mermaid ou cópias dos artefatos de outro fluxo. A regra 23 do pedido determina o destino da documentação oficial, e a regra 22 exige aprovação antes de avançar.

## 2. Contexto e componentes encontrados

O módulo associa o texto da ata à reunião, controla quem pode consultar e editar, recebe o voto individual sobre a versão salva e exporta esse conteúdo no dispositivo. A presença que autoriza essas operações é um registro de entrada persistido em ReuniaoRegistro. O vínculo atual com a comissão também é necessário.

| Componente | Tipo e responsabilidade observada | Relação com a ata e estado |
|---|---|---|
| sistema/better-meet | Aplicação React Native/Expo, com implementações específicas para web | Implementado — tela, editor/leitor, chamadas HTTP, estado de edição e exportação |
| sistema/api | API Express, validação Yup, autenticação JWT e persistência Prisma | Implementado — leitura, edição, autorização e votação da ata |
| sistema/monitoring-better-meet | Serviço de monitoramento com consultas agendadas de saúde | Implementado no contexto geral; não participa do fluxo de ata inspecionado |
| sistema/management-better-meet/server | API de gerenciamento de subsistemas | Implementado no contexto geral; não participa do fluxo de ata inspecionado |
| sistema/management-better-meet/web | Interface de gerenciamento que consulta os serviços configurados | Implementado no contexto geral; não participa do fluxo de ata inspecionado |

Os cinco pacotes usam manifestos npm separados. O docker-compose.yml configura bancos distintos para o sistema principal e o monitoramento, ambos com imagem mysql:8.4.0. Essa imagem é uma configuração, não a versão de um servidor cuja execução tenha sido confirmada. Os dados da ata pertencem ao banco principal; não foi encontrada persistência de atas no banco de monitoramento.

No app, AtaReuniaoScreen carrega a ata por ataService.getByReuniao(token, id), usando apiRequest. AtaReuniao apresenta a edição ou a leitura e aciona save, vote e exportAtaPdf. Na API, ataRoutes encaminha a ataController, que chama ataService e o cliente Prisma. São funções, componentes e objetos exportados por módulos; controller e service não devem ser desenhados como classes da implementação.

Os termos têm significados distintos: papel global é Role; papel da comissão é PapelComissao; presença é ReuniaoRegistro; versão é Reuniao.versaoAta; voto é AtaVoto.status. Não há modelo Ata separado, estado de aprovação final, quórum, assinatura ou histórico de versões do texto nesse fluxo inspecionado.

## 3. Acesso e presença

| Ator concreto | Consultar ata | Editar e salvar | Aprovar ou reprovar | Exportar PDF | Estado |
|---|---|---|---|---|---|
| Administrador da comissão — PapelComissao.ADMINISTRADOR | Sim | Sim | Sim | Sim | Implementado |
| Secretário da comissão — PapelComissao.SECRETARIO | Sim | Sim | Sim | Sim | Implementado |
| Facilitador da comissão — PapelComissao.FACILITADOR | Sim | Não | Sim | Sim | Implementado |
| Membro da comissão — PapelComissao.MEMBRO | Sim | Não | Sim | Sim | Implementado |

Todas as linhas pressupõem vínculo atual em ComissaoEquipe e existência de ReuniaoRegistro para a pessoa e a reunião. Votar exige conteúdo salvo e a versão atual. Exportar exige conteúdo salvo carregado no app. A tabela descreve as condições no código, não uma execução em aparelho.

requireAuth valida o token Bearer e os campos de identidade; o papel global usado pela API é lido do usuário atual no banco. O papel global não concede edição da ata. loadAccess consulta o papel da comissão no banco a cada operação da API. Role.ADMIN sem papel elegível na comissão não supera esse controle. A interface usa podeEditar devolvido pela API, e não uma decodificação local do papel da comissão no JWT.

loadAccess verifica a existência da reunião antes do vínculo e do registro de entrada. Não exige saidaAt nulo; quem entrou e já saiu continua elegível enquanto mantiver o vínculo com a comissão. Não há, nessa função, restrição pela data, pelo status da reunião ou pelo status da organização.

A obtenção de um novo registro de entrada tem regras próprias em reuniaoService.checkIn: vínculo com a comissão, organização aceita, pessoa criadora ou com convite aceito e reunião AGENDADA. Um registro já existente é retornado antes da restrição de status para criar outro. Essas regras de entrada não devem ser confundidas com validações executadas novamente pela rota da ata.

Na tela de detalhes da reunião, o botão da ata depende de meuRegistro e papelNaComissao obtido dos participantes apresentados. A API continua validando acesso independentemente da presença desse botão.

**Distinção necessária:** a tela demonstrativa lista-presenca.tsx usa useListaPresencaPreview e estado em memória. Marcar uma pessoa como presente nessa demonstração não cria ReuniaoRegistro nem concede acesso à ata. A documentação deve nomear o registro de entrada real, sem atribuir integração ao protótipo de lista manual.

## 4. Contratos e comportamento da API

As rotas são montadas sob /api em server.ts. O caminho público completo inclui esse prefixo.

| Método e caminho | Middleware e controlador | Entrada específica | Sucesso e estado |
|---|---|---|---|
| GET /api/reunioes/:id/ata | requireAuth; ataController.getByReuniao | id convertido por parseId; identidade de request.user | 200, representação da ata; Implementado |
| PUT /api/reunioes/:id/ata | requireAuth; requireAtaEditor; ataController.save | conteudoAta, versaoAta | 200, representação atualizada; Implementado |
| POST /api/reunioes/:id/ata/votar | requireAuth; ataController.vote | status, versaoAta | 200, representação com o voto e totais; Implementado |

parseId exige número inteiro positivo após conversão. Os schemas Yup não usam modo estrito: há transformações e coerções; não se deve prometer rejeição de todo valor cujo tipo JSON inicial seja diferente do tipo final. Os controladores usam stripUnknown: true.

| Campo | Domínio e validação observada | Origem |
|---|---|---|
| id | Inteiro positivo; identificador da reunião | Parâmetro da rota |
| conteudoAta | String obrigatória, trim, limite de 50.000 caracteres de HTML antes da sanitização; depois deve conter texto não vazio | Corpo de PUT |
| versaoAta | Número obrigatório, inteiro, maior ou igual a zero; deve coincidir com a versão persistida | Corpo de PUT e POST |
| status | String com trim, APROVADO ou REPROVADO | Corpo de POST |
| userId | Identidade autenticada; não é escolhido no corpo da requisição | request.user, preenchido por requireAuth |

A representação retorna reuniaoId, titulo, dataReuniao, conteudoAta, versaoAta, papelNaComissao, podeEditar, podeVotar, meuVoto e votos com aprovados/reprovados. conteudoAta e meuVoto podem ser nulos. podeVotar indica a existência de conteúdo salvo para uma pessoa cujo acesso já foi validado; não é o resultado de uma votação coletiva.

| Situação | Resposta observada no código | Fonte |
|---|---|---|
| Identificador inválido | 400; “Identificador da reunião inválido.” | parseId.ts |
| Texto com apenas marcação, espaços ou conteúdo removido | 400; “Escreva o conteúdo da ata antes de salvar.” | ataHtml.ts |
| Campo conteudoAta obrigatório | 400; “Escreva o conteúdo da ata.” | ataSchema.ts e errorMiddleware.ts |
| HTML acima do limite | 400; “A ata deve ter no máximo 50.000 caracteres de HTML.” | ataSchema.ts |
| Versão não informada ou inválida como número | 400; “Informe a versão da ata.” | ataSchema.ts |
| Versão fracionária ou negativa | 400; “A versão deve ser inteira.” ou “A versão não pode ser negativa.” | ataSchema.ts |
| Voto fora do domínio ou não informado | 400; “Escolha aprovar ou reprovar a ata.” | ataSchema.ts |
| Token ausente, inválido, expirado, campos de identidade inválidos ou usuário inexistente | 401; mensagem específica definida em authMiddleware.ts | authMiddleware.ts |
| Sem vínculo atual ou sem entrada registrada | 403; “A ata está disponível somente para integrantes da comissão com entrada registrada nesta reunião.” | ataService.ts |
| Papel sem edição | 403; “Somente administrador ou secretário da comissão pode editar a ata.” | ataService.ts |
| Reunião inexistente | 404; “Reunião não encontrada.” | ataService.ts |
| Voto antes de haver texto salvo | 409; “A ata precisa ser redigida e salva antes da votação.” | ataService.ts |
| Versão desatualizada ou atualização condicional sem linha afetada | 409; “A ata foi alterada. Atualize a tela antes de salvar ou votar.” | ataService.ts |
| Exceção não tratada especificamente | 500; “Erro interno. Tente novamente mais tarde.” | errorMiddleware.ts |

O formato de erro tem o campo error. No tratamento de AppError, propriedades de error.details são incorporadas no mesmo nível do objeto de resposta, sem um campo details obrigatório. Os erros genéricos Prisma P2025/P2002 são convertidos em 404/409. Um voto repetido normalmente usa upsert e retorna 200; não deve ser documentado como duplicidade rejeitada com 409.

Na gravação, save(userId, reuniaoId, conteudoAta, versaoAta) valida e sanitiza o conteúdo, abre transação, confere acesso, edição e versão, e usa updateMany com filtro por id e versaoAta. Quando o HTML normalizado é diferente do salvo, incrementa a versão e exclui os votos da reunião. Quando é igual, mantém versão e votos. Em seguida retorna a apresentação atual.

Na votação, vote(userId, reuniaoId, status, versaoAta) verifica acesso, existência do conteúdo e versão dentro de transação, executa atualização condicional da reunião e faz upsert pela chave reuniaoId_userId. A pessoa pode trocar o voto. Os totais consideram os votos armazenados para a versão atual; não há filtro adicional de vínculo atual para excluir do total um voto já registrado por quem posteriormente deixou a comissão.

A transação e a atualização condicional estão implementadas. Bloqueios, concorrência e rollback reais no MySQL continuam **Não verificado** nesta unidade; os testes simulam o cliente Prisma.

## 5. Editor, leitura e exportação

| Capacidade | Evidência observada | Estado |
|---|---|---|
| Edição nativa | Pell RichEditor, RichEditor.getContentHtml e ponte ataNativeBridge em WebView | Implementado |
| Edição web | Tiptap com extensões e comandos em ataTiptap.web.ts | Implementado |
| Formatação | Negrito, itálico, sublinhado, rasurado, H1/H2/H3, quatro alinhamentos, listas ordenadas/não ordenadas, recuo, fonte e desfazer/refazer | Implementado |
| Fonte | Escala compartilhada de 10, 13, 16, 18, 24, 32 e 48 px | Implementado |
| Tabelas | Criação com cabeçalho opcional, dez opções de borda, comandos de linha/coluna e exclusão da tabela | Implementado |
| Limites de tabela na interface | De 1 a 10 linhas e de 1 a 6 colunas; esses limites não são uma validação de contagem no servidor | Implementado na interface |
| Barra de ferramentas | ScrollView horizontal, botões com ícones e indicadores; títulos usam H1/H2/H3 como glifos de texto, ações ativas usam Colors.dark.primary (#1FD5B5) | Implementado |
| Leitura nativa | HTML sanitizado pela API em WebView sem JavaScript, sem acesso a arquivos e com navegação restrita | Implementado |
| Leitura web | HTML submetido a DOMPurify e renderizado sem editor | Implementado |
| Estado de edição | Rascunho local, obtenção do HTML atual antes de salvar, confirmação de descarte/reinício de votos e bloqueio de voto com alterações pendentes | Implementado |
| Tratamento de conflito | Em 403/409, preserva o rascunho, bloqueia edição/voto e oferece recarregamento; falhas de rede permitem nova tentativa | Implementado |
| Exportação nativa | Geração por expo-print, gravação base64 em arquivo do cache do app e compartilhamento por expo-sharing | Implementado |
| Exportação web | Janela isolada com HTML sanitizado e diálogo de impressão do navegador | Implementado |
| Resultado visual e compartilhamento em aparelho real | Não houve sessão de teste em Android/iOS nesta unidade | Não verificado |

No servidor, sanitizeAtaHtml aplica lista permitida de tags, atributos e estilos. São aceitos parágrafos, formatação de texto, listas, títulos, citações, código e tabelas. Scripts e elementos não textuais bloqueados são removidos. Estilos permitidos incluem os quatro alinhamentos e a escala de fonte; tabelas preservam data-ata-border validado e células têm colspan/rowspan de 1 a 10. Conversões de font e align legados são explícitas no código. A API verifica texto efetivo após remover marcação, espaços, NBSP e caracteres de largura zero. Uma tabela vazia, por si só, não satisfaz esse requisito.

O editor nativo necessita de JavaScript para operar. A restrição javaScriptEnabled=false pertence ao leitor, não ao editor. Na web há sanitização adicional por DOMPurify. O template de PDF escapa título e data, mas não é, por si só, o sanitizador do conteúdo da ata; o fluxo nativo recebe o HTML salvo fornecido pela API, e a variante web o sanitiza novamente.

exportAtaPdf recebe o conteúdo salvo carregado em ata.conteudoAta. Alterações locais ainda não salvas não entram no PDF. O clique não faz outra consulta à API; uma alteração remota ou revogação de acesso posterior ao carregamento não é revalidada pela exportação local. O botão exige conteúdo e tem proteção contra chamadas repetidas durante a operação.

buildAtaPdfHtml cria um documento branco com cabeçalho BetterMeet, título da reunião, data formatada, tipografia sans-serif, regras de margens, títulos, listas e tabelas. A função nativa verifica Sharing.isAvailableAsync, chama Print.printToFileAsync com base64: true, escreve o resultado em File(Paths.cache, nome.pdf) e só então chama Sharing.shareAsync com tipo application/pdf. O código trata base64 ausente e falhas de geração, gravação ou compartilhamento. Não há endpoint de exportação nem PDF persistido no MySQL.

No navegador, window.open e window.print oferecem a impressão/salvamento em PDF conforme o navegador. Não há gaveta nativa de expo-sharing nessa variante. A resolução da chamada de compartilhamento não comprova que o usuário salvou ou enviou o arquivo a um destinatário.

## 6. Persistência e dados fora do banco

| Estrutura | O que foi confirmado em schema e migrations | Estado |
|---|---|---|
| Reuniao.conteudoAta | LONGTEXT NULL no MySQL; String? no Prisma; domínio lógico: HTML sanitizado da ata | Implementado no código de persistência |
| Reuniao.versaoAta | INTEGER NOT NULL DEFAULT 0; incrementada na alteração do conteúdo normalizado | Implementado no código de persistência |
| AtaVoto | id INTEGER AUTO_INCREMENT PK; reuniaoId e userId INTEGER; status ENUM('APROVADO','REPROVADO'); versaoAta INTEGER; updatedAt DATETIME(3) NOT NULL | Implementado no código de persistência |
| Chaves de AtaVoto | UK (reuniaoId, userId), índice userId, FKs para Reuniao e User com ON DELETE CASCADE e ON UPDATE CASCADE | Implementado no código de persistência |
| AtaVoto.updatedAt | @updatedAt no Prisma; a migration não declara DEFAULT SQL para a coluna | Implementado no código de persistência |
| ReuniaoRegistro | PK id; UK (reuniaoId, userId); entradaAt DATETIME(3) com CURRENT_TIMESTAMP(3); saidaAt nullable; FKs para reunião e usuário com cascatas | Implementado no código de persistência |
| ComissaoEquipe | PK composta (comissaoId, userId); PapelComissao com quatro valores e padrão MEMBRO; vínculo usado na autorização | Implementado no código de persistência |
| Relações anteriores | Reuniao pertence a Comissao e referencia o criador em User; exclusão do criador é RESTRICT nessa FK, diferente das cascatas dos votos | Implementado no código de persistência |
| Banco em execução e histórico de migrations aplicadas | Tentativa de conexão somente para leitura retornou ECONNREFUSED; nenhuma consulta de metadados chegou a executar | Não verificado |

As datas e horários da reunião são strings no schema existente; não devem ser redesenhados como colunas DATETIME por suposição. O DER futuro precisa mostrar os nomes físicos, cardinalidades, chaves e ações reais. O dicionário completo, com uma linha por coluna das tabelas incluídas, pertence à etapa de escrita aprovada.

Em 2026-11-12 tentou-se consultar, sem alteração de dados, a versão do servidor, a estrutura das tabelas relacionadas e o histórico de migrations. A conexão falhou com ECONNREFUSED. Não foram iniciados serviços nem aplicadas migrations. Portanto, schema e SQL versionados comprovam a definição pretendida pela implementação, mas não a estrutura física de uma instância em execução.

Fora do banco, o rascunho e indicadores de operação ficam no estado do componente; a sessão usa authStore e AsyncStorage; o PDF nativo fica no cache local; a janela de impressão web é temporária. A lista de presença demonstrativa mantém versões em memória. Não há base para desenhar tabelas adicionais para esses dados.

## 7. Dependências e verificações existentes

As versões abaixo foram confirmadas nos manifestos e lockfiles do código-base. Elas não afirmam uma versão instalada em celular ou em produção.

| Uso | Versão resolvida |
|---|---|
| API Express; Prisma e @prisma/client | 5.2.1; 7.10.0 |
| Sanitização e validação da API | sanitize-html 2.18.1; yup 1.7.1 |
| JWT | jsonwebtoken 9.0.3 |
| App | Expo 58.0.23; React 19.3.0; React Native 0.88.1 |
| Editor nativo e WebView | react-native-pell-rich-editor 1.10.0; react-native-webview 14.0.1 |
| PDF e arquivo nativos | expo-print 58.0.9; expo-sharing 58.0.23; expo-file-system 58.0.13 |
| Editor e HTML web | @tiptap/react 3.33.0; dompurify 3.4.17 |
| Testes | Jest 30.5.2; Supertest 7.3.1; @testing-library/react-native 14.1.0; jest-expo 58.0.14 |
| TypeScript | API 5.9.3; app 6.0.3 |

O manifesto da API exige Node >=24.9.0; isso é um requisito declarado, não uma medição do runtime em produção. Configurações de TypeScript, lint e Jest foram lidas. Não houve execução de lint, typecheck, build ou testes funcionais nesta etapa de inspeção.

| Arquivo de teste inspecionado | Cobertura observada no código do teste | Limite da evidência |
|---|---|---|
| sistema/api/tests/ata.test.mjs | Rotas com Supertest; papéis, presença inclusive após saída, identidade, falta de autenticação, validação, HTML, votos, versão, alteração que reinicia votos e conflitos simulados | Prisma e ambiente simulados; não valida uma transação, bloqueio ou rollback real |
| src/components/__tests__/AtaReuniao.test.tsx | Edição/leitura por permissão, voto, rascunho, confirmação, conflito, rede, PDF da versão salva e novas tentativas | Editor, leitor e exportação simulados |
| src/components/__tests__/AtaToolbar.test.tsx | Controles, rolagem horizontal, estado ativo/desabilitado e seleção de tabela/bordas | Renderização em ambiente de teste; não valida teclado ou gesto no aparelho |
| src/utils/__tests__/ataPdf.test.ts | HTML, fluxo de geração/gravação/compartilhamento, espera da gravação, Android/iOS e falhas | APIs do Expo simuladas; não gera nem compartilha um PDF nativo real |
| src/web-tests/ataEditor.test.ts | Alternância editável/desabilitado no editor web | Ambiente de teste DOM |
| src/web-tests/ataHtml.test.ts | Sanitização de tags, atributos, estilos e variantes de borda | DOM simulado, sem teste manual do navegador |
| src/web-tests/ataNativeBridge.test.ts | Comandos e mensagens da ponte nativa | execCommand e DOM simulados; não executa WebView no celular |
| src/web-tests/ataPdf.test.ts | Template, sanitização web, janela e tratamento de falhas | window.open/print simulados; não confirma arquivo PDF final |
| src/web-tests/ataTiptap.test.ts | Comandos reais do editor: texto, títulos, alinhamento, fonte, histórico e tabelas | Tiptap em ambiente DOM de teste |

Os caminhos sem prefixo sistema/api nessa tabela são relativos a sistema/better-meet. A configuração de testes nativos exclui src/app; a rota AtaReuniaoScreen não ganha cobertura automática por existir teste do componente filho.

**Resultado desta etapa:** Não executado para testes funcionais automatizados e manuais. Houve leitura dos testes, não execução deles. Os totais de testes e aprovações mencionados no documento antigo são registros históricos e não foram reapresentados como resultado deste trabalho. Percentual de cobertura, resultado em Android/iOS, aparência do PDF e concorrência no MySQL permanecem Não verificado. As verificações documentais da etapa serão registradas no audit.md.

## 8. Divergências, limites e identificadores

| Item | Constatação e consequência para a documentação | Estado |
|---|---|---|
| Documento atual da ata | Não começa com os oito campos exigidos; contém Mermaid e IDs legados RF-ATA, UC-ATA e CT-ATA | Parcial — adequação depende do plano de escrita |
| IDs globais ocupados | Varredura textual encontrou máximos RF16, RNF44 e UC21 no conjunto documentos/Wiki; RF16, RNF44 e UC17–UC21 estão no documento de votações posterior ao código-base | Implementado no catálogo documental consultado; nenhum novo ID reservado |
| IDs globais repetidos | UC04 nomeia checagem periódica em requisitos_e_casos_de_uso.md, adicionar membro na página de comissão e alterar tema na página de tema da Wiki; UC01 também tem usos distintos | Parcial — divergência [A CONFIRMAR]; não renumerar nem eleger um significado por conta própria |
| IDs legados da ata | RF-ATA-01 a RF-ATA-07, UC-ATA-01 a UC-ATA-04 e CT-ATA-01 a CT-ATA-13 não seguem os formatos globais pedidos | Parcial — vínculo com requisitos formais [A CONFIRMAR]; preservar a rastreabilidade do legado |
| Publicação de requisitos | O índice da Wiki termina em RF15/RNF43; a fonte local de votações já ocupa RF16/RNF44 | Parcial — registrar atualização do índice quando forem criados requisitos; não publicar sem instrução |
| Presença | A Wiki RF15 e a fonte da lista manual descrevem demonstração; o acesso da ata depende de ReuniaoRegistro e ComissaoEquipe | Implementado no código da ata; associação à lista manual não implementada no fluxo inspecionado |
| Autorização via JWT | O token identifica a pessoa e o papel global; o papel da comissão vem do banco, e podeEditar vem da API | Implementado — descrever o mecanismo real, sem supor papel da comissão embutido no JWT |
| Ordem de erros na OpenAPI | A descrição geral de openapi.yaml menciona uma precedência que não representa essas rotas. Com JSON bem formado, requireAuth vem primeiro; a busca da reunião pode produzir 404 antes de 403; no PUT, o middleware de edição pode produzir 403 antes da validação do corpo | Parcial — registrar a divergência; não alterar contrato ou código nesta unidade |
| JSON malformado | express.json atua antes das rotas e pode gerar 400 antes da autenticação | Implementado — impede documentar “401 sempre primeiro” sem qualificar o cenário |
| Dicionário anterior | O documento da entrega2_Di1 ainda apresenta tipos VARCHAR para campos que migrations posteriores transformaram em enums, como tema e status da organização | Parcial — usar schema e migrations atuais como fonte do novo dicionário |
| Conteúdo rico | A fonte antiga usa string no desenho lógico; o tipo físico da nova coluna é LONGTEXT, não VARCHAR genérico | Implementado — separar físico/lógico/domínio no DER e dicionário |
| Resultado da votação | A API devolve voto individual e totais; não calcula estado final de aprovação, quórum ou encerramento da votação da ata | Implementado — documentar votos e contagens, sem acrescentar decisão coletiva automática |
| Exportação depois de carregar | PDF usa o conteúdo salvo já carregado, sem buscar uma versão mais recente nem revalidar acesso no clique | Implementado — registrar esse limite e não prometer exportação da última versão remota |
| Estrutura física aplicada | Conexão recusada; sem metadados de MySQL ou histórico de migrations aplicadas | Não verificado |
| Teste em dispositivo e serviços reais | Testes existentes usam simulações nos pontos indicados; nenhum teste executado nesta etapa | Não verificado |

Não foi encontrada uma página específica da ata na pesquisa textual das páginas da Wiki. Há uma referência a Ata na página de arquitetura; isso não comprova implementação nem substitui a inspeção do módulo. A [página Requisitos](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/Requisitos) é o índice publicado consultado, sujeito a mudanças posteriores ao snapshot registrado.

Nenhum número foi atribuído ou renumerado. Requirements Analysis deverá considerar as colisões e definir a vinculação documental sem reutilizar IDs, deixando ambiguidades como [A CONFIRMAR]. Nenhum responsável humano foi deduzido dos commits. Nenhum resultado antigo foi tratado como execução nova.

## 9. Encaminhamentos para a próxima etapa

| Encaminhamento | Estado |
|---|---|
| Delimitar RFs de consulta, redação, voto e PDF; RBAC/presença como regras verificadas, com pré-condições próprias | Planejado |
| Definir a vinculação dos IDs legados e tratar colisões globais explicitamente, sem renumeração | Planejado |
| Selecionar RNFs mensuráveis a partir de mecanismos e verificações reais, separando funções de atributos de qualidade | Planejado |
| Planejar DCU, DS por cenário, modelo Prisma e DER em PlantUML/SVG, com fontes e fichas próprias | Planejado |
| Planejar dicionário completo, matriz, testes_ata_reuniao.md e checklist final em documentos/entrega3_Di2 | Planejado |
| Registrar pendências de aparelho real, MySQL e publicação no índice da Wiki sem inventar evidência | Planejado |

Esses itens são insumos para Requirements Analysis e para o plano posterior. A documentação oficial e os diagramas ainda não foram escritos ou alterados por esta unidade.

## 10. Inventário dos arquivos consultados

Os caminhos desta seção são relativos à raiz do repositório. “Integral” indica leitura do conteúdo; “trechos” e “busca” restringem o alcance. Arquivos citados apenas como próximos insumos não contam como conteúdo verificado.

### Guias, processo, documentos e Wiki

| Arquivo ou fonte | Alcance |
|---|---|
| GUIA_DE_DOCUMENTACAO.md | Integral no reinício; referências RF06/RNF06 usadas como padrão de detalhe, sem reaproveitar os fatos |
| GUIA_DE_CODIFICACAO.md | Seções de nomenclatura, idioma, Git, testes e AI-DLC |
| PROMPT_AGENTES_IA.md | Regras 83–90 e regras relacionadas a documentação, Git e testes |
| sistema/better-meet/AGENTS.md; .aidlc-rule-details/core-workflow.md; .aidlc-rule-details/inception/reverse-engineering.md | Integrais; demais arquivos de processo lidos no Workspace Detection constam no resumo anterior |
| documentos/entrega3_Di2/ata_reuniao.md | Integral, incluindo os resultados históricos e a correção descrita para PDF |
| documentos/entrega3_Di2/votacoes.md; testes_votacoes.md | Aberturas, identificação, escopo e busca de IDs; não auditoria funcional do módulo de votações |
| documentos/entrega3_Di2/lista_presenca.md | Abertura, condição de demonstração e busca de seções relacionadas |
| documentos/entrega2_Di1/requisitos_e_casos_de_uso.md | Busca dos IDs e trechos com os casos de uso conflitantes |
| documentos/entrega2_Di1/dicionario_de_dados.md | Cabeçalhos e trechos de usuários/organização/comissão para confrontar tipos |
| documentos/entrega2_Di1/Diagramas/DCU-Gestao-Setup-Reset.puml | Integral no Workspace Detection; somente referência de notação |
| Wiki — Home e Requisitos | Navegação e índice; consulta remota e snapshot Git da Wiki |
| Wiki — páginas RF14, RF15, Caso-de-uso:-comissao.md e Caso-de-Uso:-Tema-preferido-do-aplicativo.md | Leitura detalhada das páginas para contexto e divergências de IDs |
| Demais páginas Markdown da Wiki e documentos textuais | Varredura de identificadores e menções a ata; não leitura integral de todos os módulos |

### API, persistência e infraestrutura

| Arquivos sob sistema/api, salvo indicação | Alcance |
|---|---|
| src/routes/ataRoutes.ts; src/controllers/ataController.ts; src/services/ataService.ts | Integral |
| src/middlewares/ataMiddleware.ts; src/schemas/ataSchema.ts; src/utils/ataHtml.ts | Integral |
| src/middlewares/authMiddleware.ts; src/middlewares/errorMiddleware.ts | Integral |
| src/utils/parseId.ts; src/utils/prismaErrors.ts; src/errors/AppError.ts | Integral |
| src/server.ts; src/config/env.ts; src/config/database.ts; prisma.config.ts | Integral; sem divulgação de segredos ou valores de ambiente privados |
| src/routes/reuniaoRoutes.ts | Integral |
| src/controllers/reuniaoController.ts | Trechos de checkIn/checkOut |
| src/services/reuniaoService.ts | assertMembroDaComissao, apresentarReuniao, getById, checkIn, checkOut e respondInvite |
| prisma/schema.prisma | Integral |
| prisma/migrations/20260918235817_config_usuario/migration.sql | Integral |
| prisma/migrations/20260922140000_papeis_organizacao/migration.sql | Integral |
| prisma/migrations/20261014120000_alinha_schema_atual/migration.sql | Integral |
| prisma/migrations/20261014120100_adiciona_enums_status_tema/migration.sql | Integral |
| prisma/migrations/20261021120000_registra_tabelas_reuniao/migration.sql | Integral |
| prisma/migrations/20261021120100_registro_entrada_reuniao/migration.sql | Integral |
| prisma/migrations/20261023120000_local_reuniao/migration.sql | Integral |
| prisma/migrations/20261109140000_ata_reuniao/migration.sql | Integral |
| docs/openapi.yaml | Cabeçalho, segurança/respostas, schemas da ata e três operações da ata |
| tests/ata.test.mjs; tests/stripTypes.mjs; jest.config.mjs | Integral |
| package.json; package-lock.json; tsconfig.json; eslint.config.js | Scripts, versões resolvidas e configuração de qualidade relacionada ao módulo |
| sistema/docker-compose.yml | Serviços, imagens, portas e volumes; valores privados omitidos |
| sistema/monitoring-better-meet/package.json e src/server.ts | Manifesto e composição das rotas/monitoramento |
| sistema/management-better-meet/server/package.json, src/server.ts e src/routes/subsystem.routes.ts | Manifesto, montagem do serviço e declaração da operação de gerenciamento |
| sistema/management-better-meet/web/package.json e src/config/api.ts | Manifesto e relações entre os pacotes |

### App e testes

| Arquivos sob sistema/better-meet | Alcance |
|---|---|
| src/app/(tabs)/(reunioes)/ata/[id].tsx; src/components/AtaReuniao.tsx | Integral |
| src/app/(tabs)/(reunioes)/reuniao/[id].tsx | Trechos de apresentação dos participantes e botão da ata; caminho corrigido durante Requirements Analysis |
| src/services/ataService.ts; src/utils/apiClient.ts; src/config/api.ts; src/store/authStore.ts | Integral |
| src/components/ata/AtaEditor.tsx; AtaEditor.web.tsx; AtaEditor.types.ts | Integral, todos sob src/components/ata/ |
| src/components/ata/AtaLeitura.tsx; AtaLeitura.web.tsx | Integral, ambos sob src/components/ata/ |
| src/components/ata/AtaToolbar.tsx; AtaTableMenu.tsx; AtaFormatIcon.tsx | Integral, todos sob src/components/ata/ |
| src/utils/ataFormat.ts; ataHtml.web.ts; ataNativeBridge.ts; ataTiptap.web.ts | Integral, todos sob src/utils/ |
| src/utils/ataPdf.ts; ataPdf.web.ts; ataPdfHtml.ts | Integral, todos sob src/utils/ |
| src/constants/theme.ts; src/utils/format.ts | Trechos de cores, dimensões e formatação de data |
| src/hooks/useListaPresencaPreview.ts | Integral |
| src/app/lista-presenca.tsx; src/services/listaPresencaService.ts | Trechos e busca de chamadas para distinguir demonstração de integração real |
| src/components/__tests__/AtaReuniao.test.tsx; AtaToolbar.test.tsx | Integral, ambos sob src/components/__tests__/ |
| src/utils/__tests__/ataPdf.test.ts | Integral |
| src/web-tests/ataEditor.test.ts; ataHtml.test.ts; ataNativeBridge.test.ts; ataPdf.test.ts; ataTiptap.test.ts | Integral, todos sob src/web-tests/ |
| app.json; package.json; package-lock.json | Configuração, scripts e dependências resolvidas |
| jest.setup.ts; jest.web.config.cjs; tsconfig.json; eslint.config.js | Integral; configuração Jest nativa também no package.json |

## 11. Verificação da etapa e aprovação

- [x] Branch e commit do código conferidos; nenhuma nova branch.
- [x] Implementação de editor, RBAC, presença, leitura, voto e PDF inspecionada.
- [x] Rotas, respostas, persistência, versões, testes e seus limites registrados.
- [x] Código confrontado com documentos, Wiki e OpenAPI; divergências explicitadas.
- [x] Consulta ao MySQL tentada e falha registrada sem afirmar estrutura física conferida.
- [x] Nenhum resultado funcional ou identidade de responsável inventado.
- [x] Nenhum identificador atribuído, reutilizado ou renumerado.
- [x] Resumo da execução separado da documentação oficial.
- [x] Aprovação de Reverse Engineering em 2026-11-12: opção A no arquivo, confirmada pela mensagem “respondido, A”.

A decisão desta etapa está no [arquivo de revisão de Reverse Engineering](../../inception/requirements/documentacao-ata-reuniao-di2/reverse_engineering_questions.md). A opção A autoriza Requirements Analysis. O plano de escrita e a produção dos documentos oficiais permanecem sujeitos às aprovações posteriores exigidas no pedido.
