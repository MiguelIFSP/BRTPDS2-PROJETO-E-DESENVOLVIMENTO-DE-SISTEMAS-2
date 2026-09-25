# Plano de Testes

### 1. Objetivos
O objetivo deste plano é garantir a estabilidade, segurança e usabilidade do Sistema de Gerenciamento de Reuniões. Devido à sua natureza de distribuição local (Self-Hosted) e foco em dispositivos móveis, os testes visam assegurar que tanto o aplicativo mobile quanto a infraestrutura de servidor local rodem de forma consistente em diferentes ambientes corporativos.

### 2. Níveis de Teste
*   **Testes Unitários:** Focados em validar regras de negócio isoladas no backend (Node.js) e o estado e renderização de componentes individuais no frontend (React Native + Zustand).
*   **Testes de Integração:** Validação da comunicação entre a API Express e o banco de dados MySQL (via Prisma ORM), além da integração do aplicativo mobile com os endpoints da API.
*   **Testes de Sistema / E2E (End-to-End):** Simulação do fluxo completo do usuário no aplicativo (ex: criar pauta, iniciar reunião, adicionar Action Items e finalizar), garantindo que o ciclo completo da reunião funcione em harmonia.
*   **Testes de Usabilidade:** Avaliação manual com foco na interface mobile, garantindo que o aplicativo seja intuitivo e cumpra a premissa de "baixa curva de aprendizado" sem a necessidade de treinamentos longos.
*   **Testes de Infraestrutura (Lançador):** Validação do "Painel Lançador em Java" para assegurar que os containers Docker (API e Banco) iniciam e encerram corretamente em sistemas operacionais Windows e Linux, sem fricção para o usuário final.

### 3. Ferramentas Propostas
Para manter o padrão tecnológico do projeto, propomos as seguintes ferramentas:
*   **Backend:** Jest (Testes Unitários) e Supertest (Testes de Integração de rotas da API REST).
*   **Frontend:** Jest em conjunto com a React Native Testing Library (para componentes visuais).
*   **Testes Manuais de API:** Postman ou Insomnia (para validação ágil de endpoints durante o desenvolvimento).

### 4. Critérios de Aceite
Para que um incremento de desenvolvimento (entrega) seja considerado válido:
*   As atualizações de sistema não devem exigir que o usuário reinicie a configuração do zero, preservando obrigatoriamente os dados armazenados nos incrementos anteriores.
*   A API REST deve ser capaz de lidar com requisições e devolver respostas estruturadas com os devidos códigos HTTP (ex: 200, 201, 400, 500).
*   O Painel em Java deve iniciar os serviços (Node.js + MySQL) de forma invisível, abstraindo a complexidade de terminais e garantindo a operação *Zero-Cost* local.