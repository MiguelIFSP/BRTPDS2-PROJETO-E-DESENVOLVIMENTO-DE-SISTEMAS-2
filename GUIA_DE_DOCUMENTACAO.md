# Guia de Documentação — Better Meet

Este guia define o padrão de toda a documentação de requisitos, diagramas, dados e testes do Better Meet. O padrão de código está no [GUIA_DE_CODIFICACAO.md](GUIA_DE_CODIFICACAO.md).

Todo documento novo ou alterado deve seguir estas regras. Documento antigo que ainda não segue o guia é ajustado quando for alterado ou quando o professor pedir uma correção.

Quem usa IA generativa para escrever documentação deve anexar ao agente o arquivo [PROMPT_DOCUMENTACAO_IA.md](PROMPT_DOCUMENTACAO_IA.md), que resume estas mesmas regras. Se os dois divergirem, este guia vale. Ao mudar este guia, atualize o prompt no mesmo PR.

> **Situação:** padrão interno da equipe, revisado em 2026-11-20 a partir dos retornos do professor nas entregas Di1, Di2 e Di3 e dos slides das aulas 1 a 4. Não equivale à aprovação do professor.

> **Seções do guia:** 1. Regra principal (inclui a redação formal) · 2. Onde ficam os arquivos (inclui o estilo dos diagramas) · 3. Identificadores · 4. Atores · 5. Estrutura de cada entrega · 6. Requisitos funcionais · 7. Casos de uso · 8. Diagramas de sequência · 9. Diagrama de classes (inclui o dicionário de classes) · 10. Diagrama relacional e dicionário de dados · 11. Requisitos não funcionais · 12. Testes · 13. Rastreabilidade · 14. Entrega final · 15. Críticas do professor · 16. Checklist de revisão.

---

## 1. Regra principal: documentar o sistema real

### 1.1 Conferir a versão antes de escrever (DOC-01)

Confira a branch e o commit do incremento antes de escrever. Não presuma que a branch padrão tem o código mais recente. Registre os caminhos dos arquivos consultados.

### 1.2 Comparar as fontes e indicar divergências (DOC-02)

Compare documentos, Wiki, código-fonte, `schema.prisma`, migrations, rotas, services, telas, OpenAPI e testes. Quando houver divergência, registre-a, sem inventar implementação.

Use estas fontes, em ordem de prioridade:

| Prioridade | Fonte | Uso |
|---|---|---|
| 1 | Implementação: rotas, controllers, services, telas, `schema.prisma`, migrations, configuração e testes | Prova do que existe |
| 2 | `docs/openapi.yaml` (hoje só em `sistema/api`) | Contrato dos endpoints, a ser conferido com o código |
| 3 | `documentos/entregaN_<sigla>/` e Wiki | Propósito e regras de negócio, sujeitos a verificação |
| 4 | `aidlc-docs/` de cada app (engenharia reversa, requisitos, notas de migração) | Ponto de partida e histórico do trabalho feito com IA (DOC-25); são resumos escritos por IA, sujeitos a verificação, e nunca provam que algo existe |
| 5 | Observações do professor (seção 15) e slides das aulas | Critério de qualidade e correção de notação |
| 6 | Propostas anteriores | Inspiração de formato, nunca prova de implementação |

A nomenclatura segue o [GUIA_DE_CODIFICACAO.md](GUIA_DE_CODIFICACAO.md). Os padrões da 1ª entrega valem apenas onde esse guia não os substituiu. Por exemplo, o snake_case da seção 1.6 do `padroes_interface_e_nomenclatura.md` não vale mais (seção 4.8 do guia de codificação).

### 1.3 Classificar o que é descrito (DOC-03)

Classifique cada item com um destes status:

| Status | Significado |
|---|---|
| Implementado | Verificado no código |
| Parcial | Parte verificada no código, com a lacuna descrita |
| Planejado | Ainda não implementado |
| Não verificado | Documentado, mas não localizado ou não conferido no código |

### 1.4 Não inventar (DOC-04)

- Não crie classes, métodos, colunas, endpoints, telas, papéis, respostas HTTP, regras de segurança ou testes fictícios como se fossem reais.
- Sem acesso ao código, não afirme que algo foi implementado: peça os arquivos ou marque `[A CONFIRMAR NO CÓDIGO]`.

### 1.5 Idioma e identificadores (DOC-05)

Escreva em português do Brasil. Mantenha classes, métodos, rotas, campos e enums exatamente como aparecem no código.

### 1.6 Redação formal e autossuficiente (DOC-26)

O professor criticou textos informais ("Se passar, chama `votacaoService.create`"), campos que remetem a outro campo ("O mesmo") e tabelas sem explicação. Todo documento usa linguagem impessoal e formal, como no formulário do professor: "o sistema deve exibir ...", "caso os dados sejam validados com sucesso, é feita uma chamada para a função `votacaoService.create`".

A tabela mostra os termos informais mais comuns e a forma a usar no lugar deles.

| Evitar | Usar |
|---|---|
| "passar" (na validação) | "ser validado com sucesso" |
| "chamar", "chama" | "invocar", "é feita uma chamada para a função ..." |
| "bater na rota" | "enviar uma requisição para a rota ..." |
| "pegar" | "obter" |
| "jogar erro", "dar erro" | "lançar um erro", "falhar" |
| "cair no catch" | "ser tratado no bloco `catch`" |
| "front", "back" | "aplicativo", "API" |
| "clicar" (no aplicativo) | "tocar" |

- Não use "O mesmo", "Idem", "Igual ao anterior", "Ver acima" nem expressões equivalentes em campos e células. Escreva o valor por extenso, mesmo que ele se repita.
- Toda tabela e todo diagrama vêm depois de um parágrafo que diz o que eles mostram e como lê-los.
- Escreva siglas por extenso na primeira vez em que aparecem no documento.

### 1.7 Toda crítica traz evidência (DOC-32)

Na AP, o professor apontou que alguns pontos fracos da análise de mercado "comentam sobre a interface mas não exibem o problema". Todo ponto fraco, crítica ou problema descrito em um documento (análise de mercado, revisão de interface, relatório de defeitos) traz:

- **evidência visual ou textual:** captura de tela, trecho do código com arquivo e linha, ou saída de um comando, sem dados pessoais;
- **passos para reproduzir** o problema, com o aparelho e a versão usados;
- **origem:** de onde vem a afirmação (software analisado e versão, data da análise, link ou arquivo).

A tabela mostra o formato mínimo. Um ponto fraco sem evidência fica marcado `[A CONFIRMAR]` e não entra como fato.

| Ponto fraco | Onde acontece | Evidência | Como reproduzir | Origem |
|---|---|---|---|---|
| `[afirmação]` | `[tela ou arquivo]` | `[captura ou trecho]` | `[passos]` | `[software, versão, data]` |

---

## 2. Onde ficam os arquivos

### 2.1 Local de cada tipo de arquivo (DOC-06)

A tabela indica onde fica cada tipo de arquivo.

| O quê | Onde |
|---|---|
| Guias de documentação e de código | Raiz do repositório |
| Documentação da entrega (fonte oficial) | `documentos/entregaN_<sigla>/` (ex.: `entrega4_Di3/`); a apresentação final usa `documentos/entrega5_AF/` |
| Diagramas da entrega | `documentos/entregaN_<sigla>/Diagramas/` |
| Documentos consolidados, atualizados a cada incremento: diagrama de classes oficial, diagrama relacional oficial, dicionário de classes, dicionário de dados, catálogo de atores e catálogo de softwares, versões e licenças | `documentos/consolidado/`, com os diagramas em `documentos/consolidado/Diagramas/` |
| Estilo comum dos diagramas | `documentos/estilo-diagramas.iuml` (DOC-28) |
| Publicação | Wiki do GitHub, gerada a partir da fonte |
| Artefatos de trabalho do AI-DLC (não são a documentação oficial) | `sistema/better-meet/aidlc-docs/` e `sistema/management-better-meet/web/aidlc-docs/` (ver DOC-25) |

Altere primeiro o arquivo em `documentos/`. A Wiki nunca recebe conteúdo que não exista na fonte. O `aidlc-docs/` não é fonte da Wiki nem substitui a documentação da entrega.

Os documentos de uma entrega citam os documentos consolidados por link, em vez de copiá-los, e mostram o recorte do incremento (DOC-19 e DOC-20). Quando um incremento altera uma classe, uma tabela, um ator ou uma dependência, o documento consolidado é atualizado no mesmo PR.

### 2.2 Nomes de arquivos (DOC-07)

A tabela mostra o padrão de nome de cada tipo de arquivo.

| Tipo | Padrão | Exemplo |
|---|---|---|
| Documento | snake_case, sem acentos | `dicionario_de_dados.md`, `lista_presenca.md` |
| Registro de testes | `testes_<assunto>.md` | `testes_presenca_reuniao.md` |
| Diagrama | Prefixo do tipo e assunto com hífens, em `.puml` e `.svg` (seção 7.1) | `DCU-Relatorios.puml`, `DS-Tema-Preferido.puml` |
| Diagrama consolidado | Prefixo do tipo e `BetterMeet` | `DC-BetterMeet.puml`, `DER-BetterMeet.puml` |

Não use espaços em nomes novos. Ao alterar um arquivo com espaços, avalie o impacto nos links antes de renomeá-lo.

### 2.3 Publicar na Wiki (DOC-08)

1. Trabalhe em uma branch `feature/<nome>`, com commit do tipo `docs` e PR para a `development` (GT-01 e GT-02 do guia de codificação).
2. Depois da aprovação, copie o conteúdo para a página da Wiki.
3. Copie cada SVG para a pasta `images/` da Wiki.
4. Troque os links relativos das imagens pelo endereço da Wiki:

   ```markdown
   ![Diagrama de casos de uso — Relatórios](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/images/DCU-Relatorios.svg)
   ```

5. Confira a renderização dos diagramas na página publicada.

Em `documentos/`, use link relativo: `![Diagrama de casos de uso — Relatórios](Diagramas/DCU-Relatorios.svg)`.

### 2.4 Estilo único dos diagramas (DOC-28)

A Di3 criticou diagramas de classes que não seguiam o mesmo padrão. Todos os diagramas do projeto usam o mesmo arquivo de estilo, `documentos/estilo-diagramas.iuml`, incluído logo depois do `@startuml`, com caminho relativo. O modelo abaixo vale para um diagrama em `documentos/entregaN_<sigla>/Diagramas/` ou em `documentos/consolidado/Diagramas/`.

```text
@startuml DS-Tema-Preferido
!include ../../estilo-diagramas.iuml
title Diagrama de sequência — Alterar tema preferido
' conteúdo do diagrama
@enduml
```

O arquivo de estilo reúne as configurações comuns. O conteúdo mínimo dele é o do modelo abaixo; uma mudança de estilo é feita só nele.

```text
' documentos/estilo-diagramas.iuml — estilo comum de todos os diagramas (DOC-28)
!pragma layout smetana
skinparam shadowing false
skinparam monochrome true
skinparam defaultFontName Arial
skinparam packageStyle rectangle
```

- Todo diagrama tem `title` com o tipo e o assunto: "Diagrama de sequência — Alterar tema preferido".
- Nenhum diagrama define `skinparam` de cor, fonte ou sombra: essas configurações ficam só no arquivo de estilo. Diretivas próprias de um tipo de diagrama, como `hide circle` no diagrama relacional, ficam no arquivo do diagrama.
- Participantes, classes e atores seguem o mesmo formato de nome em todos os diagramas (DOC-10, DOC-18 e DOC-19).
- Depois de gerar o SVG (seção 7.1), confira se o estilo foi aplicado.

### 2.5 Documentar com IA: AI-DLC v1 (DOC-25)

Documentação feita com ajuda de um agente de IA segue o mesmo fluxo **AI-DLC v1** do código (seção 9.5 do [GUIA_DE_CODIFICACAO.md](GUIA_DE_CODIFICACAO.md) e regras 83 a 90 do [PROMPT_AGENTES_IA.md](PROMPT_AGENTES_IA.md)). O pedido começa com **"Using AI-DLC, ..."**, e o agente lê as regras em `sistema/better-meet/.aidlc-rule-details/`. Este guia define o **conteúdo** da documentação; o AI-DLC define o **processo**. Se houver conflito sobre o conteúdo, vale este guia.

