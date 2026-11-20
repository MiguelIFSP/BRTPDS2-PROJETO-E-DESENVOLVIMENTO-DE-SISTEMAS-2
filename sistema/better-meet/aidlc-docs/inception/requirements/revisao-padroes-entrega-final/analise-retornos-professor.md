- **Incremento:** Apresentação final (AF) — entrega em 2026-11-27, às 18:00
- **Escopo:** propostas de alteração em GUIA_DE_CODIFICACAO.md, PROMPT_AGENTES_IA.md, GUIA_DE_DOCUMENTACAO.md e PROMPT_DOCUMENTACAO_IA.md
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** 704478f15192f757223c1efce99f43a7a411888c
- **Data de revisão:** 2026-11-20
- **Responsável(eis):** [nome de quem revisa e aprova]
- **Estado:** Proposta — aguardando as respostas do [arquivo de perguntas](requirement-verification-questions.md)
- **Fontes:** retornos do professor (texto colado e captura da Di3, registrados no [audit.md](../../../audit.md)); slides aula1.pptx, aula1-revisao.pptx, aula 2.pdf, aula3.pptx e aula4.pptx; os quatro arquivos de padrão; [verificação no código](../../../construction/revisao-padroes-entrega-final/verificacao_codigo.md); [RELATORIO_BUGS.md](../../../../../../RELATORIO_BUGS.md); amostra de `documentos/entrega4_Di3/`.

# Análise dos retornos do professor × padrões do projeto

Esta é a etapa Requirements Analysis do AI-DLC v1, na profundidade Standard. O documento converte os retornos e os slides em uma lista única, confere o que os padrões atuais já cobrem e propõe as alterações. As propostas só serão escritas nos arquivos depois das respostas às perguntas e das aprovações das etapas seguintes.

## 1. Intenção do pedido

A tabela resume como o pedido foi entendido.

| Item | Análise |
|---|---|
| Pedido | Verificar se os padrões de código e de documentação precisam mudar por causa dos retornos do professor e propor as alterações nesses arquivos. Sem código e sem documentação de entrega nesta unidade |
| Tipo | Melhoria (enhancement) de artefatos de processo |
| Escopo | Os quatro arquivos de padrão na raiz do repositório. O pedido cita `GUIA_DE_DOCUMENTACAO.md` também como padrão de código; foi assumido o `GUIA_DE_CODIFICACAO.md`, que o `PROMPT_AGENTES_IA.md` resume e com o qual muda junto (GT-03) |
| Complexidade | Moderada: 54 retornos, 13 exigências dos slides e quatro conflitos entre as regras atuais e o retorno da Di3 |
| Profundidade | Standard ("fluxo médio") |
| Prazo | Entrega e apresentação em 2026-11-27 (aula 1, slide 17). Os slides dizem que correções dos incrementos anteriores são permitidas e que a falta de correção tira nota na apresentação final (aula 1, slide 18) |

## 2. Conclusão

Os padrões precisam mudar. Os problemas encontrados são de três tipos:

1. **Conflitos.** Algumas regras atuais produziram exatamente o que o professor criticou na Di3:
   - DOC-14 e DOC-17 criam um RF ampliado e, separado dele, uma ficha para cada caso de uso. O professor pede **"Descrição de cada caso de uso como um requisito funcional (utilizar apenas o formulário padrão)"** (aulas 2, 3 e 4) e criticou que "os requisitos estão se confundindo com os casos de uso".
   - DOC-10 proíbe generalização entre atores e manda ligar cada perfil por uma linha própria. Isso gerou "muitos acessos comuns a vários usuários".
   - DOC-19 e a regra 16 do prompt deixam services e controllers fora do diagrama de classes, mas o modelo de sequência (DOC-18) os usa como participantes. O professor pediu que "Diagrama de Classe e de Sequencia tem que ter as mesmas classes". O exemplo de classes do guia é um modelo de persistência quase igual ao diagrama relacional, o que gerou "misturado com o diagrama de classes".
   - Os exemplos do próprio guia usam "chama" em todo o passo a passo e a notação `PasswordResetToken.userId → User.id`, os dois formatos criticados na Di3.
2. **Lacunas.** Vários retornos não têm regra correspondente: proteção da API, verificação de e-mail, ciclo de vida e janelas de horário, limpeza do erro do campo, datas no passado, convenções de aplicativo, navegação "Voltar", manual dentro do app, SDK atualizado antes da entrega, plano de testes, dicionário do diagrama de classes, estilo único de diagramas, catálogo de softwares e licenças e repositório pronto para publicação.
3. **Desatualizações.** Dos avisos de "Divergência atual" do guia de codificação, 16 já foram resolvidos no código, 4 estão parciais e 10 continuam válidos (veja a [verificação](../../../construction/revisao-padroes-entrega-final/verificacao_codigo.md)).

Vários retornos são correções de funcionalidade (por exemplo, tipo de votação, voto nulo, relatório de reuniões do usuário). Os padrões não os resolvem sozinhos. A seção 7 lista esses itens para que não se percam.

## 3. Inventário dos retornos

Cada retorno recebeu um identificador F. A coluna "Cobertura" diz se o padrão atual já trata o assunto: **Coberto**, **Parcial**, **Não coberto** ou **Conflito** (a regra atual leva ao problema). A coluna "Proposta" aponta para a seção 6; "Seção 7" indica correção funcional fora desta unidade.

### 3.1 Di1 — retorno escrito sobre o aplicativo

Os retornos abaixo tratam do código e da interface da primeira entrega com código.

