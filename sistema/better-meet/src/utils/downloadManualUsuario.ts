import { Asset } from 'expo-asset';
import { Directory, File } from 'expo-file-system';
import { Platform } from 'react-native';

const MANUAL_FILE_NAME = 'Manual-do-Usuario-Better-Meet.pdf';

type DownloadResult = 'downloaded' | 'saved';

export async function downloadManualUsuario(): Promise<DownloadResult> {
  const asset = Asset.fromModule(
    require('../../assets/manual/Manual-do-Usuario-Better-Meet.pdf'),
  );

  if (Platform.OS === 'web') {
    if (typeof document === 'undefined' || !asset.uri) {
      throw new Error('Este navegador não permite baixar o manual em PDF.');
    }

    const link = document.createElement('a');
    try {
      link.href = asset.uri;
      link.download = MANUAL_FILE_NAME;
      document.body.appendChild(link);
      link.click();
    } finally {
      link.remove();
    }
    return 'downloaded';
  }

  const downloadedAsset = await asset.downloadAsync();
  if (!downloadedAsset.localUri) {
    throw new Error('Não foi possível preparar o arquivo PDF.');
  }

  const directory = await Directory.pickDirectoryAsync();
  const existingFile = directory
    .list()
    .find(
      (entry): entry is File =>
        entry instanceof File && entry.name === MANUAL_FILE_NAME,
    );
  const destination =
    existingFile ?? directory.createFile(MANUAL_FILE_NAME, 'application/pdf');

  await new File(downloadedAsset.localUri).copy(destination, {
    overwrite: true,
  });
  return 'saved';
}
