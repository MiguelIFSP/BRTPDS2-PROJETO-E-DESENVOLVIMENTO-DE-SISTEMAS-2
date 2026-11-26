import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { API_URL } from '@/config/api';
import { useAuthStore } from '@/store/authStore';
import { ApiError, apiRequest, NETWORK_ERROR_MESSAGE } from '@/utils/apiClient';

export type ArquivoReuniao = {
  id: number;
  nome: string;
  tamanhoBytes: number;
  createdAt: string;
  enviadoPor: { id: number; name: string } | null;
};

export type BibliotecaReuniao = {
  podeEnviar: boolean;
  arquivos: ArquivoReuniao[];
};

const mensagemDaResposta = async (response: Response, fallback: string) => {
  const data: unknown = await response.json().catch(() => null);
  const erro =
    typeof data === 'object' && data !== null && 'error' in data
      ? data.error
      : undefined;
  if (response.status === 401) useAuthStore.getState().expireSession();
  throw new ApiError(
    typeof erro === 'string' ? erro : fallback,
    response.status,
    data,
  );
};

const nomeLocal = (nome: string) => {
  const limpo = nome.replace(/[^\w.\- ()[\]]+/g, '_').slice(0, 120);
  return limpo || 'arquivo';
};

export const arquivoReuniaoService = {
  list(token: string, reuniaoId: number) {
    return apiRequest<BibliotecaReuniao>(`/reunioes/${reuniaoId}/arquivos`, {
      token,
      fallbackError: 'Não foi possível carregar a biblioteca.',
    });
  },

  async enviar(token: string, reuniaoId: number) {
    const escolha = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: '*/*',
    });
    if (escolha.canceled || !escolha.assets?.[0]) return null;
    const asset = escolha.assets[0];
    const origem = await fetch(asset.uri);
    const bytes = new Uint8Array(await origem.arrayBuffer());
    let response: Response;
    try {
      response = await fetch(`${API_URL}/reunioes/${reuniaoId}/arquivos`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/octet-stream',
          'X-Nome-Arquivo': encodeURIComponent(asset.name || 'arquivo'),
        },
        body: bytes,
      });
    } catch {
      throw new ApiError(NETWORK_ERROR_MESSAGE, 0);
    }
    if (!response.ok) {
      await mensagemDaResposta(response, 'Não foi possível enviar o arquivo.');
    }
    return (await response.json()) as ArquivoReuniao;
  },

  async baixar(
    token: string,
    reuniaoId: number,
    arquivoId: number,
    nome: string,
  ) {
    if (!(await Sharing.isAvailableAsync())) {
      throw new Error('Não é possível salvar arquivos neste dispositivo.');
    }
    let response: Response;
    try {
      response = await fetch(
        `${API_URL}/reunioes/${reuniaoId}/arquivos/${arquivoId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch {
      throw new ApiError(NETWORK_ERROR_MESSAGE, 0);
    }
    if (!response.ok) {
      await mensagemDaResposta(response, 'Não foi possível baixar o arquivo.');
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    let binario = '';
    const bloco = 0x8000;
    for (let indice = 0; indice < bytes.length; indice += bloco) {
      binario += String.fromCharCode(...bytes.subarray(indice, indice + bloco));
    }
    const file = new File(Paths.cache, nomeLocal(nome));
    await file.write(btoa(binario), { encoding: 'base64' });
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/octet-stream',
      UTI: 'public.data',
      dialogTitle: 'Salvar arquivo',
    });
  },

  remover(token: string, reuniaoId: number, arquivoId: number) {
    return apiRequest<{ message: string }>(
      `/reunioes/${reuniaoId}/arquivos/${arquivoId}`,
      {
        method: 'DELETE',
        token,
        fallbackError: 'Não foi possível apagar o arquivo.',
      },
    );
  },
};
