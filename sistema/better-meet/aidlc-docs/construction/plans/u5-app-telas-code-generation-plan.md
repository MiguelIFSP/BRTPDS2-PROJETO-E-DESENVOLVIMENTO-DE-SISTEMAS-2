- **Incremento:** Apresentação final (AF) — refatoração de código
- **Escopo:** plano de alteração (Code Generation, parte 1) da unidade U5 app-telas (`better-meet`: telas e componentes), fases 1 e 2
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** aed2702
- **Data de revisão:** 2026-11-20
- **Responsável(eis):** [nome de quem revisa e aprova]
- **Estado:** Proposta — aguardando aprovação; nenhum passo executado
- **Fontes:** [unit-of-work.md](../../inception/application-design/refatoracao-ultima-entrega/unit-of-work.md); [unit-of-work-dependency.md](../../inception/application-design/refatoracao-ultima-entrega/unit-of-work-dependency.md); [requirements.md](../../inception/requirements/refatoracao-ultima-entrega/requirements.md) (seção 5.2); [U8 business-logic-model.md](../u8-app-auth-integracao/functional-design/business-logic-model.md); GUIA_DE_CODIFICACAO.md (RN-07, RN-11, RN-20, RN-22, YP-04, UI-09, GT-04, GT-06); leitura do código em `sistema/better-meet/src` no commit aed2702

# U5 app-telas — plano de alteração

Este plano é a fonte única da verdade da parte 2 (geração). Caminhos relativos a `sistema/better-meet/`, salvo indicação. Cada passo cita os requisitos que cumpre. Mensagens ao usuário em pt-BR, vocabulário de aplicativo (NM-02: "aplicativo", "tela", "tocar"; nunca "site", "página", "clicar").

## 1. Contexto

### 1.1 Requisitos atribuídos (15)

| Fase | Onda | Requisitos | Corte |
|---|---|---|---|
| 1 | 1 | RF-R41, R43, R46, R47, R48 | obrigatórios |
| 1 | 1 | RF-R42, R45, R49 | se der tempo |
| 2 | 2 | RF-R35, R38, R39, R40 | obrigatórios |
| 2 | 2 | RF-R36, R37, R44 (e a confirmação por biometria de R36 e R38) | se der tempo |

### 1.2 Arquivos donos (em `src/`)

`app/(tabs)/**` (reuniões, comissão, organização, mais; exceto `mais/perfil.tsx` e `mais/excluir-conta.tsx` na fase 2), `app/lista-presenca.tsx`; `components/**` exceto `AppGate.tsx`; `hooks/**` exceto o hook de biometria; `schemas/reuniaoSchema.ts` e `schemas/votacaoSchema.ts`; `services/reuniaoService.ts`, `votacaoService.ts`, `ataService.ts`, `listaPresencaService.ts`, `organizacaoService.ts`, `comissaoService.ts`, `notificacaoService.ts`; `utils/**` exceto `apiClient.ts`; `store/themeStore.ts`; `content/manual/**` (novo); os testes dessas áreas. A constante `PressedOpacity` já existe em `constants/theme.ts`; a U5 só a importa.

### 1.3 O que NÃO pode tocar

- `package.json`, `package-lock.json` e `app.json` (da U8). A U5 não adiciona dependência; se um passo exigir uma, para e registra no relatório.
- `utils/apiClient.ts`, `store/authStore.ts`, `services/authService.ts`, `usuarioService.ts`, `monitoringService.ts`, `config/api.ts`, `app/login.tsx`, `recuperar-senha.tsx`, `usuario.tsx`, `_layout.tsx`, `components/AppGate.tsx`, `lib/authClient.ts`, `hooks/useConfirmacaoBiometrica.ts` (todos da U8).
- `schemas/authSchema.ts`, `usuarioSchema.ts` e `commonSchema.ts` do app (RF-R50 é da U8).
- `app/(tabs)/mais/perfil.tsx`: a U5 edita só na **fase 1** (RF-R47, uma linha). Na onda 2 o arquivo é da U8 (RF-R31); a U5 não o abre na fase 2. `mais/excluir-conta.tsx` é da U8 desde o início.
- `.env.example` (U9), `RELATORIO_BUGS.md` (U9), `aidlc-state.md` e `audit.md` (orquestrador).
- Proibido: git de escrita, `npm run dev`/`start`, `expo export`, build, `npm install`/`npx expo install` (instalação é da U8). Liberados: `npm test`, `npm run lint`, `npm run typecheck`.
- Alinhamento com o U8 (conferido no functional design): a U8 espera da U5 o hook de limpeza de erro de campo (RF-R41) para os formulários de autenticação e entrega à U5 a lista de passos de autenticação para o manual (RF-R45). Nenhum arquivo é compartilhado.

