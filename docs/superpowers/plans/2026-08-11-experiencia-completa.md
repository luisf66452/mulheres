# Experiência Completa (Progresso, Histórico, Biblioteca) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar melhor sequência, gráfico de evolução, histórico de check-ins/rituais e uma biblioteca de práticas navegável livremente, usando só dados reais já existentes no Supabase — sem tocar no fluxo de check-in/recomendação/jornada já em produção.

**Architecture:** Funções puras testáveis para toda a lógica (melhor sequência, formatação de plural, estado do gráfico, coordenadas do gráfico), consumidas por Server Components que já seguem o padrão estabelecido no projeto (consulta direta ao Supabase + junção em memória via `Map`, sem sintaxe de embed do PostgREST). Nenhuma dependência nova — o gráfico é um SVG desenhado à mão.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS v4, Supabase, TypeScript, Vitest.

## Global Constraints

- Nenhuma migration, tabela, coluna, policy ou GRANT novo — todas as consultas usam campos e RLS já existentes, confirmados nas migrations `0001_init.sql` e `0003_jornadas.sql`.
- `checkins`: `usuaria_id`, `data` (date, único por usuária+dia), `humor`/`imagem_corporal`/`comida` (smallint 1-5), `criado_em`.
- `sessoes`: `checkin_id`, `usuaria_id`, `pratica_id` (nullable) **ou** `jornada_atividade_id` (nullable), nunca os dois.
- `praticas`/`jornadas`: RLS libera `select` pra qualquer usuária autenticada quando `status = 'publicada'`.
- Todas as consultas de dados da própria usuária filtram por `.eq('usuaria_id', user!.id)` — nunca confiar só na RLS, replicando o padrão duplo (app + banco) já usado em `/progresso` e `/checkin`.
- Zero dado fictício: estados vazios usam mensagem honesta, nunca placeholder que pareça dado real.
- Gráfico só mostra tendência com 2+ check-ins (0 → convite; 1 → incentivo a continuar).
- Plural correto em toda contagem de dias consecutivos: `formatarSequencia` — "0 dias seguidos" / "1 dia seguido" / "N dias seguidos". Nunca o placeholder `dia(s)`.
- As 4 abas da navegação permanecem: Início, Jornadas, Progresso, Perfil. `/praticas` não é uma aba nova — é alcançada por um link dentro de Jornadas, e a aba "Jornada" fica marcada como ativa também nessas rotas.
- O fluxo de check-in → prática recomendada / atividade de jornada (`checkin/actions.ts`, `pratica/[id]`, `jornada-atividade/[id]`, `AntesDepoisAtividade.tsx`) não é tocado por nenhuma tarefa deste plano.
- Estados de carregamento (`loading.tsx`), erro (mensagem honesta se a consulta falhar) e vazio são obrigatórios nas telas novas (`/praticas`, `/praticas/[id]`, e as três seções novas de `/progresso`) — não é um retrofit de telas antigas já revisadas.
- Nenhuma biblioteca de gráficos nova no `package.json`.

---

### Task 1: Melhor sequência e formatação de plural

**Files:**
- Modify: `src/lib/progress/streak.ts`
- Modify: `src/lib/progress/streak.test.ts`

**Interfaces:**
- Produces: `calcularMelhorSequencia(datasCheckin: string[]): number` e `formatarSequencia(dias: number): string`, exportadas de `src/lib/progress/streak.ts`. Consumidas pelas Tasks 4 e 8.

- [ ] **Step 1: Escrever os testes que falham**

Adicione ao final de `src/lib/progress/streak.test.ts`:

```ts
describe('calcularMelhorSequencia', () => {
  it('retorna 0 quando não há check-ins', () => {
    expect(calcularMelhorSequencia([])).toBe(0);
  });

  it('retorna 1 para um único check-in', () => {
    expect(calcularMelhorSequencia(['2026-08-10'])).toBe(1);
  });

  it('conta uma sequência simples de dias consecutivos', () => {
    const datas = ['2026-08-08', '2026-08-09', '2026-08-10'];
    expect(calcularMelhorSequencia(datas)).toBe(3);
  });

  it('ignora datas fora de ordem e retorna a maior sequência real', () => {
    const datas = ['2026-08-10', '2026-08-08', '2026-08-09'];
    expect(calcularMelhorSequencia(datas)).toBe(3);
  });

  it('encontra a melhor sequência mesmo quando não é a mais recente', () => {
    const datas = ['2026-08-01', '2026-08-02', '2026-08-03', '2026-08-05', '2026-08-07'];
    expect(calcularMelhorSequencia(datas)).toBe(3);
  });

  it('trata datas duplicadas como um único dia', () => {
    const datas = ['2026-08-01', '2026-08-01', '2026-08-02'];
    expect(calcularMelhorSequencia(datas)).toBe(2);
  });

  it('dias isolados (sem sequência) retornam melhor sequência 1', () => {
    const datas = ['2026-08-01', '2026-08-05', '2026-08-09'];
    expect(calcularMelhorSequencia(datas)).toBe(1);
  });
});

describe('formatarSequencia', () => {
  it('formata 0 dias', () => {
    expect(formatarSequencia(0)).toBe('0 dias seguidos');
  });

  it('formata 1 dia no singular', () => {
    expect(formatarSequencia(1)).toBe('1 dia seguido');
  });

  it('formata mais de 1 dia no plural', () => {
    expect(formatarSequencia(2)).toBe('2 dias seguidos');
    expect(formatarSequencia(10)).toBe('10 dias seguidos');
  });
});
```

