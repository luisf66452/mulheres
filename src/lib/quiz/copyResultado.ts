// Cópia da tela /comecar/resultado derivada das respostas do quiz — nunca
// inclui estatística/percentual inventado (ver Global Constraints do plano).
import { TEMAS_SENSIVEIS, type ObjetivoId, type TemaSensivelId } from '@/lib/perfil/personalizacao';
import type { IdentificacaoId, TempoDisponivelId } from './tipos';

const HEADLINE_POR_OBJETIVO: Record<ObjetivoId, string> = {
  fortalecer_autoestima: 'Fortalecer sua autoestima',
  cuidar_relacao_corpo: 'Cuidar da sua relação com o corpo',
  relacao_tranquila_comida: 'Ter uma relação mais tranquila com a comida',
  praticar_autocompaixao: 'Praticar autocompaixão',
  lidar_comparacao: 'Lidar melhor com a comparação',
  criar_ritual_diario: 'Criar seu ritual diário de cuidado',
  decidir_depois: 'Cuidar de você',
};

export function headlineParaObjetivo(objetivo: ObjetivoId): string {
  return `Seu plano: ${HEADLINE_POR_OBJETIVO[objetivo]}, 5 minutos por dia`;
}

const VALIDACAO_POR_IDENTIFICACAO: Record<IdentificacaoId, string> = {
  compara:
    'Comparar-se é humano, mas isso não precisa ser o fundo da sua rotina — dá pra treinar outro jeito de olhar pra você mesma.',
  evita_espelho:
    'Isso é mais comum do que parece — e não é falta de força de vontade, é falta de um espaço seguro pra começar.',
  nao_sabe_comecar:
    'Você não precisa ter um plano perfeito — só precisa de um primeiro passo pequeno, feito com constância.',
  quer_ir_mais_fundo:
    'Que bom que você já começou — agora é sobre aprofundar com constância, não sobre recomeçar do zero.',
};

export function validacaoParaIdentificacao(identificacao: IdentificacaoId): string {
  return VALIDACAO_POR_IDENTIFICACAO[identificacao];
}

const AJUSTE_GENERICO = 'Seu plano é feito pra se encaixar do seu jeito, sem regras rígidas.';

const AJUSTE_POR_TEMA: Partial<Record<TemaSensivelId, string>> = {
  corpo_aparencia: 'Vamos falar de corpo no seu ritmo, sem comparação e sem pressão.',
  alimentacao: 'Vamos no seu ritmo: sem dieta, sem contagem, sem julgamento.',
  comparacao: 'Aqui não tem ranking nem comparação — só o seu progresso.',
  autocritica: 'Vamos praticar um jeito mais gentil de falar com você mesma.',
};

export function ajusteParaTemasSensiveis(temas: TemaSensivelId[]): string {
  for (const tema of TEMAS_SENSIVEIS) {
    const frase = AJUSTE_POR_TEMA[tema.id];
    if (frase && temas.includes(tema.id)) return frase;
  }
  return AJUSTE_GENERICO;
}

const CONFIRMACAO_POR_TEMPO: Record<TempoDisponivelId, string> = {
  menos_5min: 'menos de 5 minutos por dia',
  '5_a_10min': '5 a 10 minutos por dia',
  mais_10min: 'mais de 10 minutos por dia, no seu ritmo',
};

export function confirmacaoParaTempoDisponivel(tempo: TempoDisponivelId): string {
  return `Seu plano cabe em ${CONFIRMACAO_POR_TEMPO[tempo]} — sem precisar reorganizar sua rotina.`;
}
