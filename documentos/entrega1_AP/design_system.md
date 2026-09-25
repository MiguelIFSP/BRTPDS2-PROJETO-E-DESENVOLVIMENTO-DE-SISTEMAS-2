# Design System - BetterMeet

> **Projeto:** Sistema de Gerenciamento de Reuniões (BetterMeet)  
> **Objetivo:** Documentar padrões visuais, componentes, tipografia e especificações de design para manter consistência em toda a aplicação.

---

## 1. Identidade Visual

### 1.1 Logotipo

**Nome do Projeto:** BetterMeet

**Descrição:** Logotipo moderno e minimalista que representa eficiência e comunicação em reuniões.

**Características:**
- Formato: Símbolo + Wordmark horizontal
- Estilo: Geométrico e limpo
- Aplicação: Utilizado como marca principal na navegação e splash screen
- Tipografia do wordmark: Sans-serif moderna

**Logo Principal:**

![BetterMeet Logo](./prints_mockup/logo_bettermeet.png)

**Especificações:**
- Altura mínima: 40px (mobile), 60px (desktop)
- Proteção de espaço: Manter margem mínima de 10px em volta do logo
- Versões: Horizontal (padrão), vertical (quando necessário), monocromática (para footers)

### 1.2 Ícone da Aplicação

**Descrição:** Ícone redondo que representa reuniões/agendamento

**Características:**
- Forma: Circular com cor verde-água como fundo
- Aplicação: Ícone de app, notificações e referências rápidas
- Estilo: Moderno, com canto arredondado na extremidade externa

**Especificações:**
- Tamanho: 180px × 180px (iOS/Android)
- Raio do canto: 39px (curvatura suavizada)
- Versões: Colorida, monocromática

---

## 2. Paleta de Cores

### 2.1 Cores Primárias

| Nome | Código HEX | RGB | Uso |
|------|-----------|-----|-----|
| **Teal/Verde-Água** | `#1FD5B5` | RGB(31, 213, 181) | CTA, botões primários, elementos de destaque, componentes ativos |
| **Teal Escuro** | `#2A8D75` | RGB(42, 141, 117) | Hover estados, pressionado, acentos secundários |
| **Teal Claro** | `#BFEFE9` | RGB(191, 239, 233) | Backgrounds leves, cards alternativos, superfícies secundárias |

### 2.2 Cores de Fundo

| Nome | Código HEX | RGB | Uso |
|------|-----------|-----|-----|
| **Fundo Escuro Primário** | `#0D1B1D` | RGB(13, 27, 29) | Background principal em modo escuro |
| **Fundo Escuro Secundário** | `#162126` | RGB(22, 33, 38) | Superfícies elevadas, cards em modo escuro |
| **Fundo Claro Primário** | `#F0F7F6` | RGB(240, 247, 246) | Background principal em modo claro |
| **Fundo Claro Secundário** | `#FFFFFF` | RGB(255, 255, 255) | Cards, superfícies em modo claro |

### 2.3 Cores Neutras

| Nome | Código HEX | RGB | Uso |
|------|-----------|-----|-----|
| **Cinza Escuro** | `#1F2C31` | RGB(31, 44, 49) | Textos primários, elementos fortes |
| **Cinza Médio** | `#557B88` | RGB(85, 123, 136) | Textos secundários, placeholders |
| **Cinza Claro** | `#B8C9D1` | RGB(184, 201, 209) | Bordas, divisores, backgrounds desabilitados |
| **Branco** | `#FFFFFF` | RGB(255, 255, 255) | Textos em fundos escuros |

### 2.4 Cores de Estado

| Nome | Código HEX | Uso |
|------|-----------|-----|
| **Sucesso** | `#4CAF50` | Confirmações, status completado |
| **Aviso** | `#FFC107` | Alertas, atenção necessária |
| **Erro** | `#F44336` | Erros, validações negativas |
| **Informação** | `#2196F3` | Mensagens informativas |

### 2.5 Modo Escuro vs Claro

**Modo Escuro (Padrão):**
- Fundo primário: `#0D1B1D`
- Texto primário: `#FFFFFF`
- Acentos: `#1FD5B5`
- Cards e superfícies: `#162126`

**Modo Claro:**
- Fundo primário: `#F0F7F6`
- Texto primário: `#1F2C31`
- Acentos: `#2A8D75`
- Cards e superfícies: `#FFFFFF`

