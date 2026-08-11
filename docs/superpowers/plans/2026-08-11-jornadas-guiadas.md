# Jornadas Guiadas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar programas guiados de múltiplos dias ("jornadas") que substituem a prática recomendada do dia enquanto a usuária estiver com uma jornada ativa, com progresso rastreado por conclusão (não por calendário).

**Architecture:** Três tabelas novas (`jornadas`, `jornada_atividades`, `jornadas_usuarias`) e uma alteração em `sessoes` (existente). Três funções puras testáveis centralizam as decisões (progresso, roteamento do check-in, troca de jornada), seguindo o mesmo padrão já usado no MVP (`avaliarCheckin`, `calcularProgresso7Dias`). Duas telas novas (`/jornadas`, `/jornada-atividade/[id]`) e uma modificação pontual em `submeterCheckin`.

**Tech Stack:** Next.js 16 (App Router) + TypeScript, Supabase (Postgres + RLS), Vitest — mesma stack do MVP, sem dependências novas.

## Global Constraints

- Idioma: português do Brasil em toda a interface e conteúdo.
- Terminologia obrigatória: "sinal de segurança" / "necessidade de apoio" — nunca "diagnóstico" ou "detecção clínica".
- Sinal de segurança sempre tem prioridade sobre a atividade da jornada — quando disparado, a usuária vai para `/seguranca` e o dia da jornada **não é consumido** (nada foi concluído).
- Uma jornada ativa por usuária por vez, garantido também a nível de banco (índice único parcial em `jornadas_usuarias`), não só na lógica do app.
- Progresso de jornada avança **por conclusão, não por calendário** — "dia N" é a N-ésima atividade completada, não importa quantos dias de calendário passaram. Nunca gerar mensagem do tipo "você perdeu sua sequência".
- `jornadas` e `jornada_atividades` são conteúdo curado pela psicóloga (status rascunho/revisada/publicada, mesmo padrão de `praticas`) — só leitura pelo app; nenhum grant de escrita para `authenticated`.
- Nenhum bloqueio free/premium neste sub-projeto — todo conteúdo com `status = 'publicada'` é acessível a qualquer usuária autenticada, mesmo padrão do restante do app durante o beta.
- Nenhuma variação de conteúdo por intensidade/estado emocional — a atividade do dia é sempre o conteúdo fixo escrito pela psicóloga.

---

## Task 1: Migração do banco — jornadas, jornada_atividades, jornadas_usuarias, alteração em sessoes

**Files:**
- Create: `supabase/migrations/0003_jornadas.sql`

**Interfaces:**
- Produces: tabelas `jornadas`, `jornada_atividades`, `jornadas_usuarias`; colunas novas `sessoes.jornada_atividade_id` (nullable) e `sessoes.pratica_id` agora nullable; constraint `sessoes_checkin_unico` (unique em `checkin_id`). Consumido por todas as tarefas seguintes.

- [ ] **Step 1: Escrever a migração**

Create `supabase/migrations/0003_jornadas.sql`:

```sql
-- Jornadas guiadas (programas progressivos, curados pela psicóloga)
create table public.jornadas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text not null,
  duracao_dias smallint not null check (duracao_dias between 7 and 21),
  status text not null default 'rascunho' check (status in ('rascunho', 'revisada', 'publicada')),
  criado_em timestamptz not null default now()
);

alter table public.jornadas enable row level security;

create policy "qualquer usuaria autenticada le jornadas publicadas"
  on public.jornadas for select
  using (auth.role() = 'authenticated' and status = 'publicada');

-- Atividades de cada dia de uma jornada
create table public.jornada_atividades (
  id uuid primary key default gen_random_uuid(),
  jornada_id uuid not null references public.jornadas(id) on delete cascade,
  numero_dia smallint not null,
  titulo text not null,
  conteudo text not null,
  criado_em timestamptz not null default now(),
  unique (jornada_id, numero_dia)
);

alter table public.jornada_atividades enable row level security;

create policy "qualquer usuaria autenticada le atividades de jornadas publicadas"
  on public.jornada_atividades for select
  using (
    auth.role() = 'authenticated'
    and exists (
      select 1 from public.jornadas j
      where j.id = jornada_atividades.jornada_id
      and j.status = 'publicada'
    )
  );

-- Progresso de cada usuária em cada jornada que já começou
create table public.jornadas_usuarias (
  id uuid primary key default gen_random_uuid(),
  usuaria_id uuid not null references public.perfis(id) on delete cascade,
  jornada_id uuid not null references public.jornadas(id) on delete cascade,
  dias_completados smallint not null default 0,
  status text not null default 'em_andamento' check (status in ('em_andamento', 'pausada', 'concluida')),
  iniciada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now(),
  concluida_em timestamptz,
  unique (usuaria_id, jornada_id)
);

-- Só uma jornada "em_andamento" por usuária ao mesmo tempo, garantido pelo banco.
create unique index jornadas_usuarias_uma_ativa_por_usuaria
  on public.jornadas_usuarias (usuaria_id)
  where status = 'em_andamento';

alter table public.jornadas_usuarias enable row level security;

create policy "usuaria le proprio progresso de jornadas"
  on public.jornadas_usuarias for select
  using (auth.uid() = usuaria_id);

create policy "usuaria insere proprio progresso de jornadas"
  on public.jornadas_usuarias for insert
  with check (auth.uid() = usuaria_id);

create policy "usuaria atualiza proprio progresso de jornadas"
  on public.jornadas_usuarias for update
  using (auth.uid() = usuaria_id);

-- sessoes passa a aceitar atividades de jornada, não só práticas avulsas
alter table public.sessoes alter column pratica_id drop not null;
alter table public.sessoes add column jornada_atividade_id uuid references public.jornada_atividades(id);
alter table public.sessoes add constraint sessoes_uma_fonte_de_atividade
  check (
    (pratica_id is not null and jornada_atividade_id is null) or
    (pratica_id is null and jornada_atividade_id is not null)
  );

-- Garante idempotência: no máximo uma sessão por check-in, mesmo sob requisições
-- concorrentes (double-click, retry de rede). Fecha também uma race condition que
-- já existia no fluxo de prática avulsa.
alter table public.sessoes add constraint sessoes_checkin_unico unique (checkin_id);

-- Privilégios de tabela — RLS só restringe QUAIS linhas, não concede acesso à tabela em si.
grant select on public.jornadas to authenticated;
grant select on public.jornada_atividades to authenticated;
grant select, insert, update on public.jornadas_usuarias to authenticated;
```

