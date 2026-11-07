# Code Summary - migracao-expo-58-web

## Arquivos alterados (workspace root: `management-better-meet/web`)
| Arquivo | Mudança |
|---|---|
| `package.json` | SDK 58 (tabela abaixo), `@expo/vector-icons` removido, `@react-native-vector-icons/ionicons` e `eslint`/`eslint-config-expo` adicionados |
| `package-lock.json` | Regenerado do zero (`zustand` fixado em 5.0.15) |
| `src/app/login.tsx` | Import do `Ionicons` (1 linha) |
| `src/hooks/use-theme.ts` | Comparação com `'unspecified'` trocada por `scheme === 'dark'` (RN 0.88) |
| `src/hooks/use-color-scheme.web.ts` | `eslint-disable-next-line` com motivo (1 linha) |
| `eslint.config.js` | Novo (base `eslint-config-expo`) |

Não alterados: `app.json`, `tsconfig.json`, `sistema/start-all.ps1` (decisão do passo 8, a confirmar no export em Build and Test), documentação do projeto.

## Versões (de, para)
| Pacote | De | Para |
|---|---|---|
| expo | ~57.0.23 | ~58.0.23 |
| react, react-dom | 19.2.3 | 19.3.0 |
| react-native | 0.86.3 | 0.88.1 |
| expo-router | ~57.0.21 | ~58.0.30 |
| expo-constants | ~57.0.18 | ~58.0.15 |
| expo-font | ~57.0.4 | ~58.0.11 |
| expo-linking | ~57.0.10 | ~58.0.16 |
| expo-splash-screen | ~57.0.9 | ~58.0.13 |
| expo-symbols | ~57.0.3 | ~58.0.4 |
| expo-system-ui | ~57.0.4 | ~58.0.7 |
| expo-device | ~57.0.2 | ~58.0.5 |
| expo-glass-effect | ~57.0.3 | ~58.0.5 |
| expo-image | ~57.0.5 | ~58.0.18 |
| expo-status-bar | ~57.0.1 | ~58.0.4 |
| expo-web-browser | ~57.0.3 | ~58.0.7 |
| @expo/ui | ~57.0.18 | ~58.0.27 |
| react-native-gesture-handler | ~2.32.0 | ~3.3.0 |
| react-native-reanimated | 4.5.1 | 4.7.1 |
| react-native-worklets | 0.10.1 | 0.13.0 |
| react-native-safe-area-context | ~5.7.0 | ~5.11.1 |
| react-native-screens | ~4.26.0 | ~4.30.1 |
| react-native-web | ~0.21.0 | ~0.21.4 |
| @types/react | ~19.2.2 | ~19.3.0 |
| @expo/vector-icons | ^15.0.2 | removido |
| @react-native-vector-icons/ionicons | - | ^13.1.5 |
| eslint | - | ^9.39.5 |
| eslint-config-expo | - | ~58.0.4 |

## Resultados parciais (Code Generation)
- `npx tsc --noEmit`: 0 erros (antes: 1).
- `npm run lint`: 0 erros e 0 avisos.
- `npx expo-doctor`: 20 de 20.
- `npm ls`: sem conflitos.
- Bundle (`expo export -p web`) e teste no navegador: em Build and Test.

Detalhes e decisões: `migration-notes.md`.

## Alteração adicional (Build and Test, opção B do usuário)
| Arquivo | Mudança |
|---|---|
| `src/store/themeStore.ts` | Estado inicial `'light'`, `skipHydration`, `merge` (tema salvo, senão o do sistema) e `rehydrateTheme` exportado |
| `src/app/_layout.tsx` | `rehydrateTheme()` no `useEffect` de montagem do `RootLayout` |

Motivo: erro React #418 de hidratação no `Header` (🌙/☀️), porque o HTML estático é sempre claro e o cliente começava no tema do navegador. Efeito colateral aceito: quem usa tema escuro vê um instante em claro antes de o escuro ser aplicado (o HTML estático já era claro; antes isso era um erro de hidratação).

## Alteração adicional 2 (Build and Test, "Aplicar no login e salvar no botão")
| Arquivo | Mudança |
|---|---|
| `src/services/usuarioService.ts` | Novo: `updateTheme` (`PATCH /api/usuarios/:id/tema`) |
| `src/store/themeStore.ts` | `TEMAS_CONTA`, `TemaConta`, `applyAccountTheme`, `partialize` |
| `src/app/login.tsx` | Aplica `data.themePreference` depois do login |
| `src/components/Header.tsx` | Botão de tema salva na conta quando logado |

Funcionalidade nova (o `web` nunca usou `themePreference`), pedida pelo usuário durante o teste manual; não é correção de regressão. Decisões: falha ao salvar na conta não desfaz a troca de tema (só `console.error`); conta em `system` aplica o tema do navegador no login, e uma troca pelo botão grava `light` ou `dark` explícito na conta. Sem teste automatizado (o `web` não tem Jest; decisão P2 do usuário).

## Alteração adicional 3 (Build and Test, pedido do usuário)
| Arquivo | Mudança |
|---|---|
| `src/app/index.tsx` | `STOPPED_STATUSES`, `RUNNING_STATUSES` e `isActionAvailable`; botões Iniciar/Parar/Reiniciar desabilitados conforme o status do subsistema |

Regra: `DOWN` e `MAINTENANCE` só habilitam Iniciar; `OPERATIONAL` e `ERROR` habilitam Parar e Reiniciar; `UNKNOWN` habilita as três. Soma-se ao bloqueio existente (ação em andamento ou API de Gestão fora do ar). Funcionalidade nova, não faz parte da migração.
