# Projeto e Desenvolvimento de Sistemas 2

Repositório do projeto de um aplicativo mobile para Android e iOS, desenvolvido de forma incremental ao longo das entregas da disciplina.

## Estrutura do repositório

```text
/
├── documentos/
│   ├── entrega1_AP/
│   │   ├── introducao_e_motivacao.md
│   │   ├── arquitetura_tecnologias.md
│   │   ├── padroes_interface_e_nomenclatura.md
│   │   └── plano_de_testes.md
│   ├── entrega2_Di1/
│   │   ├── requisitos_e_casos_de_uso.md
│   │   ├── dicionario_de_dados.md
│   │   └── diagramas/
│   ├── entrega3_Di2/
│   ├── entrega4_Di3/
│   └── entrega5_AF/
│       ├── manual_do_usuario.pdf
│       ├── arquivo_apresentacao_final.pdf
│       └── catalogo_licencas_softwares.md
├── src/
├── .gitignore
└── README.md
```

## Documentação

### Entrega 1: Análise e Proposta Inicial

A pasta [`documentos/entrega1_AP/`](documentos/entrega1_AP/) reúne a documentação inicial do projeto:

- [`introducao_e_motivacao.md`](documentos/entrega1_AP/introducao_e_motivacao.md): introdução e motivação do sistema;
- [`arquitetura_tecnologias.md`](documentos/entrega1_AP/arquitetura_tecnologias.md): arquitetura proposta, linguagens e bibliotecas;
- [`padroes_interface_e_nomenclatura.md`](documentos/entrega1_AP/padroes_interface_e_nomenclatura.md): padrões de interface e nomenclatura;
- [`plano_de_testes.md`](documentos/entrega1_AP/plano_de_testes.md): planejamento dos testes.

A análise de mercado e a avaliação de softwares equivalentes, como o *Fellow*, devem ser entregues separadamente no Moodle. Um backup conceitual pode ser mantido nesta documentação quando necessário.

### Entregas 2, 3 e 4: Incrementos de desenvolvimento

As pastas [`entrega2_Di1`](documentos/entrega2_Di1/), [`entrega3_Di2`](documentos/entrega3_Di2/) e [`entrega4_Di3`](documentos/entrega4_Di3/) correspondem aos incrementos do desenvolvimento. Elas devem receber as atualizações de documentação e código relacionadas a cada etapa, incluindo:

- diagramas de casos de uso, classes e sequência;
- requisitos funcionais e não funcionais;
- dicionário e modelagem de dados;
- evolução das funcionalidades do aplicativo.

Na Entrega 2, a documentação inicial está disponível em [`requisitos_e_casos_de_uso.md`](documentos/entrega2_Di1/requisitos_e_casos_de_uso.md) e [`dicionario_de_dados.md`](documentos/entrega2_Di1/dicionario_de_dados.md).

#### Regra de branches

Cada incremento deve ser enviado em uma branch isolada, por exemplo:

```text
feature/entrega-di1
feature/entrega-di2
feature/entrega-di3
```

Após o envio de uma entrega, sua branch não deve ser alterada.

### Entrega 5: Apresentação final

A pasta [`documentos/entrega5_AF/`](documentos/entrega5_AF/) reúne os materiais finais:

- [`manual_do_usuario.pdf`](documentos/entrega5_AF/manual_do_usuario.pdf): manual de utilização do sistema;
- [`arquivo_apresentacao_final.pdf`](documentos/entrega5_AF/arquivo_apresentacao_final.pdf): apresentação final;
- [`catalogo_licencas_softwares.md`](documentos/entrega5_AF/catalogo_licencas_softwares.md): catálogo dos softwares utilizados e suas respectivas licenças.

## Código-fonte

A pasta [`src/`](src/) contém o código-fonte do aplicativo mobile, desenvolvido em React Native para Android e iOS.

Os incrementos devem ser cumulativos: novas versões precisam preservar as funcionalidades e os dados armazenados nas etapas anteriores. O usuário não deve precisar refazer toda a configuração a cada atualização.

## Estrutura da aplicação e instruções Docker

