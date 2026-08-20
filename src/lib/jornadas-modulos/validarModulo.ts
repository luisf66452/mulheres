import type {
  CampoExercicio,
  ModuloEstruturadoV1,
  ReferenciaCientifica,
  RegraFeedback,
} from './tipos';

export class ModuloEstruturadoInvalidoError extends Error {}

function erro(caminho: string, mensagem: string): never {
  throw new ModuloEstruturadoInvalidoError(`${caminho}: ${mensagem}`);
}

function assertString(valor: unknown, caminho: string): asserts valor is string {
  if (typeof valor !== 'string' || valor.trim() === '') erro(caminho, 'deve ser uma string não vazia');
}

function assertStringArray(valor: unknown, caminho: string): asserts valor is string[] {
  if (!Array.isArray(valor) || valor.length === 0 || !valor.every((v) => typeof v === 'string' && v.trim() !== '')) {
    erro(caminho, 'deve ser um array de strings não vazio');
  }
}

const TIPOS_CAMPO = ['texto_curto', 'texto_longo', 'escolha_unica', 'multipla_escolha', 'escala'] as const;
const OPERADORES = ['igual', 'diferente', 'maior_ou_igual', 'menor_ou_igual', 'contem', 'preenchido'] as const;

function validarCampo(valor: unknown, caminho: string): CampoExercicio {
  if (typeof valor !== 'object' || valor === null) erro(caminho, 'campo deve ser um objeto');
  const campo = valor as Record<string, unknown>;
  assertString(campo.id, `${caminho}.id`);
  assertString(campo.rotulo, `${caminho}.rotulo`);
  if (!TIPOS_CAMPO.includes(campo.tipo as (typeof TIPOS_CAMPO)[number])) {
    erro(`${caminho}.tipo`, `tipo de campo desconhecido: ${String(campo.tipo)}`);
  }
  if (campo.opcional !== undefined && typeof campo.opcional !== 'boolean') {
    erro(`${caminho}.opcional`, 'deve ser boolean quando presente');
  }

  if (campo.tipo === 'escolha_unica' || campo.tipo === 'multipla_escolha') {
    assertStringArray(campo.opcoes, `${caminho}.opcoes`);
  }

  if (campo.tipo === 'escala') {
    if (typeof campo.min !== 'number' || typeof campo.max !== 'number' || campo.min >= campo.max) {
      erro(`${caminho}`, 'escala precisa de min < max numéricos');
    }
    assertString(campo.rotuloMin, `${caminho}.rotuloMin`);
    assertString(campo.rotuloMax, `${caminho}.rotuloMax`);
  }

  return campo as unknown as CampoExercicio;
}

function validarCondicao(valor: unknown, caminho: string) {
  if (typeof valor !== 'object' || valor === null) erro(caminho, 'condição deve ser um objeto');
  const condicao = valor as Record<string, unknown>;
  assertString(condicao.campoId, `${caminho}.campoId`);
  if (!OPERADORES.includes(condicao.operador as (typeof OPERADORES)[number])) {
    erro(`${caminho}.operador`, `operador desconhecido: ${String(condicao.operador)}`);
  }
}

function validarRegraFeedback(valor: unknown, caminho: string): RegraFeedback {
  if (typeof valor !== 'object' || valor === null) erro(caminho, 'regra deve ser um objeto');
  const regra = valor as Record<string, unknown>;
  assertString(regra.id, `${caminho}.id`);
  assertString(regra.texto, `${caminho}.texto`);
  if (!Array.isArray(regra.condicoes) || regra.condicoes.length === 0) {
    erro(`${caminho}.condicoes`, 'deve ter ao menos uma condição');
  }
  (regra.condicoes as unknown[]).forEach((c, i) => validarCondicao(c, `${caminho}.condicoes[${i}]`));
  return regra as unknown as RegraFeedback;
}

function validarReferencia(valor: unknown, caminho: string): ReferenciaCientifica {
  if (typeof valor !== 'object' || valor === null) erro(caminho, 'referência deve ser um objeto');
  const ref = valor as Record<string, unknown>;
  assertString(ref.afirmacao, `${caminho}.afirmacao`);
  assertString(ref.referencia, `${caminho}.referencia`);
  assertString(ref.link, `${caminho}.link`);
  assertString(ref.aplicacao, `${caminho}.aplicacao`);
  assertString(ref.limitacoes, `${caminho}.limitacoes`);
  if (!ref.link.startsWith('https://')) erro(`${caminho}.link`, 'deve ser um link https verificável (DOI/PubMed/página oficial)');
  return ref as unknown as ReferenciaCientifica;
}

