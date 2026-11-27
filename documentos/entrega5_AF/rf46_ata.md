> Entrega final (AF) · Ata, comissões e presença · Versão 1.0 · 27/11/2026.
> Código auditado: `feature/refatoracao-ultima-entrega`, commit <code>614734c</code>. Responsável pela revisão acadêmica: [responsável a informar].
> Estado: implementado, salvo ressalvas expressas. Verificação documental por leitura do código; não equivale à aprovação do professor.

# RF46 - Votar na ata

## Função

Votar na ata.

## Descrição

O aplicativo deve permitir a seguinte ação: Registrar aprovação ou reprovação individual da versão salva. Caso de uso UC37.

## Entradas

id: inteiro positivo; status: APROVADO ou REPROVADO; versaoAta: inteiro obrigatório ≥ 0.

## Origem

Aplicativo Better Meet, ação “Votar na ata”; identidade e papel do solicitante extraídos da sessão autenticada, nunca do corpo informado pelo usuário.

## Saída

200: objeto Ata com voto próprio e contagens atualizadas.

Erros de negócio no formato JSON <code>{ error: string }</code>: 400 enum/versão inválidos; 403 sem presença; 409 sem texto, versão desatualizada ou ata exportada. Sessão ausente/inválida: 401; erro inesperado: 500 genérico.

## Destino

Tela do aplicativo que iniciou a operação, por resposta da API de Dados.

## Ação

1. Validar identidade por <code>requireAuth</code> e parâmetros inteiros por <code>parseId</code>; quando houver corpo, validar o schema Yup com <code>stripUnknown: true</code>.
2. Executar <code>POST /api/reunioes/:id/ata/votar</code>. Bloquear a reunião; conferir versão e disponibilidade; inserir ou atualizar o voto único de reuniaoId/userId; recalcular maioria dos registros de entrada, incluindo quem já saiu.
3. Atualizar a interface somente após confirmação do resultado.

## Pré-condição

Sessão válida; vínculo atual na comissão e registro de entrada na reunião. A saída já registrada não elimina a elegibilidade. Texto salvo e ata não exportada. Não exige voto anterior do presidente.

## Pós-condição

Um voto da pessoa existe para a versão vigente. Antes da exportação, pode ser alterado.

## Efeitos colaterais

A aprovação calculada pode mudar. Não encerra a votação automaticamente.

Rastreabilidade: [UC37](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Ata); [DS ‐ Ata](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DS-%E2%80%90-Ata); [RNF55 a RNF57](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RNFS-%E2%80%90-Ata); CT-AF-37. Evidência: <code>sistema/api/src/services/ataService.ts</code> e os controllers, rotas e schemas correspondentes. Revisão 1.0: descrição conferida no commit <code>614734c</code>, em 27/11/2026; responsável acadêmico [responsável a informar].
