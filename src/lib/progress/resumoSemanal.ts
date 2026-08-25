import { ROTULO_HUMOR } from './semana';
import { EMOCOES_POR_QUADRANTE, FATORES_DISPONIVEIS } from '@/lib/checkin/opcoesCheckin';
import type { EstadoGeral } from '@/lib/supabase/types';

// Ainda sem revisão da psicóloga para rótulos clínicos de imagem corporal e
// alimentação — por isso usamos rótulos neutros por nível (mesma escala 1-5
// de humor), nunca "bom"/"ruim"/"normal"/"anormal". Ver seção "Conteúdo
// clínico... pendente de revisão" do design.
const ROTULO_IMAGEM_CORPORAL: Record<number, string> = {
  1: 'Nível 1',
  2: 'Nível 2',
  3: 'Nível 3',
  4: 'Nível 4',
  5: 'Nível 5',
};

const ROTULO_ALIMENTACAO: Record<number, string> = {
  1: 'Nível 1',
  2: 'Nível 2',
  3: 'Nível 3',
  4: 'Nível 4',
  5: 'Nível 5',
};

const VALORES_EXCLUIDOS_DO_DESTAQUE = new Set(['prefiro_nao_responder']);

// O "tema em destaque" só pode ser calculado a partir de valores que
// pertencem às listas fechadas reais da UI de check-in (mesmas opções de
// emocao_especifica/fatores oferecidas em CheckinFormClient.tsx, via
// src/lib/checkin/opcoesCheckin.ts). Isso é essencial: alguns desses campos
// aceitam texto livre digitado pela usuária sem validação contra uma lista
// fechada (ex. o campo "outro fator" do check-in) — se esse texto livre
// pudesse virar tema em destaque, a Rose ecoaria literalmente palavras da
// usuária, inclusive vocabulário proibido, na frase gerada.
const EMOCOES_VALIDAS = new Set(
  Object.values(EMOCOES_POR_QUADRANTE).flatMap((emocoes) => emocoes.map((e) => e.palavra))
);
const FATORES_VALIDOS = new Set(FATORES_DISPONIVEIS);

export interface CheckinResumoSemanal {
  data: string;
  humor: number;
  imagem_corporal: number;
  comida: number | null;
  estado_geral: EstadoGeral | null;
  emocao_especifica: string | null;
  fatores: string[] | null;
}

export interface ResumoSemanalParams {
  checkinsSemana: CheckinResumoSemanal[];
  checkinsSemanaAnterior: CheckinResumoSemanal[];
  diasDaSemana: string[];
  datasAtividadesConcluidas: string[];
}

export interface ItemDistribuicao {
  rotulo: string;
  quantidade: number;
}

export interface TemaDestaque {
  rotulo: string;
  ocorrencias: number;
}

export interface ComparacaoSemanaAnterior {
  disponivel: boolean;
  diasComCheckinSemanaAnterior: number;
}

export interface ResumoSemanal {
  temRegistros: boolean;
  diasComCheckin: number;
  totalAtividadesConcluidas: number;
  temaDestaque: TemaDestaque | null;
  distribuicaoHumor: ItemDistribuicao[];
  distribuicaoImagemCorporal: ItemDistribuicao[];
  distribuicaoAlimentacao: ItemDistribuicao[];
  comparacaoSemanaAnterior: ComparacaoSemanaAnterior | null;
  mensagem: string;
}

function contarPorNivel(valores: number[], rotulos: Record<number, string>): ItemDistribuicao[] {
  const contagem = new Map<number, number>();
  for (const valor of valores) {
    contagem.set(valor, (contagem.get(valor) ?? 0) + 1);
  }
  return Object.keys(rotulos)
    .map(Number)
    .sort((a, b) => a - b)
    .map((nivel) => ({ rotulo: rotulos[nivel], quantidade: contagem.get(nivel) ?? 0 }));
}

