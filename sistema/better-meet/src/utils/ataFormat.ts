export const ATA_FONT_SIZES = [10, 13, 16, 18, 24, 32, 48] as const;
export const ATA_TABLE_BORDERS = [
  { value: 'all', label: 'Todas as bordas' },
  { value: 'outer', label: 'Bordas externas' },
  { value: 'inner', label: 'Bordas internas' },
  { value: 'horizontal', label: 'Bordas horizontais' },
  { value: 'vertical', label: 'Bordas verticais' },
  { value: 'top', label: 'Somente borda superior' },
  { value: 'bottom', label: 'Somente borda inferior' },
  { value: 'left', label: 'Somente borda esquerda' },
  { value: 'right', label: 'Somente borda direita' },
  { value: 'none', label: 'Sem bordas' },
] as const;
export type AtaTableBorder = (typeof ATA_TABLE_BORDERS)[number]['value'];
export type AtaTableOptions = {
  rows: number;
  cols: number;
  header: boolean;
  border: AtaTableBorder;
};
export const isAtaTableBorder = (value: unknown): value is AtaTableBorder =>
  ATA_TABLE_BORDERS.some((border) => border.value === value);

export const nextAtaFontSize = (current: number, direction: 1 | -1) =>
  direction === 1
    ? (ATA_FONT_SIZES.find((size) => size > current) ?? 48)
    : ([...ATA_FONT_SIZES].reverse().find((size) => size < current) ?? 10);

export const createAtaTableHtml = ({
  rows,
  cols,
  header,
  border,
}: AtaTableOptions) => {
  if (
    !Number.isInteger(rows) ||
    rows < 1 ||
    rows > 10 ||
    !Number.isInteger(cols) ||
    cols < 1 ||
    cols > 6 ||
    !isAtaTableBorder(border)
  )
    throw new Error('Escolha de 1 a 10 linhas e de 1 a 6 colunas.');
  const body = Array.from({ length: rows }, (_, index) => {
    const tag = header && index === 0 ? 'th' : 'td';
    return `<tr>${`<${tag}><p><br></p></${tag}>`.repeat(cols)}</tr>`;
  }).join('');
  return `<table data-ata-border="${border}"><tbody>${body}</tbody></table><p><br></p>`;
};

// O atributo enum mantém as bordas portáveis sem aceitar CSS arbitrário no HTML salvo.
export const getAtaDocumentCss = (scope: string) => `
  ${scope}{overflow-wrap:anywhere}
  ${scope} pre{white-space:pre-wrap}
  ${scope} h1{font-size:32px}
  ${scope} h2{font-size:24px}
  ${scope} h3{font-size:18px}
  ${scope} blockquote{margin:0 0 0 24px!important;border:0!important;padding:0!important}
  ${scope} table{width:100%;table-layout:fixed;border-collapse:collapse;border:0;margin:12px 0}
  ${scope} td,${scope} th{border:0;padding:8px;min-width:24px;vertical-align:top;overflow-wrap:anywhere}
  ${scope} th{font-weight:bold}
  ${scope} td p,${scope} th p{margin:0;min-height:1.5em}
  ${scope} table:not([data-ata-border]) td,${scope} table:not([data-ata-border]) th,
  ${scope} table[data-ata-border="all"] td,${scope} table[data-ata-border="all"] th{border:1px solid currentColor}
  ${scope} table[data-ata-border="outer"]{border:1px solid currentColor}
  ${scope} table[data-ata-border="inner"] tr+tr>*,${scope} table[data-ata-border="horizontal"] tr+tr>*{border-top:1px solid currentColor}
  ${scope} table[data-ata-border="inner"] tr>*+*,${scope} table[data-ata-border="vertical"] tr>*+*{border-left:1px solid currentColor}
  ${scope} table[data-ata-border="horizontal"],${scope} table[data-ata-border="top"]{border-top:1px solid currentColor}
  ${scope} table[data-ata-border="horizontal"],${scope} table[data-ata-border="bottom"]{border-bottom:1px solid currentColor}
  ${scope} table[data-ata-border="vertical"],${scope} table[data-ata-border="left"]{border-left:1px solid currentColor}
  ${scope} table[data-ata-border="vertical"],${scope} table[data-ata-border="right"]{border-right:1px solid currentColor}
  ${scope} table span{font-size:inherit!important}
  ${ATA_FONT_SIZES.map((size) => `${scope} table span[style*="font-size:${size}px"],${scope} table span[style*="font-size: ${size}px"]{font-size:${size}px!important}`).join('\n')}
`;
