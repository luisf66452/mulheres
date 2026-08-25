// Posição de reprodução do áudio guiado, salva localmente por dispositivo —
// nunca enviada ao banco (ver regra da Seção 6 do design). Cada prática tem
// sua própria chave, isolada das demais.
import type { PosicaoAudio } from './tipos';

const PREFIXO_CHAVE = 'rose:audio-posicao:';

function chave(praticaId: string): string {
  return `${PREFIXO_CHAVE}${praticaId}`;
}

function localStorageDisponivel(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

export function lerPosicao(praticaId: string): number | null {
  if (!localStorageDisponivel()) return null;

  const bruto = window.localStorage.getItem(chave(praticaId));
  if (!bruto) return null;

  try {
    const dados = JSON.parse(bruto) as PosicaoAudio;
    if (typeof dados.segundos !== 'number' || Number.isNaN(dados.segundos)) return null;
    return dados.segundos;
  } catch {
    return null;
  }
}

export function salvarPosicao(praticaId: string, segundos: number): void {
  if (!localStorageDisponivel()) return;

  const dados: PosicaoAudio = {
    praticaId,
    segundos,
    atualizadaEm: new Date().toISOString(),
  };
  window.localStorage.setItem(chave(praticaId), JSON.stringify(dados));
}

export function apagarPosicao(praticaId: string): void {
  if (!localStorageDisponivel()) return;
  window.localStorage.removeItem(chave(praticaId));
}
