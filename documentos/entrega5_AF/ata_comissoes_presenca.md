> Entrega final (AF) · Ata, comissões e presença · Versão 1.0 · 27/11/2026.
> Código auditado: `feature/refatoracao-ultima-entrega`, commit <code>614734c</code>. Responsável pela revisão acadêmica: [responsável a informar].
> Estado: implementado, salvo ressalvas expressas. Verificação documental por leitura do código; não equivale à aprovação do professor.

# Entrega final - Ata, Comissões e Presença

Esta documentação reúne os cinco conteúdos aprovados de ata e revisa comissão e presença no padrão de páginas temáticas com atores, diagrama e casos de uso. Os diagramas de sequência seguem os mesmos casos. Os arquivos PlantUML e SVG ficam versionados na fonte oficial; as imagens do ZIP foram usadas como referência de estilo.

## Navegação da entrega

A tabela relaciona os três módulos às suas páginas de casos de uso, sequência, requisitos e qualidade.

| Módulo | Casos de uso | Sequência | Requisitos funcionais | Requisitos não funcionais |
|---|---|---|---|---|
| Ata | [DCU ‐ Ata](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Ata) | [DS ‐ Ata](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DS-%E2%80%90-Ata) | [RF44](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF44), [RF45](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF45), [RF46](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF46), [RF47](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF47) | [RNF55 a RNF57](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RNFS-%E2%80%90-Ata) |
| Comissões | [DCU ‐ Comissões](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Comiss%C3%B5es) | [DS ‐ Comissões](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DS-%E2%80%90-Comiss%C3%B5es) | [RF48](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF48), [RF49](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF49), [RF50](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF50), [RF51](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF51), [RF52](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF52), [RF53](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF53), [RF54](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF54), [RF55](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF55) | [RNF58 a RNF60](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RNFS-%E2%80%90-Comiss%C3%B5es) |
| Presença | [DCU ‐ Presença](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Presen%C3%A7a) | [DS ‐ Presença](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DS-%E2%80%90-Presen%C3%A7a) | [RF56](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF56), [RF57](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF57), [RF58](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF58), [RF59](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF59), [RF60](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF60), [RF61](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF61) | [RNF61 a RNF63](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RNFS-%E2%80%90-Presen%C3%A7a) |

[Dados, classes e migrations](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/Dados-%E2%80%90-Ata-Comiss%C3%B5es-e-Presen%C3%A7a) · [Testes e rastreabilidade](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/Testes-%E2%80%90-Ata-Comiss%C3%B5es-e-Presen%C3%A7a).

## Fluxo de uso: presença

1. O Administrador da comissão abre a reunião, consulta o Código de Presença e usa Copiar para compartilhá-lo com os presentes. Renovar substitui o código imediatamente; reuniões antigas podem precisar dessa geração.
2. Antes do horário inicial, a interface bloqueia entrada e saída e informa o início previsto. A API confere seu próprio relógio, independentemente do relógio do celular.
3. O participante elegível solicita entrada, informa os seis dígitos e confirma sua identidade no aparelho. Android/iOS utilizam biometria ou a senha/PIN nativos, com <code>disableDeviceFallback: false</code>. Se nenhuma proteção estiver disponível, o app orienta configurar o aparelho ou solicitar registro ao administrador. No Web há confirmação explícita pelo modal; não há biometria nativa garantida.
4. A saída repete código e confirmação e exige entrada anterior. Cancelar a confirmação não registra presença. Repetir uma operação válida preserva seus horários.
5. Se alguém esquecer, o Administrador utiliza Marcar Entrada ou Marcar Saída para outro participante. A API registra hora atual, origem MANUAL e autor. Não existe escolha livre de horário retroativo. O administrador usa o fluxo próprio com código e confirmação para registrar a si mesmo.
6. A entrada própria nova fica indisponível após o término; reparo manual continua possível enquanto a ata não estiver finalizada. Saídas de registros existentes continuam possíveis após o término/finalização, respeitando as demais permissões.

