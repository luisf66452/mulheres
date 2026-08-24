# Sequência Gentil + Resumo Semanal Pessoal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Seções 3 ("Sequência gentil") e 4 ("Resumo semanal pessoal") do design aprovado em `docs/superpowers/specs/2026-08-24-evolucao-rose-design.md` — unificar o texto de sequência entre Home e `/progresso`, mostrar totais acumulados de check-ins, e adicionar um resumo semanal descritivo (gate Rose Pro) na página `/progresso`, sem alterar cálculo técnico já existente nem persistir dado novo.

**Architecture:** `descreverSequencia()` em `src/lib/progress/streak.ts` passa a receber um objeto de parâmetros (incluindo os dias ativos dos últimos 7 dias e se houve check-in hoje) e vira a única fonte de texto de sequência, consumida tanto por `CartaoSequencia.tsx` (`/progresso`) quanto por `SequenciaDias.tsx` (Home). Um novo módulo puro `src/lib/progress/resumoSemanal.ts` recebe check-ins já filtrados por semana (reaproveitando o cálculo de semana/fuso já feito em `/progresso/page.tsx`) e retorna uma estrutura de dados descritiva; um novo componente server `ResumoSemanalPessoal` renderiza essa estrutura com gate Rose Pro. Nenhuma tabela nova, nenhuma migration, nenhum dado novo persistido.

**Tech Stack:** Next.js (App Router, React Server Components), TypeScript, Supabase (`@supabase/ssr`), Vitest + Testing Library (jsdom), Tailwind (classes utilitárias do design system existente: `texto`, `texto-suave`, `superfície`, `borda`, `acao`).

## Global Constraints

- A Rose não é terapia, não diagnostica, não substitui acompanhamento profissional.
- Nunca classificar a usuária com transtornos, distorções, riscos clínicos ou conclusões psicológicas.
- Proibido: "você melhorou", "você piorou", "isso significa que", "a causa é", previsões emocionais, "bom"/"ruim"/"normal"/"anormal".
- Linguagem sempre descritiva: "nos seus registros", "nesta semana", "você registrou", "apareceu com mais frequência".
- Sem chatbot terapêutico, sem LLM analisando reflexões, sem envio de dados emocionais a serviços externos.
- Segurança, exportação e privacidade nunca ficam atrás do Rose Pro.
- Sequência gentil: nunca "perdeu"/"quebrou"/alertas vermelhos/chama quebrada/contagem regressiva; sempre "Você cuidou de si em X dos últimos 7 dias" / "Você pode recomeçar hoje".
- Resumo semanal completo exige `plano === 'premium'`; free vê prévia, mas o aviso legal aparece sempre, mesmo na prévia.
- Nenhum dado novo persistido no resumo semanal — cálculo sob demanda.
- Mobile-first, acolhedor, sem cores/mensagens punitivas.
- Nenhuma mudança na lógica de cálculo técnico já existente em `streak.ts`/`semana.ts` — mudança é de apresentação/texto/parâmetros/composição.

---

## File Structure

| File | Responsabilidade |
|---|---|
| `src/lib/date.ts` | Modificar — extrai `dataISONoFuso(data, fusoHorario)` reaproveitável para converter timestamps arbitrários (não só "agora") para a data local da usuária; `hojeISONoFuso` passa a delegar para ela. |
| `src/lib/progress/streak.ts` | Modificar — `descreverSequencia()` ganha novo formato de parâmetros (objeto) com `diasAtivosUltimos7` e `fezCheckinHoje`. |
| `src/lib/progress/streak.test.ts` | Modificar — testes de `descreverSequencia` reescritos para o novo formato + varredura de vocabulário proibido. |
| `src/lib/testing/vocabularioProibido.ts` | Criar — lista compartilhada de termos proibidos, reaproveitada pelos testes de sequência e de resumo semanal. |
| `src/app/progresso/CartaoSequencia.tsx` | Modificar — deriva `diasAtivosUltimos7`/`fezCheckinHoje` de `ultimos7Dias` e chama `descreverSequencia()` com o novo formato. Props externas do componente não mudam. |
| `src/app/progresso/CartaoSequencia.test.tsx` | Modificar — cobre dia perdido, retorno após pausa e semana sem atividade. |
| `src/app/progresso/MelhorSequencia.tsx` | Modificar — ganha prop `totalCheckins` e exibe o total acumulado de check-ins, além da melhor sequência. |
| `src/app/progresso/MelhorSequencia.test.tsx` | Criar — cobre melhor sequência 0 (nada renderizado), exibição da melhor sequência + total. |
| `src/app/progresso/page.tsx` | Modificar — passa `totalCheckins` para `MelhorSequencia`; amplia o select de `checkins`; busca `plano`; monta `resumoSemanal` e renderiza `ResumoSemanalPessoal`. |
| `src/app/components/inicio/SequenciaDias.tsx` | Modificar — para de duplicar lógica de título/subtítulo; passa a consumir `descreverSequencia()`. Ganha prop `totalCheckins`. |
| `src/app/components/inicio/SequenciaDias.test.tsx` | Criar — cobre primeiro check-in, dias consecutivos, dia perdido. |
| `src/app/page.tsx` | Modificar — passa `totalCheckins` para `SequenciaDias`. |
| `src/lib/progress/resumoSemanal.ts` | Criar — módulo puro `calcularResumoSemanal()`. |
| `src/lib/progress/resumoSemanal.test.ts` | Criar — cobre semana vazia, poucos registros, semana completa, comparação indisponível/permitida, destaque de tema, vocabulário proibido. |
| `src/app/progresso/ResumoSemanalPessoal.tsx` | Criar — componente server, aviso legal fixo, gate Rose Pro (prévia para free). |
| `src/app/progresso/ResumoSemanalPessoal.test.tsx` | Criar — cobre aviso legal sempre visível, prévia free vs. resumo completo premium, estado vazio. |

---

## Task 1: `dataISONoFuso` — generalizar a conversão de data para o fuso da usuária

**Files:**
- Modify: `src/lib/date.ts`
- Test: `src/lib/date.test.ts`

**Interfaces:**
- Produces: `dataISONoFuso(data: Date, fusoHorario: string): string` — mesma lógica de fuso já usada por `hojeISONoFuso`, mas para qualquer `Date`, não só "agora". Necessária na Task 7 para converter timestamps de sessões/práticas concluídas (`criado_em`/`concluida_em`, `timestamptz`) para a data local da usuária antes de contar quantas caíram na semana selecionada.

- [ ] **Step 1: Escrever o teste que falha**

Adicione ao final de `src/lib/date.test.ts` (mantendo os describes existentes intactos):

```ts
describe('dataISONoFuso', () => {
  it('converte um Date arbitrário (não só "agora") para a data local da usuária', () => {
    const data = new Date('2026-08-11T02:00:00.000Z');
    expect(dataISONoFuso(data, 'America/Sao_Paulo')).toBe('2026-08-10');
    expect(dataISONoFuso(data, 'UTC')).toBe('2026-08-11');
  });

  it('cai de volta ao formatDateISO do próprio Date se o fuso for inválido', () => {
    const data = new Date('2026-08-11T12:00:00.000Z');
    expect(dataISONoFuso(data, 'fuso-que-nao-existe')).toBe(formatDateISO(data));
  });
});
```

Atualize o import no topo do arquivo:

```ts
import { formatDateISO, hojeISONoFuso, hojeNoFuso, dataISONoFuso } from './date';
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npm test -- date.test.ts`
Expected: FAIL com "dataISONoFuso is not defined" ou erro de import.

- [ ] **Step 3: Implementar `dataISONoFuso` e fazer `hojeISONoFuso` reaproveitá-la**

Substitua todo o conteúdo de `src/lib/date.ts` por:

```ts
export function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Converte qualquer Date para a data local (YYYY-MM-DD) no fuso informado.
// Usada tanto para "hoje" (ver hojeISONoFuso) quanto para timestamps
// arbitrários já gravados (ex.: criado_em de sessões, concluida_em de
// práticas) que precisam ser agrupados por dia local da usuária — mesmo
// padrão de fuso já usado em todo o módulo de progresso. Se o fuso for
// inválido/desconhecido, cai de volta ao horário do servidor em vez de
// quebrar.
export function dataISONoFuso(data: Date, fusoHorario: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: fusoHorario,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(data);
  } catch {
    return formatDateISO(data);
  }
}

// "Hoje" no fuso da usuária, não no fuso do servidor (produção roda em UTC).
// Sem isso, uma usuária no Brasil que faz o check-in à noite (ex.: 21h em
// São Paulo = 00h UTC do dia seguinte) teria o registro gravado com a data
// de amanhã, quebrando a sequência e a checagem de "já fez check-in hoje".
export function hojeISONoFuso(fusoHorario: string): string {
  return dataISONoFuso(new Date(), fusoHorario);
}

// Mesmo padrão já usado em lib/progress/semana.ts e streak.ts: um Date à
// meia-noite local (sem sufixo "Z") — o restante do código de progresso já
// lê data/dia-da-semana desse jeito, então basta ancorar "hoje" no fuso
// certo aqui para tudo o que consome esse Date (calcularProgresso7Dias,
// calcularSemana, resolverSegundaFeira etc.) ficar correto, sem precisar
// mudar nenhuma dessas funções.
export function hojeNoFuso(fusoHorario: string): Date {
  return new Date(`${hojeISONoFuso(fusoHorario)}T00:00:00`);
}
```

