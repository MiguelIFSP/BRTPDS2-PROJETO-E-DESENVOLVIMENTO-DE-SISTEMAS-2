import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { buildAtaPdfHtml, type AtaPdfInput } from '@/utils/ataPdfHtml';

export const exportAtaPdf = async (input: AtaPdfInput): Promise<void> => {
  // iOS usa margens nativas; Android usa @page. Evita somar as duas margens.
  const html = buildAtaPdfHtml(input, Platform.OS === 'ios' ? '0' : '18mm');
  if (!(await Sharing.isAvailableAsync()))
    throw new Error(
      'O compartilhamento não está disponível neste dispositivo.',
    );

  const { base64 } = await Print.printToFileAsync({
    html,
    width: 595,
    height: 842,
    margins: { top: 51, bottom: 51, left: 51, right: 51 },
    base64: true,
  });
  // No Expo Go, o cache usado por Print pode ficar fora do escopo de Sharing.
  // Paths.cache respeita o diretório do aplicativo em Android e iOS.
  // Gravar o base64 evita tentar ler/copiar a URI que já foi recusada.
  if (!base64)
    throw new Error('Não foi possível preparar o PDF para compartilhamento.');
  const file = new File(
    Paths.cache,
    `ata-${input.dataReuniao}-${Date.now()}.pdf`,
  );
  await file.write(base64, { encoding: 'base64' });
  // O arquivo permanece no cache: o aplicativo de destino pode lê-lo após
  // o fechamento da gaveta de compartilhamento. O sistema gerencia o cache.
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: 'Salvar ou compartilhar ata',
  });
};
