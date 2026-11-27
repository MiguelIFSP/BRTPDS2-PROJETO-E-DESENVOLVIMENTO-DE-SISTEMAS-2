> Entrega final (AF) · Ata, comissões e presença · Versão 1.0 · 27/11/2026.
> Código auditado: `feature/refatoracao-ultima-entrega`, commit <code>614734c</code>. Responsável pela revisão acadêmica: [responsável a informar].
> Estado: implementado, salvo ressalvas expressas. Verificação documental por leitura do código; não equivale à aprovação do professor.

> Página de origem preservada. Consulte [DCU - Ata](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Ata) e seus RFs para as regras e os diagramas da versão atual.

# UC17 — Consultar ata

- **Estado/objetivo:** Implementado; obter texto, voto próprio e contagens, inclusive reconhecer ausência de ata.
- **Atores:** Administrador da comissão; Secretário da comissão; Facilitador da comissão; Membro da comissão.
- **RF/regras:** RF16; RN-ATA01/02; RNF44.
- **Gatilho:** abrir Ata de reunião ou Atualizar ata e votos.
- **Entradas:** token string da sessão; reuniaoId number inteiro positivo, convertido do parâmetro id.
- **Pré-condições:** conta válida, vínculo atual e entrada registrada; não exige texto salvo nem ausência de saída.
- **Fluxo:** 1) tela confere token/id; 2) serviço do app envia GET; 3) requireAuth valida identidade; 4) controller resolve id; 5) getByReuniao abre transação, present chama loadAccess; 6) consulta votos da versão e sanitiza texto; 7) responde 200; 8) mostra editor aos dois papéis habilitados e leitor aos demais.
- **Alternativas/erros:** sem ata, 200/null, podeVotar false e aviso para leitores; id local inválido: “Reunião inválida.”; API: 400/401/403/404/500 conforme B.1; rede: ApiError status 0 e nova tentativa. Recarregar com rascunho exige confirmação de descarte.
- **Pós-condições:** estado local recebe o objeto; nenhuma escrita de negócio no banco. Erro não confirma carregamento novo.
- **Relações UML:** nenhuma; associação individual aos quatro atores.
- **Rastreabilidade:** S01/S02/S05/S06; User, ComissaoEquipe, ReuniaoRegistro, Reuniao, AtaVoto; DS-Consultar-Ata; CT-RF16-01–05 e CT-RNF44-01/02.

## Auditoria da ficha

| Elipse do diagrama | Ficha | Pré-condições | Pós-condições | Fluxos e erros | Verificado no código |
|---|---|---|---|---|---|
| UC17 — Consultar ata | Ficha acima | Sim | Sim | Sim | Sim |

## Diagrama de casos de uso

![Diagrama de casos de uso](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/images/DCU-Ata-Reuniao.svg)
