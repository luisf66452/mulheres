// Cálculo de horário/dia local da usuária a partir do fuso IANA gravado no
// perfil — nunca do horário/dia do servidor (Vercel roda em UTC). O cron
// (api/push/send-due) só executa em um punhado de horários fixos por dia
// (ver vercel.json), então `estaNaJanelaDeEnvio` compara contra uma janela de
// tolerância em minutos ao redor do horário preferido, não contra o minuto
// exato — o minuto exato simplesmente não é uma promessa que o agendador
// atual consegue cumprir.

function partesDataHoraNoFuso(data: Date, fusoHorario: string): Record<string, string> {
  try {
    const formatador = new Intl.DateTimeFormat('en-US', {
      timeZone: fusoHorario,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'short',
    });
    const partes: Record<string, string> = {};
    for (const parte of formatador.formatToParts(data)) {
      if (parte.type !== 'literal') partes[parte.type] = parte.value;
    }
    return partes;
  } catch {
    // Fuso inválido/corrompido: cai para UTC em vez de derrubar o cron
    // inteiro por causa de uma única linha com dado ruim.
    const formatadorUtc = new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'short',
    });
    const partes: Record<string, string> = {};
    for (const parte of formatadorUtc.formatToParts(data)) {
      if (parte.type !== 'literal') partes[parte.type] = parte.value;
    }
    return partes;
  }
}

const DIA_SEMANA_POR_ABREVIACAO: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Minutos desde meia-noite, no horário local do fuso informado. */
export function minutosDoDiaNoFuso(agora: Date, fusoHorario: string): number {
  const partes = partesDataHoraNoFuso(agora, fusoHorario);
  const hora = Number(partes.hour ?? '0');
  const minuto = Number(partes.minute ?? '0');
  return hora * 60 + minuto;
}

/** 0 (domingo) a 6 (sábado), no dia local do fuso informado — mesmo formato de Date#getDay(). */
export function diaDaSemanaNoFuso(agora: Date, fusoHorario: string): number {
  const partes = partesDataHoraNoFuso(agora, fusoHorario);
  const abreviacao = partes.weekday ?? '';
  return DIA_SEMANA_POR_ABREVIACAO[abreviacao] ?? agora.getUTCDay();
}

/** Data local (YYYY-MM-DD) no fuso informado — usada como chave de idempotência por dia. */
export function dataLocalISONoFuso(agora: Date, fusoHorario: string): string {
  const partes = partesDataHoraNoFuso(agora, fusoHorario);
  return `${partes.year}-${partes.month}-${partes.day}`;
}

const JANELA_TOLERANCIA_MINUTOS_PADRAO = 90;

/**
 * Verdadeiro quando "agora" (convertido para o fuso da usuária) está dentro
 * de `janelaToleranciaMinutos` do horário preferido — considerando a volta da
 * meia-noite (ex.: preferido 23:50, agora 00:10 → 20 min de diferença, não
 * 1420). O padrão de 90 min existe porque o cron roda só duas vezes ao dia
 * (ver vercel.json); reduzir esse padrão sem aumentar a frequência do cron
 * faria usuárias reais nunca caírem na janela.
 */
export function estaNaJanelaDeEnvio(
  horarioPreferido: string | null,
  agora: Date,
  fusoHorario: string,
  janelaToleranciaMinutos: number = JANELA_TOLERANCIA_MINUTOS_PADRAO
): boolean {
  if (!horarioPreferido) return false;

  const [horaStr, minutoStr] = horarioPreferido.split(':');
  const horaPreferida = Number(horaStr);
  const minutoPreferido = Number(minutoStr ?? '0');
  if (Number.isNaN(horaPreferida) || Number.isNaN(minutoPreferido)) return false;

  const alvoMinutos = horaPreferida * 60 + minutoPreferido;
  const atualMinutos = minutosDoDiaNoFuso(agora, fusoHorario);
  const diferencaBruta = Math.abs(atualMinutos - alvoMinutos);
  const diferenca = Math.min(diferencaBruta, 1440 - diferencaBruta);

  return diferenca <= janelaToleranciaMinutos;
}
