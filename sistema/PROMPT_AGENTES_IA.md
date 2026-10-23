# Prompt para agentes de IA — Better Meet

> **Como usar:** copie o bloco abaixo e anexe às instruções do seu agente (CLAUDE.md, AGENTS.md, regras do Cursor, instruções do Copilot etc.) ou cole no início da conversa. O texto resume o [GUIA_DE_CODIFICACAO.md](GUIA_DE_CODIFICACAO.md). Se os dois divergirem, o guia vale. Ao atualizar o guia, atualize este prompt também.

---

```markdown
# Padrões de código do projeto Better Meet

Você está escrevendo código para o Better Meet, um sistema de gerenciamento de reuniões. O repositório tem estes subsistemas em `sistema/`:

- `api/`: API de Dados (Node + Express 5 + Prisma 7 + MySQL, TypeScript, ESM)
- `better-meet/`: app mobile/web (Expo 57 + React Native + Expo Router + Zustand)
- `monitoring-better-meet/`: API de Monitoramento (Node + Express 5 + Prisma)
- `management-better-meet/server/` e `management-better-meet/web/`: painel de gestão (Express e Expo)

Siga as regras abaixo em todo código que você criar ou alterar. Elas são obrigatórias. Se uma regra impedir o que foi pedido, pare e explique o conflito em vez de quebrá-la.

## TypeScript

1. **Mantenha o modo estrito.**
   - Todo `tsconfig.json` tem `"strict": true`.
   - Nos serviços Node, também `noUncheckedIndexedAccess: true` e `exactOptionalPropertyTypes: true`.
   - Nunca desligue essas opções para o código compilar; corrija o código.
   - Com `noUncheckedIndexedAccess`, trate o `undefined` de acessos por índice (ex.: `error.errors[0] ?? 'Dados inválidos.'`).

2. **Nunca use `any`**, nem como `: any`, `<any>` ou `as any`.
   - Para valores desconhecidos, use `unknown` e estreite com `instanceof`, `typeof` ou validação.
   - Em `catch`, escreva `catch (error)` e use `error instanceof Error ? error.message : '<mensagem padrão em pt-BR>'`.
   - Para props de componentes de bibliotecas, use o tipo exportado pela biblioteca (ex.: `ScrollViewProps` do `react-native`).
   - Para rotas do Expo Router, use as rotas tipadas; nunca `as any`.

3. **Importe tipos com `import type`.**
   - Se todos os nomes importados são tipos: `import type { Request, Response } from 'express';`
   - Se o mesmo módulo fornece valores e tipos, use um único import com `type` inline: `import { organizacaoService, type Organizacao } from '@/services/organizacaoService';`
   - Não crie dois imports separados para o mesmo módulo.

4. **Não use `enum` do TypeScript.**
   - Para conjuntos fixos de valores, declare uma lista com `as const` e derive a união:
     `export const PAPEIS_ORGANIZACAO = ['CRIADOR', 'GERENTE', 'MODERADOR', 'MEMBRO'] as const;`
     `export type PapelMembro = (typeof PAPEIS_ORGANIZACAO)[number];`
   - Reaproveite a lista na validação (`yup.string().oneOf([...PAPEIS_ORGANIZACAO])`).
   - Os enums do `schema.prisma` são permitidos e são o padrão para estados fixos gravados no banco; no backend, importe o tipo e os valores gerados de `@prisma/client`.

5. **Use `satisfies` em objetos de configuração**, no lugar de anotar o tipo com `:`.
   - Exemplos: `select`/`include` do Prisma (`} satisfies Prisma.OrganizacaoInclude;`), mapas de rótulos ou cores por chave (`} satisfies Record<PapelOrganizacao, string>;`) e listas de configuração.

6. **Use `type`, não `interface`.**
   - Declare objetos, props, respostas de API e uniões com `type`.
   - Combine tipos com `&`.
   - Use `interface` somente para estender um tipo declarado por uma biblioteca (declaration merging, ex.: `declare module 'express-serve-static-core' { interface Request { … } }`), sempre com um comentário explicando o motivo.

7. **Use aspas simples** em strings e imports TypeScript.
   - Template literals (crases) para interpolação.
   - Aspas duplas são aceitas apenas: em atributos JSX (`<Ionicons name="menu" />`), em arquivos `.json` e quando a string contém uma aspa simples.

8. **O código deve passar no ESLint e no Prettier do subsistema.**
   - Formatação Prettier: `singleQuote: true`, `semi: true`, `trailingComma: 'all'`, `tabWidth: 2`.
   - Não desative regras do ESLint. Se for inevitável, use `// eslint-disable-next-line <regra> -- <motivo>` em uma única linha.

