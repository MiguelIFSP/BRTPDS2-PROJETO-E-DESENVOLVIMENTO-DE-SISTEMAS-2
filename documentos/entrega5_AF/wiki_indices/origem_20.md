> Entrega final (AF) · Ata, comissões e presença · Versão 1.0 · 27/11/2026.
> Código auditado: `feature/refatoracao-ultima-entrega`, commit <code>614734c</code>. Responsável pela revisão acadêmica: [responsável a informar].
> Estado: implementado, salvo ressalvas expressas. Verificação documental por leitura do código; não equivale à aprovação do professor.

> Página de origem preservada. Consulte [DCU - Ata](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Ata) e seus RFs para as regras e os diagramas da versão atual.

# UC18 — Redigir ata

- **Estado/objetivo:** Implementado; criar ou alterar o texto Rich Text.
- **Atores:** Administrador da comissão; Secretário da comissão.
- **RF/regras:** RF16; RN-ATA01–05/08; RNF44/RNF45.
- **Gatilho:** editar e tocar Salvar.
- **Entradas:** token string; reuniaoId number; conteudoAta string HTML; versaoAta number inteiro >= 0.
- **Pré-condições:** identidade, vínculo e entrada válidos, papel editor e versão carregada; primeira gravação não exige ata anterior. UI requer alteração local e ausência de ocupação/conflito.
- **Fluxo:** 1) editor fornece getHtml(); 2) confirmar se há votos carregados e mudança; 3) PUT passa por requireAuth e requireAtaEditor; 4) controller valida id/corpo; 5) service sanitiza/exige texto; 6) transação revalida acesso/papel/versão; 7) updateMany grava e incrementa se mudou; 8) deleteMany remove votos se mudou; 9) present devolve 200; 10) UI atualiza rascunho/objeto e informa disponibilidade de votação.
- **Alternativas/erros:** HTML normalizado idêntico preserva votos/versão; cancelar confirmação não envia PUT; 400 de schema/sanitizador; 401/403 de acesso; 404 de reunião; 409 de versão/count=0; 500 de exceção. Rede permite nova tentativa; 403/409 bloqueia editar/votar, preservando rascunho até recarregar.
- **Pós-condições:** sucesso com alteração: HTML normalizado, versão incrementada e votos removidos; sem alteração: versão/votos mantidos. Falha não confirma salvamento. Atomicidade física depende de teste real pendente.
- **Relações UML:** nenhuma; associação aos dois atores elegíveis.
- **Rastreabilidade:** S01–S03/S05/S06; Reuniao/AtaVoto; DS-Salvar-Ata; CT-RF16-06–12/15/16, CT-RNF44-01, CT-RNF45-01–03.

## Auditoria da ficha

| Elipse do diagrama | Ficha | Pré-condições | Pós-condições | Fluxos e erros | Verificado no código |
|---|---|---|---|---|---|
| UC18 — Redigir ata | Ficha acima | Sim | Sim | Sim | Sim |

## Diagrama de casos de uso

![Diagrama de casos de uso](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/images/DCU-Ata-Reuniao.svg)
