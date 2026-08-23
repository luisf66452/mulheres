// @vitest-environment node
//
// Testa a geração/reenfileiramento (passo 2) e o processamento de vencidas
// (passo 3) do cron isoladamente, mockando a leitura de progresso
// (gerarCandidatosParaUsuaria) e o envio de fato (enviarParaSubscricoes) —
// o que importa aqui é a ORQUESTRAÇÃO em cima de push_notificacoes: quando
// insere, quando revive uma linha morta, quando cancela, quando adia.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gerarEEnfileirar, processarVencidas } from './route';
import { gerarCandidatosParaUsuaria } from '@/lib/push/candidatos';
import { enviarParaSubscricoes } from '@/lib/push/enviar';
import type { PreferenciasNotificacao } from '@/lib/supabase/types';

vi.mock('@/lib/push/candidatos', () => ({ gerarCandidatosParaUsuaria: vi.fn() }));
vi.mock('@/lib/push/enviar', () => ({ enviarParaSubscricoes: vi.fn(), garantirVapidConfigurado: vi.fn() }));

const USUARIA_ID = 'usuaria-1';
const AGORA = new Date('2026-08-23T12:00:00.000Z');

type LinhaFake = {
  id: string;
  usuaria_id: string;
  categoria: string;
  dedup_key: string;
  status: string;
  tentativas: number;
  agendado_para: string;
  enviado_em: string | null;
  titulo: string | null;
  corpo: string | null;
  url: string | null;
  tag: string | null;
};

/** Fake mínimo de push_notificacoes: guarda linhas reais num array e suporta
 * só as operações que gerarEEnfileirar/processarVencidas de fato usam. */
function criarPushNotificacoesFake(linhasIniciais: LinhaFake[] = []) {
  const linhas = [...linhasIniciais];

  function from() {
    let filtroUsuaria: string | undefined;
    let filtroDedup: string | undefined;
    let filtroStatus: string | undefined;
    let filtroAgendadoAteAntes: string | undefined;

    const chain = {
      select: () => chain,
      eq: (coluna: string, valor: string) => {
        if (coluna === 'usuaria_id') filtroUsuaria = valor;
        if (coluna === 'dedup_key') filtroDedup = valor;
        if (coluna === 'status') filtroStatus = valor;
        if (coluna === 'id') filtroDedup = `id:${valor}`;
        return chain;
      },
      lte: (_coluna: string, valor: string) => {
        filtroAgendadoAteAntes = valor;
        return chain;
      },
      maybeSingle: async () => {
        const linha = linhas.find((l) => l.usuaria_id === filtroUsuaria && l.dedup_key === filtroDedup);
        return { data: linha ?? null, error: null };
      },
      insert: (payload: Partial<LinhaFake>) => {
        const nova: LinhaFake = {
          id: `nova-${linhas.length + 1}`,
          usuaria_id: payload.usuaria_id!,
          categoria: payload.categoria!,
          dedup_key: payload.dedup_key!,
          status: 'pendente',
          tentativas: 0,
          agendado_para: payload.agendado_para!,
          enviado_em: null,
          titulo: payload.titulo ?? null,
          corpo: payload.corpo ?? null,
          url: payload.url ?? null,
          tag: payload.tag ?? null,
        };
        linhas.push(nova);
        return { select: () => Promise.resolve({ data: [{ id: nova.id }], error: null }) };
      },
      update: (patch: Partial<LinhaFake>) => {
        return {
          eq: (coluna: string, valor: string) => {
            const alvo = coluna === 'id' ? linhas.find((l) => l.id === valor) : undefined;
            const aplicar = (l: LinhaFake) => Object.assign(l, patch);
            // update(...).eq('status','pendente').lte(...).select('*') — usado
            // por processarVencidas para reivindicar tudo que está vencido.
            const semSelectAinda = {
              lte: (_c: string, ateQuando: string) => ({
                select: async () => {
                  const alvos = linhas.filter(
                    (l) => l.status === 'pendente' && l.agendado_para <= ateQuando
                  );
                  alvos.forEach(aplicar);
                  return { data: alvos.map((l) => ({ ...l })), error: null };
                },
              }),
              select: async () => {
                if (alvo) aplicar(alvo);
                return { data: alvo ? [{ id: alvo.id }] : [], error: null };
              },
            };
            if (alvo) aplicar(alvo);
            return semSelectAinda;
          },
        };
      },
      gte: () => Promise.resolve({ data: [], error: null }),
    };
    void filtroStatus;
    void filtroAgendadoAteAntes;
    return chain;
  }

  return { from: vi.fn(from), linhas };
}

