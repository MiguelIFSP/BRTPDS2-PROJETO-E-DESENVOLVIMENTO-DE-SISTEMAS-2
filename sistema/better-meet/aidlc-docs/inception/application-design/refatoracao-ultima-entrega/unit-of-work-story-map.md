- **Incremento:** Apresentação final (AF) — refatoração de código
- **Escopo:** mapa RF-R → unidade → onda → prioridade
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** aed2702
- **Data de revisão:** 2026-11-20
- **Responsável(eis):** [nome de quem revisa e aprova]
- **Estado:** Proposta — aguardando aprovação da Units Generation
- **Fontes:** [unit-of-work.md](unit-of-work.md); [unit-of-work-dependency.md](unit-of-work-dependency.md); [requirements.md](../../requirements/refatoracao-ultima-entrega/requirements.md) (seções 4 a 9 e 13)

# Mapa de requisitos por unidade

Legenda de corte: **O** = obrigatório (seção 13.1); **O\*** = obrigatório inferido (o requisito acompanha um obrigatório e a seção 13 não o lista); **OC** = obrigatório condicional (só se os consumidores permitirem); **S1 a S6** = "se der tempo", pelo número da ordem de corte da seção 13.2 (S1 sai primeiro). A RF-R36 é S4, mas a parte de biometria é S1.

## 1. Tabela

| RF-R | Unidade | Onda | Prioridade | Corte |
|---|---|---|---|---|
| RF-R01 | U1 | 1 | Crítica | O |
| RF-R02 | U1 | 1 | Crítica | O |
| RF-R03 | U1 | 1 | Crítica | O |
| RF-R04 | U1 | 1 | Alta | O |
| RF-R05 | U1 | 1 | Alta | O |
| RF-R06 | U1 | 1 | Média | S2 |
| RF-R07 | U1 | 1 | Crítica | O |
| RF-R08 | U7 | 2 | Crítica | O |
| RF-R09 | U7 | 1 | Alta | O |
| RF-R10 | U7 | 1 | Alta | O |
| RF-R11 | U7 | 1 | Alta | O |
| RF-R12 | U1 | 1 | Média | O |
| RF-R13 | U7 | 2 | Média | S5 |
| RF-R14 | U7 | 2 | Média | S4 |
| RF-R15 | U7 | 2 | Média | S4 |
| RF-R16 | U7 | 2 | Média | O |
| RF-R17 | U7 | 2 | Média | O |
| RF-R18 | U7 | 2 | Média | O |
| RF-R19 | U7 | 2 | Baixa | S3 |
| RF-R20 | U7 | 2 | Baixa | S4 |
| RF-R21 | U1 | 1 | Alta | O |
| RF-R22 | U9 | 3 | Baixa | OC |
| RF-R23 | U7 | 2 | Média | O* |
| RF-R24 | U7 | 2 | Baixa | S6 |
| RF-R25 | U9 | 3 | Média | O* |
| RF-R26 | U8 | 2 | Crítica | O |
| RF-R27 | U8 | 2 | Crítica | O |
| RF-R28 | U8 | 2 | Alta | O |
| RF-R29 | U8 | 2 | Alta | O |
| RF-R30 | U8 | 2 | Média | S2 |
| RF-R31 | U8 | 2 | Média | S1 |
| RF-R32 | U8 | 2 | Alta | O |
| RF-R33 | U8 | 2 | Alta | O |
| RF-R34 | U8 | 2 | Média | O* |
| RF-R35 | U5 | 2 | Alta | O |
| RF-R36 | U5 | 2 | Média | S4 |
| RF-R37 | U5 | 2 | Média | S4 |
| RF-R38 | U5 | 2 | Média | O |
| RF-R39 | U5 | 2 | Média | O |
| RF-R40 | U5 | 2 | Média | O |
| RF-R41 | U5 | 1 | Média | O |
| RF-R42 | U5 | 1 | Média | S5 |
| RF-R43 | U5 | 1 | Média | O |
| RF-R44 | U5 | 2 | Baixa | S3 |
| RF-R45 | U5 | 1 | Média | S3 |
| RF-R46 | U5 | 1 | Baixa | O |
| RF-R47 | U5 | 1 | Baixa | O |
| RF-R48 | U5 | 1 | Baixa | O |
| RF-R49 | U5 | 1 | Baixa | S6 |
| RF-R50 | U8 | 2 | Baixa | S6 |
| RF-R51 | U8 | 2 | Baixa | S6 |
| RF-R52 | U2 | 1 | Média | O |
| RF-R53 | U2 | 1 | Baixa | O |
| RF-R54 | U2 | 1 | Média | O |
| RF-R55 | U2 | 1 | Alta | O |
| RF-R56 | U2 | 2 | Crítica | O |
| RF-R57 | U2 | 1 | Baixa | O |
| RF-R58 | U2 | 1 | Média | O |
| RF-R59 | U2 | 1 | Média | O |
| RF-R60 | U2 | 1 | Alta | O |
| RF-R61 | U9 | 3 | Baixa | OC |
| RF-R62 | U2 | 2 | Baixa | O* |
| RF-R63 | U2 | 1 | Baixa | S6 |
| RF-R64 | U3 | 2 | Alta | O |
| RF-R65 | U3 | 1 | Média | O |
| RF-R66 | U3 | 1 | Alta | O |
| RF-R67 | U3 | 2 | Crítica | O |
| RF-R68 | U3 | 1 | Baixa | O |
| RF-R69 | U3 | 1 | Baixa | S6 |
| RF-R70 | U4 | 2 | Alta | O |
| RF-R71 | U4 | 1 | Baixa | O |
| RF-R72 | U4 | 2 | Alta | O |
| RF-R73 | U4 | 1 | Baixa | O |
| RF-R74 | U4 | 1 | Baixa | O |
| RF-R75 | U4 | 1 | Média | O |
| RF-R76 | U9 | 3 | Baixa | OC |
| RF-R77 | U6 | 1 | Baixa | O |
| RF-R78 | U9 | 3 | Média | O |
| RF-R79 | U6 | 3 | Média | O |
| RF-R80 | U6 | 3 | Baixa | S6 |
| RF-R81 | U6 | 1 | Média | S6 |
| RF-R82 | U9 | 3 | Média | O |
| RF-R83 | U9 | 3 | Baixa | S6 |
| RF-R84 | U9 | 3 | Alta | O |
| RF-R85 | U9 | 3 | Baixa | S6 |