- [ ] **Step 2: Rodar a migração no Supabase**

No Supabase Dashboard → SQL Editor, cole todo o conteúdo do arquivo e rode uma vez.

- [ ] **Step 3: Verificação manual**

No Table Editor, confirme que `jornadas`, `jornada_atividades` e `jornadas_usuarias` existem, com RLS "Enabled". Confirme que `sessoes` agora tem a coluna `jornada_atividade_id` e que `pratica_id` aceita null (ícone de "nullable" na coluna).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0003_jornadas.sql
git commit -m "feat: add jornadas guiadas schema (tables, RLS, grants, sessoes changes)"
```

---

## Task 2: Tipos TypeScript para jornadas

**Files:**
- Modify: `src/lib/supabase/types.ts`

**Interfaces:**
- Consumes: schema da Task 1.
- Produces: tipos `Jornada`, `JornadaAtividade`, `JornadaUsuaria`, `StatusJornada`, `StatusJornadaUsuaria`; `Sessao.pratica_id` passa a `string | null`; novo `Sessao.jornada_atividade_id: string | null`. Consumido por todas as tarefas seguintes.

- [ ] **Step 1: Adicionar os novos tipos**

Em `src/lib/supabase/types.ts`, logo após `export type AcessoAdministrativo = {...}` (antes de `export interface Database`), adicione:

```ts
export type StatusJornada = 'rascunho' | 'revisada' | 'publicada';
export type StatusJornadaUsuaria = 'em_andamento' | 'pausada' | 'concluida';

export type Jornada = {
  id: string;
  titulo: string;
  descricao: string;
  duracao_dias: number;
  status: StatusJornada;
  criado_em: string;
};

export type JornadaAtividade = {
  id: string;
  jornada_id: string;
  numero_dia: number;
  titulo: string;
  conteudo: string;
  criado_em: string;
};

export type JornadaUsuaria = {
  id: string;
  usuaria_id: string;
  jornada_id: string;
  dias_completados: number;
  status: StatusJornadaUsuaria;
  iniciada_em: string;
  atualizada_em: string;
  concluida_em: string | null;
};
```

- [ ] **Step 2: Atualizar o tipo `Sessao`**

Substitua a definição atual de `Sessao`:

```ts
export type Sessao = {
  id: string;
  checkin_id: string;
  usuaria_id: string;
  pratica_id: string;
  sensacao_antes: number | null;
  sensacao_depois: number | null;
  criado_em: string;
};
```

por:

```ts
export type Sessao = {
  id: string;
  checkin_id: string;
  usuaria_id: string;
  pratica_id: string | null;
  jornada_atividade_id: string | null;
  sensacao_antes: number | null;
  sensacao_depois: number | null;
  criado_em: string;
};
```

- [ ] **Step 3: Atualizar `Database.public.Tables`**

Substitua a entrada de `sessoes`:

```ts
sessoes: { Row: Sessao; Insert: Omit<Sessao, 'id' | 'criado_em'>; Update: Partial<Sessao>; Relationships: [] };
```

por (idêntica — `Omit<Sessao, 'id' | 'criado_em'>` já reflete os dois campos opcionais automaticamente, já que `Sessao` mudou):

```ts
sessoes: { Row: Sessao; Insert: Omit<Sessao, 'id' | 'criado_em'>; Update: Partial<Sessao>; Relationships: [] };
```

Depois da entrada `acessos_administrativos`, adicione três novas entradas:

```ts
jornadas: { Row: Jornada; Insert: Partial<Jornada>; Update: Partial<Jornada>; Relationships: [] };
jornada_atividades: { Row: JornadaAtividade; Insert: Omit<JornadaAtividade, 'id' | 'criado_em'>; Update: Partial<JornadaAtividade>; Relationships: [] };
jornadas_usuarias: {
  Row: JornadaUsuaria;
  Insert: Pick<JornadaUsuaria, 'usuaria_id' | 'jornada_id'> & Partial<Omit<JornadaUsuaria, 'usuaria_id' | 'jornada_id'>>;
  Update: Partial<JornadaUsuaria>;
  Relationships: [];
};
```

- [ ] **Step 4: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: sem erros (o `Sessao.pratica_id` agora nullable pode gerar um erro em `src/app/pratica/[id]/actions.ts` se algo assumir que é sempre string — se aparecer, é esperado e será corrigido na Task 7; se não aparecer nenhum erro, siga em frente).

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase/types.ts
git commit -m "feat: add TypeScript types for jornadas guiadas"
```

