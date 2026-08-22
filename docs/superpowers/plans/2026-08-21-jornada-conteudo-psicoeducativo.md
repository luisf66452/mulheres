# Conteúdo psicoeducativo completo das 4 Jornadas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder session generator in `src/lib/jornadas-conteudo` with real, scientifically-grounded psychoeducational content for all 83 sessions across the 4 journeys (Imagem corporal, Autocompaixão, Comparação, Alimentação emocional), and make every session openable and completable at `/jornadas/[slug]/[sessaoId]`, with real per-user progress and idempotent Pétalas rewards.

**Architecture:** `src/lib/jornadas-conteudo/dados.ts` becomes the single source of truth for content (no DB table for content — same pattern as other static-content areas of the app). A new `progresso.ts` reads/writes the existing `sessoes_jornadas_conteudo_progresso` table to compute per-user session/journey state at request time (never stored on the content objects). A new `[sessaoId]` route renders one session end-to-end and a server action marks it complete, granting Pétalas exactly once via the existing `conceder_petalas` RPC (service-role only, uuid `referencia_id` — bridged via a deterministic-hash helper since session ids are text).

**Tech Stack:** Next.js (App Router, async dynamic route params — see `AGENTS.md`), TypeScript, Vitest, Supabase (Postgres + RLS + RPC), Tailwind (existing Rose visual system — do not redesign).

## Global Constraints

- Target only `src/app/jornadas/**` and `src/lib/jornadas-conteudo/**` (+ the 3 known consumers: `src/app/components/jornadas/CartaoJornada.tsx`, `src/app/jornadas/page.tsx`, `src/app/jornadas/[slug]/page.tsx`, plus `src/app/components/jornadas/EstadoSessaoIcone.tsx` if it needs an `em_andamento` state). Do NOT touch `jornada_atividades`, `jornada_respostas_modulo`, `src/lib/jornadas-modulos`, notifications, illustrations unrelated to jornadas, or any other subsystem.
- Do NOT create a new migration. The table `sessoes_jornadas_conteudo_progresso` already exists at `supabase/migrations/20260818220822_sessoes_jornadas_conteudo_progresso.sql` with columns `id uuid pk, usuaria_id uuid fk, jornada_slug text, sessao_id text, iniciada_em timestamptz default now(), concluida_em timestamptz, unique(usuaria_id, sessao_id)`, RLS scoped to `auth.uid() = usuaria_id`. Use it as-is.
- Exact counts required and must be asserted by tests: 4 journeys, 26 modules, 83 sessions — 24 (imagem-corporal), 21 (autocompaixao), 18 (comparacao), 20 (alimentacao-emocional).
- Every session: id, real specific title, short description, `duracaoMinutos` 5–8 (prefer 5–6), content type, "Entenda em 1 minuto", original plain-language explanation, guided practice with 3–5 steps, optional reflection, "Leve com você" closing, ≥1 directly relevant scientific reference, collapsible "Base científica", safety warning when the topic is sensitive, `revisaoStatus: 'pendente'` always — never set `revisadoPor`/`revisadoEm`.
- Text must be original — do not copy paragraphs from the cited papers.
- Forbidden everywhere: promising cure/guaranteed results, "comprovado"/"garantido"/universal claims. Use graduated language ("o estudo encontrou", "está associado", "há evidência inicial", "pode ajudar algumas pessoas").
- Forbidden in Alimentação emocional specifically: calories, weight, BMI, weigh-ins, fasting, compensation/exercise-to-burn-food, "good/bad/clean/dirty food" language, nutrition plans. Sessions touching loss-of-control, restriction, vomiting, laxatives, fainting, or compensation need an explicit professional-help safety notice; add guidance to seek a trusted adult + professional for minors with persistent signs.
- Forbidden in Imagem corporal specifically: mandatory mirror-checking, body photographing/measuring/body-checking (any body observation must be optional, short, with a no-mirror alternative); calling an image "fake" (frame it as a curated/edited snapshot instead); presenting body neutrality as proven treatment (frame as a practical stance, not a validated intervention); demonizing social media; promising lasting effects from a 7-day break (short-term benefit only); using "90 seconds" as a neurobiological rule (if a ~90s pause appears, describe it only as a practical chosen duration, not physiology).
- Forbidden in Autocompaixão specifically: claiming culpa is always useful or vergonha is always harmful (state general tendencies + individual variation); equating self-compassion with agreeing with everything / avoiding responsibility / dropping goals; promising a kind phrase eliminates intense emotion; perfectionism experiments must be small and safe — never academic/professional/medical/financial risk.
- Forbidden in Comparação specifically: teaching that comparison can be eliminated entirely; treating authenticity as an obligation to reveal everything regardless of safety/context; treating validation-seeking itself as pathological (only rigid/repetitive/incapacitating patterns are the concern); grandiose or fabricated self-affirmations (qualities practice must ask for concrete evidence); presenting observational associations as causal.
- PAN (pensamento automático negativo) registry, wherever used, follows exactly 5 steps in this order and no more: situação concreta → reação física/corporal → sentimento/emoção → pensamento automático negativo → pensamento racional alternativo. No mandatory distortion classification, no behavior field.
- Every reference entry needs: título, autores/instituição, link, resumo simples, qual conteúdo sustenta, limitações. Distinguish clinical trial / brief experimental study / observational study / systematic review / meta-analysis / clinical guideline, and never claim a 5-minute session equals an 8–11 week clinical program.
- No fabricated progress data for real users, no rewriting/deleting existing user responses, nothing marked as psychologist-reviewed, no logging of psychological/emotional/eating/personal-data content (never `console.log`/analytics the session content of reflections).
- `npm test` (vitest), `npm run lint` (eslint), `npx tsc --noEmit` must all stay green after every task. No `typecheck` npm script exists — use `npx tsc --noEmit` directly.
- Do not merge to `master`, do not deploy. Work stays on `jornada-estruturada-modulos-psicoeducativos`. One clean commit at the end covering only files in scope.

---

## Reference material (read-only, already fetched into local git objects)

Two unmerged commits on `origin/experiencia-completa` contain a prior attempt at this exact content and route. They also contain unrelated changes (push notifications, illustrations, unrelated migrations) — **do not merge/cherry-pick them**. Retrieve individual files as a *starting draft* with `git show f091705:<path>` (fall back to `git show 6dc0927:<path>` if a file is missing at f091705), then hand-adapt per this plan's Global Constraints and per-task instructions below. Relevant files at f091705:

