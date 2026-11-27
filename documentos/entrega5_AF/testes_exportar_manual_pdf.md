# Testes de exportação do manual em PDF

```text
Incremento: Entrega 5 — Apresentação final
Escopo: RF62 — Exportar manual em PDF (UC53); RNF64
Versão: 1.2
Branch: final-miguel
Commit: ebee539 (base; as alterações deste incremento ainda não têm commit)
Data de revisão: 2026-11-27
Responsável(eis): Bruno Soares Machado
Estado: Parcial (testes automatizados aprovados; teste manual aprovado no Android; iOS e web não executados)
Fontes: sistema/better-meet/src/utils/__tests__/manualPdf.test.ts; sistema/better-meet/src/utils/__tests__/manualPdfWeb.test.ts; sistema/better-meet/src/components/manual/__tests__/ManualScreen.test.tsx; exportar_manual_pdf.md; documentos/consolidado/softwares_e_licencas.md
```

## Plano de testes

O plano foi redigido junto com o registro de execução, depois da escrita dos testes automatizados, e não antes da execução como pede a regra DOC-23.

### Escopo

O plano cobre o RF62 e o RNF64 na tela do manual. Autenticação e autorização na API não se aplicam, porque o requisito não envia requisições. Na web, os testes automatizados simulam a janela de impressão.

### Tipos de teste

A tabela mostra como cada tipo de teste se aplica a este assunto.

| Tipo | Aplicação neste assunto | Ferramenta e versão | Exemplo (arquivo ou roteiro) |
|---|---|---|---|
| Unidade | Conteúdo do documento e fluxo de exportação por plataforma, com `expo-asset`, `expo-print`, `expo-sharing`, `expo-file-system` e a janela do navegador simulados | Jest 30.5.2 com `jest-expo` 58.0.15 | `src/utils/__tests__/manualPdf.test.ts` e `manualPdfWeb.test.ts` |
| Integração | Botão da tela e exibição do erro, com `exportManualPdf` e `Header` simulados | React Native Testing Library 14.1.0 | `src/components/manual/__tests__/ManualScreen.test.tsx` |
| Release (manual) | Exportação real e seleção do texto no arquivo | Aparelhos Android e iOS e um navegador | Roteiro da seção “Teste manual” |

Os arquivos de teste ficam em pastas `__tests__/`, ao lado do código, com os sufixos `.test.ts` e `.test.tsx`.

### Ambiente e aparelhos

Os testes automatizados são executados no Node.js 24.15.0, sem banco de dados e sem acesso à API. O teste manual no Android usou um Samsung Galaxy S21+, Android 15, interface One UI 7.0; a forma de execução (Expo Go ou build de desenvolvimento) não foi informada [A CONFIRMAR]. Os aparelhos para iOS e o navegador ainda precisam ser definidos.

### Critérios de aprovação

O assunto é aprovado quando os 11 casos planejados têm o status “Passou” e a suíte do aplicativo não apresenta falha.

### Casos de teste planejados

A tabela mostra os casos planejados.

| ID | RF/RNF e UC | Cenário | Tipo | Resultado esperado |
|---|---|---|---|---|
| CT-RF62-01 | RF62, UC53 | Exportação com sucesso no Android e no iOS (simulada) | Unidade | Arquivo gravado no cache e compartilhamento solicitado com o tipo `application/pdf` |
| CT-RF62-02 | RF62, UC53 | Compartilhamento indisponível | Unidade | Erro lançado, sem geração do PDF |
| CT-RF62-03 | RF62, UC53 | PDF sem conteúdo devolvido | Unidade | Erro lançado, sem compartilhamento |
| CT-RF62-04 | RF62, UC53 | Toque no botão com exportação bem-sucedida | Integração | Exportação solicitada uma vez, sem aviso de erro |
| CT-RF62-05 | RF62, UC53 | Toque no botão com falha na exportação | Integração | Mensagem de erro exibida |
| CT-RF62-06 | RF62, UC53 | Exportação e cancelamento no Android, no iOS e na web, inclusive com a janela bloqueada na web | Release | Arquivo salvo quando confirmado; botão disponível depois do cancelamento; mensagem exibida com a janela bloqueada |
| CT-RF62-07 | RF62, UC53 | Inclusão das imagens no documento e na geração do PDF | Unidade | Uma imagem para cada ilustração, em base64 no Android e no iOS |
| CT-RF62-08 | RF62, UC53 | Imagem indisponível | Unidade | Erro lançado, sem geração do PDF; na web, janela fechada sem impressão |
| CT-RF62-09 | RF62, UC53 | Exportação na web (simulada), inclusive com a janela bloqueada | Unidade | Endereço completo das imagens e impressão solicitada depois do carregamento; mensagem de janela bloqueada |
| CT-RNF64-01 | RNF64, UC53 | Conteúdo textual e caracteres especiais no documento | Unidade | 100% dos textos de `MANUAL_USUARIO` presentes e caracteres especiais substituídos |
| CT-RNF64-02 | RNF64, UC53 | Seleção e cópia do texto no PDF de cada plataforma | Release | Texto selecionável e legível nas três plataformas |

### Teste manual

Os passos abaixo atendem aos casos CT-RF62-06 e CT-RNF64-02 e são repetidos em cada plataforma.

