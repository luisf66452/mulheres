import { describe, it, expect } from 'vitest';
import { calcularResumoSemanal, type CheckinResumoSemanal } from './resumoSemanal';
import { VOCABULARIO_PROIBIDO } from '@/lib/testing/vocabularioProibido';

const DIAS_DA_SEMANA = [
  '2026-08-10',
  '2026-08-11',
  '2026-08-12',
  '2026-08-13',
  '2026-08-14',
  '2026-08-15',
  '2026-08-16',
];

const DIAS_SEMANA_ANTERIOR = [
  '2026-08-03',
  '2026-08-04',
  '2026-08-05',
  '2026-08-06',
  '2026-08-07',
  '2026-08-08',
  '2026-08-09',
];

function checkin(overrides: Partial<CheckinResumoSemanal> & { data: string }): CheckinResumoSemanal {
  return {
    humor: 3,
    imagem_corporal: 3,
    comida: 3,
    estado_geral: null,
    emocao_especifica: null,
    fatores: null,
    ...overrides,
  };
}

describe('calcularResumoSemanal', () => {
  it('semana vazia: nenhum check-in e nenhuma atividade concluída', () => {
    const resultado = calcularResumoSemanal({
      checkinsSemana: [],
      checkinsSemanaAnterior: [],
      diasDaSemana: DIAS_DA_SEMANA,
      datasAtividadesConcluidas: [],
    });

    expect(resultado.temRegistros).toBe(false);
    expect(resultado.diasComCheckin).toBe(0);
    expect(resultado.totalAtividadesConcluidas).toBe(0);
    expect(resultado.distribuicaoHumor).toEqual([]);
    expect(resultado.comparacaoSemanaAnterior).toBeNull();
  });

  it('poucos registros: menos de 3 check-ins não calcula tema em destaque nem comparação', () => {
    const resultado = calcularResumoSemanal({
      checkinsSemana: [
        checkin({ data: '2026-08-10', emocao_especifica: 'Ansiosa' }),
        checkin({ data: '2026-08-11', emocao_especifica: 'Ansiosa' }),
      ],
      checkinsSemanaAnterior: [],
      diasDaSemana: DIAS_DA_SEMANA,
      datasAtividadesConcluidas: [],
    });

    expect(resultado.temRegistros).toBe(true);
    expect(resultado.diasComCheckin).toBe(2);
    expect(resultado.temaDestaque).toBeNull();
    expect(resultado.comparacaoSemanaAnterior?.disponivel).toBe(false);
  });

  it('semana completa: conta dias com check-in e atividades concluídas dentro do período', () => {
    const resultado = calcularResumoSemanal({
      checkinsSemana: DIAS_DA_SEMANA.map((data) => checkin({ data })),
      checkinsSemanaAnterior: [],
      diasDaSemana: DIAS_DA_SEMANA,
      datasAtividadesConcluidas: ['2026-08-11', '2026-08-12', '2026-08-12', '2026-08-01'],
    });

    expect(resultado.diasComCheckin).toBe(7);
    // '2026-08-01' está fora da semana selecionada e é ignorada.
    expect(resultado.totalAtividadesConcluidas).toBe(3);
  });

  it('comparação indisponível quando a semana anterior tem menos de 3 check-ins', () => {
    const resultado = calcularResumoSemanal({
      checkinsSemana: DIAS_DA_SEMANA.slice(0, 3).map((data) => checkin({ data })),
      checkinsSemanaAnterior: DIAS_SEMANA_ANTERIOR.slice(0, 2).map((data) => checkin({ data })),
      diasDaSemana: DIAS_DA_SEMANA,
      datasAtividadesConcluidas: [],
    });

    expect(resultado.comparacaoSemanaAnterior?.disponivel).toBe(false);
  });

  it('comparação permitida quando ambas as semanas têm 3 ou mais check-ins', () => {
    const resultado = calcularResumoSemanal({
      checkinsSemana: DIAS_DA_SEMANA.slice(0, 4).map((data) => checkin({ data })),
      checkinsSemanaAnterior: DIAS_SEMANA_ANTERIOR.slice(0, 3).map((data) => checkin({ data })),
      diasDaSemana: DIAS_DA_SEMANA,
      datasAtividadesConcluidas: [],
    });

    expect(resultado.comparacaoSemanaAnterior).toEqual({
      disponivel: true,
      diasComCheckinSemanaAnterior: 3,
    });
  });

  it('destaque de tema exige pelo menos 3 check-ins na semana e o item aparecer pelo menos 2 vezes', () => {
    const resultado = calcularResumoSemanal({
      checkinsSemana: [
        checkin({ data: '2026-08-10', emocao_especifica: 'Esperançosa' }),
        checkin({ data: '2026-08-11', emocao_especifica: 'Ansiosa' }),
        checkin({ data: '2026-08-12', emocao_especifica: 'Ansiosa' }),
      ],
      checkinsSemanaAnterior: [],
      diasDaSemana: DIAS_DA_SEMANA,
      datasAtividadesConcluidas: [],
    });

    expect(resultado.temaDestaque).toEqual({ rotulo: 'Ansiosa', ocorrencias: 2 });
  });

  it('exclui "prefiro_nao_responder" do cômputo do tema em destaque', () => {
    const resultado = calcularResumoSemanal({
      checkinsSemana: [
        checkin({ data: '2026-08-10', emocao_especifica: 'prefiro_nao_responder' }),
        checkin({ data: '2026-08-11', emocao_especifica: 'prefiro_nao_responder' }),
        checkin({ data: '2026-08-12', emocao_especifica: 'prefiro_nao_responder' }),
      ],
      checkinsSemanaAnterior: [],
      diasDaSemana: DIAS_DA_SEMANA,
      datasAtividadesConcluidas: [],
    });

    expect(resultado.temaDestaque).toBeNull();
  });

  it('também considera fatores (não só emocao_especifica) no cômputo do tema em destaque', () => {
    const resultado = calcularResumoSemanal({
      checkinsSemana: [
        checkin({ data: '2026-08-10', fatores: ['Sono', 'Trabalho'] }),
        checkin({ data: '2026-08-11', fatores: ['Sono'] }),
        checkin({ data: '2026-08-12', fatores: ['Trabalho'] }),
      ],
      checkinsSemanaAnterior: [],
      diasDaSemana: DIAS_DA_SEMANA,
      datasAtividadesConcluidas: [],
    });

    expect(resultado.temaDestaque?.ocorrencias).toBe(2);
    expect(['Sono', 'Trabalho']).toContain(resultado.temaDestaque?.rotulo);
  });

  it('monta a distribuição de humor, imagem corporal e alimentação com todos os níveis de 1 a 5', () => {
    const resultado = calcularResumoSemanal({
      checkinsSemana: [
        checkin({ data: '2026-08-10', humor: 4, imagem_corporal: 2, comida: 3 }),
        checkin({ data: '2026-08-11', humor: 4, imagem_corporal: 2, comida: null }),
      ],
      checkinsSemanaAnterior: [],
      diasDaSemana: DIAS_DA_SEMANA,
      datasAtividadesConcluidas: [],
    });

    expect(resultado.distribuicaoHumor).toHaveLength(5);
    expect(resultado.distribuicaoHumor.find((i) => i.rotulo === 'Alto')?.quantidade).toBe(2);
    // comida null ("prefiro não responder") não entra na contagem de nenhum nível.
    const totalAlimentacao = resultado.distribuicaoAlimentacao.reduce((soma, i) => soma + i.quantidade, 0);
    expect(totalAlimentacao).toBe(1);
  });

  it('nunca usa vocabulário proibido na mensagem nem nos rótulos de distribuição, em nenhum cenário', () => {
    const cenarios = [
      { checkinsSemana: [], checkinsSemanaAnterior: [], diasDaSemana: DIAS_DA_SEMANA, datasAtividadesConcluidas: [] },
      {
        checkinsSemana: DIAS_DA_SEMANA.map((data) => checkin({ data, emocao_especifica: 'Ansiosa' })),
        checkinsSemanaAnterior: DIAS_SEMANA_ANTERIOR.map((data) => checkin({ data })),
        diasDaSemana: DIAS_DA_SEMANA,
        datasAtividadesConcluidas: ['2026-08-11'],
      },
    ];

    for (const cenario of cenarios) {
      const resultado = calcularResumoSemanal(cenario);
      const rotulosDistribuicao = [
        ...resultado.distribuicaoHumor,
        ...resultado.distribuicaoImagemCorporal,
        ...resultado.distribuicaoAlimentacao,
      ].map((item) => item.rotulo);
      const textoCompleto = [resultado.mensagem, ...rotulosDistribuicao].join(' ').toLowerCase();
      for (const termoProibido of VOCABULARIO_PROIBIDO) {
        expect(textoCompleto).not.toContain(termoProibido);
      }
    }

    // Garante que o cenário com registros de fato populou as distribuições
    // (senão a varredura acima passaria trivialmente sem testar nada).
    const resultadoComRegistros = calcularResumoSemanal(cenarios[1]);
    expect(resultadoComRegistros.distribuicaoHumor.length).toBeGreaterThan(0);
    expect(resultadoComRegistros.distribuicaoImagemCorporal.length).toBeGreaterThan(0);
  });

  it('exclui "prefiro_nao_responder" do cômputo do tema em destaque quando presente em fatores', () => {
    const resultado = calcularResumoSemanal({
      checkinsSemana: [
        checkin({ data: '2026-08-10', fatores: ['prefiro_nao_responder'] }),
        checkin({ data: '2026-08-11', fatores: ['prefiro_nao_responder', 'Sono'] }),
        checkin({ data: '2026-08-12', fatores: ['Sono'] }),
      ],
      checkinsSemanaAnterior: [],
      diasDaSemana: DIAS_DA_SEMANA,
      datasAtividadesConcluidas: [],
    });

    // "prefiro_nao_responder" aparece 2x mas deve ser excluído; "Sono" aparece
    // 2x e é o único tema legítimo com ocorrências suficientes para destaque.
    expect(resultado.temaDestaque).toEqual({ rotulo: 'Sono', ocorrencias: 2 });
  });

  it('ignora texto livre (fora das listas fechadas de emoção/fatores) no cômputo do tema em destaque, mesmo repetido', () => {
    // Simula o campo "outro fator" do check-in (texto livre digitado pela
    // usuária, sem validação contra FATORES_DISPONIVEIS) e um valor livre de
    // emoção que não pertence a EMOCOES_POR_QUADRANTE. Nenhum dos dois pode
    // virar temaDestaque, mesmo aparecendo 2+ vezes — senão a Rose ecoaria
    // esse texto literalmente na frase gerada.
    const resultado = calcularResumoSemanal({
      checkinsSemana: [
        checkin({ data: '2026-08-10', fatores: ['me senti ruim'], emocao_especifica: 'me senti ruim' }),
        checkin({ data: '2026-08-11', fatores: ['me senti ruim'], emocao_especifica: 'me senti ruim' }),
        checkin({ data: '2026-08-12', fatores: ['Sono'] }),
      ],
      checkinsSemanaAnterior: [],
      diasDaSemana: DIAS_DA_SEMANA,
      datasAtividadesConcluidas: [],
    });

    expect(resultado.temaDestaque).toBeNull();
    expect(resultado.mensagem).not.toContain('me senti ruim');
  });
});
