export function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// "Hoje" no fuso da usuária, não no fuso do servidor (produção roda em UTC).
// Sem isso, uma usuária no Brasil que faz o check-in à noite (ex.: 21h em
// São Paulo = 00h UTC do dia seguinte) teria o registro gravado com a data de
// amanhã, quebrando a sequência e a checagem de "já fez check-in hoje". Se o
// fuso for inválido/desconhecido, cai de volta ao horário do servidor em vez
// de quebrar.
export function hojeISONoFuso(fusoHorario: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: fusoHorario,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return formatDateISO(new Date());
  }
}

// Mesmo padrão já usado em lib/progress/semana.ts e streak.ts: um Date à
// meia-noite local (sem sufixo "Z") — o restante do código de progresso já
// lê data/dia-da-semana desse jeito, então basta ancorar "hoje" no fuso
// certo aqui para tudo o que consome esse Date (calcularProgresso7Dias,
// calcularSemana, resolverSegundaFeira etc.) ficar correto, sem precisar
// mudar nenhuma dessas funções.
export function hojeNoFuso(fusoHorario: string): Date {
  return new Date(`${hojeISONoFuso(fusoHorario)}T00:00:00`);
}
