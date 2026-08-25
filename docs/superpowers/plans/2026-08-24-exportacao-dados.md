# Exportação das reflexões e do progresso Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir a exportação de dados atual (uma server action que monta JSON e cria um Blob no cliente) por um módulo canônico único de coleta de dados, reaproveitado tanto pela action existente quanto por uma nova rota autenticada `/api/exportar/[formato]`, que entrega JSON (arquivo único) ou CSV (ZIP com um arquivo por tabela), com escape de formula injection e registro de auditoria (nunca de conteúdo) em `exportacoes_dados`.

**Architecture:** Um módulo puro `src/lib/exportacao/coletarDados.ts` recebe um cliente Supabase autenticado (RLS ativa, nunca service role) e a usuária da sessão, e devolve o mesmo pacote de dados estruturado que a `exportarMeusDados` produz hoje — mais três tabelas que faltavam (`jornada_respostas_modulo`, `sessoes_jornadas_conteudo_progresso`, `favoritos`). A action existente e a nova Route Handler consomem esse único módulo — nenhuma duplica a lógica de busca. Dois módulos irmãos, `src/lib/exportacao/csv.ts` (escape RFC4180 + anti-formula-injection) e `src/lib/exportacao/zip.ts` (empacotador ZIP mínimo, método STORE, sem dependência nova), transformam o pacote em CSVs por tabela e os empacotam. A rota grava a linha de auditoria em `exportacoes_dados` com o admin client (service role) — a única tabela desta feature sem policy nenhuma para `authenticated`. A UI (`ExportarDadosBotao.tsx`) passa a baixar via `fetch` da rota em vez de gerar o Blob no cliente.

**Tech Stack:** Next.js 16 (App Router, Route Handlers com `params: Promise<...>`), React 19, TypeScript, `@supabase/supabase-js` (cliente autenticado via `createSupabaseServerClient`, admin via `createSupabaseAdminClient`), Vitest + Testing Library, pgTAP para RLS. Sem dependência nova: o ZIP é escrito à mão (método STORE, CRC32 manual) — ver justificativa na Task 3.

## Global Constraints

- Segurança, exportação e privacidade nunca ficam atrás do Rose Pro — a exportação é sempre gratuita, para todas as usuárias.
- Nunca duas implementações paralelas da coleta de dados: a action e a rota usam o mesmo módulo canônico (`coletarDadosExportaveis`).
- As tabelas novas de leitura (`jornada_respostas_modulo`, `sessoes_jornadas_conteudo_progresso`, `favoritos`) são sempre lidas com o cliente autenticado normal e RLS (`usuaria_id = user.id`, exceto `jornada_respostas_modulo` que usa a coluna `user_id`) — nunca service role.
- JSON: arquivo único. CSV: entregue como ZIP com um arquivo por tabela (`checkins.csv`, `reflexoes.csv`, `praticas.csv`, `jornadas.csv`, `favoritos.csv`) — nunca tabelas incompatíveis misturadas num único CSV.
- A rota de download retorna `Cache-Control: private, no-store`; `Content-Disposition: attachment; filename="rose-meus-dados-{data}.{ext}"`; `Content-Type` correto por formato (`application/json`, `application/zip`).
- Escape de CSV contra formula injection: prefixo `'` em valores que, após remover espaços/tabulação/quebras de linha à esquerda, começam com `=`, `+`, `-` ou `@`. Aspas duplicadas e quebras de linha dentro de células tratadas corretamente (aspas envolvendo o valor).
- A própria rota (server-side) grava a linha de auditoria em `exportacoes_dados` usando o admin client — a tabela não tem policy nem GRANT para `authenticated`, só o servidor escreve. Nunca grava o conteúdo exportado, só `usuaria_id` + `tipo`.
- A UI (`ExportarDadosBotao.tsx`) chama a nova rota em vez de gerar o Blob no cliente — mantém loading/erro amigável.
- Nunca inclui `role`, `stripe_customer_id`, `stripe_subscription_id`, `push_subscriptions` (endpoint/p256dh/auth), dados administrativos, ou dados de outra usuária.
- RLS habilitada em toda tabela nova; `supabase migration new <nome>` para gerar o arquivo (nunca nome manual); idempotência (`create table if not exists`); `notify pgrst, 'reload schema';` ao final; nunca GRANT a `anon`; nunca `SECURITY DEFINER` para contornar RLS.
- Tipos TypeScript (`src/lib/supabase/types.ts`) atualizados manualmente após a migration (não há `supabase gen types` configurado neste projeto).
- **Pré-requisito desta feature:** a "Ordem de implementação" do design (seção final do documento de design) coloca Favoritos (seção 5) antes de Exportação (seção 8). Este plano assume que a tabela `favoritos` (id, usuaria_id, pratica_id, sessao_id, criado_em — RLS com policies `select/insert/delete` para `authenticated`) e o tipo `Favorito` em `src/lib/supabase/types.ts` já existem no banco e no código quando este plano for executado. A Task 2 abaixo inclui um passo de verificação e, só se o tipo `Favorito` ainda não existir em `types.ts`, adiciona a entrada mínima de tipo (nunca a migration/RLS — isso é responsabilidade do plano da seção 5) para manter o módulo canônico compilável.
- Next.js 16: Route Handlers recebem `params` como `Promise<...>` (confirmado em `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`) — sempre `const { formato } = await params`.

---

## File Structure

- Create: `supabase/migrations/<timestamp>_exportacoes_dados_fundacao.sql` — tabela de auditoria `exportacoes_dados`.
- Create: `supabase/tests/exportacoes_dados_rls.test.sql` — pgTAP cobrindo RLS/GRANT da tabela nova.
- Modify: `src/lib/supabase/types.ts` — tipos `ExportacaoDados`/`TipoExportacao` (+ `Favorito` só se ainda não existir).
- Create: `src/lib/exportacao/coletarDados.ts` — módulo canônico de coleta (única fonte de verdade dos dados exportáveis).
- Create: `src/lib/exportacao/coletarDados.test.ts`
- Create: `src/lib/exportacao/csv.ts` — escape RFC4180 + anti-formula-injection, serialização de linhas/tabelas.
- Create: `src/lib/exportacao/csv.test.ts`
- Create: `src/lib/exportacao/zip.ts` — empacotador ZIP mínimo (STORE, sem dependência nova).
- Create: `src/lib/exportacao/zip.test.ts`
- Create: `src/app/api/exportar/[formato]/route.ts` — rota de download autenticada.
- Create: `src/app/api/exportar/[formato]/route.test.ts`
- Modify: `src/app/perfil/privacidade/actions.ts` — `exportarMeusDados` passa a delegar ao módulo canônico.
- Modify: `src/app/perfil/privacidade/actions.test.ts` — ajusta os mocks para o novo formato de dependência.
- Modify: `src/app/perfil/privacidade/ExportarDadosBotao.tsx` — chama a nova rota via `fetch`, dois formatos.
- Create: `src/app/perfil/privacidade/ExportarDadosBotao.test.tsx`

---

## Task 1: Migration e tipos da tabela `exportacoes_dados`

**Files:**
- Create: `supabase/migrations/<timestamp>_exportacoes_dados_fundacao.sql`
- Create: `supabase/tests/exportacoes_dados_rls.test.sql`
- Modify: `src/lib/supabase/types.ts`

**Interfaces:**
- Produces: tabela `public.exportacoes_dados` (colunas `id uuid`, `usuaria_id uuid`, `tipo text check in ('json','csv')`, `criado_em timestamptz`), sem nenhuma policy para `authenticated`, GRANT revogado de `anon`/`authenticated`. Tipo `ExportacaoDados` e `Database['public']['Tables']['exportacoes_dados']` em `src/lib/supabase/types.ts`, usados pela Task 4 (rota) via admin client.

- [ ] **Step 1: Gerar o arquivo de migration**

```bash
supabase migration new exportacoes_dados_fundacao
```

Expected: cria `supabase/migrations/<timestamp>_exportacoes_dados_fundacao.sql` vazio.

- [ ] **Step 2: Escrever a migration**

Substitua o conteúdo do arquivo gerado por:

```sql
-- <timestamp>_exportacoes_dados_fundacao.sql
-- Tabela interna de auditoria: registra que uma exportação de dados ocorreu
-- para uma usuária (id + tipo + quando), nunca o conteúdo exportado. Só a
-- rota de exportação (server-side, com a service role) escreve aqui — por
-- isso RLS fica habilitada mas SEM nenhuma policy para `authenticated`, e o
-- GRANT default de `authenticated`/`anon` é revogado explicitamente (mesmo
-- padrão de 20260822093000_push_fila_revoga_anon_authenticated.sql: sem
-- isso, o ALTER DEFAULT PRIVILEGES do Supabase concede alguns privilégios,
-- como TRUNCATE, que RLS sozinha não filtra).
create table if not exists public.exportacoes_dados (
  id uuid primary key default gen_random_uuid(),
  usuaria_id uuid not null references public.perfis(id) on delete cascade,
  tipo text not null check (tipo in ('json', 'csv')),
  criado_em timestamptz not null default now()
);

comment on table public.exportacoes_dados is
  'Registro de auditoria de exportações de dados pessoais. Guarda só '
  'usuaria_id + tipo + quando — nunca o conteúdo exportado. Escrita '
  'exclusiva via service role, dentro da própria rota de exportação.';

alter table public.exportacoes_dados enable row level security;

-- Nenhuma policy para `authenticated` de propósito: a tabela não deve ser
-- legível nem gravável pelo client, só pelo servidor via service role (que
-- ignora RLS).
revoke all on public.exportacoes_dados from anon, authenticated;

notify pgrst, 'reload schema';
```

- [ ] **Step 3: Escrever o teste pgTAP de RLS**

```sql
-- supabase/tests/exportacoes_dados_rls.test.sql
-- Testes de RLS para public.exportacoes_dados (pgTAP). Mesma ressalva de
-- supabase/tests/jornada_respostas_modulo_rls.test.sql: roda com
-- `supabase test db` (Postgres + pgtap + Supabase CLI).
begin;
select plan(4);

insert into public.perfis (id, nome) values
  ('a0000000-0000-0000-0000-00000000000a', 'Usuária A');

-- Cenário 1: acesso anônimo é bloqueado por falta de GRANT.
set local role anon;
select throws_ok(
  $$ select * from public.exportacoes_dados $$,
  '42501',
  null,
  'acesso anônimo é bloqueado por falta de GRANT (permission denied for table)'
);

-- Cenário 2: a tabela não tem NENHUMA policy para authenticated, então até
-- um SELECT sem WHERE falha por falta de GRANT — não só por RLS.
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select throws_ok(
  $$ select * from public.exportacoes_dados $$,
  '42501',
  null,
  'usuária autenticada não consegue ler a própria linha de auditoria via client'
);

-- Cenário 3: usuária autenticada não consegue inserir a própria linha de
-- auditoria — só a service role, via rota do servidor, faz isso.
select throws_ok(
  $$ insert into public.exportacoes_dados (usuaria_id, tipo)
     values ('a0000000-0000-0000-0000-00000000000a', 'json') $$,
  '42501',
  null,
  'usuária autenticada não consegue inserir linha de auditoria via client'
);

-- Cenário 4: a service role consegue gravar — é assim que a rota de
-- exportação registra a auditoria (Task 4).
reset role;
set local role postgres;
select lives_ok(
  $$ insert into public.exportacoes_dados (usuaria_id, tipo)
     values ('a0000000-0000-0000-0000-00000000000a', 'csv') $$,
  'service role consegue gravar a linha de auditoria (é assim que a rota de exportação registra)'
);

select * from finish();
rollback;
```

- [ ] **Step 4: Rodar os testes pgTAP (se houver ambiente Docker/Supabase local disponível)**

```bash
supabase test db
```

Expected: `4 passing` no arquivo `exportacoes_dados_rls.test.sql`. Se este ambiente não tiver Docker disponível (mesma ressalva já documentada em `supabase/tests/jornada_respostas_modulo_rls.test.sql`), pule este passo — o arquivo já fica pronto para rodar em qualquer ambiente com Supabase CLI.

- [ ] **Step 5: Adicionar os tipos TypeScript**

Em `src/lib/supabase/types.ts`, adicione perto dos outros tipos de tabela (ex.: logo abaixo de `IntencaoPagamento`):

```ts
export type TipoExportacao = 'json' | 'csv';

export type ExportacaoDados = {
  id: string;
  usuaria_id: string;
  tipo: TipoExportacao;
  criado_em: string;
};
```

E dentro de `Database['public']['Tables']`, junto das demais entradas (ex.: logo abaixo de `intencao_pagamento`):

```ts
      exportacoes_dados: {
        Row: ExportacaoDados;
        Insert: Omit<ExportacaoDados, 'id' | 'criado_em'> & { id?: string; criado_em?: string };
        Update: Partial<ExportacaoDados>;
        Relationships: [];
      };
```

- [ ] **Step 6: Typecheck**

```bash
npx tsc --noEmit
```

Expected: sem novos erros.

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations supabase/tests/exportacoes_dados_rls.test.sql src/lib/supabase/types.ts
git commit -m "feat(exportacao): tabela de auditoria exportacoes_dados (RLS sem policy, so service role)"
```

---

## Task 2: Módulo canônico de coleta de dados

**Files:**
- Create: `src/lib/exportacao/coletarDados.ts`
- Create: `src/lib/exportacao/coletarDados.test.ts`
- Modify: `src/lib/supabase/types.ts` (só se `Favorito` ainda não existir — ver Step 1)

**Interfaces:**
- Consumes: `SupabaseClient<Database>` autenticado (de `createSupabaseServerClient`, `@/lib/supabase/server`); tipos `Checkin`, `Sessao`, `JornadaUsuaria`, `JornadaRespostaModulo`, `ConclusaoPraticaConteudo`, `SessaoJornadaConteudoProgresso`, `Favorito`, `CarteiraPetalas`, `TransacaoPetalas`, `ResgateDesafioSemanal`, `ResgateRecompensa`, `PreferenciasNotificacao`, `IntencaoPagamento` de `@/lib/supabase/types`.
- Produces: `export async function coletarDadosExportaveis(supabase: SupabaseClient<Database>, usuaria: { id: string; email: string | null; criado_em: string }): Promise<{ erro?: string; pacote?: PacoteExportado }>` e o tipo exportado `PacoteExportado` — consumidos pela Task 4 (rota) e pela Task 5 (action `exportarMeusDados`).

- [ ] **Step 1: Verificar se o tipo `Favorito` já existe**

```bash
grep -n "export type Favorito" src/lib/supabase/types.ts
grep -n "favoritos:" src/lib/supabase/types.ts
```

Se **não** encontrar nada (a Task 2 do plano da seção 5 ainda não rodou neste checkout), adicione em `src/lib/supabase/types.ts`, perto de `RecursoSeguranca`, só a definição de tipo abaixo — **não** crie migration nem policies aqui, isso pertence ao plano da seção 5 (Favoritos e "Continuar de onde parei"); esta entrada existe só para o módulo canônico compilar:

```ts
export type Favorito = {
  id: string;
  usuaria_id: string;
  pratica_id: string | null;
  sessao_id: string | null;
  criado_em: string;
};
```

E dentro de `Database['public']['Tables']`:

```ts
      favoritos: {
        Row: Favorito;
        Insert: Omit<Favorito, 'id' | 'criado_em'> & { id?: string; criado_em?: string };
        Update: Partial<Favorito>;
        Relationships: [];
      };
```

Se o `grep` já encontrou o tipo e a entrada, pule para o Step 2 sem alterar `types.ts`.

- [ ] **Step 2: Escrever o teste do módulo canônico (falha primeiro)**

```ts
// @vitest-environment node
// src/lib/exportacao/coletarDados.test.ts
import { describe, it, expect, vi } from 'vitest';
import { coletarDadosExportaveis } from './coletarDados';

type ResultadoFake = { data: unknown; error: { code?: string; message: string } | null };

function criarConstrutor(tabela: string, resultado: ResultadoFake, chamadasEq: Array<{ tabela: string; coluna: string; valor: unknown }>) {
  const construtor = {
    select: vi.fn(() => construtor),
    eq: vi.fn((coluna: string, valor: unknown) => {
      chamadasEq.push({ tabela, coluna, valor });
      return construtor;
    }),
    single: vi.fn(async () => resultado),
    maybeSingle: vi.fn(async () => resultado),
    then: (resolve: (v: ResultadoFake) => void, reject?: (e: unknown) => void) =>
      Promise.resolve(resultado).then(resolve, reject),
  };
  return construtor;
}

const USUARIA_ID = 'usuaria-própria-123';
const OUTRA_USUARIA_ID = 'usuaria-outra-999';

