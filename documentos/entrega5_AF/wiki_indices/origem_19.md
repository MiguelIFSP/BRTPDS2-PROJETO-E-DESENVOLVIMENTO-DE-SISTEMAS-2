> Entrega final (AF) · Ata, comissões e presença · Versão 1.0 · 27/11/2026.
> Código auditado: `feature/refatoracao-ultima-entrega`, commit <code>614734c</code>. Responsável pela revisão acadêmica: [responsável a informar].
> Estado: implementado, salvo ressalvas expressas. Verificação documental por leitura do código; não equivale à aprovação do professor.

> Página de origem preservada. Consulte [DCU - Ata](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Ata) e seus RFs para as regras e os diagramas da versão atual.

# UC20 — Exportar ata

- **Estado/objetivo:** Implementado; preparar documento da versão salva carregada para guardar/compartilhar/imprimir.
- **Atores:** Administrador da comissão; Secretário da comissão; Facilitador da comissão; Membro da comissão.
- **RF/regras:** RF16; RN-ATA07; RNF44 no tratamento do HTML.
- **Gatilho:** tocar Exportar PDF.
- **Entradas:** AtaPdfInput com titulo string, dataReuniao string AAAA-MM-DD e conteudoAta string HTML, do objeto carregado.
- **Pré-condições:** leitura já autorizada no carregamento e texto salvo não vazio; não há reautorização no clique. UI impede exportação repetida em andamento e enquanto busy.
- **Fluxo nativo:** 1) bloquear chamada duplicada; 2) buildAtaPdfHtml valida conteúdo/data e monta template; 3) Sharing.isAvailableAsync; 4) Print.printToFileAsync com base64; 5) exigir base64, criar File em Paths.cache e aguardar write; 6) Sharing.shareAsync; 7) finally libera controle.
- **Alternativa web:** sanitizeAtaHtml, template, window.open, isolar opener, escrever documento, registrar afterprint, focus/print; fechar após evento. O navegador controla salvar/imprimir.
- **Erros:** conteúdo/data inválidos, compartilhamento indisponível, falta de base64, falha de Print/File/Sharing ou janela bloqueada; mensagem/fallback de B.1 e liberação para tentar novamente. Falha de gravação impede compartilhar. Rascunho não é salvo/exportado implicitamente.
- **Pós-condições:** nativo prepara arquivo em cache e invoca gaveta; web invoca impressão isolada. Sem mudança no banco; cancelamento/resolução da chamada não confirma entrega externa.
- **Relações UML:** nenhuma; quatro associações individuais.
- **Rastreabilidade:** S05/S07; dois DS-Exportar-Ata-Pdf; sem tabela/endpoint de PDF; CT-RF16-17–19/21–23 e CT-RNF44-01.

## Auditoria da ficha

| Elipse do diagrama | Ficha | Pré-condições | Pós-condições | Fluxos e erros | Verificado no código |
|---|---|---|---|---|---|
| UC20 — Exportar ata | Ficha acima | Sim | Sim | Sim | Sim |

## Diagrama de casos de uso

![Diagrama de casos de uso](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/images/DCU-Ata-Reuniao.svg)
