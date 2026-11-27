import { beforeEach, describe, expect, it } from '@jest/globals';

import {
  PREFERENCIA_PADRAO,
  getPreferencia,
  useDesbloqueioStore,
} from '@/store/desbloqueioStore';

const reset = () =>
  useDesbloqueioStore.setState({
    preferencias: {},
    ofertados: [],
    isLocked: false,
    ofertaUserId: null,
  });

beforeEach(() => {
  reset();
});

describe('desbloqueioStore', () => {
  it('começa desligado com 5 minutos', () => {
    expect(getPreferencia(useDesbloqueioStore.getState(), 1)).toEqual({
      isEnabled: false,
      tempoMinutos: 5,
    });
    expect(PREFERENCIA_PADRAO.tempoMinutos).toBe(5);
  });

  it('guarda a escolha por usuário (RF-04)', () => {
    const { enable, setTempo } = useDesbloqueioStore.getState();
    enable(1);
    setTempo(1, 15);
    const state = useDesbloqueioStore.getState();
    expect(getPreferencia(state, 1)).toEqual({
      isEnabled: true,
      tempoMinutos: 15,
    });
    expect(getPreferencia(state, 2)).toEqual(PREFERENCIA_PADRAO);
  });

  it('lock só bloqueia quem ligou o recurso', () => {
    useDesbloqueioStore.getState().lock(1);
    expect(useDesbloqueioStore.getState().isLocked).toBe(false);

    useDesbloqueioStore.getState().enable(1);
    useDesbloqueioStore.getState().lock(1);
    expect(useDesbloqueioStore.getState().isLocked).toBe(true);

    useDesbloqueioStore.getState().unlock();
    expect(useDesbloqueioStore.getState().isLocked).toBe(false);
  });

  it('desligar mantém o tempo escolhido', () => {
    const { enable, setTempo, disable } = useDesbloqueioStore.getState();
    enable(1);
    setTempo(1, 0);
    disable(1);
    expect(getPreferencia(useDesbloqueioStore.getState(), 1)).toEqual({
      isEnabled: false,
      tempoMinutos: 0,
    });
  });

  it('a oferta aparece uma vez por conta (RF-05)', () => {
    const store = useDesbloqueioStore.getState();
    store.markOffer(1);
    expect(useDesbloqueioStore.getState().ofertaUserId).toBe(1);

    useDesbloqueioStore.getState().finishOffer(1);
    expect(useDesbloqueioStore.getState().ofertaUserId).toBeNull();
    expect(useDesbloqueioStore.getState().ofertados).toEqual([1]);

    useDesbloqueioStore.getState().markOffer(1);
    expect(useDesbloqueioStore.getState().ofertaUserId).toBeNull();
  });

  it('não oferece a quem já ligou', () => {
    useDesbloqueioStore.getState().enable(1);
    useDesbloqueioStore.getState().markOffer(1);
    expect(useDesbloqueioStore.getState().ofertaUserId).toBeNull();
  });

  it('persiste só preferências e ofertas, nunca o bloqueio', () => {
    useDesbloqueioStore.getState().enable(1);
    useDesbloqueioStore.getState().lock(1);
    useDesbloqueioStore.getState().markOffer(2);
    const options = useDesbloqueioStore.persist.getOptions();
    expect(options.partialize?.(useDesbloqueioStore.getState())).toEqual({
      preferencias: { '1': { isEnabled: true, tempoMinutos: 5 } },
      ofertados: [],
    });
  });
});
