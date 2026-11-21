- **Incremento:** Apresentação final (AF) — refatoração de código
- **Escopo:** U5 app-telas, fases 1 e 2 obrigatórias (passos 1 a 13 do plano)
- **Branch:** feature/refatoracao-ultima-entrega
- **Estado:** Fases 1 e 2 (obrigatórios) executadas; itens "se der tempo" (passos 14 a 21) não iniciados

# U5 app-telas — resumo da geração (fase 1)

## Resultados (em `sistema/better-meet`)

| Comando | Linha de base | Final |
|---|---|---|
| `npm test` | 200 testes, 198 passaram, 2 falharam (suíte pesada, `ReunioesData`, passa isolada com 7/7; falha de tempo sob carga) | 29 suítes, 215 testes, todos passaram |
| `npm run lint` | sem erros nem avisos | sem erros nem avisos |
| `npm run typecheck` | sem erros | sem erros |

Depois do último ajuste (`useEffectEvent` em `(reunioes)/index.tsx`) rodaram de novo typecheck, lint e `ReunioesData` (8/8); a suíte completa de 215 foi rodada antes desse ajuste.

## Passos

- **RF-R46:** `PrimeiroAcessoDialog.tsx` agora diz "o aplicativo funciona". Busca textual: as únicas ocorrências restantes de `site|página|clique` são comentários de código (não alterados, regra 17).
- **RF-R47:** removido o `InfoRow` "ID do usuário" de `mais/perfil.tsx` (única edição no arquivo; liberado para a U8).
- **RF-R48:** `ListaPresencaEditor.tsx` usa `PressedOpacity`.
- **RF-R41:** novo `hooks/useFieldErrors.ts`, aplicado em `(reunioes)/index.tsx`, `comissao/index.tsx` e `comissao/[id].tsx`. Organização (`index` e `[id]`) já limpava o erro ao digitar (erro único, sem Yup por campo) e não mudou. Em `(reunioes)/index.tsx` o efeito de `?editar=` passou a usar `useEffectEvent` para manter o lint limpo.
- **RF-R43:** `BackButton` ganhou a prop opcional `fallbackHref` (`router.back()`, ou `router.replace(fallbackHref)` sem histórico). Atalhos `ComissaoReportView` e `OrganizacaoReportView` passam `origem=relatorio` (constante `ORIGEM_RELATORIO` em `utils/navegacaoOrigem.ts`); `comissao/index.tsx` e `organizacao/index.tsx` mostram o `BackButton` com fallback `/mais/relatorios` quando `origem === 'relatorio'`. `(tabs)/_layout.tsx` não foi alterado.

## Contrato para a U8 — `useFieldErrors`

```ts
useFieldErrors<Form>(): {
  errors: FieldErrors<Form>;
  setErrors: Dispatch<SetStateAction<FieldErrors<Form>>>;
  clearFieldError: (...campos: (keyof Form)[]) => void; // mesma referência se nenhum campo tem erro
  clearAllErrors: () => void;
}
```

## Levantamento de atalhos entre abas (RF-R43)

Cruzam abas: `ComissaoReportView` (`/comissao`) e `OrganizacaoReportView` (`/organizacao`), ambos tratados. Os demais `router.push`/`navigate` (`/mais/perfil`, `/mais/status`, `/mais/relatorios*`, `/mais/excluir-conta`, `reuniao/[id]`, `ata/[id]`, `historico`, `/organizacao/[id]`, `/comissao/[id]`) ficam dentro da própria aba; `PrimeiroAcessoDialog` usa `navigate` para `/mais` (da U8/RF-R45, fora do escopo). Nenhum outro exigiu mudança.

## Testes novos

`components/__tests__/PrimeiroAcessoDialog.test.tsx`, `mais/__tests__/perfil.test.tsx`, `hooks/__tests__/useFieldErrors.test.ts` (4), `components/relatorio/__tests__/ReportLinkCard.test.tsx`, `components/ui/__tests__/BackButton.test.tsx` (2), `components/__tests__/VoltarOrigem.test.tsx` (6: comissão e organização), e um caso em `ReunioesData.test.tsx` (erro some ao digitar, sem novo envio). O passo 4 foi coberto pelo teste existente de `ListaPresencaEditor` (renderiza sem erro) e pela busca textual (sem `opacity: 0.75`).

## Plano manual (depende de aparelho; RF-R81, U6)

- "Voltar" nos atalhos do relatório para Comissões e Organizações no Android e no iOS (`NativeTabs` pode não preservar a pilha; o `replace` de reserva cobre o caso sem histórico).
- Texto "aplicativo" no diálogo de primeiro acesso e ausência do ID no perfil (conferência visual).

## Desvios e pendências

- Nenhuma dependência nova; `package.json`, `app.json`, `authStore`, `apiClient` e telas de autenticação não foram tocados.
- Não houve git de escrita, servidor, build nem Wiki.
- Fora desta execução: passos 8 a 21 (fase 2 e "se der tempo"). Observação: o formulário de reunião já está dividido em etapas no código atual (RF-R42 aparentemente já atendido; conferir no passo 16).
- Aviso ao orquestrador: `perfil.tsx` liberado para a U8; `useFieldErrors` disponível.

# U5 app-telas — resumo da geração (fase 2, passos 8 a 13)

## Resultados reais (em `sistema/better-meet`)

- `npm test`: 34 suítes, 250 testes, todos passaram (linha de base da fase 2: 29 suítes e 215 testes). Utilitários e esquemas também com `TZ=UTC` (93 testes).
- `npm run lint`: sem erros nem avisos. `npm run typecheck`: sem erros.
- Buscas: sem `opacity: 0.75` nem "ID do usuário" no código; `site|página|clique` só em comentários.
- Arquivos protegidos (package.json, app.json, authStore, apiClient, login/cadastro/recuperação) sem alteração por esta unidade; `perfil.tsx` só tem a edição da fase 1.

