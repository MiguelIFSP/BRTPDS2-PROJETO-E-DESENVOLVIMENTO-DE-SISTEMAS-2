import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { useEffect as mockUseEffect } from 'react';
import { render, screen } from '@testing-library/react-native';

import BibliotecaReuniao from '@/components/BibliotecaReuniao';
import { arquivoReuniaoService } from '@/services/arquivoReuniaoService';

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => mockUseEffect(callback, [callback]),
}));

jest.mock('@/services/arquivoReuniaoService', () => ({
  arquivoReuniaoService: {
    list: jest.fn(),
    enviar: jest.fn(),
    baixar: jest.fn(),
    remover: jest.fn(),
  },
}));

const list = jest.mocked(arquivoReuniaoService.list);

const arquivo = {
  id: 3,
  nome: 'pauta.pdf',
  tamanhoBytes: 2048,
  createdAt: '2099-06-01T12:00:00.000Z',
  enviadoPor: { id: 1, name: 'Ana' },
};

beforeEach(() => {
  list.mockReset();
});

describe('Biblioteca da reunião', () => {
  it('mostra o arquivo para baixar e, para quem gere, enviar e apagar', async () => {
    list.mockResolvedValue({ podeEnviar: true, arquivos: [arquivo] });
    await render(<BibliotecaReuniao token="jwt" reuniaoId={31} />);

    expect(await screen.findByText('pauta.pdf')).toBeTruthy();
    expect(screen.getByText('2 KB · Ana')).toBeTruthy();
    expect(screen.getByLabelText('Baixar pauta.pdf')).toBeTruthy();
    expect(screen.getByLabelText('Enviar arquivo')).toBeTruthy();
    expect(screen.getByLabelText('Apagar pauta.pdf')).toBeTruthy();
  });

  it('depois do fim da reunião só deixa baixar', async () => {
    list.mockResolvedValue({ podeEnviar: false, arquivos: [arquivo] });
    await render(<BibliotecaReuniao token="jwt" reuniaoId={31} />);

    expect(await screen.findByLabelText('Baixar pauta.pdf')).toBeTruthy();
    expect(screen.queryByLabelText('Enviar arquivo')).toBeNull();
    expect(screen.queryByLabelText('Apagar pauta.pdf')).toBeNull();
  });
});