function criarSubscriptionsFake(subs: { id: string; endpoint: string; p256dh: string; auth: string }[]) {
  return {
    select: () => ({ eq: () => Promise.resolve({ data: subs, error: null }) }),
  };
}

function preferenciasPadrao(overrides: Partial<PreferenciasNotificacao> = {}): PreferenciasNotificacao {
  return {
    usuaria_id: USUARIA_ID,
    lembrete_checkin: true,
    lembrete_jornada: true,
    lembrete_praticas: true,
    avisos_novidades: false,
    resumo_semanal: true,
    lembrete_inatividade: true,
    dias_semana: [0, 1, 2, 3, 4, 5, 6],
    horario_silencio_inicio: '21:30:00',
    horario_silencio_fim: '09:00:00',
    pausada_ate: null,
    atualizada_em: AGORA.toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.mocked(gerarCandidatosParaUsuaria).mockReset();
  vi.mocked(enviarParaSubscricoes).mockReset();
});

describe('gerarEEnfileirar', () => {
  it('tarefa pendente nova: insere uma linha pendente para a dedup_key', async () => {
    vi.mocked(gerarCandidatosParaUsuaria).mockResolvedValue([
      { categoria: 'sessao_abandonada', dedupKey: 'sessao_abandonada:s1', url: '/jornadas/x/s1' },
    ]);
    const pushNotificacoes = criarPushNotificacoesFake();
    const supabaseAdmin = { from: (t: string) => (t === 'push_notificacoes' ? pushNotificacoes.from() : {}) } as never;

    const geradas = await gerarEEnfileirar(
      supabaseAdmin,
      [USUARIA_ID],
      new Map([[USUARIA_ID, 'America/Sao_Paulo']]),
      new Map([[USUARIA_ID, preferenciasPadrao()]]),
      AGORA
    );

    expect(geradas).toBe(1);
    expect(pushNotificacoes.linhas).toHaveLength(1);
    expect(pushNotificacoes.linhas[0]).toMatchObject({ dedup_key: 'sessao_abandonada:s1', status: 'pendente' });
  });

  it('usuária pausada: nem chega a gerar candidatos (nenhuma leitura de progresso desnecessária)', async () => {
    const supabaseAdmin = { from: () => ({}) } as never;

    const geradas = await gerarEEnfileirar(
      supabaseAdmin,
      [USUARIA_ID],
      new Map([[USUARIA_ID, 'UTC']]),
      new Map([[USUARIA_ID, preferenciasPadrao({ pausada_ate: '2099-01-01' })]]),
      AGORA
    );

    expect(geradas).toBe(0);
    expect(gerarCandidatosParaUsuaria).not.toHaveBeenCalled();
  });

  it('dedup: pendência já com uma linha "pendente" não gera segunda linha nem duplica', async () => {
    vi.mocked(gerarCandidatosParaUsuaria).mockResolvedValue([
      { categoria: 'sessao_abandonada', dedupKey: 'sessao_abandonada:s1', url: '/jornadas/x/s1' },
    ]);
    const pushNotificacoes = criarPushNotificacoesFake([
      {
        id: 'existente-1', usuaria_id: USUARIA_ID, categoria: 'sessao_abandonada', dedup_key: 'sessao_abandonada:s1',
        status: 'pendente', tentativas: 0, agendado_para: AGORA.toISOString(), enviado_em: null,
        titulo: 'Rose', corpo: 'texto', url: '/jornadas/x/s1', tag: 'sessao_abandonada:s1',
      },
    ]);
    const supabaseAdmin = { from: (t: string) => (t === 'push_notificacoes' ? pushNotificacoes.from() : {}) } as never;

    const geradas = await gerarEEnfileirar(
      supabaseAdmin, [USUARIA_ID], new Map([[USUARIA_ID, 'UTC']]), new Map([[USUARIA_ID, preferenciasPadrao()]]), AGORA
    );

    expect(geradas).toBe(0);
    expect(pushNotificacoes.linhas).toHaveLength(1);
  });

  it('dedup permanente: pendência já "enviada" nunca revive nem duplica', async () => {
    vi.mocked(gerarCandidatosParaUsuaria).mockResolvedValue([
      { categoria: 'sessao_abandonada', dedupKey: 'sessao_abandonada:s1', url: '/jornadas/x/s1' },
    ]);
    const pushNotificacoes = criarPushNotificacoesFake([
      {
        id: 'existente-1', usuaria_id: USUARIA_ID, categoria: 'sessao_abandonada', dedup_key: 'sessao_abandonada:s1',
        status: 'enviada', tentativas: 0, agendado_para: AGORA.toISOString(), enviado_em: AGORA.toISOString(),
        titulo: null, corpo: null, url: null, tag: null,
      },
    ]);
    const supabaseAdmin = { from: (t: string) => (t === 'push_notificacoes' ? pushNotificacoes.from() : {}) } as never;

    const geradas = await gerarEEnfileirar(
      supabaseAdmin, [USUARIA_ID], new Map([[USUARIA_ID, 'UTC']]), new Map([[USUARIA_ID, preferenciasPadrao()]]), AGORA
    );

    expect(geradas).toBe(0);
    expect(pushNotificacoes.linhas[0].status).toBe('enviada');
  });

  it('BUG REAL corrigido: pendência que tinha ficado "falha" (ex.: chave VAPID trocada) é revivida para "pendente" em vez de morrer para sempre', async () => {
    vi.mocked(gerarCandidatosParaUsuaria).mockResolvedValue([
      { categoria: 'sessao_abandonada', dedupKey: 'sessao_abandonada:s1', url: '/jornadas/x/s1' },
    ]);
    const pushNotificacoes = criarPushNotificacoesFake([
      {
        id: 'existente-1', usuaria_id: USUARIA_ID, categoria: 'sessao_abandonada', dedup_key: 'sessao_abandonada:s1',
        status: 'falha', tentativas: 3, agendado_para: '2026-08-20T00:00:00.000Z', enviado_em: null,
        titulo: null, corpo: null, url: null, tag: null,
      },
    ]);
    const supabaseAdmin = { from: (t: string) => (t === 'push_notificacoes' ? pushNotificacoes.from() : {}) } as never;

    const geradas = await gerarEEnfileirar(
      supabaseAdmin, [USUARIA_ID], new Map([[USUARIA_ID, 'UTC']]), new Map([[USUARIA_ID, preferenciasPadrao()]]), AGORA
    );

    expect(geradas).toBe(1);
    const linha = pushNotificacoes.linhas[0];
    expect(linha.status).toBe('pendente');
    expect(linha.tentativas).toBe(0);
    expect(linha.titulo).not.toBeNull();
    expect(pushNotificacoes.linhas).toHaveLength(1); // mesma linha, não uma segunda
  });

  it('pendência cancelada por pausa (não por conclusão) também é revivida quando a usuária volta e a pendência ainda existe', async () => {
    vi.mocked(gerarCandidatosParaUsuaria).mockResolvedValue([
      { categoria: 'sessao_abandonada', dedupKey: 'sessao_abandonada:s1', url: '/jornadas/x/s1' },
    ]);
    const pushNotificacoes = criarPushNotificacoesFake([
      {
        id: 'existente-1', usuaria_id: USUARIA_ID, categoria: 'sessao_abandonada', dedup_key: 'sessao_abandonada:s1',
        status: 'cancelada', tentativas: 0, agendado_para: '2026-08-20T00:00:00.000Z', enviado_em: null,
        titulo: null, corpo: null, url: null, tag: null,
      },
    ]);
    const supabaseAdmin = { from: (t: string) => (t === 'push_notificacoes' ? pushNotificacoes.from() : {}) } as never;

    const geradas = await gerarEEnfileirar(
      supabaseAdmin, [USUARIA_ID], new Map([[USUARIA_ID, 'UTC']]), new Map([[USUARIA_ID, preferenciasPadrao()]]), AGORA
    );

    expect(geradas).toBe(1);
    expect(pushNotificacoes.linhas[0].status).toBe('pendente');
  });
});

