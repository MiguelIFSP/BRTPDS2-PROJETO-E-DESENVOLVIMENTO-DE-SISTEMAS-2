# Padrões de Nomenclatura, Práticas de Programação e Documentação

Para garantir a organização, legibilidade e facilidade de manutenção do projeto, serão adotados padrões de nomenclatura e boas práticas de desenvolvimento durante todo o ciclo de implementação da aplicação.

---

## 1. Padrões de Nomenclatura

### 1.1 Telas (Screens)

As telas da aplicação serão nomeadas utilizando o padrão **PascalCase**, com o sufixo `Screen`.

**Exemplos:**

```text
LoginScreen.tsx
HomeScreen.tsx
MeetingListScreen.tsx
MeetingDetailsScreen.tsx
CreateMeetingScreen.tsx
```

---

### 1.2 Componentes

Os componentes reutilizáveis também utilizarão o padrão **PascalCase**.

**Exemplos:**

```text
Button.tsx
MeetingCard.tsx
CalendarView.tsx
ParticipantList.tsx
InputField.tsx
```

---

### 1.3 Variáveis e Funções

Será utilizado o padrão **camelCase**.

**Exemplo:**

```javascript
const meetingTitle = "Reunião semanal";

function createMeeting() {
  // código
}
```

#### Regras

* Os nomes devem ser claros e representar sua finalidade.
* Evitar nomes genéricos como `data`, `item` e `value` quando houver possibilidade de especificação.
* As funções devem representar ações, utilizando verbos.

**Exemplos:**

```text
getMeetings()
createUser()
updateMeeting()
deleteParticipant()
```

---

### 1.4 Constantes

As constantes globais utilizarão o padrão **UPPER_SNAKE_CASE**.

**Exemplos:**

```javascript
const API_URL = "https://api.sistema.com";

const MAX_PARTICIPANTS = 50;
```

---

### 1.5 Arquivos e Pastas

As pastas serão organizadas utilizando nomes em **minúsculo**.

**Exemplo:**

```text
src/
├── screens/
├── components/
├── services/
├── hooks/
└── utils/
```

Os arquivos seguirão o padrão **camelCase**, utilizando a extensão correspondente à tecnologia empregada.

**Exemplos:**

```text
meetingService.ts
authController.ts
userRepository.ts
```

---

### 1.6 Banco de Dados

As tabelas e os campos do banco de dados seguirão o padrão **snake_case**.

**Exemplo de tabela:**

```text
meeting_participants
```

**Exemplos de campos:**

```text
created_at
start_time
end_time
user_id
```

---

## 2. Práticas de Programação

### 2.1 Organização do Código

Será utilizada uma arquitetura baseada na **separação de responsabilidades**, garantindo que cada camada do sistema possua uma função bem definida.

As principais responsabilidades serão:

* **Componentes:** responsáveis pela interface e apresentação dos dados.
* **Hooks:** responsáveis pela reutilização de lógica.
* **Services:** responsáveis pela comunicação com APIs e serviços externos.
* **Repositories:** responsáveis pelo acesso e persistência dos dados.

A comunicação entre as camadas seguirá, preferencialmente, o seguinte fluxo:

```text
Tela
 ↓
Hook
 ↓
Service
 ↓
API
 ↓
Banco de Dados
```

---

### 2.2 Controle de Versão

Será utilizado **Git** para gerenciamento do código-fonte.

#### Práticas adotadas

* Utilizar commits pequenos e descritivos.
* Criar branches específicas para cada funcionalidade ou correção.
* Realizar revisão de código antes da integração.
* Evitar commits que misturem alterações de diferentes funcionalidades.
* Manter a branch principal sempre estável.

#### Padrão de mensagens de commit

As mensagens seguirão o padrão de **Conventional Commits**.

**Exemplos:**

```text
feat: adiciona cadastro de reuniões

fix: corrige validação de horário

docs: atualiza documentação da API
```

Outros tipos poderão ser utilizados conforme a necessidade:

```text
refactor: reorganiza serviço de autenticação

test: adiciona testes para criação de reuniões

chore: atualiza dependências
```

