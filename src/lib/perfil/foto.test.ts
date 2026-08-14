import { describe, it, expect } from 'vitest';
import { validarArquivoFoto, extensaoPorTipo } from './foto';

describe('validarArquivoFoto', () => {
  it('aceita JPEG dentro do limite', () => {
    expect(validarArquivoFoto({ type: 'image/jpeg', size: 1024 })).toBeNull();
  });

  it('aceita PNG dentro do limite', () => {
    expect(validarArquivoFoto({ type: 'image/png', size: 1024 })).toBeNull();
  });

  it('aceita WEBP dentro do limite', () => {
    expect(validarArquivoFoto({ type: 'image/webp', size: 1024 })).toBeNull();
  });

  it('rejeita tipo não suportado', () => {
    expect(validarArquivoFoto({ type: 'image/gif', size: 1024 })).toBe(
      'Escolha uma imagem JPG, PNG ou WEBP.'
    );
  });

  it('rejeita arquivo maior que 2MB', () => {
    expect(validarArquivoFoto({ type: 'image/jpeg', size: 2 * 1024 * 1024 + 1 })).toBe(
      'A imagem precisa ter no máximo 2MB.'
    );
  });

  it('aceita arquivo exatamente no limite de 2MB', () => {
    expect(validarArquivoFoto({ type: 'image/jpeg', size: 2 * 1024 * 1024 })).toBeNull();
  });
});

describe('extensaoPorTipo', () => {
  it('retorna png para image/png', () => {
    expect(extensaoPorTipo('image/png')).toBe('png');
  });

  it('retorna webp para image/webp', () => {
    expect(extensaoPorTipo('image/webp')).toBe('webp');
  });

  it('retorna jpg para image/jpeg', () => {
    expect(extensaoPorTipo('image/jpeg')).toBe('jpg');
  });
});