O código compartilhado e a confirmação local reduzem registros acidentais e dificultam uso indevido; não são prova criptográfica de presença física, geolocalização ou identidade enviada ao servidor. <code>ReuniaoRegistro</code> é a fonte da elegibilidade à ata. A lista de presença gerenciada em outros módulos não deve ser confundida automaticamente com uma entrada registrada.

## Fluxo de uso: ata

1. Após registrar entrada, Administrador ou Secretário salva a ata. Todos os integrantes atuais com entrada registrada podem consultá-la; saída registrada não retira esse direito.
2. Qualquer elegível pode Aprovar ou Reprovar imediatamente. Nenhum voto do presidente é pré-requisito. A tela atualiza os dados da ata e não deve exigir uma ação do editor para disponibilizar o texto salvo ao leitor.
3. A aprovação exige <code>aprovados > presentes / 2</code>, com pelo menos um presente e conteúdo salvo. “Presentes” corresponde à contagem de registros de entrada, não apenas a quem já votou nem somente a quem continua sem saída. Exemplo: quatro presentes exigem três aprovações.
4. Antes da finalização, a pessoa pode trocar o voto. Alterar efetivamente o texto incrementa a versão e apaga votos anteriores; salvar conteúdo idêntico preserva-os. Versão desatualizada recebe 409.
5. Exportar PDF fica disponível após aprovação e sem rascunho pendente. O aplicativo gera o arquivo; depois solicita à API a finalização da mesma versão. No Web, o usuário confirma “PDF salvo: finalizar ata”, pois o navegador não informa se a impressão foi cancelada.
6. Após confirmação do servidor, aparece “Ata finalizada e exportada — votação encerrada”. Editar e votar são bloqueados; reexportar a versão finalizada é permitido.

A geração do arquivo ocorre antes da finalização no servidor. Se outra pessoa alterar a versão ou o quorum nesse intervalo, a API pode rejeitar a finalização com 409; possuir um arquivo local não prova que a ata foi finalizada. Não existe assinatura digital nem atestado de impressão física. A maioria simples, sozinha, ainda não torna a ata imutável: o marco definitivo é a exportação registrada.

## Fluxo de uso: comissões

O integrante de uma organização aceita pode criar uma comissão e recebe o papel ADMINISTRADOR. A consulta comum mostra somente comissões da própria equipe; ADMIN global possui leitura ampliada. Administrador e Facilitador editam nome/descrição e gerenciam membros, mas o Facilitador não promove, altera ou remove Administrador. Apenas Administrador da comissão a exclui. O vínculo na organização é necessário para incluir um membro. Secretário e Membro não recebem poderes de gestão de equipe.

O último Administrador não pode ser removido ou rebaixado numa operação sequencial válida. A checagem de quantidade ainda não é atômica com a escrita, conforme RNF60. O código não estabelece um “criador intransferível”; a responsabilidade decorre do papel na equipe.

## Contratos HTTP

Todas as rotas exigem sessão por <code>requireAuth</code>. A identidade do ator é extraída da sessão; <code>userId</code> de uma URL identifica o destinatário, quando aplicável. A tabela permite localizar o contrato detalhado em cada RF.