```
src/lib/jornadas-conteudo/dados.ts            (1569 lines — bulk content, THE starting draft)
src/lib/jornadas-conteudo/dados.test.ts       (142 lines)
src/lib/jornadas-conteudo/idPetalas.ts
src/lib/jornadas-conteudo/idPetalas.test.ts
src/lib/jornadas-conteudo/progresso.ts        (146 lines)
src/lib/jornadas-conteudo/progresso.test.ts   (33 lines)
src/lib/jornadas-conteudo/referencias.ts      (89 lines — DO NOT reuse citations as-is, see Task 1)
src/app/jornadas/[slug]/[sessaoId]/page.tsx
src/app/jornadas/[slug]/[sessaoId]/SessaoClient.tsx
src/app/jornadas/[slug]/[sessaoId]/SessaoClient.test.tsx
src/app/jornadas/[slug]/[sessaoId]/actions.ts
src/app/jornadas/[slug]/[sessaoId]/BaseCientifica.tsx
src/app/jornadas/[slug]/page.tsx
src/app/jornadas/page.tsx
```

Known scientific-accuracy check already run against this draft (documented in `.tmp-research-jornadas.md` at repo root, since deleted from working tree but its findings are folded into this plan): no violations found of the forbidden-claims list, BUT its `referencias.ts` citations were never verified against real PubMed/NICE records — **Task 1 replaces them with citations built directly from the exact URLs the user specified**, which is the safer source of truth.

---

### Task 1: Verified scientific references (`referencias.ts`)

**Files:**
- Create: `src/lib/jornadas-conteudo/referencias.ts`
- Test: `src/lib/jornadas-conteudo/referencias.test.ts`

**Interfaces:**
- Produces: `export type IdReferenciaCientifica = 'IC1'|'IC2'|...` (prefix per journey: `IC` imagem corporal, `AC` autocompaixão, `CO` comparação, `AL` alimentação emocional, numbered per journey in the order the user listed them) — `export interface ReferenciaCientifica { id: IdReferenciaCientifica; titulo: string; autoresOuInstituicao: string; link: string; resumoSimples: string; sustenta: string; limitacoes: string; tipoEstudo: 'ensaio clínico' | 'estudo experimental breve' | 'estudo observacional' | 'revisão sistemática' | 'meta-análise' | 'diretriz clínica'; }` — `export const REFERENCIAS: Record<IdReferenciaCientifica, ReferenciaCientifica>` — `export function buscarReferencia(id: IdReferenciaCientifica): ReferenciaCientifica`.

- [ ] **Step 1: Fetch and record every user-specified source**

The 30 URLs to fetch, grouped by journey (use these exact URLs — do not substitute):

**Imagem corporal (9):**
1. Funcionalidade corporal: https://pubmed.ncbi.nlm.nih.gov/26280376/
2. Replicação do programa de funcionalidade: https://pubmed.ncbi.nlm.nih.gov/29522927/
3. Comparação e imagens idealizadas no Instagram: https://pubmed.ncbi.nlm.nih.gov/30036748/
4. Fitspiration no TikTok e comparação: https://pubmed.ncbi.nlm.nih.gov/36194987/
5. Alfabetização midiática: https://pubmed.ncbi.nlm.nih.gov/34962632/
6. Pausa de uma semana das redes: https://pubmed.ncbi.nlm.nih.gov/38692094/
7. Autocompaixão e sofrimento corporal: https://pubmed.ncbi.nlm.nih.gov/27664531/
8. Escrita autocompassiva para jovens mulheres: https://pubmed.ncbi.nlm.nih.gov/40203687/
9. Evidência inicial sobre conteúdo de neutralidade corporal: https://pubmed.ncbi.nlm.nih.gov/40557133/

**Autocompaixão (7):**
1. Modelo e revisão de autocompaixão: https://pubmed.ncbi.nlm.nih.gov/35961039/
2. Meta-análise sobre redução da autocrítica: https://pubmed.ncbi.nlm.nih.gov/33749936/
3. Ensaio do Mindful Self-Compassion: https://pubmed.ncbi.nlm.nih.gov/23070875/
4. Intervenção on-line para autocrítica: https://pubmed.ncbi.nlm.nih.gov/30824257/
5. CBT on-line para perfeccionismo: https://pubmed.ncbi.nlm.nih.gov/38483057/
6. Evidência experimental sobre nomeação emocional: https://pubmed.ncbi.nlm.nih.gov/17576282/
7. Carta autocompassiva para vergonha: https://pubmed.ncbi.nlm.nih.gov/37090852/

**Comparação (7):**
1. Intervenção digital sobre comparação social: https://pubmed.ncbi.nlm.nih.gov/37115607/
2. Meta-análise sobre comparação on-line e imagem corporal: https://pubmed.ncbi.nlm.nih.gov/39721448/
3. Comparação e busca de feedback nas redes: https://pubmed.ncbi.nlm.nih.gov/25899879/
4. Busca excessiva de reafirmação: https://pubmed.ncbi.nlm.nih.gov/31430610/
5. Autenticidade, satisfação e sofrimento em estudo longitudinal: https://pubmed.ncbi.nlm.nih.gov/25019552/
6. Intervenção de forças pessoais: https://pubmed.ncbi.nlm.nih.gov/16045394/
7. ACT e ação baseada em valores: https://pubmed.ncbi.nlm.nih.gov/25547522/

**Alimentação emocional (8):**
1. Ensaio brasileiro sobre dissonância e alimentação intuitiva: https://pubmed.ncbi.nlm.nih.gov/34143404/
2. Desenvolvimento brasileiro mais recente: https://pubmed.ncbi.nlm.nih.gov/42259168/
3. Ensaio brasileiro de alimentação consciente: https://pubmed.ncbi.nlm.nih.gov/40091515/
4. Emoções antes e depois de episódios de compulsão: https://pubmed.ncbi.nlm.nih.gov/40768884/
5. Jejum e risco posterior de compulsão/patologia bulímica: https://pubmed.ncbi.nlm.nih.gov/19025239/
6. Revisão de mindfulness para alimentação emocional e compulsão: https://pubmed.ncbi.nlm.nih.gov/24854804/
7. NICE NG69: https://www.nice.org.uk/guidance/ng69
8. Diretriz da American Psychiatric Association: https://psychiatryonline.org/doi/10.1176/appi.ajp.23180001

