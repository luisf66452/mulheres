# Identidade Visual "Manhã de Domingo" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar a identidade visual "Manhã de Domingo" (tokens de cor/tipografia/layout + assinatura de progresso orgânico) em todas as telas existentes do app, sem alterar nenhuma lógica ou copy.

**Architecture:** Fundação de tokens em `globals.css` (Tailwind v4 `@theme`) + fontes via `next/font/google`, mais 5 componentes compartilhados novos (`Botao`, `Cartao`, `Escala`, `ProgressoBlobs`, `BarraProgressoJornada`) que as ~12 telas passam a consumir. Cada tela é uma tarefa isolada que só troca classes Tailwind e, onde fizer sentido, passa a usar os componentes compartilhados — o comportamento e os textos ficam intactos.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS v4 (`@theme`), `next/font/google`, TypeScript.

## Global Constraints

- Cores exatas: `fundo` `#EDE6DC`, `superficie` `#FAF7F2`, `texto` `#4A3F35`, `texto-suave` `#8B6F5C`, `destaque` `#C97B63`, `acao` `#7C8B6F`, `borda` `#DDD2C4`, `alerta` `#A65A48`.
- Tipografia: **Fraunces** para títulos/display, **Inter** para corpo/interface, ambas via `next/font/google` (substituem Geist).
- `destaque` (terracota) fica reservado às manchinhas de progresso semanal e à barra de progresso de jornada — nenhum outro lugar usa essa cor como preenchimento sólido.
- `alerta` é usado só em `/seguranca`, nunca como vermelho de alarme.
- Nenhuma mudança de copy: os textos visíveis em cada tela permanecem exatamente os mesmos, exceto onde este plano explicitamente introduz um componente compartilhado que reescreve markup (nunca texto).
- Nenhuma mudança de comportamento/lógica: `useState`, `useTransition`, chamadas a Server Actions e condições continuam byte-idênticas, salvo pela extração para os componentes compartilhados definidos nas Tasks 2 e 3.
- Fora de escopo (não implementar neste plano): dark mode, novos ícones de PWA, animação orquestrada (só `transition-colors` discreto já presente no restante do plano).
- `html lang` corrige de `"en"` para `"pt-BR"` (Task 1).
- `/` deixa de renderizar o template padrão do Next.js e passa a redirecionar para `/checkin` (Task 1).
- Não há suíte de regressão visual neste projeto — verificação é `tsc --noEmit` + `eslint` limpos + checagem manual no navegador, por tela.

---

### Task 1: Fundação — tokens, fontes, layout raiz e correção de `/`

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Produces: utilitários Tailwind `bg-fundo`, `text-fundo`, `bg-superficie`, `text-superficie`, `text-texto`, `text-texto-suave`, `bg-destaque`, `text-destaque`, `border-destaque`, `bg-acao`, `text-acao`, `border-acao`, `bg-borda`, `border-borda`, `bg-alerta`, `text-alerta`, `border-alerta` (gerados por `@theme`), e `font-display`, `font-sans` (gerados por `@theme inline`). Toda tarefa seguinte consome esses utilitários.

- [ ] **Step 1: Escrever os tokens de cor e fonte em `globals.css`**

Substitua todo o conteúdo de `src/app/globals.css` por:

```css
@import "tailwindcss";

@theme {
  --color-fundo: #EDE6DC;
  --color-superficie: #FAF7F2;
  --color-texto: #4A3F35;
  --color-texto-suave: #8B6F5C;
  --color-destaque: #C97B63;
  --color-acao: #7C8B6F;
  --color-borda: #DDD2C4;
  --color-alerta: #A65A48;
}

@theme inline {
  --font-display: var(--font-fraunces);
  --font-sans: var(--font-inter);
}

body {
  background: var(--color-fundo);
  color: var(--color-texto);
  font-family: var(--font-sans);
}
```

- [ ] **Step 2: Trocar as fontes e corrigir `lang`/`themeColor` em `layout.tsx`**

Substitua todo o conteúdo de `src/app/layout.tsx` por:

