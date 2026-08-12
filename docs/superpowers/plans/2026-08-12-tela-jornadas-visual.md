# Tela de Jornadas — Redesenho Visual Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesenhar `/jornadas` com uma "Sua jornada atual" em destaque (card grande, ilustrado, com progresso e CTA) e uma seção "Explorar jornadas" (cartões ilustrados com estado/ação), reaproveitando 100% da lógica de ativação/troca de jornada já existente, e ajustando `resolverHrefAtividadeDoDia` (renomeada) para que a própria tela de Jornadas nunca ofereça um botão que só recarregaria a si mesma.

**Architecture:** Extensão do app Next.js (App Router) na branch `experiencia-completa`. Lógica com regras (módulo/sessão, resolução do link de atividade, atribuição de ilustração) fica em funções puras testadas com Vitest em `src/lib/jornadas/`; a página `/jornadas` e o novo helper de servidor `buscarJornadaAtivaParaExibir` são wiring fino sobre Supabase, verificados por checklist manual — mesmo padrão já usado no resto do projeto.

**Tech Stack:** Next.js 15 (App Router) + TypeScript, Tailwind CSS v4, Supabase, Vitest.

## Global Constraints

- Nenhuma mudança na lógica já existente: `AtivarJornadaButton`, `ativarJornada` (Server Action), `decidirTrocaDeJornada`, `BarraProgressoJornada` continuam exatamente como estão.
- Módulo/sessão são **calculados** a partir de `numero_dia`/`dias_completados`/`duracao_dias` — sem campo novo no banco. `calcularModuloSessao(numeroDia)`: `modulo = ceil(numeroDia / 7)`, `sessao = ((numeroDia - 1) % 7) + 1`.
- Ao exibir a sessão atual no card "Sua jornada atual", o dia de entrada é `Math.min(dias_completados + 1, duracao_dias)` — nunca mostra uma sessão além da duração da jornada. A busca da atividade real em `jornada_atividades` continua usando `dias_completados + 1` sem esse capping.
- "Tempo estimado da próxima sessão" é texto fixo `~5 minutos` — sem campo novo.
- Sem estado "bloqueada" nesta rodada — só disponível, pausada ("iniciada"), concluída.
- `resolverHrefAtividadeDoDia` é renomeada para `resolverLinkAtividadeDoDia` e passa a retornar `{ tipo: 'atividade'; href } | { tipo: 'checkin'; href } | { tipo: 'indisponivel' }` em vez de uma `string` — cada página decide como tratar `indisponivel`. Na início, `indisponivel` vira `href: '/jornadas'` (comportamento preservado). Na própria tela de Jornadas, `indisponivel` **nunca** produz um link para `/jornadas` no botão "Continuar jornada" — em vez de botão, mostra uma mensagem acolhedora.
- Ilustrações: 5 SVGs (flor, folha, onda, sol, lua), atribuídas por hash determinístico do ID da jornada, com resolução de colisão (desloca para o próximo índice livre) quando há alternativa entre as jornadas visíveis na tela — nunca aleatório, sempre reproduzível para a mesma lista/ordem de IDs.
- O card de "todas as jornadas concluídas" usa uma das 5 ilustrações SVG do sistema — nunca emoji.
- Depois de extrair o helper compartilhado `buscarJornadaAtivaParaExibir`, a tela de início precisa manter exatamente o mesmo comportamento de antes (check-in, atividade recomendada, links) — validado explicitamente na Tarefa 5.
- Link "Biblioteca de práticas" no rodapé de `/jornadas` é removido — redundante com a aba Práticas da navegação inferior.
- Sem migration nesta rodada — todos os dados já existem; só dois tokens de cor novos em CSS.

---

## Task 1: Cálculo de módulo e sessão (lógica pura)

**Files:**
- Create: `src/lib/jornadas/moduloSessao.ts`
- Test: `src/lib/jornadas/moduloSessao.test.ts`

**Interfaces:**
- Produces: `interface ModuloSessao { modulo: number; sessao: number }`, `calcularModuloSessao(numeroDia: number): ModuloSessao`. Consumido pela Task 8 (montagem final de `/jornadas`).

- [ ] **Step 1: Escrever os testes que falham**

Criar `src/lib/jornadas/moduloSessao.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { calcularModuloSessao } from './moduloSessao';

describe('calcularModuloSessao', () => {
  it('dia 1 é módulo 1, sessão 1', () => {
    expect(calcularModuloSessao(1)).toEqual({ modulo: 1, sessao: 1 });
  });

  it('dia 7 é módulo 1, sessão 7 (fim do primeiro módulo)', () => {
    expect(calcularModuloSessao(7)).toEqual({ modulo: 1, sessao: 7 });
  });

  it('dia 8 é módulo 2, sessão 1 (início do segundo módulo)', () => {
    expect(calcularModuloSessao(8)).toEqual({ modulo: 2, sessao: 1 });
  });

  it('dia 10 é módulo 2, sessão 3', () => {
    expect(calcularModuloSessao(10)).toEqual({ modulo: 2, sessao: 3 });
  });

  it('dia 14 é módulo 2, sessão 7', () => {
    expect(calcularModuloSessao(14)).toEqual({ modulo: 2, sessao: 7 });
  });

  it('dia 15 é módulo 3, sessão 1', () => {
    expect(calcularModuloSessao(15)).toEqual({ modulo: 3, sessao: 1 });
  });
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npm run test -- src/lib/jornadas/moduloSessao.test.ts`
Expected: FAIL com "Cannot find module './moduloSessao'"

- [ ] **Step 3: Implementar `calcularModuloSessao`**

Criar `src/lib/jornadas/moduloSessao.ts`:

```ts
export interface ModuloSessao {
  modulo: number;
  sessao: number;
}

export function calcularModuloSessao(numeroDia: number): ModuloSessao {
  return {
    modulo: Math.ceil(numeroDia / 7),
    sessao: ((numeroDia - 1) % 7) + 1,
  };
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npm run test -- src/lib/jornadas/moduloSessao.test.ts`
Expected: PASS (6 testes)

- [ ] **Step 5: Commit**

