# Padrões de Interface - BetterMeet

> **Projeto:** Sistema de Gerenciamento de Reuniões (BetterMeet)  
> **Objetivo:** Documentar padrões de interface, layouts de telas, fluxos de navegação e componentes visuais utilizados na aplicação.

---

## 1. Estrutura Geral da Aplicação

### 1.1 Navegação Principal

A aplicação utiliza uma navegação por **abas (tab bar)** na parte inferior da tela em dispositivos móveis.

**Abas Principais:**
1. **Início** - Exibe as próximas reuniões agendadas
2. **Minhas Reuniões** - Lista todas as reuniões do usuário
3. **Tarefas** - Mostra action items geradas em reuniões
4. **Participantes** - Gerencia lista de participantes recorrentes
5. **Configurações** - Preferências do usuário e sistema

### 1.2 Header Padrão

- **Altura:** 56px (mobile), 64px (desktop)
- **Cor de fundo:** `#0D1B1D` (fundo principal)
- **Conteúdo:**
  - Título/logo da página à esquerda
  - Ícone de ação à direita (dados do dia, botão adicionar, etc)
- **Border inferior:** 1px `#557B88`

---

## 2. Padrões de Tela

### 2.1 Padrão: Tela de Listagem

**Aplicação:** Listagem de reuniões, tarefas, participantes

**Estrutura:**

```
┌─────────────────────────────┐
│ [< Voltar] Título  [Opções] │ ← Header
├─────────────────────────────┤
│ [Filtro 1] [Filtro 2] [...] │ ← Controles de filtro/abas
├─────────────────────────────┤
│                             │
│  ┌──────────────────────┐   │
│  │  Item 1              │   │
│  └──────────────────────┘   │
│                             │
│  ┌──────────────────────┐   │
│  │  Item 2              │   │
│  └──────────────────────┘   │
│                             │
│  ┌──────────────────────┐   │
│  │  Item 3              │   │
│  └──────────────────────┘   │
│                             │
└─────────────────────────────┘
     [+] Botão flutuante
```

**Componentes:**
- **Header:** Logo/título + ação
- **Abas/Filtros:** Seleção de período (Diário, Semanal, Mensal)
- **Lista:** Cards com informações resumidas
- **FAB:** Botão flutuante para criar novo item
- **Espaçamento:** 12px entre cards

**Estados:**
- Lista vazia: Mensagem central "Nenhuma reunião agendada"
- Carregando: Esqueleto (skeleton loading)
- Erro: Mensagem de erro com botão de retry

---

### 2.2 Padrão: Card de Reunião (Listagem)

**Tamanho:** Full width, 80px altura

**Estrutura:**

```
┌────────────────────────────────────┐
│ [Hora]  Título da Reunião  [>]     │
│ Dia, Local  • Participantes        │
└────────────────────────────────────┘
```

**Informações Exibidas:**
- **Horário:** Posicionado à esquerda (ex: "09:00")
- **Dia da semana:** Texto pequeno (ex: "Seg")
- **Título da reunião:** Texto destacado
- **Local/Link:** Texto secundário
- **Participantes:** Avatares empilhados (max 3 visíveis)
- **Seta de ação:** À direita para entrar na reunião

**Cores:**
- Fundo: `#162126`
- Borda: 1px `#557B88`
- Texto primário: `#FFFFFF`
- Texto secundário: `#557B88`

**Interação:**
- Tap: Abre tela de detalhes
- Swipe left: Opções de editar/deletar (se aplicável)

---

### 2.3 Padrão: Tela de Detalhes da Reunião

**Aplicação:** Visualizar/editar uma reunião específica

**Estrutura:**

