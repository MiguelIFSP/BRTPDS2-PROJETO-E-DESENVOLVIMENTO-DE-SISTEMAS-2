# Relatório de bugs — revisão de 17/11/2026

Revisão do app mobile (`sistema/better-meet`), da API de dados (`sistema/api`) e da gestão (`sistema/management-better-meet`, servidor e painel web).

> **Versão analisada:** branch `development`, commit `e992493`. Linhas citadas valem para esse commit; confira antes de corrigir.
>
> **Situação:** nenhum item abaixo foi corrigido. Ao corrigir, marque o item com o commit ou PR da correção.

## Resumo por gravidade

| # | Gravidade | Sistema | Problema |
|---|---|---|---|
| 1 | Crítica | API | Exclusão de conta dá erro 500 para quem criou reunião ou votação |
| 2 | Crítica | API | Recuperação de senha troca a senha de qualquer conta só com o e-mail |
| 3 | Alta | Gestão (servidor) | Perfil de administrador lido do token, não do banco |
| 4 | Alta | Gestão (web) e app | Chave interna da monitoring embutida no código cliente |
| 5 | Média | API e app | Check-in permitido dias antes da reunião |
| 6 | Média | API | Regra de "não no passado" usa o fuso da máquina |
| 7 | Média | App | Sessão expirada não desloga o usuário |
| 8 | Média | API | Membro removido da organização continua nas comissões |
| 9 | Baixa | API | Login pelo nome é ambíguo |
| 10 | Baixa | API | Administrador padrão é promovido de novo a cada inicialização |
| 11 | Baixa | Gestão (web) | Sem a monitoring, o painel não mostra os subsistemas |

---

## API de dados

### 1. Exclusão de conta falha para quem criou reunião ou votação (crítica)

> **Corrigido parcialmente** na branch `feature/correcao-exclusao-conta-autoria` (commit: _a preencher_). A API agora responde **409** com a mensagem "Não foi possível excluir sua conta porque ainda existem reuniões ou votações criadas por você…", desfaz a transação e não registra erro inesperado; o `errorMiddleware.ts` também converte qualquer outro P2003 em 409. A exclusão de quem criou reunião ou votação ainda é recusada: falta decidir a regra de autoria (ver "Direção da correção").

**Onde:** `sistema/api/src/services/usuarioService.ts` (função `deleteUser`, linha 313) e `sistema/api/prisma/schema.prisma` (modelos `Reuniao` e `Votacao`).

**O que acontece:** as chaves estrangeiras `Reuniao_criadoPorUserId_fkey` e `Votacao_criadoPorUserId_fkey` foram criadas com `ON DELETE RESTRICT`. Ao excluir um usuário que criou alguma reunião ou votação, o banco recusa o `DELETE`. O erro do Prisma (P2003) não é tratado, e o app recebe "Erro interno. Tente novamente mais tarde."

**Como reproduzir:**
1. Crie uma reunião com um usuário comum.
2. Pelo app, peça a exclusão dos dados pessoais desse usuário.
3. A API responde 500.

Na exclusão completa, as reuniões das organizações apagadas somem em cascata, mas as reuniões e votações em comissões de outras organizações continuam bloqueando.

**Direção da correção:** decidir o que acontece com o que o usuário criou. As opções são transferir a autoria, apagar em cascata ou tornar `criadoPorUserId` opcional com `onDelete: SetNull`. Isso exige migration. Também vale mapear o P2003 no `errorMiddleware.ts` para uma resposta 409 legível.

### 2. Recuperação de senha sem verificação de posse do e-mail (crítica)

**Onde:** `sistema/api/src/services/authService.ts` (função `forgotPassword`, linha 34) e rota pública `POST /api/auth/forgot-password`.

**O que acontece:** a rota recebe e-mail e nova senha e grava a senha direto. Qualquer pessoa que saiba o e-mail de alguém, inclusive do administrador da plataforma, assume a conta. O comentário em `authController.ts` já reconhece o risco para o Incremento 1.

**Direção da correção:** enviar um token por e-mail e só aceitar a nova senha com ele. A tabela `PasswordResetToken` já existe no schema e não é usada.

### 5. Check-in permitido dias antes da reunião (média)

**Onde:** `sistema/api/src/services/reuniaoService.ts` (função `checkIn`, linha 500) e `sistema/better-meet/src/app/(tabs)/(reunioes)/reuniao/[id].tsx` (linhas 147 a 150 e 350 a 368).

**O que acontece:** o servidor só exige que o status seja `AGENDADA`. Nenhum código muda o status para `REALIZADA`, então a regra nunca bloqueia. O app mostra o botão de entrada enquanto o horário final não passou, sem olhar o horário de início. Um participante pode registrar presença dias antes, e esse registro também libera o acesso à ata.

**Direção da correção:** no servidor, recusar o check-in fora de uma janela em torno do horário da reunião, calculada com `instanteNoFuso` e `TZ_REUNIOES`. No app, esconder ou desabilitar o botão fora da mesma janela.

### 6. Validação de horário passado usa o fuso da máquina (média)

**Onde:** `sistema/api/src/schemas/reuniaoSchema.ts` (função `isDateTimeInPast`, linha 40).

