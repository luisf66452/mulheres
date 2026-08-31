// Ponte entre o quiz (sem conta) e o onboarding (com conta) — ver spec
// 2026-08-31, seção "Ponte quiz → conta". Puramente aditiva: qualquer falha
// de leitura (localStorage indisponível, dado corrompido, chave ausente)
// retorna null, nunca lança — quem consome trata null como "sem quiz feito"
// e segue o fluxo manual normal (ver OnboardingClient).
import { validarObjetivos, validarTemasSensiveis } from '@/lib/perfil/personalizacao';
import { ehIdentificacaoValida, ehFrequenciaEmocionalValida, ehTempoDisponivelValido, type RespostasQuiz } from './tipos';

const CHAVE = 'rose:quiz-respostas';

function localStorageDisponivel(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

export function salvarRespostasQuiz(respostas: RespostasQuiz): void {
  if (!localStorageDisponivel()) return;
  window.localStorage.setItem(CHAVE, JSON.stringify(respostas));
}

export function lerRespostasQuiz(): RespostasQuiz | null {
  if (!localStorageDisponivel()) return null;

  const bruto = window.localStorage.getItem(CHAVE);
  if (!bruto) return null;

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
      return null;
    }
    return dados as RespostasQuiz;
  } catch {
    return null;
  }
}

export function apagarRespostasQuiz(): void {
  if (!localStorageDisponivel()) return;
  window.localStorage.removeItem(CHAVE);
}
