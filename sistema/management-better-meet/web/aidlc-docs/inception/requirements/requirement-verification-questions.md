# Perguntas de verificação - Migração do management-better-meet/web para o Expo SDK 58

Preencha a tag `[Answer]:` de cada pergunta com a letra da opção. A recomendação vem marcada.

## Pergunta 1: Escopo da mudança
O que entra além de subir as versões do SDK 58 e corrigir o que quebrar?

A) Só a migração e as quebras que ela causar (recomendado: menor diff, mais fácil de revisar)

B) A migração + o erro de `tsc` pré-existente (`@/global.css` sem declaração em `src/constants/theme.ts`)

C) A migração + B + troca de APIs que a documentação do SDK 58 marcar como deprecadas

X) Other (please describe after [Answer]: tag below)

[Answer]: C (resposta do usuário: "Pergunta 1, resposta C")

## Pergunta 2: Portões de teste
O `web` não tem Jest nem ESLint configurados. Como testar a migração?

A) `tsc --noEmit`, `npx expo-doctor` e o bundle web (`expo export -p web`), sem adicionar dependências nem arquivos de teste (recomendado: "apenas atualizar e testar", sem ampliar o escopo)

B) A + abrir o `dist/` gerado num servidor estático local e conferir login e painel no navegador (precisa da API de Gestão no ar para o login funcionar)

C) A + configurar ESLint (`expo lint`) e rodar o lint (adiciona `eslint` e `eslint-config-expo` como devDependencies)

X) Other (please describe after [Answer]: tag below)

[Answer]: A + B + C (resposta do usuário: "inclua todos")

## Pergunta 3: Permissão para instalar e buildar
Você tem a regra de pedir antes de instalar/buildar/subir servidor. O que fica autorizado nesta tarefa, dentro de `management-better-meet/web`?

A) `npm install`/`npx expo install` (altera `node_modules` e o `package-lock.json`) e `expo export -p web` (gera `dist/`, que é ignorado pelo git). Nada de `npm start`/`expo start` nem de subir servidor (recomendado)

B) A + subir um servidor estático local temporário só para o teste da pergunta 2 (opção B)

C) Nenhum build: só análise estática (`tsc`, `expo-doctor` e leitura dos pacotes). O bundle fica sem teste

X) Other (please describe after [Answer]: tag below)

[Answer]: A + B (resposta do usuário: "todos autorizados"; a opção C é "nenhum build" e contradiz a autorização, então não se aplica)

## Pergunta 4: Extensões do AI-DLC
Segurança, Resiliência e Testes baseados em propriedades são opt-in. Para uma migração de versão sem lógica nova, ficam desligadas?

A) Desligar as três (recomendado; mesma decisão do `better-meet`)

B) Ligar Segurança (`npm audit` e regras de segurança viram bloqueantes)

X) Other (please describe after [Answer]: tag below)

[Answer]: A (resposta do usuário: "desligados, conforme better-meet")