/**
 * Valida em runtime um valor vindo de jornada_atividades.conteudo_estruturado
 * (jsonb) contra o schema ModuloEstruturadoV1. Lança ModuloEstruturadoInvalidoError
 * com um caminho legível apontando o campo problemático.
 */
export function validarModuloEstruturado(valor: unknown): ModuloEstruturadoV1 {
  if (typeof valor !== 'object' || valor === null) erro('modulo', 'conteudo_estruturado deve ser um objeto');
  const m = valor as Record<string, unknown>;

  if (m.schemaVersion !== 1) erro('modulo.schemaVersion', 'só a versão 1 é suportada por este validador');
  assertString(m.objetivo, 'modulo.objetivo');
  if (typeof m.duracaoEstimadaMinutos !== 'number' || m.duracaoEstimadaMinutos <= 0) {
    erro('modulo.duracaoEstimadaMinutos', 'deve ser um número positivo');
  }
  assertStringArray(m.explicacao, 'modulo.explicacao');

  if (typeof m.exemplo !== 'object' || m.exemplo === null) erro('modulo.exemplo', 'deve ser um objeto');
  const exemplo = m.exemplo as Record<string, unknown>;
  assertString(exemplo.titulo, 'modulo.exemplo.titulo');
  assertString(exemplo.texto, 'modulo.exemplo.texto');

  if (typeof m.exercicio !== 'object' || m.exercicio === null) erro('modulo.exercicio', 'deve ser um objeto');
  const exercicio = m.exercicio as Record<string, unknown>;
  assertString(exercicio.introducao, 'modulo.exercicio.introducao');
  if (!Array.isArray(exercicio.campos) || exercicio.campos.length === 0) {
    erro('modulo.exercicio.campos', 'deve ter ao menos um campo');
  }
  const idsCampos = new Set<string>();
  (exercicio.campos as unknown[]).forEach((c, i) => {
    const campo = validarCampo(c, `modulo.exercicio.campos[${i}]`);
    if (idsCampos.has(campo.id)) erro(`modulo.exercicio.campos[${i}].id`, `id duplicado: ${campo.id}`);
    idsCampos.add(campo.id);
  });

  if (typeof m.feedback !== 'object' || m.feedback === null) erro('modulo.feedback', 'deve ser um objeto');
  const feedback = m.feedback as Record<string, unknown>;
  assertString(feedback.padrao, 'modulo.feedback.padrao');
  if (!Array.isArray(feedback.regras)) erro('modulo.feedback.regras', 'deve ser um array (pode ser vazio)');
  (feedback.regras as unknown[]).forEach((r, i) => {
    const regra = validarRegraFeedback(r, `modulo.feedback.regras[${i}]`);
    regra.condicoes.forEach((cond, j) => {
      if (!idsCampos.has(cond.campoId)) {
        erro(`modulo.feedback.regras[${i}].condicoes[${j}].campoId`, `campoId "${cond.campoId}" não existe no exercício`);
      }
    });
  });

  assertString(m.acaoPratica, 'modulo.acaoPratica');
  assertStringArray(m.resumo, 'modulo.resumo');

  if (!Array.isArray(m.baseCientifica) || m.baseCientifica.length === 0) {
    erro('modulo.baseCientifica', 'deve ter ao menos uma referência');
  }
  (m.baseCientifica as unknown[]).forEach((r, i) => validarReferencia(r, `modulo.baseCientifica[${i}]`));

  if (m.avisoSeguranca !== undefined) assertString(m.avisoSeguranca, 'modulo.avisoSeguranca');

  if (!Array.isArray(m.camposParaTriagem)) erro('modulo.camposParaTriagem', 'deve ser um array (pode ser vazio)');
  (m.camposParaTriagem as unknown[]).forEach((id, i) => {
    if (typeof id !== 'string' || !idsCampos.has(id)) {
      erro(`modulo.camposParaTriagem[${i}]`, `campoId "${String(id)}" não existe no exercício ou não é string`);
    }
  });

  return m as unknown as ModuloEstruturadoV1;
}
