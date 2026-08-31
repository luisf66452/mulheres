// Ponte entre o quiz (sem conta) e o onboarding (com conta) — ver spec
// 2026-08-31, seção "Ponte quiz → conta". Puramente aditiva: qualquer falha
// de leitura (localStorage indisponível, dado corrompido, chave ausente)
// retorna null, nunca lança — quem consome trata null como "sem quiz feito"
// e segue o fluxo manual normal (ver OnboardingClient).
import { validarObjetivos, validarTemasSensiveis } from '@/lib/perfil/personalizacao';
import { ehIdentificacaoValida, ehFrequenciaEmocionalValida, ehTempoDisponivelValido, type RespostasQuiz } from './tipos';

const CHAVE = 'rose:quiz-respostas';

// Cache de referência estável: useSyncExternalStore (ver ResultadoClient)
// exige que getSnapshot retorne a MESMA referência entre chamadas quando
// nada mudou. Sem isso, cada leitura fazia um JSON.parse novo e devolvia
// um objeto novo, o que o React interpretava como "mudou sempre" e entrava
// em loop infinito de render. `cacheBruto === undefined` significa "ainda
// não há nada em cache"; qualquer outro valor (incluindo null) é comparado
// contra o que veio do localStorage para decidir se reaproveita `cacheDados`.
let cacheBruto: string | null | undefined = undefined;
let cacheDados: RespostasQuiz | null = null;

function invalidarCache(): void {
  cacheBruto = undefined;
  cacheDados = null;
}

function localStorageDisponivel(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

export function salvarRespostasQuiz(respostas: RespostasQuiz): void {
  if (!localStorageDisponivel()) return;
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(respostas));
  } catch {
    // localStorage pode lançar (cota excedida, storage bloqueado/particionado
    // em browsers in-app como Instagram/Facebook) — degrada para no-op.
    return;
  } finally {
    invalidarCache();
  }
}

export function lerRespostasQuiz(): RespostasQuiz | null {
  if (!localStorageDisponivel()) return null;

  let bruto: string | null;
  try {
    bruto = window.localStorage.getItem(CHAVE);
  } catch {
    return null;
  }

  if (cacheBruto !== undefined && bruto === cacheBruto) {
    return cacheDados;
  }

  if (!bruto) {
    cacheBruto = bruto;
    cacheDados = null;
    return null;
  }

  try {
    const dados = JSON.parse(bruto) as Partial<RespostasQuiz>;
    if (
      typeof dados.identificacao !== 'string' ||
      !ehIdentificacaoValida(dados.identificacao) ||
      typeof dados.frequenciaEmocional !== 'string' ||
      !ehFrequenciaEmocionalValida(dados.frequenciaEmocional) ||
      typeof dados.objetivo !== 'string' ||
      !validarObjetivos([dados.objetivo]) ||
      !Array.isArray(dados.temasSensiveis) ||
      !validarTemasSensiveis(dados.temasSensiveis) ||
      typeof dados.tempoDisponivel !== 'string' ||
      !ehTempoDisponivelValido(dados.tempoDisponivel)
    ) {
      cacheBruto = bruto;
      cacheDados = null;
      return null;
    }
    cacheBruto = bruto;
    cacheDados = dados as RespostasQuiz;
    return cacheDados;
  } catch {
    cacheBruto = bruto;
    cacheDados = null;
    return null;
  }
}

export function apagarRespostasQuiz(): void {
  invalidarCache();
  if (!localStorageDisponivel()) return;
  try {
    window.localStorage.removeItem(CHAVE);
  } catch {
    // idem: degrada para no-op em vez de lançar.
    return;
  }
}
