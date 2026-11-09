import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  useEffect as mockUseEffect,
  useImperativeHandle as mockUseImperativeHandle,
  useState as mockUseState,
} from 'react';
import { Text as MockText, TextInput as MockTextInput } from 'react-native';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import AtaReuniao from '@/components/AtaReuniao';
import type { AtaEditorProps } from '@/components/ata/AtaEditor.types';
import { ataService, type Ata } from '@/services/ataService';
import { useAuthStore } from '@/store/authStore';
import { ApiError } from '@/utils/apiClient';

let mockPrevented: ((options: { repeat: () => void }) => void) | undefined;
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => mockUseEffect(callback, [callback]),
  usePreventRemove: (
    prevent: boolean,
    callback: (options: { repeat: () => void }) => void,
  ) => {
    mockPrevented = prevent ? callback : undefined;
  },
}));
jest.mock('@/components/ata/AtaEditor', () => ({
  __esModule: true,
  default: function MockAtaEditor({
    initialHtml,
    onChange,
    disabled,
    ref,
  }: AtaEditorProps) {
    const [value, setValue] = mockUseState(initialHtml);
    mockUseImperativeHandle(ref, () => ({ getHtml: async () => value }), [
      value,
    ]);
    return (
      <MockTextInput
        accessibilityLabel="Conteúdo da ata"
        value={value}
        editable={!disabled}
        onChangeText={(html) => {
          setValue(html);
          onChange(html);
        }}
      />
    );
  },
}));
jest.mock('@/components/ata/AtaLeitura', () => ({
  __esModule: true,
  default: function MockAtaLeitura({ html }: { html: string }) {
    return (
      <MockText accessibilityLabel="Ata em modo de leitura">{html}</MockText>
    );
  },
}));

const initialAta: Ata = {
  reuniaoId: 31,
  titulo: 'Planejamento',
  conteudoAta: '<p>Ata original.</p>',
  versaoAta: 1,
  papelNaComissao: 'SECRETARIO',
  podeEditar: true,
  podeVotar: true,
  meuVoto: null,
  votos: { aprovados: 0, reprovados: 0 },
};
const save = jest.spyOn(ataService, 'save');
const vote = jest.spyOn(ataService, 'vote');
const reload = jest.fn();
const updated = jest.fn();
const show = (overrides: Partial<Ata> = {}) =>
  render(
    <AtaReuniao
      ata={{ ...initialAta, ...overrides }}
      onUpdated={updated}
      onReload={reload}
    />,
  );

beforeEach(() => {
  jest.clearAllMocks();
  save.mockReset().mockResolvedValue({ ...initialAta, versaoAta: 2 });
  vote
    .mockReset()
    .mockResolvedValue({
      ...initialAta,
      meuVoto: 'APROVADO',
      votos: { aprovados: 1, reprovados: 0 },
    });
  useAuthStore
    .getState()
    .login(
      {
        id: 7,
        name: 'Ana',
        email: 'ana@example.test',
        role: 'USER',
        createdAt: '',
      },
      'jwt',
    );
});

