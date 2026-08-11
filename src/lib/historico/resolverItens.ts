import type { Checkin, Sessao } from '@/lib/supabase/types';

export type ItemHistorico = {
  checkin: Checkin;
  descricaoRitual: string | null;
};

export function resolverItensHistorico(
  checkins: Checkin[],
  sessoes: Sessao[],
  tituloPorPratica: Map<string, string>,
  tituloPorAtividade: Map<string, string>
): ItemHistorico[] {
  const sessaoPorCheckin = new Map(sessoes.map((s) => [s.checkin_id, s]));

  return checkins.map((checkin) => {
    const sessao = sessaoPorCheckin.get(checkin.id);
    let descricaoRitual: string | null = null;
    if (sessao?.pratica_id) {
      descricaoRitual = tituloPorPratica.get(sessao.pratica_id) ?? null;
    } else if (sessao?.jornada_atividade_id) {
      descricaoRitual = tituloPorAtividade.get(sessao.jornada_atividade_id) ?? null;
    }
    return { checkin, descricaoRitual };
  });
}
