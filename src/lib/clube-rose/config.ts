// Valores de Pétalas concedidas por atividade no Clube Rose.
// NÃO alterar esses valores sem autorização explícita do usuário.
export const VALORES_PETALAS = {
  checkinDiario: 5,
  praticaPrimeiraConclusao: 10,
  sessaoJornadaPrimeiraConclusao: 15,
  jornadaCompleta: 100,
  desafioSemanal: 30,
} as const;

// Teto de Pétalas para usuárias do plano gratuito — só para exibição na UI.
// O valor que de fato bloqueia o crédito está em
// supabase/migrations/0021_clube_rose_limite_petalas_gratuito.sql
// (petalas_limite_gratuito_atingido). Mantenha os dois sincronizados.
export const LIMITE_PETALAS_GRATUITO = 1000;