9. **Use sempre ES Modules.**
   - Proibido em código novo: `require`, `module.exports`, `exports.x`, `import x = require('...')`, `__dirname` e `__filename`.
   - Use `import`/`export`, `import.meta.dirname`, `import.meta.filename` e `await import()` para carregamento dinâmico.
   - Nos serviços Node (`api`, `monitoring-better-meet`, `management-better-meet/server`), imports relativos levam a extensão `.ts` (ex.: `import prisma from '../config/database.ts';`), e o `package.json` tem `"type": "module"`.
   - No app Expo (`better-meet`, `management-better-meet/web`), não coloque extensão nos imports; use o alias `@/` (ex.: `import { Colors } from '@/constants/theme';`).
   - Única exceção: arquivos de configuração de ferramentas que só aceitam CommonJS (`ecosystem.config.js`, `eslint.config.js`).

## Nomenclatura e idioma

10. **Substantivos do domínio em português; verbos e termos técnicos em inglês.**
    - Português: entidades, papéis, status e campos do negócio, com os mesmos nomes do `schema.prisma` (`organizacao`, `comissao`, `usuario`, `membros`, `papel`, `nome`, tipos `Organizacao`, `OrganizacaoMembro`, `PapelComissao`).
    - Inglês: verbos de funções e termos técnicos (`create`, `getById`, `listMine`, `addMember`, `removeMember`, `Service`, `Controller`, `Report`, `Error`, `Props`, `token`).
    - Certo: `organizacaoService.addMember(...)`, `type Organizacao`, `class OrganizacaoError`.
    - Errado: `adicionarMembro`, `listarPorOrganizacao`, `type Organization`.

11. **Todo texto visível ao usuário é em português do Brasil.**
    - Vale para textos de tela, botões, placeholders, mensagens de erro e sucesso do app e das APIs, mensagens do Yup, `accessibilityLabel`, `accessibilityHint`, mensagens de log e comentários.
    - Não use inglês nem português de Portugal: escreva "tela" (não "ecrã"), "usuário" (não "utilizador"), "registro" (não "registo"), "celular" (não "telemóvel").

12. **Padrões de caixa.**
    - camelCase: variáveis, funções, parâmetros, propriedades, objetos de service/controller e hooks (`organizacaoId`, `organizacaoService`, `useAppColorScheme`).
    - PascalCase: componentes React, tipos e classes (`ConfirmDialog`, `PapelOrganizacao`, `OrganizacaoError`).
    - UPPER_SNAKE_CASE: só para constantes de módulo com valor fixo e variáveis de ambiente (`MESES_CRESCIMENTO`, `PAPEIS_ORGANIZACAO`, `API_URL`). Valores calculados em tempo de execução ficam em camelCase, mesmo com `const`.
    - Funções começam com verbo; booleanos são escritos como pergunta (`isAuthenticated`, `hasHydrated`); hooks começam com `use`.

13. **Arquivos de camada se chamam `<dominio><Camada>.ts`.** O domínio vai em camelCase e a camada em PascalCase, sem pontos nem hífens.
    - `organizacaoRoutes.ts`, `organizacaoController.ts`, `organizacaoService.ts`, `organizacaoSchema.ts`, `authMiddleware.ts`, `healthCheckJob.ts`, `authStore.ts`.
    - Nunca use `status.controller.ts`, `pm2.service.ts` ou `auth.ts` dentro de `middlewares/`.
    - Use o mesmo domínio em todas as camadas de um assunto.
    - Hooks ficam em `hooks/`, em um arquivo com o nome do hook: `useTheme.ts`, `useAppColorScheme.ts`.

14. **Componentes React ficam em `PascalCase.tsx`**, com o mesmo nome do componente exportado (ex.: `ConfirmDialog.tsx`). Variantes por plataforma mantêm o sufixo: `AnimatedIcon.web.tsx`.

