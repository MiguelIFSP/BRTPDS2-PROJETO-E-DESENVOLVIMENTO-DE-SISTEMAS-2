# Numeração de casos de uso (UC) e requisitos funcionais (RF)

```text
Incremento: Refatoração da documentação (Di1 e Di2; reservas do Di3)
Escopo: numeração única de UC e RF; de-para dos números antigos para os novos
Branch: feature/refatoracao-documentacao
Commit: 464c190
Data de revisão: 2026-11-10
Responsável(eis): [nome de quem revisa e assina o documento]
Estado: Parcial (o de-para foi montado a partir dos documentos e dos slides; a conferência de cada linha com o código acontece nos lotes L2 a L5 da refatoração)
Fontes: requisitos_e_casos_de_uso.md do commit 464c190 (removido no lote L7; consta no git); documentos/entrega2_Di1/Diagramas/; documentos/entrega3_Di2/lista_presenca.md; documentos/entrega3_Di2/email_recuperacao.md; slides das aulas 1 a 4 (Downloads, fora do repositório); índice de requisitos da Wiki (imagens enviadas pelo usuário)
```

## Regra

- **Cada caso de uso é um requisito funcional:** `RFnn = UCnn` (UC01 → RF01 e assim por diante). Os slides pedem "descrição de cada caso de uso como um requisito funcional".
- **Numeração única no projeto**, na ordem dos incrementos e dos requisitos dos slides. Em Informações do sistema vale a ordem que os documentos já tinham (Status, Gestão/Setup/Reset, Relatórios).
- **Exceção única à regra "nunca renumere" (DOC-09):** esta renumeração foi decidida pelo responsável do projeto para eliminar colisões entre documentos. Depois dela, números de UC e RF voltam a ser imutáveis, e os antigos deixam de ser usados, exceto nesta tabela.
- **UC41 em diante** ficam reservados ao incremento 3 (ata, votação, relatório individual, manual) e não são documentados nesta etapa. A migração do SDK 58 do Expo é manutenção, não um caso de uso.
- Os **RF01 a RF15 da Wiki** (anteriores a esta renumeração) deixam de existir como requisitos. Os links `wiki/RFxx` antigos passam a apontar para outro assunto assim que a Wiki for republicada; use a tabela 2 para localizar o conteúdo.

## 1. UC e RF novos (de-para dos números antigos)