Como o AI-DLC se aplica a uma tarefa de documentação:

| Etapa do AI-DLC | Na documentação |
|---|---|
| Workspace Detection e Reverse Engineering | Conferir branch e commit (DOC-01) e inspecionar o código (DOC-02). Reaproveite os arquivos de `aidlc-docs/inception/reverse-engineering/` do app **como ponto de partida**, conferindo cada afirmação no código |
| Requirements Analysis | Definir o assunto (RF, RNF, UC), a pasta da entrega e as lacunas. Perguntas ao responsável ficam em arquivo, nunca no chat |
| User Stories, Application Design, Units Generation e as etapas de Design | Normalmente dispensadas; o Workflow Planning registra por quê |
| Code Generation | Escrever os documentos. O plano lista os arquivos a criar ou alterar em `documentos/entregaN_<sigla>/` (caixas `[ ]`), e a execução marca cada passo |
| Build and Test | Verificar o documento: checklist da seção 16, links, renderização dos SVG gerados do PlantUML com o estilo comum (DOC-28), consistência entre sequências e diagrama de classes (DOC-18), e `Não executado` onde não houve teste |

Regras:

- **Onde fica o quê.** A documentação oficial é gravada em `documentos/entregaN_<sigla>/` (DOC-06). Em `aidlc-docs/` ficam só o plano, o resumo da execução, o `aidlc-state.md` e o `audit.md`. Nunca grave o documento da entrega só em `aidlc-docs/`.
- **O `aidlc-docs/` não é evidência.** Resumos de engenharia reversa e notas de migração podem estar desatualizados. Todo fato citado na documentação é conferido no código da branch e do commit informados no cabeçalho (DOC-12).
- **O responsável não é a IA.** O campo "Responsável(eis)" é de quem revisa e assina (seção 5.1). O `audit.md` registra o que o agente fez, mas não substitui essa assinatura.
- **Aprovação humana em cada etapa**, inclusive a do plano de documentação, antes de o agente escrever.
- **Reinício automático.** Se o `aidlc-state.md` for de outra alteração (por exemplo, a migração do Expo) ou o fluxo anterior estiver concluído, o agente reinicia o AI-DLC com uma nova unidade (ex.: `documentacao-<assunto>`), sem aproveitar planos nem aprovações antigos e sem apagar os documentos anteriores.
- **Idioma:** tudo em pt-BR, como em todo o guia (DOC-05).
- **Versões:** ao citar versões de ferramentas, use o catálogo de softwares (DOC-29), que copia as versões dos manifestos e lockfiles. As versões de commits anteriores continuam valendo para os documentos que se referem a eles.

---

## 3. Identificadores

### 3.1 Numeração única (DOC-09)

A tabela mostra o formato e a abrangência de cada identificador.

| Item | Formato | Abrangência |
|---|---|---|
| Requisito funcional | `RF01` | Projeto inteiro |
| Requisito não funcional | `RNF01` | Projeto inteiro |
| Caso de uso | `UC01` | Projeto inteiro |
| Regra de negócio | `RN-<SIGLA>01` (ex.: `RN-LP01`) | Assunto |
| Caso de teste | `CT-RF14-01`, `CT-RNF02-01` | Requisito testado |

- Um número nunca é reutilizado nem renumerado, mesmo que o item seja removido.
- O próximo número é o maior em uso mais um, somando os documentos e a Wiki.
- Hoje o índice de RF e RNF está na página [Requisitos](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/Requisitos) da Wiki. Atualize-o ao criar um item novo.
- Ainda não há índice de UC. Procure o maior número nos documentos e nas páginas da Wiki antes de criar um novo.
- Cada caso de uso é descrito por um RF próprio (DOC-14). O título do RF cita o número do caso de uso, para ligar os dois: `RF20 — Criar votação (UC22)`.

---

## 4. Atores

### 4.1 Atores do catálogo, completos e com hierarquia única (DOC-10)

A Di3 criticou diagramas com "muitos acessos comuns a vários usuários" e com papéis faltando (o Facilitador da comissão). A Di1 criticou a herança usada em um diagrama e não em outro. As regras abaixo resolvem as duas críticas.

- Escreva **Atores**, nunca "Autores".
- Use os nomes do catálogo abaixo em todos os diagramas, RFs e tabelas.
- O diagrama mostra **todos** os papéis que têm permissão no assunto. Um papel com permissão no código não pode faltar.
- Não crie ator sem papel no código (`Role`, `PapelOrganizacao`, `PapelComissao`) nem sistema externo inexistente. "Usuário Autenticado" e nomes genéricos parecidos continuam proibidos.
- Ligue um ator ao caso de uso só quando ele inicia o caso de uso ou participa dele.
- **Generalização entre atores** é permitida para simplificar o diagrama, nestas condições:
  1. o código comprova que o ator especializado executa **todos** os casos de uso do ator geral; confira as permissões nos services e middlewares, não só o nome do papel;
  2. a hierarquia é definida **uma única vez**, no catálogo de atores (`documentos/consolidado/atores.md`), com a evidência de cada generalização e um diagrama `DCU-Atores.puml` que mostra a hierarquia inteira;
  3. todos os diagramas usam a mesma hierarquia: se dois atores estão ligados por generalização, nenhum diagrama liga os dois separadamente ao mesmo caso de uso.
- Quando o caso de uso vale para todos os especializados de um ator geral, associe só o ator geral. O diagrama mostra a seta de generalização quando um ator especializado também aparece nele.

A tabela é o catálogo de atores. Os atores gerais só existem como generalização dos papéis reais listados abaixo deles.

| Ator | Origem no código | Quando usar |
|---|---|---|
| Usuário da plataforma (ator geral) | Qualquer conta (`User`, qualquer `Role`) | Caso de uso que qualquer conta executa; generaliza Administrador e Usuário comum |
| Administrador | `Role.ADMIN` | Pessoa com perfil de administrador da plataforma |
| Usuário comum | `Role.USER` | Pessoa sem perfil de administrador da plataforma |
| Integrante da organização (ator geral) | Qualquer `OrganizacaoMembro` | Caso de uso que qualquer integrante da organização executa; generaliza Criador, Gerente, Moderador e Membro da organização |
| Criador, Gerente, Moderador ou Membro da organização | `PapelOrganizacao` | A permissão depende do papel na organização |
| Integrante da comissão (ator geral) | Qualquer `ComissaoEquipe` | Caso de uso que qualquer integrante da comissão executa; generaliza Administrador, Facilitador, Secretário e Membro da comissão |
| Administrador, Facilitador, Secretário ou Membro da comissão | `PapelComissao` | A permissão depende do papel na comissão |
| Administrador do Servidor | Não é papel do sistema | Quem opera diretamente o servidor (setup e reset) |
| Sistemas externos e serviços agendados (ex.: PM2, Docker Engine, API de Monitoramento, Cron de Monitoramento) | Infraestrutura | Apenas se participarem de fato da interação |

**"Administrador" sozinho significa sempre `Role.ADMIN`.** O papel da comissão se escreve "Administrador da comissão". O "presidente" citado em textos antigos corresponde a `PapelComissao.ADMINISTRADOR`; não existe papel `PRESIDENTE`.

Antes de usar um ator, confira o catálogo com os enums de `sistema/api/prisma/schema.prisma`. As generalizações acima são possibilidades: cada uma só vale depois de comprovada e registrada no catálogo de atores. Até lá, ela fica `[A CONFIRMAR NO CÓDIGO]`.

### 4.2 Tabela de atores (DOC-11)

Toda página com diagrama de casos de uso traz a tabela abaixo, com uma linha por ator do diagrama. A coluna "Generalização" mostra de quem o ator herda ou quem herda dele.

| Ator | Tipo | Generalização | Responsabilidade | Evidência |
|---|---|---|---|---|
| `[nome do catálogo]` | Humano / Sistema externo | `[ator geral ou atores especializados; "Nenhuma"]` | `[descrição]` | `[RF, enum ou arquivo]` |

#### Exemplo preenchido: atores do RF06

> Todos os exemplos deste guia usam o RF06 (seção 6.1), salvo indicação. Foram conferidos em 2026-11-20 na branch `feature/refatoracao-ultima-entrega`, commit `704478f`, e não são atualizados junto com o código.

A tabela mostra o único ator do caso de uso Alterar tema preferido.

| Ator | Tipo | Generalização | Responsabilidade | Evidência |
|---|---|---|---|---|
| Usuário da plataforma | Humano | Ator geral de Administrador e Usuário comum | Altera o tema da própria conta | `PATCH /usuarios/:id/tema` declara `requireAuth` e `requireSelf`, sem restrição de `role` (`sistema/api/src/routes/usuarioRoutes.ts`); `Role` em `schema.prisma` |

O exemplo usa o ator geral porque o código não diferencia Administrador e Usuário comum nesse caso de uso. O diagrama tem uma associação em vez de duas, e a hierarquia completa fica no catálogo de atores.

---

## 5. Estrutura de cada entrega

### 5.1 Cabeçalho obrigatório (DOC-12)

Todo documento começa com o cabeçalho abaixo. Versão e histórico atendem à anotação da Di1 "Colocar versões nas docs"; as versões das tecnologias ficam no catálogo de softwares (DOC-29), citado em "Fontes".

```text
Incremento: [nome ou número]
Escopo: [RFs e UCs envolvidos]
Versão: [versão do documento, ex.: 1.0]
Branch: [branch do código consultado]
Commit: [hash do código consultado]
Data de revisão: [AAAA-MM-DD]
Responsável(eis): [nomes]
Estado: [Implementado / Parcial / Planejado / Não verificado]
Fontes: [caminhos e links precisos]
```

Todo documento termina com o histórico de revisões, uma linha por versão publicada:

```markdown
## Histórico de revisões

| Versão | Data | Autor(es) | Alteração |
|---|---|---|---|
| 1.0 | AAAA-MM-DD | [nomes] | Criação do documento |
```

- A versão muda a cada alteração publicada: o número depois do ponto aumenta em correções e ajustes; o número antes do ponto aumenta quando o documento é refeito para outra entrega.
- A versão do cabeçalho é sempre a da última linha do histórico.

#### Exemplo preenchido: cabeçalho do RF06

O exemplo mostra o cabeçalho de um documento do RF06.

```text
Incremento: Entrega Di1 — Configurações de usuário
Escopo: RF06 — Alterar tema preferido (UC a confirmar)
Versão: 1.0
Branch: feature/refatoracao-ultima-entrega
Commit: 704478f
Data de revisão: 2026-11-20
Responsável(eis): [nome de quem assina o documento]
Estado: Parcial
Fontes: sistema/better-meet/src/hooks/useThemePreference.ts; sistema/better-meet/src/store/themeStore.ts; sistema/api/src/routes/usuarioRoutes.ts; sistema/api/src/services/usuarioService.ts; sistema/api/prisma/schema.prisma; documentos/consolidado/softwares_e_licencas.md; Wiki RF06
```

O responsável fica em branco de propósito: é quem revisou e assina o documento, e não deve ser deduzido do histórico do git.

### 5.2 Conteúdo mínimo do incremento (DOC-13)

O conteúdo pode ser dividido em vários arquivos da pasta da entrega. Um arquivo pode apontar para um documento consolidado (DOC-06) ou para uma seção compartilhada, em vez de duplicá-los, desde que o impacto do incremento fique explícito. A lista abaixo segue a documentação pedida nos slides das aulas 1 a 4.

1. Resumo e escopo
2. Requisitos funcionais: um RF por caso de uso, no formulário padrão (DOC-14)
3. Requisitos não funcionais (DOC-22)
4. Atores e diagrama de casos de uso (DOC-10, DOC-11 e DOC-15)
5. Diagramas de sequência: pelo menos um por RF (DOC-18)
6. Diagrama de classes (recorte do consolidado) e dicionário de classes (DOC-19 e DOC-27)
7. Diagrama relacional (recorte do consolidado) e dicionário de dados do banco principal e dos bancos associados (DOC-20 e DOC-21)
8. Rastreabilidade (DOC-24)
9. Plano de testes e registro de execução (DOC-23)
10. Pendências, divergências e limitações conhecidas
11. Histórico de revisões (DOC-12)

#### Exemplo preenchido: conteúdo do RF06

