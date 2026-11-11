# RNF27 — Setup idempotente

```text
Incremento: Di1 — Informações do sistema (requisito não funcional)
Escopo: RNF27
Branch: feature/refatoracao-documentacao
Commit: 464c190
Data de revisão: 2026-11-10
Responsável(eis): [nome de quem revisa e assina o documento]
Estado: Não verificado (texto migrado do documento anterior; métrica, verificação e resultado a confirmar)
Fontes: documentos/entrega2_Di1/requisitos_e_casos_de_uso.md do commit 464c190 (texto de origem; removido no lote L7, consta no git)
```

## Exigência

O script de setup (`start-all.ps1`) deve poder ser executado repetidas vezes sem duplicar containers, sem sobrescrever segredos já válidos nos `.env` e sem alterar o banco quando não houver migration pendente (`api`) ou quando o schema já estiver em sincronia (`monitoring-better-meet`)

## Requisitos funcionais atingidos

RF26. A lista é a primeira atribuição, deduzida dos documentos anteriores (ver `documentos/requisitos.md`).

## Métrica e método de verificação

`[A CONFIRMAR]`: o documento anterior descreve a exigência, mas não define métrica, ambiente nem método de verificação.

## Versões, evidência e resultado

- Versões de tecnologia citadas: as do texto de origem, `[A CONFIRMAR NO CÓDIGO]` nos manifestos e lockfiles do commit consultado.
- Evidência: nenhuma registrada.
- Resultado: `Não executado`.
