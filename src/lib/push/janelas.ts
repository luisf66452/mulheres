// As duas janelas de envio possíveis, ancoradas nos horários fixos do cron
// (ver vercel.json) — não são um horário exato garantido, são o único
// compromisso que o agendador atual (duas execuções por dia) consegue
// cumprir de verdade. Mantido separado de timeWindow.ts porque aqui é sobre
// "quais janelas oferecer na interface", não "a usuária está na janela
// agora".
export type JanelaNotificacao = 'manha' | 'noite';

const HORA_UTC_POR_JANELA: Record<JanelaNotificacao, number> = {
  manha: 11,
  noite: 22,
};

export const ROTULO_POR_JANELA: Record<JanelaNotificacao, string> = {
  manha: 'Manhã',
  noite: 'Noite',
};

/** Horário local aproximado (HH:MM) em que a janela dispara, no fuso informado. */
export function horarioLocalDaJanela(janela: JanelaNotificacao, fusoHorario: string, referencia = new Date()): string {
  const horaUtc = HORA_UTC_POR_JANELA[janela];
  const dataUtc = new Date(
    Date.UTC(referencia.getUTCFullYear(), referencia.getUTCMonth(), referencia.getUTCDate(), horaUtc, 0)
  );
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: fusoHorario,
  }).format(dataUtc);
}

/** Dada uma janela e o fuso da usuária, retorna o valor HH:MM a persistir em horario_preferido_notificacao. */
export function janelaParaHorarioPreferido(janela: JanelaNotificacao, fusoHorario: string): string {
  return horarioLocalDaJanela(janela, fusoHorario);
}

/** Caminho inverso: a partir de um horario_preferido_notificacao salvo, identifica a janela mais próxima (para pré-selecionar o controle). */
export function horarioPreferidoParaJanela(
  horarioPreferido: string | null,
  fusoHorario: string
): JanelaNotificacao {
  if (!horarioPreferido) return 'manha';

  const [horaSalva, minutoSalva] = horarioPreferido.split(':').map(Number);
  const minutosAlvo = horaSalva * 60 + (minutoSalva || 0);

  let melhor: JanelaNotificacao = 'manha';
  let menorDiferenca = Infinity;

  for (const janela of Object.keys(HORA_UTC_POR_JANELA) as JanelaNotificacao[]) {
    const [h, m] = horarioLocalDaJanela(janela, fusoHorario).split(':').map(Number);
    const minutosJanela = h * 60 + m;
    const diferenca = Math.min(
      Math.abs(minutosJanela - minutosAlvo),
      1440 - Math.abs(minutosJanela - minutosAlvo)
    );
    if (diferenca < menorDiferenca) {
      menorDiferenca = diferenca;
      melhor = janela;
    }
  }

  return melhor;
}
