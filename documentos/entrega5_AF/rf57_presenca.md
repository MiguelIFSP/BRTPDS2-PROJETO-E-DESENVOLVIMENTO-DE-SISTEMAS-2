> Entrega final (AF) · Ata, comissões e presença · Versão 1.0 · 27/11/2026.
> Código auditado: `feature/refatoracao-ultima-entrega`, commit <code>614734c</code>. Responsável pela revisão acadêmica: [responsável a informar].
> Estado: implementado, salvo ressalvas expressas. Verificação documental por leitura do código; não equivale à aprovação do professor.

# RF57 - Renovar código de presença

## Função

Renovar código de presença.

## Descrição

O aplicativo deve permitir a seguinte ação: Gerar ou substituir o código da reunião. Caso de uso UC48.

## Entradas

id: inteiro positivo; identidade da sessão; sem corpo.

## Origem

Aplicativo Better Meet, ação “Renovar código de presença”; identidade e papel do solicitante extraídos da sessão autenticada, nunca do corpo informado pelo usuário.

## Saída

200: { codigoPresenca: string de 6 dígitos }.

Erros de negócio no formato JSON <code>{ error: string }</code>: 400 id inválido; 403 papel insuficiente; 404 reunião inexistente; 409 organização não aceita; 429 limite de requisições. Sessão ausente/inválida: 401; erro inesperado: 500 genérico.

## Destino

Tela do aplicativo que iniciou a operação, por resposta da API de Dados.

## Ação

1. Validar identidade por <code>requireAuth</code> e parâmetros inteiros por <code>parseId</code>; quando houver corpo, validar o schema Yup com <code>stripUnknown: true</code>.
2. Executar <code>POST /api/reunioes/:id/codigo-presenca</code>. Bloquear reunião; conferir acesso; gerar número criptograficamente aleatório entre 000000 e 999999 diferente do anterior; persistir e atualizar card.
3. Atualizar a interface somente após confirmação do resultado.

## Pré-condição

Sessão válida; organização ACEITA e ADMINISTRADOR atual da comissão.

## Pós-condição

Somente o novo código autoriza registros próprios.

## Efeitos colaterais

O código anterior perde validade imediatamente. Reuniões novas recebem código na criação.

Rastreabilidade: [UC48](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Presen%C3%A7a); [DS ‐ Presença](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DS-%E2%80%90-Presen%C3%A7a); [RNF61 a RNF63](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RNFS-%E2%80%90-Presen%C3%A7a); CT-AF-48. Evidência: <code>sistema/api/src/services/presencaService.ts</code> e os controllers, rotas e schemas correspondentes. Revisão 1.0: descrição conferida no commit <code>614734c</code>, em 27/11/2026; responsável acadêmico [responsável a informar].
