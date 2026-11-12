# Execution Plan (fluxo curto) — Documentação da migração para o Expo 58

## Etapas
| Etapa | Decisão | Motivo |
|---|---|---|
| Workspace Detection | EXECUTAR | Sempre |
| Reverse Engineering | EXECUTAR só o delta | Há artefatos anteriores, mas anteriores a três commits |
| Requirements Analysis | EXECUTAR (mínima) | Sempre |
| User Stories | PULAR | Manutenção, sem funcionalidade nova |
| Workflow Planning | EXECUTAR | Sempre |
| Application Design / Units Generation | PULAR | Sem componente novo |
| Functional Design / NFR Requirements / NFR Design / Infrastructure Design | PULAR | Sem lógica, dados ou infraestrutura novos |
| Code Generation | SUBSTITUÍDA por geração de documentação | O produto é documentação em `documentos/entrega4_Di3/` |
| Build and Test | SUBSTITUÍDA por verificações de leitura | `tsc`, lint, `jest`, `expo-doctor`; sem servidor nem build |
| Operations | Placeholder na v1 | — |

## Sequência
1. Delta de mudanças por commit (feito).
2. Verificações de leitura dos dois apps (feito).
3. `migracao_expo_58.md`, RNFs, testes e sequências em `documentos/entrega4_Di3/` (feito).
4. Revisão humana, correção do que for pedido e só então commit e Wiki (fora deste ciclo).

## Riscos
- Atribuir ao SDK 58 mudanças que são funcionalidades: mitigado pela separação por commit (seção 2.4 do documento principal).
- Resultados sem evidência: mitigado marcando `Não executado`.