function criarSupabaseFake(overrides: Partial<Record<string, ResultadoFake>> = {}) {
  const tabelas: Record<string, ResultadoFake> = {
    perfis: { data: { id: USUARIA_ID, nome: 'Ana', plano: 'free', criado_em: '2026-01-01T00:00:00Z' }, error: null },
    checkins: { data: [{ id: 'chk-1', usuaria_id: USUARIA_ID }], error: null },
    sessoes: { data: [{ id: 'ses-1', usuaria_id: USUARIA_ID }], error: null },
    jornadas_usuarias: { data: [{ id: 'jor-1', usuaria_id: USUARIA_ID }], error: null },
    jornada_respostas_modulo: { data: [{ id: 'resp-1', user_id: USUARIA_ID }], error: null },
    conclusoes_praticas_conteudo: { data: [], error: null },
    sessoes_jornadas_conteudo_progresso: { data: [{ id: 'prog-1', usuaria_id: USUARIA_ID }], error: null },
    favoritos: { data: [{ id: 'fav-1', usuaria_id: USUARIA_ID }], error: null },
    carteiras_petalas: { data: { usuaria_id: USUARIA_ID, saldo: 120 }, error: null },
    transacoes_petalas: { data: [{ id: 'tx-1', usuaria_id: USUARIA_ID }], error: null },
    resgates_desafio_semanal: { data: [], error: null },
    resgates_recompensas: { data: [], error: null },
    preferencias_notificacoes: { data: { usuaria_id: USUARIA_ID, lembrete_checkin: true }, error: null },
    intencao_pagamento: { data: [], error: null },
    ...overrides,
  };

  const chamadasEq: Array<{ tabela: string; coluna: string; valor: unknown }> = [];

  const from = vi.fn((tabela: string) => {
    const resultado = tabelas[tabela];
    if (!resultado) throw new Error(`tabela inesperada em teste: ${tabela}`);
    return criarConstrutor(tabela, resultado, chamadasEq);
  });

  return { from, chamadasEq };
}

const USUARIA = { id: USUARIA_ID, email: 'ana@exemplo.com', criado_em: '2026-01-01T00:00:00Z' };

describe('coletarDadosExportaveis', () => {
  it('busca todas as tabelas filtrando só pela própria usuária, incluindo jornada_respostas_modulo por user_id', async () => {
    const fake = criarSupabaseFake();

    const resultado = await coletarDadosExportaveis(fake as never, USUARIA);

    expect(resultado.erro).toBeUndefined();
    expect(resultado.pacote).toBeDefined();

    for (const chamada of fake.chamadasEq) {
      if (chamada.coluna === 'usuaria_id' || chamada.coluna === 'user_id' || chamada.coluna === 'id') {
        expect(chamada.valor).toBe(USUARIA_ID);
        expect(chamada.valor).not.toBe(OUTRA_USUARIA_ID);
      }
    }

    const chamadaRespostasModulo = fake.chamadasEq.find((c) => c.tabela === 'jornada_respostas_modulo');
    expect(chamadaRespostasModulo?.coluna).toBe('user_id');
  });

  it('inclui as três tabelas novas (jornada_respostas_modulo, sessoes_jornadas_conteudo_progresso, favoritos) no pacote', async () => {
    const fake = criarSupabaseFake();
    const resultado = await coletarDadosExportaveis(fake as never, USUARIA);

    expect(resultado.pacote?.jornada_respostas_modulo).toHaveLength(1);
    expect(resultado.pacote?.praticas.sessoes_jornadas_conteudo_progresso).toHaveLength(1);
    expect(resultado.pacote?.favoritos).toHaveLength(1);
  });

  it('produz um pacote estruturado por categorias, com o essencial do perfil', async () => {
    const fake = criarSupabaseFake();
    const resultado = await coletarDadosExportaveis(fake as never, USUARIA);
    const pacote = resultado.pacote!;

    expect(pacote.exportado_em).toBeDefined();
    expect(pacote.conta).toEqual(USUARIA);
    expect(pacote.perfil?.nome).toBe('Ana');
    expect(pacote.checkins).toHaveLength(1);
    expect(pacote.petalas.saldo).toBe(120);
  });

  it('não inclui segredos, tokens, service role ou identificadores internos do Stripe', async () => {
    const fake = criarSupabaseFake({
      perfis: {
        data: {
          id: USUARIA_ID,
          nome: 'Ana',
          plano: 'premium',
          criado_em: '2026-01-01T00:00:00Z',
          stripe_customer_id: 'cus_super_secreto',
          stripe_subscription_id: 'sub_super_secreto',
          role: 'usuaria',
        },
        error: null,
      },
    });

    const resultado = await coletarDadosExportaveis(fake as never, USUARIA);
    const textoExportado = JSON.stringify(resultado.pacote);

    expect(textoExportado).not.toContain('cus_super_secreto');
    expect(textoExportado).not.toContain('sub_super_secreto');
    expect(textoExportado.toLowerCase()).not.toContain('service_role');
    expect(textoExportado).not.toContain('"role"');
  });

  it('isola dados entre usuárias: dados de B nunca aparecem no pacote de A, em nenhuma das tabelas novas', async () => {
    const fake = criarSupabaseFake({
      jornada_respostas_modulo: { data: [{ id: 'resp-A', user_id: USUARIA_ID }], error: null },
      sessoes_jornadas_conteudo_progresso: { data: [{ id: 'prog-A', usuaria_id: USUARIA_ID }], error: null },
      favoritos: { data: [{ id: 'fav-A', usuaria_id: USUARIA_ID }], error: null },
    });

    const resultado = await coletarDadosExportaveis(fake as never, USUARIA);
    const textoExportado = JSON.stringify(resultado.pacote);

    expect(textoExportado).not.toContain(OUTRA_USUARIA_ID);
    expect(textoExportado).toContain('resp-A');
    expect(textoExportado).toContain('prog-A');
    expect(textoExportado).toContain('fav-A');
  });

  it('retorna erro genérico e não quebra quando alguma consulta falha', async () => {
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fake = criarSupabaseFake({
      favoritos: { data: null, error: { code: '42501', message: 'permission denied' } },
    });

    const resultado = await coletarDadosExportaveis(fake as never, USUARIA);

    expect(resultado.erro).toBe('Não foi possível preparar seus dados agora. Tente novamente.');
    expect(resultado.pacote).toBeUndefined();
    expect(spyConsole).toHaveBeenCalled();
    spyConsole.mockRestore();
  });
});
```

- [ ] **Step 3: Rodar o teste e confirmar que falha**

```bash
npx vitest run src/lib/exportacao/coletarDados.test.ts
```

Expected: FAIL — `Cannot find module './coletarDados'`.

- [ ] **Step 4: Implementar o módulo canônico**

```ts
// src/lib/exportacao/coletarDados.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Database,
  Checkin,
  Sessao,
  JornadaUsuaria,
  JornadaRespostaModulo,
  ConclusaoPraticaConteudo,
  SessaoJornadaConteudoProgresso,
  Favorito,
  TransacaoPetalas,
  ResgateDesafioSemanal,
  ResgateRecompensa,
  PreferenciasNotificacao,
  IntencaoPagamento,
} from '@/lib/supabase/types';

export type ContaExportavel = { id: string; email: string | null; criado_em: string };

export type PerfilExportavel = {
  nome: string | null;
  plano: string;
  pais: string;
  frase_pessoal: string | null;
  faixa_etaria: string | null;
  fuso_horario: string;
  idioma: string;
  foto_url: string | null;
  horario_preferido_notificacao: string | null;
  assinatura_status: string | null;
  assinatura_periodo_fim: string | null;
  criado_em: string;
};

export type PacoteExportado = {
  exportado_em: string;
  conta: ContaExportavel;
  perfil: PerfilExportavel | null;
  checkins: Checkin[];
  jornadas: JornadaUsuaria[];
  jornada_respostas_modulo: JornadaRespostaModulo[];
  praticas: {
    sessoes: Sessao[];
    praticas_avulsas_concluidas: ConclusaoPraticaConteudo[];
    sessoes_jornadas_conteudo_progresso: SessaoJornadaConteudoProgresso[];
  };
  favoritos: Favorito[];
  petalas: { saldo: number; transacoes: TransacaoPetalas[] };
  recompensas: {
    resgates: ResgateRecompensa[];
    desafios_semanais_concluidos: ResgateDesafioSemanal[];
  };
  notificacoes: PreferenciasNotificacao | null;
  intencao_pagamento: IntencaoPagamento[];
};

export type UsuariaAutenticada = { id: string; email: string | null; criado_em: string };

export type ResultadoColeta = { erro?: string; pacote?: PacoteExportado };

// Só os campos com sentido para a própria usuária ver de novo no export. De
// propósito fora: role (papel interno), stripe_customer_id e
// stripe_subscription_id (identificadores internos de cobrança, sem
// utilidade para a usuária e fora do escopo do que ela preencheu/gerou
// diretamente).
function perfilExportavel(perfil: Record<string, unknown> | null): PerfilExportavel | null {
  if (!perfil) return null;
  return {
    nome: perfil.nome as string | null,
    plano: perfil.plano as string,
    pais: perfil.pais as string,
    frase_pessoal: perfil.frase_pessoal as string | null,
    faixa_etaria: perfil.faixa_etaria as string | null,
    fuso_horario: perfil.fuso_horario as string,
    idioma: perfil.idioma as string,
    foto_url: perfil.foto_url as string | null,
    horario_preferido_notificacao: perfil.horario_preferido_notificacao as string | null,
    assinatura_status: perfil.assinatura_status as string | null,
    assinatura_periodo_fim: perfil.assinatura_periodo_fim as string | null,
    criado_em: perfil.criado_em as string,
  };
}

