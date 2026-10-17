import { describe, expect, it } from '@jest/globals';

import { AppError } from '../../errors/AppError.ts';
import type { ReuniaoPresencaSource } from '../../types/listaPresenca.ts';
import { consolidateListaPresenca } from '../consolidateListaPresenca.ts';

type ConvidadoSource = ReuniaoPresencaSource['convidados'][number];

function date(horario: string): Date {
  return new Date(`2026-10-16T${horario}:00.000Z`);
}

function registro(entrada: string, saida: string | null) {
  return { entrada: date(entrada), saida: saida === null ? null : date(saida) };
}

function createConvidado(
  overrides: Partial<ConvidadoSource> = {},
): ConvidadoSource {
  return {
    userId: 1,
    nome: 'Ana Silva',
    email: 'ana@example.com',
    papel: 'MEMBRO',
    resposta: 'ACEITO',
    registros: [registro('10:00', '11:00')],
    ...overrides,
  };
}

// A origem usa dados fictícios para testar as regras sem consultar o banco do projeto.
function createSource(
  overrides: Partial<ReuniaoPresencaSource> = {},
): ReuniaoPresencaSource {
  return {
    id: 1,
    titulo: 'Reunião da comissão',
    inicio: date('10:00'),
    fim: date('11:00'),
    local: 'Sala de reuniões',
    plataforma: null,
    cancelada: false,
    organizacao: { id: 1, nome: 'Organização de exemplo' },
    comissao: { id: 1, nome: 'Comissão de exemplo' },
    convidados: [createConvidado()],
    ...overrides,
  };
}

function getMembro(source: ReuniaoPresencaSource, geradoEm = date('11:30')) {
  const membro = consolidateListaPresenca(source, geradoEm).membros[0];
  if (membro === undefined) throw new Error('O cenário precisa de um membro.');
  return membro;
}

function expectConflict(
  source: ReuniaoPresencaSource,
  geradoEm = date('11:30'),
) {
  try {
    consolidateListaPresenca(source, geradoEm);
    throw new Error('A consolidação deveria recusar dados inválidos.');
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    if (error instanceof AppError) expect(error.statusCode).toBe(409);
  }
}