```tsx
import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ritual Diário",
  description:
    "Um ritual diário de 5 minutos para autoestima, imagem corporal e relação com a comida.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#EDE6DC",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-fundo font-sans text-texto">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Corrigir a rota raiz `/` para redirecionar para `/checkin`**

`src/app/page.tsx` hoje é o template padrão do `create-next-app` — nunca foi substituído. Qualquer usuária autenticada e com onboarding concluído que visitar `/` cai nesse template (o `proxy.ts` só intercepta usuárias deslogadas ou sem consentimento). Substitua todo o conteúdo de `src/app/page.tsx` por:

```tsx
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/checkin');
}
```

- [ ] **Step 4: Verificar tipos e lint**

Run: `npx tsc --noEmit`
Expected: sem erros.

Run: `npx eslint src/app/globals.css src/app/layout.tsx src/app/page.tsx`
Expected: sem erros (ESLint pode ignorar o `.css`; isso é esperado).

- [ ] **Step 5: Verificar visualmente**

Rode `npm run dev`, abra `http://localhost:3000/` logada — deve redirecionar direto para `/checkin` (não mais o template padrão do Next.js). Abra qualquer outra tela e confirme que o fundo já está no tom `#EDE6DC` e que títulos existentes (ainda sem os tokens de texto aplicados) não quebraram.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx src/app/page.tsx
git commit -m "feat: fundação da identidade visual Manhã de Domingo (tokens, fontes, fix da rota /)"
```

---

### Task 2: Componentes compartilhados — Botão, Cartão, Escala

**Files:**
- Create: `src/app/components/Botao.tsx`
- Create: `src/app/components/Cartao.tsx`
- Create: `src/app/components/Escala.tsx`

**Interfaces:**
- Consumes: utilitários de `src/app/globals.css` (Task 1) — `bg-acao`, `border-borda`, `text-texto-suave`, `bg-superficie`.
- Produces: `Botao` (default export) — `{ variante?: 'primaria' | 'secundaria' } & ButtonHTMLAttributes<HTMLButtonElement>`. `Cartao` (default export) — `HTMLAttributes<HTMLDivElement>`. `Escala` (default export) — `{ valor: number | null; onChange: (v: number) => void }`. Consumido pelas Tasks 4-13.

- [ ] **Step 1: Criar `Botao.tsx`**

```tsx
import { ButtonHTMLAttributes } from 'react';

type BotaoProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: 'primaria' | 'secundaria';
};

export default function Botao({ variante = 'primaria', className = '', ...props }: BotaoProps) {
  const base =
    'w-full rounded-2xl p-3 text-center font-medium transition-colors disabled:opacity-40';
  const estilos =
    variante === 'primaria'
      ? 'bg-acao text-white hover:bg-acao/90'
      : 'border border-borda text-texto-suave hover:bg-superficie';
  return <button className={`${base} ${estilos} ${className}`} {...props} />;
}
```

- [ ] **Step 2: Criar `Cartao.tsx`**

```tsx
import { HTMLAttributes } from 'react';

