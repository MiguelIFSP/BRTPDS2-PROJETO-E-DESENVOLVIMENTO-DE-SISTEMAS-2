> Entrega final (AF) · Ata, comissões e presença · Versão 1.0 · 27/11/2026.
> Código auditado: `feature/refatoracao-ultima-entrega`, commit <code>614734c</code>. Responsável pela revisão acadêmica: [responsável a informar].
> Estado: implementado, salvo ressalvas expressas. Verificação documental por leitura do código; não equivale à aprovação do professor.

> Página de origem preservada. Consulte [DCU - Ata](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Ata) e seus RFs para as regras e os diagramas da versão atual.

# Gerenciar atas de reunião

**Estado:** Implementado no código; 138 testes direcionados aprovados. **Objetivo:** consultar, redigir conforme o papel, votar e exportar a ata. **Origem:** pedido do módulo e implementação S01–S07. **Destino:** integrantes da comissão, Reuniao/AtaVoto e arquivo local conforme operação.


## Atores

| Ator | Tipo | Responsabilidade | Evidência |
|---|---|---|---|
| Administrador da comissão (PapelComissao.ADMINISTRADOR) | Pessoa/papel externo | Consultar, redigir, votar e exportar quando elegível | S02 podeEditar/loadAccess; S05 |
| Secretário da comissão (PapelComissao.SECRETARIO) | Pessoa/papel externo | Consultar, redigir, votar e exportar quando elegível | S02/S05 |
| Facilitador da comissão (PapelComissao.FACILITADOR) | Pessoa/papel externo | Consultar sem edição, votar e exportar quando elegível | S02/S05 |
| Membro da comissão (PapelComissao.MEMBRO) | Pessoa/papel externo | Consultar sem edição, votar e exportar quando elegível | S02/S05 |

“Administrador” isolado significa Role.ADMIN. Nenhum papel global acrescenta privilégio nessa ata. Cada ator exige ComissaoEquipe atual e ReuniaoRegistro da reunião para as operações HTTP.

## Regras de negócio

| ID | Regra | Evidência | Estado |
|---|---|---|---|
| RN-ATA01 | Leitura/gravação/voto exigem sessão, vínculo atual e entrada; saída não exclui por si só | requireAuth/loadAccess | Implementado |
| RN-ATA02 | Só ADMINISTRADOR/SECRETARIO editam; middleware e transação verificam; UI recebe podeEditar | requireAtaEditor/assertEditor/save | Implementado |
| RN-ATA03 | HTML obrigatório com trim, até 50.000 caracteres antes da sanitização e texto efetivo depois dela | ataSchema/validateAtaHtml | Implementado |
| RN-ATA04 | Versão divergente ou atualização condicional count=0 gera 409 | save/vote | Implementado; concorrência real Não verificado |
| RN-ATA05 | Alterar HTML normalizado incrementa versão e remove votos; texto normalizado idêntico preserva ambos | save | Implementado |
| RN-ATA06 | Quatro papéis votam após texto salvo; um registro por reunião/pessoa, com troca; totais sem decisão coletiva automática | vote/present/AtaVoto | Implementado |
| RN-ATA07 | PDF usa texto salvo carregado, nunca rascunho; não atualiza servidor nem revalida acesso no clique | handleExportPdf/exportAtaPdf | Implementado |
| RN-ATA08 | Rascunho impede voto na UI; 403/409 preserva rascunho e bloqueia edição/voto até recarregar | AtaReuniao | Implementado |

O checkIn para criar presença verifica comissão/organização aceita, integrante criador ou com convite aceito e reunião AGENDADA; registro existente é retornado antes dessa verificação de status. loadAccess da ata não repete critérios de convite, data ou status da reunião/organização. O botão de acesso exige meuRegistro e papelNaComissao; servidor valida independentemente dele.

## Entradas

