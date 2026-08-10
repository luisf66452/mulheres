# Ritual Diário MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a PWA where a woman does a 5-minute daily ritual (structured check-in → rule-based practice recommendation or safety-signal screen → guided practice → before/after feeling log → 7-day progress), ready for a closed beta of 20-50 users.

**Architecture:** Next.js (App Router, TypeScript) deployed on Vercel, with Supabase (Postgres + Auth + Row Level Security) as the only backend. All clinical decision logic (recommendation, safety-signal detection) is pure, unit-tested TypeScript operating on data rows the psychologist edits directly in Supabase Studio — no custom CMS, no AI in the decision path. Push notifications use the Web Push API with a Vercel Cron job as the daily trigger.

**Tech Stack:** Next.js 15 (App Router) + TypeScript, Tailwind CSS, Supabase (`@supabase/supabase-js`, `@supabase/ssr`), Vitest + Testing Library, `web-push`, Vercel (hosting + Cron).

## Global Constraints

- Idioma: português do Brasil em toda a interface e conteúdo.
- Nenhuma cobrança/checkout real neste MVP — apenas registro de intenção de pagamento (spec §10).
- O campo de texto livre do check-in nunca é analisado nem monitorado — apenas armazenado (spec §4, §6).
- Terminologia obrigatória: "sinal de segurança" / "necessidade de apoio" — nunca "diagnóstico" ou "detecção clínica" (spec §6).
- CVV 188 é apresentado como apoio emocional gratuito, não como serviço de emergência; risco imediato orienta para SAMU 192, UPA, pronto-socorro ou hospital (spec §6).
- Nenhum contato ativo automático (ligação, e-mail) e nenhum escalonamento automático em casos de sinal de segurança (spec §6).
- Dados e flags individuais não ficam visíveis por padrão a ninguém da equipe; qualquer acesso pontual é registrado em `acessos_administrativos` com motivo (spec §9).
- Recursos de segurança são configuráveis por país, começando pelo Brasil (`pais = 'BR'`) (spec §6).
- No MVP beta, o único fallback de lembrete é visual dentro do app — sem e-mail (spec §8).
- Sem prática alternativa à recomendação principal neste MVP (spec §3, §4).
- Insights de progresso são só descritivos e acolhedores, nunca causais/clínicos (spec §4).
- Retenção: dados de conta excluída apagados ou anonimizados em até 30 dias (spec §9).

**Testing approach for this plan:** pure business logic (recommendation engine, streak calculation, push time-window matching) gets real TDD with Vitest — this is where a bug would be a safety or correctness problem. Pages and Server Actions that are thin wiring over that logic and over Supabase (already a tested, managed backend) are verified with an explicit manual QA checklist per task instead of a mocked integration-test harness — building a full Supabase test-double/integration setup is out of scope for this MVP and would be its own project.

---

## Task 1: Project scaffold + shared date utility

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, Next.js default scaffold files
- Create: `vitest.config.ts`
- Create: `src/lib/date.ts`
- Test: `src/lib/date.test.ts`

**Interfaces:**
- Produces: `formatDateISO(d: Date): string` — returns `YYYY-MM-DD` in local time. Used by later tasks for `checkins.data` and for streak calculation.

- [ ] **Step 1: Scaffold the Next.js app**

Run (from the project root, `C:\Users\luis ferreira\Documents\Aplicativo-Mulheres`):

```bash
npx create-next-app@latest . --typescript --eslint --tailwind --app --src-dir --import-alias "@/*" --use-npm
```

Accept defaults when prompted. This will not touch the existing `docs/` folder or `.git/`.

- [ ] **Step 2: Verify the dev server runs**

Run: `npm run dev`
Expected: server starts on `http://localhost:3000`, and the default Next.js welcome page loads in a browser. Stop the server (Ctrl+C) after confirming.

- [ ] **Step 3: Install and configure Vitest**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

Add to `package.json` `"scripts"`:

```json
"test": "vitest run"
```

- [ ] **Step 4: Write the failing test for the date utility**

Create `src/lib/date.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { formatDateISO } from './date';

describe('formatDateISO', () => {
  it('formats a date as YYYY-MM-DD', () => {
    const d = new Date(2026, 7, 10); // month is 0-indexed: August
    expect(formatDateISO(d)).toBe('2026-08-10');
  });

  it('pads single-digit month and day', () => {
    const d = new Date(2026, 0, 5); // January 5
    expect(formatDateISO(d)).toBe('2026-01-05');
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npm run test -- src/lib/date.test.ts`
Expected: FAIL with "Cannot find module './date'" or similar.

- [ ] **Step 6: Implement the date utility**

Create `src/lib/date.ts`:

```ts
export function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm run test -- src/lib/date.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with Tailwind and Vitest"
```

---

## Task 2: Database schema, RLS policies, and TypeScript types

**Files:**
- Create: `supabase/migrations/0001_init.sql`
- Create: `src/lib/supabase/types.ts`

**Interfaces:**
- Produces: SQL schema for tables `perfis`, `checkins`, `praticas`, `regras_recomendacao`, `sessoes`, `recursos_seguranca`, `intencao_pagamento`, `acessos_administrativos`, `push_subscriptions`.
- Produces: TypeScript types `Perfil`, `Checkin`, `Pratica`, `RegraRecomendacao`, `Sessao`, `RecursoSeguranca`, `IntencaoPagamento`, `PushSubscriptionRow`, and a `Database` type combining them, consumed by Task 3's Supabase clients and every later task that touches the DB.

- [ ] **Step 1: Create a Supabase project**

Manually, in the browser: go to https://supabase.com/dashboard, create a new project (region: closest to Brazil, e.g. `sa-east-1`). Note the **Project URL** and **anon public key** from Project Settings → API — these are needed in Task 3.

- [ ] **Step 2: Write the schema migration**

Create `supabase/migrations/0001_init.sql`:

```sql
-- Perfis (extends auth.users; one row per usuária)
create table public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  plano text not null default 'free' check (plano in ('free', 'premium')),
  pais text not null default 'BR',
  horario_preferido_notificacao time, -- null until user sets a preference
  consentimento_dados_sensiveis_em timestamptz, -- null until onboarding consent step completes
  criado_em timestamptz not null default now()
);

alter table public.perfis enable row level security;

create policy "usuaria le proprio perfil"
  on public.perfis for select
  using (auth.uid() = id);

create policy "usuaria atualiza proprio perfil"
  on public.perfis for update
  using (auth.uid() = id);

-- Auto-create a perfil row when a new auth user signs up
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.perfis (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Check-ins
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  usuaria_id uuid not null references public.perfis(id) on delete cascade,
  data date not null,
  humor smallint not null check (humor between 1 and 5),
  imagem_corporal smallint not null check (imagem_corporal between 1 and 5),
  comida smallint not null check (comida between 1 and 5),
  texto_livre text,
  sinal_seguranca boolean not null default false,
  criado_em timestamptz not null default now(),
  unique (usuaria_id, data)
);

alter table public.checkins enable row level security;

create policy "usuaria le proprios checkins"
  on public.checkins for select
  using (auth.uid() = usuaria_id);

create policy "usuaria insere proprios checkins"
  on public.checkins for insert
  with check (auth.uid() = usuaria_id);

-- Práticas (biblioteca de conteúdo, curada pela psicóloga)
create table public.praticas (
  id uuid primary key default gen_random_uuid(),
  categoria text not null,
  tipo text not null check (tipo in ('respiracao', 'reflexao', 'afirmacao', 'movimento')),
  titulo text not null,
  conteudo text not null,
  status text not null default 'rascunho' check (status in ('rascunho', 'revisada', 'publicada')),
  criado_em timestamptz not null default now()
);

alter table public.praticas enable row level security;

create policy "qualquer usuaria autenticada le praticas publicadas"
  on public.praticas for select
  using (auth.role() = 'authenticated' and status = 'publicada');

-- Regras de recomendação (também curadas pela psicóloga)
create table public.regras_recomendacao (
  id uuid primary key default gen_random_uuid(),
  humor_min smallint not null,
  humor_max smallint not null,
  imagem_corporal_min smallint not null,
  imagem_corporal_max smallint not null,
  comida_min smallint not null,
  comida_max smallint not null,
  eh_sinal_seguranca boolean not null default false,
  categoria_pratica text,
  prioridade int not null default 0,
  ativa boolean not null default true
);

alter table public.regras_recomendacao enable row level security;

create policy "qualquer usuaria autenticada le regras ativas"
  on public.regras_recomendacao for select
  using (auth.role() = 'authenticated' and ativa = true);

-- Sessões (prática feita + sensação antes/depois)
create table public.sessoes (
  id uuid primary key default gen_random_uuid(),
  checkin_id uuid not null references public.checkins(id) on delete cascade,
  usuaria_id uuid not null references public.perfis(id) on delete cascade,
  pratica_id uuid not null references public.praticas(id),
  sensacao_antes smallint check (sensacao_antes between 1 and 5),
  sensacao_depois smallint check (sensacao_depois between 1 and 5),
  criado_em timestamptz not null default now()
);

alter table public.sessoes enable row level security;

create policy "usuaria le proprias sessoes"
  on public.sessoes for select
  using (auth.uid() = usuaria_id);

create policy "usuaria insere proprias sessoes"
  on public.sessoes for insert
  with check (auth.uid() = usuaria_id);

-- Recursos de segurança (configurável por país)
create table public.recursos_seguranca (
  id uuid primary key default gen_random_uuid(),
  pais text not null default 'BR',
  titulo text not null,
  corpo text not null,
  ordem int not null default 0
);

alter table public.recursos_seguranca enable row level security;

create policy "qualquer usuaria autenticada le recursos de seguranca"
  on public.recursos_seguranca for select
  using (auth.role() = 'authenticated');

-- Intenção de pagamento (sem transação real)
create table public.intencao_pagamento (
  id uuid primary key default gen_random_uuid(),
  usuaria_id uuid not null references public.perfis(id) on delete cascade,
  plano_escolhido text not null,
  preco_hipotetico numeric,
  criado_em timestamptz not null default now()
);

alter table public.intencao_pagamento enable row level security;

create policy "usuaria le propria intencao de pagamento"
  on public.intencao_pagamento for select
  using (auth.uid() = usuaria_id);

create policy "usuaria insere propria intencao de pagamento"
  on public.intencao_pagamento for insert
  with check (auth.uid() = usuaria_id);

-- Push subscriptions (uma por dispositivo/navegador)
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  usuaria_id uuid not null references public.perfis(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  criado_em timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "usuaria gerencia proprias subscriptions"
  on public.push_subscriptions for all
  using (auth.uid() = usuaria_id)
  with check (auth.uid() = usuaria_id);

-- Acessos administrativos (log de acesso pontual a dados individuais; sem acesso via client, só service role)
create table public.acessos_administrativos (
  id uuid primary key default gen_random_uuid(),
  usuaria_id uuid not null references public.perfis(id),
  acessado_por text not null,
  motivo text not null,
  criado_em timestamptz not null default now()
);

alter table public.acessos_administrativos enable row level security;
-- Nenhuma policy criada de propósito: sem policy, nenhuma role de client (anon/authenticated)
-- consegue ler ou escrever. Só a service role key (usada em Task 17) tem acesso.
```

