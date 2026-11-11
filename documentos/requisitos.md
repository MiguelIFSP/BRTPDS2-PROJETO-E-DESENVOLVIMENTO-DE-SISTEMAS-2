# Requisitos — Better Meet

```text
Incremento: Refatoração da documentação (Di1 e Di2)
Escopo: índice e resumo dos requisitos funcionais (RF01 a RF40) e não funcionais (RNF); fonte da página Requisitos da Wiki
Branch: feature/refatoracao-documentacao
Commit: 464c190
Data de revisão: 2026-11-10
Responsável(eis): [nome de quem revisa e assina o documento]
Estado: Parcial (índice e catálogo de RNF prontos; os resumos de cada RF são preenchidos nos lotes L2 a L5)
Fontes: documentos/numeracao_uc_rf.md; requisitos_e_casos_de_uso.md do commit 464c190 (removido no lote L7; consta no git); documentos/entrega3_Di2/lista_presenca.md; índice de requisitos da Wiki (imagens enviadas pelo usuário)
```

Este arquivo é a **fonte da página Requisitos da Wiki**: cada requisito tem um resumo aqui e um link "ver mais detalhes" para a página `RFnn` da Wiki, gerada a partir de `documentos/entregaN_<sigla>/requisitos/RFnn_<assunto>.md`. A numeração segue [numeracao_uc_rf.md](numeracao_uc_rf.md): **RFnn = UCnn**.

## Requisitos funcionais

Link de detalhes: `https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RFnn`.

