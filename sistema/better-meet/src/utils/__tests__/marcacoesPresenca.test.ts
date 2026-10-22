import { describe, expect, it } from '@jest/globals';

import { createListaPresencaMockVersion } from '@/mocks/listaPresencaMock';
import {
  formatListaPresencaCsv,
  getResumoPresenca,
  getStatusPresenca,
  mergeMarcacoesPresenca,
  type MarcacaoPresenca,
} from '@/utils/marcacoesPresenca';

describe('marcações de presença', () => {
  it('preserva o status de origem quando não há marcação para a pessoa', () => {
    expect(getStatusPresenca({ userId: 1, status: 'ATRASADO' })).toBe(
      'ATRASADO',
    );
    expect(
      getStatusPresenca({ userId: 1, status: 'ATRASADO' }, [
        { usuarioId: 2, status: 'AUSENTE' },
      ]),
    ).toBe('ATRASADO');
  });

  it('conta uma vez a pessoa que chegou atrasada e saiu antes', () => {
    const lista = createListaPresencaMockVersion(2, {});
    const original = JSON.stringify(lista);

    expect(getResumoPresenca(lista.snapshot.membros)).toEqual({
      convidados: 4,
      presentes: 2,
      ausentes: 1,
      semResposta: 1,
      adesao: 50,
    });
    expect(JSON.stringify(lista)).toBe(original);
  });

  it('aplica presença manual sem inventar aceite, entrada, saída ou duração', () => {
    const lista = createListaPresencaMockVersion(2, {});
    const original = JSON.stringify(lista);
    const marcacoes: MarcacaoPresenca[] = [
      { usuarioId: 4, status: 'PRESENTE', observacao: 'Presença conferida.' },
    ];

    expect(getStatusPresenca(lista.snapshot.membros[3], marcacoes)).toBe(
      'PRESENTE',
    );
    expect(getResumoPresenca(lista.snapshot.membros, marcacoes)).toEqual({
      convidados: 4,
      presentes: 3,
      ausentes: 1,
      semResposta: 0,
      adesao: 75,
    });
    expect(JSON.stringify(lista)).toBe(original);
    expect(lista.snapshot.membros[3]).toMatchObject({
      status: 'SEM_RESPOSTA',
      entrada: null,
      saida: null,
      permanenciaSegundos: 0,
    });
    expect(lista.snapshot.totais).toMatchObject({ aceitos: 3, semResposta: 1 });
  });

  it('inclui atrasados na presença e arredonda a adesão sem dividir por zero', () => {
    expect(
      getResumoPresenca([
        { userId: 1, status: 'ATRASADO' },
        { userId: 2, status: 'AUSENTE' },
        { userId: 3, status: 'SEM_RESPOSTA' },
      ]),
    ).toEqual({
      convidados: 3,
      presentes: 1,
      ausentes: 1,
      semResposta: 1,
      adesao: 33,
    });
    expect(getResumoPresenca([])).toEqual({
      convidados: 0,
      presentes: 0,
      ausentes: 0,
      semResposta: 0,
      adesao: 0,
    });
  });

  it('mescla alterações em cópias ordenadas sem alterar versões anteriores', () => {
    const membros = [{ userId: 1 }, { userId: 2 }, { userId: 3 }];
    const anteriores: readonly MarcacaoPresenca[] = Object.freeze([
      Object.freeze({ usuarioId: 3, status: 'AUSENTE' as const }),
      Object.freeze({
        usuarioId: 1,
        status: 'PRESENTE' as const,
        observacao: 'Conferido.',
      }),
    ]);
    const novas: readonly MarcacaoPresenca[] = Object.freeze([
      Object.freeze({ usuarioId: 3, status: 'ATRASADO' as const }),
      Object.freeze({ usuarioId: 2, status: 'SEM_RESPOSTA' as const }),
    ]);
    const resultado = mergeMarcacoesPresenca(membros, anteriores, novas);

    expect(resultado).toEqual([
      { usuarioId: 1, status: 'PRESENTE', observacao: 'Conferido.' },
      { usuarioId: 2, status: 'SEM_RESPOSTA' },
      { usuarioId: 3, status: 'ATRASADO' },
    ]);
    expect(resultado[0]).not.toBe(anteriores[1]);
    expect(resultado[2]).not.toBe(novas[0]);
    resultado[0].observacao = 'Alterado na nova versão.';
    expect(anteriores[1].observacao).toBe('Conferido.');
    expect(anteriores[0].status).toBe('AUSENTE');
  });

  it('substitui a observação anterior quando a nova marcação a remove', () => {
    expect(
      mergeMarcacoesPresenca(
        [{ userId: 1 }],
        [{ usuarioId: 1, status: 'PRESENTE', observacao: 'Texto anterior.' }],
        [{ usuarioId: 1, status: 'AUSENTE' }],
      ),
    ).toEqual([{ usuarioId: 1, status: 'AUSENTE' }]);
  });

  it('recusa pessoa alheia à lista tanto nas novas quanto nas antigas marcações', () => {
    const alheia: MarcacaoPresenca = { usuarioId: 9, status: 'PRESENTE' };
    expect(() => mergeMarcacoesPresenca([{ userId: 1 }], [], [alheia])).toThrow(
      'A marcação contém uma pessoa que não pertence à lista.',
    );
    expect(() => mergeMarcacoesPresenca([{ userId: 1 }], [alheia], [])).toThrow(
      'A marcação contém uma pessoa que não pertence à lista.',
    );
  });

  it('recusa marcações duplicadas e pessoas duplicadas na origem', () => {
    const duplicadas: MarcacaoPresenca[] = [
      { usuarioId: 1, status: 'PRESENTE' },
      { usuarioId: 1, status: 'AUSENTE' },
    ];
    expect(() =>
      mergeMarcacoesPresenca([{ userId: 1 }], [], duplicadas),
    ).toThrow('Informe apenas uma marcação por pessoa.');
    expect(() =>
      mergeMarcacoesPresenca([{ userId: 1 }], duplicadas, []),
    ).toThrow('Informe apenas uma marcação por pessoa.');
    expect(() =>
      mergeMarcacoesPresenca([{ userId: 1 }, { userId: 1 }], [], []),
    ).toThrow('A lista de presença contém pessoas repetidas.');
  });
});

