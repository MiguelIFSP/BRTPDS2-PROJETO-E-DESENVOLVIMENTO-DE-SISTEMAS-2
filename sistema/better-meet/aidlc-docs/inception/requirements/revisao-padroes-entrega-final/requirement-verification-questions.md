- **Incremento:** Apresentação final (AF)
- **Escopo:** decisões da Requirements Analysis da unidade revisao-padroes-entrega-final
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** 704478f15192f757223c1efce99f43a7a411888c
- **Data de revisão:** 2026-11-20
- **Responsável(eis):** [nome de quem responde]
- **Estado:** Respondido em 2026-11-20, pelas caixas de diálogo do chat, a pedido do usuário
- **Fontes:** [análise dos retornos](analise-retornos-professor.md); [verificação no código](../../../construction/revisao-padroes-entrega-final/verificacao_codigo.md); [estado AI-DLC](../../../aidlc-state.md)

# Perguntas da Requirements Analysis — revisão dos padrões

As perguntas 1 a 11 decidem as propostas da [análise dos retornos](analise-retornos-professor.md) que dependem de escolha da equipe. As propostas sem pergunta (por exemplo, redação formal, estilo único de diagramas, restrições em notação relacional, proteção da API e ciclo de vida na API) seguem o que o professor pediu e entram no `requirements.md`, salvo pedido de mudança. As perguntas 12 a 14 são as perguntas obrigatórias de extensões do AI-DLC.

A opção marcada como "(recomendada)" é a sugestão do agente, com o motivo ao lado. Escreva a letra depois de `[Answer]:`. Se nenhuma opção servir, use X e descreva.

A análise assumiu que o padrão de código citado no pedido é o `GUIA_DE_CODIFICACAO.md` (o pedido citou o `GUIA_DE_DOCUMENTACAO.md` duas vezes). Se não for, diga em qualquer resposta.

## Question 1

Como deve ficar o formulário de requisito funcional em relação aos casos de uso (proposta P-D01)? O professor pede "Descrição de cada caso de uso como um requisito funcional (utilizar apenas o formulário padrão)" e criticou que "os requisitos estão se confundindo com os casos de uso".

A) Um RF por caso de uso, só com os campos do formulário padrão (Função, Descrição, Entradas, Origem, Saída, Destino, Ação, Pré-condição, Pós-condição e Efeitos colaterais), com o detalhe técnico dentro dos campos. Status, atores, referências do código e testes vão para o cabeçalho, a tabela de atores e a matriz. A ficha separada de caso de uso deixa de existir. (recomendada: segue o "utilizar apenas o formulário padrão")

B) Um RF por caso de uso, com o formulário padrão primeiro e, depois dele, um bloco complementar da equipe (atores, regras de negócio, fluxos alternativos, referências do código e testes). Sem ficha separada.

C) Manter o modelo atual (RF ampliado e ficha de caso de uso separada), só proibindo repetições e "O mesmo".

X) Other (please describe after [Answer]: tag below)

[Answer]: A (respondido na caixa de diálogo do chat em 2026-11-20)

## Question 2

Como simplificar os diagramas de casos de uso (propostas P-D03 e P-D04)? A Di3 criticou "muitos acessos comuns a vários usuários" e papéis faltando; a Di1 criticou herança usada em um diagrama e não em outro.

A) Permitir generalização de atores com uma hierarquia única no catálogo, comprovada no código e usada igual em todos os diagramas, e limitar cada diagrama a cerca de 10 casos de uso, dividindo por assunto. (recomendada: reduz as linhas e mantém a consistência pedida na Di1)

B) Permitir a generalização com hierarquia única, sem limite de casos de uso por diagrama.

C) Manter a proibição de generalização entre atores e só dividir os diagramas em diagramas menores.

X) Other (please describe after [Answer]: tag below)

[Answer]: A (respondido na caixa de diálogo do chat em 2026-11-20)

## Question 3

O que entra no diagrama de classes (proposta P-D05)? O professor pediu que os diagramas de classes e de sequência tenham as mesmas classes e criticou o relacional "misturado com o diagrama de classes".