**O que acontece:** a função monta as datas com `new Date(ano, mês, dia, ...)`, que usa o fuso do processo Node. O resto da API usa `TZ_REUNIOES` por meio de `utils/fusoHorario.ts`. Nem o `ecosystem.config.js` nem o `docker-compose.yml` definem `TZ`. Com o servidor em UTC e `TZ_REUNIOES` em São Paulo:
- reuniões criadas à noite para a mesma noite são recusadas como "no passado";
- reuniões até 3 horas no passado são aceitas de manhã.

**Direção da correção:** comparar com `instanteNoFuso(data, hora, env.TZ_REUNIOES)` e `new Date()`.

### 8. Membro removido da organização continua nas comissões (média)

**Onde:** `sistema/api/src/services/organizacaoService.ts` (função `removeMember`, linha 416).

**O que acontece:** a remoção apaga só o vínculo com a organização. As linhas de `ComissaoEquipe` daquela organização ficam. Como `assertMembroDaComissao` em `reuniaoService.ts` só olha a equipe da comissão, a pessoa removida continua criando reuniões, fazendo check-in e editando ata.

**Direção da correção:** na mesma transação, remover a pessoa das comissões da organização. Se ela for a única administradora de alguma comissão, aplicar a mesma regra de sucessão usada na exclusão de conta.

### 9. Login pelo nome é ambíguo (baixa)

**Onde:** `sistema/api/src/services/authService.ts` (linha 14).

**O que acontece:** o login aceita e-mail ou nome e usa `findFirst`. O nome não é único. Quando duas pessoas têm o mesmo nome, a senha é conferida só contra a primeira, e a segunda nunca entra pelo nome.

**Direção da correção:** aceitar só e-mail, ou tornar o nome de usuário único.

### 10. Administrador padrão é promovido de novo a cada inicialização (baixa)

**Onde:** `sistema/api/src/services/usuarioService.ts` (função `ensureDefaultAdmin`, linha 337).

**O que acontece:** o `upsert` grava `role: 'ADMIN'` para `ADMIN_EMAIL` sempre que a API sobe. Um rebaixamento feito por outro administrador é desfeito no próximo restart. Se a conta tiver sido excluída, ela é recriada com `ADMIN_PASSWORD`.

**Direção da correção:** só criar a conta quando não existir nenhum administrador, sem mexer em contas existentes.

---

## Gestão (servidor e painel web)

### 3. Perfil de administrador lido do token, não do banco (alta)

**Onde:** `sistema/management-better-meet/server/src/middlewares/auth.ts` (linha 31).

**O que acontece:** o middleware confia no `role` gravado no JWT, que vale 7 dias. A API de dados resolveu esse mesmo problema lendo o perfil do banco a cada requisição, mas a gestão não. Um administrador rebaixado, ou com a conta excluída, continua podendo parar a API, a monitoring e os bancos até o token vencer.

**Direção da correção:** consultar o perfil atual, seja no banco, seja por uma rota da API de dados, antes de autorizar as ações.

### 4. Chave interna da monitoring embutida no código cliente (alta)

**Onde:** `sistema/management-better-meet/web/src/config/api.ts` e `sistema/better-meet/src/config/api.ts` (`EXPO_PUBLIC_MONITORING_API_KEY`).

**O que acontece:** variáveis `EXPO_PUBLIC_*` vão para o bundle. O painel é servido sem autenticação em `/admin`, então qualquer pessoa extrai a chave e grava status falsos com `POST /status`. Como o painel desabilita todos os botões quando o status da gestão não é `OPERATIONAL`, um status forjado trava as ações do painel. O app mobile marca isso como exceção temporária.

**Direção da correção:** fazer o painel e o app reportarem erros por uma rota autenticada por JWT, e deixar a chave interna só nos servidores.

### 11. Sem a monitoring, o painel não mostra os subsistemas (baixa)

**Onde:** `sistema/management-better-meet/web/src/app/index.tsx` (renderização condicionada a `statusList`).

**O que acontece:** se a primeira busca de status falhar, a tela fica só com o indicador de carregamento. Não dá para religar a monitoring nem o banco dela pelo painel. O aviso na tela orienta a religar pelo terminal.

**Direção da correção:** mostrar os cartões com status "desconhecido" e liberar ao menos a ação de iniciar a monitoring.

---

## App mobile

### 7. Sessão expirada não desloga o usuário (média)

**Onde:** `sistema/better-meet/src/utils/apiClient.ts` (função `apiRequest`, linha 68).

**O que acontece:** o token fica salvo no aparelho e expira em 7 dias. Nenhum tratamento central de 401 chama `logout()`. Só a tela de status faz isso. Depois do vencimento, todas as outras telas mostram erro até a pessoa encontrar o botão de sair.

**Direção da correção:** em `apiRequest`, quando a resposta for 401 de uma requisição com token, chamar `useAuthStore.getState().logout()`.

O check-in antecipado do item 5 também precisa de ajuste no app.

---

## Verificação feita na revisão

| Projeto | Checagem de tipos | Testes |
|---|---|---|
| API | sem erros | 261 de 261 passaram |
| App mobile | sem erros | 196 de 198 passaram na execução completa |
| Gestão, servidor | sem erros | não tem testes |
| Gestão, web | 1 erro | não tem testes |

- As 2 falhas do app estouraram o tempo limite sob carga. As duas suítes passaram ao rodar sozinhas.
- O erro de tipos do painel web é o módulo `@react-native-vector-icons/ionicons`, que estava faltando no `node_modules` da máquina. Ele está no `package.json` e no lockfile, então basta rodar `npm install`.