- [ ] **Step 4: Rodar todos os testes de `date.test.ts` e confirmar que passam**

Run: `npm test -- date.test.ts`
Expected: PASS (inclusive os testes antigos de `hojeISONoFuso`/`hojeNoFuso`, que continuam funcionando pois `vi.setSystemTime` afeta `new Date()` dentro de `dataISONoFuso`).

- [ ] **Step 5: Commit**

```bash
git add src/lib/date.ts src/lib/date.test.ts
git commit -m "feat: extrair dataISONoFuso para converter timestamps arbitrários ao fuso da usuária"
```

---

## Task 2: Vocabulário proibido compartilhado

**Files:**
- Create: `src/lib/testing/vocabularioProibido.ts`

**Interfaces:**
- Produces: `export const VOCABULARIO_PROIBIDO: string[]` — reaproveitada nas Tasks 3 e 8 para varrer texto gerado.

- [ ] **Step 1: Criar o arquivo (sem teste — é uma constante de dados, não lógica)**

```ts
// Lista de termos/expressões proibidos em qualquer texto gerado pela Rose
// sobre progresso, sequência ou resumo semanal — ver seção "Regras
// transversais" de docs/superpowers/specs/2026-08-24-evolucao-rose-design.md.
// Comparação é sempre case-insensitive (ver uso em streak.test.ts e
// resumoSemanal.test.ts).
export const VOCABULARIO_PROIBIDO = [
  'você melhorou',
  'você piorou',
  'isso significa que',
  'a causa é',
  'bom',
  'ruim',
  'normal',
  'anormal',
  'perdeu',
  'quebrou',
  'chama quebrada',
  'contagem regressiva',
];
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/testing/vocabularioProibido.ts
git commit -m "test: adicionar lista compartilhada de vocabulário proibido para sequência e resumo semanal"
```

---

## Task 3: `descreverSequencia()` — novo formato de parâmetros

**Files:**
- Modify: `src/lib/progress/streak.ts`
- Modify: `src/lib/progress/streak.test.ts`

**Interfaces:**
- Consumes: `VOCABULARIO_PROIBIDO` (Task 2).
- Produces:
  ```ts
  export interface DescreverSequenciaParams {
    diasConsecutivosAtuais: number;
    totalCheckins: number;
    diasAtivosUltimos7: boolean[]; // 7 posições, mais antigo → mais recente (hoje é o último)
    fezCheckinHoje: boolean;
  }
  export function descreverSequencia(params: DescreverSequenciaParams): DescricaoSequencia
  ```
  Usada pelas Tasks 4 e 6 com essa assinatura exata. `DescricaoSequencia` (`{ titulo: string; mensagem: string }`) não muda.

- [ ] **Step 1: Escrever os testes que falham (substituindo o describe antigo)**

Em `src/lib/progress/streak.test.ts`, substitua todo o describe `descreverSequencia` (linhas 99-122 do arquivo atual) por:

```ts
describe('descreverSequencia', () => {
  it('mostra a mensagem de início no primeiro check-in (nenhum check-in ainda)', () => {
    const resultado = descreverSequencia({
      diasConsecutivosAtuais: 0,
      totalCheckins: 0,
      diasAtivosUltimos7: [false, false, false, false, false, false, false],
      fezCheckinHoje: false,
    });
    expect(resultado.titulo).toBe('Comece hoje sua jornada');
  });

  it('mostra o número real de dias consecutivos quando há check-in hoje', () => {
    const resultado = descreverSequencia({
      diasConsecutivosAtuais: 3,
      totalCheckins: 5,
      diasAtivosUltimos7: [false, false, false, false, true, true, true],
      fezCheckinHoje: true,
    });
    expect(resultado.titulo).toBe('3 dias de sequência');
    expect(resultado.mensagem).toBe('Que lindo ver você priorizando você.');
  });

  it('usa singular para 1 dia de sequência', () => {
    const resultado = descreverSequencia({
      diasConsecutivosAtuais: 1,
      totalCheckins: 1,
      diasAtivosUltimos7: [false, false, false, false, false, false, true],
      fezCheckinHoje: true,
    });
    expect(resultado.titulo).toBe('1 dia de sequência');
  });

  it('dia perdido: sem check-in hoje mas com a maior parte da semana ativa, mostra quantos dias cuidou de si', () => {
    const resultado = descreverSequencia({
      diasConsecutivosAtuais: 0,
      totalCheckins: 10,
      diasAtivosUltimos7: [true, true, true, true, true, true, false],
      fezCheckinHoje: false,
    });
    expect(resultado.titulo).toBe('Você pode recomeçar hoje');
    expect(resultado.mensagem).toBe('Você cuidou de si em 6 dos últimos 7 dias.');
  });

  it('retorno após pausa: sem check-in hoje e só um dia ativo na semana, ainda reconhece o dia cuidado', () => {
    const resultado = descreverSequencia({
      diasConsecutivosAtuais: 0,
      totalCheckins: 10,
      diasAtivosUltimos7: [false, false, false, false, false, true, false],
      fezCheckinHoje: false,
    });
    expect(resultado.titulo).toBe('Você pode recomeçar hoje');
    expect(resultado.mensagem).toBe('Você cuidou de si em 1 dos últimos 7 dias.');
  });

  it('semana sem atividade: nenhum dos últimos 7 dias tem check-in, mesmo havendo histórico anterior', () => {
    const resultado = descreverSequencia({
      diasConsecutivosAtuais: 0,
      totalCheckins: 10,
      diasAtivosUltimos7: [false, false, false, false, false, false, false],
      fezCheckinHoje: false,
    });
    expect(resultado.titulo).toBe('Você pode recomeçar hoje');
    expect(resultado.mensagem).toBe(
      'Nenhum dos últimos 7 dias teve registro — você pode recomeçar quando fizer sentido para você.'
    );
  });

  it('reflete o número real de dias recebido, nunca um valor fixo', () => {
    const resultado = descreverSequencia({
      diasConsecutivosAtuais: 7,
      totalCheckins: 20,
      diasAtivosUltimos7: [true, true, true, true, true, true, true],
      fezCheckinHoje: true,
    });
    expect(resultado.titulo).toBe('7 dias de sequência');
  });

  it('nunca usa vocabulário proibido, em nenhuma combinação de estado', () => {
    const combinacoes: Parameters<typeof descreverSequencia>[0][] = [
      { diasConsecutivosAtuais: 0, totalCheckins: 0, diasAtivosUltimos7: [false, false, false, false, false, false, false], fezCheckinHoje: false },
      { diasConsecutivosAtuais: 1, totalCheckins: 1, diasAtivosUltimos7: [false, false, false, false, false, false, true], fezCheckinHoje: true },
      { diasConsecutivosAtuais: 5, totalCheckins: 12, diasAtivosUltimos7: [true, true, true, true, true, false, true], fezCheckinHoje: true },
      { diasConsecutivosAtuais: 0, totalCheckins: 8, diasAtivosUltimos7: [true, true, true, true, true, true, false], fezCheckinHoje: false },
      { diasConsecutivosAtuais: 0, totalCheckins: 8, diasAtivosUltimos7: [false, false, false, false, false, true, false], fezCheckinHoje: false },
      { diasConsecutivosAtuais: 0, totalCheckins: 8, diasAtivosUltimos7: [false, false, false, false, false, false, false], fezCheckinHoje: false },
    ];

    for (const params of combinacoes) {
      const { titulo, mensagem } = descreverSequencia(params);
      const textoCompleto = `${titulo} ${mensagem}`.toLowerCase();
      for (const termoProibido of VOCABULARIO_PROIBIDO) {
        expect(textoCompleto).not.toContain(termoProibido);
      }
    }
  });
});
```

Atualize o import no topo do arquivo:

```ts
import { describe, it, expect } from 'vitest';
import { calcularProgresso7Dias, calcularMelhorSequencia, formatarSequencia, descreverSequencia } from './streak';
import { VOCABULARIO_PROIBIDO } from '@/lib/testing/vocabularioProibido';
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npm test -- streak.test.ts`
Expected: FAIL — `descreverSequencia(0, 0)` (assinatura antiga) não bate mais com a nova chamada por objeto; TypeScript também deve acusar erro de tipos.

- [ ] **Step 3: Implementar o novo `descreverSequencia`**

Em `src/lib/progress/streak.ts`, substitua a função `descreverSequencia` existente (linhas 76-97) por:

```ts
export interface DescreverSequenciaParams {
  diasConsecutivosAtuais: number;
  totalCheckins: number;
  // 7 posições, do dia mais antigo ao mais recente — o último é hoje.
  // Normalmente vem de `ultimos7Dias.map((d) => d.completou)` (ver
  // Progresso7Dias acima).
  diasAtivosUltimos7: boolean[];
  fezCheckinHoje: boolean;
}

export function descreverSequencia(params: DescreverSequenciaParams): DescricaoSequencia {
  const { diasConsecutivosAtuais, totalCheckins, diasAtivosUltimos7, fezCheckinHoje } = params;

  if (totalCheckins === 0) {
    return {
      titulo: 'Comece hoje sua jornada',
      mensagem: 'Toda jornada começa com um passo — e hoje pode ser o seu.',
    };
  }

  if (fezCheckinHoje) {
    const unidade = diasConsecutivosAtuais === 1 ? 'dia' : 'dias';
    return {
      titulo: `${diasConsecutivosAtuais} ${unidade} de sequência`,
      mensagem: 'Que lindo ver você priorizando você.',
    };
  }

  // Sem check-in hoje: em vez de tratar "um dia perdido" e "uma semana
  // inteira sem atividade" da mesma forma (o que a versão antiga fazia,
  // por não ter os últimos 7 dias disponíveis), reconhece explicitamente
  // quantos dos últimos 7 dias tiveram check-in — nunca "perdeu"/"quebrou".
  const diasAtivosNaSemana = diasAtivosUltimos7.filter(Boolean).length;

  if (diasAtivosNaSemana === 0) {
    return {
      titulo: 'Você pode recomeçar hoje',
      mensagem: 'Nenhum dos últimos 7 dias teve registro — você pode recomeçar quando fizer sentido para você.',
    };
  }

  return {
    titulo: 'Você pode recomeçar hoje',
    mensagem: `Você cuidou de si em ${diasAtivosNaSemana} dos últimos 7 dias.`,
  };
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npm test -- streak.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: falha esperada aqui ainda, pois `CartaoSequencia.tsx` (Task 4) continua chamando a assinatura antiga — confirme que o único erro reportado é em `src/app/progresso/CartaoSequencia.tsx`. Se houver qualquer outro erro fora desse arquivo, pare e investigue antes de prosseguir.

- [ ] **Step 6: Commit**

```bash
git add src/lib/progress/streak.ts src/lib/progress/streak.test.ts
git commit -m "feat: descreverSequencia recebe dias ativos da semana e diferencia dia perdido, retorno e semana sem atividade"
```

---

## Task 4: `CartaoSequencia.tsx` — consumir o novo formato

**Files:**
- Modify: `src/app/progresso/CartaoSequencia.tsx`
- Modify: `src/app/progresso/CartaoSequencia.test.tsx`

**Interfaces:**
- Consumes: `descreverSequencia(params: DescreverSequenciaParams)` (Task 3), `ProgressoDia` (já existente em `streak.ts`).
- Produces: `CartaoSequencia({ diasConsecutivosAtuais, totalCheckins, ultimos7Dias })` — props externas **não mudam**, `src/app/progresso/page.tsx` continua chamando exatamente como hoje.

- [ ] **Step 1: Escrever os testes que falham (adicionar aos existentes)**

Adicione ao final de `src/app/progresso/CartaoSequencia.test.tsx` (mantendo os 3 testes existentes):

```ts
  it('dia perdido: sem check-in hoje mas com a maior parte da semana ativa, reconhece quantos dias cuidou de si', () => {
    render(
      <CartaoSequencia
        diasConsecutivosAtuais={0}
        totalCheckins={10}
        ultimos7Dias={seteDias([true, true, true, true, true, true, false])}
      />
    );
    expect(screen.getByText('Você pode recomeçar hoje')).toBeTruthy();
    expect(screen.getByText('Você cuidou de si em 6 dos últimos 7 dias.')).toBeTruthy();
  });

  it('semana sem atividade: nenhum ponto marcado, mesmo havendo check-ins antigos', () => {
    render(
      <CartaoSequencia
        diasConsecutivosAtuais={0}
        totalCheckins={10}
        ultimos7Dias={seteDias([false, false, false, false, false, false, false])}
      />
    );
    expect(
      screen.getByText(
        'Nenhum dos últimos 7 dias teve registro — você pode recomeçar quando fizer sentido para você.'
      )
    ).toBeTruthy();
  });
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npm test -- CartaoSequencia.test.tsx`
Expected: FAIL — o componente ainda chama `descreverSequencia` com a assinatura antiga (2 argumentos posicionais), então o texto renderizado não bate.

- [ ] **Step 3: Atualizar o componente**

Substitua todo o conteúdo de `src/app/progresso/CartaoSequencia.tsx` por:

```tsx
import { descreverSequencia, type ProgressoDia } from '@/lib/progress/streak';

export default function CartaoSequencia({
  diasConsecutivosAtuais,
  totalCheckins,
  ultimos7Dias,
}: {
  diasConsecutivosAtuais: number;
  totalCheckins: number;
  ultimos7Dias: ProgressoDia[];
}) {
  const diasAtivosUltimos7 = ultimos7Dias.map((dia) => dia.completou);
  const fezCheckinHoje = diasAtivosUltimos7[diasAtivosUltimos7.length - 1] ?? false;
  const { titulo, mensagem } = descreverSequencia({
    diasConsecutivosAtuais,
    totalCheckins,
    diasAtivosUltimos7,
    fezCheckinHoje,
  });

  return (
    <div className="flex items-center gap-4 rounded-2xl bg-superficie p-4 shadow-[0_2px_8px_rgba(74,63,53,0.08)]">
      <div className="min-w-0 flex-1 space-y-2">
        <h2 className="font-display text-xl text-texto">{titulo}</h2>
        <p className="text-sm text-texto-suave">{mensagem}</p>
        <div className="flex gap-2 pt-1" role="list" aria-label="Dias com check-in nos últimos 7 dias">
          {ultimos7Dias.map((dia) => (
            <span
              key={dia.data}
              role="listitem"
              aria-label={dia.completou ? `Dia com check-in: ${dia.data}` : `Dia sem check-in: ${dia.data}`}
              className={`h-2.5 w-2.5 rounded-full ${dia.completou ? 'bg-acao' : 'bg-borda'}`}
            />
          ))}
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
  );
}
```

- [ ] **Step 4: Rodar todos os testes de `CartaoSequencia.test.tsx` e confirmar que passam**

Run: `npm test -- CartaoSequencia.test.tsx`
Expected: PASS (5 testes: início, dias consecutivos, recomeço genérico, dia perdido, semana sem atividade).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS sem erros.

- [ ] **Step 6: Commit**

```bash
git add src/app/progresso/CartaoSequencia.tsx src/app/progresso/CartaoSequencia.test.tsx
git commit -m "feat: CartaoSequencia usa o novo formato de descreverSequencia e cobre dia perdido/semana sem atividade"
```

---

## Task 5: `MelhorSequencia.tsx` — total acumulado de check-ins

**Files:**
- Modify: `src/app/progresso/MelhorSequencia.tsx`
- Create: `src/app/progresso/MelhorSequencia.test.tsx`
- Modify: `src/app/progresso/page.tsx:162` (chamada de `<MelhorSequencia .../>`)

**Interfaces:**
- Produces: `MelhorSequencia({ melhorSequencia, totalCheckins }: { melhorSequencia: number; totalCheckins: number })` — prop `totalCheckins` é nova; `melhorSequencia` mantém o mesmo significado de hoje (retorno de `calcularMelhorSequencia`, já calculado em `page.tsx`).

- [ ] **Step 1: Escrever o teste que falha**

Crie `src/app/progresso/MelhorSequencia.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MelhorSequencia from './MelhorSequencia';