describe('consolidateListaPresenca', () => {
  it('consolida o cabeçalho e classifica uma presença completa', () => {
    const result = consolidateListaPresenca(createSource(), date('11:30'));

    expect(result.cabecalho).toEqual({
      reuniao: {
        id: 1,
        titulo: 'Reunião da comissão',
        inicio: '2026-10-16T10:00:00.000Z',
        fim: '2026-10-16T11:00:00.000Z',
        local: 'Sala de reuniões',
        plataforma: null,
      },
      organizacao: { id: 1, nome: 'Organização de exemplo' },
      comissao: { id: 1, nome: 'Comissão de exemplo' },
    });
    expect(result.membros).toEqual([
      {
        userId: 1,
        nome: 'Ana Silva',
        email: 'ana@example.com',
        papel: 'MEMBRO',
        entrada: '2026-10-16T10:00:00.000Z',
        saida: '2026-10-16T11:00:00.000Z',
        permanenciaSegundos: 3600,
        status: 'PRESENTE',
        atrasado: false,
        saiuAntes: false,
        saidaPendente: false,
      },
    ]);
    expect(result.statusLista).toBe('FINAL');
  });

  it('inclui aceitos e pendentes e exclui quem recusou', () => {
    const result = consolidateListaPresenca(
      createSource({
        convidados: [
          createConvidado({ registros: [] }),
          createConvidado({ userId: 2, resposta: 'PENDENTE', registros: [] }),
          createConvidado({ userId: 3, resposta: 'RECUSADO' }),
        ],
      }),
      date('11:30'),
    );

    expect(result.membros.map((membro) => membro.status)).toEqual([
      'AUSENTE',
      'SEM_RESPOSTA',
    ]);
    expect(result.totais).toEqual({
      aceitos: 1,
      semResposta: 1,
      presentes: 0,
      atrasados: 0,
      sairamAntes: 0,
      ausentes: 1,
    });
  });

  it('mantém sem resposta para um convite pendente mesmo com entrada', () => {
    const membro = getMembro(
      createSource({ convidados: [createConvidado({ resposta: 'PENDENTE' })] }),
    );

    expect(membro.status).toBe('SEM_RESPOSTA');
    expect(membro.permanenciaSegundos).toBe(3600);
  });

  it('classifica atraso pela primeira entrada sem tolerância', () => {
    const membro = getMembro(
      createSource({
        convidados: [
          createConvidado({ registros: [registro('10:01', '11:00')] }),
        ],
      }),
    );

    expect(membro.status).toBe('ATRASADO');
    expect(membro.atrasado).toBe(true);
    expect(membro.permanenciaSegundos).toBe(3540);
  });

  it('prioriza saiu antes e preserva a indicação de atraso', () => {
    const membro = getMembro(
      createSource({
        convidados: [
          createConvidado({ registros: [registro('10:10', '10:50')] }),
        ],
      }),
    );

    expect(membro.status).toBe('SAIU_ANTES');
    expect(membro.saiuAntes).toBe(true);
    expect(membro.atrasado).toBe(true);
  });

  it('usa a primeira entrada e a última saída em retornos à reunião', () => {
    const membro = getMembro(
      createSource({
        convidados: [
          createConvidado({
            registros: [registro('10:30', '11:00'), registro('10:00', '10:15')],
          }),
        ],
      }),
    );

    expect(membro.status).toBe('PRESENTE');
    expect(membro.entrada).toBe(date('10:00').toISOString());
    expect(membro.saida).toBe(date('11:00').toISOString());
    expect(membro.permanenciaSegundos).toBe(2700);
  });

  it('não duplica permanência em sessões sobrepostas ou repetidas', () => {
    const membro = getMembro(
      createSource({
        convidados: [
          createConvidado({
            registros: [
              registro('10:00', '10:40'),
              registro('10:20', '10:50'),
              registro('10:20', '10:50'),
              registro('10:50', '11:00'),
            ],
          }),
        ],
      }),
    );

    expect(membro.permanenciaSegundos).toBe(3600);
  });

  it('contabiliza entrada anterior ao início e limita a duração ao fim previsto', () => {
    const membro = getMembro(
      createSource({
        convidados: [
          createConvidado({ registros: [registro('09:50', '11:20')] }),
        ],
      }),
    );

    expect(membro.permanenciaSegundos).toBe(4200);
    expect(membro.saida).toBe(date('11:20').toISOString());
    expect(membro.status).toBe('PRESENTE');
  });

  it('gera parcial com sessão aberta sem inventar horário de saída', () => {
    const result = consolidateListaPresenca(
      createSource({
        convidados: [createConvidado({ registros: [registro('10:00', null)] })],
      }),
      date('10:30'),
    );

    expect(result.statusLista).toBe('PARCIAL');
    expect(result.membros[0]).toMatchObject({
      status: 'PRESENTE',
      saida: null,
      saidaPendente: true,
      saiuAntes: false,
      permanenciaSegundos: 1800,
    });
  });

  it('mantém a lista final com saída pendente e duração limitada ao fim', () => {
    const result = consolidateListaPresenca(
      createSource({
        convidados: [createConvidado({ registros: [registro('10:00', null)] })],
      }),
      date('12:00'),
    );

    expect(result.statusLista).toBe('FINAL');
    expect(result.membros[0]).toMatchObject({
      saida: null,
      saidaPendente: true,
      saiuAntes: false,
      permanenciaSegundos: 3600,
    });
  });

  it('considera uma saída futura como sessão ainda aberta no snapshot', () => {
    const membro = getMembro(
      createSource({
        convidados: [
          createConvidado({ registros: [registro('10:00', '10:50')] }),
        ],
      }),
      date('10:30'),
    );

    expect(membro).toMatchObject({
      saida: null,
      saidaPendente: true,
      saiuAntes: false,
      permanenciaSegundos: 1800,
      status: 'PRESENTE',
    });
  });

  it('não classifica saída antecipada quando há outra sessão aberta', () => {
    const membro = getMembro(
      createSource({
        convidados: [
          createConvidado({
            registros: [registro('10:00', '10:15'), registro('10:20', null)],
          }),
        ],
      }),
      date('10:45'),
    );

    expect(membro.saida).toBeNull();
    expect(membro.saidaPendente).toBe(true);
    expect(membro.saiuAntes).toBe(false);
    expect(membro.permanenciaSegundos).toBe(2400);
  });

  it('ignora entradas futuras ao calcular ausência, duração e saída pendente', () => {
    const membro = getMembro(
      createSource({
        convidados: [createConvidado({ registros: [registro('10:40', null)] })],
      }),
      date('10:30'),
    );

    expect(membro).toMatchObject({
      entrada: null,
      saida: null,
      permanenciaSegundos: 0,
      saidaPendente: false,
      atrasado: false,
      saiuAntes: false,
      status: 'AUSENTE',
    });
  });

  it('considera ausente quem só entrou depois do fim previsto', () => {
    const membro = getMembro(
      createSource({
        convidados: [
          createConvidado({
            registros: [registro('11:10', '11:15'), registro('11:20', null)],
          }),
        ],
      }),
      date('12:00'),
    );

    expect(membro).toMatchObject({
      entrada: null,
      saida: null,
      permanenciaSegundos: 0,
      saidaPendente: false,
      atrasado: false,
      saiuAntes: false,
      status: 'AUSENTE',
    });
  });

  it('desconsidera retorno após o fim ao classificar a saída antecipada válida', () => {
    const membro = getMembro(
      createSource({
        convidados: [
          createConvidado({
            registros: [registro('10:00', '10:30'), registro('11:10', null)],
          }),
        ],
      }),
      date('12:00'),
    );

    expect(membro).toMatchObject({
      entrada: date('10:00').toISOString(),
      saida: date('10:30').toISOString(),
      permanenciaSegundos: 1800,
      saidaPendente: false,
      saiuAntes: true,
      status: 'SAIU_ANTES',
    });
  });

  it('preserva entrada exatamente no fim com atraso e zero segundos de permanência', () => {
    const membro = getMembro(
      createSource({
        convidados: [
          createConvidado({ registros: [registro('11:00', '11:00')] }),
        ],
      }),
    );

    expect(membro).toMatchObject({
      entrada: date('11:00').toISOString(),
      saida: date('11:00').toISOString(),
      permanenciaSegundos: 0,
      atrasado: true,
      saiuAntes: false,
      status: 'ATRASADO',
    });
  });

  it('permite gerar antes do início sem permanência negativa', () => {
    const result = consolidateListaPresenca(createSource(), date('09:30'));

    expect(result.statusLista).toBe('PARCIAL');
    expect(result.membros[0]).toMatchObject({
      status: 'AUSENTE',
      permanenciaSegundos: 0,
    });
  });

  it('considera final exatamente no horário previsto de término', () => {
    expect(
      consolidateListaPresenca(createSource(), date('11:00')).statusLista,
    ).toBe('FINAL');
  });

  it('permite uma reunião sem convidados e devolve totais zerados', () => {
    const result = consolidateListaPresenca(
      createSource({ convidados: [] }),
      date('11:30'),
    );

    expect(result.membros).toEqual([]);
    expect(Object.values(result.totais)).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it('garante que os status exclusivos somem o número de convites aceitos', () => {
    const result = consolidateListaPresenca(
      createSource({
        convidados: [
          createConvidado(),
          createConvidado({
            userId: 2,
            registros: [registro('10:10', '11:00')],
          }),
          createConvidado({
            userId: 3,
            registros: [registro('10:10', '10:50')],
          }),
          createConvidado({ userId: 4, registros: [] }),
          createConvidado({ userId: 5, resposta: 'PENDENTE' }),
          createConvidado({ userId: 6, resposta: 'RECUSADO' }),
        ],
      }),
      date('11:30'),
    );

    expect(result.totais).toEqual({
      aceitos: 4,
      presentes: 1,
      atrasados: 1,
      sairamAntes: 1,
      ausentes: 1,
      semResposta: 1,
    });
    const { presentes, atrasados, sairamAntes, ausentes, aceitos } =
      result.totais;
    expect(presentes + atrasados + sairamAntes + ausentes).toBe(aceitos);
  });

  it('soma milissegundos antes de converter a permanência para segundos inteiros', () => {
    const membro = getMembro(
      createSource({
        convidados: [
          createConvidado({
            registros: [
              {
                entrada: date('10:00'),
                saida: new Date('2026-10-16T10:00:00.750Z'),
              },
              {
                entrada: date('10:01'),
                saida: new Date('2026-10-16T10:01:00.750Z'),
              },
            ],
          }),
        ],
      }),
    );

    expect(membro.permanenciaSegundos).toBe(1);
  });

  it('não altera a origem e devolve dados independentes do snapshot anterior', () => {
    const source = createSource({
      convidados: [
        createConvidado({
          registros: [registro('10:30', '11:00'), registro('10:00', '10:15')],
        }),
      ],
    });
    const before = JSON.stringify(source);
    const result = consolidateListaPresenca(source, date('11:30'));

    expect(JSON.stringify(source)).toBe(before);
    source.organizacao.nome = 'Outro nome';
    source.comissao.nome = 'Outra comissão';
    expect(result.cabecalho.organizacao.nome).toBe('Organização de exemplo');
    expect(result.cabecalho.comissao.nome).toBe('Comissão de exemplo');
  });

  it('recusa reunião cancelada com conflito', () => {
    expectConflict(createSource({ cancelada: true }));
  });

  it.each([
    ['início inválido', { inicio: new Date('inválida') }],
    ['fim inválido', { fim: new Date('inválida') }],
    ['fim igual ao início', { fim: date('10:00') }],
    ['fim anterior ao início', { fim: date('09:00') }],
    ['identificador da reunião inválido', { id: 0 }],
    ['identificador da reunião fracionado', { id: 1.5 }],
    [
      'identificador da organização inválido',
      { organizacao: { id: -1, nome: 'Organização' } },
    ],
    [
      'identificador da comissão inválido',
      { comissao: { id: 0, nome: 'Comissão' } },
    ],
    ['título vazio', { titulo: ' ' }],
  ] satisfies [string, Partial<ReuniaoPresencaSource>][])(
    'recusa %s com conflito',
    (_label, overrides) => {
      expectConflict(createSource(overrides));
    },
  );

  it('recusa instante de geração inválido com conflito', () => {
    expectConflict(createSource(), new Date('inválida'));
  });

  it('recusa convidados duplicados com conflito', () => {
    expectConflict(
      createSource({ convidados: [createConvidado(), createConvidado()] }),
    );
  });

  it('recusa identificador de convidado inválido com conflito', () => {
    expectConflict(
      createSource({ convidados: [createConvidado({ userId: 0 })] }),
    );
  });

  it('recusa papel da comissão fora do contrato com conflito', () => {
    // Simula um valor inválido recebido em tempo de execução apesar da tipagem.
    const papelInvalido = 'PRESIDENTE' as ConvidadoSource['papel'];
    expectConflict(
      createSource({
        convidados: [createConvidado({ papel: papelInvalido })],
      }),
    );
  });

  it.each([
    [
      'entrada inválida',
      { entrada: new Date('inválida'), saida: date('11:00') },
    ],
    ['saída inválida', { entrada: date('10:00'), saida: new Date('inválida') }],
    ['saída anterior à entrada', registro('10:30', '10:00')],
  ] satisfies [string, ConvidadoSource['registros'][number]][])(
    'recusa %s com conflito',
    (_label, registroInvalido) => {
      expectConflict(
        createSource({
          convidados: [createConvidado({ registros: [registroInvalido] })],
        }),
      );
    },
  );
});
