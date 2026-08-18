import { createHash } from 'crypto';

// transacoes_petalas.referencia_id é `uuid not null` (migração 0007) — mas o
// id de uma sessão de jornada é texto definido em código (ex.:
// "imagem-corporal-m1-s1"), não um uuid de banco. Em vez de alterar a coluna
// (usada também pelas outras 4 origens de Pétalas, com uuids de verdade),
// derivamos um uuid ESTÁVEL e determinístico a partir do texto: o mesmo
// sessaoId sempre produz o mesmo uuid, então a constraint
// unique(usuaria_id, tipo_evento, referencia_id) em transacoes_petalas
// continua garantindo "no máximo uma concessão de Pétalas por sessão por
// usuária" exatamente como para as outras origens.
export function idPetalasParaSessao(sessaoId: string): string {
  const hash = createHash('sha256').update(sessaoId).digest('hex');
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `4${hash.slice(13, 16)}`, // força a nibble de versão (formato válido, não é v4 de verdade)
    `a${hash.slice(17, 20)}`, // força a nibble de variante
    hash.slice(20, 32),
  ].join('-');
}
