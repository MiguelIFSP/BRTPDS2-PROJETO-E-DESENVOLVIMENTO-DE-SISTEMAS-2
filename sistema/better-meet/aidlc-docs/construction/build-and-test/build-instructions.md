# Build Instructions

O better-meet não tem etapa de compilação nativa neste repositório (sem `android/` nem `ios/`; geração nativa contínua). O "build" verificável aqui é: instalar, checar tipos e lint, e gerar o bundle JavaScript (Hermes) para Android e iOS.

## Prerequisites
- **Build Tool**: Node.js `^22.13`, `^24.3` ou `>=26` (testado com 24.14.0) e npm 11 (testado com 11.9.0). Versões ímpares do Node (23, 25) não são suportadas pelo SDK 58.
- **Dependencies**: as do `package.json` (Expo SDK 58.0.23, React Native 0.88.1, React 19.3.0). Instaladas por `npm install` ou `npm ci`.
- **Environment Variables** (arquivo `.env`, modelo em `.env.example`; todas obrigatórias, `config/api.ts` falha ao carregar se faltar alguma):
  - `EXPO_PUBLIC_API_URL`: API de Dados, com o prefixo `/api`.
  - `EXPO_PUBLIC_MONITORING_API_URL`: API de Monitoramento.
  - `EXPO_PUBLIC_MANAGEMENT_API_URL`: API de Gestão.
  - `EXPO_PUBLIC_MONITORING_API_KEY`: chave interna da monitoring (exceção temporária registrada no `.env.example`).
  - Nunca coloque segredos em variáveis `EXPO_PUBLIC_*` (EX-13 do guia).
- **System Requirements**: Windows, macOS ou Linux; espaço livre para `node_modules` (1366 pacotes, 679 entradas na raiz; tamanho em disco não medido, estimado em torno de 1 GB). No Windows, 6 arquivos do `react-native` passam de 260 caracteres de caminho quando o projeto está em pasta funda; se o Git ou o Windows reclamar, use `git config core.longpaths true` e uma pasta mais curta.
- **Para rodar em aparelho**: Expo Go atualizado para o SDK 58, ou um development build novo (ver `manual-verification-checklist.md`).

## Build Steps

### 1. Install Dependencies
```bash
cd sistema/better-meet
npm ci
```
`npm ci` instala exatamente o `package-lock.json` e falha se ele divergir do `package.json`. Use `npm install` só para alterar dependências.

### 2. Configure Environment
```bash
cp .env.example .env
# edite o .env com as URLs reais (IP da máquina que roda as APIs, não "localhost", em aparelho físico ou emulador Android)
```

### 3. Verify and Build
```bash
npm run lint
npm run typecheck
npx expo-doctor
npx expo export --platform android --platform ios --output-dir <pasta-fora-do-repositorio>
```
Use uma pasta de saída fora do repositório (ou `dist/`, que já está no `.gitignore`).

### 4. Verify Build Success
- **Expected Output**: lint sem saída de problemas; `tsc` com código de saída 0; `expo-doctor` com "20/20 checks passed"; `expo export` termina com "Exported: ..." e código 0.
- **Build Artifacts**: `_expo/static/js/android/entry-*.hbc` (cerca de 4,4 MB), `_expo/static/js/ios/entry-*.hbc` (cerca de 4,3 MB), `metadata.json` e os assets (fontes Plus Jakarta Sans, Ionicons, imagens).
- **Common Warnings**: o Node imprime `The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set`; é inofensivo. O `npm install` mostra o resumo do `npm audit` (ver `security-test-instructions.md`).

## Troubleshooting

### `npm install` falha com ERESOLVE (peer opcional, ex.: `react-native-windows`, `@expo/ui`)
- **Cause**: o npm tenta resolver peers opcionais ao substituir, no lock, um pacote já travado. Ocorreu nesta migração ao atualizar o SDK.
- **Solution**: sem usar `--force` nem `--legacy-peer-deps`: apague `node_modules` e `package-lock.json` e rode `npm install`. Depois confira `npm ls` (saída 0) e fixe de volta qualquer dependência que tenha flutuado indevidamente.

### Erros de tipo em `ref` de `ScrollView` ou `TextInput`
- **Cause**: o React Native 0.87 em diante usa a API de tipos estrita; `ScrollView` e `TextInput` não servem mais como tipo de instância.
- **Solution**: use `ScrollViewInstance` e `TextInputInstance`, exportados por `react-native`.

### Erro de tipo em rota (`Type '"/..."' is not assignable`) mesmo com a rota existindo
- **Cause**: `.expo/types/router.d.ts` desatualizado (pasta ignorada pelo Git, gerada pelo servidor Expo).
- **Solution**: suba `npx expo start` por alguns segundos para regenerar e rode o `tsc` de novo.

### `expo-doctor` acusa `@types/react`
- **Cause**: o SDK 58 espera `@types/react ~19.3.0`, e `npx expo install @types/react` o grava em `dependencies`.
- **Solution**: deixe uma única entrada, em `devDependencies`.