Run this SQL in the Supabase Dashboard → SQL Editor (paste the whole file contents and run once). This keeps the file in git as the source of truth for future changes.

- [ ] **Step 3: Write the TypeScript types matching the schema**

Create `src/lib/supabase/types.ts`:

```ts
export type Plano = 'free' | 'premium';
export type StatusPratica = 'rascunho' | 'revisada' | 'publicada';
export type TipoPratica = 'respiracao' | 'reflexao' | 'afirmacao' | 'movimento';

export interface Perfil {
  id: string;
  plano: Plano;
  pais: string;
  horario_preferido_notificacao: string | null;
  consentimento_dados_sensiveis_em: string | null;
  criado_em: string;
}

export interface Checkin {
  id: string;
  usuaria_id: string;
  data: string; // YYYY-MM-DD
  humor: number;
  imagem_corporal: number;
  comida: number;
  texto_livre: string | null;
  sinal_seguranca: boolean;
  criado_em: string;
}

export interface Pratica {
  id: string;
  categoria: string;
  tipo: TipoPratica;
  titulo: string;
  conteudo: string;
  status: StatusPratica;
  criado_em: string;
}

export interface RegraRecomendacao {
  id: string;
  humor_min: number;
  humor_max: number;
  imagem_corporal_min: number;
  imagem_corporal_max: number;
  comida_min: number;
  comida_max: number;
  eh_sinal_seguranca: boolean;
  categoria_pratica: string | null;
  prioridade: number;
  ativa: boolean;
}

export interface Sessao {
  id: string;
  checkin_id: string;
  usuaria_id: string;
  pratica_id: string;
  sensacao_antes: number | null;
  sensacao_depois: number | null;
  criado_em: string;
}

export interface RecursoSeguranca {
  id: string;
  pais: string;
  titulo: string;
  corpo: string;
  ordem: number;
}

export interface IntencaoPagamento {
  id: string;
  usuaria_id: string;
  plano_escolhido: string;
  preco_hipotetico: number | null;
  criado_em: string;
}

export interface PushSubscriptionRow {
  id: string;
  usuaria_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  criado_em: string;
}

export interface Database {
  public: {
    Tables: {
      perfis: { Row: Perfil; Insert: Partial<Perfil> & { id: string }; Update: Partial<Perfil> };
      checkins: { Row: Checkin; Insert: Omit<Checkin, 'id' | 'criado_em'>; Update: Partial<Checkin> };
      praticas: { Row: Pratica; Insert: Partial<Pratica>; Update: Partial<Pratica> };
      regras_recomendacao: { Row: RegraRecomendacao; Insert: Partial<RegraRecomendacao>; Update: Partial<RegraRecomendacao> };
      sessoes: { Row: Sessao; Insert: Omit<Sessao, 'id' | 'criado_em'>; Update: Partial<Sessao> };
      recursos_seguranca: { Row: RecursoSeguranca; Insert: Partial<RecursoSeguranca>; Update: Partial<RecursoSeguranca> };
      intencao_pagamento: { Row: IntencaoPagamento; Insert: Omit<IntencaoPagamento, 'id' | 'criado_em'>; Update: Partial<IntencaoPagamento> };
      push_subscriptions: { Row: PushSubscriptionRow; Insert: Omit<PushSubscriptionRow, 'id' | 'criado_em'>; Update: Partial<PushSubscriptionRow> };
    };
  };
}
```

- [ ] **Step 4: Manual verification**

In the Supabase Dashboard → Table Editor, confirm all 8 tables exist with the expected columns, and that RLS is shown as "Enabled" on each.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0001_init.sql src/lib/supabase/types.ts
git commit -m "feat: add database schema, RLS policies, and TypeScript types"
```

---

## Task 3: Supabase client helpers

**Files:**
- Create: `.env.local` (not committed — see `.gitignore`, already excluded by Next.js scaffold)
- Create: `.env.local.example`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`

**Interfaces:**
- Consumes: `Database` type from `src/lib/supabase/types.ts` (Task 2).
- Produces: `createSupabaseBrowserClient(): SupabaseClient<Database>` for Client Components. `createSupabaseServerClient(): Promise<SupabaseClient<Database>>` for Server Components/Actions/Route Handlers. Both consumed by every task from Task 7 onward.

- [ ] **Step 1: Install Supabase packages**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: Create env files**

Create `.env.local.example`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
CRON_SECRET=
```

Create `.env.local` with the same keys, filled in with the Project URL and anon key from Task 2 Step 1 (leave the other keys blank for now — filled in Task 14 and Task 17).

- [ ] **Step 3: Create the browser client**

Create `src/lib/supabase/client.ts`:

```ts
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 4: Create the server client**

Create `src/lib/supabase/server.ts`:

```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './types';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // called from a Server Component without a response to write to; safe to ignore
          }
        },
      },
    }
  );
}
```

- [ ] **Step 5: Manual verification**

Create a temporary route `src/app/debug/page.tsx` that calls `createSupabaseServerClient()` and runs `await supabase.from('recursos_seguranca').select('*')`, renders `JSON.stringify(data)`. Run `npm run dev`, visit `/debug`, confirm it renders `[]` (empty array, no error) rather than a connection error. Delete `src/app/debug` after confirming.

- [ ] **Step 6: Commit**

```bash
git add .env.local.example src/lib/supabase/client.ts src/lib/supabase/server.ts
git commit -m "feat: add Supabase browser and server client helpers"
```

---

## Task 4: Seed content (práticas, regras, recursos de segurança)

**Files:**
- Create: `supabase/seed.sql`

**Interfaces:**
- Consumes: schema from Task 2.
- Produces: rows in `praticas`, `regras_recomendacao`, `recursos_seguranca` that Task 5 onward relies on to exercise the app end-to-end. Content text here is illustrative placeholder copy explicitly marked for the partner psychologist's review (spec §7) — not final published copy.

- [ ] **Step 1: Write seed data**

Create `supabase/seed.sql`:

```sql
-- Conteúdo de exemplo para desenvolvimento e teste end-to-end.
-- status = 'rascunho': precisa de revisão da psicóloga parceira antes de virar 'publicada' de verdade.
-- Para rodar localmente durante o desenvolvimento, ajuste manualmente o status para 'publicada'
-- em cada linha abaixo (ou rode o UPDATE no final deste arquivo).

insert into public.praticas (categoria, tipo, titulo, conteudo, status) values
  ('humor_baixo', 'respiracao', 'Respiração 4-7-8',
   'Inspire contando até 4, segure contando até 7, solte o ar contando até 8. Repita 4 vezes, em um ritmo confortável para você.',
   'rascunho'),
  ('imagem_corporal_dificil', 'afirmacao', 'Meu corpo não precisa ser perfeito para merecer cuidado',
   'Hoje, em vez de avaliar seu corpo, tente notar uma coisa que ele fez por você: caminhar, respirar, abraçar alguém.',
   'rascunho'),
  ('comida_culpa', 'reflexao', 'Comer não é uma falha moral',
   'Escreva uma frase sobre uma refeição recente sem usar as palavras "certo", "errado", "deveria" ou "culpa".',
   'rascunho'),
  ('geral_positivo', 'movimento', 'Alongamento consciente de 2 minutos',
   'Alongue os braços acima da cabeça, respire fundo três vezes, e note como o corpo se sente neste exato momento, sem julgamento.',
   'rascunho');

-- Regras de recomendação: faixas 1-5 para humor, imagem corporal e comida.
-- Prioridade mais alta vence quando mais de uma regra bate.
insert into public.regras_recomendacao
  (humor_min, humor_max, imagem_corporal_min, imagem_corporal_max, comida_min, comida_max, eh_sinal_seguranca, categoria_pratica, prioridade, ativa)
values
  -- Sinal de segurança: humor muito baixo E imagem corporal muito baixa E comida muito ruim, simultaneamente.
  (1, 1, 1, 1, 1, 1, true, null, 100, true),
  (1, 2, 1, 5, 1, 5, false, 'humor_baixo', 10, true),
  (1, 5, 1, 2, 1, 5, false, 'imagem_corporal_dificil', 9, true),
  (1, 5, 1, 5, 1, 2, false, 'comida_culpa', 8, true),
  (1, 5, 1, 5, 1, 5, false, 'geral_positivo', 0, true);

insert into public.recursos_seguranca (pais, titulo, corpo, ordem) values
  ('BR', 'Você não está sozinha',
   'O que você está sentindo importa. Isso não é uma emergência, mas merece atenção e cuidado.', 0),
  ('BR', 'Apoio emocional gratuito',
   'O CVV (Centro de Valorização da Vida) oferece apoio emocional gratuito e sigiloso, 24h por dia, pelo telefone 188, ou pelo chat em cvv.org.br. Não é um serviço de emergência — é alguém disposto a te ouvir.', 1),
  ('BR', 'Em caso de risco imediato',
   'Se você ou alguém perto de você está em risco imediato, procure o SAMU (192), uma UPA, um pronto-socorro ou hospital mais próximo.', 2);
```

- [ ] **Step 2: Run the seed**

In Supabase Dashboard → SQL Editor, paste and run the contents of `supabase/seed.sql`. Then run this one-off statement to make the seed content usable while developing (a real "publicada" gate is exercised for real in Task 7 onward, but until the psychologist has actually reviewed content, keep it at `rascunho` in any real deployment):

```sql
update public.praticas set status = 'publicada';
```

- [ ] **Step 3: Manual verification**

In Table Editor, confirm `praticas` has 4 rows, `regras_recomendacao` has 5 rows, `recursos_seguranca` has 3 rows for `pais = 'BR'`.

- [ ] **Step 4: Commit**

```bash
git add supabase/seed.sql
git commit -m "feat: add seed content for practices, rules, and safety resources"
```

---

## Task 5: Recommendation engine (pure logic)

**Files:**
- Create: `src/lib/checkin/recommend.ts`
- Test: `src/lib/checkin/recommend.test.ts`

**Interfaces:**
- Consumes: `RegraRecomendacao` type from `src/lib/supabase/types.ts` (Task 2).
- Produces: `type CheckinAnswers = { humor: number; imagemCorporal: number; comida: number }`, `type Recomendacao = { tipo: 'sinal_seguranca' } | { tipo: 'pratica'; categoria: string }`, and `avaliarCheckin(answers: CheckinAnswers, regras: RegraRecomendacao[]): Recomendacao`. Consumed by Task 9 (check-in flow).

- [ ] **Step 1: Write the failing tests**

Create `src/lib/checkin/recommend.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { avaliarCheckin, type CheckinAnswers } from './recommend';
import type { RegraRecomendacao } from '@/lib/supabase/types';

function regra(overrides: Partial<RegraRecomendacao>): RegraRecomendacao {
  return {
    id: 'regra-1',
    humor_min: 1,
    humor_max: 5,
    imagem_corporal_min: 1,
    imagem_corporal_max: 5,
    comida_min: 1,
    comida_max: 5,
    eh_sinal_seguranca: false,
    categoria_pratica: 'geral_positivo',
    prioridade: 0,
    ativa: true,
    ...overrides,
  };
}

describe('avaliarCheckin', () => {
  it('recomenda a categoria da regra que corresponde às respostas', () => {
    const answers: CheckinAnswers = { humor: 2, imagemCorporal: 3, comida: 4 };
    const regras = [regra({ id: 'r1', humor_min: 1, humor_max: 2, categoria_pratica: 'humor_baixo' })];

    expect(avaliarCheckin(answers, regras)).toEqual({ tipo: 'pratica', categoria: 'humor_baixo' });
  });

  it('retorna sinal_seguranca quando a regra correspondente é marcada como tal', () => {
    const answers: CheckinAnswers = { humor: 1, imagemCorporal: 1, comida: 1 };
    const regras = [
      regra({ id: 'r-risco', humor_min: 1, humor_max: 1, imagem_corporal_min: 1, imagem_corporal_max: 1, comida_min: 1, comida_max: 1, eh_sinal_seguranca: true, categoria_pratica: null, prioridade: 100 }),
      regra({ id: 'r-geral', prioridade: 0 }),
    ];

    expect(avaliarCheckin(answers, regras)).toEqual({ tipo: 'sinal_seguranca' });
  });

  it('escolhe a regra de maior prioridade quando várias correspondem', () => {
    const answers: CheckinAnswers = { humor: 1, imagemCorporal: 1, comida: 1 };
    const regras = [
      regra({ id: 'baixa', categoria_pratica: 'geral_positivo', prioridade: 0 }),
      regra({ id: 'alta', categoria_pratica: 'humor_baixo', prioridade: 10 }),
    ];

    expect(avaliarCheckin(answers, regras)).toEqual({ tipo: 'pratica', categoria: 'humor_baixo' });
  });

  it('ignora regras inativas', () => {
    const answers: CheckinAnswers = { humor: 1, imagemCorporal: 1, comida: 1 };
    const regras = [
      regra({ id: 'inativa', categoria_pratica: 'nao_deveria_aparecer', ativa: false, prioridade: 100 }),
      regra({ id: 'ativa', categoria_pratica: 'geral_positivo', prioridade: 0 }),
    ];

    expect(avaliarCheckin(answers, regras)).toEqual({ tipo: 'pratica', categoria: 'geral_positivo' });
  });

  it('lança erro quando nenhuma regra corresponde', () => {
    const answers: CheckinAnswers = { humor: 5, imagemCorporal: 5, comida: 5 };
    const regras = [regra({ humor_min: 1, humor_max: 1 })];

    expect(() => avaliarCheckin(answers, regras)).toThrow(/nenhuma regra/i);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- src/lib/checkin/recommend.test.ts`
Expected: FAIL with "Cannot find module './recommend'"

- [ ] **Step 3: Implement the recommendation engine**

Create `src/lib/checkin/recommend.ts`:

```ts
import type { RegraRecomendacao } from '@/lib/supabase/types';

export interface CheckinAnswers {
  humor: number;
  imagemCorporal: number;
  comida: number;
}

export type Recomendacao =
  | { tipo: 'sinal_seguranca' }
  | { tipo: 'pratica'; categoria: string };

export function avaliarCheckin(
  answers: CheckinAnswers,
  regras: RegraRecomendacao[]
): Recomendacao {
  const candidatas = regras
    .filter((r) => r.ativa)
    .filter((r) => answers.humor >= r.humor_min && answers.humor <= r.humor_max)
    .filter(
      (r) =>
        answers.imagemCorporal >= r.imagem_corporal_min &&
        answers.imagemCorporal <= r.imagem_corporal_max
    )
    .filter((r) => answers.comida >= r.comida_min && answers.comida <= r.comida_max)
    .sort((a, b) => b.prioridade - a.prioridade);

  const escolhida = candidatas[0];
  if (!escolhida) {
    throw new Error('Nenhuma regra de recomendação corresponde às respostas do check-in');
  }

  if (escolhida.eh_sinal_seguranca) {
    return { tipo: 'sinal_seguranca' };
  }

  return { tipo: 'pratica', categoria: escolhida.categoria_pratica! };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- src/lib/checkin/recommend.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/checkin/recommend.ts src/lib/checkin/recommend.test.ts
git commit -m "feat: add rule-based check-in recommendation engine"
```

---

## Task 6: Progress/streak calculation (pure logic)

**Files:**
- Create: `src/lib/progress/streak.ts`
- Test: `src/lib/progress/streak.test.ts`

**Interfaces:**
- Consumes: `formatDateISO` from `src/lib/date.ts` (Task 1).
- Produces: `calcularProgresso7Dias(datasCheckin: string[], hoje: Date): { diasCompletos: number; diasConsecutivosAtuais: number; ultimos7Dias: { data: string; completou: boolean }[] }`. Consumed by Task 12 (progress screen).

- [ ] **Step 1: Write the failing tests**