### 1.4 Convenções de teste (GT-04)

Jest 30 com preset `jest-expo` e React Native Testing Library; arquivos `*.test.ts(x)` em `__tests__/` ao lado do código (padrão atual: `components/__tests__`, `hooks/__tests__`, `services/__tests__`, `store/__tests__`, `utils/__tests__`, `schemas/__tests__`). Serviços e `router` simulados com `jest.mock`. Todo defeito corrigido ganha teste que falharia antes. Verificação de cada passo em `sistema/better-meet`: `npm test`, `npm run lint`, `npm run typecheck`.

## 2. FASE 1 (onda 1) — sem dependência de API

- [x] **Passo 1 — Linha de base.** Em `sistema/better-meet`, rodar `npm test`, `npm run lint` e `npm run typecheck` e anotar resultado (falhas pré-existentes ficam registradas, não corrigidas fora do escopo). Rodar as buscas textuais de partida: `site|página|clique|clicar` em `src/app`, `src/components`, `src/content`; `opacity: 0.75`; `ID do usuário`; `router.push` para rotas de outra aba.
- [x] **Passo 2 — RF-R46 (site vira aplicativo).** `src/components/PrimeiroAcessoDialog.tsx` linha 109: trocar "o site funciona" por "o aplicativo funciona". Revisar os textos de tela encontrados no passo 1 e corrigir só os de usuário final (não alterar nomes de identificadores nem comentários). Teste novo `src/components/__tests__/PrimeiroAcessoDialog.test.tsx`: renderiza o diálogo e verifica que o texto contém "aplicativo" e não "site". Verificação: busca textual sem `site`, `página`, `clique` em textos de tela.
- [x] **Passo 3 — RF-R47 (remover "ID do usuário").** `src/app/(tabs)/mais/perfil.tsx` linha 216: apagar `<InfoRow label="ID do usuário" ... />`; remover `import` de `InfoRow` só se ficar sem uso. Edição mínima, restrita a isso (a U8 edita o arquivo na onda 2). Teste novo `src/app/(tabs)/mais/__tests__/perfil.test.tsx` (se já houver teste do perfil, estender): com `useAuthStore` simulado, a tela não exibe "ID do usuário" nem `String(user.id)`. Verificação: busca textual sem `user.id` exibido em `perfil.tsx`.
- [x] **Passo 4 — RF-R48 (`PressedOpacity`).** `src/components/presenca/ListaPresencaEditor.tsx` linha 209: `pressed: { opacity: 0.75 }` passa a `pressed: { opacity: PressedOpacity }`, com `PressedOpacity` importado de `@/constants/theme` (como em `components/ConvitePendenteCard.tsx`). Estender o teste existente em `src/components/presenca/__tests__/` (ou criar `ListaPresencaEditor.test.tsx`) com renderização sem erro. Verificação: busca textual sem `opacity: 0.75` no arquivo; `opacity: 0.5` de `disabled` fica.
- [x] **Passo 5 — RF-R41 (erro do campo some ao digitar).**
  1. Criar `src/hooks/useFieldErrors.ts`, extraindo o `clearFieldError` de `src/app/(tabs)/(reunioes)/index.tsx` (linhas 243-251): `useFieldErrors<Form>()` devolve `{ errors, setErrors, clearFieldError(...campos), clearAllErrors }`, mesma lógica (não recria o estado se nenhum dos campos tem erro). Tipos genéricos com `FieldErrors<Form>` de `utils/formErrors.ts`.
  2. Teste novo `src/hooks/__tests__/useFieldErrors.test.ts` (`renderHook` da RNTL): erro some ao limpar o campo; limpar campo sem erro mantém a mesma referência; vários campos de uma vez.
  3. Aplicar o hook em `(reunioes)/index.tsx` (trocar o estado local) e nos formulários que hoje só limpam o erro no envio: levantar com busca `setErrors\(` / `toFieldErrors` em `src/app/(tabs)/**` e `src/components/**` (esperados: `organizacao/index.tsx`, `comissao/index.tsx`, `comissao/[id].tsx`, `organizacao/[id].tsx`, formulário de votação, `ReuniaoCheckIn`, se houver campos). Em cada campo, `onChangeText` chama `clearFieldError('campo')`.
  4. Não tocar formulários de autenticação; a U8 usa o hook por conta própria. Registrar no `code-summary.md` a assinatura final do hook (contrato para a U8).
  5. Testes de tela existentes continuam passando; adicionar um teste de formulário (ex.: reunião ou organização): submeter vazio mostra o erro, digitar no campo o remove sem novo envio.
