export interface PontoGrafico {
  x: number;
  y: number;
}

const ESCALA_MIN = 1;
const ESCALA_MAX = 5;

export function calcularPontosLinha(
  valores: number[],
  largura: number,
  altura: number
): PontoGrafico[] {
  if (valores.length === 0) {
    return [];
  }

  const paraY = (valor: number) =>
    altura - ((valor - ESCALA_MIN) / (ESCALA_MAX - ESCALA_MIN)) * altura;

  if (valores.length === 1) {
    return [{ x: 0, y: paraY(valores[0]) }];
  }

  const passoX = largura / (valores.length - 1);

  return valores.map((valor, indice) => ({
    x: indice * passoX,
    y: paraY(valor),
  }));
}
