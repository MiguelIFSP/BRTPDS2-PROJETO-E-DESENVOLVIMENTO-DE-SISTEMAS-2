# Security Test Instructions

As extensões de segurança do AI-DLC ficaram desligadas por decisão do usuário. Esta página registra só a verificação de dependências, que é pertinente a uma migração de pacotes.

## Dependency Audit
```bash
npm audit
npm audit --json
```

## Resultado comparado (2026-11-07)
Medido com `npm audit` sobre o lock de antes (HEAD) e o de agora.

| | Baixa | Moderada | Alta | Crítica | Total |
|---|---|---|---|---|---|
| Antes da migração | 9 | 17 | 7 | 1 | 34 |
| Depois da migração | 1 | 32 | 0 | 0 | 33 |

- A migração **eliminou** a vulnerabilidade crítica e as 7 altas, e os 13 pacotes que deixaram de ser vulneráveis.
- Os 12 pacotes vulneráveis **novos** são todos da cadeia do Jest 30 (`jest-runner`, `jest-circus`, `babel-jest`, `@jest/transform` e afins): ferramenta de desenvolvimento, que não entra no bundle do app.
- Dependências diretas apontadas hoje (todas moderadas): `expo`, `jest`, `jest-expo`, `eslint-config-expo` e `@expo/ngrok`. A origem está em pacotes transitivos; não foi investigada.
- Não foi aplicado `npm audit fix`, para não alterar versões fora do SDK.

## Other checks
- Nenhum segredo foi adicionado; `EXPO_PUBLIC_*` só tem URLs e a chave pública da monitoring (exceção temporária já registrada).
- Nenhuma dependência nova de runtime além das do SDK 58; as novas são peers de teste (`@react-native/jest-preset`, `test-renderer`).