| RF | Requisito | Incremento | Pasta do detalhe | Estado | Resumo |
|---|---|---|---|---|---|
| RF01 | Solicitar criação de organização | Di1 | `entrega2_Di1/requisitos/` | Implementado | Entrada: `nome` (até 80 caracteres) e token. Origem: aba Organização. Ação: `POST /api/organizacoes` cria a organização `PENDENTE` e coloca o solicitante como `CRIADOR`. Saída: `201` com a organização. Destino: aba Organização. [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF01) |
| RF02 | Autorizar ou revogar organização | Di1 | `entrega2_Di1/requisitos/` | Implementado | Entrada: `id` e `status` (`ACEITA` ou `RECUSADA`), token de Administrador. Ação: `PATCH /api/organizacoes/:id/status` altera o status. Saída: `200`; `403` se não for Administrador; `404` se inexistente. Destino: aba Organização. [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF02) |
| RF03 | Gerenciar organizações | Di1 | `entrega2_Di1/requisitos/` | Implementado | Entrada: token, `id` e `nome`. Ação: lista (todas para o Administrador, `minhas` para membros), detalha, renomeia (Criador, Gerente, Administrador) e exclui (Criador, Administrador). Saída: `200`; `403`; `404`. Destino: aba Organização. [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF03) |
| RF04 | Criar comissão | Di1 | `entrega2_Di1/requisitos/` | Implementado | Entrada: `nome`, `descricao` opcional, `organizacaoId`, token. Ação: `POST /api/comissoes` cria a comissão em organização `ACEITA` e torna o criador `ADMINISTRADOR`. Saída: `201`; `403`, `404`, `409`. Destino: aba Comissão. [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF04) |
| RF05 | Listar comissões | Di1 | `entrega2_Di1/requisitos/` | Implementado | Entrada: `organizacaoId` ou `id` da comissão. Ação: lista as comissões da organização, detalha a equipe e edita nome e descrição (Administrador ou Facilitador). Saída: `200`; `403`; `404`. Destino: aba Comissão. [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF05) |
| RF06 | Excluir comissão | Di1 | `entrega2_Di1/requisitos/` | Implementado | Entrada: `id` da comissão. Ação: `DELETE /api/comissoes/:id`, só o `ADMINISTRADOR` da comissão; a equipe sai em cascata. Saída: `200` com mensagem; `403`; `404`. Destino: aba Comissão. [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF06) |
| RF07 | Adicionar membro à equipe da comissão | Di1 | `entrega2_Di1/requisitos/` | Implementado | Entrada: `comissaoId`, `userId`, `papel`. Ação: `POST /api/comissoes/:comissaoId/membros` (e `PATCH` do papel); o alvo precisa ser membro da organização. Saída: `201`/`200`; `400`, `403`, `404`, `409`. Destino: detalhe da comissão. [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF07) |
| RF08 | Remover membro da equipe da comissão | Di1 | `entrega2_Di1/requisitos/` | Implementado | Entrada: `comissaoId`, `userId`. Ação: `DELETE /api/comissoes/:comissaoId/membros/:userId`; o último `ADMINISTRADOR` não sai. Saída: `200` com mensagem; `400`, `403`, `404`. Destino: detalhe da comissão. [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF08) |
| RF09 | Cadastrar-se na plataforma | Di1 | `entrega2_Di1/requisitos/` | Implementado | Entrada: `nome`, `email`, `password` (8 a 72 caracteres, maiúscula, minúscula e número). Ação: `POST /api/usuarios` pública cria `User` com `Role.USER`. Saída: `201` sem a senha; `400`; `409` e-mail já cadastrado. Destino: tela de login. [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF09) |
| RF10 | Solicitar acesso a uma organização | Di1 | `entrega2_Di1/requisitos/` | Planejado | Previsto no slide do incremento 1 (solicitar acesso a uma organização, com aprovação do administrador da organização); sem código no repositório. Hoje a entrada em uma organização é feita por Criador, Gerente ou Moderador (RF11). [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF10) |
| RF11 | Gerenciar usuários da organização | Di1 | `entrega2_Di1/requisitos/` | Implementado | Entrada: `email` (adicionar), `papel`, `id` da organização, `userId`. Ação: adicionar, promover/rebaixar (limites: 1 gerente, 2 moderadores) e remover membros; busca de pessoas em `GET /api/usuarios/busca`. Saída: `201`/`200`; `400`, `403`, `404`, `409`. Destino: detalhe da organização. [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF11) |
| RF12 | Trocar senha | Di1 | `entrega2_Di1/requisitos/` | Implementado | Entrada: `currentPassword` e `newPassword` (8 a 72 caracteres, maiúscula, minúscula e número), token. Ação: `PATCH /api/usuarios/:id/senha`, só na própria conta. Saída: `200` com mensagem; `400`, `401` (senha atual incorreta), `403`, `404`. Destino: tela de perfil. [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF12) |
| RF13 | Recuperar conta | Di1 | `entrega2_Di1/requisitos/` | Parcial | Entrada: `email` e `newPassword`. Ação: `POST /api/auth/forgot-password`, pública, troca a senha sem confirmar que a pessoa é dona do e-mail (o código por e-mail foi entregue como serviço e não está ligado). Saída: `200`; `400`; `404`. Destino: tela de recuperação. [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF13) |
| RF14 | Alterar dados pessoais | Di1 | `entrega2_Di1/requisitos/` | Implementado | Entrada: `nome` (2 a 80 caracteres), `email`, token. Ação: `PATCH /api/usuarios/:id`, só na própria conta. Saída: `200` sem senha; `400`, `403`, `404`, `409` (e-mail em uso). Destino: tela de perfil e sessão do app. [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF14) |
| RF15 | Alterar tema preferido | Di1 | `entrega2_Di1/requisitos/` | Implementado | Entrada: `theme` (`light`, `dark` ou `system`), token. Ação: o app aplica o tema e grava em `PATCH /api/usuarios/:id/tema`; no login aplica o tema salvo. Saída: `200 { id, themePreference }`; `400`, `403`, `404`. Destino: aparência do app. [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF15) |
| RF16 | Consultar status atual dos subsistemas | Di1 | `entrega2_Di1/requisitos/` | Implementado | Entrada: Token JWT (`Authorization: Bearer`). Origem: Tela "Status do Sistema" do app (aba Mais) e painel de gestão. Saída: Lista com id, nome, status, mensagem e data/hora da última checagem de cada subsistema; `401` sem token válido. Destino: Tela de status. [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF16) |
| RF17 | Consultar relatório diário de status | Di1 | `entrega2_Di1/requisitos/` | Implementado | Entrada: `date` (AAAA-MM-DD, opcional; sem ela vale o dia atual em Brasília) e token JWT. Origem: Chamada direta à API; nenhuma tela usa este endpoint hoje. Saída: Resumo por subsistema (`totalChecks`, `uptimePercentage`, `lastStatus` e `checks`); `400` data inválida; `401`. Destino: Cliente da API. [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF17) |
| RF18 | Consultar histórico de um subsistema | Di1 | `entrega2_Di1/requisitos/` | Implementado | Entrada: `subSystemId` (URL), `days` (opcional; padrão 7; as telas usam 30) e token JWT. Origem: Tela "Status do Sistema" do app e painel de gestão. Saída: Histórico por dia (`totalChecks`, `uptimePercentage`, `lastStatus`, `worstStatus`), inclusive dias sem checagem; `400`, `401`, `404`. Destino: Tela de status. [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF18) |
| RF19 | Executar checagem periódica dos subsistemas | Di1 | `entrega2_Di1/requisitos/` | Implementado | Entrada: Nenhuma (agendador `node-cron`, a cada 3 horas). Origem: Cron de Monitoramento, dentro da própria API de monitoramento. Saída: Um `StatusCheck` por subsistema, `OPERATIONAL` ou `DOWN`. Destino: Banco de monitoramento. [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF19) |
| RF20 | Reportar status de um subsistema | Di1 | `entrega2_Di1/requisitos/` | Implementado | Entrada: `subSystem`, `status`, `message` e `isBlocking` opcionais, e o header `x-api-key`. Origem: App Mobile, Painel de Gestão e API de Gestão. Saída: `201` com o `StatusCheck` criado; `400`; `401`. Destino: Banco de monitoramento. [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF20) |
| RF21 | Disparar checagem imediata de um subsistema | Di1 | `entrega2_Di1/requisitos/` | Implementado | Entrada: `subSystem` (URL) e o header `x-api-key`. Origem: Painel de Gestão e App Mobile (depois de uma ação) e `start-all.ps1` (setup). Saída: Status mais recente do subsistema; `401`; `404` subsistema desconhecido. Destino: Cliente que pediu a checagem. [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF21) |
| RF22 | Autenticar administrador | Di1 | `entrega2_Di1/requisitos/` | Implementado | Entrada: Usuário ou e-mail e senha. Origem: Tela de login do painel de gestão (`POST /login`) ou do app (`POST /api/login`). Saída: `{ id, name, email, role, token }` (JWT de 7 dias); `401` credenciais inválidas. Destino: Painel de gestão ou app. [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF22) |
| RF23 | Iniciar, parar ou reiniciar um subsistema | Di1 | `entrega2_Di1/requisitos/` | Implementado | Entrada: `name` e `action` (`start`, `stop` ou `restart`) na URL e token de Administrador. Origem: Painel de gestão e tela "Status e reset do sistema" do app. Saída: Resultado da ação sobre o subsistema; `400`, `401`, `403`, `404`. Destino: Painel ou app. [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF23) |
| RF24 | Reiniciar a própria API de Gestão | Di1 | `entrega2_Di1/requisitos/` | Implementado | Entrada: `action` em `POST /subsystems/management/:action` e token de Administrador. Origem: Card "API de Gestão (esta)" do painel e card equivalente do app. Saída: `202 { subsystem, action, status: "accepted" }` antes da ação. Destino: Painel ou app. [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF24) |
| RF25 | Reportar o próprio status ao iniciar ou parar | Di1 | `entrega2_Di1/requisitos/` | Implementado | Entrada: Nenhuma do usuário: evento do ciclo de vida do processo (subir, `SIGINT`, `SIGTERM`). Origem: PM2, ao iniciar ou encerrar a API de Gestão. Saída: `POST` de status à monitoring (`OPERATIONAL` ao subir, `MAINTENANCE` ao parar). Destino: API de Monitoramento. [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF25) |
| RF26 | Subir o ambiente completo (setup inicial) | Di1 | `entrega2_Di1/requisitos/` | Implementado | Entrada: Execução manual de `start-all.ps1` na pasta `sistema`. Origem: Administrador do Servidor, no terminal. Saída: Cinco subsistemas de servidor em execução e status inicial registrado. Destino: Servidor (PM2 e Docker). [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF26) |
| RF27 | Resetar o sistema | Di1 | `entrega2_Di1/requisitos/` | Implementado | Entrada: Comandos manuais de PM2 e Docker (não há endpoint nem botão de reset). Origem: Administrador do Servidor, no terminal. Saída: Subsistemas encerrados e, se desejado, bancos sem dados. Destino: Servidor (PM2 e Docker). [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF27) |
| RF28 | Consultar relatório de organizações | Di1 | `entrega2_Di1/requisitos/` | Implementado | Entrada: Token JWT (e papel `ADMIN` na rota global). Origem: Tela "Relatórios" do app (aba Mais). Saída: `total`, `porStatus`, `crescimentoPorMes`, `distribuicaoPapeis` e `mediaMembrosPorOrganizacao`; `401`; `403`. Destino: Tela de relatórios. [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF28) |
| RF29 | Consultar relatório de comissões | Di1 | `entrega2_Di1/requisitos/` | Implementado | Entrada: Token JWT (e papel `ADMIN` na rota global). Origem: Tela "Relatórios" do app, aba Comissões. Saída: `total`, `totalOrganizacoes`, `porOrganizacao`, `crescimentoPorMes`, `distribuicaoPapeis`, `mediaMembrosPorComissao` e `comissoes`; `401`; `403`. Destino: Tela de relatórios. [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF29) |
| RF30 | Consultar relatório de usuários | Di1 | `entrega2_Di1/requisitos/` | Implementado | Entrada: Token JWT de Administrador. Origem: Tela "Relatórios" do app, aba Usuários (só para Administrador). Saída: Indicadores e lista de usuários da plataforma; `401`; `403`; `500`. Destino: Tela de relatórios. [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF30) |
| RF31 | Alterar o perfil de um usuário (promover ou rebaixar) | Di1 | `entrega2_Di1/requisitos/` | Implementado | Entrada: `id` do usuário (URL), `role` (`ADMIN` ou `USER`) e token de Administrador. Origem: Painel de detalhes do usuário, na lista do relatório de usuários. Saída: Usuário com o novo perfil; `400`, `401`, `403`, `404`, `409`. Destino: Tela de relatórios. [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF31) |
| RF32 | Agendar reunião e convidar integrantes | Di2 | `entrega3_Di2/requisitos/` | Implementado | Entrada: `comissaoId`, `titulo`, `pauta`, `local`, `data`, `horaInicio`, `horaFim`, `convidados`, token. Ação: `POST /api/reunioes` cria a reunião `AGENDADA` e um convite `PENDENTE` por convidado, e envia e-mail (convites extras em `POST /api/reunioes/:id/convites`). Saída: `201`; `400`, `403`, `404`, `409`. Destino: aba Reuniões. [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF32) |
| RF33 | Responder convite (aceitar ou recusar) | Di2 | `entrega3_Di2/requisitos/` | Implementado | Entrada: `status` (`ACEITO` ou `RECUSADO`) e `inviteId`, ou o token do e-mail. Ação: `PATCH /api/reunioes/convites/:inviteId/responder` ou `POST /api/convites/:token`; bloqueia convite cancelado, já respondido ou de reunião encerrada. Saída: `200`; `403`, `404`, `409`, `410`. Destino: lista de convites ou página do e-mail. [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF33) |
| RF34 | Registrar entrada na reunião | Di2 | `entrega3_Di2/requisitos/` | Implementado | Entrada: `id` da reunião e token. Ação: `POST /api/reunioes/:id/entrar`; usuário e horário vêm do token e do servidor, e a repetição devolve o primeiro registro. Saída: `201` ou `200`; `403`, `404`, `409`. Destino: tela da reunião. [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF34) |
| RF35 | Registrar saída da reunião | Di2 | `entrega3_Di2/requisitos/` | Implementado | Entrada: `id` da reunião e token. Ação: `POST /api/reunioes/:id/sair`; exige entrada registrada, e a repetição mantém a primeira saída. Saída: `200`; `403`, `404`, `409`. Destino: tela da reunião. [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF35) |
| RF36 | Visualizar demonstração da lista de presença | Di2 | `entrega3_Di2/requisitos/` | Parcial | Mockup com dados fictícios: a tela `/lista-presenca` mostra cabeçalho, membros, totais e rodapé, com aviso de demonstração. Não grava nada real. [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF36) |
| RF37 | Gerar versão local da lista de presença | Di2 | `entrega3_Di2/requisitos/` | Parcial | Mockup: salva revisões como novas versões locais em memória (observações até 2.000 caracteres), sem persistência. O núcleo puro de consolidação existe e está testado, mas não é chamado por rota. [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF37) |
| RF38 | Consultar e compartilhar versão da lista | Di2 | `entrega3_Di2/requisitos/` | Parcial | Mockup: seleciona uma versão salva e compartilha o texto ou exporta CSV (com proteção contra fórmulas); sem PDF, e-mail automático ou link público. [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF38) |
| RF39 | Marcar presença e revisar adesão | Di2 | `entrega3_Di2/requisitos/` | Parcial | Mockup: escolhe um dos cinco status e uma observação por pessoa e mostra o resumo de adesão; o salvamento reaproveita o RF37. Simula o Administrador da comissão, sem autorização no servidor. [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF39) |
| RF40 | Gerar lista de presença real | Di2 | `entrega3_Di2/requisitos/` | Planejado | Proposta (sem endpoint, model nem migração): o Administrador da comissão gera uma lista persistida e versionada a partir de uma reunião real, com autenticação e permissão no servidor. [Ver mais detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF40) |