---

## Task 3: Seed de conteúdo de teste

**Files:**
- Create: `supabase/seed_jornadas.sql`

**Interfaces:**
- Consumes: schema da Task 1.
- Produces: uma jornada de teste completa (7 dias) com `status = 'publicada'`, para exercitar o fluxo de ponta a ponta durante o desenvolvimento. Conteúdo é placeholder — precisa de revisão da psicóloga antes de virar conteúdo real (mesmo aviso já usado em `supabase/seed.sql`).

- [ ] **Step 1: Escrever o seed**

Create `supabase/seed_jornadas.sql`:

```sql
-- Jornada de exemplo para desenvolvimento e teste de ponta a ponta.
-- Conteúdo placeholder: precisa de revisão da psicóloga parceira antes de virar
-- conteúdo real, igual ao restante do conteúdo em supabase/seed.sql.

insert into public.jornadas (id, titulo, descricao, duracao_dias, status) values
  ('11111111-1111-1111-1111-111111111111', 'Reconstruindo minha autoestima', 'Uma jornada de 7 dias para fortalecer sua relação consigo mesma.', 7, 'rascunho');

insert into public.jornada_atividades (jornada_id, numero_dia, titulo, conteudo) values
  ('11111111-1111-1111-1111-111111111111', 1, 'Dia 1: Um começo gentil', 'Hoje, escreva três coisas simples que seu corpo fez por você essa semana.'),
  ('11111111-1111-1111-1111-111111111111', 2, 'Dia 2: Sem comparação', 'Note uma vez hoje em que você se comparou com alguém, e substitua o pensamento por algo gentil sobre si mesma.'),
  ('11111111-1111-1111-1111-111111111111', 3, 'Dia 3: O espelho', 'Olhe no espelho por 30 segundos sem julgamento — apenas observe, sem comentar.'),
  ('11111111-1111-1111-1111-111111111111', 4, 'Dia 4: Respiração e pausa', 'Respire fundo 5 vezes, contando até 4 na inspiração e até 6 na expiração.'),
  ('11111111-1111-1111-1111-111111111111', 5, 'Dia 5: Uma carta pra você', 'Escreva uma frase curta que você gostaria de ouvir de alguém que te ama.'),
  ('11111111-1111-1111-1111-111111111111', 6, 'Dia 6: Pequena vitória', 'Lembre de algo que você conseguiu fazer essa semana, por menor que pareça.'),
  ('11111111-1111-1111-1111-111111111111', 7, 'Dia 7: Fechando com cuidado', 'Reflita sobre como foi essa semana e escreva uma coisa que quer continuar praticando.');

-- Publica a jornada de teste para uso em desenvolvimento — em produção real, só
-- publicar depois da revisão da psicóloga (mesmo padrão do UPDATE em seed.sql).
update public.jornadas set status = 'publicada' where id = '11111111-1111-1111-1111-111111111111';
```

- [ ] **Step 2: Rodar o seed no Supabase**

No Supabase Dashboard → SQL Editor, cole o conteúdo e rode uma vez.

- [ ] **Step 3: Verificação manual**

No Table Editor, confirme 1 linha em `jornadas` (status `publicada`) e 7 linhas em `jornada_atividades` para essa jornada, `numero_dia` de 1 a 7.

- [ ] **Step 4: Commit**

```bash
git add supabase/seed_jornadas.sql
git commit -m "feat: add seed content for a test jornada"
```

---

## Task 4: Lógica pura — cálculo de progresso da jornada

**Files:**
- Create: `src/lib/jornadas/progresso.ts`
- Test: `src/lib/jornadas/progresso.test.ts`

**Interfaces:**
- Produces: `calcularProgressoJornada(diasCompletados: number, duracaoDias: number): { novoDiasCompletados: number; jornadaConcluida: boolean }`. Consumido pela Task 9.

- [ ] **Step 1: Escrever o teste que falha**

