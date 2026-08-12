# Tela de Início — Redesenho Visual Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesenhar a tela de início (`/`) para bater com o mockup fornecido pela usuária — saudação com nome, seletor de humor, sequência em pontinhos com ilustração, card de jornada em andamento, botão "Fazer check-in" — e expandir a navegação inferior para 5 abas (Início, Jornadas, Práticas, Progresso, Perfil), incorporando as correções de revisão: edição de nome para usuárias existentes, validação estrita de humor, leitura de `searchParams` no Server Component, jornada ativa mais recente, fallback de link de atividade, ocultação do seletor/botão após o check-in do dia, e normalização de nome.

**Architecture:** Extensão do app Next.js (App Router) já existente na branch `experiencia-completa`. A lógica nova que tem regras (mapeamento humor→quadrante, validação de parâmetro, escolha da jornada mais recente, normalização de nome) fica em funções puras testadas com Vitest em `src/lib/`; as páginas/Server Actions que só orquestram Supabase são wiring fino, verificado por checklist manual — mesmo padrão de divisão já usado no resto do projeto.

**Tech Stack:** Next.js 15 (App Router) + TypeScript, Tailwind CSS v4 (tokens via `@theme` em `globals.css`), Supabase (`@supabase/supabase-js`, `@supabase/ssr`), Vitest.

## Global Constraints

- Idioma: português do Brasil em toda a interface e conteúdo novo.
- Testes: lógica pura (mapeamentos, validação, ordenação, normalização) ganha teste Vitest real; páginas e Server Actions que só encadeiam chamadas Supabase são verificadas por checklist manual, não por harness de integração mockado (spec `2026-08-12-tela-inicio-visual-design.md` §6).
- Cores do seletor de humor são aproximações perceptuais do mockup, não valores de pixel exatos — ajuste fino fica para depois da checagem visual (spec §1, §3).
- `humor` só é aceito como inteiro 1-5; qualquer outro valor (decimal, fora do intervalo, não-numérico, ausente, múltiplos valores) vira `null` sem lançar erro (spec §4).
- `searchParams` é lido no Server Component (`/checkin/page.tsx`), nunca no client component — o client só recebe `humorInicial` já validado como prop (spec §4).
- Jornada ativa exibida no card é sempre a mais recentemente atualizada (`atualizada_em` desc) quando há mais de uma `em_andamento` (spec §4).
- O link do card de jornada usa o ID real da atividade do dia (`jornada_atividades.numero_dia = dias_completados + 1`); se essa atividade não existir, o link cai para `/jornadas`, nunca para uma rota inexistente (spec §4).
- Depois que o check-in do dia está feito, nem o seletor de humor nem o botão "Fazer check-in" aparecem — ambos controlados pela mesma flag `jaFezCheckinHoje` vinda da página servidora (spec §4).
- Nome da usuária: sempre `.trim()`; string vazia após o trim vira `null`, nunca string vazia (spec §5). Usuárias já onboardadas podem editar o nome em `/perfil`.
- Sem fotos reais — miniaturas e ilustrações são SVG, como já é o padrão do app (spec §2).
- Não mexe no modelo de dados do check-in emocional (`estado_geral`, quadrantes) nem em Jornadas/Práticas/Progresso/Perfil além do necessário para as 5 abas e a edição de nome (spec §2).

---

## Task 1: Nome do perfil — schema, tipos e normalização

**Files:**
- Create: `supabase/migrations/0005_nome_perfil.sql`
- Modify: `src/lib/supabase/types.ts:5-12` (tipo `Perfil`)
- Create: `src/lib/perfil/nome.ts`
- Test: `src/lib/perfil/nome.test.ts`

**Interfaces:**
- Produces: `normalizarNome(bruto: string): string | null` — usado pelas Tasks 2 e 3 (onboarding e edição de perfil) para gravar `perfis.nome`.
- Produces: campo `nome: string | null` no tipo `Perfil`, consumido pela Task 3 (`/perfil`) e Task 13 (página de início).

- [ ] **Step 1: Escrever a migration**

Criar `supabase/migrations/0005_nome_perfil.sql`:

```sql
alter table public.perfis add column nome text;
```

- [ ] **Step 2: Rodar a migration no Supabase**

No Supabase Dashboard → SQL Editor, colar e rodar o conteúdo do arquivo. Confirmar em Table Editor → `perfis` que a coluna `nome` (tipo `text`, nullable) existe.

- [ ] **Step 3: Atualizar o tipo `Perfil`**

Em `src/lib/supabase/types.ts`, trocar:

```ts
export type Perfil = {
  id: string;
  plano: Plano;
  pais: string;
  horario_preferido_notificacao: string | null;
  consentimento_dados_sensiveis_em: string | null;
  criado_em: string;
};
```

por:

```ts
export type Perfil = {
  id: string;
  nome: string | null;
  plano: Plano;
  pais: string;
  horario_preferido_notificacao: string | null;
  consentimento_dados_sensiveis_em: string | null;
  criado_em: string;
};
```

- [ ] **Step 4: Escrever o teste que falha para `normalizarNome`**

Criar `src/lib/perfil/nome.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { normalizarNome } from './nome';

describe('normalizarNome', () => {
  it('mantém um nome válido sem espaços nas pontas', () => {
    expect(normalizarNome('Sofia')).toBe('Sofia');
  });

  it('remove espaços nas pontas', () => {
    expect(normalizarNome('  Sofia  ')).toBe('Sofia');
  });

  it('retorna null para string vazia', () => {
    expect(normalizarNome('')).toBeNull();
  });

  it('retorna null para string só com espaços', () => {
    expect(normalizarNome('   ')).toBeNull();
  });

  it('preserva espaços internos', () => {
    expect(normalizarNome('  Maria Clara  ')).toBe('Maria Clara');
  });
});
```

