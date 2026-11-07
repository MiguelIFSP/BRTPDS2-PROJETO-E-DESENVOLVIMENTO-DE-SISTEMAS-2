# Performance Test Instructions

## Purpose
Testes de carga e estresse **não se aplicam**: o app é um cliente móvel sem servidor próprio, e a migração não muda a lógica nem os contratos com as APIs. Esta página registra as medições de comparação que fazem sentido para uma troca de framework, e o que observar a olho nu.

## Performance Requirements
Não há metas numéricas de desempenho nos requisitos. O critério aplicado foi "sem regressão perceptível".

## Medições feitas (2026-11-07, Windows, Node 24.14.0)
| Métrica | Valor | Observação |
|---|---|---|
| Bundle Hermes Android | cerca de 4,4 MB | `expo export`; sem medição do SDK 57 para comparar |
| Bundle Hermes iOS | cerca de 4,3 MB | idem |
| `expo export` (Android e iOS) | cerca de 41 s | a frio, com cache do Metro |
| `npm install` a frio | cerca de 73 s | 1366 pacotes, com cache parcial do npm |
| Suíte de testes (155) | cerca de 15 s | antes da migração: cerca de 30 s |

## Verificação manual de desempenho (no checklist, seção H)
- Tempo de abertura do app e da splash; fluidez da troca de abas e das listas; arrasto do aviso; abertura do seletor de data.
- Compare, se possível, com um aparelho ainda no SDK 57 (outra branch). Registre a diferença percebida.

## Performance Optimization
Se houver regressão perceptível: confirmar que o React Compiler continua ativo (`experiments.reactCompiler` no `app.json`) e comparar o bundle por `expo export` entre as branches.