```
┌─────────────────────────────────────┐
│ [< Voltar]  [Salvar]                │ ← Header
├─────────────────────────────────────┤
│                                     │
│  REALIZADA / AGENDADA / CANCELADA   │ ← Status (tag)
│  Título Reunião                     │
│  📅 Seg, 11 Ago • 09:00-10:30       │
│  📍 Sala Inovação                   │
│  👥 4 participantes                 │
│                                     │
│  ┌──────────────────────────────┐   │
│  │ TÓPICOS DA PAUTA             │   │
│  │ Total: 80 min                │   │
│  │                              │   │
│  │ ▶ Tópico 1 - 20 min          │   │
│  │ ▶ Tópico 2 - 40 min          │   │
│  │ ▶ Tópico 3 - 20 min          │   │
│  │                              │   │
│  │ [+ Adicionar tópico]         │   │
│  └──────────────────────────────┘   │
│                                     │
│  ┌──────────────────────────────┐   │
│  │ [📋 Pauta]  [✏️ Ata]        │   │
│  └──────────────────────────────┘   │
│                                     │
│  ┌──────────────────────────────┐   │
│  │ [Editar Reunião]             │   │
│  └──────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

**Seções:**
1. **Informações da Reunião:**
   - Status (pill/tag com cor correspondente)
   - Título em destaque
   - Data, horário, local
   - Lista de participantes com avatares

2. **Tópicos da Pauta:**
   - Card com fundo teal claro
   - Lista numerada de tópicos
   - Cada tópico com tempo alocado
   - Botão "Adicionar tópico"

3. **Ações:**
   - Dois botões principais: Pauta e Ata
   - Botão grande para editar reunião

**Cores:**
- Tags de status:
  - Realizada: Verde `#4CAF50`
  - Agendada: Teal `#1FD5B5`
  - Cancelada: Cinza `#557B88`

---

### 2.4 Padrão: Tela de Criação/Edição

**Aplicação:** Criar ou editar uma reunião

**Estrutura:**

