import { describe, it, expect } from 'vitest';
import { validarEdicaoPerfil, FAIXAS_ETARIAS_VALIDAS } from './validacaoPerfil';

const dadosValidos = {
  nome: 'Maria Clara',
  frasePessoal: 'Cuidar de mim é a minha escolha.',
  faixaEtaria: '25-34',
  fusoHorario: 'America/Sao_Paulo',
  idioma: 'pt-BR',
};

describe('validarEdicaoPerfil', () => {
  it('aceita dados válidos completos', () => {
    expect(validarEdicaoPerfil(dadosValidos)).toEqual({});
  });

  it('aceita nome vazio (campo vira null ao salvar)', () => {
    expect(validarEdicaoPerfil({ ...dadosValidos, nome: '' })).toEqual({});
  });

  it('aceita frase pessoal vazia', () => {
    expect(validarEdicaoPerfil({ ...dadosValidos, frasePessoal: '' })).toEqual({});
  });

  it('rejeita frase pessoal com mais de 80 caracteres', () => {
    const resultado = validarEdicaoPerfil({ ...dadosValidos, frasePessoal: 'a'.repeat(81) });
    expect(resultado.frasePessoal).toBe('A frase pode ter no máximo 80 caracteres.');
  });

  it('aceita frase pessoal com exatamente 80 caracteres', () => {
    expect(validarEdicaoPerfil({ ...dadosValidos, frasePessoal: 'a'.repeat(80) })).toEqual({});
  });

  it('aceita faixa etária vazia (prefere não informar)', () => {
    expect(validarEdicaoPerfil({ ...dadosValidos, faixaEtaria: '' })).toEqual({});
  });

  it('rejeita faixa etária fora da lista permitida', () => {
    const resultado = validarEdicaoPerfil({ ...dadosValidos, faixaEtaria: '12-99' });
    expect(resultado.faixaEtaria).toBe('Selecione uma faixa etária válida.');
  });

  it('expõe as faixas etárias válidas', () => {
    expect(FAIXAS_ETARIAS_VALIDAS).toEqual(['18-24', '25-34', '35-44', '45-54', '55+']);
  });

  it('rejeita fuso horário vazio', () => {
    const resultado = validarEdicaoPerfil({ ...dadosValidos, fusoHorario: '' });
    expect(resultado.fusoHorario).toBe('Selecione um fuso horário.');
  });

  it('rejeita nome muito longo', () => {
    const resultado = validarEdicaoPerfil({ ...dadosValidos, nome: 'a'.repeat(81) });
    expect(resultado.nome).toBe('O nome pode ter no máximo 80 caracteres.');
  });
});