| ID | Retorno | Cobertura | Proposta |
|---|---|---|---|
| F01 | Ícone, nome e splash incompatíveis com o aplicativo | Coberto (RN-18); o `app.json` atende | — |
| F02 | Rever a biblioteca de ícones | Coberto (RN-17); o código atende | — |
| F03 | A API deve ser mais protegida | Parcial (EX-07 a EX-14); faltam cabeçalhos de segurança, CORS restrito, limite de tentativas e limite do corpo | P-C01 |
| F04 | Verificar a possibilidade de incrementar as formas de acesso | Não coberto | P-C04 (pergunta 8) |
| F05 | Verificar o cadastro de e-mail | Não coberto | P-C03 (pergunta 7) |
| F06 | Nome não deveria ser login | Coberto (EX-17); o código ainda diverge | Seção 7 |
| F07 | Permitir solicitar acesso a uma organização | Funcional | Seção 7 |
| F08 | Recuperação de senha insegura | Coberto (EX-14); o código ainda diverge | P-C02 (pergunta 6) |
| F09 | Ocultar o ID do usuário e melhorar a adição de pessoas na comissão | Coberto (UI-08); o perfil ainda mostra o id | Seção 7 |
| F10 | Rever a necessidade de mais de um administrador por comissão ou organização | Regra de negócio | Seção 7 |
| F11 | Falta de padrão nas interfaces | Coberto (UI-01 a UI-05) | P-C10 |
| F12 | Painel de administração com mais opções e acessado pelo aplicativo | Funcional | Seção 7 |
| F13 | Exclusão de administrador deixa o sistema sem administrador | Coberto para `Role.ADMIN` (EX-18), que o código já atende; não cobre organização e comissão | P-C05 |
| F14 | Interface deve parecer aplicativo, não site | Parcial | P-C10, P-C13 |
| F15 | Levantamento feito sem pesquisa de mercado | Etapa AP, já avaliada | Seção 7 |

### 3.2 Di1 — retorno escrito sobre a documentação

Os retornos abaixo tratam da documentação da Di1.

| ID | Retorno | Cobertura | Proposta |
|---|---|---|---|
| F16 | Casos de uso sem padrão; herança entre usuário e administrador em um diagrama e não em outro; diagramas que não são UML | Coberto (DOC-10, DOC-15), mas a solução adotada gerou o F51 | P-D03 |
| F17 | Diagrama de classes que não é UML; dicionário não feito | Parcial: DOC-19 não tem dicionário do diagrama de classes | P-D05, P-D06 |
| F18 | Relacional só dos sistemas de monitoramento | Coberto (DOC-20) | — |
| F19 | RNF mal detalhados, sem versões, alguns funcionais, "hash-256", 15 s para carregar uma tela | Coberto (DOC-22); as categorias diferem das do professor | P-D10 |
| F20 | RF simples; sequência sem classe, método e argumento; sequências sem padrão | Coberto (DOC-14, DOC-18); falta estilo único | P-D01, P-D07, P-D09 |
| F21 | Rever os padrões de nomenclatura e programação da 1ª entrega | Coberto: os guias substituem os padrões da AP | Seção 7 |
| F22 | Testes realizados não documentados | Coberto (DOC-23) | P-D11 |

### 3.3 Di1 — anotações da apresentação

Os retornos abaixo vêm das anotações feitas durante a apresentação da Di1.

| ID | Retorno | Cobertura | Proposta |
|---|---|---|---|
| F23 | Falta de padronização na documentação | Parcial | P-D01, P-D07 |
| F24 | Descrição de requisitos muito simples | Coberto (DOC-14) | P-D01 |
| F25 | RNF não verificáveis ou que são RF | Coberto (DOC-22) | P-D10 |
| F26 | Colocar versões nas docs | Parcial: versões de tecnologia (DOC-22); o documento não tem versão própria | P-D12 (pergunta 11) |
| F27 | Diagrama de classes e de sequência com as mesmas classes | **Conflito** com DOC-19 e a regra 16 do prompt | P-D05 (pergunta 3) |
| F28 | Faltou plano de testes | Parcial: DOC-23 registra a execução, não o plano | P-D11 (pergunta 10) |
| F29 | App não salva sessão | Coberto (ZS-01, ZS-02); a sessão expirada não leva ao login | P-C12 |
| F30 | App parecia site | Igual ao F14 | P-C10 |
| F31 | Cara de Android ou iOS, ou identidade própria | Parcial: há design system próprio, sem regra de convenções de plataforma | P-C10 |
| F32 | Padronizar a interface | Coberto (UI-04, UI-05) | P-C17 (lista de componentes desatualizada) |

### 3.4 Di2 — aplicativo

Os retornos abaixo tratam das telas de reunião, convite e presença.

| ID | Retorno | Cobertura | Proposta |
|---|---|---|---|
| F33 | Tela de criação e edição de reunião muito grande | Não coberto | P-C10 |
| F34 | Reunião sem outros participantes além do presidente | Regra de negócio | Seção 7 |
| F35 | Erros dos campos não são limpos depois do preenchimento | Não coberto | P-C09 |
| F36 | Reunião com início e término no passado | Não coberto | P-C08 |
| F37 | Compartilhar arquivos para os participantes | Funcional | Seção 7 |
| F38 | Não dá para mudar a resposta ao convite nem reenviar convite recusado | Ciclo de vida e funcional | P-C06; seção 7 |
| F39 | Entrada e saída só com um toque; biometria; garantir presença; presidente marcar; entrada e saída antes do início | Ciclo de vida e decisão | P-C06, P-C04 (pergunta 8); seção 7 |
| F40 | Tela própria de lista de presença, com horários e exportação em PDF | Funcional | Seção 7 |
| F41 | Desconto: Expo desatualizado (57.0.30 para 57.0.31) | Não coberto: a RN-19 trata migração de SDK, não atualização de patch | P-C15 |

### 3.5 Di2 — documentação

Os retornos abaixo tratam da documentação da Di2.

