const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const manualDir = __dirname;
const repoRoot = path.resolve(manualDir, '..', '..');
const manualPath =
  process.env.MANUAL_SOURCE_PATH ||
  path.join(manualDir, 'Manual-do-Usuario-Better-Meet.txt');
const screenshotsDir =
  process.argv[2] || path.join(manualDir, 'imagens');
const appAssetsDir = path.join(
  repoRoot,
  'sistema',
  'better-meet',
  'assets',
  'manual',
);
const pdfName = 'Manual-do-Usuario-Better-Meet.pdf';
const pdfPath = path.join(manualDir, pdfName);
const appPdfPath = path.join(appAssetsDir, pdfName);
const chromePath =
  process.env.CHROME_BIN ||
  (process.platform === 'win32'
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    : 'google-chrome');

function numberedScreenshots(prefix, first, last) {
  return Array.from(
    { length: last - first + 1 },
    (_, index) => `${prefix}${first + index}.jpeg`,
  );
}

const SCREENSHOTS_BY_MARKER = new Map([
  ['TelaLogin1', ['TelaLogin1.jpeg']],
  ['TelaLogin2', []],
  ['TelaLogin3', ['TelaLogin4.jpeg']],
  ['TelaLogin4', ['TelaLogin2.jpeg']],
  ['TelaLogin5', ['TelaLogin3.jpeg']],
  ['CadastroUsuario1', ['Cadastro1.jpeg']],
  ['CadastroUsuario2', numberedScreenshots('Cadastro', 2, 4)],
  ['CadastroUsuario3', ['Cadastro5.jpeg']],
  ['RecuperarConta1', ['EsqueciSenha1.jpeg']],
  ['RecuperarConta2', ['EsqueciSenha2.jpeg', 'EsqueciSenha3.jpeg']],
  ['RecuperarConta3', ['EsqueciSenha4.jpeg']],
  ['NavegacaoPrincipal', ['Reunioes1.jpeg', 'Reunioes2.jpeg']],
  ['ReunioesLista', ['Reunioes3.jpeg', 'Reunioes4.jpeg']],
  ['ReuniaoNovaEtapa1', numberedScreenshots('Reunioes', 5, 7)],
  ['ReuniaoNovaEtapa2', numberedScreenshots('Reunioes', 8, 9)],
  ['ReuniaoNovaEtapa3', ['Reunioes10.jpeg']],
  ['ReuniaoValidacao', ['Reunioes11.jpeg']],
  ['ReuniaoDetalhes', [
    'Reunioes12.jpeg',
    'Reunioes13.jpeg',
    'Reunioes14.jpeg',
    'Reunioes16.jpeg',
    'Reunioes17.jpeg',
  ]],
  ['ReuniaoConvidar', ['Reunioes15.jpeg']],
  ['NotificacoesConvite', ['Notificacao1.jpeg']],
  ['NotificacoesAvisos', ['Notificacao2.jpeg']],
  ['OrganizacoesListaUsuario', ['Organizacoes1.jpeg']],
  ['OrganizacoesListaAdmin', numberedScreenshots('OrganizacoesADM', 1, 4)],
  ['OrganizacaoNova', ['Organizacoes2.jpeg']],
  ['OrganizacaoPendente', ['Organizacoes3.jpeg', 'Organizacoes4.jpeg']],
  ['OrganizacaoDetalhes', [
    'OrganizacoesADM5.jpeg',
    'OrganizacoesADM6.jpeg',
    'Organizacoes5.jpeg',
  ]],
  ['OrganizacaoAdicionarMembro', numberedScreenshots('OrganizacoesADM', 7, 10)],
  ['OrganizacaoAcoesMembro', numberedScreenshots('OrganizacoesADM', 11, 15)],
  ['OrganizacaoExcluirConfirmacao', ['OrganizacoesADM16.jpeg']],
  ['ComissoesLista', ['Comissao2.jpeg']],
  ['ComissoesVazia', ['Comissao1.jpeg']],
  ['ComissaoNova', ['Comissao3.jpeg']],
  ['ComissaoCriada', ['Comissao4.jpeg']],
  ['ComissaoDetalhes', ['Comissao5.jpeg', 'Comissao6.jpeg']],
  ['ComissaoAdicionarMembro', ['Comissao7.jpeg', 'Comissao8.jpeg']],
  ['ComissaoConfirmarAcao', ['Comissao9.jpeg']],
  ['ComissaoExcluirConfirmacao', ['Comissao10.jpeg']],
  ['MaisMenu', ['Mais1.jpeg', 'Mais2.jpeg']],
  ['MaisTemaEscuro', []],
  ['PerfilConta', ['Mais3.jpeg', 'Mais4.jpeg']],
  ['PerfilEditarDados', ['Mais5.jpeg', 'Mais6.jpeg', 'Mais7.jpeg']],
  ['PerfilAlterarSenha', numberedScreenshots('Mais', 8, 11)],
  ['PerfilSair', []],
  ['StatusSistemaUsuario', ['Status1.jpeg']],
  ['StatusSistemaAdmin', ['Status2.jpeg']],
  ['StatusHistoricoDetalhe', ['Status3.jpeg']],
  ['RelatorioOrganizacoes', ['Relatorio1.jpeg', 'Relatorio2.jpeg']],
  ['RelatorioComissoes', ['Relatorio3.jpeg', 'Relatorio4.jpeg']],
  ['RelatorioUsuarios', []],
  ['RelatorioDetalheUsuario', []],
  ['ExcluirDadosOpcoes', ['Mais12.jpeg', 'Mais13.jpeg']],
  ['ExcluirDadosSucessor', ['Mais14.jpeg']],
  ['ExcluirDadosConfirmacao', ['Mais15.jpeg']],
  ['ExcluirDadosSucesso', ['Mais16.jpeg']],
]);

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function inlineMarkup(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function reorderManualChapters(bodyHtml, tocItems) {
  const chapterNumbers = new Map([
    [7, 9],
    [8, 7],
    [9, 8],
  ]);
  const headings = [...bodyHtml.matchAll(/<h1>(\d+)\. [\s\S]*?<\/h1>/g)];
  const chapters = headings.map((heading, index) => {
    const number = Number(heading[1]);
    const start = heading.index;
    const end = headings[index + 1]?.index ?? bodyHtml.length;
    const targetNumber = chapterNumbers.get(number) ?? number;
    const html = bodyHtml
      .slice(start, end)
      .replace(new RegExp(`<h1>${number}\\. `), `<h1>${targetNumber}. `)
      .replace(
        new RegExp(`<h2>${number}\\.(\\d+)`, 'g'),
        `<h2>${targetNumber}.$1`,
      );
    return { number: targetNumber, html };
  });
  const prefix = headings.length > 0 ? bodyHtml.slice(0, headings[0].index) : '';
  const sortedBody = prefix + chapters
    .sort((left, right) => left.number - right.number)
    .map((chapter) => chapter.html)
    .join('');
  const reorderedBody = sortedBody.replace(
    /(se[cç][aã]o\s+)([789])(?=\.)/gi,
    (reference, prefix, number) =>
      `${prefix}${chapterNumbers.get(Number(number)) ?? number}`,
  );
  const reorderedToc = tocItems
    .map((item) => {
      const match = item.match(/^(\d+)\. (.+)$/);
      if (!match) return item;
      const number = Number(match[1]);
      return `${chapterNumbers.get(number) ?? number}. ${match[2]}`;
    })
    .sort((left, right) => {
      const leftNumber = Number(left.match(/^\d+/)?.[0]);
      const rightNumber = Number(right.match(/^\d+/)?.[0]);
      return leftNumber - rightNumber;
    });

  return { bodyHtml: reorderedBody, tocItems: reorderedToc };
}

function imageNames(line) {
  const names = new Set();
  const rangePattern = /([A-Za-z]+)(\d+)\.jpeg\s+a\s+([A-Za-z]+)(\d+)\.jpeg/gi;
  for (const match of line.matchAll(rangePattern)) {
    const [, firstPrefix, firstValue, lastPrefix, lastValue] = match;
    if (firstPrefix.toLowerCase() !== lastPrefix.toLowerCase()) continue;
    const first = Number(firstValue);
    const last = Number(lastValue);
    if (last < first || last - first > 40) continue;
    for (let number = first; number <= last; number += 1) {
      names.add(`${firstPrefix}${number}.jpeg`);
    }
  }

  for (const match of line.matchAll(/\b[A-Za-z][A-Za-z0-9_-]*\.jpeg\b/gi)) {
    names.add(match[0]);
  }
  return [...names];
}

function makeScreenshotBlock(names, context, imageCache) {
  const screenshots = names.map((name) => {
    const imagePath = path.join(screenshotsDir, name);
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Captura referenciada não encontrada: ${imagePath}`);
    }
    if (!imageCache.has(name)) {
      const base64 = fs.readFileSync(imagePath).toString('base64');
      imageCache.set(name, `data:image/jpeg;base64,${base64}`);
    }
    return { name, src: imageCache.get(name) };
  });

  if (screenshots.length === 0) return '';
  const caption = context ? `<p class="shot-context">${inlineMarkup(context)}</p>` : '';
  const figures = screenshots
    .map(
      ({ name, src }) =>
        `<figure class="shot"><img src="${src}" alt="Captura de tela do Better Meet: ${escapeHtml(name)}" /><figcaption>${escapeHtml(name)}</figcaption></figure>`,
    )
    .join('');
  return `<div class="shot-group">${caption}<div class="shots">${figures}</div></div>`;
}

function parseManual(source) {
  const lines = source.replace(/^\uFEFF/, '').split(/\r?\n/);
  const bodyStart = lines.findIndex(
    (line, index) =>
      line === '1. Apresentação' && /^-+$/.test(lines[index + 1] || ''),
  );
  const bodyEnd = lines.findIndex(
    (line, index) =>
      index > bodyStart &&
      line === '16. Lista de capturas de tela' &&
      /^-+$/.test(lines[index + 1] || ''),
  );
  const tocStart = lines.indexOf('Sumário');
  if (bodyStart < 0 || bodyEnd < 0 || tocStart < 0) {
    throw new Error('Não foi possível localizar o sumário e os capítulos do manual.');
  }

  const tocItems = lines
    .slice(tocStart + 2, bodyStart)
    .map((line) => line.trim())
    .filter((line) => /^\d+\. /.test(line) && !line.startsWith('16. '));

  const imageCache = new Map();
  let html = '';
  let paragraph = [];
  let listItems = [];
  let listType = null;

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      html += `<p>${inlineMarkup(paragraph.join(' '))}</p>`;
      paragraph = [];
    }
  };
  const flushList = () => {
    if (listItems.length > 0) {
      const tag = listType === 'ordered' ? 'ol' : 'ul';
      html += `<${tag}>${listItems.map((item) => `<li>${inlineMarkup(item)}</li>`).join('')}</${tag}>`;
      listItems = [];
      listType = null;
    }
  };
  const flushText = () => {
    flushParagraph();
    flushList();
  };

  for (let index = bodyStart; index < bodyEnd; index += 1) {
    const line = lines[index].trim();
    if (!line) {
      flushText();
      continue;
    }

    if (/^-{3,}$/.test(line)) continue;

    if (/^\d+\. \S/.test(line) && /^-+$/.test(lines[index + 1] || '')) {
      flushText();
      html += `<h1>${inlineMarkup(line)}</h1>`;
      index += 1;
      continue;
    }

    if (/^\d+\.\d+ \S/.test(line)) {
      flushText();
      html += `<h2>${inlineMarkup(line)}</h2>`;
      continue;
    }

    if (/^Etapa \d+ de \d+/.test(line)) {
      flushText();
      html += `<h3>${inlineMarkup(line)}</h3>`;
      continue;
    }

    if (/^\[(?:INSERIR )?IMAGEM:/.test(line)) {
      flushText();
      const markerName = line.match(
        /^\[(?:INSERIR )?IMAGEM:\s*([A-Za-z][A-Za-z0-9_-]*)\.(?:png|jpe?g)\b/i,
      )?.[1];
      const mappedNames = markerName
        ? SCREENSHOTS_BY_MARKER.get(markerName)
        : undefined;
      const names = mappedNames ?? imageNames(line);
      const existingNames = names.filter((name) =>
        fs.existsSync(path.join(screenshotsDir, name)),
      );
      if (existingNames.length > 0) {
        let context = line
          .replace(/^\[(?:INSERIR )?IMAGEM:\s*/, '')
          .replace(/^[^—]*—\s*/, '')
          .replace(/\]$/, '');
        if (markerName === 'OrganizacoesListaAdmin') {
          context = `Conta administrativa, separada da conta user@user que fez a solicitação. ${context}`;
        } else if (markerName === 'OrganizacaoDetalhes') {
          context =
            'Na conta administrativa, consulte os detalhes e a equipe; a última captura mostra user@user após a atualização. ' +
            context;
        } else if (
          markerName?.startsWith('Organizacao') &&
          names.some((name) => name.startsWith('OrganizacoesADM'))
        ) {
          context = `Na conta administrativa: ${context}`;
        }
        html += makeScreenshotBlock(existingNames, context, imageCache);
      }
      continue;
    }

    if (line.startsWith('[CAPTURA')) {
      flushText();
      continue;
    }

    if (line.startsWith('• ')) {
      flushParagraph();
      if (listType !== 'unordered') {
        flushList();
        listType = 'unordered';
      }
      listItems.push(line.slice(2));
      continue;
    }

    const orderedItem = line.match(/^\d+\. (.+)$/);
    if (orderedItem) {
      flushParagraph();
      if (listType !== 'ordered') {
        flushList();
        listType = 'ordered';
      }
      listItems.push(orderedItem[1]);
      continue;
    }

    flushList();
    paragraph.push(line);
  }
  flushText();

  const reordered = reorderManualChapters(html, tocItems);
  return {
    tocItems: reordered.tocItems,
    bodyHtml: reordered.bodyHtml,
    coverLogo: path.join(screenshotsDir, 'LogoBetterMeet.png'),
  };
}

function dataUri(filePath, mimeType) {
  const base64 = fs.readFileSync(filePath).toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

function renderHtml({ tocItems, bodyHtml, coverLogo }) {
  const toc = tocItems.map((item) => `<li>${inlineMarkup(item.replace(/^\d+\. /, ''))}</li>`).join('');
  const logo = fs.existsSync(coverLogo)
    ? `<img class="logo" src="${dataUri(coverLogo, 'image/png')}" alt="Better Meet" />`
    : '<div class="logo-fallback">BM</div>';

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Manual do Usuário — Better Meet</title>
  <style>
    :root { color-scheme: light; }
    @page {
      size: A4;
      margin: 18mm 16mm 18mm;
      @top-left { content: "BETTER MEET · MANUAL DO USUÁRIO"; color: #527078; font: 8pt Arial, sans-serif; }
      @bottom-right { content: "Página " counter(page); color: #527078; font: 8pt Arial, sans-serif; }
    }
    @page cover { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #1b3034; font-family: Arial, "Helvetica Neue", sans-serif; font-size: 10pt; line-height: 1.48; }
    .cover { page: cover; position: relative; width: 210mm; height: 297mm; overflow: hidden; color: #f6fbfa; background: #0d1b1d; break-after: page; }
    .cover .logo { position: absolute; top: 52mm; left: 28mm; width: 30mm; height: 30mm; object-fit: contain; border-radius: 8mm; }
    .cover .brand { position: absolute; top: 112mm; left: 28mm; margin: 0; color: #21cbb4; font-size: 15pt; font-weight: 700; letter-spacing: 2.4pt; }
    .cover h1 { position: absolute; top: 130mm; left: 28mm; max-width: 145mm; margin: 0; font-size: 34pt; line-height: 1.08; color: #fff; }
    .cover p { position: absolute; top: 153mm; left: 28mm; max-width: 125mm; margin: 0; color: #a8c2c6; font-size: 14pt; }
    .cover-accent { position: absolute; top: 191mm; left: 28mm; width: 34mm; height: 2mm; background: #21cbb4; border-radius: 2mm; }
    .cover .edition { top: 205mm; font-size: 10pt; }
    .toc-page { break-after: page; }
    .toc-page h1 { margin: 0 0 8mm; color: #0d5752; font-size: 24pt; }
    .toc-page ol { margin: 0; padding-left: 7mm; }
    .toc-page li { break-inside: avoid; margin: 0 0 5mm; padding-left: 1mm; color: #2f5158; font-size: 10pt; }
    h1 { margin: 0 0 5mm; color: #0d5752; font-size: 22pt; line-height: 1.15; break-after: avoid; }
    h2 { margin: 8mm 0 3mm; color: #153f43; font-size: 14pt; line-height: 1.2; break-after: avoid; }
    h3 { margin: 6mm 0 2mm; color: #167f75; font-size: 11pt; break-after: avoid; }
    p { margin: 0 0 3.4mm; orphans: 3; widows: 3; }
    ul, ol { margin: 1mm 0 5mm; padding-left: 7mm; }
    li { margin-bottom: 1.7mm; padding-left: 1mm; }
    code { padding: 0.2mm 1mm; color: #0b655c; background: #e9f4f2; font-family: Consolas, monospace; font-size: 9pt; }
    strong { color: #21393d; }
    .shot-group { margin: 5mm 0 7mm; }
    .shot-context { margin-bottom: 2mm; color: #527078; font-size: 8.5pt; }
    .shots { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4mm; align-items: start; }
    .shot { margin: 0; padding: 2mm; border: 0.4mm solid #dce7e5; border-radius: 2mm; background: #f6f9f8; break-inside: avoid; page-break-inside: avoid; }
    .shot img { display: block; width: 100%; max-height: 240pt; object-fit: contain; }
    .shot figcaption { margin-top: 1mm; color: #527078; text-align: center; font-size: 7.5pt; }
    .capture-appendix { break-before: page; }
    @media screen { body { max-width: 210mm; margin: 0 auto; } }
  </style>
</head>
<body>
  <section class="cover">
    ${logo}
    <div class="brand">BETTER MEET</div>
    <h1>Manual do Usuário</h1>
    <p>Organize reuniões, organizações e comissões com mais clareza.</p>
    <div class="cover-accent"></div>
    <p class="edition">Guia de uso do aplicativo móvel</p>
  </section>
  <section class="toc-page">
    <h1>Sumário</h1>
    <ol>${toc}</ol>
  </section>
  <main>${bodyHtml}</main>
</body>
</html>`;
}

function main() {
  if (!fs.existsSync(manualPath)) throw new Error(`Manual não encontrado: ${manualPath}`);
  if (!fs.existsSync(screenshotsDir)) {
    throw new Error(`Pasta de capturas não encontrada: ${screenshotsDir}`);
  }
  if (!fs.existsSync(path.join(screenshotsDir, 'LogoBetterMeet.png'))) {
    throw new Error('LogoBetterMeet.png não foi encontrado na pasta de capturas.');
  }

  const manual = fs.readFileSync(manualPath, 'utf8');
  const html = renderHtml(parseManual(manual));
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bettermeet-manual-'));
  const htmlPath = path.join(tempRoot, 'manual.html');
  const tempPdfPath = path.join(tempRoot, pdfName);
  const profilePath = path.join(tempRoot, 'chrome-profile');
  fs.writeFileSync(htmlPath, html, 'utf8');

  try {
    const result = spawnSync(
      chromePath,
      [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--no-first-run',
        '--disable-extensions',
        '--no-pdf-header-footer',
        `--user-data-dir=${profilePath}`,
        `--print-to-pdf=${tempPdfPath}`,
        new URL(`file:///${htmlPath.replace(/\\/g, '/')}`).href,
      ],
      { encoding: 'utf8', timeout: 120000, maxBuffer: 4 * 1024 * 1024 },
    );

    if (result.error) throw result.error;
    if (result.status !== 0 || !fs.existsSync(tempPdfPath)) {
      throw new Error(`Chrome não gerou o PDF. ${result.stderr || result.stdout || ''}`);
    }

    fs.mkdirSync(appAssetsDir, { recursive: true });
    fs.copyFileSync(tempPdfPath, pdfPath);
    fs.copyFileSync(tempPdfPath, appPdfPath);
  } finally {
    const tempBase = `${path.resolve(os.tmpdir())}${path.sep}`;
    const resolvedTemp = path.resolve(tempRoot);
    if (
      resolvedTemp.startsWith(tempBase) &&
      path.basename(resolvedTemp).startsWith('bettermeet-manual-')
    ) {
      fs.rmSync(resolvedTemp, { recursive: true, force: true });
    }
  }

  const bytes = fs.statSync(pdfPath).size;
  console.log(`PDF criado: ${pdfPath} (${(bytes / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`Cópia para o aplicativo: ${appPdfPath}`);
}

main();