- [ ] **Step 5: Rodar o teste e confirmar que falha**

Run: `npm run test -- src/lib/perfil/nome.test.ts`
Expected: FAIL com "Cannot find module './nome'"

- [ ] **Step 6: Implementar `normalizarNome`**

Criar `src/lib/perfil/nome.ts`:

```ts
export function normalizarNome(bruto: string): string | null {
  const limpo = bruto.trim();
  return limpo.length > 0 ? limpo : null;
}
```

- [ ] **Step 7: Rodar o teste e confirmar que passa**

Run: `npm run test -- src/lib/perfil/nome.test.ts`
Expected: PASS (5 testes)

- [ ] **Step 8: Rodar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros (nenhum outro arquivo lê `Perfil.nome` ainda, então adicionar o campo não quebra nada).

- [ ] **Step 9: Commit**

```bash
git add supabase/migrations/0005_nome_perfil.sql src/lib/supabase/types.ts src/lib/perfil/nome.ts src/lib/perfil/nome.test.ts
git commit -m "feat: adicionar coluna nome em perfis e normalizarNome"
```

---

## Task 2: Onboarding — captura opcional de nome

**Files:**
- Modify: `src/app/onboarding/page.tsx` (arquivo inteiro)
- Modify: `src/app/onboarding/actions.ts` (arquivo inteiro)

**Interfaces:**
- Consumes: `normalizarNome` (Task 1).
- Produces: `registrarConsentimento(nomeBruto?: string)` — assinatura muda; nenhuma outra task depende da assinatura antiga.

- [ ] **Step 1: Atualizar `registrarConsentimento` para aceitar e normalizar o nome**

Substituir o conteúdo de `src/app/onboarding/actions.ts` por:

```ts
'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { normalizarNome } from '@/lib/perfil/nome';

export async function registrarConsentimento(nomeBruto?: string): Promise<{ erro?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { error } = await supabase
    .from('perfis')
    .update({
      consentimento_dados_sensiveis_em: new Date().toISOString(),
      nome: normalizarNome(nomeBruto ?? ''),
    })
    .eq('id', user.id);

  if (error) {
    console.error('[registrarConsentimento] erro ao atualizar perfis:', {
      userId: user.id,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return { erro: 'Não foi possível registrar seu consentimento. Tente novamente.' };
  }

  redirect('/checkin');
}
```

- [ ] **Step 2: Adicionar o campo de nome na tela de onboarding**

Substituir o conteúdo de `src/app/onboarding/page.tsx` por:

```tsx
'use client';

import { useState, useTransition } from 'react';
import { registrarConsentimento } from './actions';
import Botao from '@/app/components/Botao';

export default function OnboardingPage() {
  const [nome, setNome] = useState('');
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [aceitouDadosSensiveis, setAceitouDadosSensiveis] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, startTransition] = useTransition();

  const podeContinuar = aceitouTermos && aceitouDadosSensiveis;

  function handleContinuar() {
    setErro(null);
    startTransition(async () => {
      const resultado = await registrarConsentimento(nome);
      if (resultado?.erro) {
        setErro(resultado.erro);
      }
    });
  }

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <h1 className="font-display text-2xl text-texto">Antes de começar</h1>
      <p className="text-texto">
        Este app não é terapia, não faz diagnóstico e não substitui acompanhamento profissional.
        Ele te ajuda a construir um pequeno ritual diário de cuidado com você mesma.
      </p>

      <label className="block text-texto">
        Como podemos te chamar? (opcional)
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Seu nome"
          className="mt-1 block w-full rounded-2xl border border-borda bg-superficie p-3 text-texto"
        />
      </label>

      <label className="flex items-start gap-3 text-texto">
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

      <label className="flex items-start gap-3 text-texto">
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

      {erro && <p className="text-alerta">{erro}</p>}

      <Botao disabled={!podeContinuar || enviando} onClick={handleContinuar}>
        {enviando ? 'Enviando...' : 'Continuar'}
      </Botao>
    </main>
  );
}
```

- [ ] **Step 3: Rodar typecheck e lint**

Run: `npx tsc --noEmit && npx eslint src/app/onboarding`
Expected: sem erros.

- [ ] **Step 4: Verificação manual**

Rodar `npm run dev`. Com uma conta que ainda não passou pelo onboarding (ou resetando `consentimento_dados_sensiveis_em` para `null` em Table Editor), acessar qualquer rota protegida, confirmar redirect para `/onboarding`. Preencher um nome, marcar as duas caixas, clicar "Continuar". Confirmar redirect para `/checkin` e, em Table Editor, que `perfis.nome` foi salvo com o valor sem espaços nas pontas. Repetir deixando o campo de nome vazio — confirmar que `perfis.nome` fica `null` (não string vazia) e que o fluxo não é bloqueado.

- [ ] **Step 5: Commit**

```bash
git add src/app/onboarding
git commit -m "feat: capturar nome opcional no onboarding"
```

---

## Task 3: Perfil — edição de nome para usuárias existentes

**Files:**
- Create: `src/app/perfil/EditarNomeForm.tsx`
- Modify: `src/app/perfil/actions.ts` (adicionar `atualizarNome`)
- Modify: `src/app/perfil/page.tsx` (arquivo inteiro)

**Interfaces:**
- Consumes: `normalizarNome` (Task 1).
- Produces: `atualizarNome(nomeBruto: string): Promise<{ erro?: string }>`, consumido só por `EditarNomeForm.tsx` nesta task.

- [ ] **Step 1: Adicionar `atualizarNome` às Server Actions de perfil**

Substituir o conteúdo de `src/app/perfil/actions.ts` por:

```ts
'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { normalizarNome } from '@/lib/perfil/nome';

export async function sair() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function atualizarNome(nomeBruto: string): Promise<{ erro?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { error } = await supabase
    .from('perfis')
    .update({ nome: normalizarNome(nomeBruto) })
    .eq('id', user.id);

  if (error) {
    return { erro: 'Não foi possível salvar seu nome. Tente novamente.' };
  }

  redirect('/perfil');
}
```

- [ ] **Step 2: Criar o formulário de edição de nome**

Criar `src/app/perfil/EditarNomeForm.tsx`:

```tsx
'use client';

import { useState, useTransition } from 'react';
import { atualizarNome } from './actions';
import Botao from '@/app/components/Botao';

export default function EditarNomeForm({ nomeAtual }: { nomeAtual: string | null }) {
  const [nome, setNome] = useState(nomeAtual ?? '');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, startTransition] = useTransition();

  function handleSalvar() {
    setErro(null);
    startTransition(async () => {
      const resultado = await atualizarNome(nome);
      if (resultado?.erro) {
        setErro(resultado.erro);
      }
    });
  }

  return (
    <div className="space-y-2">
      <label className="block text-texto">
        Nome
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Seu nome"
          className="mt-1 block w-full rounded-2xl border border-borda bg-superficie p-3 text-texto"
        />
      </label>
      {erro && <p className="text-sm text-alerta">{erro}</p>}
      <Botao disabled={enviando} onClick={handleSalvar}>
        {enviando ? 'Salvando...' : 'Salvar nome'}
      </Botao>
    </div>
  );
}
```

- [ ] **Step 3: Buscar e exibir o nome em `/perfil`**

Substituir o conteúdo de `src/app/perfil/page.tsx` por:

```tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Cartao from '@/app/components/Cartao';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import EditarNomeForm from './EditarNomeForm';
import { sair } from './actions';

const LABEL_PLANO: Record<string, string> = {
  free: 'Gratuito',
  premium: 'Premium',
};

export default async function PerfilPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = await supabase
    .from('perfis')
    .select('plano, nome')
    .eq('id', user!.id)
    .single();

  return (
    <main className="mx-auto max-w-md space-y-6 p-6 pb-24 md:pb-6">
      <h1 className="font-display text-2xl text-texto">Perfil</h1>

      <Cartao className="space-y-3">
        <div>
          <p className="text-xs text-texto-suave">E-mail</p>
          <p className="text-texto">{user!.email}</p>
        </div>
        <div>
          <p className="text-xs text-texto-suave">Plano</p>
          <p className="text-texto">{LABEL_PLANO[perfil?.plano ?? 'free']}</p>
        </div>
      </Cartao>

      <Cartao>
        <EditarNomeForm nomeAtual={perfil?.nome ?? null} />
      </Cartao>

      <div className="space-y-3">
        <a
          href="/settings"
          className="block w-full rounded-2xl border border-borda bg-superficie p-3 text-texto transition-colors hover:bg-fundo"
        >
          Lembretes
        </a>
        <a
          href="/premium"
          className="block w-full rounded-2xl border border-borda bg-superficie p-3 text-texto transition-colors hover:bg-fundo"
        >
          Versão Premium
        </a>
        <a
          href="/privacidade"
          className="block w-full rounded-2xl border border-borda bg-superficie p-3 text-texto transition-colors hover:bg-fundo"
        >
          Privacidade e Termos de Uso
        </a>
      </div>

      <form action={sair}>
        <button
          type="submit"
          className="w-full rounded-2xl border border-borda p-3 text-center font-medium text-texto-suave transition-colors hover:bg-superficie"
        >
          Sair
        </button>
      </form>

      <NavegacaoInferior />
    </main>
  );
}
```

- [ ] **Step 4: Rodar typecheck e lint**

Run: `npx tsc --noEmit && npx eslint src/app/perfil`
Expected: sem erros.

- [ ] **Step 5: Verificação manual**

Com uma conta já onboardada (que já tem `consentimento_dados_sensiveis_em` preenchido), acessar `/perfil`. Confirmar que o campo "Nome" aparece pré-preenchido com o valor atual (ou vazio, se nunca foi definido). Editar o nome, clicar "Salvar nome", confirmar que a página recarrega em `/perfil` com o novo valor no campo e, em Table Editor, que `perfis.nome` foi atualizado com o valor já sem espaços nas pontas. Salvar um nome só com espaços — confirmar que vira `null` no banco e o campo volta vazio.

- [ ] **Step 6: Commit**

```bash
git add src/app/perfil
git commit -m "feat: permitir edição de nome em /perfil"
```

---

## Task 4: Humor inicial — mapeamento e validação (lógica pura)

**Files:**
- Create: `src/lib/checkin/humorInicial.ts`
- Test: `src/lib/checkin/humorInicial.test.ts`

**Interfaces:**
- Consumes: `EstadoGeral` type (`src/lib/supabase/types.ts`).
- Produces: `type HumorInicial = 1 | 2 | 3 | 4 | 5`, `estadoInicialParaHumor(humor: HumorInicial): EstadoGeral`, `validarHumorParam(raw: string | string[] | undefined): HumorInicial | null`. Consumidos pela Task 5 (`/checkin`).

- [ ] **Step 1: Escrever os testes que falham**