| ID | Retorno | Cobertura | Proposta |
|---|---|---|---|
| F42 | Não é diagrama de casos de uso; atores não detalhados; "autores" | Coberto (DOC-10, DOC-11, DOC-15) | P-D03 |
| F43 | Diagrama de classes muito simples; classes inexistentes no código; explicar cada classe | Parcial | P-D05, P-D06 |
| F44 | Diagrama relacional do incremento não encontrado | Coberto (DOC-13, item 7) | P-D08 |
| F45 | RF simples: entrada e ação sem tabela e sem tipos; mensagens de sequência inválidas ("Registrar convites pendentes"); classes erradas | Coberto (DOC-14, DOC-18) | P-D01, P-D05 |

### 3.6 Di3 — aplicativo (captura de tela)

Os retornos abaixo tratam de ata, votação, relatório individual e manual.

| ID | Retorno | Cobertura | Proposta |
|---|---|---|---|
| F46 | Ata exportada antes da aprovação; voto na ata só depois do presidente; aprovação alterada depois da impressão | Ciclo de vida | P-C06; seção 7 |
| F47 | Votação: sem tipo aberta ou fechada; sem voto nulo; resultado em tempo real; troca de voto sem opção; voto sem entrar ou depois de sair; quem votou sempre visível ao presidente; sem relatório; troca depois do término | Ciclo de vida, privacidade e funcional | P-C06, P-C07; seção 7 |
| F48 | "Voltar" de "Ver comissões" ou "Ver organizações" fora do fluxo; sem relatório das reuniões do usuário | Navegação e funcional | P-C11; seção 7 |
| F49 | "Site" na mensagem de boas-vindas; manual deveria ficar dentro do aplicativo, não em PDF externo | Não coberto | P-C13, P-C14 (pergunta 9) |
| F50 | Migração para o Expo 58 aprovada | — | — |

### 3.7 Di3 — documentação (captura de tela)

Os retornos abaixo tratam da documentação da Di3. Eles são a referência mais recente do professor sobre a documentação.

| ID | Retorno | Cobertura | Proposta |
|---|---|---|---|
| F51 | Casos de uso com muitos acessos comuns a vários usuários; papéis não identificados (Facilitador da comissão); simplificar | **Conflito** com DOC-10 | P-D03, P-D04 (pergunta 2) |
| F52 | Os diagramas de classes deveriam ser um só ou ter o mesmo padrão; explicar cada membro da classe | Não coberto | P-D06, P-D07 (pergunta 4) |
| F53 | Relacional confuso e misturado com classes; explicar cada coluna; detalhar restrições com a origem da chave, sem notação de objeto | **Conflito** com o exemplo do DOC-21; lacuna | P-D08 |
| F54 | Requisitos confundidos com casos de uso; "O mesmo"; tabela sem texto; linguagem informal ("Se passar, chama") | **Conflito** com DOC-14, DOC-17 e os exemplos | P-D01, P-D02 (pergunta 1) |

## 4. O que os slides exigem

Os slides são o critério declarado do professor. A tabela confere cada exigência com os padrões.

| ID | Exigência | Fonte | Cobertura | Proposta |
|---|---|---|---|---|
| S01 | "Descrição de cada caso de uso como um requisito funcional (utilizar apenas o formulário padrão)" | Aulas 2, 3 e 4 | **Conflito** (DOC-14 amplia o formulário; DOC-17 cria uma ficha à parte) | P-D01 |
| S02 | Formulário padrão: Função, Descrição, Entradas, Origem, Saída, Destino, Ação, Pré-condição, Pós-condição e Efeitos colaterais (apêndice B) | Aula 1 (revisão), slide 9 | Parcial: falta "Função"; ordem e campos diferentes | P-D01 |
| S03 | "Diagrama de classes e respectivo dicionário de dados" | Aulas 2, 3 e 4 | Não coberto: o DOC-21 é só do relacional | P-D06 |
| S04 | "Diagrama relacional e respectivo dicionário de dados" | Aulas 2, 3 e 4 | Coberto (DOC-20, DOC-21) | P-D08 |
| S05 | "Diagrama de sequência de todos os requisitos" | Aulas 1 a 4 | Parcial: o DOC-18 pede um por cenário significativo | P-D09 |
| S06 | Diagramas de casos de uso e de classes atualizados a cada incremento | Aula 1, slide 14 | Não coberto: cada entrega cria diagramas próprios | P-D04, P-D06 |
| S07 | RNF de fácil verificação; classificação em produto, organizacional e externo | Aula 1 (revisão), slides 12 e 13 | Parcial: o DOC-22 usa categorias próprias | P-D10 |
| S08 | Testes: inspeção (com checklist), caminho, unidade, integração, release, desempenho e automação | Aula 1 (revisão), slide 20 | Parcial | P-D11 |
| S09 | Apresentação final: manual, catálogo de todos os softwares usados e suas licenças, repositório pronto para publicação, apresentação e manual no repositório | Aula 1, slides 16 e 17 | Não coberto | P-D13, P-D14, P-C16 |
| S10 | Tecnologias gratuitas e sem assinatura | Aula 1, slide 19 | Não coberto | P-C16 |
| S11 | Correções dos incrementos são aceitas; sem correção, perde nota na final | Aula 1, slide 18 | — | Seção 7 |
| S12 | Atualização preserva os dados; reiniciar a configuração perde pontos | Aula 1, slide 13 | Coberto (PR-07) | — |
| S13 | Android e iOS; gratuito e open-source; segurança no armazenamento e no acesso | Aula 1, slides 22 e 23 | Parcial: sem `LICENSE`; segurança nos F03, F05 e F08 | P-D13, P-C01 |

## 5. Inconsistências internas dos padrões

A leitura completa dos quatro arquivos encontrou estes problemas, independentes dos retornos.