Create `src/lib/jornadas/progresso.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { calcularProgressoJornada } from './progresso';

describe('calcularProgressoJornada', () => {
  it('incrementa um dia no meio da jornada sem concluir', () => {
    const resultado = calcularProgressoJornada(2, 7);
    expect(resultado).toEqual({ novoDiasCompletados: 3, jornadaConcluida: false });
  });

  it('conclui a jornada ao completar o último dia', () => {
    const resultado = calcularProgressoJornada(6, 7);
    expect(resultado).toEqual({ novoDiasCompletados: 7, jornadaConcluida: true });
  });

  it('não ultrapassa a duração mesmo se chamada de novo com o valor já no máximo (idempotência)', () => {
    const resultado = calcularProgressoJornada(7, 7);
    expect(resultado).toEqual({ novoDiasCompletados: 7, jornadaConcluida: true });
  });

  it('funciona igual para uma jornada de 21 dias', () => {
    const resultado = calcularProgressoJornada(20, 21);
    expect(resultado).toEqual({ novoDiasCompletados: 21, jornadaConcluida: true });
  });
});
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

Run: `npm run test -- src/lib/jornadas/progresso.test.ts`
Expected: FAIL com "Cannot find module './progresso'"

- [ ] **Step 3: Implementar**

Create `src/lib/jornadas/progresso.ts`:

```ts
export function calcularProgressoJornada(
  diasCompletados: number,
  duracaoDias: number
): { novoDiasCompletados: number; jornadaConcluida: boolean } {
  const novoDiasCompletados = Math.min(diasCompletados + 1, duracaoDias);
  return {
    novoDiasCompletados,
    jornadaConcluida: novoDiasCompletados >= duracaoDias,
  };
}
```

- [ ] **Step 4: Rodar o teste para confirmar que passa**

Run: `npm run test -- src/lib/jornadas/progresso.test.ts`
Expected: PASS (4 testes)

- [ ] **Step 5: Commit**

```bash
git add src/lib/jornadas/progresso.ts src/lib/jornadas/progresso.test.ts
git commit -m "feat: add pure journey progress calculation"
```

---

## Task 5: Lógica pura — roteamento do check-in

**Files:**
- Create: `src/lib/checkin/roteamento.ts`
- Test: `src/lib/checkin/roteamento.test.ts`

**Interfaces:**
- Consumes: `Recomendacao` de `src/lib/checkin/recommend.ts` (Task 5 do MVP original).
- Produces: `decidirProximaEtapaCheckin(params): { tipo: 'seguranca' } | { tipo: 'jornada' } | { tipo: 'pratica' }`. Consumido pela Task 10.

- [ ] **Step 1: Escrever o teste que falha**

Create `src/lib/checkin/roteamento.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { decidirProximaEtapaCheckin } from './roteamento';
import type { Recomendacao } from './recommend';

describe('decidirProximaEtapaCheckin', () => {
  const recomendacaoSeguranca: Recomendacao = { tipo: 'sinal_seguranca' };
  const recomendacaoPratica: Recomendacao = { tipo: 'pratica', categoria: 'humor_baixo' };

  it('sinal de segurança tem prioridade mesmo com jornada ativa e atividade disponível', () => {
    const resultado = decidirProximaEtapaCheckin({
      recomendacao: recomendacaoSeguranca,
      jornadaAtiva: { jornadaId: 'j1', diasCompletados: 2 },
      atividadeDoDiaExiste: true,
    });
    expect(resultado).toEqual({ tipo: 'seguranca' });
  });

  it('jornada ativa com atividade disponível vence a prática recomendada', () => {
    const resultado = decidirProximaEtapaCheckin({
      recomendacao: recomendacaoPratica,
      jornadaAtiva: { jornadaId: 'j1', diasCompletados: 2 },
      atividadeDoDiaExiste: true,
    });
    expect(resultado).toEqual({ tipo: 'jornada' });
  });

  it('jornada ativa sem atividade cadastrada para o dia cai para a prática recomendada', () => {
    const resultado = decidirProximaEtapaCheckin({
      recomendacao: recomendacaoPratica,
      jornadaAtiva: { jornadaId: 'j1', diasCompletados: 2 },
      atividadeDoDiaExiste: false,
    });
    expect(resultado).toEqual({ tipo: 'pratica' });
  });

  it('sem jornada ativa, comportamento é a prática recomendada, igual ao fluxo original', () => {
    const resultado = decidirProximaEtapaCheckin({
      recomendacao: recomendacaoPratica,
      jornadaAtiva: null,
      atividadeDoDiaExiste: false,
    });
    expect(resultado).toEqual({ tipo: 'pratica' });
  });
});
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

Run: `npm run test -- src/lib/checkin/roteamento.test.ts`
Expected: FAIL com "Cannot find module './roteamento'"

- [ ] **Step 3: Implementar**

Create `src/lib/checkin/roteamento.ts`:

```ts
import type { Recomendacao } from './recommend';

export function decidirProximaEtapaCheckin(params: {
  recomendacao: Recomendacao;
  jornadaAtiva: { jornadaId: string; diasCompletados: number } | null;
  atividadeDoDiaExiste: boolean;
}): { tipo: 'seguranca' } | { tipo: 'jornada' } | { tipo: 'pratica' } {
  if (params.recomendacao.tipo === 'sinal_seguranca') {
    return { tipo: 'seguranca' };
  }

  if (params.jornadaAtiva && params.atividadeDoDiaExiste) {
    return { tipo: 'jornada' };
  }

  return { tipo: 'pratica' };
}
```

- [ ] **Step 4: Rodar o teste para confirmar que passa**

Run: `npm run test -- src/lib/checkin/roteamento.test.ts`
Expected: PASS (4 testes)

- [ ] **Step 5: Commit**

```bash
git add src/lib/checkin/roteamento.ts src/lib/checkin/roteamento.test.ts
git commit -m "feat: add pure check-in routing decision (safety > journey > practice)"
```

---

## Task 6: Lógica pura — troca de jornada ativa

**Files:**
- Create: `src/lib/jornadas/troca.ts`
- Test: `src/lib/jornadas/troca.test.ts`

**Interfaces:**
- Produces: `decidirTrocaDeJornada(params): { pausar: { id: string } | null; ativar: { id: string; diasCompletados: number } | 'criar_nova' }`. Consumido pela Task 8.

- [ ] **Step 1: Escrever o teste que falha**