Criar `src/lib/checkin/humorInicial.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { estadoInicialParaHumor, validarHumorParam, type HumorInicial } from './humorInicial';

describe('estadoInicialParaHumor', () => {
  it.each([
    [1, 'baixa_energia_desconforto'],
    [2, 'baixa_energia_desconforto'],
    [3, 'baixa_energia_conforto'],
    [4, 'alta_energia_conforto'],
    [5, 'alta_energia_conforto'],
  ] as const)('mapeia humor %i para %s', (humor, esperado) => {
    expect(estadoInicialParaHumor(humor as HumorInicial)).toBe(esperado);
  });
});

describe('validarHumorParam', () => {
  it.each(['1', '2', '3', '4', '5'])('aceita o inteiro válido "%s"', (valor) => {
    expect(validarHumorParam(valor)).toBe(Number(valor));
  });

  it.each(['0', '6', '3.5', 'abc', '', '-1', '10'])('rejeita "%s"', (valor) => {
    expect(validarHumorParam(valor)).toBeNull();
  });

  it('rejeita quando o parâmetro está ausente', () => {
    expect(validarHumorParam(undefined)).toBeNull();
  });

  it('rejeita quando o parâmetro aparece mais de uma vez na URL', () => {
    expect(validarHumorParam(['3', '4'])).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npm run test -- src/lib/checkin/humorInicial.test.ts`
Expected: FAIL com "Cannot find module './humorInicial'"

- [ ] **Step 3: Implementar o mapeamento e a validação**

Criar `src/lib/checkin/humorInicial.ts`:

```ts
import type { EstadoGeral } from '@/lib/supabase/types';

export type HumorInicial = 1 | 2 | 3 | 4 | 5;

const QUADRANTE_POR_HUMOR: Record<HumorInicial, EstadoGeral> = {
  1: 'baixa_energia_desconforto',
  2: 'baixa_energia_desconforto',
  3: 'baixa_energia_conforto',
  4: 'alta_energia_conforto',
  5: 'alta_energia_conforto',
};

export function estadoInicialParaHumor(humor: HumorInicial): EstadoGeral {
  return QUADRANTE_POR_HUMOR[humor];
}

function ehHumorInicialValido(valor: number): valor is HumorInicial {
  return Number.isInteger(valor) && valor >= 1 && valor <= 5;
}

export function validarHumorParam(raw: string | string[] | undefined): HumorInicial | null {
  if (typeof raw !== 'string' || raw.trim() === '') {
    return null;
  }
  const valor = Number(raw);
  return ehHumorInicialValido(valor) ? valor : null;
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npm run test -- src/lib/checkin/humorInicial.test.ts`
Expected: PASS (18 testes: 5 + 7 + 1 + 1... contagem exata depende do runner, mas todos os `it`/`it.each` devem passar)

- [ ] **Step 5: Commit**

```bash
git add src/lib/checkin/humorInicial.ts src/lib/checkin/humorInicial.test.ts
git commit -m "feat: adicionar mapeamento e validação de humor inicial do check-in"
```

---

## Task 5: `/checkin` aplica `humorInicial`

**Files:**
- Modify: `src/app/checkin/page.tsx` (arquivo inteiro)
- Modify: `src/app/checkin/CheckinFormClient.tsx:1-96` (imports, assinatura do componente, estados iniciais)

**Interfaces:**
- Consumes: `validarHumorParam`, `estadoInicialParaHumor`, `type HumorInicial` (Task 4).
- Produces: `CheckinFormClient` passa a exigir a prop `humorInicial: HumorInicial | null` — nenhuma outra task usa esse componente diretamente.

- [ ] **Step 1: Ler e validar `searchParams.humor` na página servidora**

Substituir o conteúdo de `src/app/checkin/page.tsx` por:

```tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatDateISO } from '@/lib/date';
import LembreteBanner from '@/app/components/LembreteBanner';
import CheckinFormClient from './CheckinFormClient';
import { validarHumorParam } from '@/lib/checkin/humorInicial';

export default async function CheckinPage({
  searchParams,
}: {
  searchParams: Promise<{ humor?: string | string[] }>;
}) {
  const { humor } = await searchParams;
  const humorInicial = validarHumorParam(humor);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: checkinExistente } = await supabase
    .from('checkins')
    .select('id')
    .eq('usuaria_id', user!.id)
    .eq('data', formatDateISO(new Date()))
    .maybeSingle();

  const jaFezCheckinHoje = !!checkinExistente;

  return (
    <>
      <LembreteBanner jaFezCheckinHoje={jaFezCheckinHoje} />
      {jaFezCheckinHoje ? (
        <main className="mx-auto max-w-md space-y-6 p-6">
          <p className="text-texto">Você já fez seu ritual de hoje. Volte amanhã! 🌿</p>
          <a
            href="/progresso"
            className="block w-full rounded-2xl border border-borda p-3 text-center font-medium text-texto-suave transition-colors hover:bg-superficie"
          >
            Ver progresso
          </a>
        </main>
      ) : (
        <CheckinFormClient humorInicial={humorInicial} />
      )}
    </>
  );
}
```

- [ ] **Step 2: Receber `humorInicial` em `CheckinFormClient` e pular a primeira etapa quando presente**

Em `src/app/checkin/CheckinFormClient.tsx`, adicionar o import (junto aos demais imports no topo do arquivo):

```ts
import { estadoInicialParaHumor, type HumorInicial } from '@/lib/checkin/humorInicial';
```

Trocar a assinatura do componente e os dois primeiros `useState`:

```tsx
export default function CheckinFormClient({ humorInicial }: { humorInicial: HumorInicial | null }) {
  const [etapa, setEtapa] = useState<Etapa>(humorInicial ? 'emocao' : 'estado_geral');

  const [estadoGeral, setEstadoGeral] = useState<EstadoGeral | null>(
    humorInicial ? estadoInicialParaHumor(humorInicial) : null
  );
```

(As demais linhas de `CheckinFormClient.tsx` — `emocaoEspecifica`, `intensidade`, todas as etapas JSX, `handleProximaAcao`, etc. — não mudam.)

- [ ] **Step 3: Rodar typecheck e lint**

Run: `npx tsc --noEmit && npx eslint src/app/checkin`
Expected: sem erros.