export default function Cartao({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl bg-superficie p-4 shadow-[0_2px_8px_rgba(74,63,53,0.08)] ${className}`}
      {...props}
    />
  );
}
```

- [ ] **Step 3: Criar `Escala.tsx`**

Extrai o seletor de escala 1-5 hoje duplicado em `CheckinFormClient.tsx` e `AntesDepoisAtividade.tsx` (Tasks 6 e 7 passam a consumir este componente em vez de sua própria cópia local).

```tsx
'use client';

const VALORES = [1, 2, 3, 4, 5];

export default function Escala({
  valor,
  onChange,
}: {
  valor: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-2">
      {VALORES.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`h-12 w-12 rounded-full border border-borda transition-colors ${
            valor === n ? 'border-acao bg-acao text-white' : 'bg-superficie text-texto-suave'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Verificar tipos e lint**

Run: `npx tsc --noEmit`
Expected: sem erros.

Run: `npx eslint src/app/components/Botao.tsx src/app/components/Cartao.tsx src/app/components/Escala.tsx`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/app/components/Botao.tsx src/app/components/Cartao.tsx src/app/components/Escala.tsx
git commit -m "feat: componentes compartilhados Botao, Cartao e Escala"
```

---

### Task 3: Componentes de assinatura — ProgressoBlobs e BarraProgressoJornada

**Files:**
- Create: `src/app/components/ProgressoBlobs.tsx`
- Create: `src/app/components/BarraProgressoJornada.tsx`

**Interfaces:**
- Consumes: utilitário `bg-destaque` e `border-borda` de `src/app/globals.css` (Task 1).
- Produces: `ProgressoBlobs` (default export) — `{ dias: { rotulo: string; completo: boolean }[] }`, consumido pela Task 9 (`/progresso`). `BarraProgressoJornada` (default export) — `{ diasCompletados: number; duracaoDias: number }`, consumido pela Task 8 (`/jornadas`).

- [ ] **Step 1: Criar `ProgressoBlobs.tsx`**

A assinatura da identidade visual: manchinhas orgânicas (formas de círculo levemente irregulares) em vez de bolinhas geométricas. Usa `style` inline para o `border-radius` composto, que não é seguro representar como classe utilitária Tailwind.

```tsx
export default function ProgressoBlobs({
  dias,
}: {
  dias: { rotulo: string; completo: boolean }[];
}) {
  return (
    <div className="flex gap-2">
      {dias.map((dia, i) => (
        <div
          key={i}
          title={dia.rotulo}
          className={dia.completo ? 'h-10 w-10 bg-destaque' : 'h-10 w-10 border border-dashed border-borda'}
          style={{ borderRadius: '60% 40% 55% 45% / 45% 55% 42% 58%' }}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Criar `BarraProgressoJornada.tsx`**

Variação compacta da assinatura para jornadas de 7 a 21 dias — uma barra preenchida em vez de uma manchinha por dia.

```tsx
export default function BarraProgressoJornada({
  diasCompletados,
  duracaoDias,
}: {
  diasCompletados: number;
  duracaoDias: number;
}) {
  const percentual = Math.round((diasCompletados / duracaoDias) * 100);
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-borda">
      <div className="h-full rounded-full bg-destaque" style={{ width: `${percentual}%` }} />
    </div>
  );
}
```

- [ ] **Step 3: Verificar tipos e lint**

Run: `npx tsc --noEmit`
Expected: sem erros.

Run: `npx eslint src/app/components/ProgressoBlobs.tsx src/app/components/BarraProgressoJornada.tsx`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/app/components/ProgressoBlobs.tsx src/app/components/BarraProgressoJornada.tsx
git commit -m "feat: componentes de assinatura ProgressoBlobs e BarraProgressoJornada"
```

---

### Task 4: Tela `/login`

**Files:**
- Modify: `src/app/login/page.tsx`

**Interfaces:**
- Consumes: `Botao` (Task 2).

- [ ] **Step 1: Aplicar tokens e `Botao` em `login/page.tsx`**

Substitua todo o conteúdo de `src/app/login/page.tsx` por:

```tsx
'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { enviarLinkMagico } from './actions';
import Botao from '@/app/components/Botao';

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(searchParams.get('erro'));

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
      <main className="flex min-h-screen items-center justify-center bg-fundo p-6">
        <p className="text-center text-lg text-texto">
          Enviamos um link de acesso para <strong>{email}</strong>. Abra seu e-mail para entrar.
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-fundo p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="font-display text-2xl text-texto">Entrar</h1>
        <input
          type="email"
          required
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-2xl border border-borda bg-superficie p-3 text-texto"
        />
        {erro && <p className="text-alerta">{erro}</p>}
        <Botao type="submit">Receber link de acesso</Botao>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
```

- [ ] **Step 2: Verificar tipos e lint**

Run: `npx tsc --noEmit`
Expected: sem erros.

Run: `npx eslint src/app/login/page.tsx`
Expected: sem erros.

- [ ] **Step 3: Verificar visualmente**

Com `npm run dev` rodando, abra `/login` deslogada. Confirme: fundo `#EDE6DC`, título "Entrar" na fonte serifada, input com borda arredondada, botão "Receber link de acesso" em verde salvia. Envie um e-mail de teste e confirme que a tela de "link enviado" também está estilizada. O fluxo de envio de link mágico deve continuar funcionando exatamente como antes.

- [ ] **Step 4: Commit**

```bash
git add src/app/login/page.tsx
git commit -m "style: aplicar identidade visual Manhã de Domingo em /login"
```

---

### Task 5: Tela `/onboarding`

**Files:**
- Modify: `src/app/onboarding/page.tsx`

**Interfaces:**
- Consumes: `Botao` (Task 2).

- [ ] **Step 1: Aplicar tokens e `Botao` em `onboarding/page.tsx`**

Substitua todo o conteúdo de `src/app/onboarding/page.tsx` por:

```tsx
'use client';

import { useState, useTransition } from 'react';
import { registrarConsentimento } from './actions';
import Botao from '@/app/components/Botao';

export default function OnboardingPage() {
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [aceitouDadosSensiveis, setAceitouDadosSensiveis] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, startTransition] = useTransition();

  const podeContinuar = aceitouTermos && aceitouDadosSensiveis;

  function handleContinuar() {
    setErro(null);
    startTransition(async () => {
      const resultado = await registrarConsentimento();
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

- [ ] **Step 2: Verificar tipos e lint**

Run: `npx tsc --noEmit`
Expected: sem erros.

Run: `npx eslint src/app/onboarding/page.tsx`
Expected: sem erros.

- [ ] **Step 3: Verificar visualmente**

Logada e sem consentimento registrado, confirme que `/onboarding` mostra os tokens aplicados e que marcar as duas caixas + clicar em "Continuar" ainda registra o consentimento e navega para `/checkin`, como antes.

- [ ] **Step 4: Commit**

```bash
git add src/app/onboarding/page.tsx
git commit -m "style: aplicar identidade visual Manhã de Domingo em /onboarding"
```

---

### Task 6: Tela `/checkin`

**Files:**
- Modify: `src/app/checkin/CheckinFormClient.tsx`
- Modify: `src/app/checkin/page.tsx`
- Modify: `src/app/components/LembreteBanner.tsx`

**Interfaces:**
- Consumes: `Botao`, `Escala` (Task 2).

- [ ] **Step 1: Aplicar tokens, `Botao` e `Escala` em `CheckinFormClient.tsx`**

Substitua todo o conteúdo de `src/app/checkin/CheckinFormClient.tsx` por:

```tsx
'use client';

import { useState } from 'react';
import { submeterCheckin } from './actions';
import Botao from '@/app/components/Botao';
import Escala from '@/app/components/Escala';

export default function CheckinFormClient() {
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
      <h1 className="font-display text-2xl text-texto">Como você está hoje?</h1>

      <EscalaPergunta label="Seu humor hoje" valor={humor} onChange={setHumor} />
      <EscalaPergunta
        label="Como você se sente com seu corpo hoje"
        valor={imagemCorporal}
        onChange={setImagemCorporal}
      />
      <EscalaPergunta label="Sua relação com a comida hoje" valor={comida} onChange={setComida} />

      <div className="space-y-2">
        <p className="text-sm text-texto-suave">
          Espaço opcional para desabafar. Este texto <strong>não é analisado nem monitorado</strong> —
          fica só no seu diário.
        </p>
        <textarea
          value={textoLivre}
          onChange={(e) => setTextoLivre(e.target.value)}
          className="w-full rounded-2xl border border-borda bg-superficie p-3 text-texto"
          rows={4}
          placeholder="Se quiser, escreva livremente aqui..."
        />
      </div>

      {erro && <p className="text-alerta">{erro}</p>}

      <Botao disabled={!podeEnviar} onClick={handleSubmit}>
        {enviando ? 'Enviando...' : 'Continuar'}
      </Botao>
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
      <p className="text-texto">{label}</p>
      <Escala valor={valor} onChange={onChange} />
    </div>
  );
}
```

- [ ] **Step 2: Aplicar tokens em `checkin/page.tsx`**

Substitua todo o conteúdo de `src/app/checkin/page.tsx` por:

```tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatDateISO } from '@/lib/date';
import LembreteBanner from '@/app/components/LembreteBanner';
import CheckinFormClient from './CheckinFormClient';

export default async function CheckinPage() {
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
            className="block w-full rounded-2xl border border-borda p-3 text-center text-texto-suave transition-colors hover:bg-superficie"
          >
            Ver progresso
          </a>
        </main>
      ) : (
        <CheckinFormClient />
      )}
    </>
  );
}
```

- [ ] **Step 3: Aplicar tokens em `LembreteBanner.tsx`**

Substitua todo o conteúdo de `src/app/components/LembreteBanner.tsx` por:

```tsx
export default function LembreteBanner({ jaFezCheckinHoje }: { jaFezCheckinHoje: boolean }) {
  if (jaFezCheckinHoje) return null;

  return (
    <div className="bg-destaque/15 p-3 text-sm text-texto">
      Você ainda não fez seu ritual hoje. Que tal 5 minutinhos agora? 🌿
    </div>
  );
}
```

- [ ] **Step 4: Verificar tipos e lint**

Run: `npx tsc --noEmit`
Expected: sem erros.

Run: `npx eslint src/app/checkin/CheckinFormClient.tsx src/app/checkin/page.tsx src/app/components/LembreteBanner.tsx`
Expected: sem erros.

- [ ] **Step 5: Verificar visualmente**

Abra `/checkin` sem ter feito o ritual hoje: confirme o banner de lembrete, os três seletores de escala usando o componente `Escala` (preenchido em verde salvia ao selecionar), e o textarea estilizado. Complete um check-in de teste e confirme que o fluxo de submissão continua funcionando (redireciona para prática ou jornada, como antes). Depois, recarregue a página e confirme que o estado "já fez o ritual hoje" também está estilizado.

- [ ] **Step 6: Commit**

```bash
git add src/app/checkin/CheckinFormClient.tsx src/app/checkin/page.tsx src/app/components/LembreteBanner.tsx
git commit -m "style: aplicar identidade visual Manhã de Domingo em /checkin"
```

---

### Task 7: Componente compartilhado `AntesDepoisAtividade` (usado por `/pratica/[id]` e `/jornada-atividade/[id]`)

**Files:**
- Modify: `src/app/components/AntesDepoisAtividade.tsx`

**Interfaces:**
- Consumes: `Botao`, `Escala` (Task 2).

- [ ] **Step 1: Aplicar tokens, `Botao` e `Escala` em `AntesDepoisAtividade.tsx`**

Substitua todo o conteúdo de `src/app/components/AntesDepoisAtividade.tsx` por:

```tsx
'use client';

import { useState } from 'react';
import Botao from '@/app/components/Botao';
import Escala from '@/app/components/Escala';

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
        <p className="text-texto">Antes de começar, como você está se sentindo agora?</p>
        <Escala valor={sensacaoAntes} onChange={setSensacaoAntes} />
        <Botao disabled={sensacaoAntes === null} onClick={() => setEtapa('atividade')}>
          Continuar
        </Botao>
      </main>
    );
  }

  if (etapa === 'atividade') {
    return (
      <main className="mx-auto max-w-md space-y-6 p-6">
        <h1 className="font-display text-2xl text-texto">{titulo}</h1>
        <p className="whitespace-pre-line text-texto">{conteudo}</p>
        <Botao onClick={() => setEtapa('depois')}>Concluí a atividade</Botao>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <p className="text-texto">Como você se sente agora?</p>
      <Escala valor={sensacaoDepois} onChange={setSensacaoDepois} />
      <Botao
        disabled={sensacaoDepois === null || enviando}
        onClick={async () => {
          setEnviando(true);
          await aoFinalizar(sensacaoAntes!, sensacaoDepois!);
        }}
      >
        Finalizar
      </Botao>
    </main>
  );
}
```

- [ ] **Step 2: Verificar tipos e lint**

Run: `npx tsc --noEmit`
Expected: sem erros.

Run: `npx eslint src/app/components/AntesDepoisAtividade.tsx`
Expected: sem erros.

- [ ] **Step 3: Verificar visualmente**

Complete um check-in de teste até cair numa prática avulsa (`/pratica/[id]`) e confirme as três etapas (antes/atividade/depois) com os tokens aplicados. Repita para uma jornada ativa (`/jornada-atividade/[id]`) se houver uma jornada de teste ativada — o mesmo componente atende as duas rotas. Confirme que "Finalizar" ainda grava a sessão e redireciona para `/progresso`.

- [ ] **Step 4: Commit**

```bash
git add src/app/components/AntesDepoisAtividade.tsx
git commit -m "style: aplicar identidade visual Manhã de Domingo em AntesDepoisAtividade (pratica + jornada-atividade)"
```

---

### Task 8: Tela `/jornadas`

**Files:**
- Modify: `src/app/jornadas/page.tsx`
- Modify: `src/app/jornadas/AtivarJornadaButton.tsx`

**Interfaces:**
- Consumes: `Cartao`, `Botao` (Task 2), `BarraProgressoJornada` (Task 3).

- [ ] **Step 1: Aplicar `Cartao` e `BarraProgressoJornada` em `jornadas/page.tsx`**

Substitua todo o conteúdo de `src/app/jornadas/page.tsx` por:

```tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import AtivarJornadaButton from './AtivarJornadaButton';
import Cartao from '@/app/components/Cartao';
import BarraProgressoJornada from '@/app/components/BarraProgressoJornada';

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
    </main>
  );
}
```

- [ ] **Step 2: Aplicar `Botao` em `AtivarJornadaButton.tsx`**

Substitua todo o conteúdo de `src/app/jornadas/AtivarJornadaButton.tsx` por:

```tsx
'use client';

