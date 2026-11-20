- **Incremento:** Apresentação final (AF) — entrega em 2026-11-27, às 18:00
- **Escopo:** requisitos da unidade revisao-padroes-entrega-final
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** 704478f15192f757223c1efce99f43a7a411888c
- **Data de revisão:** 2026-11-20
- **Responsável(eis):** [nome de quem revisa e aprova]
- **Estado:** Proposta — aguardando aprovação da Requirements Analysis
- **Fontes:** [análise dos retornos](analise-retornos-professor.md) (detalhe de cada proposta P-…); [respostas](requirement-verification-questions.md); [verificação no código](../../../construction/revisao-padroes-entrega-final/verificacao_codigo.md); [audit.md](../../../audit.md)

# Requisitos — revisão dos padrões para a entrega final

Este documento consolida as propostas da análise com as decisões tomadas nas perguntas 1 a 14. Cada requisito aponta para a proposta de origem (P-…), onde está o detalhamento. Os requisitos descrevem o que deve mudar nos arquivos de padrão; nenhum deles altera código ou documentos de entrega.

## 1. Resumo da intenção

A tabela resume o pedido e a classificação usada pelo AI-DLC.

| Item | Valor |
|---|---|
| Pedido | Verificar se os padrões de código e de documentação precisam mudar por causa dos retornos do professor e fazer as propostas de alteração nesses arquivos, sem código e sem documentação de entrega |
| Tipo | Melhoria (enhancement) de artefatos de processo |
| Escopo | `GUIA_DE_DOCUMENTACAO.md`, `PROMPT_DOCUMENTACAO_IA.md`, `GUIA_DE_CODIFICACAO.md`, `PROMPT_AGENTES_IA.md` e, pela pergunta 5, uma seção nova no `RELATORIO_BUGS.md` |
| Complexidade | Moderada |
| Profundidade | Standard ("fluxo médio") |

## 2. Decisões tomadas

As respostas foram dadas nas caixas de diálogo do chat, a pedido do usuário, e transcritas no arquivo de perguntas. A tabela mostra a decisão e o efeito nos requisitos.

| Pergunta | Decisão | Efeito |
|---|---|---|
| 1 — Formulário de RF | A: um RF por caso de uso, só com o formulário padrão | RQ-D01 |
| 2 — Atores | A: generalização com hierarquia única e até cerca de 10 casos de uso por diagrama | RQ-D03, RQ-D04 |
| 3 — Conteúdo do diagrama de classes | A: classes da implementação, com estereótipo de camada | RQ-D05 |
| 4 — Quantidade de diagramas | B: consolidado oficial e recortes opcionais (vale também para o DER) | RQ-D06, RQ-D08 |
| 5 — Avisos de divergência | A: retirar dos guias e mover os 14 válidos ou parciais para o `RELATORIO_BUGS.md` | RQ-C17, RQ-R01 |
| 6 — Autenticação e senha | A: Better Auth obrigatório, com as propriedades verificáveis escritas na regra | RQ-C02 |
| 7 — Verificação de e-mail | A: obrigatória antes de usar o app | RQ-C03 |
| 8 — Formas de acesso | C: biometria e login social | RQ-C04 |
| 9 — Manual | A: dentro do app, com o PDF como exportação opcional | RQ-C14, RQ-D14 |
| 10 — Plano de testes | A: seção no início de cada `testes_<assunto>.md` | RQ-D11 |
| 11 — Versões | A: versão do documento, histórico de revisões e tabela central de tecnologias | RQ-D10, RQ-D12 |
| 12 a 14 — Extensões | Security Baseline: não; Resiliency Baseline: não; Property-Based Testing: não | Seção 7 |

A checagem de contradições não encontrou respostas incompatíveis. A combinação das perguntas 6, 7 e 8 gera um risco de prazo, registrado na seção 6.

## 3. Requisitos funcionais da unidade

Cada requisito diz o que o arquivo de padrão deve passar a exigir. Regras novas recebem os próximos números livres; nenhum número existente é renumerado. Toda mudança em um guia é refletida no prompt correspondente.

### 3.1 GUIA_DE_DOCUMENTACAO.md e PROMPT_DOCUMENTACAO_IA.md

A tabela lista as mudanças no padrão de documentação.

