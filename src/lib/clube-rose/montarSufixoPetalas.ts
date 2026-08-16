export function montarSufixoPetalas(params: {
  total: number;
  limiteGratuitoAtingido: boolean;
}): string {
  const { total, limiteGratuitoAtingido } = params;

  return (
    (total > 0 ? `?petalas=${total}` : '') +
    (limiteGratuitoAtingido ? `${total > 0 ? '&' : '?'}limitePetalas=1` : '')
  );
}