| Novo UC e RF | Caso de uso | Número ou nome antigo | Incremento e requisito (slide) | Estado inicial |
|---|---|---|---|---|
| UC01 / RF01 | Solicitar criação de organização | sem número (diagrama Astah) | Di1 · Cadastro de organização | Documentar |
| UC02 / RF02 | Autorizar ou revogar organização | sem número | Di1 · Cadastro de organização | Documentar |
| UC03 / RF03 | Gerenciar organizações | sem número | Di1 · Cadastro de organização | Documentar |
| UC04 / RF04 | Criar comissão | UC01 (DCU Comissão) | Di1 · Cadastro de comissão | Reaproveitar e conferir |
| UC05 / RF05 | Listar comissões | UC02 (DCU Comissão) | Di1 · Cadastro de comissão | Reaproveitar e conferir |
| UC06 / RF06 | Excluir comissão | UC03 (DCU Comissão) | Di1 · Cadastro de comissão | Reaproveitar e conferir |
| UC07 / RF07 | Adicionar membro à equipe da comissão | UC04 (DCU Comissão) | Di1 · Cadastro de comissão | Reaproveitar e conferir |
| UC08 / RF08 | Remover membro da equipe da comissão | UC05 (DCU Comissão) | Di1 · Cadastro de comissão | Reaproveitar e conferir |
| UC09 / RF09 | Cadastrar-se na plataforma | sem número (DCU Usuário, PNG) | Di1 · Cadastro de usuário | Documentar |
| UC10 / RF10 | Solicitar acesso a uma organização | sem número (DCU Usuário, PNG) | Di1 · Cadastro de usuário | Documentar |
| UC11 / RF11 | Gerenciar usuários da organização | sem número (DCU Usuário, PNG) | Di1 · Cadastro de usuário | Documentar |
| UC12 / RF12 | Trocar senha | não documentado | Di1 · Configurações de usuário | Documentar |
| UC13 / RF13 | Recuperar conta | "UC02" em `email_recuperacao.md` | Di1 · Configurações de usuário | Documentar e integrar `email_recuperacao.md` |
| UC14 / RF14 | Alterar dados pessoais | não documentado | Di1 · Configurações de usuário | Documentar |
| UC15 / RF15 | Alterar tema preferido | "UC a confirmar" (exemplo do guia) | Di1 · Configurações de usuário | Documentar |
| UC16 / RF16 | Consultar status atual dos subsistemas | UC01 (Status do Sistema) | Di1 · Informações do sistema | Dividir o existente |
| UC17 / RF17 | Consultar relatório diário de status | UC02 (Status do Sistema) | Di1 · Informações do sistema | Dividir o existente |
| UC18 / RF18 | Consultar histórico de um subsistema | UC03 (Status do Sistema) | Di1 · Informações do sistema | Dividir o existente |
| UC19 / RF19 | Executar checagem periódica dos subsistemas | UC04 (Status do Sistema) | Di1 · Informações do sistema | Dividir o existente |
| UC20 / RF20 | Reportar status de um subsistema | UC05 (Status do Sistema) | Di1 · Informações do sistema | Dividir o existente |
| UC21 / RF21 | Disparar checagem imediata de um subsistema | UC06 (Status do Sistema) | Di1 · Informações do sistema | Dividir o existente |
| UC22 / RF22 | Autenticar administrador | UC07 (Gestão, Setup e Reset) | Di1 · Informações do sistema | Dividir o existente |
| UC23 / RF23 | Iniciar, parar ou reiniciar um subsistema | UC08 (Gestão, Setup e Reset) | Di1 · Informações do sistema | Dividir o existente |
| UC24 / RF24 | Reiniciar a própria API de Gestão | UC09 (Gestão, Setup e Reset) | Di1 · Informações do sistema | Dividir o existente |
| UC25 / RF25 | Reportar o próprio status ao iniciar ou parar | UC10 (Gestão, Setup e Reset) | Di1 · Informações do sistema | Dividir o existente |
| UC26 / RF26 | Subir o ambiente completo (setup inicial) | UC11 (Gestão, Setup e Reset) | Di1 · Informações do sistema | Dividir o existente |
| UC27 / RF27 | Resetar o sistema | UC12 (Gestão, Setup e Reset) | Di1 · Informações do sistema | Dividir o existente |
| UC28 / RF28 | Consultar relatório de organizações | UC13 (Relatórios) | Di1 · Informações do sistema | Dividir o existente |
| UC29 / RF29 | Consultar relatório de comissões | UC14 (Relatórios) | Di1 · Informações do sistema | Dividir o existente |
| UC30 / RF30 | Consultar relatório de usuários | UC15 (Relatórios) | Di1 · Informações do sistema | Dividir o existente |
| UC31 / RF31 | Alterar o perfil de um usuário (promover ou rebaixar) | UC16 (Relatórios) | Di1 · Informações do sistema | Dividir o existente |
| UC32 / RF32 | Agendar reunião e convidar integrantes | não documentado | Di2 · Reunião | Documentar |
| UC33 / RF33 | Responder convite (aceitar ou recusar) | não documentado | Di2 · Reunião | Documentar |
| UC34 / RF34 | Registrar entrada na reunião | não documentado (`testes_presenca_reuniao.md`) | Di2 · Reunião | Documentar |
| UC35 / RF35 | Registrar saída da reunião | não documentado (`testes_presenca_reuniao.md`) | Di2 · Reunião | Documentar |
| UC36 / RF36 | Visualizar demonstração da lista de presença | UC-LP01 | Di2 · Reunião | Reaproveitar `lista_presenca.md` |
| UC37 / RF37 | Gerar versão local da lista de presença | UC-LP02 | Di2 · Reunião | Reaproveitar `lista_presenca.md` |
| UC38 / RF38 | Consultar e compartilhar versão da lista | UC-LP03 | Di2 · Reunião | Reaproveitar `lista_presenca.md` |
| UC39 / RF39 | Marcar presença e revisar adesão | UC-LP04 | Di2 · Reunião | Reaproveitar `lista_presenca.md` |
| UC40 / RF40 | Gerar lista de presença real (`Planejado`) | "Caso de uso futuro" | Di2 · Reunião | Reaproveitar, como Planejado |
| UC41 em diante | Reservados ao Di3 | — | Di3 | Fora desta etapa |

## 2. Onde está o conteúdo dos RF01 a RF15 da Wiki

| RF antigo da Wiki | Título na Wiki | RFs novos |
|---|---|---|
| RF01 | Cadastro de usuário | RF09, RF10, RF11 |
| RF02 | Cadastro de organizações | RF01, RF02, RF03 |
| RF03 | Troca de senha de usuário | RF12 |
| RF04 | Recuperação de conta | RF13 |
| RF05 | Alteração de dados pessoais | RF14 |
| RF06 | Tema preferido do aplicativo | RF15 |
| RF07 | Cadastro e gestão de comissões | RF04, RF05, RF06 |
| RF08 | Gestão de equipa e papéis na comissão | RF07, RF08 |
| RF09 | Status do sistema e dos subsistemas | RF16 a RF21 |
| RF10 | Relatórios de usuários, organizações e comissões | RF28 a RF31 |
| RF11 | Reinicialização de subsistemas | RF23, RF24 e, em parte, RF22 e RF25 (a confirmar) |
| RF12 | Setup inicial e inicialização do sistema | RF26 e, em parte, RF22 e RF25 (a confirmar) |
| RF13 | Reset do sistema | RF27 |
| RF14 | Participação em reuniões da comissão | RF32, RF33, RF34, RF35 |
| RF15 | Geração e gerenciamento de lista de presença | RF36 a RF40 |

