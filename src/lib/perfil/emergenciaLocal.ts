import type { PaisSuportado } from './pais';

// Números de emergência locais, fixos aqui no código (nunca vêm do banco).
// Existem para que o bloco de orientação de /seguranca nunca dependa de uma
// consulta ao Supabase — mesmo que a tabela recursos_seguranca esteja vazia
// ou a consulta falhe, este mapa continua disponível (Seção 7 do design de
// evolução da Rose: "resiliente... a tela ainda mostra a orientação
// genérica de emergência local").
//
// Números conferidos em 2026-08-24 nas mesmas fontes oficiais usadas para
// popular recursos_seguranca (ver
// docs/superpowers/plans/2026-08-24-espaco-seguranca.md):
//   PT: Portal gov.pt — Contactos de emergência em Portugal
//       https://www.gov.pt/guias/contactos-de-emergencia-em-portugal
//   BR: Ministério da Saúde — SAMU 192
//       https://www.gov.br/saude/pt-br/composicao/saes/samu-192
export const NUMERO_EMERGENCIA_LOCAL: Record<PaisSuportado, { numero: string; rotulo: string }> = {
  PT: { numero: '112', rotulo: '112 — Emergência (número europeu)' },
  BR: { numero: '192', rotulo: '192 — SAMU (emergência médica)' },
};