// Módulo canônico de coleta de dados exportáveis da própria usuária — usado
// tanto pela server action `exportarMeusDados` (src/app/perfil/privacidade/actions.ts)
// quanto pela rota de download `/api/exportar/[formato]`. SEMPRE recebe um
// cliente Supabase autenticado normal (RLS ativa) — nunca a service role. A
// RLS de cada tabela já garante `usuaria_id = auth.uid()` (ou `user_id`, no
// caso de jornada_respostas_modulo); os `.eq(...)` abaixo são defesa em
// profundidade, não a única barreira.
export async function coletarDadosExportaveis(
  supabase: SupabaseClient<Database>,
  usuaria: UsuariaAutenticada
): Promise<ResultadoColeta> {
  const usuariaId = usuaria.id;

  const [
    { data: perfil, error: erroPerfil },
    { data: checkins, error: erroCheckins },
    { data: sessoes, error: erroSessoes },
    { data: jornadasUsuarias, error: erroJornadasUsuarias },
    { data: respostasModulo, error: erroRespostasModulo },
    { data: conclusoesPraticas, error: erroConclusoes },
    { data: progressoConteudoJornadas, error: erroProgressoConteudo },
    { data: favoritos, error: erroFavoritos },
    { data: carteira, error: erroCarteira },
    { data: transacoesPetalas, error: erroTransacoes },
    { data: resgatesDesafio, error: erroResgatesDesafio },
    { data: resgatesRecompensas, error: erroResgatesRecompensas },
    { data: preferenciasNotificacoes, error: erroPreferencias },
    { data: intencaoPagamento, error: erroIntencao },
  ] = await Promise.all([
    supabase.from('perfis').select('*').eq('id', usuariaId).single(),
    supabase.from('checkins').select('*').eq('usuaria_id', usuariaId),
    supabase.from('sessoes').select('*').eq('usuaria_id', usuariaId),
    supabase.from('jornadas_usuarias').select('*').eq('usuaria_id', usuariaId),
    // jornada_respostas_modulo usa `user_id`, não `usuaria_id` (ver
    // supabase/migrations/0029_jornada_modulos_estruturados.sql) — única
    // tabela com esse nome de coluna diferente entre as buscadas aqui.
    supabase.from('jornada_respostas_modulo').select('*').eq('user_id', usuariaId),
    supabase.from('conclusoes_praticas_conteudo').select('*').eq('usuaria_id', usuariaId),
    supabase.from('sessoes_jornadas_conteudo_progresso').select('*').eq('usuaria_id', usuariaId),
    supabase.from('favoritos').select('*').eq('usuaria_id', usuariaId),
    supabase.from('carteiras_petalas').select('*').eq('usuaria_id', usuariaId).maybeSingle(),
    supabase.from('transacoes_petalas').select('*').eq('usuaria_id', usuariaId),
    supabase.from('resgates_desafio_semanal').select('*').eq('usuaria_id', usuariaId),
    supabase.from('resgates_recompensas').select('*').eq('usuaria_id', usuariaId),
    supabase.from('preferencias_notificacoes').select('*').eq('usuaria_id', usuariaId).maybeSingle(),
    supabase.from('intencao_pagamento').select('*').eq('usuaria_id', usuariaId),
  ]);

  const primeiroErro = [
    erroPerfil,
    erroCheckins,
    erroSessoes,
    erroJornadasUsuarias,
    erroRespostasModulo,
    erroConclusoes,
    erroProgressoConteudo,
    erroFavoritos,
    erroCarteira,
    erroTransacoes,
    erroResgatesDesafio,
    erroResgatesRecompensas,
    erroPreferencias,
    erroIntencao,
  ].find(Boolean);

  if (primeiroErro) {
    console.error('[exportacao] Falha ao coletar dados exportáveis', {
      code: primeiroErro.code,
      message: primeiroErro.message,
    });
    return { erro: 'Não foi possível preparar seus dados agora. Tente novamente.' };
  }

  const pacote: PacoteExportado = {
    exportado_em: new Date().toISOString(),
    conta: { id: usuaria.id, email: usuaria.email, criado_em: usuaria.criado_em },
    perfil: perfilExportavel(perfil),
    checkins: checkins ?? [],
    jornadas: jornadasUsuarias ?? [],
    jornada_respostas_modulo: respostasModulo ?? [],
    praticas: {
      sessoes: sessoes ?? [],
      praticas_avulsas_concluidas: conclusoesPraticas ?? [],
      sessoes_jornadas_conteudo_progresso: progressoConteudoJornadas ?? [],
    },
    favoritos: favoritos ?? [],
    petalas: {
      saldo: carteira?.saldo ?? 0,
      transacoes: transacoesPetalas ?? [],
    },
    recompensas: {
      resgates: resgatesRecompensas ?? [],
      desafios_semanais_concluidos: resgatesDesafio ?? [],
    },
    notificacoes: preferenciasNotificacoes ?? null,
    intencao_pagamento: intencaoPagamento ?? [],
  };

  return { pacote };
}
```

- [ ] **Step 5: Rodar o teste e confirmar que passa**

```bash
npx vitest run src/lib/exportacao/coletarDados.test.ts
```

Expected: PASS (6 testes).

- [ ] **Step 6: Commit**

```bash
git add src/lib/exportacao/coletarDados.ts src/lib/exportacao/coletarDados.test.ts src/lib/supabase/types.ts
git commit -m "feat(exportacao): modulo canonico de coleta de dados exportaveis"
```

---

## Task 3: Escape de CSV e empacotador ZIP

**Files:**
- Create: `src/lib/exportacao/csv.ts`
- Create: `src/lib/exportacao/csv.test.ts`
- Create: `src/lib/exportacao/zip.ts`
- Create: `src/lib/exportacao/zip.test.ts`

**Interfaces:**
- Produces: `export function escaparCelulaCsv(valor: unknown): string`, `export function paraCsv<T extends Record<string, unknown>>(linhas: T[], colunas: string[]): string` (de `csv.ts`); `export type ArquivoZip = { nome: string; conteudo: string }` e `export function criarZip(arquivos: ArquivoZip[]): Uint8Array` (de `zip.ts`) — ambos consumidos pela Task 4 (rota).
- Decisão de arquitetura (ZIP sem dependência nova): pesquisado (`fflate`, `client-zip`, `adm-zip`, `node-native-zip`, `zip-lib`) — todos resolveriam o requisito, mas o conteúdo aqui é só texto pessoal (5 CSVs pequenos, tipicamente dezenas a poucos milhares de linhas por usuária): o ganho de compressão do DEFLATE não compensa trazer uma dependência nova para este único caso de uso. Um empacotador ZIP método **STORE** (sem compressão) é ~120 linhas de TypeScript usando só `TextEncoder`/`DataView`/`Uint8Array` (todos nativos), o que segue o padrão já usado neste projeto de evitar dependências de terceiros quando a implementação própria é pequena e auditável (ver `public/sw.js` escrito à mão em vez de `next-pwa`, no plano `2026-08-22-pwa-instalavel.md`). Qualquer descompactador padrão (Windows, macOS, `unzip`) lê ZIP STORE normalmente — STORE é um método válido da spec, não um formato simplificado à parte.

- [ ] **Step 1: Escrever o teste do escape de CSV (falha primeiro)**

```ts
// src/lib/exportacao/csv.test.ts
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
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
npx vitest run src/lib/exportacao/csv.test.ts
```

Expected: FAIL — `Cannot find module './csv'`.

- [ ] **Step 3: Implementar `csv.ts`**

```ts
// src/lib/exportacao/csv.ts
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
```

- [ ] **Step 4: Rodar e confirmar que passa**

```bash
npx vitest run src/lib/exportacao/csv.test.ts
```

Expected: PASS (9 testes).

- [ ] **Step 5: Escrever o teste do empacotador ZIP (falha primeiro)**

O teste decodifica o ZIP gerado lendo os cabeçalhos locais diretamente (formato STORE é sequencial e determinístico — não precisa de nenhuma lib externa para validar em teste).

```ts
// src/lib/exportacao/zip.test.ts
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
```

- [ ] **Step 6: Rodar e confirmar que falha**

```bash
npx vitest run src/lib/exportacao/zip.test.ts
```

Expected: FAIL — `Cannot find module './zip'`.

- [ ] **Step 7: Implementar `zip.ts`**

```ts
// src/lib/exportacao/zip.ts
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
```

- [ ] **Step 8: Rodar e confirmar que passa**

```bash
npx vitest run src/lib/exportacao/zip.test.ts
```

Expected: PASS (4 testes).

- [ ] **Step 9: Commit**

```bash
git add src/lib/exportacao/csv.ts src/lib/exportacao/csv.test.ts src/lib/exportacao/zip.ts src/lib/exportacao/zip.test.ts
git commit -m "feat(exportacao): escape csv anti formula-injection e empacotador zip (store) sem dependencia"
```

---

## Task 4: Rota de download `/api/exportar/[formato]`

**Files:**
- Create: `src/app/api/exportar/[formato]/route.ts`
- Create: `src/app/api/exportar/[formato]/route.test.ts`

**Interfaces:**
- Consumes: `coletarDadosExportaveis` (Task 2), `paraCsv` (Task 3), `criarZip`/`ArquivoZip` (Task 3), `createSupabaseServerClient` (`@/lib/supabase/server`), `createSupabaseAdminClient` (`@/lib/supabase/admin`).
- Produces: `export async function GET(request: NextRequest, { params }: { params: Promise<{ formato: string }> })` respondendo em `GET /api/exportar/json` e `GET /api/exportar/csv` — consumido pela Task 6 (`ExportarDadosBotao.tsx`).

Mapeamento de tabelas para os 5 CSVs do ZIP (decisão desta task, documentada aqui porque o design não especifica a origem exata de cada arquivo): `checkins.csv` ← `checkins` (já inclui `texto_livre`, a reflexão escrita no check-in); `reflexoes.csv` ← `jornada_respostas_modulo` (as respostas escritas nos exercícios psicoeducativos das jornadas — a `respostas` jsonb vai serializada como texto JSON numa célula); `praticas.csv` ← `praticas_avulsas_concluidas` (práticas de conteúdo concluídas fora do fluxo de recomendação); `jornadas.csv` ← `jornadas` (inscrições/progresso por jornada); `favoritos.csv` ← `favoritos`. As tabelas `sessoes` (sessões vinculadas a um check-in, com sensação antes/depois) e `sessoes_jornadas_conteudo_progresso` (progresso por sessão de conteúdo dentro de uma jornada) têm colunas incompatíveis com as tabelas acima e continuam disponíveis no JSON completo, sem duplicar em CSV — misturá-las em qualquer um dos 5 arquivos violaria a regra de nunca combinar tabelas incompatíveis num único CSV.

- [ ] **Step 1: Escrever o teste da rota (falha primeiro)**

```ts
// @vitest-environment node
// src/app/api/exportar/[formato]/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { coletarDadosExportaveis } from '@/lib/exportacao/coletarDados';
import type { PacoteExportado } from '@/lib/exportacao/coletarDados';

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: vi.fn(),
}));