---

### 2.3 Padronização de Código

Serão utilizadas ferramentas para garantir a qualidade, consistência e padronização do código:

* **ESLint:** análise estática do código e identificação de possíveis problemas.
* **Prettier:** formatação automática do código.
* **TypeScript:** tipagem estática e redução de erros durante o desenvolvimento.

Essas ferramentas deverão ser configuradas de forma consistente para todo o projeto.

---

### 2.4 Tratamento de Erros

Todos os erros deverão ser tratados de forma adequada, evitando comportamentos inesperados e proporcionando uma boa experiência ao usuário.

Entre as práticas adotadas estão:

* Exibir mensagens amigáveis ao usuário.
* Registrar erros relevantes no backend.
* Validar os dados antes do envio.
* Validar dados recebidos pela API.
* Evitar exposição de informações internas ou sensíveis.
* Utilizar códigos HTTP apropriados nas respostas da API.

**Exemplo conceitual:**

```text
Erro interno
     ↓
Registro no servidor
     ↓
Resposta HTTP apropriada
     ↓
Mensagem amigável ao usuário
```

---

### 2.5 Segurança

Serão seguidas boas práticas de segurança durante o desenvolvimento da aplicação.

Entre elas:

* Nunca armazenar senhas em texto puro.
* Utilizar mecanismos seguros de autenticação por token.
* Validar e sanitizar dados recebidos pela API.
* Não expor informações sensíveis no aplicativo.
* Não armazenar credenciais diretamente no código-fonte.
* Utilizar variáveis de ambiente para configurações sensíveis.
* Aplicar controle de acesso adequado aos recursos da aplicação.

---

## 3. Práticas de Documentação

### 3.1 Documentação do Código

Funções, classes e módulos importantes deverão possuir comentários explicativos sempre que necessário para facilitar a compreensão e manutenção do código.

**Exemplo:**

```javascript
/**
 * Cria uma nova reunião no sistema.
 *
 * @param meeting Dados da reunião
 * @returns Reunião criada
 */
createMeeting(meeting);
```

Os comentários devem explicar principalmente **por que** determinada lógica existe, evitando comentários desnecessários que apenas descrevam o código de forma óbvia.

---

### 3.2 Documentação da API

A API será documentada utilizando o padrão **Swagger/OpenAPI**.

A documentação deverá conter:

* Endpoints disponíveis.
* Métodos HTTP utilizados.
* Parâmetros necessários.
* Parâmetros de consulta.
* Headers necessários.
* Exemplos de requisição.
* Exemplos de resposta.
* Códigos HTTP de retorno.
* Exemplos de erros.
* Regras de autenticação e autorização.

**Exemplo conceitual:**

```text
POST /meetings

Request:
{
  "title": "Reunião semanal",
  "start_time": "2026-08-10T10:00:00Z",
  "end_time": "2026-08-10T11:00:00Z"
}

Response:
{
  "id": 1,
  "title": "Reunião semanal",
  "start_time": "2026-08-10T10:00:00Z",
  "end_time": "2026-08-10T11:00:00Z"
}
```

---

### 3.3 Documentação do Projeto

Será mantida documentação atualizada contendo as principais informações necessárias para desenvolvimento, manutenção e implantação do sistema.

A documentação deverá contemplar:

* Arquitetura do sistema.
* Tecnologias utilizadas.
* Estrutura de diretórios.
* Configuração do ambiente.
* Variáveis de ambiente.
* Processo de instalação.
* Processo de execução da aplicação.
* Processo de build e implantação.
* Integrações externas.
* Documentação da API.
* Histórico de alterações.

---

### 3.4 Revisões

Antes da entrega de novas funcionalidades, será realizada uma revisão para garantir a qualidade e conformidade do desenvolvimento.

A revisão deverá verificar:

* [ ] Padrões de nomenclatura.
* [ ] Organização do código.
* [ ] Separação adequada de responsabilidades.
* [ ] Qualidade do código.
* [ ] Documentação atualizada.
* [ ] Testes funcionando corretamente.
* [ ] Tratamento adequado de erros.
* [ ] Práticas de segurança aplicadas.
* [ ] Ausência de erros críticos.
* [ ] Código revisado por outro desenvolvedor, quando aplicável.