---

## 3. Tipografia

### 3.1 Famílias de Fontes

**Fonte Principal (Sans-serif):**
- Nome: Segoe UI / Roboto / -apple-system (fallback chain)
- Aplicação: Body text, labels, títulos
- Razão: Legibilidade em dispositivos móveis, excelente suporte a caracteres especiais

**Fonte Monoespacial (Para código/dados):**
- Nome: Courier New / Menlo
- Aplicação: IDs, códigos, dados técnicos
- Razão: Clareza em informações estruturadas

### 3.2 Escala Tipográfica

| Nível | Tamanho | Peso | Line Height | Letter Spacing | Uso |
|-------|---------|------|-------------|----------------|-----|
| **Display** | 32px | 700 | 1.2 | -0.5px | Títulos principais de telas |
| **Heading 1** | 28px | 700 | 1.3 | -0.25px | Títulos de seções |
| **Heading 2** | 24px | 600 | 1.4 | 0px | Subtítulos, cabeçalhos |
| **Heading 3** | 20px | 600 | 1.4 | 0px | Títulos de cards |
| **Body Large** | 16px | 400 | 1.5 | 0.15px | Textos principais |
| **Body** | 14px | 400 | 1.5 | 0.25px | Textos gerais |
| **Body Small** | 12px | 400 | 1.4 | 0.4px | Textos secundários, datas |
| **Caption** | 11px | 500 | 1.3 | 0.5px | Labels, rodapés |

### 3.3 Pesos de Fonte

- **Regular (400):** Textos de corpo, descrições
- **Medium (500):** Labels de campos, placeholders
- **Semibold (600):** Subtítulos, destaques
- **Bold (700):** Títulos, CTAs

---

## 4. Componentes UI Visuais

### 4.1 Botões

#### Botão Primário
- **Cor de fundo:** `#1FD5B5` (Teal)
- **Cor de texto:** `#0D1B1D` (Texto escuro)
- **Padding:** 12px 24px (mobile), 14px 32px (desktop)
- **Altura:** 48px (mobile)
- **Border radius:** 8px
- **Peso:** Semibold (600)
- **Estados:**
  - Normal: `#1FD5B5` com sombra leve
  - Hover: `#2A8D75` (Teal Escuro)
  - Pressionado: `#1FA397` (Teal mais escuro)
  - Desabilitado: `#B8C9D1` (Cinza Claro)

#### Botão Secundário
- **Cor de fundo:** Transparente / `#162126`
- **Cor de borda:** `#557B88` (Cinza Médio)
- **Cor de texto:** `#1FD5B5`
- **Padding:** 10px 16px
- **Border radius:** 8px
- **Borda:** 1px sólida `#557B88`

#### Botão Terciário
- **Cor de fundo:** Transparente
- **Cor de texto:** `#1FD5B5`
- **Padding:** 8px 12px
- **Border radius:** 6px
- **Sem borda**

### 4.2 Campos de Entrada (Input)

- **Altura:** 48px
- **Padding:** 12px 16px
- **Border radius:** 8px
- **Cor de fundo:** `#162126` (modo escuro)
- **Cor de borda:** `#557B88` (padrão)
- **Cor de borda (foco):** `#1FD5B5` (Teal)
- **Cor de texto:** `#FFFFFF`
- **Placeholder:** `#557B88` (Cinza Médio)
- **Font size:** 14px
- **Linha de altura:** 1.5

**Estados:**
- Normal: Borda cinza, fundo escuro
- Foco: Borda teal, fundo ligeiramente mais claro
- Erro: Borda vermelha (`#F44336`)
- Desabilitado: Fundo `#B8C9D1`, texto cinzento

### 4.3 Cards

- **Background:** `#162126` (modo escuro)
- **Border radius:** 12px
- **Padding:** 16px
- **Sombra:** 0px 2px 8px rgba(0, 0, 0, 0.15)
- **Borda (opcional):** 1px `#557B88` (sutileza)
- **Transição:** 200ms ease-in-out

**Estados:**
- Normal: Sem interação
- Hover: Ligeira elevação, sombra aumentada
- Pressionado: Sombra reduzida

### 4.4 Tabs / Abas

