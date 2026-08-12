export type IndiceIlustracao = 0 | 1 | 2 | 3 | 4;

export function hashIlustracao(jornadaId: string): IndiceIlustracao {
  const soma = [...jornadaId].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return (soma % 5) as IndiceIlustracao;
}

export function atribuirIlustracoes(
  jornadaIdsNaOrdemDeExibicao: string[]
): Map<string, IndiceIlustracao> {
  const usados = new Set<IndiceIlustracao>();
  const atribuicoes = new Map<string, IndiceIlustracao>();

  for (const id of jornadaIdsNaOrdemDeExibicao) {
    let indice = hashIlustracao(id);

    if (usados.has(indice) && usados.size < 5) {
      for (let i = 1; i <= 5; i++) {
        const candidato = ((indice + i) % 5) as IndiceIlustracao;
        if (!usados.has(candidato)) {
          indice = candidato;
          break;
        }
      }
    }

    usados.add(indice);
    atribuicoes.set(id, indice);
  }

  return atribuicoes;
}
