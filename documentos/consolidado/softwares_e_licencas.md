Incremento: Apresentação final (AF) — refatoração de código
Escopo: catálogo de softwares e licenças (GT-06, RF-R83; regra 100 do guia de codificação)
Versão: 1.1
Branch: feature/refatoracao-ultima-entrega
Commit: aed2702 (base; as alterações da refatoração estão no working tree, sem commit)
Data de revisão: 2026-11-27 (na versão 1.1, só os pacotes do Expo de better-meet e web, sobre o commit dd14034; os demais itens são de 2026-11-21)
Responsável(eis): [nome de quem revisa e assina o documento]
Estado: Implementado
Fontes: sistema/api/package.json e package-lock.json; sistema/better-meet/package.json e package-lock.json; sistema/monitoring-better-meet/package.json e package-lock.json; sistema/management-better-meet/server/package.json e package-lock.json; sistema/management-better-meet/web/package.json e package-lock.json; package.json de cada pacote em node_modules (licença)

# Catálogo de softwares e licenças — Better Meet

Lista as dependências **diretas** de cada subsistema, com a versão resolvida no `package-lock.json` e a licença lida do `package.json` instalado em `node_modules`. Dependências transitivas não são listadas. Toda dependência é gratuita e sem assinatura; a coluna "Gratuito, sem assinatura" confirma isso por linha. A situação é medida contra o `package.json` do commit `aed2702`: "nova" não existia nele, "existente" já existia, "removida" saiu na refatoração.

Quem incluir, remover ou trocar a versão de uma dependência atualiza este arquivo no mesmo PR (regra 100).

**Licença do projeto: [PENDENTE — escolha do usuário].** Nenhum arquivo `LICENSE` foi criado (S09, GT-06, RF-R83).

## Serviços externos

