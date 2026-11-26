# Requisitos — presença e ata da entrega final

- Data: 2026-11-25.
- Unidade: presenca-ata-final.
- Estado: análise aprovada pelo usuário em 2026-11-26T00:22:32Z (25/11/2026 no fuso America/Sao_Paulo); implementação não iniciada.
- Pedido: corrigir presença e ata, com migração, API, app, testes e indicação da documentação afetada.
- Tipo: correções e funcionalidades novas em dois pacotes, com alteração de dados e autenticação local.
- Profundidade: padrão; atenção específica à concorrência na finalização da ata.
- Evidências: [diagnóstico](diagnostico.md).

## Escopo e decisões

O administrador citado no pedido é o `ADMINISTRADOR` atual da comissão. Ser criador da reunião ou `ADMIN` global, isoladamente, não concede acesso ao código nem marcação manual.

Usar o início derivado de `data` e `horaInicio` no fuso da reunião; não adicionar outro campo de data só porque o exemplo do pedido usa `dataInicio`. O relógio do servidor é a autoridade.

O pedido atual define 400 ou 403 antes do início. Adotar 400 nessa condição específica e para código inválido, preservando 403 para falta de permissão e 409 para conflitos. Essa instrução específica prevalece sobre a regra geral de 409 para horário do guia.

A autenticação local é exigida nas ações próprias de presença, com as alternativas explicitamente solicitadas. Não altera o login nem transmite biometria ou senha do aparelho à API.

Reutilizar `ataExportadaAt` e `ataVersaoExportada`. A aprovação pela maioria habilita a exportação; a finalização/exportação torna texto e votos imutáveis, conforme a alternativa permitida no pedido. Não introduzir bloqueio no primeiro voto do presidente.

## Critérios funcionais

| ID | Resultado esperado |
|---|---|
| PA-01 | Entrada e saída próprias recusadas com 400 antes do instante inicial, mesmo dentro dos antigos 15 minutos de tolerância. Exatamente no início são permitidas, respeitadas as outras condições. |
| PA-02 | Saída sem entrada é recusada; repetir entrada ou saída não reescreve horário ou autoria. Usuário e horários próprios vêm da sessão e do servidor. |
| PA-03 | Interface desabilita as ações antes do início, mostra data/horário claro e reavalia a liberação enquanto a tela está aberta e ao recuperar foco. |
| PA-04 | Reunião possui código de presença de seis dígitos, gerado por fonte aleatória adequada. Para registros anteriores, permitir geração sob demanda sem inventar presença nem apagar dados. |
| PA-05 | Somente administrador atual da comissão consulta/renova o código. Não expor em listas gerais, respostas de participantes, logs ou mensagens de erro. Renovação invalida imediatamente o código anterior. |
| PA-06 | Entrada e saída próprias exigem código válido no corpo, validado com Yup; ausente, malformado ou incorreto recebe 400. Tentativas seguem limitação apropriada. |
| PA-07 | O administrador visualiza o código e pode copiar/atualizar. O participante informa o código antes de autenticar localmente. Não persistir o código em store ou armazenamento local. |
| PA-08 | Android/iOS tentam autenticação biométrica com fallback nativo autorizado (`disableDeviceFallback: false`). Cancelamento ou falha impede a requisição. Não transformar indisponibilidade em sucesso. |
| PA-09 | Web usa `ConfirmDialog` de confirmação explícita. Dispositivo nativo sem autenticação disponível recebe orientação e pode ter presença registrada pelo administrador; não simular biometria. |
| PA-10 | Administrador atual registra entrada/saída de participante elegível por endpoint próprio, sem PIN/biometria do participante. Conferir vínculo, reunião, início e entrada anterior para saída. Não aceitar horário arbitrário do cliente. |
| PA-11 | Ações manuais preservam autoria de entrada e saída separadamente, idempotência e integridade quando a conta do autor é excluída. Registros legados não são atribuídos retroativamente a um administrador. |
| PA-12 | Lista real de participantes mostra ações “Marcar Entrada” e “Marcar Saída” conforme estado, feedback e dados atualizados após sucesso. Não reutilizar mocks da prévia como persistência. |
| PA-13 | Qualquer integrante atual com presença registrada pode aprovar ou reprovar a versão salva, inclusive como primeiro votante e após registrar saída, sem voto anterior do presidente. |
| PA-14 | Atualização de texto/votos remotos não transforma leitor em editor com rascunho. Preservar alterações locais reais de editores e tratar conflito de versão com mensagem clara. |
| PA-15 | API é a fonte da aprovação: mais da metade dos presentes aprovou a versão. Exportar antes disso recebe 409; a interface explica o bloqueio. |
| PA-16 | O fluxo distingue preparar PDF, falhar e confirmar finalização. A marca de exportação refere-se à versão efetivamente preparada, com revalidação no servidor; falha local de geração não pode ser registrada como exportação concluída. |
| PA-17 | Depois de finalizada, nenhuma edição ou alteração de voto passa, inclusive em requisições simultâneas. Reexportar a mesma versão é idempotente. Mudanças de presença não devem tornar o documento final inconsistente. |
| PA-18 | Exibir “Ata finalizada e exportada — votação encerrada”, bloquear votar/editar/salvar e retirar “Você pode alterá-lo.” nesse estado. |