15. **Rotas do Expo Router (`src/app/`) ficam em kebab-case com palavras em português** (ex.: `excluir-conta.tsx`, `recuperar-senha.tsx`).
    - Exceções: os arquivos reservados `_layout.tsx`, `index.tsx` e `+not-found.tsx`.
    - Ao criar ou renomear uma rota, atualize `router.push`/`router.replace`, `<NativeTabs.Trigger name="…">` no `(tabs)/_layout.tsx` (quando for uma aba) e a lista `PUBLIC_ROUTES` do `AppGate`.

16. **Comentários explicam o porquê, não o quê.**
    - Comente decisões não óbvias, regras de negócio, restrições de ordem e armadilhas evitadas.
    - Não escreva comentários que só repetem o código (ex.: `// Middlewares globais` acima de `app.use(express.json())`). Prefira um nome melhor a um comentário.
    - Use JSDoc em funções exportadas cujo comportamento não fica claro pela assinatura.
    - Ao mudar um trecho, atualize ou remova o comentário que deixou de ser verdade.

17. **Não escreva comentários de histórico.**
    - Proibido: "NOVO", "já existia", "Incremento N", "antes era assim" e índices manuais das funções do arquivo.
    - Referências a casos de uso (`UC02`) são permitidas.
    - **Não remova nem altere comentários de histórico que já existem no repositório.** Só quem fez o commit pode removê-los. Se encontrar um, deixe-o como está e informe arquivo e linha na sua resposta.

## Node.js + Express 5 (`api`, `monitoring-better-meet`, `management-better-meet/server`)

Estrutura de um serviço: `src/config/` (`database.ts`, `env.ts`), `src/errors/AppError.ts`, `src/middlewares/`, `src/routes/`, `src/controllers/`, `src/schemas/`, `src/services/`, `src/utils/` (`parseId.ts`, `prismaErrors.ts`), `src/server.ts` e `docs/openapi.yaml`.

18. **Camadas routes → controller → service**, como em organizações.
    - Routes: só caminho, middlewares e handler. Nenhuma rota declarada direto no `server.ts`.
    - Controller: lê `request` (params, body, usuário do token), valida com o schema Yup, chama o service e responde. Não acessa o Prisma e não tem regra de negócio.
    - Service: regras de negócio, permissões por papel e Prisma. Não conhece `request`/`response`.

19. **Controllers e services são objetos literais exportados**: `export const organizacaoController = { async create(request, response) { … } }` e `export const organizacaoService = { … }`. Não exporte funções soltas. Parâmetros dos handlers: `request` e `response` (não `req`/`res`). Auxiliares internos ficam fora do objeto, sem `export`.

20. **Erros de negócio são lançados com `AppError`** (`src/errors/AppError.ts`): `throw new AppError(404, 'Organização não encontrada.');`.
    - Não crie classes de erro por domínio e não monte `response.status(4xx).json(...)` no meio da lógica.
    - Declare a propriedade `statusCode` no corpo da classe; não use `constructor(public statusCode …)`, que o Node não executa ao rodar `.ts` direto.
    - Se o cliente precisar de dados para resolver o erro, passe-os no terceiro parâmetro, `details` (ex.: `throw new AppError(409, '…', { organizacoesPendentes })`); eles saem no mesmo corpo do `error`. Nunca coloque detalhes internos ali.

21. **Validação em `schemas/` e tratamento de erro central.**
    - Schemas Yup ficam em `src/schemas/<dominio>Schema.ts` (no backend e no app), nunca dentro de controllers, telas ou componentes.
    - Use sempre `schema.validate(request.body, { stripUnknown: true })`.
    - Controllers **não têm `try/catch`**: o Express 5 envia os erros ao middleware `handleError` (`src/middlewares/errorMiddleware.ts`), registrado por último no `server.ts`, logo depois de um 404 em JSON para rotas inexistentes. Ele converte Yup → 400, `AppError` → status próprio (com `details`), JSON malformado → 400, Prisma `P2025` → 404, `P2002` → 409 e o resto → 500 genérico.

22. **Formato das respostas.**
    - Erro: `{ "error": "mensagem em pt-BR" }`.
    - Sucesso com dados: o recurso ou a lista.
    - Sucesso sem dados: `{ "message": "mensagem em pt-BR" }`.
    - Status: 200, 201 (criação), 202 (aceito), 400, 401, 403, 404, 409 e 500, cada um no seu caso.

23. **Nunca devolva `error.message` interno no 500.** A resposta é genérica (`'Erro interno. Tente novamente mais tarde.'`) e os detalhes vão para o `console.error`.

