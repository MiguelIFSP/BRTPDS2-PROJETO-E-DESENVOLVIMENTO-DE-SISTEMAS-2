# RF37 — Gerar versão local da lista de presença

```text
Incremento: Di2 — Reunião (lista de presença)
Escopo: RF37; UC37
Branch: feature/refatoracao-documentacao
Commit: 464c190
Data de revisão: 2026-11-10
Responsável(eis): [nome de quem revisa e assina o documento]
Estado: Parcial
Fontes: documentos/entrega3_Di2/lista_presenca.md; sistema/better-meet/src/app/lista-presenca.tsx; sistema/api/tests/consolidateListaPresenca.test.mjs; sistema/api/tests/applyMarcacoesPresenca.test.mjs; sistema/api/tests/listaPresencaSchema.test.mjs; sistema/better-meet/src/services/listaPresencaService.ts
```

## Descrição

Usuário da prévia demonstra geração e versionamento em memória. O núcleo puro de consolidação (`RF-LP01` do texto de origem: presentes, atrasados, saída antecipada, ausentes e sem resposta) está preparado e testado, mas não é chamado por nenhuma rota.

Texto do requisito de origem (`lista_presenca.md`):

> Salvar as marcações e observações em nova versão local e permitir selecionar versões anteriores. A revisão copia o snapshot da versão selecionada, preserva seus registros e mantém as escolhas manuais separadas. Observações são validadas antes da confirmação e gravação local. A troca de versão exige confirmação para descartar alterações pendentes.
> **Atual:** revisão da versão selecionada com nova numeração e cópias independentes; histórico em memória reiniciado no foco. Não há reserva de versão no banco, persistência após recarga ou garantia de concorrência.

## Formulário do requisito

| Campo | Conteúdo |
|---|---|
| Entradas | Versão fictícia selecionada, marcações manuais e observações opcionais; botão de salvar. |
| Origem | Ver "Entradas" (a origem é a mesma coluna do texto de origem). |
| Saída | Nova versão temporária e sua visualização. |
| Destino | Ver "Saída". |
| Pré-condições | Cenário local disponível e observações válidas. |
| Pós-condições | Nova versão local selecionada; sem persistência durável. |
| Efeitos colaterais | Nenhuma escrita real ou correção de presença. |

### Ação

1. Revisar a versão selecionada.
2. Validar marcações/observações e confirmar.
3. Copiar snapshot selecionado e guardar marcações separadas.
4. Selecionar nova versão, preservando histórico local.

## Caso de uso UC37 — Gerar versão local da lista de presença

| Item | Conteúdo |
|---|---|
| Objetivo | Usuário da prévia demonstra geração e versionamento em memória. |
| Atores | Usuário comum (`Role.USER`), simulando o Administrador da comissão na prévia. |
| Requisito | RF37 |
| Gatilho | O usuário salva uma revisão da versão selecionada. |
| Fluxo principal | Ver "Ação". |
| Erros | Validação inválida impede gerar; cancelar confirmação preserva o estado. |
| Pós-condições | Nova versão local selecionada; sem persistência durável. |
| Relações UML | Nenhum `include` nem `extend`. |
| Rastreabilidade | RF37; requisito do slide: Reunião — Lista de presença; diagrama `DCU-Lista-de-Presenca` |

### Diagrama de casos de uso

![Diagrama de casos de uso — Reunião — Lista de presença](../Diagramas/DCU-Lista-de-Presenca.svg)

Fonte: [`DCU-Lista-de-Presenca.puml`](../Diagramas/DCU-Lista-de-Presenca.puml). O diagrama é do requisito inteiro (Reunião — Lista de presença); este arquivo documenta só o UC37.

## Diagrama de sequência

Prévia local atual:

```mermaid
sequenceDiagram
    actor U as Usuário da prévia
    participant T as ListaPresencaScreen
    participant H as useListaPresencaPreview
    participant M as listaPresencaMock
    participant E as ListaPresencaEditor
    participant F as Formatação textual

    T->>H: resetPreview() ao receber foco
    H->>M: createListaPresencaMock()
    M-->>H: Versões fictícias 2 Final e 1 Parcial
    H-->>T: Histórico e versão selecionada
    U->>E: Escolhe status e observação por pessoa
    E-->>T: Marcações do rascunho
    T->>T: Atualiza resumo sem mudar o snapshot
    U->>T: Solicita salvar e confirma
    T->>H: generateVersion(data)
    H->>M: createListaPresencaMockVersion(proximaVersao, data)
    M-->>H: Metadados locais da nova versão
    H->>H: Copia snapshot selecionado e mescla marcações separadas
    H-->>T: Histórico local atualizado
    U->>T: Seleciona versão
    opt Há revisão pendente
        T-->>U: Confirma descarte antes de trocar
    end
    T->>H: selectVersion(id)
    H-->>T: Versão selecionada
    U->>T: Compartilha texto ou exporta CSV salvo
    T->>F: formatListaPresencaText(listaSelecionada)
    Note over T,F: CSV usa formatListaPresencaCsv(listaSelecionada)
    F-->>T: Conteúdo da versão salva com marcações
    T->>T: Adiciona aviso de dados fictícios
    T-->>U: Copia texto ou baixa CSV no navegador, compartilha texto no dispositivo
    Note over T,M: Sem HTTP, banco ou armazenamento persistente
```

Consolidação pura preparada (função de núcleo, sem banco):

```mermaid
sequenceDiagram
    participant T as Teste ou futuro serviço
    participant C as consolidateListaPresenca.ts
    participant S as Funções internas

    T->>C: consolidateListaPresenca(source, geradoEm)
    C->>S: validateSource(source, geradoEm)
    alt Fonte inconsistente ou reunião cancelada
        S-->>C: AppError(409)
        C-->>T: Lança erro sem efeito persistente
    else Fonte válida
        loop Convidados aceitos ou pendentes
            C->>S: consolidateMembro(convidado, inicio, fim, geradoEm)
            S->>S: sumPermanencia(intervalos)
            S->>S: getStatus(convidado, entrada, atrasado, saiuAntes)
            S-->>C: MembroListaPresenca
        end
        C-->>T: ListaPresencaConsolidada
    end
```

## Requisitos não funcionais

- RNF42 — Consistência da contagem do snapshot
- RNF43 — Sobreposições contadas uma vez e permanência limitada
- RNF44 — Rótulos e mensagens em português do Brasil
- RNF46 — Nova versão não altera versões anteriores
- RNF47 — Nenhum ID interno digitado ou exibido
- RNF51 — TypeScript estrito e sem `any` no código novo

## Divergências e lacunas

- O histórico de versões vive em memória e é reiniciado ao voltar à tela; não há versão no banco.
- O texto de origem chamava este caso de uso de UC-LP02, e os requisitos de RF-LP03 (versões) e RF-LP01 (consolidação).

## Testes

CT-RF37-01 a CT-RF37-05: TM-LP02, TM-LP04, TM-LP05, TM-LP11 e TM-LP14 (roteiro manual, mockup) e TP-LP01 a TP-LP20 (núcleo puro, `sistema/api/tests/consolidateListaPresenca.test.mjs`). Resultados: ver o "Registro de resultados" do `lista_presenca.md`; não reexecutados nesta etapa (`Não executado`).