vi.mock('@/lib/exportacao/coletarDados', () => ({
  coletarDadosExportaveis: vi.fn(),
}));

const USUARIA_ID = 'sessao-usuaria-abc';

function criarPacoteFake(overrides: Partial<PacoteExportado> = {}): PacoteExportado {
  return {
    exportado_em: '2026-08-24T10:00:00.000Z',
    conta: { id: USUARIA_ID, email: 'ana@exemplo.com', criado_em: '2026-01-01T00:00:00Z' },
    perfil: null,
    checkins: [{ id: 'chk-1', usuaria_id: USUARIA_ID, texto_livre: '=PERIGO()' } as never],
    jornadas: [],
    jornada_respostas_modulo: [],
    praticas: { sessoes: [], praticas_avulsas_concluidas: [], sessoes_jornadas_conteudo_progresso: [] },
    favoritos: [{ id: 'fav-1', usuaria_id: USUARIA_ID, pratica_id: 'prat-1', sessao_id: null, criado_em: '2026-01-01T00:00:00Z' }],
    petalas: { saldo: 0, transacoes: [] },
    recompensas: { resgates: [], desafios_semanais_concluidos: [] },
    notificacoes: null,
    intencao_pagamento: [],
    ...overrides,
  };
}

function criarSupabaseServerFake(opts: { user: { id: string; email: string; created_at: string } | null }) {
  return { auth: { getUser: vi.fn(async () => ({ data: { user: opts.user } })) } };
}

function criarSupabaseAdminFake() {
  const insert = vi.fn(async () => ({ error: null }));
  return {
    from: vi.fn(() => ({ insert })),
    __mocks: { insert },
  };
}

function requisicao(formato: string) {
  return { request: new NextRequest(`https://rose.exemplo.com/api/exportar/${formato}`), params: Promise.resolve({ formato }) };
}

beforeEach(() => {
  vi.mocked(createSupabaseServerClient).mockReset();
  vi.mocked(createSupabaseAdminClient).mockReset();
  vi.mocked(coletarDadosExportaveis).mockReset();
});

describe('GET /api/exportar/[formato]', () => {
  it('recusa sem sessão autenticada', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(criarSupabaseServerFake({ user: null }) as never);
    const { request, params } = requisicao('json');

    const resposta = await GET(request, { params });

    expect(resposta.status).toBe(401);
  });

  it('recusa formato inválido antes de consultar qualquer dado', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseServerFake({ user: { id: USUARIA_ID, email: 'ana@exemplo.com', created_at: '2026-01-01T00:00:00Z' } }) as never
    );
    const { request, params } = requisicao('xml');

    const resposta = await GET(request, { params });

    expect(resposta.status).toBe(400);
    expect(coletarDadosExportaveis).not.toHaveBeenCalled();
  });

  it('responde JSON com headers corretos (Content-Type, Content-Disposition com data, Cache-Control)', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseServerFake({ user: { id: USUARIA_ID, email: 'ana@exemplo.com', created_at: '2026-01-01T00:00:00Z' } }) as never
    );
    vi.mocked(coletarDadosExportaveis).mockResolvedValue({ pacote: criarPacoteFake() });
    const adminFake = criarSupabaseAdminFake();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);
    const { request, params } = requisicao('json');

    const resposta = await GET(request, { params });

    expect(resposta.status).toBe(200);
    expect(resposta.headers.get('content-type')).toBe('application/json');
    expect(resposta.headers.get('cache-control')).toBe('private, no-store');
    expect(resposta.headers.get('content-disposition')).toMatch(
      /^attachment; filename="rose-meus-dados-\d{4}-\d{2}-\d{2}\.json"$/
    );

    const corpo = await resposta.json();
    expect(corpo.conta.id).toBe(USUARIA_ID);
  });

  it('responde ZIP (CSV) com Content-Type application/zip e extensão .zip no nome do arquivo', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseServerFake({ user: { id: USUARIA_ID, email: 'ana@exemplo.com', created_at: '2026-01-01T00:00:00Z' } }) as never
    );
    vi.mocked(coletarDadosExportaveis).mockResolvedValue({ pacote: criarPacoteFake() });
    const adminFake = criarSupabaseAdminFake();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);
    const { request, params } = requisicao('csv');

    const resposta = await GET(request, { params });

    expect(resposta.status).toBe(200);
    expect(resposta.headers.get('content-type')).toBe('application/zip');
    expect(resposta.headers.get('content-disposition')).toMatch(
      /^attachment; filename="rose-meus-dados-\d{4}-\d{2}-\d{2}\.zip"$/
    );
  });

  it('o ZIP contém exatamente os 5 CSVs esperados, e o texto de check-in perigoso vem escapado', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseServerFake({ user: { id: USUARIA_ID, email: 'ana@exemplo.com', created_at: '2026-01-01T00:00:00Z' } }) as never
    );
    vi.mocked(coletarDadosExportaveis).mockResolvedValue({ pacote: criarPacoteFake() });
    vi.mocked(createSupabaseAdminClient).mockReturnValue(criarSupabaseAdminFake() as never);
    const { request, params } = requisicao('csv');

    const resposta = await GET(request, { params });
    const bytes = new Uint8Array(await resposta.arrayBuffer());

    const decoder = new TextDecoder();
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const nomes: string[] = [];
    let conteudoCheckins = '';
    let cursor = 0;
    while (cursor < bytes.length && view.getUint32(cursor, true) === 0x04034b50) {
      const tamanhoComprimido = view.getUint32(cursor + 18, true);
      const tamanhoNome = view.getUint16(cursor + 26, true);
      const inicioNome = cursor + 30;
      const nome = decoder.decode(bytes.slice(inicioNome, inicioNome + tamanhoNome));
      const inicioConteudo = inicioNome + tamanhoNome;
      if (nome === 'checkins.csv') {
        conteudoCheckins = decoder.decode(bytes.slice(inicioConteudo, inicioConteudo + tamanhoComprimido));
      }
      nomes.push(nome);
      cursor = inicioConteudo + tamanhoComprimido;
    }

    expect(nomes).toEqual(['checkins.csv', 'reflexoes.csv', 'praticas.csv', 'jornadas.csv', 'favoritos.csv']);
    expect(conteudoCheckins).toContain("'=PERIGO()");
    expect(conteudoCheckins).not.toMatch(/,=PERIGO\(\)/); // nunca sem o prefixo de escape
  });

  it('registra a exportação em exportacoes_dados via admin client, só com usuaria_id e tipo', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseServerFake({ user: { id: USUARIA_ID, email: 'ana@exemplo.com', created_at: '2026-01-01T00:00:00Z' } }) as never
    );
    vi.mocked(coletarDadosExportaveis).mockResolvedValue({ pacote: criarPacoteFake() });
    const adminFake = criarSupabaseAdminFake();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);
    const { request, params } = requisicao('json');

    await GET(request, { params });

    expect(adminFake.from).toHaveBeenCalledWith('exportacoes_dados');
    expect(adminFake.__mocks.insert).toHaveBeenCalledWith({ usuaria_id: USUARIA_ID, tipo: 'json' });
  });

  it('devolve o arquivo mesmo se o registro de auditoria falhar (best-effort, nunca bloqueia o download)', async () => {
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseServerFake({ user: { id: USUARIA_ID, email: 'ana@exemplo.com', created_at: '2026-01-01T00:00:00Z' } }) as never
    );
    vi.mocked(coletarDadosExportaveis).mockResolvedValue({ pacote: criarPacoteFake() });
    vi.mocked(createSupabaseAdminClient).mockReturnValue(null);
    const { request, params } = requisicao('json');

    const resposta = await GET(request, { params });

    expect(resposta.status).toBe(200);
    expect(spyConsole).toHaveBeenCalled();
    spyConsole.mockRestore();
  });

  it('retorna 500 sem vazar detalhe interno quando a coleta de dados falha', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseServerFake({ user: { id: USUARIA_ID, email: 'ana@exemplo.com', created_at: '2026-01-01T00:00:00Z' } }) as never
    );
    vi.mocked(coletarDadosExportaveis).mockResolvedValue({ erro: 'Não foi possível preparar seus dados agora. Tente novamente.' });
    const { request, params } = requisicao('json');

    const resposta = await GET(request, { params });
    const corpo = await resposta.json();

    expect(resposta.status).toBe(500);
    expect(corpo.erro).toBe('Não foi possível preparar seus dados agora. Tente novamente.');
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
npx vitest run "src/app/api/exportar/[formato]/route.test.ts"
```

Expected: FAIL — `Cannot find module './route'`.

- [ ] **Step 3: Implementar a rota**

```ts
// src/app/api/exportar/[formato]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { coletarDadosExportaveis, type PacoteExportado } from '@/lib/exportacao/coletarDados';
import { paraCsv } from '@/lib/exportacao/csv';
import { criarZip } from '@/lib/exportacao/zip';

