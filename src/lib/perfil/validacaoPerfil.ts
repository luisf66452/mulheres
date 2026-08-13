export const FAIXAS_ETARIAS_VALIDAS = ['18-24', '25-34', '35-44', '45-54', '55+'] as const;

export interface DadosEdicaoPerfil {
  nome: string;
  frasePessoal: string;
  faixaEtaria: string;
  fusoHorario: string;
  idioma: string;
}

export interface ErrosEdicaoPerfil {
  nome?: string;
  frasePessoal?: string;
  faixaEtaria?: string;
  fusoHorario?: string;
}

export function validarEdicaoPerfil(dados: DadosEdicaoPerfil): ErrosEdicaoPerfil {
  const erros: ErrosEdicaoPerfil = {};

  if (dados.nome.trim().length > 80) {
    erros.nome = 'O nome pode ter no máximo 80 caracteres.';
  }

  if (dados.frasePessoal.trim().length > 80) {
    erros.frasePessoal = 'A frase pode ter no máximo 80 caracteres.';
  }

  if (
    dados.faixaEtaria !== '' &&
    !FAIXAS_ETARIAS_VALIDAS.includes(dados.faixaEtaria as (typeof FAIXAS_ETARIAS_VALIDAS)[number])
  ) {
    erros.faixaEtaria = 'Selecione uma faixa etária válida.';
  }

  if (dados.fusoHorario.trim() === '') {
    erros.fusoHorario = 'Selecione um fuso horário.';
  }

  return erros;
}