import { ativarJornada } from './actions';
import Botao from '@/app/components/Botao';

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
      <Botao disabled variante="secundaria">
        Jornada atual
      </Botao>
    );
  }

  return <Botao onClick={() => ativarJornada(jornadaId)}>{label}</Botao>;
}
```

- [ ] **Step 3: Verificar tipos e lint**

Run: `npx tsc --noEmit`
Expected: sem erros.

Run: `npx eslint src/app/jornadas/page.tsx src/app/jornadas/AtivarJornadaButton.tsx`
Expected: sem erros.

- [ ] **Step 4: Verificar visualmente**

Abra `/jornadas` logada. Confirme os cartões com sombra suave, a barra de progresso preenchida (na cor terracota) para qualquer jornada já iniciada, e que clicar em "Começar"/"Continuar" ainda ativa a jornada e reflete o novo estado.

- [ ] **Step 5: Commit**

```bash
git add src/app/jornadas/page.tsx src/app/jornadas/AtivarJornadaButton.tsx
git commit -m "style: aplicar identidade visual Manhã de Domingo em /jornadas"
```

---

### Task 9: Tela `/progresso`

**Files:**
- Modify: `src/app/progresso/page.tsx`

**Interfaces:**
- Consumes: `ProgressoBlobs` (Task 3).

- [ ] **Step 1: Aplicar tokens e `ProgressoBlobs` em `progresso/page.tsx`**

Substitua todo o conteúdo de `src/app/progresso/page.tsx` por:

```tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { calcularProgresso7Dias } from '@/lib/progress/streak';
import ProgressoBlobs from '@/app/components/ProgressoBlobs';

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
      <h1 className="font-display text-2xl text-texto">Seu progresso</h1>

      <p className="text-texto">
        Você completou o ritual em <strong>{progresso.diasCompletos} de 7</strong> dias esta semana.
      </p>

      {progresso.diasConsecutivosAtuais > 0 && (
        <p className="text-texto">
          Você está em uma sequência de {progresso.diasConsecutivosAtuais} dia(s) seguidos. 🌱
        </p>
      )}

      <ProgressoBlobs
        dias={progresso.ultimos7Dias.map((dia) => ({ rotulo: dia.data, completo: dia.completou }))}
      />

      <p className="text-sm text-texto-suave">
        Este resumo é só um retrato acolhedor da sua semana — ele não tira conclusões sobre o motivo
        dos seus dias serem como foram.
      </p>

      <a
        href="/checkin"
        className="block w-full rounded-2xl border border-borda p-3 text-center text-texto-suave transition-colors hover:bg-superficie"
      >
        Voltar ao início
      </a>
    </main>
  );
}
```

- [ ] **Step 2: Verificar tipos e lint**

Run: `npx tsc --noEmit`
Expected: sem erros.

Run: `npx eslint src/app/progresso/page.tsx`
Expected: sem erros.

- [ ] **Step 3: Verificar visualmente**

Abra `/progresso` logada. Confirme que os 7 indicadores aparecem como manchinhas orgânicas (não círculos perfeitos), preenchidas em terracota para os dias completos, e que passar o mouse sobre uma mostra a data no tooltip, como antes.

- [ ] **Step 4: Commit**

```bash
git add src/app/progresso/page.tsx
git commit -m "style: aplicar identidade visual Manhã de Domingo em /progresso"
```

---

### Task 10: Tela `/seguranca`

**Files:**
- Modify: `src/app/seguranca/page.tsx`

**Interfaces:**
- Consumes: utilitário `border-alerta` de `src/app/globals.css` (Task 1).

- [ ] **Step 1: Aplicar tokens em `seguranca/page.tsx`**

Substitua todo o conteúdo de `src/app/seguranca/page.tsx` por:

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
        <div key={recurso.id} className="space-y-1 border-l-4 border-alerta pl-4">
          <h2 className="font-display text-xl text-texto">{recurso.titulo}</h2>
          <p className="text-texto">{recurso.corpo}</p>
        </div>
      ))}

      <a
        href="/checkin"
        className="block w-full rounded-2xl border border-borda p-3 text-center text-texto-suave transition-colors hover:bg-superficie"
      >
        Voltar
      </a>
    </main>
  );
}
```