## Passo 8 — rotas e campos da U7 usados

| Passo | Rota e campos (contrato C6/C7 da U7) |
|---|---|
| 9 (RF-R40) | Sem rota nova: espelha `instanteNoFuso` e as mensagens de `commonSchema` da API |
| 10 (RF-R35) | `POST /reunioes/:id/entrar` (409 antes da abertura e depois do fim); `GET /reunioes/:id` com `estado` e `janelaCheckIn { abre, fecha }` (tipados no serviço; a tela calcula a janela localmente) |
| 11 (RF-R39) | `GET/PUT /reunioes/:id/ata` com `presentes`, `aprovada`, `exportada`, `exportadaAt`, `podeExportar`; `POST /reunioes/:id/ata/exportar` (409 se não aprovada) |
| 12 (RF-R38) | `POST /reunioes/:id/votacoes` com `tipo`, `mostrarParcial`, `permiteTrocaVoto`; `GET /votacoes/:id` com `tipo`, `meuVotoNulo`, `nulos?`, `opcoes[].votos?`, `votantes?`; `POST /votacoes/:id/voto` com `{ opcaoId }` ou `{ nulo: true }` |
| Autoria nula | `criadoPorUserId` e `usuario` anuláveis em reunião e convite; convite exibe "usuário removido" |

Nenhuma rota faltou; nenhum passo ficou bloqueado.

## Passo 9 — RF-R40

Novos `utils/fusoReuniao.ts` (`TZ_REUNIOES`, `instanteNoFuso`, `dataNoFuso`, `horarioNoPassado`, `hojeNoFusoComoDataLocal`), mesmo algoritmo da API. `schemas/reuniaoSchema.ts` compara início e término por esse instante (mensagens já iguais às da API). `(reunioes)/index.tsx` usa `hojeNoFusoComoDataLocal` para o mínimo do seletor de data. Testes: `fusoReuniao.test.ts` (6) e 3 casos no `reuniaoSchema.test.ts` (2 h no passado recusado, noite aceita mesmo já sendo o dia seguinte em UTC, término antes do início recusado).

## Passo 10 — RF-R35

Novo `utils/janelaCheckIn.ts` (`calcularJanelaCheckIn`: abre 15 min antes do início, fecha no fim). `ReuniaoCheckIn` ganhou a prop opcional `horario`: antes da abertura esconde o botão e mostra "A entrada abre às HH:mm."; depois do fim, "A entrada nesta reunião já foi encerrada."; o 409 da API continua exibido pela mensagem recebida. A tela da reunião passa o horário. Testes: `janelaCheckIn.test.ts` (bordas de 1 s) e 5 casos em `ReuniaoCheckIn.test.tsx`.

## Passo 11 — RF-R39

`ataService`: tipo `Ata` com os campos novos e `exportar`. `AtaReuniao`: "Exportar PDF" desabilitado antes da aprovação, com o motivo e a contagem de aprovações; ao exportar, abre confirmação ("Exportar e tornar definitiva"), chama `/ata/exportar` e só então gera o PDF; selo "Aprovada pela maioria" ou "Aprovação definitiva"; depois da exportação o texto explica que voto e edição estão bloqueados (os botões seguem `podeVotar`/`podeEditar` da API). Voto de integrante comum já seguia `podeVotar`. `ataPdf` não mudou. Testes: 5 casos novos em `AtaReuniao.test.tsx` e `votacaoService.test.ts` (409 de exportação).

## Passo 12 — RF-R38

`votacaoSchema` (tipo, `mostrarParcial`, `permiteTrocaVoto`, padrões desligados), `votacaoService` (tipos novos; `vote` recebe `{ opcaoId }` ou `{ nulo: true }`; erros 409/410 repassados). Criação (`VotacoesDaReuniao`): escolha Aberta/Secreta (`Chip`) e duas chaves (resultado parcial, trocar voto). Tela da votação: selos de tipo, botão "Voto nulo", contagem de nulos, lista de votantes só quando a API a envia (nunca na secreta), "Trocar voto" só se `podeVotar`, resultado oculto com aviso enquanto o parcial está desligado. Testes: `votacaoSchema.test.ts`, `votacaoService.test.ts`, `VotacoesCriar.test.tsx` (novo; o caso de criação não convivia com o primeiro teste do arquivo antigo), `votacao/__tests__/detalhe.test.tsx` (6).

## Plano manual (aparelho; RF-R81, U6)

- Botão de entrada por horário (antes de 15 min do início, na janela, depois do fim), no Android e no iOS.
- `Intl` com `timeZone` no Hermes (RF-R40): reunião à noite aceita e início no passado recusado com o aparelho em outro fuso.
- Votação secreta: nenhuma tela mostra quem votou; voto nulo; troca de voto ligada e desligada; parcial oculto.
- Exportar ata: confirmação, PDF gerado e aprovação definitiva (sem voto) após exportar.
- "Voltar" dos atalhos entre abas e tema "Sistema" (este segue como passo 14, não feito).

## Desvios e pendências

- A janela de entrada é calculada no app pelo horário da reunião (margem de 15 min igual à da API); `estado`/`janelaCheckIn` da API ficaram tipados mas a tela não os usa (a API decide em último caso).
- O voto nulo aparece sempre que a pessoa pode votar (a API não tem chave para desligá-lo).
- `canManage` da tela da reunião segue criador ou ADMIN; o Administrador da comissão (novo na API) ainda não aparece como gestor na interface (fora do plano; a API autoriza).
- Passos 14 a 21 ("se der tempo") não iniciados.
- Nenhuma dependência nova; sem git de escrita, servidor, build nem Wiki.
