# Arquitetura do Sistema - PDS2

> **Projeto:** Pauta / Tópico / Ata  
> **Objetivo desta página:** documentar a arquitetura, os principais componentes, tecnologias utilizadas e a forma de implantação do sistema.

---

## Visão Geral

O sistema foi projetado para ser executado na infraestrutura do próprio cliente, preferencialmente em um servidor Linux, utilizando Docker para facilitar a implantação, manutenção e atualização dos serviços.

A arquitetura é composta por:

- Aplicativo Mobile para os usuários;
- Frontend da aplicação;
- Backend com API REST;
- Banco de dados MySQL;
- Painel Administrativo Desktop em Java;
- Volumes persistentes para dados, uploads e backups;
- Recursos de infraestrutura e segurança do servidor.

---

## Diagrama da Arquitetura

<div align="center">
   <img width="724" height="520" alt="arquitetura" src="https://github.com/user-attachments/assets/d3c6d762-e8ed-40d6-8bc1-2937165a9562"/>
</div>
---

## Estrutura Principal

### Servidor do Cliente

O sistema deve ser hospedado em uma máquina física ou virtual pertencente ao cliente.

**Sistema operacional recomendado:**

- Linux

No servidor são executados os containers responsáveis pelos principais serviços do sistema.

---

## Docker

A aplicação utiliza o **Docker Engine** para execução dos containers e o **Docker Compose** para organização e gerenciamento dos serviços.

Os principais componentes executados no ambiente Docker são:

### Frontend

Responsável pela interface da aplicação.

**Tecnologias:**

- React Native;
- Zustand;

---

### Backend

Responsável pelas regras de negócio, comunicação com o banco de dados e disponibilização dos serviços da aplicação.

**Tecnologias:**

- Node.js;
- Express;
- API REST;
- Prisma;
- BetterAuth.

O frontend se comunica com o backend por meio da API REST.

---

### Banco de Dados

O banco de dados utilizado é o **MySQL**.

**Porta padrão:**

```text
3306
```

O backend é responsável pela comunicação com o banco de dados.

---

## Fluxo de Comunicação

O fluxo principal da aplicação pode ser representado da seguinte forma:

```text
Aplicativo Mobile
       ⇅
    Frontend
       ⇅
     Backend
       ⇅
      MySQL
```

O usuário acessa o sistema pelo aplicativo mobile, enquanto o frontend e o backend realizam o processamento e acesso aos dados.

---

## Aplicativo Mobile

Os usuários utilizam um aplicativo desenvolvido com **React Native**.

O aplicativo é responsável por disponibilizar as funcionalidades do sistema aos usuários finais e realizar a comunicação com os serviços disponíveis no servidor.

---

## Painel Administrativo

O sistema também possui um **Painel Administrativo Desktop desenvolvido em Java**.

O painel permite realizar tarefas administrativas sem a necessidade de executar comandos diretamente no terminal do servidor.

### Funcionalidades previstas

- Consultar o status dos serviços;
- Reiniciar serviços;
- Executar backup;
- Restaurar backup;
- Realizar atualizações;
- Visualizar logs;
- Alterar configurações do sistema.

---

## Persistência de Dados

Para evitar a perda de informações quando containers forem reiniciados ou recriados, são utilizados **volumes persistentes**.

Os principais volumes são:

### Uploads

Armazena arquivos enviados pelos usuários ou gerados pela aplicação.

### Dados do Banco

Armazena os arquivos persistentes do banco de dados MySQL.

### Backups

Armazena cópias de segurança dos dados do sistema.

---

## Infraestrutura

Além dos containers da aplicação, o servidor possui recursos responsáveis pela comunicação, armazenamento e segurança.

### Firewall

O firewall recomendado é o **UFW**, responsável por controlar o acesso às portas e serviços disponíveis no servidor.

### Rede / Internet

A conexão de rede permite o acesso dos dispositivos dos usuários aos serviços disponibilizados pelo servidor.

### Armazenamento

O servidor deve possuir espaço suficiente para:

- Banco de dados;
- Arquivos enviados;
- Logs;
- Backups;
- Imagens Docker;
- Arquivos necessários para funcionamento da aplicação.

---

## Tecnologias Utilizadas

| Tecnologia | Utilização |
|---|---|
| Linux | Sistema operacional recomendado para o servidor |
| Docker | Execução dos containers |
| Docker Compose | Gerenciamento dos serviços |
| React Native | Aplicativo Mobile |
| React Native Web | Frontend |
| Zustand | Gerenciamento de estado |
| Node.js | Backend |
| Express | API e rotas do backend |
| MySQL | Banco de dados |
| Prisma | Acesso e gerenciamento dos dados |
| BetterAuth | Autenticação |
| Java | Painel Administrativo Desktop |

---

## Benefícios da Arquitetura

A arquitetura proposta oferece os seguintes benefícios:

- Implantação simplificada utilizando Docker;
- Maior facilidade de manutenção;
- Facilidade para realização de backups;
- Dados mantidos sob controle do cliente;
- Uso prioritário de tecnologias Open Source;
- Redução da dependência de infraestrutura de terceiros;
- Maior controle sobre segurança e privacidade;
- Serviços separados em componentes independentes;
- Facilidade para atualização e gerenciamento da aplicação.

---

## Resumo da Arquitetura

```text
Usuário
  │
  ▼
Aplicativo Mobile - React Native
  │
  ▼
Servidor do Cliente
  │
  ├── Docker Engine
  │     │
  │     └── Docker Compose
  │           ├── Frontend
  │           │     ├── React Native Web
  │           │     └── Zustand
  │           │     
  │           │
  │           ├── Backend
  │           │     ├── Node.js
  │           │     ├── Express
  │           │     ├── Prisma
  │           │     ├── BetterAuth
  │           │     └── API REST
  │           │
  │           └── MySQL
  │                 └── Porta 3306
  │
  ├── Volumes Persistentes
  │     ├── Uploads
  │     ├── Dados do Banco
  │     └── Backups
  │
  ├── Firewall - UFW
  ├── Rede / Internet
  └── Armazenamento do Servidor

Painel Administrativo Desktop - Java
  │
  └── Gerenciamento dos serviços do servidor
```

---

## Observações

- O servidor Linux é a opção recomendada para implantação.
- Os dados persistentes não devem permanecer apenas dentro dos containers.
- As credenciais e demais informações sensíveis devem ser armazenadas em variáveis de ambiente ou mecanismo equivalente.
- O acesso às portas do servidor deve ser limitado apenas ao necessário.
- A rotina de backup deve ser definida conforme a necessidade do projeto.