A tabela indica onde está cada parte do exemplo neste guia.

| Conteúdo | Onde está o exemplo neste guia |
|---|---|
| Cabeçalho e histórico | Seção 5.1 |
| Requisito funcional no formulário padrão | Seção 6.1 |
| Requisito não funcional | Seção 11.1 (RNF06, porque o RF06 não tem RNF próprio no catálogo) |
| Atores | Seção 4.2 |
| Diagrama de casos de uso e auditoria das elipses | Seções 7.1 e 7.3 |
| Sequência | Seção 8.1 |
| Classes e dicionário de classes | Seções 9.1 e 9.2 |
| Relacional e dicionário de dados | Seções 10.1 e 10.2 |
| Plano e registro de testes | Seção 12.1 |
| Rastreabilidade | Seção 13.1 |
| Pendências e divergências | "Pendências e divergências do RF06", na seção 6.1 |

---

## 6. Requisitos funcionais

### 6.1 Um caso de uso, um RF no formulário padrão (DOC-14)

As aulas 2, 3 e 4 pedem a "Descrição de cada caso de uso como um requisito funcional (utilizar apenas o formulário padrão)". O formulário padrão é o do exemplo "RF01 – Listar Cliente" (aula 1, revisão, slide 9). A Di3 criticou que "os requisitos estão se confundindo com os casos de uso", porque a equipe escrevia um RF ampliado e, separada dele, uma ficha para cada caso de uso.

- Cada elipse do diagrama de casos de uso tem exatamente um RF, com o mesmo nome. O caso de uso não tem descrição própria fora do RF (DOC-17).
- Um RF descreve uma única ação do ator. Uma funcionalidade com várias ações (consultar, criar, abrir, votar, encerrar, excluir) tem um RF para cada ação.
- O RF usa somente os campos do formulário, nesta ordem: Função, Descrição, Entradas, Origem, Saída, Destino, Ação, Pré-condição, Pós-condição e Efeitos colaterais. Não acrescente campos nem seções dentro do RF.
- O nível de detalhe é o do "requisito de sistema" da aula 1 (revisão, slide 8): tipos, tamanhos, máscaras, componentes da tela, rotas, tabelas, colunas e mensagens reais.
- Status, atores, regras de negócio, referências do código e testes não são campos do formulário. Eles ficam no cabeçalho (DOC-12), na tabela de atores (DOC-11), na matriz de rastreabilidade (DOC-24) e no plano de testes (DOC-23).
- Descreva só as camadas que existem de fato no código.
- O texto segue a redação formal (DOC-26).

A tabela mostra o que cada campo do formulário deve conter.

| Campo | Conteúdo obrigatório |
|---|---|
| Função | Uma frase com o que o requisito permite fazer ("Permite ...") |
| Descrição | O que o sistema faz e qual resultado entrega, em até três frases |
| Entradas | Cada dado de entrada: nome como no código, tipo, tamanho ou domínio, máscara, obrigatoriedade, validação e componente da tela. Inclui token, parâmetros de rota e de consulta e corpo JSON, quando houver |
| Origem | Tela e componente de onde vêm as entradas; se o comportamento for automático, o evento e a periodicidade |
| Saída | Dados exibidos ou devolvidos e mensagens de sucesso e de erro, com o status HTTP e o texto real |
| Destino | Tela que recebe a saída e tabelas e colunas gravadas, com a operação (`INSERT`, `UPDATE`, `DELETE`); sem gravação, o local onde o dado fica |
| Ação | Passos numerados do ator e do sistema, com as rotas, funções e tabelas reais. Cada desvio fica no passo em que acontece: "Caso ..., o sistema deve ..." |
| Pré-condição | Condições verificáveis antes do início: autenticação, papel e estado do dado |
| Pós-condição | Estado verificável depois do sucesso e depois de cada falha |
| Efeitos colaterais | Notificações, monitoramento, armazenamento local e outras tabelas. "Nenhum" só depois de verificar |

Os campos com muitos itens (Entradas, Saída e Destino) podem usar uma tabela, sempre depois de uma frase que a apresente. Copie o modelo abaixo; no documento do requisito, o título usa `#` e cada campo usa `##`.

```markdown
# RFxx — [Verbo e objeto, igual ao nome da elipse] (UCyy)

## Função
Permite [ação do ator].

## Descrição
[O que o sistema faz e qual resultado entrega.]

## Entradas
[Frase que apresenta a tabela.]

| Campo | Tipo | Tamanho ou domínio | Obrigatório | Validação | Componente ou origem |
|---|---|---|---|---|---|

## Origem
[Tela e componente, ou evento automático e periodicidade.]

## Saída
[Frase que apresenta a tabela.]

| Situação | Status HTTP | Dados ou mensagem | Exibição |
|---|---|---|---|

## Destino
[Frase que apresenta a tabela.]

| Banco ou local | Tabela, chave ou tela | Operação | Colunas ou dados |
|---|---|---|---|

## Ação
1. O ator [ação na tela].
2. O aplicativo envia `[MÉTODO /rota]` com `[campos]`.
3. Caso [condição], o sistema deve [resposta e efeito].

## Pré-condição
- [condição verificável]

## Pós-condição
- **Sucesso:** [estado]
- **Falha:** [estado]

## Efeitos colaterais
- [efeito ou "Nenhum"]
```

#### Exemplo preenchido: RF06 — Alterar tema preferido

> Exemplo real, conferido em 2026-11-20 na branch `feature/refatoracao-ultima-entrega`, commit `704478f`. Ele mostra o nível de detalhe esperado e não é atualizado junto com o código. Para documentar o RF06, confira a implementação novamente. O número do caso de uso está em aberto (veja as pendências abaixo).

##### Função

Permite que a pessoa escolha o tema visual do aplicativo (claro, escuro ou o do sistema) e o mantenha entre sessões.

##### Descrição

O aplicativo aplica o tema escolhido na mesma hora, guarda a escolha no aparelho e, havendo sessão, grava a preferência na conta. No login seguinte, o valor gravado na conta é aplicado ao aparelho.

##### Entradas

A tabela lista os dados que o requisito recebe.

| Campo | Tipo | Tamanho ou domínio | Obrigatório | Validação | Componente ou origem |
|---|---|---|---|---|---|
| `theme` | `Tema` (texto) | `light`, `dark` ou `system` | Sim | `temaSchema`: valor do enum `Tema`; mensagens "Informe o tema desejado." e "Tema inválido. Use: light, dark ou system." | Chip Claro, Escuro ou Sistema da seção Tema da aba Mais; enviado no corpo JSON |
| `id` | Inteiro | Maior que zero | Sim | `parseId` e `requireSelf`: igual ao identificador do usuário do token | `user.id` do `authStore`; parâmetro de rota |
| `Authorization` | Texto | `Bearer <JWT>` | Sim | `requireAuth`: token válido de uma conta existente | `token` do `authStore`; cabeçalho da requisição |

##### Origem

Aba Mais (`MaisScreen`, em `src/app/(tabs)/mais/index.tsx`), seção Tema, componentes `Chip` Claro, Escuro e Sistema.

##### Saída

A tabela lista o retorno de cada situação. O aviso¹ é exibido pelo `FeedbackBanner` da seção Tema.

| Situação | Status HTTP | Dados ou mensagem | Exibição |
|---|---|---|---|
| Sucesso | `200` | `id: Int` e `themePreference: Tema` | Tema aplicado, sem mensagem |
| Identificador ou tema inválido | `400` | "Identificador do usuário inválido.", "Informe o tema desejado." ou "Tema inválido. Use: light, dark ou system." | Tema mantido no aparelho, com aviso¹ |
| Sem token, token inválido ou conta excluída | `401` | "Autenticação necessária.", "Token inválido ou expirado.", "Token inválido." ou "Sessão inválida. Entre novamente." | Tema mantido no aparelho, com aviso¹ |
| Conta de outra pessoa | `403` | "Você só pode alterar a sua própria conta." | Tema mantido no aparelho, com aviso¹ |
| Usuário não encontrado na gravação | `404` | "Usuário não encontrado." | Tema mantido no aparelho, com aviso¹ |
| Erro inesperado na API | `500` | "Erro interno. Tente novamente mais tarde." | Tema mantido no aparelho, com aviso¹ |
| API inacessível | Sem resposta | "Não foi possível conectar ao servidor. Verifique sua conexão." (`NETWORK_ERROR_MESSAGE` do aplicativo) | Tema mantido no aparelho, com aviso¹ |

¹ Texto do aviso: "O tema foi aplicado neste aparelho, mas não foi salvo na sua conta: <mensagem>".

##### Destino

A tabela lista onde o resultado é gravado ou exibido.

| Banco ou local | Tabela, chave ou tela | Operação | Colunas ou dados |
|---|---|---|---|
| `bettermeet` (MySQL) | `User` | `UPDATE` | `themePreference`: `ENUM('light','dark','system')`, aceita nulo, padrão `system` |
| `AsyncStorage` do aparelho | Chave `better-meet-theme` | Gravação local | `theme` |
| Telas do aplicativo | Todas as telas que usam `useTheme()` | Redesenho | Cores do tema escolhido |

##### Ação

1. O ator toca em um chip da seção Tema da aba Mais. É feita uma chamada para a função `changeTheme` do hook `useThemePreference`, com o valor do chip.
2. Caso o valor seja igual ao tema atual, a função termina sem alterar nada.
3. `changeTheme` invoca a ação `setTheme` do `useThemeStore`, que aplica o tema ao `Appearance` nativo (exceto no web) e altera o estado. O middleware `persist` grava o tema no `AsyncStorage`, e as telas que usam `useTheme()` são redesenhadas.
4. Caso não haja `token` e `user` no `authStore`, a função termina, e o tema fica só no aparelho.
5. `changeTheme` invoca `usuarioService.updateTheme(token, user.id, theme)` do aplicativo, que envia `PATCH /api/usuarios/:id/tema` com o corpo `{ theme }` por meio de `apiRequest`.
6. Na API, a rota executa `requireAuth`, que valida o token e confirma a conta no banco, e `requireSelf`, que valida o `id` com `parseId` e o compara com o usuário do token. Caso uma verificação falhe, o erro é tratado pelo `handleError`, que responde com o status e a mensagem da tabela de Saída.
7. `usuarioController.updateTheme` valida o corpo com `temaSchema` e invoca `usuarioService.updateTheme(userId, theme)` da API.
8. O service executa `prisma.user.update` com `where: { id }`, `data: { themePreference }` e `select: { id, themePreference }`. Caso o registro não exista, o service lança `AppError(404, 'Usuário não encontrado.')`.
9. A API responde `200` com `{ id, themePreference }`. O aplicativo não usa o retorno, porque o tema já foi aplicado no passo 3.
10. Caso a requisição falhe em qualquer um dos passos 5 a 8, `changeTheme` invoca `monitoringService.reportRequestFailure` e exibe o aviso¹.

##### Pré-condição

- A pessoa está autenticada e a conta existe.
- O `id` da rota é o da própria conta.

##### Pós-condição

- **Sucesso:** o aparelho e `User.themePreference` têm o mesmo tema.
- **Falha na API:** o aparelho fica com o novo tema e o banco mantém o anterior. No login seguinte, `applyUserPreference` aplica o valor do banco; `null` ou valor desconhecido vira `system`.

##### Efeitos colaterais

- Em falha da requisição, `monitoringService.reportRequestFailure` informa a falha à API de Monitoramento, exceto quando a API recusou a requisição com status de 400 a 499.
- Na abertura do aplicativo, `onRehydrateStorage` reaplica o tema guardado no aparelho.

##### Pendências e divergências do RF06

Esta tabela não faz parte do formulário: é o item 10 do conteúdo mínimo (DOC-13). As linhas que citam a Wiki e o `requisitos_e_casos_de_uso.md` foram conferidas em 2026-11-06 e não foram reconferidas nesta revisão.

| Item | Wiki ou documento | Código | Situação |
|---|---|---|---|
| Local da troca | Wiki RF06: menu lateral, `CustomDrawer.tsx` e `Switch` | Chips na aba Mais; `CustomDrawer` não existe | Atualizar a Wiki |
| API indisponível | Wiki RF06: sincronizar em uma próxima interação com rede | Só avisa, sem nova tentativa | Decidir entre implementar e corrigir o requisito |
| Número do caso de uso | `UC04` usado para o tema na Wiki e nos comentários do código (`useThemePreference.ts`, `usuarioSchema.ts`) | `requisitos_e_casos_de_uso.md` usa `UC04` para a checagem periódica | Definir o número e registrar a divergência |