| Serviço | Uso | Gratuito, sem assinatura | Situação |
|---|---|---|---|
| Login com Google (provedor social do Better Auth) | Login social opcional, só com `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no `.env` | Sim (OAuth gratuito; credencial no `.env`, nunca no aplicativo) | Nova, desligada por padrão |
| Gmail (conta com senha de app) | Envio de e-mails pelo `nodemailer` | Sim | Existente |
| MySQL 8.4 (imagem Docker `mysql:8.4.0`) | Bancos da aplicação e da monitoring | Sim (GPL-2.0 com exceção para aplicações cliente; usado como serviço, não distribuído) | Existente |

## Pontos de atenção de licença

- **`pm2` (AGPL-3.0)**, na gestão (servidor): é usado como ferramenta executada na máquina do servidor, controlada pela gestão; o Better Meet não incorpora nem distribui o código do PM2. Se o projeto for distribuído com o PM2 embutido, rever a compatibilidade com a licença escolhida.
- **`mariadb` (LGPL-2.1-or-later)**, na API de Dados e na monitoring: biblioteca usada por importação, sem alteração; compatível com projeto open-source.
- `dompurify` é `(MPL-2.0 OR Apache-2.0)` e `@expo-google-fonts/plus-jakarta-sans` é `MIT AND OFL-1.1` (fonte livre): ambos compatíveis.
- Nenhuma outra dependência direta tem licença de copyleft forte.

## API de Dados (`sistema/api`)

| Pacote | Versão (lockfile) | Licença | Tipo | Uso | Gratuito, sem assinatura | Situação |
|---|---|---|---|---|---|---|
| `@better-auth/expo` | 1.7.27 | MIT | produção | Plugin Expo do Better Auth (esquema `bettermeet://`, token no cabeçalho `set-auth-token`) | Sim | nova |
| `@prisma/adapter-mariadb` | 7.10.0 | Apache-2.0 | produção | Adaptador do Prisma para MySQL/MariaDB | Sim | existente |
| `@prisma/client` | 7.10.0 | Apache-2.0 | produção | Cliente do Prisma (acesso ao banco) | Sim | existente |
| `better-auth` | 1.7.27 | MIT | produção | Autenticação: cadastro, login, sessão, recuperação de senha, verificação de e-mail e login social | Sim | nova |
| `cors` | 2.8.6 | MIT | produção | CORS restrito às origens de `CORS_ORIGINS` | Sim | existente |
| `dotenv` | 16.6.1 | BSD-2-Clause | produção | Leitura do `.env` em `config/env.ts` | Sim | existente |
| `express` | 5.2.1 | MIT | produção | Servidor HTTP (Express 5) | Sim | existente |
| `express-rate-limit` | 8.7.5 | MIT | produção | Limite de tentativas por IP nas rotas públicas e gerais | Sim | nova |
| `helmet` | 8.3.0 | MIT | produção | Cabeçalhos HTTP de segurança | Sim | nova |
| `mariadb` | 3.5.4 | LGPL-2.1-or-later | produção | Driver MySQL/MariaDB (usado pelo adaptador do Prisma e pelo health check) | Sim | existente |
| `nodemailer` | 10.0.10 | MIT-0 | produção | Envio de e-mails (convites, lembretes, confirmação e recuperação) | Sim | existente |
| `sanitize-html` | 2.18.1 | MIT | produção | Limpeza do HTML da ata | Sim | existente |
| `swagger-ui-express` | 5.0.1 | MIT | produção | Documentação OpenAPI em `/api/docs` | Sim | existente |
| `yaml` | 2.9.1 | ISC | produção | Leitura do `docs/openapi.yaml` | Sim | existente |
| `yup` | 1.7.1 | MIT | produção | Validação de dados (schemas) | Sim | existente |
| `@eslint/js` | 10.0.1 | MIT | desenvolvimento | ESLint: regras base | Sim | existente |
| `@jest/globals` | 30.5.2 | MIT | desenvolvimento | Funções globais do Jest em testes ESM | Sim | existente |
| `@types/cors` | 2.8.19 | MIT | desenvolvimento | Tipos TypeScript de `cors` | Sim | existente |
| `@types/express` | 5.0.6 | MIT | desenvolvimento | Tipos TypeScript de `express` | Sim | existente |
| `@types/node` | 26.4.0 | MIT | desenvolvimento | Tipos TypeScript de `node` | Sim | existente |
| `@types/nodemailer` | 8.0.2 | MIT | desenvolvimento | Tipos TypeScript de `nodemailer` | Sim | existente |
| `@types/sanitize-html` | 2.16.2 | MIT | desenvolvimento | Tipos TypeScript de `sanitize-html` | Sim | existente |
| `@types/swagger-ui-express` | 4.1.8 | MIT | desenvolvimento | Tipos TypeScript de `swagger-ui-express` | Sim | existente |
| `eslint` | 10.12.0 | MIT | desenvolvimento | Análise estática de código (ESLint) | Sim | existente |
| `eslint-config-prettier` | 10.1.8 | MIT | desenvolvimento | Desliga regras do ESLint que conflitam com o Prettier | Sim | existente |
| `globals` | 17.13.0 | MIT | desenvolvimento | Variáveis globais conhecidas pelo ESLint | Sim | existente |
| `jest` | 30.5.2 | MIT | desenvolvimento | Testes automatizados (Jest 30) | Sim | existente |
| `prettier` | 3.9.10 | MIT | desenvolvimento | Formatação de código (Prettier) | Sim | existente |
| `prisma` | 7.10.0 | Apache-2.0 | desenvolvimento | CLI do Prisma (migrations e geração do cliente) | Sim | existente |
| `supertest` | 7.3.1 | MIT | desenvolvimento | Testes de rotas HTTP (Supertest) | Sim | existente |
| `typescript` | 5.9.3 | Apache-2.0 | desenvolvimento | Compilador e verificador de tipos (TypeScript) | Sim | existente |
| `typescript-eslint` | 8.71.2 | MIT | desenvolvimento | ESLint para TypeScript | Sim | existente |
| `jsonwebtoken` | ^9.0.3 (faixa antiga) | — | — | Assinava o JWT da ponte `POST /login`; ponte removida | — | removida |
| `@types/jsonwebtoken` | ^9.0.10 (faixa antiga) | — | — | Tipos do `jsonwebtoken` | — | removida |

