# Unit Test Execution

Ferramentas: Jest 30.5.2 com o preset `jest-expo` 58.0.14 e `@testing-library/react-native` 14.1.0. Configuração na chave `jest` do `package.json` (preset, `resolver` do Reanimated, `setupFiles: ./jest.setup.ts`, e `testPathIgnorePatterns` que exclui `node_modules` e `src/app/`).

## Run Unit Tests

### 1. Execute All Unit Tests
```bash
npm test
```
Para um arquivo só: `npx jest src/components/__tests__/NotificacoesList.test.tsx`.

### 2. Review Test Results
- **Expected**: 155 testes passam em 18 suítes, 0 falhas; cerca de 15 s.
- **Test Coverage** (medido em 2026-11-07, com `--coverage`): instruções 73,06%, ramos 66,36%, funções 65,39%, linhas 74,16%. **Ressalva**: o Jest só mede os 55 arquivos que os testes importam, dos 127 de `src/`; apenas 2 das 21 telas de `src/app/` entram. A cobertura geral real é menor do que o percentual.
- **Coverage command** (relatório fora do repositório, porque `coverage/` não está no `.gitignore`):
```bash
npx jest --coverage --coverageDirectory <pasta-fora-do-repositorio> --coverageReporters=text-summary
```
- **Test Report Location**: saída do terminal; sem relatório em arquivo por padrão.

### 3. Fix Failing Tests
Se um teste falhar:
1. Leia a saída do Jest e identifique o teste.
2. Se TODAS as suítes falham ao iniciar com `[Reanimated] setCSSEventHandler is not available in JSReanimated`, o `resolver` do Reanimated sumiu da configuração `jest` do `package.json`. Ele deve ser `react-native-reanimated/jest/resolver`.
3. Se o teste de `NotificacoesList` falha, lembre que ele mocka `react-native-gesture-handler/ReanimatedSwipeable`; o gesto real não roda no Jest.
4. Corrija o código ou o mock e rode de novo até passar.

## Notas desta migração
- Os 155 testes passaram sem alteração de teste, exceto `apiClient.test.ts` (uma linha: `globalThis.fetch = mockFetch as typeof fetch`).
- `jest.setup.ts` ficou sem alteração: `react-native-gesture-handler/jestSetup`, mock `react-native-worklets/src/mock` e `setUpTests()` do Reanimated.
- Comparação antes e depois: 155 testes em 18 suítes nas duas pontas; tempo de cerca de 30 s para cerca de 15 s (sem cobertura).