- [ ] **Step 4: Rodar a suíte de testes completa**

Run: `npm run test`
Expected: PASS — nenhum teste existente depende da assinatura antiga de `CheckinFormClient` (é um Client Component sem teste próprio hoje).

- [ ] **Step 5: Verificação manual**

Com uma conta que ainda não fez o check-in hoje, acessar `/checkin` diretamente (sem query string) — confirmar que a primeira tela ainda é "Como você está se sentindo hoje?" com os 4 quadrantes (comportamento inalterado). Depois acessar `/checkin?humor=5` — confirmar que a tela já abre em "Qual dessas palavras combina mais?" com as emoções do quadrante `alta_energia_conforto`. Repetir com `/checkin?humor=1` (deve cair em `baixa_energia_desconforto`) e com um valor inválido como `/checkin?humor=9` (deve se comportar como se não houvesse `humor` — cai na etapa `estado_geral`).

- [ ] **Step 6: Commit**

```bash
git add src/app/checkin
git commit -m "feat: pular etapa inicial do check-in quando humor vem da tela de início"
```

---

## Task 6: Jornada ativa mais recente e fallback de link (lógica pura)

**Files:**
- Create: `src/lib/jornadas/emAndamento.ts`
- Test: `src/lib/jornadas/emAndamento.test.ts`

**Interfaces:**
- Produces: `interface JornadaAtivaResumo { id: string; jornadaId: string; diasCompletados: number; atualizadaEm: string }`, `escolherJornadaAtivaMaisRecente(jornadasAtivas: JornadaAtivaResumo[]): JornadaAtivaResumo | null`, `resolverHrefAtividadeDoDia(atividadeId: string | null): string`. Consumidos pela Task 7 e Task 13.

- [ ] **Step 1: Escrever os testes que falham**

Criar `src/lib/jornadas/emAndamento.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  escolherJornadaAtivaMaisRecente,
  resolverHrefAtividadeDoDia,
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

describe('resolverHrefAtividadeDoDia', () => {
  it('linka para a atividade quando o id existe', () => {
    expect(resolverHrefAtividadeDoDia('atividade-1')).toBe('/jornada-atividade/atividade-1');
  });

  it('faz fallback para a lista de jornadas quando não há atividade', () => {
    expect(resolverHrefAtividadeDoDia(null)).toBe('/jornadas');
  });
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npm run test -- src/lib/jornadas/emAndamento.test.ts`
Expected: FAIL com "Cannot find module './emAndamento'"

- [ ] **Step 3: Implementar as funções**

Criar `src/lib/jornadas/emAndamento.ts`:

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