## Aplicativo (`sistema/better-meet`)

| Pacote | Versão (lockfile) | Licença | Tipo | Uso | Gratuito, sem assinatura | Situação |
|---|---|---|---|---|---|---|
| `@expo-google-fonts/plus-jakarta-sans` | 0.4.2 | MIT AND OFL-1.1 | produção | Fonte Plus Jakarta Sans | Sim | existente |
| `@freakycoder/react-native-bounceable` | 2.1.0 | MIT | produção | Efeito de toque em botões | Sim | existente |
| `@react-native-async-storage/async-storage` | 2.2.0 | MIT | produção | Armazenamento local (tema, preferências) | Sim | existente |
| `@react-native-community/datetimepicker` | 9.2.1 | MIT | produção | Seletor nativo de data e hora | Sim | existente |
| `@react-native-vector-icons/ionicons` | 13.1.5 | MIT | produção | Ícones Ionicons | Sim | existente |
| `@tiptap/extension-table` | 3.33.0 | MIT | produção | Editor de texto rico da ata (Tiptap, versão web) | Sim | existente |
| `@tiptap/extension-text-align` | 3.33.0 | MIT | produção | Editor de texto rico da ata (Tiptap, versão web) | Sim | existente |
| `@tiptap/extension-text-style` | 3.33.0 | MIT | produção | Editor de texto rico da ata (Tiptap, versão web) | Sim | existente |
| `@tiptap/pm` | 3.33.0 | MIT | produção | Editor de texto rico da ata (Tiptap, versão web) | Sim | existente |
| `@tiptap/react` | 3.33.0 | MIT | produção | Editor de texto rico da ata (Tiptap, versão web) | Sim | existente |
| `@tiptap/starter-kit` | 3.33.0 | MIT | produção | Editor de texto rico da ata (Tiptap, versão web) | Sim | existente |
| `dompurify` | 3.4.17 | (MPL-2.0 OR Apache-2.0) | produção | Limpeza de HTML no cliente | Sim | existente |
| `expo` | 58.1.0 | MIT | produção | SDK do Expo 58 | Sim | existente |
| `expo-asset` | 58.0.21 | MIT | produção | Carregamento das imagens do manual exportado em PDF | Sim | nova |
| `expo-clipboard` | 58.0.4 | MIT | produção | Cópia do código de presença | Sim | nova |
| `expo-local-authentication` | 58.0.3 | MIT | produção | Desbloqueio do app e confirmação de presença com biometria ou senha nativa | Sim | nova |
| `expo-constants` | 58.0.16 | MIT | produção | Constantes do app (Expo) | Sim | existente |
| `expo-document-picker` | 58.0.5 | MIT | produção | Seletor de documentos do sistema | Sim | nova |
| `expo-file-system` | 58.0.15 | MIT | produção | Acesso a arquivos (exportação da ata) | Sim | existente |
| `expo-font` | 58.0.12 | MIT | produção | Carregamento de fontes | Sim | existente |
| `expo-linking` | 58.0.17 | MIT | produção | Links e deep links (`bettermeet://`) | Sim | existente |
| `expo-print` | 58.0.9 | MIT | produção | Geração de PDF da ata | Sim | existente |
| `expo-router` | 58.0.33 | MIT | produção | Navegação por arquivos (Expo Router) | Sim | existente |
| `expo-secure-store` | 58.0.3 | MIT | produção | Guarda o token de sessão no Keychain (iOS) e no Keystore (Android) | Sim | nova |
| `expo-sharing` | 58.0.24 | MIT | produção | Compartilhamento de arquivos | Sim | existente |
| `expo-splash-screen` | 58.0.15 | MIT | produção | Tela de abertura | Sim | existente |
| `expo-symbols` | 58.0.5 | MIT | produção | Ícones do sistema na barra de abas nativa | Sim | existente |
| `expo-system-ui` | 58.0.7 | MIT | produção | Cor de fundo da interface do sistema | Sim | existente |
| `react` | 19.3.0 | MIT | produção | React 19 | Sim | existente |
| `react-dom` | 19.3.0 | MIT | produção | React DOM (versão web) | Sim | existente |
| `react-native` | 0.88.1 | MIT | produção | React Native 0.88 | Sim | existente |
| `react-native-gesture-handler` | 3.3.0 | MIT | produção | Gestos | Sim | existente |
| `react-native-pell-rich-editor` | 1.10.0 | MIT | produção | Editor de texto rico da ata | Sim | existente |
| `react-native-poll` | 1.0.0 | MIT | produção | Barras de resultado da votação | Sim | existente |
| `react-native-reanimated` | 4.7.1 | MIT | produção | Animações | Sim | existente |
| `react-native-safe-area-context` | 5.11.1 | MIT | produção | Áreas seguras da tela | Sim | existente |
| `react-native-screens` | 4.30.1 | MIT | produção | Telas nativas da navegação | Sim | existente |
| `react-native-web` | 0.21.4 | MIT | produção | Versão web do React Native | Sim | existente |
| `react-native-webview` | 14.0.1 | MIT | produção | Editor de texto da ata (WebView) | Sim | existente |
| `react-native-worklets` | 0.13.0 | MIT | produção | Worklets do Reanimated | Sim | existente |
| `yup` | 1.7.1 | MIT | produção | Validação de dados (schemas) | Sim | existente |
| `zustand` | 5.0.15 | MIT | produção | Estado global (stores) | Sim | existente |
| `@expo/ngrok` | 4.1.3 | BSD-2-Clause | desenvolvimento | Túnel do Expo para testes (`expo start --tunnel`) | Sim | existente |
| `@testing-library/react-native` | 14.1.0 | MIT | desenvolvimento | Testes de componentes React Native | Sim | existente |
| `@types/react` | 19.3.0 | MIT | desenvolvimento | Tipos TypeScript de `react` | Sim | existente |
| `eslint` | 9.39.5 | MIT | desenvolvimento | Análise estática de código (ESLint) | Sim | existente |
| `eslint-config-expo` | 58.0.4 | MIT | desenvolvimento | Regras do ESLint para projetos Expo | Sim | existente |
| `eslint-config-prettier` | 10.1.8 | MIT | desenvolvimento | Desliga regras do ESLint que conflitam com o Prettier | Sim | existente |
| `jest` | 30.5.2 | MIT | desenvolvimento | Testes automatizados (Jest 30) | Sim | existente |
| `jest-expo` | 58.0.16 | MIT | desenvolvimento | Preset do Jest para Expo | Sim | existente |
| `prettier` | 3.9.10 | MIT | desenvolvimento | Formatação de código (Prettier) | Sim | existente |
| `typescript` | 6.0.3 | Apache-2.0 | desenvolvimento | Compilador e verificador de tipos (TypeScript) | Sim | existente |

