# RNF22 — Autorização por papel

```text
Incremento: Di1 — Informações do sistema (requisito não funcional)
Escopo: RNF22
Branch: feature/refatoracao-documentacao
Commit: 464c190
Data de revisão: 2026-11-10
Responsável(eis): [nome de quem revisa e assina o documento]
Estado: Não verificado (texto migrado do documento anterior; métrica, verificação e resultado a confirmar)
Fontes: documentos/entrega2_Di1/requisitos_e_casos_de_uso.md do commit 464c190 (texto de origem; removido no lote L7, consta no git)
```

## Exigência

Toda ação de start/stop/restart exige token JWT válido **e** `role: ADMIN`; um usuário comum autenticado recebe `403` mesmo com token válido. **Limitação conhecida**: a API de Gestão lê o `role` do próprio token (não tem banco), então um administrador rebaixado pelo UC31 continua podendo agir sobre os subsistemas até o token vencer (7 dias) ou até fazer login de novo

## Requisitos funcionais atingidos

RF22, RF23, RF24. A lista é a primeira atribuição, deduzida dos documentos anteriores (ver `documentos/requisitos.md`).

## Métrica e método de verificação

`[A CONFIRMAR]`: o documento anterior descreve a exigência, mas não define métrica, ambiente nem método de verificação.

## Versões, evidência e resultado

- Versões de tecnologia citadas: as do texto de origem, `[A CONFIRMAR NO CÓDIGO]` nos manifestos e lockfiles do commit consultado.
- Evidência: nenhuma registrada.
- Resultado: `Não executado`.