Create `src/lib/progress/streak.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { calcularProgresso7Dias } from './streak';

describe('calcularProgresso7Dias', () => {
  const hoje = new Date(2026, 7, 10); // 2026-08-10, a Monday

  it('conta 0 dias completos quando não há check-ins', () => {
    const resultado = calcularProgresso7Dias([], hoje);
    expect(resultado.diasCompletos).toBe(0);
    expect(resultado.diasConsecutivosAtuais).toBe(0);
    expect(resultado.ultimos7Dias).toHaveLength(7);
    expect(resultado.ultimos7Dias.every((d) => d.completou === false)).toBe(true);
  });

  it('conta dias completos corretamente dentro da janela de 7 dias', () => {
    const datas = ['2026-08-10', '2026-08-09', '2026-08-07'];
    const resultado = calcularProgresso7Dias(datas, hoje);
    expect(resultado.diasCompletos).toBe(3);
  });

  it('ignora check-ins fora da janela de 7 dias', () => {
    const datas = ['2026-08-10', '2026-07-01'];
    const resultado = calcularProgresso7Dias(datas, hoje);
    expect(resultado.diasCompletos).toBe(1);
  });

  it('calcula sequência consecutiva atual terminando hoje', () => {
    const datas = ['2026-08-10', '2026-08-09', '2026-08-08', '2026-08-06'];
    const resultado = calcularProgresso7Dias(datas, hoje);
    expect(resultado.diasConsecutivosAtuais).toBe(3);
  });

  it('sequência consecutiva é 0 se hoje ainda não tem check-in', () => {
    const datas = ['2026-08-09', '2026-08-08'];
    const resultado = calcularProgresso7Dias(datas, hoje);
    expect(resultado.diasConsecutivosAtuais).toBe(0);
  });

  it('marca cada um dos últimos 7 dias com completou true/false', () => {
    const datas = ['2026-08-10', '2026-08-08'];
    const resultado = calcularProgresso7Dias(datas, hoje);
    const porData = Object.fromEntries(resultado.ultimos7Dias.map((d) => [d.data, d.completou]));
    expect(porData['2026-08-10']).toBe(true);
    expect(porData['2026-08-09']).toBe(false);
    expect(porData['2026-08-08']).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- src/lib/progress/streak.test.ts`
Expected: FAIL with "Cannot find module './streak'"

- [ ] **Step 3: Implement the streak calculation**

Create `src/lib/progress/streak.ts`:

```ts
import { formatDateISO } from '@/lib/date';

export interface ProgressoDia {
  data: string;
  completou: boolean;
}

export interface Progresso7Dias {
  diasCompletos: number;
  diasConsecutivosAtuais: number;
  ultimos7Dias: ProgressoDia[];
}

export function calcularProgresso7Dias(
  datasCheckin: string[],
  hoje: Date
): Progresso7Dias {
  const completadas = new Set(datasCheckin);

  const ultimos7Dias: ProgressoDia[] = [];
  for (let i = 6; i >= 0; i--) {
    const dia = new Date(hoje);
    dia.setDate(dia.getDate() - i);
    const data = formatDateISO(dia);
    ultimos7Dias.push({ data, completou: completadas.has(data) });
  }

  const diasCompletos = ultimos7Dias.filter((d) => d.completou).length;

  let diasConsecutivosAtuais = 0;
  for (let i = ultimos7Dias.length - 1; i >= 0; i--) {
    if (ultimos7Dias[i].completou) {
      diasConsecutivosAtuais++;
    } else {
      break;
    }
  }

  return { diasCompletos, diasConsecutivosAtuais, ultimos7Dias };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- src/lib/progress/streak.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/progress/streak.ts src/lib/progress/streak.test.ts
git commit -m "feat: add 7-day progress and streak calculation"
```

---

## Task 7: Authentication (magic link) + route protection

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/app/login/actions.ts`
- Create: `src/app/auth/callback/route.ts`
- Create: `src/middleware.ts`

**Interfaces:**
- Consumes: `createSupabaseBrowserClient`, `createSupabaseServerClient` (Task 3).
- Produces: middleware that redirects unauthenticated requests to `/login` for any path except `/login`, `/auth/callback`, `/privacidade`, and Next.js internals. Task 8 extends this middleware with the consent gate.

- [ ] **Step 1: Create the magic-link login page**

Create `src/app/login/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { enviarLinkMagico } from './actions';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    const resultado = await enviarLinkMagico(email);
    if (resultado.erro) {
      setErro(resultado.erro);
    } else {
      setEnviado(true);
    }
  }

  if (enviado) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="text-center text-lg">
          Enviamos um link de acesso para <strong>{email}</strong>. Abra seu e-mail para entrar.
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Entrar</h1>
        <input
          type="email"
          required
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border p-3"
        />
        {erro && <p className="text-red-600">{erro}</p>}
        <button type="submit" className="w-full rounded bg-black p-3 text-white">
          Receber link de acesso
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Create the Server Action that sends the magic link**

Create `src/app/login/actions.ts`:

```ts
'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function enviarLinkMagico(email: string): Promise<{ erro?: string }> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { erro: 'Não foi possível enviar o link. Tente novamente.' };
  }

  return {};
}
```

Add `NEXT_PUBLIC_SITE_URL=http://localhost:3000` to `.env.local` and `.env.local.example`.

- [ ] **Step 3: Create the auth callback route**

Create `src/app/auth/callback/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}/checkin`);
}
```

- [ ] **Step 4: Create route-protection middleware**

Create `src/middleware.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const ROTAS_PUBLICAS = ['/login', '/auth/callback', '/privacidade'];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isRotaPublica = ROTAS_PUBLICAS.some((rota) => request.nextUrl.pathname.startsWith(rota));

  if (!user && !isRotaPublica) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icons).*)'],
};
```

- [ ] **Step 5: Manual verification**

Run `npm run dev`. Visit `/checkin` while logged out — confirm redirect to `/login`. Enter your own email on `/login`, confirm the "enviamos um link" message appears, check your inbox for the Supabase magic-link email, click it, confirm you land on `/checkin` (a 404 page is fine at this point — the route doesn't exist yet — as long as you were not redirected back to `/login`, proving the session is active). Check Supabase Dashboard → Authentication → Users: confirm your user appears, and Table Editor → `perfis`: confirm a matching row was auto-created by the trigger.

- [ ] **Step 6: Commit**

```bash
git add src/app/login src/app/auth src/middleware.ts .env.local.example
git commit -m "feat: add magic-link authentication and route protection"
```

---

## Task 8: Onboarding consent (LGPD) + consent gate

**Files:**
- Create: `src/app/onboarding/page.tsx`
- Create: `src/app/onboarding/actions.ts`
- Modify: `src/middleware.ts`

**Interfaces:**
- Consumes: `createSupabaseServerClient` (Task 3), `Perfil` type (Task 2).
- Produces: middleware redirect to `/onboarding` for authenticated users whose `perfis.consentimento_dados_sensiveis_em` is null, on any route other than `/onboarding` itself and the public routes from Task 7.

- [ ] **Step 1: Write the onboarding consent page**

Create `src/app/onboarding/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { registrarConsentimento } from './actions';

export default function OnboardingPage() {
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [aceitouDadosSensiveis, setAceitouDadosSensiveis] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const podeContinuar = aceitouTermos && aceitouDadosSensiveis;

  async function handleContinuar() {
    setEnviando(true);
    await registrarConsentimento();
  }

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Antes de começar</h1>
      <p>
        Este app não é terapia, não faz diagnóstico e não substitui acompanhamento profissional.
        Ele te ajuda a construir um pequeno ritual diário de cuidado com você mesma.
      </p>

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={aceitouTermos}
          onChange={(e) => setAceitouTermos(e.target.checked)}
          className="mt-1"
        />
        <span>
          Li e aceito os <a href="/privacidade" className="underline">Termos de Uso e a Política de Privacidade</a>.
        </span>
      </label>

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={aceitouDadosSensiveis}
          onChange={(e) => setAceitouDadosSensiveis(e.target.checked)}
          className="mt-1"
        />
        <span>
          Entendo que este app coleta dados sensíveis sobre humor, imagem corporal e alimentação,
          e autorizo esse tratamento para receber o ritual diário personalizado.
        </span>
      </label>

      <button
        disabled={!podeContinuar || enviando}
        onClick={handleContinuar}
        className="w-full rounded bg-black p-3 text-white disabled:opacity-40"
      >
        Continuar
      </button>
    </main>
  );
}
```

- [ ] **Step 2: Write the Server Action that records consent**

Create `src/app/onboarding/actions.ts`:

```ts
'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function registrarConsentimento() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  await supabase
    .from('perfis')
    .update({ consentimento_dados_sensiveis_em: new Date().toISOString() })
    .eq('id', user.id);

  redirect('/checkin');
}
```

- [ ] **Step 3: Extend middleware with the consent gate**

Modify `src/middleware.ts` — after the existing `if (!user && !isRotaPublica)` block, add:

```ts
  if (user && !isRotaPublica && !request.nextUrl.pathname.startsWith('/onboarding')) {
    const { data: perfil } = await supabase
      .from('perfis')
      .select('consentimento_dados_sensiveis_em')
      .eq('id', user.id)
      .single();

    if (!perfil?.consentimento_dados_sensiveis_em) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }
```

(Place this block just before the final `return response;`.)

- [ ] **Step 4: Manual verification**

Log in with a fresh test email (or manually set `consentimento_dados_sensiveis_em` back to `null` for your existing test user in Table Editor). Confirm visiting any protected route redirects to `/onboarding`. Confirm both checkboxes must be checked before "Continuar" is enabled. Click "Continuar", confirm redirect to `/checkin`, and confirm in Table Editor that `perfis.consentimento_dados_sensiveis_em` is now set. Reload any protected route and confirm you are no longer redirected to `/onboarding`.

- [ ] **Step 5: Commit**

```bash
git add src/app/onboarding src/middleware.ts
git commit -m "feat: add LGPD sensitive-data consent onboarding gate"
```

---

## Task 9: Daily check-in flow

**Files:**
- Create: `src/app/checkin/page.tsx`
- Create: `src/app/checkin/actions.ts`

**Interfaces:**
- Consumes: `avaliarCheckin`, `CheckinAnswers`, `Recomendacao` (Task 5); `createSupabaseServerClient` (Task 3).
- Produces: on submit, writes a row to `checkins` and redirects to `/seguranca` (Task 10) or `/pratica/[praticaId]` (Task 11) depending on the recommendation. If today's check-in already exists, redirects straight to `/progresso` (Task 12).

- [ ] **Step 1: Write the check-in Server Action**

Create `src/app/checkin/actions.ts`:

```ts
'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { avaliarCheckin, type CheckinAnswers } from '@/lib/checkin/recommend';
import { formatDateISO } from '@/lib/date';

export async function submeterCheckin(answers: CheckinAnswers) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const hojeISO = formatDateISO(new Date());

  const { data: regras } = await supabase
    .from('regras_recomendacao')
    .select('*')
    .eq('ativa', true);

  const recomendacao = avaliarCheckin(answers, regras ?? []);

  const { data: checkin, error } = await supabase
    .from('checkins')
    .insert({
      usuaria_id: user.id,
      data: hojeISO,
      humor: answers.humor,
      imagem_corporal: answers.imagemCorporal,
      comida: answers.comida,
      texto_livre: answers.textoLivre ?? null,
      sinal_seguranca: recomendacao.tipo === 'sinal_seguranca',
    })
    .select()
    .single();

  if (error || !checkin) {
    throw new Error('Não foi possível salvar o check-in. Tente novamente.');
  }

  if (recomendacao.tipo === 'sinal_seguranca') {
    redirect('/seguranca');
  }

  const { data: pratica } = await supabase
    .from('praticas')
    .select('id')
    .eq('categoria', recomendacao.categoria)
    .eq('status', 'publicada')
    .limit(1)
    .single();

  if (!pratica) {
    throw new Error(`Nenhuma prática publicada encontrada para a categoria "${recomendacao.categoria}"`);
  }

  redirect(`/pratica/${pratica.id}?checkin=${checkin.id}`);
}
```

Update `CheckinAnswers` in `src/lib/checkin/recommend.ts` (Task 5) to add the optional free-text field, since it's stored but never evaluated:

```ts
export interface CheckinAnswers {
  humor: number;
  imagemCorporal: number;
  comida: number;
  textoLivre?: string;
}
```

- [ ] **Step 2: Write the check-in page**

Create `src/app/checkin/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { submeterCheckin } from './actions';

const ESCALA = [1, 2, 3, 4, 5];

export default function CheckinPage() {
  const [humor, setHumor] = useState<number | null>(null);
  const [imagemCorporal, setImagemCorporal] = useState<number | null>(null);
  const [comida, setComida] = useState<number | null>(null);
  const [textoLivre, setTextoLivre] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const podeEnviar = humor !== null && imagemCorporal !== null && comida !== null && !enviando;

  async function handleSubmit() {
    if (!podeEnviar) return;
    setEnviando(true);
    setErro(null);
    try {
      await submeterCheckin({
        humor: humor!,
        imagemCorporal: imagemCorporal!,
        comida: comida!,
        textoLivre: textoLivre.trim() || undefined,
      });
    } catch {
      setErro('Algo deu errado ao salvar seu check-in. Tente novamente.');
      setEnviando(false);
    }
  }

  return (
    <main className="mx-auto max-w-md space-y-8 p-6">
      <h1 className="text-2xl font-semibold">Como você está hoje?</h1>

      <EscalaPergunta label="Seu humor hoje" valor={humor} onChange={setHumor} />
      <EscalaPergunta label="Como você se sente com seu corpo hoje" valor={imagemCorporal} onChange={setImagemCorporal} />
      <EscalaPergunta label="Sua relação com a comida hoje" valor={comida} onChange={setComida} />

      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          Espaço opcional para desabafar. Este texto <strong>não é analisado nem monitorado</strong> —
          fica só no seu diário.
        </p>
        <textarea
          value={textoLivre}
          onChange={(e) => setTextoLivre(e.target.value)}
          className="w-full rounded border p-3"
          rows={4}
          placeholder="Se quiser, escreva livremente aqui..."
        />
      </div>

      {erro && <p className="text-red-600">{erro}</p>}

      <button
        disabled={!podeEnviar}
        onClick={handleSubmit}
        className="w-full rounded bg-black p-3 text-white disabled:opacity-40"
      >
        {enviando ? 'Enviando...' : 'Continuar'}
      </button>
    </main>
  );
}

