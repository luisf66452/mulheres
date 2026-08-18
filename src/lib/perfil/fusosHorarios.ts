// Lista de fusos IANA suportados pelo Rose. Cobre Portugal (Lisboa e Açores,
// que observam horário de verão) e as principais regiões do Brasil (que não
// observam horário de verão desde 2019 — por isso só esses ganham offset UTC
// fixo no rótulo; um offset fixo para Lisboa/Açores ficaria errado metade do
// ano).
export const FUSOS_HORARIOS = [
  { valor: 'Atlantic/Azores', rotulo: 'Açores' },
  { valor: 'Europe/Lisbon', rotulo: 'Lisboa e Portugal continental' },
  { valor: 'America/Noronha', rotulo: 'Fernando de Noronha (UTC-2)' },
  { valor: 'America/Sao_Paulo', rotulo: 'Brasília, São Paulo (UTC-3)' },
  { valor: 'America/Manaus', rotulo: 'Manaus (UTC-4)' },
  { valor: 'America/Rio_Branco', rotulo: 'Rio Branco, Acre (UTC-5)' },
] as const;

export type FusoHorarioSuportado = (typeof FUSOS_HORARIOS)[number]['valor'];

export function fusoHorarioValido(valor: string): valor is FusoHorarioSuportado {
  return FUSOS_HORARIOS.some((fuso) => fuso.valor === valor);
}

// Melhor esforço: descobre o fuso do navegador para sugerir um valor mais
// preciso do que o padrão salvo, sem nunca sobrescrever silenciosamente a
// preferência já gravada no perfil. Retorna null se o navegador não suportar
// a API ou se o fuso detectado não estiver na lista suportada pelo app.
export function detectarFusoHorarioNavegador(): FusoHorarioSuportado | null {
  try {
    const detectado = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return fusoHorarioValido(detectado) ? detectado : null;
  } catch {
    return null;
  }
}