A coluna "Estado" é provisória: cada RF recebe o estado verificado (Implementado, Parcial, Planejado) quando o seu arquivo é escrito. RF41 em diante ficam reservados ao incremento 3.

## Requisitos não funcionais

**Regra:** a numeração global dos RNF é mantida. Os RNF13 a RNF41 que já estavam nos documentos do Di1 conservam o número; os RNF-LP01 a RNF-LP12 da lista de presença ganham os números RNF42 a RNF53 (proposta); novos RNF usam o próximo número livre. Cada RF lista os RNF que o atingem.

### Catálogo da Wiki (RNF01 a RNF12)

| RNF | Título | Fonte |
|---|---|---|
| RNF01 | Tecnologias e frameworks | Índice da Wiki |
| RNF02 | Proteção de dados sensíveis | Índice da Wiki |
| RNF03 | Tecnologia backend | Índice da Wiki |
| RNF04 | Velocidade de carregamento | Índice da Wiki |
| RNF05 | Documentação da API | Índice da Wiki |
| RNF06 | Criptografia de senha | Índice da Wiki |
| RNF07 | Interface gráfica | Índice da Wiki |
| RNF08 | `[A CONFIRMAR NA WIKI]` | Não consta no índice enviado nem no repositório |
| RNF09 | Confirmação da solicitação de organização | Âncora da URL da Wiki informada pelo usuário |
| RNF10 a RNF12 | `[A CONFIRMAR NA WIKI]` | Não constam no índice enviado nem no repositório |

