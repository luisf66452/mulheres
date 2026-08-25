import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ResumoSemanalPessoal from './ResumoSemanalPessoal';
import type { ResumoSemanal } from '@/lib/progress/resumoSemanal';

const AVISO_LEGAL =
  'Este resumo descreve apenas o que você registrou e não representa diagnóstico ou avaliação clínica.';

const resumoVazio: ResumoSemanal = {
  temRegistros: false,
  diasComCheckin: 0,
  totalAtividadesConcluidas: 0,
  temaDestaque: null,
  distribuicaoHumor: [],
  distribuicaoImagemCorporal: [],
  distribuicaoAlimentacao: [],
  comparacaoSemanaAnterior: null,
  mensagem: 'Nenhum registro nesta semana ainda — quando você fizer um check-in, ele aparece aqui.',
};

const resumoComRegistros: ResumoSemanal = {
  temRegistros: true,
  diasComCheckin: 4,
  totalAtividadesConcluidas: 2,
  temaDestaque: { rotulo: 'ansiedade', ocorrencias: 2 },
  distribuicaoHumor: [
    { rotulo: 'Muito baixo', quantidade: 0 },
    { rotulo: 'Baixo', quantidade: 1 },
    { rotulo: 'Bem', quantidade: 2 },
    { rotulo: 'Alto', quantidade: 1 },
    { rotulo: 'Muito alto', quantidade: 0 },
  ],
  distribuicaoImagemCorporal: [
    { rotulo: 'Nível 1', quantidade: 0 },
    { rotulo: 'Nível 2', quantidade: 4 },
    { rotulo: 'Nível 3', quantidade: 0 },
    { rotulo: 'Nível 4', quantidade: 0 },
    { rotulo: 'Nível 5', quantidade: 0 },
  ],
  distribuicaoAlimentacao: [
    { rotulo: 'Nível 1', quantidade: 0 },
    { rotulo: 'Nível 2', quantidade: 0 },
    { rotulo: 'Nível 3', quantidade: 4 },
    { rotulo: 'Nível 4', quantidade: 0 },
    { rotulo: 'Nível 5', quantidade: 0 },
  ],
  comparacaoSemanaAnterior: { disponivel: true, diasComCheckinSemanaAnterior: 3 },
  mensagem: 'Nos seus registros, você fez check-in em 4 dos 7 dias desta semana.',
};

describe('ResumoSemanalPessoal', () => {
  it('mostra o aviso legal sempre, inclusive na prévia free', () => {
    render(<ResumoSemanalPessoal resumo={resumoComRegistros} ehPremium={false} />);
    expect(screen.getByText(AVISO_LEGAL)).toBeTruthy();
  });

  it('mostra o aviso legal também no estado vazio', () => {
    render(<ResumoSemanalPessoal resumo={resumoVazio} ehPremium={true} />);
    expect(screen.getByText(AVISO_LEGAL)).toBeTruthy();
  });

  it('estado vazio: mostra a mensagem de nenhum registro, sem distribuição', () => {
    render(<ResumoSemanalPessoal resumo={resumoVazio} ehPremium={true} />);
    expect(
      screen.getByText('Nenhum registro nesta semana ainda — quando você fizer um check-in, ele aparece aqui.')
    ).toBeTruthy();
  });

  it('free vê prévia com contagem de dias, mas não vê a distribuição completa nem o link fica escondido', () => {
    render(<ResumoSemanalPessoal resumo={resumoComRegistros} ehPremium={false} />);
    expect(screen.getByText('Você fez check-in em 4 dos 7 dias desta semana, nos seus registros.')).toBeTruthy();
    expect(screen.queryByText('Nível 2: 4')).toBeNull();
    expect(screen.getByRole('link', { name: 'Conhecer o Rose Pro' })).toBeTruthy();
  });

  it('premium vê o resumo completo com distribuição e mensagem', () => {
    render(<ResumoSemanalPessoal resumo={resumoComRegistros} ehPremium={true} />);
    expect(screen.getByText('Nos seus registros, você fez check-in em 4 dos 7 dias desta semana.')).toBeTruthy();
    expect(screen.getByText('Nível 2: 4')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Conhecer o Rose Pro' })).toBeNull();
  });
});
