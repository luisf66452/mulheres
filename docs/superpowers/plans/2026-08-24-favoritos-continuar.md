# Favoritos e Continuar de Onde Parei — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Seção 5 do design "Evolução da Rose — Fase 2" (`docs/superpowers/specs/2026-08-24-evolucao-rose-design.md`): favoritar/desfavoritar práticas (tabela `praticas`) e sessões de jornadas-conteudo, a página `/favoritos`, e o card "Continuar de onde parei" na Home, reaproveitando o progresso real já persistido (`sessoes_jornadas_conteudo_progresso`) e o progresso local por dispositivo das práticas rápidas de escrita.

**Architecture:** Nova tabela `favoritos` (uma referência por linha, práticas OU sessões, nunca as duas) com RLS por `usuaria_id`, validada no servidor contra o estado real do conteúdo antes de cada insert (nunca confia só na FK/catálogo). `BotaoFavorito` é um client component fino que chama server actions; toda leitura de estado (favoritado, disponível, Pro) acontece em server components. "Continuar de onde parei" é resolvido por um módulo puro e testável (`continuarDeOndeParei.ts`) que aplica a prioridade sessão-em-andamento → próxima-sessão-desbloqueada, com um pequeno fallback client-side (Prioridade 3) para rascunhos guardados em `localStorage` pelas práticas rápidas de escrita, já que essa única fonte é local por dispositivo e inacessível do servidor.

**Tech Stack:** Next.js (App Router, Server Actions), Supabase (Postgres + RLS + PostgREST), TypeScript, Vitest + @testing-library/react, pgTAP (`supabase test db`).

## Global Constraints

- A Rose não é terapia, não diagnostica, não substitui acompanhamento profissional — nenhum texto novo deste plano viola isso.
- Segurança, exportação e privacidade nunca ficam atrás do Rose Pro (não se aplica diretamente a favoritos, mas o paywall de conteúdo nunca pode ser contornado por favoritar).
- Mobile-first, acolhedor, sem cores/mensagens punitivas.
- `supabase migration new <nome>` para cada migration (nunca nome de arquivo manual).
- RLS habilitada em toda tabela nova; policies `to authenticated`; usa `(select auth.uid()) = usuaria_id` (não `auth.uid()` puro, não `auth.role()`); UPDATE (quando existir) com `USING` e `WITH CHECK`; nunca GRANT a `anon`; nunca `SECURITY DEFINER` para contornar RLS.
- Idempotência (`drop policy if exists`, `create table if not exists`, `create unique index if not exists`) e `notify pgrst, 'reload schema';` ao final de toda migration.
- Tipos TypeScript (`src/lib/supabase/types.ts`) atualizados manualmente após cada migration (sem `supabase gen types` configurado).
- Favoritos e continuar de onde parei disponíveis em todos os planos, respeitando o paywall do conteúdo original (`Favoritos / continuar | Todas, respeitando paywall do conteúdo original`).

---

## File Structure

```
supabase/migrations/<timestamp>_favoritos_e_praticas_is_pro.sql   [novo]
supabase/tests/favoritos_rls.test.sql                              [novo]

src/lib/supabase/types.ts                                          [modificado]

src/lib/jornadas-conteudo/dados.ts                                 [modificado — nova função de busca cross-jornada]
src/lib/jornadas-conteudo/dados.test.ts                            [modificado]

src/lib/jornadas-conteudo/continuarDeOndeParei.ts                  [novo]
src/lib/jornadas-conteudo/continuarDeOndeParei.test.ts             [novo]

src/app/favoritos/actions.ts                                       [novo]
src/app/favoritos/actions.test.ts                                  [novo]
src/app/favoritos/page.tsx                                         [novo]
src/app/favoritos/page.test.tsx                                    [novo]
src/app/favoritos/BotaoRemoverFavorito.tsx                         [novo]
src/app/favoritos/CartaoFavoritoIndisponivel.tsx                   [novo]

src/app/components/favoritos/BotaoFavorito.tsx                     [novo]
src/app/components/favoritos/BotaoFavorito.test.tsx                [novo]

src/app/praticas/CartaoPratica.tsx                                 [modificado — recebe `favoritado`, usa BotaoFavorito]
src/app/praticas/CartaoPratica.test.tsx                             [novo]

src/app/praticas/[id]/page.tsx                                     [modificado — gate is_pro server-side]
src/app/praticas/[id]/page.test.tsx                                 [novo]
src/app/praticas/[id]/PaywallPratica.tsx                            [novo]

src/app/jornadas/[slug]/[sessaoId]/page.tsx                        [modificado — busca `favoritado`, passa para SessaoClient]
src/app/jornadas/[slug]/[sessaoId]/SessaoClient.tsx                [modificado — BotaoFavorito no cabeçalho]
src/app/jornadas/[slug]/[sessaoId]/SessaoClient.test.tsx           [novo]

src/app/components/inicio/ContinuarDeOndeParei.tsx                 [novo]
src/app/components/inicio/ContinuarDeOndeParei.test.tsx            [novo]
src/app/components/inicio/ContinuarPraticaLocalClient.tsx          [novo]
src/app/components/inicio/ContinuarPraticaLocalClient.test.tsx     [novo]

src/app/page.tsx                                                   [modificado — inclui <ContinuarDeOndeParei />]
```

---

## Task 1: Migration — tabela `favoritos` e `praticas.is_pro`

**Files:**
- Create: `supabase/migrations/<timestamp>_favoritos_e_praticas_is_pro.sql` (timestamp gerado pelo CLI)
- Modify: `src/lib/supabase/types.ts`

**Interfaces:**
- Produces: tabela `public.favoritos` (`id`, `usuaria_id`, `pratica_id`, `sessao_id`, `criado_em`); coluna `public.praticas.is_pro boolean not null default false`; tipo `Favorito` e entrada `Database['public']['Tables']['favoritos']` em `src/lib/supabase/types.ts`; campo `is_pro: boolean` em `Pratica`.

**Nota de execução:** o plano `docs/superpowers/plans/2026-08-24-fundacao-banco-rose.md` (Seção 1, executado antes deste na ordem definida no design) já cria `public.favoritos` e `public.praticas.is_pro` com o mesmo schema. Se aquele plano já foi executado, **pule a Step 1-2 desta task** (não gere uma segunda migration) e vá direto para a Step 3 (tipos TypeScript) — a menos que o tipo `Favorito`/`is_pro` já tenha sido adicionado por lá, caso em que esta task inteira vira só uma verificação (Step 4). O SQL abaixo é idempotente (`if not exists`/`drop policy if exists` em tudo) e seguro de rodar mesmo se a tabela já existir, caso a ordem de execução real seja diferente da planejada.

- [ ] **Step 1: Gerar o arquivo de migration**

Run: `supabase migration new favoritos_e_praticas_is_pro`

Isso cria `supabase/migrations/<timestamp>_favoritos_e_praticas_is_pro.sql` vazio. Substitua todo o conteúdo do arquivo gerado pelo SQL abaixo (mantendo o nome/timestamp gerado pelo CLI).

- [ ] **Step 2: Escrever a migration**

```sql
-- favoritos_e_praticas_is_pro.sql
-- Fundação de banco necessária para a Seção 5 (Favoritos e "Continuar de
-- onde parei") do design "Evolução da Rose — Fase 2". Cria a tabela
-- `favoritos` (referencia uma prática do banco OU uma sessão de
-- jornadas-conteudo, nunca as duas na mesma linha) e adiciona
-- `praticas.is_pro`, usado pelo gate Pro server-side da rota de conteúdo.
-- Subconjunto mínimo da Seção 1 do design necessário para a Seção 5 — as
-- demais tabelas/colunas da Seção 1 (exportacoes_dados, recursos_seguranca,
-- perfis.objetivos/temas_sensiveis etc., audio_url/audio_status/duracao/
-- transcricao de praticas) pertencem a outras seções e não são criadas aqui.

create table if not exists public.favoritos (
  id uuid primary key default gen_random_uuid(),
  usuaria_id uuid not null references public.perfis(id) on delete cascade,
  pratica_id uuid references public.praticas(id) on delete cascade,
  sessao_id text,
  criado_em timestamptz not null default now(),
  constraint favoritos_exatamente_um_alvo check ((pratica_id is not null) <> (sessao_id is not null))
);

-- sessao_id é texto sem FK de propósito: o catálogo de sessões de jornada
-- vive em código (src/lib/jornadas-conteudo/dados.ts), não numa tabela —
-- mesmo padrão de sessoes_jornadas_conteudo_progresso.sessao_id (migração
-- 20260818220822). Existência validada no servidor (favoritar()), nunca por
-- constraint de banco.
create unique index if not exists favoritos_usuaria_pratica_unico
  on public.favoritos (usuaria_id, pratica_id)
  where pratica_id is not null;

create unique index if not exists favoritos_usuaria_sessao_unico
  on public.favoritos (usuaria_id, sessao_id)
  where sessao_id is not null;

alter table public.favoritos enable row level security;

drop policy if exists "usuaria le proprios favoritos" on public.favoritos;
create policy "usuaria le proprios favoritos"
  on public.favoritos for select
  using ((select auth.uid()) = usuaria_id);

drop policy if exists "usuaria insere proprios favoritos" on public.favoritos;
create policy "usuaria insere proprios favoritos"
  on public.favoritos for insert
  with check ((select auth.uid()) = usuaria_id);

drop policy if exists "usuaria remove proprios favoritos" on public.favoritos;
create policy "usuaria remove proprios favoritos"
  on public.favoritos for delete
  using ((select auth.uid()) = usuaria_id);

-- Sem policy de update: favoritar/desfavoritar são sempre insert/delete —
-- nunca existe edição de uma linha de favorito já criada.
grant select, insert, delete on public.favoritos to authenticated;

-- `is_pro` decide, na camada de aplicação (nunca só no cliente), se uma
-- prática exige plano premium para ser aberta. Default false preserva o
-- comportamento atual — nenhuma prática existente fica bloqueada
-- retroativamente.
alter table public.praticas
  add column if not exists is_pro boolean not null default false;

notify pgrst, 'reload schema';
```

- [ ] **Step 3: Atualizar os tipos TypeScript**

Em `src/lib/supabase/types.ts`, no tipo `Pratica` (linhas 99-107), adicione `is_pro` logo após `status`:

```typescript
export type Pratica = {
  id: string;
  categoria: string;
  tipo: TipoPratica;
  titulo: string;
  conteudo: string;
  status: StatusPratica;
  is_pro: boolean;
  criado_em: string;
};
```

Logo após o tipo `ConclusaoPraticaConteudo` (após a linha 314), adicione o novo tipo `Favorito`:

```typescript
export type Favorito = {
  id: string;
  usuaria_id: string;
  pratica_id: string | null;
  sessao_id: string | null;
  criado_em: string;
};
```

Dentro de `Database['public']['Tables']`, logo após a entrada `conclusoes_praticas_conteudo`, adicione:

```typescript
      favoritos: {
        Row: Favorito;
        Insert: Pick<Favorito, 'usuaria_id'> & Partial<Pick<Favorito, 'pratica_id' | 'sessao_id'>>;
        Update: Partial<Favorito>;
        Relationships: [];
      };
```

- [ ] **Step 4: Verificar que o projeto compila com os novos tipos**