### RNF dos documentos do Di1 (RNF13 a RNF41)

| RNF | Título | RFs atingidos |
|---|---|---|
| [RNF13](entrega2_Di1/requisitos/RNF13_periodicidade_das_checagens_automaticas.md) | Periodicidade das checagens automáticas | RF19 |
| [RNF14](entrega2_Di1/requisitos/RNF14_isolamento_de_falhas_entre_checagens.md) | Isolamento de falhas entre checagens | RF19 |
| [RNF15](entrega2_Di1/requisitos/RNF15_timeout_de_checagens_externas.md) | Timeout de checagens externas | RF19, RF21 |
| [RNF16](entrega2_Di1/requisitos/RNF16_autenticacao_diferenciada_por_tipo_de_acesso.md) | Autenticação diferenciada por tipo de acesso | RF16 a RF21 |
| [RNF17](entrega2_Di1/requisitos/RNF17_comparacao_seguro_de_credenciais.md) | Comparação segura de credenciais | RF20, RF21 |
| [RNF18](entrega2_Di1/requisitos/RNF18_isolamento_de_infraestrutura.md) | Isolamento de infraestrutura | RF16 a RF21 |
| [RNF19](entrega2_Di1/requisitos/RNF19_retencao_historica.md) | Retenção histórica | RF18, RF19, RF20 |
| [RNF20](entrega2_Di1/requisitos/RNF20_tecnologia.md) | Tecnologia (API de Monitoramento) | RF16 a RF21 |
| [RNF21](entrega2_Di1/requisitos/RNF21_whitelist_fixa_de_subsistemas_controlaveis.md) | Whitelist fixa de subsistemas controláveis | RF23 |
| [RNF22](entrega2_Di1/requisitos/RNF22_autorizacao_por_papel.md) | Autorização por papel | RF22, RF23, RF24 |
| [RNF23](entrega2_Di1/requisitos/RNF23_resposta_antes_de_efeito_colateral_irreversivel.md) | Resposta antes de efeito colateral irreversível | RF24 |
| [RNF24](entrega2_Di1/requisitos/RNF24_ausencia_de_banco_de_dados_proprio.md) | Ausência de banco de dados próprio (API de Gestão) | RF22 a RF27 |
| [RNF25](entrega2_Di1/requisitos/RNF25_portabilidade_do_acesso_ao_docker.md) | Portabilidade do acesso ao Docker | RF23, RF26 |
| [RNF26](entrega2_Di1/requisitos/RNF26_tecnologia.md) | Tecnologia (API de Gestão e painel) | RF22 a RF27 |
| [RNF27](entrega2_Di1/requisitos/RNF27_setup_idempotente.md) | Setup idempotente | RF26 |
| [RNF28](entrega2_Di1/requisitos/RNF28_segredos_compartilhados_consistentes.md) | Segredos compartilhados consistentes | RF26 |
| [RNF29](entrega2_Di1/requisitos/RNF29_reset_destrutivo_apenas_manual.md) | Reset destrutivo apenas manual | RF27 |
| [RNF30](entrega2_Di1/requisitos/RNF30_persistencia_e_backup_via_volumes.md) | Persistência e backup via volumes | RF26, RF27 |
| [RNF31](entrega2_Di1/requisitos/RNF31_escopo_do_relatorio_conforme_o_papel.md) | Escopo do relatório conforme o papel | RF28, RF29, RF30 |
| [RNF32](entrega2_Di1/requisitos/RNF32_protecao_de_dados_pessoais_no_relatorio_de_usuarios.md) | Proteção de dados pessoais no relatório de usuários | RF30 |
| [RNF33](entrega2_Di1/requisitos/RNF33_relatorios_calculados_sob_demanda.md) | Relatórios calculados sob demanda | RF28, RF29, RF30 |
| [RNF34](entrega2_Di1/requisitos/RNF34_isolamento_de_falhas_entre_relatorios.md) | Isolamento de falhas entre relatórios | RF28, RF29, RF30 |
| [RNF35](entrega2_Di1/requisitos/RNF35_serie_temporal_completa.md) | Série temporal completa | RF28, RF29, RF30 |
| RNF36 | `[A CONFIRMAR NA WIKI]` | Não consta no repositório |
| RNF37 | `[A CONFIRMAR NA WIKI]` | Não consta no repositório |
| [RNF38](entrega2_Di1/requisitos/RNF38_dias_no_fuso_do_negocio.md) | Dias no fuso do negócio | RF17, RF18 |
| [RNF39](entrega2_Di1/requisitos/RNF39_perfil_lido_do_banco_a_cada_requisicao.md) | Perfil lido do banco a cada requisição | RF30, RF31 |
| [RNF40](entrega2_Di1/requisitos/RNF40_plataforma_sempre_com_administrador.md) | Plataforma sempre com administrador | RF31 |
| [RNF41](entrega2_Di1/requisitos/RNF41_confirmacao_de_acoes_de_perfil.md) | Confirmação de ações de perfil | RF31 |

