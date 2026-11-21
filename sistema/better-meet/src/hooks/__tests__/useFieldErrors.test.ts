import { describe, expect, it } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';

import { useFieldErrors } from '@/hooks/useFieldErrors';

type Form = { nome: string; email: string; senha: string };

describe('useFieldErrors', () => {
  it('remove o erro do campo ao limpá-lo', async () => {
    const { result } = await renderHook(() => useFieldErrors<Form>());
    await act(() => result.current.setErrors({ nome: 'Obrigatório.' }));
    expect(result.current.errors.nome).toBe('Obrigatório.');
    await act(() => result.current.clearFieldError('nome'));
    expect(result.current.errors.nome).toBeUndefined();
  });

  it('mantém a mesma referência quando o campo não tem erro', async () => {
    const { result } = await renderHook(() => useFieldErrors<Form>());
    await act(() => result.current.setErrors({ nome: 'Obrigatório.' }));
    const antes = result.current.errors;
    await act(() => result.current.clearFieldError('email'));
    expect(result.current.errors).toBe(antes);
  });

  it('limpa vários campos de uma vez e preserva os demais', async () => {
    const { result } = await renderHook(() => useFieldErrors<Form>());
    await act(() =>
      result.current.setErrors({ nome: 'a.', email: 'b.', senha: 'c.' }),
    );
    await act(() => result.current.clearFieldError('nome', 'email'));
    expect(result.current.errors.nome).toBeUndefined();
    expect(result.current.errors.email).toBeUndefined();
    expect(result.current.errors.senha).toBe('c.');
  });

  it('limpa todos os erros', async () => {
    const { result } = await renderHook(() => useFieldErrors<Form>());
    await act(() => result.current.setErrors({ nome: 'a.', senha: 'c.' }));
    await act(() => result.current.clearAllErrors());
    expect(result.current.errors).toEqual({});
  });
});
