import { beforeEach, expect, it, jest } from '@jest/globals';
import { useEffect as mockUseEffect, type ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import ReunioesScreen from '@/app/(tabs)/(reunioes)';
import { comissaoService } from '@/services/comissaoService';
import { notificacaoService } from '@/services/notificacaoService';
import { organizacaoService } from '@/services/organizacaoService';
import { reuniaoService } from '@/services/reuniaoService';

const mockPickerChange = jest.fn<(event: unknown, date: Date) => void>();
const mockPickerDismiss = jest.fn<() => void>();
const mockPickerRender =
  jest.fn<
    (props: {
      value: Date;
      onChange?: unknown;
      onValueChange?: (event: unknown, date: Date) => void;
      onDismiss?: () => void;
    }) => void
  >();
jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: (props: Parameters<typeof mockPickerRender>[0]) => {
    mockPickerRender(props);
    mockPickerChange.mockImplementation(props.onValueChange ?? (() => {}));
    mockPickerDismiss.mockImplementation(props.onDismiss ?? (() => {}));
    return null;
  },
}));
jest.mock('@/components/ui/Screen', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@/components/ui/BottomSheet', () => ({
  __esModule: true,
  default: ({
    visible,
    children,
  }: {
    visible: boolean;
    children: ReactNode;
  }) => (visible ? children : null),
}));
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => mockUseEffect(callback, [callback]),
  useLocalSearchParams: () => ({}),
  useRouter: () => ({ setParams: jest.fn() }),
}));
jest.mock('@/store/authStore', () => ({
  useAuthStore: (
    selector: (state: { token: string; user: { name: string } }) => unknown,
  ) => selector({ token: 'jwt-teste', user: { name: 'Teste' } }),
}));

const reuniao = {
  id: 1,
  comissaoId: 1,
  titulo: 'Planejamento',
  pauta: 'Pauta',
  data: '2026-10-21',
  horaInicio: '10:00',
  horaFim: '11:00',
  status: 'AGENDADA' as const,
  criadoPorUserId: 1,
};
const create = jest.spyOn(reuniaoService, 'create');
jest.spyOn(organizacaoService, 'listMine').mockResolvedValue([]);
jest.spyOn(comissaoService, 'listByOrganizacao');
jest.spyOn(reuniaoService, 'listMine').mockResolvedValue([reuniao]);
jest.spyOn(reuniaoService, 'listPendingInvites').mockResolvedValue([]);
jest.spyOn(notificacaoService, 'listMine').mockResolvedValue([]);

beforeEach(() => {
  create.mockReset().mockResolvedValue(reuniao);
  mockPickerRender.mockClear();
  // Só a identificação da organização é usada para carregar as comissões.
  jest.spyOn(organizacaoService, 'listMine').mockResolvedValue([
    {
      id: 1,
      nome: 'Organização',
      status: 'ACEITA',
      membros: [],
      comissoes: [],
      createdAt: '',
    },
  ]);
  jest.spyOn(comissaoService, 'listByOrganizacao').mockResolvedValue([
    {
      id: 1,
      nome: 'Comissão',
      organizacaoId: 1,
      equipe: [],
      descricao: null,
      createdAt: '',
    },
  ]);
});

it('mostra DD-MM-AAAA e envia a data selecionada no formato aceito pela API', async () => {
  await render(<ReunioesScreen />);
  expect(
    await screen.findByText('21-10-2026 · 10:00 às 11:00'),
  ).toBeOnTheScreen();
  await fireEvent.press(screen.getByLabelText('Adicionar reunião'));
  await fireEvent.changeText(
    screen.getByLabelText('Título da reunião'),
    'Planejamento',
  );
  await fireEvent.changeText(
    screen.getByLabelText('Pauta da reunião'),
    'Pauta',
  );
  await fireEvent.changeText(
    screen.getByLabelText('Local ou link da reunião'),
    '  https://meet.example.test/abc  ',
  );
  await fireEvent.press(screen.getByLabelText('Selecionar data da reunião'));
  const selectedDate = new Date(2028, 1, 29, 23, 30);
  await act(() => mockPickerChange({ type: 'set' }, selectedDate));
  expect(screen.getByText('29-02-2028')).toBeOnTheScreen();
  await fireEvent.press(
    screen.getByLabelText('Selecionar hora de início da reunião'),
  );
  await act(() =>
    mockPickerChange({ type: 'set' }, new Date(2028, 1, 29, 10, 0)),
  );
  await fireEvent.press(
    screen.getByLabelText('Selecionar hora de término da reunião'),
  );
  await act(() =>
    mockPickerChange({ type: 'set' }, new Date(2028, 1, 29, 11, 0)),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Salvar reunião' }));
  expect(create).toHaveBeenCalledWith(
    'jwt-teste',
    expect.objectContaining({
      data: '2028-02-29',
      horaInicio: '10:00',
      horaFim: '11:00',
      local: 'https://meet.example.test/abc',
    }),
  );
  expect(
    await screen.findByText('Reunião criada com sucesso.'),
  ).toBeOnTheScreen();
});

it.each([
  'Selecionar data da reunião',
  'Selecionar hora de início da reunião',
  'Selecionar hora de término da reunião',
])(
  'cancela e reabre %s sem alterar o valor e sem usar onChange',
  async (label) => {
    await render(<ReunioesScreen />);
    await screen.findByText('21-10-2026 · 10:00 às 11:00');
    await fireEvent.press(screen.getByLabelText('Adicionar reunião'));
    await fireEvent.press(screen.getByLabelText(label));
    const props = mockPickerRender.mock.lastCall?.[0];
    expect(props?.onChange).toBeUndefined();
    expect(props?.onValueChange).toEqual(expect.any(Function));
    expect(props?.onDismiss).toEqual(expect.any(Function));
    const renderCount = mockPickerRender.mock.calls.length;
    await act(() => mockPickerDismiss());
    expect(mockPickerRender).toHaveBeenCalledTimes(renderCount);
    await fireEvent.press(screen.getByLabelText(label));
    expect(mockPickerRender.mock.calls.length).toBeGreaterThan(renderCount);
    expect(mockPickerRender.mock.lastCall?.[0].value).toEqual(props?.value);
    expect(create).not.toHaveBeenCalled();
  },
);

it('exige o local e mostra exemplos de preenchimento pelo ícone de ajuda', async () => {
  await render(<ReunioesScreen />);
  await screen.findByText('21-10-2026 · 10:00 às 11:00');
  await fireEvent.press(screen.getByLabelText('Adicionar reunião'));

  expect(screen.queryByText('Híbrida')).toBeNull();
  await fireEvent.press(
    screen.getByLabelText('Ver exemplos de como preencher o local'),
  );
  expect(screen.getByText('Presencial')).toBeOnTheScreen();
  expect(screen.getByText('Online')).toBeOnTheScreen();
  expect(screen.getByText('Híbrida')).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('button', { name: 'Salvar reunião' }));
  expect(
    await screen.findByText('Informe o local ou o link da reunião.'),
  ).toBeOnTheScreen();
  expect(create).not.toHaveBeenCalled();
});