```
┌─────────────────────────────────────┐
│ [< Voltar]  "Nova Reunião"  [Salvar]│
├─────────────────────────────────────┤
│                                     │
│ TÍTULO DA REUNIÃO                   │
│ ┌──────────────────────────────┐    │
│ │ Título da reunião...         │    │
│ └──────────────────────────────┘    │
│                                     │
│ DATA E HORÁRIO                      │
│ ┌──────────────────────────────┐    │
│ │ 2026-08-11    │ 09:00  10:30 │    │
│ └──────────────────────────────┘    │
│                                     │
│ LOCAL / LINK                        │
│ ┌──────────────────────────────┐    │
│ │ Sala Inovação ou Teams Link  │    │
│ └──────────────────────────────┘    │
│                                     │
│ PARTICIPANTES                       │
│ ┌──────────────────────────────┐    │
│ │ [Ana Lima ✕]  [Carlos S ✕]  │    │
│ │ [Nome do participante] [+]   │    │
│ └──────────────────────────────┘    │
│                                     │
│ TÓPICOS DA PAUTA                    │
│ ┌──────────────────────────────┐    │
│ │ 1. [Tópico 1]    │ [20]  [✕] │   │
│ │ 2. [Tópico 2]    │ [40]  [✕] │   │
│ │ 3. [Tópico 3]    │ [20]  [✕] │   │
│ │                              │    │
│ │ [+ Adicionar tópico]         │    │
│ └──────────────────────────────┘    │
│                                     │
│ ┌──────────────────────────────┐    │
│ │[Cancelar]  [Salvar Alterações]│   │
│ └──────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

**Campos:**
1. **Título da reunião** (obrigatório)
   - Placeholder: "Título da reunião"
   - Max 100 caracteres

2. **Data e Horário** (obrigatório)
   - Dois campos separados (data, início, fim)
   - Datepicker ao tocar
   - Validação: Fim não pode ser antes do início

3. **Local/Link** (obrigatório)
   - Campo de texto
   - Placeholder: "Local / Link"

4. **Participantes** (opcional)
   - Chip de cada participante com ✕ para remover
   - Campo novo participante com + para adicionar
   - Autocomplete de contatos frequentes

5. **Tópicos da Pauta** (opcional)
   - Lista numerada
   - Campo de texto + campo de tempo
   - Botão ✕ para remover
   - Botão + para adicionar novo

**Botões de Ação:**
- **Cancelar:** Volta sem salvar (com confirmação se há mudanças)
- **Salvar/Salvar Alterações:** Valida e persiste dados

---

### 2.5 Padrão: Tela de Menu Principal

**Aplicação:** Menu de navegação e configurações

**Estrutura:**

```
┌─────────────────────────────────────┐
│         bettermeet [logo]           │ ← Logo destacado
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────────────────────┐   │
│  │ 🏠 Início                   │   │
│  └──────────────────────────────┘   │
│                                     │
│  ┌──────────────────────────────┐   │
│  │ 📋 Minhas Reuniões          │   │
│  └──────────────────────────────┘   │
│                                     │
│  ┌──────────────────────────────┐   │
│  │ ✅ Tarefas                  │   │
│  └──────────────────────────────┘   │
│                                     │
│  ┌──────────────────────────────┐   │
│  │ 👥 Participantes            │   │
│  └──────────────────────────────┘   │
│                                     │
│  ┌──────────────────────────────┐   │
│  │ ⚙️ Configurações            │   │
│  └──────────────────────────────┘   │
│                                     │
│  Modo Escuro/Claro [Toggle]         │
│                                     │
└─────────────────────────────────────┘
```

**Elementos:**
- Logo/wordmark da aplicação no topo
- Menu items com ícones e labels
- Cada item é um botão com 48px de altura
- Toggle de modo escuro/claro na base
- Usuário logado (iniciais em badge)

---

### 2.6 Padrão: Vista de Calendário

**Aplicação:** Visualização mensal de reuniões

**Estrutura:**

```
┌─────────────────────────────────────┐
│ [Diário] [Semanal] [Mensal]         │ ← Abas
├─────────────────────────────────────┤
│                                     │
│      Agosto 2026                    │
│  [<]            [>]                 │
│                                     │
│  Seg Ter Qua Qui Sex Sáb Dom        │
│  ┌───┬───┬───┬───┬───┬───┬───┐      │
│  │   │   │   │   │   │   │ 1 │      │
│  ├───┼───┼───┼───┼───┼───┼───┤      │
│  │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │ 8 │ ●    │
│  ├───┼───┼───┼───┼───┼───┼───┤      │
│  │ 9 │10 │11●│12 │13 │14●│15 │      │
│  ├───┼───┼───┼───┼───┼───┼───┤      │
│  │16 │17 │18 │19 │20 │21 │22 │      │
│  ├───┼───┼───┼───┼───┼───┼───┤      │
│  │23 │24 │25 │26 │27 │28 │29 │      │
│  ├───┼───┼───┼───┼───┼───┼───┤      │
│  │30 │31 │   │   │   │   │   │      │
│  └───┴───┴───┴───┴───┴───┴───┘      │
│                                     │
└─────────────────────────────────────┘
```

**Elementos:**
- Abas: Diário, Semanal, Mensal
- Navegação: Botões < e > para mês anterior/seguinte
- Grid de datas (mês completo)
- Indicador • para datas com reuniões
- Indicador mais escuro (contorno) para data selecionada
- Tap em data: Mostra reuniões desse dia

**Variante Diária:**
- Mostrar agenda do dia em timeline vertical
- Horários: 07:00 - 18:00
- Blocos de reunião coloridos (teal)

**Variante Semanal:**
- Mostrar semana (Seg-Dom)
- Datas na linha superior
- Timeline vertical de horários
- Reuniões distribuídas na semana

---

### 2.7 Padrão: Tela de Ata (Notas de Reunião)

**Aplicação:** Registrar/visualizar anotações e decisões da reunião

**Estrutura:**

```
┌─────────────────────────────────────┐
│ [< Voltar]  Reunião    [✓ Salvar]  │
├─────────────────────────────────────┤
│                                     │
│  Alinhamento de Design              │
│  Qua, 13 Ago • 10:00-11:00          │
│  Sala Criativa                      │
│  👥 2 participantes                │
│                                     │
│ [Agendada] [Realizada] [Cancelada]  │ ← Tabs de status
│                                     │
│ RESUMO / NOTAS                      │
│ ┌──────────────────────────────┐    │
│ │ Descreva o que foi discutido │    │
│ │ na reunião...                │    │
│ │                              │    │
│ └──────────────────────────────┘    │
│                                     │
│ DECISÕES TOMADAS                    │
│ ┌──────────────────────────────┐    │
│ │ Nenhuma decisão registrada.  │    │
│ │ [+ Adicionar]                │    │
│ └──────────────────────────────┘    │
│                                     │
│ TAREFAS GERADAS                     │
│ ┌──────────────────────────────┐    │
│ │ ☐ Atualizar componentes do  │    │
│ │   design system              │    │
│ │   Lucas Brito • 20 Ago       │    │
│ │                              │    │
│ │ ☐ Entregar protótipo final  │    │
│ │   Fernanda Nunes • 25 Ago    │    │
│ │                              │    │
│ │ [+ Adicionar]                │    │
│ └──────────────────────────────┘    │
│                                     │
│ ┌──────────────────────────────┐    │
│ │ [Salvar Ata]                 │    │
│ └──────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

