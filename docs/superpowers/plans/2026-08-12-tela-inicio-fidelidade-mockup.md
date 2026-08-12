# Tela de Início — Fidelidade Visual ao Mockup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajustar a tela de início (`src/app/page.tsx` + `src/app/components/inicio/*`) já implementada para bater com fidelidade visual maior ao mockup de referência fornecido pela usuária: carinhas no seletor de humor (ordem melhor→pior), cartão de sequência com ilustração de rosa em vaso, botão de check-in isolado, sino no cabeçalho e safe-area no rodapé.

**Architecture:** Nenhum componente novo de infraestrutura — só edições cirúrgicas nos componentes de `src/app/components/inicio/*` e no `NavegacaoInferior.tsx`/`layout.tsx` já existentes, seguindo o padrão já estabelecido (Server Component `page.tsx` busca dados, componentes filhos são "burros" ou client components só quando precisam de interação). A tabela de mapeamento `humor → EstadoGeral` em `src/lib/checkin/humorInicial.ts` é invertida (numeração passa a ir de melhor=1 a pior=5) mantendo o mesmo contrato de tipos.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4 (tokens em `src/app/globals.css`, sem `tailwind.config.js`), TypeScript, Vitest (testes de lógica pura em `src/lib/`), Supabase (sem mudança de schema nesta rodada).

## Global Constraints

- Trabalhar exclusivamente no worktree `C:\Users\luis ferreira\Documents\Aplicativo-Mulheres\.claude\worktrees\ritual-diario-mvp` (branch `experiencia-completa`) — é onde o projeto Next.js real vive, não na raiz do repositório.
- Não criar `tailwind.config.js` nem framework visual novo — tokens ficam em `@theme` dentro de `src/app/globals.css`.
- Não usar ícones de biblioteca externa (lucide/heroicons) — todo ícone é SVG inline, seguindo o padrão já usado em `NavegacaoInferior.tsx`.
- Não usar emoji do sistema para as carinhas do seletor de humor — expressão feita em SVG (olhos + boca).
- Reaproveitar tokens de cor já existentes quando forem equivalentes ao mockup (não introduzir uma paleta paralela).
- `tsc --noEmit`, `eslint`, `npm run test` e `npm run build` devem ficar limpos ao final de cada tarefa que toca código TypeScript/React.
- Nenhuma migration de banco nesta rodada.
- Componentes React deste projeto não têm testes automatizados (nenhum arquivo `*.test.tsx` existe hoje) — só funções puras em `src/lib/*` têm teste colocalizado. Seguir esse padrão: não introduzir testes de componente novos: verificação de componentes visuais é manual, no navegador.

---

## Mapa de arquivos

| Arquivo | Ação |
|---|---|
| `src/app/globals.css` | Modificar — novos hex dos tokens `--color-humor-1..5` |
| `src/lib/checkin/humorInicial.ts` | Modificar — inverter `QUADRANTE_POR_HUMOR` |
| `src/lib/checkin/humorInicial.test.ts` | Modificar — nova tabela esperada |
| `src/app/components/inicio/SeletorHumor.tsx` | Reescrever — client component, ordem/cores/carinhas novas, seleção animada |
| `src/app/components/inicio/SequenciaDias.tsx` | Reescrever — título/subtítulo dinâmicos, pontos sem letras de dia, ilustração de rosa em vaso |
| `src/app/components/inicio/JornadaEmAndamento.tsx` | Modificar — círculo da ilustração passa de lilás para rosa-claro |
| `src/app/components/inicio/RitualDeHoje.tsx` | Modificar — estado "não fez check-in" vira botão isolado, sem título/descrição |
| `src/app/components/inicio/Saudacao.tsx` | Modificar — fallback "Sofia" + botão de sino linkando para `/settings` |
| `src/app/components/NavegacaoInferior.tsx` | Modificar — padding de safe-area no rodapé |
| `src/app/layout.tsx` | Modificar — `viewportFit: 'cover'` |
| `src/app/page.tsx` | Modificar — reordenar seções, `ResumoDoDia`/`SeletorHumor` mutuamente exclusivos, padding de safe-area no `<main>` |

---

### Task 1: Novos tokens de cor do seletor de humor

**Files:**
- Modify: `src/app/globals.css:12-16`

**Interfaces:**
- Consumes: nada.
- Produces: tokens CSS `--color-humor-1` a `--color-humor-5` com novos valores, consumidos pela Task 3 (`SeletorHumor.tsx`).

