# Página Práticas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder `/praticas` library page with the reference-accurate "Práticas" screen (4 quick self-care practices) and build 4 fully functional guided experiences (breathing, guided journal, meditation, self-compassion), reusing the app's existing visual system and patterns.

**Architecture:** A content-data layer (`src/lib/praticas-conteudo`) centralizes the 4 practices' text/colors/duration, decoupled from Supabase (mirrors the existing `jornadas-conteudo` pattern). Reusable pure logic (breathing cycle timing, countdown timer, phrase rotation) lives in small testable modules under the same folder. A local-only, isolated persistence layer (`src/lib/persistencia-local`, `src/lib/praticas-progresso`) handles draft autosave and completion tracking without touching Supabase, but is structured so swapping in Supabase later only requires rewriting those two files. UI is composed from small reusable components (`src/app/components/praticas/*`) shared across the 4 practice pages, following the existing `Cartao`/`Botao`/`CabecalhoJornadas` conventions.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript (strict), Tailwind v4 (CSS-first `@theme` tokens, no new tokens added), Vitest + `@testing-library/react` for hook/logic tests, Supabase (`@supabase/ssr`) only for reading `auth.getUser()` — no schema changes.

## Global Constraints

- No Supabase migrations, no new tables, no changes to the `sessoes`/`checkins`/`praticas` schema (spec §2, §8.2).
- No new Tailwind color tokens — reuse the existing `@theme` tokens exactly as mapped in spec §5.
- No icon library — every icon is a hand-written inline SVG (24×24-ish viewBox, `stroke="currentColor"`, `fill="none"`, `strokeLinecap/Linejoin="round"`), matching `NavegacaoInferior.tsx`'s existing icons. No emoji anywhere.
- `/praticas/[id]` and `CartaoPratica.tsx` (the old Supabase-backed library) are left untouched — not deleted, not modified (spec §2).
- `/pratica/[id]` (singular, check-in flow) is left untouched.
- Every new client-side interactive element must be keyboard-usable (native `<button>`/`<a>`/`<Link>`, visible `focus-visible` ring) and respect `prefers-reduced-motion` via Tailwind's `motion-reduce:`/`motion-safe:` variants (existing project convention).
- Page container convention: `<main className="mx-auto max-w-md space-y-6 px-4 pt-6 pb-24 md:pb-8">...<NavegacaoInferior /></main>` (matches `/jornadas`).
- No text anywhere presents the app as a substitute for therapy, diagnosis, or medical care (spec §9.4).
- All new source comments and UI copy are in Portuguese, matching the rest of the codebase.

---

## Task 1: Content data model for the 4 practices

**Files:**
- Create: `src/lib/praticas-conteudo/tipos.ts`
- Create: `src/lib/praticas-conteudo/dados.ts`
- Create: `src/lib/praticas-conteudo/dados.test.ts`
- Create: `src/lib/praticas-conteudo/perguntasDiarioGuiado.ts`
- Create: `src/lib/praticas-conteudo/etapasAutocompaixao.ts`

**Interfaces:**
- Produces: `PraticaRapida`, `CategoriaPratica`, `CorCartaoPratica`, `NivelDificuldade`, `MidiaPratica` (types), `PRATICAS_RAPIDAS: PraticaRapida[]`, `obterPraticaPorId(id: string): PraticaRapida | undefined`, `PERGUNTAS_DIARIO_GUIADO: string[]`, `ETAPAS_AUTOCOMPAIXAO: EtapaAutocompaixao[]` (with `EtapaAutocompaixao` type). All later tasks import from these exact names.

- [ ] **Step 1: Write the types**

```ts
// src/lib/praticas-conteudo/tipos.ts
// Modelo de conteúdo das práticas rápidas (Respiração, Diário guiado,
// Meditação, Autocompaixão). Desacoplado do Supabase de propósito: quando
// existir conteúdo real no banco (vídeo/áudio/textos variados), só
// `dados.ts` precisa ser trocado por uma consulta — nenhum componente que
// consome `PraticaRapida` muda.

export type CategoriaPratica = 'respiracao' | 'diario' | 'meditacao' | 'autocompaixao';
export type CorCartaoPratica = 'salvia' | 'pessego' | 'lilas' | 'rosa';
export type NivelDificuldade = 'iniciante' | 'intermediario' | 'avancado';

export interface MidiaPratica {
  tipo: 'audio' | 'video' | 'imagem' | null;
  url: string | null;
  miniaturaUrl: string | null;
}

export interface PraticaRapida {
  id: string;
  categoria: CategoriaPratica;
  titulo: string;
  descricaoCurta: string;
  duracaoMinutos: number;
  duracaoLabel: string;
  corCartao: CorCartaoPratica;
  nivel: NivelDificuldade;
  premium: boolean;
  gratuita: boolean;
  midia: MidiaPratica;
}
```

- [ ] **Step 2: Write the data + helper**

```ts
// src/lib/praticas-conteudo/dados.ts
// Dados fixos e centralizados das 4 práticas rápidas. Quando o conteúdo
// real existir no Supabase, esta é a única peça que precisa ser trocada
// por uma consulta — os componentes consomem só os tipos de `./tipos`,
// nunca este array diretamente por nome.
import type { PraticaRapida } from './tipos';

export const PRATICAS_RAPIDAS: PraticaRapida[] = [
  {
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
  },
  {
    id: 'diario-guiado',
    categoria: 'diario',
    titulo: 'Diário guiado',
    descricaoCurta: 'Escreva, sinta e se conheça melhor.',
    duracaoMinutos: 5,
    duracaoLabel: '5 min',
    corCartao: 'pessego',
    nivel: 'iniciante',
    premium: false,
    gratuita: true,
    midia: { tipo: null, url: null, miniaturaUrl: null },
  },
  {
    id: 'meditacao',
    categoria: 'meditacao',
    titulo: 'Meditação',
    descricaoCurta: 'Acalme a mente e encontre presença.',
    duracaoMinutos: 8,
    duracaoLabel: '8 min',
    corCartao: 'lilas',
    nivel: 'iniciante',
    premium: false,
    gratuita: true,
    // >>> Adicionar aqui a URL do áudio guiado real (Supabase Storage/CDN) quando existir. <<<
    midia: { tipo: null, url: null, miniaturaUrl: null },
  },
  {
    id: 'autocompaixao',
    categoria: 'autocompaixao',
    titulo: 'Exercício de autocompaixão',
    descricaoCurta: 'Pratique gentileza e cuidado consigo.',
    duracaoMinutos: 5,
    duracaoLabel: '5 min',
    corCartao: 'rosa',
    nivel: 'iniciante',
    premium: false,
    gratuita: true,
    midia: { tipo: null, url: null, miniaturaUrl: null },
  },
];

export function obterPraticaPorId(id: string): PraticaRapida | undefined {
  return PRATICAS_RAPIDAS.find((pratica) => pratica.id === id);
}
```

- [ ] **Step 3: Write the failing test**

```ts
// src/lib/praticas-conteudo/dados.test.ts
import { describe, it, expect } from 'vitest';
import { PRATICAS_RAPIDAS, obterPraticaPorId } from './dados';

describe('PRATICAS_RAPIDAS', () => {
  it('tem exatamente as 4 práticas rápidas, na ordem do mockup', () => {
    expect(PRATICAS_RAPIDAS.map((pratica) => pratica.id)).toEqual([
      'respiracao',
      'diario-guiado',
      'meditacao',
      'autocompaixao',
    ]);
  });
});

describe('obterPraticaPorId', () => {
  it('retorna a prática correta para cada slug conhecido', () => {
    expect(obterPraticaPorId('respiracao')?.titulo).toBe('Respiração');
    expect(obterPraticaPorId('diario-guiado')?.titulo).toBe('Diário guiado');
    expect(obterPraticaPorId('meditacao')?.titulo).toBe('Meditação');
    expect(obterPraticaPorId('autocompaixao')?.titulo).toBe('Exercício de autocompaixão');
  });

  it('retorna undefined para um slug desconhecido', () => {
    expect(obterPraticaPorId('inexistente')).toBeUndefined();
  });
});
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run src/lib/praticas-conteudo/dados.test.ts`
Expected: PASS (4/4 tests) — this is a verification-after-the-fact run since the implementation was written in Step 2, not strict red-green TDD (there's no meaningful "failing" version of a static data file).

- [ ] **Step 5: Write the diário guiado questions**

```ts
// src/lib/praticas-conteudo/perguntasDiarioGuiado.ts
export const PERGUNTAS_DIARIO_GUIADO: string[] = [
  'O que você está sentindo neste momento?',
  'O que pode ter despertado esse sentimento?',
  'Do que você precisa agora?',
  'Que gesto de cuidado você pode oferecer a si mesma hoje?',
];
```

- [ ] **Step 6: Write the self-compassion steps**

```ts
// src/lib/praticas-conteudo/etapasAutocompaixao.ts
export interface EtapaAutocompaixao {
  titulo: string;
  texto: string | null;
  pergunta: string | null;
}

export const ETAPAS_AUTOCOMPAIXAO: EtapaAutocompaixao[] = [
  {
    titulo: 'Reconheça o momento',
    texto: null,
    pergunta: 'O que está sendo difícil para você agora?',
  },
  {
    titulo: 'Lembre-se de que você não está sozinha',
    texto: 'Momentos difíceis fazem parte da experiência humana. Você não precisa enfrentar tudo com perfeição.',
    pergunta: null,
  },
  {
    titulo: 'Fale consigo com gentileza',
    texto: null,
    pergunta: 'O que você diria a uma amiga querida que estivesse passando por isso?',
  },
  {
    titulo: 'Transforme isso em cuidado',
    texto: null,
    pergunta: 'Como você pode dizer essas mesmas palavras para si agora?',
  },
];
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/praticas-conteudo/
git commit -m "feat: add content data model for the 4 quick practices"
```

---

## Task 2: `usePersistedState` — local draft persistence hook

**Files:**
- Create: `src/lib/persistencia-local/usePersistedState.ts`
- Test: `src/lib/persistencia-local/usePersistedState.test.ts`

**Interfaces:**
- Produces: `usePersistedState<T>(chave: string, valorInicial: T): [T, (valor: T) => void, () => void]` — `[valor, definir, limpar]`. Used by Task 12 (diário) and Task 14 (autocompaixão) for draft answers, keyed as `` `praticas:{tipo}:{usuariaId}:{data}` ``.

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/persistencia-local/usePersistedState.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistedState } from './usePersistedState';

