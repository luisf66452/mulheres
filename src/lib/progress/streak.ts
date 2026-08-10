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