describe('processarVencidas', () => {
  it('tarefa concluída antes do processamento: cancela em vez de enviar', async () => {
    vi.mocked(gerarCandidatosParaUsuaria).mockResolvedValue([]); // dedup_key não aparece mais -> resolvida
    const pushNotificacoes = criarPushNotificacoesFake([
      {
        id: 'linha-1', usuaria_id: USUARIA_ID, categoria: 'sessao_abandonada', dedup_key: 'sessao_abandonada:s1',
        status: 'pendente', tentativas: 0, agendado_para: '2026-08-23T00:00:00.000Z', enviado_em: null,
        titulo: 'Rose', corpo: 'texto', url: '/jornadas/x/s1', tag: 'sessao_abandonada:s1',
      },
    ]);
    const supabaseAdmin = { from: (t: string) => (t === 'push_notificacoes' ? pushNotificacoes.from() : {}) } as never;

    const contadores = await processarVencidas(supabaseAdmin, new Map([[USUARIA_ID, 'UTC']]), new Map([[USUARIA_ID, preferenciasPadrao()]]), AGORA);

    expect(contadores.canceladas).toBe(1);
    expect(contadores.enviadas).toBe(0);
    expect(pushNotificacoes.linhas[0].status).toBe('cancelada');
    expect(enviarParaSubscricoes).not.toHaveBeenCalled();
  });

  it('sem nenhum dispositivo inscrito: não envia, registra falha/adiamento em vez de sucesso', async () => {
    vi.mocked(gerarCandidatosParaUsuaria).mockResolvedValue([
      { categoria: 'sessao_abandonada', dedupKey: 'sessao_abandonada:s1', url: '/jornadas/x/s1' },
    ]);
    vi.mocked(enviarParaSubscricoes).mockResolvedValue({ enviados: 0, falhas: 0 });
    const pushNotificacoes = criarPushNotificacoesFake([
      {
        id: 'linha-1', usuaria_id: USUARIA_ID, categoria: 'sessao_abandonada', dedup_key: 'sessao_abandonada:s1',
        status: 'pendente', tentativas: 2, agendado_para: '2026-08-23T00:00:00.000Z', enviado_em: null,
        titulo: 'Rose', corpo: 'texto', url: '/jornadas/x/s1', tag: 'sessao_abandonada:s1',
      },
    ]);
    const subscriptionsFake = criarSubscriptionsFake([]);
    const supabaseAdmin = {
      from: (t: string) => (t === 'push_notificacoes' ? pushNotificacoes.from() : t === 'push_subscriptions' ? subscriptionsFake : { select: () => ({ eq: () => ({ gte: () => Promise.resolve({ data: [], error: null }) }) }) }),
    } as never;

    const contadores = await processarVencidas(supabaseAdmin, new Map([[USUARIA_ID, 'UTC']]), new Map([[USUARIA_ID, preferenciasPadrao()]]), AGORA);

    expect(contadores.enviadas).toBe(0);
    expect(contadores.falhas).toBe(1); // 3ª tentativa (já tinha 2) -> vira 'falha' terminal
    expect(pushNotificacoes.linhas[0].status).toBe('falha');
  });

  it('envio bem-sucedido: marca como enviada e zera o conteúdo (histórico sem texto da mensagem)', async () => {
    vi.mocked(gerarCandidatosParaUsuaria).mockResolvedValue([
      { categoria: 'sessao_abandonada', dedupKey: 'sessao_abandonada:s1', url: '/jornadas/x/s1' },
    ]);
    vi.mocked(enviarParaSubscricoes).mockResolvedValue({ enviados: 1, falhas: 0 });
    const pushNotificacoes = criarPushNotificacoesFake([
      {
        id: 'linha-1', usuaria_id: USUARIA_ID, categoria: 'sessao_abandonada', dedup_key: 'sessao_abandonada:s1',
        status: 'pendente', tentativas: 0, agendado_para: '2026-08-23T00:00:00.000Z', enviado_em: null,
        titulo: 'Rose', corpo: 'Sua próxima etapa está esperando por você 🌹', url: '/jornadas/x/s1', tag: 'sessao_abandonada:s1',
      },
    ]);
    const subscriptionsFake = criarSubscriptionsFake([{ id: 'sub-1', endpoint: 'https://x', p256dh: 'a', auth: 'b' }]);
    const supabaseAdmin = {
      from: (t: string) => (t === 'push_notificacoes' ? pushNotificacoes.from() : t === 'push_subscriptions' ? subscriptionsFake : { select: () => ({ eq: () => ({ gte: () => Promise.resolve({ data: [], error: null }) }) }) }),
    } as never;

    const contadores = await processarVencidas(supabaseAdmin, new Map([[USUARIA_ID, 'UTC']]), new Map([[USUARIA_ID, preferenciasPadrao()]]), AGORA);

    expect(contadores.enviadas).toBe(1);
    const linha = pushNotificacoes.linhas[0];
    expect(linha.status).toBe('enviada');
    expect(linha.titulo).toBeNull();
    expect(linha.corpo).toBeNull();
    expect(enviarParaSubscricoes).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining([expect.objectContaining({ id: 'sub-1' })]),
      expect.objectContaining({ url: '/jornadas/x/s1', tag: 'sessao_abandonada:s1' })
    );
  });

  it('limite de frequência estourado: adia em vez de enviar ou descartar', async () => {
    vi.mocked(gerarCandidatosParaUsuaria).mockResolvedValue([
      { categoria: 'sessao_abandonada', dedupKey: 'sessao_abandonada:s1', url: '/jornadas/x/s1' },
    ]);
    const pushNotificacoes = criarPushNotificacoesFake([
      {
        id: 'linha-1', usuaria_id: USUARIA_ID, categoria: 'sessao_abandonada', dedup_key: 'sessao_abandonada:s1',
        status: 'pendente', tentativas: 0, agendado_para: '2026-08-23T00:00:00.000Z', enviado_em: null,
        titulo: 'Rose', corpo: 'texto', url: '/jornadas/x/s1', tag: 'sessao_abandonada:s1',
      },
    ]);
    // 2 envios já hoje (limite diário do antiSpam é 2/dia) -> não pode enviar mais um.
    const envioRecente1 = AGORA.toISOString();
    const envioRecente2 = new Date(AGORA.getTime() - 60 * 60 * 1000).toISOString();
    const supabaseAdmin = {
      from: (t: string) => {
        if (t === 'push_notificacoes') return pushNotificacoes.from();
        if (t === 'push_envios') return { select: () => ({ eq: () => ({ gte: () => Promise.resolve({ data: [{ criado_em: envioRecente1 }, { criado_em: envioRecente2 }], error: null }) }) }) };
        return { select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }) };
      },
    } as never;

    const contadores = await processarVencidas(supabaseAdmin, new Map([[USUARIA_ID, 'UTC']]), new Map([[USUARIA_ID, preferenciasPadrao()]]), AGORA);

    expect(contadores.adiadas).toBe(1);
    expect(contadores.enviadas).toBe(0);
    expect(pushNotificacoes.linhas[0].status).toBe('pendente'); // volta pra fila, não descarta
    expect(enviarParaSubscricoes).not.toHaveBeenCalled();
  });
});