Create `src/lib/jornadas/troca.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { decidirTrocaDeJornada } from './troca';

describe('decidirTrocaDeJornada', () => {
  it('primeira jornada da usuária: sem jornada ativa anterior, cria uma nova', () => {
    const resultado = decidirTrocaDeJornada({
      jornadaAtivaAtual: null,
      jornadaAlvoId: 'jornada-a',
      progressoExistenteNoAlvo: null,
    });
    expect(resultado).toEqual({ pausar: null, ativar: 'criar_nova' });
  });

  it('trocar de uma jornada ativa para outra nunca iniciada: pausa a atual e cria a nova', () => {
    const resultado = decidirTrocaDeJornada({
      jornadaAtivaAtual: { id: 'progresso-a', jornadaId: 'jornada-a' },
      jornadaAlvoId: 'jornada-b',
      progressoExistenteNoAlvo: null,
    });
    expect(resultado).toEqual({ pausar: { id: 'progresso-a' }, ativar: 'criar_nova' });
  });

  it('retomar uma jornada pausada anteriormente: pausa a atual e reativa preservando o progresso salvo', () => {
    const resultado = decidirTrocaDeJornada({
      jornadaAtivaAtual: { id: 'progresso-a', jornadaId: 'jornada-a' },
      jornadaAlvoId: 'jornada-b',
      progressoExistenteNoAlvo: { id: 'progresso-b', diasCompletados: 4 },
    });
    expect(resultado).toEqual({
      pausar: { id: 'progresso-a' },
      ativar: { id: 'progresso-b', diasCompletados: 4 },
    });
  });

  it('clicar em continuar na jornada já ativa não pausa nada', () => {
    const resultado = decidirTrocaDeJornada({
      jornadaAtivaAtual: { id: 'progresso-a', jornadaId: 'jornada-a' },
      jornadaAlvoId: 'jornada-a',
      progressoExistenteNoAlvo: { id: 'progresso-a', diasCompletados: 4 },
    });
    expect(resultado).toEqual({
      pausar: null,
      ativar: { id: 'progresso-a', diasCompletados: 4 },
    });
  });
});
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

Run: `npm run test -- src/lib/jornadas/troca.test.ts`
Expected: FAIL com "Cannot find module './troca'"

- [ ] **Step 3: Implementar**

Create `src/lib/jornadas/troca.ts`:

```ts
export function decidirTrocaDeJornada(params: {
  jornadaAtivaAtual: { id: string; jornadaId: string } | null;
  jornadaAlvoId: string;
  progressoExistenteNoAlvo: { id: string; diasCompletados: number } | null;
}): {
  pausar: { id: string } | null;
  ativar: { id: string; diasCompletados: number } | 'criar_nova';
} {
  const pausar =
    params.jornadaAtivaAtual && params.jornadaAtivaAtual.jornadaId !== params.jornadaAlvoId
      ? { id: params.jornadaAtivaAtual.id }
      : null;

  const ativar = params.progressoExistenteNoAlvo
    ? { id: params.progressoExistenteNoAlvo.id, diasCompletados: params.progressoExistenteNoAlvo.diasCompletados }
    : ('criar_nova' as const);

  return { pausar, ativar };
}
```

- [ ] **Step 4: Rodar o teste para confirmar que passa**

Run: `npm run test -- src/lib/jornadas/troca.test.ts`
Expected: PASS (4 testes)

- [ ] **Step 5: Commit**

```bash
git add src/lib/jornadas/troca.ts src/lib/jornadas/troca.test.ts
git commit -m "feat: add pure active-journey-switch decision logic"
```

---

## Task 7: Componente compartilhado de antes/depois

**Files:**
- Create: `src/app/components/AntesDepoisAtividade.tsx`
- Modify: `src/app/pratica/[id]/PraticaClient.tsx`
- Modify: `src/app/pratica/[id]/actions.ts`

**Interfaces:**
- Produces: `<AntesDepoisAtividade titulo={string} conteudo={string} aoFinalizar={(sensacaoAntes: number, sensacaoDepois: number) => Promise<void>} />`. Consumido por `PraticaClient` (nesta task) e pela Task 9.

- [ ] **Step 1: Extrair o componente compartilhado**

Create `src/app/components/AntesDepoisAtividade.tsx`:

```tsx
'use client';

import { useState } from 'react';

const ESCALA = [1, 2, 3, 4, 5];