---

## 4. Padronização de Design do Mockup

A interface do aplicativo foi concebida com uma linguagem visual consistente para garantir clareza, hierarquia visual e boa experiência de uso em diferentes contextos. A padronização do design considera tanto a navegação principal quanto os componentes de reunião, calendário, alertas e ações rápidas.

### 4.1 Diretrizes visuais adotadas

* Uso da paleta principal do projeto: `#0F172A`, `#134E4A`, `#0F766E`, `#CCFBF1` e `#FFFFFF`.
* Contraste adequado entre fundo, textos, cards e botões para garantir legibilidade.
* Aplicação de bordas suaves, sombras discretas e cantos arredondados para manter uma estética moderna e amigável.
* Componentes com foco em leitura rápida, como cards de reunião, badges de participantes e botões de ação.
* Hierarquia visual clara para títulos, subtítulos, status e informações secundárias.
* Adaptação para tema escuro e tema claro, mantendo a consistência da identidade visual do produto.
* Tipografia principal definida como `Plus Jakarta Sans`, com foco em legibilidade, modernidade e aparência técnica.

A paleta foi definida para equilibrar contraste, proximidade visual com o tema profissional e boa legibilidade em telas de uso contínuo. A fonte `Plus Jakarta Sans` foi escolhida por possuir formas geométricas limpas, alta legibilidade e aparência contemporânea, o que reforça a identidade visual do produto. O acesso ao mockup de interface pode ser consultado em: https://www.figma.com/make/WoDgc9ehJDPPSmXOWnD4b8/React-Native-app-creation?t=ihj4W8hCFFYj6RFa-1

### 4.2 Tema escuro

O tema escuro foi pensado para manter visual limpo, elegante e com alto contraste, ideal para uso em ambientes de baixa iluminação.

![Tema escuro - visão geral do aplicativo](prints_mockup/Captura%20de%20tela%202026-08-14%20002050.png)

![Tema escuro - lista de reuniões](prints_mockup/Captura%20de%20tela%202026-08-14%20002151.png)

![Tema escuro - calendário e agendamento](prints_mockup/Captura%20de%20tela%202026-08-14%20002341.png)

### 4.3 Tema claro

O tema claro reforça a acessibilidade visual e mantém a mesma identidade da interface, com maior leveza na tela e foco em elementos de ação e informação.

![Tema claro - visão geral do aplicativo](prints_mockup/Captura%20de%20tela%202026-08-14%20003119.png)

![Tema claro - detalhes de reunião](prints_mockup/Captura%20de%20tela%202026-08-14%20003156.png)

![Tema claro - calendário e agenda](prints_mockup/Captura%20de%20tela%202026-08-14%20003242.png)

### 4.4 Observações de padronização

Os mockups demonstram que a interface segue uma estrutura visual consistente em ambos os temas:

* cards com fundo de mesma tonalidade para agrupamento de informações;
* botões de ação principal em destaque com cor verde-turquesa;
* ícones e badges com alta visibilidade;
* separação clara entre bloco de dados, status e ações;
* uso uniforme de espaçamento, tipografia e elementos de foco.

Essa padronização deve ser preservada na implementação da aplicação para manter coesão entre as telas e facilitar a manutenção futura do projeto.

---

## 5. Objetivo dos Padrões

A adoção desses padrões tem como objetivo:

* Manter o projeto organizado.
* Facilitar a leitura e compreensão do código.
* Facilitar a colaboração entre desenvolvedores.
* Reduzir a ocorrência de erros.
* Facilitar a manutenção da aplicação.
* Padronizar o processo de desenvolvimento.
* Facilitar a entrada de novos desenvolvedores no projeto.
* Garantir maior consistência na documentação.
* Permitir a evolução da aplicação de forma sustentável.

A padronização deverá ser aplicada durante todo o ciclo de desenvolvimento, desde a criação de novas funcionalidades até a manutenção e evolução das funcionalidades existentes.
