import { expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import ReportLinkCard from '@/components/relatorio/ReportLinkCard';
import { ORIGEM_RELATORIO } from '@/utils/navegacaoOrigem';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

it('abre o destino levando o parâmetro de origem', async () => {
  const href = {
    pathname: '/comissao',
    params: { origem: ORIGEM_RELATORIO },
  } as const;
  await render(
    <ReportLinkCard
      icon="people-outline"
      label="Ver comissões"
      description="Abre a aba Comissões"
      href={href}
    />,
  );
  await fireEvent.press(screen.getByLabelText('Ver comissões'));
  expect(mockPush).toHaveBeenCalledWith(href);
});