```bash
git add src/lib/jornadas/moduloSessao.ts src/lib/jornadas/moduloSessao.test.ts
git commit -m "feat: adicionar cálculo de módulo e sessão a partir do dia da jornada"
```

---

## Task 2: Ilustrações — hash determinístico e resolução de colisão (lógica pura)

**Files:**
- Create: `src/lib/jornadas/ilustracoes.ts`
- Test: `src/lib/jornadas/ilustracoes.test.ts`

**Interfaces:**
- Produces: `type IndiceIlustracao = 0 | 1 | 2 | 3 | 4`, `hashIlustracao(jornadaId: string): IndiceIlustracao`, `atribuirIlustracoes(jornadaIdsNaOrdemDeExibicao: string[]): Map<string, IndiceIlustracao>`. Consumidos pela Task 4 (componente `IlustracaoJornada`, que recebe o índice já resolvido) e pela Task 8 (montagem final, que chama `atribuirIlustracoes` uma vez com a lista completa de IDs visíveis).

- [ ] **Step 1: Escrever os testes que falham**

Criar `src/lib/jornadas/ilustracoes.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { hashIlustracao, atribuirIlustracoes } from './ilustracoes';

describe('hashIlustracao', () => {
  it('é determinístico — o mesmo ID sempre retorna o mesmo índice', () => {
    expect(hashIlustracao('jornada-abc')).toBe(hashIlustracao('jornada-abc'));
  });

  it('retorna os índices esperados para IDs de um único caractere', () => {
    // soma dos code points de um único caractere é o próprio code point;
    // 'd'=100, 'e'=101, 'a'=97, 'b'=98, 'c'=99 — mod 5 dá 0,1,2,3,4 respectivamente.
    expect(hashIlustracao('d')).toBe(0);
    expect(hashIlustracao('e')).toBe(1);
    expect(hashIlustracao('a')).toBe(2);
    expect(hashIlustracao('b')).toBe(3);
    expect(hashIlustracao('c')).toBe(4);
  });
});

describe('atribuirIlustracoes', () => {
  it('mantém os índices originais quando os hashes de entrada não colidem', () => {
    const ids = ['d', 'e', 'a', 'b', 'c'];
    const atribuicoes = atribuirIlustracoes(ids);
    expect(atribuicoes.get('d')).toBe(0);
    expect(atribuicoes.get('e')).toBe(1);
    expect(atribuicoes.get('a')).toBe(2);
    expect(atribuicoes.get('b')).toBe(3);
    expect(atribuicoes.get('c')).toBe(4);
  });

  it('resolve colisão de hash atribuindo o próximo índice livre, quando há alternativa', () => {
    // 5 caracteres repetidos sempre somam um múltiplo de 5 → todos colidem no índice 0 do hash bruto.
    const ids = ['aaaaa', 'bbbbb', 'ccccc', 'ddddd', 'eeeee'];
    expect(ids.every((id) => hashIlustracao(id) === 0)).toBe(true);

    const atribuicoes = atribuirIlustracoes(ids);
    expect(ids.map((id) => atribuicoes.get(id))).toEqual([0, 1, 2, 3, 4]);
  });

  it('permite repetição a partir da 6ª jornada visível, quando não há mais índice livre', () => {
    const ids = ['aaaaa', 'bbbbb', 'ccccc', 'ddddd', 'eeeee', 'fffff'];
    expect(hashIlustracao('fffff')).toBe(0);

    const atribuicoes = atribuirIlustracoes(ids);
    expect(atribuicoes.get('fffff')).toBe(0);
  });

  it('é determinística — a mesma lista na mesma ordem produz a mesma atribuição', () => {
    const ids = ['aaaaa', 'bbbbb', 'ccccc'];
    expect(atribuirIlustracoes(ids)).toEqual(atribuirIlustracoes(ids));
  });
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npm run test -- src/lib/jornadas/ilustracoes.test.ts`
Expected: FAIL com "Cannot find module './ilustracoes'"

- [ ] **Step 3: Implementar `hashIlustracao` e `atribuirIlustracoes`**

Criar `src/lib/jornadas/ilustracoes.ts`:

```ts
export type IndiceIlustracao = 0 | 1 | 2 | 3 | 4;

export function hashIlustracao(jornadaId: string): IndiceIlustracao {
  const soma = [...jornadaId].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return (soma % 5) as IndiceIlustracao;
}

export function atribuirIlustracoes(
  jornadaIdsNaOrdemDeExibicao: string[]
): Map<string, IndiceIlustracao> {
  const usados = new Set<IndiceIlustracao>();
  const atribuicoes = new Map<string, IndiceIlustracao>();

  for (const id of jornadaIdsNaOrdemDeExibicao) {
    let indice = hashIlustracao(id);

    if (usados.has(indice) && usados.size < 5) {
      for (let i = 1; i <= 5; i++) {
        const candidato = ((indice + i) % 5) as IndiceIlustracao;
        if (!usados.has(candidato)) {
          indice = candidato;
          break;
        }
      }
    }

    usados.add(indice);
    atribuicoes.set(id, indice);
  }

  return atribuicoes;
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npm run test -- src/lib/jornadas/ilustracoes.test.ts`
Expected: PASS (6 testes)

- [ ] **Step 5: Commit**

```bash
git add src/lib/jornadas/ilustracoes.ts src/lib/jornadas/ilustracoes.test.ts
git commit -m "feat: adicionar atribuição determinística de ilustração com resolução de colisão"
```

---

## Task 3: Renomear `resolverHrefAtividadeDoDia` para `resolverLinkAtividadeDoDia` (tipo com 3 casos)

**Files:**
- Modify: `src/lib/jornadas/emAndamento.ts` (arquivo inteiro)
- Modify: `src/lib/jornadas/emAndamento.test.ts` (arquivo inteiro)
- Modify: `src/app/page.tsx:4,64-74` (import e montagem do `href` de `JornadaEmAndamentoInfo`)

