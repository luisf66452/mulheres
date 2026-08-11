export function decidirTrocaDeJornada(params: {
  jornadaAtivaAtual: { id: string; jornadaId: string } | null;
  jornadaAlvoId: string;
  progressoExistenteNoAlvo: { id: string; diasCompletados: number } | null;
}): {
  pausar: { id: string } | null;
  ativar: { id: string; diasCompletados: number } | 'criar_nova';
} {
  const pausar =
    params.jornadaAtivaAtual && params.jornadaAtivaAtual.jornadaId !== params.jornadaAlvoId
      ? { id: params.jornadaAtivaAtual.id }
      : null;

  const ativar = params.progressoExistenteNoAlvo
    ? { id: params.progressoExistenteNoAlvo.id, diasCompletados: params.progressoExistenteNoAlvo.diasCompletados }
    : ('criar_nova' as const);

  return { pausar, ativar };
}
