// src/lib/praticas-catalogo/buscarPraticasAudioPublicadas.test.ts
import { describe, it, expect, vi } from 'vitest';
import { buscarPraticasAudioPublicadas } from './buscarPraticasAudioPublicadas';

function criarQueryEncadeavel(retorno: { data: unknown; error: unknown }) {
  const query: Record<string, unknown> = {};
  query.select = vi.fn().mockReturnValue(query);
  query.eq = vi.fn().mockReturnValue(query);
  query.then = (resolve: (v: typeof retorno) => void) => resolve(retorno);
  return query;
}

describe('buscarPraticasAudioPublicadas', () => {
  it('busca de praticas_catalogo (teaser, legível mesmo por usuária free em conteúdo Pro)', async () => {
    const linha = {
      id: '1',
      categoria: 'aterramento',
      tipo: 'reflexao',
      titulo: 'Aterramento guiado',
      status: 'publicada',
      criado_em: '2026-01-01T00:00:00.000Z',
      duracao_segundos: 240,
      audio_status: 'publicada',
      is_pro: true,
    };
    const query = criarQueryEncadeavel({ data: [linha], error: null });
    const from = vi.fn().mockReturnValue(query);
    const supabase = { from } as never;

    const resultado = await buscarPraticasAudioPublicadas(supabase);

    expect(from).toHaveBeenCalledWith('praticas_catalogo');
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