| Campo | Tipo e domínio | Validação/origem |
|---|---|---|
| Authorization | Bearer + token | jwt.verify; sub inteiro positivo, role do enum, email presente; User relido. Sessão do authStore |
| id | Parâmetro convertido em number, inteiro > 0 | parseId usa Number/Number.isInteger (primeiro valor se array); tela usa Number.isSafeInteger antes da chamada |
| conteudoAta | string HTML | PUT: trim, obrigatório, máximo 50.000; deve manter texto após sanitização; editor.current.getHtml() |
| versaoAta | number inteiro >= 0 | Obrigatório em PUT/POST; deve coincidir com Reuniao.versaoAta; objeto Ata carregado |
| status | APROVADO ou REPROVADO | POST: string com trim, obrigatória; botão escolhido |
| titulo | string | PDF: ata.titulo; escapado no template, sem validação adicional de tamanho |
| dataReuniao | string AAAA-MM-DD | PDF: padrão textual validado (não calendário completo), formatado sem conversão de fuso |
| conteudoAta do PDF | string HTML salvo | ata.conteudoAta não nulo; template exige trim não vazio; web sanitiza novamente |

Os campos PDF são AtaPdfInput local, não corpo HTTP. Yup realiza coerções/transformações e stripUnknown: true; não promete rejeição de todo tipo JSON inicial diferente. userId e papel não são escolhidos no corpo para conceder permissão.

## Saída comum da API

GET/PUT/POST retornam **200**, objeto sem envelope:

| Campo | Tipo/domínio | Origem |
|---|---|---|
| reuniaoId | number | ID solicitado |
| titulo | string | Reuniao.titulo |
| dataReuniao | string | Reuniao.data |
| conteudoAta | HTML string ou null | Texto sanitizado novamente em present |
| versaoAta | number | Reuniao.versaoAta |
| papelNaComissao | PapelComissao | ComissaoEquipe.papel |
| podeEditar | boolean | ADMINISTRADOR/SECRETARIO |
| podeVotar | boolean | Boolean do conteúdo persistido, após autorização |
| meuVoto | StatusAtaVoto ou null | Voto próprio na versão atual |
| votos.aprovados | inteiro >= 0 | Contagem APROVADO na versão atual |
| votos.reprovados | inteiro >= 0 | Contagem REPROVADO na versão atual |

Não se devolve a lista de votos individuais de terceiros. Totais filtram versão, mas não o vínculo atual de cada votante: remover alguém da comissão não apaga automaticamente seu voto armazenado.

## Origem, Saída, Destino e Ação por operação

| Operação | Origem/rota ou função | Saída/destino | Ação e pré/pós-condições |
|---|---|---|---|
| Consultar | Foco/atualização em AtaReuniaoScreen; GET /api/reunioes/:id/ata | Objeto comum para UI | Sessão/vínculo/entrada; getByReuniao abre transação, present/loadAccess consulta reunião e votos, sanitiza e retorna. Sem texto: 200/null, podeVotar false; sem escrita de negócio |
| Salvar | Editor; PUT /api/reunioes/:id/ata | Objeto comum; Reuniao/AtaVoto | Papel editor e versão atual; middleware assertCanEdit, schema, validateAtaHtml, transação reautoriza e compara versão, updateMany grava, deleteMany remove votos se mudou, present retorna; texto idêntico preserva versão/votos |
| Votar | Botão; POST /api/reunioes/:id/ata/votar | Objeto comum; AtaVoto | Conteúdo e versão atuais; validar, loadAccess, conferir conteúdo/versão, updateMany incremento zero, upsert pela UK e present. Troca não duplica; texto permanece |
| Exportar | handleExportPdf; exportAtaPdf(input) | Promise<void>; cache/gaveta ou janela de impressão | Texto salvo carregado; template; nativo verifica Sharing, gera base64, aguarda File.write e compartilha; web sanitiza/abre/imprime; não modifica reunião/votos, nem confirma envio externo |

Prefixo /api vem de server.ts. Nenhum endpoint de PDF. O fluxo detalhado e pré/pós-condições de cada objetivo estão nas fichas UC17–UC20.

## Erros e ordem de validação

Erros HTTP têm error; propriedades de AppError.details podem ser incorporadas no mesmo nível. Não existe details obrigatório.

