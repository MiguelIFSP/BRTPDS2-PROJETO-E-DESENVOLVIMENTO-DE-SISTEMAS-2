> Entrega final (AF) · Ata, comissões e presença · Versão 1.0 · 27/11/2026.
> Código auditado: `feature/refatoracao-ultima-entrega`, commit <code>614734c</code>. Responsável pela revisão acadêmica: [responsável a informar].
> Estado: implementado, salvo ressalvas expressas. Verificação documental por leitura do código; não equivale à aprovação do professor.

> Documentação atual desta entrega: [Ata, Comissões e Presença](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/Entrega-final-%E2%80%90-Ata-Comiss%C3%B5es-e-Presen%C3%A7a). As páginas históricas abaixo permanecem disponíveis para rastreabilidade.

# Requisitos Funcionais
Descrevem funcionalidades do sistema.

## RF01 - Cadastrar no sistema
Este requisito é realizado quando a pessoa deseja criar a conta no Better Meet. O sistema valida nome, e-mail e senha, grava a conta com o papel de usuário e pede a confirmação do e-mail. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF01)

## RF02 - Solicitar acesso
Este requisito é o login. A pessoa informa e-mail e senha, o sistema abre a sessão e não há aprovação do administrador para entrar. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF02)

## RF03 - Gerenciar usuários
Este requisito é realizado quando o administrador inclui, promove, rebaixa ou remove uma pessoa. O papel da conta na plataforma não muda. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF03)

## RF04 - Troca de senha de usuário
Este requisito é realizado quando a pessoa autenticada deseja alterar a própria senha. O sistema confere a senha atual, exige uma senha nova diferente e grava o novo hash. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF04)

## RF05 - Recuperação de conta
Este requisito é realizado quando a pessoa pede o link de redefinição e, em seguida, grava a nova senha. O pedido e a troca fazem parte do mesmo caso. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF05)

## RF06 - Alteração de dados pessoais
Este requisito é realizado quando a pessoa autenticada altera o nome ou o e-mail. O nome vale na hora. O e-mail novo só substitui o antigo depois da confirmação. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF06)

## RF07 - Tema preferido do aplicativo
Este requisito é realizado quando a pessoa escolhe Claro, Escuro ou Sistema. A preferência é gravada na conta e aplicada nas sessões seguintes. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF07)

## RF08 - Solicitar criação de organização
Este requisito é realizado quando a pessoa pede uma organização nova. Ela nasce pendente, com o solicitante como criador, até o administrador analisar. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF08)

## RF09 - Consultar as próprias organizações
Este requisito é realizado quando a pessoa abre a aba Organização e vê as organizações das quais participa. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF09)

## RF10 - Consultar todas as organizações
Este requisito é realizado quando o administrador lista todas as organizações da plataforma. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF10)

## RF11 - Consultar uma organização
Este requisito é realizado quando um membro abre uma organização e vê a equipe e os dados dela. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF11)

## RF12 - Renomear organização
Este requisito é realizado quando o administrador, o criador ou o gerente altera o nome da organização. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF12)

## RF13 - Analisar solicitação de organização
Este requisito é realizado quando o administrador aceita ou recusa a organização pendente. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF13)

## RF14 - Excluir organização
Este requisito é realizado quando o administrador ou o criador exclui a organização, depois de confirmar. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF14)

## RF15 - Solicitar acesso a uma organização
Este requisito é realizado quando a pessoa busca uma organização aceita e pede para participar. O criador ou o gerente analisa o pedido. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF15)

## RF16 - Responder pedido de acesso
Este requisito é realizado quando o criador ou o gerente aceita ou recusa o pedido de acesso. O administrador da plataforma não analisa esse pedido só por ser administrador. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF16)

## RF17 - Consultar votações da reunião
Este requisito é a votação criada dentro da reunião, não a votação da ata. A pessoa vê as votações da reunião que está aberta. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF17)