**Seções:**
1. **Informações da Reunião:**
   - Título, data, hora, local, participantes
   - Status em tabs

2. **Resumo/Notas:**
   - Textarea grande
   - Placeholder: "Descreva o que foi discutido..."

3. **Decisões Tomadas:**
   - Texto livre ou estruturado
   - Botão adicionar

4. **Tarefas Geradas:**
   - Lista de checkboxes
   - Cada tarefa com responsável e data
   - Botão adicionar

**Interações:**
- Editing: Duplo tap para editar
- Salvar: Persiste automático ou botão Salvar Ata

---

### 2.8 Padrão: Tela de Pauta

**Aplicação:** Definir/editar pauta da reunião

**Estrutura:**

```
┌─────────────────────────────────────┐
│ [< Voltar]           [Salvar]       │
├─────────────────────────────────────┤
│                                     │
│  Planejamento Q3 2026               │
│  📅 Seg, 11 Ago • 09:00-10:30      │
│  📍 Sala Inovação                  │
│  👥 4 participantes                │
│                                     │
│  TÓPICOS DA PAUTA                   │
│  Total: 80 min                      │
│                                     │
│  ┌──────────────────────────────┐   │
│  │ 1. [Revisão de metas Q2]     │   │
│  │    Ana Lima • 20 min         │   │
│  │    [>]                       │   │
│  └──────────────────────────────┘   │
│                                     │
│  ┌──────────────────────────────┐   │
│  │ 2. [Definição de OKRs Q3]    │   │
│  │    Carlos Souza • 40 min     │   │
│  │    [>]                       │   │
│  └──────────────────────────────┘   │
│                                     │
│  ┌──────────────────────────────┐   │
│  │ 3. [Distribuição de...]      │   │
│  │    Rafael Costa • 20 min     │   │
│  │    [>]                       │   │
│  └──────────────────────────────┘   │
│                                     │
│  [+ Adicionar tópico]               │
│                                     │
│ ┌──────────────────────────────┐    │
│ │ [Cancelar]  [Salvar Pauta]   │    │
│ └──────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

**Elementos:**
- Info reunião no topo (resumido)
- Lista numerada de tópicos
- Cada tópico em card com:
  - Número
  - Título
  - Responsável
  - Tempo alocado
  - Ícone de expandir/detalhe
- Botão + Adicionar tópico
- Botões de ação: Cancelar, Salvar Pauta

**Edição de Tópico:**
- Tap no card: Expande para edição
- Campos: Título, Responsável, Duração
- Botões: Remover (X), Confirmar

---

## 3. Fluxos de Navegação

### 3.1 Fluxo Principal: Criar Reunião

```
Tela Inicial
    ↓
[+ Botão FAB]
    ↓
Nova Reunião (form)
    ↓
    ├→ [Cancelar] → Volta para Inicial
    │
    └→ [Criar Reunião] → Sucesso
        ↓
        Tela de Detalhes (nova reunião)
        ↓
        ├→ [Editar] → Tela de Edição
        ├→ [Ver Pauta] → Tela de Pauta
        └→ [Voltar] → Tela Inicial
```

### 3.2 Fluxo: Editar Reunião Existente

```
Listagem de Reuniões
    ↓
[Tap em reunião]
    ↓
Detalhes da Reunião
    ↓
