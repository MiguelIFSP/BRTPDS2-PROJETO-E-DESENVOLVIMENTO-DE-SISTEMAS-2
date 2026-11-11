# RNF24 — Ausência de banco de dados próprio

```text
Incremento: Di1 — Informações do sistema (requisito não funcional)
Escopo: RNF24
Branch: feature/refatoracao-documentacao
Commit: 464c190
Data de revisão: 2026-11-10
Responsável(eis): [nome de quem revisa e assina o documento]
Estado: Não verificado (texto migrado do documento anterior; métrica, verificação e resultado a confirmar)
Fontes: documentos/entrega2_Di1/requisitos_e_casos_de_uso.md do commit 464c190 (texto de origem; removido no lote L7, consta no git)
```

## Exigência

A API de Gestão não mantém estado persistente próprio (sem schema/tabelas); autenticação é validada via JWT compartilhado com a Data API, e status é delegado à API de Monitoramento — reduz pontos únicos de falha adicionais

## Requisitos funcionais atingidos

RF22 a RF27. A lista é a primeira atribuição, deduzida dos documentos anteriores (ver `documentos/requisitos.md`).

## Métrica e método de verificação

`[A CONFIRMAR]`: o documento anterior descreve a exigência, mas não define métrica, ambiente nem método de verificação.

## Versões, evidência e resultado

- Versões de tecnologia citadas: as do texto de origem, `[A CONFIRMAR NO CÓDIGO]` nos manifestos e lockfiles do commit consultado.
- Evidência: nenhuma registrada.
- Resultado: `Não executado`.