- [ ] **Step 1: Confirmar que só `SeletorHumor.tsx` usa esses tokens**

Run: `grep -rn "color-humor" src` (a partir da raiz do worktree)
Expected: só ocorrências em `src/app/globals.css` (definição) e `src/app/components/inicio/SeletorHumor.tsx` (uso). Se aparecer em outro arquivo, pare e avise antes de continuar — a mudança de cor abaixo afetaria esse outro lugar também.

- [ ] **Step 2: Trocar os valores dos tokens**

Em `src/app/globals.css`, troque as linhas 12-16:

```css
  --color-humor-1: #91B99A;
  --color-humor-2: #E5BB70;
  --color-humor-3: #B9A6D4;
  --color-humor-4: #D98779;
  --color-humor-5: #B8697A;
```

(Antes eram `#A9B7D4`, `#9FC2B0`, `#E3C77A`, `#E3A26F`, `#D48CA6` — nessa ordem iam de "muito baixo" a "muito alto"; agora vão de "muito bem" (verde) a "muito mal" (rosa queimado), reaproveitando `--color-destaque` e `--color-acao` para os níveis 3 e 5.)

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: recolorir tokens de humor para ordem melhor-para-pior"
```

---

### Task 2: Inverter a tabela `humor → EstadoGeral`

**Files:**
- Modify: `src/lib/checkin/humorInicial.ts`
- Test: `src/lib/checkin/humorInicial.test.ts`

**Interfaces:**
- Consumes: tipo `EstadoGeral` de `@/lib/supabase/types` (sem mudança).
- Produces: `estadoInicialParaHumor(humor: HumorInicial): EstadoGeral` — mesma assinatura, novo mapeamento (1=melhor/`alta_energia_conforto` → 5=pior/`baixa_energia_desconforto`). Consumido por `src/app/checkin/CheckinFormClient.tsx:84` (não muda, só se beneficia da nova tabela). `validarHumorParam` não muda de comportamento.

- [ ] **Step 1: Reescrever o teste com a tabela invertida (vai falhar)**

Em `src/lib/checkin/humorInicial.test.ts`, troque o bloco `describe('estadoInicialParaHumor', ...)` (linhas 4-14) por:

```ts
describe('estadoInicialParaHumor', () => {
  it.each([
    [1, 'alta_energia_conforto'],
    [2, 'alta_energia_conforto'],
    [3, 'baixa_energia_conforto'],
    [4, 'baixa_energia_desconforto'],
    [5, 'baixa_energia_desconforto'],
  ] as const)('mapeia humor %i para %s', (humor, esperado) => {
    expect(estadoInicialParaHumor(humor as HumorInicial)).toBe(esperado);
  });
});
```

O resto do arquivo (`describe('validarHumorParam', ...)`) não muda.

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npm run test -- src/lib/checkin/humorInicial.test.ts`
Expected: FAIL nos 5 casos de `estadoInicialParaHumor` (a implementação ainda tem a tabela antiga).

- [ ] **Step 3: Inverter a implementação**

Em `src/lib/checkin/humorInicial.ts`, troque `QUADRANTE_POR_HUMOR` (linhas 5-11):

```ts
const QUADRANTE_POR_HUMOR: Record<HumorInicial, EstadoGeral> = {
  1: 'alta_energia_conforto',
  2: 'alta_energia_conforto',
  3: 'baixa_energia_conforto',
  4: 'baixa_energia_desconforto',
  5: 'baixa_energia_desconforto',
};
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npm run test -- src/lib/checkin/humorInicial.test.ts`
Expected: PASS em todos os casos.

- [ ] **Step 5: Commit**

```bash
git add src/lib/checkin/humorInicial.ts src/lib/checkin/humorInicial.test.ts
git commit -m "fix: inverter mapeamento humor-EstadoGeral para numeração melhor-para-pior"
```

---

### Task 3: Reescrever `SeletorHumor.tsx` — ordem, carinhas, seleção animada

**Files:**
- Modify: `src/app/components/inicio/SeletorHumor.tsx`

**Interfaces:**
- Consumes: tokens `--color-humor-1..5` (Task 1), rota `/checkin?humor=N` (já existente, `HumorInicial` de Task 2).
- Produces: componente `SeletorHumor` sem props, renderizado por `src/app/page.tsx` (assinatura não muda).