function EscalaPergunta({
  label,
  valor,
  onChange,
}: {
  label: string;
  valor: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <p>{label}</p>
      <div className="flex gap-2">
        {ESCALA.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`h-12 w-12 rounded-full border ${valor === n ? 'bg-black text-white' : ''}`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Manual verification**

Run `npm run dev`, log in, complete onboarding, land on `/checkin`. Answer all three scales with values that (per the seed data from Task 4) do **not** all equal 1 — confirm redirect to `/pratica/<uuid>` (404 is expected until Task 11 exists, but the URL should contain a valid practice UUID). In Table Editor, confirm a new row exists in `checkins` with `sinal_seguranca = false`. Then repeat with all three answers set to 1 — confirm redirect to `/seguranca` (404 expected until Task 10) and that the new `checkins` row has `sinal_seguranca = true`.

- [ ] **Step 4: Commit**

```bash
git add src/app/checkin src/lib/checkin/recommend.ts
git commit -m "feat: add daily check-in flow with rule-based routing"
```

---

## Task 10: Safety / acolhimento screen

**Files:**
- Create: `src/app/seguranca/page.tsx`

**Interfaces:**
- Consumes: `createSupabaseServerClient` (Task 3), `RecursoSeguranca` type (Task 2).
- Produces: a page rendering all `recursos_seguranca` rows for `pais = 'BR'`, ordered by `ordem`.

- [ ] **Step 1: Write the safety page**

Create `src/app/seguranca/page.tsx`:

```tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function SegurancaPage() {
  const supabase = await createSupabaseServerClient();
  const { data: recursos } = await supabase
    .from('recursos_seguranca')
    .select('*')
    .eq('pais', 'BR')
    .order('ordem');

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      {(recursos ?? []).map((recurso) => (
        <div key={recurso.id} className="space-y-1">
          <h2 className="text-xl font-semibold">{recurso.titulo}</h2>
          <p>{recurso.corpo}</p>
        </div>
      ))}

      <a href="/checkin" className="block w-full rounded border p-3 text-center">
        Voltar
      </a>
    </main>
  );
}
```

- [ ] **Step 2: Manual verification**

With the check-in flow from Task 9 producing a `sinal_seguranca` redirect, visit `/seguranca` directly (or via that redirect) and confirm the three seeded resources render in order: "Você não está sozinha", "Apoio emocional gratuito" (mentioning CVV 188, described as gratuito and not an emergency service), and "Em caso de risco imediato" (mentioning SAMU 192, UPA, pronto-socorro, hospital). Confirm the word "diagnóstico" does not appear anywhere on this page or in `checkin/page.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/app/seguranca
git commit -m "feat: add safety-signal support screen"
```

---

## Task 11: Guided practice screen + session logging

**Files:**
- Create: `src/app/pratica/[id]/page.tsx`
- Create: `src/app/pratica/[id]/actions.ts`

**Interfaces:**
- Consumes: `createSupabaseServerClient` (Task 3), `Pratica`/`Sessao` types (Task 2).
- Produces: on completion, writes a row to `sessoes` linking the check-in, the practice, and before/after feeling, then redirects to `/progresso` (Task 12).

- [ ] **Step 1: Write the session-logging Server Action**

Create `src/app/pratica/[id]/actions.ts`:

```ts
'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function registrarSessao(params: {
  checkinId: string;
  praticaId: string;
  sensacaoAntes: number;
  sensacaoDepois: number;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  await supabase.from('sessoes').insert({
    checkin_id: params.checkinId,
    usuaria_id: user.id,
    pratica_id: params.praticaId,
    sensacao_antes: params.sensacaoAntes,
    sensacao_depois: params.sensacaoDepois,
  });

  redirect('/progresso');
}
```

- [ ] **Step 2: Write the practice page**

Create `src/app/pratica/[id]/page.tsx`:

```tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import PraticaClient from './PraticaClient';

export default async function PraticaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ checkin?: string }>;
}) {
  const { id } = await params;
  const { checkin } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: pratica } = await supabase
    .from('praticas')
    .select('*')
    .eq('id', id)
    .eq('status', 'publicada')
    .single();

  if (!pratica || !checkin) {
    notFound();
  }

  return <PraticaClient pratica={pratica} checkinId={checkin} />;
}
```

Create `src/app/pratica/[id]/PraticaClient.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { registrarSessao } from './actions';
import type { Pratica } from '@/lib/supabase/types';

const ESCALA = [1, 2, 3, 4, 5];

export default function PraticaClient({
  pratica,
  checkinId,
}: {
  pratica: Pratica;
  checkinId: string;
}) {
  const [etapa, setEtapa] = useState<'antes' | 'pratica' | 'depois'>('antes');
  const [sensacaoAntes, setSensacaoAntes] = useState<number | null>(null);
  const [sensacaoDepois, setSensacaoDepois] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (etapa === 'antes') {
    return (
      <main className="mx-auto max-w-md space-y-6 p-6">
        <p>Antes de começar, como você está se sentindo agora?</p>
        <Escala valor={sensacaoAntes} onChange={setSensacaoAntes} />
        <button
          disabled={sensacaoAntes === null}
          onClick={() => setEtapa('pratica')}
          className="w-full rounded bg-black p-3 text-white disabled:opacity-40"
        >
          Continuar
        </button>
      </main>
    );
  }

  if (etapa === 'pratica') {
    return (
      <main className="mx-auto max-w-md space-y-6 p-6">
        <h1 className="text-2xl font-semibold">{pratica.titulo}</h1>
        <p className="whitespace-pre-line">{pratica.conteudo}</p>
        <button
          onClick={() => setEtapa('depois')}
          className="w-full rounded bg-black p-3 text-white"
        >
          Concluí a prática
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <p>Como você se sente agora?</p>
      <Escala valor={sensacaoDepois} onChange={setSensacaoDepois} />
      <button
        disabled={sensacaoDepois === null || enviando}
        onClick={async () => {
          setEnviando(true);
          await registrarSessao({
            checkinId,
            praticaId: pratica.id,
            sensacaoAntes: sensacaoAntes!,
            sensacaoDepois: sensacaoDepois!,
          });
        }}
        className="w-full rounded bg-black p-3 text-white disabled:opacity-40"
      >
        Finalizar
      </button>
    </main>
  );
}

function Escala({ valor, onChange }: { valor: number | null; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-2">
      {ESCALA.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`h-12 w-12 rounded-full border ${valor === n ? 'bg-black text-white' : ''}`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Manual verification**

Complete a check-in that routes to a practice (Task 9). Confirm the "antes" scale, then the practice title/content from the seeded `praticas` row, then the "depois" scale, then "Finalizar" redirects to `/progresso` (404 expected until Task 12). Confirm a new row exists in `sessoes` with the correct `checkin_id`, `pratica_id`, `sensacao_antes`, `sensacao_depois`.

- [ ] **Step 4: Commit**

```bash
git add src/app/pratica
git commit -m "feat: add guided practice screen with before/after session logging"
```

---

## Task 12: Progress screen

**Files:**
- Create: `src/app/progresso/page.tsx`

**Interfaces:**
- Consumes: `calcularProgresso7Dias` (Task 6), `createSupabaseServerClient` (Task 3).
- Produces: a page showing the free-tier 7-day view with descriptive-only copy.

- [ ] **Step 1: Write the progress page**

Create `src/app/progresso/page.tsx`:

```tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { calcularProgresso7Dias } from '@/lib/progress/streak';

export default async function ProgressoPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: checkins } = await supabase
    .from('checkins')
    .select('data')
    .eq('usuaria_id', user!.id);

  const progresso = calcularProgresso7Dias((checkins ?? []).map((c) => c.data), new Date());

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Seu progresso</h1>

      <p>
        Você completou o ritual em <strong>{progresso.diasCompletos} de 7</strong> dias esta semana.
      </p>

      {progresso.diasConsecutivosAtuais > 0 && (
        <p>Você está em uma sequência de {progresso.diasConsecutivosAtuais} dia(s) seguidos. 🌱</p>
      )}

      <div className="flex gap-2">
        {progresso.ultimos7Dias.map((dia) => (
          <div
            key={dia.data}
            className={`h-10 w-10 rounded-full ${dia.completou ? 'bg-black' : 'bg-gray-200'}`}
            title={dia.data}
          />
        ))}
      </div>

      <p className="text-sm text-gray-600">
        Este resumo é só um retrato acolhedor da sua semana — ele não tira conclusões sobre o motivo
        dos seus dias serem como foram.
      </p>

      <a href="/checkin" className="block w-full rounded border p-3 text-center">
        Voltar ao início
      </a>
    </main>
  );
}
```

- [ ] **Step 2: Manual verification**

Complete two or three check-ins on different simulated days (you can backdate by editing `checkins.data` directly in Table Editor for test rows) and confirm `/progresso` shows the correct count and highlights the right days as filled circles.

- [ ] **Step 3: Commit**

```bash
git add src/app/progresso
git commit -m "feat: add 7-day progress screen with descriptive-only copy"
```

---

## Task 13: PWA manifest, icons, and installability

**Files:**
- Create: `public/manifest.json`
- Create: `public/icons/icon-192.png`, `public/icons/icon-512.png`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces: an installable PWA (manifest linked from root layout) with the app's icon and name, standalone display mode. No code interface — this task's deliverable is browser-verified installability.

- [ ] **Step 1: Create the manifest**

Create `public/manifest.json`:

```json
{
  "name": "Ritual Diário",
  "short_name": "Ritual",
  "description": "Um ritual diário de 5 minutos para autoestima, imagem corporal e relação com a comida.",
  "start_url": "/checkin",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 2: Add icon files**

Create `public/icons/icon-192.png` and `public/icons/icon-512.png` — any placeholder square PNG at those exact dimensions works for the beta (e.g., a solid-color square with a simple mark); final branding is not part of this MVP's functional scope.

- [ ] **Step 3: Link the manifest from the root layout**

Modify `src/app/layout.tsx` — add to the `metadata` export:

```ts
export const metadata: Metadata = {
  title: 'Ritual Diário',
  description: 'Um ritual diário de 5 minutos para autoestima, imagem corporal e relação com a comida.',
  manifest: '/manifest.json',
  themeColor: '#000000',
};
```

- [ ] **Step 4: Manual verification**

Run `npm run build && npm run start`. Open the app in Chrome on a phone (or Chrome DevTools device emulation) — confirm the "Install app" / "Add to Home Screen" prompt is available, and that installing it opens the app in standalone mode (no browser address bar) starting at `/checkin`. On an iPhone (Safari), confirm "Add to Home Screen" from the Share menu produces an icon that opens standalone.

- [ ] **Step 5: Commit**

```bash
git add public/manifest.json public/icons src/app/layout.tsx
git commit -m "feat: make the app an installable PWA"
```

---

## Task 14: Push notifications (subscribe + daily send) with in-app fallback

**Files:**
- Create: `public/sw.js`
- Create: `src/lib/push/subscribe.ts`
- Create: `src/app/api/push/subscribe/route.ts`
- Create: `src/app/api/push/send-due/route.ts`
- Create: `src/lib/push/timeWindow.ts`
- Test: `src/lib/push/timeWindow.test.ts`
- Create: `src/app/settings/page.tsx`
- Create: `src/app/settings/actions.ts`
- Create: `src/app/components/LembreteBanner.tsx`
- Modify: `src/app/checkin/page.tsx`
- Modify: `vercel.json`

**Interfaces:**
- Consumes: `createSupabaseServerClient` (Task 3), `PushSubscriptionRow`/`Perfil` types (Task 2), `formatDateISO` (Task 1).
- Produces: `estaNaJanelaDeEnvio(horarioPreferido: string, agora: Date): boolean` (pure, tested). `<LembreteBanner hasCheckedInToday: boolean />` consumed by the check-in page for devices without push.

- [ ] **Step 1: Generate VAPID keys and install `web-push`**

```bash
npm install web-push
npm install -D @types/web-push
npx web-push generate-vapid-keys
```

Copy the output into `.env.local`: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`. Generate a random string for `CRON_SECRET` (e.g. `openssl rand -hex 32`) and add it too. Add all three (blank) to `.env.local.example`.

- [ ] **Step 2: Write the failing test for the send-time window logic**

Create `src/lib/push/timeWindow.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { estaNaJanelaDeEnvio } from './timeWindow';

describe('estaNaJanelaDeEnvio', () => {
  it('retorna true quando o horário atual está dentro da mesma hora do horário preferido', () => {
    const agora = new Date(2026, 7, 10, 9, 45); // 09:45
    expect(estaNaJanelaDeEnvio('09:00:00', agora)).toBe(true);
  });

  it('retorna false quando o horário atual está fora da hora do horário preferido', () => {
    const agora = new Date(2026, 7, 10, 10, 5); // 10:05
    expect(estaNaJanelaDeEnvio('09:00:00', agora)).toBe(false);
  });

  it('retorna false quando não há horário preferido', () => {
    const agora = new Date(2026, 7, 10, 9, 5);
    expect(estaNaJanelaDeEnvio(null, agora)).toBe(false);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- src/lib/push/timeWindow.test.ts`
Expected: FAIL with "Cannot find module './timeWindow'"

- [ ] **Step 4: Implement the time-window check**

Create `src/lib/push/timeWindow.ts`:

```ts
export function estaNaJanelaDeEnvio(horarioPreferido: string | null, agora: Date): boolean {
  if (!horarioPreferido) return false;
  const [horaPreferida] = horarioPreferido.split(':').map(Number);
  return agora.getHours() === horaPreferida;
}
```

This matches by hour because the cron job (Step 9) runs hourly — that's the coarsest granularity Vercel Cron supports on the free tier, which is precise enough for a daily wellness reminder.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- src/lib/push/timeWindow.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 6: Write the service worker**

Create `public/sw.js`:

```js
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Ritual Diário', {
      body: data.body || 'Seu momento de cuidado de hoje está te esperando.',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/checkin'));
});
```

- [ ] **Step 7: Write the browser-side subscribe helper**

Create `src/lib/push/subscribe.ts`:

```ts
export async function inscreverPush(): Promise<'inscrita' | 'nao_suportado' | 'negado'> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return 'nao_suportado';
  }

  const permissao = await Notification.requestPermission();
  if (permissao !== 'granted') {
    return 'negado';
  }

  const registration = await navigator.serviceWorker.register('/sw.js');
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  });

  const json = subscription.toJSON();
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: json.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
    }),
  });

  return 'inscrita';
}
```

- [ ] **Step 8: Write the subscribe API route**

Create `src/app/api/push/subscribe/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'not authenticated' }, { status: 401 });
  }

  const { endpoint, p256dh, auth } = await request.json();

  await supabase.from('push_subscriptions').upsert(
    { usuaria_id: user.id, endpoint, p256dh, auth },
    { onConflict: 'endpoint' }
  );

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 9: Write the cron-triggered send route**