| ID | Problema | Onde | Proposta |
|---|---|---|---|
| I01 | Os exemplos do guia de documentação usam "chama" no passo a passo do RF06 e a FK `PasswordResetToken.userId → User.id`, os formatos criticados na Di3 | GUIA_DE_DOCUMENTACAO.md, seções 6.1, 7.3 e 10.2 | P-D15 |
| I02 | O exemplo de diagrama de classes é um modelo de persistência quase igual ao DER da seção 10.1 | GUIA_DE_DOCUMENTACAO.md, seções 9.1 e 10.1 | P-D05, P-D08 |
| I03 | A regra 16 manda não desenhar services e controllers como classes, mas o modelo de sequência os usa como participantes | PROMPT_DOCUMENTACAO_IA.md, regras 15 e 16; guia, seções 8.1 e 9.1 | P-D05 |
| I04 | 16 avisos de "Divergência atual" já foram resolvidos no código | GUIA_DE_CODIFICACAO.md | P-C17 (pergunta 5) |
| I05 | As regras do prompt aparecem na ordem 1–76, 81–82, 83–90 e 77–80 | PROMPT_AGENTES_IA.md | P-C18 |
| I06 | A tabela de componentes base não lista componentes que já existem e são usados (`Avatar`, `Badge`, `BottomSheet`, `Chip`, `PersonPickerSheet`, `DetailHeader`, `SectionLabel` e outros) | GUIA_DE_CODIFICACAO.md, UI-04 | P-C17 |
| I07 | GT-03 prevê `sistema/AGENTS.md` e `sistema/CLAUDE.md`, que não existem; RN-01 e a regra 49 ainda citam a v57 no `AGENTS.md` do `web` | GUIA_DE_CODIFICACAO.md; PROMPT_AGENTES_IA.md | P-C17 |

## 6. Propostas de alteração

As propostas abaixo são o conteúdo que será escrito nos arquivos, depois das respostas e das aprovações. Regras novas recebem os próximos números livres: DOC-26 em diante no guia de documentação, regra 26 em diante no prompt de documentação e regra 91 em diante no prompt de código. Nenhum número existente é renumerado. Os números finais serão fixados no plano da etapa Code Generation.

### 6.1 Documentação — GUIA_DE_DOCUMENTACAO.md e PROMPT_DOCUMENTACAO_IA.md

**P-D01 — Um caso de uso, um RF no formulário padrão** (altera DOC-14, DOC-17 e as regras 11 e 14 do prompt; depende da pergunta 1)

- Cada elipse do diagrama de casos de uso tem exatamente um RF, com o mesmo nome (`RFxx — <verbo> <objeto>`). Um RF não agrupa várias ações. Por exemplo, o RF17 da Di3 reúne consultar, criar, abrir, votar, encerrar e excluir; pela regra, seriam seis RFs.
- O RF usa os campos do formulário padrão do professor, nesta ordem: Função, Descrição, Entradas, Origem, Saída, Destino, Ação, Pré-condição, Pós-condição e Efeitos colaterais. O detalhe técnico que a equipe já exige fica dentro desses campos:
  - **Entradas:** campo, tipo, tamanho ou máscara, obrigatoriedade e validação, como no exemplo do slide ("Código do cliente (8 caracteres)").
  - **Origem:** tela e elemento da interface, ou evento automático.
  - **Saída:** dados exibidos e mensagens de sucesso e de erro, com o status HTTP.
  - **Destino:** tela que recebe a saída e tabela e colunas gravadas.
  - **Ação:** passos numerados do que o ator faz e do que o sistema faz, com rotas, funções, tabelas e colunas; os desvios entram como "Caso ..., o sistema deve ...".
- A ficha separada de caso de uso (DOC-17) deixa de existir. A tabela de auditoria passa a ligar cada elipse ao seu RF.
- Status, atores, referências do código e testes saem do formulário e vão para o cabeçalho (DOC-12), a tabela de atores (DOC-11) e a matriz (DOC-24). Na variante B da pergunta 1, essas seções ficam em um bloco depois do formulário.
- A numeração continua pelo DOC-09. Dividir os RFs agrupados das entregas anteriores é trabalho de documentação, fora desta unidade.

**P-D02 — Redação formal e autossuficiente** (nova regra DOC-26; nova regra no prompt)

- Linguagem impessoal e formal: "o sistema deve ...", "caso os dados sejam validados com sucesso, é feita uma chamada para a função `votacaoService.create`".
- Tabela de substituições no guia: "passar" → "ser validado"; "chamar" → "invocar" ou "é feita uma chamada para"; "bater na rota" → "enviar uma requisição para"; "pegar" → "obter"; "jogar" ou "dar erro" → "lançar um erro" ou "falhar"; "cair no catch" → "ser tratado no bloco `catch`"; "front" e "back" → "aplicativo" e "API".
- Proibido "O mesmo", "Idem", "Igual ao anterior" e "Ver acima" em campos e células. O valor é escrito por extenso.
- Toda tabela e todo diagrama vêm depois de um parágrafo que diz o que mostram e como ler.

**P-D03 — Atores: catálogo completo e generalização com hierarquia única** (altera DOC-10, DOC-11 e as regras 9 e 10 do prompt; depende da pergunta 2)

- A proibição de generalização entre atores humanos foi uma decisão da equipe e gerou o excesso de associações criticado na Di3. A crítica da Di1 era a **inconsistência** da herança, não o seu uso.
- A generalização passa a ser permitida quando o código comprova que o ator especializado executa todos os casos de uso do ator geral. A hierarquia é definida uma única vez no catálogo, com evidência, e usada igual em todos os diagramas. Os exemplos a confirmar no código são "Membro da comissão" como ator geral de Secretário, Facilitador e Administrador da comissão, e "Usuário" como ator geral de Usuário comum e Administrador.
- O catálogo lista todos os papéis com permissão no assunto. Um papel com permissão no código não pode faltar no diagrama (o Facilitador da comissão faltou na Di3).
- Continua proibido criar ator sem papel real no código.

**P-D04 — Diagrama de casos de uso simples e atualizado por incremento** (altera DOC-15)