- [ ] **Step 2: Verificar tipos e lint**

Run: `npx tsc --noEmit`
Expected: sem erros.

Run: `npx eslint src/app/seguranca/page.tsx`
Expected: sem erros.

- [ ] **Step 3: Verificar visualmente**

Force o sinal de segurança num check-in de teste (respostas baixas) e confirme que `/seguranca` mostra os recursos com a borda lateral em terracota escuro — sóbrio, não um vermelho de alarme — e que "Voltar" continua levando para `/checkin`.

- [ ] **Step 4: Commit**

```bash
git add src/app/seguranca/page.tsx
git commit -m "style: aplicar identidade visual Manhã de Domingo em /seguranca"
```

---

### Task 11: Tela `/settings`

**Files:**
- Modify: `src/app/settings/page.tsx`

**Interfaces:**
- Consumes: `Botao` (Task 2).

- [ ] **Step 1: Aplicar tokens e `Botao` em `settings/page.tsx`**

Substitua todo o conteúdo de `src/app/settings/page.tsx` por:

```tsx
'use client';

import { useState } from 'react';
import { inscreverPush } from '@/lib/push/subscribe';
import { salvarHorarioPreferido } from './actions';
import Botao from '@/app/components/Botao';

export default function SettingsPage() {
  const [horario, setHorario] = useState('09:00');
  const [status, setStatus] = useState<string | null>(null);

  async function handleAtivar() {
    setStatus(null);
    try {
      const resultado = await inscreverPush();
      if (resultado === 'inscrita') {
        await salvarHorarioPreferido(horario);
        setStatus('Lembretes ativados!');
      } else if (resultado === 'negado') {
        setStatus('Permissão de notificação negada. Você ainda verá um lembrete visual no app.');
      } else {
        setStatus('Seu navegador não suporta notificações push. Você verá um lembrete visual no app.');
      }
    } catch {
      setStatus('Não foi possível ativar os lembretes agora. Tente novamente.');
    }
  }

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <h1 className="font-display text-2xl text-texto">Lembretes</h1>
      <label className="block text-texto">
        Horário preferido
        <input
          type="time"
          value={horario}
          onChange={(e) => setHorario(e.target.value)}
          className="mt-1 block w-full rounded-2xl border border-borda bg-superficie p-3 text-texto"
        />
      </label>
      <Botao onClick={handleAtivar}>Ativar lembretes</Botao>
      {status && <p className="text-texto">{status}</p>}
    </main>
  );
}
```