Os "RFs atingidos" desta tabela são a **primeira atribuição**, deduzida dos documentos atuais, e são conferidos no código nos lotes L4 e L5.

### RNF da lista de presença (proposta de nova numeração)

| RNF novo | Era | Título resumido | RFs atingidos |
|---|---|---|---|
| [RNF42](entrega3_Di2/requisitos/RNF42_consistencia_da_contagem_do_snapshot.md) | RNF-LP01 | Consistência da contagem do snapshot | RF37 |
| [RNF43](entrega3_Di2/requisitos/RNF43_sobreposicoes_contadas_uma_vez_e_permanencia_limitada.md) | RNF-LP02 | Sobreposições contadas uma vez e permanência limitada | RF37 |
| [RNF44](entrega3_Di2/requisitos/RNF44_rotulos_e_mensagens_em_portugues_do_brasil.md) | RNF-LP03 | Rótulos e mensagens em português do Brasil | RF36 a RF39 |
| [RNF45](entrega3_Di2/requisitos/RNF45_aviso_de_dados_ficticios_e_nenhuma_gravacao_real_na_previa.md) | RNF-LP04 | Aviso de dados fictícios e nenhuma gravação real na prévia | RF36 |
| [RNF46](entrega3_Di2/requisitos/RNF46_nova_versao_nao_altera_versoes_anteriores.md) | RNF-LP05 | Nova versão não altera versões anteriores | RF37, RF38 |
| [RNF47](entrega3_Di2/requisitos/RNF47_nenhum_id_interno_digitado_ou_exibido.md) | RNF-LP06 | Nenhum ID interno digitado ou exibido | RF36 a RF39 |
| [RNF48](entrega3_Di2/requisitos/RNF48_geracao_real_em_ate_3_s_para_ate_50_convidados_pendente.md) | RNF-LP07 | Geração real em até 3 s para até 50 convidados (pendente) | RF40 |
| [RNF49](entrega3_Di2/requisitos/RNF49_futura_api_com_401_e_403_sem_expor_dados_pessoais.md) | RNF-LP08 | Futura API com 401 e 403 sem expor dados pessoais | RF40 |
| [RNF50](entrega3_Di2/requisitos/RNF50_futuro_banco_sem_reuniaoid_versao_duplicado.md) | RNF-LP09 | Futuro banco sem `reuniaoId, versao` duplicado | RF40 |
| [RNF51](entrega3_Di2/requisitos/RNF51_typescript_estrito_e_sem_any_no_codigo_novo.md) | RNF-LP10 | TypeScript estrito e sem `any` no código novo | RF36 a RF39 |
| [RNF52](entrega3_Di2/requisitos/RNF52_revisao_nao_altera_snapshot_ou_versoes_anteriores.md) | RNF-LP11 | Revisão não altera snapshot ou versões anteriores | RF39 |
| [RNF53](entrega3_Di2/requisitos/RNF53_csv_com_acentos_e_protecao_contra_formula_executavel.md) | RNF-LP12 | CSV com acentos e proteção contra fórmula executável | RF38 |
