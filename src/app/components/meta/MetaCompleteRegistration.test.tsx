// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import MetaCompleteRegistration from './MetaCompleteRegistration';
import { jaDisparado } from '@/lib/meta/eventos';

beforeEach(() => {
  window.localStorage.clear();
  delete (window as unknown as { fbq?: unknown }).fbq;
});

afterEach(() => {
  delete (window as unknown as { fbq?: unknown }).fbq;
});

describe('MetaCompleteRegistration', () => {
  it('dispara fbq("track", "CompleteRegistration") uma vez ao montar', () => {
    const chamadas: unknown[][] = [];
    window.fbq = (...args: unknown[]) => chamadas.push(args);

    render(<MetaCompleteRegistration />);

    expect(chamadas).toEqual([['track', 'CompleteRegistration', {}]]);
    expect(jaDisparado('complete_registration')).toBe(true);
  });

  it('não dispara de novo se o evento já foi marcado como disparado', () => {
    const chamadas: unknown[][] = [];
    window.fbq = (...args: unknown[]) => chamadas.push(args);
    window.localStorage.setItem('rose_fbq_evento:complete_registration', '1');

    render(<MetaCompleteRegistration />);

    expect(chamadas).toEqual([]);
  });

  it('não quebra quando o pixel ainda não carregou (sem consentimento de marketing)', () => {
    expect(() => render(<MetaCompleteRegistration />)).not.toThrow();
  });
});