- Um diagrama por assunto, com até cerca de 10 casos de uso; acima disso, o assunto é dividido. A pergunta 2 define o limite.
- O diagrama de um assunto é atualizado nos incrementos seguintes, em vez de criar outro (aula 1, slide 14).
- Associação só quando o ator inicia o caso de uso ou participa dele.

**P-D05 — Classes e sequências com os mesmos elementos** (altera DOC-18, DOC-19 e as regras 15 e 16 do prompt; depende da pergunta 3)

- O diagrama de classes passa a mostrar as classes da implementação: telas, hooks, stores, services, controllers, middlewares e os tipos de domínio que aparecem nas operações.
- Services e controllers são objetos de módulo (EX-02), sem instância. No diagrama, eles aparecem como classes com estereótipo de camada (`«screen»`, `«hook»`, `«store»`, `«service»`, `«controller»`, `«middleware»`) e com as operações e assinaturas reais. A legenda do guia explica que esses estereótipos representam módulos com operações estáticas.
- Regra de consistência: todo participante de um diagrama de sequência é um ator ou uma classe do diagrama de classes, e toda mensagem técnica é uma operação dessa classe, com os mesmos argumentos. O Build and Test da documentação confere isso.
- Models e enums do Prisma ficam só no diagrama relacional (P-D08). O diagrama de classes não repete o banco.

**P-D06 — Diagrama de classes consolidado e dicionário de classes** (altera DOC-19; nova regra DOC-27; depende da pergunta 4)

- Um diagrama de classes oficial do sistema (`DC-BetterMeet.puml`), com pacotes por subsistema e camada, atualizado a cada incremento. Na opção B da pergunta 4, recortes por assunto são permitidos, com o mesmo estilo e sempre como subconjunto do oficial.
- Dicionário do diagrama de classes, membro a membro, com as colunas Classe, Membro, Tipo de membro (atributo ou operação), Assinatura ou tipo, Visibilidade, Descrição (o que representa) e Arquivo. Cada classe também tem um parágrafo com a sua responsabilidade.

**P-D07 — Estilo único para todos os diagramas** (nova regra DOC-28)

- Um arquivo de estilo comum (proposta: `documentos/Diagramas/estilo.iuml`), incluído com `!include` na primeira linha de todo `.puml`, com fonte, cores, `!pragma layout smetana` e as demais configurações.
- Mesmo título (`title`), mesma legenda de estereótipos e mesmo formato de nome de participante (`objeto:Classe` ou `:Classe`).

**P-D08 — Relacional separado e dicionário com significado** (altera DOC-20, DOC-21 e a regra 17 do prompt)

- O diagrama relacional e o seu dicionário ficam em arquivos ou seções separados do diagrama de classes e do dicionário de classes.
- Toda coluna tem uma descrição do que o valor representa no negócio. "FK" ou "identificador" sozinhos não bastam.
- As restrições são escritas em notação relacional, com a tabela de origem, a tabela referenciada e uma frase de explicação, sem notação de objeto (`Reuniao.id`, `→`). Modelo:

  | Restrição | Tipo | Tabela de origem (coluna) | Tabela referenciada (coluna) | ON DELETE | ON UPDATE | Significado |
  |---|---|---|---|---|---|---|
  | `ConviteReuniao_reuniaoId_fkey` | FK | `ConviteReuniao (reuniaoId)` | `Reuniao (id)` | `CASCADE` | `CASCADE` | Cada convite pertence a uma reunião. Ao excluir a reunião, os convites dela são excluídos |

- Todo incremento traz o diagrama relacional das tabelas que usa. Na mesma lógica da pergunta 4, um DER consolidado (`DER-BetterMeet.puml`) é o oficial.

**P-D09 — Sequência para todos os requisitos** (altera DOC-18)

- Pelo menos um diagrama de sequência por RF, além dos cenários significativos (aulas 1 a 4: "de todos os requisitos").
- Participantes no formato UML `objeto:Classe`, com a classe existente no diagrama de classes (P-D05).

**P-D10 — RNF na classificação do professor** (altera DOC-22 e a regra 12 do prompt)

- Categorias da aula 1 (revisão), slide 13: Produto (facilidade de uso, eficiência — desempenho e espaço —, confiabilidade, portabilidade), Organizacional (entrega, implementação, padrões) e Externo (interoperabilidade, ético, legal — privacidade e segurança).
- Metas de tempo compatíveis com uso em celular e justificadas. O professor considerou 15 s excessivo para carregar uma tela; o exemplo do slide usa 10 s para iniciar o sistema inteiro.
- Uma tabela central "Tecnologias e versões", copiada dos manifestos e lockfiles, referenciada pelos RNFs e documentos (atende também ao F26).

**P-D11 — Plano de testes antes do registro** (altera DOC-23 e a regra 18 do prompt; depende da pergunta 10)

- Antes de testar, um plano com escopo, tipos de teste do slide (inspeção com checklist, caminho, unidade, integração, release em Android e iOS, desempenho e automação), ambiente, aparelhos, critérios de aprovação e os casos `CT-…` planejados.
- Depois, o registro de execução atual (o que foi testado, como rodar e resultado).
- Testes manuais registram aparelho, versão do sistema operacional e build, porque o professor executa o app em Android e em iOS (aulas 2 a 4).

**P-D12 — Versão do documento** (altera DOC-12 e a regra 7 do prompt; depende da pergunta 11)

- Campo "Versão" no cabeçalho e tabela "Histórico de revisões" (versão, data, autor e alteração) no fim de cada documento.

**P-D13 — Entrega final: catálogo de softwares e licenças e repositório pronto para publicação** (novas regras DOC-29 e DOC-30)