Run: `npx tsc --noEmit`
Expected: nenhum erro novo relacionado a `Pratica`/`Favorito`/`favoritos` (erros pré-existentes não relacionados, se houver, não são desta task).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations src/lib/supabase/types.ts
git commit -m "feat(db): cria tabela favoritos e coluna praticas.is_pro"
```

---

## Task 2: Busca de sessão em qualquer jornada do catálogo

**Files:**
- Modify: `src/lib/jornadas-conteudo/dados.ts`
- Modify: `src/lib/jornadas-conteudo/dados.test.ts`

**Interfaces:**
- Consumes: `JORNADAS: Jornada[]`, `Jornada`/`Modulo`/`Sessao` de `./tipos` (já existentes no arquivo).
- Produces: `export function buscarSessaoEmQualquerJornada(sessaoId: string): { jornada: Jornada; modulo: Modulo; sessao: Sessao } | undefined` de `@/lib/jornadas-conteudo/dados`. Usada por: `favoritar()`/`desfavoritar()` (Task 4, para validar `sessao_id` contra o catálogo) e pela página `/favoritos` (Task 7, para resolver título/jornada de uma sessão favoritada).

- [ ] **Step 1: Escrever o teste**

Adicione ao final de `src/lib/jornadas-conteudo/dados.test.ts` (dentro do `describe('estrutura das jornadas', ...)` já existente, como novos `it` no mesmo nível do `buscarSessaoPorId encontra a primeira e a última sessão de cada jornada`):

```typescript
  it('buscarSessaoEmQualquerJornada encontra uma sessão sem precisar do slug da jornada', () => {
    const jornada = JORNADAS[0];
    const sessoes = listarSessoesEmOrdem(jornada);
    const encontrada = buscarSessaoEmQualquerJornada(sessoes[0].id);
    expect(encontrada?.jornada.slug).toBe(jornada.slug);
    expect(encontrada?.sessao.id).toBe(sessoes[0].id);
  });

  it('buscarSessaoEmQualquerJornada retorna undefined para um id inexistente', () => {
    expect(buscarSessaoEmQualquerJornada('id-que-nao-existe')).toBeUndefined();
  });