1. Entrar no aplicativo, abrir a aba Mais e tocar em “Abrir manual do usuário”.
2. Tocar em “Exportar manual em PDF”.
3. Salvar o arquivo. Na web, escolher a opção de salvar em PDF na janela de impressão.
4. Abrir o arquivo, conferir o sumário, todos os capítulos, as 19 capturas de tela e as quebras de página, selecionar um trecho e copiá-lo.
5. Repetir a exportação e cancelar a operação. Confirmar que o botão continua disponível.
6. Na web, bloquear janelas pop-up, tocar no botão e conferir a mensagem exibida.

## Registro de execução

### O que foi testado

A tabela mostra o resultado de cada caso.

| ID | RF/RNF e UC | Rota ou tela | Cenário verificado | Arquivo ou passos | Status |
|---|---|---|---|---|---|
| CT-RF62-01 | RF62, UC53 | `exportManualPdf` | Gravação no cache e compartilhamento (simulados) | `manualPdf.test.ts` | Passou |
| CT-RF62-02 | RF62, UC53 | `exportManualPdf` | Compartilhamento indisponível | `manualPdf.test.ts` | Passou |
| CT-RF62-03 | RF62, UC53 | `exportManualPdf` | PDF sem conteúdo | `manualPdf.test.ts` | Passou |
| CT-RF62-04 | RF62, UC53 | `ManualScreen` | Toque no botão com sucesso | `ManualScreen.test.tsx` | Passou |
| CT-RF62-05 | RF62, UC53 | `ManualScreen` | Exibição do erro | `ManualScreen.test.tsx` | Passou |
| CT-RF62-06 (Android) | RF62, UC53 | `ManualScreen` | Exportação real no Samsung Galaxy S21+, Android 15, interface One UI 7.0 | Roteiro manual | Passou |
| CT-RF62-06 (iOS e web) | RF62, UC53 | `ManualScreen` | Exportação real no iOS e na web | Roteiro manual | Não executado: sem teste nessas plataformas |
| CT-RF62-07 | RF62, UC53 | `buildManualPdfHtml` e `exportManualPdf` | Imagens no documento | `manualPdf.test.ts` | Passou |
| CT-RF62-08 | RF62, UC53 | `exportManualPdf` | Imagem indisponível | `manualPdf.test.ts` e `manualPdfWeb.test.ts` | Passou |
| CT-RF62-09 | RF62, UC53 | `exportManualPdf` (web) | Janela de impressão simulada | `manualPdfWeb.test.ts` | Passou |
| CT-RNF64-01 | RNF64, UC53 | `buildManualPdfHtml` | Presença dos textos e substituição de caracteres especiais | `manualPdf.test.ts` | Passou |
| CT-RNF64-02 (Android) | RNF64, UC53 | Arquivo PDF | Verificação do arquivo gerado | Roteiro manual | Passou |
| CT-RNF64-02 (iOS e web) | RNF64, UC53 | Arquivo PDF | Seleção e cópia do texto | Roteiro manual | Não executado: sem teste nessas plataformas |

### Como rodar

Em `sistema/better-meet`, o comando abaixo executa os testes cujo caminho contém a palavra “manual”.

```bash
npx jest manual
```

### Resultado

Execução de 2026-11-27, sobre o commit `ebee539` com as alterações do incremento:

- Testes do manual (`npx jest manual`): 5 conjuntos e 19 testes aprovados, sem falhas.
- Suíte completa do aplicativo (`npx jest`), executada com todas as alterações do incremento: 53 conjuntos e 321 testes aprovados, sem falhas.
- Defeito encontrado durante a escrita do teste da tela: o Jest não resolve a importação `@/assets/images/icon.jpeg` usada no cabeçalho; o teste simula o componente `Header`.
- Verificação de tipos (`npx tsc --noEmit`): nenhum erro nos arquivos deste incremento; permanecem 6 erros em outros arquivos do aplicativo.
- Conferência auxiliar, que não substitui o teste manual: um script temporário, fora do aplicativo, montou o documento com as 19 imagens reais. O Google Chrome em modo headless gerou um PDF de aproximadamente 1,4 MB, do qual foram extraídas 19 ocorrências do rótulo “Ilustração”. O tamanho das imagens foi conferido em uma captura do início do documento em HTML.
- `npx expo install --check` e `npx expo-doctor`: atualizações de patch pendentes em 6 pacotes; uma verificação do `expo-doctor` reprovada.
- Teste manual: executado por Bruno Soares Machado em um Samsung Galaxy S21+, Android 15, interface One UI 7.0. Resultado informado pelo testador: testes executados e funcionalidades aprovadas conforme o esperado. Não foram anexadas capturas ou outros arquivos de evidência. Nenhum defeito foi relatado.
- Lacunas: CT-RF62-06 e CT-RNF64-02 não foram executados no iOS nem na web.

## Histórico de revisões

| Versão | Data | Autor(es) | Alteração |
|---|---|---|---|
| 1.0 | 2026-11-27 | Bruno Soares Machado | Criação do documento |
| 1.1 | 2026-11-27 | Bruno Soares Machado | Inclusão dos testes das capturas de tela no PDF |
| 1.2 | 2026-11-27 | Bruno Soares Machado | Registro do teste manual no Android, assinatura e renumeração |
