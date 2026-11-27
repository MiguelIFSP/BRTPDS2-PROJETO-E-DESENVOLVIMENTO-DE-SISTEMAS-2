> Entrega final (AF) · Ata, comissões e presença · Versão 1.0 · 27/11/2026.
> Código auditado: `feature/refatoracao-ultima-entrega`, commit <code>614734c</code>. Responsável pela revisão acadêmica: [responsável a informar].
> Estado: implementado, salvo ressalvas expressas. Verificação documental por leitura do código; não equivale à aprovação do professor.

# RF45 - Redigir ata

## Função

Redigir ata.

## Descrição

O aplicativo deve permitir a seguinte ação: Salvar o texto da ata e disponibilizar a versão aos participantes elegíveis. Caso de uso UC36.

## Entradas

id: inteiro positivo; conteudoAta: string HTML, trim, obrigatório, máximo 50.000 caracteres e conteúdo textual após sanitização; versaoAta: inteiro obrigatório ≥ 0.

## Origem

Aplicativo Better Meet, ação “Redigir ata”; identidade e papel do solicitante extraídos da sessão autenticada, nunca do corpo informado pelo usuário.

## Saída

200: objeto Ata atualizado.

Erros de negócio no formato JSON <code>{ error: string }</code>: 400 conteúdo/versão inválidos; 403 papel não editor; 409 versão desatualizada ou ata exportada. Sessão ausente/inválida: 401; erro inesperado: 500 genérico.

## Destino

Tela do aplicativo que iniciou a operação, por resposta da API de Dados.

## Ação

1. Validar identidade por <code>requireAuth</code> e parâmetros inteiros por <code>parseId</code>; quando houver corpo, validar o schema Yup com <code>stripUnknown: true</code>.
2. Executar <code>PUT /api/reunioes/:id/ata</code>. Bloquear a reunião na transação; conferir papel, versão e finalização; sanitizar HTML; se o conteúdo mudar, incrementar versaoAta e excluir votos anteriores na mesma transação. Conteúdo idêntico mantém versão e votos.
3. Atualizar a interface somente após confirmação do resultado.

## Pré-condição

Sessão válida; vínculo atual na comissão e registro de entrada na reunião. A saída já registrada não elimina a elegibilidade. Papel ADMINISTRADOR ou SECRETARIO; ata ainda não exportada.

## Pós-condição

Texto salvo e votação disponível sem depender de voto do presidente.

## Efeitos colaterais

Alteração efetiva invalida todos os votos da versão anterior.

Rastreabilidade: [UC36](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Ata); [DS ‐ Ata](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DS-%E2%80%90-Ata); [RNF55 a RNF57](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RNFS-%E2%80%90-Ata); CT-AF-36. Evidência: <code>sistema/api/src/services/ataService.ts</code> e os controllers, rotas e schemas correspondentes. Revisão 1.0: descrição conferida no commit <code>614734c</code>, em 27/11/2026; responsável acadêmico [responsável a informar].