## RF18 - Criar votação
Este requisito é realizado quando o dono da reunião, o administrador da plataforma ou o administrador da comissão cria a votação, com título, de duas a seis opções, tipo aberta ou secreta. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF18)

## RF19 - Registrar voto
Este requisito é realizado quando o participante presente escolhe uma opção, o voto nulo ou troca o voto, se a votação permitir. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF19)

## RF20 - Encerrar votação
Este requisito é realizado quando quem gere a reunião encerra a votação. Depois disso ela não aceita voto novo. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF20)

## RF21 - Excluir votação
Este requisito é realizado quando quem gere a reunião remove a votação. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF21)

## RF22 - Consultar a lista de presença
Este requisito é a lista consolidada da reunião. Quem administra a reunião abre os convidados e os horários já registrados. A entrada e a saída com o código ficam no histórico. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF22)

## RF23 - Marcar presença
Este requisito é realizado quando quem administra marca a pessoa como presente, ausente ou sem marcação. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF23)

## RF24 - Registrar saída ou retorno
Este requisito é realizado quando quem administra anota uma saída temporária ou o retorno, com horário dentro da reunião. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF24)

## RF25 - Exportar a lista em PDF
Este requisito é realizado quando quem administra gera o PDF da lista no próprio aparelho. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF25)

## RF26 - Consultar o histórico de reuniões
Este requisito é realizado quando a pessoa abre as reuniões em que a própria presença foi registrada, da mais recente para a mais antiga. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF26)

## RF28 - Consultar as reuniões
Este requisito é realizado quando a pessoa abre a aba Reuniões e vê as que criou ou cujo convite aceitou. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF28)

## RF29 - Consultar uma reunião
Este requisito é realizado quando a pessoa abre uma reunião e vê dados, comissão, local, pauta e participantes. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF29)

## RF30 - Criar reunião
Este requisito é realizado quando um membro da comissão cria a reunião, com título, data, horários, local e pauta, e pode já convidar a equipe. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF30)

## RF31 - Editar reunião
Este requisito é realizado quando o dono ou o administrador altera título, pauta, descrição, local e horário. A comissão não muda. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF31)

## RF32 - Excluir reunião
Este requisito é realizado quando quem gere a reunião confirma a exclusão. Quem não recusou o convite é avisado. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF32)

## RF33 - Convidar participantes
Este requisito é realizado quando quem gere a reunião convida membros da comissão que ainda não têm convite. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF33)

## RF34 - Responder convite
Este requisito é realizado quando a pessoa aceita ou recusa o próprio convite pendente. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF34)

## RF35 - Registrar a própria entrada
Este requisito é realizado quando o membro da comissão registra a própria entrada com o código de presença e a confirmação do aparelho. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF58)

## RF36 - Registrar a própria saída
Este requisito é realizado quando o membro da comissão registra a própria saída, depois da entrada, com o mesmo código. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF59)

## RF37 - Acessar o manual
Este requisito é realizado quando a pessoa abre o manual dentro do aplicativo, pela aba Mais ou pela apresentação do primeiro login neste aparelho. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF37)

## RF38 - Consultar o status atual
Este requisito é realizado quando a pessoa autenticada abre o status dos subsistemas no aplicativo ou no painel. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF38)

## RF39 - Consultar o relatório diário
Este requisito é realizado quando uma sessão válida pede as checagens de um dia, no fuso de Brasília. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF39)

## RF40 - Consultar o histórico de um subsistema
Este requisito é realizado quando a tela pede o dia a dia de um subsistema, inclusive os dias sem checagem. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF40-Consultar-o-historico-de-um-subsistema)

## RF41 - Executar a checagem periódica
Este requisito é realizado quando a API de monitoramento verifica os seis subsistemas a cada 3 horas. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF41)

## RF42 - Registrar status
Este requisito é realizado quando um sistema informa o próprio status com a chave interna, ou quando o aplicativo e o painel relatam um erro com a sessão. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF42)

