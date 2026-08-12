export interface ModuloSessao {
  modulo: number;
  sessao: number;
}

export function calcularModuloSessao(numeroDia: number): ModuloSessao {
  return {
    modulo: Math.ceil(numeroDia / 7),
    sessao: ((numeroDia - 1) % 7) + 1,
  };
}

export function calcularDiaExibido(diasCompletados: number, duracaoDias: number): number {
  return Math.min(diasCompletados + 1, duracaoDias);
}