- [ ] **Step 2: Verificar tipos e lint**

Run: `npx tsc --noEmit`
Expected: sem erros.

Run: `npx eslint src/app/settings/page.tsx`
Expected: sem erros.

- [ ] **Step 3: Verificar visualmente**

Abra `/settings` logada e confirme os tokens aplicados. Clique em "Ativar lembretes" e confirme que o fluxo de inscrição push continua funcionando (ou mostrando a mensagem de permissão negada/não suportado, conforme o navegador), como antes.

- [ ] **Step 4: Commit**

```bash
git add src/app/settings/page.tsx
git commit -m "style: aplicar identidade visual Manhã de Domingo em /settings"
```

---

### Task 12: Tela `/premium`

**Files:**
- Modify: `src/app/premium/page.tsx`

**Interfaces:**
- Nenhuma dependência de componente compartilhado — as opções são botões com estado de seleção próprio, mantidos como `<button>` direto para preservar o destaque de borda ao selecionar.

- [ ] **Step 1: Aplicar tokens em `premium/page.tsx`**

Substitua todo o conteúdo de `src/app/premium/page.tsx` por:

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
        <p className="text-texto">Obrigada! Isso nos ajuda a construir a versão completa do app.</p>
        <a
          href="/checkin"
          className="block w-full rounded-2xl border border-borda p-3 text-center text-texto-suave transition-colors hover:bg-superficie"
        >
          Voltar
        </a>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <h1 className="font-display text-2xl text-texto">Versão Premium</h1>
      <p className="text-texto">
        Histórico completo, insights semanais, biblioteca completa de práticas e jornadas guiadas.
        Ainda não cobramos por isso — queremos entender se faria sentido para você.
      </p>
      <div className="space-y-3">
        {OPCOES.map((opcao) => (
          <button
            key={opcao.id}
            onClick={() => handleEscolher(opcao.id, opcao.preco)}
            className={`w-full rounded-2xl border p-3 text-left text-texto transition-colors ${
              escolhido === opcao.id ? 'border-acao bg-superficie' : 'border-borda'
            }`}
          >
            {opcao.label} {opcao.preco > 0 && `— R$ ${opcao.preco.toFixed(2)}`}
          </button>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verificar tipos e lint**

Run: `npx tsc --noEmit`
Expected: sem erros.

Run: `npx eslint src/app/premium/page.tsx`
Expected: sem erros.

- [ ] **Step 3: Verificar visualmente**

Abra `/premium` e confirme os tokens aplicados. Escolha uma opção e confirme que a intenção de pagamento ainda é registrada e a tela de agradecimento aparece, como antes.

- [ ] **Step 4: Commit**

```bash
git add src/app/premium/page.tsx
git commit -m "style: aplicar identidade visual Manhã de Domingo em /premium"
```

---

### Task 13: Tela `/privacidade`

**Files:**
- Modify: `src/app/privacidade/page.tsx`

**Interfaces:**
- Nenhuma dependência de componente compartilhado.

- [ ] **Step 1: Aplicar tokens em `privacidade/page.tsx`**

Substitua todo o conteúdo de `src/app/privacidade/page.tsx` por:

```tsx
export default function PrivacidadePage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="font-display text-2xl text-texto">Política de Privacidade e Termos de Uso</h1>

      <section className="space-y-2">
        <h2 className="font-display text-xl text-texto">O que coletamos</h2>
        <p className="text-texto">
          Coletamos seu e-mail para autenticação, e as respostas do seu check-in diário (humor,
          imagem corporal, relação com a comida, e um texto livre opcional). Esses são dados
          sensíveis de saúde nos termos da Lei Geral de Proteção de Dados (LGPD), e só os coletamos
          com seu consentimento explícito, dado no início do uso do app.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl text-texto">Como usamos e quem acessa</h2>
        <p className="text-texto">
          Seus dados individuais são usados para gerar sua recomendação diária e seu progresso
          pessoal. Por padrão, ninguém da nossa equipe visualiza dados ou respostas individuais de
          uma usuária específica. Qualquer acesso pontual só ocorre com finalidade definida,
          permissão explícita, e fica registrado internamente (quem acessou, quando, por quê). A
          psicóloga responsável pelo conteúdo do app recebe apenas dados agregados e anonimizados
          para avaliar o produto, nunca dados que identifiquem uma usuária específica.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl text-texto">O texto livre do check-in</h2>
        <p className="text-texto">
          O campo opcional de texto livre não é analisado nem monitorado nesta versão do app — é
          apenas armazenado como parte do seu diário pessoal.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl text-texto">Retenção e exclusão</h2>
        <p className="text-texto">
          Seus dados são mantidos enquanto sua conta estiver ativa. Ao excluir sua conta, seus dados
          são apagados ou anonimizados em até 30 dias.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl text-texto">Seus direitos</h2>
        <p className="text-texto">
          Você pode solicitar a exportação ou exclusão dos seus dados a qualquer momento, e pode
          tirar qualquer dúvida sobre como seus dados são tratados, escrevendo para{' '}
          <a href="mailto:almeidaferreiraluisgustavo@gmail.com" className="underline">
            almeidaferreiraluisgustavo@gmail.com
          </a>
          . Respondemos pedidos em até alguns dias úteis.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl text-texto">O que este app não é</h2>
        <p className="text-texto">
          Este app não é terapia, não faz diagnóstico e não substitui acompanhamento profissional de
          saúde física ou mental.
        </p>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Verificar tipos e lint**

Run: `npx tsc --noEmit`
Expected: sem erros.

Run: `npx eslint src/app/privacidade/page.tsx`
Expected: sem erros.

- [ ] **Step 3: Verificar visualmente**

Abra `/privacidade` (rota pública, funciona deslogada) e confirme os tokens aplicados em todas as seções.

- [ ] **Step 4: Commit**

```bash
git add src/app/privacidade/page.tsx
git commit -m "style: aplicar identidade visual Manhã de Domingo em /privacidade"
```

---

### Task 14: Verificação final de build

**Files:**
- Nenhum arquivo novo — só verificação.

- [ ] **Step 1: Build completo**

Run: `npm run build`
Expected: build limpo, sem erros de tipo, lint ou geração de páginas — confirma que a troca de fontes (`next/font/google`) e o redirect de `/` não quebram a fase de build, como já aconteceu antes com a VAPID key.

- [ ] **Step 2: Passagem manual por todo o fluxo**

Com `npm run dev`, percorra o fluxo completo uma última vez: `/` → redireciona para `/checkin` → `/login` → `/onboarding` → `/checkin` → prática ou jornada → `/progresso` → `/jornadas` → `/seguranca` → `/settings` → `/premium` → `/privacidade`. Confirme visualmente que todas as telas usam os mesmos tokens de forma consistente e que nenhum fluxo funcional regrediu.

- [ ] **Step 3: Commit (se houver algo a corrigir) ou encerrar**

Se o build ou a passagem manual revelar algo a ajustar, corrija no arquivo correspondente e commit. Se estiver tudo limpo, esta tarefa não gera commit próprio — ela é a validação de que as Tasks 1-13 estão prontas para revisão final.
