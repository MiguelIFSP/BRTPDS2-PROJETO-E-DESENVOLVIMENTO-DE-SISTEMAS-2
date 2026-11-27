> **Consolidação concluída em 27/11/2026. Documento histórico.**
> Referência vigente: [UC37 - Votar na ata](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Ata#uc37---votar-na-ata). Este endereço foi preservado para manter links e apontamentos anteriores. A indicação “unificar” ou “revisar” no nome antigo não representa uma pendência deste módulo.
> O texto recolhido abaixo registra uma versão anterior e não deve ser utilizado como especificação atual.

## Documentação vigente

Para consultar regras, permissões, fluxos e diagrama atuais de **Votar na ata**, acesse [UC37 - Votar na ata](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Ata#uc37---votar-na-ata). Consulte também [o requisito funcional correspondente](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF46) e [os diagramas de sequência](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DS-%E2%80%90-Ata).

## Preservação de referências

O conteúdo e os títulos históricos abaixo foram mantidos para preservar as âncoras e permitir a conferência da origem. A consolidação não remove nem renomeia esta página.

<details>
<summary>Consultar texto histórico - não vigente</summary>

# UC19 — Votar na ata

- **Estado/objetivo:** Implementado; registrar/trocar concordância individual na versão salva.
- **Atores:** Administrador da comissão; Secretário da comissão; Facilitador da comissão; Membro da comissão.
- **RF/regras:** RF16; RN-ATA01/04–06/08; RNF45.
- **Gatilho:** tocar Aprovar ou Reprovar.
- **Entradas:** token string; reuniaoId number; status StatusAtaVoto; versaoAta number inteiro >= 0.
- **Pré-condições:** identidade, vínculo, entrada, texto salvo e versão atual. UI sem rascunho, ocupação ou conflito; botão igual ao voto atual fica desabilitado.
- **Fluxo:** 1) escolher status; 2) POST; 3) autenticar e validar id/corpo; 4) transação/loadAccess; 5) conferir conteúdo e versão; 6) updateMany condicional com incremento zero; 7) upsert pela UK; 8) present calcula voto próprio/totais; 9) 200 atualiza UI e mostra “Seu voto foi registrado.”.
- **Alternativas/erros:** repetição HTTP retorna 200 sem duplicar; troca substitui status; sem texto ou versão antiga, 409; corpo inválido, 400; acesso, 401/403; reunião ausente, 404; exceção, 500. Após edição remota, recarregar e votar na nova versão; não existe encerramento/quórum.
- **Pós-condições:** voto único sobre versão atual, contagens recalculadas e texto preservado. Erro não é confirmado como voto.
- **Relações UML:** nenhuma; quatro associações individuais.
- **Rastreabilidade:** S01–S03/S05; Reuniao/AtaVoto; DS-Votar-Ata; CT-RF16-03–05/11–16 e CT-RNF45-01–03.

## Auditoria da ficha

| Elipse do diagrama | Ficha | Pré-condições | Pós-condições | Fluxos e erros | Verificado no código |
|---|---|---|---|---|---|
| UC19 — Votar na ata | Ficha acima | Sim | Sim | Sim | Sim |

## Diagrama de casos de uso

![Diagrama de casos de uso](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/images/DCU-Ata-Reuniao.svg)

</details>