- Catálogo de todos os softwares usados: dependências diretas de cada subsistema (nome, versão do lockfile, licença, uso e subsistema), ferramentas (Node, MySQL, Docker, PM2, PlantUML, Java) e serviços externos (servidor de e-mail). O guia define o local, as colunas e a forma de conferir a licença a partir dos `package.json` e lockfiles.
- Repositório pronto para publicação: README da raiz com descrição, arquitetura, requisitos de ambiente, instalação e execução de cada subsistema e links para o manual e a documentação; arquivo `LICENSE` (o sistema é gratuito e open-source, aula 1, slide 22); `.env.example` sem valores reais; nenhum segredo, dado pessoal, `node_modules` ou build versionado; guias sem listas de pendências (P-C17); apresentação e manual no repositório (aula 1, slide 17).
- A pasta da entrega segue o DOC-06: `documentos/entrega5_AF/`.

**P-D14 — Manual de utilização** (nova regra DOC-31; depende da pergunta 9)

- Fonte do manual versionada no repositório, escrita para o usuário final, com vocabulário de aplicativo (P-C13), uma seção por funcionalidade ligada aos RFs, e o registro de testes do manual.

**P-D15 — Exemplos, críticas e checklists atualizados** (altera as seções 4 a 15 do guia e as seções "Entrega" e "Antes de entregar" do prompt)

- Reescrever os exemplos do RF06 e do RNF06 no formulário padrão (P-D01), com redação formal (P-D02), diagrama de classes da implementação e dicionário de classes (P-D05, P-D06) e restrições em notação relacional (P-D08). O exemplo é reconferido no commit atual ou continua datado no commit `9e48774`; isso será definido no plano.
- A seção 14 ("Críticas do professor") ganha as críticas da Di2, da Di3 e dos slides.
- O checklist da seção 15 e o do prompt passam a conferir as regras novas.

### 6.2 Código — GUIA_DE_CODIFICACAO.md e PROMPT_AGENTES_IA.md

**P-C01 — EX-19: proteção da API** (F03, S13)

- Cabeçalhos de segurança com `helmet` (licença MIT, gratuito).
- CORS só para as origens da variável `CORS_ORIGINS` do `.env`. Hoje `cors({ origin: true })` aceita qualquer origem.
- Limite de tentativas (`express-rate-limit`) nas rotas públicas de login, cadastro, recuperação de senha e verificação de e-mail, com resposta 429 em pt-BR. O status 429 entra na tabela do EX-05.
- Limite de tamanho do corpo em `express.json({ limit })`.
- Toda ação sobre reunião, comissão ou organização confere no service o vínculo **atual** de quem pede. O bug 8 do relatório (pessoa removida da organização que continua agindo nas comissões) é o exemplo.
- Vale para `api`, `monitoring-better-meet` e `management-better-meet/server`.

**P-C02 — EX-14 com propriedades verificáveis** (F08; depende da pergunta 6)

- O padrão passa a exigir propriedades que podem ser conferidas, qualquer que seja a biblioteca: hash de senha com sal e fator de custo (scrypt, argon2id ou bcrypt), nunca SHA-256 simples; token de recuperação aleatório, guardado como hash, de uso único, com validade curta (proposta: até 30 minutos) e enviado só ao e-mail cadastrado; mesma resposta para e-mail cadastrado ou não; limite de tentativas (P-C01).
- Opção A da pergunta 6: o Better Auth continua obrigatório. Opção B: o Better Auth é preferido, e uma implementação com `node:crypto` (`scrypt`, `randomBytes`, `timingSafeEqual`) e a tabela `PasswordResetToken`, que já existe, é permitida se cumprir as propriedades e tiver testes.

**P-C03 — EX-21: verificação de posse do e-mail** (F05; depende da pergunta 7)

- O cadastro envia um código ou link de uso único ao e-mail, com o mesmo mecanismo de token do P-C02. A troca de e-mail no perfil também exige a confirmação do novo endereço.
- A pergunta 7 define se a conta pode usar o app antes de confirmar.

**P-C04 — Formas de acesso adicionais** (F04, F39; depende da pergunta 8)

- Opção A: nova regra para desbloqueio por biometria com `expo-local-authentication` (Expo SDK 58), opcional por pessoa e liberado só depois do login com e-mail e senha. A biometria nunca guarda nem substitui a senha na API. A mesma confirmação pode ser exigida no registro de presença.
- Opção B: login social por provedor gratuito, só se não exigir assinatura (aula 1, slide 19).

**P-C05 — EX-18 ampliado: nenhum grupo fica sem responsável** (F13)

- Além da plataforma, toda organização mantém o seu Criador e toda comissão mantém pelo menos um Administrador da comissão. Excluir a conta, sair, ser removido ou ser rebaixado exige indicar quem assume, na mesma transação, ou é recusado com 409. A regra registra o comportamento que a exclusão de conta já tem e se aplica também à remoção de membro da organização.

**P-C06 — EX-20: ciclo de vida e janelas de horário validados na API** (F34, F36, F38, F39, F46, F47)

- Toda entidade com ciclo de vida (reunião, convite, presença, votação, voto e ata) tem os estados como enum no schema (PR-06) e as transições permitidas comentadas no schema (PR-09) e descritas na documentação.
- O service confere o estado e o horário antes de cada ação, com o relógio do servidor no fuso `TZ_REUNIOES`, e recusa com 409 (o estado não permite a ação) ou 410 (encerrado). Os casos apontados pelo professor servem de exemplo: entrada e saída fora do horário da reunião, voto de quem não registrou entrada ou já saiu, alteração depois do encerramento da reunião ou da aprovação e exportação da ata.
- O app só reflete a regra (esconde ou desabilita o botão). A decisão é da API, como na RN-16.
- Toda transição recusada tem teste (GT-04).

**P-C07 — PR-05 ampliado: só os dados que o papel pode ver** (F47)

- A resposta traz apenas o que o papel de quem pede pode ver. Exemplo: em votação secreta, nenhuma rota devolve a ligação entre voto e pessoa, nem ao Administrador da comissão; só os totais.