For each URL above, use `WebFetch` on the URL. Extract: real title, real authors/institution, and (from the abstract) a plain-language summary in Portuguese written from scratch (not copied). Classify `tipoEstudo` honestly from the abstract (e.g. an RCT is `'ensaio clínico'`, a single-session lab study is `'estudo experimental breve'`, a cross-sectional survey is `'estudo observacional'`, PRISMA/Cochrane-style is `'revisão sistemática'` or `'meta-análise'`, NICE/APA guidance is `'diretriz clínica'`). Write down `limitacoes` honestly (sample size, self-report, correlational design, short follow-up, WEIRD sample, etc. — whatever applies from the abstract). If any URL 404s or the record doesn't match what the task spec claims it's about, stop and flag it in your task output rather than fabricating a substitute — do not invent a citation.

- [ ] **Step 2: Write `referencias.ts`**

One `ReferenciaCientifica` entry per fetched source, `sustenta` field naming the specific concept/practice it backs (e.g. "prática de notar 3 funções do corpo sem avaliar aparência" for the functionality-focus source), written specifically enough that Task 3's sessions can point `fontesCientificas` at exactly the right id.

- [ ] **Step 3: Write `referencias.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { REFERENCIAS } from './referencias';

describe('REFERENCIAS', () => {
  it('every entry has all required fields non-empty', () => {
    Object.values(REFERENCIAS).forEach((ref) => {
      expect(ref.titulo.length).toBeGreaterThan(0);
      expect(ref.autoresOuInstituicao.length).toBeGreaterThan(0);
      expect(ref.link).toMatch(/^https:\/\//);
      expect(ref.resumoSimples.length).toBeGreaterThan(20);
      expect(ref.sustenta.length).toBeGreaterThan(0);
      expect(ref.limitacoes.length).toBeGreaterThan(10);
    });
  });

  it('has at least 30 entries covering all 4 journeys worth of sources', () => {
    expect(Object.keys(REFERENCIAS).length).toBeGreaterThanOrEqual(30);
  });

  it('no entry claims certainty language', () => {
    const proibidas = /\bcomprovad|garantid|\bcura\b|vai reduzir/i;
    Object.values(REFERENCIAS).forEach((ref) => {
      expect(ref.resumoSimples).not.toMatch(proibidas);
    });
  });
});
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/jornadas-conteudo/referencias.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/jornadas-conteudo/referencias.ts src/lib/jornadas-conteudo/referencias.test.ts
git commit -m "feat(jornadas-conteudo): fontes científicas verificadas para as 4 jornadas"
```

---

### Task 2: Type redesign (`tipos.ts`)

**Files:**
- Modify: `src/lib/jornadas-conteudo/tipos.ts`

**Interfaces:**
- Consumes: `IdReferenciaCientifica` from Task 1's `referencias.ts`.
- Produces the shape every later task depends on:

```ts
export type TipoConteudoSessao = 'reflexao' | 'escrita' | 'exercicio' | 'plano';

export interface Sessao {
  id: string;
  titulo: string;
  descricaoCurta: string;
  duracaoMinutos: number; // 5-8
  tipo: TipoConteudoSessao;
  entendaEm1Minuto: string;
  praticaGuiada: string[]; // 3-5 steps
  reflexao?: string;
  leveComVoce: string;
  fontesCientificas: IdReferenciaCientifica[]; // length >= 1
  avisoSeguranca?: string;
  revisaoStatus: 'pendente' | 'revisado';
  revisadoPor?: string;
  revisadoEm?: string;
}

export interface Modulo {
  id: string;
  titulo: string;
  sessoes: Sessao[];
}

export type JornadaCorCartao = 'pessego' | 'creme-rosado' | 'lilas' | 'salvia';

export interface Jornada {
  id: string;
  slug: string;
  titulo: string;
  descricaoCurta: string;
  corCartao: JornadaCorCartao;
  modulos: Modulo[];
  // progressoPercentual removed — always computed per-user, never stored here
}

export type EstadoSessao = 'disponivel' | 'em_andamento' | 'concluida' | 'bloqueada';
```

- [ ] **Step 1: Rewrite `tipos.ts`**

Keep the file's existing top-of-file comment explaining this module is separate from `src/lib/jornadas-modulos` (do not delete that context comment). Replace the type bodies with the shape above, importing `IdReferenciaCientifica` from `./referencias`.

- [ ] **Step 2: Confirm it compiles in isolation**

Run: `npx tsc --noEmit`
Expected: New errors will appear in `dados.ts`, `CartaoJornada.tsx`, `src/app/jornadas/page.tsx`, `src/app/jornadas/[slug]/page.tsx` (all consumers of the old shape) — this is expected until Tasks 3, 5, 6 land. Confirm the errors are ONLY in those known files, nothing else, then proceed — do not leave this task half-done; the whole plan must compile again by Task 6.

- [ ] **Step 3: Commit**

```bash
git add src/lib/jornadas-conteudo/tipos.ts
git commit -m "refactor(jornadas-conteudo): tipos de Sessao/Jornada com conteudo psicoeducativo estruturado e progresso computado"
```

(This commit is intentionally part of a temporarily red tree — later tasks fix the remaining consumers. Do not run full `npm test`/`npm run lint` gates until Task 6 lands; only `tsc` targeted checks in Tasks 2-5.)

---

### Task 3: Content — `dados.ts` for all 83 sessions

**Files:**
- Modify: `src/lib/jornadas-conteudo/dados.ts` (full rewrite)
- Test: `src/lib/jornadas-conteudo/dados.test.ts`

**Interfaces:**
- Consumes: `Sessao`, `Modulo`, `Jornada`, `JornadaCorCartao` from Task 2's `tipos.ts`; `IdReferenciaCientifica`, `buscarReferencia` from Task 1's `referencias.ts`.
- Produces (used by routes in Tasks 5 & 6): `export const JORNADAS: Jornada[]`, `export function listarJornadas(): Jornada[]`, `export function buscarJornadaPorSlug(slug: string): Jornada | undefined`, `export function buscarSessaoPorId(jornadaSlug: string, sessaoId: string): { sessao: Sessao; modulo: Modulo } | undefined`, `export function listarSessoesEmOrdem(jornada: Jornada): Sessao[]`, `export function contarModulos(jornada: Jornada): number`, `export function contarSessoes(jornada: Jornada): number`.

- [ ] **Step 1: Pull the starting draft**

Run: `git show f091705:src/lib/jornadas-conteudo/dados.ts > /tmp/dados-draft.ts` (or the platform equivalent path) — read it fully. This has 26 modules / 83 sessions already shaped close to the target, with plausible module/session breakdown per journey matching the counts in this plan's Global Constraints.

