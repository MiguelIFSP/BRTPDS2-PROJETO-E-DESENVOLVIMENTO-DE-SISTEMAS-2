- **Incremento:** Apresentação final (AF) — refatoração de código
- **Unidade:** U1 api-auth-protecao
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** aed2702
- **Data de revisão:** 2026-11-20
- **Responsável(eis):** [nome de quem revisa e aprova]
- **Estado:** Proposta — aguardando aprovação
- **Fontes:** `api/prisma/schema.prisma` (MySQL, Prisma 7.10); [business-logic-model.md](business-logic-model.md); [business-rules.md](business-rules.md); unit-of-work-dependency.md (C4)

# Entidades de domínio — U1 api-auth-protecao

`[A CONFIRMAR]` = conferir na versão instalada com `npx @better-auth/cli generate` (ou `npx auth generate`), que gera o `schema.prisma` esperado. O resultado do gerador prevalece sobre os nomes abaixo.

## 1. Chave primária inteira

O `User.id` atual é `Int @default(autoincrement())` e todas as tabelas de domínio apontam para ele. Para não reescrever chaves estrangeiras, o Better Auth é configurado para ids numéricos sequenciais: `advanced.database.generateId: "serial"` (nome `[A CONFIRMAR]`; em versões antigas, `advanced.generateId: false` com `autoincrement` no banco). Todas as tabelas do Better Auth abaixo usam `Int @id @default(autoincrement())`, e o código converte `String(user.id)` para `Number` onde necessário (`requireAuth`). Se a opção não existir na versão instalada, plano B: ids `String` só nas tabelas do Better Auth, com `User.id` mantido `Int` por mapeamento de modelo próprio (`user.modelName`), e conversão no `requireAuth` — decisão D11, tratada na primeira tarefa.

## 2. Modelos propostos

### 2.1 `User` (existente, alterado)

| Campo | Tipo | Observação |
|---|---|---|
| `id` | `Int @id @default(autoincrement())` | Inalterado; mantém todas as FKs |
| `name` | `String` | Inalterado; nome de exibição, não identifica login |
| `email` | `String @unique` | Inalterado; normalizado em minúsculas |
| `emailVerified` | `Boolean @default(false)` | **Novo**, exigido pelo Better Auth |
| `image` | `String?` | **Novo**, exigido (não usado pelo app) |
| `updatedAt` | `DateTime @default(now()) @updatedAt` | **Novo**, exigido |
| `role` | `Role @default(USER)` | Inalterado; `additionalFields.role` com `input: false` (cliente não define) |
| `createdAt` | `DateTime @default(now())` | Inalterado |
| `themePreference` | `Tema? @default(system)` | Inalterado; `additionalFields.themePreference` |
| `password` | — | **Removido** (vai para `Account`); ver seção 4 |
| `passwordResetTokens` | relação | **Removida** (modelo descartado) |
| `sessions`, `accounts` | `Session[]`, `Account[]` | **Novas** relações |

As demais relações (`comissoes`, `organizacoes`, `reunioesCriadas`, `votacoesCriadas`, `votos`, `votosAta`, `convitesReuniao`, `registrosReuniao`, `notificacoes`, `lembretes`) ficam como estão. A U7 altera depois só a autoria (RF-R08), em migration própria.

### 2.2 `Session` (nova)

| Campo | Tipo |
|---|---|
| `id` | `Int @id @default(autoincrement())` |
| `userId` | `Int` (FK `User.id`, `onDelete: Cascade`) |
| `token` | `String @unique` (`@db.VarChar(255)`) |
| `expiresAt` | `DateTime` |
| `ipAddress` | `String?` |
| `userAgent` | `String?` (`@db.Text`) |
| `createdAt` | `DateTime @default(now())` |
| `updatedAt` | `DateTime @updatedAt` |

Índice em `userId`. O token é o valor devolvido em `set-auth-token` (assinado no cabeçalho).

### 2.3 `Account` (nova)

| Campo | Tipo | Observação |
|---|---|---|
| `id` | `Int @id @default(autoincrement())` | |
| `userId` | `Int` | FK `User.id`, `onDelete: Cascade` |
| `accountId` | `String` | Credencial: `String(userId)`; Google: `sub` do provedor |
| `providerId` | `String` | `"credential"` ou `"google"` |
| `accessToken`, `refreshToken`, `idToken` | `String?` (`@db.Text`) | Só login social |
| `accessTokenExpiresAt`, `refreshTokenExpiresAt` | `DateTime?` | |
| `scope` | `String?` | |
| `password` | `String?` | scrypt (`sal:chave`) ou, até o primeiro login, SHA-256 legado de 64 hexadecimais |
| `createdAt` / `updatedAt` | `DateTime` | |

`@@unique([providerId, accountId])` e índice em `userId`. Uma conta de usuário pode ter `credential` e `google`.

### 2.4 `Verification` (nova)

