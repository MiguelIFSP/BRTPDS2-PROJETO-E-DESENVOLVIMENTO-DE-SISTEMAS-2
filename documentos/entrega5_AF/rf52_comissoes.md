> Entrega final (AF) · Ata, comissões e presença · Versão 1.0 · 27/11/2026.
> Código auditado: `feature/refatoracao-ultima-entrega`, commit <code>614734c</code>. Responsável pela revisão acadêmica: [responsável a informar].
> Estado: implementado, salvo ressalvas expressas. Verificação documental por leitura do código; não equivale à aprovação do professor.

# RF52 - Excluir comissão

## Função

Excluir comissão.

## Descrição

O aplicativo deve permitir a seguinte ação: Excluir a comissão após confirmação explícita. Caso de uso UC43.

## Entradas

id: inteiro positivo; confirmação no aplicativo; sem corpo.

## Origem

Aplicativo Better Meet, ação “Excluir comissão”; identidade e papel do solicitante extraídos da sessão autenticada, nunca do corpo informado pelo usuário.

## Saída

200: objeto message com “Comissão excluída com sucesso.”.

Erros de negócio no formato JSON <code>{ error: string }</code>: 400 id inválido; 403 papel insuficiente; 404 comissão inexistente. Sessão ausente/inválida: 401; erro inesperado: 500 genérico.

## Destino

Tela do aplicativo que iniciou a operação, por resposta da API de Dados.

## Ação

1. Validar identidade por <code>requireAuth</code> e parâmetros inteiros por <code>parseId</code>; quando houver corpo, validar o schema Yup com <code>stripUnknown: true</code>.
2. Executar <code>DELETE /api/comissoes/:id</code>. Solicitar confirmação; conferir papel; excluir Comissao, aplicando os relacionamentos onDelete Cascade do schema.
3. Atualizar a interface somente após confirmação do resultado.

## Pré-condição

Sessão válida; ADMINISTRADOR da própria comissão.

## Pós-condição

Comissão removida.

## Efeitos colaterais

Equipe e reuniões dependentes são removidas em cascata, incluindo dados dependentes das reuniões.

Rastreabilidade: [UC43](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Comiss%C3%B5es); [DS ‐ Comissões](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DS-%E2%80%90-Comiss%C3%B5es); [RNF58 a RNF60](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RNFS-%E2%80%90-Comiss%C3%B5es); CT-AF-43. Evidência: <code>sistema/api/src/services/comissaoService.ts</code> e os controllers, rotas e schemas correspondentes. Revisão 1.0: descrição conferida no commit <code>614734c</code>, em 27/11/2026; responsável acadêmico [responsável a informar].