E atualize o import no topo do arquivo de teste:

```ts
import { describe, it, expect } from 'vitest';
import { calcularProgresso7Dias, calcularMelhorSequencia, formatarSequencia } from './streak';
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npx vitest run src/lib/progress/streak.test.ts`
Expected: FAIL — `calcularMelhorSequencia`/`formatarSequencia` não existem em `./streak`.

- [ ] **Step 3: Implementar as duas funções**

Adicione ao final de `src/lib/progress/streak.ts` (mantendo tudo que já existe no arquivo intacto):

```ts
export function calcularMelhorSequencia(datasCheckin: string[]): number {
  if (datasCheckin.length === 0) {
    return 0;
  }

  const datasOrdenadas = Array.from(new Set(datasCheckin)).sort();

  let melhor = 1;
  let atual = 1;

  for (let i = 1; i < datasOrdenadas.length; i++) {
    const anterior = new Date(`${datasOrdenadas[i - 1]}T00:00:00`);
    const atualData = new Date(`${datasOrdenadas[i]}T00:00:00`);
    const diffDias = Math.round((atualData.getTime() - anterior.getTime()) / 86_400_000);

    atual = diffDias === 1 ? atual + 1 : 1;
    melhor = Math.max(melhor, atual);
  }

  return melhor;
}

export function formatarSequencia(dias: number): string {
  if (dias === 1) {
    return '1 dia seguido';
  }
  return `${dias} dias seguidos`;
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npx vitest run src/lib/progress/streak.test.ts`
Expected: PASS — todos os testes, incluindo os já existentes de `calcularProgresso7Dias`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/progress/streak.ts src/lib/progress/streak.test.ts
git commit -m "feat: adicionar calcularMelhorSequencia e formatarSequencia"
```

---

### Task 2: Estado do gráfico de evolução

**Files:**
- Create: `src/lib/grafico/estado.ts`
- Create: `src/lib/grafico/estado.test.ts`

**Interfaces:**
- Produces: `type EstadoGrafico = 'sem_dados' | 'poucos_dados' | 'com_tendencia'` e `decidirEstadoGrafico(quantidadeCheckins: number): EstadoGrafico`, exportadas de `src/lib/grafico/estado.ts`. Consumida pela Task 8 (`GraficoEvolucao.tsx`).

- [ ] **Step 1: Escrever o teste que falha**

Crie `src/lib/grafico/estado.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { decidirEstadoGrafico } from './estado';

