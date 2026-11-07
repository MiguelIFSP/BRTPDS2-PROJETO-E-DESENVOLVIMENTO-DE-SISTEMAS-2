# Component Inventory

## Application Packages
- `better-meet` - app Expo (iOS, Android, web) com 21 arquivos de rota, 52 componentes, 9 services, 3 stores, 7 hooks, 7 schemas e 5 utilitários.

## Infrastructure Packages
- Nenhum. Não há CDK, Terraform nem CloudFormation; não existem `android/` nem `ios/` (geração nativa contínua).

## Shared Packages
- Nenhum pacote compartilhado. O `commonSchema.ts` do app espelha manualmente o da API.

## Test Packages
- Testes unitários e de componente dentro do próprio app: 18 arquivos, 155 testes (Jest com `jest-expo` e React Native Testing Library). Telas em `src/app/` ficam fora do Jest.

## Total Count
- **Total Packages**: 1
- **Application**: 1
- **Infrastructure**: 0
- **Shared**: 0
- **Test**: 0 (testes ficam no pacote da aplicação)
- **Arquivos em `src/`**: 127 (82 `.tsx`, 45 `.ts`), cerca de 13,5 mil linhas fora dos testes