## API de Monitoramento (`sistema/monitoring-better-meet`)

| Pacote | Versão (lockfile) | Licença | Tipo | Uso | Gratuito, sem assinatura | Situação |
|---|---|---|---|---|---|---|
| `@prisma/adapter-mariadb` | 7.10.0 | Apache-2.0 | produção | Adaptador do Prisma para MySQL/MariaDB | Sim | existente |
| `@prisma/client` | 7.10.0 | Apache-2.0 | produção | Cliente do Prisma (acesso ao banco) | Sim | existente |
| `cors` | 2.8.6 | MIT | produção | CORS restrito às origens de `CORS_ORIGINS` | Sim | existente |
| `dotenv` | 17.4.2 | BSD-2-Clause | produção | Leitura do `.env` em `config/env.ts` | Sim | existente |
| `express` | 5.2.1 | MIT | produção | Servidor HTTP (Express 5) | Sim | existente |
| `express-rate-limit` | 8.7.5 | MIT | produção | Limite de tentativas por IP nas rotas públicas e gerais | Sim | nova |
| `helmet` | 8.3.0 | MIT | produção | Cabeçalhos HTTP de segurança | Sim | nova |
| `mariadb` | 3.5.4 | LGPL-2.1-or-later | produção | Driver MySQL/MariaDB (usado pelo adaptador do Prisma e pelo health check) | Sim | existente |
| `node-cron` | 4.6.0 | ISC | produção | Agendamento do health check | Sim | existente |
| `yup` | 1.7.1 | MIT | produção | Validação de dados (schemas) | Sim | nova |
| `@eslint/js` | 10.0.1 | MIT | desenvolvimento | ESLint: regras base | Sim | nova |
| `@jest/globals` | 30.5.2 | MIT | desenvolvimento | Funções globais do Jest em testes ESM | Sim | nova |
| `@types/cors` | 2.8.19 | MIT | desenvolvimento | Tipos TypeScript de `cors` | Sim | existente |
| `@types/express` | 5.0.6 | MIT | desenvolvimento | Tipos TypeScript de `express` | Sim | existente |
| `@types/node` | 26.6.6 | MIT | desenvolvimento | Tipos TypeScript de `node` | Sim | existente |
| `@types/supertest` | 6.0.3 | MIT | desenvolvimento | Tipos TypeScript de `supertest` | Sim | nova |
| `eslint` | 10.15.0 | MIT | desenvolvimento | Análise estática de código (ESLint) | Sim | nova |
| `eslint-config-prettier` | 10.1.8 | MIT | desenvolvimento | Desliga regras do ESLint que conflitam com o Prettier | Sim | nova |
| `globals` | 17.14.0 | MIT | desenvolvimento | Variáveis globais conhecidas pelo ESLint | Sim | nova |
| `jest` | 30.5.2 | MIT | desenvolvimento | Testes automatizados (Jest 30) | Sim | nova |
| `prettier` | 3.10.1 | MIT | desenvolvimento | Formatação de código (Prettier) | Sim | nova |
| `prisma` | 7.10.0 | Apache-2.0 | desenvolvimento | CLI do Prisma (migrations e geração do cliente) | Sim | existente |
| `supertest` | 7.3.1 | MIT | desenvolvimento | Testes de rotas HTTP (Supertest) | Sim | nova |
| `typescript` | 6.0.3 | Apache-2.0 | desenvolvimento | Compilador e verificador de tipos (TypeScript) | Sim | existente |
| `typescript-eslint` | 8.73.0 | MIT | desenvolvimento | ESLint para TypeScript | Sim | nova |
| `yaml` | 2.9.1 | ISC | desenvolvimento | Leitura do `docs/openapi.yaml` | Sim | nova |
| `better-auth` | ^1.7.4 (faixa antiga) | — | — | Nunca foi usado pela monitoring; a sessão agora é validada na API de Dados | — | removida |
| `jsonwebtoken` | ^9.0.3 (faixa antiga) | — | — | Assinava o JWT da ponte `POST /login`; ponte removida | — | removida |
| `@types/jsonwebtoken` | ^9.0.10 (faixa antiga) | — | — | Tipos do `jsonwebtoken` | — | removida |
| `@types/node-cron` | ^3.0.11 (faixa antiga) | — | — | Tipos do `node-cron`, sem uso | — | removida |
| `ts-node-dev` | ^2.0.0 (faixa antiga) | — | — | Execução em desenvolvimento; trocado por `node --experimental-strip-types` | — | removida |

