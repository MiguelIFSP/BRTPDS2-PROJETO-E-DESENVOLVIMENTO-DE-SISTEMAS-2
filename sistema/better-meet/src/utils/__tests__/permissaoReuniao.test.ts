import { describe, expect, it } from '@jest/globals';

import { podeGerirReuniao } from '@/utils/permissaoReuniao';

const reuniao = {
  criadoPorUserId: 5,
  participantes: [
    { userId: 7, papel: 'ADMINISTRADOR' },
    { userId: 8, papel: 'FACILITADOR' },
    { userId: 9, papel: 'MEMBRO' },
  ],
};

describe('podeGerirReuniao', () => {
  it('permite ao Administrador da plataforma', () => {
    expect(podeGerirReuniao({ id: 1, role: 'ADMIN' }, reuniao)).toBe(true);
  });

  it('permite ao autor da reunião', () => {
    expect(podeGerirReuniao({ id: 5, role: 'USER' }, reuniao)).toBe(true);
  });

  it('permite ao Administrador da comissão', () => {
    expect(podeGerirReuniao({ id: 7, role: 'USER' }, reuniao)).toBe(true);
  });

  it('não permite a facilitador, membro nem quem não participa', () => {
    expect(podeGerirReuniao({ id: 8, role: 'USER' }, reuniao)).toBe(false);
    expect(podeGerirReuniao({ id: 9, role: 'USER' }, reuniao)).toBe(false);
    expect(podeGerirReuniao({ id: 99, role: 'USER' }, reuniao)).toBe(false);
  });

  it('nega sem usuário ou sem reunião carregada', () => {
    expect(podeGerirReuniao(null, reuniao)).toBe(false);
    expect(podeGerirReuniao({ id: 7, role: 'USER' }, undefined)).toBe(false);
  });
});
