// Lista de termos/expressões proibidos em qualquer texto gerado pela Rose
// sobre progresso, sequência ou resumo semanal — ver seção "Regras
// transversais" de docs/superpowers/specs/2026-08-24-evolucao-rose-design.md.
// Comparação é sempre case-insensitive (ver uso em streak.test.ts e
// resumoSemanal.test.ts).
export const VOCABULARIO_PROIBIDO = [
  'você melhorou',
  'você piorou',
  'isso significa que',
  'a causa é',
  'bom',
  'ruim',
  'normal',
  'anormal',
  'perdeu',
  'quebrou',
  'chama quebrada',
  'contagem regressiva',
];
