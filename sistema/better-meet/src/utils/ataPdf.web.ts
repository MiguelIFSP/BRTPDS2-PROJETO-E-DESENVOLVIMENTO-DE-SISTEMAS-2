import { sanitizeAtaHtml } from '@/utils/ataHtml.web';
import { buildAtaPdfHtml, type AtaPdfInput } from '@/utils/ataPdfHtml';

export const exportAtaPdf = async (input: AtaPdfInput): Promise<void> => {
  const html = buildAtaPdfHtml({
    ...input,
    conteudoAta: sanitizeAtaHtml(input.conteudoAta),
  });
  // Abrir antes de qualquer await mantém o gesto do clique e evita bloqueio de pop-up.
  // expo-print na web imprime a página atual, por isso isolamos o documento da ata.
  const preview = window.open('', '_blank');
  if (!preview) throw new Error('Permita pop-ups para exportar a ata.');

  try {
    preview.opener = null;
    preview.document.open();
    preview.document.write(html);
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
