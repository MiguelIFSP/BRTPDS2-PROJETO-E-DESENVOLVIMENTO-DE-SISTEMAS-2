import { describe, expect, it } from '@jest/globals';

import type { ListaPresencaDetalhada } from '@/services/listaPresencaService';
import { buildListaPresencaPdfHtml } from '@/utils/listaPresencaPdfHtml';

const lista: ListaPresencaDetalhada = {
  cabecalho: {
    reuniao: {
      id: 3,
      titulo: 'Reunião <Equipe>',
      data: '2026-11-25',
      horaInicio: '19:00',
      horaFim: '20:00',
      local: 'Sala A & B',
      fusoHorario: 'America/Sao_Paulo',
      estado: 'ENCERRADA',
      podeExportar: true,
    },
    organizacao: { id: 1, nome: 'Organização' },
    comissao: { id: 2, nome: 'Conselho' },
  },
  participantes: [
    {
      userId: 4,
      nome: 'Pessoa <Um>',
      email: 'pessoa@example.com',
      papel: 'MEMBRO',
      convite: 'ACEITO',
      status: 'PRESENTE',
      entrada: '2026-11-25T22:00:00.000Z',
      saida: null,
      marcadoPor: 'Administradora',
      marcadoEm: '2026-11-25T22:01:00.000Z',
      observacao: 'Chegou após o início.',
      eventos: [
        {
          id: 7,
          tipo: 'SAIDA',
          ocorridoAt: '2026-11-25T22:30:00.000Z',
          motivo: 'Atendimento & retorno',
          registradoPor: 'Administradora',
          registradoEm: '2026-11-25T22:31:00.000Z',
        },
      ],
    },
  ],
  totais: { participantes: 1, presentes: 1, ausentes: 0 },
};

describe('buildListaPresencaPdfHtml', () => {
  it('inclui registros reais e escapa dados inseridos pelos participantes', () => {
    const html = buildListaPresencaPdfHtml(lista);

    expect(html).toContain('Reunião &lt;Equipe&gt;');
    expect(html).toContain('Pessoa &lt;Um&gt;');
    expect(html).toContain('Sala A &amp; B');
    expect(html).toContain('Chegou após o início.');
    expect(html).not.toContain('Atendimento &amp; retorno');
    expect(html).toContain('25/11/2026');
    expect(html).toContain('19:00');
    expect(html).toContain('Entrada');
    expect(html).toContain('Saídas e retornos');
    expect(html).toContain('Observações');
  });

  it('não gera conteúdo do PDF antes do encerramento da reunião', () => {
    expect(() =>
      buildListaPresencaPdfHtml({
        ...lista,
        cabecalho: {
          ...lista.cabecalho,
          reuniao: {
            ...lista.cabecalho.reuniao,
            estado: 'EM_ANDAMENTO',
            podeExportar: false,
          },
        },
      }),
    ).toThrow('A lista só pode ser exportada após o encerramento da reunião.');
  });

  it('mostra quando não há participantes', () => {
    const html = buildListaPresencaPdfHtml({
      ...lista,
      participantes: [],
      totais: { participantes: 0, presentes: 0, ausentes: 0 },
    });

    expect(html).toContain('Não há participantes convidados');
  });
});
