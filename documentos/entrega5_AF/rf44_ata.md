> Entrega final (AF) · Ata, comissões e presença · Versão 1.0 · 27/11/2026.
> Código auditado: `feature/refatoracao-ultima-entrega`, commit <code>614734c</code>. Responsável pela revisão acadêmica: [responsável a informar].
> Estado: implementado, salvo ressalvas expressas. Verificação documental por leitura do código; não equivale à aprovação do professor.

# RF44 - Consultar ata

## Função

Consultar ata.

## Descrição

O aplicativo deve permitir a seguinte ação: Consultar o texto salvo, permissões, versão, voto próprio e contagens da ata. Caso de uso UC35.

## Entradas

id: inteiro positivo na URL; identidade obtida da sessão. Sem corpo.

## Origem

Aplicativo Better Meet, ação “Consultar ata”; identidade e papel do solicitante extraídos da sessão autenticada, nunca do corpo informado pelo usuário.

## Saída

200: objeto Ata com conteudoAta string HTML ou null, versaoAta inteiro, flags podeEditar/podeVotar/podeExportar/aprovada/exportada, exportadaAt data ou null, presentes inteiro, meuVoto enum ou null e contagens de votos.

Erros de negócio no formato JSON <code>{ error: string }</code>: 400 id inválido; 401 sem sessão; 403 sem vínculo/presença; 404 reunião inexistente. Sessão ausente/inválida: 401; erro inesperado: 500 genérico.

## Destino

Tela do aplicativo que iniciou a operação, por resposta da API de Dados.

## Ação

1. Validar identidade por <code>requireAuth</code> e parâmetros inteiros por <code>parseId</code>; quando houver corpo, validar o schema Yup com <code>stripUnknown: true</code>.
2. Executar <code>GET /api/reunioes/:id/ata</code>. Consultar vínculo, registro e votos da versão atual; sanitizar HTML; calcular maioria estrita (aprovados > presentes / 2, presentes > 0). Sem texto, retornar null e podeVotar false.
3. Atualizar a interface somente após confirmação do resultado.

## Pré-condição

Sessão válida; vínculo atual na comissão e registro de entrada na reunião. A saída já registrada não elimina a elegibilidade.

## Pós-condição

Nenhuma alteração persistente. A tela recebe a versão vigente.

## Efeitos colaterais

Sem efeitos de escrita.

Rastreabilidade: [UC35](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Ata); [DS ‐ Ata](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DS-%E2%80%90-Ata); [RNF55 a RNF57](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RNFS-%E2%80%90-Ata); CT-AF-35. Evidência: <code>sistema/api/src/services/ataService.ts</code> e os controllers, rotas e schemas correspondentes. Revisão 1.0: descrição conferida no commit <code>614734c</code>, em 27/11/2026; responsável acadêmico [responsável a informar].
