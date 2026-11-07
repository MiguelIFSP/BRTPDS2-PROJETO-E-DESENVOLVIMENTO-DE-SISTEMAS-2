# Code Quality Assessment

Medido em 2026-11-07, no estado atual do repositório (antes de qualquer alteração de código).

## Test Coverage
- **Overall**: Boa para o que o Jest cobre; sem relatório de cobertura configurado.
- **Unit Tests**: 155 testes passando, 18 suítes, cerca de 30 s. Cobrem componentes base, componentes de domínio, hooks, schemas, services e stores.
- **Integration Tests**: Não há. Arquivos de teste não podem ficar em `src/app/` (`testPathIgnorePatterns`), mas testes em `src/components/` importam duas telas: reuniões (`ReunioesData.test.tsx`) e lista de presença (`listaPresencaScreen.test.tsx`). Os testes mockam `expo-router` por completo. Sem teste automatizado: `AppGate`, `NativeTabs`, a raiz de navegação e as telas de organização, comissão, "mais" e login.

## Code Quality Indicators
- **Linting**: Configurado (`eslint.config.js` com as regras do guia). `expo lint` passa sem avisos.
- **Formatting**: Prettier configurado. `prettier --check` acusa 129 arquivos apenas por fim de linha: o Git está com `core.autocrlf=true` (checkout em CRLF) e o Prettier espera LF; com `--end-of-line crlf` todos passam. Não é defeito de código.
- **Type checking**: `tsc --noEmit` com 2 erros pré-existentes de rota tipada: `ListaPresencaButton.tsx(37)` (`/lista-presenca`) e `UsuarioReportView.tsx(185)` (`/mais/relatorios/usuarios`). Provável causa: `.expo/types` desatualizado, a confirmar.
- **Code Style**: Consistente (regras do guia aplicadas); `any` e `enum` ausentes (as 2 ocorrências são comentários); nenhum `import '../'`; nenhum `TODO` ou `FIXME`.
- **Documentation**: Boa. Comentários explicam o porquê; README e guia atualizados.
- **expo-doctor**: 20 de 21 checagens passam; falha só por 4 pacotes 1 a 2 patches atrás do SDK 57.

## Technical Debt
- Tela `src/app/(tabs)/(reunioes)/index.tsx` com 988 linhas (maior arquivo); `excluir-conta.tsx` com 507.
- `jest.setup.ts` mocka `react-native-worklets/src/mock`. Esse é o caminho que a documentação do Worklets (versão 0.13, guia de testes) indica; a ressalva é que um caminho em `src/` pode mudar entre versões.
- `NativeTabs` importado de `expo-router/unstable-native-tabs` (API instável no SDK 57).
- `config/api.ts` embute `EXPO_PUBLIC_MONITORING_API_KEY` no app (exceção temporária registrada em comentário).
- `.gitignore` contém a linha `example` solta (resíduo).

## Patterns and Anti-patterns
- **Good Patterns**: camadas tela, service e `apiRequest`; stores persistidos com `partialize` e `hasHydrated`; uniões com `as const`; tema único; React Compiler ligado; componentes puros; confirmação por `ConfirmDialog`; acessibilidade nos botões.
- **Anti-patterns**: telas muito longas misturam estado, formulário e renderização (ver Technical Debt); mocks de módulos internos de bibliotecas nos testes.