describe('AtaReuniao', () => {
  it.each(['ADMINISTRADOR', 'SECRETARIO'] as const)(
    '%s edita e também pode votar',
    async (papelNaComissao) => {
      await show({ papelNaComissao });
      expect(screen.getByLabelText('Conteúdo da ata')).toBeTruthy();
      expect(screen.getByLabelText('Salvar')).toBeTruthy();
      await fireEvent.press(screen.getByLabelText('Aprovar'));
      await waitFor(() =>
        expect(vote).toHaveBeenCalledWith('jwt', 31, 'APROVADO', 1),
      );
    },
  );
  it.each(['FACILITADOR', 'MEMBRO'] as const)(
    '%s lê sem editor e pode reprovar',
    async (papelNaComissao) => {
      await show({ papelNaComissao, podeEditar: false });
      expect(screen.queryByLabelText('Conteúdo da ata')).toBeNull();
      expect(screen.queryByLabelText('Salvar')).toBeNull();
      expect(screen.getByLabelText('Ata em modo de leitura')).toBeTruthy();
      await fireEvent.press(screen.getByLabelText('Reprovar'));
      await waitFor(() =>
        expect(vote).toHaveBeenCalledWith('jwt', 31, 'REPROVADO', 1),
      );
    },
  );
  it('usa a autorização da API mesmo quando o perfil global é ADMIN', async () => {
    const state = useAuthStore.getState();
    state.login({ ...state.user!, role: 'ADMIN' }, 'jwt');
    await show({ papelNaComissao: 'MEMBRO', podeEditar: false });
    expect(screen.queryByLabelText('Salvar')).toBeNull();
  });
  it('bloqueia votos antes de existir uma ata', async () => {
    await show({
      conteudoAta: null,
      versaoAta: 0,
      podeEditar: false,
      podeVotar: false,
    });
    expect(screen.getByText(/ainda não foi redigida/)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Aprovar'));
    await fireEvent.press(screen.getByLabelText('Reprovar'));
    expect(vote).not.toHaveBeenCalled();
  });
  it('salva HTML e versão e impede votar com alterações locais', async () => {
    await show();
    await fireEvent.changeText(
      screen.getByLabelText('Conteúdo da ata'),
      '<p><b>Decisão</b></p>',
    );
    await fireEvent.press(screen.getByLabelText('Aprovar'));
    expect(vote).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByLabelText('Salvar'));
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith('jwt', 31, '<p><b>Decisão</b></p>', 1),
    );
    expect(updated).toHaveBeenCalled();
  });
  it('confirma a invalidação dos votos antes de alterar o conteúdo', async () => {
    await show({ votos: { aprovados: 1, reprovados: 0 } });
    await fireEvent.changeText(
      screen.getByLabelText('Conteúdo da ata'),
      '<p>Outra decisão.</p>',
    );
    await fireEvent.press(screen.getByLabelText('Salvar'));
    expect(save).not.toHaveBeenCalled();
    await fireEvent.press(
      await screen.findByLabelText('Salvar e reiniciar votos'),
    );
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
  });
  it('preserva o rascunho em conflito e exige confirmação para atualizar', async () => {
    save.mockRejectedValue(
      new ApiError('A ata foi alterada. Atualize a tela.', 409),
    );
    await show();
    await fireEvent.changeText(
      screen.getByLabelText('Conteúdo da ata'),
      '<p>Meu rascunho</p>',
    );
    await fireEvent.press(screen.getByLabelText('Salvar'));
    await screen.findByText('A ata foi alterada. Atualize a tela.');
    expect(screen.getByLabelText('Conteúdo da ata').props.value).toBe(
      '<p>Meu rascunho</p>',
    );
    await fireEvent.press(screen.getByLabelText('Atualizar ata e votos'));
    expect(reload).not.toHaveBeenCalled();
    await fireEvent.press(
      await screen.findByLabelText('Descartar e atualizar'),
    );
    expect(reload).toHaveBeenCalledTimes(1);
  });
  it('mantém o texto em erro de rede e permite tentar novamente', async () => {
    save.mockRejectedValue(new ApiError('Sem conexão.', 0));
    await show();
    await fireEvent.changeText(
      screen.getByLabelText('Conteúdo da ata'),
      '<p>Rascunho</p>',
    );
    await fireEvent.press(screen.getByLabelText('Salvar'));
    await screen.findByText('Sem conexão.');
    expect(screen.getByLabelText('Conteúdo da ata').props.value).toBe(
      '<p>Rascunho</p>',
    );
    await fireEvent.press(screen.getByLabelText('Salvar'));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
  });
  it('mostra o voto atual e permite trocá-lo', async () => {
    await show({
      podeEditar: false,
      meuVoto: 'APROVADO',
      votos: { aprovados: 2, reprovados: 1 },
    });
    expect(screen.getByText('Aprovações: 2 · Reprovações: 1')).toBeTruthy();
    expect(screen.getByText(/Seu voto: Aprovado/)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Aprovar'));
    expect(vote).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByLabelText('Reprovar'));
    await waitFor(() =>
      expect(vote).toHaveBeenCalledWith('jwt', 31, 'REPROVADO', 1),
    );
  });
  it('pede confirmação antes de sair com alterações não salvas', async () => {
    await show();
    expect(mockPrevented).toBeUndefined();
    await fireEvent.changeText(
      screen.getByLabelText('Conteúdo da ata'),
      '<p>Rascunho</p>',
    );
    expect(mockPrevented).toBeDefined();
    const repeat = jest.fn();
    await act(() => mockPrevented?.({ repeat }));
    expect(await screen.findByText('Sair sem salvar?')).toBeTruthy();
    expect(repeat).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByLabelText('Descartar e sair'));
    expect(repeat).toHaveBeenCalledTimes(1);
  });
});
