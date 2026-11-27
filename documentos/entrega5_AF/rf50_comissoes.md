> Entrega final (AF) · Ata, comissões e presença · Versão 1.0 · 27/11/2026.
> Código auditado: `feature/refatoracao-ultima-entrega`, commit <code>614734c</code>. Responsável pela revisão acadêmica: [responsável a informar].
> Estado: implementado, salvo ressalvas expressas. Verificação documental por leitura do código; não equivale à aprovação do professor.

# RF50 - Consultar comissão

## Função

Consultar comissão.

## Descrição

O aplicativo deve permitir a seguinte ação: Consultar identificação, organização e equipe da comissão. Caso de uso UC41.

## Entradas

id: inteiro positivo na URL; identidade e papel global da sessão.

## Origem

Aplicativo Better Meet, ação “Consultar comissão”; identidade e papel do solicitante extraídos da sessão autenticada, nunca do corpo informado pelo usuário.

## Saída

200: comissão, referência da organização e equipe com id, nome e e-mail das pessoas.

Erros de negócio no formato JSON <code>{ error: string }</code>: 400 id inválido; 403 sem autorização; 404 comissão inexistente. Sessão ausente/inválida: 401; erro inesperado: 500 genérico.

## Destino

Tela do aplicativo que iniciou a operação, por resposta da API de Dados.

## Ação

1. Validar identidade por <code>requireAuth</code> e parâmetros inteiros por <code>parseId</code>; quando houver corpo, validar o schema Yup com <code>stripUnknown: true</code>.
2. Executar <code>GET /api/comissoes/:id</code>. Localizar comissão; conferir vínculos ou exceção de consulta do ADMIN global; consultar equipe ordenada por papel e nome.
3. Atualizar a interface somente após confirmação do resultado.

## Pré-condição

Sessão válida; ADMIN global ou integrante da organização e da equipe da comissão.

## Pós-condição

Detalhes exibidos sem conceder poderes de gestão pelo simples acesso.

## Efeitos colaterais

Nenhuma alteração persistente.

Rastreabilidade: [UC41](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Comiss%C3%B5es); [DS ‐ Comissões](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DS-%E2%80%90-Comiss%C3%B5es); [RNF58 a RNF60](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RNFS-%E2%80%90-Comiss%C3%B5es); CT-AF-41. Evidência: <code>sistema/api/src/services/comissaoService.ts</code> e os controllers, rotas e schemas correspondentes. Revisão 1.0: descrição conferida no commit <code>614734c</code>, em 27/11/2026; responsável acadêmico [responsável a informar].