## Gestão, servidor (`sistema/management-better-meet/server`)

| Pacote | Versão (lockfile) | Licença | Tipo | Uso | Gratuito, sem assinatura | Situação |
|---|---|---|---|---|---|---|
| `cors` | 2.8.6 | MIT | produção | CORS restrito às origens de `CORS_ORIGINS` | Sim | existente |
| `dockerode` | 5.0.1 | Apache-2.0 | produção | Controle dos containers dos bancos pela gestão | Sim | existente |
| `dotenv` | 17.4.2 | BSD-2-Clause | produção | Leitura do `.env` em `config/env.ts` | Sim | existente |
| `express` | 5.2.1 | MIT | produção | Servidor HTTP (Express 5) | Sim | existente |
| `express-rate-limit` | 8.7.5 | MIT | produção | Limite de tentativas por IP nas rotas públicas e gerais | Sim | nova |
| `helmet` | 8.3.0 | MIT | produção | Cabeçalhos HTTP de segurança | Sim | nova |
| `pm2` | 7.0.4 | AGPL-3.0 | produção | Controle dos processos (start/stop/restart) pela gestão | Sim | existente |
| `yup` | 1.7.1 | MIT | produção | Validação de dados (schemas) | Sim | nova |
| `@eslint/js` | 10.0.1 | MIT | desenvolvimento | ESLint: regras base | Sim | nova |
| `@jest/globals` | 30.5.2 | MIT | desenvolvimento | Funções globais do Jest em testes ESM | Sim | nova |
| `@types/cors` | 2.8.19 | MIT | desenvolvimento | Tipos TypeScript de `cors` | Sim | existente |
| `@types/dockerode` | 4.0.1 | MIT | desenvolvimento | Tipos TypeScript de `dockerode` | Sim | existente |
| `@types/express` | 5.0.6 | MIT | desenvolvimento | Tipos TypeScript de `express` | Sim | existente |
| `@types/node` | 26.6.6 | MIT | desenvolvimento | Tipos TypeScript de `node` | Sim | existente |
| `@types/supertest` | 7.2.1 | MIT | desenvolvimento | Tipos TypeScript de `supertest` | Sim | nova |
| `eslint` | 10.15.0 | MIT | desenvolvimento | Análise estática de código (ESLint) | Sim | nova |
| `eslint-config-prettier` | 10.1.8 | MIT | desenvolvimento | Desliga regras do ESLint que conflitam com o Prettier | Sim | nova |
| `globals` | 17.14.0 | MIT | desenvolvimento | Variáveis globais conhecidas pelo ESLint | Sim | nova |
| `jest` | 30.5.2 | MIT | desenvolvimento | Testes automatizados (Jest 30) | Sim | nova |
| `prettier` | 3.10.1 | MIT | desenvolvimento | Formatação de código (Prettier) | Sim | nova |
| `supertest` | 7.3.1 | MIT | desenvolvimento | Testes de rotas HTTP (Supertest) | Sim | nova |
| `typescript` | 6.0.3 | Apache-2.0 | desenvolvimento | Compilador e verificador de tipos (TypeScript) | Sim | existente |
| `typescript-eslint` | 8.73.0 | MIT | desenvolvimento | ESLint para TypeScript | Sim | nova |
| `yaml` | 2.9.1 | ISC | desenvolvimento | Leitura do `docs/openapi.yaml` | Sim | nova |
| `jsonwebtoken` | ^9.0.3 (faixa antiga) | — | — | Assinava o JWT da ponte `POST /login`; ponte removida | — | removida |
| `@types/jsonwebtoken` | ^9.0.10 (faixa antiga) | — | — | Tipos do `jsonwebtoken` | — | removida |
| `ts-node-dev` | ^2.0.0 (faixa antiga) | — | — | Execução em desenvolvimento; trocado por `node --experimental-strip-types` | — | removida |

