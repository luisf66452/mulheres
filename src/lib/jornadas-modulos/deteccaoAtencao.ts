// Varredura leve por palavras-chave em texto livre digitado pela usuária
// dentro de um exercício. É um heurístico complementar, não uma ferramenta
// clínica: NÃO detecta risco com segurança, só decide quando mostrar, de
// forma discreta, o card com acesso aos recursos de segurança que já existem
// no app (ver CardAcessoSeguranca.tsx e /seguranca). Nunca bloqueia o
// módulo, nunca diagnostica, e o texto da usuária nunca deve ser passado
// para log, analytics ou qualquer ferramenta de monitoramento a partir daqui.
//
// Roda inteiramente no client, sobre o valor já digitado — nenhuma chamada de
// rede é feita por esta função.

const TERMOS_ATENCAO = [
  // Risco de vida / ideação suicida
  'quero morrer',
  'nao aguento mais viver',
  'nao aguento mais',
  'vontade de morrer',
  'acabar com tudo',
  'nao quero mais viver',
  'nao vejo sentido em viver',
  'melhor eu nao existir',
  'pensei em morrer',
  'pensando em morrer',
  'suicidio',
  'me matar',
  'tirar minha vida',
  // Automutilação
  'me cortar',
  'me cortei',
  'me machucar',
  'me machuco',
  'automutilacao',
  'autolesao',
  // Violência / abuso / coerção
  'ele me bate',
  'ela me bate',
  'apanho dele',
  'apanho dela',
  'me agride',
  'me agrediu',
  'sofro abuso',
  'fui abusada',
  'abusou de mim',
  'me estuprou',
  'fui estuprada',
  'nao me deixa sair',
  'controla tudo que eu faco',
  'tenho medo dele',
  'tenho medo dela',
  'ameaca me machucar',
  // Comportamento de risco alimentar
  'me purgar',
  'vomitar depois de comer',
  'vomito depois de comer',
  'nao consigo parar de comer',
  'compulsao alimentar',
  'passar fome de proposito',
  'fico dias sem comer',
];

// Faixa Unicode dos diacríticos combinantes (acentos), construída via
// String.fromCharCode para evitar depender de caracteres não-ASCII no
// próprio arquivo-fonte: remove-los após normalize('NFD') é o que faz
// "ansiosa" e "ansíosa" baterem com o mesmo termo da lista.
const REGEX_DIACRITICOS = new RegExp(`[\\u0300-\\u036f]`, 'g');

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(REGEX_DIACRITICOS, '').toLowerCase().trim();
}

/**
 * Retorna true se o texto contém algum termo da lista de atenção, após
 * normalizar maiúsculas/acentos. Uso pretendido: decidir se mostra o card de
 * segurança inline — não é, e não deve ser apresentado como, uma triagem
 * clínica confiável.
 */
export function detectarSinalDeAtencao(texto: string | null | undefined): boolean {
  if (!texto) return false;
  const normalizado = normalizar(texto);
  if (normalizado.length === 0) return false;
  return TERMOS_ATENCAO.some((termo) => normalizado.includes(termo));
}