Create `src/app/api/push/send-due/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { estaNaJanelaDeEnvio } from '@/lib/push/timeWindow';

webpush.setVapidDetails(
  'mailto:almeidaferreiraluisgustavo@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const agora = new Date();

  const { data: perfis } = await supabaseAdmin
    .from('perfis')
    .select('id, horario_preferido_notificacao')
    .not('horario_preferido_notificacao', 'is', null);

  const elegiveis = (perfis ?? []).filter((p) =>
    estaNaJanelaDeEnvio(p.horario_preferido_notificacao, agora)
  );

  let enviados = 0;
  for (const perfil of elegiveis) {
    const { data: subs } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .eq('usuaria_id', perfil.id);

    for (const sub of subs ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({
            title: 'Ritual Diário',
            body: 'Seu momento de cuidado de hoje está te esperando.',
          })
        );
        enviados++;
      } catch {
        // subscription expirada/inválida: ignora silenciosamente neste MVP
      }
    }
  }

  return NextResponse.json({ enviados });
}
```

- [ ] **Step 10: Configure Vercel Cron**

Create `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/push/send-due", "schedule": "0 * * * *" }
  ]
}
```

Note: this route also needs `CRON_SECRET` set in the Vercel project's environment variables (Task 18) — Vercel Cron automatically sends `Authorization: Bearer $CRON_SECRET` when that env var is configured.

- [ ] **Step 11: Write the settings page (notification time + opt-in)**

Create `src/app/settings/actions.ts`:

```ts
'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function salvarHorarioPreferido(horario: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('perfis')
    .update({ horario_preferido_notificacao: horario })
    .eq('id', user.id);
}
```

Create `src/app/settings/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { inscreverPush } from '@/lib/push/subscribe';
import { salvarHorarioPreferido } from './actions';

export default function SettingsPage() {
  const [horario, setHorario] = useState('09:00');
  const [status, setStatus] = useState<string | null>(null);

  async function handleAtivar() {
    const resultado = await inscreverPush();
    if (resultado === 'inscrita') {
      await salvarHorarioPreferido(horario);
      setStatus('Lembretes ativados!');
    } else if (resultado === 'negado') {
      setStatus('Permissão de notificação negada. Você ainda verá um lembrete visual no app.');
    } else {
      setStatus('Seu navegador não suporta notificações push. Você verá um lembrete visual no app.');
    }
  }

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Lembretes</h1>
      <label className="block">
        Horário preferido
        <input
          type="time"
          value={horario}
          onChange={(e) => setHorario(e.target.value)}
          className="mt-1 block w-full rounded border p-3"
        />
      </label>
      <button onClick={handleAtivar} className="w-full rounded bg-black p-3 text-white">
        Ativar lembretes
      </button>
      {status && <p>{status}</p>}
    </main>
  );
}
```

- [ ] **Step 12: Write the in-app fallback banner**

Create `src/app/components/LembreteBanner.tsx`:

```tsx
export default function LembreteBanner({ jaFezCheckinHoje }: { jaFezCheckinHoje: boolean }) {
  if (jaFezCheckinHoje) return null;

  return (
    <div className="rounded bg-yellow-100 p-3 text-sm">
      Você ainda não fez seu ritual hoje. Que tal 5 minutinhos agora? 🌿
    </div>
  );
}
```

Modify `src/app/checkin/page.tsx` to render it: convert the page to check for an existing check-in server-side and pass the result down, or — simplest, given the page is a Client Component — add a small server component wrapper. Add above the `export default function CheckinPage()`:

```tsx
import LembreteBanner from '@/app/components/LembreteBanner';
```