type Formato = 'json' | 'csv';

function formatoValido(valor: string): valor is Formato {
  return valor === 'json' || valor === 'csv';
}

function montarZipDeCsvs(pacote: PacoteExportado): Uint8Array {
  return criarZip([
    {
      nome: 'checkins.csv',
      conteudo: paraCsv(pacote.checkins as unknown as Record<string, unknown>[], [
        'id', 'data', 'humor', 'imagem_corporal', 'comida', 'texto_livre', 'sinal_seguranca',
        'estado_geral', 'emocao_especifica', 'intensidade', 'alimentacao_percebida',
        'gatilho_local', 'gatilho_pensamento', 'gatilho_emocao_depois', 'fatores', 'proxima_acao', 'criado_em',
      ]),
    },
    {
      nome: 'reflexoes.csv',
      conteudo: paraCsv(pacote.jornada_respostas_modulo as unknown as Record<string, unknown>[], [
        'id', 'jornada_usuario_id', 'atividade_id', 'sessao_id', 'schema_version', 'respostas', 'created_at', 'updated_at',
      ]),
    },
    {
      nome: 'praticas.csv',
      conteudo: paraCsv(pacote.praticas.praticas_avulsas_concluidas as unknown as Record<string, unknown>[], [
        'id', 'pratica_id', 'concluida_em', 'duracao_minutos',
      ]),
    },
    {
      nome: 'jornadas.csv',
      conteudo: paraCsv(pacote.jornadas as unknown as Record<string, unknown>[], [
        'id', 'jornada_id', 'dias_completados', 'status', 'iniciada_em', 'atualizada_em', 'concluida_em',
      ]),
    },
    {
      nome: 'favoritos.csv',
      conteudo: paraCsv(pacote.favoritos as unknown as Record<string, unknown>[], [
        'id', 'pratica_id', 'sessao_id', 'criado_em',
      ]),
    },
  ]);
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ formato: string }> }) {
  const { formato } = await params;

  if (!formatoValido(formato)) {
    return NextResponse.json({ erro: 'Formato de exportação inválido.' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ erro: 'Sessão expirada. Faça login novamente.' }, { status: 401 });
  }

  const resultado = await coletarDadosExportaveis(supabase, {
    id: user.id,
    email: user.email ?? null,
    criado_em: user.created_at,
  });

  if (resultado.erro || !resultado.pacote) {
    return NextResponse.json(
      { erro: resultado.erro ?? 'Não foi possível preparar seus dados agora. Tente novamente.' },
      { status: 500 }
    );
  }

  const dataArquivo = new Date().toISOString().slice(0, 10);
  const extensao = formato === 'json' ? 'json' : 'zip';
  const nomeArquivo = `rose-meus-dados-${dataArquivo}.${extensao}`;

  const corpo: BodyInit =
    formato === 'json' ? JSON.stringify(resultado.pacote, null, 2) : montarZipDeCsvs(resultado.pacote);
  const contentType = formato === 'json' ? 'application/json' : 'application/zip';

  // Registro de auditoria — só usuaria_id + tipo, nunca o conteúdo. Melhor
  // esforço: mesmo padrão de "não bloquear a operação principal por uma
  // falha secundária" já usado em src/app/api/perfil/excluir-conta/route.ts
  // para o cancelamento de assinatura Stripe. A tabela não tem policy nem
  // GRANT para `authenticated` — só o admin client (service role) escreve.
  const supabaseAdmin = createSupabaseAdminClient();
  if (supabaseAdmin) {
    const { error: erroRegistro } = await supabaseAdmin
      .from('exportacoes_dados')
      .insert({ usuaria_id: user.id, tipo: formato });
    if (erroRegistro) {
      console.error('[exportacao] Falha ao registrar auditoria da exportação', {
        code: erroRegistro.code,
        message: erroRegistro.message,
      });
    }
  } else {
    console.error('[exportacao] Admin client indisponível — exportação servida sem registro de auditoria.');
  }

  return new NextResponse(corpo, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${nomeArquivo}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

```bash
npx vitest run "src/app/api/exportar/[formato]/route.test.ts"
```

Expected: PASS (8 testes).

- [ ] **Step 5: Commit**

```bash
git add "src/app/api/exportar/[formato]/route.ts" "src/app/api/exportar/[formato]/route.test.ts"
git commit -m "feat(exportacao): rota de download autenticada /api/exportar/[formato]"
```

---

## Task 5: `exportarMeusDados` passa a delegar ao módulo canônico

**Files:**
- Modify: `src/app/perfil/privacidade/actions.ts`
- Modify: `src/app/perfil/privacidade/actions.test.ts`

**Interfaces:**
- Consumes: `coletarDadosExportaveis` (Task 2).
- Produces: `exportarMeusDados(): Promise<{ erro?: string; dados?: string }>` — assinatura pública inalterada (mesmo tipo de retorno de hoje), só a implementação interna muda.

- [ ] **Step 1: Reescrever `exportarMeusDados` para delegar ao módulo canônico**

Em `src/app/perfil/privacidade/actions.ts`, remova a função `perfilExportavel` (agora vive em `coletarDados.ts`) e substitua `exportarMeusDados` por:

```ts
'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { coletarDadosExportaveis } from '@/lib/exportacao/coletarDados';

export async function exportarMeusDados(): Promise<{ erro?: string; dados?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const resultado = await coletarDadosExportaveis(supabase, {
    id: user.id,
    email: user.email ?? null,
    criado_em: user.created_at,
  });

  if (resultado.erro || !resultado.pacote) {
    return { erro: resultado.erro ?? 'Não foi possível preparar seus dados agora. Tente novamente.' };
  }

  return { dados: JSON.stringify(resultado.pacote, null, 2) };
}

export async function enviarConfirmacaoExclusao(): Promise<{ erro?: string; emailEnviado?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect('/login');
  }

  const headersList = await headers();
  const origin = headersList.get('origin') ?? `https://${headersList.get('host')}`;

  const { error } = await supabase.auth.signInWithOtp({
    email: user.email,
    options: {
      emailRedirectTo: `${origin}/api/perfil/confirmar-exclusao`,
    },
  });

  if (error) {
    console.error('[privacidade] Falha ao enviar link de confirmação de exclusão', {
      code: error.code,
      message: error.message,
    });
    if (error.status === 429 || error.code === 'over_email_send_rate_limit') {
      return { erro: 'Aguarde alguns segundos antes de pedir outro link.' };
    }
    return { erro: 'Não foi possível enviar o link de confirmação. Tente novamente.' };
  }

  return { emailEnviado: user.email };
}
```

- [ ] **Step 2: Ajustar `actions.test.ts` para mockar o módulo canônico em vez do Supabase direto**

Substitua o `describe('exportarMeusDados', ...)` inteiro (e os mocks/fakes que só existiam para ele) por:

```ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportarMeusDados, enviarConfirmacaoExclusao } from './actions';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { coletarDadosExportaveis } from '@/lib/exportacao/coletarDados';
import type { PacoteExportado } from '@/lib/exportacao/coletarDados';

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock('@/lib/exportacao/coletarDados', () => ({
  coletarDadosExportaveis: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((rota: string) => {
    throw new Error(`NEXT_REDIRECT:${rota}`);
  }),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Map([['origin', 'https://rose.exemplo.com']])),
}));