describe('decidirEstadoGrafico', () => {
  it('retorna sem_dados quando não há check-ins', () => {
    expect(decidirEstadoGrafico(0)).toBe('sem_dados');
  });

  it('retorna poucos_dados com exatamente 1 check-in', () => {
    expect(decidirEstadoGrafico(1)).toBe('poucos_dados');
  });

  it('retorna com_tendencia com 2 check-ins', () => {
    expect(decidirEstadoGrafico(2)).toBe('com_tendencia');
  });

  it('retorna com_tendencia com muitos check-ins', () => {
    expect(decidirEstadoGrafico(30)).toBe('com_tendencia');
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/lib/grafico/estado.test.ts`
Expected: FAIL — o módulo `./estado` não existe.

- [ ] **Step 3: Implementar**

Crie `src/lib/grafico/estado.ts`:

```ts
export type EstadoGrafico = 'sem_dados' | 'poucos_dados' | 'com_tendencia';

export function decidirEstadoGrafico(quantidadeCheckins: number): EstadoGrafico {
  if (quantidadeCheckins === 0) {
    return 'sem_dados';
  }
  if (quantidadeCheckins === 1) {
    return 'poucos_dados';
  }
  return 'com_tendencia';
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run src/lib/grafico/estado.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/grafico/estado.ts src/lib/grafico/estado.test.ts
git commit -m "feat: adicionar decidirEstadoGrafico"
```

---

### Task 3: Coordenadas do gráfico de evolução

**Files:**
- Create: `src/lib/grafico/pontos.ts`
- Create: `src/lib/grafico/pontos.test.ts`

**Interfaces:**
- Produces: `interface PontoGrafico { x: number; y: number }` e `calcularPontosLinha(valores: number[], largura: number, altura: number): PontoGrafico[]`, exportadas de `src/lib/grafico/pontos.ts`. Assume valores na escala 1–5 (a mesma escala de `humor`/`imagem_corporal`/`comida`). Consumida pela Task 8 (`GraficoEvolucao.tsx`).

- [ ] **Step 1: Escrever os testes que falham**

Crie `src/lib/grafico/pontos.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { calcularPontosLinha } from './pontos';

describe('calcularPontosLinha', () => {
  it('retorna lista vazia para entrada vazia', () => {
    expect(calcularPontosLinha([], 100, 100)).toEqual([]);
  });

  it('coloca um único valor no meio horizontalmente (x=0) e na altura correspondente', () => {
    const pontos = calcularPontosLinha([3], 100, 100);
    expect(pontos).toHaveLength(1);
    expect(pontos[0].x).toBe(0);
    expect(pontos[0].y).toBe(50); // (3-1)/(5-1) = 0.5 → altura - 0.5*altura = 50
  });

  it('valor máximo (5) fica no topo (y=0)', () => {
    const pontos = calcularPontosLinha([5, 5], 100, 100);
    expect(pontos[0].y).toBe(0);
    expect(pontos[1].y).toBe(0);
  });

  it('valor mínimo (1) fica embaixo (y=altura)', () => {
    const pontos = calcularPontosLinha([1, 1], 100, 100);
    expect(pontos[0].y).toBe(100);
    expect(pontos[1].y).toBe(100);
  });

  it('espaça os pontos igualmente no eixo x', () => {
    const pontos = calcularPontosLinha([3, 3, 3], 100, 100);
    expect(pontos.map((p) => p.x)).toEqual([0, 50, 100]);
  });

  it('primeiro e último valor sempre nas bordas do eixo x', () => {
    const pontos = calcularPontosLinha([1, 5, 1, 5, 1], 200, 100);
    expect(pontos[0].x).toBe(0);
    expect(pontos[pontos.length - 1].x).toBe(200);
  });
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npx vitest run src/lib/grafico/pontos.test.ts`
Expected: FAIL — o módulo `./pontos` não existe.

- [ ] **Step 3: Implementar**

Crie `src/lib/grafico/pontos.ts`:

```ts
export interface PontoGrafico {
  x: number;
  y: number;
}

const ESCALA_MIN = 1;
const ESCALA_MAX = 5;

export function calcularPontosLinha(
  valores: number[],
  largura: number,
  altura: number
): PontoGrafico[] {
  if (valores.length === 0) {
    return [];
  }

  const paraY = (valor: number) =>
    altura - ((valor - ESCALA_MIN) / (ESCALA_MAX - ESCALA_MIN)) * altura;

  if (valores.length === 1) {
    return [{ x: 0, y: paraY(valores[0]) }];
  }

  const passoX = largura / (valores.length - 1);

  return valores.map((valor, indice) => ({
    x: indice * passoX,
    y: paraY(valor),
  }));
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npx vitest run src/lib/grafico/pontos.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/grafico/pontos.ts src/lib/grafico/pontos.test.ts
git commit -m "feat: adicionar calcularPontosLinha"
```

---

### Task 4: Corrigir plural em `SequenciaDias.tsx`

**Files:**
- Modify: `src/app/components/inicio/SequenciaDias.tsx`

**Interfaces:**
- Consumes: `formatarSequencia` (Task 1) de `@/lib/progress/streak`.

- [ ] **Step 1: Substituir o placeholder `dia(s)` pela formatação correta**

Substitua todo o conteúdo de `src/app/components/inicio/SequenciaDias.tsx` por:

```tsx
import Link from 'next/link';
import { formatarSequencia, type Progresso7Dias } from '@/lib/progress/streak';

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export default function SequenciaDias({ progresso }: { progresso: Progresso7Dias }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-display text-lg text-texto">Sua sequência</p>
        {progresso.diasConsecutivosAtuais > 0 && (
          <span className="text-sm text-texto-suave">
            {formatarSequencia(progresso.diasConsecutivosAtuais)}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        {progresso.ultimos7Dias.map((dia) => {
          const diaSemana = new Date(`${dia.data}T00:00:00`).getDay();
          return (
            <div key={dia.data} className="flex flex-1 flex-col items-center gap-1">
              <div
                title={dia.data}
                className={
                  dia.completou
                    ? 'h-9 w-full rounded-full bg-destaque'
                    : 'h-9 w-full rounded-full border border-borda bg-superficie'
                }
              />
              <span className="text-[10px] text-texto-suave">{DIAS_SEMANA[diaSemana]}</span>
            </div>
          );
        })}
      </div>

      <Link
        href="/progresso"
        className="block w-full rounded-2xl border border-borda p-3 text-center font-medium text-texto-suave transition-colors hover:bg-superficie"
      >
        Ver meu progresso
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Verificar tipos e lint**

Run: `npx tsc --noEmit`
Expected: sem erros.

Run: `npx eslint src/app/components/inicio/SequenciaDias.tsx`
Expected: sem erros.

- [ ] **Step 3: Rodar a suíte de testes completa**

Run: `npx vitest run`
Expected: todos os testes passando (nenhuma lógica mudou, só o texto).

- [ ] **Step 4: Commit**

```bash
git add src/app/components/inicio/SequenciaDias.tsx
git commit -m "fix: usar formatarSequencia em vez do placeholder dia(s) na tela inicial"
```

---

### Task 5: Biblioteca de práticas — lista (`/praticas`)

**Files:**
- Create: `src/app/praticas/page.tsx`
- Create: `src/app/praticas/CartaoPratica.tsx`
- Create: `src/app/praticas/loading.tsx`

**Interfaces:**
- Consumes: `Cartao` (`@/app/components/Cartao`), `NavegacaoInferior` (`@/app/components/NavegacaoInferior`), `Pratica` (`@/lib/supabase/types`).
- Produces: rota `/praticas`, consumida pela Task 7 (link a partir de `/jornadas`).

- [ ] **Step 1: Criar `CartaoPratica.tsx`**

```tsx
import Link from 'next/link';
import Cartao from '@/app/components/Cartao';
import type { Pratica } from '@/lib/supabase/types';

export default function CartaoPratica({ pratica }: { pratica: Pratica }) {
  return (
    <Link href={`/praticas/${pratica.id}`}>
      <Cartao className="space-y-1 transition-colors hover:bg-fundo">
        <p className="font-display text-base text-texto">{pratica.titulo}</p>
        <p className="line-clamp-2 text-sm text-texto-suave">{pratica.conteudo}</p>
      </Cartao>
    </Link>
  );
}
```

- [ ] **Step 2: Criar `page.tsx`**

```tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import CartaoPratica from './CartaoPratica';
import type { Pratica } from '@/lib/supabase/types';

function agruparPorCategoria(praticas: Pratica[]): [string, Pratica[]][] {
  const grupos = new Map<string, Pratica[]>();
  for (const pratica of praticas) {
    const grupo = grupos.get(pratica.categoria) ?? [];
    grupo.push(pratica);
    grupos.set(pratica.categoria, grupo);
  }
  return Array.from(grupos.entries());
}

export default async function PraticasPage() {
  const supabase = await createSupabaseServerClient();

  const { data: praticas, error } = await supabase
    .from('praticas')
    .select('*')
    .eq('status', 'publicada')
    .order('criado_em');

  return (
    <main className="mx-auto max-w-md space-y-6 p-6 pb-24 md:pb-6">
      <h1 className="font-display text-2xl text-texto">Biblioteca de práticas</h1>

      {error && (
        <p className="text-sm text-alerta">
          Não foi possível carregar as práticas agora. Tente novamente em instantes.
        </p>
      )}

      {!error && (praticas ?? []).length === 0 && (
        <p className="text-sm text-texto-suave">Ainda não há práticas publicadas.</p>
      )}

      {!error &&
        agruparPorCategoria(praticas ?? []).map(([categoria, itens]) => (
          <div key={categoria} className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-destaque">{categoria}</p>
            <div className="space-y-3">
              {itens.map((pratica) => (
                <CartaoPratica key={pratica.id} pratica={pratica} />
              ))}
            </div>
          </div>
        ))}

      <NavegacaoInferior />
    </main>
  );
}
```

- [ ] **Step 3: Criar `loading.tsx`**

```tsx
export default function CarregandoPraticas() {
  return (
    <main className="mx-auto max-w-md space-y-6 p-6 pb-24 md:pb-6">
      <h1 className="font-display text-2xl text-texto">Biblioteca de práticas</h1>
      <p className="text-sm text-texto-suave">Carregando...</p>
    </main>
  );
}
```

- [ ] **Step 4: Verificar tipos e lint**

Run: `npx tsc --noEmit`
Expected: sem erros.

Run: `npx eslint src/app/praticas`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/app/praticas/page.tsx src/app/praticas/CartaoPratica.tsx src/app/praticas/loading.tsx
git commit -m "feat: adicionar biblioteca de praticas em /praticas"
```

---

### Task 6: Biblioteca de práticas — leitura (`/praticas/[id]`)

**Files:**
- Create: `src/app/praticas/[id]/page.tsx`
- Create: `src/app/praticas/[id]/loading.tsx`

**Interfaces:**
- Consumes: `NavegacaoInferior` (`@/app/components/NavegacaoInferior`), `notFound` de `next/navigation`, `not-found.tsx` já existente na raiz do app (nenhuma mudança necessária nele).

- [ ] **Step 1: Criar `page.tsx`**

Rota deliberadamente separada de `/pratica/[id]` (singular, usada pelo fluxo de check-in) — esta é só leitura, sem escala de sensação antes/depois e sem gravação de `sessoes`.

```tsx
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';

export default async function PraticaBibliotecaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: pratica } = await supabase
    .from('praticas')
    .select('*')
    .eq('id', id)
    .eq('status', 'publicada')
    .single();

  if (!pratica) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-md space-y-6 p-6 pb-24 md:pb-6">
      <span className="text-xs font-medium uppercase tracking-wide text-destaque">
        {pratica.categoria}
      </span>
      <h1 className="font-display text-2xl text-texto">{pratica.titulo}</h1>
      <p className="whitespace-pre-line text-texto">{pratica.conteudo}</p>
      <a
        href="/praticas"
        className="block w-full rounded-2xl border border-borda p-3 text-center font-medium text-texto-suave transition-colors hover:bg-superficie"
      >
        Voltar para a biblioteca
      </a>
      <NavegacaoInferior />
    </main>
  );
}
```

- [ ] **Step 2: Criar `loading.tsx`**

```tsx
export default function CarregandoPratica() {
  return (
    <main className="mx-auto max-w-md space-y-6 p-6 pb-24 md:pb-6">
      <p className="text-sm text-texto-suave">Carregando...</p>
    </main>
  );
}
```

- [ ] **Step 3: Verificar tipos e lint**

Run: `npx tsc --noEmit`
Expected: sem erros.

Run: `npx eslint src/app/praticas`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add "src/app/praticas/[id]/page.tsx" "src/app/praticas/[id]/loading.tsx"
git commit -m "feat: adicionar leitura de pratica avulsa em /praticas/[id]"
```

---

### Task 7: Link de `/jornadas` para a biblioteca + aba ativa

**Files:**
- Modify: `src/app/jornadas/page.tsx`
- Modify: `src/app/components/NavegacaoInferior.tsx`

**Interfaces:**
- Nenhuma nova. Ajusta a lógica interna de `NavegacaoInferior` para aceitar múltiplos prefixos de rota por aba.

- [ ] **Step 1: Adicionar o link para a biblioteca em `jornadas/page.tsx`**

Substitua todo o conteúdo de `src/app/jornadas/page.tsx` por:

```tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import AtivarJornadaButton from './AtivarJornadaButton';
import Cartao from '@/app/components/Cartao';
import BarraProgressoJornada from '@/app/components/BarraProgressoJornada';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';

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
    <main className="mx-auto max-w-md space-y-6 p-6 pb-24 md:pb-6">
      <h1 className="font-display text-2xl text-texto">Jornadas</h1>
      {(jornadas ?? []).map((jornada) => {
        const progresso = progressoPorJornada.get(jornada.id);
        return (
          <Cartao key={jornada.id} className="space-y-3">
            <h2 className="font-display text-xl text-texto">{jornada.titulo}</h2>
            <p className="text-texto">{jornada.descricao}</p>
            {progresso && (
              <BarraProgressoJornada
                diasCompletados={progresso.dias_completados}
                duracaoDias={jornada.duracao_dias}
              />
            )}
            <p className="text-sm text-texto-suave">
              {progresso?.status === 'em_andamento' &&
                `Em andamento — dia ${progresso.dias_completados} de ${jornada.duracao_dias}`}
              {progresso?.status === 'pausada' &&
                `Pausada — dia ${progresso.dias_completados} de ${jornada.duracao_dias}`}
              {progresso?.status === 'concluida' && 'Concluída'}
              {!progresso && `${jornada.duracao_dias} dias`}
            </p>
            <AtivarJornadaButton
              jornadaId={jornada.id}
              jaAtiva={progresso?.status === 'em_andamento' || progresso?.status === 'concluida'}
              label={progresso ? 'Continuar' : 'Começar'}
            />
          </Cartao>
        );
      })}

      <a
        href="/praticas"
        className="block w-full rounded-2xl border border-borda bg-superficie p-4 text-center transition-colors hover:bg-fundo"
      >
        <p className="font-display text-base text-texto">Biblioteca de práticas</p>
        <p className="text-sm text-texto-suave">
          Explore práticas avulsas, sem precisar fazer o check-in.
        </p>
      </a>

      <NavegacaoInferior />
    </main>
  );
}
```

- [ ] **Step 2: Estender `NavegacaoInferior.tsx` para marcar "Jornada" ativa também em `/praticas`**

Substitua todo o conteúdo de `src/app/components/NavegacaoInferior.tsx` por:

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type IconeProps = { ativo: boolean };

function IconeInicio({ ativo }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={ativo ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

function IconeJornada({ ativo }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={ativo ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 20c3-8 3-12 7-16 4 4 4 8 7 16" />
      <path d="M9.5 13.5h5" />
    </svg>
  );
}

function IconeProgresso({ ativo }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={ativo ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 19V10" />
      <path d="M12 19V5" />
      <path d="M19 19v-6" />
    </svg>
  );
}

function IconePerfil({ ativo }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={ativo ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 20c1.2-3.6 4-5.5 6.5-5.5s5.3 1.9 6.5 5.5" />
    </svg>
  );
}

const ITENS = [
  { href: '/', rotulo: 'Início', Icone: IconeInicio, prefixosAtivos: ['/'] },
  { href: '/jornadas', rotulo: 'Jornada', Icone: IconeJornada, prefixosAtivos: ['/jornadas', '/praticas'] },
  { href: '/progresso', rotulo: 'Progresso', Icone: IconeProgresso, prefixosAtivos: ['/progresso'] },
  { href: '/perfil', rotulo: 'Perfil', Icone: IconePerfil, prefixosAtivos: ['/perfil'] },
] as const;

export default function NavegacaoInferior() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-borda bg-superficie/95 backdrop-blur md:hidden"
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
                className={`flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                  ativo ? 'text-acao' : 'text-texto-suave'
                }`}
              >
                <Icone ativo={ativo} />
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

- [ ] **Step 3: Verificar tipos e lint**

Run: `npx tsc --noEmit`
Expected: sem erros.

Run: `npx eslint src/app/jornadas/page.tsx src/app/components/NavegacaoInferior.tsx`
Expected: sem erros.

- [ ] **Step 4: Rodar a suíte de testes completa**

Run: `npx vitest run`
Expected: todos os testes passando.

- [ ] **Step 5: Commit**

```bash
git add src/app/jornadas/page.tsx src/app/components/NavegacaoInferior.tsx
git commit -m "feat: linkar biblioteca de praticas a partir de /jornadas"
```

---

### Task 8: Expandir `/progresso` — melhor sequência, gráfico e histórico

**Files:**
- Create: `src/app/progresso/MelhorSequencia.tsx`
- Create: `src/app/progresso/GraficoEvolucao.tsx`
- Create: `src/app/progresso/Historico.tsx`
- Create: `src/app/progresso/loading.tsx`
- Modify: `src/app/progresso/page.tsx`

**Interfaces:**
- Consumes: `calcularMelhorSequencia`, `formatarSequencia` (Task 1); `decidirEstadoGrafico` (Task 2); `calcularPontosLinha` (Task 3); `Cartao` (`@/app/components/Cartao`); `Checkin`, `Sessao` (`@/lib/supabase/types`).
- Produces: `ItemHistorico` (exportado de `Historico.tsx`) — `{ checkin: Checkin; descricaoRitual: string | null }`.

- [ ] **Step 1: Criar `MelhorSequencia.tsx`**

```tsx
import { formatarSequencia } from '@/lib/progress/streak';

export default function MelhorSequencia({ melhorSequencia }: { melhorSequencia: number }) {
  if (melhorSequencia === 0) {
    return null;
  }

  return (
    <p className="text-sm text-texto-suave">
      Sua melhor sequência até agora:{' '}
      <strong className="text-texto">{formatarSequencia(melhorSequencia)}</strong>
    </p>
  );
}
```

- [ ] **Step 2: Criar `GraficoEvolucao.tsx`**

```tsx
import { decidirEstadoGrafico } from '@/lib/grafico/estado';
import { calcularPontosLinha, type PontoGrafico } from '@/lib/grafico/pontos';
import type { Checkin } from '@/lib/supabase/types';

const LARGURA = 300;
const ALTURA = 140;

function construirPath(pontos: PontoGrafico[]): string {
  return pontos.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
}

export default function GraficoEvolucao({ checkins }: { checkins: Checkin[] }) {
  const estado = decidirEstadoGrafico(checkins.length);

  if (estado === 'sem_dados') {
    return (
      <div className="space-y-1">
        <p className="font-display text-lg text-texto">Sua evolução</p>
        <p className="text-sm text-texto-suave">
          Faça seu primeiro check-in para começar a ver sua evolução aqui.
        </p>
      </div>
    );
  }

  if (estado === 'poucos_dados') {
    return (
      <div className="space-y-1">
        <p className="font-display text-lg text-texto">Sua evolução</p>
        <p className="text-sm text-texto-suave">
          Faça mais alguns check-ins para começar a ver uma tendência aqui.
        </p>
      </div>
    );
  }

  const pontosHumor = calcularPontosLinha(checkins.map((c) => c.humor), LARGURA, ALTURA);
  const pontosCorpo = calcularPontosLinha(checkins.map((c) => c.imagem_corporal), LARGURA, ALTURA);
  const pontosComida = calcularPontosLinha(checkins.map((c) => c.comida), LARGURA, ALTURA);

  return (
    <div className="space-y-3">
      <p className="font-display text-lg text-texto">Sua evolução</p>
      <svg
        viewBox={`0 0 ${LARGURA} ${ALTURA}`}
        className="w-full"
        role="img"
        aria-label="Gráfico de evolução de humor, imagem corporal e comida ao longo do tempo"
      >
        <path
          d={construirPath(pontosHumor)}
          fill="none"
          className="stroke-acao"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={construirPath(pontosCorpo)}
          fill="none"
          className="stroke-destaque"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={construirPath(pontosComida)}
          fill="none"
          className="stroke-texto"
          strokeWidth="2"
          strokeDasharray="4 3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-texto-suave">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-acao" /> Humor
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-destaque" /> Imagem corporal
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-texto" /> Comida
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Criar `Historico.tsx`**

```tsx
import Cartao from '@/app/components/Cartao';
import type { Checkin } from '@/lib/supabase/types';

export type ItemHistorico = {
  checkin: Checkin;
  descricaoRitual: string | null;
};

export default function Historico({ itens }: { itens: ItemHistorico[] }) {
  if (itens.length === 0) {
    return (
      <div className="space-y-1">
        <p className="font-display text-lg text-texto">Histórico</p>
        <p className="text-sm text-texto-suave">Seu histórico de check-ins vai aparecer aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="font-display text-lg text-texto">Histórico</p>
      <div className="space-y-2">
        {itens.map(({ checkin, descricaoRitual }) => (
          <Cartao key={checkin.id} className="space-y-1">
            <p className="text-sm font-medium text-texto">{checkin.data}</p>
            <p className="text-xs text-texto-suave">
              Humor {checkin.humor}/5 · Corpo {checkin.imagem_corporal}/5 · Comida {checkin.comida}/5
            </p>
            <p className="text-xs text-texto-suave">{descricaoRitual ?? 'Nenhuma atividade registrada'}</p>
          </Cartao>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Criar `loading.tsx`**

```tsx
export default function CarregandoProgresso() {
  return (
    <main className="mx-auto max-w-md space-y-6 p-6 pb-24 md:pb-6">
      <h1 className="font-display text-2xl text-texto">Seu progresso</h1>
      <p className="text-sm text-texto-suave">Carregando...</p>
    </main>
  );
}
```

- [ ] **Step 5: Reescrever `page.tsx`**

Substitua todo o conteúdo de `src/app/progresso/page.tsx` por:

```tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { calcularProgresso7Dias, calcularMelhorSequencia, formatarSequencia } from '@/lib/progress/streak';
import ProgressoBlobs from '@/app/components/ProgressoBlobs';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import MelhorSequencia from './MelhorSequencia';
import GraficoEvolucao from './GraficoEvolucao';
import Historico, { type ItemHistorico } from './Historico';

export default async function ProgressoPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: checkins, error: erroCheckins } = await supabase
    .from('checkins')
    .select('*')
    .eq('usuaria_id', user!.id)
    .order('data', { ascending: true });

  if (erroCheckins) {
    return (
      <main className="mx-auto max-w-md space-y-6 p-6 pb-24 md:pb-6">
        <h1 className="font-display text-2xl text-texto">Seu progresso</h1>
        <p className="text-sm text-alerta">
          Não foi possível carregar seus dados agora. Tente novamente em instantes.
        </p>
        <NavegacaoInferior />
      </main>
    );
  }

  const todosOsCheckins = checkins ?? [];
  const progresso = calcularProgresso7Dias(todosOsCheckins.map((c) => c.data), new Date());
  const melhorSequencia = calcularMelhorSequencia(todosOsCheckins.map((c) => c.data));
  const checkinsParaGrafico = todosOsCheckins.slice(-30);
  const checkinsRecentes = todosOsCheckins.slice(-20).reverse();

  const checkinIds = checkinsRecentes.map((c) => c.id);

  const sessoesDoHistorico =
    checkinIds.length > 0
      ? ((await supabase.from('sessoes').select('*').eq('usuaria_id', user!.id).in('checkin_id', checkinIds))
          .data ?? [])
      : [];

  const praticaIds = sessoesDoHistorico
    .map((s) => s.pratica_id)
    .filter((id): id is string => id !== null);
  const atividadeIds = sessoesDoHistorico
    .map((s) => s.jornada_atividade_id)
    .filter((id): id is string => id !== null);

  const praticasDoHistorico =
    praticaIds.length > 0
      ? ((await supabase.from('praticas').select('id, titulo').in('id', praticaIds)).data ?? [])
      : [];
  const atividadesDoHistorico =
    atividadeIds.length > 0
      ? ((await supabase.from('jornada_atividades').select('id, titulo').in('id', atividadeIds)).data ?? [])
      : [];

  const tituloPorPratica = new Map(praticasDoHistorico.map((p) => [p.id, p.titulo]));
  const tituloPorAtividade = new Map(atividadesDoHistorico.map((a) => [a.id, a.titulo]));
  const sessaoPorCheckin = new Map(sessoesDoHistorico.map((s) => [s.checkin_id, s]));

  const itensHistorico: ItemHistorico[] = checkinsRecentes.map((checkin) => {
    const sessao = sessaoPorCheckin.get(checkin.id);
    let descricaoRitual: string | null = null;
    if (sessao?.pratica_id) {
      descricaoRitual = tituloPorPratica.get(sessao.pratica_id) ?? null;
    } else if (sessao?.jornada_atividade_id) {
      descricaoRitual = tituloPorAtividade.get(sessao.jornada_atividade_id) ?? null;
    }
    return { checkin, descricaoRitual };
  });

  return (
    <main className="mx-auto max-w-md space-y-6 p-6 pb-24 md:pb-6">
      <h1 className="font-display text-2xl text-texto">Seu progresso</h1>

      <p className="text-texto">
        Você completou o ritual em <strong>{progresso.diasCompletos} de 7</strong> dias esta semana.
      </p>

      {progresso.diasConsecutivosAtuais > 0 && (
        <p className="text-texto">
          Você está em uma sequência de {formatarSequencia(progresso.diasConsecutivosAtuais)}. 🌱
        </p>
      )}

      <ProgressoBlobs
        dias={progresso.ultimos7Dias.map((dia) => ({ rotulo: dia.data, completo: dia.completou }))}
      />

      <MelhorSequencia melhorSequencia={melhorSequencia} />

      <p className="text-sm text-texto-suave">
        Este resumo é só um retrato acolhedor da sua semana — ele não tira conclusões sobre o motivo
        dos seus dias serem como foram.
      </p>

      <GraficoEvolucao checkins={checkinsParaGrafico} />

      <Historico itens={itensHistorico} />

      <a
        href="/checkin"
        className="block w-full rounded-2xl border border-borda p-3 text-center font-medium text-texto-suave transition-colors hover:bg-superficie"
      >
        Voltar ao início
      </a>
      <NavegacaoInferior />
    </main>
  );
}
```

- [ ] **Step 6: Verificar tipos e lint**

Run: `npx tsc --noEmit`
Expected: sem erros.

Run: `npx eslint src/app/progresso`
Expected: sem erros.

- [ ] **Step 7: Rodar a suíte de testes completa**

Run: `npx vitest run`
Expected: todos os testes passando.

- [ ] **Step 8: Verificar visualmente**

Com `npm run dev`, percorra `/progresso` logada. Confirme: sequência atual (se houver) com plural correto, manchinhas dos últimos 7 dias, melhor sequência (some se for 0), gráfico (estado vazio/poucos-dados/tendência conforme a quantidade real de check-ins), histórico com o que foi feito em cada dia ou "Nenhuma atividade registrada" quando aplicável.

- [ ] **Step 9: Commit**

```bash
git add src/app/progresso
git commit -m "feat: adicionar melhor sequencia, grafico de evolucao e historico em /progresso"
```

---

### Task 9: Verificação final

**Files:**
- Nenhum arquivo novo — só verificação.

- [ ] **Step 1: Suíte de testes completa**

Run: `npx vitest run`
Expected: todos os testes passando, incluindo os novos de `streak.test.ts`, `estado.test.ts` e `pontos.test.ts`.

- [ ] **Step 2: Tipos e lint em todo o projeto**

Run: `npx tsc --noEmit`
Expected: sem erros.

Run: `npx eslint src`
Expected: sem erros.

- [ ] **Step 3: Build de produção**

Run: `npm run build`
Expected: build limpo, incluindo as rotas novas `/praticas` e `/praticas/[id]` na lista de rotas geradas.

- [ ] **Step 4: Passagem manual pelo fluxo completo**

Com `npm run dev`, confirme que o fluxo de check-in → prática recomendada / atividade de jornada continua funcionando exatamente como antes (nenhuma tarefa deste plano tocou nesse código), e percorra as rotas novas: `/jornadas` → link para `/praticas` → `/praticas/[id]` → voltar; `/progresso` com as três seções novas.

- [ ] **Step 5: Commit (se houver algo a corrigir) ou encerrar**

Se a verificação revelar algo a ajustar, corrija e commit. Se tudo estiver limpo, esta tarefa não gera commit próprio — é a validação de que as Tasks 1-8 estão prontas para a revisão final de todo o branch.
