import { describe, it, expect } from 'vitest';
import { escaparCelulaCsv, paraCsv } from './csv';

describe('escaparCelulaCsv', () => {
  it('não altera texto comum', () => {
    expect(escaparCelulaCsv('texto normal')).toBe('texto normal');
  });

  it('envolve em aspas e escapa aspas duplicadas quando o valor contém vírgula, aspas ou quebra de linha', () => {
    expect(escaparCelulaCsv('a,b')).toBe('"a,b"');
    expect(escaparCelulaCsv('ela disse "oi"')).toBe('"ela disse ""oi"""');
    expect(escaparCelulaCsv('linha1\nlinha2')).toBe('"linha1\nlinha2"');
  });

  it('prefixa com apóstrofo valores que começam com =, +, - ou @ (formula injection)', () => {
    expect(escaparCelulaCsv('=cmd|" /C calc"!A1')).toBe(`"'=cmd|"" /C calc""!A1"`);
    expect(escaparCelulaCsv('+1+1')).toBe("'+1+1");
    expect(escaparCelulaCsv('-2+3')).toBe("'-2+3");
    expect(escaparCelulaCsv('@SUM(A1:A2)')).toBe("'@SUM(A1:A2)");
  });

  it('prefixa mesmo quando há espaços, tabulação ou quebra de linha ANTES do caractere perigoso', () => {
    expect(escaparCelulaCsv('   =PERIGO()')).toBe("'   =PERIGO()");
    expect(escaparCelulaCsv('\t=PERIGO()')).toBe("'\t=PERIGO()");
    expect(escaparCelulaCsv('\n=PERIGO()')).toBe('"\'\n=PERIGO()"');
  });

  it('não prefixa quando o caractere perigoso não está no início (depois de remover espaços à esquerda)', () => {
    expect(escaparCelulaCsv('valor = 10')).toBe('valor = 10');
    expect(escaparCelulaCsv('e-mail@exemplo.com')).toBe('e-mail@exemplo.com');
  });

  it('trata null/undefined como célula vazia', () => {
    expect(escaparCelulaCsv(null)).toBe('');
    expect(escaparCelulaCsv(undefined)).toBe('');
  });

  it('serializa objetos/arrays (ex.: jsonb) como JSON antes de escapar', () => {
    expect(escaparCelulaCsv({ a: 1 })).toBe('"{""a"":1}"');
    expect(escaparCelulaCsv(['x', 'y'])).toBe('"[""x"",""y""]"');
  });
});

describe('paraCsv', () => {
  it('gera cabeçalho seguido de uma linha por registro, na ordem das colunas informadas', () => {
    const csv = paraCsv(
      [
        { id: '1', humor: 5, texto_livre: 'dia bom' },
        { id: '2', humor: 2, texto_livre: 'a,b' },
      ],
      ['id', 'humor', 'texto_livre']
    );

    const linhas = csv.split('\r\n');
    expect(linhas[0]).toBe('id,humor,texto_livre');
    expect(linhas[1]).toBe('1,5,dia bom');
    expect(linhas[2]).toBe('2,2,"a,b"');
  });

  it('gera só o cabeçalho quando não há registros', () => {
    const csv = paraCsv([], ['id', 'humor']);
    expect(csv).toBe('id,humor\r\n');
  });
});
