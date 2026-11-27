> Entrega final (AF) · Ata, comissões e presença · Versão 1.0 · 27/11/2026.
> Código auditado: `feature/refatoracao-ultima-entrega`, commit <code>614734c</code>. Responsável pela revisão acadêmica: [responsável a informar].
> Estado: implementado, salvo ressalvas expressas. Verificação documental por leitura do código; não equivale à aprovação do professor.

# RF53 - Adicionar membro à comissão

## Função

Adicionar membro à comissão.

## Descrição

O aplicativo deve permitir a seguinte ação: Vincular um integrante da organização à equipe da comissão. Caso de uso UC44.

## Entradas

comissaoId: inteiro positivo; userId: inteiro positivo obrigatório; papel: ADMINISTRADOR, FACILITADOR, SECRETARIO ou MEMBRO, padrão MEMBRO.

## Origem

Aplicativo Better Meet, ação “Adicionar membro à comissão”; identidade e papel do solicitante extraídos da sessão autenticada, nunca do corpo informado pelo usuário.

## Saída

201: vínculo ComissaoEquipe com comissaoId, userId e papel; não inclui dados pessoais aninhados.

Erros de negócio no formato JSON <code>{ error: string }</code>: 400 destinatário fora da organização/dados inválidos; 403 papel insuficiente; 404 comissão inexistente; 409 membro já vinculado. Sessão ausente/inválida: 401; erro inesperado: 500 genérico.

## Destino

Tela do aplicativo que iniciou a operação, por resposta da API de Dados.

## Ação

1. Validar identidade por <code>requireAuth</code> e parâmetros inteiros por <code>parseId</code>; quando houver corpo, validar o schema Yup com <code>stripUnknown: true</code>.
2. Executar <code>POST /api/comissoes/:comissaoId/membros</code>. Conferir papel; impedir Facilitador de atribuir ADMINISTRADOR; conferir vínculo do destinatário na organização; criar vínculo único.
3. Atualizar a interface somente após confirmação do resultado.

## Pré-condição

Sessão válida; ADMINISTRADOR ou FACILITADOR; destinatário integrante da organização.

## Pós-condição

Pessoa incluída uma única vez na equipe.

## Efeitos colaterais

Pessoa passa a ter permissões compatíveis com o papel atribuído.

Rastreabilidade: [UC44](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Comiss%C3%B5es); [DS ‐ Comissões](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DS-%E2%80%90-Comiss%C3%B5es); [RNF58 a RNF60](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RNFS-%E2%80%90-Comiss%C3%B5es); CT-AF-44. Evidência: <code>sistema/api/src/services/comissaoService.ts</code> e os controllers, rotas e schemas correspondentes. Revisão 1.0: descrição conferida no commit <code>614734c</code>, em 27/11/2026; responsável acadêmico [responsável a informar].