| ID | Requisito | Origem |
|---|---|---|
| RQ-D01 | Cada elipse do diagrama de casos de uso tem exatamente um RF, com o mesmo nome, descrito só com os campos do formulário padrão do professor, na ordem: Função, Descrição, Entradas, Origem, Saída, Destino, Ação, Pré-condição, Pós-condição e Efeitos colaterais. O detalhe técnico (tipos, tamanhos, rotas, tabelas, colunas, status HTTP e desvios) fica dentro desses campos. Status, atores, referências do código e testes vão para o cabeçalho, a tabela de atores e a matriz. A ficha separada de caso de uso (DOC-17) é retirada, e a tabela de auditoria passa a ligar elipse e RF | P-D01; F24, F45, F54; S01, S02 |
| RQ-D02 | Nova regra de redação: linguagem impessoal e formal, tabela de substituições de termos informais ("passar", "chamar", "pegar", "cair no catch" e outros), proibição de "O mesmo", "Idem", "Igual ao anterior" e "Ver acima", e parágrafo explicativo antes de toda tabela e todo diagrama | P-D02; F54 |
| RQ-D03 | Generalização de atores permitida quando o código comprova que o ator especializado executa todos os casos de uso do geral. A hierarquia é definida uma vez no catálogo, com evidência, e usada igual em todos os diagramas. O catálogo lista todos os papéis com permissão no assunto. Continua proibido ator sem papel real no código | P-D03; F16, F42, F51 |
| RQ-D04 | Um diagrama de casos de uso por assunto, com até cerca de 10 casos de uso, atualizado nos incrementos seguintes em vez de recriado; associação só quando o ator inicia o caso de uso ou participa dele | P-D04; F51; S06 |
| RQ-D05 | O diagrama de classes mostra as classes da implementação (telas, hooks, stores, services, controllers, middlewares e tipos de domínio usados nas operações), com estereótipo de camada e legenda para módulos sem instância. Todo participante de sequência é ator ou classe do diagrama, e toda mensagem técnica é uma operação dessa classe com os mesmos argumentos. Models e enums do Prisma ficam só no diagrama relacional | P-D05; F17, F27, F43, F45 |
| RQ-D06 | Um diagrama de classes consolidado e oficial (`DC-BetterMeet`), com pacotes por subsistema e camada, atualizado a cada incremento; recortes por assunto são opcionais, com o mesmo estilo e sempre subconjunto do oficial. Nova regra de dicionário do diagrama de classes, membro a membro (classe, membro, tipo de membro, assinatura ou tipo, visibilidade, descrição e arquivo), mais um parágrafo de responsabilidade por classe | P-D06; F17, F52; S03, S06 |
| RQ-D07 | Nova regra de estilo único: arquivo comum incluído com `!include` em todo `.puml`, mesmo título, mesma legenda de estereótipos e mesmo formato de participante (`objeto:Classe`) | P-D07; F20, F23, F52 |
| RQ-D08 | Diagrama relacional e dicionário relacional separados do diagrama e do dicionário de classes. Toda coluna tem descrição do significado no negócio. Restrições em notação relacional, com tabela de origem (coluna), tabela referenciada (coluna), regras `ON DELETE` e `ON UPDATE` e uma frase de significado, sem notação de objeto. Um DER consolidado e oficial (`DER-BetterMeet`), com recortes opcionais no mesmo estilo; todo incremento traz o diagrama das tabelas que usa | P-D08; F44, F53; S04 |
| RQ-D09 | Pelo menos um diagrama de sequência por RF, além dos cenários significativos | P-D09; F20; S05 |
| RQ-D10 | RNF classificados pela taxonomia da aula 1 (produto, organizacional e externo, com as subcategorias do slide); metas de tempo compatíveis com uso em celular e justificadas; uma tabela central "Tecnologias e versões", copiada de manifestos e lockfiles e referenciada pelos documentos | P-D10; F19, F25, F26; S07 |
| RQ-D11 | Cada `testes_<assunto>.md` começa com a seção "Plano de testes" (escopo, tipos de teste da aula 1 — inspeção com checklist, caminho, unidade, integração, release em Android e iOS, desempenho e automação —, ambiente, aparelhos, critérios de aprovação e casos `CT-…` planejados), seguida do registro de execução. Testes manuais registram aparelho, versão do sistema operacional e build | P-D11; F22, F28; S08 |
| RQ-D12 | Cabeçalho com o campo "Versão" e documento terminado pela tabela "Histórico de revisões" (versão, data, autor e alteração) | P-D12; F26 |
| RQ-D13 | Novas regras para a entrega final: catálogo de todos os softwares usados (dependências diretas por subsistema, ferramentas e serviços externos, com versão, licença e uso) e repositório pronto para publicação (README da raiz, `LICENSE`, `.env.example` sem valores reais, nada sensível ou gerado versionado, guias sem pendências, apresentação e manual no repositório). Pasta da entrega: `documentos/entrega5_AF/` | P-D13; S09, S13 |
| RQ-D14 | Nova regra do manual de utilização: fonte versionada no repositório, escrita para o usuário final com vocabulário de aplicativo, uma seção por funcionalidade ligada aos RFs, e registro de testes do manual | P-D14; F49; S09 |
| RQ-D15 | Exemplos das seções 4 a 13 reescritos pelas regras novas (formulário padrão, redação formal, diagrama de classes da implementação com dicionário, restrições em notação relacional, plano de testes, versão do documento); seção 14 com as críticas da Di2, da Di3 e dos slides; checklists do guia e do prompt atualizados | P-D15; I01, I02, I03 |

