import { Asset } from 'expo-asset';
import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { MANUAL_USUARIO } from '@/content/manual/manualUsuario';
import { buildManualPdfHtml } from '@/utils/manualPdfHtml';

// O Print não lê os arquivos do aplicativo (em especial no iOS):
// as imagens entram no próprio documento, em base64.
const loadImages = async () => {
  const sources = MANUAL_USUARIO.flatMap((chapter) =>
    chapter.content.flatMap((block) =>
      block.kind === 'image' ? [block.source] : [],
    ),
  );
  const entries = await Promise.all(
    sources.map(async (source) => {
      const { localUri } = await Asset.fromModule(source).downloadAsync();
      if (!localUri)
        throw new Error('Não foi possível carregar as imagens do manual.');
      const base64 = await new File(localUri).base64();
      return [source, `data:image/jpeg;base64,${base64}`] as const;
    }),
  );
  return new Map(entries);
};

export const exportManualPdf = async (): Promise<void> => {
  if (!(await Sharing.isAvailableAsync()))
    throw new Error(
      'O compartilhamento não está disponível neste dispositivo.',
    );

  const { base64 } = await Print.printToFileAsync({
    html: buildManualPdfHtml(MANUAL_USUARIO, await loadImages()),
    width: 595,
    height: 842,
    margins: { top: 40, bottom: 40, left: 40, right: 40 },
    base64: true,
  });
  if (!base64) throw new Error('Não foi possível preparar o PDF.');

  // No Expo Go, o arquivo criado pelo Print pode não ser aceito pelo Sharing;
  // por isso o PDF é regravado no cache do aplicativo.
  const file = new File(Paths.cache, 'Manual-do-Usuario-Better-Meet.pdf');
  await file.write(base64, { encoding: 'base64' });
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: 'Salvar ou compartilhar o manual',
  });
};
