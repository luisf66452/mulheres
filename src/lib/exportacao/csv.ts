// Escape de células CSV: RFC 4180 (aspas/vírgula/quebra de linha) + defesa
// contra formula injection (CSV injection) — planilhas como Excel/Google
// Sheets interpretam células que começam com =, +, - ou @ como fórmula,
// mesmo dentro de um .csv "inofensivo". O prefixo `'` (apóstrofo) força a
// leitura como texto literal na maioria das planilhas, sem alterar o valor
// visível para quem abre o arquivo.
const CARACTERES_PERIGOSOS = ['=', '+', '-', '@'];

export function escaparCelulaCsv(valor: unknown): string {
  if (valor === null || valor === undefined) return '';

  let texto = typeof valor === 'object' ? JSON.stringify(valor) : String(valor);

  const semEspacosIniciais = texto.replace(/^[ \t\r\n]+/, '');
  if (CARACTERES_PERIGOSOS.some((caractere) => semEspacosIniciais.startsWith(caractere))) {
    texto = `'${texto}`;
  }

  const precisaAspas = /[",\r\n]/.test(texto);
  const textoComAspasEscapadas = texto.replace(/"/g, '""');
  return precisaAspas ? `"${textoComAspasEscapadas}"` : textoComAspasEscapadas;
}

function linhaCsv(valores: unknown[]): string {
  return valores.map(escaparCelulaCsv).join(',') + '\r\n';
}

export function paraCsv<T extends Record<string, unknown>>(linhas: T[], colunas: string[]): string {
  const cabecalho = linhaCsv(colunas);
  const corpo = linhas.map((linha) => linhaCsv(colunas.map((coluna) => linha[coluna]))).join('');
  return cabecalho + corpo;
}