- [ ] **Step 2: Rewrite as the real `dados.ts`, session by session**

For every one of the 83 sessions, adapt the draft's content into the Task 2 `Sessao` shape, applying ALL of the following corrections as you go (do not batch-find-replace blindly — read each session's text and judge):

1. Retitle any session still generically named ("Sessão N") or copy-pasted structurally identical to a sibling — every title must be specific to its psychoeducational content (the draft already mostly does this; verify none slipped through).
2. Re-point every `fontesCientificas` entry at the Task-1 verified ids (`IC#`/`AC#`/`CO#`/`AL#`) instead of the draft's `E#` ids — match by topic, not by position.
3. Apply the per-journey correction list from Global Constraints above (re-check each session against the exact forbidden-claims/required-framing list for its journey — this is the scientific-accuracy gate for this task, do it explicitly, not just once at the end).
4. Any session with a ~90-second pause: reword to explicitly frame it as a chosen practical duration, never physiology ("escolhemos um tempo curto e determinado, não porque a emoção 'dura' esse tempo, mas para criar um espaço deliberado antes de agir").
5. Any body-observation step in Imagem corporal: make it explicitly optional and offer a no-mirror alternative in the same step.
6. Alimentação emocional: grep your own draft text for `calor|peso ideal|imc|emagrec|comida (boa|ruim|limpa|suja)|jejum` as you write each session and rephrase any hit; sessions on perda de controle / restrição / vômito / laxante / desmaio / compensação must carry `avisoSeguranca` pointing to professional help (+ trusted adult for minors).
7. Any PAN registry usage: exactly the 5 fields listed in Global Constraints, in that order, nothing added.
8. Keep `duracaoMinutos` in 5–8, prefer 5–6.
9. `revisaoStatus: 'pendente'` on every session; never set `revisadoPor`/`revisadoEm`.
10. Text must read as original phrasing — rewrite any sentence that reads too close to how a cited abstract would phrase it.

Module/session structure to match exactly (id prefixes: `imagem-corporal`, `autocompaixao`, `comparacao`, `alimentacao-emocional`; module ids `{slug}-m{n}`; session ids `{slug}-m{n}-s{n}`):

- **imagem-corporal** (24): m1 Relação com o próprio corpo (4), m2 Comparação da aparência (4), m3 Idealização do corpo perfeito (4), m4 Autocrítica e aceitação corporal (4), m5 Neutralidade corporal e autocompaixão (4), m6 Influência das redes sociais (4).
- **autocompaixao** (21): m1 Crítica interna (3), m2 Culpa (3), m3 Vergonha (3), m4 Gentileza consigo mesma (3), m5 Aceitação das imperfeições (3), m6 Regulação emocional (3), m7 Cuidado pessoal e voz interior acolhedora (3).
- **comparacao** (18): m1 Comparação social (3), m2 Redes sociais (3), m3 Sensação de não ser suficiente (3), m4 Insegurança e busca por validação (3), m5 Autenticidade (3), m6 Reconhecimento das próprias qualidades (3). The very first session of this journey (`comparacao-m1-s1`) must open with the exact construct definition from the task spec: "Comparação social é o processo de avaliar aspectos de si mesma usando outras pessoas como referência..." adapted into `entendaEm1Minuto`.
- **alimentacao-emocional** (20): m1 Fome física e fome emocional (3), m2 Emoções relacionadas à alimentação (3), m3 Culpa após comer (3), m4 Restrições alimentares (3), m5 Compulsão alimentar (3), m6 Relação mais consciente com a comida (3), m7 Gatilhos e autocuidado sem punição (2).

`corCartao` per journey (already established in the app): `imagem-corporal` → `pessego`, `autocompaixao` → `creme-rosado`, `comparacao` → `lilas`, `alimentacao-emocional` → `salvia`.

- [ ] **Step 3: Write the helper/export functions**

```ts
export function listarJornadas(): Jornada[] {
  return JORNADAS;
}

export function buscarJornadaPorSlug(slug: string): Jornada | undefined {
  return JORNADAS.find((j) => j.slug === slug);
}

export function listarSessoesEmOrdem(jornada: Jornada): Sessao[] {
  return jornada.modulos.flatMap((m) => m.sessoes);
}

export function buscarSessaoPorId(
  jornadaSlug: string,
  sessaoId: string
): { sessao: Sessao; modulo: Modulo } | undefined {
  const jornada = buscarJornadaPorSlug(jornadaSlug);
  if (!jornada) return undefined;
  for (const modulo of jornada.modulos) {
    const sessao = modulo.sessoes.find((s) => s.id === sessaoId);
    if (sessao) return { sessao, modulo };
  }
  return undefined;
}

export function contarModulos(jornada: Jornada): number {
  return jornada.modulos.length;
}

export function contarSessoes(jornada: Jornada): number {
  return jornada.modulos.reduce((total, m) => total + m.sessoes.length, 0);
}
```