A) As classes da implementação (telas, hooks, stores, services, controllers, middlewares e tipos de domínio), com estereótipo de camada. Models do Prisma ficam só no diagrama relacional. Todo participante de sequência existe no diagrama de classes. (recomendada: resolve os dois retornos de uma vez)

B) Dois diagramas de classes com o mesmo estilo: um de domínio (entidades) e outro da implementação. As sequências usam o da implementação.

C) Manter o modelo atual (persistência Prisma e tabela de responsabilidades) e restringir os participantes das sequências às classes desse diagrama.

X) Other (please describe after [Answer]: tag below)

[Answer]: A (respondido na caixa de diálogo do chat em 2026-11-20)

## Question 4

Quantos diagramas de classes o padrão deve exigir (proposta P-D06)? A mesma escolha vale para o diagrama relacional (P-D08). A Di3 diz: "Os diagramas de classe deveriam ser um só. Se fossem vários, deveriam ter o mesmo padrão".

A) Um único diagrama do sistema, com pacotes, atualizado a cada incremento, e um único dicionário de classes, sem recortes.

B) Um diagrama consolidado oficial e um único dicionário de classes, mais recortes por assunto opcionais, com o mesmo estilo e sempre como subconjunto do oficial. (recomendada: atende ao "um só" e mantém os diagramas legíveis na apresentação)

C) Um diagrama por assunto, sem consolidado, todos com o mesmo arquivo de estilo.

X) Other (please describe after [Answer]: tag below)

[Answer]: B (respondido na caixa de diálogo do chat em 2026-11-20)

## Question 5

O que fazer com os avisos de "Divergência atual" dos guias (proposta P-C17)? Dos avisos conferidos, 16 já foram resolvidos no código, 4 estão parciais e 10 continuam válidos.

A) Retirar todos os avisos dos guias e do prompt. Os 14 que ainda valem ou estão parciais vão para o `RELATORIO_BUGS.md`, cada um com a regra violada. (recomendada: os guias passam a descrever só o padrão, como pede o "repositório pronto para publicação")

B) Fazer a mesma retirada, mas os 14 avisos viram issues no GitHub, criadas pela equipe, em vez de entrar no `RELATORIO_BUGS.md`.

C) Manter os avisos nos guias, apagando os resolvidos e atualizando os demais.

X) Other (please describe after [Answer]: tag below)

[Answer]: A (respondido na caixa de diálogo do chat em 2026-11-20)

## Question 6

Como deve ficar a regra de autenticação e senha (proposta P-C02)? Hoje o EX-14 exige o Better Auth, que não está instalado. A recuperação de senha sem token e o SHA-256 sem sal continuam no código.

A) Manter o Better Auth obrigatório e escrever na regra as propriedades verificáveis (sal e custo, token de uso único com validade curta, mesma resposta para e-mail cadastrado ou não, limite de tentativas).

B) Escrever as propriedades verificáveis como o padrão. O Better Auth fica preferido, e uma implementação com `node:crypto` e a tabela `PasswordResetToken`, que já existe, é permitida se cumprir as propriedades e tiver testes. (recomendada: o professor cobra a segurança, não a biblioteca, e o prazo é 27/11)

X) Other (please describe after [Answer]: tag below)

[Answer]: A (respondido na caixa de diálogo do chat em 2026-11-20)

## Question 7

Como deve ser a verificação do e-mail no cadastro (proposta P-C03)? A Di1 pediu para "verificar o cadastro de e-mail".

A) Obrigatória: a conta só usa o app depois de confirmar o e-mail com um código ou link de uso único. (recomendada: impede contas com e-mail de outra pessoa)

B) Exigida, mas sem bloquear: a pessoa usa o app e vê um aviso até confirmar.

C) Não entra no padrão agora; fica registrada como evolução.

X) Other (please describe after [Answer]: tag below)

[Answer]: A (respondido na caixa de diálogo do chat em 2026-11-20)

## Question 8

Quais formas de acesso o padrão deve prever (proposta P-C04)? A Di1 pediu para "incrementar as formas de acesso", e a Di2 sugeriu biometria na entrada e na saída da reunião.