- **Cor de fundo ativa:** `#1FD5B5`
- **Cor de texto ativa:** `#0D1B1D`
- **Cor de texto inativa:** `#557B88`
- **Indicador inferior:** 3px altura, `#1FD5B5`
- **Padding:** 12px 16px
- **Font weight:** 500
- **Border radius:** 24px (píldula) ou 0px (underline)

### 4.5 Badges / Avatares

**Avatar:**
- **Tamanho:** 32px (pequeno), 48px (médio), 64px (grande)
- **Border radius:** 50% (circular)
- **Cor de fundo:** Paleta de cores do projeto (teal principal)
- **Texto:** Iniciais brancas, tamanho ajustado

**Badge:**
- **Tamanho mínimo:** 20px
- **Border radius:** 50% (circular)
- **Cor de fundo:** `#1FD5B5`
- **Cor de texto:** `#0D1B1D`
- **Padding:** 2px 6px
- **Font size:** 11px
- **Font weight:** 600

### 4.6 Chips / Tags

- **Background:** `#BFEFE9` (Teal Claro)
- **Texto:** `#1F2C31` (Cinza Escuro)
- **Padding:** 4px 12px
- **Border radius:** 16px
- **Font size:** 12px
- **Peso:** 500

**Variante com ícone de remoção:**
- Mostrar "X" ao lado do texto
- Clique remove o chip

### 4.7 Switches / Toggle

- **Tamanho:** 48px × 28px
- **Cor ativa:** `#1FD5B5`
- **Cor inativa:** `#557B88`
- **Ponto (thumb):** Branco, 24px de diâmetro
- **Transição:** 300ms ease-in-out

### 4.8 Caixas de Seleção (Checkbox)

- **Tamanho:** 20px × 20px
- **Border radius:** 4px
- **Cor de borda (padrão):** `#557B88`
- **Cor de fundo (selecionado):** `#1FD5B5`
- **Ícone (checkmark):** Branco, 14px
- **Transição:** 200ms ease-in-out

### 4.9 Radio Buttons

- **Tamanho:** 20px × 20px
- **Borda:** 2px
- **Cor de borda (padrão):** `#557B88`
- **Cor de ponto (selecionado):** `#1FD5B5`
- **Tamanho do ponto:** 8px
- **Border radius:** 50%

### 4.10 Modais / Dialogs

- **Background do overlay:** rgba(13, 27, 29, 0.7)
- **Background do modal:** `#162126`
- **Border radius:** 16px
- **Padding:** 24px
- **Sombra:** 0px 10px 40px rgba(0, 0, 0, 0.3)
- **Largura máxima:** 90vw (mobile), 600px (desktop)

---

## 5. Espaçamento

### 5.1 Escala de Espaçamento

Baseado em múltiplos de 4px:

| Tamanho | Pixels | Uso |
|---------|--------|-----|
| **xs** | 4px | Micro espaçamentos, entre ícones |
| **sm** | 8px | Espaçamento entre elementos próximos |
| **md** | 12px | Padding padrão em componentes pequenos |
| **lg** | 16px | Padding padrão em componentes, espaço entre cards |
| **xl** | 24px | Espaço entre seções |
| **2xl** | 32px | Espaço entre grandes blocos |
| **3xl** | 48px | Espaço entre telas completas |

### 5.2 Margem e Padding Padrões

- **Cards:** 16px em todos os lados
- **Botões:** 12px vertical, 24px horizontal
- **Campos de entrada:** 12px vertical, 16px horizontal
- **Listas:** 8px entre itens
- **Seções:** 24px entre seções principais

---

## 6. Sombras e Elevações

### 6.1 Escala de Sombras

| Nível | Sombra CSS |
|-------|-----------|
| **Elevation 1** | `0px 2px 8px rgba(0, 0, 0, 0.15)` |
| **Elevation 2** | `0px 4px 16px rgba(0, 0, 0, 0.20)` |
| **Elevation 3** | `0px 8px 24px rgba(0, 0, 0, 0.25)` |
| **Elevation 4** | `0px 12px 32px rgba(0, 0, 0, 0.30)` |

---

## 7. Ícones

### 7.1 Especificações de Ícones

- **Tamanho padrão:** 24px × 24px
- **Espessura de linha:** 2px
- **Border radius:** 2px (para formas quadradas)
- **Cores:**
  - Ícones primários: `#1FD5B5`
  - Ícones secundários: `#557B88`
  - Ícones em superfícies claras: `#1F2C31`

