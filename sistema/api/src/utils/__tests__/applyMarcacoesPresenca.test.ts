import { describe, expect, it } from '@jest/globals';

import { AppError } from '../../errors/AppError.ts';
import type { ListaPresencaConsolidada } from '../../types/listaPresenca.ts';
import type { MarcacaoPresenca } from '../../types/marcacaoPresenca.ts';
import { applyMarcacoesPresenca } from '../applyMarcacoesPresenca.ts';
import { consolidateListaPresenca } from '../consolidateListaPresenca.ts';

function createSnapshot(): ListaPresencaConsolidada {
  return consolidateListaPresenca(
    {
      id: 1,
      titulo: 'Reunião de demonstração',
      inicio: new Date('2026-10-21T10:00:00Z'),
      fim: new Date('2026-10-21T11:00:00Z'),
      local: null,
      plataforma: 'Demonstração',
      cancelada: false,
      organizacao: { id: 1, nome: 'Organização exemplo' },
      comissao: { id: 1, nome: 'Comissão exemplo' },
      convidados: [
        {
          userId: 3,
          nome: 'Ana Exemplo',
          email: 'ana@example.com',
          papel: 'ADMINISTRADOR',
          resposta: 'ACEITO',
          registros: [
            { entrada: new Date('2026-10-21T10:00:00Z'), saida: null },
          ],
        },
        {
          userId: 1,
          nome: 'Bruno Exemplo',
          email: 'bruno@example.com',
          papel: 'MEMBRO',
          resposta: 'ACEITO',
          registros: [],
        },
        {
          userId: 2,
          nome: 'Camila Exemplo',
          email: 'camila@example.com',
          papel: 'MEMBRO',
          resposta: 'PENDENTE',
          registros: [],
        },
      ],
    },
    new Date('2026-10-21T10:30:00Z'),
  );
}

function expectConflict(action: () => unknown): void {
  expect(action).toThrow(AppError);
  try {
    action();
  } catch (error) {
    if (!(error instanceof AppError)) throw error;
    expect(error.statusCode).toBe(409);
  }
}

