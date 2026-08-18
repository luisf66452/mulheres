import { describe, it, expect, vi, afterEach } from 'vitest';
import { FUSOS_HORARIOS, fusoHorarioValido, detectarFusoHorarioNavegador } from './fusosHorarios';

describe('FUSOS_HORARIOS', () => {
  it('inclui fusos de Portugal e do Brasil', () => {
    const valores = FUSOS_HORARIOS.map((f) => f.valor);
    expect(valores).toContain('Europe/Lisbon');
    expect(valores).toContain('Atlantic/Azores');
    expect(valores).toContain('America/Noronha');
    expect(valores).toContain('America/Sao_Paulo');
    expect(valores).toContain('America/Manaus');
    expect(valores).toContain('America/Rio_Branco');
  });
});

describe('fusoHorarioValido', () => {
  it('aceita todo valor da lista suportada', () => {
    for (const fuso of FUSOS_HORARIOS) {
      expect(fusoHorarioValido(fuso.valor)).toBe(true);
    }
  });

  it('rejeita fuso fora da lista suportada', () => {
    expect(fusoHorarioValido('Europe/Paris')).toBe(false);
    expect(fusoHorarioValido('')).toBe(false);
    expect(fusoHorarioValido('qualquer-coisa')).toBe(false);
  });
});

describe('detectarFusoHorarioNavegador', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('retorna o fuso detectado quando ele está na lista suportada', () => {
    vi.spyOn(Intl, 'DateTimeFormat').mockReturnValue({
      resolvedOptions: () => ({ timeZone: 'America/Sao_Paulo' }),
    } as unknown as Intl.DateTimeFormat);

    expect(detectarFusoHorarioNavegador()).toBe('America/Sao_Paulo');
  });

  it('retorna null quando o fuso detectado não é suportado', () => {
    vi.spyOn(Intl, 'DateTimeFormat').mockReturnValue({
      resolvedOptions: () => ({ timeZone: 'Asia/Tokyo' }),
    } as unknown as Intl.DateTimeFormat);

    expect(detectarFusoHorarioNavegador()).toBeNull();
  });

  it('retorna null sem quebrar se a API não estiver disponível', () => {
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      throw new Error('indisponível');
    });

    expect(detectarFusoHorarioNavegador()).toBeNull();
  });
});
