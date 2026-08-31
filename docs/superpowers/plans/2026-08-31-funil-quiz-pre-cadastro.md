# Funil de Quiz Pré-Cadastro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o funil `/comecar` (quiz de 5 perguntas) → `/comecar/resultado` (personalização + oferta com preço real) → `/login`, com ponte via localStorage para não repetir objetivo/temas sensíveis no onboarding pós-conta.

**Architecture:** Duas rotas novas e públicas (`/comecar`, `/comecar/resultado`), reaproveitando tipos e listas fechadas já existentes (`OBJETIVOS`, `TEMAS_SENSIVEIS`) e a lógica de preço do Stripe já construída (`buscarPrecoDetalhado`, `calcularPercentualEconomiaAnual`). Uma ponte de dados via `localStorage` (puramente aditiva, nunca bloqueante) conecta as respostas do quiz ao onboarding existente.

**Tech Stack:** Next.js App Router (client + server components), TypeScript, Vitest + Testing Library, Tailwind (classes já usadas no app).

## Global Constraints

- Nunca inventar estatísticas/percentuais na cópia da tela de resultado — só dados reais (prova social real via `SeloProvaSocial`) ou frases de validação sem número (ver spec, seção "Fora de escopo").
- Perguntas 1, 2 e 5 do quiz não são gravadas no banco — só moldam a cópia da tela de resultado.
- A ponte quiz→conta deve degradar graciosamente: qualquer ausência/erro de dado no localStorage cai de volta no fluxo manual existente, nunca trava a usuária.
- Reaproveitar `OBJETIVOS`/`TEMAS_SENSIVEIS` de `src/lib/perfil/personalizacao.ts` tal como existem — não duplicar essas listas.
- Referência: spec em `docs/superpowers/specs/2026-08-31-funil-quiz-pre-cadastro-design.md`.

---

### Task 1: Tipos e conteúdo do quiz

**Files:**
- Create: `src/lib/quiz/tipos.ts`
- Test: `src/lib/quiz/tipos.test.ts`

**Interfaces:**
- Produces: `IdentificacaoId`, `FrequenciaEmocionalId`, `TempoDisponivelId`, `RespostasQuiz` (tipo com campos `identificacao`, `frequenciaEmocional`, `objetivo: ObjetivoId`, `temasSensiveis: TemaSensivelId[]`, `tempoDisponivel`), `IDENTIFICACAO_OPCOES`, `FREQUENCIA_EMOCIONAL_OPCOES`, `TEMPO_DISPONIVEL_OPCOES` (arrays `{id, rotulo}[]`), `ehIdentificacaoValida(v: string): v is IdentificacaoId`, `ehFrequenciaEmocionalValida(v: string): v is FrequenciaEmocionalId`, `ehTempoDisponivelValido(v: string): v is TempoDisponivelId`.

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/quiz/tipos.test.ts
import { describe, it, expect } from 'vitest';
import {
  IDENTIFICACAO_OPCOES,
  FREQUENCIA_EMOCIONAL_OPCOES,
  TEMPO_DISPONIVEL_OPCOES,
  ehIdentificacaoValida,
  ehFrequenciaEmocionalValida,
  ehTempoDisponivelValido,
} from './tipos';

