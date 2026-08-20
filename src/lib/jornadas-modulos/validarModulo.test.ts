import { describe, it, expect } from 'vitest';
import { validarModuloEstruturado, ModuloEstruturadoInvalidoError } from './validarModulo';
import { modulo1EntendendoEmocoes } from './conteudo/modulo1EntendendoEmocoes';

describe('validarModuloEstruturado', () => {
  it('aceita o módulo 1 (referência) sem lançar erro', () => {
    expect(() => validarModuloEstruturado(modulo1EntendendoEmocoes)).not.toThrow();
  });

  it('rejeita schemaVersion diferente de 1', () => {
    const invalido = { ...modulo1EntendendoEmocoes, schemaVersion: 2 };
    expect(() => validarModuloEstruturado(invalido)).toThrow(ModuloEstruturadoInvalidoError);
  });

  it('rejeita regra de feedback que referencia um campoId inexistente', () => {
    const invalido = {
      ...modulo1EntendendoEmocoes,
      feedback: {
        padrao: 'padrao',
        regras: [{ id: 'r1', condicoes: [{ campoId: 'campo_que_nao_existe', operador: 'preenchido' }], texto: 'x' }],
      },
    };
    expect(() => validarModuloEstruturado(invalido)).toThrow(/campoId/);
  });

  it('rejeita camposParaTriagem apontando para um id inexistente', () => {
    const invalido = { ...modulo1EntendendoEmocoes, camposParaTriagem: ['nao_existe'] };
    expect(() => validarModuloEstruturado(invalido)).toThrow(ModuloEstruturadoInvalidoError);
  });

  it('rejeita referência científica com link que não é https', () => {
    const invalido = {
      ...modulo1EntendendoEmocoes,
      baseCientifica: [
        {
          afirmacao: 'x',
          referencia: 'x',
          link: 'http://exemplo.com',
          aplicacao: 'x',
          limitacoes: 'x',
        },
      ],
    };
    expect(() => validarModuloEstruturado(invalido)).toThrow(/https/);
  });

  it('rejeita campo de escala com min >= max', () => {
    const invalido = {
      ...modulo1EntendendoEmocoes,
      exercicio: {
        introducao: 'x',
        campos: [{ tipo: 'escala', id: 'a', rotulo: 'a', min: 5, max: 5, rotuloMin: 'baixo', rotuloMax: 'alto' }],
      },
    };
    expect(() => validarModuloEstruturado(invalido)).toThrow(ModuloEstruturadoInvalidoError);
  });

  it('rejeita ids de campo duplicados', () => {
    const invalido = {
      ...modulo1EntendendoEmocoes,
      exercicio: {
        introducao: 'x',
        campos: [
          { tipo: 'texto_curto', id: 'dup', rotulo: 'a' },
          { tipo: 'texto_curto', id: 'dup', rotulo: 'b' },
        ],
      },
    };
    expect(() => validarModuloEstruturado(invalido)).toThrow(/duplicado/);
  });

  it('rejeita entrada que não é objeto', () => {
    expect(() => validarModuloEstruturado(null)).toThrow(ModuloEstruturadoInvalidoError);
    expect(() => validarModuloEstruturado('texto')).toThrow(ModuloEstruturadoInvalidoError);
  });
});
