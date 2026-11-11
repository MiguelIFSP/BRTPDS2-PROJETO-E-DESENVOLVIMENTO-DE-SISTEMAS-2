# RNF23 — Resposta antes de efeito colateral irreversível

```text
Incremento: Di1 — Informações do sistema (requisito não funcional)
Escopo: RNF23
Branch: feature/refatoracao-documentacao
Commit: 464c190
Data de revisão: 2026-11-10
Responsável(eis): [nome de quem revisa e assina o documento]
Estado: Não verificado (texto migrado do documento anterior; métrica, verificação e resultado a confirmar)
Fontes: documentos/entrega2_Di1/requisitos_e_casos_de_uso.md do commit 464c190 (texto de origem; removido no lote L7, consta no git)
```

## Exigência

Ao agir sobre si mesma, a API de Gestão responde `202` antes de disparar o comando de restart/stop, evitando deixar a conexão HTTP pendente indefinidamente

## Requisitos funcionais atingidos

RF24. A lista é a primeira atribuição, deduzida dos documentos anteriores (ver `documentos/requisitos.md`).

## Métrica e método de verificação

`[A CONFIRMAR]`: o documento anterior descreve a exigência, mas não define métrica, ambiente nem método de verificação.

## Versões, evidência e resultado

- Versões de tecnologia citadas: as do texto de origem, `[A CONFIRMAR NO CÓDIGO]` nos manifestos e lockfiles do commit consultado.
- Evidência: nenhuma registrada.
- Resultado: `Não executado`.
