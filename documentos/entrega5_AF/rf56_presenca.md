> Entrega final (AF) · Ata, comissões e presença · Versão 1.0 · 27/11/2026.
> Código auditado: `feature/refatoracao-ultima-entrega`, commit <code>614734c</code>. Responsável pela revisão acadêmica: [responsável a informar].
> Estado: implementado, salvo ressalvas expressas. Verificação documental por leitura do código; não equivale à aprovação do professor.

# RF56 - Consultar código de presença

## Função

Consultar código de presença.

## Descrição

O aplicativo deve permitir a seguinte ação: Exibir o código de presença somente ao Administrador da comissão. Caso de uso UC47.

## Entradas

id: inteiro positivo; identidade da sessão; sem corpo.

## Origem

Aplicativo Better Meet, ação “Consultar código de presença”; identidade e papel do solicitante extraídos da sessão autenticada, nunca do corpo informado pelo usuário.

## Saída

200: { codigoPresenca: string de 6 dígitos ou null em reunião antiga sem código }.

Erros de negócio no formato JSON <code>{ error: string }</code>: 400 id inválido; 401 sem sessão; 403 papel insuficiente; 404 reunião inexistente; 409 organização não aceita. Sessão ausente/inválida: 401; erro inesperado: 500 genérico.

## Destino

Tela do aplicativo que iniciou a operação, por resposta da API de Dados.

## Ação

1. Validar identidade por <code>requireAuth</code> e parâmetros inteiros por <code>parseId</code>; quando houver corpo, validar o schema Yup com <code>stripUnknown: true</code>.
2. Executar <code>GET /api/reunioes/:id/codigo-presenca</code>. Conferir acesso e papel; consultar o código; exibir card com ação de copiar no aplicativo. Leitura não gera código automaticamente.
3. Atualizar a interface somente após confirmação do resultado.

## Pré-condição

Sessão válida; organização ACEITA e ADMINISTRADOR atual da comissão.

## Pós-condição

Administrador pode informar o código aos participantes presentes.

## Efeitos colaterais

Copiar usa a área de transferência local; não altera a reunião.

Rastreabilidade: [UC47](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Presen%C3%A7a); [DS ‐ Presença](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DS-%E2%80%90-Presen%C3%A7a); [RNF61 a RNF63](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RNFS-%E2%80%90-Presen%C3%A7a); CT-AF-47. Evidência: <code>sistema/api/src/services/presencaService.ts</code> e os controllers, rotas e schemas correspondentes. Revisão 1.0: descrição conferida no commit <code>614734c</code>, em 27/11/2026; responsável acadêmico [responsável a informar].