- [ ] **Step 4: Write `dados.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { JORNADAS, contarModulos, contarSessoes, listarSessoesEmOrdem, buscarSessaoPorId } from './dados';
import { REFERENCIAS } from './referencias';

const PROIBIDAS_ALIMENTACAO =
  /\bcaloria|\bimc\b|\bpeso ideal\b|\bemagrec|comida (boa|ruim|limpa|suja)|\bjejum prolongado\b(?!.{0,60}(procure|profissional|orienta))/i;

describe('estrutura das jornadas', () => {
  it('tem exatamente 4 jornadas', () => {
    expect(JORNADAS).toHaveLength(4);
  });

  it('totais de módulos e sessões por jornada', () => {
    const esperado: Record<string, { modulos: number; sessoes: number }> = {
      'imagem-corporal': { modulos: 6, sessoes: 24 },
      autocompaixao: { modulos: 7, sessoes: 21 },
      comparacao: { modulos: 6, sessoes: 18 },
      'alimentacao-emocional': { modulos: 7, sessoes: 20 },
    };
    JORNADAS.forEach((j) => {
      expect(contarModulos(j)).toBe(esperado[j.slug].modulos);
      expect(contarSessoes(j)).toBe(esperado[j.slug].sessoes);
    });
  });

  it('26 módulos e 83 sessões no total', () => {
    const totalModulos = JORNADAS.reduce((t, j) => t + contarModulos(j), 0);
    const totalSessoes = JORNADAS.reduce((t, j) => t + contarSessoes(j), 0);
    expect(totalModulos).toBe(26);
    expect(totalSessoes).toBe(83);
  });

  it('todos os ids de sessão são únicos', () => {
    const ids = JORNADAS.flatMap((j) => listarSessoesEmOrdem(j).map((s) => s.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('nenhuma sessão tem título genérico "Sessão N"', () => {
    JORNADAS.forEach((j) =>
      listarSessoesEmOrdem(j).forEach((s) => {
        expect(s.titulo).not.toMatch(/^Sessão \d+$/);
      })
    );
  });

  it('nenhum campo obrigatório vazio ou placeholder', () => {
    JORNADAS.forEach((j) =>
      listarSessoesEmOrdem(j).forEach((s) => {
        expect(s.titulo.length).toBeGreaterThan(0);
        expect(s.descricaoCurta.length).toBeGreaterThan(0);
        expect(s.entendaEm1Minuto.length).toBeGreaterThan(0);
        expect(s.praticaGuiada.length).toBeGreaterThanOrEqual(3);
        expect(s.praticaGuiada.length).toBeLessThanOrEqual(5);
        expect(s.leveComVoce.length).toBeGreaterThan(0);
        expect(s.leveComVoce).not.toMatch(/Conteúdo a ser adicionado/i);
        expect(s.fontesCientificas.length).toBeGreaterThanOrEqual(1);
      })
    );
  });

  it('duração entre 5 e 8 minutos em todas as sessões', () => {
    JORNADAS.forEach((j) =>
      listarSessoesEmOrdem(j).forEach((s) => {
        expect(s.duracaoMinutos).toBeGreaterThanOrEqual(5);
        expect(s.duracaoMinutos).toBeLessThanOrEqual(8);
      })
    );
  });

  it('toda fonte citada existe em REFERENCIAS', () => {
    JORNADAS.forEach((j) =>
      listarSessoesEmOrdem(j).forEach((s) => {
        s.fontesCientificas.forEach((id) => {
          expect(REFERENCIAS[id]).toBeDefined();
        });
      })
    );
  });

  it('todas as sessões começam com revisão pendente e sem revisor', () => {
    JORNADAS.forEach((j) =>
      listarSessoesEmOrdem(j).forEach((s) => {
        expect(s.revisaoStatus).toBe('pendente');
        expect(s.revisadoPor).toBeUndefined();
        expect(s.revisadoEm).toBeUndefined();
      })
    );
  });

  it('nenhuma linguagem proibida de dieta/peso na jornada de alimentação emocional', () => {
    const jornada = JORNADAS.find((j) => j.slug === 'alimentacao-emocional')!;
    listarSessoesEmOrdem(jornada).forEach((s) => {
      const texto = [s.entendaEm1Minuto, ...s.praticaGuiada, s.reflexao ?? '', s.leveComVoce].join(' ');
      expect(texto).not.toMatch(PROIBIDAS_ALIMENTACAO);
    });
  });

  it('sessões sensíveis de alimentação emocional têm aviso de segurança', () => {
    const jornada = JORNADAS.find((j) => j.slug === 'alimentacao-emocional')!;
    const sensiveis = listarSessoesEmOrdem(jornada).filter((s) =>
      /perda de controle|restri(ç|c)ão|vômito|laxante|desmaio|compensa/i.test(
        [s.titulo, s.entendaEm1Minuto].join(' ')
      )
    );
    expect(sensiveis.length).toBeGreaterThan(0);
    sensiveis.forEach((s) => expect(s.avisoSeguranca).toBeTruthy());
  });

  it('buscarSessaoPorId encontra a primeira e a última sessão de cada jornada', () => {
    JORNADAS.forEach((j) => {
      const sessoes = listarSessoesEmOrdem(j);
      expect(buscarSessaoPorId(j.slug, sessoes[0].id)?.sessao.id).toBe(sessoes[0].id);
      expect(buscarSessaoPorId(j.slug, sessoes[sessoes.length - 1].id)?.sessao.id).toBe(
        sessoes[sessoes.length - 1].id
      );
    });
  });
});
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run src/lib/jornadas-conteudo/dados.test.ts`
Expected: PASS. Iterate on `dados.ts` content until every assertion passes — do not weaken the tests to make them pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/jornadas-conteudo/dados.ts src/lib/jornadas-conteudo/dados.test.ts
git commit -m "feat(jornadas-conteudo): conteudo psicoeducativo completo das 83 sessoes"
```

---

### Task 4: Progress tracking (`progresso.ts`, `idPetalas.ts`)

**Files:**
- Create: `src/lib/jornadas-conteudo/progresso.ts`
- Create: `src/lib/jornadas-conteudo/progresso.test.ts`
- Create: `src/lib/jornadas-conteudo/idPetalas.ts`
- Create: `src/lib/jornadas-conteudo/idPetalas.test.ts`

**Interfaces:**
- Consumes: `Jornada`, `Sessao`, `Modulo`, `EstadoSessao` from `./tipos`; `listarSessoesEmOrdem` from `./dados`; Supabase client type `SupabaseClient<Database>` from `@/lib/supabase/types`.
- Produces (used by Tasks 5 & 6):
  - `export async function carregarProgressoJornada(supabase: SupabaseClient<Database>, usuariaId: string, jornadaSlug: string): Promise<Record<string, { iniciadaEm: string; concluidaEm: string | null }>>` — one row per `sessao_id` the user has touched in that journey.
  - `export function calcularEstadosSessoes(jornada: Jornada, progresso: Record<string, { concluidaEm: string | null }>): Record<string, EstadoSessao>` — pure function: first session of the journey is always at least `'disponivel'`; a session is `'bloqueada'` unless every session before it (in module → session order) is `'concluida'`; `'em_andamento'` if it has a progress row with `concluidaEm: null`; `'concluida'` if `concluidaEm` is set; else `'disponivel'` when unblocked.
  - `export function calcularPercentualConcluido(jornada: Jornada, estados: Record<string, EstadoSessao>): number` — `Math.round(concluidas / total * 100)`.
  - `export async function registrarInicioSessao(supabase: SupabaseClient<Database>, usuariaId: string, jornadaSlug: string, sessaoId: string): Promise<void>` — upsert a row with `concluida_em: null` if none exists yet (idempotent no-op if a row already exists — do not touch `concluida_em` on an existing row).
  - `export async function registrarConclusaoSessao(supabase: SupabaseClient<Database>, usuariaId: string, jornadaSlug: string, sessaoId: string): Promise<{ concluidaAgora: boolean }>` — conditional `update ... set concluida_em = now() where usuaria_id = ? and sessao_id = ? and concluida_em is null` (upsert the row first if missing), then check whether the update actually affected a row (`(data?.length ?? 0) > 0`) — this is the exactly-once signal the caller uses to decide whether to grant Pétalas. Never grant based on an application-level "already checked earlier" flag; the DB round-trip's affected-row-count is the only safe idempotency signal under concurrent requests.
  - `idPetalas.ts`: `export function idPetalasParaSessao(sessaoId: string): string` — deterministic UUID v5-style hash (SHA-256 of a fixed namespace string + `sessaoId`, formatted as a UUID) so a stable text session id maps to a stable uuid, satisfying `transacoes_petalas.referencia_id uuid not null` and giving the DB unique constraint on `(usuaria_id, tipo_evento, referencia_id)` something to actually enforce per-session idempotency against (independent of the `concluida_em` check — belt and suspenders, since Task 5's action calls this only when `concluidaAgora` is true anyway).

- [ ] **Step 1: Pull the starting draft for reference**

Run: `git show f091705:src/lib/jornadas-conteudo/progresso.ts` and `git show f091705:src/lib/jornadas-conteudo/idPetalas.ts` — read both fully as a starting point, but rewrite table/column names to match the table that already exists at HEAD (`supabase/migrations/20260818220822_sessoes_jornadas_conteudo_progresso.sql` — table `sessoes_jornadas_conteudo_progresso`, columns `usuaria_id`, `jornada_slug`, `sessao_id`, `iniciada_em`, `concluida_em`) rather than the draft's possibly-different naming from its own (discarded) migration.

- [ ] **Step 2: Write `idPetalas.ts`**

```ts
import { createHash } from 'crypto';

