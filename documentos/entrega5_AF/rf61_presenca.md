> Entrega final (AF) · Ata, comissões e presença · Versão 1.0 · 27/11/2026.
> Código auditado: `feature/refatoracao-ultima-entrega`, commit <code>614734c</code>. Responsável pela revisão acadêmica: [responsável a informar].
> Estado: implementado, salvo ressalvas expressas. Verificação documental por leitura do código; não equivale à aprovação do professor.

# RF61 - Registrar saída por participante

## Função

Registrar saída por participante.

## Descrição

O aplicativo deve permitir a seguinte ação: Registrar uma saída esquecida por outro participante. Caso de uso UC52.

## Entradas

id e userId: inteiros positivos na URL; sem código ou credencial do participante.

## Origem

Aplicativo Better Meet, ação “Registrar saída por participante”; identidade e papel do solicitante extraídos da sessão autenticada, nunca do corpo informado pelo usuário. O parâmetro userId identifica apenas o destinatário da operação.

## Saída

200: { registro, jaRegistrado, message }.

Erros de negócio no formato JSON <code>{ error: string }</code>: 400 antes do início/ids inválidos; 403 sem papel ou elegibilidade; 404 reunião inexistente; 409 sem entrada, reunião cancelada ou organização não aceita. Sessão ausente/inválida: 401; erro inesperado: 500 genérico.

## Destino

Tela do aplicativo que iniciou a operação, por resposta da API de Dados.

## Ação

1. Validar identidade por <code>requireAuth</code> e parâmetros inteiros por <code>parseId</code>; quando houver corpo, validar o schema Yup com <code>stripUnknown: true</code>.
2. Executar <code>POST /api/reunioes/:id/participantes/:userId/sair</code>. Confirmar ação; bloquear reunião; conferir papel, destinatário e início; exigir entrada; manter saída existente ou gravar hora atual, origemSaida MANUAL e saidaManualPorId; atualizar lista.
3. Atualizar a interface somente após confirmação do resultado.

## Pré-condição

Sessão válida; organização ACEITA; vínculo atual na comissão; participante criador ou com convite ACEITO; reunião não cancelada e relógio do servidor no início da reunião ou depois. Solicitante ADMINISTRADOR atual; destinatário diferente do solicitante; entrada prévia do destinatário.

## Pós-condição

Saída registrada com autoria auditável, mantendo a entrada.

## Efeitos colaterais

Não altera o número de presentes. Aceita reparo após o fim e após exportação da ata.

Rastreabilidade: [UC52](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Presen%C3%A7a); [DS ‐ Presença](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DS-%E2%80%90-Presen%C3%A7a); [RNF61 a RNF63](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RNFS-%E2%80%90-Presen%C3%A7a); CT-AF-52. Evidência: <code>sistema/api/src/services/presencaService.ts</code> e os controllers, rotas e schemas correspondentes. Revisão 1.0: descrição conferida no commit <code>614734c</code>, em 27/11/2026; responsável acadêmico [responsável a informar].
