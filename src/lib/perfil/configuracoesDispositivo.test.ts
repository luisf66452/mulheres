import { describe, it, expect, beforeEach } from 'vitest';
import {
  obterConfiguracoesDispositivo,
  salvarConfiguracoesDispositivo,
  aplicarPreferenciasNoDocumento,
  CONFIGURACOES_PADRAO,
} from './configuracoesDispositivo';

const USUARIA_A = 'usuaria-aaa';
const USUARIA_B = 'usuaria-bbb';

describe('obterConfiguracoesDispositivo / salvarConfiguracoesDispositivo', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-tema');
    document.documentElement.removeAttribute('data-tamanho-texto');
    document.documentElement.removeAttribute('data-reduzir-animacoes');
  });

  it('retorna as configurações padrão quando nada foi salvo', () => {
    expect(obterConfiguracoesDispositivo(USUARIA_A)).toEqual(CONFIGURACOES_PADRAO);
  });

  it('salva e recupera alterações parciais mescladas com o padrão', () => {
    salvarConfiguracoesDispositivo(USUARIA_A, { tamanhoTexto: 'grande' });
    const resultado = obterConfiguracoesDispositivo(USUARIA_A);
    expect(resultado.tamanhoTexto).toBe('grande');
    expect(resultado.reduzirAnimacoes).toBe(CONFIGURACOES_PADRAO.reduzirAnimacoes);
  });

  it('acumula alterações sucessivas sem perder as anteriores', () => {
    salvarConfiguracoesDispositivo(USUARIA_A, { reduzirAnimacoes: true });
    salvarConfiguracoesDispositivo(USUARIA_A, { tema: 'escura' });
    const resultado = obterConfiguracoesDispositivo(USUARIA_A);
    expect(resultado.reduzirAnimacoes).toBe(true);
    expect(resultado.tema).toBe('escura');
  });

  it('isola preferências entre usuárias diferentes no mesmo dispositivo', () => {
    salvarConfiguracoesDispositivo(USUARIA_A, { tamanhoTexto: 'maior', tema: 'escura' });
    salvarConfiguracoesDispositivo(USUARIA_B, { tamanhoTexto: 'padrao', tema: 'clara' });

    expect(obterConfiguracoesDispositivo(USUARIA_A).tamanhoTexto).toBe('maior');
    expect(obterConfiguracoesDispositivo(USUARIA_A).tema).toBe('escura');
    expect(obterConfiguracoesDispositivo(USUARIA_B).tamanhoTexto).toBe('padrao');
    expect(obterConfiguracoesDispositivo(USUARIA_B).tema).toBe('clara');
  });

  it('namespaceia a chave de localStorage por usuária', () => {
    salvarConfiguracoesDispositivo(USUARIA_A, { reduzirAnimacoes: true });
    expect(window.localStorage.getItem(`perfil:configuracoes-dispositivo:${USUARIA_A}`)).not.toBeNull();
    expect(window.localStorage.getItem(`perfil:configuracoes-dispositivo:${USUARIA_B}`)).toBeNull();
  });

  it('usa um balde "convidada" sem quebrar quando não há usuária autenticada', () => {
    salvarConfiguracoesDispositivo(null, { tema: 'escura' });
    expect(obterConfiguracoesDispositivo(null).tema).toBe('escura');
    expect(window.localStorage.getItem('perfil:configuracoes-dispositivo:convidada')).not.toBeNull();
  });
});

describe('aplicarPreferenciasNoDocumento', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-tema');
    document.documentElement.removeAttribute('data-tamanho-texto');
    document.documentElement.removeAttribute('data-reduzir-animacoes');
  });

  it('define data-tamanho-texto sempre, refletindo o valor atual', () => {
    aplicarPreferenciasNoDocumento({ ...CONFIGURACOES_PADRAO, tamanhoTexto: 'grande' });
    expect(document.documentElement.getAttribute('data-tamanho-texto')).toBe('grande');
  });

  it('define data-reduzir-animacoes só quando ativo, e remove quando desativado', () => {
    aplicarPreferenciasNoDocumento({ ...CONFIGURACOES_PADRAO, reduzirAnimacoes: true });
    expect(document.documentElement.getAttribute('data-reduzir-animacoes')).toBe('true');

    aplicarPreferenciasNoDocumento({ ...CONFIGURACOES_PADRAO, reduzirAnimacoes: false });
    expect(document.documentElement.hasAttribute('data-reduzir-animacoes')).toBe(false);
  });

  it('remove data-tema quando o tema é "sistema", e define quando é explícito', () => {
    aplicarPreferenciasNoDocumento({ ...CONFIGURACOES_PADRAO, tema: 'escura' });
    expect(document.documentElement.getAttribute('data-tema')).toBe('escura');

    aplicarPreferenciasNoDocumento({ ...CONFIGURACOES_PADRAO, tema: 'sistema' });
    expect(document.documentElement.hasAttribute('data-tema')).toBe(false);
  });
});
