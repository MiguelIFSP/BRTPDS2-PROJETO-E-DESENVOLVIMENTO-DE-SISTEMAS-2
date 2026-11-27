> Entrega final (AF) · Ata, comissões e presença · Versão 1.0 · 27/11/2026.
> Código auditado: `feature/refatoracao-ultima-entrega`, commit <code>614734c</code>. Responsável pela revisão acadêmica: [responsável a informar].
> Estado: implementado, salvo ressalvas expressas. Verificação documental por leitura do código; não equivale à aprovação do professor.

# RF59 - Registrar saída

## Função

Registrar saída.

## Descrição

O aplicativo deve permitir a seguinte ação: Registrar a própria saída sem perder o horário da entrada. Caso de uso UC50.

## Entradas

id: inteiro positivo; codigoPresenca: string trim obrigatória com exatamente 6 dígitos; confirmação local do aparelho ou Web.

## Origem

Aplicativo Better Meet, ação “Registrar saída”; identidade e papel do solicitante extraídos da sessão autenticada, nunca do corpo informado pelo usuário.

## Saída

200: { registro, jaRegistrado, message }, com saída registrada ou mantida em repetição.

Erros de negócio no formato JSON <code>{ error: string }</code>: 400 antes do início/código inválido; 403 sem elegibilidade; 404 reunião inexistente; 409 sem entrada, cancelamento ou organização não aceita; 429 limite de requisições. Sessão ausente/inválida: 401; erro inesperado: 500 genérico.

## Destino

Tela do aplicativo que iniciou a operação, por resposta da API de Dados.

## Ação

1. Validar identidade por <code>requireAuth</code> e parâmetros inteiros por <code>parseId</code>; quando houver corpo, validar o schema Yup com <code>stripUnknown: true</code>.
2. Executar <code>POST /api/reunioes/:id/sair</code>. Solicitar código e confirmação local; bloquear reunião; conferir horário, elegibilidade e código; exigir registro existente; gravar saidaAt do servidor e origemSaida PROPRIO apenas na primeira saída.
3. Atualizar a interface somente após confirmação do resultado.

## Pré-condição

Sessão válida; organização ACEITA; vínculo atual na comissão; participante criador ou com convite ACEITO; reunião não cancelada e relógio do servidor no início da reunião ou depois. Registro de entrada prévio.

## Pós-condição

Saída registrada; entrada, contagem de presentes e elegibilidade à ata preservadas.

## Efeitos colaterais

Não remove voto nem registro de presença. Pode ocorrer após o fim ou após a finalização da ata.

Rastreabilidade: [UC50](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Presen%C3%A7a); [DS ‐ Presença](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DS-%E2%80%90-Presen%C3%A7a); [RNF61 a RNF63](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RNFS-%E2%80%90-Presen%C3%A7a); CT-AF-50. Evidência: <code>sistema/api/src/services/presencaService.ts</code> e os controllers, rotas e schemas correspondentes. Revisão 1.0: descrição conferida no commit <code>614734c</code>, em 27/11/2026; responsável acadêmico [responsável a informar].
