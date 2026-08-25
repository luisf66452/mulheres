// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PraticaBibliotecaPage from './page';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  usePathname: () => '/praticas/p1',
}));

vi.mock('@/lib/supabase/server', () => ({ createSupabaseServerClient: vi.fn() }));

import { createSupabaseServerClient } from '@/lib/supabase/server';

type PraticaCatalogoLinha = {
  id: string;
  titulo: string;
  categoria: string;
  tipo: string;
  status: string;
  audio_status: string;
  is_pro: boolean;
  criado_em: string;
};

type PraticaLinha = {
  id: string;
  titulo: string;
  conteudo: string;
  categoria: string;
  status: string;
  is_pro: boolean;
  audio_status?: string;
  audio_url?: string | null;
  duracao_segundos?: number | null;
  transcricao?: string | null;
};

function criarMetadadoCatalogo(pratica: PraticaLinha): PraticaCatalogoLinha {
  return {
    id: pratica.id,
    titulo: pratica.titulo,
    categoria: pratica.categoria,
    tipo: 'reflexao',
    status: pratica.status,
    audio_status: pratica.audio_status ?? 'rascunho',
    is_pro: pratica.is_pro,
    criado_em: '2026-01-01T00:00:00.000Z',
  };
}

// `praticaBase` simula o que a tabela base `praticas` devolve — a RLS
// (migração 20260825060150_praticas_rls_is_pro.sql) faz essa consulta
// devolver `null` quando a prática é is_pro e a usuária não é premium, mesmo
// que o metadado em praticas_catalogo continue disponível.
function criarSupabaseFake(
  praticaBase: PraticaLinha | null,
  praticaCatalogo: PraticaCatalogoLinha | null,
  plano: 'free' | 'premium' | null
) {
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user: plano === null ? null : { id: 'usuaria-1' } } })) },
    from(tabela: string) {
      if (tabela === 'praticas') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: async () => ({ data: praticaBase, error: praticaBase ? null : { code: 'PGRST116' } }),
              }),
            }),
          }),
        };
      }
      if (tabela === 'praticas_catalogo') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: async () => ({
                  data: praticaCatalogo,
                  error: praticaCatalogo ? null : { code: 'PGRST116' },
                }),
              }),
            }),
          }),
        };
      }
      if (tabela === 'perfis') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: plano ? { plano } : null, error: null }),
            }),
          }),
        };
      }
      throw new Error(`tabela inesperada no fake: ${tabela}`);
    },
  };
}

beforeEach(() => {
  // jsdom não implementa play()/pause() em <audio> — stub necessário pro
  // PlayerAudio renderizado dentro da página.
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = vi.fn();
});

describe('PraticaBibliotecaPage — paywall Pro server-side', () => {
  it('mostra o conteúdo normalmente quando a prática não é Pro', async () => {
    const pratica: PraticaLinha = {
      id: 'p1',
      titulo: 'Respiração',
      conteudo: 'texto completo',
      categoria: 'aterramento',
      status: 'publicada',
      is_pro: false,
    };
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseFake(pratica, criarMetadadoCatalogo(pratica), null) as unknown as Awaited<
        ReturnType<typeof createSupabaseServerClient>
      >
    );
    const jsx = await PraticaBibliotecaPage({ params: Promise.resolve({ id: 'p1' }) });
    render(jsx);
    expect(screen.getByText('texto completo')).toBeInTheDocument();
  });

  it('bloqueia o conteúdo Pro para uma usuária sem sessão (não confia em cliente nenhum)', async () => {
    // Metadado vem de praticas_catalogo (sempre legível); a tabela base nunca
    // chega a ser necessária pro caso de paywall.
    const metadado = criarMetadadoCatalogo({
      id: 'p2',
      titulo: 'Prática avançada',
      conteudo: 'conteúdo pago',
      categoria: 'aterramento',
      status: 'publicada',
      is_pro: true,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseFake(null, metadado, null) as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>
    );
    const jsx = await PraticaBibliotecaPage({ params: Promise.resolve({ id: 'p2' }) });
    render(jsx);
    expect(screen.queryByText('conteúdo pago')).not.toBeInTheDocument();
    expect(screen.getAllByText(/Rose Pro/i).length).toBeGreaterThan(0);
  });

  it('bloqueia o conteúdo Pro para uma usuária logada no plano free e mostra o paywall em vez de 404 (a RLS nega a linha base, mas o metadado do catálogo continua disponível)', async () => {
    const metadado = criarMetadadoCatalogo({
      id: 'p3',
      titulo: 'Prática avançada',
      conteudo: 'conteúdo pago',
      categoria: 'aterramento',
      status: 'publicada',
      is_pro: true,
    });
    // `praticaBase` é null propositalmente: reproduz a RLS que esconde a
    // linha inteira de praticas para free numa prática is_pro=true.
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseFake(null, metadado, 'free') as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>
    );
    const jsx = await PraticaBibliotecaPage({ params: Promise.resolve({ id: 'p3' }) });
    render(jsx);
    expect(screen.queryByText('conteúdo pago')).not.toBeInTheDocument();
    expect(screen.getAllByText(/Rose Pro/i).length).toBeGreaterThan(0);
  });

  it('libera o conteúdo Pro para uma usuária premium', async () => {
    const pratica: PraticaLinha = {
      id: 'p4',
      titulo: 'Prática avançada',
      conteudo: 'conteúdo pago',
      categoria: 'aterramento',
      status: 'publicada',
      is_pro: true,
    };
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseFake(pratica, criarMetadadoCatalogo(pratica), 'premium') as unknown as Awaited<
        ReturnType<typeof createSupabaseServerClient>
      >
    );
    const jsx = await PraticaBibliotecaPage({ params: Promise.resolve({ id: 'p4' }) });
    render(jsx);
    expect(screen.getByText('conteúdo pago')).toBeInTheDocument();
  });

  it('cai em notFound quando o metadado do catálogo não existe (id inválido ou não publicada)', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseFake(null, null, null) as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>
    );
    await expect(PraticaBibliotecaPage({ params: Promise.resolve({ id: 'inexistente' }) })).rejects.toThrow(
      'NEXT_NOT_FOUND'
    );
  });
});

