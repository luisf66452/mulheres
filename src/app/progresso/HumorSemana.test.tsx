import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HumorSemana from './HumorSemana';
import type { DiaSemana } from '@/lib/progress/semana';

const semanaBase: DiaSemana[] = [
  { data: '2026-08-10', humor: 4 },
  { data: '2026-08-11', humor: null },
  { data: '2026-08-12', humor: 2 },
  { data: '2026-08-13', humor: null },
  { data: '2026-08-14', humor: null },
  { data: '2026-08-15', humor: null },
  { data: '2026-08-16', humor: null },
];

describe('HumorSemana', () => {
  it('mostra mensagem vazia quando nenhum dia da semana tem registro', () => {
    const vazia: DiaSemana[] = semanaBase.map((d) => ({ ...d, humor: null }));
    render(
      <HumorSemana dias={vazia} hojeISO="2026-08-13" hrefSemanaAnterior="2026-08-03" hrefSemanaSeguinte={null} />
    );
    expect(screen.getByText('Faça seu primeiro check-in para começar a acompanhar seu humor.')).toBeTruthy();
  });

  it('expande um resumo do dia ao tocar em um dia com registro', () => {
    render(
      <HumorSemana
        dias={semanaBase}
        hojeISO="2026-08-13"
        hrefSemanaAnterior="2026-08-03"
        hrefSemanaSeguinte={null}
      />
    );
    const botaoDia = screen.getByLabelText(/Segunda-feira, 10 de agosto, humor: Alto/);
    fireEvent.click(botaoDia);
    expect(screen.getByText(/10 de agosto — Alto/)).toBeTruthy();
  });

  it('leva ao check-in ao tocar no dia atual sem registro', () => {
    render(
      <HumorSemana
        dias={semanaBase}
        hojeISO="2026-08-13"
        hrefSemanaAnterior="2026-08-03"
        hrefSemanaSeguinte={null}
      />
    );
    const linkHoje = screen.getByLabelText(
      /Quinta-feira, 13 de agosto, sem registro\. Toque para fazer o check-in de hoje\./
    );
    expect(linkHoje.getAttribute('href')).toBe('/checkin');
  });

  it('não mostra link de próxima semana quando já é a semana atual', () => {
    render(
      <HumorSemana
        dias={semanaBase}
        hojeISO="2026-08-13"
        hrefSemanaAnterior="2026-08-03"
        hrefSemanaSeguinte={null}
      />
    );
    expect(screen.queryByLabelText('Ver próxima semana')).toBeNull();
  });

  it('mostra o link de próxima semana quando ela existe', () => {
    render(
      <HumorSemana
        dias={semanaBase}
        hojeISO="2026-08-13"
        hrefSemanaAnterior="2026-08-03"
        hrefSemanaSeguinte="2026-08-17"
      />
    );
    const link = screen.getByLabelText('Ver próxima semana');
    expect(link.getAttribute('href')).toBe('/progresso?semana=2026-08-17');
  });
});