type Usuaria = { id: string; email: string; created_at: string } | null;

function criarSupabaseFake(user: Usuaria) {
  const getUser = vi.fn(async (): Promise<{ data: { user: Usuaria } }> => ({ data: { user } }));
  const signInWithOtp = vi.fn(async (): Promise<{ error: { code?: string; message: string } | null }> => ({
    error: null,
  }));
  return { auth: { getUser, signInWithOtp } };
}

function criarPacoteFake(): PacoteExportado {
  return {
    exportado_em: '2026-08-24T10:00:00.000Z',
    conta: { id: 'usuaria-própria-123', email: 'ana@exemplo.com', criado_em: '2026-01-01T00:00:00Z' },
    perfil: { nome: 'Ana', plano: 'free', pais: 'BR', frase_pessoal: null, faixa_etaria: null, fuso_horario: 'America/Sao_Paulo', idioma: 'pt-BR', foto_url: null, horario_preferido_notificacao: null, assinatura_status: null, assinatura_periodo_fim: null, criado_em: '2026-01-01T00:00:00Z' },
    checkins: [{ id: 'chk-1' } as never],
    jornadas: [],
    jornada_respostas_modulo: [],
    praticas: { sessoes: [], praticas_avulsas_concluidas: [], sessoes_jornadas_conteudo_progresso: [] },
    favoritos: [],
    petalas: { saldo: 120, transacoes: [] },
    recompensas: { resgates: [], desafios_semanais_concluidos: [] },
    notificacoes: null,
    intencao_pagamento: [],
  };
}

beforeEach(() => {
  vi.mocked(createSupabaseServerClient).mockReset();
  vi.mocked(coletarDadosExportaveis).mockReset();
});

describe('exportarMeusDados', () => {
  it('delega a coleta de dados ao módulo canônico, passando a usuária da sessão', async () => {
    const fake = criarSupabaseFake({ id: 'usuaria-própria-123', email: 'ana@exemplo.com', created_at: '2026-01-01T00:00:00Z' });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);
    vi.mocked(coletarDadosExportaveis).mockResolvedValue({ pacote: criarPacoteFake() });

    const resultado = await exportarMeusDados();

    expect(coletarDadosExportaveis).toHaveBeenCalledWith(
      fake,
      expect.objectContaining({ id: 'usuaria-própria-123', email: 'ana@exemplo.com' })
    );
    expect(resultado.erro).toBeUndefined();
    const pacote = JSON.parse(resultado.dados as string);
    expect(pacote.petalas.saldo).toBe(120);
    expect(pacote.checkins).toHaveLength(1);
  });

  it('retorna o erro do módulo canônico sem inventar outra mensagem', async () => {
    const fake = criarSupabaseFake({ id: 'usuaria-própria-123', email: 'ana@exemplo.com', created_at: '2026-01-01T00:00:00Z' });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);
    vi.mocked(coletarDadosExportaveis).mockResolvedValue({ erro: 'Não foi possível preparar seus dados agora. Tente novamente.' });

    const resultado = await exportarMeusDados();

    expect(resultado.erro).toBe('Não foi possível preparar seus dados agora. Tente novamente.');
    expect(resultado.dados).toBeUndefined();
  });

  it('redireciona para /login quando não há usuária autenticada, sem chamar o módulo canônico', async () => {
    const fake = criarSupabaseFake(null);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    await expect(exportarMeusDados()).rejects.toThrow('NEXT_REDIRECT:/login');
    expect(coletarDadosExportaveis).not.toHaveBeenCalled();
  });
});

