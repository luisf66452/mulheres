import type { CondicaoFeedback, ModuloEstruturadoV1, ValorCampo } from './tipos';

// Motor de feedback determinístico: casa as respostas estruturadas da
// usuária contra regras explícitas do módulo. Não interpreta texto livre e
// não usa IA generativa — por isso campos texto_curto/texto_longo nunca
// devem ser usados como campoId de uma condição de feedback (o validador do
// módulo não impede isso tecnicamente, mas o conteúdo dos 9 módulos só
// condiciona feedback a campos de escolha_unica, multipla_escolha e escala).

function avaliarCondicao(condicao: CondicaoFeedback, valores: Record<string, ValorCampo>): boolean {
  const valor = valores[condicao.campoId];

  switch (condicao.operador) {
    case 'preenchido':
      if (valor === null || valor === undefined) return false;
      if (typeof valor === 'string') return valor.trim() !== '';
      if (Array.isArray(valor)) return valor.length > 0;
      return true;
    case 'igual':
      return valor === condicao.valor;
    case 'diferente':
      return valor !== condicao.valor;
    case 'maior_ou_igual':
      return typeof valor === 'number' && typeof condicao.valor === 'number' && valor >= condicao.valor;
    case 'menor_ou_igual':
      return typeof valor === 'number' && typeof condicao.valor === 'number' && valor <= condicao.valor;
    case 'contem':
      return Array.isArray(valor) && typeof condicao.valor === 'string' && valor.includes(condicao.valor);
    default:
      return false;
  }
}

/**
 * Escolhe o texto de feedback a exibir: a primeira regra cujas condições
 * (todas, em AND) forem satisfeitas pelas respostas, ou o texto padrão do
 * módulo se nenhuma regra bater. A ordem das regras no módulo importa.
 */
export function escolherFeedback(
  modulo: Pick<ModuloEstruturadoV1, 'feedback'>,
  valores: Record<string, ValorCampo>
): string {
  const regra = modulo.feedback.regras.find((r) => r.condicoes.every((c) => avaliarCondicao(c, valores)));
  return regra ? regra.texto : modulo.feedback.padrao;
}