- [x] **Passo 6 — RF-R43 ("Voltar" devolve à origem).**
  1. Levantamento: `ReportLinkCard` (`components/relatorio/`) faz `router.push(href)`; `ComissaoReportView.tsx` (`href="/comissao"`, linha ~90) e `OrganizacaoReportView.tsx` (`href="/organizacao"`, linha ~75) mudam de aba. Buscar também outros atalhos entre abas (`router.push('/comissao`, `'/organizacao`, `'/mais`, `'/(reunioes)`) em `src/app` e `src/components` e listar no `code-summary.md`.
  2. Implementação: o atalho passa o parâmetro `origem` (ex.: `/comissao?origem=relatorio`). `comissao/index.tsx` e `organizacao/index.tsx` leem `origem` com `useLocalSearchParams`; quando `origem === 'relatorio'` mostram `BackButton` (já existe em `components/ui/BackButton.tsx`) que faz `router.back()` se `router.canGoBack()`, senão `router.replace('/mais/relatorios')`. Aplicar o mesmo padrão aos outros atalhos entre abas encontrados. Não altera `_layout.tsx` de abas se não for preciso; se a navegação por `NativeTabs` exigir ajuste de layout em `(tabs)/_layout.tsx`, registrar como risco e fazer a menor mudança.
  3. Testes: `src/components/relatorio/__tests__/ReportLinkCard.test.tsx` (novo; `expo-router` simulado: `push` chamado com o `href` e o `origem`); testes de tela de `comissao/index` e `organizacao/index`: com `origem=relatorio`, o Voltar chama `router.back` e, sem histórico, `router.replace('/mais/relatorios')`.
  4. Comportamento real no Android e iOS não é provado por Jest: entra no plano manual (RF-R81, U6).
- [x] **Passo 7 — Fechamento da fase 1.** `npm test`, `npm run lint`, `npm run typecheck` verdes (ou falhas registradas). Escrever `aidlc-docs/construction/u5-app-telas/code/code-summary.md` (fase 1): arquivos alterados, testes novos, assinatura do `useFieldErrors`, resultados dos três comandos, buscas textuais, o que ficou fora. Avisar o orquestrador de que `perfil.tsx` está liberado para a U8 e de que o hook está disponível.

## 3. FASE 2 (onda 2) — depende de rotas da U7

Cada passo só começa quando a rota correspondente da U7 existe (relatório da U7 e `api/docs/openapi.yaml`, lidos sem editar). Nomes de campo e códigos de erro vêm do contrato C6; onde este plano diz "campo da C6" o executor copia o nome real.