export function resolverHrefAtividadeDoDia(atividadeId: string | null): string {
  return atividadeId ? `/jornada-atividade/${atividadeId}` : '/jornadas';
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npm run test -- src/lib/jornadas/emAndamento.test.ts`
Expected: PASS (6 testes)

- [ ] **Step 5: Commit**

```bash
git add src/lib/jornadas/emAndamento.ts src/lib/jornadas/emAndamento.test.ts
git commit -m "feat: adicionar escolha de jornada ativa mais recente e fallback de link"
```

---

## Task 7: Componente `JornadaEmAndamento` (substitui `ConteudoRecomendado`)

**Files:**
- Create: `src/app/components/inicio/JornadaEmAndamento.tsx`
- Delete: `src/app/components/inicio/ConteudoRecomendado.tsx`

**Interfaces:**
- Consumes: `BarraProgressoJornada` (já existe em `src/app/components/BarraProgressoJornada.tsx`).
- Produces: `interface JornadaEmAndamentoInfo { titulo: string; descricao: string; diasCompletados: number; duracaoDias: number; href: string }` e o componente `JornadaEmAndamento({ jornada: JornadaEmAndamentoInfo | null })`. Consumido pela Task 13 (montagem final de `page.tsx`), que é responsável por buscar os dados no Supabase e montar esse objeto (usando `escolherJornadaAtivaMaisRecente`/`resolverHrefAtividadeDoDia` da Task 6).

- [ ] **Step 1: Remover o componente antigo**

```bash
git rm src/app/components/inicio/ConteudoRecomendado.tsx
```

- [ ] **Step 2: Criar o novo componente**

Criar `src/app/components/inicio/JornadaEmAndamento.tsx`:

```tsx
import Link from 'next/link';
import Cartao from '@/app/components/Cartao';
import BarraProgressoJornada from '@/app/components/BarraProgressoJornada';

export interface JornadaEmAndamentoInfo {
  titulo: string;
  descricao: string;
  diasCompletados: number;
  duracaoDias: number;
  href: string;
}

export default function JornadaEmAndamento({ jornada }: { jornada: JornadaEmAndamentoInfo | null }) {
  if (!jornada) {
    return null;
  }

  return (
    <div className="space-y-3">
      <p className="font-display text-lg text-texto">Continue sua jornada</p>
      <Link href={jornada.href} className="block">
        <Cartao className="flex gap-3">
          <svg
            aria-hidden="true"
            width="56"
            height="56"
            viewBox="0 0 56 56"
            fill="none"
            className="shrink-0 rounded-xl"
          >
            <rect width="56" height="56" rx="14" fill="#B9A6D4" fillOpacity="0.25" />
            <path
              d="M18 38c2-10 3-15 10-20 7 5 8 10 10 20"
              stroke="#B9A6D4"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
          <div className="min-w-0 flex-1 space-y-2">
            <div>
              <p className="font-display text-base text-texto">{jornada.titulo}</p>
              <p className="line-clamp-2 text-sm text-texto-suave">{jornada.descricao}</p>
            </div>
            <BarraProgressoJornada
              diasCompletados={jornada.diasCompletados}
              duracaoDias={jornada.duracaoDias}
            />
          </div>
        </Cartao>
      </Link>
    </div>
  );
}
```

- [ ] **Step 3: Rodar typecheck**

Run: `npx tsc --noEmit`
Expected: erros esperados apontando para `src/app/page.tsx`, que ainda importa `ConteudoRecomendado` — isso é corrigido na Task 13, que reescreve `page.tsx`. Confirmar que o único erro é esse import quebrado (nenhum outro arquivo referencia `ConteudoRecomendado`).

- [ ] **Step 4: Commit**

```bash
git add src/app/components/inicio/JornadaEmAndamento.tsx
git commit -m "feat: adicionar componente JornadaEmAndamento"
```

---

## Task 8: Componente `SeletorHumor` + tokens de cor

**Files:**
- Modify: `src/app/globals.css:3-12` (bloco `@theme`)
- Create: `src/app/components/inicio/SeletorHumor.tsx`

**Interfaces:**
- Produces: componente `SeletorHumor` (sem props — sempre renderiza os 5 níveis), consumido pela Task 13.

- [ ] **Step 1: Adicionar os tokens de cor do seletor de humor**

Em `src/app/globals.css`, dentro do bloco `@theme` existente, adicionar as 5 linhas novas (mantendo as 8 já existentes):

```css
@theme {
  --color-fundo: #FBF6F0;
  --color-superficie: #FFFDFB;
  --color-texto: #453C42;
  --color-texto-suave: #8C7F87;
  --color-destaque: #B9A6D4;
  --color-acao: #B8697A;
  --color-borda: #E8DDD9;
  --color-alerta: #8B4C5C;
  --color-humor-1: #A9B7D4;
  --color-humor-2: #9FC2B0;
  --color-humor-3: #E3C77A;
  --color-humor-4: #E3A26F;
  --color-humor-5: #D48CA6;
}
```

- [ ] **Step 2: Criar o componente `SeletorHumor`**

Criar `src/app/components/inicio/SeletorHumor.tsx`:

```tsx
import Link from 'next/link';
import Cartao from '@/app/components/Cartao';

const NIVEIS: { valor: 1 | 2 | 3 | 4 | 5; rotulo: string; cor: string }[] = [
  { valor: 1, rotulo: 'Muito baixo', cor: 'var(--color-humor-1)' },
  { valor: 2, rotulo: 'Baixo', cor: 'var(--color-humor-2)' },
  { valor: 3, rotulo: 'Bem', cor: 'var(--color-humor-3)' },
  { valor: 4, rotulo: 'Alto', cor: 'var(--color-humor-4)' },
  { valor: 5, rotulo: 'Muito alto', cor: 'var(--color-humor-5)' },
];

export default function SeletorHumor() {
  return (
    <Cartao className="space-y-4 text-center">
      <p className="font-display text-lg text-texto">Como você está se sentindo hoje?</p>
      <div className="flex justify-between gap-1">
        {NIVEIS.map((nivel) => (
          <Link
            key={nivel.valor}
            href={`/checkin?humor=${nivel.valor}`}
            className="flex flex-1 flex-col items-center gap-1.5 transition-transform hover:-translate-y-0.5"
          >
            <span
              aria-hidden="true"
              className="block h-10 w-10 rounded-full"
              style={{ backgroundColor: nivel.cor }}
            />
            <span className="text-[11px] leading-tight text-texto-suave">{nivel.rotulo}</span>
          </Link>
        ))}
      </div>
    </Cartao>
  );
}
```

- [ ] **Step 3: Rodar typecheck e lint**

Run: `npx tsc --noEmit && npx eslint src/app/components/inicio/SeletorHumor.tsx`
Expected: sem erros novos (o erro de `ConteudoRecomendado` da Task 7 ainda está pendente até a Task 13 — ignore-o por enquanto).

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/app/components/inicio/SeletorHumor.tsx
git commit -m "feat: adicionar componente SeletorHumor e tokens de cor de humor"
```

---

## Task 9: `SequenciaDias` — pontinhos e ilustração

**Files:**
- Modify: `src/app/components/inicio/SequenciaDias.tsx` (arquivo inteiro)

**Interfaces:**
- Consumes: `Progresso7Dias`, `formatarSequencia` (já existentes, sem mudança de assinatura).

- [ ] **Step 1: Trocar a apresentação de barras para pontinhos com ilustração**

Substituir o conteúdo de `src/app/components/inicio/SequenciaDias.tsx` por:

```tsx
import Link from 'next/link';
import { formatarSequencia, type Progresso7Dias } from '@/lib/progress/streak';

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export default function SequenciaDias({ progresso }: { progresso: Progresso7Dias }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 rounded-2xl bg-superficie p-4 shadow-[0_2px_8px_rgba(74,63,53,0.08)]">
        <div className="min-w-0 flex-1 space-y-3">
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
                  <span
                    title={dia.data}
                    className={
                      dia.completou
                        ? 'block h-3 w-3 rounded-full bg-destaque'
                        : 'block h-3 w-3 rounded-full border border-borda'
                    }
                  />
                  <span className="text-[10px] text-texto-suave">{DIAS_SEMANA[diaSemana]}</span>
                </div>
              );
            })}
          </div>
        </div>

        <svg aria-hidden="true" width="56" height="56" viewBox="0 0 56 56" fill="none" className="shrink-0">
          <path
            d="M28 49c2.5-12 3.5-19 10.5-26-7-3.5-14 0-15.5 7-1.5-7-8.5-10.5-15.5-7 7 7 8 14 10.5 26z"
            fill="#B9A6D4"
            fillOpacity="0.3"
          />
          <circle cx="28" cy="16" r="5" fill="#B8697A" fillOpacity="0.55" />
        </svg>
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

- [ ] **Step 2: Rodar typecheck e lint**

Run: `npx tsc --noEmit && npx eslint src/app/components/inicio/SequenciaDias.tsx`
Expected: sem erros novos.

- [ ] **Step 3: Rodar a suíte de testes**

Run: `npm run test -- src/lib/progress/streak.test.ts`
Expected: PASS — este componente não tem lógica nova, só apresentação; a lógica de dados (`calcularProgresso7Dias`) já é testada e não muda.

- [ ] **Step 4: Commit**

```bash
git add src/app/components/inicio/SequenciaDias.tsx
git commit -m "feat: trocar barras por pontinhos e adicionar ilustração em SequenciaDias"
```

---

## Task 10: `RitualDeHoje` — botão "Fazer check-in" com ícone

**Files:**
- Modify: `src/app/components/inicio/RitualDeHoje.tsx` (arquivo inteiro)

**Interfaces:**
- Sem mudança de props (`{ jaFezCheckinHoje: boolean }`).

- [ ] **Step 1: Atualizar o botão e confirmar o gating existente**

Substituir o conteúdo de `src/app/components/inicio/RitualDeHoje.tsx` por:

```tsx
import Link from 'next/link';
import Cartao from '@/app/components/Cartao';

function IconeCoracao() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M12 20.5s-7.5-4.6-10-9.3C.6 8.2 2 5 5.3 5c2 0 3.4 1.1 4.2 2.3C10.3 6.1 11.7 5 13.7 5 17 5 18.4 8.2 22 11.2c-2.5 4.7-10 9.3-10 9.3z" />
    </svg>
  );
}