**Interfaces:**
- Consumes: nada de tasks anteriores deste plano.
- Produces: `export type ResultadoLinkAtividade = { tipo: 'atividade'; href: string } | { tipo: 'checkin'; href: string } | { tipo: 'indisponivel' }`, `resolverLinkAtividadeDoDia(atividadeId: string | null, checkinHojeId: string | null): ResultadoLinkAtividade`. `escolherJornadaAtivaMaisRecente` não muda. Consumidos pela Task 5 (`buscarJornadaAtivaParaExibir`) e pela Task 6 (`SuaJornadaAtual`, via o campo `linkAtividade` que a Task 5 produz).

- [ ] **Step 1: Atualizar os testes para o novo nome/retorno**

Substituir o conteúdo de `src/lib/jornadas/emAndamento.test.ts` por:

```ts
import { describe, it, expect } from 'vitest';
import {
  escolherJornadaAtivaMaisRecente,
  resolverLinkAtividadeDoDia,
  type JornadaAtivaResumo,
} from './emAndamento';

function jornada(overrides: Partial<JornadaAtivaResumo>): JornadaAtivaResumo {
  return {
    id: 'progresso-1',
    jornadaId: 'jornada-1',
    diasCompletados: 2,
    atualizadaEm: '2026-08-10T10:00:00.000Z',
    ...overrides,
  };
}

describe('escolherJornadaAtivaMaisRecente', () => {
  it('retorna null quando não há jornadas ativas', () => {
    expect(escolherJornadaAtivaMaisRecente([])).toBeNull();
  });

  it('retorna a única jornada quando há apenas uma', () => {
    const unica = jornada({ id: 'p1' });
    expect(escolherJornadaAtivaMaisRecente([unica])).toEqual(unica);
  });

  it('escolhe a jornada mais recentemente atualizada quando há mais de uma', () => {
    const antiga = jornada({ id: 'antiga', atualizadaEm: '2026-08-01T00:00:00.000Z' });
    const recente = jornada({ id: 'recente', atualizadaEm: '2026-08-11T00:00:00.000Z' });
    expect(escolherJornadaAtivaMaisRecente([antiga, recente])).toEqual(recente);
  });

  it('não depende da ordem de entrada da lista', () => {
    const antiga = jornada({ id: 'antiga', atualizadaEm: '2026-08-01T00:00:00.000Z' });
    const recente = jornada({ id: 'recente', atualizadaEm: '2026-08-11T00:00:00.000Z' });
    expect(escolherJornadaAtivaMaisRecente([recente, antiga])).toEqual(recente);
  });
});

describe('resolverLinkAtividadeDoDia', () => {
  it('retorna indisponivel quando não há atividade', () => {
    expect(resolverLinkAtividadeDoDia(null, null)).toEqual({ tipo: 'indisponivel' });
  });

  it('retorna indisponivel quando não há atividade, mesmo com check-in do dia', () => {
    expect(resolverLinkAtividadeDoDia(null, 'checkin-1')).toEqual({ tipo: 'indisponivel' });
  });

  it('retorna checkin quando há atividade mas ainda não houve check-in hoje', () => {
    expect(resolverLinkAtividadeDoDia('atividade-1', null)).toEqual({
      tipo: 'checkin',
      href: '/checkin',
    });
  });

  it('retorna atividade com o link completo quando ambos existem', () => {
    expect(resolverLinkAtividadeDoDia('atividade-1', 'checkin-1')).toEqual({
      tipo: 'atividade',
      href: '/jornada-atividade/atividade-1?checkin=checkin-1',
    });
  });
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npm run test -- src/lib/jornadas/emAndamento.test.ts`
Expected: FAIL — `resolverLinkAtividadeDoDia` ainda não existe.

- [ ] **Step 3: Implementar o novo tipo e a função renomeada**

Substituir o conteúdo de `src/lib/jornadas/emAndamento.ts` por:

```ts
export interface JornadaAtivaResumo {
  id: string;
  jornadaId: string;
  diasCompletados: number;
  atualizadaEm: string;
}

export function escolherJornadaAtivaMaisRecente(
  jornadasAtivas: JornadaAtivaResumo[]
): JornadaAtivaResumo | null {
  if (jornadasAtivas.length === 0) {
    return null;
  }
  return [...jornadasAtivas].sort(
    (a, b) => new Date(b.atualizadaEm).getTime() - new Date(a.atualizadaEm).getTime()
  )[0];
}

export type ResultadoLinkAtividade =
  | { tipo: 'atividade'; href: string }
  | { tipo: 'checkin'; href: string }
  | { tipo: 'indisponivel' };

export function resolverLinkAtividadeDoDia(
  atividadeId: string | null,
  checkinHojeId: string | null
): ResultadoLinkAtividade {
  if (!atividadeId) return { tipo: 'indisponivel' };
  return checkinHojeId
    ? { tipo: 'atividade', href: `/jornada-atividade/${atividadeId}?checkin=${checkinHojeId}` }
    : { tipo: 'checkin', href: '/checkin' };
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npm run test -- src/lib/jornadas/emAndamento.test.ts`
Expected: PASS (8 testes)

- [ ] **Step 5: Atualizar o único consumidor atual (início) para o novo nome/retorno**

Em `src/app/page.tsx`, trocar a linha do import:

```ts
import { escolherJornadaAtivaMaisRecente, resolverHrefAtividadeDoDia } from '@/lib/jornadas/emAndamento';
```

por:

```ts
import { escolherJornadaAtivaMaisRecente, resolverLinkAtividadeDoDia } from '@/lib/jornadas/emAndamento';
```

E trocar o bloco:

```tsx
    if (jornada) {
      jornadaEmAndamento = {
        titulo: jornada.titulo,
        descricao: jornada.descricao,
        diasCompletados: jornadaAtivaMaisRecente.diasCompletados,
        duracaoDias: jornada.duracao_dias,
        href: jaFezCheckinHoje
          ? '/jornadas'
          : resolverHrefAtividadeDoDia(atividadeDoDia?.id ?? null, checkinHojeId),
      };
    }
```

por:

```tsx
    if (jornada) {
      const linkAtividade = resolverLinkAtividadeDoDia(atividadeDoDia?.id ?? null, checkinHojeId);
      const href =
        jaFezCheckinHoje || linkAtividade.tipo === 'indisponivel' ? '/jornadas' : linkAtividade.href;

      jornadaEmAndamento = {
        titulo: jornada.titulo,
        descricao: jornada.descricao,
        diasCompletados: jornadaAtivaMaisRecente.diasCompletados,
        duracaoDias: jornada.duracao_dias,
        href,
      };
    }
```

(O restante de `src/app/page.tsx` não muda nesta task — a extração para o helper compartilhado é a Task 5.)

- [ ] **Step 6: Rodar typecheck, lint e a suíte completa**

Run: `npx tsc --noEmit && npx eslint . && npm run test`
Expected: sem erros; suíte completa passando (nenhum outro arquivo referencia `resolverHrefAtividadeDoDia`).

- [ ] **Step 7: Verificação manual — comportamento da início preservado**

Com uma conta logada: sem jornada ativa (card de jornada não aparece na início — igual a antes); com jornada ativa e atividade do dia disponível, sem check-in hoje (`href` do card leva a `/checkin` — igual a antes); com check-in feito hoje (`href` do card leva a `/jornadas` — igual a antes).

- [ ] **Step 8: Commit**

```bash
git add src/lib/jornadas/emAndamento.ts src/lib/jornadas/emAndamento.test.ts src/app/page.tsx
git commit -m "refactor: renomear resolverHrefAtividadeDoDia para resolverLinkAtividadeDoDia com tipo de 3 casos"
```

---

## Task 4: Tokens de cor + componente `IlustracaoJornada`

**Files:**
- Modify: `src/app/globals.css` (bloco `@theme`)
- Create: `src/app/components/jornadas/IlustracaoJornada.tsx`

**Interfaces:**
- Consumes: `IndiceIlustracao` (Task 2, só o tipo).
- Produces: componente `IlustracaoJornada({ indice: IndiceIlustracao; tamanho?: number })`. Consumido pelas Tasks 6, 7 e 8.

- [ ] **Step 1: Adicionar os dois tokens de cor novos**

Em `src/app/globals.css`, dentro do bloco `@theme` (que hoje termina com `--color-humor-5`), adicionar duas linhas novas ao final do bloco, mantendo todas as 13 já existentes:

```css
  --color-pessego: #E8B894;
  --color-salvia: #8FA888;
```

(Resultado: o bloco `@theme` passa a ter 15 tokens de cor no total — os 8 originais, os 5 de humor, e estes 2 novos.)

- [ ] **Step 2: Criar o componente `IlustracaoJornada`**

Criar `src/app/components/jornadas/IlustracaoJornada.tsx`:

```tsx
import type { IndiceIlustracao } from '@/lib/jornadas/ilustracoes';

const CORES: Record<IndiceIlustracao, string> = {
  0: '#B8697A', // flor — rosa queimado
  1: '#8FA888', // folha — verde sálvia
  2: '#B9A6D4', // onda — lilás
  3: '#E8B894', // sol — pêssego
  4: '#8677A8', // lua — lilás mais escuro
};

export default function IlustracaoJornada({
  indice,
  tamanho = 56,
}: {
  indice: IndiceIlustracao;
  tamanho?: number;
}) {
  const cor = CORES[indice];

  return (
    <svg
      aria-hidden="true"
      width={tamanho}
      height={tamanho}
      viewBox="0 0 56 56"
      fill="none"
      className="shrink-0 rounded-xl"
    >
      <rect width="56" height="56" rx="14" fill={cor} fillOpacity="0.2" />
      {indice === 0 && (
        <path
          d="M28 42c2-9 3-14 9-19-6-3-12 0-13 6-1-6-7-9-13-6 6 5 7 10 9 19z"
          fill={cor}
          fillOpacity="0.6"
        />
      )}
      {indice === 1 && (
        <path
          d="M18 38c2-10 3-15 10-20 7 5 8 10 10 20"
          stroke={cor}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      )}
      {indice === 2 && (
        <path
          d="M14 30c4-6 8-6 12 0s8 6 12 0 8-6 12 0"
          stroke={cor}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      )}
      {indice === 3 && <circle cx="28" cy="28" r="10" fill={cor} fillOpacity="0.65" />}
      {indice === 4 && (
        <path d="M32 16a13 13 0 1 0 8 20 10 10 0 0 1-8-20z" fill={cor} fillOpacity="0.65" />
      )}
    </svg>
  );
}
```

- [ ] **Step 3: Rodar typecheck e lint**

Run: `npx tsc --noEmit && npx eslint src/app/components/jornadas/IlustracaoJornada.tsx`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/app/components/jornadas/IlustracaoJornada.tsx
git commit -m "feat: adicionar tokens de cor pêssego/sálvia e componente IlustracaoJornada"
```

---

## Task 5: Helper de servidor `buscarJornadaAtivaParaExibir` + refatorar início para consumi-lo

**Files:**
- Create: `src/lib/jornadas/buscarJornadaAtivaParaExibir.ts`
- Modify: `src/app/page.tsx` (arquivo inteiro)

**Interfaces:**
- Consumes: `escolherJornadaAtivaMaisRecente`, `resolverLinkAtividadeDoDia`, `type ResultadoLinkAtividade` (Task 3).
- Produces: `interface JornadaAtivaParaExibir { jornadaId: string; titulo: string; descricao: string; duracaoDias: number; diasCompletados: number; linkAtividade: ResultadoLinkAtividade }`, `buscarJornadaAtivaParaExibir(supabase, usuariaId: string, checkinHojeId: string | null): Promise<JornadaAtivaParaExibir | null>`. Consumido pela Task 8 (`/jornadas`).

- [ ] **Step 1: Criar o helper compartilhado**

Criar `src/lib/jornadas/buscarJornadaAtivaParaExibir.ts`:

```ts
import type { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  escolherJornadaAtivaMaisRecente,
  resolverLinkAtividadeDoDia,
  type ResultadoLinkAtividade,
} from './emAndamento';

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export interface JornadaAtivaParaExibir {
  jornadaId: string;
  titulo: string;
  descricao: string;
  duracaoDias: number;
  diasCompletados: number;
  linkAtividade: ResultadoLinkAtividade;
}

