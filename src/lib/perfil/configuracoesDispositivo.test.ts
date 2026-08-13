import { describe, it, expect, beforeEach } from 'vitest';
import {
  obterConfiguracoesDispositivo,
  salvarConfiguracoesDispositivo,
  CONFIGURACOES_PADRAO,
} from './configuracoesDispositivo';

describe('obterConfiguracoesDispositivo / salvarConfiguracoesDispositivo', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('retorna as configurações padrão quando nada foi salvo', () => {
    expect(obterConfiguracoesDispositivo()).toEqual(CONFIGURACOES_PADRAO);
  });

  it('salva e recupera alterações parciais mescladas com o padrão', () => {
    salvarConfiguracoesDispositivo({ tamanhoTexto: 'grande' });
    const resultado = obterConfiguracoesDispositivo();
    expect(resultado.tamanhoTexto).toBe('grande');
    expect(resultado.sons).toBe(CONFIGURACOES_PADRAO.sons);
  });

  it('acumula alterações sucessivas sem perder as anteriores', () => {
    salvarConfiguracoesDispositivo({ sons: false });
    salvarConfiguracoesDispositivo({ reduzirAnimacoes: true });
    const resultado = obterConfiguracoesDispositivo();
    expect(resultado.sons).toBe(false);
    expect(resultado.reduzirAnimacoes).toBe(true);
  });

  it('não namespaced por usuária: usa uma única chave de dispositivo', () => {
    salvarConfiguracoesDispositivo({ sons: false });
    expect(window.localStorage.getItem('perfil:configuracoes-dispositivo')).not.toBeNull();
  });
});
