// src/lib/praticas-catalogo/unificar.test.ts
import { describe, it, expect } from 'vitest';
import { unificarCatalogo } from './unificar';
import type { PraticaRapida } from '@/lib/praticas-conteudo/tipos';
import type { PraticaCatalogo } from '@/lib/supabase/types';

const PRATICA_RAPIDA_EXEMPLO: PraticaRapida = {
  id: 'respiracao',
  categoria: 'respiracao',
  titulo: 'Respiração',
  descricaoCurta: 'Respire fundo e reconecte-se.',
  duracaoMinutos: 3,
  duracaoLabel: '3 min',
  corCartao: 'salvia',
  nivel: 'iniciante',
  premium: false,
  gratuita: true,
  midia: { tipo: null, url: null, miniaturaUrl: null },
};

function praticaAudioExemplo(overrides: Partial<PraticaCatalogo> = {}): PraticaCatalogo {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    categoria: 'autocompaixao',
    tipo: 'reflexao',
    titulo: 'Pausa de autocompaixão',
    status: 'publicada',
    criado_em: '2026-01-01T00:00:00.000Z',
    duracao_segundos: 300,
    audio_status: 'publicada',
    is_pro: true,
    ...overrides,
  };
}

describe('unificarCatalogo', () => {
  it('inclui todas as práticas rápidas com fonte "rapida" e id prefixado', () => {
    const resultado = unificarCatalogo([PRATICA_RAPIDA_EXEMPLO], []);
    expect(resultado).toHaveLength(1);
    expect(resultado[0]).toMatchObject({
      id: 'rapida:respiracao',
      fonte: 'rapida',
      idOriginal: 'respiracao',
      href: '/praticas/respiracao',
      titulo: 'Respiração',
      temAudio: false,
    });
  });

  it('inclui práticas de áudio com fonte "audio" e id prefixado, sem colidir com práticas rápidas', () => {
    const audio = praticaAudioExemplo({ id: 'respiracao' }); // mesmo slug textual, fonte diferente
    const resultado = unificarCatalogo([PRATICA_RAPIDA_EXEMPLO], [audio]);
    const ids = resultado.map((item) => item.id);
    expect(ids).toEqual(['rapida:respiracao', 'audio:respiracao']);
    expect(new Set(ids).size).toBe(2);
  });

  it('marca temAudio=true para itens vindos de praticas_catalogo, mesmo Pro (teaser)', () => {
    const resultado = unificarCatalogo([], [praticaAudioExemplo()]);
    expect(resultado[0].temAudio).toBe(true);
    expect(resultado[0].href).toBe('/praticas/11111111-1111-1111-1111-111111111111');
  });

  it('usa a categoria da prática de áudio como categoria do item unificado', () => {
    const resultado = unificarCatalogo([], [praticaAudioExemplo({ categoria: 'aterramento' })]);
    expect(resultado[0].categoria).toBe('aterramento');
  });

  it('formata a duração da prática de áudio a partir de duracao_segundos', () => {
    const resultado = unificarCatalogo([], [praticaAudioExemplo({ duracao_segundos: 125 })]);
    expect(resultado[0].duracaoLabel).toBe('3 min');
  });

  it('usa uma descrição genérica de teaser para a prática de áudio, sem expor conteúdo protegido', () => {
    const resultado = unificarCatalogo([], [praticaAudioExemplo()]);
    expect(resultado[0].descricaoCurta).toBe('Prática guiada em áudio.');
  });

  it('retorna lista vazia quando ambos os catálogos estão vazios', () => {
    expect(unificarCatalogo([], [])).toEqual([]);
  });
});
