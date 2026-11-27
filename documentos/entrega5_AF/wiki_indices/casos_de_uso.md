> Entrega final (AF) · Ata, comissões e presença · Versão 1.0 · 27/11/2026.
> Código auditado: `feature/refatoracao-ultima-entrega`, commit <code>614734c</code>. Responsável pela revisão acadêmica: [responsável a informar].
> Estado: implementado, salvo ressalvas expressas. Verificação documental por leitura do código; não equivale à aprovação do professor.

> Documentação atual desta entrega: [Ata, Comissões e Presença](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/Entrega-final-%E2%80%90-Ata-Comiss%C3%B5es-e-Presen%C3%A7a). As páginas históricas abaixo permanecem disponíveis para rastreabilidade.

Os casos de uso descrevem o comportamento básico do sistema.

## Consolidação concluída: Ata, Comissões e Presença

As referências atuais dos três módulos estão reunidas nas páginas abaixo. As páginas antigas com os rótulos “unificar” e “revisar” permanecem somente como histórico, com ligação para o documento vigente.

| Módulo | Casos de uso atuais | Sequências |
|---|---|---|
| Ata | [DCU - Ata: UC35 a UC38](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Ata) | [DS - Ata](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DS-%E2%80%90-Ata) |
| Comissões | [DCU - Comissões: UC39 a UC46](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Comiss%C3%B5es) | [DS - Comissões](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DS-%E2%80%90-Comiss%C3%B5es) |
| Presença | [DCU - Presença: UC47 a UC52](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Presen%C3%A7a) | [DS - Presença](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DS-%E2%80%90-Presen%C3%A7a) |


# Cadastro de usuário
O usuário realiza seu cadastro no sistema, podendo posteriormente solicitar acesso e gerenciar seus próprios dados.
Para mais detalhes, consulte os diagramas de caso de uso no [detalhamento deste tópico](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Cadastro-de-usu%C3%A1rio).

# Cadastro de organizações
O usuário solicita a criação de uma organização, o administrador autoriza/revoga e pode gerenciar as organizações criadas.
Para mais detalhes, diagramas de caso de uso no [detalhamento deste tópico](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Organiza%C3%A7%C3%B5es).

# Configurações de usuário
O usuário autenticado pode alterar e excluir seus dados, escolher preferências de tema e resetar senha.
Para mais detalhes, consulte os diagramas de caso de uso no [detalhamento deste tópico](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Configura%C3%A7%C3%B5es-do-usu%C3%A1rio).
# Comissões

O Módulo de Comissões que permite a estruturação de grupos de trabalho dentro do BetterMeet.

Para mais detalhes, consulte os diagramas de caso de uso no [detalhamento deste tópico](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Comiss%C3%B5es).

# Status do sistema e dos subsistemas

O usuário autenticado consulta o status atual e o histórico dos subsistemas, que são verificados automaticamente a cada 3 horas e podem reportar o próprio status.

Para mais detalhes, consulte os diagramas de caso de uso no [detalhamento deste tópico](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/Caso-de-Uso:-Status-do-sistema-e-dos-subsistemas).

# Relatórios do sistema

O usuário autenticado visualiza indicadores de organizações e comissões, e o administrador também visualiza os relatórios globais e o de usuários, podendo promover ou rebaixar outros usuários a partir da listagem.

Para mais detalhes, consulte os diagramas de caso de uso no [detalhamento deste tópico](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/Caso-de-Uso:-Relat%C3%B3rios-do-sistema).

# Reinicialização de subsistemas

O administrador inicia, para ou reinicia os subsistemas pelo painel de gestão ou pelo app mobile, sem acessar o servidor.

Para mais detalhes, consulte os diagramas de caso de uso no [detalhamento deste tópico](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/Caso-de-Uso:-Reinicializa%C3%A7%C3%A3o-de-subsistemas).

# Setup inicial e inicialização do sistema

O administrador do servidor prepara e inicia todos os subsistemas de uma só vez com o script de setup.

Para mais detalhes, consulte os diagramas de caso de uso no [detalhamento deste tópico](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/Caso-de-Uso:-Setup-inicial-e-inicializa%C3%A7%C3%A3o-do-sistema).

# Reset do sistema

O administrador do servidor encerra os subsistemas e, se desejado, apaga os dados do sistema, podendo fazer backup dos volumes antes.

Para mais detalhes, consulte os diagramas de caso de uso no [detalhamento deste tópico](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/Caso-de-Uso:-Reset-do-sistema).

# Participação em reuniões da comissão
O sistema permite que o presidente convide os membros da comissão para participar de reuniões, possibilitando que os convidados aceitem ou recusem os convites. Além disso, os integrantes e o presidente podem registrar sua entrada e saída das reuniões, permitindo o controle e o acompanhamento da participação dos membros.
Para mais detalhes, consulte os diagramas de caso de uso no [detalhamento deste tópico](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Reuni%C3%B5es).

# Atas

O administrador ou o secretário da comissão redige e edita a ata. Qualquer integrante elegível com entrada registrada pode consultar e votar na versão salva, independentemente do voto do presidente. A exportação exige aprovação e registra a finalização. As quatro operações estão reunidas no DCU - Ata; os textos antigos permanecem apenas como histórico.
Para mais detalhes, consulte os diagramas de caso de uso no [detalhamento deste tópico](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Ata).

# Votações
Quem pode gerir a reunião cria ou encerra uma votação aberta, com título e de duas a seis opções. O usuário registra seu voto.
Para mais detalhes, consulte os diagramas de caso de uso no [detalhamento deste tópico](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/Caso-de-Uso:-Criar-vota%C3%A7%C3%A3o).

# Consultar histórico de reuniões

O usuário vê as reuniões em que sua presença foi registrada, da mais recente para a mais antiga.
Para mais detalhes, consulte o [detalhamento deste caso de uso](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Vota%C3%A7%C3%B5es).

# Registrar entrada na reunião

O membro da comissão registra sua presença na reunião, gravando o horário de entrada.

Para mais detalhes, consulte o [detalhamento deste caso de uso](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Presen%C3%A7a#uc49---registrar-entrada).

# Registrar saída da reunião

O membro da comissão fecha sua presença, gravando o horário de saída sem perder a entrada.

Para mais detalhes, consulte o [detalhamento deste caso de uso](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Presen%C3%A7a#uc50---registrar-saída).

# Manual
O usuário lê o manual dentro do aplicativo, pelo aviso de primeiro acesso ou pela seção Ajuda, e pode exportá-lo em PDF (UC53).
Para mais detalhes, consulte o [detalhamento deste caso de uso](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Manual-do-usu%C3%A1rio).

# Diagramas de sequência - entrega final

- [DS ‐ Ata](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DS-%E2%80%90-Ata)
- [DS ‐ Comissões](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DS-%E2%80%90-Comiss%C3%B5es)
- [DS ‐ Presença](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DS-%E2%80%90-Presen%C3%A7a)