describe('PraticaBibliotecaPage — PlayerAudio', () => {
  it('mostra o PlayerAudio quando a prática tem áudio completo publicado', async () => {
    const pratica: PraticaLinha = {
      id: 'p5',
      titulo: 'Respiração guiada',
      conteudo: 'texto completo',
      categoria: 'aterramento',
      status: 'publicada',
      is_pro: false,
      audio_status: 'publicada',
      audio_url: 'https://cdn.exemplo.com/respiracao.mp3',
      duracao_segundos: 180,
      transcricao: 'Sente-se confortavelmente...',
    };
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseFake(pratica, criarMetadadoCatalogo(pratica), null) as unknown as Awaited<
        ReturnType<typeof createSupabaseServerClient>
      >
    );
    const jsx = await PraticaBibliotecaPage({ params: Promise.resolve({ id: 'p5' }) });
    render(jsx);
    expect(screen.getByRole('button', { name: /Tocar áudio de Respiração guiada/ })).toBeInTheDocument();
  });

  it('não mostra o PlayerAudio quando o áudio ainda está em rascunho', async () => {
    const pratica: PraticaLinha = {
      id: 'p6',
      titulo: 'Prática sem áudio pronto',
      conteudo: 'texto completo',
      categoria: 'aterramento',
      status: 'publicada',
      is_pro: false,
      audio_status: 'rascunho',
      audio_url: 'https://cdn.exemplo.com/rascunho.mp3',
      duracao_segundos: 180,
      transcricao: 'texto',
    };
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseFake(pratica, criarMetadadoCatalogo(pratica), null) as unknown as Awaited<
        ReturnType<typeof createSupabaseServerClient>
      >
    );
    const jsx = await PraticaBibliotecaPage({ params: Promise.resolve({ id: 'p6' }) });
    render(jsx);
    expect(screen.queryByTestId('elemento-audio')).not.toBeInTheDocument();
  });

  it('não mostra o PlayerAudio quando faltam campos de mídia (audio_url ausente)', async () => {
    const pratica: PraticaLinha = {
      id: 'p7',
      titulo: 'Prática com dados incompletos',
      conteudo: 'texto completo',
      categoria: 'aterramento',
      status: 'publicada',
      is_pro: false,
      audio_status: 'publicada',
      audio_url: null,
      duracao_segundos: null,
      transcricao: null,
    };
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseFake(pratica, criarMetadadoCatalogo(pratica), null) as unknown as Awaited<
        ReturnType<typeof createSupabaseServerClient>
      >
    );
    const jsx = await PraticaBibliotecaPage({ params: Promise.resolve({ id: 'p7' }) });
    render(jsx);
    expect(screen.queryByTestId('elemento-audio')).not.toBeInTheDocument();
  });

  it('mostra o PlayerAudio para usuária premium quando a prática é Pro com áudio completo', async () => {
    const pratica: PraticaLinha = {
      id: 'p8',
      titulo: 'Prática Pro com áudio',
      conteudo: 'conteúdo pago',
      categoria: 'aterramento',
      status: 'publicada',
      is_pro: true,
      audio_status: 'publicada',
      audio_url: 'https://cdn.exemplo.com/pro.mp3',
      duracao_segundos: 240,
      transcricao: 'transcrição completa',
    };
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseFake(pratica, criarMetadadoCatalogo(pratica), 'premium') as unknown as Awaited<
        ReturnType<typeof createSupabaseServerClient>
      >
    );
    const jsx = await PraticaBibliotecaPage({ params: Promise.resolve({ id: 'p8' }) });
    render(jsx);
    expect(screen.getByRole('button', { name: /Tocar áudio de Prática Pro com áudio/ })).toBeInTheDocument();
  });
});
