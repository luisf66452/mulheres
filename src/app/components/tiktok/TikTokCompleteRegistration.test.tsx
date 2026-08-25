// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TikTokCompleteRegistration from './TikTokCompleteRegistration';

const replace = vi.fn();
const rastrearEvento = vi.fn();
const jaDisparado = vi.fn();
const marcarDisparado = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

vi.mock('@/lib/tiktok/eventos', () => ({
  rastrearEvento: (...args: unknown[]) => rastrearEvento(...args),
  jaDisparado: (...args: unknown[]) => jaDisparado(...args),
  marcarDisparado: (...args: unknown[]) => marcarDisparado(...args),
}));

describe('TikTokCompleteRegistration', () => {
  beforeEach(() => {
    replace.mockClear();
    rastrearEvento.mockClear();
    jaDisparado.mockReset().mockReturnValue(false);
    marcarDisparado.mockClear();
  });

  it('registra a conclusão sem remover o marcador que mantém a oferta Pro aberta', () => {
    render(<TikTokCompleteRegistration />);

    expect(rastrearEvento).toHaveBeenCalledWith('CompleteRegistration', {});
    expect(marcarDisparado).toHaveBeenCalledWith('complete_registration');
    expect(replace).not.toHaveBeenCalled();
  });

  it('mantém a deduplicação do evento em montagens posteriores', () => {
    jaDisparado.mockReturnValue(true);

    render(<TikTokCompleteRegistration />);

    expect(rastrearEvento).not.toHaveBeenCalled();
    expect(marcarDisparado).not.toHaveBeenCalled();
  });
});