describe('quiz — tipos', () => {
  it('tem as 4 opções de identificação, na ordem', () => {
    expect(IDENTIFICACAO_OPCOES.map((o) => o.rotulo)).toEqual([
      'Eu me comparo com outras mulheres o tempo todo',
      'Eu evito me olhar no espelho',
      'Eu sei que preciso me cuidar mais, mas não sei por onde começar',
      'Eu já cuido de mim, mas quero ir mais fundo',
    ]);
  });

  it('tem as 4 opções de frequência emocional, na ordem', () => {
    expect(FREQUENCIA_EMOCIONAL_OPCOES.map((o) => o.rotulo)).toEqual([
      'Quase todo dia',
      'Algumas vezes por semana',
      'De vez em quando',
      'Raramente',
    ]);
  });

  it('tem as 3 opções de tempo disponível, na ordem', () => {
    expect(TEMPO_DISPONIVEL_OPCOES.map((o) => o.rotulo)).toEqual([
      'Menos de 5 minutos',
      '5 a 10 minutos',
      'Mais de 10 minutos',
    ]);
  });

  it('validadores aceitam só ids conhecidos', () => {
    expect(ehIdentificacaoValida('evita_espelho')).toBe(true);
    expect(ehIdentificacaoValida('outro')).toBe(false);
    expect(ehFrequenciaEmocionalValida('quase_todo_dia')).toBe(true);
    expect(ehFrequenciaEmocionalValida('outro')).toBe(false);
    expect(ehTempoDisponivelValido('5_a_10min')).toBe(true);
    expect(ehTempoDisponivelValido('outro')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/quiz/tipos.test.ts`
Expected: FAIL — `Cannot find module './tipos'`

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/lib/quiz/tipos.ts
// Perguntas 1, 2 e 5 do quiz de /comecar — nunca gravadas no banco, só usadas
// para moldar a cópia da tela de resultado (ver spec 2026-08-31). Objetivo e
// temas sensíveis (perguntas 3 e 4) reaproveitam os tipos fechados já
// existentes em src/lib/perfil/personalizacao.ts.
import type { ObjetivoId, TemaSensivelId } from '@/lib/perfil/personalizacao';

export type IdentificacaoId = 'compara' | 'evita_espelho' | 'nao_sabe_comecar' | 'quer_ir_mais_fundo';

export const IDENTIFICACAO_OPCOES: { id: IdentificacaoId; rotulo: string }[] = [
  { id: 'compara', rotulo: 'Eu me comparo com outras mulheres o tempo todo' },
  { id: 'evita_espelho', rotulo: 'Eu evito me olhar no espelho' },
  { id: 'nao_sabe_comecar', rotulo: 'Eu sei que preciso me cuidar mais, mas não sei por onde começar' },
  { id: 'quer_ir_mais_fundo', rotulo: 'Eu já cuido de mim, mas quero ir mais fundo' },
];

const IDENTIFICACAO_IDS = IDENTIFICACAO_OPCOES.map((o) => o.id);

export function ehIdentificacaoValida(valor: string): valor is IdentificacaoId {
  return (IDENTIFICACAO_IDS as string[]).includes(valor);
}

export type FrequenciaEmocionalId = 'quase_todo_dia' | 'algumas_vezes_semana' | 'de_vez_em_quando' | 'raramente';

export const FREQUENCIA_EMOCIONAL_OPCOES: { id: FrequenciaEmocionalId; rotulo: string }[] = [
  { id: 'quase_todo_dia', rotulo: 'Quase todo dia' },
  { id: 'algumas_vezes_semana', rotulo: 'Algumas vezes por semana' },
  { id: 'de_vez_em_quando', rotulo: 'De vez em quando' },
  { id: 'raramente', rotulo: 'Raramente' },
];

const FREQUENCIA_EMOCIONAL_IDS = FREQUENCIA_EMOCIONAL_OPCOES.map((o) => o.id);

export function ehFrequenciaEmocionalValida(valor: string): valor is FrequenciaEmocionalId {
  return (FREQUENCIA_EMOCIONAL_IDS as string[]).includes(valor);
}

export type TempoDisponivelId = 'menos_5min' | '5_a_10min' | 'mais_10min';

export const TEMPO_DISPONIVEL_OPCOES: { id: TempoDisponivelId; rotulo: string }[] = [
  { id: 'menos_5min', rotulo: 'Menos de 5 minutos' },
  { id: '5_a_10min', rotulo: '5 a 10 minutos' },
  { id: 'mais_10min', rotulo: 'Mais de 10 minutos' },
];

const TEMPO_DISPONIVEL_IDS = TEMPO_DISPONIVEL_OPCOES.map((o) => o.id);

export function ehTempoDisponivelValido(valor: string): valor is TempoDisponivelId {
  return (TEMPO_DISPONIVEL_IDS as string[]).includes(valor);
}

export type RespostasQuiz = {
  identificacao: IdentificacaoId;
  frequenciaEmocional: FrequenciaEmocionalId;
  objetivo: ObjetivoId;
  temasSensiveis: TemaSensivelId[];
  tempoDisponivel: TempoDisponivelId;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/quiz/tipos.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/quiz/tipos.ts src/lib/quiz/tipos.test.ts
git commit -m "feat(quiz): tipos e conteúdo das perguntas do quiz pré-cadastro"
```

---

### Task 2: Ponte de armazenamento (localStorage)

**Files:**
- Create: `src/lib/quiz/armazenamento.ts`
- Test: `src/lib/quiz/armazenamento.test.ts`

**Interfaces:**
- Consumes: `RespostasQuiz`, `ehIdentificacaoValida`, `ehFrequenciaEmocionalValida`, `ehTempoDisponivelValido` de `./tipos` (Task 1); `validarObjetivos`, `validarTemasSensiveis` de `@/lib/perfil/personalizacao`.
- Produces: `salvarRespostasQuiz(respostas: RespostasQuiz): void`, `lerRespostasQuiz(): RespostasQuiz | null`, `apagarRespostasQuiz(): void`.

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/quiz/armazenamento.test.ts
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { salvarRespostasQuiz, lerRespostasQuiz, apagarRespostasQuiz } from './armazenamento';
import type { RespostasQuiz } from './tipos';

const RESPOSTAS: RespostasQuiz = {
  identificacao: 'evita_espelho',
  frequenciaEmocional: 'quase_todo_dia',
  objetivo: 'fortalecer_autoestima',
  temasSensiveis: ['alimentacao'],
  tempoDisponivel: '5_a_10min',
};

beforeEach(() => {
  window.localStorage.clear();
});

describe('quiz — armazenamento', () => {
  it('salva e lê as respostas de volta intactas', () => {
    salvarRespostasQuiz(RESPOSTAS);
    expect(lerRespostasQuiz()).toEqual(RESPOSTAS);
  });

  it('retorna null quando não há nada salvo', () => {
    expect(lerRespostasQuiz()).toBeNull();
  });

  it('retorna null para dado corrompido/inválido salvo na chave', () => {
    window.localStorage.setItem('rose:quiz-respostas', JSON.stringify({ objetivo: 'nao-existe' }));
    expect(lerRespostasQuiz()).toBeNull();
  });

  it('apagarRespostasQuiz remove a chave', () => {
    salvarRespostasQuiz(RESPOSTAS);
    apagarRespostasQuiz();
    expect(lerRespostasQuiz()).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/quiz/armazenamento.test.ts`
Expected: FAIL — `Cannot find module './armazenamento'`

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/lib/quiz/armazenamento.ts
// Ponte entre o quiz (sem conta) e o onboarding (com conta) — ver spec
// 2026-08-31, seção "Ponte quiz → conta". Puramente aditiva: qualquer falha
// de leitura (localStorage indisponível, dado corrompido, chave ausente)
// retorna null, nunca lança — quem consome trata null como "sem quiz feito"
// e segue o fluxo manual normal (ver OnboardingClient).
import { validarObjetivos, validarTemasSensiveis } from '@/lib/perfil/personalizacao';
import { ehIdentificacaoValida, ehFrequenciaEmocionalValida, ehTempoDisponivelValido, type RespostasQuiz } from './tipos';

const CHAVE = 'rose:quiz-respostas';

function localStorageDisponivel(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

export function salvarRespostasQuiz(respostas: RespostasQuiz): void {
  if (!localStorageDisponivel()) return;
  window.localStorage.setItem(CHAVE, JSON.stringify(respostas));
}

export function lerRespostasQuiz(): RespostasQuiz | null {
  if (!localStorageDisponivel()) return null;

  const bruto = window.localStorage.getItem(CHAVE);
  if (!bruto) return null;

  try {
    const dados = JSON.parse(bruto) as Partial<RespostasQuiz>;
    if (
      typeof dados.identificacao !== 'string' ||
      !ehIdentificacaoValida(dados.identificacao) ||
      typeof dados.frequenciaEmocional !== 'string' ||
      !ehFrequenciaEmocionalValida(dados.frequenciaEmocional) ||
      typeof dados.objetivo !== 'string' ||
      !validarObjetivos([dados.objetivo]) ||
      !Array.isArray(dados.temasSensiveis) ||
      !validarTemasSensiveis(dados.temasSensiveis) ||
      typeof dados.tempoDisponivel !== 'string' ||
      !ehTempoDisponivelValido(dados.tempoDisponivel)
    ) {
      return null;
    }
    return dados as RespostasQuiz;
  } catch {
    return null;
  }
}

export function apagarRespostasQuiz(): void {
  if (!localStorageDisponivel()) return;
  window.localStorage.removeItem(CHAVE);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/quiz/armazenamento.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/quiz/armazenamento.ts src/lib/quiz/armazenamento.test.ts
git commit -m "feat(quiz): ponte de respostas via localStorage entre quiz e onboarding"
```

---

### Task 3: Cópia personalizada do resultado

**Files:**
- Create: `src/lib/quiz/copyResultado.ts`
- Test: `src/lib/quiz/copyResultado.test.ts`

**Interfaces:**
- Consumes: `ObjetivoId`, `TemaSensivelId`, `TEMAS_SENSIVEIS` de `@/lib/perfil/personalizacao`; `IdentificacaoId`, `TempoDisponivelId` de `./tipos` (Task 1).
- Produces: `headlineParaObjetivo(objetivo: ObjetivoId): string`, `validacaoParaIdentificacao(identificacao: IdentificacaoId): string`, `ajusteParaTemasSensiveis(temas: TemaSensivelId[]): string`, `confirmacaoParaTempoDisponivel(tempo: TempoDisponivelId): string`.

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/quiz/copyResultado.test.ts
import { describe, it, expect } from 'vitest';
import {
  headlineParaObjetivo,
  validacaoParaIdentificacao,
  ajusteParaTemasSensiveis,
  confirmacaoParaTempoDisponivel,
} from './copyResultado';

describe('quiz — copyResultado', () => {
  it('headlineParaObjetivo monta a frase com o rótulo do objetivo', () => {
    expect(headlineParaObjetivo('fortalecer_autoestima')).toBe(
      'Seu plano: Fortalecer sua autoestima, 5 minutos por dia'
    );
  });

  it('headlineParaObjetivo usa frase genérica para a sentinela "decidir depois"', () => {
    expect(headlineParaObjetivo('decidir_depois')).toBe('Seu plano: Cuidar de você, 5 minutos por dia');
  });

  it('validacaoParaIdentificacao devolve uma frase por opção, sem número inventado', () => {
    const frase = validacaoParaIdentificacao('evita_espelho');
    expect(frase).toMatch(/mais comum do que parece/i);
    expect(frase).not.toMatch(/%|\d+\s*(mulheres|pessoas)/i);
  });

  it('ajusteParaTemasSensiveis prioriza o primeiro tema marcado, na ordem de TEMAS_SENSIVEIS', () => {
    expect(ajusteParaTemasSensiveis(['comparacao', 'alimentacao'])).toMatch(/sem dieta, sem contagem/i);
  });

  it('ajusteParaTemasSensiveis devolve mensagem genérica quando nenhum tema é reconhecido', () => {
    expect(ajusteParaTemasSensiveis([])).toBe('Seu plano é feito pra se encaixar do seu jeito, sem regras rígidas.');
    expect(ajusteParaTemasSensiveis(['nenhum_desses'])).toBe(
      'Seu plano é feito pra se encaixar do seu jeito, sem regras rígidas.'
    );
  });

  it('confirmacaoParaTempoDisponivel reforça viabilidade sem exigir reorganizar a rotina', () => {
    expect(confirmacaoParaTempoDisponivel('5_a_10min')).toBe(
      'Seu plano cabe em 5 a 10 minutos por dia — sem precisar reorganizar sua rotina.'
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/quiz/copyResultado.test.ts`
Expected: FAIL — `Cannot find module './copyResultado'`

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/lib/quiz/copyResultado.ts
// Cópia da tela /comecar/resultado derivada das respostas do quiz — nunca
// inclui estatística/percentual inventado (ver Global Constraints do plano).
import { TEMAS_SENSIVEIS, type ObjetivoId, type TemaSensivelId } from '@/lib/perfil/personalizacao';
import type { IdentificacaoId, TempoDisponivelId } from './tipos';

const HEADLINE_POR_OBJETIVO: Record<ObjetivoId, string> = {
  fortalecer_autoestima: 'Fortalecer sua autoestima',
  cuidar_relacao_corpo: 'Cuidar da sua relação com o corpo',
  relacao_tranquila_comida: 'Ter uma relação mais tranquila com a comida',
  praticar_autocompaixao: 'Praticar autocompaixão',
  lidar_comparacao: 'Lidar melhor com a comparação',
  criar_ritual_diario: 'Criar seu ritual diário de cuidado',
  decidir_depois: 'Cuidar de você',
};

export function headlineParaObjetivo(objetivo: ObjetivoId): string {
  return `Seu plano: ${HEADLINE_POR_OBJETIVO[objetivo]}, 5 minutos por dia`;
}

const VALIDACAO_POR_IDENTIFICACAO: Record<IdentificacaoId, string> = {
  compara:
    'Comparar-se é humano, mas isso não precisa ser o fundo da sua rotina — dá pra treinar outro jeito de olhar pra você mesma.',
  evita_espelho:
    'Isso é mais comum do que parece — e não é falta de força de vontade, é falta de um espaço seguro pra começar.',
  nao_sabe_comecar:
    'Você não precisa ter um plano perfeito — só precisa de um primeiro passo pequeno, feito com constância.',
  quer_ir_mais_fundo:
    'Que bom que você já começou — agora é sobre aprofundar com constância, não sobre recomeçar do zero.',
};

export function validacaoParaIdentificacao(identificacao: IdentificacaoId): string {
  return VALIDACAO_POR_IDENTIFICACAO[identificacao];
}

const AJUSTE_GENERICO = 'Seu plano é feito pra se encaixar do seu jeito, sem regras rígidas.';

const AJUSTE_POR_TEMA: Partial<Record<TemaSensivelId, string>> = {
  corpo_aparencia: 'Vamos falar de corpo no seu ritmo, sem comparação e sem pressão.',
  alimentacao: 'Vamos no seu ritmo: sem dieta, sem contagem, sem julgamento.',
  comparacao: 'Aqui não tem ranking nem comparação — só o seu progresso.',
  autocritica: 'Vamos praticar um jeito mais gentil de falar com você mesma.',
};

export function ajusteParaTemasSensiveis(temas: TemaSensivelId[]): string {
  for (const tema of TEMAS_SENSIVEIS) {
    const frase = AJUSTE_POR_TEMA[tema.id];
    if (frase && temas.includes(tema.id)) return frase;
  }
  return AJUSTE_GENERICO;
}

const CONFIRMACAO_POR_TEMPO: Record<TempoDisponivelId, string> = {
  menos_5min: 'menos de 5 minutos por dia',
  '5_a_10min': '5 a 10 minutos por dia',
  mais_10min: 'mais de 10 minutos por dia, no seu ritmo',
};

export function confirmacaoParaTempoDisponivel(tempo: TempoDisponivelId): string {
  return `Seu plano cabe em ${CONFIRMACAO_POR_TEMPO[tempo]} — sem precisar reorganizar sua rotina.`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/quiz/copyResultado.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/quiz/copyResultado.ts src/lib/quiz/copyResultado.test.ts
git commit -m "feat(quiz): cópia personalizada da tela de resultado"
```

---

### Task 4: Página do quiz (`/comecar`)

**Files:**
- Create: `src/app/comecar/page.tsx`
- Test: `src/app/comecar/page.test.tsx`

**Interfaces:**
- Consumes: `OBJETIVOS`, `TEMAS_SENSIVEIS`, `TEMA_SENSIVEL_EXCLUSIVOS` de `@/lib/perfil/personalizacao`; `IDENTIFICACAO_OPCOES`, `FREQUENCIA_EMOCIONAL_OPCOES`, `TEMPO_DISPONIVEL_OPCOES` de `@/lib/quiz/tipos` (Task 1); `salvarRespostasQuiz` de `@/lib/quiz/armazenamento` (Task 2); `Botao` de `@/app/components/Botao`.
- Produces: componente default de `src/app/comecar/page.tsx`, navega para `/comecar/resultado` via `router.push` ao final.

- [ ] **Step 1: Write the failing test**

```typescript jsx
// src/app/comecar/page.test.tsx
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ComecarPage from './page';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

const salvarRespostasQuiz = vi.fn();
vi.mock('@/lib/quiz/armazenamento', () => ({
  salvarRespostasQuiz: (respostas: unknown) => salvarRespostasQuiz(respostas),
}));

beforeEach(() => {
  push.mockClear();
  salvarRespostasQuiz.mockClear();
});

describe('ComecarPage (quiz)', () => {
  it('percorre as 5 perguntas e salva as respostas antes de navegar pro resultado', () => {
    render(<ComecarPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Eu evito me olhar no espelho' }));
    fireEvent.click(screen.getByRole('button', { name: 'Quase todo dia' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fortalecer minha autoestima' }));
    fireEvent.click(screen.getByRole('button', { name: 'Alimentação' }));
    fireEvent.click(screen.getByRole('button', { name: /^continuar$/i }));
    fireEvent.click(screen.getByRole('button', { name: '5 a 10 minutos' }));

    expect(salvarRespostasQuiz).toHaveBeenCalledWith({
      identificacao: 'evita_espelho',
      frequenciaEmocional: 'quase_todo_dia',
      objetivo: 'fortalecer_autoestima',
      temasSensiveis: ['alimentacao'],
      tempoDisponivel: '5_a_10min',
    });
    expect(push).toHaveBeenCalledWith('/comecar/resultado');
  });

  it('permite pular temas sensíveis sem marcar nenhum', () => {
    render(<ComecarPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Eu já cuido de mim, mas quero ir mais fundo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Raramente' }));
    fireEvent.click(screen.getByRole('button', { name: 'Criar um ritual diário de cuidado' }));
    fireEvent.click(screen.getByRole('button', { name: /^continuar$/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Menos de 5 minutos' }));

    expect(salvarRespostasQuiz).toHaveBeenCalledWith(expect.objectContaining({ temasSensiveis: [] }));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/comecar/page.test.tsx`
Expected: FAIL — `Cannot find module './page'`

- [ ] **Step 3: Write minimal implementation**

```typescript jsx
// src/app/comecar/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Botao from '@/app/components/Botao';
import {
  OBJETIVOS,
  TEMAS_SENSIVEIS,
  TEMA_SENSIVEL_EXCLUSIVOS,
  type ObjetivoId,
  type TemaSensivelId,
} from '@/lib/perfil/personalizacao';
import {
  IDENTIFICACAO_OPCOES,
  FREQUENCIA_EMOCIONAL_OPCOES,
  TEMPO_DISPONIVEL_OPCOES,
  type IdentificacaoId,
  type FrequenciaEmocionalId,
  type TempoDisponivelId,
} from '@/lib/quiz/tipos';
import { salvarRespostasQuiz } from '@/lib/quiz/armazenamento';

type EtapaQuiz = 'identificacao' | 'frequencia' | 'objetivo' | 'temas' | 'tempo';

const BOTAO_OPCAO =
  'rounded-2xl border border-borda bg-superficie p-4 text-left font-medium text-texto-suave transition-colors hover:border-acao';

export default function ComecarPage() {
  const router = useRouter();
  const [etapa, setEtapa] = useState<EtapaQuiz>('identificacao');
  const [identificacao, setIdentificacao] = useState<IdentificacaoId | null>(null);
  const [frequenciaEmocional, setFrequenciaEmocional] = useState<FrequenciaEmocionalId | null>(null);
  const [objetivo, setObjetivo] = useState<ObjetivoId | null>(null);
  const [temasSensiveis, setTemasSensiveis] = useState<TemaSensivelId[]>([]);

  function alternarTema(id: TemaSensivelId) {
    if (TEMA_SENSIVEL_EXCLUSIVOS.includes(id)) {
      setTemasSensiveis((atual) => (atual.includes(id) ? [] : [id]));
      return;
    }
    setTemasSensiveis((atual) => {
      const semExclusivos = atual.filter((item) => !TEMA_SENSIVEL_EXCLUSIVOS.includes(item));
      return semExclusivos.includes(id) ? semExclusivos.filter((item) => item !== id) : [...semExclusivos, id];
    });
  }

  function finalizar(tempoDisponivel: TempoDisponivelId) {
    if (!identificacao || !frequenciaEmocional || !objetivo) return;
    salvarRespostasQuiz({ identificacao, frequenciaEmocional, objetivo, temasSensiveis, tempoDisponivel });
    router.push('/comecar/resultado');
  }

  if (etapa === 'identificacao') {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
        <h1 className="text-center font-display text-2xl text-texto">
          Qual dessas frases mais parece com você hoje?
        </h1>
        <div className="flex flex-col gap-3">
          {IDENTIFICACAO_OPCOES.map((opcao) => (
            <button
              key={opcao.id}
              type="button"
              className={BOTAO_OPCAO}
              onClick={() => {
                setIdentificacao(opcao.id);
                setEtapa('frequencia');
              }}
            >
              {opcao.rotulo}
            </button>
          ))}
        </div>
      </main>
    );
  }

  if (etapa === 'frequencia') {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
        <h1 className="text-center font-display text-2xl text-texto">
          Com que frequência você se sente insatisfeita com sua imagem corporal?
        </h1>
        <div className="flex flex-col gap-3">
          {FREQUENCIA_EMOCIONAL_OPCOES.map((opcao) => (
            <button
              key={opcao.id}
              type="button"
              className={BOTAO_OPCAO}
              onClick={() => {
                setFrequenciaEmocional(opcao.id);
                setEtapa('objetivo');
              }}
            >
              {opcao.rotulo}
            </button>
          ))}
        </div>
      </main>
    );
  }

  if (etapa === 'objetivo') {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
        <h1 className="text-center font-display text-2xl text-texto">O que você quer priorizar agora?</h1>
        <div className="flex flex-col gap-3">
          {OBJETIVOS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={BOTAO_OPCAO}
              onClick={() => {
                setObjetivo(item.id);
                setEtapa('temas');
              }}
            >
              {item.rotulo}
            </button>
          ))}
        </div>
      </main>
    );
  }

  if (etapa === 'temas') {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
        <h1 className="text-center font-display text-2xl text-texto">Algum desses temas é sensível para você?</h1>
        <div className="flex flex-col gap-3">
          {TEMAS_SENSIVEIS.filter((tema) => tema.id !== 'prefiro_nao_responder').map((tema) => (
            <button
              key={tema.id}
              type="button"
              onClick={() => alternarTema(tema.id)}
              aria-pressed={temasSensiveis.includes(tema.id)}
              className={`rounded-2xl border p-4 text-left font-medium transition-colors ${
                temasSensiveis.includes(tema.id)
                  ? 'border-acao bg-acao/10 text-texto'
                  : 'border-borda bg-superficie text-texto-suave'
              }`}
            >
              {tema.rotulo}
            </button>
          ))}
        </div>
        <Botao type="button" onClick={() => setEtapa('tempo')}>
          Continuar
        </Botao>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <h1 className="text-center font-display text-2xl text-texto">
        Quanto tempo você consegue reservar por dia pra se cuidar?
      </h1>
      <div className="flex flex-col gap-3">
        {TEMPO_DISPONIVEL_OPCOES.map((opcao) => (
          <button key={opcao.id} type="button" className={BOTAO_OPCAO} onClick={() => finalizar(opcao.id)}>
            {opcao.rotulo}
          </button>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/comecar/page.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/app/comecar/page.tsx src/app/comecar/page.test.tsx
git commit -m "feat(quiz): página do quiz pré-cadastro em /comecar"
```

---

### Task 5: Página de resultado + oferta (`/comecar/resultado`)

**Files:**
- Create: `src/app/comecar/resultado/page.tsx`
- Create: `src/app/comecar/resultado/ResultadoClient.tsx`
- Test: `src/app/comecar/resultado/page.test.tsx`
- Test: `src/app/comecar/resultado/ResultadoClient.test.tsx`

**Interfaces:**
- Consumes: `obterStripe` de `@/lib/stripe/client`; `buscarPrecoDetalhado`, `calcularPercentualEconomiaAnual`, `obterMoedaELocaleDoPais`, `obterPriceId`, `stripeConfigurado` de `@/lib/stripe/planos`; `lerRespostasQuiz` de `@/lib/quiz/armazenamento` (Task 2); `headlineParaObjetivo`, `validacaoParaIdentificacao`, `ajusteParaTemasSensiveis`, `confirmacaoParaTempoDisponivel` de `@/lib/quiz/copyResultado` (Task 3); `SeloProvaSocial` de `@/app/components/inicio/SeloProvaSocial`; `Botao`.
- Produces: `ComecarResultadoPage` (server component, props do elemento: `{ precoMensal: string | null; precoAnual: string | null; percentualEconomiaAnual: number | null }` repassadas para `ResultadoClient`); `ResultadoClient` (client component, mesmas props).

- [ ] **Step 1: Write the failing tests**

```typescript jsx
// src/app/comecar/resultado/page.test.tsx
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ComecarResultadoPage from './page';

vi.mock('@/lib/stripe/client', () => ({ obterStripe: vi.fn() }));

import { obterStripe } from '@/lib/stripe/client';

function criarStripeFake() {
  return {
    prices: {
      retrieve: vi.fn(async (priceId: string) => {
        if (priceId === 'price_mensal_teste') {
          return { currency: 'brl', unit_amount: 3999, currency_options: { brl: { unit_amount: 3999 } } };
        }
        return { currency: 'brl', unit_amount: 35999, currency_options: { brl: { unit_amount: 35999 } } };
      }),
    },
  };
}

describe('ComecarResultadoPage', () => {
  beforeEach(() => {
    vi.mocked(obterStripe).mockReset();
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_teste');
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_teste');
    vi.stubEnv('STRIPE_PRICE_ID_MENSAL', 'price_mensal_teste');
    vi.stubEnv('STRIPE_PRICE_ID_ANUAL', 'price_anual_teste');
  });

  it('busca o preço em BRL por padrão e calcula o desconto real do anual', async () => {
    vi.mocked(obterStripe).mockReturnValue(criarStripeFake() as never);

    const jsx = await ComecarResultadoPage();

    expect(jsx.props).toEqual({
      precoMensal: 'R$ 39,99',
      precoAnual: 'R$ 359,99',
      percentualEconomiaAnual: 25,
    });
  });

  it('quando o Stripe não está configurado, passa preços nulos sem quebrar', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', '');

    const jsx = await ComecarResultadoPage();

    expect(jsx.props).toEqual({
      precoMensal: null,
      precoAnual: null,
      percentualEconomiaAnual: null,
    });
  });
});
```

```typescript jsx
// src/app/comecar/resultado/ResultadoClient.test.tsx
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResultadoClient from './ResultadoClient';
import { lerRespostasQuiz } from '@/lib/quiz/armazenamento';

const replace = vi.fn();
const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push }),
}));

vi.mock('@/lib/quiz/armazenamento', () => ({
  lerRespostasQuiz: vi.fn(),
}));

beforeEach(() => {
  replace.mockClear();
  push.mockClear();
  vi.mocked(lerRespostasQuiz).mockReset();
});

describe('ResultadoClient', () => {
  it('renderiza headline, validação, ajuste e confirmação com base nas respostas salvas', () => {
    vi.mocked(lerRespostasQuiz).mockReturnValue({
      identificacao: 'evita_espelho',
      frequenciaEmocional: 'quase_todo_dia',
      objetivo: 'fortalecer_autoestima',
      temasSensiveis: ['alimentacao'],
      tempoDisponivel: '5_a_10min',
    });

    render(<ResultadoClient precoMensal="R$ 39,99" precoAnual="R$ 359,99" percentualEconomiaAnual={25} />);

    expect(screen.getByText(/Seu plano: Fortalecer sua autoestima/i)).toBeInTheDocument();
    expect(screen.getByText(/não é falta de força de vontade/i)).toBeInTheDocument();
    expect(screen.getByText(/sem dieta, sem contagem, sem julgamento/i)).toBeInTheDocument();
    expect(screen.getByText(/5 a 10 minutos por dia/i)).toBeInTheDocument();
    expect(screen.getByText(/R\$ 39,99/)).toBeInTheDocument();
    expect(screen.getByText(/economize 25%/i)).toBeInTheDocument();
  });

  it('redireciona pro quiz quando não há respostas salvas', () => {
    vi.mocked(lerRespostasQuiz).mockReturnValue(null);

    render(<ResultadoClient precoMensal={null} precoAnual={null} percentualEconomiaAnual={null} />);

    expect(replace).toHaveBeenCalledWith('/comecar');
  });

  it('leva pro login ao clicar em "Quero começar agora"', () => {
    vi.mocked(lerRespostasQuiz).mockReturnValue({
      identificacao: 'compara',
      frequenciaEmocional: 'raramente',
      objetivo: 'criar_ritual_diario',
      temasSensiveis: [],
      tempoDisponivel: 'menos_5min',
    });

    render(<ResultadoClient precoMensal={null} precoAnual={null} percentualEconomiaAnual={null} />);
    screen.getByRole('button', { name: /quero começar agora/i }).click();

    expect(push).toHaveBeenCalledWith('/login');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/app/comecar/resultado/`
Expected: FAIL — `Cannot find module './page'` / `Cannot find module './ResultadoClient'`

- [ ] **Step 3: Write minimal implementation**

```typescript jsx
// src/app/comecar/resultado/ResultadoClient.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Botao from '@/app/components/Botao';
import SeloProvaSocial from '@/app/components/inicio/SeloProvaSocial';
import { lerRespostasQuiz } from '@/lib/quiz/armazenamento';
import {
  ajusteParaTemasSensiveis,
  confirmacaoParaTempoDisponivel,
  headlineParaObjetivo,
  validacaoParaIdentificacao,
} from '@/lib/quiz/copyResultado';
import type { RespostasQuiz } from '@/lib/quiz/tipos';

export default function ResultadoClient({
  precoMensal,
  precoAnual,
  percentualEconomiaAnual,
}: {
  precoMensal: string | null;
  precoAnual: string | null;
  percentualEconomiaAnual: number | null;
}) {
  const router = useRouter();
  const [respostas, setRespostas] = useState<RespostasQuiz | undefined>(undefined);

  useEffect(() => {
    const salvas = lerRespostasQuiz();
    if (!salvas) {
      router.replace('/comecar');
      return;
    }
    setRespostas(salvas);
  }, [router]);

  if (!respostas) return null;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <h1 className="text-center font-display text-2xl text-texto">{headlineParaObjetivo(respostas.objetivo)}</h1>
      <p className="text-center text-texto-suave">{validacaoParaIdentificacao(respostas.identificacao)}</p>
      <p className="text-center text-texto-suave">{ajusteParaTemasSensiveis(respostas.temasSensiveis)}</p>
      <p className="text-center font-medium text-texto">{confirmacaoParaTempoDisponivel(respostas.tempoDisponivel)}</p>

      <div className="flex justify-center">
        <SeloProvaSocial />
      </div>

      {(precoMensal || precoAnual) && (
        <div className="space-y-1 text-center text-sm text-texto-suave">
          {precoMensal && <p>Mensal: {precoMensal}</p>}
          {precoAnual && (
            <p>
              Anual: {precoAnual}
              {percentualEconomiaAnual ? ` (economize ${percentualEconomiaAnual}%)` : ''}
            </p>
          )}
        </div>
      )}

      <p className="text-center text-xs text-texto-suave">Cancele quando quiser, sem multa.</p>

      <Botao type="button" onClick={() => router.push('/login')}>
        Quero começar agora
      </Botao>
    </main>
  );
}
```

```typescript jsx
// src/app/comecar/resultado/page.tsx
import { obterStripe } from '@/lib/stripe/client';
import {
  buscarPrecoDetalhado,
  calcularPercentualEconomiaAnual,
  obterMoedaELocaleDoPais,
  obterPriceId,
  stripeConfigurado,
} from '@/lib/stripe/planos';
import ResultadoClient from './ResultadoClient';

// Ainda não existe conta/país confirmado nesta etapa do funil (é pré-login)
// — usa BRL como padrão. O preço final por país é confirmado depois, em
// /perfil/assinatura, já com a conta criada.
export default async function ComecarResultadoPage() {
  let precoMensal: string | null = null;
  let precoAnual: string | null = null;
  let percentualEconomiaAnual: number | null = null;

  if (stripeConfigurado()) {
    const stripe = obterStripe();
    if (stripe) {
      const { moeda } = obterMoedaELocaleDoPais('BR');
      const [detalheMensal, detalheAnual] = await Promise.all([
        buscarPrecoDetalhado(stripe, obterPriceId('mensal'), moeda),
        buscarPrecoDetalhado(stripe, obterPriceId('anual'), moeda),
      ]);
      precoMensal = detalheMensal?.formatado ?? null;
      precoAnual = detalheAnual?.formatado ?? null;
      if (detalheMensal && detalheAnual) {
        percentualEconomiaAnual = calcularPercentualEconomiaAnual(detalheMensal.unitAmount, detalheAnual.unitAmount);
      }
    }
  }

  return (
    <ResultadoClient precoMensal={precoMensal} precoAnual={precoAnual} percentualEconomiaAnual={percentualEconomiaAnual} />
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/app/comecar/resultado/`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/app/comecar/resultado/
git commit -m "feat(quiz): tela de resultado personalizado + oferta em /comecar/resultado"
```

---

### Task 6: Rotas públicas no middleware

**Files:**
- Modify: `src/proxy.ts` (array `ROTAS_PUBLICAS`)
- Modify: `src/proxy.test.ts` (lista de rotas no teste "permite acesso sem sessão às rotas públicas conhecidas")

**Interfaces:**
- Nenhuma nova — só adiciona uma entrada à lista existente.

- [ ] **Step 1: Write the failing test (edição do teste existente)**

Em `src/proxy.test.ts`, na `it('permite acesso sem sessão às rotas públicas conhecidas', ...)`, altere o array de rotas testadas:

```typescript
for (const rota of ['/login', '/auth/callback', '/comecar', '/privacidade', '/api/stripe/webhook', '/api/push/send-due']) {
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/proxy.test.ts`
Expected: FAIL — a asserção para `/comecar` falha (`resposta.headers.get('location')` não é `null`, é redirecionada pra `/login`) porque a rota ainda não está na lista pública.

- [ ] **Step 3: Write minimal implementation**

Em `src/proxy.ts`, adicione `/comecar` à lista `ROTAS_PUBLICAS` (com comentário explicando por quê, no mesmo padrão das entradas já existentes):

```typescript
const ROTAS_PUBLICAS = [
  '/login',
  '/auth/callback',
  '/privacidade',
  '/api/stripe/webhook',
  // Quiz pré-cadastro (/comecar e /comecar/resultado, cobertos pelo
  // startsWith abaixo) — acessado sempre sem sessão, é o novo primeiro
  // contato do funil de anúncio, antes de existir conta (ver spec
  // 2026-08-31-funil-quiz-pre-cadastro-design.md).
  '/comecar',
  // ... (demais entradas existentes permanecem inalteradas)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/proxy.test.ts`
Expected: PASS (todos os testes do arquivo)

- [ ] **Step 5: Commit**

```bash
git add src/proxy.ts src/proxy.test.ts
git commit -m "feat(quiz): torna /comecar rota pública no middleware"
```

---

### Task 7: Ponte no onboarding (não perguntar de novo)

**Files:**
- Modify: `src/app/onboarding/OnboardingClient.tsx`
- Modify: `src/app/onboarding/OnboardingClient.test.tsx`

**Interfaces:**
- Consumes: `lerRespostasQuiz`, `apagarRespostasQuiz` de `@/lib/quiz/armazenamento` (Task 2); `salvarObjetivos`, `salvarTemasSensiveis` já existentes em `./actions` (assinatura inalterada: `(selecionados: string[]) => Promise<{erro?: string}>`).

- [ ] **Step 1: Write the failing tests**

Adicione ao final de `src/app/onboarding/OnboardingClient.test.tsx` (mantendo os imports e mocks existentes no topo do arquivo):

```typescript jsx
vi.mock('@/lib/quiz/armazenamento', () => ({
  lerRespostasQuiz: vi.fn(),
  apagarRespostasQuiz: vi.fn(),
}));

import { lerRespostasQuiz, apagarRespostasQuiz } from '@/lib/quiz/armazenamento';

describe('OnboardingClient — ponte do quiz pré-cadastro', () => {
  beforeEach(() => {
    vi.mocked(lerRespostasQuiz).mockReset();
    vi.mocked(apagarRespostasQuiz).mockReset();
  });

  it('quando há respostas do quiz salvas, aplica objetivo e temas automaticamente e pula pro lembrete', async () => {
    vi.mocked(lerRespostasQuiz).mockReturnValue({
      identificacao: 'evita_espelho',
      frequenciaEmocional: 'quase_todo_dia',
      objetivo: 'fortalecer_autoestima',
      temasSensiveis: ['alimentacao'],
      tempoDisponivel: '5_a_10min',
    });

    render(
      <OnboardingClient consentimentoJaRegistrado={true} paisJaConfirmado={true} personalizacaoJaConcluida={false} />
    );

    await waitFor(() => expect(salvarObjetivos).toHaveBeenCalledWith(['fortalecer_autoestima']));
    await waitFor(() => expect(salvarTemasSensiveis).toHaveBeenCalledWith(['alimentacao']));
    await waitFor(() => expect(apagarRespostasQuiz).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByLabelText(/horário/i)).toBeInTheDocument());
    expect(screen.queryByText(/o que você quer priorizar agora/i)).not.toBeInTheDocument();
  });

  it('quando não há respostas do quiz salvas, pergunta objetivos e temas normalmente', () => {
    vi.mocked(lerRespostasQuiz).mockReturnValue(null);

    render(
      <OnboardingClient consentimentoJaRegistrado={true} paisJaConfirmado={true} personalizacaoJaConcluida={false} />
    );

    expect(screen.getByText(/o que você quer priorizar agora/i)).toBeInTheDocument();
    expect(salvarObjetivos).not.toHaveBeenCalled();
  });

  it('se salvar o objetivo do quiz falhar, cai de volta no fluxo manual em vez de travar', async () => {
    vi.mocked(lerRespostasQuiz).mockReturnValue({
      identificacao: 'compara',
      frequenciaEmocional: 'raramente',
      objetivo: 'criar_ritual_diario',
      temasSensiveis: [],
      tempoDisponivel: 'menos_5min',
    });
    salvarObjetivos.mockResolvedValueOnce({ erro: 'falhou' });

    render(
      <OnboardingClient consentimentoJaRegistrado={true} paisJaConfirmado={true} personalizacaoJaConcluida={false} />
    );

    await waitFor(() => expect(screen.getByText(/o que você quer priorizar agora/i)).toBeInTheDocument());
    expect(apagarRespostasQuiz).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/app/onboarding/OnboardingClient.test.tsx`
Expected: FAIL — `Cannot find module '@/lib/quiz/armazenamento'` (ainda não existe a chamada em `OnboardingClient.tsx`, e o mock aponta pra um módulo que o componente não importa)

- [ ] **Step 3: Write minimal implementation**

Em `src/app/onboarding/OnboardingClient.tsx`, adicione o import e o novo estado/efeito, e ajuste a renderização da etapa `'objetivos'`:

```typescript jsx
// adicionar ao bloco de imports existente
import { useEffect } from 'react';
import { lerRespostasQuiz, apagarRespostasQuiz } from '@/lib/quiz/armazenamento';
```

Dentro do componente, logo após a declaração de `const [confirmandoPais, startConfirmacaoPais] = useTransition();`:

```typescript jsx
  // Ponte do quiz pré-cadastro (/comecar) — ver spec 2026-08-31. Só age
  // quando existem respostas salvas no localStorage; caso contrário,
  // aplicandoRespostasQuiz nunca sai de `false` e a etapa 'objetivos'
  // renderiza exatamente como antes (fallback seguro, ver Global
  // Constraints do plano).
  const [aplicandoRespostasQuiz, setAplicandoRespostasQuiz] = useState(false);

  useEffect(() => {
    if (etapaMaioridade !== 'objetivos') return;
    const respostas = lerRespostasQuiz();
    if (!respostas) return;

    setAplicandoRespostasQuiz(true);
    let cancelado = false;

    (async () => {
      const resultadoObjetivos = await salvarObjetivos([respostas.objetivo]);
      if (cancelado) return;
      if (resultadoObjetivos.erro) {
        setAplicandoRespostasQuiz(false);
        return;
      }
      const resultadoTemas = await salvarTemasSensiveis(respostas.temasSensiveis);
      if (cancelado) return;
      if (resultadoTemas.erro) {
        setAplicandoRespostasQuiz(false);
        return;
      }
      apagarRespostasQuiz();
      setEtapaMaioridade('lembrete');
    })();

    return () => {
      cancelado = true;
    };
  }, [etapaMaioridade]);
```

E troque o bloco `if (etapaMaioridade === 'objetivos') { ... }` existente por:

```typescript jsx
  if (etapaMaioridade === 'objetivos') {
    if (aplicandoRespostasQuiz) {
      return (
        <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-texto-suave">Preparando seu plano...</p>
        </main>
      );
    }
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
        <div className="space-y-2 text-center">
          <h1 className="font-display text-2xl text-texto">O que você quer priorizar agora?</h1>
          <p className="text-texto-suave">
            Escolha quantos fizerem sentido — isso ajuda a personalizar seu ritual diário. Você pode
            mudar de ideia quando quiser em Perfil.
          </p>
        </div>
        <SeletorObjetivos
          selecaoInicial={[]}
          onSalvar={salvarObjetivos}
          aoSalvarComSucesso={() => setEtapaMaioridade('temas')}
        />
      </main>
    );
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/app/onboarding/OnboardingClient.test.tsx`
Expected: PASS (todos os testes do arquivo, incluindo os pré-existentes)

- [ ] **Step 5: Run the full suite to confirm no regressions**

Run: `npx vitest run`
Expected: PASS (todos os arquivos)

- [ ] **Step 6: Commit**

```bash
git add src/app/onboarding/OnboardingClient.tsx src/app/onboarding/OnboardingClient.test.tsx
git commit -m "feat(quiz): aplica objetivo/temas do quiz automaticamente no onboarding"
```

---

## Verificação final (antes de abrir o PR)

- [ ] `rm -rf .next && npm run build` — build de produção limpo
- [ ] `npx eslint src/app/comecar src/lib/quiz src/app/onboarding/OnboardingClient.tsx src/proxy.ts` — sem erros novos
- [ ] `npx vitest run` — suíte completa passando
- [ ] Testar manualmente no navegador: `/comecar` → responder as 5 perguntas → `/comecar/resultado` mostra headline/cópia/preço corretos → "Quero começar agora" → `/login` → código → conta criada → onboarding pula direto pra "lembrete" (sem perguntar objetivos/temas de novo)
