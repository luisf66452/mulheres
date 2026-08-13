import { describe, it, expect, beforeEach } from 'vitest';
import {
  obterNotificacoesPreferencias,
  salvarNotificacoesPreferencias,
  NOTIFICACOES_PADRAO,
} from './notificacoesPreferencias';

describe('obterNotificacoesPreferencias / salvarNotificacoesPreferencias', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('retorna as preferências padrão quando nada foi salvo', () => {
    expect(obterNotificacoesPreferencias('u1')).toEqual(NOTIFICACOES_PADRAO);
  });

  it('salva e recupera alterações parciais mescladas com o padrão', () => {
    salvarNotificacoesPreferencias('u1', { resumoSemanal: false });
    const resultado = obterNotificacoesPreferencias('u1');
    expect(resultado.resumoSemanal).toBe(false);
    expect(resultado.lembreteCheckin).toBe(NOTIFICACOES_PADRAO.lembreteCheckin);
  });

  it('não mistura preferências de usuárias diferentes', () => {
    salvarNotificacoesPreferencias('u1', { resumoSemanal: false });
    salvarNotificacoesPreferencias('u2', { avisosNovidades: true });
    expect(obterNotificacoesPreferencias('u1').avisosNovidades).toBe(NOTIFICACOES_PADRAO.avisosNovidades);
    expect(obterNotificacoesPreferencias('u2').resumoSemanal).toBe(NOTIFICACOES_PADRAO.resumoSemanal);
  });

  it('acumula alterações sucessivas sem perder as anteriores', () => {
    salvarNotificacoesPreferencias('u1', { resumoSemanal: false });
    salvarNotificacoesPreferencias('u1', { avisosNovidades: true });
    const resultado = obterNotificacoesPreferencias('u1');
    expect(resultado.resumoSemanal).toBe(false);
    expect(resultado.avisosNovidades).toBe(true);
  });
});