---

## 7. Casos de uso

### 7.1 Notação UML com PlantUML (DOC-15)

**Todo diagrama de casos de uso deve seguir as normas do Diagrama de Casos de Uso e da notação UML.** Ele mostra quem interage com o sistema e com qual objetivo; não mostra a ordem dos passos, as telas nem o fluxo de dados. Esses detalhes ficam no RF de cada caso de uso (DOC-14 e DOC-17) e no diagrama de sequência (DOC-18).

A tabela mostra a notação obrigatória de cada elemento.

| Elemento UML | Notação obrigatória | Regra |
|---|---|---|
| Ator | Boneco, com o nome abaixo | Fica fora da fronteira e representa um papel externo ao sistema. Componentes internos, como banco de dados e service, não são atores |
| Caso de uso | Elipse, com o nome dentro | Fica dentro da fronteira e tem nome de ação (verbo + objeto), igual ao título do RF |
| Fronteira do sistema | Retângulo, com o nome do sistema | Contém todos os casos de uso do diagrama |
| Associação | Linha contínua, sem seta | Liga um ator a um caso de uso. Não representa sequência |
| Inclusão | Seta tracejada do caso base para o incluído, com `<<include>>` | O comportamento incluído sempre faz parte do caso base |
| Extensão | Seta tracejada do caso que estende para o caso base, com `<<extend>>` | O comportamento é opcional. Documente a condição e o ponto de extensão |
| Generalização entre casos de uso | Linha contínua com triângulo vazado, apontando para o caso geral | O caso específico é um tipo do caso geral |
| Generalização entre atores | Linha contínua com triângulo vazado, do ator especializado para o ator geral | Só nas condições do DOC-10 e com a mesma hierarquia em todos os diagramas |

Também não são permitidos:

- setas de fluxo, losangos de decisão ou caixas no lugar de atores e casos de uso;
- ligações entre atores ou entre casos de uso que não sejam uma das relações da tabela;
- `<<include>>` ou `<<extend>>` usados apenas para mostrar a ordem dos passos;
- caso de uso solto, sem ligação com um ator ou com outro caso de uso;
- generalização entre atores fora das condições do DOC-10.

A Di3 pediu diagramas mais simples. Por isso:

- cada diagrama trata de um assunto e tem **até cerca de 10 casos de uso**; acima disso, divida o assunto em diagramas menores, um por grupo de funcionalidades;
- o diagrama de um assunto é **atualizado** nos incrementos seguintes (aula 1, slide 14); não crie outro diagrama do mesmo assunto em outra entrega;
- prefira o ator geral do catálogo quando todos os especializados executam o caso de uso (DOC-10).

**A equipe usa PlantUML (`.puml`) para todos os diagramas**: casos de uso, sequência, classes e relacional. Foi o formato mais bem aceito pelo professor. Não use Mermaid, e não use blocos de código ```` ```mermaid ```` na documentação. Um `flowchart`, em especial, não é aceito, porque é um fluxograma, não um diagrama UML.

Para cada diagrama, versione a fonte `.puml` e o `.svg` gerado, lado a lado, em `Diagramas/`, e incorpore o SVG ao Markdown. Os blocos `text` com `@startuml` deste guia são modelos para copiar para o arquivo `.puml`; todos incluem o estilo comum (DOC-28). O modelo abaixo mostra a notação de casos de uso em PlantUML, com nomes fictícios.

```text
@startuml DCU-Assunto
!include ../../estilo-diagramas.iuml
title Diagrama de casos de uso — Assunto
left to right direction

actor "Integrante da comissão" as Int
actor "Administrador da comissão" as Adm

rectangle "Nome do sistema" {
  usecase "UC90 - Caso base" as UC90
  usecase "UC91 - Caso incluído" as UC91
  usecase "UC92 - Caso que estende" as UC92
  usecase "UC93 - Caso específico" as UC93
}

' Generalização entre atores: do especializado para o geral (DOC-10)
Adm --|> Int
' Associação
Int -- UC90
Adm -- UC93
' Inclusão: do caso base para o incluído
UC90 .> UC91 : <<include>>
' Extensão: do caso que estende para o caso base
UC92 .> UC90 : <<extend>>
' Generalização entre casos de uso: do caso específico para o geral
UC93 -|> UC90
@enduml
```

Para gerar o SVG de qualquer diagrama:

```bash
java -jar plantuml.jar -tsvg "DCU-Assunto.puml"
```

Nomes dos arquivos de diagrama: `DCU-<Assunto>` (casos de uso), `DS-<Cenario>` (sequência), `DC-<Assunto>` (classes) e `DER-<Assunto>` (relacional). Os diagramas consolidados usam `BetterMeet` no lugar do assunto (DOC-07).

#### Exemplo preenchido: diagrama do RF06

O diagrama abaixo mostra o caso de uso do RF06 com o ator geral do catálogo.

```text
@startuml DCU-Tema-Preferido
!include ../../estilo-diagramas.iuml
title Diagrama de casos de uso — Tema preferido
left to right direction

actor "Usuário da plataforma" as Usu

rectangle "Better Meet (App e API de Dados)" {
  usecase "Alterar tema preferido" as Tema
}

Usu -- Tema
@enduml
```

- **Atores:** o ator geral "Usuário da plataforma" substitui as duas associações (Administrador e Usuário comum), porque o código não diferencia os dois nesse caso de uso (seção 4.2). Como nenhum ator especializado aparece no diagrama, a seta de generalização fica só no catálogo de atores.
- **Número do caso de uso:** fica de fora até ser resolvida a repetição do `UC04` (pendências da seção 6.1).
- **Relações:** não há `<<include>>`, `<<extend>>` nem generalização entre casos de uso, porque o comportamento não se divide em outros casos de uso. Não crie relações só para preencher o diagrama. O exemplo real dessas relações é o [DCU-Gestao-Setup-Reset.puml](documentos/entrega2_Di1/Diagramas/DCU-Gestao-Setup-Reset.puml).

### 7.2 Referência aprovada (DOC-16)

O grupo indica como aceito pelo professor o diagrama UC07–UC12: [DCU-Gestao-Setup-Reset.puml](documentos/entrega2_Di1/Diagramas/DCU-Gestao-Setup-Reset.puml) e [DCU-Gestao-Setup-Reset.svg](documentos/entrega2_Di1/Diagramas/DCU-Gestao-Setup-Reset.svg).

Use-o como referência de notação e detalhamento. Confira a semântica de cada associação antes de repeti-la em outro domínio. O diagrama não prova que um endpoint, método ou tabela exista. Os atores técnicos dele pertencem ao escopo de infraestrutura e não devem ser copiados para outros diagramas sem necessidade. O estilo visual dele é anterior à DOC-28; ao alterá-lo, inclua o estilo comum.

### 7.3 Cada elipse tem o seu RF (DOC-17)

Cada elipse do diagrama corresponde a um RF no formulário padrão (DOC-14), com o mesmo nome. Não existe ficha separada de caso de uso: o RF é a descrição do caso de uso, como pedem as aulas 2 a 4. As pré e pós-condições ficam no RF de cada elipse; pré e pós-condições gerais para o diagrama inteiro não valem.

As relações UML (`<<include>>`, `<<extend>>` e generalizações) são explicadas no parágrafo que apresenta o diagrama, com o sentido, a condição e o ponto de extensão.

Toda página com diagrama de casos de uso termina com a tabela de auditoria abaixo, que confere a cobertura de cada elipse.

| Elipse do diagrama | RF | Atores associados | Relações UML | Verificado no código |
|---|---|---|---|---|
| `[nome da elipse]` | `[link para o RFxx]` | `[atores do catálogo]` | `[descrição ou "Nenhuma"]` | Sim/Não |

#### Exemplo preenchido: auditoria do RF06

A tabela mostra a auditoria do diagrama do RF06.

| Elipse do diagrama | RF | Atores associados | Relações UML | Verificado no código |
|---|---|---|---|---|
| Alterar tema preferido | RF06 (seção 6.1) | Usuário da plataforma | Nenhuma | Sim |

---

## 8. Diagramas de sequência

### 8.1 Participantes e mensagens reais, iguais ao diagrama de classes (DOC-18)

Os slides pedem "Diagrama de sequência de todos os requisitos", e a Di1 pediu que os diagramas de classes e de sequência tenham as mesmas classes. Por isso:

- Faça **pelo menos um diagrama de sequência em PlantUML (`DS-<Cenario>.puml` e `.svg`) por RF**, e um diagrama a mais para cada cenário significativo. Em funcionalidades grandes, separe envio, resposta, entrada, saída etc.
- Cada participante é um ator do catálogo (DOC-10) ou uma **classe do diagrama de classes** (DOC-19), no formato UML `objeto:Classe` ou `:Classe`. Duas classes com o mesmo nome em pacotes diferentes levam o pacote: `:usuarioService (app)` e `:usuarioService (api)`. Não use "Sistema" nem "Banco de Dados".
- Cada mensagem técnica é uma **operação da classe de destino**, presente no diagrama de classes com os mesmos argumentos: `reuniaoService.listMine(userId)`. "Registrar convites pendentes" não é uma operação. Mensagens do ator para a tela podem descrever a interação, e requisições HTTP entre o aplicativo e a API são escritas com método e caminho (`PATCH /api/usuarios/42/tema`).
- Mostre retornos, erros com `alt`, opcionais com `opt` e repetições com `loop`.
- Siga o caminho ator → tela → rota → controller → service → dados → retorno, adequado às camadas reais.
- Cite os arquivos usados para montar o diagrama.
- **Consistência:** antes de entregar, confira que cada participante existe no diagrama de classes e que cada mensagem técnica corresponde a uma operação dele. Participante sem classe, ou mensagem sem operação, é erro do documento.

O modelo abaixo usa **nomes fictícios**. Substitua-os somente por nomes encontrados no código e no diagrama de classes.

```text
@startuml DS-Assunto
!include ../../estilo-diagramas.iuml
title Diagrama de sequência — Assunto

actor "Usuário comum" as U
participant ":TelaReal" as T
participant ":controllerReal" as C
participant ":serviceReal" as S
participant ":PrismaClient" as P

U -> T : seleciona ação
T -> C : POST /api/rota-real {campos}
C -> S : operacaoReal(dadosValidados)
alt dados e permissão válidos
  S -> P : model.update({where, data})
  P --> S : registroAtualizado
  S --> C : resultado
  C --> T : 200 + resultado
else dados inválidos
  S --> C : AppError(400, mensagem)
  C --> T : 400 + {error}
end
@enduml
```

#### Exemplo preenchido: sequência do RF06

**Cenário:** trocar o tema para escuro, com sessão ativa. Os valores `'dark'` e `42` são ilustrativos.

**Arquivos usados:** os listados em "Fontes" no cabeçalho do exemplo (seção 5.1), mais `sistema/better-meet/src/utils/apiClient.ts`, `sistema/better-meet/src/services/monitoringService.ts`, `sistema/api/src/middlewares/authMiddleware.ts`, `sistema/api/src/middlewares/errorMiddleware.ts`, `sistema/api/src/controllers/usuarioController.ts` e `sistema/api/src/schemas/usuarioSchema.ts`.

Os participantes são as classes do diagrama de classes da seção 9.1. Arquivo: `DS-Tema-Preferido.puml`.

```text
@startuml DS-Tema-Preferido
!include ../../estilo-diagramas.iuml
title Diagrama de sequência — Alterar tema preferido

actor "Usuário da plataforma" as Ator
participant ":MaisScreen" as Tela
participant ":useThemePreference" as Hook
participant ":useThemeStore" as Store
participant ":usuarioService (app)" as SvcApp
participant ":apiClient" as Cli
participant ":monitoringService" as Mon
participant ":Express" as Exp
participant ":authMiddleware" as Auth
participant ":usuarioController" as Ctrl
participant ":usuarioSchema" as Sch
participant ":usuarioService (api)" as SvcApi
participant ":PrismaClient" as Db
participant ":errorMiddleware" as Err

