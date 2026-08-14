// Camada temporária de registro de conclusão das práticas rápidas,
// baseada em localStorage. Não usa a tabela `sessoes` existente porque
// `sessoes.checkin_id` é NOT NULL + UNIQUE (uma sessão por check-in do
// dia) — não comporta múltiplas práticas avulsas no mesmo dia. Quando
// existir uma tabela própria no Supabase para isso, só este arquivo
// precisa ser trocado — `registrarConclusao`/`listarConclusoesDoDia`
// continuam com a mesma assinatura.
import type { ConclusaoPratica } from './tipos';

const JANELA_IDEMPOTENCIA_MS = 5000;

function chaveDoDia(usuariaId: string, data: string): string {
  return `praticas:conclusoes:${usuariaId}:${data}`;
}

function lerConclusoesDoDia(usuariaId: string, data: string): ConclusaoPratica[] {
  try {
    const bruto = window.localStorage.getItem(chaveDoDia(usuariaId, data));
    return bruto ? (JSON.parse(bruto) as ConclusaoPratica[]) : [];
  } catch {
    return [];
  }
}

export function registrarConclusao(conclusao: ConclusaoPratica): void {
  const data = conclusao.concluidaEm.slice(0, 10);
  const existentes = lerConclusoesDoDia(conclusao.usuariaId, data);

  const instanteNovo = new Date(conclusao.concluidaEm).getTime();
  const jaRegistrada = existentes.some((existente) => {
    if (existente.praticaId !== conclusao.praticaId) return false;
    const diferencaMs = Math.abs(new Date(existente.concluidaEm).getTime() - instanteNovo);
    return diferencaMs < JANELA_IDEMPOTENCIA_MS;
  });
  if (jaRegistrada) return;

  const atualizadas = [...existentes, conclusao];
  try {
    window.localStorage.setItem(chaveDoDia(conclusao.usuariaId, data), JSON.stringify(atualizadas));
  } catch {
    // localStorage indisponível — conclusão não persiste, mas não quebra o fluxo
  }
}

export function listarConclusoesDoDia(usuariaId: string, data: string): ConclusaoPratica[] {
  return lerConclusoesDoDia(usuariaId, data);
}

export function listarTodasConclusoes(usuariaId: string): ConclusaoPratica[] {
  const prefixo = `praticas:conclusoes:${usuariaId}:`;
  const todas: ConclusaoPratica[] = [];
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const chaveArmazenada = window.localStorage.key(i);
      if (!chaveArmazenada || !chaveArmazenada.startsWith(prefixo)) continue;
      const bruto = window.localStorage.getItem(chaveArmazenada);
      if (!bruto) continue;
      todas.push(...(JSON.parse(bruto) as ConclusaoPratica[]));
    }
  } catch {
    return [];
  }
  return todas;
}
