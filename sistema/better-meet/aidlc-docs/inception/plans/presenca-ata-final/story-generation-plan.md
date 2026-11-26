# Plano de histórias — presença e ata

- Unidade: presenca-ata-final.
- Data local: 25/11/2026, America/Sao_Paulo.
- Estado: planejamento concluído; geração aguardando aprovação deste plano.
- Entrada: [requisitos aprovados](../../requirements/presenca-ata-final/requirements.md) e [diagnóstico](../../requirements/presenca-ata-final/diagnostico.md).
- Avaliação: [motivo para executar User Stories](user-stories-assessment.md).

## Abordagem proposta

Organizar por jornada: preparar código, entrar, sair, corrigir presença, votar, exportar e consultar a versão final. Cada história terá identificador US-PA, papel, objetivo, benefício, critérios em “Dado/Quando/Então” e vínculo aos requisitos PA. Separar a confirmação local porque ela se aplica tanto à entrada quanto à saída, preservando os cenários completos dessas duas ações.

Os critérios serão observáveis por quem usa o aplicativo e verificáveis por testes. Incluir sucesso, bloqueio, cancelamento e repetição onde forem aplicáveis. Não transformar tarefas de banco ou bibliotecas em histórias de usuário.

## Papéis a documentar

| Papel | Objetivos e limites |
|---|---|
| Participante | Registrar a própria presença, votar e consultar/exportar a ata quando elegível. Não recebe privilégios por conhecer o código. |
| Administrador da comissão | Disponibilizar/renovar o código e registrar presença de participante. Quando registra a própria presença, segue o fluxo próprio. |
| Editor da ata | Administrador ou secretário com acesso autorizado; salvar o conteúdo e preservar o rascunho real diante de atualização remota. Não libera o voto dos demais pelo próprio voto. |

Os papéis podem coexistir na mesma pessoa. `ADMIN` global e autoria da reunião, isoladamente, não substituem o papel de administrador da comissão.

## Histórias propostas e cobertura

| História | Objetivo | Requisitos | Casos de aceite a detalhar |
|---|---|---|---|
| US-PA-01 | Registrar a própria entrada quando a reunião começar | PA-01, PA-02, PA-03, PA-06, PA-07 | Antes do início, instante inicial, código inválido/atualizado, sucesso e repetição sem mudar horário. |
| US-PA-02 | Registrar a própria saída com entrada prévia | PA-01, PA-02, PA-03, PA-06, PA-07 | Sem entrada, antes do início, código válido, repetição e atualização do estado. |
| US-PA-03 | Confirmar a ação de presença no aparelho ou na web | PA-08, PA-09 | Biometria, fallback nativo, cancelamento/falha sem envio, confirmação web, orientação quando não houver autenticação disponível. |
| US-PA-04 | Gerenciar o código de presença da comissão | PA-04, PA-05, PA-07 | Código de seis dígitos, reunião anterior sem código, copiar, renovar, invalidar anterior e recusar pessoa sem papel autorizado. |
| US-PA-05 | Registrar entrada/saída manual de participante | PA-10, PA-11, PA-12, PA-02 | Administrador autorizado, alvo elegível, horário, saída sem entrada, auditoria separada, repetição e atualização da lista real. |
| US-PA-06 | Votar na versão salva sem depender do presidente | PA-13, PA-14 | Primeiro voto de aprovação/reprovação, presença própria/manual, ausência/perda de vínculo, atualização remota sem rascunho falso e preservação de rascunho de editor. |
| US-PA-07 | Exportar a versão aprovada com resultado claro | PA-15, PA-16 | Metade exata insuficiente, maioria suficiente, falha de PDF, versão alterada durante preparação e confirmação sem afirmar impressão física não comprovada. |
| US-PA-08 | Consultar e reexportar uma ata finalizada e íntegra | PA-17, PA-18 | Texto/votos bloqueados, tentativas simultâneas, reexportação sem alteração, aviso de finalização e coerência após mudanças de presença. |

Essa tabela é o escopo proposto para geração; não equivale às histórias finais nem a testes executados.

## Alternativas consideradas

| Organização | Benefício | Limite neste pedido |
|---|---|---|
| Jornada, proposta | Mostra a ordem de uso e permite testar os fluxos completos. | Exige referenciar regras compartilhadas de código e confirmação. |
| Funcionalidade | Separa código, biometria e PDF com facilidade. | Pode ocultar a sequência obrigatória antes de enviar uma presença. |
| Persona | Destaca a diferença entre participante e administrador. | Repete ações que a mesma pessoa executa sob papéis distintos. |
| Domínio | Separa presença e ata. | Precisa explicitar que presença persistida habilita voto. |
| Épicos | Facilita agrupar uma entrega maior. | Acrescenta hierarquia desnecessária a oito histórias. |

Não há perguntas de esclarecimento nesta parte: o pedido detalhado e os requisitos aprovados já sustentam a proposta. Ajustes de abordagem podem ser solicitados na revisão do plano.

## Execução e documentos esperados

- [x] 1. Conferir aprovação dos requisitos e limites do diagnóstico.
- [x] 2. Justificar a etapa, propor papéis e organizar histórias por jornada.
- [x] 3. Mapear PA-01 a PA-18 e conferir que nenhum requisito ficou sem história.
- [ ] 4. Receber aprovação explícita deste plano de geração.
- [ ] 5. Gerar `aidlc-docs/inception/user-stories/presenca-ata-final/personas.md` com os três papéis e suas permissões.
- [ ] 6. Gerar `aidlc-docs/inception/user-stories/presenca-ata-final/stories.md` com US-PA-01 a US-PA-08 e critérios de aceite.
- [ ] 7. Conferir INVEST: valor próprio e resultado verificável por história, tamanho limitado, relações explícitas entre histórias e nenhuma decisão técnica desnecessária.
- [ ] 8. Conferir cobertura PA-01 a PA-18, sucesso/falha e diferenças entre presença própria/manual e biometria/web.
- [ ] 9. Registrar resultado no estado e na auditoria e apresentar histórias/personas para aprovação antes de Workflow Planning.

## Revisão solicitada

**Request Changes**: ajustar a abordagem ou o agrupamento proposto.

**Continue to Next Stage**: aprovar este plano e iniciar a geração das histórias/personas, Parte 2 de User Stories.

A regra local `inception/user-stories.md`, Parte 1, passo 13, exige aprovação explícita do plano antes da geração. Não se trata de pedir novamente a aprovação dos requisitos, já registrada.