- [x] **Passo 8 — Entrada da fase 2.** Ler o relatório da U7 (C6) e o `api/docs/openapi.yaml`; listar no `code-summary.md` as rotas e campos usados por passo. Se uma rota faltar, o passo correspondente fica "bloqueado" e é registrado. Rodar a linha de base de novo.
- [x] **Passo 9 — RF-R40 (datas no passado alinhadas à RF-R10).** Dependência: RF-R10 (entregue na onda 1).
  1. Novo `src/utils/fusoReuniao.ts` com `instanteNoFuso(data, hora, fuso)` e a constante `TZ_REUNIOES = 'America/Sao_Paulo'`, espelhando a API (usar `Intl.DateTimeFormat` com `timeZone`; confirmar no código da U7 o algoritmo para dar o mesmo resultado). Teste `utils/__tests__/fusoReuniao.test.ts`: instantes conhecidos, inclusive virada de dia.
  2. `src/schemas/reuniaoSchema.ts`: início no futuro e término depois do início comparados por esse instante, não pelo fuso do aparelho; mensagens iguais às da API ("A reunião não pode começar no passado", "O término deve ser depois do início", textos finais copiados do `commonSchema.ts` da API).
  3. Testes em `src/schemas/__tests__/reuniaoSchema.test.ts` com `TZ=UTC` e fuso de reunião `America/Sao_Paulo`: início 2 h no passado recusado; reunião à noite para a mesma noite aceita; término antes do início recusado.
  4. Em `(reunioes)/index.tsx`, `inicioDeHoje`/`dataDoSeletor` (linhas ~253-258) passam a usar o mesmo utilitário.
  5. Risco: suporte a `timeZone` em `Intl` no Hermes; o teste roda em Node. Registrar para o plano manual.
- [x] **Passo 10 — RF-R35 (botão de entrada só na janela).** Dependência: RF-R09 (entregue na onda 1).
  1. Novo `src/utils/janelaCheckIn.ts`: `calcularJanelaCheckIn(reuniao)` devolve `{ abreEm, fechaEm, estado: 'antes' | 'aberta' | 'depois' }` usando a regra (margens) lida na API/C6 e o utilitário do passo 9. A decisão final é sempre da API; o app só reflete.
  2. `src/components/ReuniaoCheckIn.tsx` e `src/app/(tabs)/(reunioes)/reuniao/[id].tsx`: fora da janela, esconder o botão de entrada e mostrar o motivo ("A entrada abre às HH:mm"); depois do fim, texto de janela encerrada. Se a API devolver 409 mesmo assim, mostrar a mensagem recebida (`ApiError.message`).
  3. Atualizar `src/components/__tests__/ReuniaoCheckIn.test.tsx`: botão ausente antes do início e depois do fim, presente na janela; mensagem com a hora de início; 409 exibido. Teste novo `utils/__tests__/janelaCheckIn.test.ts` com bordas (1 s antes e depois).
- [x] **Passo 11 — RF-R39 (ata).** Dependência: RF-R16 da U7.
  1. `src/services/ataService.ts`: novos campos/erros da C6 (aprovada, exportada, versão); tratar 409 de exportação antes da aprovação.
  2. `src/components/AtaReuniao.tsx` e `src/components/ata/*`, `src/app/(tabs)/(reunioes)/ata/[id].tsx`: botão de exportar/imprimir desabilitado (com motivo) antes da aprovação; voto na ata liberado a quem a API autoriza (sem exigir o presidente); após a exportação, aprovação exibida como definitiva e voto bloqueado. `src/utils/ataPdf.ts`/`ataPdf.web.ts`: só se a exportação precisar do novo estado.
  3. Testes: `components/__tests__/AtaReuniao.test.tsx` (exportação desabilitada antes da aprovação; voto de integrante comum; rótulo definitivo após exportação), `utils/__tests__/ataPdf.test.ts` e `services` (409 mapeado).
