// Id fixo da jornada de 9 módulos gerada por
// scripts/gerarSeedJornadaEstruturada.ts (supabase/migrations/0030) —
// permanece status='rascunho' até a validação da psicóloga. Nenhuma action
// de QA aceita um jornada_id vindo do client: é sempre esta constante,
// nunca outra jornada. Separada de actions.ts porque um arquivo 'use
// server' só pode exportar funções async.
export const JORNADA_RASCUNHO_ID = '22222222-2222-2222-2222-222222222222';