export default function RitualDeHoje({ jaFezCheckinHoje }: { jaFezCheckinHoje: boolean }) {
  if (jaFezCheckinHoje) {
    return (
      <Cartao className="space-y-2 text-center">
        <p className="text-3xl">🌸</p>
        <p className="font-display text-lg text-texto">Ritual de hoje concluído</p>
        <p className="text-sm text-texto-suave">Volte amanhã para continuar sua sequência.</p>
      </Cartao>
    );
  }

  return (
    <Cartao className="space-y-3">
      <p className="font-display text-lg text-texto">Ritual de hoje</p>
      <p className="text-sm text-texto-suave">
        Reserve alguns minutos para o seu check-in diário — humor, corpo e alimentação.
      </p>
      <Link
        href="/checkin"
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-acao p-3 text-center font-medium text-white transition-colors hover:bg-acao/90"
      >
        <IconeCoracao />
        Fazer check-in
      </Link>
    </Cartao>
  );
}
```

Note que o `return` antecipado quando `jaFezCheckinHoje` é `true` já garante que o botão "Fazer check-in" nunca aparece depois do check-in do dia — esse comportamento já existia e continua sendo a única fonte de verdade (a Task 13 usa a mesma flag para também ocultar `SeletorHumor`, sem duplicar a checagem).

- [ ] **Step 2: Rodar typecheck e lint**

Run: `npx tsc --noEmit && npx eslint src/app/components/inicio/RitualDeHoje.tsx`
Expected: sem erros novos.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/inicio/RitualDeHoje.tsx
git commit -m "feat: trocar texto do botão de ritual para Fazer check-in com ícone"
```

---

## Task 11: `Saudacao` — nome na saudação

**Files:**
- Modify: `src/app/components/inicio/Saudacao.tsx` (arquivo inteiro)

**Interfaces:**
- Produces: `Saudacao` passa a exigir a prop `nome: string | null`. Consumida pela Task 13.

- [ ] **Step 1: Receber e renderizar o nome**

Substituir o conteúdo de `src/app/components/inicio/Saudacao.tsx` por:

```tsx
'use client';

import { useState } from 'react';

function saudacaoPorHorario(hora: number): string {
  if (hora < 5) return 'Boa noite';
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

// O horário do servidor não é o horário local da usuária, então o
// cumprimento certo só existe no cliente — o servidor renderiza um valor
// neutro e o suppressHydrationWarning evita o aviso da divergência esperada.
export default function Saudacao({ nome }: { nome: string | null }) {
  const [saudacao] = useState(() =>
    typeof window === 'undefined' ? 'Olá' : saudacaoPorHorario(new Date().getHours())
  );

  return (
    <p className="font-display text-2xl text-texto" suppressHydrationWarning>
      {nome ? `${saudacao}, ${nome}` : saudacao}
    </p>
  );
}
```

- [ ] **Step 2: Rodar typecheck**

