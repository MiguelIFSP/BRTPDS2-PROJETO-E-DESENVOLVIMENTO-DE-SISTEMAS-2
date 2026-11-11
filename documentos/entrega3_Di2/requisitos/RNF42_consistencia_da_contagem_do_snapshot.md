# RNF42 — Consistência da contagem do snapshot

```text
Incremento: Di2 — Lista de presença (requisito não funcional; era RNF-LP01)
Escopo: RNF42
Branch: feature/refatoracao-documentacao
Commit: 464c190
Data de revisão: 2026-11-10
Responsável(eis): [nome de quem revisa e assina o documento]
Estado: Não verificado (texto migrado do documento anterior; métrica, verificação e resultado a confirmar)
Fontes: documentos/entrega3_Di2/lista_presenca.md (tabela "Requisitos não funcionais verificáveis")
```

## Exigência

No snapshot original, `presentes + atrasados + sairamAntes + ausentes = aceitos`, e linhas = aceitos + sem resposta, em 100% dos resultados válidos.

## Requisitos funcionais atingidos

RF37. A lista é a primeira atribuição, deduzida dos documentos anteriores (ver `documentos/requisitos.md`).

## Métrica e método de verificação

Método de verificação do texto de origem: Combinações de convite e status; núcleo puro.

## Versões, evidência e resultado

- Versões de tecnologia citadas: as do texto de origem, `[A CONFIRMAR NO CÓDIGO]` nos manifestos e lockfiles do commit consultado.
- Evidência: nenhuma registrada.
- Resultado: `Não executado`.