## Critérios técnicos e de qualidade

- Schema somente com migration Prisma gerada por `npx prisma migrate dev --name <descricao_em_snake_case>`, revisada para preservar dados. Não usar `db push` nem editar migrations antigas.
- Não substituir ou duplicar os campos de exportação já existentes.
- Instalar dependências pelo Expo SDK 58, configurar permissão Face ID em pt-BR, atualizar lock e catálogo de licenças.
- Respeitar as camadas de routes/controller/service, schemas separados, `AppError`, transações e permissões no servidor.
- API não aceita a afirmação “biometria aprovada” como identidade. Código de presença é uma validação adicional e não substitui sessão e vínculo.
- Serializar voto, edição e finalização; uma simples leitura anterior de `ataExportadaAt` é insuficiente. Validar a versão ao concluir exportação para não finalizar outro conteúdo.
- Concluir o desenho de impressão web considerando que `afterprint` não informa se houve salvamento ou cancelamento. Não afirmar sucesso físico da impressão sem evidência.
- Criar os testes abaixo antes de considerar a alteração concluída. Executar lint, typecheck, testes afetados, checagens de Expo nos dois apps e registrar limitações de aparelho, sem apresentar resultados antigos como atuais.

## Matriz mínima de regressão

| Grupo | Cenários |
|---|---|
| Horário | Antes do início; antigo intervalo de 15 min; instante exato; depois do término conforme regra existente; fuso diferente do servidor; cancelada; saída sem entrada. |
| Código | Ausente, inválido, errado, correto, renovado; não vazamento a membro, criador sem papel e administrador global sem vínculo. |
| Autenticação local | Sucesso, cancelamento, falha, sem biometria com fallback nativo, sem autenticação disponível, confirmação/cancelamento web; nenhuma chamada antes da confirmação. |
| Manual | Administrador autorizado, membro/facilitador/secretário recusados, alvo de outra comissão, horário antecipado, saída sem entrada, repetição e corrida entre registro próprio/manual. |
| Ata | Primeiro voto de membro sem voto do presidente; primeiro voto de reprovação; presença manual válida; ausência e perda de vínculo; nova versão remota sem rascunho falso. |
| PDF | Antes da maioria, metade exata, maioria suficiente, falha de geração, confirmação da versão correta, alteração durante preparação, repetição de exportação. |
| Finalização | Voto/edição sequenciais e simultâneos à exportação, UI bloqueada, texto e versão consistentes, presença concorrente que afete maioria. |

## Próxima etapa e limites desta entrega de análise

Os artefatos de engenharia reversa existentes foram usados como contexto e conferidos nos trechos afetados; o diagnóstico não assume que os documentos antigos refletem o código atual.

Após aprovação desta etapa, seguir User Stories (novos fluxos visíveis), planejamento e desenho dos pontos de concorrência/fallback, plano de implementação e execução conforme as aprovações do repositório. As extensões opcionais permanecem desligadas, conforme GT-05; isso não desliga as regras normais de segurança e testes.

Não há alteração de schema, migration, dependência ou código neste momento. A atualização documental necessária está listada na seção 5 do diagnóstico e deverá ser reconciliada com a implementação efetiva.