## 2. Contagem por unidade

| Unidade | Requisitos | Quantidade |
|---|---|---|
| U1 | R01, R02, R03, R04, R05, R06, R07, R12, R21 | 9 |
| U2 | R52, R53, R54, R55, R56, R57, R58, R59, R60, R62, R63 | 11 |
| U3 | R64, R65, R66, R67, R68, R69 | 6 |
| U4 | R70, R71, R72, R73, R74, R75 | 6 |
| U5 | R35, R36, R37, R38, R39, R40, R41, R42, R43, R44, R45, R46, R47, R48, R49 | 15 |
| U6 | R77, R79, R80, R81 | 4 |
| U7 | R08, R09, R10, R11, R13, R14, R15, R16, R17, R18, R19, R20, R23, R24 | 14 |
| U8 | R26, R27, R28, R29, R30, R31, R32, R33, R34, R50, R51 | 11 |
| U9 | R22, R25, R61, R76, R78, R82, R83, R84, R85 | 9 |
| **Total** | | **85** |

## 3. Conferência

- A tabela da seção 1 tem 85 linhas, de RF-R01 a RF-R85, sem lacuna e sem repetição; cada requisito aparece em uma só unidade.
- A soma das contagens da seção 2 é 9 + 11 + 6 + 6 + 15 + 4 + 14 + 11 + 9 = 85.
- Contagem por subsistema do requirements (api 25, app 26, monitoring 12, gestão servidor 6, web 7, documentação 9) bate com as unidades: api = U1 9 + U7 14 + RF-R22 e R25 da U9 = 25; app = U5 15 + U8 11 = 26; monitoring = U2 11 + RF-R61 da U9 = 12; gestão servidor = U3 6; web = U4 6 + RF-R76 da U9 = 7; documentação = U6 4 + U9 RF-R78, R82, R83, R84, R85 = 9.
- Por onda (considerando a fase de cada requisito): onda 1 = 39, onda 2 = 35, onda 3 = 11.
- Fases em duas ondas: U2 (R56, R62 na onda 2), U3 (R64, R67), U4 (R70, R72), U5 (R35 a R40, R44), U6 (R79, R80 na onda 3), U7 (R08, R13 a R20, R23, R24 na onda 2).
- F37 e F40 continuam fora do escopo; não há requisito para eles.
