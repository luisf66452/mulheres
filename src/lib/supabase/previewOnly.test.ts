import { describe, it, expect, afterEach } from 'vitest';
import { estaEmPreviewVercel } from './previewOnly';

const original = process.env.VERCEL_ENV;

afterEach(() => {
  process.env.VERCEL_ENV = original;
});

describe('estaEmPreviewVercel', () => {
  it('retorna true só quando VERCEL_ENV é exatamente "preview"', () => {
    process.env.VERCEL_ENV = 'preview';
    expect(estaEmPreviewVercel()).toBe(true);
  });

  it('retorna false em production', () => {
    process.env.VERCEL_ENV = 'production';
    expect(estaEmPreviewVercel()).toBe(false);
  });

  it('retorna false em development e quando a variável não existe', () => {
    process.env.VERCEL_ENV = 'development';
    expect(estaEmPreviewVercel()).toBe(false);

    delete process.env.VERCEL_ENV;
    expect(estaEmPreviewVercel()).toBe(false);
  });
});