describe('enviarConfirmacaoExclusao', () => {
  it('envia o link de confirmação para o e-mail da própria usuária autenticada', async () => {
    const fake = criarSupabaseFake({ id: 'usuaria-própria-123', email: 'ana@exemplo.com', created_at: '2026-01-01T00:00:00Z' });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    const resultado = await enviarConfirmacaoExclusao();

    expect(resultado.erro).toBeUndefined();
    expect(resultado.emailEnviado).toBe('ana@exemplo.com');
    expect(fake.auth.signInWithOtp).toHaveBeenCalledWith(expect.objectContaining({ email: 'ana@exemplo.com' }));
  });

  it('retorna erro genérico quando o Supabase falha ao enviar o e-mail', async () => {
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fake = criarSupabaseFake({ id: 'usuaria-própria-123', email: 'ana@exemplo.com', created_at: '2026-01-01T00:00:00Z' });
    fake.auth.signInWithOtp.mockResolvedValue({ error: { code: '500', message: 'smtp indisponível' } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    const resultado = await enviarConfirmacaoExclusao();

    expect(resultado.erro).toBe('Não foi possível enviar o link de confirmação. Tente novamente.');
    expect(resultado.emailEnviado).toBeUndefined();
    spyConsole.mockRestore();
  });
});
```

- [ ] **Step 3: Rodar os testes e confirmar que passam**

```bash
npx vitest run src/app/perfil/privacidade/actions.test.ts
```

Expected: PASS (5 testes).

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```

Expected: sem novos erros.

- [ ] **Step 5: Commit**

```bash
git add src/app/perfil/privacidade/actions.ts src/app/perfil/privacidade/actions.test.ts
git commit -m "refactor(exportacao): exportarMeusDados passa a delegar ao modulo canonico de coleta"
```

---

## Task 6: `ExportarDadosBotao.tsx` chama a nova rota

**Files:**
- Modify: `src/app/perfil/privacidade/ExportarDadosBotao.tsx`
- Create: `src/app/perfil/privacidade/ExportarDadosBotao.test.tsx`

**Interfaces:**
- Consumes: `GET /api/exportar/[formato]` (Task 4), via `fetch`.
- Produces: componente `ExportarDadosBotao` sem props, com dois botões ("Baixar em JSON" / "Baixar em CSV (.zip)"), consumido por `src/app/perfil/privacidade/page.tsx` (já existente, sem alteração necessária — continua renderizando `<ExportarDadosBotao />`).

- [ ] **Step 1: Escrever o teste do componente (falha primeiro)**

```tsx
// src/app/perfil/privacidade/ExportarDadosBotao.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ExportarDadosBotao from './ExportarDadosBotao';

function respostaFake(opts: { ok: boolean; filename?: string; blob?: Blob }) {
  return {
    ok: opts.ok,
    headers: new Headers(opts.filename ? { 'content-disposition': `attachment; filename="${opts.filename}"` } : {}),
    blob: vi.fn(async () => opts.blob ?? new Blob(['conteudo'])),
  };
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:fake-url'), revokeObjectURL: vi.fn() });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ExportarDadosBotao', () => {
  it('renderiza os dois formatos de exportação', () => {
    render(<ExportarDadosBotao />);
    expect(screen.getByRole('button', { name: /baixar em json/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /baixar em csv/i })).toBeInTheDocument();
  });

  it('busca /api/exportar/json e dispara o download com o nome de arquivo do header', async () => {
    vi.mocked(fetch).mockResolvedValue(
      respostaFake({ ok: true, filename: 'rose-meus-dados-2026-08-24.json' }) as never
    );
    const cliqueSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<ExportarDadosBotao />);
    fireEvent.click(screen.getByRole('button', { name: /baixar em json/i }));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/exportar/json', expect.objectContaining({ cache: 'no-store' })));
    expect(cliqueSpy).toHaveBeenCalled();
    cliqueSpy.mockRestore();
  });

  it('busca /api/exportar/csv quando o botão de CSV é clicado', async () => {
    vi.mocked(fetch).mockResolvedValue(
      respostaFake({ ok: true, filename: 'rose-meus-dados-2026-08-24.zip' }) as never
    );
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<ExportarDadosBotao />);
    fireEvent.click(screen.getByRole('button', { name: /baixar em csv/i }));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/exportar/csv', expect.objectContaining({ cache: 'no-store' })));
  });

  it('mostra erro amigável quando a resposta não é ok', async () => {
    vi.mocked(fetch).mockResolvedValue(respostaFake({ ok: false }) as never);

    render(<ExportarDadosBotao />);
    fireEvent.click(screen.getByRole('button', { name: /baixar em json/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/não foi possível exportar/i);
  });

  it('desabilita os botões enquanto uma exportação está em andamento', async () => {
    let resolverFetch: (valor: unknown) => void = () => {};
    vi.mocked(fetch).mockReturnValue(new Promise((resolve) => (resolverFetch = resolve)) as never);

    render(<ExportarDadosBotao />);
    fireEvent.click(screen.getByRole('button', { name: /baixar em json/i }));

    expect(screen.getByRole('button', { name: /preparando/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /baixar em csv/i })).toBeDisabled();

    resolverFetch(respostaFake({ ok: true, filename: 'rose-meus-dados-2026-08-24.json' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /baixar em json/i })).toBeEnabled());
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
npx vitest run src/app/perfil/privacidade/ExportarDadosBotao.test.tsx
```

Expected: FAIL — o componente atual não tem botões "Baixar em JSON"/"Baixar em CSV" nem chama `fetch`.

- [ ] **Step 3: Reescrever o componente**

```tsx
// src/app/perfil/privacidade/ExportarDadosBotao.tsx
'use client';

import { useState, useTransition } from 'react';
import Botao from '@/app/components/Botao';

type Formato = 'json' | 'csv';

const NOME_PADRAO: Record<Formato, string> = {
  json: 'rose-meus-dados.json',
  csv: 'rose-meus-dados.zip',
};

async function baixarExportacao(formato: Formato): Promise<string | null> {
  const resposta = await fetch(`/api/exportar/${formato}`, { cache: 'no-store' });

  if (!resposta.ok) {
    return 'Não foi possível exportar seus dados agora. Tente novamente.';
  }

  const disposicao = resposta.headers.get('content-disposition') ?? '';
  const nomeCasado = disposicao.match(/filename="([^"]+)"/);
  const nomeArquivo = nomeCasado?.[1] ?? NOME_PADRAO[formato];

  const blob = await resposta.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(url);
  return null;
}

export default function ExportarDadosBotao() {
  const [erro, setErro] = useState<string | null>(null);
  const [formatoEmAndamento, setFormatoEmAndamento] = useState<Formato | null>(null);
  const [exportando, startTransition] = useTransition();

  function handleExportar(formato: Formato) {
    setErro(null);
    setFormatoEmAndamento(formato);
    startTransition(async () => {
      const mensagemErro = await baixarExportacao(formato);
      setErro(mensagemErro);
    });
  }

  return (
    <div className="space-y-2">
      <Botao
        variante="secundaria"
        type="button"
        onClick={() => handleExportar('json')}
        disabled={exportando}
      >
        {exportando && formatoEmAndamento === 'json' ? 'Preparando...' : 'Baixar em JSON'}
      </Botao>
      <Botao
        variante="secundaria"
        type="button"
        onClick={() => handleExportar('csv')}
        disabled={exportando}
      >
        {exportando && formatoEmAndamento === 'csv' ? 'Preparando...' : 'Baixar em CSV (.zip)'}
      </Botao>
      {erro && (
        <p role="alert" className="text-sm text-alerta">
          {erro}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

```bash
npx vitest run src/app/perfil/privacidade/ExportarDadosBotao.test.tsx
```

Expected: PASS (5 testes).

- [ ] **Step 5: Commit**

```bash
git add src/app/perfil/privacidade/ExportarDadosBotao.tsx src/app/perfil/privacidade/ExportarDadosBotao.test.tsx
git commit -m "feat(exportacao): botao de exportar passa a baixar via /api/exportar/[formato]"
```

---

## Task 7: Verificação completa da feature

**Files:** nenhum (só verificação — corrija de volta na task correspondente se algo quebrar).

- [ ] **Step 1: Suíte de testes desta feature**

```bash
npx vitest run src/lib/exportacao "src/app/api/exportar/[formato]" src/app/perfil/privacidade
```

Expected: todos os testes das Tasks 1–6 passam (coletarDados, csv, zip, route, actions, ExportarDadosBotao).

- [ ] **Step 2: Typecheck, lint e suíte completa**

```bash
npx tsc --noEmit
npm run lint
npm test
```

Expected: os três limpos, sem novos erros/avisos e sem nenhum teste quebrado em outras áreas do app.

- [ ] **Step 3: Build de produção**

```bash
npm run build
```

Expected: build conclui sem erros, incluindo a nova rota `/api/exportar/[formato]` listada nas rotas dinâmicas.

- [ ] **Step 4: Conferência manual da checklist da Seção 8 do design**

Confirme, lendo o próprio código já commitado (sem alterar nada neste passo):
- `exportarMeusDados` e a rota `/api/exportar/[formato]` chamam as duas o mesmo `coletarDadosExportaveis` — nenhuma lógica de busca duplicada.
- O pacote inclui `jornada_respostas_modulo`, `sessoes_jornadas_conteudo_progresso` e `favoritos`, todos lidos com o cliente autenticado (nunca `createSupabaseAdminClient` em `coletarDados.ts`).
- CSV é entregue como ZIP com exatamente `checkins.csv`, `reflexoes.csv`, `praticas.csv`, `jornadas.csv`, `favoritos.csv`.
- Headers da rota: `Cache-Control: private, no-store`, `Content-Disposition: attachment; filename="rose-meus-dados-{data}.{ext}"`, `Content-Type` correto por formato.
- `escaparCelulaCsv` prefixa `'` em valores que começam com `=`/`+`/`-`/`@` mesmo com espaço/tab/quebra de linha antes.
- A gravação em `exportacoes_dados` só acontece na rota (nunca em `coletarDados.ts` nem em `actions.ts`), sempre via `createSupabaseAdminClient`, sempre só com `usuaria_id` + `tipo`.
- `ExportarDadosBotao.tsx` não monta mais o Blob a partir de uma server action — busca a rota via `fetch`.
- Nenhum dos arquivos toca `role`, `stripe_customer_id`, `stripe_subscription_id` ou `push_subscriptions`.

- [ ] **Step 5: Reportar**

Sem novo commit neste passo (a menos que o Step 2/3 exija correção — nesse caso, uma pequena correção adicional seguindo o padrão de mensagem das tasks acima). Resuma para quem revisar o PR: arquivos alterados/criados, migration nova (`exportacoes_dados_fundacao`), resultado de testes/typecheck/lint/build, e a decisão de arquitetura do ZIP sem dependência nova (Task 3).

---

## Self-review

**Cobertura da Seção 8 do design:**
- Módulo canônico único (`coletarDadosExportaveis`), reaproveitado por `exportarMeusDados` (Task 5) e pela rota (Task 4) — nenhuma lógica duplicada. ✅ (Tasks 2, 4, 5)
- Tabelas novas lidas com cliente autenticado/RLS, nunca service role. ✅ (Task 2, comentário explícito no código)
- JSON como arquivo único; CSV como ZIP com os 5 arquivos nomeados exatamente como no design. ✅ (Tasks 3, 4)
- Rota autenticada `/api/exportar/[formato]` com os 3 headers exigidos. ✅ (Task 4)
- Escape de formula injection com a regra exata de espaço/tab/quebra à esquerda. ✅ (Task 3)
- Registro em `exportacoes_dados` só na rota, via admin client, só `usuaria_id`+`tipo`. ✅ (Tasks 1, 4)
- UI chama a rota em vez de montar Blob no cliente. ✅ (Task 6)
- Nunca inclui `role`/`stripe_customer_id`/`stripe_subscription_id`/`push_subscriptions`/dados administrativos/de outra usuária — coberto por teste explícito em `coletarDados.test.ts` e por `coletarDados.ts` nunca selecionar essas colunas/tabelas. ✅ (Task 2)
- Testes exigidos pelo design: headers de download (Task 4), conteúdo do ZIP (Tasks 3 e 4), escape com espaço/tab/quebra antes do caractere perigoso (Task 3), isolamento entre usuárias nas tabelas novas (Task 2). ✅

**Scan de placeholders:** nenhum "TODO"/"implementar depois"/"similar à task anterior" — todo Step de código tem o arquivo completo ou o trecho exato a substituir.

**Consistência de tipos entre tasks:** `PacoteExportado` (Task 2) é o mesmo tipo usado em `route.ts` (Task 4) e nos testes de `actions.test.ts` (Task 5); `coletarDadosExportaveis(supabase, { id, email, criado_em })` tem a mesma assinatura em todos os três consumidores; `ArquivoZip`/`criarZip` (Task 3) e `paraCsv`/`escaparCelulaCsv` (Task 3) são usados em `route.ts` (Task 4) exatamente com os nomes exportados.