- [x] **Passo 12 — RF-R38 (votação).** Dependência: RF-R17 e RF-R18 da U7.
  1. `src/schemas/votacaoSchema.ts`: campos `tipo` (aberta ou secreta), voto nulo, resultado parcial, troca de voto (nomes da C6), com valores padrão e mensagens em pt-BR.
  2. `src/services/votacaoService.ts`: payloads e tipos novos; erros 409 (voto sem entrada, após saída, após encerramento, troca desligada) repassados.
  3. Telas: formulário de criação (`components/VotacoesDaReuniao.tsx` e/ou `(reunioes)/votacao/[id].tsx`, conforme onde o formulário está hoje): escolha do tipo, voto nulo, resultado parcial, permitir troca. Tela de votação: opção "Voto nulo" quando ativa; esconder a lista de quem votou em votação secreta; botão de trocar voto só se permitido; resultado parcial só se ligado.
  4. Testes: `schemas/__tests__/votacaoSchema.test.ts`, `components/__tests__/VotacoesDaReuniao.test.tsx` (tipos; lista de votantes ausente na secreta; presente na aberta), serviço com erros 409.
  5. Sem biometria neste passo (passo 15).
- [x] **Passo 13 — Fechamento da fase 2 obrigatória.** `npm test`, `npm run lint`, `npm run typecheck`; buscas: `opacity: 0.75`, `ID do usuário`, `site|página|clique` em textos; conferir `git status` (sem alterar arquivos da seção 1.3). Atualizar `code-summary.md` com fase 2, passos bloqueados e itens para o plano manual: botão de entrada por horário, "Voltar" nos atalhos entre abas (Android e iOS), votação secreta, tema "Sistema".

## 4. Se der tempo (ordem de corte: o primeiro a sair é o do topo da lista do requirements 13.2)

Itens de baixo para cima na prioridade de execução: faça RF-R49 e RF-R45 só depois do passo 13; os demais seguem a ordem do corte (RF-R42, RF-R36/R37/R44, biometria saem primeiro quando falta tempo; RF-R49 por último).

- [ ] **Passo 14 — RF-R49 (tema "Sistema", fase 1 quando sobrar tempo).** `src/store/themeStore.ts`: `applyToNative('system')` hoje aplica o esquema atual detectado (`Appearance.getColorScheme()`), o que fixa o tema do momento. Conferir com a documentação do SDK 58 (`Appearance`) se `setColorScheme('unspecified')` é aceito e nunca `null` (`Parameter specified as non-null is null` no Android). Ajustar só se a documentação confirmar. Teste em `src/store/__tests__/stores.test.ts` (ou novo `themeStore.test.ts`) com `Appearance` simulado: "system" nunca chama `setColorScheme(null)`. Verificação em aparelho vai ao plano manual (`[A CONFIRMAR NO CÓDIGO]`).
- [ ] **Passo 15 — RF-R45 (manual dentro do app, fase 1 quando sobrar tempo).**
  1. Conteúdo em `src/content/manual/` como módulos TypeScript `as const` (RN-20): `index.ts`, um arquivo por seção (reuniões, comissões, organizações, ata, votação, presença, relatórios, conta). Uma seção por funcionalidade com nome do RF, passos numerados e resultado esperado. Sem "site", "página", "clicar". As seções de autenticação (cadastro, confirmação de e-mail, recuperação, biometria) ficam como marcadores até a U8 entregar a lista de mensagens e passos; preencher na fase 2 se já houver.
  2. Tela nova `src/app/(tabs)/mais/ajuda.tsx` (renderiza as seções com `Screen`, `ScreenHeader`, `Card`, `BackButton`), e item "Ajuda" em `src/app/(tabs)/mais/index.tsx`. `downloadManualUsuario` continua, agora como "Exportar PDF" opcional. Texto de "primeiro acesso" (`PrimeiroAcessoDialog`) abre a tela de ajuda em vez do PDF, se isso não conflitar com o teste do passo 2.
  3. Testes: `src/app/(tabs)/mais/__tests__/ajuda.test.tsx` renderiza todas as seções; teste de tipos dos módulos pelo `npm run typecheck`.
