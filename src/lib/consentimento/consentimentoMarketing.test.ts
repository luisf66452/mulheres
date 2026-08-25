// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import {
  obterConsentimentoMarketing,
  definirConsentimentoMarketing,
  EVENTO_CONSENTIMENTO_MARKETING,
} from './consentimentoMarketing';

beforeEach(() => {
  window.localStorage.clear();
});

describe('obterConsentimentoMarketing', () => {
  it('retorna "indefinido" quando a usuária nunca respondeu', () => {
    expect(obterConsentimentoMarketing()).toBe('indefinido');
  });

  it('retorna "aceito" depois de definirConsentimentoMarketing("aceito")', () => {
    definirConsentimentoMarketing('aceito');
    expect(obterConsentimentoMarketing()).toBe('aceito');
  });

  it('retorna "recusado" depois de definirConsentimentoMarketing("recusado")', () => {
    definirConsentimentoMarketing('recusado');
    expect(obterConsentimentoMarketing()).toBe('recusado');
  });
});

describe('definirConsentimentoMarketing', () => {
  it('dispara um evento customizado com o valor escolhido, para componentes já montados reagirem', () => {
    let detalheRecebido: string | undefined;
    window.addEventListener(EVENTO_CONSENTIMENTO_MARKETING, (evento) => {
      detalheRecebido = (evento as CustomEvent<string>).detail;
    });

    definirConsentimentoMarketing('aceito');

    expect(detalheRecebido).toBe('aceito');
  });
});