And inside the returned `<main>`, as the first child: `<LembreteBanner jaFezCheckinHoje={false} />` — replace the hardcoded `false` by lifting the check-in-exists lookup into a thin server component (`src/app/checkin/page.tsx` becomes a Server Component that fetches today's check-in via `createSupabaseServerClient` and either renders `<CheckinFormClient />` if none exists, or a "você já fez seu ritual hoje" message with the banner hidden). This mirrors the pattern already used in Task 11 (`page.tsx` server + `*Client.tsx` client).

- [ ] **Step 13: Manual verification**

Visit `/settings`, set a time within the current hour, click "Ativar lembretes", accept the browser permission prompt, confirm "Lembretes ativados!" and a new row in `push_subscriptions`. Manually call `GET /api/push/send-due` with header `Authorization: Bearer <your CRON_SECRET>` (e.g. via `curl` or Postman) and confirm a push notification appears. Then, in a browser/profile where you deny or skip push permission, confirm visiting `/checkin` before completing today's ritual shows the yellow `LembreteBanner`, and that it disappears after completing the check-in.

- [ ] **Step 14: Commit**

```bash
git add public/sw.js src/lib/push src/app/api/push src/app/settings src/app/components/LembreteBanner.tsx src/app/checkin vercel.json .env.local.example
git commit -m "feat: add push notifications with in-app fallback reminder"
```

---

## Task 15: Payment-intent screen

**Files:**
- Create: `src/app/premium/page.tsx`
- Create: `src/app/premium/actions.ts`

**Interfaces:**
- Consumes: `createSupabaseServerClient` (Task 3).
- Produces: writes a row to `intencao_pagamento` — no real transaction, per spec §10.

- [ ] **Step 1: Write the payment-intent Server Action**

Create `src/app/premium/actions.ts`:

```ts
'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function registrarIntencaoPagamento(planoEscolhido: string, precoHipotetico: number) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('intencao_pagamento').insert({
    usuaria_id: user.id,
    plano_escolhido: planoEscolhido,
    preco_hipotetico: precoHipotetico,
  });
}
```

- [ ] **Step 2: Write the payment-intent page**

Create `src/app/premium/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { registrarIntencaoPagamento } from './actions';

const OPCOES = [
  { id: 'mensal', label: 'Mensal', preco: 19.9 },
  { id: 'anual', label: 'Anual', preco: 149.9 },
  { id: 'nenhum', label: 'Não pagaria por isso agora', preco: 0 },
];

export default function PremiumPage() {
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  async function handleEscolher(id: string, preco: number) {
    setEscolhido(id);
    await registrarIntencaoPagamento(id, preco);
    setEnviado(true);
  }

  if (enviado) {
    return (
      <main className="mx-auto max-w-md space-y-4 p-6">
        <p>Obrigada! Isso nos ajuda a construir a versão completa do app.</p>
        <a href="/checkin" className="block w-full rounded border p-3 text-center">
          Voltar
        </a>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Versão Premium</h1>
      <p>
        Histórico completo, insights semanais, biblioteca completa de práticas e jornadas guiadas.
        Ainda não cobramos por isso — queremos entender se faria sentido para você.
      </p>
      <div className="space-y-3">
        {OPCOES.map((opcao) => (
          <button
            key={opcao.id}
            onClick={() => handleEscolher(opcao.id, opcao.preco)}
            className={`w-full rounded border p-3 text-left ${escolhido === opcao.id ? 'border-black' : ''}`}
          >
            {opcao.label} {opcao.preco > 0 && `— R$ ${opcao.preco.toFixed(2)}`}
          </button>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Manual verification**

Visit `/premium`, click each option in turn, confirm a new row appears in `intencao_pagamento` each time with the matching `plano_escolhido` and `preco_hipotetico`, and confirm the thank-you message replaces the options after a click.

- [ ] **Step 4: Commit**

```bash
git add src/app/premium
git commit -m "feat: add payment-intent screen (no real checkout)"
```

---

## Task 16: Privacy policy page + data-request contact channel

**Files:**
- Create: `src/app/privacidade/page.tsx`

**Interfaces:**
- None (static content page). Referenced by the onboarding page link (Task 8).

- [ ] **Step 1: Write the privacy policy page**

Create `src/app/privacidade/page.tsx`:

```tsx
export default function PrivacidadePage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Política de Privacidade e Termos de Uso</h1>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">O que coletamos</h2>
        <p>
          Coletamos seu e-mail para autenticação, e as respostas do seu check-in diário (humor,
          imagem corporal, relação com a comida, e um texto livre opcional). Esses são dados
          sensíveis de saúde nos termos da Lei Geral de Proteção de Dados (LGPD), e só os coletamos
          com seu consentimento explícito, dado no início do uso do app.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Como usamos e quem acessa</h2>
        <p>
          Seus dados individuais são usados para gerar sua recomendação diária e seu progresso
          pessoal. Por padrão, ninguém da nossa equipe visualiza dados ou respostas individuais de
          uma usuária específica. Qualquer acesso pontual só ocorre com finalidade definida,
          permissão explícita, e fica registrado internamente (quem acessou, quando, por quê). A
          psicóloga responsável pelo conteúdo do app recebe apenas dados agregados e anonimizados
          para avaliar o produto, nunca dados que identifiquem uma usuária específica.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">O texto livre do check-in</h2>
        <p>
          O campo opcional de texto livre não é analisado nem monitorado nesta versão do app — é
          apenas armazenado como parte do seu diário pessoal.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Retenção e exclusão</h2>
        <p>
          Seus dados são mantidos enquanto sua conta estiver ativa. Ao excluir sua conta, seus dados
          são apagados ou anonimizados em até 30 dias.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Seus direitos</h2>
        <p>
          Você pode solicitar a exportação ou exclusão dos seus dados a qualquer momento, e pode
          tirar qualquer dúvida sobre como seus dados são tratados, escrevendo para{' '}
          <a href="mailto:almeidaferreiraluisgustavo@gmail.com" className="underline">
            almeidaferreiraluisgustavo@gmail.com
          </a>
          . Respondemos pedidos em até alguns dias úteis.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">O que este app não é</h2>
        <p>
          Este app não é terapia, não faz diagnóstico e não substitui acompanhamento profissional de
          saúde física ou mental.
        </p>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Manual verification**

Visit `/privacidade` while logged out (it's in the middleware's public-route allowlist from Task 7) and confirm it renders without requiring login. Confirm the onboarding page's link (Task 8) navigates here correctly.

- [ ] **Step 3: Commit**

```bash
git add src/app/privacidade
git commit -m "feat: add privacy policy page with data-request contact channel"
```

---

## Task 17: Administrative access logging (service-role-only)

**Files:**
- Create: `scripts/registrar-acesso.ts`
- Create: `docs/superpowers/specs/processo-acesso-administrativo.md`

**Interfaces:**
- Consumes: `Database` type (Task 2). Uses `SUPABASE_SERVICE_ROLE_KEY` directly — this script is run manually by the founder/psychologist from a local machine, never exposed as an app API route, since `acessos_administrativos` intentionally has no RLS policy granting client access (Task 2).

- [ ] **Step 1: Document the manual access process**

Create `docs/superpowers/specs/processo-acesso-administrativo.md`:

```markdown
# Processo de acesso administrativo a dados individuais

Por padrão, ninguém acessa dados ou flags de uma usuária individual (spec de design, seção 9).
Quando um acesso pontual for estritamente necessário (ex: investigar um bug relatado por uma
usuária específica, atender a um pedido de exportação/exclusão de dados dela):

1. Defina o motivo do acesso por escrito antes de acessar.
2. Rode `npx tsx scripts/registrar-acesso.ts <usuaria_id> "<seu email>" "<motivo>"` — isso grava
   o registro em `acessos_administrativos` **antes** de qualquer consulta aos dados dela.
3. Só então consulte os dados necessários no Supabase Studio, usando o mínimo necessário para
   resolver a finalidade descrita no motivo.
```

- [ ] **Step 2: Write the access-logging script**

```bash
npm install -D tsx
```

Create `scripts/registrar-acesso.ts`:

```ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/lib/supabase/types';

async function main() {
  const [usuariaId, acessadoPor, motivo] = process.argv.slice(2);

  if (!usuariaId || !acessadoPor || !motivo) {
    console.error('Uso: npx tsx scripts/registrar-acesso.ts <usuaria_id> "<seu email>" "<motivo>"');
    process.exit(1);
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase
    .from('acessos_administrativos')
    .insert({ usuaria_id: usuariaId, acessado_por: acessadoPor, motivo });

  if (error) {
    console.error('Falha ao registrar acesso:', error.message);
    process.exit(1);
  }

  console.log('Acesso registrado.');
}

main();
```

- [ ] **Step 3: Manual verification**

With `SUPABASE_SERVICE_ROLE_KEY` filled in `.env.local` (from Supabase Dashboard → Project Settings → API — keep this key out of git, it already lives only in `.env.local`), run:

```bash
npx tsx --env-file=.env.local scripts/registrar-acesso.ts <um-usuaria-id-de-teste> "almeidaferreiraluisgustavo@gmail.com" "teste do processo de acesso administrativo"
```

Confirm a row appears in `acessos_administrativos` in Table Editor. Then, using the **anon key** (not service role) in a quick Supabase JS snippet or the API docs "Run" button in Studio, confirm attempting to `select * from acessos_administrativos` as an authenticated user fails/returns empty, proving no RLS policy grants client access.

- [ ] **Step 4: Commit**

```bash
git add scripts/registrar-acesso.ts docs/superpowers/specs/processo-acesso-administrativo.md
git commit -m "feat: add service-role-only administrative access logging script"
```

---

## Task 18: Deploy to Vercel

**Files:**
- Create: `.gitignore` entries (verify `.env.local` already excluded — it is, by default Next.js scaffold)
- No new application files — this task is deployment configuration.

- [ ] **Step 1: Push the repository to a remote**

If not already done, create a GitHub repository and push:

```bash
git remote add origin <url-do-seu-repositorio>
git push -u origin master
```

(Only run this after confirming with the user which remote/account to use — do not guess a repository URL.)

- [ ] **Step 2: Import the project in Vercel**

In the Vercel dashboard, import the GitHub repository. Framework preset should auto-detect Next.js.

- [ ] **Step 3: Configure environment variables in Vercel**

In the Vercel project's Settings → Environment Variables, add every key from `.env.local.example` with the real values: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `CRON_SECRET`, and `NEXT_PUBLIC_SITE_URL` (set to the production URL Vercel assigns, e.g. `https://ritual-diario.vercel.app`).

- [ ] **Step 4: Update Supabase auth redirect allowlist**

In Supabase Dashboard → Authentication → URL Configuration, add the production URL's `/auth/callback` path to the allowed redirect URLs (alongside the existing `localhost:3000` one used in development).

- [ ] **Step 5: Deploy and verify**

Trigger a deploy (push to `master`, or "Deploy" in the Vercel dashboard). Once live, manually verify the whole flow on the production URL: login → onboarding consent → check-in → practice or safety screen → progress → settings (push) → premium (payment intent) → privacidade. Confirm the Vercel Cron job appears under the project's Cron Jobs tab.

- [ ] **Step 6: Commit (if any config files changed)**

```bash
git add -A
git commit -m "chore: configure production deployment on Vercel"
```

---

## Self-review notes

- **Spec coverage:** every numbered section of `docs/superpowers/specs/2026-08-10-ritual-diario-mvp-design.md` maps to at least one task — §4 flow → Tasks 9-12; §5 data model → Task 2; §6 safety → Tasks 5, 9, 10; §7 content curation → Tasks 2, 4; §8 notifications → Tasks 13-14; §9 privacy/LGPD → Tasks 2, 8, 16, 17; §10 monetization → Task 15; §11 stack → Tasks 1-3, 13-14, 18; §12 metrics → derivable directly from `checkins`/`sessoes`/`intencao_pagamento` tables populated by Tasks 9, 11, 15 via SQL queries in Supabase Studio (no separate analytics pipeline needed, per YAGNI).
- **Deferred by explicit spec decision, not oversight:** email reminder fallback, alternative practice option, real checkout — all listed in spec §3 "fora de escopo" and correspondingly absent here.
- **Type consistency checked:** `CheckinAnswers.textoLivre` (Task 9) added as an amendment to the Task 5 interface, called out explicitly rather than silently assumed. `Recomendacao`/`avaliarCheckin` signature used identically in Tasks 5 and 9. `Pratica`/`Sessao`/`Perfil` field names used identically across Tasks 2, 9, 11, 12, 14, 15.
