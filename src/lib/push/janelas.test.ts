import { describe, it, expect } from 'vitest';
import { horarioLocalDaJanela, horarioPreferidoParaJanela } from './janelas';

describe('horarioLocalDaJanela', () => {
  it('converte a janela da manhã (11h UTC) para o horário local em America/Sao_Paulo', () => {
    const referencia = new Date(Date.UTC(2026, 7, 10, 15, 0));
    expect(horarioLocalDaJanela('manha', 'America/Sao_Paulo', referencia)).toBe('08:00');
  });

  it('converte a janela da noite (22h UTC) para o horário local em America/Sao_Paulo', () => {
    const referencia = new Date(Date.UTC(2026, 7, 10, 15, 0));
    expect(horarioLocalDaJanela('noite', 'America/Sao_Paulo', referencia)).toBe('19:00');
  });
});

describe('horarioPreferidoParaJanela', () => {
  it('identifica a janela da manhã a partir de um horário salvo próximo dela', () => {
    expect(horarioPreferidoParaJanela('08:00', 'America/Sao_Paulo')).toBe('manha');
  });

  it('identifica a janela da noite a partir de um horário salvo próximo dela', () => {
    expect(horarioPreferidoParaJanela('19:05', 'America/Sao_Paulo')).toBe('noite');
  });

  it('usa manhã como padrão quando não há horário salvo', () => {
    expect(horarioPreferidoParaJanela(null, 'America/Sao_Paulo')).toBe('manha');
  });
});
