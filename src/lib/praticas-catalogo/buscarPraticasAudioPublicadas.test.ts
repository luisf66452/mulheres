// src/lib/praticas-catalogo/buscarPraticasAudioPublicadas.test.ts
import { describe, it, expect, vi } from 'vitest';
import { buscarPraticasAudioPublicadas } from './buscarPraticasAudioPublicadas';

function criarQueryEncadeavel(retorno: { data: unknown; error: unknown }) {
  const query: Record<string, unknown> = {};
  query.select = vi.fn().mockReturnValue(query);
  query.eq = vi.fn().mockReturnValue(query);
  query.not = vi.fn().mockReturnValue(query);
  query.then = (resolve: (v: typeof retorno) => void) => resolve(retorno);
  return query;
}

describe('buscarPraticasAudioPublicadas', () => {
  it('retorna as práticas de áudio quando a consulta é bem-sucedida', async () => {
    const linha = {
      id: '1',
      categoria: 'aterramento',
      tipo: 'reflexao',
      titulo: 'Aterramento guiado',
      conteudo: 'Roteiro...',
      status: 'publicada',
      criado_em: '2026-01-01T00:00:00.000Z',
      audio_url: 'https://cdn.exemplo.com/a.mp3',
      duracao_segundos: 240,
      transcricao: 'Transcrição...',
      audio_status: 'publicada',
      is_pro: false,
    };
    const query = criarQueryEncadeavel({ data: [linha], error: null });
    const from = vi.fn().mockReturnValue(query);
    const supabase = { from } as never;

    const resultado = await buscarPraticasAudioPublicadas(supabase);

    expect(from).toHaveBeenCalledWith('praticas');
    expect(resultado).toEqual([linha]);
  });

  it('retorna lista vazia quando a consulta falha, em vez de lançar', async () => {
    const query = criarQueryEncadeavel({ data: null, error: new Error('falhou') });
    const from = vi.fn().mockReturnValue(query);
    const supabase = { from } as never;

    const resultado = await buscarPraticasAudioPublicadas(supabase);

    expect(resultado).toEqual([]);
  });
});