- [ ] **Step 1: Substituir o arquivo inteiro**

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Cartao from '@/app/components/Cartao';

type Humor = 1 | 2 | 3 | 4 | 5;

const NIVEIS: { valor: Humor; rotulo: string; cor: string; curvaBoca: string }[] = [
  { valor: 1, rotulo: 'Muito bem', cor: 'var(--color-humor-1)', curvaBoca: 'M13 23 Q20 30 27 23' },
  { valor: 2, rotulo: 'Bem', cor: 'var(--color-humor-2)', curvaBoca: 'M14 24 Q20 28 26 24' },
  { valor: 3, rotulo: 'Neutro', cor: 'var(--color-humor-3)', curvaBoca: 'M14 26 H26' },
  { valor: 4, rotulo: 'Mal', cor: 'var(--color-humor-4)', curvaBoca: 'M14 27 Q20 23 26 27' },
  { valor: 5, rotulo: 'Muito mal', cor: 'var(--color-humor-5)', curvaBoca: 'M13 28 Q20 21 27 28' },
];

function CarinhaHumor({ cor, curvaBoca }: { cor: string; curvaBoca: string }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill={cor} />
      <circle cx="14" cy="17" r="1.8" fill="#fff" fillOpacity="0.9" />
      <circle cx="26" cy="17" r="1.8" fill="#fff" fillOpacity="0.9" />
      <path d={curvaBoca} stroke="#fff" strokeOpacity="0.9" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export default function SeletorHumor() {
  const router = useRouter();
  const [selecionado, setSelecionado] = useState<Humor | null>(null);

  function selecionar(valor: Humor) {
    setSelecionado(valor);
    setTimeout(() => router.push(`/checkin?humor=${valor}`), 180);
  }

  return (
    <Cartao className="space-y-4 text-center">
      <p className="font-display text-lg text-texto">
        Como você está
        <br />
        se sentindo hoje?
      </p>
      <div className="flex justify-between gap-1">
        {NIVEIS.map((nivel) => (
          <button
            key={nivel.valor}
            type="button"
            onClick={() => selecionar(nivel.valor)}
            aria-label={nivel.rotulo}
            className={`flex flex-1 flex-col items-center gap-1.5 rounded-full transition-transform duration-200 motion-reduce:transition-none ${
              selecionado === nivel.valor
                ? 'scale-110 ring-2 ring-acao ring-offset-2 ring-offset-superficie'
                : ''
            }`}
          >
            <CarinhaHumor cor={nivel.cor} curvaBoca={nivel.curvaBoca} />
            <span className="text-[11px] leading-tight text-texto-suave">{nivel.rotulo}</span>
          </button>
        ))}
      </div>
    </Cartao>
  );
}
```

- [ ] **Step 2: Checar tipos e lint**

Run: `npx tsc --noEmit` e `npm run lint`
Expected: sem erros novos relacionados a este arquivo.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/inicio/SeletorHumor.tsx
git commit -m "feat: seletor de humor com carinhas, ordem melhor-para-pior e seleção animada"
```

---

### Task 4: Reescrever `SequenciaDias.tsx` — título dinâmico, pontos sem rótulo de dia, rosa em vaso

**Files:**
- Modify: `src/app/components/inicio/SequenciaDias.tsx`

**Interfaces:**
- Consumes: `Progresso7Dias` de `@/lib/progress/streak` (sem mudança de tipo).
- Produces: componente `SequenciaDias({ progresso })` — assinatura não muda, `src/app/page.tsx` continua chamando igual.

- [ ] **Step 1: Substituir o arquivo inteiro**

```tsx
import Link from 'next/link';
import type { Progresso7Dias } from '@/lib/progress/streak';

function tituloSequencia(dias: number): string {
  if (dias === 0) return 'Comece sua sequência hoje';
  if (dias === 1) return '1 dia de sequência';
  return `${dias} dias de sequência`;
}

function IlustracaoRosaVaso() {
  return (
    <svg aria-hidden="true" width="64" height="72" viewBox="0 0 64 72" fill="none" className="shrink-0">
      <path d="M32 52c-2-12 2-22 0-32" stroke="var(--color-salvia)" strokeWidth="2" strokeLinecap="round" />
      <path d="M32 40c-6-2-10 2-11 7 6 0 10-3 11-7Z" fill="var(--color-salvia)" fillOpacity="0.55" />
      <path d="M32 34c6-2 10 1 11 6-6 1-10-2-11-6Z" fill="var(--color-salvia)" fillOpacity="0.55" />
      <circle cx="32" cy="16" r="9" fill="var(--color-acao)" fillOpacity="0.2" />
      <path
        d="M32 9c4 0 7 3 7 7s-3 7-7 7-7-3-7-7 3-7 7-7Z"
        fill="var(--color-acao)"
      />
      <path
        d="M32 12.5c2.5 0 4.5 2 4.5 4.5S34.5 21.5 32 21.5s-4.5-2-4.5-4.5S29.5 12.5 32 12.5Z"
        fill="var(--color-alerta)"
        fillOpacity="0.55"
      />
      <rect x="20" y="49" width="24" height="4" rx="2" fill="var(--color-pessego)" fillOpacity="0.6" />
      <path
        d="M22 53h20l-2.6 14.2a2 2 0 0 1-2 1.65H26.6a2 2 0 0 1-2-1.65L22 53Z"
        fill="var(--color-pessego)"
        fillOpacity="0.4"
      />
    </svg>
  );
}

export default function SequenciaDias({ progresso }: { progresso: Progresso7Dias }) {
  const titulo = tituloSequencia(progresso.diasConsecutivosAtuais);
  const subtitulo =
    progresso.diasConsecutivosAtuais > 0
      ? 'Continue assim! Você está cuidando de você.'
      : 'Seu primeiro check-in começa a sequência.';

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-2xl bg-superficie p-4 shadow-[0_2px_8px_rgba(74,63,53,0.08)]">
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="font-display text-lg text-texto">{titulo}</p>
            <p className="text-sm text-texto-suave">{subtitulo}</p>
          </div>
          <div className="flex gap-2">
            {progresso.ultimos7Dias.map((dia) => (
              <span
                key={dia.data}
                title={dia.data}
                className={
                  dia.completou
                    ? 'block h-3 w-3 rounded-full bg-acao'
                    : 'block h-3 w-3 rounded-full border border-borda'
                }
              />
            ))}
          </div>
        </div>

        <IlustracaoRosaVaso />
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

- [ ] **Step 2: Checar tipos e lint**

Run: `npx tsc --noEmit` e `npm run lint`
Expected: sem erros novos.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/inicio/SequenciaDias.tsx
git commit -m "feat: cartao de sequencia com titulo dinamico e ilustracao de rosa em vaso"
```

---

### Task 5: `JornadaEmAndamento.tsx` — círculo rosa-claro

**Files:**
- Modify: `src/app/components/inicio/JornadaEmAndamento.tsx:31,34`

**Interfaces:**
- Consumes/Produces: nada muda de contrato — só cor.

- [ ] **Step 1: Trocar as cores do SVG decorativo**

Nas linhas 31 e 34, troque `#B9A6D4` por `var(--color-acao)` e ajuste a opacidade do fundo:

```tsx
            <rect width="56" height="56" rx="14" fill="var(--color-acao)" fillOpacity="0.15" />
            <path
              d="M18 38c2-10 3-15 10-20 7 5 8 10 10 20"
              stroke="var(--color-acao)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
```

- [ ] **Step 2: Checar tipos e lint**

Run: `npx tsc --noEmit` e `npm run lint`
Expected: sem erros novos.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/inicio/JornadaEmAndamento.tsx
git commit -m "style: circulo da ilustracao de jornada passa de lilas para rosa-claro"
```

---

### Task 6: `RitualDeHoje.tsx` — botão de check-in isolado

**Files:**
- Modify: `src/app/components/inicio/RitualDeHoje.tsx`

**Interfaces:**
- Consumes/Produces: `RitualDeHoje({ jaFezCheckinHoje: boolean })` — assinatura não muda.

- [ ] **Step 1: Substituir o branch "ainda não fez check-in"**

Troque as linhas 23-38 (o `return` de quando `jaFezCheckinHoje` é `false`) por:

```tsx
  return (
    <Link
      href="/checkin"
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-acao p-4 text-base font-medium text-white transition-colors hover:bg-acao/90"
    >
      <IconeCoracao />
      Fazer check-in
    </Link>
  );
```

O branch `if (jaFezCheckinHoje) { ... }` (linhas 13-21, cartão "Ritual de hoje concluído") não muda. O import de `Cartao` continua necessário por causa desse branch — não remover.

- [ ] **Step 2: Checar tipos e lint**

Run: `npx tsc --noEmit` e `npm run lint`
Expected: sem erros novos.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/inicio/RitualDeHoje.tsx
git commit -m "feat: botao de check-in isolado, sem titulo e descricao"
```

---

### Task 7: `Saudacao.tsx` — fallback "Sofia" e sino

**Files:**
- Modify: `src/app/components/inicio/Saudacao.tsx`

**Interfaces:**
- Consumes: nenhuma mudança de import externo além de `next/link`.
- Produces: `Saudacao({ nome: string | null })` — assinatura não muda; `src/app/page.tsx` continua passando `nome={perfil?.nome ?? null}`.

- [ ] **Step 1: Substituir o arquivo inteiro**

```tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';

function saudacaoPorHorario(hora: number): string {
  if (hora < 5) return 'Boa noite';
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

function IconeSino() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

// O horário do servidor não é o horário local da usuária, então o
// cumprimento certo só existe no cliente — o servidor renderiza um valor
// neutro e o suppressHydrationWarning evita o aviso da divergência esperada.
export default function Saudacao({ nome }: { nome: string | null }) {
  const [saudacao] = useState(() =>
    typeof window === 'undefined' ? 'Olá' : saudacaoPorHorario(new Date().getHours())
  );

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="font-display text-2xl text-texto" suppressHydrationWarning>
        {saudacao}, {nome ?? 'Sofia'}
      </p>
      <Link
        href="/settings"
        aria-label="Ver lembretes"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-borda bg-superficie text-texto-suave transition-colors hover:bg-fundo"
      >
        <IconeSino />
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Checar tipos e lint**

Run: `npx tsc --noEmit` e `npm run lint`
Expected: sem erros novos.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/inicio/Saudacao.tsx
git commit -m "feat: saudacao com fallback de nome e botao de sino para lembretes"
```

---

### Task 8: Safe-area no rodapé e no viewport

**Files:**
- Modify: `src/app/layout.tsx:22-24`
- Modify: `src/app/components/NavegacaoInferior.tsx:66-69`
- Modify: `src/app/page.tsx:52` (padding do `<main>`, ver Task 9 — pode ser feito junto ou nesta tarefa; aqui só o valor da classe)

**Interfaces:**
- Consumes/Produces: nenhuma mudança de contrato — só CSS/viewport.

- [ ] **Step 1: Adicionar `viewportFit` ao viewport do layout**

Em `src/app/layout.tsx`, troque:

```ts
export const viewport: Viewport = {
  themeColor: "#FBF6F0",
};
```

por:

```ts
export const viewport: Viewport = {
  themeColor: "#FBF6F0",
  viewportFit: "cover",
};
```

- [ ] **Step 2: Adicionar padding de safe-area na navegação inferior**

Em `src/app/components/NavegacaoInferior.tsx`, linha 68, troque:

```tsx
      className="fixed inset-x-0 bottom-0 z-20 border-t border-borda bg-superficie/95 backdrop-blur"
```

por:

```tsx
      className="fixed inset-x-0 bottom-0 z-20 border-t border-borda bg-superficie/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
```

- [ ] **Step 3: Garantir que o `<main>` da início reserve espaço suficiente**

Em `src/app/page.tsx`, linha 52, troque `pb-24 md:pb-6` por `pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-6` (mantém os 6rem atuais de respiro e soma o inset dinamicamente, em vez de chutar um número maior fixo).

- [ ] **Step 4: Checar tipos e lint**

Run: `npx tsc --noEmit` e `npm run lint`
Expected: sem erros novos.

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx src/app/components/NavegacaoInferior.tsx src/app/page.tsx
git commit -m "feat: respeitar safe-area do iPhone/Android na navegacao inferior"
```

---

### Task 9: Reordenar `page.tsx`

**Files:**
- Modify: `src/app/page.tsx:51-72`

**Interfaces:**
- Consumes: `Saudacao`, `ResumoDoDia`, `SeletorHumor`, `SequenciaDias`, `JornadaEmAndamento`, `RitualDeHoje`, `MensagemAcolhedora`, `NavegacaoInferior` — todos já existentes, assinaturas não mudam (Tasks 3-8 já as ajustaram).
- Produces: ordem final da tela renderizada por `InicioPage`.

- [ ] **Step 1: Reescrever o JSX de retorno**

Troque o bloco `return (...)` (linhas 51-72) por:

```tsx
  return (
    <main className="relative mx-auto max-w-md space-y-6 overflow-hidden p-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-6">
      <FundoDecorativo />

      <Saudacao nome={perfil?.nome ?? null} />

      {jaFezCheckinHoje ? <ResumoDoDia checkinHoje={checkinHoje} /> : <SeletorHumor />}

      <SequenciaDias progresso={progresso} />

      <JornadaEmAndamento jornada={jornadaEmAndamento} />

      <RitualDeHoje jaFezCheckinHoje={jaFezCheckinHoje} />

      <MensagemAcolhedora />

      <NavegacaoInferior />
    </main>
  );
```

Nota: isso muda `ResumoDoDia` e `SeletorHumor` de "ambos podiam aparecer juntos" (o texto "você ainda não fez check-in" da `ResumoDoDia` + o cartão inteiro do seletor) para mutuamente exclusivos — bate com a referência (só um bloco por vez) e remove a redundância de texto. `MensagemAcolhedora` sai de entre `SequenciaDias` e `JornadaEmAndamento` e passa para depois do botão de check-in.

(Esta tarefa já inclui o padding do `<main>` da Task 8, Step 3 — se a Task 8 já foi feita, esse trecho da linha já estará certo; só confirme que não sobrou `pb-24 md:pb-6` antigo.)

- [ ] **Step 2: Checar tipos e lint**

Run: `npx tsc --noEmit` e `npm run lint`
Expected: sem erros novos.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "refactor: reordenar secoes da tela de inicio conforme mockup"
```

---

### Task 10: Verificação final

**Files:** nenhum arquivo novo — só comandos e checagem visual.

**Interfaces:** N/A.

- [ ] **Step 1: Suite completa**

Run, em sequência, a partir da raiz do worktree:

```bash
npx tsc --noEmit
npm run lint
npm run test
npm run build
```

Expected: todos limpos (sem erros, sem warnings novos). Se `npm run test` quebrar algum teste fora de `humorInicial.test.ts` que dependia da ordem/cores antigas dos tokens de humor (nenhum encontrado na Task 1, Step 1, mas reconfirmar aqui), ajustar esse teste antes de prosseguir.

- [ ] **Step 2: Subir o dev server e abrir a tela de início**

Run: `npm run dev` (ou usar a ferramenta de preview do navegador apontando para o dev server já configurado em `.claude/launch.json`, se existir; senão criar uma entrada `{"name": "web", "runtimeExecutable": "npm", "runtimeArgs": ["run", "dev"], "port": 3000}`)

Abrir `/` autenticado (usuária de teste já existente no Supabase local/dev).

- [ ] **Step 3: Checar nas três larguras pedidas**

Redimensionar a janela/preview para 360px, 390px e 430px de largura. Em cada uma, conferir:
- Seletor de humor: ordem Muito bem → Muito mal, carinhas visíveis, anel de seleção ao tocar antes de navegar para `/checkin`.
- Cartão de sequência: título dinâmico, pontos em bordô/neutro, ilustração de rosa em vaso não corta nem sobrepõe o texto.
- Cartão "Continue sua jornada": círculo rosa-claro, cartão inteiro clicável.
- Botão "Fazer check-in": largura total, sem título/descrição acima, cantos arredondados, texto legível.
- Sino no cabeçalho: visível, alvo de toque confortável, leva para `/settings`.
- Navegação inferior: 5 abas, Início em bordô quando ativo, sem sobreposição de conteúdo (testar com `resize_window` + emulação de notch se a ferramenta permitir, senão inspecionar `padding-bottom` calculado via devtools).
- Estado alternativo: fazer um check-in de teste e recarregar `/` — confirmar que `SeletorHumor` some e `ResumoDoDia` aparece no lugar, sem duplicar texto.

- [ ] **Step 4: Comparar com a imagem de referência**

Colocar a screenshot da tela implementada lado a lado com o mockup original fornecido pela usuária; anotar qualquer diferença de espaçamento/proporção perceptível e ajustar classes Tailwind pontualmente (sem reabrir tarefas já commitadas — um commit de ajuste fino é aceitável).

- [ ] **Step 5: Commit final de ajustes finos (se houver)**

```bash
git add -A
git commit -m "fix: ajustes finos de espacamento apos checagem visual"
```

Se nenhum ajuste foi necessário, pular este commit.
