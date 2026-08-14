import { describe, it, expect, beforeEach } from 'vitest';
import { obterPreferencias, salvarPreferencias, PREFERENCIAS_PADRAO } from './preferencias';

describe('obterPreferencias / salvarPreferencias', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('retorna as preferências padrão (tudo vazio) quando nada foi salvo', () => {
    expect(obterPreferencias('u1')).toEqual(PREFERENCIAS_PADRAO);
  });

  it('salva e recupera as preferências da usuária', () => {
    salvarPreferencias('u1', { ...PREFERENCIAS_PADRAO, temas: ['autoestima', 'comparacao'] });
    expect(obterPreferencias('u1').temas).toEqual(['autoestima', 'comparacao']);
  });

  it('não mistura preferências de usuárias diferentes', () => {
    salvarPreferencias('u1', { ...PREFERENCIAS_PADRAO, temas: ['autoestima'] });
    salvarPreferencias('u2', { ...PREFERENCIAS_PADRAO, temas: ['comparacao'] });
    expect(obterPreferencias('u1').temas).toEqual(['autoestima']);
    expect(obterPreferencias('u2').temas).toEqual(['comparacao']);
  });

  it('retorna o padrão em vez de lançar erro quando o valor salvo está corrompido', () => {
    window.localStorage.setItem('perfil:preferencias:u1', '{ isso não é json válido');
    expect(obterPreferencias('u1')).toEqual(PREFERENCIAS_PADRAO);
  });
});