describe('MelhorSequencia', () => {
  it('não renderiza nada quando não há nenhuma sequência (sem check-ins)', () => {
    const { container } = render(<MelhorSequencia melhorSequencia={0} totalCheckins={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('mostra a melhor sequência e o total acumulado de check-ins', () => {
    render(<MelhorSequencia melhorSequencia={5} totalCheckins={23} />);
    expect(screen.getByText('5 dias seguidos')).toBeTruthy();
    expect(screen.getByText('23')).toBeTruthy();
  });

  it('reflete o total real de check-ins recebido, nunca um valor fixo', () => {
    render(<MelhorSequencia melhorSequencia={1} totalCheckins={1} />);
    expect(screen.getByText('1 dia seguido')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npm test -- MelhorSequencia.test.tsx`
Expected: FAIL — `totalCheckins` não existe na prop do componente atual, e o total acumulado não é exibido.

- [ ] **Step 3: Atualizar o componente**

Substitua todo o conteúdo de `src/app/progresso/MelhorSequencia.tsx` por:

```tsx
import { formatarSequencia } from '@/lib/progress/streak';

export default function MelhorSequencia({
  melhorSequencia,
  totalCheckins,
}: {
  melhorSequencia: number;
  totalCheckins: number;
}) {
  if (melhorSequencia === 0) {
    return null;
  }

  return (
    <div className="space-y-1 text-sm text-texto-suave">
      <p>
        Sua melhor sequência até agora:{' '}
        <strong className="text-texto">{formatarSequencia(melhorSequencia)}</strong>
      </p>
      <p>
        Total de check-ins registrados: <strong className="text-texto">{totalCheckins}</strong>
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Atualizar a chamada em `src/app/progresso/page.tsx`**

Em `src/app/progresso/page.tsx`, troque:

```tsx
        <MelhorSequencia melhorSequencia={melhorSequencia} />
```

por:

```tsx
        <MelhorSequencia melhorSequencia={melhorSequencia} totalCheckins={todosOsCheckins.length} />
```

- [ ] **Step 5: Rodar os testes e confirmar que passam**

Run: `npm test -- MelhorSequencia.test.tsx`
Expected: PASS.

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS sem erros.

- [ ] **Step 7: Commit**

```bash
git add src/app/progresso/MelhorSequencia.tsx src/app/progresso/MelhorSequencia.test.tsx src/app/progresso/page.tsx
git commit -m "feat: MelhorSequencia exibe total acumulado de check-ins, não só a maior sequência consecutiva"
```

---

## Task 6: `SequenciaDias.tsx` (Home) — parar de duplicar lógica

**Files:**
- Modify: `src/app/components/inicio/SequenciaDias.tsx`
- Create: `src/app/components/inicio/SequenciaDias.test.tsx`
- Modify: `src/app/page.tsx:84` (chamada de `<SequenciaDias .../>`)

**Interfaces:**
- Consumes: `descreverSequencia(params: DescreverSequenciaParams)` (Task 3).
- Produces: `SequenciaDias({ progresso, totalCheckins }: { progresso: Progresso7Dias; totalCheckins: number })` — prop `totalCheckins` é nova (antes só recebia `progresso`); `src/app/page.tsx` precisa da atualização do Step 4.

- [ ] **Step 1: Escrever o teste que falha**

Crie `src/app/components/inicio/SequenciaDias.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SequenciaDias from './SequenciaDias';
import type { Progresso7Dias } from '@/lib/progress/streak';

const progressoComDias = (completos: boolean[]): Progresso7Dias => {
  const ultimos7Dias = completos.map((completou, i) => ({ data: `2026-08-1${i}`, completou }));
  let diasConsecutivosAtuais = 0;
  for (let i = ultimos7Dias.length - 1; i >= 0; i--) {
    if (ultimos7Dias[i].completou) diasConsecutivosAtuais++;
    else break;
  }
  return {
    diasCompletos: completos.filter(Boolean).length,
    diasConsecutivosAtuais,
    ultimos7Dias,
  };
};

describe('SequenciaDias', () => {
  it('mostra a mensagem de início no primeiro check-in', () => {
    render(
      <SequenciaDias
        progresso={progressoComDias([false, false, false, false, false, false, false])}
        totalCheckins={0}
      />
    );
    expect(screen.getByText('Comece hoje sua jornada')).toBeTruthy();
  });

  it('mostra o número real de dias consecutivos quando há check-in hoje', () => {
    render(
      <SequenciaDias
        progresso={progressoComDias([true, true, true, true, false, false, true])}
        totalCheckins={8}
      />
    );
    expect(screen.getByText('1 dia de sequência')).toBeTruthy();
  });

  it('dia perdido: sem check-in hoje, reconhece quantos dias cuidou de si na semana', () => {
    render(
      <SequenciaDias
        progresso={progressoComDias([true, true, true, true, true, true, false])}
        totalCheckins={10}
      />
    );
    expect(screen.getByText('Você pode recomeçar hoje')).toBeTruthy();
    expect(screen.getByText('Você cuidou de si em 6 dos últimos 7 dias.')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npm test -- src/app/components/inicio/SequenciaDias.test.tsx`
Expected: FAIL — o componente atual não aceita `totalCheckins` e usa `tituloSequencia`/`subtitulo` locais, que não produzem esse texto.

- [ ] **Step 3: Atualizar o componente**

Substitua todo o conteúdo de `src/app/components/inicio/SequenciaDias.tsx` por:

```tsx
import Link from 'next/link';
import { descreverSequencia, type Progresso7Dias } from '@/lib/progress/streak';

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

export default function SequenciaDias({
  progresso,
  totalCheckins,
}: {
  progresso: Progresso7Dias;
  totalCheckins: number;
}) {
  const diasAtivosUltimos7 = progresso.ultimos7Dias.map((dia) => dia.completou);
  const fezCheckinHoje = diasAtivosUltimos7[diasAtivosUltimos7.length - 1] ?? false;
  const { titulo, mensagem } = descreverSequencia({
    diasConsecutivosAtuais: progresso.diasConsecutivosAtuais,
    totalCheckins,
    diasAtivosUltimos7,
    fezCheckinHoje,
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-2xl bg-superficie p-4 shadow-[0_2px_8px_rgba(74,63,53,0.08)]">
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="font-display text-lg text-texto">{titulo}</p>
            <p className="text-sm text-texto-suave">{mensagem}</p>
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

- [ ] **Step 4: Atualizar a chamada em `src/app/page.tsx`**

Em `src/app/page.tsx`, troque:

```tsx
      <SequenciaDias progresso={progresso} />
```

por:

```tsx
      <SequenciaDias progresso={progresso} totalCheckins={(checkins ?? []).length} />
```

- [ ] **Step 5: Rodar os testes e confirmar que passam**

Run: `npm test -- src/app/components/inicio/SequenciaDias.test.tsx`
Expected: PASS.

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS sem erros.

- [ ] **Step 7: Commit**

```bash
git add src/app/components/inicio/SequenciaDias.tsx src/app/components/inicio/SequenciaDias.test.tsx src/app/page.tsx
git commit -m "feat: SequenciaDias na Home consome descreverSequencia em vez de duplicar a lógica de título/subtítulo"
```

---

## Task 7: `resumoSemanal.ts` — módulo puro de cálculo

**Files:**
- Create: `src/lib/progress/resumoSemanal.ts`
- Create: `src/lib/progress/resumoSemanal.test.ts`

**Interfaces:**
- Consumes: `ROTULO_HUMOR` de `src/lib/progress/semana.ts` (já existente); `VOCABULARIO_PROIBIDO` (Task 2); `EstadoGeral` de `src/lib/supabase/types.ts` (já existente).
- Produces (usadas pela Task 8 em `src/app/progresso/page.tsx` e `ResumoSemanalPessoal.tsx` com esses nomes/tipos exatos):
  ```ts
  export interface CheckinResumoSemanal {
    data: string;
    humor: number;
    imagem_corporal: number;
    comida: number | null;
    estado_geral: EstadoGeral | null;
    emocao_especifica: string | null;
    fatores: string[] | null;
  }

  export interface ResumoSemanalParams {
    checkinsSemana: CheckinResumoSemanal[];
    checkinsSemanaAnterior: CheckinResumoSemanal[];
    diasDaSemana: string[]; // as 7 datas ISO (segunda a domingo) da semana selecionada
    datasAtividadesConcluidas: string[]; // datas ISO (já no fuso da usuária) de sessões/práticas concluídas, de qualquer período — o módulo filtra pela semana
  }

  export interface ItemDistribuicao {
    rotulo: string;
    quantidade: number;
  }

  export interface TemaDestaque {
    rotulo: string;
    ocorrencias: number;
  }

  export interface ComparacaoSemanaAnterior {
    disponivel: boolean;
    diasComCheckinSemanaAnterior: number;
  }

  export interface ResumoSemanal {
    temRegistros: boolean;
    diasComCheckin: number;
    totalAtividadesConcluidas: number;
    temaDestaque: TemaDestaque | null;
    distribuicaoHumor: ItemDistribuicao[];
    distribuicaoImagemCorporal: ItemDistribuicao[];
    distribuicaoAlimentacao: ItemDistribuicao[];
    comparacaoSemanaAnterior: ComparacaoSemanaAnterior | null;
    mensagem: string;
  }

  export function calcularResumoSemanal(params: ResumoSemanalParams): ResumoSemanal
  ```

- [ ] **Step 1: Escrever os testes que falham**

Crie `src/lib/progress/resumoSemanal.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { calcularResumoSemanal, type CheckinResumoSemanal } from './resumoSemanal';
import { VOCABULARIO_PROIBIDO } from '@/lib/testing/vocabularioProibido';

const DIAS_DA_SEMANA = [
  '2026-08-10',
  '2026-08-11',
  '2026-08-12',
  '2026-08-13',
  '2026-08-14',
  '2026-08-15',
  '2026-08-16',
];

const DIAS_SEMANA_ANTERIOR = [
  '2026-08-03',
  '2026-08-04',
  '2026-08-05',
  '2026-08-06',
  '2026-08-07',
  '2026-08-08',
  '2026-08-09',
];

function checkin(overrides: Partial<CheckinResumoSemanal> & { data: string }): CheckinResumoSemanal {
  return {
    humor: 3,
    imagem_corporal: 3,
    comida: 3,
    estado_geral: null,
    emocao_especifica: null,
    fatores: null,
    ...overrides,
  };
}

describe('calcularResumoSemanal', () => {
  it('semana vazia: nenhum check-in e nenhuma atividade concluída', () => {
    const resultado = calcularResumoSemanal({
      checkinsSemana: [],
      checkinsSemanaAnterior: [],
      diasDaSemana: DIAS_DA_SEMANA,
      datasAtividadesConcluidas: [],
    });

    expect(resultado.temRegistros).toBe(false);
    expect(resultado.diasComCheckin).toBe(0);
    expect(resultado.totalAtividadesConcluidas).toBe(0);
    expect(resultado.distribuicaoHumor).toEqual([]);
    expect(resultado.comparacaoSemanaAnterior).toBeNull();
  });

  it('poucos registros: menos de 3 check-ins não calcula tema em destaque nem comparação', () => {
    const resultado = calcularResumoSemanal({
      checkinsSemana: [
        checkin({ data: '2026-08-10', emocao_especifica: 'ansiedade' }),
        checkin({ data: '2026-08-11', emocao_especifica: 'ansiedade' }),
      ],
      checkinsSemanaAnterior: [],
      diasDaSemana: DIAS_DA_SEMANA,
      datasAtividadesConcluidas: [],
    });

    expect(resultado.temRegistros).toBe(true);
    expect(resultado.diasComCheckin).toBe(2);
    expect(resultado.temaDestaque).toBeNull();
    expect(resultado.comparacaoSemanaAnterior?.disponivel).toBe(false);
  });

  it('semana completa: conta dias com check-in e atividades concluídas dentro do período', () => {
    const resultado = calcularResumoSemanal({
      checkinsSemana: DIAS_DA_SEMANA.map((data) => checkin({ data })),
      checkinsSemanaAnterior: [],
      diasDaSemana: DIAS_DA_SEMANA,
      datasAtividadesConcluidas: ['2026-08-11', '2026-08-12', '2026-08-12', '2026-08-01'],
    });

    expect(resultado.diasComCheckin).toBe(7);
    // '2026-08-01' está fora da semana selecionada e é ignorada.
    expect(resultado.totalAtividadesConcluidas).toBe(3);
  });

  it('comparação indisponível quando a semana anterior tem menos de 3 check-ins', () => {
    const resultado = calcularResumoSemanal({
      checkinsSemana: DIAS_DA_SEMANA.slice(0, 3).map((data) => checkin({ data })),
      checkinsSemanaAnterior: DIAS_SEMANA_ANTERIOR.slice(0, 2).map((data) => checkin({ data })),
      diasDaSemana: DIAS_DA_SEMANA,
      datasAtividadesConcluidas: [],
    });

    expect(resultado.comparacaoSemanaAnterior?.disponivel).toBe(false);
  });

  it('comparação permitida quando ambas as semanas têm 3 ou mais check-ins', () => {
    const resultado = calcularResumoSemanal({
      checkinsSemana: DIAS_DA_SEMANA.slice(0, 4).map((data) => checkin({ data })),
      checkinsSemanaAnterior: DIAS_SEMANA_ANTERIOR.slice(0, 3).map((data) => checkin({ data })),
      diasDaSemana: DIAS_DA_SEMANA,
      datasAtividadesConcluidas: [],
    });

    expect(resultado.comparacaoSemanaAnterior).toEqual({
      disponivel: true,
      diasComCheckinSemanaAnterior: 3,
    });
  });

  it('destaque de tema exige pelo menos 3 check-ins na semana e o item aparecer pelo menos 2 vezes', () => {
    const resultado = calcularResumoSemanal({
      checkinsSemana: [
        checkin({ data: '2026-08-10', emocao_especifica: 'gratidao' }),
        checkin({ data: '2026-08-11', emocao_especifica: 'ansiedade' }),
        checkin({ data: '2026-08-12', emocao_especifica: 'ansiedade' }),
      ],
      checkinsSemanaAnterior: [],
      diasDaSemana: DIAS_DA_SEMANA,
      datasAtividadesConcluidas: [],
    });

    expect(resultado.temaDestaque).toEqual({ rotulo: 'ansiedade', ocorrencias: 2 });
  });

  it('exclui "prefiro_nao_responder" do cômputo do tema em destaque', () => {
    const resultado = calcularResumoSemanal({
      checkinsSemana: [
        checkin({ data: '2026-08-10', emocao_especifica: 'prefiro_nao_responder' }),
        checkin({ data: '2026-08-11', emocao_especifica: 'prefiro_nao_responder' }),
        checkin({ data: '2026-08-12', emocao_especifica: 'prefiro_nao_responder' }),
      ],
      checkinsSemanaAnterior: [],
      diasDaSemana: DIAS_DA_SEMANA,
      datasAtividadesConcluidas: [],
    });

    expect(resultado.temaDestaque).toBeNull();
  });

  it('também considera fatores (não só emocao_especifica) no cômputo do tema em destaque', () => {
    const resultado = calcularResumoSemanal({
      checkinsSemana: [
        checkin({ data: '2026-08-10', fatores: ['sono', 'trabalho'] }),
        checkin({ data: '2026-08-11', fatores: ['sono'] }),
        checkin({ data: '2026-08-12', fatores: ['trabalho'] }),
      ],
      checkinsSemanaAnterior: [],
      diasDaSemana: DIAS_DA_SEMANA,
      datasAtividadesConcluidas: [],
    });

    expect(resultado.temaDestaque?.ocorrencias).toBe(2);
    expect(['sono', 'trabalho']).toContain(resultado.temaDestaque?.rotulo);
  });

  it('monta a distribuição de humor, imagem corporal e alimentação com todos os níveis de 1 a 5', () => {
    const resultado = calcularResumoSemanal({
      checkinsSemana: [
        checkin({ data: '2026-08-10', humor: 4, imagem_corporal: 2, comida: 3 }),
        checkin({ data: '2026-08-11', humor: 4, imagem_corporal: 2, comida: null }),
      ],
      checkinsSemanaAnterior: [],
      diasDaSemana: DIAS_DA_SEMANA,
      datasAtividadesConcluidas: [],
    });

    expect(resultado.distribuicaoHumor).toHaveLength(5);
    expect(resultado.distribuicaoHumor.find((i) => i.rotulo === 'Alto')?.quantidade).toBe(2);
    // comida null ("prefiro não responder") não entra na contagem de nenhum nível.
    const totalAlimentacao = resultado.distribuicaoAlimentacao.reduce((soma, i) => soma + i.quantidade, 0);
    expect(totalAlimentacao).toBe(1);
  });

  it('nunca usa vocabulário proibido na mensagem, em nenhum cenário', () => {
    const cenarios = [
      { checkinsSemana: [], checkinsSemanaAnterior: [], diasDaSemana: DIAS_DA_SEMANA, datasAtividadesConcluidas: [] },
      {
        checkinsSemana: DIAS_DA_SEMANA.map((data) => checkin({ data, emocao_especifica: 'ansiedade' })),
        checkinsSemanaAnterior: DIAS_SEMANA_ANTERIOR.map((data) => checkin({ data })),
        diasDaSemana: DIAS_DA_SEMANA,
        datasAtividadesConcluidas: ['2026-08-11'],
      },
    ];

    for (const cenario of cenarios) {
      const resultado = calcularResumoSemanal(cenario);
      const textoCompleto = resultado.mensagem.toLowerCase();
      for (const termoProibido of VOCABULARIO_PROIBIDO) {
        expect(textoCompleto).not.toContain(termoProibido);
      }
    }
  });
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npm test -- resumoSemanal.test.ts`
Expected: FAIL — `./resumoSemanal` não existe ainda.

- [ ] **Step 3: Implementar o módulo**

Crie `src/lib/progress/resumoSemanal.ts`:

```ts
import { ROTULO_HUMOR } from './semana';
import type { EstadoGeral } from '@/lib/supabase/types';

// Ainda sem revisão da psicóloga para rótulos clínicos de imagem corporal e
// alimentação — por isso usamos rótulos neutros por nível (mesma escala 1-5
// de humor), nunca "bom"/"ruim"/"normal"/"anormal". Ver seção "Conteúdo
// clínico... pendente de revisão" do design.
const ROTULO_IMAGEM_CORPORAL: Record<number, string> = {
  1: 'Nível 1',
  2: 'Nível 2',
  3: 'Nível 3',
  4: 'Nível 4',
  5: 'Nível 5',
};

const ROTULO_ALIMENTACAO: Record<number, string> = {
  1: 'Nível 1',
  2: 'Nível 2',
  3: 'Nível 3',
  4: 'Nível 4',
  5: 'Nível 5',
};

const VALORES_EXCLUIDOS_DO_DESTAQUE = new Set(['prefiro_nao_responder']);

export interface CheckinResumoSemanal {
  data: string;
  humor: number;
  imagem_corporal: number;
  comida: number | null;
  estado_geral: EstadoGeral | null;
  emocao_especifica: string | null;
  fatores: string[] | null;
}

export interface ResumoSemanalParams {
  checkinsSemana: CheckinResumoSemanal[];
  checkinsSemanaAnterior: CheckinResumoSemanal[];
  diasDaSemana: string[];
  datasAtividadesConcluidas: string[];
}

export interface ItemDistribuicao {
  rotulo: string;
  quantidade: number;
}

export interface TemaDestaque {
  rotulo: string;
  ocorrencias: number;
}

export interface ComparacaoSemanaAnterior {
  disponivel: boolean;
  diasComCheckinSemanaAnterior: number;
}

export interface ResumoSemanal {
  temRegistros: boolean;
  diasComCheckin: number;
  totalAtividadesConcluidas: number;
  temaDestaque: TemaDestaque | null;
  distribuicaoHumor: ItemDistribuicao[];
  distribuicaoImagemCorporal: ItemDistribuicao[];
  distribuicaoAlimentacao: ItemDistribuicao[];
  comparacaoSemanaAnterior: ComparacaoSemanaAnterior | null;
  mensagem: string;
}

function contarPorNivel(valores: number[], rotulos: Record<number, string>): ItemDistribuicao[] {
  const contagem = new Map<number, number>();
  for (const valor of valores) {
    contagem.set(valor, (contagem.get(valor) ?? 0) + 1);
  }
  return Object.keys(rotulos)
    .map(Number)
    .sort((a, b) => a - b)
    .map((nivel) => ({ rotulo: rotulos[nivel], quantidade: contagem.get(nivel) ?? 0 }));
}

function calcularTemaDestaque(checkinsSemana: CheckinResumoSemanal[]): TemaDestaque | null {
  if (checkinsSemana.length < 3) {
    return null;
  }

  const contagem = new Map<string, number>();
  for (const checkin of checkinsSemana) {
    if (checkin.emocao_especifica && !VALORES_EXCLUIDOS_DO_DESTAQUE.has(checkin.emocao_especifica)) {
      contagem.set(checkin.emocao_especifica, (contagem.get(checkin.emocao_especifica) ?? 0) + 1);
    }
    for (const fator of checkin.fatores ?? []) {
      if (!VALORES_EXCLUIDOS_DO_DESTAQUE.has(fator)) {
        contagem.set(fator, (contagem.get(fator) ?? 0) + 1);
      }
    }
  }

  let destaque: TemaDestaque | null = null;
  for (const [rotulo, ocorrencias] of contagem) {
    if (ocorrencias >= 2 && (!destaque || ocorrencias > destaque.ocorrencias)) {
      destaque = { rotulo, ocorrencias };
    }
  }
  return destaque;
}

export function calcularResumoSemanal(params: ResumoSemanalParams): ResumoSemanal {
  const { checkinsSemana, checkinsSemanaAnterior, diasDaSemana, datasAtividadesConcluidas } = params;

  const diasComCheckin = new Set(checkinsSemana.map((c) => c.data)).size;
  const totalAtividadesConcluidas = datasAtividadesConcluidas.filter((data) =>
    diasDaSemana.includes(data)
  ).length;

  if (diasComCheckin === 0 && totalAtividadesConcluidas === 0) {
    return {
      temRegistros: false,
      diasComCheckin: 0,
      totalAtividadesConcluidas: 0,
      temaDestaque: null,
      distribuicaoHumor: [],
      distribuicaoImagemCorporal: [],
      distribuicaoAlimentacao: [],
      comparacaoSemanaAnterior: null,
      mensagem: 'Nenhum registro nesta semana ainda — quando você fizer um check-in, ele aparece aqui.',
    };
  }

  const distribuicaoHumor = contarPorNivel(checkinsSemana.map((c) => c.humor), ROTULO_HUMOR);
  const distribuicaoImagemCorporal = contarPorNivel(
    checkinsSemana.map((c) => c.imagem_corporal),
    ROTULO_IMAGEM_CORPORAL
  );
  const distribuicaoAlimentacao = contarPorNivel(
    checkinsSemana.map((c) => c.comida).filter((valor): valor is number => valor !== null),
    ROTULO_ALIMENTACAO
  );

  const temaDestaque = calcularTemaDestaque(checkinsSemana);

  const diasComCheckinSemanaAnterior = new Set(checkinsSemanaAnterior.map((c) => c.data)).size;
  const comparacaoDisponivel = diasComCheckin >= 3 && diasComCheckinSemanaAnterior >= 3;
  const comparacaoSemanaAnterior: ComparacaoSemanaAnterior = {
    disponivel: comparacaoDisponivel,
    diasComCheckinSemanaAnterior,
  };

  const partesMensagem = [`Nos seus registros, você fez check-in em ${diasComCheckin} dos 7 dias desta semana.`];
  if (totalAtividadesConcluidas > 0) {
    partesMensagem.push(
      `Você concluiu ${totalAtividadesConcluidas} ${
        totalAtividadesConcluidas === 1 ? 'prática' : 'práticas'
      } nesta semana.`
    );
  }
  if (temaDestaque) {
    partesMensagem.push(`"${temaDestaque.rotulo}" apareceu com mais frequência nos seus registros.`);
  }
  if (comparacaoDisponivel) {
    partesMensagem.push(
      `Na semana anterior, você registrou check-in em ${diasComCheckinSemanaAnterior} dos 7 dias.`
    );
  }

  return {
    temRegistros: true,
    diasComCheckin,
    totalAtividadesConcluidas,
    temaDestaque,
    distribuicaoHumor,
    distribuicaoImagemCorporal,
    distribuicaoAlimentacao,
    comparacaoSemanaAnterior,
    mensagem: partesMensagem.join(' '),
  };
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npm test -- resumoSemanal.test.ts`
Expected: PASS (11 testes).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS sem erros.

- [ ] **Step 6: Commit**

```bash
git add src/lib/progress/resumoSemanal.ts src/lib/progress/resumoSemanal.test.ts
git commit -m "feat: adicionar módulo puro calcularResumoSemanal para o resumo semanal pessoal"
```

---

## Task 8: `ResumoSemanalPessoal` — componente server com gate Rose Pro

**Files:**
- Create: `src/app/progresso/ResumoSemanalPessoal.tsx`
- Create: `src/app/progresso/ResumoSemanalPessoal.test.tsx`

**Interfaces:**
- Consumes: `ResumoSemanal` (tipo exato da Task 7).
- Produces: `ResumoSemanalPessoal({ resumo, ehPremium }: { resumo: ResumoSemanal; ehPremium: boolean })` — consumida pela Task 9 em `src/app/progresso/page.tsx`.

- [ ] **Step 1: Escrever os testes que falham**

Crie `src/app/progresso/ResumoSemanalPessoal.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ResumoSemanalPessoal from './ResumoSemanalPessoal';
import type { ResumoSemanal } from '@/lib/progress/resumoSemanal';

const AVISO_LEGAL =
  'Este resumo descreve apenas o que você registrou e não representa diagnóstico ou avaliação clínica.';

const resumoVazio: ResumoSemanal = {
  temRegistros: false,
  diasComCheckin: 0,
  totalAtividadesConcluidas: 0,
  temaDestaque: null,
  distribuicaoHumor: [],
  distribuicaoImagemCorporal: [],
  distribuicaoAlimentacao: [],
  comparacaoSemanaAnterior: null,
  mensagem: 'Nenhum registro nesta semana ainda — quando você fizer um check-in, ele aparece aqui.',
};

const resumoComRegistros: ResumoSemanal = {
  temRegistros: true,
  diasComCheckin: 4,
  totalAtividadesConcluidas: 2,
  temaDestaque: { rotulo: 'ansiedade', ocorrencias: 2 },
  distribuicaoHumor: [
    { rotulo: 'Muito baixo', quantidade: 0 },
    { rotulo: 'Baixo', quantidade: 1 },
    { rotulo: 'Bem', quantidade: 2 },
    { rotulo: 'Alto', quantidade: 1 },
    { rotulo: 'Muito alto', quantidade: 0 },
  ],
  distribuicaoImagemCorporal: [
    { rotulo: 'Nível 1', quantidade: 0 },
    { rotulo: 'Nível 2', quantidade: 4 },
    { rotulo: 'Nível 3', quantidade: 0 },
    { rotulo: 'Nível 4', quantidade: 0 },
    { rotulo: 'Nível 5', quantidade: 0 },
  ],
  distribuicaoAlimentacao: [
    { rotulo: 'Nível 1', quantidade: 0 },
    { rotulo: 'Nível 2', quantidade: 0 },
    { rotulo: 'Nível 3', quantidade: 4 },
    { rotulo: 'Nível 4', quantidade: 0 },
    { rotulo: 'Nível 5', quantidade: 0 },
  ],
  comparacaoSemanaAnterior: { disponivel: true, diasComCheckinSemanaAnterior: 3 },
  mensagem: 'Nos seus registros, você fez check-in em 4 dos 7 dias desta semana.',
};

describe('ResumoSemanalPessoal', () => {
  it('mostra o aviso legal sempre, inclusive na prévia free', () => {
    render(<ResumoSemanalPessoal resumo={resumoComRegistros} ehPremium={false} />);
    expect(screen.getByText(AVISO_LEGAL)).toBeTruthy();
  });

  it('mostra o aviso legal também no estado vazio', () => {
    render(<ResumoSemanalPessoal resumo={resumoVazio} ehPremium={true} />);
    expect(screen.getByText(AVISO_LEGAL)).toBeTruthy();
  });

  it('estado vazio: mostra a mensagem de nenhum registro, sem distribuição', () => {
    render(<ResumoSemanalPessoal resumo={resumoVazio} ehPremium={true} />);
    expect(
      screen.getByText('Nenhum registro nesta semana ainda — quando você fizer um check-in, ele aparece aqui.')
    ).toBeTruthy();
  });

  it('free vê prévia com contagem de dias, mas não vê a distribuição completa nem o link fica escondido', () => {
    render(<ResumoSemanalPessoal resumo={resumoComRegistros} ehPremium={false} />);
    expect(screen.getByText('Você fez check-in em 4 dos 7 dias desta semana, nos seus registros.')).toBeTruthy();
    expect(screen.queryByText('Nível 2: 4')).toBeNull();
    expect(screen.getByRole('link', { name: 'Conhecer o Rose Pro' })).toBeTruthy();
  });

  it('premium vê o resumo completo com distribuição e mensagem', () => {
    render(<ResumoSemanalPessoal resumo={resumoComRegistros} ehPremium={true} />);
    expect(screen.getByText('Nos seus registros, você fez check-in em 4 dos 7 dias desta semana.')).toBeTruthy();
    expect(screen.getByText('Nível 2: 4')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Conhecer o Rose Pro' })).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npm test -- ResumoSemanalPessoal.test.tsx`
Expected: FAIL — `./ResumoSemanalPessoal` não existe ainda.

- [ ] **Step 3: Implementar o componente**

Crie `src/app/progresso/ResumoSemanalPessoal.tsx`:

```tsx
import Link from 'next/link';
import type { ItemDistribuicao, ResumoSemanal } from '@/lib/progress/resumoSemanal';

const AVISO_LEGAL =
  'Este resumo descreve apenas o que você registrou e não representa diagnóstico ou avaliação clínica.';

function ListaDistribuicao({ titulo, itens }: { titulo: string; itens: ItemDistribuicao[] }) {
  const itensComRegistro = itens.filter((item) => item.quantidade > 0);
  if (itensComRegistro.length === 0) {
    return null;
  }
  return (
    <div>
      <p className="font-medium text-texto">{titulo}</p>
      <ul className="mt-1 space-y-0.5 text-texto-suave">
        {itensComRegistro.map((item) => (
          <li key={item.rotulo}>
            {item.rotulo}: {item.quantidade}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ResumoSemanalPessoal({
  resumo,
  ehPremium,
}: {
  resumo: ResumoSemanal;
  ehPremium: boolean;
}) {
  return (
    <div className="space-y-3 rounded-2xl bg-superficie p-4 shadow-[0_2px_8px_rgba(74,63,53,0.08)]">
      <h2 className="font-display text-lg text-texto">Seu resumo da semana</h2>
      <p className="text-xs text-texto-suave">{AVISO_LEGAL}</p>

      {!resumo.temRegistros ? (
        <p className="text-sm text-texto-suave">{resumo.mensagem}</p>
      ) : ehPremium ? (
        <div className="space-y-3 text-sm text-texto">
          <p>{resumo.mensagem}</p>
          <ListaDistribuicao titulo="Humor nos seus registros" itens={resumo.distribuicaoHumor} />
          <ListaDistribuicao titulo="Imagem corporal nos seus registros" itens={resumo.distribuicaoImagemCorporal} />
          <ListaDistribuicao titulo="Alimentação nos seus registros" itens={resumo.distribuicaoAlimentacao} />
        </div>
      ) : (
        <div className="space-y-2 text-sm text-texto">
          <p>Você fez check-in em {resumo.diasComCheckin} dos 7 dias desta semana, nos seus registros.</p>
          <p className="text-texto-suave">
            O resumo completo, com distribuição de humor, imagem corporal, alimentação e comparação com a
            semana anterior, é parte do Rose Pro.
          </p>
          <Link
            href="/premium"
            className="block w-full rounded-2xl border border-borda p-3 text-center font-medium text-texto-suave transition-colors hover:bg-fundo"
          >
            Conhecer o Rose Pro
          </Link>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npm test -- ResumoSemanalPessoal.test.tsx`
Expected: PASS (5 testes).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS sem erros (o componente ainda não é usado em `page.tsx` — isso é a Task 9).

- [ ] **Step 6: Commit**

```bash
git add src/app/progresso/ResumoSemanalPessoal.tsx src/app/progresso/ResumoSemanalPessoal.test.tsx
git commit -m "feat: adicionar componente ResumoSemanalPessoal com aviso legal fixo e gate Rose Pro"
```

---

## Task 9: Ligar tudo em `/progresso/page.tsx`

**Files:**
- Modify: `src/app/progresso/page.tsx`

**Interfaces:**
- Consumes: `calcularResumoSemanal(params: ResumoSemanalParams)` (Task 7), `CheckinResumoSemanal` (Task 7), `dataISONoFuso(data: Date, fusoHorario: string): string` (Task 1), `ResumoSemanalPessoal({ resumo, ehPremium })` (Task 8), `calcularSemana` (já existente em `semana.ts`, reaproveitado para calcular os dias ISO da semana anterior).

Esta task não recebe teste automatizado próprio (é fiação de página server já implicitamente coberta pelos testes de componente das Tasks 5, 6 e 8) — a verificação é `tsc`/`build`/QA manual.

- [ ] **Step 1: Ampliar o select de check-ins e buscar o plano da usuária**

Em `src/app/progresso/page.tsx`, troque:

```tsx
  const { data: perfilFuso } = await supabase
    .from('perfis')
    .select('fuso_horario')
    .eq('id', user.id)
    .single();
  const fusoHorario = perfilFuso?.fuso_horario ?? 'America/Sao_Paulo';

  const { data: checkins, error: erroCheckins } = await supabase
    .from('checkins')
    .select('id, data, humor, imagem_corporal, comida')
    .eq('usuaria_id', user.id)
    .order('data', { ascending: true });
```

por:

```tsx
  const { data: perfil } = await supabase
    .from('perfis')
    .select('fuso_horario, plano')
    .eq('id', user.id)
    .single();
  const fusoHorario = perfil?.fuso_horario ?? 'America/Sao_Paulo';
  const ehPremium = perfil?.plano === 'premium';

  const { data: checkins, error: erroCheckins } = await supabase
    .from('checkins')
    .select('id, data, humor, imagem_corporal, comida, estado_geral, emocao_especifica, fatores')
    .eq('usuaria_id', user.id)
    .order('data', { ascending: true });
```

- [ ] **Step 2: Buscar sessões e práticas concluídas de todo o histórico (para converter ao fuso e filtrar pela semana no módulo puro)**

Logo após a definição de `totalPraticasCuradas`/`totalPraticasRapidas` (bloco `Promise.all` das duas contagens), adicione um segundo `Promise.all`:

```tsx
  const [{ data: sessoesComPratica }, { data: praticasRapidasConcluidas }] = await Promise.all([
    supabase
      .from('sessoes')
      .select('criado_em')
      .eq('usuaria_id', user.id)
      .not('pratica_id', 'is', null),
    supabase.from('conclusoes_praticas_conteudo').select('concluida_em').eq('usuaria_id', user.id),
  ]);

  const datasAtividadesConcluidas = [
    ...(sessoesComPratica ?? []).map((s) => dataISONoFuso(new Date(s.criado_em), fusoHorario)),
    ...(praticasRapidasConcluidas ?? []).map((p) => dataISONoFuso(new Date(p.concluida_em), fusoHorario)),
  ];
```

Nota: essas duas tabelas já são lidas nesta mesma página (como contagens, para `totalPraticasCuradas`/`totalPraticasRapidas`); aqui buscamos as linhas com o timestamp para poder localizar cada conclusão no fuso da usuária e filtrar pela semana dentro de `calcularResumoSemanal` — sem query nova de check-ins, e reaproveitando exatamente as mesmas duas tabelas já consultadas.

- [ ] **Step 3: Montar os check-ins da semana atual e da semana anterior, e calcular o resumo**

Logo após a definição de `diasDaSemana` (`calcularSemana(...)`), adicione:

```tsx
  const diasDaSemanaAtualISO = diasDaSemana.map((d) => d.data);
  const diasDaSemanaAnteriorISO = calcularSemana([], semanaAnteriorISO(segundaFeiraISO)).map((d) => d.data);

  const paraCheckinResumoSemanal = (c: (typeof todosOsCheckins)[number]): CheckinResumoSemanal => ({
    data: c.data,
    humor: c.humor,
    imagem_corporal: c.imagem_corporal,
    comida: c.comida,
    estado_geral: c.estado_geral,
    emocao_especifica: c.emocao_especifica,
    fatores: c.fatores,
  });

  const checkinsSemana = todosOsCheckins
    .filter((c) => diasDaSemanaAtualISO.includes(c.data))
    .map(paraCheckinResumoSemanal);
  const checkinsSemanaAnterior = todosOsCheckins
    .filter((c) => diasDaSemanaAnteriorISO.includes(c.data))
    .map(paraCheckinResumoSemanal);

  const resumoSemanal = calcularResumoSemanal({
    checkinsSemana,
    checkinsSemanaAnterior,
    diasDaSemana: diasDaSemanaAtualISO,
    datasAtividadesConcluidas,
  });
```

- [ ] **Step 4: Atualizar os imports do arquivo**

No topo de `src/app/progresso/page.tsx`, troque:

```tsx
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { calcularProgresso7Dias, calcularMelhorSequencia } from '@/lib/progress/streak';
import {
  resolverSegundaFeira,
  calcularSemana,
  semanaAnteriorISO,
  semanaSeguinteISO,
} from '@/lib/progress/semana';
import { formatDateISO, hojeNoFuso } from '@/lib/date';
import { resolverItensHistorico } from '@/lib/historico/resolverItens';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import CabecalhoProgresso from './CabecalhoProgresso';
import CartaoSequencia from './CartaoSequencia';
import HumorSemana from './HumorSemana';
import CartaoConquistas from './CartaoConquistas';
import MelhorSequencia from './MelhorSequencia';
import GraficoEvolucao from './GraficoEvolucao';
import Historico from './Historico';
import NotificacaoPetalas from '@/app/components/clube-rose/NotificacaoPetalas';
import NotificacaoLimitePetalas from '@/app/components/clube-rose/NotificacaoLimitePetalas';
```

por:

```tsx
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { calcularProgresso7Dias, calcularMelhorSequencia } from '@/lib/progress/streak';
import {
  resolverSegundaFeira,
  calcularSemana,
  semanaAnteriorISO,
  semanaSeguinteISO,
} from '@/lib/progress/semana';
import { calcularResumoSemanal, type CheckinResumoSemanal } from '@/lib/progress/resumoSemanal';
import { formatDateISO, hojeNoFuso, dataISONoFuso } from '@/lib/date';
import { resolverItensHistorico } from '@/lib/historico/resolverItens';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import CabecalhoProgresso from './CabecalhoProgresso';
import CartaoSequencia from './CartaoSequencia';
import HumorSemana from './HumorSemana';
import CartaoConquistas from './CartaoConquistas';
import MelhorSequencia from './MelhorSequencia';
import ResumoSemanalPessoal from './ResumoSemanalPessoal';
import GraficoEvolucao from './GraficoEvolucao';
import Historico from './Historico';
import NotificacaoPetalas from '@/app/components/clube-rose/NotificacaoPetalas';
import NotificacaoLimitePetalas from '@/app/components/clube-rose/NotificacaoLimitePetalas';
```

- [ ] **Step 5: Renderizar `ResumoSemanalPessoal` na página**

Troque:

```tsx
        <MelhorSequencia melhorSequencia={melhorSequencia} totalCheckins={todosOsCheckins.length} />

        <p className="text-sm text-texto-suave">
          Este resumo é só um retrato acolhedor da sua semana — ele não tira conclusões sobre o motivo
          dos seus dias serem como foram.
        </p>
```

por:

```tsx
        <MelhorSequencia melhorSequencia={melhorSequencia} totalCheckins={todosOsCheckins.length} />

        <ResumoSemanalPessoal resumo={resumoSemanal} ehPremium={ehPremium} />

        <p className="text-sm text-texto-suave">
          Este resumo é só um retrato acolhedor da sua semana — ele não tira conclusões sobre o motivo
          dos seus dias serem como foram.
        </p>
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS sem erros.

- [ ] **Step 7: Lint**

Run: `npx eslint src/app/progresso/page.tsx`
Expected: PASS sem erros.

- [ ] **Step 8: Rodar toda a suíte de testes**

Run: `npm test`
Expected: PASS — todos os testes das Tasks 1 a 8 continuam passando, nenhum teste existente quebrou (em especial `CartaoConquistas`/conquistas, que não foram tocadas).

- [ ] **Step 9: Build de produção**

Run: `npm run build`
Expected: PASS sem erros de compilação/tipos.

- [ ] **Step 10: Commit**

```bash
git add src/app/progresso/page.tsx
git commit -m "feat: exibir ResumoSemanalPessoal em /progresso com dados de check-ins e atividades filtrados pela semana"
```

---

## Self-Review

**1. Cobertura da spec (Seções 3 e 4):**
- `descreverSequencia()` com novos parâmetros (dias ativos, atividade hoje) → Task 3.
- `SequenciaDias.tsx` para de duplicar lógica → Task 6.
- `MelhorSequencia` exibe total acumulado → Task 5.
- Vocabulário proibido em sequência → Tasks 2, 3 (teste de varredura).
- Testes de sequência (primeiro check-in, dias consecutivos, dia perdido, retorno após pausa, semana sem atividade, vocabulário) → Task 3 (unidade) + Task 4/6 (componentes).
- Módulo puro `resumoSemanal.ts` com dias com check-in, atividades filtradas por semana e fuso, tema em destaque (≥3 check-ins, ≥2 ocorrências, excluindo `prefiro_nao_responder`), distribuição de humor/imagem corporal/alimentação, comparação só com ≥3 check-ins em ambas as semanas, mensagem acolhedora, estado vazio → Task 7.
- Select de check-ins ampliado (`estado_geral`, `emocao_especifica`, `fatores`) → Task 9, Step 1.
- Componente server com aviso legal fixo → Task 8.
- Gate Pro (free vê prévia, aviso sempre visível) → Task 8.
- Nenhum dado novo persistido (cálculo sob demanda) → Task 7/9, sem nenhuma migration/insert novo.
- Testes de resumo semanal (semana vazia, poucos registros, semana completa, comparação indisponível/permitida, destaque de tema, vocabulário proibido) → Task 7.

**2. Varredura de placeholders:** nenhum "TODO"/"implementar depois"/"similar à Task N" — todo código de cada step está completo e citado por inteiro (arquivos pequenos o suficiente para reescrever por completo em cada task, evitando diffs ambíguos).

**3. Consistência de tipos entre tasks:** `DescreverSequenciaParams` (Task 3) é usado com os mesmos 4 campos em `CartaoSequencia` (Task 4) e `SequenciaDias` (Task 6). `CheckinResumoSemanal`/`ResumoSemanalParams`/`ResumoSemanal` (Task 7) são usados com os mesmos nomes de campo em `ResumoSemanalPessoal` (Task 8) e em `page.tsx` (Task 9). `dataISONoFuso(data: Date, fusoHorario: string): string` (Task 1) é chamada com essa assinatura exata na Task 9.

**Ambiguidades da spec resolvidas por conta própria (documentar para revisão):**
1. *Fonte de "práticas/sessões concluídas filtradas pela semana"*: a spec não especifica se viria de uma nova query com filtro de data no banco ou de dado já em memória. Optei por buscar as duas tabelas (`sessoes`, `conclusoes_praticas_conteudo`) por inteiro para a usuária — mesmo padrão já usado nesta página para `todosOsCheckins` (sem paginação) — e filtrar pela semana dentro do módulo puro `resumoSemanal.ts`, convertendo cada timestamp ao fuso da usuária com `dataISONoFuso`. Evita bounds de query timestamptz sensíveis a fuso (que exigiriam calcular offsets UTC reais, não só aritmética de datas "locais" como o resto do código já faz). Pode ser otimizado depois com filtro de data no banco quando o histórico crescer.
2. *Rótulos de imagem corporal e alimentação*: como não existe rótulo clínico já revisado pela psicóloga para esses dois eixos (diferente de humor, que já tem `ROTULO_HUMOR` em produção), usei rótulos neutros "Nível 1" a "Nível 5" em vez de inventar linguagem clínica não revisada.
3. *"Dia perdido" vs. "retorno após pausa"*: a spec pede diferenciação correta de comportamento, não necessariamente textos distintos. Ambos os cenários usam o mesmo template ("Você cuidou de si em X dos últimos 7 dias"), diferenciados apenas pelo valor real de X — evita inventar categorização extra não pedida explicitamente e mantém o vocabulário consistente com a única frase-modelo dada pela spec.
