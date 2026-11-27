import type { ImageSourcePropType } from 'react-native';

export type ManualSectionBlock = {
  kind: 'section';
  title: string;
  text?: string;
  steps?: readonly string[];
};

export type ManualNoteBlock = {
  kind: 'note';
  title: string;
  text: string;
};

export type ManualImageBlock = {
  kind: 'image';
  source: ImageSourcePropType;
  alt: string;
  caption: string;
  aspectRatio: number;
};

export type ManualBlock =
  ManualSectionBlock | ManualNoteBlock | ManualImageBlock;

export type ManualChapter = {
  id: string;
  title: string;
  intro: string;
  content: readonly ManualBlock[];
};

// Cada ilustração é um recurso estático incluído no pacote do aplicativo.
// Os arquivos com nomes descritivos ficam em assets/manual/images.
export const MANUAL_USUARIO = [
  {
    id: 'primeiros-passos',
    title: 'Bem-vindo e navegação',
    intro:
      'Este guia explica as funções disponíveis para uma conta de usuário comum. Algumas ações aparecem apenas quando o papel da pessoa na organização, comissão ou reunião permite usá-las.',
    content: [
      {
        kind: 'section',
        title: 'Abrir o manual',
        steps: [
          'No primeiro login, o aplicativo pergunta se você quer aprender a usar o Better Meet. Toque em “Sim, quero aprender” para abrir este manual.',
          'Para voltar a este guia depois, abra Mais, procure a seção Ajuda e toque em “Abrir manual do usuário”.',
          'Use “Anterior” e “Próximo” no fim de cada página. O indicador mostra em qual capítulo você está.',
        ],
      },
      {
        kind: 'image',
        source: require('../../../assets/manual/images/primeiro-acesso.jpg'),
        alt: 'Apresentação do primeiro acesso com as opções para abrir o manual ou fechar.',
        caption:
          'No primeiro acesso, “Sim, quero aprender” abre o manual dentro do aplicativo.',
        aspectRatio: 1.005,
      },
      {
        kind: 'section',
        title: 'Conhecer as áreas principais',
        steps: [
          'Reuniões mostra compromissos próximos, histórico e convites recebidos.',
          'Organizações mostra as organizações de que você participa e as solicitações que criou.',
          'Comissões lista as comissões ligadas às organizações às quais você tem acesso.',
          'Mais reúne Ajuda, sua conta, status dos serviços, relatórios e preferência de tema. O sino no cabeçalho abre convites e avisos.',
        ],
      },
    ],
  },
  {
    id: 'conta-acesso',
    title: 'Criar conta, confirmar e entrar',
    intro:
      'A conta é identificada pelo e-mail. Para concluir o cadastro e entrar pela primeira vez, confirme o endereço usado no formulário.',
    content: [
      {
        kind: 'section',
        title: 'Criar uma conta',
        steps: [
          'Na tela Entrar, toque em “Ainda não tem conta? Cadastrar-se”.',
          'Informe seu nome completo, e-mail, senha e confirmação da senha; depois toque em “Criar conta”.',
          'A senha precisa ter pelo menos 8 caracteres, com uma letra maiúscula, uma minúscula e um número. A confirmação deve ser igual à senha.',
        ],
      },
      {
        kind: 'image',
        source: require('../../../assets/manual/images/confirmacao-email.jpg'),
        alt: 'Tela informando que um link de confirmação foi enviado para o e-mail cadastrado.',
        caption:
          'O aplicativo confirma o envio do link e oferece a opção de reenviar quando o intervalo de espera terminar.',
        aspectRatio: 0.5,
      },
      {
        kind: 'section',
        title: 'Confirmar o e-mail',
        steps: [
          'Abra a mensagem enviada pelo Better Meet e toque no link de confirmação. Depois volte ao aplicativo.',
          'Se a mensagem não chegar, confira a pasta de spam. Na tela de confirmação, use “Reenviar e-mail” quando o contador liberar o botão.',
          'Toque em “Já confirmei, entrar” para voltar ao login e acessar a conta.',
        ],
      },
      {
        kind: 'image',
        source: require('../../../assets/manual/images/email-pendente-confirmacao.jpg'),
        alt: 'Aviso de e-mail não confirmado, com opções para reenviar o link ou voltar ao login.',
        caption:
          'Se o login detectar um e-mail ainda não confirmado, o aplicativo mostra este aviso e reenvia o link.',
        aspectRatio: 0.488,
      },
      {
        kind: 'section',
        title: 'Entrar ou recuperar a senha',
        steps: [
          'Na tela Entrar, informe seu e-mail e senha. O ícone de olho alterna entre mostrar e ocultar a senha.',
          'Se os dados estiverem incorretos, confira a digitação. O aplicativo não revela se o erro foi no e-mail ou na senha.',
          'Para redefinir a senha, toque em “Esqueceu a senha?”, informe o e-mail e abra a mensagem recebida. O link vale por 30 minutos.',
          'No formulário Nova senha, siga o link ou informe o código da mensagem, defina e confirme a nova senha e toque em “Redefinir senha”. Ao terminar, entre usando a nova senha.',
        ],
      },
      {
        kind: 'note',
        title: 'Mensagem de recuperação',
        text: 'Por segurança, o aplicativo mostra a mesma confirmação mesmo que o e-mail não esteja cadastrado. Se o link vencer ou já tiver sido usado, solicite outro pela tela “Esqueceu a senha?”.',
      },
    ],
  },
  {
    id: 'organizacoes-comissoes',
    title: 'Organizações e comissões',
    intro:
      'Organizações agrupam pessoas e comissões. Uma solicitação de organização precisa ser aprovada antes que ela possa receber comissões e equipes.',
    content: [
      {
        kind: 'section',
        title: 'Solicitar uma organização',
        steps: [
          'Abra a aba Organizações. Em “Suas organizações”, toque em “Criar organização”.',
          'Informe o nome e envie a solicitação. O estado inicial será “Aguardando aprovação”.',
          'Quando a solicitação for analisada, abra o cartão para consultar o estado e os detalhes da organização.',
        ],
      },
      {
        kind: 'image',
        source: require('../../../assets/manual/images/organizacao-nova.jpg'),
        alt: 'Formulário Nova organização com o estado inicial Aguardando aprovação.',
        caption:
          'O estado inicial é definido pelo sistema; a pessoa usuária informa o nome da organização.',
        aspectRatio: 0.85,
      },
      {
        kind: 'image',
        source: require('../../../assets/manual/images/organizacao-pendente.jpg'),
        alt: 'Cartão de uma organização criada que aguarda aprovação.',
        caption:
          'Enquanto estiver pendente, a organização ainda não libera comissões.',
        aspectRatio: 0.511,
      },
      {
        kind: 'section',
        title: 'Consultar e criar comissões',
        steps: [
          'Depois que a organização for aprovada, abra Comissões e selecione a organização desejada.',
          'Toque em uma comissão para consultar sua descrição, equipe e papel de cada integrante.',
          'Se o botão “Criar comissão” estiver disponível para seu papel, informe o nome, adicione uma descrição se quiser e envie o formulário.',
          'Se aparecer a mensagem de que você ainda não participa de uma organização aprovada, aguarde a aprovação ou peça acesso à organização correta.',
        ],
      },
      {
        kind: 'image',
        source: require('../../../assets/manual/images/comissoes-sem-organizacao-aprovada.jpg'),
        alt: 'Estado vazio da aba Comissões informando que ainda não há uma organização aprovada.',
        caption:
          'A lista de comissões fica vazia até sua conta ter acesso a uma organização aprovada.',
        aspectRatio: 0.499,
      },
      {
        kind: 'note',
        title: 'Ações variam conforme o papel',
        text: 'A conta pode ser comum na plataforma e ainda ter um papel de responsabilidade em uma organização ou comissão. Por isso, botões de edição, equipe e criação dependem do papel exibido para você.',
      },
    ],
  },
  {
    id: 'reunioes',
    title: 'Consultar, criar e editar reuniões',
    intro:
      'A aba Reuniões lista compromissos próximos. O botão de relógio abre o histórico. Para criar uma reunião, sua conta precisa participar de uma comissão.',
    content: [
      {
        kind: 'section',
        title: 'Etapa 1 — Título e comissão',
        steps: [
          'Toque no botão + e informe o título da reunião.',
          'Selecione uma comissão à qual você tem acesso.',
          'Convidar participantes é opcional. Se quiser convidar alguém, selecione membros da comissão; cada pessoa só passa a participar depois que aceita o convite.',
        ],
      },
      {
        kind: 'image',
        source: require('../../../assets/manual/images/reuniao-etapa-comissao.jpg'),
        alt: 'Primeira etapa do formulário Nova reunião, com título, comissão e seleção de participantes.',
        caption:
          'A primeira etapa reúne título, comissão e a seleção opcional de participantes.',
        aspectRatio: 0.491,
      },
      {
        kind: 'section',
        title: 'Etapa 2 — Data, hora e local',
        steps: [
          'Escolha uma data que não tenha passado.',
          'Defina o início e o término. O término deve ser posterior ao início e os dois horários não podem estar no passado.',
          'Preencha “Local ou link”. Esse campo é obrigatório e aceita endereço, link ou instruções para reunião híbrida.',
        ],
      },
      {
        kind: 'image',
        source: require('../../../assets/manual/images/reuniao-data-passada.jpg'),
        alt: 'Etapa de data e hora mostrando os avisos para início e término no passado.',
        caption:
          'Se a data e os horários já passaram, os avisos aparecem no próprio formulário.',
        aspectRatio: 0.587,
      },
      {
        kind: 'section',
        title: 'Etapa 3 — Pauta e descrição',
        steps: [
          'Descreva os assuntos em Pauta; o preenchimento é obrigatório.',
          'Use Descrição para acrescentar observações, se necessário. Esse campo é opcional.',
          'Toque em “Salvar reunião”. Se um campo estiver inválido, corrija-o e tente novamente.',
        ],
      },
      {
        kind: 'image',
        source: require('../../../assets/manual/images/reuniao-etapa-pauta.jpg'),
        alt: 'Terceira etapa do formulário Nova reunião, com pauta, descrição e botão para salvar.',
        caption:
          'A reunião só é salva depois que a pauta obrigatória estiver preenchida.',
        aspectRatio: 0.625,
      },
      {
        kind: 'section',
        title: 'Abrir detalhes ou editar',
        steps: [
          'Toque no cartão de uma reunião para consultar data, horários, comissão, local, pauta, descrição, participantes e recursos disponíveis.',
          'Se sua conta criou a reunião, o controle “Editar” pode aparecer. Atualize os campos necessários e salve.',
          'Quando uma reunião é atualizada ou remarcada, os participantes recebem um aviso no aplicativo e podem receber um e-mail de atualização.',
        ],
      },
      {
        kind: 'image',
        source: require('../../../assets/manual/images/reuniao-dados.jpg'),
        alt: 'Cartão com dados salvos de uma reunião e o controle Editar.',
        caption:
          'Os detalhes da reunião ficam juntos em seu cartão; controles de edição dependem da permissão.',
        aspectRatio: 0.854,
      },
      {
        kind: 'image',
        source: require('../../../assets/manual/images/reuniao-atualizada.jpg'),
        alt: 'Confirmação de reunião atualizada e cartão com os dados atualizados.',
        caption:
          'Depois de salvar uma alteração, a lista mostra os dados atualizados.',
        aspectRatio: 1.246,
      },
    ],
  },
  {
    id: 'convites-notificacoes',
    title: 'Convites e notificações',
    intro:
      'Use o sino no cabeçalho para ver convites de reunião e avisos sobre mudanças nos compromissos.',
    content: [
      {
        kind: 'section',
        title: 'Responder a um convite',
        steps: [
          'Toque no sino e localize o convite em “Convites pendentes”. Confira título, data, horário, comissão e local.',
          'Toque em “Aceitar” para participar ou “Recusar” para não participar.',
          'A tela permite responder enquanto o convite está pendente. Depois da resposta, ele deixa essa lista e os botões de resposta não ficam mais disponíveis nesse cartão.',
        ],
      },
      {
        kind: 'image',
        source: require('../../../assets/manual/images/notificacao-convite.jpg'),
        alt: 'Convite pendente de reunião com informações e botões Aceitar e Recusar.',
        caption: 'Confira os dados antes de aceitar ou recusar o convite.',
        aspectRatio: 1.026,
      },
      {
        kind: 'section',
        title: 'Acompanhar avisos',
        steps: [
          'Quando uma reunião for remarcada ou atualizada, leia o aviso recebido no mesmo painel.',
          'Use o X do cartão para remover um aviso ou “Limpar todas” para remover a lista de avisos.',
          'Se a alteração também gerar um e-mail, confira a nova data, horário e local na mensagem. Os detalhes mais recentes do aplicativo são a referência para abrir a reunião.',
        ],
      },
      {
        kind: 'image',
        source: require('../../../assets/manual/images/notificacao-remarcacao.jpg'),
        alt: 'Aviso no aplicativo informando que uma reunião foi remarcada.',
        caption: 'O aviso informa o novo dia e horário da reunião remarcada.',
        aspectRatio: 1.051,
      },
    ],
  },
  {
    id: 'presenca',
    title: 'Participar e registrar presença',
    intro:
      'A confirmação individual de entrada e a lista de presença da reunião são recursos diferentes: a primeira registra sua própria participação; a segunda permite que uma pessoa autorizada consulte e organize os registros de toda a equipe.',
    content: [
      {
        kind: 'section',
        title: 'Registrar sua entrada e saída',
        steps: [
          'Abra a reunião. Se você recebeu um convite, aceite-o antes de tentar registrar a entrada.',
          'Quando a janela de entrada abrir, toque em “Entrar na Reunião”. Ela abre 15 minutos antes do horário marcado e fecha no término da reunião.',
          'A confirmação mostra “Presença ativa”. Ao sair, toque em “Registrar saída”. O aplicativo salva os horários do registro no servidor.',
        ],
      },
      {
        kind: 'note',
        title: 'O que o registro confirma',
        text: 'O registro grava a ação feita pela sua conta. O aplicativo não usa biometria nem verifica sua localização física para comprovar que você está no local da reunião.',
      },
      {
        kind: 'section',
        title: 'Consultar a lista e exportar em PDF',
        steps: [
          'Em uma conta comum, “Ver lista de presença” aparece para quem criou a reunião ou tem o papel Administrador naquela comissão.',
          'Na lista, consulte o estado Presente, Ausente ou Sem marcação e os horários de entrada e saída registrados para cada pessoa.',
          'Uma pessoa autorizada pode ajustar a marcação manual, registrar uma saída no meio da reunião e o horário de retorno. O motivo da saída é opcional; Observações pode guardar informações adicionais.',
          'A exportação em PDF só fica disponível depois que a reunião for encerrada. Reuniões canceladas não podem ser exportadas.',
        ],
      },
      {
        kind: 'note',
        title: 'Histórico por reunião',
        text: 'Cada lista está ligada a uma reunião. Os horários automáticos são gravados quando a pessoa registra a entrada ou a saída, permanecem no histórico e não são substituídos pelo horário em que alguém exporta o PDF.',
      },
    ],
  },
  {
    id: 'ata-votacoes',
    title: 'Ata e votações',
    intro:
      'As ferramentas de decisão aparecem nos detalhes da reunião quando estão disponíveis para sua conta e para o estado atual do compromisso.',
    content: [
      {
        kind: 'section',
        title: 'Ler e aprovar a ata',
        steps: [
          'Abra a seção da ata nos detalhes da reunião. Se ainda não houver conteúdo, aguarde a pessoa responsável por redigi-la e salvá-la.',
          'Depois que a ata for salva, registre seu voto como Aprovado ou Reprovado, quando a opção estiver disponível. A maioria das pessoas presentes precisa aprovar para liberar a exportação.',
          'Enquanto a ata não for exportada, é possível alterar o voto. A aprovação da versão exportada é definitiva; depois disso, não se edita nem se vota novamente.',
          'O papel Administrador ou Secretário da comissão pode permitir redigir a ata. Se você tiver essa permissão, salve as alterações antes da votação; editar o texto reinicia os votos da versão anterior.',
        ],
      },
      {
        kind: 'section',
        title: 'Votar em uma votação',
        steps: [
          'Na lista de votações da reunião, toque na votação aberta.',
          'Leia as opções e toque naquela que representa seu voto. Só participantes com entrada registrada na reunião podem votar.',
          'Em votação aberta, quem administra a reunião pode ver quem escolheu cada opção. Em votação secreta, a escolha não é vinculada à pessoa.',
          'O resultado parcial só aparece quando foi habilitado na criação. A troca do voto só fica disponível se a votação permitir e ainda estiver aberta.',
        ],
      },
      {
        kind: 'image',
        source: require('../../../assets/manual/images/votacao-aberta.jpg'),
        alt: 'Votação aberta com indicação de que só participantes com entrada registrada podem votar.',
        caption:
          'O cartão informa o tipo de votação e o estado atual antes de você votar.',
        aspectRatio: 0.506,
      },
      {
        kind: 'section',
        title: 'Criar uma votação, quando permitido',
        steps: [
          'Se sua conta criou a reunião ou tem o papel Administrador da comissão, toque em “Nova votação”.',
          'Informe o título, escolha Aberta ou Secreta e escreva pelo menos duas opções diferentes. É possível adicionar até seis opções.',
          'Escolha se o resultado parcial será mostrado e se as pessoas poderão trocar o voto. Toque em “Criar votação”.',
          'Depois de encerrada, a votação fica disponível para consulta e o resultado não muda mais.',
        ],
      },
      {
        kind: 'image',
        source: require('../../../assets/manual/images/votacao-criar.jpg'),
        alt: 'Formulário Nova votação com tipo, duas opções e configurações de resultado e troca de voto.',
        caption:
          'O formulário permite escolher o tipo e as regras da votação antes de criá-la.',
        aspectRatio: 0.506,
      },
      {
        kind: 'image',
        source: require('../../../assets/manual/images/votacao-adicionar-opcao.jpg'),
        alt: 'Formulário Nova votação com uma opção adicional sendo incluída.',
        caption:
          'Use “Adicionar opção” para incluir alternativas, até o limite de seis.',
        aspectRatio: 0.499,
      },
      {
        kind: 'image',
        source: require('../../../assets/manual/images/votacao-encerrada.jpg'),
        alt: 'Resultado de uma votação encerrada, com suas opções e percentuais.',
        caption:
          'A tela da votação encerrada mostra o resultado final para consulta.',
        aspectRatio: 0.507,
      },
    ],
  },
  {
    id: 'mais-conta',
    title: 'Mais, sua conta e preferências',
    intro:
      'A aba Mais reúne os atalhos pessoais e as ferramentas de consulta disponíveis para uma conta comum.',
    content: [
      {
        kind: 'section',
        title: 'Consultar e editar a conta',
        steps: [
          'Em Mais, toque no cartão da conta para abrir seu perfil e conferir nome, e-mail, função e situação da conta.',
          'Toque em “Editar dados pessoais” para atualizar nome ou e-mail e depois toque em “Salvar alterações”. Um novo endereço de e-mail precisa ser confirmado antes de substituir o atual.',
          'Toque em “Alterar senha”, informe a senha atual, a nova senha e sua confirmação; depois toque em “Salvar senha”. A senha nova precisa ter 8 caracteres, letra maiúscula, minúscula e número.',
        ],
      },
      {
        kind: 'image',
        source: require('../../../assets/manual/images/perfil-conta.jpg'),
        alt: 'Perfil de uma conta comum com dados pessoais e atalho para edição.',
        caption:
          'O perfil identifica a conta como Usuário comum e reúne seus dados pessoais.',
        aspectRatio: 0.513,
      },
      {
        kind: 'image',
        source: require('../../../assets/manual/images/perfil-alterar-senha.jpg'),
        alt: 'Formulário para informar senha atual, nova senha e confirmação.',
        caption:
          'A alteração de senha exige a senha atual e a confirmação do novo valor.',
        aspectRatio: 0.503,
      },
      {
        kind: 'section',
        title: 'Tema, status e relatórios',
        steps: [
          'Em Mais, escolha Claro, Escuro ou Sistema na seção Tema. Sistema acompanha a aparência do aparelho.',
          'Status do Sistema permite consultar a situação dos serviços. Os controles para iniciar, parar ou reiniciar serviços são administrativos e não fazem parte do perfil comum.',
          'Relatórios mostra dados das organizações e comissões de que você participa. O relatório de usuários fica disponível apenas para administradores da plataforma.',
        ],
      },
      {
        kind: 'section',
        title: 'Sair ou excluir dados',
        steps: [
          'Na tela do perfil, toque em “Sair” para encerrar a sessão neste aparelho.',
          '“Excluir meus dados” inicia a remoção da conta e dos vínculos pessoais. Leia cada etapa e o resumo antes de confirmar: a ação não pode ser desfeita e as opções exibidas dependem das responsabilidades que sua conta mantém.',
        ],
      },
    ],
  },
] as const satisfies readonly ManualChapter[];