Ator -> Tela : toca no chip Escuro
Tela -> Hook : changeTheme('dark')
Hook -> Store : setTheme('dark')
Store --> Tela : novo theme; telas redesenhadas
opt há token e user no authStore
  Hook -> SvcApp : updateTheme(token, 42, 'dark')
  SvcApp -> Cli : apiRequest('/usuarios/42/tema', opcoes)
  alt API acessível, sem erro
    Cli -> Exp : PATCH /api/usuarios/42/tema {theme: 'dark'}
    Exp -> Auth : requireAuth(request, response, next)
    Auth --> Exp : next()
    Exp -> Auth : requireSelf(request, response, next)
    Auth --> Exp : next()
    Exp -> Ctrl : updateTheme(request, response)
    Ctrl -> Sch : temaSchema.validate(request.body, {stripUnknown: true})
    Sch --> Ctrl : {theme: 'dark'}
    Ctrl -> SvcApi : updateTheme(42, 'dark')
    SvcApi -> Db : user.update({where, data, select})
    Db --> SvcApi : {id, themePreference}
    SvcApi --> Ctrl : {id, themePreference}
    Ctrl --> Cli : 200 + {id, themePreference}
    Cli --> SvcApp : {id, themePreference}
    SvcApp --> Hook : promessa concluída
  else erro em token, dono, corpo ou gravação
    Cli -> Exp : PATCH /api/usuarios/42/tema {theme: 'dark'}
    Exp -> Err : handleError(error, request, response, next)
    Err --> Cli : 400, 401, 403, 404 ou 500 + {error}
    Cli --> SvcApp : lança ApiError(mensagem, status, data)
    SvcApp --> Hook : rejeição com ApiError
    Hook -> Mon : reportRequestFailure(error, 'useThemePreference.changeTheme', false)
    Hook --> Tela : feedback de erro no FeedbackBanner
  else API inacessível
    Cli --> SvcApp : lança ApiError(NETWORK_ERROR_MESSAGE, 0)
    SvcApp --> Hook : rejeição com ApiError
    Hook -> Mon : reportRequestFailure(error, 'useThemePreference.changeTheme', false)
    Hook --> Tela : feedback de erro no FeedbackBanner
  end
end
@enduml
```

Caso o chip escolhido já seja o tema atual, `changeTheme` termina antes de `setTheme`. O passo a passo completo está no campo Ação do RF06 (seção 6.1).

---

## 9. Diagrama de classes

### 9.1 Classes da implementação (DOC-19)

O professor pediu que os diagramas de classes e de sequência tenham as mesmas classes (Di1), achou classes que não existiam no código (Di2) e criticou o diagrama relacional "misturado com o diagrama de classes" (Di3). Por isso o diagrama de classes do Better Meet mostra as **classes da implementação**, e não o modelo do banco.

- **O que entra:** telas, componentes, hooks, stores, services, controllers, middlewares, schemas e utilitários que aparecem nas sequências; os tipos de domínio do código (`type`) usados nas operações; e as bibliotecas externas que participam das sequências (`PrismaClient`, `Express`), só com as operações usadas.
- **O que não entra:** models e enums do Prisma, que ficam no diagrama relacional (DOC-20). Quando uma operação recebe ou devolve um model, o tipo aparece na assinatura, sem desenhar a classe.
- **Membros reais:** atributos com tipo e operações com a assinatura do código; visibilidade `+` para o que o módulo exporta e `-` para o que é interno, quando for relevante.
- **Relações:** dependência (`..>`) quando uma classe invoca outra; associação com multiplicidade só quando uma classe guarda referência a outra; herança, composição e agregação só quando o código as sustenta. Uma dependência entre o aplicativo e a API leva o rótulo `HTTP`.
- **Pacotes** por subsistema e camada: `app` e `api`, e dentro deles a camada, quando o diagrama for grande.
- **Classes com o mesmo nome** em pacotes diferentes são citadas com o pacote: `usuarioService (app)` e `usuarioService (api)`.
- **Diagrama consolidado:** o diagrama oficial é `documentos/consolidado/Diagramas/DC-BetterMeet.puml`, atualizado a cada incremento (aula 1, slide 14). A entrega pode mostrar um recorte (`DC-<Assunto>.puml`) com o mesmo estilo (DOC-28); o recorte nunca contém classe, atributo ou operação que não esteja no consolidado.
- **Consistência com as sequências:** todo participante de sequência é uma classe do diagrama, e toda mensagem técnica é uma operação dela (DOC-18).

A tabela mostra os estereótipos usados para indicar a camada de cada classe.

| Estereótipo | Uso | Exemplo |
|---|---|---|
| `<<screen>>` | Tela do Expo Router (`src/app/`) | `MaisScreen` |
| `<<component>>` | Componente React | `FeedbackBanner` |
| `<<hook>>` | Hook; os membros são os itens que o hook devolve | `useThemePreference` |
| `<<store>>` | Store Zustand | `useThemeStore` |
| `<<service>>` | Objeto `<dominio>Service` do aplicativo ou da API | `usuarioService` |
| `<<controller>>` | Objeto `<dominio>Controller` | `usuarioController` |
| `<<middleware>>` | Módulo de middlewares | `authMiddleware` |
| `<<schema>>` | Módulo de schemas Yup | `usuarioSchema` |
| `<<utility>>` | Módulo de funções utilitárias | `apiClient` |
| `<<type>>` | Tipo de domínio declarado com `type` | `Feedback` |
| `<<library>>` | Classe ou objeto de biblioteca externa | `PrismaClient` |

Services, controllers, middlewares, schemas e utilitários são módulos que exportam um objeto ou funções, sem instâncias (EX-02 do guia de código). No diagrama, eles aparecem como classes com o estereótipo e as operações exportadas. A legenda do diagrama consolidado registra essa convenção.

#### Exemplo preenchido: diagrama de classes do RF06

**Tipo de diagrama:** recorte do diagrama de classes da implementação, com as classes que participam da sequência da seção 8.1. As classes seguem a mesma ordem da sequência.

```text
@startuml DC-Tema-Preferido
!include ../../estilo-diagramas.iuml
title Diagrama de classes (recorte) — Alterar tema preferido

package "app" {
  class MaisScreen <<screen>> {
    +MaisScreen(): JSX.Element
  }
  class useThemePreference <<hook>> {
    +theme: Tema
    +feedback: Feedback [0..1]
    +changeTheme(newTheme: Tema): Promise<void>
  }
  class useThemeStore <<store>> {
    +theme: Tema
    +setTheme(theme: Tema): void
    +applyUserPreference(theme: string | null | undefined): void
  }
  class "usuarioService (app)" as UsuarioServiceApp <<service>> {
    +updateTheme(token: string, userId: number, theme: Tema): Promise<{ id: number; themePreference: Tema }>
  }
  class apiClient <<utility>> {
    +NETWORK_ERROR_MESSAGE: string
    +apiRequest<T>(path: string, options: ApiRequestOptions): Promise<T>
    +getErrorMessage(error: unknown, fallback: string): string
  }
  class monitoringService <<service>> {
    +reportRequestFailure(error: unknown, context: string, isBlocking: boolean): void
  }
}

package "api" {
  class Express <<library>>
  class authMiddleware <<middleware>> {
    +requireAuth(request: Request, response: Response, next: NextFunction): Promise<void>
    +requireSelf(request: Request, response: Response, next: NextFunction): void
  }
  class usuarioController <<controller>> {
    +updateTheme(request: Request, response: Response): Promise<void>
  }
  class usuarioSchema <<schema>> {
    +temaSchema: ObjectSchema
  }
  class "usuarioService (api)" as UsuarioServiceApi <<service>> {
    +updateTheme(userId: number, theme: Tema): Promise<{ id: number; themePreference: Tema | null }>
  }
  class PrismaClient <<library>> {
    +user.update(args: UserUpdateArgs): Promise<User>
  }
  class errorMiddleware <<middleware>> {
    +handleError(error: unknown, request: Request, response: Response, next: NextFunction): void
  }
}

MaisScreen ..> useThemePreference
useThemePreference ..> useThemeStore
useThemePreference ..> UsuarioServiceApp
useThemePreference ..> monitoringService
UsuarioServiceApp ..> apiClient
apiClient ..> Express : HTTP
Express ..> authMiddleware
Express ..> usuarioController
Express ..> errorMiddleware
usuarioController ..> usuarioSchema
usuarioController ..> UsuarioServiceApi
UsuarioServiceApi ..> PrismaClient
@enduml
```

Os tipos `Tema`, `Feedback`, `ApiRequestOptions`, `Request`, `Response`, `NextFunction`, `ObjectSchema`, `UserUpdateArgs` e `User` aparecem só nas assinaturas, porque não participam da sequência. O componente `FeedbackBanner` e o `Chip` também foram omitidos do recorte pelo mesmo motivo. `UserUpdateArgs` e `User` são os tipos gerados pelo Prisma para a operação `user.update`.

### 9.2 Dicionário do diagrama de classes (DOC-27)

As aulas 2 a 4 pedem "Diagrama de classes e respectivo dicionário de dados", e a Di3 criticou a falta de explicação de cada membro da classe. O dicionário de classes é separado do dicionário de dados do banco (DOC-21) e fica em `documentos/consolidado/dicionario_classes.md`; os documentos da entrega citam as classes do recorte.

Cada classe tem um parágrafo com a responsabilidade, o estereótipo e o arquivo, seguido de uma tabela com uma linha por membro. Copie o modelo abaixo.

```markdown
#### `[Classe]` <<[estereótipo]>>

[Responsabilidade da classe, em uma ou duas frases.] Arquivo: `[caminho]`.

| Membro | Tipo de membro | Assinatura ou tipo | Visibilidade | O que representa |
|---|---|---|---|---|
| `[nome]` | Atributo / Operação | `[tipo ou assinatura]` | Pública / Interna | `[significado no sistema]` |
```

#### Exemplo preenchido: dicionário de três classes do RF06

O exemplo mostra três das treze classes do recorte. O dicionário completo descreve todas.

##### `useThemePreference` <<hook>>

Hook que concentra a troca de tema: aplica o tema no aparelho, grava a preferência na conta e guarda o aviso de falha. Arquivo: `sistema/better-meet/src/hooks/useThemePreference.ts`.

| Membro | Tipo de membro | Assinatura ou tipo | Visibilidade | O que representa |
|---|---|---|---|---|
| `theme` | Atributo | `Tema` | Pública | Tema em uso no aparelho, lido do `useThemeStore` |
| `feedback` | Atributo | `Feedback`, ou `null` sem aviso | Pública | Aviso exibido quando o tema não foi salvo na conta |
| `changeTheme` | Operação | `(newTheme: Tema) => Promise<void>` | Pública | Troca o tema no aparelho e, havendo sessão, grava a preferência na conta |

##### `useThemeStore` <<store>>

Store que guarda o tema escolhido no aparelho e o aplica aos componentes nativos. Arquivo: `sistema/better-meet/src/store/themeStore.ts`.

| Membro | Tipo de membro | Assinatura ou tipo | Visibilidade | O que representa |
|---|---|---|---|---|
| `theme` | Atributo | `Tema` (`'light'`, `'dark'` ou `'system'`) | Pública | Tema escolhido, persistido no `AsyncStorage` na chave `better-meet-theme` |
| `setTheme` | Operação | `(theme: Tema) => void` | Pública | Aplica o tema ao `Appearance` nativo (exceto no web) e altera o estado |
| `applyUserPreference` | Operação | `(theme: string \| null \| undefined) => void` | Pública | Aplica o tema gravado na conta, no login; valor ausente ou desconhecido vira `'system'` |

##### `usuarioService (api)` <<service>>

Objeto com as regras de negócio da conta na API de Dados; no RF06, grava a preferência de tema. Arquivo: `sistema/api/src/services/usuarioService.ts`.

| Membro | Tipo de membro | Assinatura ou tipo | Visibilidade | O que representa |
|---|---|---|---|---|
| `updateTheme` | Operação | `(userId: number, theme: Tema) => Promise<{ id: number; themePreference: Tema \| null }>` | Pública | Grava `User.themePreference` da conta indicada e devolve o identificador e o tema gravado; lança `AppError(404)` quando a conta não existe |

---

## 10. Diagrama relacional e dicionário de dados

A Di3 criticou o diagrama relacional "confuso e misturado com o diagrama de classes", colunas sem explicação e restrições sem a origem da chave estrangeira, escritas em "nomenclatura de objeto". A Di2 não encontrou o diagrama relacional do incremento. As regras desta seção tratam dessas críticas.

### 10.1 Diagrama relacional (DOC-20)

Use um diagrama entidade-relacionamento em PlantUML (`DER-<Assunto>.puml` e `.svg`), com `entity` e notação de cardinalidade *crow's foot*.

- **Separado das classes.** O diagrama relacional e o dicionário de dados ficam em arquivos ou seções separados do diagrama de classes e do dicionário de classes (DOC-19 e DOC-27). Os dois nunca são combinados no mesmo diagrama nem na mesma tabela.
- **Consolidado e recorte.** O diagrama oficial do banco principal é `documentos/consolidado/Diagramas/DER-BetterMeet.puml`, atualizado a cada incremento; o banco de monitoramento tem o seu (`DER-Monitoramento.puml`). Todo incremento traz o recorte das tabelas que usa (`DER-<Assunto>.puml`), com o mesmo estilo e sempre subconjunto do oficial.
- Cubra o **banco principal** (`sistema/api/prisma/schema.prisma`) e todas as entidades afetadas pelo incremento, além do banco de monitoramento (`sistema/monitoring-better-meet/prisma/schema.prisma`) quando for pertinente.
- Baseie-se no schema, nas migrations e, quando acessível, na estrutura física do MySQL. Registre divergências.
- Não desenhe FK física entre bancos diferentes.
- Use nomes físicos, `PK`, `FK`, `UK`, cardinalidade e tabelas associativas.
- Separe tabelas planejadas de implementadas.
- Para dados sem banco (memória ou armazenamento local), descreva o armazenamento real em seção própria, sem inventar tabela.

#### Exemplo preenchido: diagrama relacional do RF06

**Banco:** `bettermeet` (MySQL). **Fontes:** `schema.prisma` e migrations `20260918235817_config_usuario` e `20261014120100_adiciona_enums_status_tema`. A estrutura física não foi conferida em um banco em execução.

O RF06 altera apenas `User`. `PasswordResetToken` entra só para mostrar como registrar FK e cardinalidade. As demais tabelas ligadas a `User` foram omitidas do recorte.

```text
@startuml DER-Usuario-Tema
!include ../../estilo-diagramas.iuml
title Diagrama relacional (recorte) — Usuário e tema
hide circle

