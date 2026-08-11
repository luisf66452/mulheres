import { describe, it, expect } from 'vitest';
import { decidirTrocaDeJornada } from './troca';

describe('decidirTrocaDeJornada', () => {
  it('primeira jornada da usuária: sem jornada ativa anterior, cria uma nova', () => {
    const resultado = decidirTrocaDeJornada({
      jornadaAtivaAtual: null,
      jornadaAlvoId: 'jornada-a',
      progressoExistenteNoAlvo: null,
    });
    expect(resultado).toEqual({ pausar: null, ativar: 'criar_nova' });
  });

  it('trocar de uma jornada ativa para outra nunca iniciada: pausa a atual e cria a nova', () => {
    const resultado = decidirTrocaDeJornada({
      jornadaAtivaAtual: { id: 'progresso-a', jornadaId: 'jornada-a' },
      jornadaAlvoId: 'jornada-b',
      progressoExistenteNoAlvo: null,
    });
    expect(resultado).toEqual({ pausar: { id: 'progresso-a' }, ativar: 'criar_nova' });
  });

  it('retomar uma jornada pausada anteriormente: pausa a atual e reativa preservando o progresso salvo', () => {
    const resultado = decidirTrocaDeJornada({
      jornadaAtivaAtual: { id: 'progresso-a', jornadaId: 'jornada-a' },
      jornadaAlvoId: 'jornada-b',
      progressoExistenteNoAlvo: { id: 'progresso-b', diasCompletados: 4 },
    });
    expect(resultado).toEqual({
      pausar: { id: 'progresso-a' },
      ativar: { id: 'progresso-b', diasCompletados: 4 },
    });
  });

  it('clicar em continuar na jornada já ativa não pausa nada', () => {
    const resultado = decidirTrocaDeJornada({
      jornadaAtivaAtual: { id: 'progresso-a', jornadaId: 'jornada-a' },
      jornadaAlvoId: 'jornada-a',
      progressoExistenteNoAlvo: { id: 'progresso-a', diasCompletados: 4 },
    });
    expect(resultado).toEqual({
      pausar: null,
      ativar: { id: 'progresso-a', diasCompletados: 4 },
    });
  });
});
