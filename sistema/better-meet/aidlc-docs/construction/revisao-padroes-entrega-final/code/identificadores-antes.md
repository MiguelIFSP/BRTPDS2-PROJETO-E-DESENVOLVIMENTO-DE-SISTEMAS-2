# Identificadores antes da alteração

Lista extraída do commit `704478f15192f757223c1efce99f43a7a411888c` (passo 1 do plano), para conferir o RNQ-02: nenhum identificador desta lista pode desaparecer nem mudar de número depois da alteração.

## Guias

A tabela mostra os identificadores entre parênteses nos títulos de cada guia.

| Arquivo | Identificadores |
|---|---|
| `GUIA_DE_CODIFICACAO.md` | TS-01 a TS-09; NM-01 a NM-08; EX-01 a EX-18; PR-01 a PR-09; YP-01 a YP-04; RN-01 a RN-19; ZS-01 a ZS-05; UI-01 a UI-08; GT-01 a GT-05 |
| `GUIA_DE_DOCUMENTACAO.md` | DOC-01 a DOC-25 |

## Prompts

A tabela mostra os números de regra na ordem em que aparecem no arquivo.

| Arquivo | Números, na ordem do arquivo |
|---|---|
| `PROMPT_AGENTES_IA.md` | 1 a 76; 81 e 82; 83 a 90; 77 a 80 |
| `PROMPT_DOCUMENTACAO_IA.md` | 1 a 25 |

## Comando usado

```bash
git show 704478f:<arquivo> | grep -oE '\((TS|NM|EX|PR|YP|RN|ZS|UI|GT|DOC)-[0-9]{2}( e (TS|NM|EX|PR|YP|RN|ZS|UI|GT|DOC)-[0-9]{2})?\)'
git show 704478f:<prompt> | grep -oE '^ ?[0-9]{1,3}\. \*\*'
```
