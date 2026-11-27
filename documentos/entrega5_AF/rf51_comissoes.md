> Entrega final (AF) · Ata, comissões e presença · Versão 1.0 · 27/11/2026.
> Código auditado: `feature/refatoracao-ultima-entrega`, commit <code>614734c</code>. Responsável pela revisão acadêmica: [responsável a informar].
> Estado: implementado, salvo ressalvas expressas. Verificação documental por leitura do código; não equivale à aprovação do professor.

# RF51 - Editar comissão

## Função

Editar comissão.

## Descrição

O aplicativo deve permitir a seguinte ação: Alterar nome e descrição da comissão. Caso de uso UC42.

## Entradas

id: inteiro positivo; nome: string trim obrigatória até 80 caracteres; descricao: string trim opcional até 500 caracteres.

## Origem

Aplicativo Better Meet, ação “Editar comissão”; identidade e papel do solicitante extraídos da sessão autenticada, nunca do corpo informado pelo usuário.

## Saída

200: comissão atualizada.

Erros de negócio no formato JSON <code>{ error: string }</code>: 400 campos inválidos; 403 papel insuficiente; 404 comissão inexistente. Sessão ausente/inválida: 401; erro inesperado: 500 genérico.

## Destino

Tela do aplicativo que iniciou a operação, por resposta da API de Dados.

## Ação

1. Validar identidade por <code>requireAuth</code> e parâmetros inteiros por <code>parseId</code>; quando houver corpo, validar o schema Yup com <code>stripUnknown: true</code>.
2. Executar <code>PATCH /api/comissoes/:id</code>. Conferir papel atual; validar os campos; atualizar nome e descrição. A organização da comissão não é alterada.
3. Atualizar a interface somente após confirmação do resultado.

## Pré-condição

Sessão válida; ADMINISTRADOR ou FACILITADOR da própria comissão.

## Pós-condição

Nome e descrição persistidos.

## Efeitos colaterais

Nenhum papel de equipe é alterado.

Rastreabilidade: [UC42](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Comiss%C3%B5es); [DS ‐ Comissões](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DS-%E2%80%90-Comiss%C3%B5es); [RNF58 a RNF60](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RNFS-%E2%80%90-Comiss%C3%B5es); CT-AF-42. Evidência: <code>sistema/api/src/services/comissaoService.ts</code> e os controllers, rotas e schemas correspondentes. Revisão 1.0: descrição conferida no commit <code>614734c</code>, em 27/11/2026; responsável acadêmico [responsável a informar].
