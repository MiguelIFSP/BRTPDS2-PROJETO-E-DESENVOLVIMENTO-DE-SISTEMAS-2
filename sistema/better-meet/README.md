# Better Meet — App

Aplicativo mobile/web do Better Meet (Expo SDK 57 + React Native + Expo Router + Zustand). Consome a API de Dados (`sistema/api`) e a API de Monitoramento (`sistema/monitoring-better-meet`).

O código segue o [Guia de Codificação](../GUIA_DE_CODIFICACAO.md). Para APIs do Expo, use a documentação da versão instalada: https://docs.expo.dev/versions/v57.0.0/.

## Como rodar

1. Instale as dependências: `npm install`
2. Copie `.env.example` para `.env` e preencha as URLs das APIs (veja os comentários no arquivo).
3. Suba o app: `npm start` (ou `npm run android`, `npm run ios`, `npm run web`).

## Scripts

| Script                                    | O que faz                                                    |
| ----------------------------------------- | ------------------------------------------------------------ |
| `npm start`                               | Inicia o Metro/Expo                                          |
| `npm run lint`                            | ESLint (`expo lint`) com as regras do guia                   |
| `npm run format` / `npm run format:check` | Formata / confere a formatação com o Prettier                |
| `npm run typecheck`                       | `tsc --noEmit`                                               |
| `npm test`                                | Testes com Jest (`jest-expo`) e React Native Testing Library |

## Estrutura de `src/`

| Pasta            | Conteúdo                                                                                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/`           | Telas (rotas do Expo Router, em kebab-case pt-BR). O `_layout.tsx` carrega as fontes e faz a checagem de login (`AppGate`); o app logado fica em `(tabs)/`, com a barra inferior e uma pilha por aba  |
| `components/ui/` | Componentes base do design system: `Button`, `TextField`, `Card`, `Screen`, `ScreenHeader`, `FeedbackBanner`, `ConfirmDialog`, `Badge`, `Avatar`, `Chip` |
| `components/`    | Componentes do domínio (`OrganizacaoEquipe`, `ComissaoCard`, `relatorio/…`)                                                                              |
| `constants/`     | Tema (`theme.ts`: cores, tipografia, espaçamento, raios) e rótulos de status                                                                             |
| `hooks/`         | `useTheme`, `useFeedback`, `useOrganizacaoActions`                                                                                                       |
| `schemas/`       | Schemas Yup dos formulários (`commonSchema.ts` igual ao da API)                                                                                          |
| `services/`      | Chamadas HTTP por domínio, todas via `utils/apiClient.ts`                                                                                                |
| `store/`         | Stores Zustand persistidos (`authStore`, `themeStore`)                                                                                                   |
| `utils/`         | Cliente HTTP, erros de formulário e formatação                                                                                                           |