export async function buscarJornadaAtivaParaExibir(
  supabase: SupabaseServerClient,
  usuariaId: string,
  checkinHojeId: string | null
): Promise<JornadaAtivaParaExibir | null> {
  const { data: jornadasAtivas } = await supabase
    .from('jornadas_usuarias')
    .select('id, jornada_id, dias_completados, atualizada_em')
    .eq('usuaria_id', usuariaId)
    .eq('status', 'em_andamento');

  const jornadaAtivaMaisRecente = escolherJornadaAtivaMaisRecente(
    (jornadasAtivas ?? []).map((j) => ({
      id: j.id,
      jornadaId: j.jornada_id,
      diasCompletados: j.dias_completados,
      atualizadaEm: j.atualizada_em,
    }))
  );

  if (!jornadaAtivaMaisRecente) {
    return null;
  }

  const [{ data: jornada }, { data: atividadeDoDia }] = await Promise.all([
    supabase
      .from('jornadas')
      .select('titulo, descricao, duracao_dias')
      .eq('id', jornadaAtivaMaisRecente.jornadaId)
      .single(),
    supabase
      .from('jornada_atividades')
      .select('id')
      .eq('jornada_id', jornadaAtivaMaisRecente.jornadaId)
      .eq('numero_dia', jornadaAtivaMaisRecente.diasCompletados + 1)
      .maybeSingle(),
  ]);

  if (!jornada) {
    return null;
  }

  return {
    jornadaId: jornadaAtivaMaisRecente.jornadaId,
    titulo: jornada.titulo,
    descricao: jornada.descricao,
    duracaoDias: jornada.duracao_dias,
    diasCompletados: jornadaAtivaMaisRecente.diasCompletados,
    linkAtividade: resolverLinkAtividadeDoDia(atividadeDoDia?.id ?? null, checkinHojeId),
  };
}
```

- [ ] **Step 2: Refatorar `src/app/page.tsx` para consumir o helper**

Substituir o conteúdo de `src/app/page.tsx` por:

```tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatDateISO } from '@/lib/date';
import { calcularProgresso7Dias } from '@/lib/progress/streak';
import { buscarJornadaAtivaParaExibir } from '@/lib/jornadas/buscarJornadaAtivaParaExibir';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import FundoDecorativo from '@/app/components/inicio/FundoDecorativo';
import Saudacao from '@/app/components/inicio/Saudacao';
import ResumoDoDia from '@/app/components/inicio/ResumoDoDia';
import RitualDeHoje from '@/app/components/inicio/RitualDeHoje';
import SeletorHumor from '@/app/components/inicio/SeletorHumor';
import SequenciaDias from '@/app/components/inicio/SequenciaDias';
import MensagemAcolhedora from '@/app/components/inicio/MensagemAcolhedora';
import JornadaEmAndamento, { type JornadaEmAndamentoInfo } from '@/app/components/inicio/JornadaEmAndamento';

export default async function InicioPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hoje = formatDateISO(new Date());

  const [{ data: perfil }, { data: checkinHoje }, { data: checkins }] = await Promise.all([
    supabase.from('perfis').select('nome').eq('id', user!.id).single(),
    supabase.from('checkins').select('*').eq('usuaria_id', user!.id).eq('data', hoje).maybeSingle(),
    supabase.from('checkins').select('data').eq('usuaria_id', user!.id),
  ]);

  const progresso = calcularProgresso7Dias((checkins ?? []).map((c) => c.data), new Date());
  const jaFezCheckinHoje = !!checkinHoje;
  const checkinHojeId: string | null = checkinHoje?.id ?? null;

  const jornadaAtiva = await buscarJornadaAtivaParaExibir(supabase, user!.id, checkinHojeId);

  let jornadaEmAndamento: JornadaEmAndamentoInfo | null = null;
  if (jornadaAtiva) {
    const href =
      jaFezCheckinHoje || jornadaAtiva.linkAtividade.tipo === 'indisponivel'
        ? '/jornadas'
        : jornadaAtiva.linkAtividade.href;

    jornadaEmAndamento = {
      titulo: jornadaAtiva.titulo,
      descricao: jornadaAtiva.descricao,
      diasCompletados: jornadaAtiva.diasCompletados,
      duracaoDias: jornadaAtiva.duracaoDias,
      href,
    };
  }

  return (
    <main className="relative mx-auto max-w-md space-y-6 overflow-hidden p-6 pb-24 md:pb-6">
      <FundoDecorativo />

      <Saudacao nome={perfil?.nome ?? null} />

      <ResumoDoDia checkinHoje={checkinHoje} />

      {!jaFezCheckinHoje && <SeletorHumor />}

      <RitualDeHoje jaFezCheckinHoje={jaFezCheckinHoje} />

      <SequenciaDias progresso={progresso} />

      <MensagemAcolhedora />

      <JornadaEmAndamento jornada={jornadaEmAndamento} />

      <NavegacaoInferior />
    </main>
  );
}
```

- [ ] **Step 3: Rodar typecheck, lint e a suíte completa**

Run: `npx tsc --noEmit && npx eslint . && npm run test`
Expected: sem erros; suíte completa passando.

- [ ] **Step 4: Rodar o build de produção**

Run: `npm run build`
Expected: build limpo.

- [ ] **Step 5: Validação explícita — a início não mudou de comportamento**

Comparar cada cenário com o comportamento documentado/testado antes desta task (checklist obrigatório, não pular):

1. **Sem jornada ativa:** card "Continue sua jornada" não aparece na início — igual a antes.
2. **Com jornada ativa, atividade do dia disponível, sem check-in hoje:** `href` do card é `/checkin` — igual a antes.
3. **Com jornada ativa, atividade do dia disponível, com check-in feito hoje:** `href` do card é `/jornadas` — igual a antes (mesmo resultado, agora vindo da checagem `jaFezCheckinHoje` combinada com o `linkAtividade.tipo` em vez de um `if` isolado).
4. **Com jornada ativa, sem check-in hoje, atividade do dia NÃO encontrada:** `href` do card é `/jornadas` — igual a antes (antes: `resolverHrefAtividadeDoDia` retornava `'/jornadas'` direto; agora: `linkAtividade.tipo === 'indisponivel'` cai no mesmo `'/jornadas'` via a nova checagem em `page.tsx`).
5. **`jaFezCheckinHoje` continua controlando a visibilidade de `SeletorHumor` e do botão em `RitualDeHoje`** exatamente como antes — nada nesta refatoração toca essa flag ou os componentes que a consomem.
6. **A escolha da jornada mais recentemente atualizada** (`escolherJornadaAtivaMaisRecente`, dentro do helper) continua idêntica — mesma função, sem mudança de assinatura.

- [ ] **Step 6: Commit**

```bash
git add src/lib/jornadas/buscarJornadaAtivaParaExibir.ts src/app/page.tsx
git commit -m "refactor: extrair buscarJornadaAtivaParaExibir e migrar a início para consumi-lo"
```

---

## Task 6: Componente `SuaJornadaAtual` (4 sub-estados)

**Files:**
- Create: `src/app/components/jornadas/SuaJornadaAtual.tsx`

**Interfaces:**
- Consumes: `type ResultadoLinkAtividade` (Task 3), `type IndiceIlustracao` (Task 2), `IlustracaoJornada` (Task 4), `BarraProgressoJornada` (já existente, sem mudança), `AtivarJornadaButton` (já existente em `src/app/jornadas/AtivarJornadaButton.tsx`, sem mudança).
- Produces: `export type SuaJornadaAtualProps = { tipo: 'ativa'; ... } | { tipo: 'recomendada'; ... } | { tipo: 'conquista'; ... } | { tipo: 'vazia' }` e o componente `SuaJornadaAtual(props: SuaJornadaAtualProps)`. Consumido pela Task 8.

- [ ] **Step 1: Criar o componente**

Criar `src/app/components/jornadas/SuaJornadaAtual.tsx`:

```tsx
import Link from 'next/link';
import Cartao from '@/app/components/Cartao';
import BarraProgressoJornada from '@/app/components/BarraProgressoJornada';
import AtivarJornadaButton from '@/app/jornadas/AtivarJornadaButton';
import IlustracaoJornada from './IlustracaoJornada';
import type { IndiceIlustracao } from '@/lib/jornadas/ilustracoes';
import type { ResultadoLinkAtividade } from '@/lib/jornadas/emAndamento';