| HTTP | Condição | Mensagem literal |
|---|---|---|
| 400 | ID inválido | Identificador da reunião inválido. |
| 400 | JSON malformado | JSON inválido. |
| 400 | HTML ausente | Escreva o conteúdo da ata. |
| 400 | HTML acima do limite | A ata deve ter no máximo 50.000 caracteres de HTML. |
| 400 | Vazio após sanitizar | Escreva o conteúdo da ata antes de salvar. |
| 400 | Versão ausente/inválida como número | Informe a versão da ata. |
| 400 | Versão fracionária / negativa | A versão deve ser inteira. / A versão não pode ser negativa. |
| 400 | Status ausente/inválido | Escolha aprovar ou reprovar a ata. |
| 401 | Bearer ausente/vazio | Autenticação necessária. |
| 401 | Assinatura/expiração | Token inválido ou expirado. |
| 401 | Claims/sub inválidos | Token inválido. |
| 401 | Conta excluída | Sessão inválida. Entre novamente. |
| 403 | Sem vínculo ou entrada | A ata está disponível somente para integrantes da comissão com entrada registrada nesta reunião. |
| 403 | Sem papel de edição | Somente administrador ou secretário da comissão pode editar a ata. |
| 404 | Reunião inexistente | Reunião não encontrada. |
| 409 | Voto antes do texto | A ata precisa ser redigida e salva antes da votação. |
| 409 | Versão divergente/count=0 | A ata foi alterada. Atualize a tela antes de salvar ou votar. |
| 404 / 409 | Prisma P2025 / P2002 genéricos | Registro não encontrado. / Registro já existente. |
| 500 | Exceção não convertida | Erro interno. Tente novamente mais tarde. |

JSON malformado pode falhar antes da autenticação. Com JSON bem formado, requireAuth precede as rotas; PUT verifica papel antes do corpo; loadAccess detecta reunião ausente antes de negar vínculo. Voto repetido normalmente retorna 200 por upsert, não o erro P2002. Falha de rede gera ApiError status 0 no cliente (“Não foi possível conectar ao servidor. Verifique sua conexão.”); 0 não é HTTP.

PDF é local. Mensagens próprias: “A ata ainda não possui conteúdo salvo.”; “Atualize a ata para carregar a data da reunião.”; “O compartilhamento não está disponível neste dispositivo.”; “Não foi possível preparar o PDF para compartilhamento.”; “Permita pop-ups para exportar a ata.”. Print/File/Sharing podem fornecer mensagens próprias; fallback: “Não foi possível exportar a ata para PDF.”.

## Editor, leitura e PDF

| Grupo | Comportamento implementado (S05–S07) |
|---|---|
| Edição por papel | Admin/Secretário da comissão veem AtaEditor/Salvar; demais, AtaLeitura ou espera. Todos recebem voto/PDF, desabilitados conforme estado |
| Texto/histórico | Negrito, itálico, sublinhado, rasurado, desfazer/refazer |
| Parágrafos | H1/H2/H3; esquerda/centro/direita/justificado; listas ordenadas/não ordenadas; aumentar/diminuir recuo |
| Fonte | Escala 10, 13, 16, 18, 24, 32, 48 px |
| Tabelas | Menu de 1–10 linhas, 1–6 colunas, cabeçalho opcional, adicionar/excluir linha/coluna ou tabela; sem controle de mesclagem |
| Bordas | all, outer, inner, horizontal, vertical, top, bottom, left, right, none em data-ata-border |
| Barra | ScrollView horizontal, fundo escuro, ícones Pell/Ionicons e glifos H1/H2/H3; ações Colors.dark.primary (#1FD5B5); alvos de 44 |
| Plataformas | Pell/WebView/ataNativeBridge no nativo; Tiptap na web; DOMPurify no leitor web; leitor nativo sem JavaScript/acesso a arquivos, navegação só about:blank |

Limites de linhas/colunas são da interface; a API limita tamanho HTML e colspan/rowspan de 1 a 10, sem contar linhas/colunas. HTML preserva tags textuais/tabelas e estilos enumerados; normaliza font/align legados e remove scripts/eventos/recursos externos. Template PDF escapa título/data, mas não é sanitizador do HTML nativo.

prepareSave obtém o HTML atual pelo ref e confirma alteração se houver votos carregados. O servidor compara o texto normalizado. A UI preserva rascunho em falhas; 403/409 bloqueia editar/votar até recarregar. PDF pode usar o conteúdo carregado mesmo após conflito, pois não testa conflict nem renova acesso.

PDF: BetterMeet, título/data, fundo branco, CSS e sans-serif. Nativo gera A4 595×842; iOS usa CSS margin 0 e margens nativas 51; Android @page 18mm. Base64 é gravado em File(Paths.cache, nome com data/Date.now), aguardado antes de compartilhar application/pdf e UTI com.adobe.pdf. O cache permanece para leitura do destinatário. Na web, somente o documento da ata é aberto, opener isolado e print invocado; o navegador decide salvar/imprimir. Cancelar não gera confirmação de envio.
