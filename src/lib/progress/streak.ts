import { formatDateISO } from '@/lib/date';

export interface ProgressoDia {
  data: string;
  completou: boolean;
}

export interface Progresso7Dias {
  diasCompletos: number;
  diasConsecutivosAtuais: number;
  ultimos7Dias: ProgressoDia[];
}

export function calcularProgresso7Dias(
  datasCheckin: string[],
  hoje: Date
): Progresso7Dias {
  const completadas = new Set(datasCheckin);

  const ultimos7Dias: ProgressoDia[] = [];
  for (let i = 6; i >= 0; i--) {
    const dia = new Date(hoje);
    dia.setDate(dia.getDate() - i);
    const data = formatDateISO(dia);
    ultimos7Dias.push({ data, completou: completadas.has(data) });
  }

  const diasCompletos = ultimos7Dias.filter((d) => d.completou).length;

  let diasConsecutivosAtuais = 0;
  for (let i = ultimos7Dias.length - 1; i >= 0; i--) {
    if (ultimos7Dias[i].completou) {
      diasConsecutivosAtuais++;
    } else {
      break;
    }
  }

  return { diasCompletos, diasConsecutivosAtuais, ultimos7Dias };
}

export function calcularMelhorSequencia(datasCheckin: string[]): number {
  if (datasCheckin.length === 0) {
    return 0;
  }

  const datasOrdenadas = Array.from(new Set(datasCheckin)).sort();

  let melhor = 1;
  let atual = 1;

  for (let i = 1; i < datasOrdenadas.length; i++) {
    const anterior = new Date(`${datasOrdenadas[i - 1]}T00:00:00`);
    const atualData = new Date(`${datasOrdenadas[i]}T00:00:00`);
    const diffDias = Math.round((atualData.getTime() - anterior.getTime()) / 86_400_000);

    atual = diffDias === 1 ? atual + 1 : 1;
    melhor = Math.max(melhor, atual);
  }

  return melhor;
}

export function formatarSequencia(dias: number): string {
  if (dias === 1) {
    return '1 dia seguido';
  }
  return `${dias} dias seguidos`;
}

export interface DescricaoSequencia {
  titulo: string;
  mensagem: string;
}

export interface DescreverSequenciaParams {
  diasConsecutivosAtuais: number;
  totalCheckins: number;
  // 7 posições, do dia mais antigo ao mais recente — o último é hoje.
  // Normalmente vem de `ultimos7Dias.map((d) => d.completou)` (ver
  // Progresso7Dias acima).
  diasAtivosUltimos7: boolean[];
  fezCheckinHoje: boolean;
}

export function descreverSequencia(params: DescreverSequenciaParams): DescricaoSequencia {
  const { diasConsecutivosAtuais, totalCheckins, diasAtivosUltimos7, fezCheckinHoje } = params;

  if (totalCheckins === 0) {
    return {
      titulo: 'Comece hoje sua jornada',
      mensagem: 'Toda jornada começa com um passo — e hoje pode ser o seu.',
    };
  }

  if (fezCheckinHoje) {
    const unidade = diasConsecutivosAtuais === 1 ? 'dia' : 'dias';
    return {
      titulo: `${diasConsecutivosAtuais} ${unidade} de sequência`,
      mensagem: 'Que lindo ver você priorizando você.',
    };
  }

  // Sem check-in hoje: em vez de tratar "um dia perdido" e "uma semana
  // inteira sem atividade" da mesma forma (o que a versão antiga fazia,
  // por não ter os últimos 7 dias disponíveis), reconhece explicitamente
  // quantos dos últimos 7 dias tiveram check-in — nunca "perdeu"/"quebrou".
  const diasAtivosNaSemana = diasAtivosUltimos7.filter(Boolean).length;

  if (diasAtivosNaSemana === 0) {
    return {
      titulo: 'Você pode recomeçar hoje',
      mensagem: 'Nenhum dos últimos 7 dias teve registro — você pode recomeçar quando fizer sentido para você.',
    };
  }

  return {
    titulo: 'Você pode recomeçar hoje',
    mensagem: `Você cuidou de si em ${diasAtivosNaSemana} dos últimos 7 dias.`,
  };
}