- **Aplicação (front-end mobile):** `better-meet/` — código do app React Native, assets e configurações do projeto.
- **API e backend:** `api/` — código da API Node/TypeScript e integrações com o banco.
- **Prisma (ORM):** `api/prisma/` — contém o arquivo de schema em `api/prisma/schema.prisma` e configurações do Prisma Client.
- **API de monitoramento:** `monitoring-better-meet/` — registra e expõe o histórico de status de `database`, `data-api` e `mobile-app` (mais detalhes em [`monitoring-better-meet/contexto-api-monitoramento.md`](monitoring-better-meet/contexto-api-monitoramento.md)).
- **API de gestão:** `management-better-meet/server/` — permite a admins iniciar/parar/reiniciar os outros subsistemas (as duas APIs Node via PM2, os dois bancos via Docker), porta padrão `3335`.
- **Painel admin:** `management-better-meet/web/` — front-end (Expo/React Native Web) do painel de gestão; login restrito a `role: ADMIN`. Servido pela própria `management-better-meet/server` em `/admin` (build estático, não é um servidor separado).

### Subindo tudo rapidamente (Windows)

Pré-requisitos que não são automatizados (não têm como, com segurança): Node.js, Docker Desktop, `npm install -g pm2`, e os arquivos `.env` de cada projeto (peça os valores reais pro time — nenhum `.env` é versionado).

```powershell
# 1. Instala as dependências de todos os projetos
.\install-all.ps1

# 2. Crie o .env de cada projeto a partir do .env.example correspondente
#    (api/, better-meet/, monitoring-better-meet/, management-better-meet/server/,
#    management-better-meet/web/)

# 3. Sobe tudo: bancos (Docker) + api/monitoring/management (PM2) + build do painel
.\start-all.ps1

# Painel admin: http://localhost:3335/admin (login com um usuário role ADMIN)

# Pra acompanhar o que está rodando:
pm2 list
pm2 logs <nome>   # api | monitoring | management
```

Rodar `.\start-all.ps1` de novo é seguro — os passos são idempotentes (não duplica container, e o PM2 apenas reinicia o que já estava rodando).

As seções abaixo detalham o que esses scripts fazem por baixo dos panos, e como rodar cada peça manualmente se precisar de mais controle.

Instruções rápidas para rodar o banco de dados com Docker Compose manualmente (serviço já disponível no compose do front-end):

- A compose file relevante está em `better-meet/docker-compose.yml` e define o serviço `db_better_meet` (MySQL).
- Para subir o container do banco (em background), inicie o Docker na sua máquina (abra o Docker Desktop), então a partir da raiz do repositório execute:

```bash
docker compose -f better-meet/docker-compose.yml up -d
# ou, se preferir a versão legada do comando:
docker-compose -f better-meet/docker-compose.yml up -d
```

- Para subir apenas o serviço do banco (por nome) use:

```bash
docker compose -f better-meet/docker-compose.yml up -d db_better_meet
```

- Para parar e remover os containers levantados pelo compose:

```bash
docker compose -f better-meet/docker-compose.yml down
```

Notas úteis:
- Se estiver em Mac com chip Apple Silicon e ocorrer erro de arquitetura, descomente a linha `platform: linux/amd64` em `better-meet/docker-compose.yml`.
- As credenciais e nome do banco estão definidas no compose (ex.: `MYSQL_DATABASE: bettermeet`). Ajuste conforme necessário.

Prisma (após o banco estar rodando):

```bash
cd api
# instalar dependências (se necessário)
npm install
# gerar Prisma Client
npx prisma generate
# rodar migrações de desenvolvimento (opcional)
npx prisma migrate dev --name init
```

Scripts úteis na raiz:

- `start-db.sh` / `start-db.ps1` — sobe/derruba só o serviço do banco (`better-meet/docker-compose.yml`). Útil quando você só precisa do banco, sem as APIs.
- `install-all.ps1` — roda `npm install` em todos os projetos do repositório (`api`, `better-meet`, `monitoring-better-meet`, `management-better-meet/server`) de uma vez. Rode isso primeiro numa máquina nova.
- `start-all.ps1` — sobe o sistema completo com um único comando: cria/inicia os containers de banco (idempotente, funciona mesmo que nunca tenham sido criados antes), builda `monitoring-better-meet` e `management-better-meet/server`, e inicia `api`, `monitoring` e `management` via PM2 (`ecosystem.config.js`, na raiz).

Uso (POSIX, só o banco):

```bash
./start-db.sh up
./start-db.sh down
```

Uso (Windows PowerShell):

```powershell
.\start-db.ps1 up
.\start-db.ps1 down
```

## API de Monitoramento — autenticação e como testar

A API de monitoramento (`monitoring-better-meet/`, porta padrão `3334`) usa dois mecanismos de autenticação diferentes, dependendo de quem está chamando:

| Endpoint | Protegido por | Quem chama |
|---|---|---|
| `POST /monitoring-better-meet/status` | `x-api-key` (header) | Chamadas de máquina — hoje só o app mobile reportando erro; o cron interno grava direto no banco, sem passar por HTTP |
| `GET /monitoring-better-meet/status`, `/status/daily`, `/status/:id/history` | JWT (`Authorization: Bearer <token>`) | Usuário logado — o painel de monitoramento do app mobile |

O JWT usado nas rotas `GET` **não é emitido pela própria API de monitoramento** — ele vem do `POST /login` da API de Dados (`api/`, porta padrão `3333`), que assina o token com um `JWT_SECRET` compartilhado entre as duas APIs.

### Variáveis de ambiente necessárias

Nenhum `.env` é versionado (estão no `.gitignore`) — cada dev/máquina precisa criar o seu. Peça os valores reais pro time (ex.: no grupo do projeto), **nunca** commite essas chaves.

- `api/.env`: precisa de `JWT_SECRET`.
- `monitoring-better-meet/.env`: precisa de `JWT_SECRET` (**idêntico** ao da `api/`) e `INTERNAL_API_KEY`.

Se o `JWT_SECRET` não bater entre as duas APIs, todo token vira inválido e as rotas `GET` da API de monitoramento retornam `401`.

### Passo a passo pra testar no Postman (ou Insomnia)

1. Suba as duas APIs: `npm run dev` em `api/` (porta 3333) e em `monitoring-better-meet/` (porta 3334).
2. Pegue um token: `POST http://localhost:3333/login` com body JSON `{ "identifier": "...", "password": "..." }` (use um usuário já cadastrado, ou as credenciais padrão que aparecem no console ao subir a `api/`). A resposta traz o campo `token`.
3. Nas requisições `GET` da collection da API de monitoramento: aba **Auth** → tipo **Bearer Token** → cole o `token`. Não use `x-api-key` nessas rotas, ela não tem efeito ali.
4. Na requisição `POST /monitoring-better-meet/status`: aba **Headers** → `x-api-key` → valor do `INTERNAL_API_KEY` do `.env`.
5. Opcional — pra não copiar o token toda vez: no request do `/login`, aba **Scripts → Post-response**, adicione `pm.environment.set("jwt_token", pm.response.json().token);` e use `{{jwt_token}}` como Bearer Token nas outras rotas (precisa ter um Environment selecionado no Postman, não "No environment").

Detalhes de implementação (por que JWT + API key em vez de BetterAuth "de verdade" agora) estão documentados em [`monitoring-better-meet/contexto-api-monitoramento.md`](monitoring-better-meet/contexto-api-monitoramento.md).

## Desenvolvimento

Antes de implementar uma nova funcionalidade:

1. consulte a documentação e os requisitos do incremento correspondente;
2. crie ou utilize a branch da entrega em desenvolvimento;
3. implemente a funcionalidade preservando o comportamento existente;
4. atualize a documentação e os diagramas relacionados;
5. valide a alteração com os testes previstos no plano de testes.

## Licenças

As licenças dos softwares e bibliotecas utilizados no projeto estão documentadas no [catálogo de licenças](documentos/entrega5_AF/catalogo_licencas_softwares.md).
