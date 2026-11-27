> Entrega final (AF) · Ata, comissões e presença · Versão 1.0 · 27/11/2026.
> Código auditado: `feature/refatoracao-ultima-entrega`, commit <code>614734c</code>. Responsável pela revisão acadêmica: [responsável a informar].
> Estado: implementado, salvo ressalvas expressas. Verificação documental por leitura do código; não equivale à aprovação do professor.

# RF58 - Registrar entrada

## Função

Registrar entrada.

## Descrição

O aplicativo deve permitir a seguinte ação: Registrar a própria entrada com código e confirmação local. Caso de uso UC49.

## Entradas

id: inteiro positivo; codigoPresenca: string trim obrigatória com exatamente 6 dígitos. Biometria/PIN do aparelho não é enviado à API.

## Origem

Aplicativo Better Meet, ação “Registrar entrada”; identidade e papel do solicitante extraídos da sessão autenticada, nunca do corpo informado pelo usuário.

## Saída

201: { registro, jaRegistrado: false, message }; repetição 200 com jaRegistrado true.

Erros de negócio no formato JSON <code>{ error: string }</code>: 400 antes do início ou código inválido; 403 sem elegibilidade; 404 reunião inexistente; 409 reunião cancelada/encerrada, organização não aceita ou ata finalizada; 429 limite de requisições. Cancelamento local não envia requisição. Sessão ausente/inválida: 401; erro inesperado: 500 genérico.

## Destino

Tela do aplicativo que iniciou a operação, por resposta da API de Dados.

## Ação

1. Validar identidade por <code>requireAuth</code> e parâmetros inteiros por <code>parseId</code>; quando houver corpo, validar o schema Yup com <code>stripUnknown: true</code>.
2. Executar <code>POST /api/reunioes/:id/entrar</code>. Solicitar código e confirmação local; autenticar no aparelho ou confirmar no Web; enviar à API; bloquear reunião; conferir horário, elegibilidade e código; manter registro existente ou criar entradaAt com hora do servidor e origemEntrada PROPRIO.
3. Atualizar a interface somente após confirmação do resultado.

## Pré-condição

Sessão válida; organização ACEITA; vínculo atual na comissão; participante criador ou com convite ACEITO; reunião não cancelada e relógio do servidor no início da reunião ou depois. Nova entrada própria exige AGENDADA e horário anterior ao fim; ata não finalizada.

## Pós-condição

Um registro de entrada por pessoa/reunião, preservado em repetições válidas.

## Efeitos colaterais

Aumenta o número de presentes usado na aprovação da ata e habilita sua consulta/votação.

Rastreabilidade: [UC49](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Presen%C3%A7a); [DS ‐ Presença](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DS-%E2%80%90-Presen%C3%A7a); [RNF61 a RNF63](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RNFS-%E2%80%90-Presen%C3%A7a); CT-AF-49. Evidência: <code>sistema/api/src/services/presencaService.ts</code> e os controllers, rotas e schemas correspondentes. Revisão 1.0: descrição conferida no commit <code>614734c</code>, em 27/11/2026; responsável acadêmico [responsável a informar].