```

E atualize o import no topo do arquivo:

```typescript
import {
  JORNADAS,
  contarModulos,
  contarSessoes,
  listarSessoesEmOrdem,
  buscarSessaoPorId,
  buscarSessaoEmQualquerJornada,
} from './dados';
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/lib/jornadas-conteudo/dados.test.ts`
Expected: FAIL com `buscarSessaoEmQualquerJornada is not a function` (ou erro de import).

- [ ] **Step 3: Implementar**

Em `src/lib/jornadas-conteudo/dados.ts`, logo após a função `buscarSessaoPorId` (linha 1598), adicione:

```typescript
export function buscarSessaoEmQualquerJornada(
  sessaoId: string
): { jornada: Jornada; modulo: Modulo; sessao: Sessao } | undefined {
  for (const jornada of JORNADAS) {
    for (const modulo of jornada.modulos) {
      const sessao = modulo.sessoes.find((s) => s.id === sessaoId);
      if (sessao) return { jornada, modulo, sessao };
    }
  }
  return undefined;
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run src/lib/jornadas-conteudo/dados.test.ts`
Expected: PASS em todos os testes do arquivo.

- [ ] **Step 5: Commit**

```bash
git add src/lib/jornadas-conteudo/dados.ts src/lib/jornadas-conteudo/dados.test.ts
git commit -m "feat(jornadas-conteudo): busca sessao por id em qualquer jornada do catalogo"
```

---

## Task 3: Lógica pura de "Continuar de onde parei" (jornadas)

**Files:**
- Create: `src/lib/jornadas-conteudo/continuarDeOndeParei.ts`
- Create: `src/lib/jornadas-conteudo/continuarDeOndeParei.test.ts`

**Interfaces:**
- Consumes: `calcularEstadosSessoes` de `./progresso`; `listarSessoesEmOrdem` de `./dados`; `Jornada` de `./tipos`; `SupabaseClient`/`Database` para a função de I/O.
- Produces (de `@/lib/jornadas-conteudo/continuarDeOndeParei`):
  - `interface LinhaProgressoSessao { jornadaSlug: string; sessaoId: string; iniciadaEm: string; concluidaEm: string | null }`
  - `interface ProximaAcaoJornada { jornadaSlug: string; sessaoId: string; modo: 'retomar' | 'proxima' }`
  - `function escolherSessaoEmAndamento(linhas: LinhaProgressoSessao[]): LinhaProgressoSessao | null`
  - `function escolherProximaSessaoDesbloqueada(jornadas: Jornada[], linhas: LinhaProgressoSessao[]): { jornadaSlug: string; sessaoId: string } | null`
  - `function resolverProximaAcaoJornada(jornadas: Jornada[], linhas: LinhaProgressoSessao[]): ProximaAcaoJornada | null`
  - `async function buscarLinhasProgressoTodasJornadas(supabase: SupabaseClient<Database>, usuariaId: string): Promise<LinhaProgressoSessao[]>`
  - Usadas por `ContinuarDeOndeParei` (Task 9).

- [ ] **Step 1: Escrever os testes (lógica pura)**

Crie `src/lib/jornadas-conteudo/continuarDeOndeParei.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import {
  escolherSessaoEmAndamento,
  escolherProximaSessaoDesbloqueada,
  resolverProximaAcaoJornada,
  type LinhaProgressoSessao,
} from './continuarDeOndeParei';
import type { Jornada, Sessao } from './tipos';

function criarSessao(id: string): Sessao {
  return {
    id,
    titulo: `Sessão ${id}`,
    descricaoCurta: 'desc',
    duracaoMinutos: 5,
    tipo: 'reflexao',
    entendaEm1Minuto: 'texto',
    praticaGuiada: ['passo 1'],
    leveComVoce: 'texto',
    fontesCientificas: ['IC1'],
    revisaoStatus: 'pendente',
  };
}

function criarJornada(slug: string, idsSessoes: string[]): Jornada {
  return {
    id: slug,
    slug,
    titulo: `Jornada ${slug}`,
    descricaoCurta: 'desc',
    corCartao: 'pessego',
    modulos: [{ id: `${slug}-m1`, titulo: 'Módulo 1', sessoes: idsSessoes.map(criarSessao) }],
  };
}

const JORNADA_A = criarJornada('jornada-a', ['a-s1', 'a-s2', 'a-s3']);
const JORNADA_B = criarJornada('jornada-b', ['b-s1', 'b-s2']);

describe('escolherSessaoEmAndamento', () => {
  it('retorna null quando não há nenhuma sessão em andamento', () => {
    expect(escolherSessaoEmAndamento([])).toBeNull();
  });

  it('retorna a sessão com concluida_em nulo', () => {
    const linhas: LinhaProgressoSessao[] = [
      { jornadaSlug: 'jornada-a', sessaoId: 'a-s1', iniciadaEm: '2026-08-20T10:00:00.000Z', concluidaEm: '2026-08-20T10:05:00.000Z' },
      { jornadaSlug: 'jornada-a', sessaoId: 'a-s2', iniciadaEm: '2026-08-21T10:00:00.000Z', concluidaEm: null },
    ];
    expect(escolherSessaoEmAndamento(linhas)?.sessaoId).toBe('a-s2');
  });

  it('com mais de uma sessão em andamento em jornadas diferentes, escolhe a mais recentemente iniciada', () => {
    const linhas: LinhaProgressoSessao[] = [
      { jornadaSlug: 'jornada-a', sessaoId: 'a-s1', iniciadaEm: '2026-08-20T10:00:00.000Z', concluidaEm: null },
      { jornadaSlug: 'jornada-b', sessaoId: 'b-s1', iniciadaEm: '2026-08-22T10:00:00.000Z', concluidaEm: null },
    ];
    expect(escolherSessaoEmAndamento(linhas)?.sessaoId).toBe('b-s1');
  });
});

describe('escolherProximaSessaoDesbloqueada', () => {
  it('retorna null quando nenhuma jornada tem progresso registrado', () => {
    expect(escolherProximaSessaoDesbloqueada([JORNADA_A, JORNADA_B], [])).toBeNull();
  });

  it('retorna a próxima sessão desbloqueada (não a bloqueada) de uma jornada com uma sessão concluída', () => {
    const linhas: LinhaProgressoSessao[] = [
      { jornadaSlug: 'jornada-a', sessaoId: 'a-s1', iniciadaEm: '2026-08-20T10:00:00.000Z', concluidaEm: '2026-08-20T10:05:00.000Z' },
    ];
    const resultado = escolherProximaSessaoDesbloqueada([JORNADA_A, JORNADA_B], linhas);
    expect(resultado).toEqual({ jornadaSlug: 'jornada-a', sessaoId: 'a-s2' });
  });

  it('retorna null para uma jornada totalmente concluída (não sobra sessão desbloqueada)', () => {
    const linhas: LinhaProgressoSessao[] = [
      { jornadaSlug: 'jornada-b', sessaoId: 'b-s1', iniciadaEm: '2026-08-20T10:00:00.000Z', concluidaEm: '2026-08-20T10:05:00.000Z' },
      { jornadaSlug: 'jornada-b', sessaoId: 'b-s2', iniciadaEm: '2026-08-21T10:00:00.000Z', concluidaEm: '2026-08-21T10:05:00.000Z' },
    ];
    expect(escolherProximaSessaoDesbloqueada([JORNADA_B], linhas)).toBeNull();
  });

  it('nunca retorna uma sessão bloqueada (mais adiante do ponto real de progresso)', () => {
    // a-s1 concluída, a-s2 é a próxima desbloqueada, a-s3 continua bloqueada.
    const linhas: LinhaProgressoSessao[] = [
      { jornadaSlug: 'jornada-a', sessaoId: 'a-s1', iniciadaEm: '2026-08-20T10:00:00.000Z', concluidaEm: '2026-08-20T10:05:00.000Z' },
    ];
    const resultado = escolherProximaSessaoDesbloqueada([JORNADA_A], linhas);
    expect(resultado?.sessaoId).not.toBe('a-s3');
    expect(resultado?.sessaoId).toBe('a-s2');
  });

  it('com progresso em duas jornadas, escolhe a jornada tocada mais recentemente', () => {
    const linhas: LinhaProgressoSessao[] = [
      { jornadaSlug: 'jornada-a', sessaoId: 'a-s1', iniciadaEm: '2026-08-18T10:00:00.000Z', concluidaEm: '2026-08-18T10:05:00.000Z' },
      { jornadaSlug: 'jornada-b', sessaoId: 'b-s1', iniciadaEm: '2026-08-22T10:00:00.000Z', concluidaEm: '2026-08-22T10:05:00.000Z' },
    ];
    const resultado = escolherProximaSessaoDesbloqueada([JORNADA_A, JORNADA_B], linhas);
    expect(resultado).toEqual({ jornadaSlug: 'jornada-b', sessaoId: 'b-s2' });
  });
});

describe('resolverProximaAcaoJornada (prioridade)', () => {
  it('prioriza retomar uma sessão em andamento sobre buscar a próxima desbloqueada', () => {
    const linhas: LinhaProgressoSessao[] = [
      // jornada-a: s1 concluída, s2 desbloqueada mas nunca tocada.
      { jornadaSlug: 'jornada-a', sessaoId: 'a-s1', iniciadaEm: '2026-08-18T10:00:00.000Z', concluidaEm: '2026-08-18T10:05:00.000Z' },
      // jornada-b: s1 iniciada e NÃO concluída — deve vencer, mesmo sendo mais antiga.
      { jornadaSlug: 'jornada-b', sessaoId: 'b-s1', iniciadaEm: '2026-08-10T10:00:00.000Z', concluidaEm: null },
    ];
    const resultado = resolverProximaAcaoJornada([JORNADA_A, JORNADA_B], linhas);
    expect(resultado).toEqual({ jornadaSlug: 'jornada-b', sessaoId: 'b-s1', modo: 'retomar' });
  });

  it('sem sessão em andamento, cai para a próxima sessão desbloqueada', () => {
    const linhas: LinhaProgressoSessao[] = [
      { jornadaSlug: 'jornada-a', sessaoId: 'a-s1', iniciadaEm: '2026-08-18T10:00:00.000Z', concluidaEm: '2026-08-18T10:05:00.000Z' },
    ];
    const resultado = resolverProximaAcaoJornada([JORNADA_A], linhas);
    expect(resultado).toEqual({ jornadaSlug: 'jornada-a', sessaoId: 'a-s2', modo: 'proxima' });
  });

  it('sem nenhum progresso em nenhuma jornada, retorna null', () => {
    expect(resolverProximaAcaoJornada([JORNADA_A, JORNADA_B], [])).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npx vitest run src/lib/jornadas-conteudo/continuarDeOndeParei.test.ts`
Expected: FAIL (módulo `./continuarDeOndeParei` não existe ainda).

- [ ] **Step 3: Implementar a lógica pura e a função de I/O**

Crie `src/lib/jornadas-conteudo/continuarDeOndeParei.ts`:

```typescript
// Resolve a Prioridade 1 (retomar sessão em andamento) e a Prioridade 2
// (próxima sessão desbloqueada) do card "Continuar de onde parei" da Home
// (Seção 5 do design). A Prioridade 3 (rascunho local de prática rápida)
// não entra aqui: depende de localStorage, então é resolvida inteiramente
// no client component ContinuarPraticaLocalClient — este módulo cobre só o
// que é decidível a partir de sessoes_jornadas_conteudo_progresso.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import type { Jornada } from './tipos';
import { listarSessoesEmOrdem } from './dados';
import { calcularEstadosSessoes } from './progresso';

export interface LinhaProgressoSessao {
  jornadaSlug: string;
  sessaoId: string;
  iniciadaEm: string;
  concluidaEm: string | null;
}

export interface ProximaAcaoJornada {
  jornadaSlug: string;
  sessaoId: string;
  modo: 'retomar' | 'proxima';
}

/**
 * Prioridade 1: sessão com iniciada_em preenchido e concluida_em nulo.
 * Como o único índice único de sessoes_jornadas_conteudo_progresso é
 * (usuaria_id, sessao_id) — não por jornada — a usuária pode, em teoria,
 * ter sessões em andamento em mais de uma jornada ao mesmo tempo; desempata
 * pela mais recentemente iniciada.
 */
export function escolherSessaoEmAndamento(
  linhas: LinhaProgressoSessao[]
): LinhaProgressoSessao | null {
  const emAndamento = linhas.filter((linha) => linha.concluidaEm === null);
  if (emAndamento.length === 0) return null;
  return [...emAndamento].sort(
    (a, b) => new Date(b.iniciadaEm).getTime() - new Date(a.iniciadaEm).getTime()
  )[0];
}

/**
 * Prioridade 2: só chamada quando escolherSessaoEmAndamento já retornou
 * null. Considera só jornadas com pelo menos uma linha de progresso (uma
 * jornada nunca tocada não "continua" coisa nenhuma) e usa
 * calcularEstadosSessoes (já usado por /jornadas/[slug]) para nunca
 * expor uma sessão bloqueada nem uma jornada já 100% concluída. Entre
 * jornadas com progresso, prioriza a tocada mais recentemente.
 */
export function escolherProximaSessaoDesbloqueada(
  jornadas: Jornada[],
  linhas: LinhaProgressoSessao[]
): { jornadaSlug: string; sessaoId: string } | null {
  const linhasPorJornada = new Map<string, LinhaProgressoSessao[]>();
  for (const linha of linhas) {
    const lista = linhasPorJornada.get(linha.jornadaSlug) ?? [];
    lista.push(linha);
    linhasPorJornada.set(linha.jornadaSlug, lista);
  }

  const slugsPorRecencia = [...linhasPorJornada.entries()]
    .map(([slug, linhasDaJornada]) => ({
      slug,
      maisRecente: Math.max(...linhasDaJornada.map((l) => new Date(l.iniciadaEm).getTime())),
    }))
    .sort((a, b) => b.maisRecente - a.maisRecente)
    .map((entrada) => entrada.slug);

  for (const slug of slugsPorRecencia) {
    const jornada = jornadas.find((j) => j.slug === slug);
    if (!jornada) continue;

    const progresso: Record<string, { concluidaEm: string | null }> = {};
    for (const linha of linhasPorJornada.get(slug) ?? []) {
      progresso[linha.sessaoId] = { concluidaEm: linha.concluidaEm };
    }

    const estados = calcularEstadosSessoes(jornada, progresso);
    const proxima = listarSessoesEmOrdem(jornada).find((sessao) => estados[sessao.id] === 'disponivel');
    if (proxima) {
      return { jornadaSlug: slug, sessaoId: proxima.id };
    }
  }

  return null;
}

/** Composição das duas prioridades — ponto único usado pelo componente da Home. */
export function resolverProximaAcaoJornada(
  jornadas: Jornada[],
  linhas: LinhaProgressoSessao[]
): ProximaAcaoJornada | null {
  const emAndamento = escolherSessaoEmAndamento(linhas);
  if (emAndamento) {
    return { jornadaSlug: emAndamento.jornadaSlug, sessaoId: emAndamento.sessaoId, modo: 'retomar' };
  }

  const proxima = escolherProximaSessaoDesbloqueada(jornadas, linhas);
  if (proxima) {
    return { ...proxima, modo: 'proxima' };
  }

  return null;
}

/**
 * Lê, de uma vez, o progresso da usuária em TODAS as jornadas (não filtra
 * por jornada_slug, ao contrário de carregarProgressoJornada) — necessário
 * porque a Prioridade 1 precisa enxergar uma sessão em andamento em
 * qualquer jornada, e a Prioridade 2 precisa comparar recência entre
 * jornadas diferentes.
 */
export async function buscarLinhasProgressoTodasJornadas(
  supabase: SupabaseClient<Database>,
  usuariaId: string
): Promise<LinhaProgressoSessao[]> {
  const { data, error } = await supabase
    .from('sessoes_jornadas_conteudo_progresso')
    .select('jornada_slug, sessao_id, iniciada_em, concluida_em')
    .eq('usuaria_id', usuariaId);

  if (error) {
    console.error('Falha ao carregar progresso de jornadas para o card Continuar:', error.code, error.message);
    throw new Error('Não foi possível carregar o progresso de jornadas.');
  }

  return (data ?? []).map((linha) => ({
    jornadaSlug: linha.jornada_slug,
    sessaoId: linha.sessao_id,
    iniciadaEm: linha.iniciada_em,
    concluidaEm: linha.concluida_em,
  }));
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npx vitest run src/lib/jornadas-conteudo/continuarDeOndeParei.test.ts`
Expected: PASS em todos os testes.

- [ ] **Step 5: Commit**

```bash
git add src/lib/jornadas-conteudo/continuarDeOndeParei.ts src/lib/jornadas-conteudo/continuarDeOndeParei.test.ts
git commit -m "feat(jornadas-conteudo): logica pura de continuar de onde parei"
```

---

## Task 4: Server actions `favoritar` / `desfavoritar`

**Files:**
- Create: `src/app/favoritos/actions.ts`
- Create: `src/app/favoritos/actions.test.ts`

**Interfaces:**
- Consumes: `createSupabaseServerClient` de `@/lib/supabase/server`; `buscarSessaoEmQualquerJornada` de `@/lib/jornadas-conteudo/dados` (Task 2).
- Produces (de `@/app/favoritos/actions`):
  - `export type TipoFavorito = 'pratica' | 'sessao'`
  - `export async function favoritar(tipo: TipoFavorito, id: string): Promise<void>`
  - `export async function desfavoritar(tipo: TipoFavorito, id: string): Promise<void>`
  - Consumidas por `BotaoFavorito` (Task 5), `BotaoRemoverFavorito` (Task 7).

- [ ] **Step 1: Escrever os testes**

Crie `src/app/favoritos/actions.test.ts`:

```typescript
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

vi.mock('next/navigation', () => ({
  redirect: vi.fn((rota: string) => {
    throw new Error(`NEXT_REDIRECT:${rota}`);
  }),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({ createSupabaseServerClient: vi.fn() }));

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { favoritar, desfavoritar } from './actions';

const USUARIA_ID = 'usuaria-favoritos-1';

function criarSupabaseFake(opcoes: {
  praticaEncontrada?: { id: string } | null;
  insertError?: { code: string; message: string } | null;
  deleteError?: { code: string; message: string } | null;
}) {
  const chamadasInsert: unknown[] = [];
  const chamadasDelete: { coluna: string; valor: unknown }[] = [];

  const client = {
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: USUARIA_ID } } })) },
    from(tabela: string) {
      if (tabela === 'praticas') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: opcoes.praticaEncontrada ?? null, error: null }),
              }),
            }),
          }),
        };
      }

      if (tabela === 'favoritos') {
        const builder = {
          insert(valores: unknown) {
            chamadasInsert.push(valores);
            return Promise.resolve({ data: null, error: opcoes.insertError ?? null });
          },
          delete() {
            return builder;
          },
          eq(coluna: string, valor: unknown) {
            chamadasDelete.push({ coluna, valor });
            return builder;
          },
          then(resolve: (v: { data: null; error: unknown }) => void) {
            resolve({ data: null, error: opcoes.deleteError ?? null });
          },
        };
        return builder;
      }

      throw new Error(`tabela inesperada no fake: ${tabela}`);
    },
  };

  return { client: client as unknown as SupabaseClient<Database>, chamadasInsert, chamadasDelete };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('favoritar', () => {
  it('favorita uma prática publicada e existente', async () => {
    const { client, chamadasInsert } = criarSupabaseFake({ praticaEncontrada: { id: 'pratica-1' } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client);

    await favoritar('pratica', 'pratica-1');

    expect(chamadasInsert).toEqual([{ usuaria_id: USUARIA_ID, pratica_id: 'pratica-1', sessao_id: null }]);
  });

  it('rejeita favoritar uma prática que não existe ou não está publicada', async () => {
    const { client } = criarSupabaseFake({ praticaEncontrada: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client);

    await expect(favoritar('pratica', 'pratica-inexistente')).rejects.toThrow();
  });

  it('trata violação de unique (23505) como sucesso idempotente — favorito duplicado', async () => {
    const { client } = criarSupabaseFake({
      praticaEncontrada: { id: 'pratica-1' },
      insertError: { code: '23505', message: 'duplicate key' },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client);

    await expect(favoritar('pratica', 'pratica-1')).resolves.toBeUndefined();
  });

  it('propaga qualquer outro erro de insert que não seja 23505', async () => {
    const { client } = criarSupabaseFake({
      praticaEncontrada: { id: 'pratica-1' },
      insertError: { code: '42501', message: 'permission denied' },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client);

    await expect(favoritar('pratica', 'pratica-1')).rejects.toThrow();
  });

  it('favorita uma sessão que existe no catálogo de jornadas-conteudo', async () => {
    const { client, chamadasInsert } = criarSupabaseFake({});
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client);

    await favoritar('sessao', 'imagem-corporal-m1-s1');

    expect(chamadasInsert).toEqual([{ usuaria_id: USUARIA_ID, pratica_id: null, sessao_id: 'imagem-corporal-m1-s1' }]);
  });

  it('rejeita favoritar uma sessão que não existe no catálogo', async () => {
    const { client } = criarSupabaseFake({});
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client);

    await expect(favoritar('sessao', 'sessao-que-nao-existe')).rejects.toThrow();
  });

  it('redireciona para /login quando não há usuária autenticada', async () => {
    const { client } = criarSupabaseFake({});
    (client.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { user: null } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client);

    await expect(favoritar('pratica', 'pratica-1')).rejects.toThrow('NEXT_REDIRECT:/login');
  });
});

describe('desfavoritar', () => {
  it('remove um favorito de prática filtrando por usuaria_id e pratica_id', async () => {
    const { client, chamadasDelete } = criarSupabaseFake({});
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client);

    await desfavoritar('pratica', 'pratica-1');

    expect(chamadasDelete).toEqual([
      { coluna: 'usuaria_id', valor: USUARIA_ID },
      { coluna: 'pratica_id', valor: 'pratica-1' },
    ]);
  });

  it('remove um favorito de sessão filtrando por usuaria_id e sessao_id', async () => {
    const { client, chamadasDelete } = criarSupabaseFake({});
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client);

    await desfavoritar('sessao', 'imagem-corporal-m1-s1');

    expect(chamadasDelete).toEqual([
      { coluna: 'usuaria_id', valor: USUARIA_ID },
      { coluna: 'sessao_id', valor: 'imagem-corporal-m1-s1' },
    ]);
  });

  it('propaga erro de exclusão', async () => {
    const { client } = criarSupabaseFake({ deleteError: { code: '42501', message: 'permission denied' } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client);

    await expect(desfavoritar('pratica', 'pratica-1')).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npx vitest run src/app/favoritos/actions.test.ts`
Expected: FAIL (`./actions` não existe ainda).

- [ ] **Step 3: Implementar**

Crie `src/app/favoritos/actions.ts`:

```typescript
'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { buscarSessaoEmQualquerJornada } from '@/lib/jornadas-conteudo/dados';

export type TipoFavorito = 'pratica' | 'sessao';

/**
 * Marca uma prática ou sessão como favorita. Nunca confia só na FK/catálogo:
 * antes de inserir, confirma no servidor que a prática existe e está
 * publicada (praticas.status = 'publicada'), ou que a sessão existe no
 * catálogo de jornadas-conteudo (código, sem tabela). Um erro 23505
 * (violação do índice único parcial) é tratado como sucesso idempotente —
 * favoritar algo já favoritado nunca deve virar erro visível para a
 * usuária.
 */
export async function favoritar(tipo: TipoFavorito, id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  if (tipo === 'pratica') {
    const { data: pratica } = await supabase
      .from('praticas')
      .select('id')
      .eq('id', id)
      .eq('status', 'publicada')
      .maybeSingle();

    if (!pratica) {
      throw new Error('Esta prática não está disponível para favoritar.');
    }

    const { error } = await supabase
      .from('favoritos')
      .insert({ usuaria_id: user.id, pratica_id: id, sessao_id: null });

    if (error && error.code !== '23505') {
      throw new Error('Não foi possível favoritar esta prática agora.');
    }
  } else {
    if (!buscarSessaoEmQualquerJornada(id)) {
      throw new Error('Esta sessão não está disponível para favoritar.');
    }

    const { error } = await supabase
      .from('favoritos')
      .insert({ usuaria_id: user.id, pratica_id: null, sessao_id: id });

    if (error && error.code !== '23505') {
      throw new Error('Não foi possível favoritar esta sessão agora.');
    }
  }

  revalidatePath('/favoritos');
}

/** Remove um favorito. RLS já garante que só a própria linha da usuária pode ser afetada. */
export async function desfavoritar(tipo: TipoFavorito, id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const coluna = tipo === 'pratica' ? 'pratica_id' : 'sessao_id';

  const { error } = await supabase.from('favoritos').delete().eq('usuaria_id', user.id).eq(coluna, id);

  if (error) {
    throw new Error('Não foi possível remover este favorito agora.');
  }

  revalidatePath('/favoritos');
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npx vitest run src/app/favoritos/actions.test.ts`
Expected: PASS em todos os testes.

- [ ] **Step 5: Commit**

```bash
git add src/app/favoritos/actions.ts src/app/favoritos/actions.test.ts
git commit -m "feat(favoritos): server actions favoritar e desfavoritar"
```

---

## Task 5: `BotaoFavorito` (client)

**Files:**
- Create: `src/app/components/favoritos/BotaoFavorito.tsx`
- Create: `src/app/components/favoritos/BotaoFavorito.test.tsx`

**Interfaces:**
- Consumes: `favoritar`, `desfavoritar`, `TipoFavorito` de `@/app/favoritos/actions` (Task 4).
- Produces: `export default function BotaoFavorito({ tipo, id, favoritadoInicial, className }: { tipo: TipoFavorito; id: string; favoritadoInicial: boolean; className?: string })` de `@/app/components/favoritos/BotaoFavorito`. Consumido por `CartaoPratica` (Task 6) e `SessaoClient` (Task 6).

- [ ] **Step 1: Escrever o teste**

Crie `src/app/components/favoritos/BotaoFavorito.test.tsx`:

```typescript
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BotaoFavorito from './BotaoFavorito';

vi.mock('@/app/favoritos/actions', () => ({
  favoritar: vi.fn(async () => {}),
  desfavoritar: vi.fn(async () => {}),
}));

import { favoritar, desfavoritar } from '@/app/favoritos/actions';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('BotaoFavorito', () => {
  it('começa com aria-pressed=false quando favoritadoInicial é false', () => {
    render(<BotaoFavorito tipo="pratica" id="pratica-1" favoritadoInicial={false} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  });

  it('começa com aria-pressed=true quando favoritadoInicial é true', () => {
    render(<BotaoFavorito tipo="pratica" id="pratica-1" favoritadoInicial={true} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('ao clicar em um botão não favoritado, chama favoritar() e atualiza aria-pressed', async () => {
    render(<BotaoFavorito tipo="pratica" id="pratica-1" favoritadoInicial={false} />);
    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => expect(favoritar).toHaveBeenCalledWith('pratica', 'pratica-1'));
    expect(desfavoritar).not.toHaveBeenCalled();
  });

  it('ao clicar em um botão já favoritado, chama desfavoritar() e atualiza aria-pressed', async () => {
    render(<BotaoFavorito tipo="sessao" id="sessao-1" favoritadoInicial={true} />);
    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
    await waitFor(() => expect(desfavoritar).toHaveBeenCalledWith('sessao', 'sessao-1'));
  });

  it('reverte o estado visual se a action falhar', async () => {
    vi.mocked(favoritar).mockRejectedValueOnce(new Error('falhou'));
    render(<BotaoFavorito tipo="pratica" id="pratica-1" favoritadoInicial={false} />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false'));
  });

  it('não deixa o clique borbulhar para um Link/ancestral clicável', () => {
    const cliqueDoAncestral = vi.fn();
    render(
      <div onClick={cliqueDoAncestral}>
        <BotaoFavorito tipo="pratica" id="pratica-1" favoritadoInicial={false} />
      </div>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(cliqueDoAncestral).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/app/components/favoritos/BotaoFavorito.test.tsx`
Expected: FAIL (`./BotaoFavorito` não existe ainda).

- [ ] **Step 3: Implementar**

Crie `src/app/components/favoritos/BotaoFavorito.tsx`:

```tsx
'use client';

import { useState, useTransition, type MouseEvent } from 'react';
import { favoritar, desfavoritar, type TipoFavorito } from '@/app/favoritos/actions';

export default function BotaoFavorito({
  tipo,
  id,
  favoritadoInicial,
  className = '',
}: {
  tipo: TipoFavorito;
  id: string;
  favoritadoInicial: boolean;
  className?: string;
}) {
  const [favoritado, setFavoritado] = useState(favoritadoInicial);
  const [pendente, startTransition] = useTransition();

  function alternar(evento: MouseEvent<HTMLButtonElement>) {
    // Este botão frequentemente vive dentro (ou ao lado, sobre um link
    // "stretched") de um Cartao clicável — nunca deixa o clique navegar.
    evento.preventDefault();
    evento.stopPropagation();

    const proximoValor = !favoritado;
    setFavoritado(proximoValor);

    startTransition(async () => {
      try {
        if (proximoValor) {
          await favoritar(tipo, id);
        } else {
          await desfavoritar(tipo, id);
        }
      } catch {
        // Reverte a UI otimista se a action falhar (rede, RLS, validação de
        // servidor) — nunca deixa o botão "mentir" sobre o estado real.
        setFavoritado(!proximoValor);
      }
    });
  }

  return (
    <button
      type="button"
      aria-pressed={favoritado}
      aria-label={favoritado ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      onClick={alternar}
      disabled={pendente}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60 focus-visible:ring-offset-2 focus-visible:ring-offset-fundo disabled:opacity-60 ${
        favoritado ? 'text-acao' : 'text-texto-suave hover:text-acao'
      } ${className}`}
    >
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill={favoritado ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path
          d="M12 21s-7.5-4.7-10-9.3C.4 8.1 2 4 6 4c2 0 3.6 1.1 4.5 2.6C11.4 5.1 13 4 15 4c4 0 5.6 4.1 4 7.7-2.5 4.6-10 9.3-10 9.3z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run src/app/components/favoritos/BotaoFavorito.test.tsx`
Expected: PASS em todos os testes.

- [ ] **Step 5: Commit**

```bash
git add src/app/components/favoritos/BotaoFavorito.tsx src/app/components/favoritos/BotaoFavorito.test.tsx
git commit -m "feat(favoritos): componente BotaoFavorito com aria-pressed"
```

---

## Task 6: `BotaoFavorito` nos cartões de prática e na tela de sessão de jornada

**Files:**
- Modify: `src/app/praticas/CartaoPratica.tsx`
- Create: `src/app/praticas/CartaoPratica.test.tsx`
- Modify: `src/app/jornadas/[slug]/[sessaoId]/page.tsx`
- Modify: `src/app/jornadas/[slug]/[sessaoId]/SessaoClient.tsx`
- Create: `src/app/jornadas/[slug]/[sessaoId]/SessaoClient.test.tsx`

**Interfaces:**
- Consumes: `BotaoFavorito` de `@/app/components/favoritos/BotaoFavorito` (Task 5).
- Produces: `CartaoPratica({ pratica, favoritado }: { pratica: Pratica; favoritado: boolean })`; `SessaoClient` ganha a prop `favoritado: boolean`.

- [ ] **Step 1: Escrever o teste de `CartaoPratica`**

Crie `src/app/praticas/CartaoPratica.test.tsx`:

```typescript
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CartaoPratica from './CartaoPratica';
import type { Pratica } from '@/lib/supabase/types';

const PRATICA: Pratica = {
  id: 'pratica-1',
  categoria: 'aterramento',
  tipo: 'respiracao',
  titulo: 'Respiração 4-7-8',
  conteudo: 'Inspire por 4 segundos...',
  status: 'publicada',
  is_pro: false,
  criado_em: '2026-08-20T10:00:00.000Z',
};

describe('CartaoPratica', () => {
  it('renderiza título, conteúdo e um link para a prática', () => {
    render(<CartaoPratica pratica={PRATICA} favoritado={false} />);
    expect(screen.getByText('Respiração 4-7-8')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/praticas/pratica-1');
  });

  it('renderiza o BotaoFavorito refletindo o estado inicial recebido', () => {
    render(<CartaoPratica pratica={PRATICA} favoritado={true} />);
    expect(screen.getByRole('button', { name: 'Remover dos favoritos' })).toHaveAttribute('aria-pressed', 'true');
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/app/praticas/CartaoPratica.test.tsx`
Expected: FAIL (`CartaoPratica` ainda não aceita `favoritado` nem renderiza `BotaoFavorito`).

- [ ] **Step 3: Atualizar `CartaoPratica`**

Substitua o conteúdo de `src/app/praticas/CartaoPratica.tsx` por:

```tsx
import Link from 'next/link';
import Cartao from '@/app/components/Cartao';
import BotaoFavorito from '@/app/components/favoritos/BotaoFavorito';
import type { Pratica } from '@/lib/supabase/types';

export default function CartaoPratica({ pratica, favoritado }: { pratica: Pratica; favoritado: boolean }) {
  return (
    <Cartao className="relative flex items-start justify-between gap-3 transition-colors hover:bg-fundo">
      <Link
        href={`/praticas/${pratica.id}`}
        className="absolute inset-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60"
      >
        <span className="sr-only">{pratica.titulo}</span>
      </Link>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-display text-base text-texto">{pratica.titulo}</p>
        <p className="line-clamp-2 text-sm text-texto-suave">{pratica.conteudo}</p>
      </div>
      <BotaoFavorito tipo="pratica" id={pratica.id} favoritadoInicial={favoritado} className="relative z-10" />
    </Cartao>
  );
}
```

Nota: `CartaoPratica` ainda não tem uma página que a chame com dados reais de `praticas` (a listagem unificada de `/praticas` com o catálogo do banco é escopo da Seção 6 — "Práticas em áudio" — que vem depois desta na ordem de implementação do design). Esta task deixa o componente pronto e testado isoladamente; a Seção 6 é quem vai instanciá-lo dentro de uma página real, passando `favoritado` a partir de uma consulta a `favoritos`.

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run src/app/praticas/CartaoPratica.test.tsx`
Expected: PASS em ambos os testes.

- [ ] **Step 5: Escrever o teste de `SessaoClient`**

Crie `src/app/jornadas/[slug]/[sessaoId]/SessaoClient.test.tsx`:

```typescript
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SessaoClient from './SessaoClient';
import { buscarSessaoPorId, buscarJornadaPorSlug } from '@/lib/jornadas-conteudo/dados';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

const { sessao, modulo } = buscarSessaoPorId('imagem-corporal', 'imagem-corporal-m1-s1')!;
const jornada = buscarJornadaPorSlug('imagem-corporal')!;

describe('SessaoClient — BotaoFavorito', () => {
  it('mostra o BotaoFavorito no cabeçalho, refletindo favoritado=false', () => {
    render(
      <SessaoClient
        sessao={sessao}
        modulo={modulo}
        jornadaSlug={jornada.slug}
        jornadaTitulo={jornada.titulo}
        proximaSessaoHref={null}
        favoritado={false}
        onConcluir={async () => {}}
      />
    );
    expect(screen.getByRole('button', { name: 'Adicionar aos favoritos' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('mostra o BotaoFavorito já pressionado quando favoritado=true', () => {
    render(
      <SessaoClient
        sessao={sessao}
        modulo={modulo}
        jornadaSlug={jornada.slug}
        jornadaTitulo={jornada.titulo}
        proximaSessaoHref={null}
        favoritado={true}
        onConcluir={async () => {}}
      />
    );
    expect(screen.getByRole('button', { name: 'Remover dos favoritos' })).toHaveAttribute('aria-pressed', 'true');
  });
});
```

- [ ] **Step 6: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/app/jornadas/[slug]/[sessaoId]/SessaoClient.test.tsx`
Expected: FAIL (`SessaoClient` ainda não aceita `favoritado` nem renderiza `BotaoFavorito`).

- [ ] **Step 7: Atualizar `SessaoClient`**

Em `src/app/jornadas/[slug]/[sessaoId]/SessaoClient.tsx`, adicione o import e a prop, e coloque o botão ao lado do link de voltar:

```tsx
import BotaoFavorito from '@/app/components/favoritos/BotaoFavorito';
```

Altere a assinatura do componente:

```tsx
export default function SessaoClient({
  sessao,
  modulo,
  jornadaSlug,
  jornadaTitulo,
  proximaSessaoHref,
  favoritado,
  onConcluir,
}: {
  sessao: Sessao;
  modulo: Modulo;
  jornadaSlug: string;
  jornadaTitulo: string;
  proximaSessaoHref: string | null;
  favoritado: boolean;
  onConcluir: () => Promise<void>;
}) {
```

E substitua o bloco do cabeçalho (`<div className="flex items-center justify-between">...`) por:

```tsx
      <div className="flex items-center justify-between">
        <Link
          href={`/jornadas/${jornadaSlug}`}
          className="text-sm text-texto-suave hover:text-texto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60 focus-visible:ring-offset-2"
        >
          ← {jornadaTitulo}
        </Link>
        <BotaoFavorito tipo="sessao" id={sessao.id} favoritadoInicial={favoritado} />
      </div>
```

- [ ] **Step 8: Atualizar `page.tsx` da sessão de jornada para buscar e passar `favoritado`**

Em `src/app/jornadas/[slug]/[sessaoId]/page.tsx`, após o bloco que resolve `sessao`/`modulo` (logo após `const { sessao, modulo } = resultado;`), adicione a consulta:

```typescript
  const { data: favoritoExistente } = await supabase
    .from('favoritos')
    .select('id')
    .eq('usuaria_id', user.id)
    .eq('sessao_id', sessaoId)
    .maybeSingle();
  const favoritado = !!favoritoExistente;
```

E passe a nova prop ao `SessaoClient` no `return`:

```tsx
  return (
    <SessaoClient
      sessao={sessao}
      modulo={modulo}
      jornadaSlug={jornada.slug}
      jornadaTitulo={jornada.titulo}
      proximaSessaoHref={proximaSessaoHref}
      favoritado={favoritado}
      onConcluir={concluirSessao.bind(null, jornada.slug, sessao.id)}
    />
  );
```

- [ ] **Step 9: Rodar os testes e confirmar que passam**

Run: `npx vitest run src/app/jornadas/[slug]/[sessaoId]/SessaoClient.test.tsx src/app/praticas/CartaoPratica.test.tsx`
Expected: PASS em todos os testes.

- [ ] **Step 10: Rodar a suíte completa de jornadas para garantir que nada quebrou**

Run: `npx vitest run src/app/jornadas`
Expected: PASS (os testes existentes de `[slug]/page.test.tsx` etc. continuam passando).

- [ ] **Step 11: Commit**

```bash
git add src/app/praticas/CartaoPratica.tsx src/app/praticas/CartaoPratica.test.tsx src/app/jornadas/[slug]/[sessaoId]/page.tsx src/app/jornadas/[slug]/[sessaoId]/SessaoClient.tsx src/app/jornadas/[slug]/[sessaoId]/SessaoClient.test.tsx
git commit -m "feat(favoritos): BotaoFavorito nos cartoes de pratica e na tela de sessao de jornada"
```

---

## Task 7: Página `/favoritos`

**Files:**
- Create: `src/app/favoritos/CartaoFavoritoIndisponivel.tsx`
- Create: `src/app/favoritos/BotaoRemoverFavorito.tsx`
- Create: `src/app/favoritos/page.tsx`
- Create: `src/app/favoritos/page.test.tsx`

**Interfaces:**
- Consumes: `desfavoritar`, `TipoFavorito` de `./actions` (Task 4); `buscarSessaoEmQualquerJornada` de `@/lib/jornadas-conteudo/dados` (Task 2); `createSupabaseServerClient`.
- Produces: rota `/favoritos` (server component); `BotaoRemoverFavorito({ tipo, id }: { tipo: TipoFavorito; id: string })`; `CartaoFavoritoIndisponivel({ tipo, id }: { tipo: TipoFavorito; id: string })`.

- [ ] **Step 1: Escrever `BotaoRemoverFavorito` (sem teste dedicado — coberto pelos testes de `page.tsx` abaixo, mesmo padrão de outros botões pequenos do repositório)**

Crie `src/app/favoritos/BotaoRemoverFavorito.tsx`:

```tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { desfavoritar, type TipoFavorito } from './actions';

export default function BotaoRemoverFavorito({ tipo, id }: { tipo: TipoFavorito; id: string }) {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();
  const [erro, setErro] = useState(false);

  function remover() {
    setErro(false);
    startTransition(async () => {
      try {
        await desfavoritar(tipo, id);
        router.refresh();
      } catch {
        setErro(true);
      }
    });
  }

  return (
    <div className="shrink-0 text-right">
      <button
        type="button"
        onClick={remover}
        disabled={pendente}
        className="text-xs font-medium text-texto-suave underline-offset-2 hover:text-alerta hover:underline disabled:opacity-60"
      >
        {pendente ? 'Removendo...' : 'Remover'}
      </button>
      {erro && (
        <p role="alert" className="mt-1 text-xs text-alerta">
          Não foi possível remover.
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Escrever `CartaoFavoritoIndisponivel`**

Crie `src/app/favoritos/CartaoFavoritoIndisponivel.tsx`:

```tsx
import Cartao from '@/app/components/Cartao';
import BotaoRemoverFavorito from './BotaoRemoverFavorito';
import type { TipoFavorito } from './actions';

export default function CartaoFavoritoIndisponivel({ tipo, id }: { tipo: TipoFavorito; id: string }) {
  return (
    <Cartao className="flex items-center justify-between gap-3 opacity-70">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-display text-base text-texto">Conteúdo indisponível</p>
        <p className="text-sm text-texto-suave">
          {tipo === 'pratica' ? 'Esta prática não está mais disponível.' : 'Esta sessão não está mais disponível.'}
        </p>
      </div>
      <BotaoRemoverFavorito tipo={tipo} id={id} />
    </Cartao>
  );
}
```

- [ ] **Step 3: Escrever o teste da página**

Crie `src/app/favoritos/page.test.tsx`:

```typescript
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FavoritosPage from './page';

vi.mock('next/navigation', () => ({
  redirect: vi.fn((rota: string) => {
    throw new Error(`NEXT_REDIRECT:${rota}`);
  }),
}));

vi.mock('@/lib/supabase/server', () => ({ createSupabaseServerClient: vi.fn() }));

import { createSupabaseServerClient } from '@/lib/supabase/server';

type FavoritoLinha = { id: string; pratica_id: string | null; sessao_id: string | null; criado_em: string };
type PraticaLinha = { id: string; titulo: string; conteudo: string; categoria: string; status: string };

function criarSupabaseFake(favoritos: FavoritoLinha[], praticas: PraticaLinha[]) {
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'usuaria-1' } } })) },
    from(tabela: string) {
      if (tabela === 'favoritos') {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({ data: favoritos, error: null }),
            }),
          }),
        };
      }
      if (tabela === 'praticas') {
        return {
          select: () => ({
            in: async () => ({ data: praticas, error: null }),
          }),
        };
      }
      throw new Error(`tabela inesperada no fake: ${tabela}`);
    },
  };
}

describe('FavoritosPage', () => {
  it('mostra uma mensagem de vazio quando não há favoritos', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseFake([], []) as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>
    );
    const jsx = await FavoritosPage();
    render(jsx);
    expect(screen.getByText(/ainda não favoritou/i)).toBeInTheDocument();
  });

  it('resolve o título de uma prática favoritada via join', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseFake(
        [{ id: 'fav-1', pratica_id: 'pratica-1', sessao_id: null, criado_em: '2026-08-20T10:00:00.000Z' }],
        [{ id: 'pratica-1', titulo: 'Respiração 4-7-8', conteudo: 'texto', categoria: 'aterramento', status: 'publicada' }]
      ) as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>
    );
    const jsx = await FavoritosPage();
    render(jsx);
    expect(screen.getByText('Respiração 4-7-8')).toBeInTheDocument();
  });

  it('resolve o título de uma sessão favoritada via catálogo em código', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseFake(
        [{ id: 'fav-2', pratica_id: null, sessao_id: 'imagem-corporal-m1-s1', criado_em: '2026-08-20T10:00:00.000Z' }],
        []
      ) as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>
    );
    const jsx = await FavoritosPage();
    render(jsx);
    expect(screen.getByText('Imagem corporal não é o seu corpo')).toBeInTheDocument();
  });

  it('mostra "Conteúdo indisponível" para uma prática removida/despublicada, sem quebrar a página', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseFake(
        [{ id: 'fav-3', pratica_id: 'pratica-removida', sessao_id: null, criado_em: '2026-08-20T10:00:00.000Z' }],
        []
      ) as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>
    );
    const jsx = await FavoritosPage();
    render(jsx);
    expect(screen.getByText('Conteúdo indisponível')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remover' })).toBeInTheDocument();
  });

  it('mostra "Conteúdo indisponível" para uma sessão que não existe mais no catálogo', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseFake(
        [{ id: 'fav-4', pratica_id: null, sessao_id: 'sessao-removida-do-catalogo', criado_em: '2026-08-20T10:00:00.000Z' }],
        []
      ) as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>
    );
    const jsx = await FavoritosPage();
    render(jsx);
    expect(screen.getByText('Conteúdo indisponível')).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Rodar os testes e confirmar que falham**

Run: `npx vitest run src/app/favoritos/page.test.tsx`
Expected: FAIL (`./page` não existe ainda).

- [ ] **Step 5: Implementar a página**

Crie `src/app/favoritos/page.tsx`:

```tsx
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { buscarSessaoEmQualquerJornada } from '@/lib/jornadas-conteudo/dados';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import Cartao from '@/app/components/Cartao';
import BotaoRemoverFavorito from './BotaoRemoverFavorito';
import CartaoFavoritoIndisponivel from './CartaoFavoritoIndisponivel';

export default async function FavoritosPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: favoritos } = await supabase
    .from('favoritos')
    .select('id, pratica_id, sessao_id, criado_em')
    .eq('usuaria_id', user.id)
    .order('criado_em', { ascending: false });

  const listaFavoritos = favoritos ?? [];
  const praticaIds = listaFavoritos
    .filter((f) => f.pratica_id !== null)
    .map((f) => f.pratica_id as string);

  const { data: praticas } =
    praticaIds.length > 0
      ? await supabase.from('praticas').select('id, titulo, conteudo, categoria, status').in('id', praticaIds)
      : { data: [] as { id: string; titulo: string; conteudo: string; categoria: string; status: string }[] };

  const praticasPorId = new Map((praticas ?? []).map((p) => [p.id, p]));

  return (
    <main className="mx-auto max-w-md space-y-6 p-6 pb-[calc(6rem_+_env(safe-area-inset-bottom))] md:pb-6">
      <h1 className="font-display text-2xl text-texto">Favoritos</h1>

      {listaFavoritos.length === 0 && (
        <p className="text-sm text-texto-suave">Você ainda não favoritou nenhuma prática ou sessão.</p>
      )}

      <div className="space-y-3">
        {listaFavoritos.map((favorito) => {
          if (favorito.pratica_id) {
            const pratica = praticasPorId.get(favorito.pratica_id);
            const disponivel = !!pratica && pratica.status === 'publicada';

            if (!disponivel) {
              return <CartaoFavoritoIndisponivel key={favorito.id} tipo="pratica" id={favorito.pratica_id} />;
            }

            return (
              <Cartao key={favorito.id} className="flex items-center justify-between gap-3">
                <Link href={`/praticas/${pratica!.id}`} className="min-w-0 flex-1 space-y-1">
                  <p className="font-display text-base text-texto">{pratica!.titulo}</p>
                  <p className="line-clamp-2 text-sm text-texto-suave">{pratica!.conteudo}</p>
                </Link>
                <BotaoRemoverFavorito tipo="pratica" id={pratica!.id} />
              </Cartao>
            );
          }

          const sessaoId = favorito.sessao_id as string;
          const encontrada = buscarSessaoEmQualquerJornada(sessaoId);

          if (!encontrada) {
            return <CartaoFavoritoIndisponivel key={favorito.id} tipo="sessao" id={sessaoId} />;
          }

          return (
            <Cartao key={favorito.id} className="flex items-center justify-between gap-3">
              <Link href={`/jornadas/${encontrada.jornada.slug}/${sessaoId}`} className="min-w-0 flex-1 space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-texto-suave">{encontrada.jornada.titulo}</p>
                <p className="font-display text-base text-texto">{encontrada.sessao.titulo}</p>
                <p className="line-clamp-2 text-sm text-texto-suave">{encontrada.sessao.descricaoCurta}</p>
              </Link>
              <BotaoRemoverFavorito tipo="sessao" id={sessaoId} />
            </Cartao>
          );
        })}
      </div>

      <NavegacaoInferior />
    </main>
  );
}
```

- [ ] **Step 6: Rodar os testes e confirmar que passam**

Run: `npx vitest run src/app/favoritos/page.test.tsx`
Expected: PASS em todos os testes.

- [ ] **Step 7: Commit**

```bash
git add src/app/favoritos/CartaoFavoritoIndisponivel.tsx src/app/favoritos/BotaoRemoverFavorito.tsx src/app/favoritos/page.tsx src/app/favoritos/page.test.tsx
git commit -m "feat(favoritos): pagina /favoritos com resolucao de conteudo indisponivel"
```

---

## Task 8: Paywall Pro server-side na rota de conteúdo de prática

**Files:**
- Create: `src/app/praticas/[id]/PaywallPratica.tsx`
- Modify: `src/app/praticas/[id]/page.tsx`
- Create: `src/app/praticas/[id]/page.test.tsx`

**Interfaces:**
- Produces: `PaywallPratica({ titulo, categoria }: { titulo: string; categoria: string })`; `/praticas/[id]` passa a bloquear server-side quando `pratica.is_pro && plano !== 'premium'`.

- [ ] **Step 1: Escrever o teste**

Crie `src/app/praticas/[id]/page.test.tsx`:

```typescript
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PraticaBibliotecaPage from './page';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('@/lib/supabase/server', () => ({ createSupabaseServerClient: vi.fn() }));

import { createSupabaseServerClient } from '@/lib/supabase/server';

type PraticaLinha = {
  id: string;
  titulo: string;
  conteudo: string;
  categoria: string;
  status: string;
  is_pro: boolean;
};

function criarSupabaseFake(pratica: PraticaLinha | null, plano: 'free' | 'premium' | null) {
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user: plano === null ? null : { id: 'usuaria-1' } } })) },
    from(tabela: string) {
      if (tabela === 'praticas') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: async () => ({ data: pratica, error: pratica ? null : { code: 'PGRST116' } }),
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

describe('PraticaBibliotecaPage — paywall Pro server-side', () => {
  it('mostra o conteúdo normalmente quando a prática não é Pro', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseFake(
        { id: 'p1', titulo: 'Respiração', conteudo: 'texto completo', categoria: 'aterramento', status: 'publicada', is_pro: false },
        null
      ) as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>
    );
    const jsx = await PraticaBibliotecaPage({ params: Promise.resolve({ id: 'p1' }) });
    render(jsx);
    expect(screen.getByText('texto completo')).toBeInTheDocument();
  });

  it('bloqueia o conteúdo Pro para uma usuária sem sessão (não confia em cliente nenhum)', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseFake(
        { id: 'p2', titulo: 'Prática avançada', conteudo: 'conteúdo pago', categoria: 'aterramento', status: 'publicada', is_pro: true },
        null
      ) as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>
    );
    const jsx = await PraticaBibliotecaPage({ params: Promise.resolve({ id: 'p2' }) });
    render(jsx);
    expect(screen.queryByText('conteúdo pago')).not.toBeInTheDocument();
    expect(screen.getByText(/Rose Pro/i)).toBeInTheDocument();
  });

  it('bloqueia o conteúdo Pro para uma usuária logada no plano free', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseFake(
        { id: 'p3', titulo: 'Prática avançada', conteudo: 'conteúdo pago', categoria: 'aterramento', status: 'publicada', is_pro: true },
        'free'
      ) as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>
    );
    const jsx = await PraticaBibliotecaPage({ params: Promise.resolve({ id: 'p3' }) });
    render(jsx);
    expect(screen.queryByText('conteúdo pago')).not.toBeInTheDocument();
  });

  it('libera o conteúdo Pro para uma usuária premium', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseFake(
        { id: 'p4', titulo: 'Prática avançada', conteudo: 'conteúdo pago', categoria: 'aterramento', status: 'publicada', is_pro: true },
        'premium'
      ) as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>
    );
    const jsx = await PraticaBibliotecaPage({ params: Promise.resolve({ id: 'p4' }) });
    render(jsx);
    expect(screen.getByText('conteúdo pago')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npx vitest run src/app/praticas/[id]/page.test.tsx`
Expected: FAIL (a rota ainda não faz nenhuma checagem de `is_pro`/`plano`).

- [ ] **Step 3: Criar `PaywallPratica`**

Crie `src/app/praticas/[id]/PaywallPratica.tsx`:

```tsx
import Link from 'next/link';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';

export default function PaywallPratica({ titulo, categoria }: { titulo: string; categoria: string }) {
  return (
    <main className="mx-auto max-w-md space-y-6 p-6 pb-[calc(6rem_+_env(safe-area-inset-bottom))] md:pb-6">
      <span className="text-xs font-medium uppercase tracking-wide text-destaque">{categoria}</span>
      <h1 className="font-display text-2xl text-texto">{titulo}</h1>
      <div className="space-y-3 rounded-2xl border border-borda bg-superficie p-4">
        <p className="text-sm text-texto">Esta prática faz parte do Rose Pro.</p>
        <Link
          href="/premium"
          className="block w-full rounded-2xl bg-acao p-3 text-center font-medium text-white transition-colors hover:bg-acao/90"
        >
          Conhecer o Rose Pro
        </Link>
      </div>
      <Link
        href="/praticas"
        className="block w-full rounded-2xl border border-borda p-3 text-center font-medium text-texto-suave transition-colors hover:bg-superficie"
      >
        Voltar para a biblioteca
      </Link>
      <NavegacaoInferior />
    </main>
  );
}
```

- [ ] **Step 4: Atualizar `page.tsx` para checar `is_pro` no servidor**

Substitua o conteúdo de `src/app/praticas/[id]/page.tsx` por:

```tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import PaywallPratica from './PaywallPratica';

export default async function PraticaBibliotecaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: pratica } = await supabase
    .from('praticas')
    .select('*')
    .eq('id', id)
    .eq('status', 'publicada')
    .single();

  if (!pratica) {
    notFound();
  }

  // Checagem sempre server-side: uma usuária sem sessão nunca deve ver
  // conteúdo Pro, e o cliente nunca é a fonte de verdade sobre o plano.
  let plano: 'free' | 'premium' = 'free';
  if (user) {
    const { data: perfil } = await supabase.from('perfis').select('plano').eq('id', user.id).single();
    plano = perfil?.plano ?? 'free';
  }

  if (pratica.is_pro && plano !== 'premium') {
    return <PaywallPratica titulo={pratica.titulo} categoria={pratica.categoria} />;
  }

  return (
    <main className="mx-auto max-w-md space-y-6 p-6 pb-[calc(6rem_+_env(safe-area-inset-bottom))] md:pb-6">
      <span className="text-xs font-medium uppercase tracking-wide text-destaque">
        {pratica.categoria}
      </span>
      <h1 className="font-display text-2xl text-texto">{pratica.titulo}</h1>
      <p className="whitespace-pre-line text-texto">{pratica.conteudo}</p>
      <Link
        href="/praticas"
        className="block w-full rounded-2xl border border-borda p-3 text-center font-medium text-texto-suave transition-colors hover:bg-superficie"
      >
        Voltar para a biblioteca
      </Link>
      <NavegacaoInferior />
    </main>
  );
}
```

- [ ] **Step 5: Rodar os testes e confirmar que passam**

Run: `npx vitest run src/app/praticas/[id]/page.test.tsx`
Expected: PASS em todos os testes.

- [ ] **Step 6: Commit**

```bash
git add src/app/praticas/[id]/PaywallPratica.tsx src/app/praticas/[id]/page.tsx src/app/praticas/[id]/page.test.tsx
git commit -m "feat(praticas): gate Pro server-side na rota de conteudo de pratica"
```

---

## Task 9: Card "Continuar de onde parei" na Home

**Files:**
- Create: `src/app/components/inicio/ContinuarPraticaLocalClient.tsx`
- Create: `src/app/components/inicio/ContinuarPraticaLocalClient.test.tsx`
- Create: `src/app/components/inicio/ContinuarDeOndeParei.tsx`
- Create: `src/app/components/inicio/ContinuarDeOndeParei.test.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `resolverProximaAcaoJornada`, `buscarLinhasProgressoTodasJornadas` de `@/lib/jornadas-conteudo/continuarDeOndeParei` (Task 3); `buscarSessaoPorId`, `buscarJornadaPorSlug`, `listarJornadas` de `@/lib/jornadas-conteudo/dados`.
- Produces: `ContinuarDeOndeParei({ supabase, usuariaId }: { supabase: SupabaseClient<Database>; usuariaId: string })` (server component, default export) e `ContinuarPraticaLocalClient({ usuariaId }: { usuariaId: string })` (client, default export), ambos de `@/app/components/inicio/...`. Consumidos por `src/app/page.tsx`.

Nota de escopo (ambiguidade resolvida nesta task — ver também o resumo final): a Prioridade 3 do design cita `src/lib/praticas-progresso/armazenamento.ts` como a fonte de "progresso local recuperável, por dispositivo". Na leitura do código real, esse módulo é a gravação de **conclusões** em `conclusoes_praticas_conteudo` (tabela no banco, chamada do client browser) — não guarda rascunhos em `localStorage` nem estado "em andamento". Quem de fato persiste progresso local por dispositivo, recuperável e não concluído, é `usePersistedState` (`src/lib/persistencia-local/usePersistedState.ts`), já usado por `AutocompaixaoClient.tsx` e `DiarioGuiadoClient.tsx` com chaves `praticas:autocompaixao:{usuariaId}:{data}` e `praticas:diario:{usuariaId}:{data}` — limpas (`limparRespostas()`) só quando a prática é concluída. `ContinuarPraticaLocalClient` lê exatamente essas duas chaves, o que também explica por que o design pede um "client component pequeno para essa parte": só o navegador tem acesso a esse `localStorage`.

- [ ] **Step 1: Escrever o teste de `ContinuarPraticaLocalClient`**

Crie `src/app/components/inicio/ContinuarPraticaLocalClient.test.tsx`:

```typescript
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ContinuarPraticaLocalClient from './ContinuarPraticaLocalClient';

const USUARIA_ID = 'usuaria-1';

function dataDeHoje(): string {
  return new Date().toISOString().slice(0, 10);
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('ContinuarPraticaLocalClient', () => {
  it('não renderiza nada quando não há nenhum rascunho local', async () => {
    const { container } = render(<ContinuarPraticaLocalClient usuariaId={USUARIA_ID} />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('não renderiza nada quando o rascunho salvo só tem respostas vazias', async () => {
    window.localStorage.setItem(`praticas:diario:${USUARIA_ID}:${dataDeHoje()}`, JSON.stringify(['', '']));
    const { container } = render(<ContinuarPraticaLocalClient usuariaId={USUARIA_ID} />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('mostra um card para o Diário guiado quando há um rascunho com conteúdo', async () => {
    window.localStorage.setItem(`praticas:diario:${USUARIA_ID}:${dataDeHoje()}`, JSON.stringify(['Hoje eu senti...', '']));
    render(<ContinuarPraticaLocalClient usuariaId={USUARIA_ID} />);
    await waitFor(() => expect(screen.getByText('Diário guiado')).toBeInTheDocument());
    expect(screen.getByRole('link')).toHaveAttribute('href', '/praticas/diario-guiado');
  });

  it('mostra um card para Autocompaixão quando há um rascunho com conteúdo', async () => {
    window.localStorage.setItem(`praticas:autocompaixao:${USUARIA_ID}:${dataDeHoje()}`, JSON.stringify(['Fui gentil comigo quando...']));
    render(<ContinuarPraticaLocalClient usuariaId={USUARIA_ID} />);
    await waitFor(() => expect(screen.getByText('Autocompaixão')).toBeInTheDocument());
    expect(screen.getByRole('link')).toHaveAttribute('href', '/praticas/autocompaixao');
  });

  it('não mistura rascunhos de outra usuária (chave inclui usuariaId)', async () => {
    window.localStorage.setItem(`praticas:diario:outra-usuaria:${dataDeHoje()}`, JSON.stringify(['texto de outra pessoa']));
    const { container } = render(<ContinuarPraticaLocalClient usuariaId={USUARIA_ID} />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/app/components/inicio/ContinuarPraticaLocalClient.test.tsx`
Expected: FAIL (`./ContinuarPraticaLocalClient` não existe ainda).

- [ ] **Step 3: Implementar `ContinuarPraticaLocalClient`**

Crie `src/app/components/inicio/ContinuarPraticaLocalClient.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Cartao from '@/app/components/Cartao';

interface CandidatoRascunho {
  chaveCategoria: 'diario' | 'autocompaixao';
  titulo: string;
  rota: string;
}

// Só diário guiado e autocompaixão guardam rascunho local (usePersistedState);
// respiração e meditação são cronômetro/sessão única, sem texto para recuperar.
const CANDIDATOS: CandidatoRascunho[] = [
  { chaveCategoria: 'diario', titulo: 'Diário guiado', rota: '/praticas/diario-guiado' },
  { chaveCategoria: 'autocompaixao', titulo: 'Autocompaixão', rota: '/praticas/autocompaixao' },
];

function dataDeHoje(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ContinuarPraticaLocalClient({ usuariaId }: { usuariaId: string }) {
  const [rascunho, setRascunho] = useState<{ titulo: string; rota: string } | null>(null);

  useEffect(() => {
    for (const candidato of CANDIDATOS) {
      const chave = `praticas:${candidato.chaveCategoria}:${usuariaId}:${dataDeHoje()}`;
      let bruto: string | null = null;
      try {
        bruto = window.localStorage.getItem(chave);
      } catch {
        continue;
      }
      if (!bruto) continue;

      try {
        const respostas = JSON.parse(bruto) as unknown;
        if (Array.isArray(respostas) && respostas.some((r) => typeof r === 'string' && r.trim().length > 0)) {
          setRascunho({ titulo: candidato.titulo, rota: candidato.rota });
          return;
        }
      } catch {
        continue;
      }
    }
  }, [usuariaId]);

  if (!rascunho) {
    return null;
  }

  return (
    <div className="space-y-3">
      <p className="font-display text-lg text-texto">Continue de onde parou</p>
      <Link href={rascunho.rota} className="block">
        <Cartao className="space-y-1 transition-colors hover:bg-fundo">
          <p className="font-display text-base text-texto">{rascunho.titulo}</p>
          <p className="text-sm text-texto-suave">Você tem um rascunho salvo neste dispositivo.</p>
        </Cartao>
      </Link>
    </div>
  );
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run src/app/components/inicio/ContinuarPraticaLocalClient.test.tsx`
Expected: PASS em todos os testes.

- [ ] **Step 5: Escrever o teste de `ContinuarDeOndeParei`**

Crie `src/app/components/inicio/ContinuarDeOndeParei.test.tsx`:

```typescript
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import ContinuarDeOndeParei from './ContinuarDeOndeParei';

type LinhaProgressoRaw = { jornada_slug: string; sessao_id: string; iniciada_em: string; concluida_em: string | null };

function criarSupabaseFake(linhas: LinhaProgressoRaw[] | 'erro') {
  return {
    from: () => ({
      select: () => ({
        eq: async () => (linhas === 'erro' ? { data: null, error: { code: '500', message: 'falhou' } } : { data: linhas, error: null }),
      }),
    }),
  } as unknown as SupabaseClient<Database>;
}

describe('ContinuarDeOndeParei', () => {
  it('Prioridade 1: mostra a sessão em andamento como um link para retomar', async () => {
    const supabase = criarSupabaseFake([
      { jornada_slug: 'imagem-corporal', sessao_id: 'imagem-corporal-m1-s2', iniciada_em: '2026-08-20T10:00:00.000Z', concluida_em: null },
    ]);
    const jsx = await ContinuarDeOndeParei({ supabase, usuariaId: 'usuaria-1' });
    render(jsx);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/jornadas/imagem-corporal/imagem-corporal-m1-s2');
  });

  it('Prioridade 2: sem sessão em andamento, mostra a próxima sessão desbloqueada', async () => {
    const supabase = criarSupabaseFake([
      { jornada_slug: 'imagem-corporal', sessao_id: 'imagem-corporal-m1-s1', iniciada_em: '2026-08-18T10:00:00.000Z', concluida_em: '2026-08-18T10:05:00.000Z' },
    ]);
    const jsx = await ContinuarDeOndeParei({ supabase, usuariaId: 'usuaria-1' });
    render(jsx);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/jornadas/imagem-corporal/imagem-corporal-m1-s2');
  });

  it('Prioridade 3: sem nada no sistema de jornadas, cai para o fallback local (renderiza o wrapper client, sem link de jornada)', async () => {
    const supabase = criarSupabaseFake([]);
    const jsx = await ContinuarDeOndeParei({ supabase, usuariaId: 'usuaria-1' });
    render(jsx);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('em caso de erro na consulta de progresso, cai para o fallback local em vez de quebrar a Home', async () => {
    const supabase = criarSupabaseFake('erro');
    const jsx = await ContinuarDeOndeParei({ supabase, usuariaId: 'usuaria-1' });
    render(jsx);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/app/components/inicio/ContinuarDeOndeParei.test.tsx`
Expected: FAIL (`./ContinuarDeOndeParei` não existe ainda).

- [ ] **Step 7: Implementar `ContinuarDeOndeParei`**

Crie `src/app/components/inicio/ContinuarDeOndeParei.tsx`:

```tsx
import Link from 'next/link';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import Cartao from '@/app/components/Cartao';
import {
  buscarLinhasProgressoTodasJornadas,
  resolverProximaAcaoJornada,
} from '@/lib/jornadas-conteudo/continuarDeOndeParei';
import { buscarJornadaPorSlug, buscarSessaoPorId, listarJornadas } from '@/lib/jornadas-conteudo/dados';
import ContinuarPraticaLocalClient from './ContinuarPraticaLocalClient';

export default async function ContinuarDeOndeParei({
  supabase,
  usuariaId,
}: {
  supabase: SupabaseClient<Database>;
  usuariaId: string;
}) {
  let linhas: Awaited<ReturnType<typeof buscarLinhasProgressoTodasJornadas>> = [];
  try {
    linhas = await buscarLinhasProgressoTodasJornadas(supabase, usuariaId);
  } catch {
    // Card opcional da Home — uma falha ao ler progresso de jornadas nunca
    // deve quebrar a página inteira. Cai para a Prioridade 3 (local).
    return <ContinuarPraticaLocalClient usuariaId={usuariaId} />;
  }

  const acao = resolverProximaAcaoJornada(listarJornadas(), linhas);

  if (acao) {
    const jornada = buscarJornadaPorSlug(acao.jornadaSlug);
    const resultado = buscarSessaoPorId(acao.jornadaSlug, acao.sessaoId);

    if (jornada && resultado) {
      return (
        <div className="space-y-3">
          <p className="font-display text-lg text-texto">Continue de onde parou</p>
          <Link href={`/jornadas/${jornada.slug}/${acao.sessaoId}`} className="block">
            <Cartao className="space-y-1 transition-colors hover:bg-fundo">
              <p className="text-xs font-medium uppercase tracking-wide text-texto-suave">{jornada.titulo}</p>
              <p className="font-display text-base text-texto">{resultado.sessao.titulo}</p>
              <p className="line-clamp-2 text-sm text-texto-suave">{resultado.sessao.descricaoCurta}</p>
            </Cartao>
          </Link>
        </div>
      );
    }
  }

  return <ContinuarPraticaLocalClient usuariaId={usuariaId} />;
}
```

- [ ] **Step 8: Rodar o teste e confirmar que passa**

Run: `npx vitest run src/app/components/inicio/ContinuarDeOndeParei.test.tsx`
Expected: PASS em todos os testes.

- [ ] **Step 9: Incluir o card na Home**

Em `src/app/page.tsx`, adicione o import:

```typescript
import ContinuarDeOndeParei from '@/app/components/inicio/ContinuarDeOndeParei';
```

E adicione o componente logo após `<JornadaEmAndamento jornada={jornadaEmAndamento} />` (antes de `<RitualDeHoje ...>`):

```tsx
      <JornadaEmAndamento jornada={jornadaEmAndamento} />

      <ContinuarDeOndeParei supabase={supabase} usuariaId={user.id} />

      <RitualDeHoje jaFezCheckinHoje={jaFezCheckinHoje} />
```

- [ ] **Step 10: Rodar a suíte de testes completa e o typecheck**

Run: `npx vitest run`
Expected: PASS em toda a suíte (nenhum teste pré-existente quebrado).

Run: `npx tsc --noEmit`
Expected: sem erros novos.

- [ ] **Step 11: Commit**

```bash
git add src/app/components/inicio/ContinuarPraticaLocalClient.tsx src/app/components/inicio/ContinuarPraticaLocalClient.test.tsx src/app/components/inicio/ContinuarDeOndeParei.tsx src/app/components/inicio/ContinuarDeOndeParei.test.tsx src/app/page.tsx
git commit -m "feat(inicio): card Continuar de onde parei com as 3 prioridades do design"
```

---

## Task 10: Testes de RLS (pgTAP) para `favoritos`

**Files:**
- Create: `supabase/tests/favoritos_rls.test.sql`

**Interfaces:**
- Consumes: tabela `public.favoritos` (Task 1).

- [ ] **Step 1: Escrever o arquivo de teste pgTAP**

Crie `supabase/tests/favoritos_rls.test.sql`:

```sql
-- Testes de RLS para public.favoritos (pgTAP), no mesmo formato de
-- supabase/tests/jornada_respostas_modulo_rls.test.sql. Roda com:
--   supabase test db
-- Cobre: leitura isolada por usuária, bloqueio de acesso anônimo, INSERT
-- falsificando usuaria_id, violação da constraint "exatamente um alvo",
-- violação do índice único parcial (favorito duplicado), DELETE restrito à
-- própria linha, e ausência de policy de UPDATE.

begin;
select plan(12);

insert into public.perfis (id, nome) values
  ('a0000000-0000-0000-0000-00000000000a', 'Usuária A'),
  ('b0000000-0000-0000-0000-00000000000b', 'Usuária B');

insert into public.praticas (id, categoria, tipo, titulo, conteudo, status) values
  ('c0000000-0000-0000-0000-00000000000c', 'aterramento', 'respiracao', 'Prática de teste', 'conteúdo', 'publicada');

-- Como service role (bypassa RLS), cria o favorito da usuária A que serve de
-- alvo aos testes de leitura/exclusão abaixo.
set local role postgres;
insert into public.favoritos (id, usuaria_id, pratica_id, sessao_id) values
  ('d0000000-0000-0000-0000-00000000000d', 'a0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-00000000000c', null);
reset role;

-- Cenário 1: usuária A lê o próprio favorito.
set local role authenticated;
set local request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-00000000000a","role":"authenticated"}';

select is(
  (select count(*)::int from public.favoritos where usuaria_id = 'a0000000-0000-0000-0000-00000000000a'),
  1,
  'usuária A vê o próprio favorito'
);

-- Cenário 2: usuária A insere um novo favorito (de sessão, sem FK).
select lives_ok(
  $$ insert into public.favoritos (usuaria_id, pratica_id, sessao_id)
     values ('a0000000-0000-0000-0000-00000000000a', null, 'imagem-corporal-m1-s1') $$,
  'usuária A consegue favoritar uma sessão em nome de si mesma'
);

-- Cenário 3: favorito duplicado é bloqueado pelo índice único parcial.
select throws_ok(
  $$ insert into public.favoritos (usuaria_id, pratica_id, sessao_id)
     values ('a0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-00000000000c', null) $$,
  '23505',
  null,
  'favoritar a mesma prática duas vezes viola o índice único parcial (usuaria_id, pratica_id)'
);

-- Cenário 4: constraint "exatamente um alvo" — ambos nulos.
select throws_ok(
  $$ insert into public.favoritos (usuaria_id, pratica_id, sessao_id)
     values ('a0000000-0000-0000-0000-00000000000a', null, null) $$,
  '23514',
  null,
  'insert com pratica_id e sessao_id nulos viola a check constraint'
);

-- Cenário 5: constraint "exatamente um alvo" — ambos preenchidos.
select throws_ok(
  $$ insert into public.favoritos (usuaria_id, pratica_id, sessao_id)
     values ('a0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-00000000000c', 'imagem-corporal-m1-s2') $$,
  '23514',
  null,
  'insert com pratica_id e sessao_id preenchidos ao mesmo tempo viola a check constraint'
);

-- Cenário 6: usuária A remove o próprio favorito.
select lives_ok(
  $$ delete from public.favoritos where id = 'd0000000-0000-0000-0000-00000000000d' $$,
  'usuária A consegue remover o próprio favorito'
);

select is(
  (select count(*)::int from public.favoritos where id = 'd0000000-0000-0000-0000-00000000000d'),
  0,
  'o favorito removido por A realmente não existe mais'
);

-- Cenário 7: isolamento — B favorita algo, A não vê nem consegue apagar.
reset role;
set local role postgres;
insert into public.favoritos (id, usuaria_id, pratica_id, sessao_id) values
  ('e0000000-0000-0000-0000-00000000000e', 'b0000000-0000-0000-0000-00000000000b', 'c0000000-0000-0000-0000-00000000000c', null);
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-00000000000a","role":"authenticated"}';

select is(
  (select count(*)::int from public.favoritos where id = 'e0000000-0000-0000-0000-00000000000e'),
  0,
  'usuária A NÃO vê o favorito da usuária B via SELECT'
);

-- DELETE sem WHERE que bate em nenhuma linha visível não lança erro — só
-- não afeta nenhuma linha. Confirma isso comparando a contagem antes/depois.
delete from public.favoritos where id = 'e0000000-0000-0000-0000-00000000000e';

reset role;
set local role postgres;
select is(
  (select count(*)::int from public.favoritos where id = 'e0000000-0000-0000-0000-00000000000e'),
  1,
  'o favorito da usuária B continua existindo — A não conseguiu apagá-lo'
);
reset role;

-- Cenário 8: INSERT tentando falsificar usuaria_id de outra pessoa.
set local role authenticated;
set local request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-00000000000a","role":"authenticated"}';

select throws_ok(
  $$ insert into public.favoritos (usuaria_id, pratica_id, sessao_id)
     values ('b0000000-0000-0000-0000-00000000000b', null, 'imagem-corporal-m1-s3') $$,
  null,
  null,
  'INSERT com usuaria_id de outra usuária é rejeitado pela WITH CHECK da policy'
);

-- Cenário 9: não existe policy de UPDATE — GRANT nem sequer inclui UPDATE.
select throws_ok(
  $$ update public.favoritos set sessao_id = 'imagem-corporal-m1-s4' where usuaria_id = 'a0000000-0000-0000-0000-00000000000a' and sessao_id = 'imagem-corporal-m1-s1' $$,
  '42501',
  null,
  'UPDATE em favoritos é rejeitado por falta de GRANT (favoritar/desfavoritar nunca editam, só insert/delete)'
);

-- Cenário 10: acesso anônimo é bloqueado.
reset role;
set local role anon;
reset request.jwt.claims;

select throws_ok(
  $$ select * from public.favoritos $$,
  '42501',
  null,
  'acesso anônimo é bloqueado por falta de GRANT (permission denied for table)'
);

select * from finish();
rollback;
```

- [ ] **Step 2: Rodar os testes de RLS**

Run: `supabase test db`
Expected: os 12 testes do plano passam (PASS). Se o ambiente não tiver Docker/Postgres local disponível para `supabase start`/`supabase test db`, registre esse arquivo como escrito-mas-não-executado localmente (mesma situação documentada em `supabase/tests/jornada_respostas_modulo_rls.test.sql`) e rode em CI ou em ambiente com Supabase CLI completo antes do PR.

- [ ] **Step 3: Commit**

```bash
git add supabase/tests/favoritos_rls.test.sql
git commit -m "test(favoritos): testes pgTAP de RLS — isolamento, constraints, unicidade"
```

---

## Task 11: Verificação final

**Files:** nenhum arquivo novo — só comandos de verificação sobre tudo que as Tasks 1-10 produziram.

- [ ] **Step 1: Suíte de testes completa**

Run: `npm test`
Expected: PASS em toda a suíte (unitários + componentes desta feature + suíte pré-existente).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: sem erros (warnings pré-existentes fora do escopo desta feature não bloqueiam).

- [ ] **Step 4: Build de produção**

Run: `npm run build`
Expected: build conclui sem erros.

- [ ] **Step 5: Testes de RLS (se houver ambiente Supabase local)**

Run: `supabase test db`
Expected: PASS, incluindo `supabase/tests/favoritos_rls.test.sql` (Task 10).

- [ ] **Step 6: Registrar pendências para o PR**

Nenhuma implementação de código nesta task — apenas confirme, antes de abrir o PR, que a lista de arquivos alterados/migrations aplicadas/resultado dos testes (typecheck/lint/build/advisors) está pronta para a seção "Entrega" do design (fora do escopo textual deste plano, que cobre só a Seção 5).

---

## Self-Review

**Cobertura da Seção 5 do design:**

- Server actions `favoritar(tipo, id)` / `desfavoritar(tipo, id)` — Task 4.
- `favoritar` valida no servidor que a prática existe e está `publicada` (não confia só na FK) — Task 4, `favoritar()`.
- Erro `23505` tratado como sucesso idempotente — Task 4, testado em "trata violação de unique (23505) como sucesso idempotente".
- `sessao_id` validado contra o catálogo em código de `jornadas-conteudo` — Task 4 (`buscarSessaoEmQualquerJornada`, Task 2).
- `BotaoFavorito` client com `aria-pressed`, nos cartões de prática e nas telas de sessão de jornada — Tasks 5 e 6.
- Página `/favoritos` resolvendo título/descrição via join em `praticas` e catálogo em código para sessões — Task 7.
- Item com conteúdo removido/despublicado → cartão "Conteúdo indisponível" com opção de remover, sem quebrar a página — Task 7 (`CartaoFavoritoIndisponivel`, testado com prática removida e sessão fora do catálogo).
- Paywall Pro validado também no servidor da rota do conteúdo — Task 8.
- Card "Continuar de onde parei" na Home, server component — Task 9.
- Prioridade 1 (sessão em andamento) sobre Prioridade 2 (próxima desbloqueada) — Task 3 (`resolverProximaAcaoJornada`) e Task 9, testado explicitamente em "prioriza retomar... mesmo sendo mais antiga".
- Prioridade 3 (progresso local por dispositivo) só quando nada no sistema de jornadas, client component pequeno, sem renderizar nada se não houver nenhum caso — Task 9 (`ContinuarPraticaLocalClient`).
- Nenhuma nova fonte de verdade: tudo lido de `sessoes_jornadas_conteudo_progresso`, do catálogo em código, ou de `localStorage` já existente — nenhuma tabela nova para progresso.
- Testes explícitos do enunciado: favorito duplicado (Task 4), remoção (Tasks 4 e 7), isolamento entre usuárias via RLS (Task 10), conteúdo inexistente (Tasks 4 e 7), jornada concluída (Task 3), sessão bloqueada (Task 3), retomada correta com prioridade (Task 3 e Task 9).

**Ambiguidade resolvida (documentada também no relatório final):** o design aponta `src/lib/praticas-progresso/armazenamento.ts` como a fonte de progresso local por dispositivo da Prioridade 3. A leitura do código real mostra que esse módulo grava **conclusões** em `conclusoes_praticas_conteudo` (Supabase, não local) — quem persiste rascunho local recuperável de fato é `usePersistedState`, já usado por `AutocompaixaoClient`/`DiarioGuiadoClient`. A Task 9 usa `usePersistedState`/`localStorage` diretamente (consistente com "client component pequeno" pedido pelo próprio design) e documenta essa correção inline no arquivo.

**Escopo de fundação de banco:** como nem a tabela `favoritos` nem `praticas.is_pro` existiam no repositório, a Task 1 cria só o subconjunto da Seção 1 necessário para a Seção 5 (não as demais tabelas/colunas de outras seções).

**Scan de placeholders:** nenhum "TBD"/"implementar depois"/"similar à Task N" no documento; todo step de código tem o código completo.

**Consistência de nomes:** `TipoFavorito`, `favoritar`/`desfavoritar`, `BotaoFavorito`, `LinhaProgressoSessao`, `resolverProximaAcaoJornada`, `ContinuarDeOndeParei`/`ContinuarPraticaLocalClient` usados de forma idêntica em toda task que os produz e em toda task que os consome.
