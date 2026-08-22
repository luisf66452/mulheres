import { describe, expect, it } from 'vitest';
import manifest from './manifest';

describe('manifest da Rose', () => {
  it('declara nome, modo standalone e icones nos tamanhos certos', () => {
    const resultado = manifest();

    expect(resultado.name).toBe('Rose');
    expect(resultado.short_name).toBe('Rose');
    expect(resultado.display).toBe('standalone');
    expect(resultado.start_url).toBe('/');
    expect(resultado.scope).toBe('/');
    expect(resultado.background_color).toBe('#FBF6F0');
    expect(resultado.theme_color).toBe('#FBF6F0');

    const tamanhos = (resultado.icons ?? []).map((icone) => icone.sizes);
    expect(tamanhos).toContain('192x192');
    expect(tamanhos).toContain('512x512');

    const maskable = (resultado.icons ?? []).find((icone) => icone.purpose === 'maskable');
    expect(maskable?.sizes).toBe('512x512');
    expect(maskable?.src).toBe('/icons/icon-512-maskable.png');
  });
});
