// Empacotador ZIP mínimo, método STORE (sem compressão) — sem dependência
// externa. Decisão registrada em
// docs/superpowers/plans/2026-08-24-exportacao-dados.md (Task 3): os
// arquivos são CSVs de texto pessoal, tipicamente pequenos — o ganho de
// DEFLATE não compensa uma dependência nova só para este caso de uso. STORE
// é um método válido da spec ZIP; qualquer descompactador padrão o lê sem
// nenhum tratamento especial.

// Tabela de CRC32 (polinômio padrão 0xEDB88320, usado pelo ZIP/gzip/PNG).
const TABELA_CRC32 = (() => {
  const tabela = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    tabela[n] = c >>> 0;
  }
  return tabela;
})();

function crc32(dados: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < dados.length; i++) {
    crc = TABELA_CRC32[(crc ^ dados[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export type ArquivoZip = { nome: string; conteudo: string };

// Formato de data/hora do MS-DOS exigido pelo cabeçalho ZIP (bits
// empacotados: ano desde 1980, mês, dia / hora, minuto, segundo÷2).
function dataHoraDos(agora: Date): { data: number; hora: number } {
  const data =
    (((agora.getFullYear() - 1980) & 0x7f) << 9) | ((agora.getMonth() + 1) << 5) | agora.getDate();
  const hora = (agora.getHours() << 11) | (agora.getMinutes() << 5) | (agora.getSeconds() >> 1);
  return { data, hora };
}

export function criarZip(arquivos: ArquivoZip[], agora: Date = new Date()): Uint8Array {
  const encoder = new TextEncoder();
  const partesArquivo: Uint8Array[] = [];
  const partesCentral: Uint8Array[] = [];
  let deslocamento = 0;
  const { data, hora } = dataHoraDos(agora);

  for (const arquivo of arquivos) {
    const nomeBytes = encoder.encode(arquivo.nome);
    const conteudoBytes = encoder.encode(arquivo.conteudo);
    const crc = crc32(conteudoBytes);
    const tamanho = conteudoBytes.length;

    const cabecalhoLocal = new DataView(new ArrayBuffer(30));
    cabecalhoLocal.setUint32(0, 0x04034b50, true); // assinatura local
    cabecalhoLocal.setUint16(4, 20, true); // versão mínima para extrair
    cabecalhoLocal.setUint16(6, 0, true); // flags
    cabecalhoLocal.setUint16(8, 0, true); // método = 0 (STORE)
    cabecalhoLocal.setUint16(10, hora, true);
    cabecalhoLocal.setUint16(12, data, true);
    cabecalhoLocal.setUint32(14, crc, true);
    cabecalhoLocal.setUint32(18, tamanho, true); // tamanho comprimido = original (STORE)
    cabecalhoLocal.setUint32(22, tamanho, true); // tamanho original
    cabecalhoLocal.setUint16(26, nomeBytes.length, true);
    cabecalhoLocal.setUint16(28, 0, true); // extra field length

    partesArquivo.push(new Uint8Array(cabecalhoLocal.buffer), nomeBytes, conteudoBytes);

    const cabecalhoCentral = new DataView(new ArrayBuffer(46));
    cabecalhoCentral.setUint32(0, 0x02014b50, true); // assinatura central
    cabecalhoCentral.setUint16(4, 20, true); // versão que criou
    cabecalhoCentral.setUint16(6, 20, true); // versão mínima para extrair
    cabecalhoCentral.setUint16(8, 0, true); // flags
    cabecalhoCentral.setUint16(10, 0, true); // método
    cabecalhoCentral.setUint16(12, hora, true);
    cabecalhoCentral.setUint16(14, data, true);
    cabecalhoCentral.setUint32(16, crc, true);
    cabecalhoCentral.setUint32(20, tamanho, true);
    cabecalhoCentral.setUint32(24, tamanho, true);
    cabecalhoCentral.setUint16(28, nomeBytes.length, true);
    cabecalhoCentral.setUint16(30, 0, true); // extra field length
    cabecalhoCentral.setUint16(32, 0, true); // comment length
    cabecalhoCentral.setUint16(34, 0, true); // número do disco
    cabecalhoCentral.setUint16(36, 0, true); // atributos internos
    cabecalhoCentral.setUint32(38, 0, true); // atributos externos
    cabecalhoCentral.setUint32(42, deslocamento, true); // offset do cabeçalho local

    partesCentral.push(new Uint8Array(cabecalhoCentral.buffer), nomeBytes);

    deslocamento += 30 + nomeBytes.length + tamanho;
  }

  const tamanhoArquivos = partesArquivo.reduce((soma, parte) => soma + parte.length, 0);
  const tamanhoCentral = partesCentral.reduce((soma, parte) => soma + parte.length, 0);

  const fimCentral = new DataView(new ArrayBuffer(22));
  fimCentral.setUint32(0, 0x06054b50, true); // assinatura EOCD
  fimCentral.setUint16(4, 0, true); // número deste disco
  fimCentral.setUint16(6, 0, true); // disco onde começa o diretório central
  fimCentral.setUint16(8, arquivos.length, true); // entradas neste disco
  fimCentral.setUint16(10, arquivos.length, true); // entradas totais
  fimCentral.setUint32(12, tamanhoCentral, true); // tamanho do diretório central
  fimCentral.setUint32(16, tamanhoArquivos, true); // offset do diretório central
  fimCentral.setUint16(20, 0, true); // comment length

  const resultado = new Uint8Array(tamanhoArquivos + tamanhoCentral + 22);
  let cursor = 0;
  for (const parte of [...partesArquivo, ...partesCentral, new Uint8Array(fimCentral.buffer)]) {
    resultado.set(parte, cursor);
    cursor += parte.length;
  }
  return resultado;
}
