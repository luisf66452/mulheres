// Horário silencioso: nunca entregar um push dentro da janela configurada
// (padrão 21:30–09:00 local, ver migração 20260822090000). A janela pode
// "virar a meia-noite" (início > fim, ex.: 21:30 → 09:00) — por isso a
// comparação abaixo trata os dois casos (janela normal e janela que cruza a
// virada do dia) em vez de assumir que fim > início.

/** Minutos desde meia-noite, no fuso horário informado. */
function minutosDoDiaNoFuso(instante: Date, fusoHorario: string): number {
  try {
    const partes = new Intl.DateTimeFormat('en-GB', {
      timeZone: fusoHorario,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(instante);
    const hora = Number(partes.find((p) => p.type === 'hour')?.value ?? '0');
    const minuto = Number(partes.find((p) => p.type === 'minute')?.value ?? '0');
    return hora * 60 + minuto;
  } catch {
    return instante.getUTCHours() * 60 + instante.getUTCMinutes();
  }
}

function paraMinutos(horaHHMM: string): number {
  const [hora, minuto] = horaHHMM.split(':').map(Number);
  return hora * 60 + (minuto || 0);
}

/**
 * true quando `instante` (convertido para o fuso da usuária) cai dentro da
 * janela de silêncio [inicio, fim). Suporta janelas que cruzam a meia-noite.
 */
export function estaEmHorarioSilencioso(
  instante: Date,
  fusoHorario: string,
  inicioHHMM: string,
  fimHHMM: string
): boolean {
  const agora = minutosDoDiaNoFuso(instante, fusoHorario);
  const inicio = paraMinutos(inicioHHMM);
  const fim = paraMinutos(fimHHMM);

  if (inicio === fim) return false; // janela de duração zero: nunca silencioso.

  if (inicio < fim) {
    // Janela comum, dentro do mesmo dia (ex.: 01:00–05:00).
    return agora >= inicio && agora < fim;
  }

  // Janela que cruza a meia-noite (ex.: 21:30–09:00): silencioso se está
  // depois do início OU antes do fim.
  return agora >= inicio || agora < fim;
}

/**
 * Se `instante` cai no horário silencioso, devolve o próximo instante (UTC)
 * em que a janela termina, no fuso da usuária. Do contrário devolve o
 * próprio `instante` inalterado (nada a adiar).
 *
 * Implementação por busca incremental (minuto a minuto, no máximo 24h) em vez
 * de aritmética direta de fuso: evita reimplementar a lógica de DST/offset já
 * coberta por Intl.DateTimeFormat, ao custo de uma iteração limitada e
 * barata.
 */
export function proximoHorarioPermitido(
  instante: Date,
  fusoHorario: string,
  inicioHHMM: string,
  fimHHMM: string
): Date {
  if (!estaEmHorarioSilencioso(instante, fusoHorario, inicioHHMM, fimHHMM)) {
    return instante;
  }

  const UM_MINUTO_MS = 60_000;
  let candidato = new Date(instante.getTime());
  for (let passos = 0; passos < 24 * 60; passos++) {
    candidato = new Date(candidato.getTime() + UM_MINUTO_MS);
    if (!estaEmHorarioSilencioso(candidato, fusoHorario, inicioHHMM, fimHHMM)) {
      return candidato;
    }
  }
  // Nunca deveria chegar aqui (janela de silêncio não pode cobrir 24h de
  // verdade, ver checagem inicio === fim acima) — devolve o candidato mesmo
  // assim em vez de travar.
  return candidato;
}
