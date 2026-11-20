- **Incremento:** Apresentação final (AF)
- **Escopo:** resumo da Code Generation, parte 2, da unidade revisao-padroes-entrega-final
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** 704478f15192f757223c1efce99f43a7a411888c (base; alterações ainda não commitadas)
- **Data de revisão:** 2026-11-20
- **Responsável(eis):** [nome de quem revisa e aprova]
- **Estado:** Concluído — aguardando aprovação das alterações
- **Fontes:** [plano](../../plans/revisao-padroes-entrega-final-code-generation-plan.md); [requisitos](../../../inception/requirements/revisao-padroes-entrega-final/requirements.md); [verificação no código](../verificacao_codigo.md); [identificadores de antes](identificadores-antes.md)

# Resumo da alteração — revisão dos padrões

Os 28 passos do plano foram executados. Os cinco arquivos foram alterados no lugar, sem cópias, e continuam com o final de linha CRLF da cópia de trabalho. Nenhum arquivo de `sistema/` fora do `aidlc-docs/` e nenhum arquivo de `documentos/` foi alterado.

## 1. Arquivos alterados

A tabela resume o que mudou em cada arquivo. As linhas são as do `git diff --numstat` contra o commit `704478f`.

| Arquivo | Linhas (+/−) | O que mudou |
|---|---|---|
| `GUIA_DE_DOCUMENTACAO.md` | +704 / −430 | Regras novas DOC-26 a DOC-31; DOC-06, 07, 09 a 15, 17 a 24 revisadas; seção nova 14 "Entrega final"; críticas (seção 15) e checklist (seção 16) atualizados; exemplos do RF06 e do RNF06 reescritos e reconferidos no commit `704478f` |
| `PROMPT_DOCUMENTACAO_IA.md` | +63 / −37 | Regras 6 a 19 conforme o guia; seção nova "Redação, estilo e entrega final" com as regras 26 a 31; linhas "Veja também"; "Entrega" e "Antes de entregar" atualizados |
| `GUIA_DE_CODIFICACAO.md` | +268 / −115 | Regras novas EX-19 a EX-22, YP-05, RN-20 a RN-22, UI-09 e GT-06; EX-05, EX-14, EX-18, PR-05, NM-02, YP-04, RN-01, RN-05, RN-11, ZS-01, ZS-02, UI-04 e UI-08 revisadas; todos os avisos "Divergência atual", "Situação atual", "Ajustes previstos" e "Mudança de paleta" retirados; exceções temporárias mantidas como regra (EX-12, EX-13, RN-19); checklists atualizados |
| `PROMPT_AGENTES_IA.md` | +83 / −34 | Seção "Git, agentes de IA e testes" (77 a 80) movida para antes de "Atualização de SDK do Expo" (81 e 82); numeração 1 a 100 em ordem crescente, sem renumerar; seção nova com as regras 91 a 100; regras 11, 22, 29, 31, 35, 40, 44, 48, 49, 53, 59, 66, 74, 76, 79, 80, 81 e 82 conforme o guia; checklist atualizado |
| `RELATORIO_BUGS.md` | +37 | Seção nova "Pendências de padrão — verificação de 2026-11-20", com os itens P1 a P22; itens 1 a 11 intactos |

## 2. Requisitos atendidos

Todos os requisitos da unidade foram escritos. A rastreabilidade detalhada está na seção 4 do plano.

| Grupo | Requisitos | Situação |
|---|---|---|
| Documentação | RQ-D01 a RQ-D15 | Atendidos no guia e no prompt de documentação |
| Código | RQ-C01 a RQ-C18 | Atendidos no guia de código e no prompt de agentes |
| Pendências | RQ-R01 | Atendido no `RELATORIO_BUGS.md`, com acréscimos (seção 4) |
| Não funcionais | RNQ-01 a RNQ-07 | Conferidos durante a execução (passos 15, 25 e 27); a verificação formal é do Build and Test |

## 3. Fontes conferidas

