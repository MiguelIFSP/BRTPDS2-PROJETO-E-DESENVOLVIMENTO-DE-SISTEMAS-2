import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import {
  buildListaPresencaPdfHtml,
  type ListaPresencaPdfInput,
} from '@/utils/listaPresencaPdfHtml';

export const exportListaPresencaPdf = async (
  input: ListaPresencaPdfInput,
): Promise<void> => {
  const html = buildListaPresencaPdfHtml(input);
  if (!(await Sharing.isAvailableAsync()))
    throw new Error(
      'O compartilhamento não está disponível neste dispositivo.',
    );

  const { base64 } = await Print.printToFileAsync({
    html,
    width: 595,
    height: 842,
    margins: { top: 40, bottom: 40, left: 40, right: 40 },
    base64: true,
  });
  if (!base64) throw new Error('Não foi possível preparar o PDF.');

  const file = new File(
    Paths.cache,
    `lista-presenca-${input.cabecalho.reuniao.data}-${Date.now()}.pdf`,
  );
  await file.write(base64, { encoding: 'base64' });
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: 'Salvar ou compartilhar lista de presença',
  });
};
