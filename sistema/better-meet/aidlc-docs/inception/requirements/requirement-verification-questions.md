# Requirement Verification Questions

Respostas coletadas pelas caixas interativas do Claude (a pedido do usuário); o AI copia a opção escolhida para cada `[Answer]:`. Cada resposta bruta está registrada em `aidlc-docs/audit.md`.

## Question 1
Qual deve ser o escopo das correções além da troca de versões?

A) Só a migração e o que ela quebrar (gesture-handler 3, setup do Jest, tipos, config)

B) A migração mais pendências pré-existentes de baixo risco (2 erros de `tsc` de rotas tipadas; linha `example` solta no `.gitignore`)

C) A migração, as pendências e a troca de APIs que continuam funcionando mas estão instáveis ou deprecadas (ex.: caminho do `NativeTabs`)

X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 2
Qual versão do Jest usar? O `jest-expo` 58 aceita Jest 29 ou 30, mas já depende de pacotes `jest-*` da linha 30.

A) Manter Jest ~29.7.0

B) Subir para Jest 30

C) Tentar manter o 29 e subir para o 30 só se a instalação ou os testes exigirem

X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 3
A versão web do app (react-native-web, saída estática) é alvo suportado?

A) Sim, deve ser verificada (o SDK 58 muda rotas assíncronas e safe area na web)

B) Secundária: só garantir que `expo start --web` e o build não quebrem

C) Não é usada; ignorar a web

X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 4
Como você roda o app para testar?

A) Expo Go (precisa estar na versão do SDK 58)

B) Development build (precisa gerar de novo após a migração)

C) Expo Go e development build

X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 5
Quais documentos que citam o "Expo SDK 57" devem ser atualizados?

A) Só os do app: `better-meet/AGENTS.md` e `better-meet/README.md`

B) Os do app mais o `GUIA_DE_CODIFICACAO.md` (seção 6.1) e o `PROMPT_AGENTES_IA.md`, compartilhados com `management-better-meet/web`

C) Nenhum agora

X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question: Security Extensions
Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)

B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)

X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question: Resiliency Extensions
Should the resiliency baseline be applied to this project?

A) Yes — apply the resiliency baseline as directional best practices and design-time guidance

B) No — skip the resiliency baseline

X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question: Property-Based Testing Extension
Should property-based testing (PBT) rules be enforced for this project?

A) Yes — enforce all PBT rules as blocking constraints

B) Partial — enforce PBT rules only for pure functions and serialization round-trips

C) No — skip all PBT rules

X) Other (please describe after [Answer]: tag below)

[Answer]: C
