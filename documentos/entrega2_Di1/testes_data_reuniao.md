# Verificação da data das reuniões

Data: 21-10-2026.

Fluxo: criação de reunião pela seleção de data no calendário.
Defeito: a tela enviava DD/MM/AAAA, enquanto a API valida AAAA-MM-DD.
Correção: data local enviada em AAAA-MM-DD; formulário, reuniões e convites exibem DD-MM-AAAA. O calendário e o envio usam o mesmo estado.

Teste de regressão: src/components/__tests__/ReunioesData.test.tsx. Simula a escolha de 29-02-2028 às 23h30, verifica a exibição e o envio de 2028-02-29, sem trocar o dia por conversão UTC. Simula também a escolha dos horários e o salvamento com sucesso. As chamadas à API são simuladas; nenhum registro é criado no banco.

Em sistema/better-meet:

- npm test -- --runInBand ReunioesData ReuniaoCheckIn: 2 suítes, 8 testes aprovados, 0 falhas.
- npm run typecheck: aprovado.
- npx eslint "src/app/(tabs)/(reunioes)/index.tsx" src/components/__tests__/ReunioesData.test.tsx: aprovado.
- Prettier aplicado aos dois arquivos alterados.

A verificação automatizada não substitui a validação visual no celular físico.

## Verificação dos avisos do celular

Data: 21-10-2026.

O usuário confirmou a criação de reunião e o check-in no celular, com Presença Confirmada.

Substituído onChange por onValueChange e onDismiss nos três seletores (data, início e término). Cancelamento fecha o seletor sem alterar o valor. Foram acrescentados três casos de regressão para cancelamento e reabertura; o teste de criação usa os novos eventos.

Resultado atualizado: npm test -- --runInBand ReunioesData ReuniaoCheckIn: 2 suítes, 11 testes aprovados, 0 falhas. Typecheck e ESLint dos arquivos alterados aprovados.

O aviso Cannot connect to Expo CLI é da conexão de desenvolvimento. No computador, o servidor respondeu HTTP 200 em 192.168.2.44:8081/status e o WebSocket /hot conectou. A causa da interrupção no celular não foi determinada; orientar recarregar o app com ambos na mesma rede. Nenhuma alteração de firewall ou de dependências foi realizada.