## Gestão, painel web (`sistema/management-better-meet/web`)

| Pacote | Versão (lockfile) | Licença | Tipo | Uso | Gratuito, sem assinatura | Situação |
|---|---|---|---|---|---|---|
| `@react-native-async-storage/async-storage` | 2.2.0 | MIT | produção | Armazenamento local (tema, preferências) | Sim | existente |
| `@react-native-vector-icons/ionicons` | 13.1.5 | MIT | produção | Ícones Ionicons | Sim | existente |
| `expo` | 58.1.0 | MIT | produção | SDK do Expo 58 | Sim | existente |
| `expo-constants` | 58.0.16 | MIT | produção | Constantes do app (Expo) | Sim | existente |
| `expo-linking` | 58.0.17 | MIT | produção | Links e deep links (`bettermeet://`) | Sim | existente |
| `expo-router` | 58.0.33 | MIT | produção | Navegação por arquivos (Expo Router) | Sim | existente |
| `expo-splash-screen` | 58.0.15 | MIT | produção | Tela de abertura | Sim | existente |
| `expo-status-bar` | 58.0.5 | MIT | produção | Barra de status | Sim | existente |
| `expo-system-ui` | 58.0.7 | MIT | produção | Cor de fundo da interface do sistema | Sim | existente |
| `react` | 19.3.0 | MIT | produção | React 19 | Sim | existente |
| `react-dom` | 19.3.0 | MIT | produção | React DOM (versão web) | Sim | existente |
| `react-native` | 0.88.1 | MIT | produção | React Native 0.88 | Sim | existente |
| `react-native-gesture-handler` | 3.3.0 | MIT | produção | Gestos | Sim | existente |
| `react-native-reanimated` | 4.7.1 | MIT | produção | Animações | Sim | existente |
| `react-native-safe-area-context` | 5.11.1 | MIT | produção | Áreas seguras da tela | Sim | existente |
| `react-native-screens` | 4.30.1 | MIT | produção | Telas nativas da navegação | Sim | existente |
| `react-native-web` | 0.21.4 | MIT | produção | Versão web do React Native | Sim | existente |
| `react-native-worklets` | 0.13.0 | MIT | produção | Worklets do Reanimated | Sim | existente |
| `yup` | 1.7.1 | MIT | produção | Validação de dados (schemas) | Sim | existente |
| `zustand` | 5.0.15 | MIT | produção | Estado global (stores) | Sim | existente |
| `@types/react` | 19.3.0 | MIT | desenvolvimento | Tipos TypeScript de `react` | Sim | existente |
| `eslint` | 9.39.5 | MIT | desenvolvimento | Análise estática de código (ESLint) | Sim | existente |
| `eslint-config-expo` | 58.0.4 | MIT | desenvolvimento | Regras do ESLint para projetos Expo | Sim | existente |
| `typescript` | 6.0.3 | Apache-2.0 | desenvolvimento | Compilador e verificador de tipos (TypeScript) | Sim | existente |
| `@testing-library/react-native` | 14.1.0 | MIT | desenvolvimento | Testes de componentes React Native | Sim | nova |
| `eslint-config-prettier` | 10.1.8 | MIT | desenvolvimento | Desliga regras do ESLint que conflitam com o Prettier | Sim | nova |
| `jest` | 30.5.2 | MIT | desenvolvimento | Testes automatizados (Jest 30) | Sim | nova |
| `jest-expo` | 58.0.16 | MIT | desenvolvimento | Preset do Jest para Expo | Sim | nova |
| `prettier` | 3.10.1 | MIT | desenvolvimento | Formatação de código (Prettier) | Sim | nova |
| `@expo/ui` | ~58.0.28 (faixa antiga) | — | — | Sem importador no painel (peer opcional do `expo-router`) | — | removida |
| `expo-device` | ~58.0.5 (faixa antiga) | — | — | Sem importador no painel (peer opcional do `expo-router`) | — | removida |
| `expo-font` | ~58.0.11 (faixa antiga) | — | — | Sem importador direto no painel; segue instalada de forma transitiva | — | removida |
| `expo-glass-effect` | ~58.0.5 (faixa antiga) | — | — | Sem importador no painel; segue instalada de forma transitiva | — | removida |
| `expo-image` | ~58.0.18 (faixa antiga) | — | — | Sem importador no painel (peer opcional do `expo-router`) | — | removida |
| `expo-symbols` | ~58.0.5 (faixa antiga) | — | — | Sem importador no painel (peer opcional do `expo-router`) | — | removida |
| `expo-web-browser` | ~58.0.8 (faixa antiga) | — | — | Sem importador no painel (peer opcional do `expo-router`) | — | removida |

## Histórico de revisões

| Versão | Data | Autor(es) | Alteração |
|---|---|---|---|
| 1.0 | 2026-11-21 | [nomes] | Criação do documento: dependências diretas dos cinco subsistemas e linha da licença do projeto pendente |
| 1.1 | 2026-11-27 | Bruno Soares Machado | Atualização para o `expo` 58.1.0 no aplicativo e no painel web; inclusão do `expo-document-picker`, que faltava |