describe('exportação CSV da lista de presença', () => {
  it('exporta a versão selecionada com BOM, CRLF e os registros de origem', () => {
    const lista = createListaPresencaMockVersion(2, {
      observacoes: 'Conferida pela comissão.',
    });
    const original = JSON.stringify(lista);
    const csv = formatListaPresencaCsv({
      ...lista,
      marcacoes: [
        { usuarioId: 4, status: 'PRESENTE', observacao: 'Presença conferida.' },
      ],
    });

    expect(csv.startsWith('\uFEFFLista de presença')).toBe(true);
    expect(csv).toContain('Versão;2\r\n');
    expect(csv).toContain('Tipo de lista;Final\r\n');
    expect(csv).toContain('Convites aceitos na origem;3\r\n');
    expect(csv).toContain('Convites sem resposta na origem;1\r\n');
    expect(csv).toContain(
      'Diego Exemplo;diego@example.com;Facilitador;Presente;Presença conferida.;Não registrado;Não registrado;0h 0min 0s;Não;Não;Não\r\n',
    );
    const linhaBruno = csv
      .split('\r\n')
      .find((linha) => linha.startsWith('Bruno Exemplo;'));
    expect(linhaBruno).toContain(';Saiu antes;;');
    expect(linhaBruno).toContain(';0h 43min 0s;Sim;Sim;Não');
    expect(csv.replace(/\r\n/g, '')).not.toContain('\n');
    expect(JSON.stringify(lista)).toBe(original);
  });

  it('escapa separadores, aspas e quebras dentro de nomes e observações', () => {
    const lista = createListaPresencaMockVersion(2, {
      observacoes: 'Revisão; "concluída"\r\nSem pendências.',
    });
    lista.snapshot.membros[0].nome = 'Ana; "Exemplo"';
    const csv = formatListaPresencaCsv({
      ...lista,
      marcacoes: [
        {
          usuarioId: 1,
          status: 'PRESENTE',
          observacao: 'Texto; "citado"\nLinha.',
        },
      ],
    });

    expect(csv).toContain('"Ana; ""Exemplo""";ana@example.com;');
    expect(csv).toContain(';"Texto; ""citado""\nLinha.";');
    expect(csv).toContain(
      'Observações da lista;"Revisão; ""concluída""\r\nSem pendências."\r\n',
    );
  });

  it.each([
    ['=1+1', "'=1+1"],
    ['+1+1', "'+1+1"],
    ['-1+1', "'-1+1"],
    ['@SUM(A1)', "'@SUM(A1)"],
    ['\t=1+1', "'\t=1+1"],
    ['\r=1+1', '"\'\r=1+1"'],
    ['  =1+1', "'  =1+1"],
  ])(
    'neutraliza texto que planilhas podem interpretar como fórmula: %p',
    (nome, esperado) => {
      const lista = createListaPresencaMockVersion(2, {});
      lista.snapshot.membros[0].nome = nome;

      expect(formatListaPresencaCsv(lista)).toContain(
        `${esperado};ana@example.com;`,
      );
    },
  );

  it('protege também cabeçalho, e-mail, autor e observações livres', () => {
    const lista = createListaPresencaMockVersion(2, {
      observacoes: '=observacoes',
    });
    lista.snapshot.cabecalho.organizacao.nome = '=organizacao';
    lista.snapshot.cabecalho.comissao.nome = '=comissao';
    lista.snapshot.cabecalho.reuniao.titulo = '=reuniao';
    lista.snapshot.cabecalho.reuniao.local = '=local';
    lista.snapshot.cabecalho.reuniao.plataforma = '=plataforma';
    lista.geradoPor.nome = '=autor';
    lista.snapshot.membros[0].email = '=email';
    const csv = formatListaPresencaCsv({
      ...lista,
      marcacoes: [
        { usuarioId: 1, status: 'PRESENTE', observacao: '=individual' },
      ],
    });

    for (const campo of [
      'organizacao',
      'comissao',
      'reuniao',
      'local',
      'plataforma',
      'autor',
      'observacoes',
      'email',
      'individual',
    ]) {
      expect(csv).toContain(`;'=${campo}`);
    }
  });
});