**P-C08 — YP-05: datas e horários** (F36)

- Regras de data compartilhadas no `commonSchema.ts` dos três pacotes: início no futuro e término depois do início. A comparação é feita no fuso `TZ_REUNIOES` (bug 6 do relatório). O app e a API validam.

**P-C09 — Erro do campo some ao corrigir** (F35; altera YP-04 e RN-11)

- Ao alterar um campo, o erro dele é removido no handler de alteração, sem esperar um novo envio. O modelo é o `clearFieldError` de `(reunioes)/index.tsx`; o plano define se o comportamento vai para um hook comum ou para o `TextField`.

**P-C10 — UI-09: convenções de aplicativo móvel** (F11, F14, F30, F31, F33)

- Uma tarefa por tela: criar e editar abrem uma tela própria na pilha da aba, ou etapas, e não um formulário embutido na lista. Formulário com mais de cerca de seis campos é dividido em etapas ou seções.
- A ação principal fica visível sem rolar. Área de toque de pelo menos 44 px (RN-08).
- Seletores nativos para data e hora (`PickerField`); teclado adequado a cada campo (`keyboardType`, `autoComplete`, `textContentType`); o "próximo" do teclado leva ao campo seguinte.
- Listas com puxar para atualizar e estado vazio com orientação; carregamento com indicador, nunca tela em branco.
- Nenhum padrão de site: link sublinhado no meio do texto para navegar, menu no topo, efeito só de hover, rodapé de página, "clique aqui".
- Identidade própria do Better Meet, igual em Android e iOS, respeitando as convenções de cada sistema: botão Voltar do Android, gesto de voltar do iOS e área segura.

**P-C11 — Navegação: "Voltar" retorna à origem** (F48; nova regra RN)

- Atalhos que levam a uma tela de outra aba ("Ver comissões") abrem a tela de forma que o "Voltar" devolva a pessoa à tela de origem. Todo atalho entre abas tem o "Voltar" conferido no botão do Android e no gesto do iOS, e isso entra no checklist de testes manuais.

**P-C12 — Sessão expirada leva ao login** (F29; altera RN-05)

- `apiRequest` trata a resposta 401 de uma requisição com token chamando `useAuthStore.getState().logout()`, e o `AppGate` leva ao login com aviso. As telas não tratam 401 uma a uma (bug 7 do relatório).

**P-C13 — Vocabulário de aplicativo** (F49, F14; altera NM-02)

- "aplicativo" ou "app", e não "site"; "tela", e não "página"; "tocar", e não "clicar". Vale para textos de tela, mensagens, acessibilidade e manual.

**P-C14 — Ajuda e manual dentro do aplicativo** (F49, S09; nova regra RN; depende da pergunta 9)

- Opção A: o manual é uma área do app (por exemplo, aba Mais → Ajuda), montada com os componentes base e o tema (UI-04, UI-05), e o conteúdo fica versionado no repositório. O PDF pode continuar como exportação opcional.

**P-C15 — SDK atualizado antes de cada entrega** (F41; altera RN-01 e RN-19)

- Antes de cada entrega, nos dois apps: `npx expo install --check` sem atualização de patch pendente e `npx expo-doctor` sem falhas. O resultado vai para o registro de testes da entrega.

**P-C16 — GT-06: dependências gratuitas e com licença registrada** (S09, S10)

- Toda dependência ou serviço novo é gratuito, sem assinatura (aula 1, slide 19), com licença compatível com projeto open-source, e é registrado no catálogo de softwares (P-D13) no mesmo PR. Nos apps, a instalação é feita com `npx expo install`.

**P-C17 — Avisos de divergência fora dos guias** (I04, I06, I07; depende da pergunta 5)

- Opção A: retirar dos dois guias e do prompt todos os avisos "Divergência atual" e "Situação atual". Os 14 que ainda valem ou estão parciais vão para o `RELATORIO_BUGS.md` (ou para issues), cada um com a regra violada. Os guias descrevem só o padrão.
- Opção B: manter os avisos nos guias, apagando os resolvidos e atualizando os demais.
- Nas duas opções: atualizar a tabela de componentes base (UI-04) com os componentes existentes e corrigir GT-03, RN-01 e a regra 49.

**P-C18 — Ordem das regras no PROMPT_AGENTES_IA.md** (I05)

- Mover a seção "Git, agentes de IA e testes" (regras 77 a 80) para antes de "Atualização de SDK do Expo" (81 e 82), deixando a numeração crescente, sem renumerar. As regras novas (P-C01 a P-C16) entram a partir da 91, e o checklist "Antes de entregar" é atualizado.

## 7. Fora do escopo desta unidade

Os itens abaixo não são resolvidos pela alteração dos padrões. Eles ficam registrados para as próximas unidades, que podem ser de código ou de documentação.

### 7.1 Correções no aplicativo e na API

A tabela lista as correções e a regra que passará a orientá-las.

| Retorno | Correção | Regra que orienta |
|---|---|---|
| F06 | Login só por e-mail | EX-17 |
| F08 | Recuperação de senha com token | EX-14 (P-C02) |
| F09 | Tirar o "ID do usuário" do perfil | UI-08 |
| F07, F10, F12 | Pedido de acesso à organização; quantidade de administradores; painel de administração no app | Decisões de requisito |
| F34 | Exigir ao menos um convidado além do Administrador da comissão | Regra de negócio no service |
| F37, F40 | Anexos na reunião; tela de lista de presença com horários e PDF | Funcionalidades novas |
| F38, F39 | Mudar a resposta ao convite e reenviar convite; janela de entrada e saída; marcação pelo Administrador da comissão; biometria | EX-20 (P-C06), P-C04 |
| F46 | Exportar a ata só depois de aprovada; votação da ata independente do presidente; aprovação imutável depois da exportação | EX-20 |
| F47 | Votação aberta ou secreta, voto nulo, resultado parcial opcional, troca de voto opcional, voto só de quem está presente, nada depois do encerramento, relatório da reunião | EX-20, PR-05 (P-C06, P-C07) |
| F48 | "Voltar" dos relatórios; relatório das reuniões de que a pessoa participou | P-C11 |
| F49 | Trocar "site" por "aplicativo" em `PrimeiroAcessoDialog.tsx:109`; manual no app | P-C13, P-C14 |
| RELATORIO_BUGS.md | Itens 1 a 11 (o item 1 está parcialmente corrigido) | Diversas |