24. **O usuário da requisição vem só do token**: `(request as AuthenticatedRequest).user`. Nunca leia id, e-mail ou papel do usuário de headers próprios, body ou query.

25. **Rotas `/usuarios/:id/...` usam o middleware `requireSelf`** depois de `requireAuth`. Ele valida o id com `parseId` (400) e compara com o usuário do token (403).

26. **Proteção declarada na rota**: `requireAuth`, `requireAdmin` (sempre depois de `requireAuth`) e `requireSelf` aparecem na declaração da rota. Permissões por papel em organização ou comissão ficam no service. Rotas públicas recebem um comentário dizendo por que são públicas.

27. **Rotas fixas antes de rotas com parâmetro**: `/organizacoes/relatorio` é declarada antes de `/organizacoes/:id`.

28. **Ids de URL passam por `parseId`** (`src/utils/parseId.ts`): `const organizacaoId = parseId(request.params.id, 'da organização');`.
    - Aceita só inteiro > 0; senão lança `AppError(400, 'Identificador da organização inválido.')`.
    - Nunca use `Number(request.params.x)` sem validar. `parseId` é usado no controller ou em middleware, nunca no service.
    - Ordem das checagens: 400 → 403 → 404.

29. **Todos os endpoints ficam sob `/api`.** O prefixo é aplicado uma vez no `server.ts` (`app.use('/api', apiRouter)`), e os arquivos de rotas declaram caminhos sem ele. Só `/health` fica fora. No app, a URL base do `.env` já inclui `/api`, e os services do app não acrescentam `/api` à mão.

30. **Segredos e configuração só via `.env`.**
    - Leia as variáveis apenas em `src/config/env.ts`, que lança erro no boot se faltar uma obrigatória. No resto do código use `env.X`, nunca `process.env.X`.
    - Nunca escreva senha, chave, segredo ou URL de conexão no código, nem como valor padrão. Nunca imprima segredos no log.
    - Ao criar uma variável, adicione-a ao `.env.example` com valor fictício e comentário.
    - No app Expo, variáveis `EXPO_PUBLIC_*` são públicas: nunca coloque chaves ou segredos nelas. Única exceção temporária: `EXPO_PUBLIC_MONITORING_API_KEY`, que a monitoring ainda exige no `POST /status` e no `POST /status/:subSystem/check`; cada uso é marcado com o comentário `EXCEÇÃO TEMPORÁRIA ao EX-13`. Não use essa chave em nenhuma outra rota.

31. **Autenticação e senhas pelo Better Auth.**
    - Cadastro, login, sessão, troca e recuperação de senha usam a biblioteca Better Auth (adaptador Prisma, montada em `/api/auth/*`). Consulte a documentação da versão instalada.
    - Nunca implemente hash de senha, token ou sessão à mão, e nunca use `crypto.createHash('sha256')` ou outro hash sem salt para senha.
    - Recuperação de senha só com token (ou código) enviado ao e-mail cadastrado, com validade curta e uso único. Nunca aceite "e-mail + nova senha" sem esse token.

32. **Encerramento gracioso**: mantenha os handlers de `SIGINT`/`SIGTERM` que fecham o servidor e chamam `prisma.$disconnect()`. Tarefas no encerramento têm timeout curto.

33. **Documente na OpenAPI todo endpoint que criar ou alterar**, no mesmo trabalho, em `docs/openapi.yaml` (OpenAPI 3, servido em `/api/docs`).
    - Inclua: método e caminho, parâmetros, headers, corpo, respostas de sucesso e de erro com status, e a regra de autenticação/permissão.
    - Textos em pt-BR.

34. **Login e identificação de pessoas só pelo e-mail**, que é único. Nunca use o nome como login nem para localizar alguém (`where: { OR: [{ email }, { name }] }` é proibido). O schema de login usa `emailRule()`, e a tela pede só "E-mail".

35. **A plataforma nunca fica sem administrador.** Antes de excluir a conta de um `ADMIN` ou rebaixar o papel dele, o service confere, dentro da mesma transação, se existe outro `ADMIN`. Se não existir, lança `AppError(409, '<mensagem dizendo para promover outra pessoa antes>')`. O `ensureDefaultAdmin` não substitui essa regra.

## Prisma 7 + MySQL (`api`, `monitoring-better-meet`)

