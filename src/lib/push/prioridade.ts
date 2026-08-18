// Decide QUAL notificação (no máximo uma) enviar para uma usuária num dia,
// seguindo a prioridade contextual pedida: jornada ativa ainda não realizada
// > check-in diário ainda não feito > prática de autocuidado > resumo semanal
// no dia configurado. Função pura, sem I/O — o wiring com Supabase/web-push
// fica em api/push/send-due/route.ts.

export type TipoNotificacaoPush = 'jornada' | 'checkin' | 'praticas' | 'resumo_semanal';

export interface PreferenciasNotificacaoParaDecisao {
  lembrete_checkin: boolean;
  lembrete_jornada: boolean;
  lembrete_praticas: boolean;
  resumo_semanal: boolean;
  dias_semana: number[];
}

export interface ParametrosDecisaoNotificacao {
  checkinFeitoHoje: boolean;
  jornadaAtivaTitulo: string | null;
  preferencias: PreferenciasNotificacaoParaDecisao | null;
  diaDaSemana: number; // 0 (domingo) a 6 (sábado), no fuso local da usuária
}

// Domingo — fecha a semana. Não é um dado novo (não há campo de "dia do
// resumo" configurável nesta rodada), só uma constante de produto.
export const DIA_RESUMO_SEMANAL = 0;

// Sem linha em preferencias_notificacoes ainda = usuária nunca abriu a tela
// de notificações — mantém o padrão (tudo ligado, todos os dias), mesma
// regra que já existia no cron antes desta correção.
const PADRAO_SEM_PREFERENCIA: PreferenciasNotificacaoParaDecisao = {
  lembrete_checkin: true,
  lembrete_jornada: true,
  lembrete_praticas: true,
  resumo_semanal: true,
  dias_semana: [0, 1, 2, 3, 4, 5, 6],
};

export function decidirTipoNotificacao(
  params: ParametrosDecisaoNotificacao
): TipoNotificacaoPush | null {
  const preferencias = params.preferencias ?? PADRAO_SEM_PREFERENCIA;

  if (!preferencias.dias_semana.includes(params.diaDaSemana)) {
    return null;
  }

  if (!params.checkinFeitoHoje) {
    if (params.jornadaAtivaTitulo && preferencias.lembrete_jornada) {
      return 'jornada';
    }
    if (preferencias.lembrete_checkin) {
      return 'checkin';
    }
    // Sem check-in ainda hoje, lembrete de check-in/jornada desligados, mas
    // lembrete de práticas ligado: ainda vale lembrar a usuária do momento
    // de cuidado do dia, com um tom diferente (não menciona check-in).
    if (preferencias.lembrete_praticas) {
      return 'praticas';
    }
    return null;
  }

  // Check-in de hoje já foi feito — não há mais nada pendente no dia (o
  // check-in já concentra jornada/prática do dia neste app). Só resta o
  // resumo semanal, e só no dia configurado para ele.
  if (params.diaDaSemana === DIA_RESUMO_SEMANAL && preferencias.resumo_semanal) {
    return 'resumo_semanal';
  }

  return null;
}

export const MENSAGENS_POR_TIPO: Record<TipoNotificacaoPush, { titulo: string; corpo: string; url: string }> = {
  jornada: {
    titulo: 'Rose',
    corpo: 'Sua jornada está te esperando para o próximo passo de hoje.',
    url: '/checkin',
  },
  checkin: {
    titulo: 'Rose',
    corpo: 'Seu momento de cuidado de hoje está te esperando.',
    url: '/checkin',
  },
  praticas: {
    titulo: 'Rose',
    corpo: 'Que tal alguns minutos de autocuidado agora?',
    url: '/praticas',
  },
  resumo_semanal: {
    titulo: 'Rose',
    corpo: 'Seu resumo da semana já está disponível em Progresso.',
    url: '/progresso',
  },
};
