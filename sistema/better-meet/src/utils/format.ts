// Até duas letras: primeira letra das duas primeiras palavras do nome.
export const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

export const formatDate = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR');
};

const MESES_ABREVIADOS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
] as const;

// "2026-09" -> "set/26"
export const formatMonthLabel = (mes: string) => {
  const [year, month] = mes.split('-');
  const label = MESES_ABREVIADOS[Number(month) - 1] ?? mes;
  return `${label}/${year?.slice(2) ?? ''}`;
};

// "1 membro", "3 membros".
export const countLabel = (total: number, one: string, many: string) =>
  `${total} ${total === 1 ? one : many}`;

// Texto de busca sem caixa e sem acento: "José" encontra "jose".
export const normalizeSearch = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