const NAMESPACE = 'jornadas-conteudo-sessao';

export function idPetalasParaSessao(sessaoId: string): string {
  const hash = createHash('sha256').update(`${NAMESPACE}:${sessaoId}`).digest('hex');
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    '5' + hash.slice(13, 16), // versão 5 (nome-hash) — determinístico, não aleatório
    ((parseInt(hash.slice(16, 17), 16) & 0x3) | 0x8).toString(16) + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join('-');
}
```

- [ ] **Step 3: Write `idPetalas.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { idPetalasParaSessao } from './idPetalas';

describe('idPetalasParaSessao', () => {
  it('é determinístico para o mesmo id de sessão', () => {
    expect(idPetalasParaSessao('imagem-corporal-m1-s1')).toBe(idPetalasParaSessao('imagem-corporal-m1-s1'));
  });

  it('gera valores diferentes para sessões diferentes', () => {
    expect(idPetalasParaSessao('imagem-corporal-m1-s1')).not.toBe(idPetalasParaSessao('imagem-corporal-m1-s2'));
  });

  it('produz um uuid v4/v5 válido em formato', () => {
    expect(idPetalasParaSessao('comparacao-m1-s1')).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });
});
```

- [ ] **Step 4: Write `progresso.ts`**

Implement the 5 exports above. Use `.from('sessoes_jornadas_conteudo_progresso')`, `.upsert({...}, { onConflict: 'usuaria_id,sessao_id' })` for `registrarInicioSessao` (guard so it never clobbers an existing `concluida_em`: fetch-or-insert, or upsert with `ignoreDuplicates: true`), and the conditional-update pattern described above for `registrarConclusaoSessao`.

- [ ] **Step 5: Write `progresso.test.ts`** covering `calcularEstadosSessoes` and `calcularPercentualConcluido` as pure functions (no Supabase needed — build a small fixture `Jornada` with 2 modules × 2 sessions and assert: first session `disponivel` when no progress; session 2 `bloqueada` until session 1 `concluida`; percentual 0/25/50/75/100 as sessions complete).

- [ ] **Step 6: Run tests**

Run: `npx vitest run src/lib/jornadas-conteudo/progresso.test.ts src/lib/jornadas-conteudo/idPetalas.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/jornadas-conteudo/progresso.ts src/lib/jornadas-conteudo/progresso.test.ts src/lib/jornadas-conteudo/idPetalas.ts src/lib/jornadas-conteudo/idPetalas.test.ts
git commit -m "feat(jornadas-conteudo): progresso por usuaria e id deterministico para Petalas"
```

---

### Task 5: Session detail route (`/jornadas/[slug]/[sessaoId]`)

**Files:**
- Create: `src/app/jornadas/[slug]/[sessaoId]/page.tsx`
- Create: `src/app/jornadas/[slug]/[sessaoId]/SessaoClient.tsx`
- Create: `src/app/jornadas/[slug]/[sessaoId]/BaseCientifica.tsx`
- Create: `src/app/jornadas/[slug]/[sessaoId]/actions.ts`
- Test: `src/app/jornadas/[slug]/[sessaoId]/SessaoClient.test.tsx`

**Interfaces:**
- Consumes: `buscarJornadaPorSlug`, `buscarSessaoPorId`, `listarSessoesEmOrdem` (Task 3); `calcularEstadosSessoes`, `registrarInicioSessao`, `registrarConclusaoSessao` (Task 4); `idPetalasParaSessao` (Task 4); `buscarReferencia` (Task 1); `Sessao`, `Modulo`, `Jornada`, `EstadoSessao` (Task 2); `createSupabaseServerClient` (`@/lib/supabase/server`), `createSupabaseAdminClient` (`@/lib/supabase/admin`), `concederPetalas` (`@/lib/clube-rose/concederPetalas`), `VALORES_PETALAS.sessaoJornadaPrimeiraConclusao` (`@/lib/clube-rose/config` — already `15`, no change needed there).
- Produces: the route itself; `SessaoClient` accepts `{ sessao: Sessao; modulo: Modulo; jornadaSlug: string; jornadaTitulo: string; proximaSessaoHref: string | null; onConcluir: () => Promise<void> }`-shaped props (server action bound via `.bind()` from the page, per the existing `actions.ts` pattern in this repo, e.g. `src/app/pratica/[id]/actions.ts`).

- [ ] **Step 1: Pull the starting draft**

Run `git show f091705:src/app/jornadas/[slug]/[sessaoId]/page.tsx`, `.../SessaoClient.tsx`, `.../BaseCientifica.tsx`, `.../actions.ts`, `.../SessaoClient.test.tsx` and read fully — use as structural starting point.

- [ ] **Step 2: Write `page.tsx`** (server component)

Await `params: Promise<{ slug: string; sessaoId: string }>` (established async-params convention — see `src/app/jornadas/[slug]/page.tsx:24-29` for the exact pattern already in this codebase). Redirect to `/login` if unauthenticated (`createSupabaseServerClient().auth.getUser()`). `notFound()` if the slug or session id doesn't resolve via `buscarJornadaPorSlug`/`buscarSessaoPorId`. Load progress via `carregarProgressoJornada` + `calcularEstadosSessoes`; if this session's computed `EstadoSessao` is `'bloqueada'`, redirect back to `/jornadas/[slug]` (a locked session must not be openable directly by URL either — this is the "sessão bloqueada não pode ser iniciada" test requirement). Otherwise call `registrarInicioSessao` (fire-and-forget is not acceptable here — await it, but don't fail the page render if it errors; log server-side only, never log the session's psychoeducational content). Compute `proximaSessaoHref` from `listarSessoesEmOrdem` (next session's id, or `null` if this is the journey's last session — then the "leave"/"finish" action should route to `/jornadas/[slug]` instead). Render `<SessaoClient>` passing the resolved `sessao`, `modulo`, and the bound server action `concluirSessao.bind(null, jornada.slug, sessao.id)`.

- [ ] **Step 3: Write `actions.ts`**

```ts
'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { concederPetalas } from '@/lib/clube-rose/concederPetalas';
import { VALORES_PETALAS } from '@/lib/clube-rose/config';
import { registrarConclusaoSessao } from '@/lib/jornadas-conteudo/progresso';
import { idPetalasParaSessao } from '@/lib/jornadas-conteudo/idPetalas';