| Ação | Endpoint | Contrato |
|---|---|---|
| Consultar ata | <code>GET /api/reunioes/:id/ata</code> | [RF44](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF44) |
| Redigir ata | <code>PUT /api/reunioes/:id/ata</code> | [RF45](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF45) |
| Votar na ata | <code>POST /api/reunioes/:id/ata/votar</code> | [RF46](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF46) |
| Exportar ata | <code>POST /api/reunioes/:id/ata/exportar</code> | [RF47](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF47) |
| Criar comissão | <code>POST /api/comissoes</code> | [RF48](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF48) |
| Consultar comissões da organização | <code>GET /api/organizacoes/:organizacaoId/comissoes</code> | [RF49](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF49) |
| Consultar comissão | <code>GET /api/comissoes/:id</code> | [RF50](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF50) |
| Editar comissão | <code>PATCH /api/comissoes/:id</code> | [RF51](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF51) |
| Excluir comissão | <code>DELETE /api/comissoes/:id</code> | [RF52](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF52) |
| Adicionar membro à comissão | <code>POST /api/comissoes/:comissaoId/membros</code> | [RF53](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF53) |
| Alterar papel de membro | <code>PATCH /api/comissoes/:comissaoId/membros/:userId</code> | [RF54](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF54) |
| Remover membro da comissão | <code>DELETE /api/comissoes/:comissaoId/membros/:userId</code> | [RF55](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF55) |
| Consultar código de presença | <code>GET /api/reunioes/:id/codigo-presenca</code> | [RF56](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF56) |
| Renovar código de presença | <code>POST /api/reunioes/:id/codigo-presenca</code> | [RF57](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF57) |
| Registrar entrada | <code>POST /api/reunioes/:id/entrar</code> | [RF58](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF58) |
| Registrar saída | <code>POST /api/reunioes/:id/sair</code> | [RF59](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF59) |
| Registrar entrada por participante | <code>POST /api/reunioes/:id/participantes/:userId/entrar</code> | [RF60](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF60) |
| Registrar saída por participante | <code>POST /api/reunioes/:id/participantes/:userId/sair</code> | [RF61](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF61) |

## Correspondência e divergências documentais

Os números foram conferidos no código documental e na Wiki. O índice já reservava RF41 a RF43, apesar de nem todas as páginas correspondentes existirem; por isso, esta entrega começa no RF44. RNF50 a RNF54 permanecem reservados à compatibilidade Expo. Os identificadores antigos repetidos não são reutilizados como novos casos.

| Conteúdo anterior | Referência canônica desta entrega | Tratamento |
|---|---|---|
| Consultar, Redigir, Votar e Exportar ata (UC17 a UC20 antigos) | UC35 a UC38 / RF44 a RF47 | Conteúdo aprovado integral nos blocos de origem de DCU - Ata; fichas atuais e diagramas vinculados. |
| RF40: Gerenciar atas de reunião | Documentação de origem em DCU - Ata; RF44 a RF47 detalham o estado atual | Preservado; o índice também atribui RF40 ao histórico do monitoramento, sem sobrescrever esse trabalho. |
| Caso de uso de comissão marcado revisar | UC39 a UC46 / RF48 a RF55 | Revisado por ação e por papel, sem permissões globais fictícias. |
| Entrada e saída antigas (UC27/UC28) e RF35/RF36 do índice | UC49/UC50 / RF58/RF59 | Referências antigas mantidas como histórico; fichas atuais incluem horário, código e confirmação. |
| Código e registro manual | UC47/UC48/UC51/UC52 / RF56/RF57/RF60/RF61 | Documentação funcional, dados e testes adicionados. |

As fichas históricas de ata descrevem uma etapa anterior sem registro da exportação; o código auditado possui o endpoint e os campos de finalização. Os exemplos de UML não substituem schema ou permissões reais. O código usa <code>ataExportadaAt</code>, não <code>ataExportadaEm</code>, e horário calculado, não uma coluna <code>dataInicio</code>.

## Evidências e limites

Foram consultados <code>schema.prisma</code>, as migrations de ata/presença, rotas, controllers, schemas e services de ata/comissão/reunião/presença, <code>AtaReuniao.tsx</code>, os utilitários de confirmação e PDF, <code>docs/openapi.yaml</code> e as suítes indicadas na página de testes. Código e schema prevalecem quando páginas históricas divergem.

Não foram alteradas regras do aplicativo nesta entrega documental. Não foram executados ensaios físicos de biometria, impressão, carga ou concorrência de último administrador. A cobertura e os resultados de execução devem ser registrados separadamente da inspeção.

Fonte oficial: [documentos/entrega5_AF](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/blob/feature/documentacao-ata-comissao-presenca/documentos/entrega5_AF).

## Histórico de revisão

A revisão registra o recorte documentado nesta entrega.

| Versão | Data | Alteração | Responsável |
|---|---|---|---|
| 1.0 | 27/11/2026 | Consolidação da ata e revisão de comissão e presença conforme código auditado. | [responsável a informar] |
