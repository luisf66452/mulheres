import { describe, expect, it } from 'vitest';
import { deveMostrarOfertaRosePro } from './ofertaPosLogin';

describe('deveMostrarOfertaRosePro', () => {
  it('mostra para usuária gratuita que acabou de entrar', () => {
    expect(
      deveMostrarOfertaRosePro({ plano: 'free', entrada: '1', cadastro: undefined })
    ).toBe(true);
  });

  it('mostra para conta gratuita que acabou de concluir o onboarding', () => {
    expect(
      deveMostrarOfertaRosePro({ plano: 'free', entrada: undefined, cadastro: 'concluido' })
    ).toBe(true);
  });

  it('não mostra para assinante premium', () => {
    expect(
      deveMostrarOfertaRosePro({ plano: 'premium', entrada: '1', cadastro: undefined })
    ).toBe(false);
  });

  it('não mostra quando o plano não pôde ser confirmado', () => {
    expect(
      deveMostrarOfertaRosePro({ plano: null, entrada: '1', cadastro: undefined })
    ).toBe(false);
  });

  it('não mostra em uma visita comum à página inicial', () => {
    expect(
      deveMostrarOfertaRosePro({ plano: 'free', entrada: undefined, cadastro: undefined })
    ).toBe(false);
  });
});
