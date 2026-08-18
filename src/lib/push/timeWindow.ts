// horarioPreferido é sempre a hora local que a usuária escolheu na tela de
// notificações (input type="time", sem timezone embutido). O cron
// (api/push/send-due) roda em UTC — sem converter "agora" pro fuso da
// usuária, todo mundo fora de UTC receberia o lembrete na hora errada (ex.:
// alguém em São Paulo que pediu 09:00 seria notificada às 06:00 local).
export function estaNaJanelaDeEnvio(horarioPreferido: string | null, agora: Date, fusoHorario: string): boolean {
  if (!horarioPreferido) return false;
  const [horaPreferida] = horarioPreferido.split(':').map(Number);
  return horaLocalNoFuso(agora, fusoHorario) === horaPreferida;
}

function horaLocalNoFuso(agora: Date, fusoHorario: string): number {
  try {
    // hourCycle: 'h23' evita o caso de meia-noite virar "24" em vez de "00"
    // que algumas implementações de ICU produzem com hour12: false.
    return Number(
      new Intl.DateTimeFormat('en-GB', { timeZone: fusoHorario, hour: '2-digit', hourCycle: 'h23' }).format(agora)
    );
  } catch {
    return agora.getUTCHours();
  }
}

// Dia da semana (0 = domingo … 6 = sábado, mesmo formato de getDay() no JS,
// documentado em preferencias_notificacoes.dias_semana) no fuso da usuária,
// não no fuso do servidor — relevante perto da virada da meia-noite local.
export function diaDaSemanaNoFuso(agora: Date, fusoHorario: string): number {
  try {
    const diaISO = new Intl.DateTimeFormat('en-CA', {
      timeZone: fusoHorario,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(agora);
    return new Date(`${diaISO}T12:00:00`).getDay();
  } catch {
    return agora.getUTCDay();
  }
}
