import { describe, expect, it } from 'vitest';
import manifest from './manifest';

describe('manifest da Rose', () => {
  it('declara nome, modo standalone e icones nos tamanhos certos', () => {
    const resultado = manifest();

    expect(resultado.name).toBe('Rose');
    expect(resultado.short_name).toBe('Rose');
    expect(resultado.display).toBe('standalone');
    expect(resultado.id).toBe('/');
    expect(resultado.start_url).toBe('/');
    expect(resultado.scope).toBe('/');
    expect(resultado.background_color).toBe('#FBF6F0');
    expect(resultado.theme_color).toBe('#FBF6F0');

    const icones = resultado.icons ?? [];
    expect(icones.length).toBe(3);

    const tamanhos = icones.map((icone) => icone.sizes);
    expect(tamanhos).toContain('192x192');
    expect(tamanhos).toContain('512x512');

    const iconesAny = icones.filter((icone) => icone.purpose === 'any');
    expect(iconesAny.map((icone) => icone.sizes).sort()).toEqual(['192x192', '512x512']);

    const maskable = icones.find((icone) => icone.purpose === 'maskable');
    expect(maskable?.sizes).toBe('512x512');
    expect(maskable?.src).toBe('/icons/icon-512-maskable.png');
  });
});
