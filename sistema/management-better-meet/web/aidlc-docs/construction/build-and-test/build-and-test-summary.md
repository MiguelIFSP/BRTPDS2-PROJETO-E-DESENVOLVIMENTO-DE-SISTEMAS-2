# Build and Test Summary - migracao-expo-58-web

Data: 2026-11-07. Ambiente: Windows 10, Node 24.15.0, npm 10.9.2.

## Resultado dos portões (NFR-01)
| Portão | Comando | Resultado |
|---|---|---|
| Instalação limpa | `npm install` (sem `node_modules` nem lock) | OK; `npm ls` sem conflitos |
| Tipos | `npx tsc --noEmit` | 0 erros (antes da migração: 1, por falta do `expo-env.d.ts`) |
| Saúde do projeto | `npx expo-doctor` | 20 de 20 |
| Lint | `npm run lint` | 0 erros, 0 avisos |
| Bundle web | `npx expo export -p web --output-dir <scratchpad>` | OK em cerca de 27 s; base `/admin`, React Compiler ativo, 4 rotas estáticas (`/`, `/login`, `/_sitemap`, `/+not-found`), nenhum aviso de depreciação |
| Fonte dos ícones | conferência do export | `Ionicons.*.ttf` (390 KB) empacotada e servida com 200 |
| Servidor estático temporário | `serve-admin.mjs` em `http://localhost:4173/admin` | `/admin`, `/admin/login`, `/admin/_sitemap` com 200; rota inexistente com 404; bundle principal (1,1 MB) com 200 |
| Teste no navegador (login e painel) | manual, pelo usuário | **Pendente** (ver `manual-verification-checklist.md`) |

## Observações
- O export foi para uma pasta temporária; `web/dist` (o que a Gestão serve hoje em `/admin`) **não foi sobrescrito**. Ele é regenerado pelo `sistema/start-all.ps1` (`npm run export:web`) ou por `npm run export:web` no `web`.
- Não existem testes automatizados no `web` (unitários, integração, desempenho, segurança). Nenhum foi adicionado, por decisão do usuário (P2).
- `sistema/start-all.ps1`: o fluxo que toca o `web` (`npm install` e `npm run export:web`) foi exercitado com sucesso, em separado. **Nenhuma alteração necessária.** O script completo (Docker, bancos, PM2) não foi executado, por exigir serviços e fora do que foi autorizado.
- `app.json` e `tsconfig.json`: sem mudança necessária; o export respeitou `web.output: "static"` e `experiments.baseUrl: "/admin"`.
- Vulnerabilidades do `npm install`: 5 moderadas, não tratadas (extensão de segurança desligada).

## Achados do teste manual (2026-11-07)
- **F5 não mantém o login**: comportamento intencional já existente. `src/store/authStore.ts` não usa `persist` por decisão registrada em comentário (evitar token velho no navegador). Não é efeito da migração. A checklist inicial (item 8) estava errada e foi corrigida.
- **`POST /login` com 401 (2 vezes)**: a API recusou as credenciais digitadas. `login.tsx` trata 401 como credencial errada. Não é efeito da migração.
- **Erro React #418 (hidratação) no console** (corrigido a pedido do usuário, ver "Alteração adicional" em `code-summary.md`; verificação no navegador pendente). Causa provável, não provada por A/B com o SDK 57: o `Header` renderiza um texto dependente do tema (`isDarkMode ? '🌙' : '☀️'`); `themeStore.ts` inicia o tema com `Appearance.getColorScheme()`. O HTML estático (gerado em Node) sempre sai com ☀️ (conferido em `login.html` e `index.html`); com o navegador em modo escuro, o primeiro render do cliente é 🌙. `Header.tsx`, `themeStore.ts`, `authStore.ts`, `_layout.tsx` e `index.tsx` não foram alterados pela migração. O React recupera renderizando de novo no cliente. Correção possível (fora do escopo, decisão do usuário): iniciar o tema como claro na hidratação e aplicar o escuro depois, como o próprio `use-color-scheme.web.ts` faz.
