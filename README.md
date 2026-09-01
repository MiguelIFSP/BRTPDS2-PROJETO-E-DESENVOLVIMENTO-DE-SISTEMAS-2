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

Instruções rápidas para rodar o banco de dados com Docker Compose (serviço já disponível no compose do front-end):

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

- `start-db.sh` — script POSIX para subir/baixar o serviço do banco usando `better-meet/docker-compose.yml`.
- `start-db.ps1` — script PowerShell equivalente para Windows.

Uso (POSIX):

```bash
./start-db.sh up
./start-db.sh down
```

Uso (Windows PowerShell):

```powershell
.\start-db.ps1 up
.\start-db.ps1 down
```

## Desenvolvimento

Antes de implementar uma nova funcionalidade:

1. consulte a documentação e os requisitos do incremento correspondente;
2. crie ou utilize a branch da entrega em desenvolvimento;
3. implemente a funcionalidade preservando o comportamento existente;
4. atualize a documentação e os diagramas relacionados;
5. valide a alteração com os testes previstos no plano de testes.

## Licenças

As licenças dos softwares e bibliotecas utilizados no projeto estão documentadas no [catálogo de licenças](documentos/entrega5_AF/catalogo_licencas_softwares.md).