36. **Um único `PrismaClient` por serviço**, criado em `src/config/database.ts`. Nunca crie outra instância.

37. **Mais de uma escrita que precisa acontecer junta vai em `prisma.$transaction(async (transaction) => { … })`.** Dentro dela, use só `transaction`; auxiliares recebem `Prisma.TransactionClient` como parâmetro.

38. **Converta os erros do Prisma no service, com a mensagem do domínio.**
    - Use `isPrismaError(error, PRISMA_ERROR.RECORD_NOT_FOUND)` / `PRISMA_ERROR.UNIQUE_VIOLATION` (`src/utils/prismaErrors.ts`) e lance `AppError(404 | 409, '<mensagem específica>')`.
    - Termine o `catch` com `throw error`.
    - Nunca teste `'code' in error` à mão.
    - Para duplicidade garantida por `@unique`/`@@id`, grave direto e trate o `P2002`, sem consultar antes.

39. **Formatos de consulta reutilizáveis** ficam em constantes com `satisfies Prisma.XSelect`/`Prisma.XInclude`, e o tipo do resultado é derivado com `Prisma.XGetPayload<{ select: typeof constante }>`.

40. **Nunca devolva `password` nem outro dado sensível.** Consultas de `User` que saem na resposta usam `select` explícito.

41. **Estados fixos são `enum` no `schema.prisma`**, nunca `String`.
    - No código, use o tipo e os valores gerados (`Object.values(StatusOrganizacao)`) em vez de repetir a lista.
    - Antes de trocar `String` por enum, confira se todos os valores gravados pertencem ao enum.

42. **Mudança de schema só com `npx prisma migrate dev --name <descricao_em_snake_case>`**, e a pasta `prisma/migrations/` é commitada junto.
    - Nunca use `prisma db push`.
    - Revise o `migration.sql`: renomear model ou campo gera `DROP` + `CREATE` e apaga dados. Troque por `RENAME TABLE`/`RENAME COLUMN`.
    - Nunca altere uma migration já commitada.

43. **Nomes no banco iguais aos do schema**: models em PascalCase no singular, campos em camelCase, enums em PascalCase e valores em UPPER_SNAKE_CASE.
    - Não use `@@map` nem `@map`.
    - Models e campos novos do domínio em português.
    - Não renomeie `User` nem seus campos.

44. **Comente no `schema.prisma`** as regras que o banco não expressa (limites por papel, unicidade de negócio) e o significado de cada valor de enum, sem comentários de histórico.

## Validação com Yup

45. **Schemas em `src/schemas/<dominio>Schema.ts`**, exportados como constantes. Nunca declare schema em controller, tela ou componente. Use os valores devolvidos pelo `validate`, não o objeto original.

46. **`.trim()` em todo texto livre e mensagem em pt-BR, terminada em ponto, em toda regra** (`required`, `min`, `max`, `email`, `matches`, `oneOf`, `integer`, `positive`). Nunca deixe a mensagem padrão do Yup.

47. **Nome, e-mail e senha forte vêm de `src/schemas/commonSchema.ts`** (`nomeRule()`, `emailRule()`, `senhaForteRule('A nova senha')`). Nunca copie essas regras. Cada pacote (`api`, `better-meet`, `management-better-meet/web`) tem o seu `commonSchema.ts`, e os três precisam ficar idênticos: ao mudar um, mude os outros.

48. **`abortEarly`:**
    - Na API, não passe `abortEarly` (o padrão é `true`); valide com `{ stripUnknown: true }` e a resposta tem uma única mensagem.
    - Nos formulários do app, use sempre `{ abortEarly: false }` e monte os erros por campo a partir de `error.inner` (`item.path` → `item.message`).

## React Native + Expo (`better-meet`, `management-better-meet/web`)

