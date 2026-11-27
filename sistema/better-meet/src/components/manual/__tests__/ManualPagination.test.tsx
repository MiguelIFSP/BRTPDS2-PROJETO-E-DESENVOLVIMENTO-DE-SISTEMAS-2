import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import ManualPagination from '@/components/manual/ManualPagination';

describe('ManualPagination', () => {
  it('desabilita voltar na primeira página e avança ao tocar em Próximo', async () => {
    const onPrevious = jest.fn();
    const onNext = jest.fn();
    const onFinish = jest.fn();

    await render(
      <ManualPagination
        currentPage={0}
        pageCount={3}
        onPrevious={onPrevious}
        onNext={onNext}
        onFinish={onFinish}
      />,
    );

    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    await fireEvent.press(screen.getByRole('button', { name: 'Próximo' }));

    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrevious).not.toHaveBeenCalled();
    expect(onFinish).not.toHaveBeenCalled();
  });

  it('oferece Concluir na última página e retorna pela ação final', async () => {
    const onPrevious = jest.fn();
    const onNext = jest.fn();
    const onFinish = jest.fn();

    await render(
      <ManualPagination
        currentPage={2}
        pageCount={3}
        onPrevious={onPrevious}
        onNext={onNext}
        onFinish={onFinish}
      />,
    );

    expect(screen.getByRole('button', { name: 'Anterior' })).toBeEnabled();
    await fireEvent.press(screen.getByRole('button', { name: 'Concluir' }));

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onNext).not.toHaveBeenCalled();
  });
});