describe('applyMarcacoesPresenca', () => {
  it('atualiza somente as pessoas enviadas e ordena conforme a lista de origem', () => {
    const anteriores: MarcacaoPresenca[] = [
      { usuarioId: 2, status: 'SEM_RESPOSTA' },
      { usuarioId: 1, status: 'AUSENTE', observacao: 'Primeira conferência.' },
    ];
    const novas: MarcacaoPresenca[] = [
      {
        usuarioId: 1,
        status: 'ATRASADO',
        observacao: '  Confirmação manual.  ',
      },
      { usuarioId: 3, status: 'SAIU_ANTES' },
    ];

    expect(applyMarcacoesPresenca(createSnapshot(), anteriores, novas)).toEqual(
      [
        { usuarioId: 3, status: 'SAIU_ANTES' },
        { usuarioId: 1, status: 'ATRASADO', observacao: 'Confirmação manual.' },
        { usuarioId: 2, status: 'SEM_RESPOSTA' },
      ],
    );
  });

  it('mantém snapshot, horários, duração, convites e totais sem alteração', () => {
    const snapshot = createSnapshot();
    const antes = JSON.stringify(snapshot);
    Object.freeze(snapshot);
    Object.freeze(snapshot.membros);
    Object.freeze(snapshot.totais);
    snapshot.membros.forEach((membro) => Object.freeze(membro));
    const anteriores: MarcacaoPresenca[] = [
      { usuarioId: 3, status: 'PRESENTE' },
    ];
    const novas: MarcacaoPresenca[] = [{ usuarioId: 2, status: 'PRESENTE' }];
    Object.freeze(anteriores);
    Object.freeze(novas);
    anteriores.forEach((marcacao) => Object.freeze(marcacao));
    novas.forEach((marcacao) => Object.freeze(marcacao));

    const resultado = applyMarcacoesPresenca(snapshot, anteriores, novas);
    expect(JSON.stringify(snapshot)).toBe(antes);
    expect(snapshot.membros[2]?.status).toBe('SEM_RESPOSTA');
    expect(snapshot.totais).toMatchObject({ aceitos: 2, semResposta: 1 });
    expect(resultado).toEqual([
      { usuarioId: 3, status: 'PRESENTE' },
      { usuarioId: 2, status: 'PRESENTE' },
    ]);
    expect(resultado[0]).not.toBe(anteriores[0]);
    expect(resultado[1]).not.toBe(novas[0]);
    const primeira = resultado[0];
    if (!primeira) throw new Error('O cenário precisa de uma marcação.');
    primeira.status = 'AUSENTE';
    expect(anteriores[0]?.status).toBe('PRESENTE');
  });

  it('recusa o lote inteiro quando a última pessoa não pertence à lista', () => {
    const snapshot = createSnapshot();
    const anteriores: MarcacaoPresenca[] = [
      { usuarioId: 1, status: 'AUSENTE' },
    ];
    const novas: MarcacaoPresenca[] = [
      { usuarioId: 1, status: 'PRESENTE' },
      { usuarioId: 99, status: 'PRESENTE' },
    ];
    const antes = JSON.stringify({ snapshot, anteriores, novas });

    expectConflict(() => applyMarcacoesPresenca(snapshot, anteriores, novas));
    expect(JSON.stringify({ snapshot, anteriores, novas })).toBe(antes);
  });

  it('recusa marcações anteriores de pessoas externas à lista', () => {
    expectConflict(() =>
      applyMarcacoesPresenca(
        createSnapshot(),
        [{ usuarioId: 99, status: 'PRESENTE' }],
        [],
      ),
    );
  });

  it.each(['anteriores', 'novas'] as const)(
    'recusa pessoas duplicadas nas marcações %s',
    (lote) => {
      const duplicadas: MarcacaoPresenca[] = [
        { usuarioId: 1, status: 'PRESENTE' },
        { usuarioId: 1, status: 'AUSENTE' },
      ];
      expectConflict(() =>
        applyMarcacoesPresenca(
          createSnapshot(),
          lote === 'anteriores' ? duplicadas : [],
          lote === 'novas' ? duplicadas : [],
        ),
      );
    },
  );

  it('recusa status inválido mesmo depois de uma marcação válida', () => {
    const novas = [
      { usuarioId: 1, status: 'PRESENTE' },
      { usuarioId: 2, status: 'ADMIN' },
    ] as MarcacaoPresenca[];
    expectConflict(() => applyMarcacoesPresenca(createSnapshot(), [], novas));
  });

  it('não propaga metadados ou horários enviados junto com uma marcação', () => {
    // Simula campos de uma entrada externa para verificar sua remoção em execução.
    const novas = [
      {
        usuarioId: 1,
        status: 'PRESENTE',
        observacao: '   ',
        marcadoPorId: 99,
        papel: 'ADMINISTRADOR',
        entrada: '2026-10-21T10:00:00Z',
        permanenciaSegundos: 3600,
      },
    ] as unknown as MarcacaoPresenca[];

    expect(applyMarcacoesPresenca(createSnapshot(), [], novas)).toEqual([
      { usuarioId: 1, status: 'PRESENTE' },
    ]);
  });

  it('aceita a lista vazia e não cria marcações para pessoas omitidas', () => {
    expect(applyMarcacoesPresenca(createSnapshot(), [], [])).toEqual([]);
    const snapshot = createSnapshot();
    snapshot.membros = [];
    expect(applyMarcacoesPresenca(snapshot, [], [])).toEqual([]);
  });

  it('recusa pessoas duplicadas na origem em vez de duplicar marcações', () => {
    const snapshot = createSnapshot();
    const primeira = snapshot.membros[0];
    if (!primeira) throw new Error('O cenário precisa de uma pessoa.');
    snapshot.membros.push({ ...primeira });
    expectConflict(() => applyMarcacoesPresenca(snapshot, [], []));
  });
});
