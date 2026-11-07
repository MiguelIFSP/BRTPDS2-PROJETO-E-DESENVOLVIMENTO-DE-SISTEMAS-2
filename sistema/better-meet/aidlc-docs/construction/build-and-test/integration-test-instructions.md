# Integration Test Instructions

## Purpose
O projeto não tem testes de integração automatizados. As integrações do app são com as três APIs HTTP (`sistema/api`, `sistema/monitoring-better-meet`, `sistema/management-better-meet`), que **não foram alteradas** nesta migração, e entre as telas e as bibliotecas nativas atualizadas. A verificação é manual, com as APIs no ar, e está detalhada em `manual-verification-checklist.md`.

## Test Scenarios

### Scenario 1: App (SDK 58) → API de Dados
- **Description**: as chamadas por `apiRequest` continuam funcionando com o React Native 0.88 (`fetch`, JSON, cabeçalho `Authorization`).
- **Setup**: API de Dados rodando; `.env` com `EXPO_PUBLIC_API_URL`; usuário de teste.
- **Test Steps**: login, listar organizações, abrir um detalhe, criar uma reunião.
- **Expected Results**: sem erro de rede; mensagens de erro da API aparecem em pt-BR.
- **Cleanup**: excluir os dados de teste criados.

### Scenario 2: App → API de Monitoramento e API de Gestão
- **Description**: tela de status (`Mais > Status`) consulta o histórico e, para ADMIN, dispara checagem e start, stop ou restart.
- **Setup**: as duas APIs no ar; usuário ADMIN; `EXPO_PUBLIC_MONITORING_API_KEY` válida.
- **Test Steps**: abrir a tela, pedir uma checagem imediata.
- **Expected Results**: status e histórico exibidos; sem erro de chave.

### Scenario 3: Telas → bibliotecas nativas atualizadas
- **Description**: `NativeTabs` (Router 58), `ReanimatedSwipeable` (gesture-handler 3), `DateTimePicker` (9.2.1), `SafeAreaView` e `Modal` (BottomSheet), teclado (`KeyboardAwareScrollView`).
- **Setup**: Expo Go (SDK 58) ou development build novo, em um aparelho iOS e um Android.
- **Test Steps**: seguir as seções B a F do `manual-verification-checklist.md`.
- **Expected Results**: comportamento igual ao do SDK 57.

## Setup Integration Test Environment

### 1. Start Required Services
```bash
# em cada subsistema, conforme o README dele (api, monitoring-better-meet, management-better-meet)
```
Há um `start-all.ps1` referido no `.env.example` que preenche a chave da monitoring; confira o README de `sistema/` para o uso.

### 2. Configure Service Endpoints
Copie `.env.example` para `.env` e use o IP da máquina (não `localhost`) para aparelho físico ou emulador Android.

## Run Integration Tests

### 1. Execute
```bash
npx expo start
```
Escaneie o QR code no Expo Go, ou abra o development build. Execute o checklist.

### 2. Verify Service Interactions
- **Test Scenarios**: os 3 acima.
- **Expected Results**: sem erros vermelhos no aparelho; sem erros no terminal do Metro.
- **Logs Location**: terminal do Metro e logs de cada API.

### 3. Cleanup
Encerre o Metro (`Ctrl+C`) e remova os dados de teste das APIs.
