import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import ManualScreen from '@/app/(tabs)/mais/manual';
import { exportManualPdf } from '@/utils/manualPdf';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    replace: jest.fn(),
    canGoBack: () => true,
  }),
  useFocusEffect: jest.fn(),
}));
// O Header importa uma imagem por "@/assets", que o Jest não resolve.
jest.mock('@/components/Header', () => () => null);
jest.mock('@/utils/manualPdf', () => ({ exportManualPdf: jest.fn() }));

const exportPdf = jest.mocked(exportManualPdf);

describe('ManualScreen — exportação em PDF', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exporta o manual ao tocar no botão', async () => {
    exportPdf.mockResolvedValue();
    await render(<ManualScreen />);

    await fireEvent.press(
      screen.getByRole('button', { name: 'Exportar manual em PDF' }),
    );

    expect(exportPdf).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('mostra o erro quando a exportação falha', async () => {
    exportPdf.mockRejectedValue(new Error('Não foi possível preparar o PDF.'));
    await render(<ManualScreen />);

    await fireEvent.press(
      screen.getByRole('button', { name: 'Exportar manual em PDF' }),
    );

    expect(
      await screen.findByText('Não foi possível preparar o PDF.'),
    ).toBeOnTheScreen();
  });
});