export type SuaJornadaAtualProps =
  | {
      tipo: 'ativa';
      ilustracaoIndice: IndiceIlustracao;
      titulo: string;
      modulo: number;
      sessao: number;
      diasCompletados: number;
      duracaoDias: number;
      linkAtividade: ResultadoLinkAtividade;
    }
  | {
      tipo: 'recomendada';
      ilustracaoIndice: IndiceIlustracao;
      jornadaId: string;
      titulo: string;
      descricao: string;
    }
  | {
      tipo: 'conquista';
      ilustracaoIndice: IndiceIlustracao;
      jornadaId: string;
    }
  | { tipo: 'vazia' };

export default function SuaJornadaAtual(props: SuaJornadaAtualProps) {
  if (props.tipo === 'vazia') {
    return null;
  }

  if (props.tipo === 'ativa') {
    const percentual = Math.round((props.diasCompletados / props.duracaoDias) * 100);

    return (
      <div className="space-y-3">
        <p className="font-display text-lg text-texto">Sua jornada atual</p>
        <Cartao className="space-y-4 p-6">
          <IlustracaoJornada indice={props.ilustracaoIndice} tamanho={72} />
          <div className="space-y-1">
            <p className="font-display text-xl text-texto">{props.titulo}</p>
            <p className="text-sm text-texto-suave">
              Módulo {props.modulo} · Sessão {props.sessao}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm text-texto-suave">
              <span>Progresso</span>
              <span>{percentual}%</span>
            </div>
            <BarraProgressoJornada
              diasCompletados={props.diasCompletados}
              duracaoDias={props.duracaoDias}
            />
          </div>
          {props.linkAtividade.tipo === 'indisponivel' ? (
            <p className="text-sm text-texto-suave">
              O próximo conteúdo dessa jornada ainda está sendo preparado — volte em breve.
            </p>
          ) : (
            <>
              <p className="text-xs text-texto-suave">Próxima sessão: ~5 minutos</p>
              <Link
                href={props.linkAtividade.href}
                className="block w-full rounded-2xl bg-acao p-3 text-center font-medium text-white transition-colors hover:bg-acao/90"
              >
                Continuar jornada
              </Link>
            </>
          )}
          <p className="text-center text-sm italic text-texto-suave">
            Um passo de cada vez — você está indo bem.
          </p>
        </Cartao>
      </div>
    );
  }

  if (props.tipo === 'recomendada') {
    return (
      <div className="space-y-3">
        <p className="font-display text-lg text-texto">Sua jornada atual</p>
        <Cartao className="space-y-3 p-6 text-center">
          <div className="flex justify-center">
            <IlustracaoJornada indice={props.ilustracaoIndice} tamanho={72} />
          </div>
          <p className="font-display text-lg text-texto">{props.titulo}</p>
          <p className="text-sm text-texto-suave">{props.descricao}</p>
          <AtivarJornadaButton jornadaId={props.jornadaId} jaAtiva={false} label="Começar uma jornada" />
        </Cartao>
      </div>
    );
  }

  // props.tipo === 'conquista'
  return (
    <div className="space-y-3">
      <p className="font-display text-lg text-texto">Sua jornada atual</p>
      <Cartao className="space-y-3 p-6 text-center">
        <div className="flex justify-center">
          <IlustracaoJornada indice={props.ilustracaoIndice} tamanho={72} />
        </div>
        <p className="font-display text-lg text-texto">
          Você concluiu todas as suas jornadas disponíveis!
        </p>
        <p className="text-sm text-texto-suave">Que tal reviver uma delas com um novo olhar?</p>
        <AtivarJornadaButton jornadaId={props.jornadaId} jaAtiva={false} label="Revisitar jornada" />
      </Cartao>
    </div>
  );
}
```

- [ ] **Step 2: Rodar typecheck e lint**

Run: `npx tsc --noEmit && npx eslint src/app/components/jornadas/SuaJornadaAtual.tsx`
Expected: erro esperado apontando para `src/app/jornadas/page.tsx`, que ainda não foi atualizado para usar este componente — isso é resolvido na Task 8. Confirme que não há nenhum outro erro além desse (`SuaJornadaAtual.tsx` em si compila limpo — rode `npx eslint` só neste arquivo para confirmar isoladamente).

- [ ] **Step 3: Commit**

```bash
git add src/app/components/jornadas/SuaJornadaAtual.tsx
git commit -m "feat: adicionar componente SuaJornadaAtual com os 4 sub-estados"
```

---

## Task 7: Componente `CardJornadaExplorar`

**Files:**
- Create: `src/app/components/jornadas/CardJornadaExplorar.tsx`

**Interfaces:**
- Consumes: `type IndiceIlustracao` (Task 2), `IlustracaoJornada` (Task 4), `AtivarJornadaButton` (já existente).
- Produces: `export interface CardJornadaExplorarInfo { jornadaId: string; ilustracaoIndice: IndiceIlustracao; titulo: string; descricao: string; duracaoDias: number; quantidadeModulos: number; label: string }` e o componente `CardJornadaExplorar({ jornada: CardJornadaExplorarInfo })`. Consumido pela Task 8.

- [ ] **Step 1: Criar o componente**

Criar `src/app/components/jornadas/CardJornadaExplorar.tsx`:

```tsx
import Cartao from '@/app/components/Cartao';
import AtivarJornadaButton from '@/app/jornadas/AtivarJornadaButton';
import IlustracaoJornada from './IlustracaoJornada';
import type { IndiceIlustracao } from '@/lib/jornadas/ilustracoes';

