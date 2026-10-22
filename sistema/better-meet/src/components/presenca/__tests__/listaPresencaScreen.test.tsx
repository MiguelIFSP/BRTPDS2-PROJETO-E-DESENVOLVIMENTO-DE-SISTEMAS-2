import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type * as ReactModule from 'react';
import type * as ReactNativeModule from 'react-native';

import ListaPresencaScreen from '@/app/lista-presenca';

jest.mock('expo-router', () => {
  const React = jest.requireActual<typeof ReactModule>('react');
  return {
    useLocalSearchParams: () => ({}),
    useFocusEffect: (effect: () => void | (() => void)) =>
      React.useEffect(effect, [effect]),
  };
});

jest.mock('@/components/ui/Screen', () => {
  const { View } = jest.requireActual<typeof ReactNativeModule>('react-native');
  return { __esModule: true, default: View };
});
jest.mock('@/components/ui/BackButton', () => ({
  __esModule: true,
  default: () => null,
}));

describe('Prévia manual da lista de presença', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('salva as escolhas em nova versão e mantém a versão anterior intacta', async () => {
    await render(<ListaPresencaScreen />);
    await fireEvent.press(
      screen.getByRole('radio', {
        name: 'Presente para Camila Exemplo (camila@example.com)',
      }),
    );
    await fireEvent.changeText(
      screen.getByLabelText(
        'Observação opcional de Camila Exemplo (camila@example.com)',
      ),
      'Compareceu presencialmente.',
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Salvar lista simulada' }),
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Salvar versão simulada' }),
    );

    expect(
      screen.getByRole('button', { name: 'Versão 3 — Final' }),
    ).toBeOnTheScreen();
    expect(screen.getByText('Compareceu presencialmente.')).toBeOnTheScreen();
    expect(
      screen.getByText('Marcação manual. Status dos registros: Ausente.'),
    ).toBeOnTheScreen();

    await fireEvent.press(
      screen.getByRole('button', { name: 'Versão 2 — Final' }),
    );
    expect(
      screen.queryByText('Marcação manual. Status dos registros: Ausente.'),
    ).toBeNull();
    expect(
      screen.getByRole('radio', {
        name: 'Ausente para Camila Exemplo (camila@example.com)',
      }),
    ).toBeChecked();
  });

  it('pede confirmação antes de descartar uma revisão ao trocar de versão', async () => {
    await render(<ListaPresencaScreen />);
    await fireEvent.press(
      screen.getByRole('radio', {
        name: 'Ausente para Ana Exemplo (ana@example.com)',
      }),
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Versão 1 — Parcial' }),
    );
    expect(
      screen.getByText('Descartar alterações desta revisão?'),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));
    expect(
      screen.getByRole('radio', {
        name: 'Ausente para Ana Exemplo (ana@example.com)',
      }),
    ).toBeChecked();

    await fireEvent.press(
      screen.getByRole('button', { name: 'Versão 1 — Parcial' }),
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Descartar e trocar' }),
    );
    expect(
      screen.getByRole('radio', {
        name: 'Presente para Ana Exemplo (ana@example.com)',
      }),
    ).toBeChecked();
  });

  it('recusa observações inválidas antes de abrir a confirmação de salvamento', async () => {
    await render(<ListaPresencaScreen />);
    await fireEvent.changeText(
      screen.getByLabelText('Observações (opcional)'),
      'a'.repeat(2001),
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Salvar lista simulada' }),
    );
    expect(
      screen.getByText('As observações devem ter no máximo 2000 caracteres.'),
    ).toBeOnTheScreen();
    expect(
      screen.queryByRole('button', { name: 'Salvar versão simulada' }),
    ).toBeNull();
  });

  it('só permite compartilhar a revisão depois de salvar as alterações', async () => {
    await render(<ListaPresencaScreen />);
    expect(
      screen.getByRole('button', { name: 'Compartilhar exemplo' }),
    ).toBeEnabled();
    await fireEvent.press(
      screen.getByRole('radio', {
        name: 'Presente para Camila Exemplo (camila@example.com)',
      }),
    );
    expect(
      screen.getByRole('button', { name: 'Compartilhar exemplo' }),
    ).toBeDisabled();
    expect(
      screen.getByText(
        'Salve a revisão para compartilhar as marcações atuais.',
      ),
    ).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Salvar lista simulada' }),
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Salvar versão simulada' }),
    );
    expect(
      screen.getByRole('button', { name: 'Compartilhar exemplo' }),
    ).toBeEnabled();
  });
});
