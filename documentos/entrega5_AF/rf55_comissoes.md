> Entrega final (AF) · Ata, comissões e presença · Versão 1.0 · 27/11/2026.
> Código auditado: `feature/refatoracao-ultima-entrega`, commit <code>614734c</code>. Responsável pela revisão acadêmica: [responsável a informar].
> Estado: implementado, salvo ressalvas expressas. Verificação documental por leitura do código; não equivale à aprovação do professor.

# RF55 - Remover membro da comissão

## Função

Remover membro da comissão.

## Descrição

O aplicativo deve permitir a seguinte ação: Desvincular uma pessoa da equipe da comissão. Caso de uso UC46.

## Entradas

comissaoId e userId: inteiros positivos; confirmação no aplicativo; sem corpo.

## Origem

Aplicativo Better Meet, ação “Remover membro da comissão”; identidade e papel do solicitante extraídos da sessão autenticada, nunca do corpo informado pelo usuário. O parâmetro userId identifica apenas o destinatário da operação.

## Saída

200: objeto message com “Membro removido com sucesso.”.

Erros de negócio no formato JSON <code>{ error: string }</code>: 400 último administrador/ids inválidos; 403 papel insuficiente; 404 vínculo ou comissão inexistente. Sessão ausente/inválida: 401; erro inesperado: 500 genérico.

## Destino

Tela do aplicativo que iniciou a operação, por resposta da API de Dados.

## Ação

1. Validar identidade por <code>requireAuth</code> e parâmetros inteiros por <code>parseId</code>; quando houver corpo, validar o schema Yup com <code>stripUnknown: true</code>.
2. Executar <code>DELETE /api/comissoes/:comissaoId/membros/:userId</code>. Conferir ator e alvo; impedir Facilitador de remover Administrador; recusar remoção do último Administrador; excluir ComissaoEquipe.
3. Atualizar a interface somente após confirmação do resultado.

## Pré-condição

Sessão válida; ADMINISTRADOR ou FACILITADOR; vínculo alvo existente.

## Pós-condição

Vínculo da equipe removido, sem excluir a conta ou o vínculo na organização.

## Efeitos colaterais

Acesso às funcionalidades restritas à equipe deixa de ser autorizado. A contagem e exclusão não estão na mesma transação (RNF60).

Rastreabilidade: [UC46](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Comiss%C3%B5es); [DS ‐ Comissões](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DS-%E2%80%90-Comiss%C3%B5es); [RNF58 a RNF60](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RNFS-%E2%80%90-Comiss%C3%B5es); CT-AF-46. Evidência: <code>sistema/api/src/services/comissaoService.ts</code> e os controllers, rotas e schemas correspondentes. Revisão 1.0: descrição conferida no commit <code>614734c</code>, em 27/11/2026; responsável acadêmico [responsável a informar].