| Campo | Tipo |
|---|---|
| `id` | `Int @id @default(autoincrement())` |
| `identifier` | `String` (`@db.VarChar(255)`; guarda a chave do token) |
| `value` | `String` (`@db.Text`) |
| `expiresAt` | `DateTime` |
| `createdAt` / `updatedAt` | `DateTime` |

Índice em `identifier`. Guarda tokens de verificação de e-mail, de redefinição de senha (substitui `PasswordResetToken`) e de troca de e-mail. Uso único: a linha é apagada ao consumir.

### 2.5 `RateLimit` (nova)

| Campo | Tipo |
|---|---|
| `id` | `Int @id @default(autoincrement())` (ou `String`, `[A CONFIRMAR]`) |
| `key` | `String @unique` |
| `count` | `Int` |
| `lastRequest` | `BigInt` |

Usada com `rateLimit.storage: "database"` (resiste a reinício e a vários processos do PM2). Nome do modelo `rateLimit` (padrão, `modelName` configurável). Sem FK.

### 2.6 `PasswordResetToken` (existente, descartada)

Nunca foi usada (bug 2). A migration 1 confere `COUNT(*) = 0` no ambiente de desenvolvimento e a remove com `DROP TABLE`. Se houver linhas, os tokens estão obsoletos (expirados ou sem uso por código): são descartados do mesmo jeito. Decisão D4.

## 3. Relações

```
User 1—N Session   (Cascade)
User 1—N Account   (Cascade)   credential: 0..1, google: 0..1
Verification, RateLimit: sem FK (identifier e key são texto)
```

Excluir um usuário (`deleteUser`, U7) apaga em cascata as sessões e contas dele; nada mais precisa mudar na exclusão por causa da U1.

## 4. Migration 1 proposta e preservação de dados

Nome: `20261121120000_better_auth` (data a ajustar ao gerar). Gerada com `npx prisma migrate dev --create-only`, editada à mão **antes de aplicar** para ordenar os passos, e conferida com `prisma migrate deploy` em banco populado (regra 4 do C4). Passos, em ordem:

1. `CREATE TABLE Session`, `Account`, `Verification`, `RateLimit` (com índices e FKs acima).
2. `ALTER TABLE User ADD COLUMN emailVerified BOOLEAN NOT NULL DEFAULT false, ADD COLUMN image VARCHAR(191) NULL, ADD COLUMN updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)`.
3. Copiar as senhas antes de remover a coluna:
   ```sql
   INSERT INTO Account (userId, accountId, providerId, password, createdAt, updatedAt)
   SELECT id, CAST(id AS CHAR), 'credential', password, createdAt, NOW(3) FROM User;
   ```
   (`password` de `User` é `NOT NULL`, então toda conta existente ganha a credencial.) O valor copiado é o SHA-256 legado; o primeiro login o converte (seção 7 do modelo de lógica).
4. Contas legadas: `UPDATE User SET emailVerified = true WHERE role = 'ADMIN'` (BR-10); as demais ficam `false` e confirmam no próximo login (D2).
5. Normalizar e-mail: conferir que não há duplicados por caixa (`SELECT LOWER(email), COUNT(*) ... HAVING COUNT(*) > 1`) antes de `UPDATE User SET email = LOWER(email)`. Com a collation padrão do MySQL o índice único já é insensível a caixa, então o esperado é zero conflitos.
6. `ALTER TABLE User DROP COLUMN password`.
7. `DROP TABLE PasswordResetToken` (D4).

Preservação e reversão: tudo roda com dados reais; nenhuma linha de `User` é apagada ou renumerada, então as FKs de domínio seguem válidas. Antes de aplicar em qualquer banco com dados: `mysqldump` do banco. Como o passo 6 é destrutivo, a reversão é restaurar o dump (a migration não tem `down`). Verificações pós-migration: `COUNT(User) = COUNT(Account WHERE providerId='credential')`; nenhuma `Account.password` nula; `SELECT COUNT(*) FROM Account WHERE password REGEXP '^[a-f0-9]{64}$'` é o número de contas ainda legadas (consulta de saída para remover `senhaLegada.ts`).

Ordem entre unidades: a U1 cria só esta migration (C4). A U7 cria depois as de autoria, presença, votação e ata, a partir do schema liberado pela U1. O relatório da U1 registra "schema liberado" ao concluir, com o nome do arquivo da migration.

## 5. Testes de dados exigidos

| Teste | Cobre |
|---|---|
| Migration em banco populado com 3 usuários (USER, ADMIN, e-mail com caixa mista) | passos 1 a 7, contagens pós-migration |
| Login de conta legada seguido de regravação em scrypt | BR-14, plano de migração |
| Login com conta legada e senha errada não altera `Account.password` | BR-14 |
| Cadastro novo grava só scrypt; mesma senha em duas contas gera hashes diferentes | BR-12 |
| Excluir `User` apaga `Session` e `Account` | cascata |
| `ensureDefaultAdmin` com e sem ADMIN existente | BR-41 a BR-46 |
