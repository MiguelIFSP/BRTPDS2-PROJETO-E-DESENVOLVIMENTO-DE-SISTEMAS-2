- **Commit:** aed2702 (alterações da refatoração da apresentação final ainda sem commit)
- **Data de revisão:** 2026-11-21
- **Estado:** Contagens atualizadas em 2026-11-21; o total de arquivos em `src/` e de linhas não foi refeito [A CONFIRMAR NO CÓDIGO]
- **Fontes:** `sistema/better-meet/src/`; relatório de código da unidade U8

# Component Inventory

## Application Packages
- `better-meet` - app Expo (iOS, Android, web) com 27 arquivos de rota, 63 componentes, 11 services, 3 stores, 9 hooks, 8 schemas, 20 utilitários e 2 arquivos de `lib/` (contagem de arquivos `.ts` e `.tsx` fora de `__tests__`, em 2026-11-21).

## Infrastructure Packages
- Nenhum. Não há CDK, Terraform nem CloudFormation; não existem `android/` nem `ios/` (geração nativa contínua).

## Shared Packages
- Nenhum pacote compartilhado. O `commonSchema.ts` do app espelha manualmente o da API.

## Test Packages
- Testes unitários e de componente dentro do próprio app: 45 suítes e 312 testes em 2026-11-21 (relatório da unidade U8) (Jest com `jest-expo` e React Native Testing Library). Telas em `src/app/` ficam fora do Jest.

## Total Count
- **Total Packages**: 1
- **Application**: 1
- **Infrastructure**: 0
- **Shared**: 0
- **Test**: 0 (testes ficam no pacote da aplicação)
- **Arquivos em `src/`**: 127 (82 `.tsx`, 45 `.ts`), cerca de 13,5 mil linhas fora dos testes
