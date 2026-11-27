> Entrega final (AF) · Ata, comissões e presença · Versão 1.0 · 27/11/2026.
> Código auditado: `feature/refatoracao-ultima-entrega`, commit <code>614734c</code>. Responsável pela revisão acadêmica: [responsável a informar].
> Estado: implementado, salvo ressalvas expressas. Verificação documental por leitura do código; não equivale à aprovação do professor.

# RF48 - Criar comissão

## Função

Criar comissão.

## Descrição

O aplicativo deve permitir a seguinte ação: Criar uma comissão vinculada à organização. Caso de uso UC39.

## Entradas

organizacaoId: inteiro positivo obrigatório; nome: string trim obrigatória até 80 caracteres; descricao: string trim opcional até 500 caracteres.

## Origem

Aplicativo Better Meet, ação “Criar comissão”; identidade e papel do solicitante extraídos da sessão autenticada, nunca do corpo informado pelo usuário.

## Saída

201: objeto Comissao (id, nome, descricao, createdAt, organizacaoId). O vínculo ADMINISTRADOR é persistido, mas a equipe não integra essa resposta.

Erros de negócio no formato JSON <code>{ error: string }</code>: 400 dados inválidos; 403 sem vínculo; 404 organização inexistente; 409 organização não aceita. Sessão ausente/inválida: 401; erro inesperado: 500 genérico.

## Destino

Tela do aplicativo que iniciou a operação, por resposta da API de Dados.

## Ação

1. Validar identidade por <code>requireAuth</code> e parâmetros inteiros por <code>parseId</code>; quando houver corpo, validar o schema Yup com <code>stripUnknown: true</code>.
2. Executar <code>POST /api/comissoes</code>. Conferir organização e vínculo; criar Comissao e ComissaoEquipe do autor por escrita aninhada do Prisma.
3. Atualizar a interface somente após confirmação do resultado.

## Pré-condição

Sessão válida e vínculo na organização com status ACEITA.

## Pós-condição

Comissão vinculada à organização e com administrador inicial.

## Efeitos colaterais

Criação de vínculo de equipe para o autor.

Rastreabilidade: [UC39](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Comiss%C3%B5es); [DS ‐ Comissões](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DS-%E2%80%90-Comiss%C3%B5es); [RNF58 a RNF60](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RNFS-%E2%80%90-Comiss%C3%B5es); CT-AF-39. Evidência: <code>sistema/api/src/services/comissaoService.ts</code> e os controllers, rotas e schemas correspondentes. Revisão 1.0: descrição conferida no commit <code>614734c</code>, em 27/11/2026; responsável acadêmico [responsável a informar].