### 7.2 Documentação

- Refazer a documentação das entregas Di1 a Di3 pelos padrões aprovados: RFs no formulário padrão (um por caso de uso), diagramas de casos de uso, diagrama de classes e dicionário de classes consolidados, DER e dicionário relacional separados, sequências, plano de testes, catálogo de softwares e licenças, e manual.
- Indicar nos documentos da 1ª entrega (`padroes_interface_e_nomenclatura.md` e `plano_de_testes.md`) quais seções foram substituídas pelos guias (F21).
- F15 (pesquisa de mercado): a avaliação já foi feita na AP; não cabe regra nova. A introdução do README pode apontar para ela.

## 8. Decisões pedidas

O [arquivo de perguntas](requirement-verification-questions.md) traz 11 decisões sobre as propostas e as 3 perguntas obrigatórias de extensões do AI-DLC. Depois das respostas, o `requirements.md` desta unidade consolida as propostas escolhidas.

## Apêndice A — Transcrição da captura da Di3

A captura de tela anexada ao pedido foi transcrita pelo agente para manter a rastreabilidade. O texto é do professor; possíveis erros de transcrição são do agente.

```text
Incremento 3 (Atividade 4)
Item Comentário
Ata de reunião Permite exportar ata antes da aprovação dela. Só consegui votar na ata depois que o presidente votou? Permite alterar a aprovação/reprovação da ata após sua impressão.
Votação Não permite escolher tipo de votação (aberta ou fechada). Não permite votos nulos. Permite ver o resultado dos votos em tempo real (poderia ser uma opção). Poderia ter opção para permitir trocar voto ou não. Permite votar sem entrar na reunião. Permite votar após sair da reunião. Sempre exibe quem votou para o presidente da comissão (se for votação fechada isso não poderia acontecer). Poderia gerar um relatório com os resultados da reunião. Permite trocar voto após término da reunião (e ata impressa).
Relatório individual Voltar de "Ver comissões" ou "Ver organizações" não segue o fluxo esperado. Não faz relatório das reuniões que o usuário participou.
Manual de utilização "Site" na mensagem de boas-vindas. Ideal era fazer o manual dentro do aplicativo, não um PDF externo, pois facilita a manutenção e pode ser feito com a interface que o usuário está usando no momento (iOS, tema, fonte, etc.)
Migração Expo 58 Ok
Descontos -

Total de código

Documentação Comentário
Diagrama de casos de uso Tem muitos acessos comuns a vários usuários, alguns nem foram identificados (Facilitador da comissão, por exemplo). Simplificar ajudaria no entendimento do diagrama.
Diagrama de classes e dicionário de dados Os diagramas de classe deveriam ser um só. Se fossem vários, deveriam ter o mesmo padrão (não tem). Deveria explicar o que cada membro da classe representa (não faz).
Diagrama relacional e dicionário de dados Está confuso e misturado com o diagrama de classes. Deveria explicar o que cada coluna de cada tabela representa. Restrições deveriam ser melhor detalhadas, por exemplo: "FK ConviteReuniao_reuniaoId_fkey reuniaoId → Reuniao.id ON DELETE CASCADE, ON UPDATE CASCADE". Não tem explicação, nem origem da chave estrangeira, que parece ser de Reunião, mas usar essa nomenclatura de objeto não é ideal.
Requisitos funcionais Os requisitos estão se confundindo com os casos de uso. Alguns campos poderiam ser melhorados ("O mesmo", por exemplo). Alguns itens tem uma tabela apenas, mas poderia ter um texto explicando a tabela. Cuidado com o texto informal. Por exemplo, "Se passar, chama votacaoService.create" ... Passar e chamar são informais. Poderia usar "Se os dados forem validados com sucesso, é feita uma chamada para a função ...".
Descontos -
```

## Apêndice B — Formulário padrão do professor

O exemplo do professor (aula 1, revisão, slide 9) mostra o formulário que as aulas 2, 3 e 4 mandam usar "apenas". A tabela reproduz os campos na ordem do slide, com o texto do exemplo.

| Campo | Exemplo do slide (RF01 – Listar Cliente) |
|---|---|
| Função | Permite a pesquisa de clientes cadastrados no sistema. |
| Descrição | Realiza a pesquisa de clientes cadastrados no sistema e os exibe de forma ordenada, de acordo com os parâmetros informados pelo usuário. |
| Entradas | Código do cliente (8 caracteres) e/ou nome do cliente (100 caracteres) e/ou CPF (formato 000.000.000-00). |
| Origem | (vazio no exemplo) |
| Saída | Listagem de clientes que satisfazem os parâmetros informados: código do cliente (8 caracteres) e nome do cliente (100 caracteres). |
| Destino | Tela de pesquisa. |
| Ação | O usuário indica o desejo de pesquisar um cliente, selecionando uma opção no menu principal do sistema. O sistema deve exibir então um novo formulário [...]. Ao clicar em um botão de pesquisa, o sistema deverá listar todos os clientes que satisfazem os filtros informados [...]. |
| Pré-condição | O usuário deve estar autenticado no sistema. |
| Pós-condição | O sistema deverá exibir o resultado da pesquisa na tela de pesquisa. |
| Efeitos colaterais | Nenhum. |