### 3.2 GUIA_DE_CODIFICACAO.md e PROMPT_AGENTES_IA.md

A tabela lista as mudanças no padrão de código.

| ID | Requisito | Origem |
|---|---|---|
| RQ-C01 | Nova regra EX-19, proteção da API: `helmet`; CORS restrito às origens de `CORS_ORIGINS`; limite de tentativas nas rotas públicas de autenticação, com 429 em pt-BR acrescentado ao EX-05; limite do corpo JSON; conferência no service do vínculo atual de quem pede com a reunião, comissão ou organização. Vale para os três serviços Node | P-C01; F03; S13 |
| RQ-C02 | EX-14 mantém o Better Auth obrigatório e passa a listar as propriedades verificáveis: hash com sal e custo, nunca SHA-256 simples; token de recuperação de uso único, guardado como hash, com validade curta, enviado só ao e-mail cadastrado; mesma resposta para e-mail cadastrado ou não; limite de tentativas (RQ-C01) | P-C02; F08 |
| RQ-C03 | Nova regra EX-21: verificação de posse do e-mail obrigatória no cadastro e na troca de e-mail, pelo fluxo do Better Auth; a conta só usa o app depois de confirmar | P-C03; F05 |
| RQ-C04 | Nova regra de formas de acesso: (a) biometria opcional no app com `expo-local-authentication`, liberada só depois do login, sem guardar nem substituir a senha, também utilizável na confirmação de presença; (b) login social pelo Better Auth, com provedor gratuito e sem assinatura (aula 1, slide 19), registrado no catálogo de softwares | P-C04; F04, F39 |
| RQ-C05 | EX-18 ampliado: além da plataforma, toda organização mantém o seu Criador e toda comissão mantém pelo menos um Administrador da comissão; excluir conta, sair, ser removido ou ser rebaixado exige indicar quem assume, na mesma transação, ou é recusado com 409 | P-C05; F13 |
| RQ-C06 | Nova regra EX-20: entidades com ciclo de vida têm estados como enum e transições comentadas no schema; o service confere estado e horário (fuso `TZ_REUNIOES`) antes de cada ação e recusa com 409 ou 410; o app só reflete a regra; toda transição recusada tem teste | P-C06; F34, F36, F38, F39, F46, F47 |
| RQ-C07 | PR-05 ampliado: a resposta traz só o que o papel de quem pede pode ver (exemplo: voto secreto nunca ligado à pessoa) | P-C07; F47 |
| RQ-C08 | Nova regra YP-05: regras de data compartilhadas no `commonSchema.ts` dos três pacotes (início no futuro, término depois do início, comparação no fuso `TZ_REUNIOES`), validadas no app e na API | P-C08; F36 |
| RQ-C09 | YP-04 e RN-11: o erro de um campo é removido no handler de alteração desse campo | P-C09; F35 |
| RQ-C10 | Nova regra UI-09, convenções de aplicativo móvel: uma tarefa por tela, formulários longos em etapas ou seções, ação principal visível, seletores nativos e teclado adequado, puxar para atualizar e estado vazio, nenhum padrão de site, identidade própria respeitando as convenções de Android e iOS | P-C10; F11, F14, F30, F31, F33 |
| RQ-C11 | Nova regra de navegação: atalhos para telas de outra aba garantem que "Voltar" retorne à origem, conferido no botão do Android e no gesto do iOS | P-C11; F48 |
| RQ-C12 | RN-05 ampliado: `apiRequest` trata 401 de requisição com token chamando o `logout` do store; o `AppGate` leva ao login com aviso | P-C12; F29 |
| RQ-C13 | NM-02 ampliado com o vocabulário de aplicativo: "aplicativo" ou "app", "tela", "tocar" | P-C13; F14, F49 |
| RQ-C14 | Nova regra do manual dentro do app: área de Ajuda montada com os componentes base e o tema, conteúdo versionado no repositório, PDF como exportação opcional | P-C14; F49; S09 |
| RQ-C15 | RN-01 e RN-19: antes de cada entrega, `npx expo install --check` sem patch pendente e `npx expo-doctor` sem falhas nos dois apps, com resultado no registro de testes | P-C15; F41 |
| RQ-C16 | Nova regra GT-06: toda dependência ou serviço novo é gratuito, sem assinatura, com licença compatível com projeto open-source e registrado no catálogo no mesmo PR; nos apps, instalação com `npx expo install` | P-C16; S09, S10 |
| RQ-C17 | Retirar dos guias e dos prompts todos os avisos "Divergência atual" e "Situação atual"; atualizar a tabela de componentes base (UI-04) com os componentes existentes; corrigir GT-03, RN-01 e a regra 49 | P-C17; I04, I06, I07 |
| RQ-C18 | `PROMPT_AGENTES_IA.md` com as seções em ordem numérica crescente (Git, regras 77 a 80, antes de Atualização de SDK, 81 e 82), sem renumerar; regras novas a partir da 91; checklist "Antes de entregar" atualizado | P-C18; I05 |