## RF43 - Disparar a checagem imediata
Este requisito é realizado quando o administrador, o painel ou o script pede a checagem de um subsistema na hora. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF43)

## Cadastro e gestão de comissões
Este requisito é realizado quando um membro de uma organização aprovada cria, consulta ou exclui uma comissão. O criador entra como administrador. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Comiss%C3%B5es)

## Gestão de equipa e papéis na comissão
Este requisito é realizado quando o administrador ou o facilitador inclui ou remove participantes, com os papéis de administrador, facilitador, secretário e membro. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Comiss%C3%B5es)

## Relatórios de usuários, organizações e comissões
Este requisito é realizado quando a pessoa consulta indicadores. O administrador vê os relatórios globais e o de usuários. A pessoa comum vê as organizações e comissões das quais participa. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/%28revisar%29-RF36)

## Reinicialização de subsistemas
Este requisito é realizado quando o administrador inicia, para ou reinicia um subsistema pelo painel ou pelo aplicativo. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/%28revisar%29-RF37)

## Setup inicial e inicialização do sistema
Este requisito é realizado quando o administrador do servidor prepara e sobe os subsistemas de uma vez. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/%28revisar%29-RF38)

## Reset do sistema
Este requisito é realizado quando o administrador do servidor encerra os subsistemas e, se quiser, apaga os dados. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/%28revisar%29-RF39)

## Ata de reunião
Registro histórico da documentação da ata, consolidado no DCU - Ata. As regras vigentes estão nos RF44 a RF47; o RF40 de origem é preservado para rastreabilidade. [Consultar DCU - Ata consolidado](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Ata)

---

## RF44 - Consultar ata

Consultar o texto salvo, permissões, versão, voto próprio e contagens da ata. [Ver detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF44).

## RF45 - Redigir ata

Salvar o texto da ata e disponibilizar a versão aos participantes elegíveis. [Ver detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF45).

## RF46 - Votar na ata

Registrar aprovação ou reprovação individual da versão salva. [Ver detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF46).

## RF47 - Exportar ata

Exportar o PDF da versão aprovada e registrar sua finalização. [Ver detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF47).

## RF48 - Criar comissão

Criar uma comissão vinculada à organização. [Ver detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF48).

## RF49 - Consultar comissões da organização

Listar as comissões visíveis na organização. [Ver detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF49).

## RF50 - Consultar comissão

Consultar identificação, organização e equipe da comissão. [Ver detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF50).

## RF51 - Editar comissão

Alterar nome e descrição da comissão. [Ver detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF51).

## RF52 - Excluir comissão

Excluir a comissão após confirmação explícita. [Ver detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF52).

## RF53 - Adicionar membro à comissão

Vincular um integrante da organização à equipe da comissão. [Ver detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF53).

## RF54 - Alterar papel de membro

Modificar o papel de um integrante da comissão. [Ver detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF54).

## RF55 - Remover membro da comissão

Desvincular uma pessoa da equipe da comissão. [Ver detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF55).

## RF56 - Consultar código de presença

Exibir o código de presença somente ao Administrador da comissão. [Ver detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF56).

## RF57 - Renovar código de presença

Gerar ou substituir o código da reunião. [Ver detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF57).

## RF58 - Registrar entrada

Registrar a própria entrada com código e confirmação local. [Ver detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF58).

## RF59 - Registrar saída

Registrar a própria saída sem perder o horário da entrada. [Ver detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF59).

## RF60 - Registrar entrada por participante

Registrar uma entrada esquecida por outro participante. [Ver detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF60).

## RF61 - Registrar saída por participante

Registrar uma saída esquecida por outro participante. [Ver detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF61).

## RF62 - Exportar manual em PDF

Gerar o PDF do manual do usuário, com o texto e as capturas de tela, para salvar, compartilhar ou imprimir. O arquivo permite, por exemplo, que a pessoa o envie a uma IA e pergunte como realizar um processo específico. [Ver detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF62).

---

# Requisitos Não Funcionais
Descrevem propriedades do sistema. Cada tema reúne os requisitos não funcionais daquele assunto.