49. **Use a documentação do Expo SDK 57** (https://docs.expo.dev/versions/v57.0.0/) para qualquer API do Expo ou do Expo Router, não a versão mais recente nem exemplos antigos.

50. **Telas são arquivos em `src/app/`** com `export default function <Rota em PascalCase>Screen` (`excluir-conta.tsx` → `ExcluirContaScreen`). A tela coordena estado e layout; lógica vai para hooks, HTTP para services e pedaços de interface para componentes.
    - A tela fica no próprio arquivo da rota; não crie a tela em `src/components/` só para a rota reexportar.
    - O app logado fica no grupo `src/app/(tabs)/`: barra inferior com `NativeTabs` no `(tabs)/_layout.tsx` e um `Stack` por aba (`_layout.tsx` com `unstable_settings = { anchor: 'index' }`). Aba nova é registrada como `<NativeTabs.Trigger name="…">`; tela nova de uma aba entra na pasta dela. Telas públicas ficam fora de `(tabs)`.
    - `_layout.tsx` exporta uma função nomeada terminada em `Layout`.

51. **Estilo de export.**
    - Telas (`src/app/`) e componentes (`src/components/`): `export default function NomeDoArquivo`, sempre com função nomeada, nunca anônima. Importe com o nome do arquivo: `import ConfirmDialog from '@/components/ConfirmDialog';`. Tipos do componente podem ser exportados como named no mesmo arquivo.
    - Services, stores, hooks, constants, schemas, utils e todo o backend: named.

52. **Nenhum `fetch` em tela ou componente.** Toda chamada HTTP fica em `src/services/<dominio>Service.ts`.

53. **Services usam o cliente único `apiRequest`** de `src/utils/apiClient.ts`:
    `apiRequest<T>(path, { method, token, body, baseUrl, fallbackError })`.
    - Ele monta os headers, converte o JSON e lança `Error` com a mensagem da API.
    - Não repita `authHeaders`, `readError` ou `parseJson` em services.
    - `API_URL` já inclui `/api`. Para outra API (monitoring), passe `baseUrl`.

54. **Telas que carregam dados usam `useFocusEffect(useCallback(() => { let cancelled = false; … return () => { cancelled = true; }; }, [deps]))`**, não `useEffect` de montagem: as abas e as pilhas mantêm as telas montadas e os dados ficariam velhos. Se a carga está numa função reaproveitada (botão "Tentar novamente"), ela recebe `isActive: () => boolean` e o `useFocusEffect` passa `() => !cancelled`.

55. **Use `Pressable`, nunca `TouchableOpacity`.** O efeito de toque vem do componente base `Button` ou de `style={({ pressed }) => [styles.x, pressed && styles.pressed]}` com `pressed: { opacity: PressedOpacity }` (constante do `theme.ts`); nunca escreva o valor da opacidade no arquivo.

56. **Todo elemento clicável** tem `accessibilityRole` (`button`, `link`, `switch`…), `accessibilityLabel` em pt-BR e área de toque de pelo menos 44 × 44 px (use `hitSlop` se o visual for menor). Botões desabilitados têm `accessibilityState={{ disabled: true }}`.

57. **Estilos**: estilos fixos em `StyleSheet.create` no fim do arquivo; cores do tema aplicadas na renderização (`style={[styles.card, { backgroundColor: colors.backgroundElement }]}`). Sem objetos de estilo grandes inline.

58. **Confirmações usam o componente `ConfirmDialog`.** Nunca use `Alert.alert`, `window.alert` ou `window.confirm`.

59. **Feedback ao usuário:**
    - erro de validação: texto embaixo do campo (estado `errors`);
    - resultado de ação: `<FeedbackBanner feedback={feedback} />` com `const [feedback, setFeedback] = useFeedback();` (`src/hooks/useFeedback.ts`), importando o tipo `Feedback` do componente. O sucesso some depois de `SUCCESS_FEEDBACK_MS` (4000); o erro fica até a próxima ação;
    - sucesso que termina saindo da tela (login, cadastro, recuperação de senha, salvar o perfil): `<Screen toast={<Toast toast={toast} onFinish={…} />}>`, navegando só no `onFinish`. Nunca use `setTimeout` para navegar depois de uma mensagem;
    - confirmação: `ConfirmDialog`;
    - aviso que encerra um fluxo: variante de um botão do `ConfirmDialog`.

60. **Imports**: `@/` para tudo fora da pasta atual, `./` só para a mesma pasta, **nunca `../`**. Ordem: bibliotecas externas, linha em branco, `@/`, linha em branco, `./`. (Nos serviços Node continua valendo o import relativo com `.ts`.)

61. **Não crie nem reaproveite arquivos do template do Expo** (`explore.tsx`, `app-tabs`, `hint-row`, `web-badge`, `animated-icon`, `external-link`, `use-color-scheme*.ts`, `reset-project.js`). Se encontrar um em uso no que estiver alterando, informe na resposta.

62. **React Compiler está ativo.**
    - Componentes e hooks são puros, sem alterar props, estado ou objetos recebidos.
    - Não use `ref.current` durante a renderização. Hooks só no nível de cima.
    - Não use `useMemo`, `useCallback` nem `React.memo` só para desempenho; a exceção é quando a API exige função estável (`useFocusEffect`).

63. **Login é checado só no `AppGate`** do `_layout.tsx`, que espera `hasHydrated`. Rotas públicas ficam na lista `PUBLIC_ROUTES`. Restrição por papel pode redirecionar na tela com `router.replace`, mas a proteção real é a da API.

64. **Ícones só de `@react-native-vector-icons/ionicons`**: `import { Ionicons, type IoniconsIconName } from '@react-native-vector-icons/ionicons';`.
    - Tipe nomes de ícone com `IoniconsIconName`, não com `ComponentProps<typeof Ionicons>['name']`.
    - Proibido: `@expo/vector-icons` (será descontinuado pelo Expo), `react-native-vector-icons` e outro pacote com a mesma fonte.
    - Um só conjunto no app (Ionicons, de preferência a variante `-outline`).
    - Exceção: os ícones da barra de abas (`<NativeTabs.Trigger.Icon>`) usam `expo-symbols` (`sf` para SF Symbols no iOS, `md` para Material Symbols no Android), porque o `NativeTabs` só aceita ícones do sistema. Fora da barra de abas, `expo-symbols` não é usado.
    - Emojis nunca substituem ícones (títulos, status, botões, mensagens).

65. **Identidade visual do app instalado**: no `app.json`, `name` é `Better Meet`. Ícone, ícone adaptativo (fundo `primaryLight`), splash (fundo `background` claro e escuro) e favicon são gerados da arte oficial `assets/images/better-meet-icon.png`. Nenhum asset do template do Expo. O `app.json` é o único lugar fora do `theme.ts` com cores do tema em hex; mantenha os dois iguais.

## Estado com Zustand

66. **Um store por assunto** em `src/store/<dominio>Store.ts`, exportado como `use<Dominio>Store`.
    - Estado que precisa sobreviver ao fechamento do app usa `persist` + `createJSONStorage(() => AsyncStorage)` com a chave `better-meet-<assunto>`.
    - Dados da API (listas, relatórios) ficam no estado da tela, não no store.

67. **Use `partialize`** para persistir só os dados; flags de execução (`hasHydrated`, `isLoading`) e funções ficam fora.

68. **Toda decisão de navegação baseada no store espera `hasHydrated`.**

69. **Leia o store com seletor**: `useAuthStore((state) => state.token)`. Para vários valores, use `useShallow` (`zustand/react/shallow`). Nunca desestruture o store inteiro (`const { token } = useAuthStore()`). Fora de componentes, use `useAuthStore.getState()`.

70. **Alterações só por ações declaradas no store**, com nome de verbo (`login`, `logout`, `setTheme`). Não chame `useXStore.setState` fora do arquivo do store.

## Interface e design system

Referência oficial: paleta do `documentos/entrega1_AP/design_system.md` e fonte Plus Jakarta Sans do `documentos/entrega1_AP/padroes_interface_e_nomenclatura.md`.

71. **Tema e cores só por `const { colorScheme, colors } = useTheme();`** (`src/hooks/useTheme.ts`, construído sobre `useAppColorScheme`).
    - Nunca importe `useColorScheme` do `react-native`: ele ignora a escolha do usuário no web.
    - Nunca importe um hook com o nome trocado (`useAppColorScheme as useColorScheme`).

72. **Nenhuma cor em hex fora de `src/constants/theme.ts`.** Use os tokens: `background`, `backgroundElement`, `text`, `textSecondary`, `primary`, `primaryLight`, `onPrimary`, `border`, `success`, `warning`, `danger`, `info`.
    - Mapas de cor por status ou papel apontam para tokens.
    - Cores de estado (`success`, `warning`) em texto sobre fundo claro podem não ter contraste suficiente; prefira usá-las em ícones, bordas e badges.

73. **Texto com `Typography.*`, espaçamento com `Spacing.*` (`xs` 4, `sm` 8, `md` 12, `lg` 16, `xl` 24, `xxl` 32, `xxxl` 48) e cantos com `Radius.*`** (`sm` 4, `md` 8, `lg` 12, `xl` 16, `full`).
    - Nunca escreva `fontSize`, `fontWeight`, margens ou raios com números soltos.
    - A fonte é Plus Jakarta Sans: cada estilo de `Typography` define o `fontFamily` do peso (`PlusJakartaSans_700Bold`), não só o `fontWeight`.

74. **Use os componentes base de `src/components/ui/`** (`Screen`, `Button`, `TextField`, `Card`, `ScreenHeader`, `FeedbackBanner`, `Toast`, `ConfirmDialog`) em vez de recriar botão, campo, card ou cabeçalho com estilos próprios. Um padrão visual repetido em duas telas vira componente base.

75. **Estrutura de tela**: toda tela usa o componente `Screen` (`src/components/ui/Screen.tsx`), que monta `SafeAreaView` (com `colors.background`) → `Header` opcional → `ScrollView` com conteúdo de largura máxima `MaxContentWidth`, centralizado, com padding `Spacing.lg`. Props: `showHeader` (só na tela inicial e nas públicas), `hasForm` (telas com campo de texto), `toast`, `refreshing`/`onRefresh`. Não monte `SafeAreaView`/`ScrollView` à mão.

76. **Ids internos nunca aparecem na interface** (texto, rótulo ou mensagem), e o usuário nunca digita um id. Pessoas aparecem por nome (e e-mail, quando precisa diferenciar). Para escolher alguém, mostre uma lista de opções (`Chip`, rádio); se a pessoa não está em nenhuma lista, peça o e-mail.

## Git, agentes de IA e testes

77. **Mensagens de commit** no formato `<tipo>(<escopo opcional>): <descrição>`, em pt-BR, minúscula, verbo no presente e sem ponto final (`feat(api): adiciona cadastro de reuniões`). Tipos: `feat`, `fix`, `refactor`, `docs`, `test`, `style`, `chore`. Um assunto por commit.

78. **Branches**: trabalhe em `feature/<nome-em-kebab-case>` criada a partir da `development`. Nunca faça commit nem push direto na `main`.

79. **Instruções para agentes**: não crie cópias de regras ou skills por ferramenta. Ao alterar o `GUIA_DE_CODIFICACAO.md`, atualize também o `PROMPT_AGENTES_IA.md`.

80. **Testes**:
    - Toda regra de negócio nova ou alterada em um service vem com teste.
    - Serviços Node usam Jest (unitário) e Supertest (rotas); apps usam Jest (`jest-expo`) com React Native Testing Library.
    - Todo defeito corrigido ganha um teste que falharia antes da correção.
    - Testes nunca rodam contra o banco de desenvolvimento.
    - Os testes realizados em cada entrega são registrados na pasta da entrega em `documentos/`: o que foi testado (ligado a casos de uso e requisitos), como rodar e o resultado (data, quantidade, falhas, defeitos encontrados).

## Antes de entregar

Confira cada item e corrija o que falhar antes de responder:

- [ ] Nenhuma opção de `strict` desligada no `tsconfig.json`.
- [ ] Nenhum `any` no código que você escreveu.
- [ ] Imports de tipo com `import type` ou `type` inline.
- [ ] Nenhum `enum` do TypeScript; `as const` + união derivada.
- [ ] `satisfies` em `select`/`include` do Prisma e mapas de configuração.
- [ ] Nenhuma `interface`, exceto para estender biblioteca, com comentário.
- [ ] Strings com aspas simples.
- [ ] Nenhum `require`, `module.exports` ou `__dirname`.
- [ ] Imports relativos com `.ts` nos serviços Node, e sem extensão (com `@/`) no app Expo.
- [ ] Domínio em português e verbos/termos técnicos em inglês.
- [ ] Todo texto visível ao usuário em pt-BR.
- [ ] camelCase, PascalCase e UPPER_SNAKE_CASE usados nos lugares certos.
- [ ] Arquivos de camada em `<dominio><Camada>.ts`, componentes em `PascalCase.tsx` e rotas em kebab-case pt-BR.
- [ ] Comentários explicam o porquê; nenhum comentário de histórico novo, e nenhum existente removido.
- [ ] Ícones só de `@react-native-vector-icons/ionicons` (exceto os da barra de abas, com `expo-symbols`); nenhum emoji no lugar de ícone.
- [ ] Nenhum id interno exibido na interface.
- [ ] Login e identificação de pessoas pelo e-mail, nunca pelo nome.
```