## 3. Colisões de numeração eliminadas

| Onde | Número antigo | Passa a ser |
|---|---|---|
| `requisitos_e_casos_de_uso.md` (Status) e DCU Comissão | UC01 a UC06 / UC01 a UC05 | UC16 a UC21 / UC04 a UC08 |
| `email_recuperacao.md` | UC02 (recuperação de conta) | UC13 |
| `testes_detalhe_organizacao_comissao.md` | UC02 (gerenciar comissões) | `[A CONFIRMAR]`: UC03 (gerenciar organizações) e/ou UC05 a UC08 (comissões); definido ao ajustar o documento (lote L7) |
| `lista_presenca.md` | UC-LP01 a UC-LP04 e RF-LP01 a RF-LP06 | UC36 a UC39 (UC40 planejado) e RF36 a RF40; o mapeamento dos RF-LP aos RF novos é feito no lote L5 |

## 4. Arquivos de diagrama movidos para `Diagramas/legado/` (lote L7)

Os originais ficam em `entrega2_Di1/Diagramas/legado/`, com o nome ligado ao RF e ao UC da documentação corrigida. Os diagramas atuais são os `DCU-*.puml` e `.svg` da pasta `Diagramas/`.

| Arquivo legado | Nome anterior | RF e UC novos | Observação |
|---|---|---|---|
| `RF01-RF03_UC01-UC03_DCU-Organizacao.asta` | `DCU - Organização.asta` | RF01 a RF03 | Astah, binário; substituído por `DCU-Cadastro-de-Organizacao` |
| `RF01-RF03_UC01-UC03_DCU-Organizacoes.png` | `DCU - Organizações.png` | RF01 a RF03 | Mostrava o Administrador como generalização do Usuário (não permitido pelo DOC-10) |
| `RF04-RF08_UC04-UC08_DCU-Comissao.md` | `DCU - Comissão.md` | RF04 a RF08 | Mermaid `flowchart`, UC01 a UC05 antigos |
| `RF04-RF08_UC04-UC08_DS-Comissao.md` | `DS - Comissão.md` | RF04 a RF08 | Sequências genéricas; substituídas pelas sequências dos RF |
| `RF04-RF08_UC04-UC08_Diagrama-de-classes-Comissao.md` | `diagrama de classe comissão.md` | RF04 a RF08 | Incorporado em `diagrama_de_classes.md` (visão operacional) |
| `RF09-RF11_UC09-UC11_DCU-Usuario.png` | `DCU - Usuário.png` | RF09 a RF11 | Substituído por `DCU-Cadastro-de-Usuario` |
| `RF09-RF11_UC09-UC11_DS-Usuario.png` | `DS-Usuario.png` | RF09 a RF11 | Sequência genérica ("Tela de Cadastro", "API", "Banco de Dados") que mistura cadastrar, editar, excluir conta e gerenciar usuário; as sequências dos RF09, RF11 e RF14 foram refeitas a partir do código |
| `RF01-RF11_UC01-UC11_Diagrama-de-classes.asta` | `Diagrama de classes.asta` | RF01 a RF11 (a confirmar) | Astah, binário, não lido; a cobertura exata é `[A CONFIRMAR]`; substituído por `diagrama_de_classes.md` |

## 5. Documentos mantidos e documentos removidos

- **Removido:** `entrega2_Di1/requisitos_e_casos_de_uso.md`. Os casos de uso, fluxos e sequências foram divididos em `requisitos/RF16` a `RF31`; os RNF viraram `requisitos/RNF13` a `RNF41`; os atores foram para `atores.md`. O texto original está no git (commit `464c190`).
- **Substituído no mesmo nome:** `entrega2_Di1/dicionario_de_dados.md` (agora unificado e conferido contra o schema).
- **Mantidos:** `entrega3_Di2/lista_presenca.md` (plano de testes TM, TP, TV e TI, contrato de dados e regras preparadas, citados pelos RF36 a RF40) e `entrega3_Di2/email_recuperacao.md` (configuração do provedor de e-mail e resultados de 21/10/2026, citados pelo RF13). Os `testes_*.md` continuam por assunto.

## 6. Lacunas conhecidas (sem UC ou RF na numeração aprovada)

- **Excluir conta:** o código tem `DELETE /api/usuarios/:id/dados-pessoais` e `/dados-completos` (tela `excluir-conta.tsx`), previstos também no `DS-Usuario.png`, sem UC próprio. `[A CONFIRMAR]`.
- **Login:** `POST /api/login` (e `POST /login`) não tem UC nem RF, embora o RF22 (autenticar administrador) o descreva para o painel.
- **Operações de reunião:** listar, detalhar, editar, excluir, convites pendentes, avisos e lembretes (ver RF32). `[A CONFIRMAR]`.
- **RNF08, RNF10 a RNF12, RNF36 e RNF37:** constam na Wiki e não no repositório.
