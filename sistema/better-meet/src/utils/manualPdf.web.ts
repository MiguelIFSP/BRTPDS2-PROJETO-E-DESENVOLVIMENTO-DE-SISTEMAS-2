import { Asset } from 'expo-asset';

import { MANUAL_USUARIO } from '@/content/manual/manualUsuario';
import { buildManualPdfHtml } from '@/utils/manualPdfHtml';

// A janela de impressão começa em branco: precisa do endereço completo das imagens.
const resolveImages = () =>
  new Map(
    MANUAL_USUARIO.flatMap((chapter) => chapter.content)
      .filter((block) => block.kind === 'image')
      .map((block) => {
        const { uri } = Asset.fromModule(block.source);
        return [block.source, new URL(uri, window.location.href).href] as const;
      }),
  );

export const exportManualPdf = async (): Promise<void> => {
  const html = buildManualPdfHtml(MANUAL_USUARIO, resolveImages());
  // expo-print na web imprime a tela atual; a janela separada isola o manual inteiro.
  const preview = window.open('', '_blank');
  if (!preview) throw new Error('Permita pop-ups para exportar o manual.');

  try {
    preview.opener = null;
    preview.document.open();
    preview.document.write(html);
    preview.document.close();
    preview.addEventListener('afterprint', () => preview.close(), {
      once: true,
    });
    // Imprimir antes do carregamento deixaria espaços vazios no PDF.
    await Promise.all(
      Array.from(preview.document.images, (image) => image.decode()),
    ).catch(() => {
      throw new Error('Não foi possível carregar as imagens do manual.');
    });
    preview.focus();
    preview.print();
  } catch (error) {
    preview.close();
    throw error;
  }
};