- [ ] **Passo 16 — RF-R42 (reunião em etapas, fase 1 quando sobrar tempo).** Dividir o formulário de `(reunioes)/index.tsx` (mais de seis campos) em etapas ou tela própria: etapas "Básico" (título, comissão), "Quando e onde" (data, horários, local), "Detalhes" (pauta, descrição, convidados); ação principal visível; "próximo" entre campos (`returnKeyType`, `onSubmitEditing`); `keyboardType`, `autoComplete`, `textContentType` adequados; `scrollToTopKey` por etapa. Extrair componentes para `components/` para o arquivo (1144 linhas) não crescer. Testes de tela por etapa. Maior risco de regressão: só depois do passo 13 e com os testes de reunião verdes antes.
- [ ] **Passo 17 — RF-R37 (convite: mudar resposta e reenviar).** Dependência: RF-R14. `components/ConvitePendenteCard.tsx` e o serviço de convites em `services/reuniaoService.ts` (ou `notificacaoService.ts`, onde as ações estiverem): botões "Aceitar" depois de recusar e "Reenviar convite"; 409/410 depois do início exibidos. Testes de `ConvitePendenteCard` e do serviço.
- [ ] **Passo 18 — RF-R36 (presença: saída e marcação pelo Administrador).** Dependência: RF-R15. `components/ReuniaoCheckIn.tsx`, `components/presenca/*`, `services/listaPresencaService.ts`/`reuniaoService.ts`: botão de saída, marcação de presença de um participante pelo Administrador da comissão, mensagens de 409/403. Testes de tela e serviço.
- [ ] **Passo 19 — RF-R44 (relatório das reuniões de que participou).** Dependência: RF-R19. Serviço novo ou existente em `services/` (rota C6), tela em `src/app/(tabs)/mais/relatorios/` (sem alterar a lógica do RF-R43 do passo 6). Testes de serviço e de tela.
- [ ] **Passo 20 — Confirmação por biometria (parte de RF-R36 e R38).** Só se a U8 já entregou `src/hooks/useConfirmacaoBiometrica.ts` (RF-R31). Em `ReuniaoCheckIn` (registrar presença) e no voto, chamar `confirm(motivo)` antes de enviar; `false` cancela sem chamar a API e mostra "Confirmação cancelada. A ação não foi feita.". Testes com o hook simulado (`jest.mock`), ligado e desligado. Se a RF-R31 for cortada, este passo sai.
- [ ] **Passo 21 — Fechamento final.** Repetir `npm test`, `npm run lint`, `npm run typecheck`; atualizar `code-summary.md` com os itens "se der tempo" feitos e os cortados.

## 5. Rastreabilidade

| Requisito | Passos |
|---|---|
| RF-R35 | 10, 13 |
| RF-R36 | 18, 20 |
| RF-R37 | 17 |
| RF-R38 | 12, 20 |
| RF-R39 | 11 |
| RF-R40 | 9 |
| RF-R41 | 5 |
| RF-R42 | 16 |
| RF-R43 | 6 |
| RF-R44 | 19 |
| RF-R45 | 15 |
| RF-R46 | 2 |
| RF-R47 | 3 |
| RF-R48 | 4 |
| RF-R49 | 14 |
| Linha de base, entradas e fechamentos (RF-R84, insumo da U9) | 1, 7, 8, 13, 21 |

## 6. Riscos

| Risco | Mitigação |
|---|---|
| Rotas da U7 atrasam ou mudam campo | Passo 8 registra bloqueios; cada passo da fase 2 lê o contrato real; RF-R40 e R35 não esperam a U7 fase 2 |
| `NativeTabs` não preserva a pilha ao ir ao relatório e voltar | Parâmetro `origem` com `replace` de reserva (passo 6); teste manual Android e iOS |
| `(reunioes)/index.tsx` tem 1144 linhas e é editado nos passos 5, 9 e 16 | Passos em sequência, nunca em paralelo; extrair componentes no passo 16 |
| Fuso no Hermes diferente do Node | Utilitário único coberto por teste; verificação em aparelho no plano manual |
| `perfil.tsx` editado pela U5 e depois pela U8 | Passo 3 mínimo e só na fase 1; U5 não abre o arquivo na fase 2 |
