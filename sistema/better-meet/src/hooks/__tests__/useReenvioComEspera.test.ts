import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';

import { useReenvioComEspera } from '@/hooks/useReenvioComEspera';

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

describe('useReenvioComEspera', () => {
  it('começa liberado, bloqueia por 60 s e libera ao chegar em 0', async () => {
    const { result } = await renderHook(() => useReenvioComEspera());
    expect(result.current.canResend).toBe(true);

    await act(() => result.current.start());
    expect(result.current.secondsLeft).toBe(60);
    expect(result.current.canResend).toBe(false);

    for (let second = 0; second < 59; second += 1) {
      await act(() => jest.advanceTimersByTime(1_000));
    }
    expect(result.current.secondsLeft).toBe(1);
    expect(result.current.canResend).toBe(false);

    await act(() => jest.advanceTimersByTime(1_000));
    expect(result.current.secondsLeft).toBe(0);
    expect(result.current.canResend).toBe(true);
  });

  it('com startNow já abre em espera', async () => {
    const { result } = await renderHook(() =>
      useReenvioComEspera(60, { startNow: true }),
    );
    expect(result.current.secondsLeft).toBe(60);
    expect(result.current.canResend).toBe(false);
  });
});