### 3.3 RELATORIO_BUGS.md

A pergunta 5 acrescentou este arquivo ao escopo.

| ID | Requisito | Origem |
|---|---|---|
| RQ-R01 | Nova seção com os 14 avisos de divergência que ainda valem ou estão parciais, cada um com a regra violada, a evidência (arquivo e linha) e a data da verificação, sem alterar os itens já existentes | Pergunta 5; verificacao_codigo.md |

## 4. Requisitos não funcionais da unidade

Os requisitos abaixo valem para a forma das alterações.

| ID | Requisito | Verificação |
|---|---|---|
| RNQ-01 | Todo requisito RQ-D aparece no guia de documentação e no prompt de documentação; todo RQ-C aparece no guia de código e no prompt de agentes | Conferência cruzada no Build and Test |
| RNQ-02 | Nenhum identificador existente (DOC, EX, PR, YP, RN, ZS, UI, GT, NM, TS e número de regra dos prompts) é renumerado ou reutilizado | Comparação dos identificadores antes e depois |
| RNQ-03 | Os próprios guias seguem a regra de redação nova (RQ-D02): pt-BR, registro formal e parágrafo antes de cada tabela | Busca pelos termos proibidos e leitura |
| RNQ-04 | Exemplos coerentes com as regras novas e datados com o commit em que foram conferidos; nenhuma afirmação sobre o código sem verificação | Leitura e conferência no código |
| RNQ-05 | Links relativos, índices de seções ("Seções do guia") e referências cruzadas entre regras válidos | Verificação automática de links e leitura |
| RNQ-06 | Modelos PlantUML do guia válidos | Geração dos SVG se o PlantUML estiver disponível; caso contrário, "Não executado" com o motivo |
| RNQ-07 | Nenhum arquivo de `sistema/` ou de `documentos/` alterado | `git status` no fim |

## 5. Fora do escopo

As correções no aplicativo e na API e a reescrita da documentação das entregas, listadas na seção 7 da análise, ficam para unidades próprias. Elas incluem, entre outras, a migração da autenticação para o Better Auth, a verificação de e-mail, o login social, a biometria, as regras de ciclo de vida, o manual dentro do app e os documentos das entregas no formato novo.

## 6. Riscos e pontos de atenção

A tabela registra os riscos levantados nas respostas.

| Risco | Efeito | Encaminhamento |
|---|---|---|
| Better Auth obrigatório (pergunta 6), somado à verificação de e-mail (7) e ao login social (8), antes de 27/11 | Até o código migrar, a API continua fora do padrão em senha, recuperação, e-mail e login social; os 14 avisos do RQ-R01 deixam isso registrado | Planejar a migração como unidade de código própria, logo depois desta |
| Provedor do login social | Alguns provedores exigem conta de desenvolvedor; a aula 1 proíbe tecnologia que precise de assinatura | A regra exige provedor gratuito e sem assinatura; a escolha fica para a unidade de código e entra no catálogo |
| Armazenamento da sessão com biometria e Better Auth | O ZS-01 hoje persiste o token no AsyncStorage | Conferir na documentação do Better Auth para Expo, na versão a instalar, como a sessão é guardada no aparelho, antes de escrever a regra; registrar a conferência no plano |
| Volume da documentação a refazer | Os padrões novos exigem refazer RFs, diagramas e dicionários das entregas anteriores | Fora do escopo; a ordem das próximas unidades é decisão da equipe |

## 7. Extensões

A tabela registra as escolhas das perguntas 12 a 14.

| Extensão | Habilitada | Decidido em |
|---|---|---|
| Security Baseline | Não | Requirements Analysis (pergunta 12) |
| Resiliency Baseline | Não | Requirements Analysis (pergunta 13) |
| Property-Based Testing | Não | Requirements Analysis (pergunta 14) |

As regras completas dessas extensões não foram carregadas.

## 8. Critérios de aceitação da unidade

A unidade está pronta quando:

1. Os requisitos RQ-D01 a RQ-D15, RQ-C01 a RQ-C18 e RQ-R01 estão escritos nos arquivos indicados.
2. Os requisitos RNQ-01 a RNQ-07 foram verificados no Build and Test, com o resultado real de cada verificação.
3. A pessoa responsável aprovou as alterações.
