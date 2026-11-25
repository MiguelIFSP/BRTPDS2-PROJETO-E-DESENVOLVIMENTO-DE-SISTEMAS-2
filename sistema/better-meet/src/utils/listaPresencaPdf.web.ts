import {
  buildListaPresencaPdfHtml,
  type ListaPresencaPdfInput,
} from '@/utils/listaPresencaPdfHtml';

export const exportListaPresencaPdf = async (
  input: ListaPresencaPdfInput,
): Promise<void> => {
  const preview = window.open('', '_blank');
  if (!preview) throw new Error('Permita pop-ups para exportar a lista.');

  try {
    preview.opener = null;
    preview.document.open();
    preview.document.write(buildListaPresencaPdfHtml(input));
    preview.document.close();
    preview.addEventListener('afterprint', () => preview.close(), {
      once: true,
    });
    preview.focus();
    preview.print();
  } catch (error) {
    preview.close();
    throw error;
  }
};
