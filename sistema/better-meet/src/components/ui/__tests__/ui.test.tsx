import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import FeedbackBanner from '@/components/ui/FeedbackBanner';
import TextField from '@/components/ui/TextField';

describe('Button', () => {
  it('chama onPress ao tocar', async () => {
    const onPress = jest.fn();
    await render(<Button label="Salvar" onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('fica desabilitado e mostra o texto de carregando', async () => {
    const onPress = jest.fn();
    await render(
      <Button
        label="Salvar"
        loadingLabel="Salvando..."
        isLoading
        onPress={onPress}
      />,
    );

    const button = screen.getByRole('button', { name: 'Salvar' });
    expect(button).toBeDisabled();
    expect(screen.getByText('Salvando...')).toBeOnTheScreen();

    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('TextField', () => {
  it('mostra a mensagem de erro embaixo do campo', async () => {
    await render(
      <TextField label="E-mail" value="" error="Informe um e-mail válido." />,
    );

    expect(screen.getByLabelText('E-mail')).toBeOnTheScreen();
    expect(screen.getByText('Informe um e-mail válido.')).toBeOnTheScreen();
  });

  it('campo de senha alterna entre mostrar e ocultar', async () => {
    await render(<TextField label="Senha" value="Segredo1" isPassword />);

    await fireEvent.press(
      screen.getByRole('button', { name: 'Mostrar senha' }),
    );

    expect(
      screen.getByRole('button', { name: 'Ocultar senha' }),
    ).toBeOnTheScreen();
  });
});

describe('FeedbackBanner', () => {
  it('não renderiza nada sem feedback', async () => {
    await render(<FeedbackBanner feedback={null} />);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('anuncia a mensagem como alerta', async () => {
    await render(
      <FeedbackBanner feedback={{ type: 'error', message: 'Falhou.' }} />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/Falhou\./);
  });
});

describe('ConfirmDialog', () => {
  it('com onCancel mostra Cancelar e o botão da variante', async () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();
    await render(
      <ConfirmDialog
        visible
        title="Excluir organização?"
        message="Não pode ser desfeito."
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Excluir' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('sem onCancel vira aviso de um botão', async () => {
    await render(
      <ConfirmDialog
        visible
        variant="success"
        title="Dados excluídos"
        message="Sua conta foi removida."
        confirmLabel="OK"
        onConfirm={jest.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Cancelar' })).toBeNull();
    expect(screen.getByRole('button', { name: 'OK' })).toBeOnTheScreen();
  });
});
