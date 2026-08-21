// transacoes_petalas.referencia_id é `uuid not null` (migração 0007) — mas o
// id de uma sessão de jornada é texto definido em código (ex.:
// "imagem-corporal-m1-s1"), não um uuid de banco. Em vez de alterar a coluna
// (usada também pelas outras origens de Pétalas, com uuids de verdade),
// derivamos um uuid ESTÁVEL e determinístico a partir do texto: o mesmo
// sessaoId sempre produz o mesmo uuid, então a constraint
// unique(usuaria_id, tipo_evento, referencia_id) em transacoes_petalas
// continua garantindo "no máximo uma concessão de Pétalas por sessão por
// usuária" exatamente como para as outras origens (Task 5 só chama isso
// quando registrarConclusaoSessao já disse concluidaAgora === true, então
// esta constraint é um cinto-e-suspensórios, não a linha de defesa principal).
import { createHash } from 'crypto';

const NAMESPACE = 'jornadas-conteudo-sessao';

export function idPetalasParaSessao(sessaoId: string): string {
  const hash = createHash('sha256').update(`${NAMESPACE}:${sessaoId}`).digest('hex');
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    '5' + hash.slice(13, 16), // versão 5 (nome-hash) — determinístico, não aleatório
    ((parseInt(hash.slice(16, 17), 16) & 0x3) | 0x8).toString(16) + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join('-');
}