### 7.2 Biblioteca de Ícones Recomendados

- **Feather Icons** ou **Material Design Icons**
- Consistência: Todos os ícones com o mesmo peso de linha e tamanho

---

## 8. Animações e Transições

### 8.1 Duração de Transições

| Tipo | Duração |
|------|---------|
| **Rápida (interações)** | 150ms |
| **Padrão (mudanças de estado)** | 200ms |
| **Lenta (animações de entrada)** | 300ms |
| **Muito lenta (transições de página)** | 500ms |

### 8.2 Funções de Easing

- **ease-in-out:** Para transições gerais (padrão)
- **ease-out:** Para animações de entrada
- **ease-in:** Para animações de saída
- **cubic-bezier(0.4, 0, 0.2, 1):** Material Design padrão

### 8.3 Animações Principais

**Fade:**
- Opacidade: 0 → 1
- Duração: 200ms

**Slide Up:**
- Transform: translateY(20px) → translateY(0)
- Opacidade: 0 → 1
- Duração: 300ms

**Scale:**
- Transform: scale(0.95) → scale(1)
- Duração: 200ms

---

## 9. Padrões de Acessibilidade

### 9.1 Contraste de Cores

Todos os textos devem atender ao padrão WCAG AA (contrast ratio mínimo 4.5:1):

- Texto claro sobre fundo escuro: Cumpre ✓
- Texto escuro sobre fundo claro: Cumpre ✓
- Teal sobre fundo escuro: Cumpre ✓ (para elementos com significado)

### 9.2 Tamanho Mínimo de Elementos

- **Botões:** 48px × 48px (toque)
- **Links:** 44px × 44px (área de toque)
- **Ícones clicáveis:** 40px × 40px mínimo

### 9.3 Estados de Foco

- **Outline:** 2px sólida `#1FD5B5`
- **Offset:** 2px
- **Aplicável:** Em todos os elementos interativos via teclado

---

## 10. Modo Claro - Variações

Quando o aplicativo está em modo claro, aplicar as seguintes substituições:

| Elemento | Modo Escuro | Modo Claro |
|----------|------------|-----------|
| Fundo principal | `#0D1B1D` | `#F0F7F6` |
| Fundo secundário | `#162126` | `#FFFFFF` |
| Texto primário | `#FFFFFF` | `#1F2C31` |
| Texto secundário | `#557B88` | `#557B88` |
| Acentos | `#1FD5B5` | `#2A8D75` |
| Bordas | `#557B88` | `#D4D4D4` |

---

## 11. Guia de Implementação

### 11.1 Configuração em Código

**CSS Variables (Recomendado):**

```css
:root {
  /* Cores primárias */
  --color-primary: #1FD5B5;
  --color-primary-dark: #2A8D75;
  --color-primary-light: #BFEFE9;

  /* Fundos */
  --bg-primary: #0D1B1D;
  --bg-secondary: #162126;
  
  /* Tipografia */
  --font-family-base: "Segoe UI", Roboto, -apple-system, sans-serif;
  --font-size-base: 14px;
  --font-weight-regular: 400;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  /* Espaçamento */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
}

@media (prefers-color-scheme: light) {
  :root {
    --bg-primary: #F0F7F6;
    --bg-secondary: #FFFFFF;
    --color-text-primary: #1F2C31;
    --color-primary: #2A8D75;
  }
}
```

### 11.2 Uso em Componentes React Native

```javascript
import { StyleSheet } from 'react-native';

export const colors = {
  primary: '#1FD5B5',
  primaryDark: '#2A8D75',
  primaryLight: '#BFEFE9',
  bgPrimary: '#0D1B1D',
  bgSecondary: '#162126',
  textPrimary: '#FFFFFF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const typography = {
  heading1: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 21,
  },
};
```

---

## 12. Referências

- Paleta de cores extraída dos mockups
- Tipografia otimizada para mobile-first
- Componentes seguem Material Design 3 com customizações
- Acessibilidade em conformidade com WCAG 2.1 AA

---

**Data de criação:** 14/08/2026  
**Versão:** 1.0  
**Próxima revisão:** Após primeira entrega de incremento (Di1)