[Editar Reunião]
    ↓
Formulário de Edição
    ↓
    ├→ [Cancelar] → Volta para Detalhes
    │
    └→ [Salvar Alterações] → Sucesso
        ↓
        Detalhes da Reunião (atualizado)
```

### 3.3 Fluxo: Gerenciar Ata

```
Detalhes da Reunião
    ↓
[Botão Ata]
    ↓
Tela de Ata (visualização/edição)
    ↓
├→ [Adicionar Notas] → Textarea ativa
├→ [Adicionar Decisões] → Adiciona item
├→ [Adicionar Tarefas] → Adiciona tarefa
│
└→ [Salvar Ata] → Persiste dados
    ↓
    Volta para Detalhes
```

### 3.4 Fluxo: Gerenciar Pauta

```
Detalhes da Reunião
    ↓
[Botão Pauta]
    ↓
Tela de Pauta (visualização/edição)
    ↓
├→ [Adicionar Tópico] → Form novo tópico
├→ [Editar Tópico] → Form edição
├→ [Remover Tópico] → Confirmação
│
└→ [Salvar Pauta] → Persiste dados
    ↓
    Volta para Detalhes
```

### 3.5 Fluxo: Navegar por Abas (Tab Bar)

```
                      ┌─────────────────┐
                      │  Menu Principal │
                      └────────┬────────┘
                               │
         ┌─────────────┬────────┼────────┬─────────────┐
         │             │        │        │             │
    [Início]       [Reuniões] [Tarefas] [Participantes][Config]
         │             │        │        │             │
         └─────────────┴────────┼────────┴─────────────┘
                               │
                        [Aberta qualquer
                         tela da aba]
```

**Comportamento:**
- Tap em aba: Abre tela principal daquela aba
- Já está na aba: Scroll para topo ou atualiza dados
- Navegação com histórico: Botão voltar tira da aba

---

## 4. Estados de Componentes Visuais

### 4.1 Card de Reunião - Estados

**Normal:**
- Fundo: `#162126`
- Borda: 1px `#557B88`
- Sombra: Leve

**Hover/Pressionado:**
- Fundo: `#1A2A30` (levemente mais claro)
- Sombra: Aumentada

**Selecionado:**
- Borda esquerda: 4px `#1FD5B5`
- Fundo: `#1A2A30`

---

### 4.2 Abas/Tabs - Estados

**Ativa:**
- Background: `#1FD5B5`
- Texto: `#0D1B1D`
- Indicador inferior: 3px, 100% da largura

**Inativa:**
- Background: Transparente
- Texto: `#557B88`
- Sem indicador

**Hover:**
- Texto: `#FFFFFF`

---

### 4.3 Botão Primário - Estados

**Normal:**
- Background: `#1FD5B5`
- Texto: `#0D1B1D`
- Sombra: `0px 2px 8px rgba(0,0,0,0.15)`

**Hover:**
- Background: `#2A8D75`

**Pressionado (Active):**
- Background: `#1FA397`
- Transform: scale(0.98)

**Desabilitado:**
- Background: `#B8C9D1`
- Texto: `#557B88`
- Opacity: 0.6
- Cursor: not-allowed

---

## 5. Layouts Responsivos

### 5.1 Mobile (< 600px)

- Full width cards
- Stack vertical
- Font size base: 14px
- Botões: 48px × 48px (toque)
- Header: 56px

### 5.2 Tablet (600px - 1000px)

- Cards em grid 2 colunas
- Maior padding/spacing
- Font size base: 16px
- Sidebar opcional

### 5.3 Desktop (> 1000px)

- Cards em grid 3-4 colunas
- Layout com sidebar
- Font size base: 14-16px
- Mais espaço para detalhes

---

## 6. Padrões de Feedback ao Usuário

### 6.1 Mensagens de Sucesso

**Toast/Snackbar:**
- Background: Verde `#4CAF50`
- Texto: Branco
- Ícone: Checkmark
- Duração: 3 segundos
- Posição: Inferior esquerda

**Exemplo:** "Reunião salva com sucesso!"

### 6.2 Mensagens de Erro