entity User {
  * id : int <<PK, AUTO_INCREMENT>>
  --
  * name : varchar(191)
  * email : varchar(191) <<UK>>
  * password : varchar(191)
  * role : enum('USER','ADMIN') <<DEFAULT USER>>
  * createdAt : datetime(3) <<DEFAULT CURRENT_TIMESTAMP(3)>>
  themePreference : enum('light','dark','system') <<NULL, DEFAULT system>>
}

entity PasswordResetToken {
  * id : int <<PK, AUTO_INCREMENT>>
  --
  * userId : int <<FK>>
  * token : varchar(191) <<UK>>
  * expiresAt : datetime(3)
  usedAt : datetime(3) <<NULL>>
}

User ||--o{ PasswordResetToken : userId
@enduml
```

Na notação acima, `*` marca coluna obrigatória (`NOT NULL`).

**Dados sem banco:** o aplicativo também guarda o tema no `AsyncStorage` do aparelho, na chave `better-meet-theme`. Esse dado não é uma tabela e não aparece no diagrama.

### 10.2 Dicionário de dados (DOC-21)

O dicionário de dados descreve o banco, coluna por coluna, e fica separado do dicionário de classes. A versão completa fica em `documentos/consolidado/dicionario_dados.md`; a entrega cita as tabelas do recorte. A referência anterior de detalhamento é o [dicionario_de_dados.md](documentos/entrega2_Di1/dicionario_de_dados.md).

- **Uma linha por coluna**, com o tipo físico, o tipo lógico, o domínio, a nulidade, o padrão, a chave e a descrição.
- **A descrição diz o que o valor representa no negócio.** "FK" ou "identificador" sozinhos não bastam: para uma FK, diga a que registro a linha pertence e por quê.
- **Restrições em notação relacional.** Cada restrição tem a tabela e as colunas de origem, a tabela e a coluna referenciadas, as regras `ON DELETE` e `ON UPDATE` e uma frase que explica o significado. Escreva a tabela e, entre parênteses, a coluna: `Reuniao (id)`. Não use notação de objeto (`Reuniao.id`) nem setas (`→`).

Copie o modelo abaixo para cada tabela.

```markdown
**Banco:** `[nome]`
**Tabela:** `[nome físico]`
**Finalidade:** `[explicação]`
**Fonte:** `[schema, migration ou SQL]`

[Frase que apresenta a tabela de colunas.]

| Coluna | Tipo físico | Tipo lógico | Tamanho ou domínio | Nulo? | Padrão | Chave ou índice | O que representa |
|---|---|---|---|---|---|---|---|
| `[nome]` | `[varchar(191)]` | `[String]` | `[até 191]` | Não | — | `[PK/FK/UK]` | `[significado no negócio e validação]` |

[Frase que apresenta a tabela de restrições.]

| Restrição | Tipo | Tabela (colunas) | Referencia | ON DELETE | ON UPDATE | Significado |
|---|---|---|---|---|---|---|
| `[nome físico]` | PK / UK / FK / Índice | `[Tabela (coluna)]` | `[Tabela (coluna)]` ou — | `[regra]` ou — | `[regra]` ou — | `[frase]` |
```

#### Exemplo preenchido: dicionário da tabela `User`

- **Banco:** `bettermeet`
- **Tabela:** `User`
- **Finalidade:** guarda as contas da plataforma, o perfil de acesso e a preferência de tema.
- **Fonte:** `sistema/api/prisma/schema.prisma`; migrations `20260918235817_config_usuario` e `20261014120100_adiciona_enums_status_tema`; validações em `sistema/api/src/schemas/commonSchema.ts` e `usuarioSchema.ts`.

A tabela descreve cada coluna de `User`.

| Coluna | Tipo físico | Tipo lógico | Tamanho ou domínio | Nulo? | Padrão | Chave ou índice | O que representa |
|---|---|---|---|---|---|---|---|
| `id` | `int` | `Int` | Inteiro gerado pelo banco | Não | `AUTO_INCREMENT` | PK | Número que identifica a conta; é a coluna referenciada pelas tabelas que registram o que a pessoa faz na plataforma |
| `name` | `varchar(191)` | `String` | 2 a 80 caracteres na validação | Não | — | — | Nome da pessoa, exibido na interface; recebido como `nome` na API (`nomeRule`); não identifica a conta (EX-17 do guia de código) |
| `email` | `varchar(191)` | `String` | Até 160 caracteres na validação | Não | — | UK `User_email_key` | E-mail da pessoa, usado como login; único, sem espaços nas pontas e em minúsculas (`emailRule`) |
| `password` | `varchar(191)` | `String` | 64 caracteres hexadecimais gravados | Não | — | — | Hash SHA-256 da senha (`hashPassword`). A senha informada tem de 8 a 72 caracteres, com maiúscula, minúscula e número (`senhaForteRule`). Veja o RNF06 na seção 11.1 |
| `role` | `enum('USER','ADMIN')` | `Role` | `USER`, `ADMIN` | Não | `USER` | — | Perfil na plataforma: `ADMIN` aprova organizações e vê os relatórios gerais. O cadastro público só cria `USER` |
| `createdAt` | `datetime(3)` | `DateTime` | Data e hora com milissegundos | Não | `CURRENT_TIMESTAMP(3)` | — | Momento em que a conta foi cadastrada |
| `themePreference` | `enum('light','dark','system')` | `Tema?` | `light`, `dark`, `system` | Sim | `system` | — | Tema preferido da pessoa, alterado pelo RF06 (`temaSchema`) e aplicado no login. `NULL` é tratado como `system` |

A tabela abaixo lista as restrições que envolvem `User`, com o significado de cada uma.

| Restrição | Tipo | Tabela (colunas) | Referencia | ON DELETE | ON UPDATE | Significado |
|---|---|---|---|---|---|---|
| `PRIMARY` | PK | `User (id)` | — | — | — | Cada conta tem um identificador único gerado pelo banco |
| `User_email_key` | UK | `User (email)` | — | — | — | Não existem duas contas com o mesmo e-mail, porque o e-mail é o login |
| `PasswordResetToken_userId_fkey` | FK | `PasswordResetToken (userId)` | `User (id)` | `CASCADE` | `CASCADE` | Cada token de recuperação pertence a uma conta. Ao excluir a conta, os tokens dela são excluídos |
| `PasswordResetToken_userId_idx` | Índice | `PasswordResetToken (userId)` | — | — | — | Acelera a busca dos tokens de uma conta |

Outras tabelas também têm FK para `User (id)`, com regras próprias. No dicionário completo, liste todas.

---

## 11. Requisitos não funcionais

### 11.1 Propriedade verificável (DOC-22)

Se o texto descreve **o que o sistema faz**, normalmente é RF. RNF descreve uma característica ou qualidade da solução e "deve ser de fácil verificação" (aula 1, revisão, slide 12).

A categoria segue a classificação da aula 1 (revisão, slide 13), adaptada de Sommerville. A tabela mostra as categorias e as subcategorias que podem ser usadas.

| Categoria | Subcategorias |
|---|---|
| Produto | Facilidade de uso; eficiência (desempenho e espaço); confiabilidade; portabilidade |
| Organizacional | Entrega; implementação; padrões |
| Externo | Interoperabilidade; ético; legal (privacidade e segurança) |

Copie o modelo abaixo para cada RNF.

```text
RNFxx — [Propriedade]
Categoria: [categoria — subcategoria, conforme a tabela acima]
Escopo: [componente, rota, operação ou ambiente]
Exigência: [restrição específica e verificável]
Métrica/critério de aceitação: [limiar, unidade, amostra, percentil e condições]
Método de verificação: [teste, inspeção, revisão de dependências ou ferramenta]
Versões/configuração: [versões do catálogo de softwares (DOC-29) no commit consultado]
Evidência: [log, captura, relatório ou caminho do arquivo]
Resultado: [Aprovado / Reprovado / Não executado]
```

- **Todo campo do modelo é obrigatório e preenchido.** A AP foi criticada por RNFs "muito simples" e sem versões. Um RNF com texto de uma linha, sem métrica numérica, sem método de verificação ou sem versão é reprovado na revisão.
- **Teste de classificação.** A AP também apontou um RNF que não era não funcional (o RNF07). Antes de aceitar um RNF, pergunte: o texto descreve uma ação que o sistema executa ou um dado que ele processa? Então é RF, com o formulário do DOC-14. Só é RNF o que descreve uma qualidade (desempenho, segurança, portabilidade etc.) que se mede ou se inspeciona. Registre a reclassificação no documento: "RNFxx reclassificado como RFyy: o texto descreve a ação 'enviar e-mail de recuperação', não uma qualidade".
- Evite "rápido", "seguro", "fácil", "não expor indevidamente" e "hash-256".
- Uma meta de tempo diz como medir: ambiente, aparelho, rede, amostra e percentil. A meta precisa ser compatível com o uso em celular e justificada. O professor considerou 15 segundos excessivo para carregar uma tela; o exemplo da aula 1 usa 10 segundos para iniciar o sistema inteiro.
- Em senhas, cite o algoritmo e a biblioteca realmente usados, com sal e custo quando aplicável. Não confunda hash com criptografia reversível.
- Não afirme que containers separados garantem isolamento completo de falhas.
- Não deduza versões de Node, Expo, React Native, Express, Prisma ou MySQL a partir da Wiki: use o catálogo de softwares (DOC-29), que copia os manifestos e lockfiles.

#### Exemplo preenchido: RNF06 — Armazenamento seguro de senha

O RF06 não tem RNF próprio no catálogo. Este exemplo usa o RNF06, um caso real da crítica do professor sobre "hash-256".

**Como está na Wiki:** "As senhas devem ser criptografadas em hash-256."

**Problemas desse texto:** hash não é criptografia reversível, "hash-256" não identifica um algoritmo, e não há sal, métrica nem forma de verificar.

```text
RNF06 — Armazenamento seguro de senha
Categoria: Externo — legal (segurança)
Escopo: coluna User.password; gravação e conferência em authService e usuarioService, por meio de utils/passwordHash.ts
Exigência: gravar a senha sempre com sal e custo, usando o algoritmo scrypt do Better Auth; nunca usar SHA-256 simples (regra EX-14 do guia de código)
Métrica/critério de aceitação: 100% das gravações de User.password usam hash com sal; a mesma senha gera hashes diferentes em contas diferentes
Método de verificação: CT-RNF06-01, inspeção de passwordHash.ts, de todas as chamadas a hashPassword e de package.json
Versões/configuração: node:crypto, módulo nativo do Node (versão de produção a conferir no catálogo de softwares); better-auth não está em sistema/api/package.json
Evidência: sistema/api/src/utils/passwordHash.ts usa crypto.createHash('sha256') sem sal; chamadas em authService.ts e usuarioService.ts
Resultado: Reprovado em 2026-11-20, commit 704478f. A migração para o Better Auth é uma pendência registrada no RELATORIO_BUGS.md
```

Um RNF reprovado é um resultado válido. O documento registra a situação real, sem ajustar a exigência para fazê-la passar.

---

## 12. Testes

### 12.1 Plano e registro de testes por entrega (DOC-23)

Cada assunto tem um `testes_<assunto>.md` na pasta da entrega, como pede a regra GT-04 do guia de código. O arquivo começa pelo **plano de testes**, escrito antes da execução (a Di1 apontou "Faltou plano de testes na doc"), e termina com o **registro de execução**. Código de teste não substitui esse registro.

A AP foi criticada por um projeto de testes "muito genérico", sem detalhes e sem as ferramentas. Um plano de testes **nomeia cada ferramenta com a versão** (copiada dos `package.json` e lockfiles, DOC-29), a configuração, a convenção de nomes de arquivo, como as dependências são simuladas e traz **um exemplo** por tipo de teste; um plano sem ferramenta e sem exemplo é considerado genérico. Os critérios de aprovação são numéricos ("todos os casos CT do assunto com status Passou; nenhuma falha na suíte do subsistema"). O guia de código (GT-04) lista as ferramentas do Better Meet.

Os tipos de teste do plano são os da aula 1 (revisão, slide 20). A tabela mostra como cada tipo se aplica no Better Meet.

| Tipo de teste | Como se aplica no Better Meet |
|---|---|
| Inspeção, com checklist | Revisão do código pelo checklist do guia de código e revisão do documento pelo checklist da seção 16 |
| Teste de caminho | Casos que percorrem cada desvio do campo Ação do RF (sucesso e cada erro) |
| Teste de unidade | Jest nos services, stores, hooks e schemas |
| Teste de integração | Supertest nas rotas da API; React Native Testing Library nos fluxos de tela |
| Teste de release (aceitação) | Roteiro manual em um aparelho Android e um iOS, como o professor executa nas apresentações |
| Teste de desempenho | Medição das metas dos RNFs de desempenho, quando houver |
| Automação | `npm test` de cada subsistema, executado antes de cada entrega |

Copie o modelo abaixo.

````markdown
# Testes de [assunto]

[Cabeçalho da seção 5.1]

## Plano de testes

### Escopo
[RFs, RNFs e telas cobertos; o que fica fora e por quê.]

### Tipos de teste
[Frase que apresenta a tabela.]

| Tipo | Aplicação neste assunto | Ferramenta e versão | Exemplo (arquivo ou roteiro) |
|---|---|---|---|

### Ambiente e aparelhos
[Versões pelo catálogo de softwares (DOC-29); aparelhos Android e iOS com modelo, versão do sistema operacional e forma de execução (Expo Go ou build de desenvolvimento); banco de teste.]

### Critérios de aprovação
[Condições para considerar o assunto aprovado.]

### Casos de teste planejados
[Frase que apresenta a tabela.]

| ID | RF/RNF e UC | Cenário | Tipo | Resultado esperado |
|---|---|---|---|---|
| CT-RF14-01 | RF14, UCxx | `[cenário]` | `[tipo]` | `[resultado]` |

## Registro de execução

### O que foi testado
[Frase que apresenta a tabela.]

| ID | RF/RNF e UC | Rota ou tela | Cenário verificado | Arquivo ou passos | Status |
|---|---|---|---|---|---|
| CT-RF14-01 | RF14, UCxx | `[rota]` | `[regra verificada]` | `[arquivo de teste ou passo a passo]` | Passou / Falhou / Não executado |

### Como rodar
Ambiente, dados e ferramentas. Em `sistema/<subsistema>`:

```bash
npm test -- --runInBand [arquivo]
```

### Resultado
Execução de [AAAA-MM-DD], commit [hash]:

- [suítes e quantidade de testes]: [aprovados], [falhas].
- Falhas e defeitos encontrados: [causa e correção].
- Evidências: [link, captura ou log].
````

- Cubra, quando aplicável: sucesso, validação, autenticação, autorização, duplicidade, estados inválidos, horários fora da janela permitida, falha de serviço e integridade.
- Teste manual traz passo a passo, resultado esperado, resultado obtido e o aparelho usado (modelo, versão do sistema operacional e forma de execução).
- **Não invente resultados.** Sem execução, registre `Não executado` e o motivo.
- Confira as mensagens e os códigos HTTP realmente retornados.
- Não exponha tokens, senhas ou dados pessoais nas evidências.

#### Exemplo preenchido: testes do RF06

##### Plano de testes

**Escopo:** RF06 — Alterar tema preferido, no aplicativo e na rota `PATCH /api/usuarios/:id/tema`. O RNF06 fica no plano de testes de segurança.

A tabela mostra os casos planejados.

| ID | RF/RNF e UC | Cenário | Tipo | Resultado esperado |
|---|---|---|---|---|
| CT-RF06-01 | RF06; UC a confirmar | `applyUserPreference` com `dark`, `light`, `system`, `roxo`, `null` e `undefined` | Unidade (Jest) | Os três temas válidos são mantidos; os demais viram `system` |
| CT-RF06-02 | RF06; UC a confirmar | `PATCH /api/usuarios/:id/tema` com sucesso e com os erros `400`, `401`, `403` e `404` | Integração (Supertest) | Status e mensagens da tabela de Saída do RF06 |
| CT-RF06-03 | RF06; UC a confirmar | Troca de tema na aba Mais, com e sem rede, em Android e iOS | Release (manual) | Tema aplicado na hora; aviso exibido quando a API falha |

**Critério de aprovação:** os três casos com status Passou, ou com a lacuna registrada.

##### Registro de execução

A tabela mostra o resultado de cada caso.

| ID | RF/RNF e UC | Rota ou tela | Cenário verificado | Arquivo ou passos | Status |
|---|---|---|---|---|---|
| CT-RF06-01 | RF06; UC a confirmar | Login no aplicativo (`applyUserPreference`) | `dark`, `light` e `system` são mantidos; `roxo`, `null` e `undefined` viram `system` (6 casos) | `sistema/better-meet/src/store/__tests__/stores.test.ts` | Passou |
| CT-RF06-02 | RF06; UC a confirmar | `PATCH /api/usuarios/:id/tema` | Sucesso e erros `400`, `401`, `403` e `404` | Nenhum teste localizado (conferido no commit `704478f`) | Não executado |
| CT-RF06-03 | RF06; UC a confirmar | Aba Mais, seção Tema | Troca de tema com e sem rede | Nenhum roteiro manual registrado | Não executado |

##### Como rodar

Ambiente da execução registrada: Node 24.14.0, Jest 29.7 e `jest-expo` 57 (faixas do `package.json` no commit `9e48774`). Depois da migração para o Expo 58, o aplicativo usa Jest 30 e `jest-expo` 58; um registro novo cita as versões do commit testado. O teste invoca o store diretamente, com o `AsyncStorage` simulado em `jest.setup.ts`, e não acessa a API nem o banco. Em `sistema/better-meet`:

```bash
npm test -- stores -t applyUserPreference
```

##### Resultado

Execução de 2026-11-06, branch `development`, commit `9e48774`; não repetida nesta revisão do guia:

- 1 suíte e 9 testes: 6 aprovados, 3 ignorados pelo filtro `-t` e nenhuma falha.
- Defeitos encontrados: nenhum nos casos executados.
- Lacunas: CT-RF06-02 e CT-RF06-03 não foram executados, porque não há teste automatizado da rota nem roteiro manual. Os erros da tabela de Saída foram verificados só por leitura do código.
- Evidência: saída do comando acima, `Tests: 3 skipped, 6 passed, 9 total`.

---

## 13. Rastreabilidade

### 13.1 Matriz por incremento (DOC-24)

A matriz liga cada requisito às partes da documentação e do código. Ela também recebe o que não fica no formulário do RF (DOC-14): atores, referências do código, testes e status. Copie o modelo abaixo.

| RF/RNF | UC | Atores | Tela ou componente | Rota ou service | Classes | Tabelas e colunas | Diagramas | Testes | Status |
|---|---|---|---|---|---|---|---|---|---|
| RFxx | UCxx | `[atores do catálogo]` | `[arquivo]` | `[rota ou operação]` | `[classes do diagrama de classes]` | `[Tabela (coluna)]` | `[DCU, DS, DC, DER]` | CT-RFxx-01 | `[status]` |

Nenhum RF fica sem vínculo ou justificativa. Diagramas, matriz e código usam os mesmos nomes.

#### Exemplo preenchido: rastreabilidade do RF06 e do RNF06

A tabela mostra a matriz do exemplo.

| RF/RNF | UC | Atores | Tela ou componente | Rota ou service | Classes | Tabelas e colunas | Diagramas | Testes | Status |
|---|---|---|---|---|---|---|---|---|---|
| RF06 | A confirmar (Alterar tema preferido) | Usuário da plataforma | `(tabs)/mais/index.tsx` (`MaisScreen`), `useThemePreference`, `useThemeStore` | `PATCH /api/usuarios/:id/tema`; `usuarioController.updateTheme`; `usuarioService.updateTheme` | Classes do `DC-Tema-Preferido` (seção 9.1) | `User (themePreference)` | `DCU-Tema-Preferido`, `DS-Tema-Preferido`, `DC-Tema-Preferido`, `DER-Usuario-Tema` | CT-RF06-01 (Passou); CT-RF06-02 e CT-RF06-03 (Não executado) | Parcial |
| RNF06 | Não se aplica: propriedade de segurança | Não se aplica | Não se aplica | `hashPassword` e `verifyPassword`, usados por `authService` e `usuarioService` | `passwordHash` (fora do recorte do RF06) | `User (password)` | `DER-Usuario-Tema` | CT-RNF06-01 (Reprovado por inspeção) | Reprovado |

---

## 14. Entrega final

A apresentação final (aula 1, slides 16 a 18) pede o sistema final, um manual de utilização, o catálogo de todos os softwares usados e suas licenças e o repositório pronto para publicação, com a apresentação e o manual no repositório. Os documentos dessa entrega ficam em `documentos/entrega5_AF/`. Correções dos incrementos anteriores são aceitas, e a falta de correção tira nota na apresentação final.

### 14.1 Catálogo de softwares, versões e licenças (DOC-29)

O catálogo lista todos os softwares que o Better Meet usa, com a versão e a licença. Ele também é a tabela central de tecnologias e versões citada pelos RNFs e pelos demais documentos (DOC-22), para não existirem duas listas.

- **Local:** `documentos/consolidado/softwares_e_licencas.md`, atualizado no mesmo PR que acrescenta, remove ou atualiza uma dependência (GT-06 do guia de código).
- **Cobertura:** as dependências diretas (`dependencies` e `devDependencies`) de cada `package.json` de `sistema/`; as ferramentas de execução e de documentação (Node.js, npm, MySQL, Docker, PM2, Java e PlantUML); e os serviços externos (servidor de e-mail e provedor de login social).
- **Versão:** a versão resolvida no lockfile do commit informado no cabeçalho, e não a faixa do `package.json`.
- **Licença:** o campo `license` do `package.json` do pacote instalado (`node_modules/<pacote>/package.json`) ou o arquivo de licença do projeto; para ferramentas e serviços, a página oficial. Licença ausente ou não identificada fica `[A CONFIRMAR]`.
- **Restrição da disciplina:** todas as tecnologias são gratuitas, e nenhuma pode exigir assinatura, mesmo que gratuita (aula 1, slide 19).

A tabela mostra as colunas do catálogo, com três linhas conferidas em 2026-11-20 no commit `704478f`.

| Software | Versão | Licença | Uso no projeto | Subsistema | Fonte da licença |
|---|---|---|---|---|---|
| `expo` | 58.0.25 | MIT | SDK do aplicativo | `better-meet` | `node_modules/expo/package.json` |
| `zustand` | 5.0.15 | MIT | Estado global do aplicativo | `better-meet` | `node_modules/zustand/package.json` |
| `express` | 5.2.1 | MIT | Servidor HTTP da API de Dados | `api` | `node_modules/express/package.json` |

### 14.2 Repositório pronto para publicação (DOC-30)

O repositório é entregue como um projeto open-source que outra pessoa consegue entender, instalar e executar. A lista abaixo é o mínimo.

- `README.md` da raiz com a descrição do Better Meet, a arquitetura (subsistemas), os requisitos de ambiente (com as versões do catálogo), a instalação, a configuração (`.env` a partir do `.env.example`), a execução e os testes de cada subsistema, e os links para o manual, a documentação e os guias.
- `LICENSE` na raiz, com a licença escolhida pela equipe, compatível com as licenças do catálogo (o sistema é gratuito e open-source, aula 1, slide 22).
- `.env.example` em cada subsistema, com valores fictícios (EX-13 do guia de código); nenhum `.env` real, segredo, token, senha ou dado pessoal versionado.
- Nenhum arquivo gerado versionado: `node_modules`, builds, caches e arquivos temporários.
- Guias de padrão sem listas de pendências; as pendências ficam no `RELATORIO_BUGS.md`.
- Apresentação final e manual de utilização em `documentos/entrega5_AF/` (aula 1, slide 17).
- Links do README e dos documentos conferidos.
- Atualização que preserva os dados existentes, sem exigir novo setup (aula 1, slide 13; PR-07 do guia de código).

### 14.3 Manual de utilização (DOC-31)

A Di3 criticou a palavra "Site" na mensagem de boas-vindas e disse que o ideal era o manual dentro do aplicativo, e não um PDF externo, porque facilita a manutenção e segue a interface que a pessoa está usando (sistema, tema e fonte).

- O manual é escrito para quem usa o aplicativo, e não para a equipe.
- O conteúdo do manual fica dentro do aplicativo (RN-20 do guia de código), e a fonte desse conteúdo fica versionada no repositório. A pasta `documentos/entrega5_AF/` registra onde está a fonte e como exportar o PDF opcional.
- O texto usa vocabulário de aplicativo (NM-02 do guia de código): "aplicativo", "tela" e "tocar"; nunca "site", "página" ou "clicar".
- Há uma seção por funcionalidade, com o nome do RF correspondente, os passos numerados e o resultado esperado. Capturas de tela, quando usadas, estão atualizadas e não mostram dados pessoais reais.
- O manual tem registro de testes próprio (`testes_manual_<assunto>.md`), que confere cada passo no aplicativo em Android e em iOS.

### 14.4 Arquitetura simples, ordenada e com versões (DOC-33)

Na AP, a proposta de arquitetura foi considerada "complexa", com a "ordem de operações errada entre app e site" e sem as versões definidas. O documento de arquitetura (`documentos/entrega5_AF/arquitetura.md`) segue estas regras:

- **Visão geral enxuta:** um diagrama de componentes com até cerca de 8 elementos (aplicativo, painel web, API de Dados, API de Monitoramento, servidor de gestão, bancos). Cada elemento tem uma frase e a tecnologia com a **versão do catálogo** (DOC-29). Tecnologia sem versão não entra.
- **Detalhes separados:** o que não cabe na visão geral (rotas, tabelas, portas, variáveis de ambiente) fica em seções à parte, citando o diagrama.
- **Ordem das operações conferida:** o fluxo entre aplicativo, painel web e APIs é mostrado em um diagrama de sequência com as chamadas **numeradas na ordem em que acontecem no código**, no formato do DOC-18. Cada número é conferido no código e a ordem é a do `server.ts`, dos middlewares e dos services, não a que a equipe imagina.
- Um fluxo para o aplicativo e outro para o painel web, porque os dois chamam as APIs de formas diferentes.

O modelo abaixo mostra a visão geral, com nomes fictícios; substitua-os pelos componentes reais.

```text
@startuml DC-Arquitetura
!include ../estilo-diagramas.iuml
title Visão geral da arquitetura

component "Aplicativo
(tecnologia e versão)" as App
component "API de Dados
(tecnologia e versão)" as Api
database "Banco principal
(tecnologia e versão)" as Db

App --> Api : 1. HTTPS
Api --> Db : 2. SQL
@enduml
```

---

## 15. Críticas do professor

Estas são as regras para não repetir as críticas já recebidas. A tabela liga cada crítica, com a entrega em que apareceu, à regra que a evita.

| Item | Entrega | Problema criticado | Como evitar | Regra |
|---|---|---|---|---|
| Casos de uso | Di1, Di2 | Fluxogramas no lugar de UML; "autores"; atores indefinidos | UML em PlantUML, com tabela de atores | DOC-10, DOC-11, DOC-15 |
| Casos de uso | Di1 | Herança entre usuário e administrador em um diagrama e não em outro | Hierarquia única no catálogo, igual em todos os diagramas | DOC-10 |
| Casos de uso | Di3 | Muitas associações comuns a vários usuários; Facilitador da comissão não identificado | Ator geral do catálogo; todos os papéis com permissão; até cerca de 10 casos de uso por diagrama | DOC-10, DOC-15 |
| Requisitos funcionais | Di1, Di2 | Entradas e ações vagas, sem tabela nem tipo | Campos com tipos, rotas, tabelas e respostas reais | DOC-14 |
| Requisitos funcionais | Di3 | RF confundido com caso de uso | Um RF por caso de uso, só com o formulário padrão, sem ficha separada | DOC-14, DOC-17 |
| Requisitos funcionais | Di3 | "O mesmo", tabela sem texto, linguagem informal ("Se passar, chama") | Redação formal e autossuficiente | DOC-26 |
| Sequência | Di1, Di2 | Mensagens narrativas, sem classe, método nem argumento; sem padrão | Participantes e operações do diagrama de classes; estilo comum | DOC-18, DOC-28 |
| Sequência | Slides | Diagrama de sequência de todos os requisitos | Pelo menos uma sequência por RF | DOC-18 |
| Classes | Di1, Di2 | Diagrama fora da UML, simples demais, com classes que não existem no código | Classes da implementação, conferidas no código | DOC-19 |
| Classes | Di1 | Classes diferentes das usadas nas sequências | Mesmas classes nos dois diagramas | DOC-18, DOC-19 |
| Classes | Di3 | Vários diagramas sem o mesmo padrão; membros sem explicação | Diagrama consolidado; estilo comum; dicionário de classes membro a membro | DOC-19, DOC-27, DOC-28 |
| Relacional | Di1, Di2 | Só o banco de monitoramento; diagrama do incremento ausente | Banco principal; recorte do DER em toda entrega | DOC-20 |
| Relacional | Di3 | Misturado com as classes; colunas sem significado; FK sem origem e em notação de objeto | Arquivos separados; descrição por coluna; restrições em notação relacional | DOC-20, DOC-21 |
| Dicionário | Di1 | Incompleto ou ausente | Uma linha por coluna, completa | DOC-21 |
| RNF | Di1 | Vagos, misturados com RF, sem versão; 15 segundos para carregar uma tela | Categoria da aula 1; métrica realista; versão do catálogo | DOC-22, DOC-29 |
| Segurança | Di1 | Termos imprecisos como "hash-256" | Algoritmo, biblioteca e configuração reais | DOC-22 |
| Documentos | Di1 | Falta de padronização; sem versões | Cabeçalho com versão e histórico; estilo comum | DOC-12, DOC-28 |
| Testes | Di1 | Testes não documentados; sem plano de testes | Plano antes do registro; resultado e evidência | DOC-23 |
| Manual | Di3 | "Site" na mensagem de boas-vindas; manual fora do aplicativo | Vocabulário de aplicativo; manual dentro do app | DOC-31 |
| Análise de mercado | AP | Pontos fracos da interface sem mostrar o problema | Captura, passos e origem de cada ponto fraco | DOC-32 |
| Arquitetura | AP | Proposta complexa; ordem de operações errada entre app e site; versões não definidas | Visão geral enxuta; sequência numerada conferida no código; versões do catálogo | DOC-33, DOC-29 |
| Padrões de programação | AP | Faltaram situações do dia a dia e detalhes de implementação | Receitas e exemplos reais no guia de código | GT-07 do guia de código |
| Projeto de testes | AP | Genérico, sem detalhes e sem ferramentas | Ferramentas com versão, configuração, convenções e exemplos | DOC-23, GT-04 |
| RNF | AP | Escrita simples, sem versões; RNF07 não era não funcional | Todos os campos, métrica numérica, versão e teste de classificação | DOC-22 |
| Entrega final | Slides | Manual, catálogo de softwares e licenças, repositório pronto para publicação | Regras da seção 14 | DOC-29, DOC-30, DOC-31 |

---

## 16. Checklist de revisão

- [ ] Cabeçalho completo, com versão, branch e commit do código consultado; histórico de revisões no fim.
- [ ] Todo ponto fraco ou problema com evidência, passos para reproduzir e origem (DOC-32).
- [ ] Cada RNF com todos os campos, métrica numérica e versão, depois do teste de classificação RF/RNF (DOC-22).
- [ ] Plano de testes com ferramenta, versão, configuração e exemplo por tipo (DOC-23).
- [ ] Arquivo em `documentos/entregaN_<sigla>/`, com o nome no padrão; documentos consolidados atualizados quando o incremento os altera; Wiki publicada a partir da fonte.
- [ ] Identificadores novos sem repetir número; título do RF com o número do UC; índice de RF e RNF atualizado.
- [ ] Implementado, parcial, planejado e não verificado estão separados; divergências registradas.
- [ ] Redação formal; nenhum "O mesmo", "Idem" ou equivalente; parágrafo antes de cada tabela e de cada diagrama.
- [ ] Atores do catálogo, com todos os papéis que têm permissão; nenhum ator sem papel no código; generalização só nas condições do DOC-10 e igual em todos os diagramas.
- [ ] Diagrama de casos de uso em UML, com até cerca de 10 casos de uso, atualizado em vez de duplicado.
- [ ] Cada elipse tem o seu RF, e a tabela de auditoria está completa.
- [ ] `include`, `extend` e generalizações explicados e semanticamente válidos.
- [ ] RFs só com os campos do formulário padrão, na ordem, com tipos, tamanhos, componentes, rotas, tabelas, mensagens e desvios.
- [ ] Pelo menos uma sequência por RF; participantes e operações presentes no diagrama de classes.
- [ ] Diagrama de classes da implementação, como recorte do consolidado, com o dicionário de classes membro a membro.
- [ ] Diagrama relacional separado das classes, com o recorte do incremento; dicionário com o significado de cada coluna e restrições em notação relacional.
- [ ] Todos os diagramas em PlantUML, com o estilo comum incluído, `.puml` e `.svg` versionados e nenhum bloco Mermaid.
- [ ] SVG conferidos no GitHub e na Wiki.
- [ ] RNFs mensuráveis, na categoria da aula 1, com as versões do catálogo.
- [ ] Plano de testes antes do registro; testes com ID `CT-…`, como rodar, resultado e evidências, ou `Não executado`; aparelho registrado nos testes manuais.
- [ ] Matriz de rastreabilidade sem RF solto.
- [ ] Nenhum segredo, credencial ou dado pessoal desnecessário.
- [ ] Pendências e limitações registradas.
- [ ] Na entrega final: catálogo de softwares e licenças, README, LICENSE, manual, arquitetura (DOC-33) e apresentação no repositório (seção 14).
- [ ] Trabalho com IA conduzido pelo AI-DLC v1: documento oficial em `documentos/`, `aidlc-state.md` e `audit.md` do app atualizados, etapas aprovadas e nenhum fato tirado só do `aidlc-docs/` (DOC-25).
