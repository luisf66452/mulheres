import { describe, it, expect } from 'vitest';
import { criarZip, type ArquivoZip } from './zip';

function decodificarZipStore(bytes: Uint8Array): Array<{ nome: string; conteudo: string }> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const decoder = new TextDecoder();
  const arquivos: Array<{ nome: string; conteudo: string }> = [];
  let cursor = 0;

  while (cursor < bytes.length) {
    const assinatura = view.getUint32(cursor, true);
    if (assinatura !== 0x04034b50) break; // fim dos cabeçalhos locais

    const tamanhoComprimido = view.getUint32(cursor + 18, true);
    const tamanhoNome = view.getUint16(cursor + 26, true);
    const tamanhoExtra = view.getUint16(cursor + 28, true);

    const inicioNome = cursor + 30;
    const nome = decoder.decode(bytes.slice(inicioNome, inicioNome + tamanhoNome));
    const inicioConteudo = inicioNome + tamanhoNome + tamanhoExtra;
    const conteudo = decoder.decode(bytes.slice(inicioConteudo, inicioConteudo + tamanhoComprimido));

    arquivos.push({ nome, conteudo });
    cursor = inicioConteudo + tamanhoComprimido;
  }

  return arquivos;
}

describe('criarZip', () => {
  it('produz um ZIP com a assinatura local correta e todos os arquivos, na ordem informada', () => {
    const arquivos: ArquivoZip[] = [
      { nome: 'checkins.csv', conteudo: 'id,humor\r\n1,5\r\n' },
      { nome: 'favoritos.csv', conteudo: 'id\r\n1\r\n' },
    ];

    const zip = criarZip(arquivos);
    const decodificado = decodificarZipStore(zip);

    expect(decodificado).toHaveLength(2);
    expect(decodificado[0]).toEqual({ nome: 'checkins.csv', conteudo: 'id,humor\r\n1,5\r\n' });
    expect(decodificado[1]).toEqual({ nome: 'favoritos.csv', conteudo: 'id\r\n1\r\n' });
  });

  it('preserva conteúdo com acentos/UTF-8 sem corromper', () => {
    const zip = criarZip([{ nome: 'reflexoes.csv', conteudo: 'texto,situação\r\n"oi",contração\r\n' }]);
    const decodificado = decodificarZipStore(zip);

    expect(decodificado[0].conteudo).toBe('texto,situação\r\n"oi",contração\r\n');
  });

  it('produz um ZIP vazio (só o End of Central Directory) quando não há arquivos', () => {
    const zip = criarZip([]);
    const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);

    expect(zip.length).toBe(22); // só o End of Central Directory Record
    expect(view.getUint32(0, true)).toBe(0x06054b50);
  });

  it('termina com o End of Central Directory contendo a contagem correta de arquivos', () => {
    const zip = criarZip([
      { nome: 'a.csv', conteudo: 'x' },
      { nome: 'b.csv', conteudo: 'y' },
      { nome: 'c.csv', conteudo: 'z' },
    ]);
    const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);

    // Os últimos 22 bytes são o End of Central Directory Record.
    const inicioEocd = zip.length - 22;
    expect(view.getUint32(inicioEocd, true)).toBe(0x06054b50);
    expect(view.getUint16(inicioEocd + 8, true)).toBe(3); // total de entradas neste disco
    expect(view.getUint16(inicioEocd + 10, true)).toBe(3); // total de entradas
  });
});