export async function concluirSessao(jornadaSlug: string, sessaoId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { concluidaAgora } = await registrarConclusaoSessao(supabase, user.id, jornadaSlug, sessaoId);

  if (concluidaAgora) {
    await concederPetalas(
      createSupabaseAdminClient(),
      user.id,
      'sessao_jornada_primeira_conclusao',
      idPetalasParaSessao(sessaoId),
      VALORES_PETALAS.sessaoJornadaPrimeiraConclusao
    );
  }
}
```

Note: conclusion must work whether or not the user answered any reflection — never require written input to complete (Global Constraints). No `redirect()` at the end of this action — the client component drives navigation (via `router.push` after the action resolves) so the same server action can be reused for "concluir" without forcing a fixed destination.

- [ ] **Step 4: Write `BaseCientifica.tsx`**

Collapsible (`<details>`/`<summary>` or existing disclosure pattern used elsewhere in the app — check `src/app/components/` for an existing `Colapsavel`/accordion component before building a new one) rendering, for each `IdReferenciaCientifica` in `sessao.fontesCientificas`, the referenced `ReferenciaCientifica`'s `titulo`, `autoresOuInstituicao` + `tipoEstudo`, `resumoSimples`, an `<a href={link} target="_blank" rel="noopener noreferrer">` to the source, and `limitacoes`. Must render title, summary, link, and limitations per the test requirements — assert this shape in Step 6.

- [ ] **Step 5: Write `SessaoClient.tsx`** (client component)

Progressive sections in this exact order (per task spec): título + duração → "Entenda em 1 minuto" → prática guiada passo a passo (numbered list) → reflexão (optional, rendered only if `sessao.reflexao` is set, clearly labeled optional, never a required form field) → "Leve com você" → `<BaseCientifica>` (collapsed by default) → `sessao.avisoSeguranca` if present (visually distinct, e.g. a bordered notice) → action row with two buttons: "Concluir sessão" (calls the bound server action, then navigates to `proximaSessaoHref ?? "/jornadas/{slug}"`) and "Sair" (plain `<Link>` back to `/jornadas/{slug}`, no confirmation dialog, no penalty — Global Constraint "permitir sair sem punição"). Preserve accessibility: semantic headings (`h1` for título, `h2` per section), keyboard-operable buttons/details, visible focus rings matching the rest of the app (see `CartaoJornada.tsx`'s `focus-visible:ring-2 focus-visible:ring-acao/60` pattern), no color-only signaling for the safety notice (use an icon + text label too).

- [ ] **Step 6: Write `SessaoClient.test.tsx`**

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SessaoClient from './SessaoClient';
import type { Sessao, Modulo } from '@/lib/jornadas-conteudo/tipos';

const sessaoBase: Sessao = {
  id: 'imagem-corporal-m1-s1',
  titulo: 'O que é imagem corporal',
  descricaoCurta: 'Diferença entre corpo e imagem corporal.',
  duracaoMinutos: 5,
  tipo: 'reflexao',
  entendaEm1Minuto: 'texto de exemplo',
  praticaGuiada: ['passo um', 'passo dois', 'passo três'],
  leveComVoce: 'frase final',
  fontesCientificas: [],
  revisaoStatus: 'pendente',
};

const modulo: Modulo = { id: 'imagem-corporal-m1', titulo: 'Relação com o próprio corpo', sessoes: [sessaoBase] };

describe('SessaoClient', () => {
  it('renderiza título, prática guiada e leve com você', () => {
    render(
      <SessaoClient
        sessao={sessaoBase}
        modulo={modulo}
        jornadaSlug="imagem-corporal"
        jornadaTitulo="Imagem corporal"
        proximaSessaoHref={null}
        onConcluir={async () => {}}
      />
    );
    expect(screen.getByRole('heading', { name: sessaoBase.titulo })).toBeInTheDocument();
    expect(screen.getByText('passo um')).toBeInTheDocument();
    expect(screen.getByText(sessaoBase.leveComVoce)).toBeInTheDocument();
  });

  it('não renderiza seção de reflexão quando ausente', () => {
    render(
      <SessaoClient
        sessao={sessaoBase}
        modulo={modulo}
        jornadaSlug="imagem-corporal"
        jornadaTitulo="Imagem corporal"
        proximaSessaoHref={null}
        onConcluir={async () => {}}
      />
    );
    expect(screen.queryByText(/reflexão/i)).not.toBeInTheDocument();
  });

  it('permite concluir sem preencher nenhum campo', async () => {
    const onConcluir = vi.fn().mockResolvedValue(undefined);
    render(
      <SessaoClient
        sessao={sessaoBase}
        modulo={modulo}
        jornadaSlug="imagem-corporal"
        jornadaTitulo="Imagem corporal"
        proximaSessaoHref={null}
        onConcluir={onConcluir}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /concluir/i }));
    expect(onConcluir).toHaveBeenCalledTimes(1);
  });

  it('mostra aviso de segurança quando presente', () => {
    render(
      <SessaoClient
        sessao={{ ...sessaoBase, avisoSeguranca: 'Se você notar sinais persistentes, procure ajuda profissional.' }}
        modulo={modulo}
        jornadaSlug="imagem-corporal"
        jornadaTitulo="Imagem corporal"
        proximaSessaoHref={null}
        onConcluir={async () => {}}
      />
    );
    expect(screen.getByText(/procure ajuda profissional/i)).toBeInTheDocument();
  });
});
```