export default function AntesDepoisAtividade({
  titulo,
  conteudo,
  aoFinalizar,
}: {
  titulo: string;
  conteudo: string;
  aoFinalizar: (sensacaoAntes: number, sensacaoDepois: number) => Promise<void>;
}) {
  const [etapa, setEtapa] = useState<'antes' | 'atividade' | 'depois'>('antes');
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
          onClick={() => setEtapa('atividade')}
          className="w-full rounded bg-black p-3 text-white disabled:opacity-40"
        >
          Continuar
        </button>
      </main>
    );
  }

  if (etapa === 'atividade') {
    return (
      <main className="mx-auto max-w-md space-y-6 p-6">
        <h1 className="text-2xl font-semibold">{titulo}</h1>
        <p className="whitespace-pre-line">{conteudo}</p>
        <button
          onClick={() => setEtapa('depois')}
          className="w-full rounded bg-black p-3 text-white"
        >
          Concluí a atividade
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
          await aoFinalizar(sensacaoAntes!, sensacaoDepois!);
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

- [ ] **Step 2: Refatorar `PraticaClient` para usar o componente compartilhado**

Substitua todo o conteúdo de `src/app/pratica/[id]/PraticaClient.tsx` por:

```tsx
'use client';

import { registrarSessao } from './actions';
import AntesDepoisAtividade from '@/app/components/AntesDepoisAtividade';
import type { Pratica } from '@/lib/supabase/types';

export default function PraticaClient({
  pratica,
  checkinId,
}: {
  pratica: Pratica;
  checkinId: string;
}) {
  return (
    <AntesDepoisAtividade
      titulo={pratica.titulo}
      conteudo={pratica.conteudo}
      aoFinalizar={(sensacaoAntes, sensacaoDepois) =>
        registrarSessao({
          checkinId,
          praticaId: pratica.id,
          sensacaoAntes,
          sensacaoDepois,
        })
      }
    />
  );
}
```

- [ ] **Step 3: Atualizar `registrarSessao` para a nova forma de `sessoes`**

A Task 2 tornou `Sessao.jornada_atividade_id` um campo sempre presente (nullable) no tipo, então o `Insert` derivado (`Omit<Sessao, 'id' | 'criado_em'>`) agora exige essa chave em todo `.insert()` em `sessoes` — mesmo que o valor seja `null`. Sem este passo, `src/app/pratica/[id]/actions.ts` não compila mais.

Em `src/app/pratica/[id]/actions.ts`, no `.insert({...})` dentro de `registrarSessao`, adicione a linha `jornada_atividade_id: null,`:

```ts
  await supabase.from('sessoes').insert({
    checkin_id: params.checkinId,
    usuaria_id: user.id,
    pratica_id: params.praticaId,
    jornada_atividade_id: null,
    sensacao_antes: params.sensacaoAntes,
    sensacao_depois: params.sensacaoDepois,
  });
```

- [ ] **Step 4: Verificar que compila e não quebrou nada**

Run: `npx tsc --noEmit && npx eslint . && npm run test`
Expected: sem erros de tipo, sem erros de lint, todos os testes existentes continuam passando (o comportamento da tela de prática não mudou, só a estrutura interna e a forma explícita do insert).

- [ ] **Step 5: Commit**

```bash
git add src/app/components/AntesDepoisAtividade.tsx src/app/pratica/[id]/PraticaClient.tsx src/app/pratica/[id]/actions.ts
git commit -m "refactor: extract shared before/after activity component from PraticaClient"
```

---

## Task 8: Tela `/jornadas` — listar, começar e trocar de jornada

**Files:**
- Create: `src/app/jornadas/page.tsx`
- Create: `src/app/jornadas/AtivarJornadaButton.tsx`
- Create: `src/app/jornadas/actions.ts`

**Interfaces:**
- Consumes: `createSupabaseServerClient` (existente), `decidirTrocaDeJornada` (Task 6), tipos `Jornada`/`JornadaUsuaria` (Task 2).
- Produces: rota `/jornadas` — ponto de entrada manual para escolher/trocar de jornada, referenciado pela navegação futura (fora de escopo aqui: ainda não há link para essa tela em nenhuma outra página; acessível diretamente pela URL nesta fase, igual às outras telas do app antes de uma tela inicial existir).

- [ ] **Step 1: Escrever a Server Action de ativação**

Create `src/app/jornadas/actions.ts`:

```ts
'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { decidirTrocaDeJornada } from '@/lib/jornadas/troca';

export async function ativarJornada(jornadaAlvoId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: jornadaAtivaAtual } = await supabase
    .from('jornadas_usuarias')
    .select('id, jornada_id')
    .eq('usuaria_id', user.id)
    .eq('status', 'em_andamento')
    .maybeSingle();

  const { data: progressoExistenteNoAlvo } = await supabase
    .from('jornadas_usuarias')
    .select('id, dias_completados')
    .eq('usuaria_id', user.id)
    .eq('jornada_id', jornadaAlvoId)
    .maybeSingle();

  const decisao = decidirTrocaDeJornada({
    jornadaAtivaAtual: jornadaAtivaAtual
      ? { id: jornadaAtivaAtual.id, jornadaId: jornadaAtivaAtual.jornada_id }
      : null,
    jornadaAlvoId,
    progressoExistenteNoAlvo: progressoExistenteNoAlvo
      ? { id: progressoExistenteNoAlvo.id, diasCompletados: progressoExistenteNoAlvo.dias_completados }
      : null,
  });

  if (decisao.pausar) {
    await supabase
      .from('jornadas_usuarias')
      .update({ status: 'pausada' })
      .eq('id', decisao.pausar.id);
  }

  if (decisao.ativar === 'criar_nova') {
    await supabase.from('jornadas_usuarias').insert({
      usuaria_id: user.id,
      jornada_id: jornadaAlvoId,
      status: 'em_andamento',
    });
  } else {
    await supabase
      .from('jornadas_usuarias')
      .update({ status: 'em_andamento' })
      .eq('id', decisao.ativar.id);
  }

  redirect('/jornadas');
}
```

- [ ] **Step 2: Escrever o botão cliente**

Create `src/app/jornadas/AtivarJornadaButton.tsx`:

```tsx
'use client';

import { ativarJornada } from './actions';

export default function AtivarJornadaButton({
  jornadaId,
  jaAtiva,
  label,
}: {
  jornadaId: string;
  jaAtiva: boolean;
  label: string;
}) {
  if (jaAtiva) {
    return (
      <button disabled className="w-full rounded border border-black p-3 text-center opacity-60">
        Jornada atual
      </button>
    );
  }

  return (
    <button
      onClick={() => ativarJornada(jornadaId)}
      className="w-full rounded bg-black p-3 text-white"
    >
      {label}
    </button>
  );
}
```

- [ ] **Step 3: Escrever a tela de listagem**

Create `src/app/jornadas/page.tsx`:

```tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import AtivarJornadaButton from './AtivarJornadaButton';

export default async function JornadasPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: jornadas } = await supabase
    .from('jornadas')
    .select('*')
    .eq('status', 'publicada');

  const { data: progressos } = await supabase
    .from('jornadas_usuarias')
    .select('*')
    .eq('usuaria_id', user!.id);

  const progressoPorJornada = new Map((progressos ?? []).map((p) => [p.jornada_id, p]));

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Jornadas</h1>
      {(jornadas ?? []).map((jornada) => {
        const progresso = progressoPorJornada.get(jornada.id);
        return (
          <div key={jornada.id} className="space-y-2 rounded border p-4">
            <h2 className="text-xl font-semibold">{jornada.titulo}</h2>
            <p>{jornada.descricao}</p>
            <p className="text-sm text-gray-600">
              {progresso?.status === 'em_andamento' &&
                `Em andamento — dia ${progresso.dias_completados} de ${jornada.duracao_dias}`}
              {progresso?.status === 'pausada' &&
                `Pausada — dia ${progresso.dias_completados} de ${jornada.duracao_dias}`}
              {progresso?.status === 'concluida' && 'Concluída'}
              {!progresso && `${jornada.duracao_dias} dias`}
            </p>
            <AtivarJornadaButton
              jornadaId={jornada.id}
              jaAtiva={progresso?.status === 'em_andamento'}
              label={progresso ? 'Continuar' : 'Começar'}
            />
          </div>
        );
      })}
    </main>
  );
}
```

- [ ] **Step 4: Verificação manual**

Rode `npm run dev`, visite `/jornadas` logada. Confirme que a jornada de teste (Task 3) aparece com "Começar". Clique — confirme redirecionamento de volta pra `/jornadas` com o botão agora mostrando "Jornada atual" (desabilitado) e o texto "Em andamento — dia 0 de 7". Confirme no Table Editor que uma linha foi criada em `jornadas_usuarias` com `status = 'em_andamento'`.

- [ ] **Step 5: Commit**

```bash
git add src/app/jornadas
git commit -m "feat: add jornadas list screen with start/switch"
```

---

## Task 9: Tela `/jornada-atividade/[id]` — atividade guiada e registro de sessão

**Files:**
- Create: `src/app/jornada-atividade/[id]/page.tsx`
- Create: `src/app/jornada-atividade/[id]/JornadaAtividadeClient.tsx`
- Create: `src/app/jornada-atividade/[id]/actions.ts`

**Interfaces:**
- Consumes: `AntesDepoisAtividade` (Task 7), `calcularProgressoJornada` (Task 4), tipo `JornadaAtividade` (Task 2).
- Produces: rota `/jornada-atividade/[id]?checkin=...`, consumida pela Task 10.

- [ ] **Step 1: Escrever a Server Action de conclusão**

Create `src/app/jornada-atividade/[id]/actions.ts`:

```ts
'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { calcularProgressoJornada } from '@/lib/jornadas/progresso';

export async function registrarSessaoJornada(params: {
  checkinId: string;
  jornadaAtividadeId: string;
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

  const { error } = await supabase.from('sessoes').insert({
    checkin_id: params.checkinId,
    usuaria_id: user.id,
    pratica_id: null,
    jornada_atividade_id: params.jornadaAtividadeId,
    sensacao_antes: params.sensacaoAntes,
    sensacao_depois: params.sensacaoDepois,
  });

  // Se a inserção falhar (ex: constraint sessoes_checkin_unico por uma segunda
  // requisição concorrente pro mesmo check-in), não avança o progresso de novo —
  // essa sessão já foi registrada antes. Redireciona igual ao caminho de sucesso.
  if (error) {
    redirect('/progresso');
  }

  const { data: atividade } = await supabase
    .from('jornada_atividades')
    .select('jornada_id')
    .eq('id', params.jornadaAtividadeId)
    .single();

  if (!atividade) {
    redirect('/progresso');
  }

  const { data: jornada } = await supabase
    .from('jornadas')
    .select('duracao_dias')
    .eq('id', atividade.jornada_id)
    .single();

  const { data: progresso } = await supabase
    .from('jornadas_usuarias')
    .select('id, dias_completados')
    .eq('usuaria_id', user.id)
    .eq('jornada_id', atividade.jornada_id)
    .eq('status', 'em_andamento')
    .maybeSingle();

  if (jornada && progresso) {
    const { novoDiasCompletados, jornadaConcluida } = calcularProgressoJornada(
      progresso.dias_completados,
      jornada.duracao_dias
    );

    await supabase
      .from('jornadas_usuarias')
      .update({
        dias_completados: novoDiasCompletados,
        status: jornadaConcluida ? 'concluida' : 'em_andamento',
        concluida_em: jornadaConcluida ? new Date().toISOString() : null,
      })
      .eq('id', progresso.id);
  }

  redirect('/progresso');
}
```

- [ ] **Step 2: Escrever o componente cliente**

Create `src/app/jornada-atividade/[id]/JornadaAtividadeClient.tsx`:

```tsx
'use client';

import { registrarSessaoJornada } from './actions';
import AntesDepoisAtividade from '@/app/components/AntesDepoisAtividade';
import type { JornadaAtividade } from '@/lib/supabase/types';

export default function JornadaAtividadeClient({
  atividade,
  checkinId,
}: {
  atividade: JornadaAtividade;
  checkinId: string;
}) {
  return (
    <AntesDepoisAtividade
      titulo={atividade.titulo}
      conteudo={atividade.conteudo}
      aoFinalizar={(sensacaoAntes, sensacaoDepois) =>
        registrarSessaoJornada({
          checkinId,
          jornadaAtividadeId: atividade.id,
          sensacaoAntes,
          sensacaoDepois,
        })
      }
    />
  );
}
```

- [ ] **Step 3: Escrever a página servidora**

Create `src/app/jornada-atividade/[id]/page.tsx`:

```tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import JornadaAtividadeClient from './JornadaAtividadeClient';

export default async function JornadaAtividadePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ checkin?: string }>;
}) {
  const { id } = await params;
  const { checkin } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: atividade } = await supabase
    .from('jornada_atividades')
    .select('*')
    .eq('id', id)
    .single();

  if (!atividade || !checkin) {
    notFound();
  }

  return <JornadaAtividadeClient atividade={atividade} checkinId={checkin} />;
}
```

- [ ] **Step 4: Verificar que compila**

Run: `npx tsc --noEmit && npx eslint .`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/app/jornada-atividade
git commit -m "feat: add guided journey activity screen with progress tracking"
```

---

## Task 10: Integrar a decisão de roteamento no check-in

**Files:**
- Modify: `src/app/checkin/actions.ts`

**Interfaces:**
- Consumes: `decidirProximaEtapaCheckin` (Task 5), rota `/jornada-atividade/[id]` (Task 9).
- Produces: `submeterCheckin` agora roteia para a atividade da jornada ativa (quando existir e tiver conteúdo pro dia) em vez da prática recomendada.

- [ ] **Step 1: Modificar `submeterCheckin`**

Em `src/app/checkin/actions.ts`, substitua o bloco final da função (a partir de `if (recomendacao.tipo === 'sinal_seguranca')` até o fim), que hoje é:

```ts
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

por:

```ts
  if (recomendacao.tipo === 'sinal_seguranca') {
    redirect('/seguranca');
  }

  // A partir daqui, recomendacao.tipo é 'pratica'.

  const { data: jornadaAtivaRow } = await supabase
    .from('jornadas_usuarias')
    .select('id, jornada_id, dias_completados')
    .eq('usuaria_id', user.id)
    .eq('status', 'em_andamento')
    .maybeSingle();

  let atividadeDoDia: { id: string } | null = null;
  if (jornadaAtivaRow) {
    const { data } = await supabase
      .from('jornada_atividades')
      .select('id')
      .eq('jornada_id', jornadaAtivaRow.jornada_id)
      .eq('numero_dia', jornadaAtivaRow.dias_completados + 1)
      .maybeSingle();
    atividadeDoDia = data;
  }

  const etapa = decidirProximaEtapaCheckin({
    recomendacao,
    jornadaAtiva: jornadaAtivaRow
      ? { jornadaId: jornadaAtivaRow.jornada_id, diasCompletados: jornadaAtivaRow.dias_completados }
      : null,
    atividadeDoDiaExiste: atividadeDoDia !== null,
  });

  if (etapa.tipo === 'jornada') {
    redirect(`/jornada-atividade/${atividadeDoDia!.id}?checkin=${checkin.id}`);
  }

  if (recomendacao.tipo !== 'pratica') {
    throw new Error('Estado inesperado: rota de prática escolhida sem categoria de recomendação.');
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

E adicione o import no topo do arquivo, junto aos demais imports de `@/lib`:

```ts
import { decidirProximaEtapaCheckin } from '@/lib/checkin/roteamento';
```

- [ ] **Step 2: Verificar que compila e os testes existentes continuam passando**

Run: `npx tsc --noEmit && npx eslint . && npm run test`
Expected: sem erros; todos os testes (incluindo os novos das Tasks 4-6) passam.

- [ ] **Step 3: Verificação manual — sem jornada ativa (comportamento inalterado)**

Com uma usuária SEM jornada ativa, complete um check-in. Confirme que continua indo pra `/pratica/[id]` normalmente, igual antes desta mudança.

- [ ] **Step 4: Verificação manual — com jornada ativa**

Com a usuária que ativou a jornada de teste na Task 8 (dia 0 de 7), complete o check-in do dia (com respostas que não disparem sinal de segurança). Confirme que é redirecionada para `/jornada-atividade/[id]` mostrando "Dia 1: Um começo gentil" (não a prática recomendada pelas regras). Complete a atividade (antes → atividade → depois → Finalizar). Confirme redirecionamento pra `/progresso`, e no Table Editor confirme que `jornadas_usuarias.dias_completados` foi de 0 para 1, e que a sessão em `sessoes` tem `jornada_atividade_id` preenchido e `pratica_id` nulo.

- [ ] **Step 5: Verificação manual — sinal de segurança tem prioridade sobre a jornada**

Ainda com a jornada ativa, force um check-in que dispare sinal de segurança (respostas todas 1, conforme a regra semeada no MVP original). Confirme que vai para `/seguranca` normalmente, e que `jornadas_usuarias.dias_completados` **não** mudou (o dia da jornada não foi consumido).

- [ ] **Step 6: Commit**

```bash
git add src/app/checkin/actions.ts
git commit -m "feat: route check-in to active journey activity instead of recommended practice"
```

---