function calcularTemaDestaque(checkinsSemana: CheckinResumoSemanal[]): TemaDestaque | null {
  if (checkinsSemana.length < 3) {
    return null;
  }

  const contagem = new Map<string, number>();
  for (const checkin of checkinsSemana) {
    if (
      checkin.emocao_especifica &&
      !VALORES_EXCLUIDOS_DO_DESTAQUE.has(checkin.emocao_especifica) &&
      EMOCOES_VALIDAS.has(checkin.emocao_especifica)
    ) {
      contagem.set(checkin.emocao_especifica, (contagem.get(checkin.emocao_especifica) ?? 0) + 1);
    }
    for (const fator of checkin.fatores ?? []) {
      if (!VALORES_EXCLUIDOS_DO_DESTAQUE.has(fator) && FATORES_VALIDOS.has(fator)) {
        contagem.set(fator, (contagem.get(fator) ?? 0) + 1);
      }
    }
  }

  let destaque: TemaDestaque | null = null;
  for (const [rotulo, ocorrencias] of contagem) {
    if (ocorrencias >= 2 && (!destaque || ocorrencias > destaque.ocorrencias)) {
      destaque = { rotulo, ocorrencias };
    }
  }
  return destaque;
}

export function calcularResumoSemanal(params: ResumoSemanalParams): ResumoSemanal {
  const { checkinsSemana, checkinsSemanaAnterior, diasDaSemana, datasAtividadesConcluidas } = params;

  const diasComCheckin = new Set(checkinsSemana.map((c) => c.data)).size;
  const totalAtividadesConcluidas = datasAtividadesConcluidas.filter((data) =>
    diasDaSemana.includes(data)
  ).length;

  if (diasComCheckin === 0 && totalAtividadesConcluidas === 0) {
    return {
      temRegistros: false,
      diasComCheckin: 0,
      totalAtividadesConcluidas: 0,
      temaDestaque: null,
      distribuicaoHumor: [],
      distribuicaoImagemCorporal: [],
      distribuicaoAlimentacao: [],
      comparacaoSemanaAnterior: null,
      mensagem: 'Nenhum registro nesta semana ainda — quando você fizer um check-in, ele aparece aqui.',
    };
  }

  const distribuicaoHumor = contarPorNivel(checkinsSemana.map((c) => c.humor), ROTULO_HUMOR);
  const distribuicaoImagemCorporal = contarPorNivel(
    checkinsSemana.map((c) => c.imagem_corporal),
    ROTULO_IMAGEM_CORPORAL
  );
  const distribuicaoAlimentacao = contarPorNivel(
    checkinsSemana.map((c) => c.comida).filter((valor): valor is number => valor !== null),
    ROTULO_ALIMENTACAO
  );

  const temaDestaque = calcularTemaDestaque(checkinsSemana);

  const diasComCheckinSemanaAnterior = new Set(checkinsSemanaAnterior.map((c) => c.data)).size;
  const comparacaoDisponivel = diasComCheckin >= 3 && diasComCheckinSemanaAnterior >= 3;
  const comparacaoSemanaAnterior: ComparacaoSemanaAnterior = {
    disponivel: comparacaoDisponivel,
    diasComCheckinSemanaAnterior,
  };

  const partesMensagem = [`Nos seus registros, você fez check-in em ${diasComCheckin} dos 7 dias desta semana.`];
  if (totalAtividadesConcluidas > 0) {
    partesMensagem.push(
      `Você concluiu ${totalAtividadesConcluidas} ${
        totalAtividadesConcluidas === 1 ? 'prática' : 'práticas'
      } nesta semana.`
    );
  }
  if (temaDestaque) {
    partesMensagem.push(`"${temaDestaque.rotulo}" apareceu com mais frequência nos seus registros.`);
  }
  if (comparacaoDisponivel) {
    partesMensagem.push(
      `Na semana anterior, você registrou check-in em ${diasComCheckinSemanaAnterior} dos 7 dias.`
    );
  }

  return {
    temRegistros: true,
    diasComCheckin,
    totalAtividadesConcluidas,
    temaDestaque,
    distribuicaoHumor,
    distribuicaoImagemCorporal,
    distribuicaoAlimentacao,
    comparacaoSemanaAnterior,
    mensagem: partesMensagem.join(' '),
  };
}
