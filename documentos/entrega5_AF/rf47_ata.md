> Entrega final (AF) · Ata, comissões e presença · Versão 1.0 · 27/11/2026.
> Código auditado: `feature/refatoracao-ultima-entrega`, commit <code>614734c</code>. Responsável pela revisão acadêmica: [responsável a informar].
> Estado: implementado, salvo ressalvas expressas. Verificação documental por leitura do código; não equivale à aprovação do professor.

# RF47 - Exportar ata

## Função

Exportar ata.

## Descrição

O aplicativo deve permitir a seguinte ação: Exportar o PDF da versão aprovada e registrar sua finalização. Caso de uso UC38.

## Entradas

id: inteiro positivo; versaoAta: inteiro obrigatório ≥ 0; confirmação da exportação no aplicativo.

## Origem

Aplicativo Better Meet, ação “Exportar ata”; identidade e papel do solicitante extraídos da sessão autenticada, nunca do corpo informado pelo usuário.

## Saída

200: objeto Ata com exportada true e exportadaAt; PDF gerado localmente pelo aplicativo, não pelo endpoint.

Erros de negócio no formato JSON <code>{ error: string }</code>: 400 versão inválida; 403 sem presença; 409 versão desatualizada ou maioria insuficiente. Falha local não finaliza. Sessão ausente/inválida: 401; erro inesperado: 500 genérico.

## Destino

Tela do aplicativo que iniciou a operação, por resposta da API de Dados. O PDF é produzido no aparelho/navegador e entregue ao mecanismo de impressão/compartilhamento.

## Ação

1. Validar identidade por <code>requireAuth</code> e parâmetros inteiros por <code>parseId</code>; quando houver corpo, validar o schema Yup com <code>stripUnknown: true</code>.
2. Executar <code>POST /api/reunioes/:id/ata/exportar</code>. Gerar PDF com exportAtaPdf; no Web confirmar que foi salvo/impresso. Enviar versão à API; bloquear reunião, conferir versão e maioria; gravar ataExportadaAt e ataVersaoExportada. Repetição da versão finalizada é idempotente.
3. Atualizar a interface somente após confirmação do resultado.

## Pré-condição

Sessão válida; vínculo atual na comissão e registro de entrada na reunião. A saída já registrada não elimina a elegibilidade. Texto salvo e maioria estrita favorável; nenhum rascunho pendente na tela.

## Pós-condição

Texto e votos ficam imutáveis após a finalização confirmada no servidor. Reexportar a versão finalizada permanece permitido.

## Efeitos colaterais

Novas entradas passam a ser recusadas; saídas de registros existentes continuam permitidas. O arquivo local e a transação da API não são uma operação atômica.

Rastreabilidade: [UC38](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Ata); [DS ‐ Ata](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DS-%E2%80%90-Ata); [RNF55 a RNF57](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RNFS-%E2%80%90-Ata); CT-AF-38. Evidência: <code>sistema/api/src/services/ataService.ts</code> e os controllers, rotas e schemas correspondentes. Revisão 1.0: descrição conferida no commit <code>614734c</code>, em 27/11/2026; responsável acadêmico [responsável a informar].