Run: `npx tsc --noEmit`
Expected: erro esperado em `src/app/page.tsx`, que ainda chama `<Saudacao />` sem a prop `nome` — corrigido na Task 13.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/inicio/Saudacao.tsx
git commit -m "feat: exibir nome da usuária na saudação"
```

---

## Task 12: `NavegacaoInferior` — 5 abas (adicionar Práticas)

**Files:**
- Modify: `src/app/components/NavegacaoInferior.tsx` (arquivo inteiro)

**Interfaces:**
- Sem mudança de props (componente sem props).

- [ ] **Step 1: Adicionar o ícone e o item de Práticas, separar de Jornadas**

Substituir o conteúdo de `src/app/components/NavegacaoInferior.tsx` por:

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

function IconePraticas({ ativo }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={ativo ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4.5h9a3 3 0 0 1 3 3V19a2.5 2.5 0 0 0-2.5-2.5H6a1.5 1.5 0 0 1-1.5-1.5V6A1.5 1.5 0 0 1 6 4.5Z" />
      <path d="M6 16.5V19" />
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

- [ ] **Step 2: Rodar typecheck e lint**

Run: `npx tsc --noEmit && npx eslint src/app/components/NavegacaoInferior.tsx`
Expected: sem erros novos.

- [ ] **Step 3: Verificação manual**

Rodar `npm run dev`, logar, e conferir em qualquer tela com `<NavegacaoInferior />` (ex. `/perfil`, `/jornadas`, `/progresso`) que as 5 abas aparecem na ordem Início / Jornadas / Práticas / Progresso / Perfil, cada uma navegando para sua rota, com o destaque visual (`text-acao`) só na aba da rota atual — inclusive confirmar que estar em `/praticas` destaca só "Práticas", não mais "Jornadas".

- [ ] **Step 4: Commit**

```bash
git add src/app/components/NavegacaoInferior.tsx
git commit -m "feat: adicionar aba Práticas separada na navegação inferior"
```

---

## Task 13: Montagem final da tela de início

**Files:**
- Modify: `src/app/page.tsx` (arquivo inteiro)

**Interfaces:**
- Consumes: tudo das Tasks 6, 7, 8, 9, 10, 11 — `escolherJornadaAtivaMaisRecente`, `resolverHrefAtividadeDoDia` (Task 6), `JornadaEmAndamento`/`JornadaEmAndamentoInfo` (Task 7), `SeletorHumor` (Task 8), `SequenciaDias` (Task 9, sem mudança de interface), `RitualDeHoje` (Task 10, sem mudança de interface), `Saudacao` (Task 11, agora exige `nome`).

- [ ] **Step 1: Reescrever `page.tsx` para orquestrar todos os dados e componentes**

Substituir o conteúdo de `src/app/page.tsx` por:

```tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatDateISO } from '@/lib/date';
import { calcularProgresso7Dias } from '@/lib/progress/streak';
import { escolherJornadaAtivaMaisRecente, resolverHrefAtividadeDoDia } from '@/lib/jornadas/emAndamento';
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

  const [{ data: perfil }, { data: checkinHoje }, { data: checkins }, { data: jornadasAtivas }] =
    await Promise.all([
      supabase.from('perfis').select('nome').eq('id', user!.id).single(),
      supabase.from('checkins').select('*').eq('usuaria_id', user!.id).eq('data', hoje).maybeSingle(),
      supabase.from('checkins').select('data').eq('usuaria_id', user!.id),
      supabase
        .from('jornadas_usuarias')
        .select('id, jornada_id, dias_completados, atualizada_em')
        .eq('usuaria_id', user!.id)
        .eq('status', 'em_andamento'),
    ]);

  const progresso = calcularProgresso7Dias((checkins ?? []).map((c) => c.data), new Date());
  const jaFezCheckinHoje = !!checkinHoje;

  const jornadaAtivaMaisRecente = escolherJornadaAtivaMaisRecente(
    (jornadasAtivas ?? []).map((j) => ({
      id: j.id,
      jornadaId: j.jornada_id,
      diasCompletados: j.dias_completados,
      atualizadaEm: j.atualizada_em,
    }))
  );

  let jornadaEmAndamento: JornadaEmAndamentoInfo | null = null;
  if (jornadaAtivaMaisRecente) {
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

    if (jornada) {
      jornadaEmAndamento = {
        titulo: jornada.titulo,
        descricao: jornada.descricao,
        diasCompletados: jornadaAtivaMaisRecente.diasCompletados,
        duracaoDias: jornada.duracao_dias,
        href: resolverHrefAtividadeDoDia(atividadeDoDia?.id ?? null),
      };
    }
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

- [ ] **Step 2: Rodar typecheck e lint em todo o projeto**

Run: `npx tsc --noEmit && npx eslint .`
Expected: sem erros — os dois erros pendentes das Tasks 7 e 11 (import de `ConteudoRecomendado` e prop `nome` faltando em `Saudacao`) são resolvidos por esta reescrita.

- [ ] **Step 3: Rodar a suíte de testes completa**

Run: `npm run test`
Expected: PASS em todos os testes do projeto (incluindo os novos das Tasks 1, 4 e 6).

- [ ] **Step 4: Rodar o build de produção**

Run: `npm run build`
Expected: build limpo, sem erros de tipo ou de rota.

- [ ] **Step 5: Verificação manual completa (checklist)**

Rodar `npm run dev` e, logada com uma conta já onboardada, conferir cada um destes cenários na tela de início (`/`):

1. **Sem check-in hoje, sem jornada ativa:** aparecem saudação (com nome, se definido), `SeletorHumor`, card "Ritual de hoje" com botão "Fazer check-in" (ícone de coração), `SequenciaDias` em pontinhos com a ilustração ao lado, mensagem acolhedora, e nenhum card de jornada.
2. **Tocar num nível do `SeletorHumor`** (ex. "Bem"): navega para `/checkin?humor=3` e a tela já abre na etapa de emoções do quadrante `baixa_energia_conforto`.
3. **Com check-in feito hoje:** nem `SeletorHumor` nem o botão "Fazer check-in" aparecem — só o card "Ritual de hoje concluído" e o resumo do dia.
4. **Com uma jornada ativa** (ativar uma em `/jornadas`): o card "Continue sua jornada" aparece com título, descrição, barra de progresso, e o link leva à atividade certa do dia (`numero_dia = dias_completados + 1`).
5. **Com duas jornadas ativas ao mesmo tempo** (inserir uma segunda linha `em_andamento` manualmente em `jornadas_usuarias` via Table Editor, com `atualizada_em` diferente): confirmar que só a mais recentemente atualizada aparece no card.
6. **Jornada ativa sem atividade do dia correspondente** (ex. ajustar `dias_completados` para além do número de atividades cadastradas): o card ainda aparece, mas o link vai para `/jornadas` em vez de gerar um link quebrado.
7. **Navegação inferior:** as 5 abas (Início, Jornadas, Práticas, Progresso, Perfil) navegam corretamente e destacam a aba certa.

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: montar tela de início com seletor de humor, jornada ativa e nova sequência"
```