**Toast/Snackbar:**
- Background: Vermelho `#F44336`
- Texto: Branco
- Ícone: X
- Duração: 5 segundos
- Posição: Inferior esquerda

**Exemplo:** "Erro ao salvar reunião. Tente novamente."

### 6.3 Confirmações

**Modal Dialog:**
- Título: "Tem certeza?"
- Mensagem: Descrição da ação
- Botão Cancelar: Texto `#557B88`
- Botão Confirmar: Fundo `#1FD5B5`

**Exemplo:** "Deseja realmente deletar essa reunião? Esta ação não pode ser desfeita."

### 6.4 Loading

**Indicador de Progresso:**
- Spinner circular animado
- Cor: `#1FD5B5`
- Tamanho: 40px × 40px
- Fundo: Overlay semi-transparente

### 6.5 Estados Vazios

**Tela Vazia:**
- Ícone central (50px)
- Título: "Nenhuma reunião agendada"
- Subtítulo: "Crie uma reunião para começar"
- Botão: "Criar Reunião"

---

## 7. Padrões de Entrada de Dados

### 7.1 Validação de Campos

**Campos Obrigatórios:**
- Placeholder com "*" (asterisco)
- Borda vermelha em foco se vazio e desfocado sem preenchimento
- Mensagem de erro abaixo do campo

**Validação em Tempo Real:**
- Email: Padrão RFC 5322
- Telefone: Formato brasileiro (11) 9xxxx-xxxx
- Data: Apenas datas futuras
- Horário: Fim > Início

### 7.2 Placeholders e Labels

**Label:**
- Acima do campo
- Font size: 12px
- Peso: 500
- Cor: `#557B88`

**Placeholder:**
- Dentro do campo
- Cor: `#557B88`
- Italic (opcional)

---

## 8. Padrões de Acessibilidade

### 8.1 Indicadores de Foco

- Todos os elementos interativos têm outline visível
- Outline: 2px sólida `#1FD5B5`
- Offset: 2px

### 8.2 Contraste

Todos os textos cumprem WCAG AA (contrast ratio 4.5:1 mínimo)

### 8.3 Tamanho de Toque

- Botões: Mínimo 44px × 44px
- Links: Mínimo 40px × 40px
- Espaço entre elementos: 8px

### 8.4 Leitores de Tela

- Labels associados a inputs: `aria-label`
- Botões com ícone: `aria-label` descritivo
- Listas: `aria-listbox` / `aria-list`
- Status dinâmico: `aria-live="polite"`

---

## 9. Referências de Telas

As estruturas acima são baseadas nos mockups fornecidos na pasta `prints_mockup/` do projeto:

- **Tela de Listagem:** Padrão em múltiplas telas (Início, Reuniões, Tarefas)
- **Tela de Detalhes:** Visualização completa de uma reunião
- **Tela de Criação:** Form para nova reunião
- **Tela de Ata:** Anotações e decisões
- **Tela de Pauta:** Tópicos e agenda
- **Menu:** Navegação principal
- **Calendário:** Visualizações Diária, Semanal, Mensal

---

## 10. Checklist de Implementação

### Para Cada Nova Tela:

- [ ] Respeitar grid de espaçamento (múltiplos de 4px)
- [ ] Usar cores da paleta definida
- [ ] Aplicar tipografia conforme scale
- [ ] Incluir header com navegação
- [ ] Implementar estado de loading
- [ ] Implementar estado vazio/erro
- [ ] Adicionar feedback visual (toast/snackbar)
- [ ] Validar acessibilidade (contraste, tamanho de toque)
- [ ] Testar em mobile e desktop
- [ ] Documentar fluxos de navegação

---

## 11. Evoluções Futuras

- [ ] Adicionar suporte a modo claro completo
- [ ] Implementar swipe gestures em cards
- [ ] Adicionar drag & drop para reordenar tópicos
- [ ] Busca e filtros avançados
- [ ] Compartilhamento de reuniões
- [ ] Integração com calendários externos

---

**Data de criação:** 14/08/2026  
**Versão:** 1.0  
**Próxima revisão:** Após primeira entrega de incremento (Di1)