- **Código, commit `704478f`:** fluxo do tema (`MaisScreen`, `useThemePreference`, `useThemeStore`, `usuarioService` do app e da API, `apiClient`, `monitoringService`, `usuarioRoutes`, `authMiddleware`, `errorMiddleware`, `usuarioController`, `usuarioSchema`, `schema.prisma`, migrations `20260918235817_config_usuario` e `20261014120100_adiciona_enums_status_tema`, teste `stores.test.ts`); `passwordHash.ts`; componentes de `src/components/ui/`; `clearFieldError` de `(reunioes)/index.tsx`; `utils/fusoHorario.ts`; licenças e versões de `expo`, `zustand` e `express` em `node_modules` e nos lockfiles.
- **Documentação externa (2026-11-20):** páginas do Better Auth (integração com Expo, e-mail e senha, e-mail, limite de tentativas, OAuth) e do Expo SDK 58 (`expo-local-authentication` e `expo-secure-store`), registradas no `audit.md`.

## 4. Diferenças em relação ao plano

- **`RELATORIO_BUGS.md` com 22 itens, e não 19.** Ao retirar os avisos do guia, apareceram três que não estavam na verificação inicial: EX-11 (parcial: a monitoring ainda usa `Number()` nos ids), GT-04 e RN-14 do painel web (não verificados). Eles entraram como P21 e P22 e na linha de não verificados, e a [verificação](../verificacao_codigo.md) recebeu o acréscimo. A RN-05 foi conferida e está resolvida.
- **Índice de seções do guia de documentação:** a seção "Dados" passou a se chamar "Diagrama relacional e dicionário de dados", a nova "Entrega final" virou a seção 14, e "Críticas" e "Checklist" passaram a 15 e 16. Na seção 2, "Estilo único" ficou como 2.4 e "Documentar com IA" como 2.5. Os identificadores DOC não mudaram. As referências internas ("seção 15", "seção 16") foram atualizadas.

## 5. Pontos `[A CONFIRMAR]` deixados nos guias

A documentação consultada não confirmou estes pontos. Eles ficam para a unidade de código que instalar o Better Auth.

| Ponto | Onde |
|---|---|
| Nome da opção de validade do token de redefinição de senha | EX-14 e regra 31 |
| Resposta igual para e-mail cadastrado ou não no pedido de recuperação | EX-14 |
| Mecanismo de sessão do Better Auth no web, onde o `expo-secure-store` não funciona | EX-14, ZS-01 e regra 66 |
| Verificação do novo e-mail na troca de endereço | EX-21 e regra 93 |
| Generalizações do catálogo de atores | DOC-10 e regra 9 |

## 6. Sugestões fora do plano (não aplicadas)

Estas correções apareceram durante a execução, mas não estavam no plano aprovado. Elas foram desfeitas ou não foram feitas e dependem de decisão.

1. **`OrganizacaoError` como exemplo certo** na NM-01 e na NM-03 do guia e nas regras 10 e 12 do prompt, enquanto a EX-03 e a regra 20 proíbem classe de erro por domínio. Sugestão: trocar o exemplo por `AppError`.
2. **Caminho do `ConfirmDialog`** no exemplo de import (RN-03 e regra 51): o arquivo real é `src/components/ui/ConfirmDialog.tsx`.
3. **`apiRequest` lança `ApiError`** (subclasse de `Error`) no código; a RN-05 e a regra 53 dizem `Error`, e o exemplo da RN-05 não mostra o `ApiError`.
4. **Prefixo da unidade** nos arquivos de plano e de verificação de uma unidade nova do AI-DLC (regra 83), para não sobrescrever os de outra, como foi feito nesta unidade.
5. **Perguntas em caixas de diálogo** quando a pessoa pedir, com transcrição no arquivo (regra 87), como foi feito nesta unidade.

## 7. Comentários de histórico encontrados (NM-08)

Os comentários abaixo não foram alterados, porque só o autor do commit pode removê-los.

- `sistema/api/src/routes/usuarioRoutes.ts:8`: "agora protegido por requireAuth".
- `sistema/api/prisma/schema.prisma`, model `User`: "NOVO: tokens de recuperação de conta (UC02)".

## 8. O que não foi executado

- Geração dos SVG dos modelos PlantUML do guia: o PlantUML não está instalado na máquina (Java 25 está). A verificação fica para o Build and Test.
- Nenhum teste, typecheck, lint, servidor ou build foi executado. O registro de testes do exemplo do RF06 continua sendo a execução real de 2026-11-06, no commit `9e48774`.
