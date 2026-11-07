# Build and Test Summary

Execução de 2026-11-07, Windows 11, Node 24.14.0, npm 11.9.0, branch `feature/migracao-expo-58`.

## Build Status
- **Build Tool**: Expo CLI (SDK 58.0.23) sobre Metro; sem build nativo (geração nativa contínua).
- **Build Status**: Sucesso. `expo export --platform android --platform ios` termina com código 0, sem avisos de depreciação.
- **Build Artifacts**: `entry-*.hbc` do Android (cerca de 4,4 MB) e do iOS (cerca de 4,3 MB), `metadata.json` e assets. Gerados fora do repositório e descartados.
- **Build Time**: `expo export` cerca de 41 s; `npm install` a frio cerca de 73 s.
- **Consistência do lock**: `npm ci --dry-run` com código 0; `npm ls` com código 0.

## Test Execution Summary

### Unit Tests
- **Total Tests**: 155
- **Passed**: 155
- **Failed**: 0
- **Test Suites**: 18 de 18 passam
- **Coverage**: instruções 73,06%, ramos 66,36%, funções 65,39%, linhas 74,16%, medidos só nos 55 arquivos que os testes importam (de 127 em `src/`); 2 das 21 telas entram. Subestima a lacuna real.
- **Status**: Pass

### Static Checks
- **Lint** (`expo lint`): sem problemas.
- **Typecheck** (`tsc --noEmit`): 0 erros (antes: 2).
- **`expo-doctor`**: 20 de 20 checagens passam (antes: 20 de 21).
- **Prettier** (`--end-of-line crlf`) nos arquivos de código alterados: passa.

### Integration Tests
- **Test Scenarios**: 3 (app com as APIs, app com as APIs de monitoramento e gestão, telas com as bibliotecas nativas), todos **manuais**.
- **Passed / Failed**: não executados; dependem de aparelho e das APIs no ar.
- **Status**: Pendente do usuário (`manual-verification-checklist.md`).

### Performance Tests
- Não aplicável (cliente móvel sem servidor próprio; sem metas numéricas). Medidas de comparação registradas em `performance-test-instructions.md`; verificação perceptiva na seção H do checklist.
- **Status**: N/A

### Additional Tests
- **Contract Tests**: N/A (contratos HTTP não mudaram).
- **Security Tests**: `npm audit` comparado: 34 vulnerabilidades antes (1 crítica, 7 altas) contra 33 agora (0 críticas, 0 altas, 32 moderadas, 1 baixa). Os 12 pacotes novos são da cadeia do Jest (dev). Ver `security-test-instructions.md`. Extensões de segurança do AI-DLC: desligadas por decisão do usuário.
- **E2E Tests**: não existem; coberto manualmente pelo checklist.

## Overall Status
- **Build**: Sucesso
- **All Automated Tests**: Pass (155 de 155)
- **Manual verification**: Pendente (iOS e Android; Expo Go e development build)
- **Ready for Operations**: Operations é só um placeholder no AI-DLC v1. Próximo passo prático: concluir o checklist manual e então revisar e commitar.

## Next Steps
1. Executar `manual-verification-checklist.md` em iOS e Android, em Expo Go e em development build.
2. Revisar o `git diff` (o `package-lock.json` é regenerado e não vale revisão linha a linha).
3. Commitar em Conventional Commits em pt-BR (GT-01 do guia) e abrir o PR para `development`. Nenhum commit foi feito pelo AI.
4. Opcional: registrar os testes desta entrega em `documentos/` com IDs `CT-...`, como pede o GT-04 do guia e o `GUIA_DE_DOCUMENTACAO.md`.
