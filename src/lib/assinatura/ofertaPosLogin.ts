type EstadoOfertaRosePro = {
  plano: 'free' | 'premium' | null;
  entrada?: string;
  cadastro?: string;
};

/**
 * A oferta é um convite pós-autenticação, não um paywall. Ela só aparece
 * quando o plano foi confirmado como gratuito e a URL carrega um dos sinais
 * controlados pelo servidor: retorno do magic link ou conclusão do
 * onboarding. Uma visita comum à Home nunca abre a oferta sozinha.
 */
export function deveMostrarOfertaRosePro({
  plano,
  entrada,
  cadastro,
}: EstadoOfertaRosePro): boolean {
  if (plano !== 'free') return false;
  return entrada === '1' || cadastro === 'concluido';
}