export interface CardJornadaExplorarInfo {
  jornadaId: string;
  ilustracaoIndice: IndiceIlustracao;
  titulo: string;
  descricao: string;
  duracaoDias: number;
  quantidadeModulos: number;
  label: string;
}

export default function CardJornadaExplorar({ jornada }: { jornada: CardJornadaExplorarInfo }) {
  return (
    <Cartao className="flex gap-3">
      <IlustracaoJornada indice={jornada.ilustracaoIndice} />
      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <p className="font-display text-base text-texto">{jornada.titulo}</p>
          <p className="line-clamp-2 text-sm text-texto-suave">{jornada.descricao}</p>
        </div>
        <p className="text-xs text-texto-suave">
          {jornada.duracaoDias} dias · {jornada.quantidadeModulos} módulos
        </p>
        <AtivarJornadaButton jornadaId={jornada.jornadaId} jaAtiva={false} label={jornada.label} />
      </div>
    </Cartao>
  );
}
```

- [ ] **Step 2: Rodar typecheck e lint**

Run: `npx tsc --noEmit && npx eslint src/app/components/jornadas/CardJornadaExplorar.tsx`
Expected: mesmo erro pendente de `src/app/jornadas/page.tsx` da Task 6 (ainda não resolvido — Task 8), nenhum erro novo introduzido por este arquivo.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/jornadas/CardJornadaExplorar.tsx
git commit -m "feat: adicionar componente CardJornadaExplorar"
```

---

## Task 8: Montagem final da tela `/jornadas`

**Files:**
- Modify: `src/app/jornadas/page.tsx` (arquivo inteiro)

**Interfaces:**
- Consumes: tudo das Tasks 1–7 — `calcularModuloSessao` (Task 1), `atribuirIlustracoes` (Task 2), `buscarJornadaAtivaParaExibir` (Task 5), `SuaJornadaAtual`/`SuaJornadaAtualProps` (Task 6), `CardJornadaExplorar`/`CardJornadaExplorarInfo` (Task 7).

- [ ] **Step 1: Reescrever `src/app/jornadas/page.tsx`**

Substituir o conteúdo de `src/app/jornadas/page.tsx` por:

```tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatDateISO } from '@/lib/date';
import { buscarJornadaAtivaParaExibir } from '@/lib/jornadas/buscarJornadaAtivaParaExibir';
import { calcularModuloSessao } from '@/lib/jornadas/moduloSessao';
import { atribuirIlustracoes } from '@/lib/jornadas/ilustracoes';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import SuaJornadaAtual, { type SuaJornadaAtualProps } from '@/app/components/jornadas/SuaJornadaAtual';
import CardJornadaExplorar, {
  type CardJornadaExplorarInfo,
} from '@/app/components/jornadas/CardJornadaExplorar';

export default async function JornadasPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hoje = formatDateISO(new Date());

  const [{ data: checkinHoje }, { data: jornadas }, { data: progressos }] = await Promise.all([
    supabase.from('checkins').select('id').eq('usuaria_id', user!.id).eq('data', hoje).maybeSingle(),
    supabase.from('jornadas').select('*').eq('status', 'publicada').order('criado_em'),
    supabase.from('jornadas_usuarias').select('*').eq('usuaria_id', user!.id),
  ]);

  const checkinHojeId: string | null = checkinHoje?.id ?? null;
  const todasJornadas = jornadas ?? [];
  const progressoPorJornada = new Map((progressos ?? []).map((p) => [p.jornada_id, p]));

  const jornadaAtiva = await buscarJornadaAtivaParaExibir(supabase, user!.id, checkinHojeId);

  let jornadaDestaqueId: string | null = null;
  let tipoHero: 'ativa' | 'recomendada' | 'conquista' | 'vazia';

  if (jornadaAtiva) {
    jornadaDestaqueId = jornadaAtiva.jornadaId;
    tipoHero = 'ativa';
  } else {
    const naoConcluida = todasJornadas.find(
      (j) => progressoPorJornada.get(j.id)?.status !== 'concluida'
    );
    if (naoConcluida) {
      jornadaDestaqueId = naoConcluida.id;
      tipoHero = 'recomendada';
    } else if (todasJornadas.length > 0) {
      jornadaDestaqueId = todasJornadas[0].id;
      tipoHero = 'conquista';
    } else {
      tipoHero = 'vazia';
    }
  }

  const jornadasExplorar = todasJornadas.filter((j) => j.id !== jornadaDestaqueId);
  const idsNaOrdemDeExibicao = [
    ...(jornadaDestaqueId ? [jornadaDestaqueId] : []),
    ...jornadasExplorar.map((j) => j.id),
  ];
  const ilustracoes = atribuirIlustracoes(idsNaOrdemDeExibicao);
  const ilustracaoIndice = (id: string) => ilustracoes.get(id) ?? 0;

  let heroProps: SuaJornadaAtualProps;

  if (tipoHero === 'ativa' && jornadaAtiva) {
    const diaExibido = Math.min(jornadaAtiva.diasCompletados + 1, jornadaAtiva.duracaoDias);
    const { modulo, sessao } = calcularModuloSessao(diaExibido);
    heroProps = {
      tipo: 'ativa',
      ilustracaoIndice: ilustracaoIndice(jornadaAtiva.jornadaId),
      titulo: jornadaAtiva.titulo,
      modulo,
      sessao,
      diasCompletados: jornadaAtiva.diasCompletados,
      duracaoDias: jornadaAtiva.duracaoDias,
      linkAtividade: jornadaAtiva.linkAtividade,
    };
  } else if (tipoHero === 'recomendada' && jornadaDestaqueId) {
    const destaque = todasJornadas.find((j) => j.id === jornadaDestaqueId)!;
    heroProps = {
      tipo: 'recomendada',
      ilustracaoIndice: ilustracaoIndice(destaque.id),
      jornadaId: destaque.id,
      titulo: destaque.titulo,
      descricao: destaque.descricao,
    };
  } else if (tipoHero === 'conquista' && jornadaDestaqueId) {
    heroProps = {
      tipo: 'conquista',
      ilustracaoIndice: ilustracaoIndice(jornadaDestaqueId),
      jornadaId: jornadaDestaqueId,
    };
  } else {
    heroProps = { tipo: 'vazia' };
  }

  const cardsExplorar: CardJornadaExplorarInfo[] = jornadasExplorar.map((jornada) => {
    const progresso = progressoPorJornada.get(jornada.id);
    const label =
      progresso?.status === 'concluida'
        ? 'Revisitar jornada'
        : progresso?.status === 'pausada'
          ? 'Retomar'
          : 'Começar';

    return {
      jornadaId: jornada.id,
      ilustracaoIndice: ilustracaoIndice(jornada.id),
      titulo: jornada.titulo,
      descricao: jornada.descricao,
      duracaoDias: jornada.duracao_dias,
      quantidadeModulos: calcularModuloSessao(jornada.duracao_dias).modulo,
      label,
    };
  });

  return (
    <main className="mx-auto max-w-md space-y-6 p-6 pb-24 md:pb-6">
      <h1 className="font-display text-2xl text-texto">Jornadas</h1>

      <SuaJornadaAtual {...heroProps} />

      {cardsExplorar.length > 0 && (
        <div className="space-y-3">
          <p className="font-display text-lg text-texto">Explorar jornadas</p>
          <div className="space-y-3">
            {cardsExplorar.map((jornada) => (
              <CardJornadaExplorar key={jornada.jornadaId} jornada={jornada} />
            ))}
          </div>
        </div>
      )}

      <NavegacaoInferior />
    </main>
  );
}
```

- [ ] **Step 2: Rodar typecheck e lint em todo o projeto**

Run: `npx tsc --noEmit && npx eslint .`
Expected: sem erros — os erros pendentes das Tasks 6 e 7 (apontando para este arquivo) são resolvidos por esta reescrita.

- [ ] **Step 3: Rodar a suíte de testes completa**

Run: `npm run test`
Expected: PASS em todos os testes do projeto (incluindo os novos das Tasks 1, 2 e 3).

- [ ] **Step 4: Rodar o build de produção**

Run: `npm run build`
Expected: build limpo.

- [ ] **Step 5: Verificação manual completa (checklist)**

Rodar `npm run dev` e, logada, conferir cada cenário em `/jornadas`:

1. **Com jornada em andamento e atividade do dia disponível:** card "Sua jornada atual" mostra ilustração, título, "Módulo N · Sessão M", barra + percentual, "Próxima sessão: ~5 minutos", botão "Continuar jornada" levando ao lugar certo (atividade do dia com `?checkin=`, ou `/checkin` se ainda não fez o check-in hoje).
2. **Com jornada em andamento mas sem atividade cadastrada para o dia** (ajustar `dias_completados` manualmente via Table Editor para além do número de atividades da jornada): o botão "Continuar jornada" **não aparece** — em seu lugar, a mensagem "O próximo conteúdo dessa jornada ainda está sendo preparado — volte em breve." Confirme que **nenhum link para `/jornadas` aparece nesse card** (diferente do card da início, que ainda usa esse fallback).
3. **Sem jornada em andamento, com pelo menos uma jornada publicada não concluída:** card recomenda a jornada mais antiga por `criado_em` entre as não concluídas, com botão "Começar uma jornada".
4. **Sem jornada em andamento, todas as jornadas publicadas já concluídas pela usuária** (ajustar `jornadas_usuarias.status` para `'concluida'` em todas via Table Editor): card de conquista aparece, sem emoji, com uma das 5 ilustrações SVG e botão "Revisitar jornada".
5. **Nenhuma jornada publicada existe:** a seção "Sua jornada atual" inteira não aparece.
6. **Seção "Explorar jornadas":** cada estado (disponível → "Começar", pausada → "Retomar", concluída → "Revisitar jornada") mostra o botão certo; a jornada em destaque nunca se repete nesta lista.
7. **Ilustrações não se repetem** entre os cards visíveis quando há 5 ou menos jornadas na tela (destaque + explorar somados).
8. **Link "Biblioteca de práticas" não aparece mais** no rodapé da tela.
9. **Navegação inferior** continua funcionando normalmente (5 abas, incluindo Práticas separada).

- [ ] **Step 6: Commit**

```bash
git add src/app/jornadas/page.tsx
git commit -m "feat: montar tela de jornadas com destaque de jornada atual e cartões ilustrados"
```