(Adjust the exact prop shape/import paths to whatever `SessaoClient.tsx` actually exports in Step 5 — keep this test file's intent: no-field-required completion, optional reflection hidden when absent, safety notice visible when present, core content renders.)

- [ ] **Step 7: Run tests**

Run: `npx vitest run "src/app/jornadas/[slug]/[sessaoId]"`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add "src/app/jornadas/[slug]/[sessaoId]"
git commit -m "feat(jornadas): rota de sessao individual com progresso real e concessao unica de Petalas"
```

---

### Task 6: Wire up journey/session list pages

**Files:**
- Modify: `src/app/jornadas/[slug]/page.tsx`
- Modify: `src/app/components/jornadas/CartaoJornada.tsx`
- Modify: `src/app/components/jornadas/EstadoSessaoIcone.tsx` (only if it needs a 4th `'em_andamento'` visual state — check current signature first; extend, don't rewrite the design)
- Modify: `src/app/jornadas/page.tsx` (only if it referenced `jornada.progressoPercentual` directly — check first)

**Interfaces:**
- Consumes: `calcularEstadosSessoes`, `calcularPercentualConcluido`, `carregarProgressoJornada` (Task 4); `buscarJornadaPorSlug`, `contarModulos`, `contarSessoes`, `listarSessoesEmOrdem` (Task 3); `EstadoSessao` (Task 2).

- [ ] **Step 1: Read current `[slug]/page.tsx` and `CartaoJornada.tsx` in full** (already read during research — `CartaoJornada.tsx` currently reads `jornada.progressoPercentual` directly at lines 22/33/35, which no longer exists on `Jornada` after Task 2 — this is the compile error to fix).

- [ ] **Step 2: Update `CartaoJornada.tsx`**

Change its prop to accept a computed `percentualConcluido: number` alongside `jornada` (compute it in the parent — `src/app/jornadas/page.tsx` — per journey, using `carregarProgressoJornada` + `calcularEstadosSessoes` + `calcularPercentualConcluido` for the current user), replacing every `jornada.progressoPercentual` reference with the new prop.

- [ ] **Step 3: Update `src/app/jornadas/page.tsx`**

Server component: get the authenticated user, for each of the 4 `listarJornadas()` entries compute its percentual via Task 4's functions, pass to `<CartaoJornada jornada={j} percentualConcluido={pct} />`.

- [ ] **Step 4: Rewrite `[slug]/page.tsx`**

Replace the current non-interactive session `<div>` rows (lines ~67-89) with `<Link href={`/jornadas/${jornada.slug}/${sessao.id}`}>` when the session's computed `EstadoSessao` is not `'bloqueada'`, and a non-clickable (but still visible, `aria-disabled="true"`) row when it is — never remove a session from the list, only lock it. Compute all states via `carregarProgressoJornada` (current user) → `calcularEstadosSessoes` → `calcularPercentualConcluido`, replacing the old `estadoDaSessao()` local helper that trusted stored `sessao.concluida`/`sessao.bloqueada` fields (those fields no longer exist on `Sessao` after Task 2 — good, this removes the fake-shared-progress bug by construction). Redirect unauthenticated users to `/login` (match the pattern already used by the `[sessaoId]` page in Task 5).

- [ ] **Step 5: Check `EstadoSessaoIcone.tsx`**

If it currently switches over 3 states only (`'concluida' | 'bloqueada' | 'disponivel'`), add the `'em_andamento'` case with a visually distinct-but-consistent icon/style (don't invent new colors outside the existing palette — reuse `acao`/`texto-suave` tokens already in use elsewhere in this component).

- [ ] **Step 6: Full typecheck**

Run: `npx tsc --noEmit`
Expected: clean, zero errors anywhere in the repo (this closes out the temporarily-red state left after Task 2).

- [ ] **Step 7: Run the full jornadas test slice**

Run: `npx vitest run src/lib/jornadas-conteudo src/app/jornadas src/app/components/jornadas`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add "src/app/jornadas/[slug]/page.tsx" src/app/jornadas/page.tsx src/app/components/jornadas/CartaoJornada.tsx src/app/components/jornadas/EstadoSessaoIcone.tsx
git commit -m "feat(jornadas): cartoes de sessao clicaveis com progresso real por usuaria"
```

---

### Task 7: Full verification and QA

**Files:** none (verification only — fix-forward into whichever task's files if something breaks).

- [ ] **Step 1: Full automated suite**

Run in order, fixing forward (into the task whose files caused the failure) until all pass:
```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
```

- [ ] **Step 2: Preview QA (authenticated, mobile viewport)**

Use `preview_start` with this project's dev server config, `resize_window` to the mobile preset, log in with a test account (do not fabricate real user data — use whatever the project's existing Preview QA login pattern is, e.g. the "painel de QA" added in the immediately-preceding commit `fdde388`/`eed6bd3` on this same branch, which exists specifically to let Preview exercise draft journeys). Visually walk, screenshotting each:
1. `/jornadas`
2. Each of the 4 `/jornadas/[slug]` pages
3. First session of each journey (`/jornadas/[slug]/[first-sessaoId]`)
4. One session that has a `reflexao` field
5. One session that has an `avisoSeguranca`
6. Complete one session end-to-end and confirm it's marked concluded on return to `/jornadas/[slug]` and the next session unlocks
7. Attempt to open a locked (bloqueada) session directly by URL — confirm it redirects/blocks rather than rendering content
8. Last session of at least one journey

Confirm no page shows "Conteúdo a ser adicionado" anywhere, no console errors, keyboard-only navigation reaches and activates the "Concluir sessão" and "Sair" controls, and the safety-notice session's warning is visible (not just present in DOM but styled/visible).

- [ ] **Step 3: Report and hand back to the user**

Summarize (per the task spec's "Entrega" section): final counts per journey, changed files, which sources were added/verified, scientific limitations preserved in the UI, test/typecheck/lint/build results, QA performed and any real issues found, and confirm no migration was created/duplicated. Do NOT commit again in this task unless Step 1/2 required fix-forward changes — if so, fold those into the relevant earlier task's commit message pattern with a small additional commit, then stop (one branch, no merge to master, no deploy — per Global Constraints).
