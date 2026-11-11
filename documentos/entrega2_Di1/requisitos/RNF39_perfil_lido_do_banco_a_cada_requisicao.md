# RNF39 — Perfil lido do banco a cada requisição

```text
Incremento: Di1 — Informações do sistema (requisito não funcional)
Escopo: RNF39
Branch: feature/refatoracao-documentacao
Commit: 464c190
Data de revisão: 2026-11-10
Responsável(eis): [nome de quem revisa e assina o documento]
Estado: Não verificado (texto migrado do documento anterior; métrica, verificação e resultado a confirmar)
Fontes: documentos/entrega2_Di1/requisitos_e_casos_de_uso.md do commit 464c190 (texto de origem; removido no lote L7, consta no git)
```

## Exigência

Na Data API, o token comprova quem é a pessoa, mas o perfil (`role`) é lido do banco a cada requisição. Assim, promoção e rebaixamento valem na próxima requisição (sem esperar o token de 7 dias vencer), e o token de uma conta excluída deixa de valer (`401`)

## Requisitos funcionais atingidos

RF30, RF31. A lista é a primeira atribuição, deduzida dos documentos anteriores (ver `documentos/requisitos.md`).

## Métrica e método de verificação

`[A CONFIRMAR]`: o documento anterior descreve a exigência, mas não define métrica, ambiente nem método de verificação.

## Versões, evidência e resultado

- Versões de tecnologia citadas: as do texto de origem, `[A CONFIRMAR NO CÓDIGO]` nos manifestos e lockfiles do commit consultado.
- Evidência: nenhuma registrada.
- Resultado: `Não executado`.
