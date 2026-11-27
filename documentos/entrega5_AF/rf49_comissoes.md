> Entrega final (AF) · Ata, comissões e presença · Versão 1.0 · 27/11/2026.
> Código auditado: `feature/refatoracao-ultima-entrega`, commit <code>614734c</code>. Responsável pela revisão acadêmica: [responsável a informar].
> Estado: implementado, salvo ressalvas expressas. Verificação documental por leitura do código; não equivale à aprovação do professor.

# RF49 - Consultar comissões da organização

## Função

Consultar comissões da organização.

## Descrição

O aplicativo deve permitir a seguinte ação: Listar as comissões visíveis na organização. Caso de uso UC40.

## Entradas

organizacaoId: inteiro positivo na URL; identidade e papel global vindos da sessão.

## Origem

Aplicativo Better Meet, ação “Consultar comissões da organização”; identidade e papel do solicitante extraídos da sessão autenticada, nunca do corpo informado pelo usuário.

## Saída

200: lista de comissões e equipe, em ordem decrescente de criação; lista vazia quando não houver correspondência.

Erros de negócio no formato JSON <code>{ error: string }</code>: 400 identificador inválido; 401 sem sessão; 403 usuário comum sem vínculo na organização. Sessão ausente/inválida: 401; erro inesperado: 500 genérico.

## Destino

Tela do aplicativo que iniciou a operação, por resposta da API de Dados.

## Ação

1. Validar identidade por <code>requireAuth</code> e parâmetros inteiros por <code>parseId</code>; quando houver corpo, validar o schema Yup com <code>stripUnknown: true</code>.
2. Executar <code>GET /api/organizacoes/:organizacaoId/comissoes</code>. Para ADMIN global, consultar todas as comissões da organização; para demais usuários, restringir às comissões cuja equipe contém o usuário.
3. Atualizar a interface somente após confirmação do resultado.

## Pré-condição

Sessão válida; para usuário comum, vínculo na organização.

## Pós-condição

Lista exibida de acordo com a visibilidade do solicitante.

## Efeitos colaterais

Nenhuma alteração persistente.

Rastreabilidade: [UC40](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Comiss%C3%B5es); [DS ‐ Comissões](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DS-%E2%80%90-Comiss%C3%B5es); [RNF58 a RNF60](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RNFS-%E2%80%90-Comiss%C3%B5es); CT-AF-40. Evidência: <code>sistema/api/src/services/comissaoService.ts</code> e os controllers, rotas e schemas correspondentes. Revisão 1.0: descrição conferida no commit <code>614734c</code>, em 27/11/2026; responsável acadêmico [responsável a informar].
