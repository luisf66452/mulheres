import type { EstadoGeral, AlimentacaoPercebida } from '@/lib/supabase/types';

const QUADRANTES_CONFORTAVEIS: EstadoGeral[] = ['alta_energia_conforto', 'baixa_energia_conforto'];

export function derivarHumor(estadoGeral: EstadoGeral, intensidade: number): number {
  if (intensidade === 3) {
    return 3;
  }

  const confortavel = QUADRANTES_CONFORTAVEIS.includes(estadoGeral);
  const intensidadeAlta = intensidade >= 4;

  if (confortavel && intensidadeAlta) return 5;
  if (confortavel && !intensidadeAlta) return 4;
  if (!confortavel && !intensidadeAlta) return 2;
  return 1;
}

// A pergunta da etapa 4 mede conforto (1 = muito desconfortável, 5 = muito
// confortável) -- a mesma direção que imagem_corporal já tem hoje. Esta
// função existe nomeada e testada para travar essa direção: se a escala da
// UI for invertida no futuro, o teste desta função pega o erro na hora.
export function derivarImagemCorporal(confortoCorporal: number): number {
  return confortoCorporal;
}

const MAPA_COMIDA: Record<AlimentacaoPercebida, number | null> = {
  tranquila: 5,
  satisfeita: 5,
  indiferente: 4,
  confusa: 3,
  ansiosa: 2,
  culpada: 2,
  vontade_punir: 1,
  prefiro_nao_responder: null,
};

export function derivarComida(alimentacaoPercebida: AlimentacaoPercebida): number | null {
  return MAPA_COMIDA[alimentacaoPercebida];
}