A) Biometria opcional no app (`expo-local-authentication`) para desbloquear a sessão depois do login com e-mail e senha, também utilizável na confirmação de presença. (recomendada: atende às duas sugestões, sem serviço externo nem assinatura)

B) Login social com provedor gratuito e sem assinatura.

C) Biometria (A) e login social (B).

D) Nenhuma por enquanto; registrar como evolução futura.

X) Other (please describe after [Answer]: tag below)

[Answer]: C (respondido na caixa de diálogo do chat em 2026-11-20)

## Question 9

Onde deve ficar o manual de utilização (propostas P-C14 e P-D14)? A Di3 diz que o ideal era o manual dentro do aplicativo, não um PDF externo. A apresentação final exige o manual no repositório.

A) Manual dentro do app (área de Ajuda com os componentes e o tema do app), com o conteúdo versionado no repositório. O PDF fica como exportação opcional. (recomendada: segue o retorno e mantém o que já existe)

B) Manual dentro do app, removendo o PDF.

C) Manter o manual em PDF, só corrigindo o vocabulário ("site" → "aplicativo").

X) Other (please describe after [Answer]: tag below)

[Answer]: A (respondido na caixa de diálogo do chat em 2026-11-20)

## Question 10

Onde deve ficar o plano de testes (proposta P-D11)? A Di1 apontou "Faltou plano de testes na doc".

A) Uma seção "Plano de testes" no início de cada `testes_<assunto>.md`, seguida do registro de execução. (recomendada: plano e resultado ficam juntos, sem arquivos novos)

B) Um arquivo `plano_testes_<assunto>.md` separado em cada entrega, além do `testes_<assunto>.md`.

C) Atualizar só o plano geral da 1ª entrega (`documentos/entrega1_AP/plano_de_testes.md`) e manter o registro por assunto.

X) Other (please describe after [Answer]: tag below)

[Answer]: A (respondido na caixa de diálogo do chat em 2026-11-20)

## Question 11

Como atender ao "Colocar versões nas docs" (propostas P-D12 e P-D10)?

A) Campo "Versão" no cabeçalho, tabela "Histórico de revisões" no fim de cada documento e uma tabela central "Tecnologias e versões". (recomendada: cobre as duas leituras possíveis do retorno)

B) Só a tabela central "Tecnologias e versões", sem versão de documento, porque o commit do cabeçalho já identifica a revisão.

X) Other (please describe after [Answer]: tag below)

[Answer]: A (respondido na caixa de diálogo do chat em 2026-11-20)

## Question 12

As regras da extensão de segurança (Security Baseline) devem ser aplicadas a esta unidade?

A) Sim — aplicar todas as regras SECURITY como restrições bloqueantes (recomendado para aplicações de nível de produção).

B) Não — pular as regras SECURITY nesta unidade. (recomendada: a unidade altera só documentos de padrão; o conteúdo de segurança pedido pelo professor está nas propostas P-C01 a P-C03)

X) Other (please describe after [Answer]: tag below)

[Answer]: B (respondido na caixa de diálogo do chat em 2026-11-20)

## Question 13

A extensão de resiliência (Resiliency Baseline) deve ser aplicada a esta unidade? Ela traz boas práticas de projeto para tolerância a falhas, alta disponibilidade, observabilidade e recuperação, derivadas do AWS Well-Architected Framework (pilar de confiabilidade). Ela não torna o sistema pronto para produção nem garante metas de disponibilidade.

A) Sim — aplicar a base de resiliência como orientação de projeto.

B) Não — pular a base de resiliência. (recomendada: a unidade altera só documentos de padrão)

X) Other (please describe after [Answer]: tag below)

[Answer]: B (respondido na caixa de diálogo do chat em 2026-11-20)

## Question 14

As regras de testes baseados em propriedades (Property-Based Testing) devem ser aplicadas a esta unidade?

A) Sim — aplicar todas as regras de PBT como restrições bloqueantes.

B) Parcial — aplicar só a funções puras e a conversões de ida e volta (serialização).

C) Não — pular as regras de PBT. (recomendada: a unidade não gera código)

X) Other (please describe after [Answer]: tag below)

[Answer]: C (respondido na caixa de diálogo do chat em 2026-11-20)