## Cadastro de usuário
RNF01 a RNF03. No máximo cinco logins por minuto, uma pessoa com um vínculo na organização e o teto de um gerente e dois moderadores. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RNFS-%E2%80%90-Cadastro-de-usu%C3%A1rio)

## Configurações de usuário
RNF04 a RNF05. A senha é gravada com scrypt. A recuperação tem teto de pedidos do link e de trocas da senha. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RNFS-%E2%80%90-Configura%C3%A7%C3%B5es-de-usu%C3%A1rio)

## Organização
RNF06 a RNF07. As rotas da organização exigem sessão e o papel conferido. Cada pessoa tem um pedido de acesso por organização. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RNFS-%E2%80%90-Organiza%C3%A7%C3%B5es)

## Votação da reunião
RNF08 a RNF09. Uma pessoa tem um voto em cada votação. A votação secreta não mostra quem votou. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RNFS-%E2%80%90-Vota%C3%A7%C3%B5es)

## Lista de presença
RNF10 a RNF11. A lista só abre para quem administra a reunião. Cada pessoa tem uma marcação. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RNFS-%E2%80%90-Lista-de-presen%C3%A7a)

## Histórico de reuniões
RNF12 a RNF13. Cada pessoa tem um registro de presença na reunião. A entrada e a saída aceitam no máximo vinte registros por minuto. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RNFS-%E2%80%90-Hist%C3%B3rico-do-usu%C3%A1rio)

## Manual do usuário
RNF14 e RNF64. A apresentação do manual aparece uma vez por conta neste aparelho. O manual exportado em PDF mantém todo o conteúdo textual. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RNFS-%E2%80%90-Manual-do-usu%C3%A1rio)

## Reuniões
RNF15 a RNF16. A reunião nasce numa comissão cuja organização foi aceita, e só quem gere altera. Cada pessoa tem um convite na reunião. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RNFS-%E2%80%90-Reuni%C3%B5es)

## Status do sistema
RNF17 a RNF29. A consulta usa a sessão e o registro confere a chave interna. A checagem espera no máximo 5 segundos e não mascara erro recente do aplicativo. O dia do relatório é o de Brasília. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RNFS-%E2%80%90-Status-do-sistema)

## Comissões
RNF58 a RNF60: controle de acesso, unicidade e continuidade da administração. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Comiss%C3%B5es)

## Relatórios
O administrador vê o relatório global. A pessoa comum vê só as organizações e comissões das quais participa. O relatório de usuários fica restrito ao administrador e é calculado na hora. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/%28revisar%29-RF36)

## Reinicialização de subsistemas
Só nomes conhecidos viram comando. Iniciar, parar e reiniciar exigem administrador. A API de gestão responde antes de reiniciar a si mesma. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/%28revisar%29-RF37)

## Setup e reset
O setup pode rodar de novo sem duplicar containers nem apagar segredo válido. O reset completo não tem botão: exige o servidor e a remoção explícita dos volumes. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/%28revisar%29-RF38)

## Ata de reunião
RNF55 a RNF57: sanitização, consistência de versão e integridade após finalização. [Ver detalhes](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RNFS-%E2%80%90-Ata)

## Compatibilidade com o Expo SDK 58
Os pacotes seguem o SDK 58, o TypeScript e o ESLint passam, os testes do aplicativo continuam, o app abre no Android e no iOS, e o Node atende ao `engines` do React Native. [(ver mais detalhes)](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/%28unificar%29-RNF50)

## Ata - entrega final

RNF55 a RNF57. [RNFS ‐ Ata](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RNFS-%E2%80%90-Ata).

## Comissões - entrega final

RNF58 a RNF60. [RNFS ‐ Comissões](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RNFS-%E2%80%90-Comiss%C3%B5es).

## Presença - entrega final

RNF61 a RNF63. [RNFS ‐ Presença](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RNFS-%E2%80%90-Presen%C3%A7a).