describe('usePersistedState', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('lê o valor inicial do localStorage quando já existe', () => {
    window.localStorage.setItem('chave-teste', JSON.stringify('valor salvo'));
    const { result } = renderHook(() => usePersistedState('chave-teste', 'inicial'));
    expect(result.current[0]).toBe('valor salvo');
  });

  it('usa o valor inicial quando nada está salvo', () => {
    const { result } = renderHook(() => usePersistedState('chave-vazia', 'inicial'));
    expect(result.current[0]).toBe('inicial');
  });

  it('grava no localStorage depois da janela de debounce', () => {
    const { result } = renderHook(() => usePersistedState('chave-debounce', ''));
    act(() => {
      result.current[1]('novo valor');
    });
    expect(window.localStorage.getItem('chave-debounce')).toBeNull();
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(window.localStorage.getItem('chave-debounce')).toBe(JSON.stringify('novo valor'));
  });

  it('limpa o valor salvo e volta para o valor inicial', () => {
    const { result } = renderHook(() => usePersistedState('chave-limpar', 'inicial'));
    act(() => {
      result.current[1]('outro valor');
      vi.advanceTimersByTime(400);
    });
    act(() => {
      result.current[2]();
    });
    expect(result.current[0]).toBe('inicial');
    expect(window.localStorage.getItem('chave-limpar')).toBeNull();
  });

  it('mantém valores de chaves diferentes isolados entre si', () => {
    const { result: a } = renderHook(() => usePersistedState('chave-a', 'a-inicial'));
    const { result: b } = renderHook(() => usePersistedState('chave-b', 'b-inicial'));
    act(() => {
      a.current[1]('a-valor');
      vi.advanceTimersByTime(400);
    });
    expect(window.localStorage.getItem('chave-a')).toBe(JSON.stringify('a-valor'));
    expect(window.localStorage.getItem('chave-b')).toBeNull();
    expect(b.current[0]).toBe('b-inicial');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/persistencia-local/usePersistedState.test.ts`
Expected: FAIL with "Cannot find module './usePersistedState'" (file doesn't exist yet).

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/persistencia-local/usePersistedState.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const ATRASO_GRAVACAO_MS = 400;

export function usePersistedState<T>(
  chave: string,
  valorInicial: T
): [T, (valor: T) => void, () => void] {
  const [valor, setValorState] = useState<T>(() => {
    if (typeof window === 'undefined') return valorInicial;
    try {
      const bruto = window.localStorage.getItem(chave);
      return bruto !== null ? (JSON.parse(bruto) as T) : valorInicial;
    } catch {
      return valorInicial;
    }
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const definir = useCallback(
    (novoValor: T) => {
      setValorState(novoValor);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        try {
          window.localStorage.setItem(chave, JSON.stringify(novoValor));
        } catch {
          // localStorage indisponível (ex.: modo privado) — segue só em memória
        }
      }, ATRASO_GRAVACAO_MS);
    },
    [chave]
  );

  const limpar = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    try {
      window.localStorage.removeItem(chave);
    } catch {
      // ignora
    }
    setValorState(valorInicial);
    // valorInicial é intencionalmente omitido das deps: é o valor "de fábrica"
    // passado na primeira chamada do hook, não deve mudar entre renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  return [valor, definir, limpar];
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/lib/persistencia-local/usePersistedState.test.ts`
Expected: PASS (5/5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/persistencia-local/
git commit -m "feat: add usePersistedState hook for local draft autosave"
```

---

## Task 3: Completion tracking storage (`praticas-progresso`)

**Files:**
- Create: `src/lib/praticas-progresso/tipos.ts`
- Create: `src/lib/praticas-progresso/armazenamento.ts`
- Test: `src/lib/praticas-progresso/armazenamento.test.ts`

**Interfaces:**
- Consumes: none.
- Produces: `ConclusaoPratica` type, `registrarConclusao(conclusao: ConclusaoPratica): void`, `listarConclusoesDoDia(usuariaId: string, data: string): ConclusaoPratica[]`. Used by Tasks 11, 12, 13, 14 (all 4 practice clients call `registrarConclusao` on completion).

- [ ] **Step 1: Write the types**

```ts
// src/lib/praticas-progresso/tipos.ts
export interface ConclusaoPratica {
  praticaId: string;
  usuariaId: string;
  concluidaEm: string; // ISO 8601
  duracaoMinutos: number;
}
```

- [ ] **Step 2: Write the failing tests**

```ts
// src/lib/praticas-progresso/armazenamento.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { registrarConclusao, listarConclusoesDoDia } from './armazenamento';

describe('registrarConclusao / listarConclusoesDoDia', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('registra uma conclusão e permite listá-la no dia', () => {
    registrarConclusao({
      praticaId: 'respiracao',
      usuariaId: 'u1',
      concluidaEm: '2026-08-13T10:00:00.000Z',
      duracaoMinutos: 3,
    });
    expect(listarConclusoesDoDia('u1', '2026-08-13')).toHaveLength(1);
  });

  it('não duplica quando a mesma conclusão é registrada duas vezes seguidas (duplo toque)', () => {
    registrarConclusao({
      praticaId: 'respiracao',
      usuariaId: 'u1',
      concluidaEm: '2026-08-13T10:00:00.000Z',
      duracaoMinutos: 3,
    });
    registrarConclusao({
      praticaId: 'respiracao',
      usuariaId: 'u1',
      concluidaEm: '2026-08-13T10:00:02.000Z',
      duracaoMinutos: 3,
    });
    expect(listarConclusoesDoDia('u1', '2026-08-13')).toHaveLength(1);
  });

  it('permite duas conclusões da mesma prática fora da janela de idempotência', () => {
    registrarConclusao({
      praticaId: 'respiracao',
      usuariaId: 'u1',
      concluidaEm: '2026-08-13T10:00:00.000Z',
      duracaoMinutos: 3,
    });
    registrarConclusao({
      praticaId: 'respiracao',
      usuariaId: 'u1',
      concluidaEm: '2026-08-13T18:00:00.000Z',
      duracaoMinutos: 3,
    });
    expect(listarConclusoesDoDia('u1', '2026-08-13')).toHaveLength(2);
  });

  it('não mistura conclusões de usuárias diferentes', () => {
    registrarConclusao({
      praticaId: 'respiracao',
      usuariaId: 'u1',
      concluidaEm: '2026-08-13T10:00:00.000Z',
      duracaoMinutos: 3,
    });
    registrarConclusao({
      praticaId: 'respiracao',
      usuariaId: 'u2',
      concluidaEm: '2026-08-13T10:00:00.000Z',
      duracaoMinutos: 3,
    });
    expect(listarConclusoesDoDia('u1', '2026-08-13')).toHaveLength(1);
    expect(listarConclusoesDoDia('u2', '2026-08-13')).toHaveLength(1);
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx vitest run src/lib/praticas-progresso/armazenamento.test.ts`
Expected: FAIL with "Cannot find module './armazenamento'"

- [ ] **Step 4: Write the implementation**

```ts
// src/lib/praticas-progresso/armazenamento.ts
// Camada temporária de registro de conclusão das práticas rápidas,
// baseada em localStorage. Não usa a tabela `sessoes` existente porque
// `sessoes.checkin_id` é NOT NULL + UNIQUE (uma sessão por check-in do
// dia) — não comporta múltiplas práticas avulsas no mesmo dia. Quando
// existir uma tabela própria no Supabase para isso, só este arquivo
// precisa ser trocado — `registrarConclusao`/`listarConclusoesDoDia`
// continuam com a mesma assinatura.
import type { ConclusaoPratica } from './tipos';

const JANELA_IDEMPOTENCIA_MS = 5000;

function chaveDoDia(usuariaId: string, data: string): string {
  return `praticas:conclusoes:${usuariaId}:${data}`;
}

function lerConclusoesDoDia(usuariaId: string, data: string): ConclusaoPratica[] {
  try {
    const bruto = window.localStorage.getItem(chaveDoDia(usuariaId, data));
    return bruto ? (JSON.parse(bruto) as ConclusaoPratica[]) : [];
  } catch {
    return [];
  }
}

export function registrarConclusao(conclusao: ConclusaoPratica): void {
  const data = conclusao.concluidaEm.slice(0, 10);
  const existentes = lerConclusoesDoDia(conclusao.usuariaId, data);

  const instanteNovo = new Date(conclusao.concluidaEm).getTime();
  const jaRegistrada = existentes.some((existente) => {
    if (existente.praticaId !== conclusao.praticaId) return false;
    const diferencaMs = Math.abs(new Date(existente.concluidaEm).getTime() - instanteNovo);
    return diferencaMs < JANELA_IDEMPOTENCIA_MS;
  });
  if (jaRegistrada) return;

  const atualizadas = [...existentes, conclusao];
  try {
    window.localStorage.setItem(chaveDoDia(conclusao.usuariaId, data), JSON.stringify(atualizadas));
  } catch {
    // localStorage indisponível — conclusão não persiste, mas não quebra o fluxo
  }
}

export function listarConclusoesDoDia(usuariaId: string, data: string): ConclusaoPratica[] {
  return lerConclusoesDoDia(usuariaId, data);
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/lib/praticas-progresso/armazenamento.test.ts`
Expected: PASS (4/4 tests)

- [ ] **Step 6: Commit**

```bash
git add src/lib/praticas-progresso/
git commit -m "feat: add isolated local completion tracking for quick practices"
```

---

## Task 4: `useCronometroRegressivo` — reusable countdown timer engine

**Files:**
- Create: `src/lib/praticas-conteudo/useCronometroRegressivo.ts`
- Test: `src/lib/praticas-conteudo/useCronometroRegressivo.test.ts`

**Interfaces:**
- Produces: `EstadoCronometro = 'parado' | 'executando' | 'pausado' | 'concluido'`, `useCronometroRegressivo(duracaoTotalS: number, aoConcluir?: () => void): { segundosRestantes: number; segundosDecorridos: number; estado: EstadoCronometro; iniciar: () => void; pausar: () => void; continuar: () => void; reiniciar: () => void }`. Used by Task 11 (Respiração, `duracaoTotalS = 180`) and Task 13 (Meditação, `duracaoTotalS = 480`).

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/praticas-conteudo/useCronometroRegressivo.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCronometroRegressivo } from './useCronometroRegressivo';

describe('useCronometroRegressivo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('começa parado com todo o tempo restante', () => {
    const { result } = renderHook(() => useCronometroRegressivo(10));
    expect(result.current.estado).toBe('parado');
    expect(result.current.segundosRestantes).toBe(10);
  });

  it('conta regressivamente a cada segundo depois de iniciar', () => {
    const { result } = renderHook(() => useCronometroRegressivo(10));
    act(() => result.current.iniciar());
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.segundosRestantes).toBe(7);
    expect(result.current.estado).toBe('executando');
  });

  it('pausa e mantém o tempo restante congelado', () => {
    const { result } = renderHook(() => useCronometroRegressivo(10));
    act(() => result.current.iniciar());
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    act(() => result.current.pausar());
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.segundosRestantes).toBe(7);
    expect(result.current.estado).toBe('pausado');
  });

  it('continua de onde parou', () => {
    const { result } = renderHook(() => useCronometroRegressivo(10));
    act(() => result.current.iniciar());
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    act(() => result.current.pausar());
    act(() => result.current.continuar());
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.segundosRestantes).toBe(5);
  });

  it('reinicia zerando o tempo decorrido', () => {
    const { result } = renderHook(() => useCronometroRegressivo(10));
    act(() => result.current.iniciar());
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    act(() => result.current.reiniciar());
    expect(result.current.segundosRestantes).toBe(10);
    expect(result.current.estado).toBe('parado');
  });

  it('chama aoConcluir e marca concluído ao chegar no fim', () => {
    const aoConcluir = vi.fn();
    const { result } = renderHook(() => useCronometroRegressivo(3, aoConcluir));
    act(() => result.current.iniciar());
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.estado).toBe('concluido');
    expect(result.current.segundosRestantes).toBe(0);
    expect(aoConcluir).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/praticas-conteudo/useCronometroRegressivo.test.ts`
Expected: FAIL with "Cannot find module './useCronometroRegressivo'"

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/praticas-conteudo/useCronometroRegressivo.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type EstadoCronometro = 'parado' | 'executando' | 'pausado' | 'concluido';

export interface CronometroRegressivo {
  segundosRestantes: number;
  segundosDecorridos: number;
  estado: EstadoCronometro;
  iniciar: () => void;
  pausar: () => void;
  continuar: () => void;
  reiniciar: () => void;
}

export function useCronometroRegressivo(
  duracaoTotalS: number,
  aoConcluir?: () => void
): CronometroRegressivo {
  const [segundosDecorridos, setSegundosDecorridos] = useState(0);
  const [estado, setEstado] = useState<EstadoCronometro>('parado');
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aoConcluirRef = useRef(aoConcluir);
  aoConcluirRef.current = aoConcluir;

  const pararIntervalo = useCallback(() => {
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current);
      intervaloRef.current = null;
    }
  }, []);

  useEffect(() => pararIntervalo, [pararIntervalo]);

  const iniciarIntervalo = useCallback(() => {
    pararIntervalo();
    intervaloRef.current = setInterval(() => {
      setSegundosDecorridos((atual) => {
        const proximo = atual + 1;
        if (proximo >= duracaoTotalS) {
          pararIntervalo();
          setEstado('concluido');
          aoConcluirRef.current?.();
          return duracaoTotalS;
        }
        return proximo;
      });
    }, 1000);
  }, [duracaoTotalS, pararIntervalo]);

  const iniciar = useCallback(() => {
    setSegundosDecorridos(0);
    setEstado('executando');
    iniciarIntervalo();
  }, [iniciarIntervalo]);

  const pausar = useCallback(() => {
    pararIntervalo();
    setEstado('pausado');
  }, [pararIntervalo]);

  const continuar = useCallback(() => {
    setEstado('executando');
    iniciarIntervalo();
  }, [iniciarIntervalo]);

  const reiniciar = useCallback(() => {
    pararIntervalo();
    setSegundosDecorridos(0);
    setEstado('parado');
  }, [pararIntervalo]);

  return {
    segundosRestantes: Math.max(duracaoTotalS - segundosDecorridos, 0),
    segundosDecorridos,
    estado,
    iniciar,
    pausar,
    continuar,
    reiniciar,
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/lib/praticas-conteudo/useCronometroRegressivo.test.ts`
Expected: PASS (6/6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/praticas-conteudo/useCronometroRegressivo.ts src/lib/praticas-conteudo/useCronometroRegressivo.test.ts
git commit -m "feat: add reusable countdown timer hook for guided practices"
```

---

## Task 5: Breathing cycle pure logic

**Files:**
- Create: `src/lib/praticas-conteudo/cicloRespiracao.ts`
- Test: `src/lib/praticas-conteudo/cicloRespiracao.test.ts`

**Interfaces:**
- Produces: `DURACAO_INSPIRAR_S = 4`, `DURACAO_EXPIRAR_S = 6`, `DURACAO_CICLO_S = 10`, `FaseRespiracao = 'inspire' | 'expire'`, `calcularFaseRespiracao(segundosDecorridos: number): { fase: FaseRespiracao; progressoFase: number }`. Used by Task 11 (Respiração client).

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/praticas-conteudo/cicloRespiracao.test.ts
import { describe, it, expect } from 'vitest';
import { calcularFaseRespiracao, DURACAO_CICLO_S } from './cicloRespiracao';

describe('calcularFaseRespiracao', () => {
  it('está em inspire no início do ciclo', () => {
    expect(calcularFaseRespiracao(0).fase).toBe('inspire');
    expect(calcularFaseRespiracao(0).progressoFase).toBe(0);
  });

  it('está em expire logo após os 4s de inspiração', () => {
    expect(calcularFaseRespiracao(4).fase).toBe('expire');
    expect(calcularFaseRespiracao(4).progressoFase).toBe(0);
  });

  it('avança dentro da fase de expiração proporcionalmente', () => {
    expect(calcularFaseRespiracao(7).fase).toBe('expire');
    expect(calcularFaseRespiracao(7).progressoFase).toBeCloseTo(0.5, 5);
  });

  it('reinicia o ciclo (volta para inspire) depois de 10s', () => {
    expect(calcularFaseRespiracao(9.9).fase).toBe('expire');
    expect(calcularFaseRespiracao(10).fase).toBe('inspire');
  });

  it('o ciclo de 10s cabe um número inteiro de vezes em 3 minutos', () => {
    expect(180 % DURACAO_CICLO_S).toBe(0);
    expect(calcularFaseRespiracao(170).fase).toBe('inspire');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/praticas-conteudo/cicloRespiracao.test.ts`
Expected: FAIL with "Cannot find module './cicloRespiracao'"

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/praticas-conteudo/cicloRespiracao.ts
// Ciclo respiratório fixo e confortável: inspire 4s, expire devagar 6s,
// repetido até completar os 3 minutos da prática de Respiração. Sem
// retenção do ar. `DURACAO_CICLO_S` (10s) divide os 180s totais em 18
// ciclos exatos, então o cronômetro nunca termina "no meio" de uma fase.

export const DURACAO_INSPIRAR_S = 4;
export const DURACAO_EXPIRAR_S = 6;
export const DURACAO_CICLO_S = DURACAO_INSPIRAR_S + DURACAO_EXPIRAR_S;

export type FaseRespiracao = 'inspire' | 'expire';

export interface EstadoCicloRespiracao {
  fase: FaseRespiracao;
  progressoFase: number;
}

export function calcularFaseRespiracao(segundosDecorridos: number): EstadoCicloRespiracao {
  const dentroDoCiclo = segundosDecorridos % DURACAO_CICLO_S;
  if (dentroDoCiclo < DURACAO_INSPIRAR_S) {
    return { fase: 'inspire', progressoFase: dentroDoCiclo / DURACAO_INSPIRAR_S };
  }
  return {
    fase: 'expire',
    progressoFase: (dentroDoCiclo - DURACAO_INSPIRAR_S) / DURACAO_EXPIRAR_S,
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/lib/praticas-conteudo/cicloRespiracao.test.ts`
Expected: PASS (5/5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/praticas-conteudo/cicloRespiracao.ts src/lib/praticas-conteudo/cicloRespiracao.test.ts
git commit -m "feat: add pure breathing cycle timing logic"
```

---

## Task 6: Meditation phrase rotation logic

**Files:**
- Create: `src/lib/praticas-conteudo/frasesMeditacao.ts`
- Test: `src/lib/praticas-conteudo/frasesMeditacao.test.ts`

**Interfaces:**
- Produces: `FRASES_MEDITACAO: string[]`, `INTERVALO_TROCA_FRASE_S = 40`, `obterIndiceFrase(segundosDecorridos: number, totalFrases: number): number`. Used by Task 13 (Meditação client).

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/praticas-conteudo/frasesMeditacao.test.ts
import { describe, it, expect } from 'vitest';
import { obterIndiceFrase } from './frasesMeditacao';

describe('obterIndiceFrase', () => {
  it('começa na primeira frase', () => {
    expect(obterIndiceFrase(0, 8)).toBe(0);
  });

  it('avança para a próxima frase só depois do intervalo completo', () => {
    expect(obterIndiceFrase(39, 8)).toBe(0);
    expect(obterIndiceFrase(40, 8)).toBe(1);
    expect(obterIndiceFrase(79, 8)).toBe(1);
    expect(obterIndiceFrase(80, 8)).toBe(2);
  });

  it('roda em loop quando passa da última frase', () => {
    expect(obterIndiceFrase(40 * 8, 8)).toBe(0);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/praticas-conteudo/frasesMeditacao.test.ts`
Expected: FAIL with "Cannot find module './frasesMeditacao'"

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/praticas-conteudo/frasesMeditacao.ts
// Frases curtas e acolhedoras mostradas durante a meditação, trocando a
// cada INTERVALO_TROCA_FRASE_S. Texto de apoio enquanto não existe áudio
// guiado real (ver `midia.url` em `dados.ts`).

export const FRASES_MEDITACAO: string[] = [
  'Perceba o ar entrando e saindo, sem pressa.',
  'Solte um pouco mais os ombros a cada expiração.',
  'Você não precisa fazer nada além de estar aqui.',
  'Se a mente vagar, isso é normal — volte gentilmente para a respiração.',
  'Sinta o peso do seu corpo apoiado, sustentado.',
  'Está tudo bem simplesmente estar presente agora.',
  'Cada momento de presença é um cuidado que você oferece a si mesma.',
  'Aos poucos, permita-se desacelerar.',
];

export const INTERVALO_TROCA_FRASE_S = 40;

export function obterIndiceFrase(segundosDecorridos: number, totalFrases: number): number {
  return Math.floor(segundosDecorridos / INTERVALO_TROCA_FRASE_S) % totalFrases;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/lib/praticas-conteudo/frasesMeditacao.test.ts`
Expected: PASS (3/3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/praticas-conteudo/frasesMeditacao.ts src/lib/praticas-conteudo/frasesMeditacao.test.ts
git commit -m "feat: add meditation phrase rotation logic"
```

---

## Task 7: `/praticas` index — icons, header, cards, page

**Files:**
- Create: `src/app/components/praticas/icones/IconeRespiracao.tsx`
- Create: `src/app/components/praticas/icones/IconeDiario.tsx`
- Create: `src/app/components/praticas/icones/IconeMeditacao.tsx`
- Create: `src/app/components/praticas/icones/IconeAutocompaixao.tsx`
- Create: `src/app/components/praticas/icones/IconeSeta.tsx`
- Create: `src/app/components/praticas/CabecalhoPraticas.tsx`
- Create: `src/app/components/praticas/CartaoPraticaRapida.tsx`
- Modify: `src/app/praticas/page.tsx` (full replace)

**Interfaces:**
- Consumes: `PRATICAS_RAPIDAS`, `PraticaRapida`, `CorCartaoPratica` (Task 1); `IlustracaoFlorCabecalho` from `@/app/components/jornadas/ilustracoes/IlustracaoFlorCabecalho` (existing); `NavegacaoInferior` from `@/app/components/NavegacaoInferior` (existing, unmodified until Task 8).
- Produces: `CabecalhoPraticas` (no props), `CartaoPraticaRapida({ pratica: PraticaRapida })`. Consumed only by `src/app/praticas/page.tsx` in this task.

- [ ] **Step 1: Write the 4 practice icons**

```tsx
// src/app/components/praticas/icones/IconeRespiracao.tsx
export default function IconeRespiracao({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 21c0-6 .5-10 .5-14" />
      <path d="M12.5 13c-3 0-5-2-5-5 3 0 5 2 5 5Z" />
      <path d="M12.5 9c3 0 5-2.5 5-6-3.5 0-5 2.5-5 6Z" />
    </svg>
  );
}
```

```tsx
// src/app/components/praticas/icones/IconeDiario.tsx
export default function IconeDiario({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 4.5h9a3 3 0 0 1 3 3V19a2.5 2.5 0 0 0-2.5-2.5H6a1.5 1.5 0 0 1-1.5-1.5V6A1.5 1.5 0 0 1 6 4.5Z" />
      <path d="M9 9h6" />
      <path d="M9 12.5h4" />
    </svg>
  );
}
```

```tsx
// src/app/components/praticas/icones/IconeMeditacao.tsx
export default function IconeMeditacao({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 20c-4 0-7-2-7-2s1.5-4 7-4 7 4 7 4-3 2-7 2Z" />
      <path d="M12 14V8" />
      <path d="M12 14c-2-1-3-3-3-6 2 1 3 3 3 6Z" />
      <path d="M12 14c2-1 3-3 3-6-2 1-3 3-3 6Z" />
    </svg>
  );
}
```

```tsx
// src/app/components/praticas/icones/IconeAutocompaixao.tsx
export default function IconeAutocompaixao({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 15.5c-3-2-5-3.6-5-6a2.7 2.7 0 0 1 5-1.3A2.7 2.7 0 0 1 17 9.5c0 2.4-2 4-5 6Z" />
      <path d="M4 19c1.5-2 3-2.5 4-2" />
      <path d="M20 19c-1.5-2-3-2.5-4-2" />
    </svg>
  );
}
```

```tsx
// src/app/components/praticas/icones/IconeSeta.tsx
export default function IconeSeta({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}
```

- [ ] **Step 2: Write the header component**

```tsx
// src/app/components/praticas/CabecalhoPraticas.tsx
import IlustracaoFlorCabecalho from '@/app/components/jornadas/ilustracoes/IlustracaoFlorCabecalho';

export default function CabecalhoPraticas() {
  return (
    <header className="relative pr-14">
      <IlustracaoFlorCabecalho className="pointer-events-none absolute -top-1 right-0 h-14 w-14" />
      <h1 className="font-display text-3xl text-texto">Práticas</h1>
      <p className="mt-1 text-sm text-texto-suave">Atividades rápidas para cuidar de você hoje</p>
    </header>
  );
}
```

- [ ] **Step 3: Write the practice card component**

```tsx
// src/app/components/praticas/CartaoPraticaRapida.tsx
import Link from 'next/link';
import type { PraticaRapida, CorCartaoPratica } from '@/lib/praticas-conteudo/tipos';
import IconeRespiracao from './icones/IconeRespiracao';
import IconeDiario from './icones/IconeDiario';
import IconeMeditacao from './icones/IconeMeditacao';
import IconeAutocompaixao from './icones/IconeAutocompaixao';
import IconeSeta from './icones/IconeSeta';

const ICONES: Record<PraticaRapida['categoria'], typeof IconeRespiracao> = {
  respiracao: IconeRespiracao,
  diario: IconeDiario,
  meditacao: IconeMeditacao,
  autocompaixao: IconeAutocompaixao,
};

const FUNDOS: Record<CorCartaoPratica, string> = {
  salvia: 'bg-salvia-suave',
  pessego: 'bg-pessego-suave',
  lilas: 'bg-lilas-suave',
  rosa: 'bg-creme-rosado',
};

const CIRCULOS: Record<CorCartaoPratica, string> = {
  salvia: 'bg-salvia',
  pessego: 'bg-pessego',
  lilas: 'bg-destaque',
  rosa: 'bg-acao',
};

const CAPSULAS: Record<CorCartaoPratica, string> = {
  salvia: 'bg-salvia/25',
  pessego: 'bg-pessego/25',
  lilas: 'bg-destaque/25',
  rosa: 'bg-acao/15',
};

export default function CartaoPraticaRapida({ pratica }: { pratica: PraticaRapida }) {
  const Icone = ICONES[pratica.categoria];
  return (
    <Link
      href={`/praticas/${pratica.id}`}
      aria-label={`${pratica.titulo}, ${pratica.duracaoLabel}. ${pratica.descricaoCurta}`}
      className={`flex items-center gap-3 rounded-[28px] border border-borda/50 ${FUNDOS[pratica.corCartao]} px-4 py-3.5 transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60 focus-visible:ring-offset-2 focus-visible:ring-offset-fundo`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${CIRCULOS[pratica.corCartao]}`}
      >
        <Icone className="text-fundo" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-base text-texto">{pratica.titulo}</span>
        <span className="block truncate text-sm text-texto-suave">{pratica.descricaoCurta}</span>
      </span>
      <span
        className={`shrink-0 rounded-full ${CAPSULAS[pratica.corCartao]} px-2.5 py-1 text-xs font-medium text-texto`}
      >
        {pratica.duracaoLabel}
      </span>
      <IconeSeta className="shrink-0 text-texto-suave" />
    </Link>
  );
}
```

- [ ] **Step 4: Replace the `/praticas` index page**

```tsx
// src/app/praticas/page.tsx
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import CabecalhoPraticas from '@/app/components/praticas/CabecalhoPraticas';
import CartaoPraticaRapida from '@/app/components/praticas/CartaoPraticaRapida';
import { PRATICAS_RAPIDAS } from '@/lib/praticas-conteudo/dados';

export default function PraticasPage() {
  return (
    <main className="mx-auto max-w-md space-y-6 px-4 pt-6 pb-24 md:pb-8">
      <CabecalhoPraticas />
      <div className="space-y-2.5">
        {PRATICAS_RAPIDAS.map((pratica) => (
          <CartaoPraticaRapida key={pratica.id} pratica={pratica} />
        ))}
      </div>
      <NavegacaoInferior />
    </main>
  );
}
```

Note: this replaces the old Supabase-backed `PraticasPage` (grouped-by-category text library). `src/app/praticas/CartaoPratica.tsx` and `src/app/praticas/[id]/page.tsx` are left in place, unmodified, per spec §2 — they simply lose their only entry link.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors related to the new files.

- [ ] **Step 6: Commit**

```bash
git add src/app/components/praticas/ src/app/praticas/page.tsx
git commit -m "feat: replace /praticas index with the 4 quick-practice cards"
```

---

## Task 8: `NavegacaoInferior` — active-state circle + safe area

**Files:**
- Modify: `src/app/components/NavegacaoInferior.tsx` (full replace)

**Interfaces:**
- No new exports; `NavegacaoInferior` (default export, no props) keeps the same public shape used everywhere in the app (`/`, `/jornadas`, `/praticas`, `/progresso`, `/perfil`, and the new practice subpages).

- [ ] **Step 1: Replace the file**

```tsx
// src/app/components/NavegacaoInferior.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type IconeProps = { ativo: boolean; className?: string };

function IconeInicio({ ativo, className }: IconeProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={ativo ? 2 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

function IconeJornada({ ativo, className }: IconeProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={ativo ? 2 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 20c3-8 3-12 7-16 4 4 4 8 7 16" />
      <path d="M9.5 13.5h5" />
    </svg>
  );
}

function IconePraticas({ ativo, className }: IconeProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={ativo ? 2 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 4.5h9a3 3 0 0 1 3 3V19a2.5 2.5 0 0 0-2.5-2.5H6a1.5 1.5 0 0 1-1.5-1.5V6A1.5 1.5 0 0 1 6 4.5Z" />
      <path d="M6 16.5V19" />
    </svg>
  );
}

function IconeProgresso({ ativo, className }: IconeProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={ativo ? 2 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 19V10" />
      <path d="M12 19V5" />
      <path d="M19 19v-6" />
    </svg>
  );
}

function IconePerfil({ ativo, className }: IconeProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={ativo ? 2 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 20c1.2-3.6 4-5.5 6.5-5.5s5.3 1.9 6.5 5.5" />
    </svg>
  );
}

const ITENS = [
  { href: '/', rotulo: 'Início', Icone: IconeInicio, prefixosAtivos: ['/'] },
  { href: '/jornadas', rotulo: 'Jornadas', Icone: IconeJornada, prefixosAtivos: ['/jornadas'] },
  { href: '/praticas', rotulo: 'Práticas', Icone: IconePraticas, prefixosAtivos: ['/praticas'] },
  { href: '/progresso', rotulo: 'Progresso', Icone: IconeProgresso, prefixosAtivos: ['/progresso'] },
  { href: '/perfil', rotulo: 'Perfil', Icone: IconePerfil, prefixosAtivos: ['/perfil'] },
] as const;

export default function NavegacaoInferior() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-borda bg-superficie/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {ITENS.map(({ href, rotulo, Icone, prefixosAtivos }) => {
          const ativo =
            href === '/'
              ? pathname === '/'
              : prefixosAtivos.some((prefixo) => pathname.startsWith(prefixo));
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={ativo ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${
                  ativo ? 'text-acao' : 'text-texto-suave'
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                    ativo ? 'bg-acao' : ''
                  }`}
                >
                  <Icone ativo={ativo} className={ativo ? 'text-fundo' : 'text-texto-suave'} />
                </span>
                {rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/NavegacaoInferior.tsx
git commit -m "feat: add active-state circle and safe-area padding to bottom nav"
```

---

## Task 9: Shared practice-session UI components

**Files:**
- Create: `src/app/components/praticas/icones/IconeVoltar.tsx`
- Create: `src/app/components/praticas/icones/IconePlay.tsx`
- Create: `src/app/components/praticas/icones/IconePausa.tsx`
- Create: `src/app/components/praticas/CabecalhoPratica.tsx`
- Create: `src/app/components/praticas/Cronometro.tsx`
- Create: `src/app/components/praticas/ControlesSessao.tsx`
- Create: `src/app/components/praticas/IndicadorEtapas.tsx`
- Create: `src/app/components/praticas/TelaConclusao.tsx`
- Create: `src/app/components/praticas/PlayerAudio.tsx`

**Interfaces:**
- Consumes: `PraticaRapida` (Task 1), `EstadoCronometro` (Task 4), `Botao` from `@/app/components/Botao` (existing).
- Produces: `CabecalhoPratica({ pratica: PraticaRapida })`, `Cronometro({ segundosRestantes: number; duracaoTotalS: number; className?: string })`, `ControlesSessao({ estado: EstadoCronometro; onPausar: () => void; onContinuar: () => void; onReiniciar: () => void })`, `IndicadorEtapas({ etapaAtual: number; totalEtapas: number })`, `TelaConclusao({ titulo: string; mensagem: string; onRepetir?: () => void; linkRotulo?: string; linkHref?: string })`, `PlayerAudio({ url: string | null; titulo: string })`. Consumed by Tasks 11–14.

- [ ] **Step 1: Write the back-arrow and play/pause icons**

```tsx
// src/app/components/praticas/icones/IconeVoltar.tsx
export default function IconeVoltar({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}
```

```tsx
// src/app/components/praticas/icones/IconePlay.tsx
export default function IconePlay({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
```

```tsx
// src/app/components/praticas/icones/IconePausa.tsx
export default function IconePausa({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className={className} aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" />
      <rect x="14" y="5" width="4" height="14" />
    </svg>
  );
}
```

- [ ] **Step 2: Write the sub-page header**

```tsx
// src/app/components/praticas/CabecalhoPratica.tsx
import Link from 'next/link';
import type { PraticaRapida } from '@/lib/praticas-conteudo/tipos';
import IconeVoltar from './icones/IconeVoltar';

export default function CabecalhoPratica({ pratica }: { pratica: PraticaRapida }) {
  return (
    <header className="space-y-3">
      <Link
        href="/praticas"
        aria-label="Voltar para Práticas"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-borda/60 text-texto transition-colors hover:bg-superficie focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60"
      >
        <IconeVoltar />
      </Link>
      <div>
        <h1 className="font-display text-2xl text-texto">{pratica.titulo}</h1>
        <p className="mt-1 text-sm text-texto-suave">{pratica.descricaoCurta}</p>
      </div>
      <span className="inline-block rounded-full bg-borda/50 px-3 py-1 text-xs font-medium text-texto">
        {pratica.duracaoLabel}
      </span>
    </header>
  );
}
```

- [ ] **Step 3: Write the countdown display**

```tsx
// src/app/components/praticas/Cronometro.tsx
export default function Cronometro({
  segundosRestantes,
  duracaoTotalS,
  className = '',
}: {
  segundosRestantes: number;
  duracaoTotalS: number;
  className?: string;
}) {
  const minutos = Math.floor(segundosRestantes / 60);
  const segundos = segundosRestantes % 60;
  const rotulo = `${minutos}:${segundos.toString().padStart(2, '0')}`;
  const percentualDecorrido = ((duracaoTotalS - segundosRestantes) / duracaoTotalS) * 100;

  return (
    <div className={className}>
      <p aria-live="off" className="text-center font-display text-4xl tabular-nums text-texto">
        {rotulo}
      </p>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-borda/60">
        <div
          className="h-full rounded-full bg-acao transition-[width] duration-1000 ease-linear motion-reduce:transition-none"
          style={{ width: `${percentualDecorrido}%` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Write the pause/continue/restart controls**

```tsx
// src/app/components/praticas/ControlesSessao.tsx
import type { EstadoCronometro } from '@/lib/praticas-conteudo/useCronometroRegressivo';
import Botao from '@/app/components/Botao';

export default function ControlesSessao({
  estado,
  onPausar,
  onContinuar,
  onReiniciar,
}: {
  estado: EstadoCronometro;
  onPausar: () => void;
  onContinuar: () => void;
  onReiniciar: () => void;
}) {
  return (
    <div className="flex gap-3">
      {estado === 'executando' ? (
        <Botao type="button" variante="secundaria" onClick={onPausar} className="flex-1">
          Pausar
        </Botao>
      ) : (
        <Botao type="button" onClick={onContinuar} className="flex-1">
          Continuar
        </Botao>
      )}
      <Botao type="button" variante="secundaria" onClick={onReiniciar} className="flex-1">
        Reiniciar
      </Botao>
    </div>
  );
}
```

- [ ] **Step 5: Write the step indicator**

```tsx
// src/app/components/praticas/IndicadorEtapas.tsx
export default function IndicadorEtapas({
  etapaAtual,
  totalEtapas,
}: {
  etapaAtual: number;
  totalEtapas: number;
}) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label={`Etapa ${etapaAtual} de ${totalEtapas}`}>
      <div className="flex flex-1 gap-1.5">
        {Array.from({ length: totalEtapas }, (_, indice) => (
          <span
            key={indice}
            aria-hidden="true"
            className={`h-1.5 flex-1 rounded-full ${indice < etapaAtual ? 'bg-acao' : 'bg-borda'}`}
          />
        ))}
      </div>
      <span className="shrink-0 text-xs font-medium text-texto-suave">
        {etapaAtual}/{totalEtapas}
      </span>
    </div>
  );
}
```

- [ ] **Step 6: Write the completion screen**

```tsx
// src/app/components/praticas/TelaConclusao.tsx
import Link from 'next/link';
import Botao from '@/app/components/Botao';

export default function TelaConclusao({
  titulo,
  mensagem,
  onRepetir,
  linkRotulo = 'Voltar para Práticas',
  linkHref = '/praticas',
}: {
  titulo: string;
  mensagem: string;
  onRepetir?: () => void;
  linkRotulo?: string;
  linkHref?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="space-y-4 rounded-3xl border border-borda/60 bg-superficie p-6 text-center"
    >
      <h2 className="font-display text-xl text-texto">{titulo}</h2>
      <p className="text-sm text-texto-suave">{mensagem}</p>
      <div className="space-y-2">
        {onRepetir && (
          <Botao type="button" variante="secundaria" onClick={onRepetir}>
            Repetir prática
          </Botao>
        )}
        <Link
          href={linkHref}
          className="block w-full rounded-2xl bg-acao p-3 text-center font-medium text-white transition-colors hover:bg-acao/90"
        >
          {linkRotulo}
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Write the reusable audio player**

```tsx
// src/app/components/praticas/PlayerAudio.tsx
'use client';

import { useRef, useState } from 'react';
import IconePlay from './icones/IconePlay';
import IconePausa from './icones/IconePausa';

export default function PlayerAudio({ url, titulo }: { url: string | null; titulo: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [tocando, setTocando] = useState(false);
  const [volume, setVolume] = useState(1);
  const [duracaoSegundos, setDuracaoSegundos] = useState<number | null>(null);

  if (!url) {
    return (
      <p className="rounded-2xl border border-borda/60 bg-superficie px-4 py-3 text-center text-sm text-texto-suave">
        Áudio guiado em breve — por enquanto, siga pelo cronômetro e pelas orientações no texto.
      </p>
    );
  }

  function alternarReproducao() {
    const audio = audioRef.current;
    if (!audio) return;
    if (tocando) {
      audio.pause();
    } else {
      audio.play();
    }
  }

  const duracaoFormatada =
    duracaoSegundos !== null
      ? `${Math.floor(duracaoSegundos / 60)}:${Math.floor(duracaoSegundos % 60)
          .toString()
          .padStart(2, '0')}`
      : null;

  return (
    <div className="rounded-2xl border border-borda/60 bg-superficie px-4 py-3">
      <audio
        ref={audioRef}
        src={url}
        onPlay={() => setTocando(true)}
        onPause={() => setTocando(false)}
        onEnded={() => setTocando(false)}
        onLoadedMetadata={(evento) => setDuracaoSegundos(evento.currentTarget.duration)}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={alternarReproducao}
          aria-label={tocando ? `Pausar áudio de ${titulo}` : `Tocar áudio de ${titulo}`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-acao text-white"
        >
          {tocando ? <IconePausa /> : <IconePlay />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          aria-label="Volume do áudio"
          onChange={(evento) => {
            const novoVolume = Number(evento.target.value);
            setVolume(novoVolume);
            if (audioRef.current) audioRef.current.volume = novoVolume;
          }}
          className="flex-1"
        />
        {duracaoFormatada && <span className="shrink-0 text-xs text-texto-suave">{duracaoFormatada}</span>}
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors (these components aren't consumed by any page yet, but must compile standalone).

- [ ] **Step 9: Commit**

```bash
git add src/app/components/praticas/
git commit -m "feat: add shared UI components for guided practice sessions"
```

---

## Task 10: Respiração (`/praticas/respiracao`)

**Files:**
- Create: `src/app/praticas/respiracao/page.tsx`
- Create: `src/app/praticas/respiracao/RespiracaoClient.tsx`

**Interfaces:**
- Consumes: `obterPraticaPorId` (Task 1), `createSupabaseServerClient` from `@/lib/supabase/server` (existing), `useCronometroRegressivo` (Task 4), `calcularFaseRespiracao`, `DURACAO_INSPIRAR_S` (Task 5), `registrarConclusao` (Task 3), `Cronometro`, `ControlesSessao`, `TelaConclusao`, `CabecalhoPratica` (Task 9), `NavegacaoInferior` (existing), `Botao` (existing).
- Produces: nothing consumed elsewhere (leaf route).

- [ ] **Step 1: Write the server page**

```tsx
// src/app/praticas/respiracao/page.tsx
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import CabecalhoPratica from '@/app/components/praticas/CabecalhoPratica';
import { obterPraticaPorId } from '@/lib/praticas-conteudo/dados';
import RespiracaoClient from './RespiracaoClient';

export default async function RespiracaoPage() {
  const pratica = obterPraticaPorId('respiracao');
  if (!pratica) notFound();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto max-w-md space-y-6 px-4 pt-6 pb-24 md:pb-8">
      <CabecalhoPratica pratica={pratica} />
      <RespiracaoClient pratica={pratica} usuariaId={user?.id ?? 'anonima'} />
      <NavegacaoInferior />
    </main>
  );
}
```

- [ ] **Step 2: Write the client flow**

```tsx
// src/app/praticas/respiracao/RespiracaoClient.tsx
'use client';

import { useRef, useState } from 'react';
import type { PraticaRapida } from '@/lib/praticas-conteudo/tipos';
import { useCronometroRegressivo } from '@/lib/praticas-conteudo/useCronometroRegressivo';
import { calcularFaseRespiracao, DURACAO_INSPIRAR_S, DURACAO_EXPIRAR_S } from '@/lib/praticas-conteudo/cicloRespiracao';
import { registrarConclusao } from '@/lib/praticas-progresso/armazenamento';
import Cronometro from '@/app/components/praticas/Cronometro';
import ControlesSessao from '@/app/components/praticas/ControlesSessao';
import TelaConclusao from '@/app/components/praticas/TelaConclusao';
import Botao from '@/app/components/Botao';

const DURACAO_TOTAL_S = 180;

export default function RespiracaoClient({
  pratica,
  usuariaId,
}: {
  pratica: PraticaRapida;
  usuariaId: string;
}) {
  const [introducaoVisivel, setIntroducaoVisivel] = useState(true);
  const registradoRef = useRef(false);

  const cronometro = useCronometroRegressivo(DURACAO_TOTAL_S, () => {
    if (registradoRef.current) return;
    registradoRef.current = true;
    registrarConclusao({
      praticaId: pratica.id,
      usuariaId,
      concluidaEm: new Date().toISOString(),
      duracaoMinutos: pratica.duracaoMinutos,
    });
  });

  function comecar() {
    setIntroducaoVisivel(false);
    registradoRef.current = false;
    cronometro.iniciar();
  }

  function reiniciar() {
    registradoRef.current = false;
    cronometro.reiniciar();
    setIntroducaoVisivel(true);
  }

  if (cronometro.estado === 'concluido') {
    return (
      <TelaConclusao
        titulo="Respiração concluída"
        mensagem="Muito bem. Alguns minutos de respiração consciente já fazem diferença no seu dia."
        onRepetir={reiniciar}
      />
    );
  }

  if (introducaoVisivel) {
    return (
      <div className="space-y-5 text-center">
        <p className="text-sm text-texto-suave">
          Uma pausa curta para respirar com atenção: inspire por 4 segundos, expire devagar por 6. Repita até
          completar 3 minutos.
        </p>
        <Botao type="button" onClick={comecar}>
          Começar
        </Botao>
      </div>
    );
  }

  const { fase } = calcularFaseRespiracao(cronometro.segundosDecorridos);
  const emExpansao = fase === 'inspire';

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div
          className={`h-40 w-40 rounded-full bg-salvia/40 transition-transform ease-in-out motion-reduce:transform-none ${
            emExpansao ? 'scale-100' : 'scale-75'
          }`}
          style={{ transitionDuration: `${emExpansao ? DURACAO_INSPIRAR_S : DURACAO_EXPIRAR_S}s` }}
        />
      </div>
      <p aria-live="polite" className="font-display text-xl text-texto">
        {fase === 'inspire' ? 'Inspire' : 'Expire devagar'}
      </p>
      <Cronometro segundosRestantes={cronometro.segundosRestantes} duracaoTotalS={DURACAO_TOTAL_S} />
      <ControlesSessao
        estado={cronometro.estado}
        onPausar={cronometro.pausar}
        onContinuar={cronometro.continuar}
        onReiniciar={reiniciar}
      />
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual smoke test**

Run: `npm run dev`, open `/praticas/respiracao` in the browser. Confirm: intro text + "Começar" shows first; clicking it starts the circle animating and the countdown from 3:00; "Pausar" freezes it; "Continuar" resumes; "Reiniciar" goes back to the intro screen. (Full cross-width/reduced-motion verification happens in Task 15.)

- [ ] **Step 5: Commit**

```bash
git add src/app/praticas/respiracao/
git commit -m "feat: add the guided breathing practice page"
```

---

## Task 11: Diário guiado (`/praticas/diario-guiado`)

**Files:**
- Create: `src/app/praticas/diario-guiado/page.tsx`
- Create: `src/app/praticas/diario-guiado/DiarioGuiadoClient.tsx`

**Interfaces:**
- Consumes: `obterPraticaPorId` (Task 1), `PERGUNTAS_DIARIO_GUIADO` (Task 1), `usePersistedState` (Task 2), `registrarConclusao` (Task 3), `IndicadorEtapas`, `TelaConclusao`, `CabecalhoPratica` (Task 9), `NavegacaoInferior`, `Botao` (existing).

- [ ] **Step 1: Write the server page**

```tsx
// src/app/praticas/diario-guiado/page.tsx
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import CabecalhoPratica from '@/app/components/praticas/CabecalhoPratica';
import { obterPraticaPorId } from '@/lib/praticas-conteudo/dados';
import DiarioGuiadoClient from './DiarioGuiadoClient';

export default async function DiarioGuiadoPage() {
  const pratica = obterPraticaPorId('diario-guiado');
  if (!pratica) notFound();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto max-w-md space-y-6 px-4 pt-6 pb-24 md:pb-8">
      <CabecalhoPratica pratica={pratica} />
      <DiarioGuiadoClient pratica={pratica} usuariaId={user?.id ?? 'anonima'} />
      <NavegacaoInferior />
    </main>
  );
}
```

- [ ] **Step 2: Write the client flow**

```tsx
// src/app/praticas/diario-guiado/DiarioGuiadoClient.tsx
'use client';

import { useRef, useState } from 'react';
import type { PraticaRapida } from '@/lib/praticas-conteudo/tipos';
import { PERGUNTAS_DIARIO_GUIADO } from '@/lib/praticas-conteudo/perguntasDiarioGuiado';
import { usePersistedState } from '@/lib/persistencia-local/usePersistedState';
import { registrarConclusao } from '@/lib/praticas-progresso/armazenamento';
import IndicadorEtapas from '@/app/components/praticas/IndicadorEtapas';
import TelaConclusao from '@/app/components/praticas/TelaConclusao';
import Botao from '@/app/components/Botao';

function dataDeHoje(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function DiarioGuiadoClient({
  pratica,
  usuariaId,
}: {
  pratica: PraticaRapida;
  usuariaId: string;
}) {
  const chave = `praticas:diario:${usuariaId}:${dataDeHoje()}`;
  const [respostas, setRespostas, limparRespostas] = usePersistedState<string[]>(
    chave,
    PERGUNTAS_DIARIO_GUIADO.map(() => '')
  );
  const [etapa, setEtapa] = useState(0);
  const [concluido, setConcluido] = useState(false);
  const registradoRef = useRef(false);

  const totalEtapas = PERGUNTAS_DIARIO_GUIADO.length;
  const ultimaEtapa = etapa === totalEtapas - 1;

  function atualizarResposta(texto: string) {
    const proximas = [...respostas];
    proximas[etapa] = texto;
    setRespostas(proximas);
  }

  function limparRespostaAtual() {
    const confirmado = window.confirm('Tem certeza que quer apagar o que você escreveu nesta etapa?');
    if (!confirmado) return;
    const proximas = [...respostas];
    proximas[etapa] = '';
    setRespostas(proximas);
  }

  function concluirReflexao() {
    if (registradoRef.current) return;
    registradoRef.current = true;
    registrarConclusao({
      praticaId: pratica.id,
      usuariaId,
      concluidaEm: new Date().toISOString(),
      duracaoMinutos: pratica.duracaoMinutos,
    });
    limparRespostas();
    setConcluido(true);
  }

  if (concluido) {
    return (
      <TelaConclusao
        titulo="Reflexão concluída"
        mensagem="Obrigada por se dedicar um tempo para se ouvir hoje. Essas respostas ficam só entre você e você mesma."
      />
    );
  }

  return (
    <div className="space-y-5">
      <IndicadorEtapas etapaAtual={etapa + 1} totalEtapas={totalEtapas} />
      <div className="space-y-3">
        <p className="font-display text-lg text-texto">{PERGUNTAS_DIARIO_GUIADO[etapa]}</p>
        <textarea
          value={respostas[etapa]}
          onChange={(evento) => atualizarResposta(evento.target.value)}
          rows={6}
          placeholder="Escreva à vontade..."
          aria-label={PERGUNTAS_DIARIO_GUIADO[etapa]}
          className="w-full resize-none rounded-2xl border border-borda bg-superficie p-4 text-texto placeholder:text-texto-suave/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60"
        />
        {respostas[etapa].length > 0 && (
          <button
            type="button"
            onClick={limparRespostaAtual}
            className="text-xs font-medium text-texto-suave underline-offset-2 hover:underline"
          >
            Limpar resposta
          </button>
        )}
      </div>
      <div className="flex gap-3">
        {etapa > 0 && (
          <Botao type="button" variante="secundaria" onClick={() => setEtapa(etapa - 1)} className="flex-1">
            Voltar
          </Botao>
        )}
        {ultimaEtapa ? (
          <Botao type="button" onClick={concluirReflexao} className="flex-1">
            Concluir reflexão
          </Botao>
        ) : (
          <Botao type="button" onClick={() => setEtapa(etapa + 1)} className="flex-1">
            Continuar
          </Botao>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual smoke test**

Run: `npm run dev`, open `/praticas/diario-guiado`. Type an answer, click "Continuar", go back with "Voltar" and confirm the text is still there. Reload the page mid-way and confirm the draft survives (autosave). Click "Limpar resposta" on a filled step and confirm the browser `confirm()` dialog appears before it clears. Finish all 4 steps and confirm "Concluir reflexão" shows the completion message and the draft is gone from `localStorage` (dev tools → Application → Local Storage).

- [ ] **Step 5: Commit**

```bash
git add src/app/praticas/diario-guiado/
git commit -m "feat: add the guided journal practice page"
```

---

## Task 12: Meditação (`/praticas/meditacao`)

**Files:**
- Create: `src/app/praticas/meditacao/page.tsx`
- Create: `src/app/praticas/meditacao/MeditacaoClient.tsx`

**Interfaces:**
- Consumes: `obterPraticaPorId` (Task 1), `FRASES_MEDITACAO`, `obterIndiceFrase` (Task 6), `useCronometroRegressivo` (Task 4), `registrarConclusao` (Task 3), `Cronometro`, `ControlesSessao`, `TelaConclusao`, `PlayerAudio`, `CabecalhoPratica` (Task 9), `NavegacaoInferior`, `Botao` (existing).

- [ ] **Step 1: Write the server page**

```tsx
// src/app/praticas/meditacao/page.tsx
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import CabecalhoPratica from '@/app/components/praticas/CabecalhoPratica';
import { obterPraticaPorId } from '@/lib/praticas-conteudo/dados';
import MeditacaoClient from './MeditacaoClient';

export default async function MeditacaoPage() {
  const pratica = obterPraticaPorId('meditacao');
  if (!pratica) notFound();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto max-w-md space-y-6 px-4 pt-6 pb-24 md:pb-8">
      <CabecalhoPratica pratica={pratica} />
      <MeditacaoClient pratica={pratica} usuariaId={user?.id ?? 'anonima'} />
      <NavegacaoInferior />
    </main>
  );
}
```

- [ ] **Step 2: Write the client flow**

```tsx
// src/app/praticas/meditacao/MeditacaoClient.tsx
'use client';

import { useRef, useState } from 'react';
import type { PraticaRapida } from '@/lib/praticas-conteudo/tipos';
import { useCronometroRegressivo } from '@/lib/praticas-conteudo/useCronometroRegressivo';
import { FRASES_MEDITACAO, obterIndiceFrase } from '@/lib/praticas-conteudo/frasesMeditacao';
import { registrarConclusao } from '@/lib/praticas-progresso/armazenamento';
import Cronometro from '@/app/components/praticas/Cronometro';
import ControlesSessao from '@/app/components/praticas/ControlesSessao';
import TelaConclusao from '@/app/components/praticas/TelaConclusao';
import PlayerAudio from '@/app/components/praticas/PlayerAudio';
import Botao from '@/app/components/Botao';

const DURACAO_TOTAL_S = 8 * 60;

export default function MeditacaoClient({
  pratica,
  usuariaId,
}: {
  pratica: PraticaRapida;
  usuariaId: string;
}) {
  const [introducaoVisivel, setIntroducaoVisivel] = useState(true);
  const registradoRef = useRef(false);

  const cronometro = useCronometroRegressivo(DURACAO_TOTAL_S, () => {
    if (registradoRef.current) return;
    registradoRef.current = true;
    registrarConclusao({
      praticaId: pratica.id,
      usuariaId,
      concluidaEm: new Date().toISOString(),
      duracaoMinutos: pratica.duracaoMinutos,
    });
  });

  function comecar() {
    setIntroducaoVisivel(false);
    registradoRef.current = false;
    cronometro.iniciar();
  }

  function reiniciar() {
    registradoRef.current = false;
    cronometro.reiniciar();
    setIntroducaoVisivel(true);
  }

  if (cronometro.estado === 'concluido') {
    return (
      <TelaConclusao
        titulo="Meditação concluída"
        mensagem='Você reservou um tempo só seu hoje. Leve essa presença para o resto do dia.'
        onRepetir={reiniciar}
      />
    );
  }

  if (introducaoVisivel) {
    return (
      <div className="space-y-5 text-center">
        <p className="text-sm text-texto-suave">
          Encontre uma posição confortável. Nos próximos 8 minutos, você só precisa estar presente — sem se
          cobrar por "fazer certo".
        </p>
        <Botao type="button" onClick={comecar}>
          Começar meditação
        </Botao>
      </div>
    );
  }

  const indiceFrase = obterIndiceFrase(cronometro.segundosDecorridos, FRASES_MEDITACAO.length);

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="h-32 w-32 rounded-full bg-lilas-suave motion-safe:animate-pulse motion-reduce:animate-none" />
      </div>
      <p aria-live="polite" className="min-h-12 text-texto-suave">
        {FRASES_MEDITACAO[indiceFrase]}
      </p>
      <Cronometro segundosRestantes={cronometro.segundosRestantes} duracaoTotalS={DURACAO_TOTAL_S} />
      <ControlesSessao
        estado={cronometro.estado}
        onPausar={cronometro.pausar}
        onContinuar={cronometro.continuar}
        onReiniciar={reiniciar}
      />
      <PlayerAudio url={pratica.midia.url} titulo={pratica.titulo} />
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual smoke test**

Run: `npm run dev`, open `/praticas/meditacao`. Confirm intro → "Começar meditação" → 8:00 countdown + rotating phrase + "áudio guiado em breve" placeholder (no broken player, no fake URL). Pausar/Continuar/Reiniciar work like Respiração.

- [ ] **Step 5: Commit**

```bash
git add src/app/praticas/meditacao/
git commit -m "feat: add the meditation practice page"
```

---

## Task 13: Exercício de autocompaixão (`/praticas/autocompaixao`)

**Files:**
- Create: `src/app/praticas/autocompaixao/page.tsx`
- Create: `src/app/praticas/autocompaixao/AutocompaixaoClient.tsx`

**Interfaces:**
- Consumes: `obterPraticaPorId` (Task 1), `ETAPAS_AUTOCOMPAIXAO`, `EtapaAutocompaixao` (Task 1), `usePersistedState` (Task 2), `registrarConclusao` (Task 3), `IndicadorEtapas`, `TelaConclusao`, `CabecalhoPratica` (Task 9), `NavegacaoInferior`, `Botao` (existing).

- [ ] **Step 1: Write the server page**

```tsx
// src/app/praticas/autocompaixao/page.tsx
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import CabecalhoPratica from '@/app/components/praticas/CabecalhoPratica';
import { obterPraticaPorId } from '@/lib/praticas-conteudo/dados';
import AutocompaixaoClient from './AutocompaixaoClient';

export default async function AutocompaixaoPage() {
  const pratica = obterPraticaPorId('autocompaixao');
  if (!pratica) notFound();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto max-w-md space-y-6 px-4 pt-6 pb-24 md:pb-8">
      <CabecalhoPratica pratica={pratica} />
      <AutocompaixaoClient pratica={pratica} usuariaId={user?.id ?? 'anonima'} />
      <NavegacaoInferior />
    </main>
  );
}
```

- [ ] **Step 2: Write the client flow**

```tsx
// src/app/praticas/autocompaixao/AutocompaixaoClient.tsx
'use client';

import { useRef, useState } from 'react';
import type { PraticaRapida } from '@/lib/praticas-conteudo/tipos';
import { ETAPAS_AUTOCOMPAIXAO } from '@/lib/praticas-conteudo/etapasAutocompaixao';
import { usePersistedState } from '@/lib/persistencia-local/usePersistedState';
import { registrarConclusao } from '@/lib/praticas-progresso/armazenamento';
import IndicadorEtapas from '@/app/components/praticas/IndicadorEtapas';
import TelaConclusao from '@/app/components/praticas/TelaConclusao';
import Botao from '@/app/components/Botao';

function dataDeHoje(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AutocompaixaoClient({
  pratica,
  usuariaId,
}: {
  pratica: PraticaRapida;
  usuariaId: string;
}) {
  const chave = `praticas:autocompaixao:${usuariaId}:${dataDeHoje()}`;
  const [respostas, setRespostas, limparRespostas] = usePersistedState<string[]>(
    chave,
    ETAPAS_AUTOCOMPAIXAO.map(() => '')
  );
  const [etapa, setEtapa] = useState(0);
  const [concluido, setConcluido] = useState(false);
  const registradoRef = useRef(false);

  const totalEtapas = ETAPAS_AUTOCOMPAIXAO.length;
  const etapaAtual = ETAPAS_AUTOCOMPAIXAO[etapa];
  const ultimaEtapa = etapa === totalEtapas - 1;

  function atualizarResposta(texto: string) {
    const proximas = [...respostas];
    proximas[etapa] = texto;
    setRespostas(proximas);
  }

  function concluirExercicio() {
    if (registradoRef.current) return;
    registradoRef.current = true;
    registrarConclusao({
      praticaId: pratica.id,
      usuariaId,
      concluidaEm: new Date().toISOString(),
      duracaoMinutos: pratica.duracaoMinutos,
    });
    limparRespostas();
    setConcluido(true);
  }

  if (concluido) {
    return (
      <TelaConclusao
        titulo="Exercício concluído"
        mensagem="Que bom que você reservou esse tempo para si. Volte a essas palavras sempre que precisar."
      />
    );
  }

  return (
    <div className="space-y-5">
      <IndicadorEtapas etapaAtual={etapa + 1} totalEtapas={totalEtapas} />
      <div className="space-y-3">
        <p className="font-display text-lg text-texto">{etapaAtual.titulo}</p>
        {etapaAtual.texto && <p className="text-sm text-texto-suave">{etapaAtual.texto}</p>}
        {etapaAtual.pergunta && (
          <>
            <p className="text-sm text-texto-suave">{etapaAtual.pergunta}</p>
            <textarea
              value={respostas[etapa]}
              onChange={(evento) => atualizarResposta(evento.target.value)}
              rows={5}
              placeholder="Escreva à vontade..."
              aria-label={etapaAtual.pergunta}
              className="w-full resize-none rounded-2xl border border-borda bg-superficie p-4 text-texto placeholder:text-texto-suave/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60"
            />
          </>
        )}
      </div>
      <div className="flex gap-3">
        {etapa > 0 && (
          <Botao type="button" variante="secundaria" onClick={() => setEtapa(etapa - 1)} className="flex-1">
            Voltar
          </Botao>
        )}
        {ultimaEtapa ? (
          <Botao type="button" onClick={concluirExercicio} className="flex-1">
            Concluir exercício
          </Botao>
        ) : (
          <Botao type="button" onClick={() => setEtapa(etapa + 1)} className="flex-1">
            Continuar
          </Botao>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual smoke test**

Run: `npm run dev`, open `/praticas/autocompaixao`. Confirm the 4 steps show the exact titles/texts/questions from the spec, read-only steps (2) show no textarea, reflection steps (1, 3, 4) do, and "Concluir exercício" on step 4 shows the completion message.

- [ ] **Step 5: Commit**

```bash
git add src/app/praticas/autocompaixao/
git commit -m "feat: add the self-compassion practice page"
```

---

## Task 14: Full verification pass

**Files:** none created; this task only runs checks and fixes anything they surface.

- [ ] **Step 1: Type-check the whole project**

Run: `npx tsc --noEmit`
Expected: no errors. Fix any and re-run until clean.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors. Fix any and re-run until clean.

- [ ] **Step 3: Run the full test suite**

Run: `npx vitest run`
Expected: all tests pass, including the new ones from Tasks 1–6 and every pre-existing test (confirms nothing in `NavegacaoInferior` or `/praticas` broke anything else, e.g. `emAndamento.test.ts`, `derivacoes.test.ts`).

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: production build succeeds with no errors (this also catches any Server/Client Component boundary mistakes that `tsc`/`vitest` wouldn't).

- [ ] **Step 5: Manual browser pass — desktop-sized quick check**

Run: `npm run dev`, open `/praticas`. Confirm:
- Header: "Práticas" title (serif) + "Atividades rápidas para cuidar de você hoje" subtitle + small flower illustration top-right.
- 4 cards in order: Respiração (sage), Diário guiado (peach), Meditação (lilac), Exercício de autocompaixão (pink) — correct colors, icon circles, duration capsules ("3 min"/"5 min"/"8 min"/"5 min"), chevron on the right.
- Bottom nav: "Práticas" active with a filled maroon circle behind its icon and maroon label; click through Início/Jornadas/Progresso/Perfil and confirm each shows the same active-circle treatment, and Jornadas/Início pages still look/work exactly as before (no visual regression from the shared `NavegacaoInferior` change).

- [ ] **Step 6: Manual browser pass — responsive widths**

Using the browser's responsive mode, check `/praticas` at 360px, 390px, and 430px widths:
- No horizontal scrolling at any width.
- "Exercício de autocompaixão" title doesn't overflow or wrap awkwardly in its card at 360px.
- Duration capsule and chevron never get pushed off/overlapped by the title+description text (description truncates with `...` instead).
- Cards don't touch the screen edges (16px-ish side margin preserved).

- [ ] **Step 7: Manual browser pass — each practice flow end-to-end**

- `/praticas/respiracao`: intro → Começar → circle animates + "Inspire"/"Expire devagar" alternate + 3:00 counts down → Pausar freezes it → Continuar resumes → Reiniciar goes back to intro. Let it run to completion (or temporarily lower `DURACAO_TOTAL_S` locally to verify, then revert) and confirm the "Respiração concluída" screen appears with a working "Repetir" and "Voltar para Práticas" link.
- `/praticas/diario-guiado`: step through all 4 questions, confirm autosave survives a page reload mid-way, confirm "Limpar resposta" asks for confirmation, confirm "Concluir reflexão" shows the completion message and the draft is cleared from `localStorage`.
- `/praticas/meditacao`: intro → Começar meditação → 8:00 countdown + rotating phrases + subtle pulsing circle + "áudio guiado em breve" text (no broken audio element, no console errors) → Pausar/Continuar/Reiniciar work.
- `/praticas/autocompaixao`: step through all 4 steps (2 read-only, 2 with textareas), confirm "Concluir exercício" on the last step shows the completion message.
- Double-tap "Concluir"/finish actions (or reload right after finishing) on each flow and confirm no duplicate completion is recorded — inspect `localStorage` key `praticas:conclusoes:<usuariaId>:<data>` in dev tools and confirm only one entry per completed run.

- [ ] **Step 8: `prefers-reduced-motion` check**

In the browser, enable "Emulate CSS media feature prefers-reduced-motion: reduce" (Chrome DevTools → Rendering tab) and reload `/praticas/respiracao` and `/praticas/meditacao`. Confirm the breathing circle stops scaling and the meditation circle stops pulsing, while the countdown and instructions still work normally.

- [ ] **Step 9: Side-by-side comparison with the reference mockup**

Compare the running `/praticas` page against the attached mockup image: header position/size, illustration position/size, card height/width, practice order, card colors, icon-circle size/position, title typography, description alignment, duration capsules, arrow position, spacing between cards, and the bottom nav's selected state. Note and fix any visible mismatch.

- [ ] **Step 10: Final commit (only if Steps 1–9 required fixes)**

```bash
git add -A
git commit -m "fix: address issues found during final verification of the Práticas page"
```

If no fixes were needed, skip this step — there's nothing to commit.

---

## Self-Review Notes (for the plan author, not a task)

- **Spec coverage:** header/illustration (Task 7), 4 cards with exact colors/copy/durations (Task 1 + 7), nav active-state circle + safe area (Task 8), all 4 interactive practices with begin/pause/resume/restart/complete where applicable (Tasks 10–13), journal + self-compassion autosave and discard-confirmation (Tasks 11, 13), reusable audio player wired for a future URL (Task 9 `PlayerAudio` + Task 1 `midia.url`), isolated local completion tracking preventing duplicates (Task 3), accessibility (`aria-live`, focus rings, `aria-label`s, `motion-reduce`) threaded through every UI task — all covered.
- **Type consistency checked:** `PraticaRapida`/`obterPraticaPorId` (Task 1) used identically in Tasks 7, 9–13. `EstadoCronometro`/`useCronometroRegressivo` return shape (Task 4) matches usage in `ControlesSessao` (Task 9) and both client flows (Tasks 10, 12). `ConclusaoPratica`/`registrarConclusao` (Task 3) called with the same field names everywhere it's used (Tasks 10–13). `usePersistedState`'s `[valor, definir, limpar]` tuple (Task 2) matches its usage in Tasks 11 and 13.
- **Old `/praticas/[id]` route:** confirmed via repo grep that nothing besides the now-replaced `src/app/praticas/page.tsx` linked to it, so leaving it in place per spec §2 doesn't orphan a route users could otherwise still reach through the UI.
