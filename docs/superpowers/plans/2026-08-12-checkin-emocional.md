# Check-in Emocional (8 etapas) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o check-in de 3 números por um assistente de 8 etapas (mapa emocional, palavra específica, intensidade, corpo, gatilhos, alimentação, contexto, próxima ação), preservando o motor de recomendação, a sequência e o gráfico de evolução através de mapeamentos determinísticos e testados.

**Architecture:** Migration aditiva em `checkins` (colunas novas nullable + `comida` deixa de ser `not null`). Três funções puras de derivação (`derivarHumor`, `derivarImagemCorporal`, `derivarComida`) alimentam os campos legados sem que `avaliarCheckin`, `calcularProgresso7Dias`, `calcularMelhorSequencia` ou `GraficoEvolucao` mudem uma linha. Uma função nova (`decidirRecomendacaoComProtecao`) garante a prioridade de segurança de "vontade de se punir" antes de qualquer outra lógica. `decidirProximaEtapaCheckin` ganha um parâmetro novo e um resultado novo (`guardar`). O check-in é sempre gravado no Supabase antes de qualquer confirmação ou redirecionamento, nas três saídas possíveis.

**Tech Stack:** Next.js 16 (App Router), Supabase, TypeScript, Tailwind v4, Vitest.

## Global Constraints

- `humor`, `imagem_corporal`, `comida`, `texto_livre`, `sinal_seguranca` mantêm o mesmo tipo e significado. `avaliarCheckin`, `calcularProgresso7Dias`, `calcularMelhorSequencia`, `GraficoEvolucao`, `regras_recomendacao` não são modificados por nenhuma tarefa deste plano.
- `derivarHumor(estadoGeral, intensidade)`: confortável+intensidade 4-5→5; confortável+1-2→4; intensidade 3→3 (qualquer quadrante); desconfortável+1-2→2; desconfortável+4-5→1.
- `derivarImagemCorporal(confortoCorporal)`: identidade — a escala da etapa 4 já mede conforto na mesma direção que `imagem_corporal` (5 = mais confortável).
- `derivarComida(alimentacaoPercebida)`: tranquila→5, satisfeita→5, indiferente→4, confusa→3, ansiosa→2, culpada→2, vontade_punir→1, prefiro_nao_responder→`null`.
- "Vontade de se punir" aciona sinal de segurança por checagem explícita no código (`decidirRecomendacaoComProtecao`), nunca por inferência de faixa numérica em `regras_recomendacao`.
- O check-in é gravado no Supabase (`insert` bem-sucedido) **antes** de qualquer redirecionamento ou confirmação — nas três saídas de próxima ação (guardar / entender / prática rápida) e também no caso de sinal de segurança.
- "Prefiro não responder" grava `null` em `comida`, nunca um valor inventado.
- Nenhuma tabela ou dado existente é apagado. A única mudança de constraint é `comida` deixar de ser `not null` (registros antigos não são afetados, já têm valor).
- Nenhum GRANT ou policy novo — `checkins` já tem `select, insert` para `authenticated` e a policy `auth.uid() = usuaria_id` já cobre as colunas novas.

---

### Task 1: Migration — colunas novas em `checkins`

**Files:**
- Create: `supabase/migrations/0004_checkin_emocional.sql`

**Interfaces:**
- Produces: as colunas `estado_geral`, `emocao_especifica`, `intensidade`, `alimentacao_percebida`, `gatilho_local`, `gatilho_pensamento`, `gatilho_emocao_depois`, `fatores`, `proxima_acao` em `checkins`, e `comida` passa a aceitar `null`. Consumidas por todas as tarefas seguintes que gravam ou leem check-ins.

- [ ] **Step 1: Escrever a migration**

```sql
-- Estende checkins com o modelo emocional rico. Os campos legados (humor,
-- imagem_corporal, comida, texto_livre, sinal_seguranca) continuam exatamente
-- como estão -- o motor de recomendação, a sequência e o gráfico de evolução
-- dependem deles sem nenhuma mudança de código. Registros antigos ficam com
-- as colunas novas em null, o que é esperado e não afeta nada existente.

alter table public.checkins add column estado_geral text
  check (estado_geral in ('alta_energia_desconforto', 'alta_energia_conforto', 'baixa_energia_desconforto', 'baixa_energia_conforto'));

alter table public.checkins add column emocao_especifica text;

alter table public.checkins add column intensidade smallint
  check (intensidade between 1 and 5);

alter table public.checkins add column alimentacao_percebida text
  check (alimentacao_percebida in ('tranquila', 'satisfeita', 'indiferente', 'confusa', 'ansiosa', 'culpada', 'vontade_punir', 'prefiro_nao_responder'));

alter table public.checkins add column gatilho_local text;
alter table public.checkins add column gatilho_pensamento text;
alter table public.checkins add column gatilho_emocao_depois text;

alter table public.checkins add column fatores text[];

alter table public.checkins add column proxima_acao text
  check (proxima_acao in ('guardar', 'entender', 'pratica_rapida'));

-- Única mudança de constraint em coluna existente: "prefiro não responder"
-- na etapa de alimentação precisa gravar null em vez de inventar uma nota.
-- Não afeta linhas existentes (todas já têm um valor 1-5 gravado).
alter table public.checkins alter column comida drop not null;
```

- [ ] **Step 2: Rodar a migration no projeto Supabase real**

Esta etapa não pode ser feita por um subagente (sem acesso ao Supabase real deste ambiente). Peça ao humano para rodar `0004_checkin_emocional.sql` no SQL Editor do Supabase e confirmar que rodou sem erro antes de prosseguir para as tarefas que dependem dela ler/gravar essas colunas em produção — mas o desenvolvimento local/testes/build não dependem disso (os tipos TypeScript são a fonte de verdade em desenvolvimento, a migration só precisa rodar antes do primeiro uso real).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0004_checkin_emocional.sql
git commit -m "feat: adicionar colunas do check-in emocional em checkins"
```

---

### Task 2: Tipos TypeScript

**Files:**
- Modify: `src/lib/supabase/types.ts`

**Interfaces:**
- Produces: `EstadoGeral`, `AlimentacaoPercebida`, `ProximaAcaoEscolhida` (named exports), e `Checkin` ganha os campos novos. Consumido por todas as tarefas seguintes.

- [ ] **Step 1: Adicionar os tipos novos e estender `Checkin`**

Adicione estes tipos antes da definição de `Checkin` em `src/lib/supabase/types.ts`:

```ts
export type EstadoGeral =
  | 'alta_energia_desconforto'
  | 'alta_energia_conforto'
  | 'baixa_energia_desconforto'
  | 'baixa_energia_conforto';

export type AlimentacaoPercebida =
  | 'tranquila'
  | 'satisfeita'
  | 'indiferente'
  | 'confusa'
  | 'ansiosa'
  | 'culpada'
  | 'vontade_punir'
  | 'prefiro_nao_responder';

export type ProximaAcaoEscolhida = 'guardar' | 'entender' | 'pratica_rapida';
```

Depois, na definição de `Checkin`, mude `comida: number;` para `comida: number | null;` e adicione estes campos (todos opcionais, refletindo que podem ser `null`):

```ts
  estado_geral: EstadoGeral | null;
  emocao_especifica: string | null;
  intensidade: number | null;
  alimentacao_percebida: AlimentacaoPercebida | null;
  gatilho_local: string | null;
  gatilho_pensamento: string | null;
  gatilho_emocao_depois: string | null;
  fatores: string[] | null;
  proxima_acao: ProximaAcaoEscolhida | null;
```

Na definição de `Database.Tables.checkins`, o `Insert` type é `Omit<Checkin, 'id' | 'criado_em'>` — isso já cobre os campos novos automaticamente, nenhuma mudança extra necessária ali.

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: pode haver erros nos arquivos que ainda usam o formato antigo de `Checkin`/`CheckinAnswers` (isso é esperado — as tarefas seguintes corrigem cada um). Confirme que o erro é especificamente sobre `comida: number | null` não bater com `number` em `src/lib/checkin/recommend.ts` e nada mais surpreendente.

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase/types.ts
git commit -m "feat: adicionar tipos do check-in emocional"
```

---

### Task 3: Funções de derivação (`derivarHumor`, `derivarImagemCorporal`, `derivarComida`)

**Files:**
- Create: `src/lib/checkin/derivacoes.ts`
- Create: `src/lib/checkin/derivacoes.test.ts`

**Interfaces:**
- Consumes: `EstadoGeral`, `AlimentacaoPercebida` (Task 2) de `@/lib/supabase/types`.
- Produces: `derivarHumor(estadoGeral: EstadoGeral, intensidade: number): number`, `derivarImagemCorporal(confortoCorporal: number): number`, `derivarComida(alimentacaoPercebida: AlimentacaoPercebida): number | null`, exportadas de `src/lib/checkin/derivacoes.ts`. Consumidas pela Task 6 (`submeterCheckin`).

- [ ] **Step 1: Escrever os testes que falham**

Crie `src/lib/checkin/derivacoes.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { derivarHumor, derivarImagemCorporal, derivarComida } from './derivacoes';

describe('derivarHumor', () => {
  it('quadrante confortável com intensidade alta dá 5', () => {
    expect(derivarHumor('baixa_energia_conforto', 5)).toBe(5);
    expect(derivarHumor('alta_energia_conforto', 4)).toBe(5);
  });

  it('quadrante confortável com intensidade baixa dá 4', () => {
    expect(derivarHumor('baixa_energia_conforto', 1)).toBe(4);
    expect(derivarHumor('alta_energia_conforto', 2)).toBe(4);
  });

  it('intensidade 3 dá sempre 3, independente do quadrante', () => {
    expect(derivarHumor('alta_energia_conforto', 3)).toBe(3);
    expect(derivarHumor('alta_energia_desconforto', 3)).toBe(3);
    expect(derivarHumor('baixa_energia_conforto', 3)).toBe(3);
    expect(derivarHumor('baixa_energia_desconforto', 3)).toBe(3);
  });

  it('quadrante desconfortável com intensidade baixa dá 2', () => {
    expect(derivarHumor('baixa_energia_desconforto', 1)).toBe(2);
    expect(derivarHumor('alta_energia_desconforto', 2)).toBe(2);
  });

  it('quadrante desconfortável com intensidade alta dá 1', () => {
    expect(derivarHumor('baixa_energia_desconforto', 5)).toBe(1);
    expect(derivarHumor('alta_energia_desconforto', 4)).toBe(1);
  });
});

describe('derivarImagemCorporal', () => {
  it('preserva a direção da escala nos extremos e no meio', () => {
    expect(derivarImagemCorporal(1)).toBe(1);
    expect(derivarImagemCorporal(3)).toBe(3);
    expect(derivarImagemCorporal(5)).toBe(5);
  });
});

describe('derivarComida', () => {
  it('mapeia cada resposta para o valor exato especificado', () => {
    expect(derivarComida('tranquila')).toBe(5);
    expect(derivarComida('satisfeita')).toBe(5);
    expect(derivarComida('indiferente')).toBe(4);
    expect(derivarComida('confusa')).toBe(3);
    expect(derivarComida('ansiosa')).toBe(2);
    expect(derivarComida('culpada')).toBe(2);
    expect(derivarComida('vontade_punir')).toBe(1);
    expect(derivarComida('prefiro_nao_responder')).toBe(null);
  });
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npx vitest run src/lib/checkin/derivacoes.test.ts`
Expected: FAIL — o módulo `./derivacoes` não existe.

- [ ] **Step 3: Implementar**

Crie `src/lib/checkin/derivacoes.ts`:

```ts
import type { EstadoGeral, AlimentacaoPercebida } from '@/lib/supabase/types';

const QUADRANTES_CONFORTAVEIS: EstadoGeral[] = ['alta_energia_conforto', 'baixa_energia_conforto'];

export function derivarHumor(estadoGeral: EstadoGeral, intensidade: number): number {
  if (intensidade === 3) {
    return 3;
  }

  const confortavel = QUADRANTES_CONFORTAVEIS.includes(estadoGeral);
  const intensidadeAlta = intensidade >= 4;

  if (confortavel && intensidadeAlta) return 5;
  if (confortavel && !intensidadeAlta) return 4;
  if (!confortavel && !intensidadeAlta) return 2;
  return 1;
}

// A pergunta da etapa 4 mede conforto (1 = muito desconfortável, 5 = muito
// confortável) -- a mesma direção que imagem_corporal já tem hoje. Esta
// função existe nomeada e testada para travar essa direção: se a escala da
// UI for invertida no futuro, o teste desta função pega o erro na hora.
export function derivarImagemCorporal(confortoCorporal: number): number {
  return confortoCorporal;
}

const MAPA_COMIDA: Record<AlimentacaoPercebida, number | null> = {
  tranquila: 5,
  satisfeita: 5,
  indiferente: 4,
  confusa: 3,
  ansiosa: 2,
  culpada: 2,
  vontade_punir: 1,
  prefiro_nao_responder: null,
};

export function derivarComida(alimentacaoPercebida: AlimentacaoPercebida): number | null {
  return MAPA_COMIDA[alimentacaoPercebida];
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npx vitest run src/lib/checkin/derivacoes.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/checkin/derivacoes.ts src/lib/checkin/derivacoes.test.ts
git commit -m "feat: adicionar derivarHumor, derivarImagemCorporal e derivarComida"
```

---

### Task 4: `decidirRecomendacaoComProtecao`

**Files:**
- Modify: `src/lib/checkin/recommend.ts`
- Modify: `src/lib/checkin/recommend.test.ts`

**Interfaces:**
- Consumes: `AlimentacaoPercebida` (Task 2) de `@/lib/supabase/types`; `avaliarCheckin`, `Recomendacao`, `CheckinAnswers` (já existentes no mesmo arquivo, não modificados).
- Produces: `decidirRecomendacaoComProtecao(answers: { humor: number; imagemCorporal: number; comida: number | null; alimentacaoPercebida: AlimentacaoPercebida }, regras: RegraRecomendacao[]): Recomendacao`, exportada de `src/lib/checkin/recommend.ts`. Consumida pela Task 6 (`submeterCheckin`).

- [ ] **Step 1: Escrever os testes que falham**

Adicione ao final de `src/lib/checkin/recommend.test.ts` (mantendo o `import` existente e adicionando `decidirRecomendacaoComProtecao` a ele):

```ts
import { avaliarCheckin, decidirRecomendacaoComProtecao, type CheckinAnswers } from './recommend';
```

```ts
describe('decidirRecomendacaoComProtecao', () => {
  it('retorna sinal_seguranca para vontade_punir mesmo sem nenhuma regra de risco cadastrada', () => {
    const regras = [regra({ humor_min: 1, humor_max: 5, imagem_corporal_min: 1, imagem_corporal_max: 5, comida_min: 1, comida_max: 5, eh_sinal_seguranca: false, categoria_pratica: 'geral_positivo' })];

    const resultado = decidirRecomendacaoComProtecao(
      { humor: 5, imagemCorporal: 5, comida: 1, alimentacaoPercebida: 'vontade_punir' },
      regras
    );

    expect(resultado).toEqual({ tipo: 'sinal_seguranca' });
  });

  it('não consulta as regras quando vontade_punir está presente (a proteção não depende de faixas numéricas)', () => {
    const regrasVazias: never[] = [];

    const resultado = decidirRecomendacaoComProtecao(
      { humor: 5, imagemCorporal: 5, comida: 1, alimentacaoPercebida: 'vontade_punir' },
      regrasVazias
    );

    expect(resultado).toEqual({ tipo: 'sinal_seguranca' });
  });

  it('usa 3 como comida apenas para comparação quando comida é null, sem lançar erro', () => {
    const regras = [regra({ comida_min: 1, comida_max: 5, categoria_pratica: 'geral_positivo' })];

    const resultado = decidirRecomendacaoComProtecao(
      { humor: 3, imagemCorporal: 3, comida: null, alimentacaoPercebida: 'prefiro_nao_responder' },
      regras
    );

    expect(resultado).toEqual({ tipo: 'pratica', categoria: 'geral_positivo' });
  });

  it('delega para avaliarCheckin no caso normal, sem vontade_punir', () => {
    const regras = [regra({ humor_min: 1, humor_max: 2, categoria_pratica: 'humor_baixo' })];

    const resultado = decidirRecomendacaoComProtecao(
      { humor: 2, imagemCorporal: 3, comida: 4, alimentacaoPercebida: 'tranquila' },
      regras
    );

    expect(resultado).toEqual({ tipo: 'pratica', categoria: 'humor_baixo' });
  });
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npx vitest run src/lib/checkin/recommend.test.ts`
Expected: FAIL — `decidirRecomendacaoComProtecao` não existe em `./recommend`.

- [ ] **Step 3: Implementar**

Adicione ao final de `src/lib/checkin/recommend.ts` (sem alterar `avaliarCheckin` nem `CheckinAnswers` já existentes):

```ts
import type { AlimentacaoPercebida } from '@/lib/supabase/types';

export function decidirRecomendacaoComProtecao(
  answers: {
    humor: number;
    imagemCorporal: number;
    comida: number | null;
    alimentacaoPercebida: AlimentacaoPercebida;
  },
  regras: RegraRecomendacao[]
): Recomendacao {
  if (answers.alimentacaoPercebida === 'vontade_punir') {
    return { tipo: 'sinal_seguranca' };
  }

  return avaliarCheckin(
    { humor: answers.humor, imagemCorporal: answers.imagemCorporal, comida: answers.comida ?? 3 },
    regras
  );
}
```

(Adicione o `import type { AlimentacaoPercebida }` junto aos imports já existentes no topo do arquivo, não duplicado.)

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npx vitest run src/lib/checkin/recommend.test.ts`
Expected: PASS — todos os testes, incluindo os já existentes de `avaliarCheckin`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/checkin/recommend.ts src/lib/checkin/recommend.test.ts
git commit -m "feat: adicionar decidirRecomendacaoComProtecao"
```

---

### Task 5: Estender `decidirProximaEtapaCheckin`

**Files:**
- Modify: `src/lib/checkin/roteamento.ts`
- Modify: `src/lib/checkin/roteamento.test.ts`

**Interfaces:**
- Consumes: `ProximaAcaoEscolhida` (Task 2) de `@/lib/supabase/types`; `Recomendacao` (já existente).
- Produces: `decidirProximaEtapaCheckin` com assinatura nova — `(params: { recomendacao: Recomendacao; proximaAcaoEscolhida: ProximaAcaoEscolhida; jornadaAtiva: {...} | null; atividadeDoDiaExiste: boolean }) => { tipo: 'seguranca' } | { tipo: 'guardar' } | { tipo: 'jornada' } | { tipo: 'pratica' }`. **Esta é uma mudança de assinatura que quebra o único chamador** (`src/app/checkin/actions.ts`) — a Task 6 atualiza esse chamador imediatamente em seguida; até lá, `tsc --noEmit` vai reportar erro em `actions.ts`, o que é esperado nesta tarefa (ela só cobre `roteamento.ts` e seu teste).

- [ ] **Step 1: Atualizar os testes existentes e adicionar os novos**

Substitua todo o conteúdo de `src/lib/checkin/roteamento.test.ts` por:

```ts
import { describe, it, expect } from 'vitest';
import { decidirProximaEtapaCheckin } from './roteamento';
import type { Recomendacao } from './recommend';

describe('decidirProximaEtapaCheckin', () => {
  const recomendacaoSeguranca: Recomendacao = { tipo: 'sinal_seguranca' };
  const recomendacaoPratica: Recomendacao = { tipo: 'pratica', categoria: 'humor_baixo' };

  it('sinal de segurança tem prioridade mesmo com jornada ativa, atividade disponível e prática rápida escolhida', () => {
    const resultado = decidirProximaEtapaCheckin({
      recomendacao: recomendacaoSeguranca,
      proximaAcaoEscolhida: 'pratica_rapida',
      jornadaAtiva: { jornadaId: 'j1', diasCompletados: 2 },
      atividadeDoDiaExiste: true,
    });
    expect(resultado).toEqual({ tipo: 'seguranca' });
  });

  it('sinal de segurança tem prioridade mesmo com "guardar" escolhido', () => {
    const resultado = decidirProximaEtapaCheckin({
      recomendacao: recomendacaoSeguranca,
      proximaAcaoEscolhida: 'guardar',
      jornadaAtiva: null,
      atividadeDoDiaExiste: false,
    });
    expect(resultado).toEqual({ tipo: 'seguranca' });
  });

  it('"guardar" não rotea para jornada nem prática, mesmo com jornada ativa disponível', () => {
    const resultado = decidirProximaEtapaCheckin({
      recomendacao: recomendacaoPratica,
      proximaAcaoEscolhida: 'guardar',
      jornadaAtiva: { jornadaId: 'j1', diasCompletados: 2 },
      atividadeDoDiaExiste: true,
    });
    expect(resultado).toEqual({ tipo: 'guardar' });
  });

  it('"entender" com jornada ativa e atividade disponível vai para jornada', () => {
    const resultado = decidirProximaEtapaCheckin({
      recomendacao: recomendacaoPratica,
      proximaAcaoEscolhida: 'entender',
      jornadaAtiva: { jornadaId: 'j1', diasCompletados: 2 },
      atividadeDoDiaExiste: true,
    });
    expect(resultado).toEqual({ tipo: 'jornada' });
  });

  it('"pratica_rapida" com jornada ativa e atividade disponível vai para jornada (mesmo roteamento de "entender")', () => {
    const resultado = decidirProximaEtapaCheckin({
      recomendacao: recomendacaoPratica,
      proximaAcaoEscolhida: 'pratica_rapida',
      jornadaAtiva: { jornadaId: 'j1', diasCompletados: 2 },
      atividadeDoDiaExiste: true,
    });
    expect(resultado).toEqual({ tipo: 'jornada' });
  });

  it('jornada ativa sem atividade cadastrada para o dia cai para a prática recomendada', () => {
    const resultado = decidirProximaEtapaCheckin({
      recomendacao: recomendacaoPratica,
      proximaAcaoEscolhida: 'entender',
      jornadaAtiva: { jornadaId: 'j1', diasCompletados: 2 },
      atividadeDoDiaExiste: false,
    });
    expect(resultado).toEqual({ tipo: 'pratica' });
  });

  it('sem jornada ativa, "entender" e "pratica_rapida" levam à prática recomendada', () => {
    const resultado1 = decidirProximaEtapaCheckin({
      recomendacao: recomendacaoPratica,
      proximaAcaoEscolhida: 'entender',
      jornadaAtiva: null,
      atividadeDoDiaExiste: false,
    });
    const resultado2 = decidirProximaEtapaCheckin({
      recomendacao: recomendacaoPratica,
      proximaAcaoEscolhida: 'pratica_rapida',
      jornadaAtiva: null,
      atividadeDoDiaExiste: false,
    });
    expect(resultado1).toEqual({ tipo: 'pratica' });
    expect(resultado2).toEqual({ tipo: 'pratica' });
  });
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npx vitest run src/lib/checkin/roteamento.test.ts`
Expected: FAIL — `proximaAcaoEscolhida` não existe nos parâmetros da função atual, e o caso `'guardar'` não é tratado.

- [ ] **Step 3: Implementar**

Substitua todo o conteúdo de `src/lib/checkin/roteamento.ts` por:

```ts
import type { Recomendacao } from './recommend';
import type { ProximaAcaoEscolhida } from '@/lib/supabase/types';

export function decidirProximaEtapaCheckin(params: {
  recomendacao: Recomendacao;
  proximaAcaoEscolhida: ProximaAcaoEscolhida;
  jornadaAtiva: { jornadaId: string; diasCompletados: number } | null;
  atividadeDoDiaExiste: boolean;
}): { tipo: 'seguranca' } | { tipo: 'guardar' } | { tipo: 'jornada' } | { tipo: 'pratica' } {
  if (params.recomendacao.tipo === 'sinal_seguranca') {
    return { tipo: 'seguranca' };
  }

  if (params.proximaAcaoEscolhida === 'guardar') {
    return { tipo: 'guardar' };
  }

  if (params.jornadaAtiva && params.atividadeDoDiaExiste) {
    return { tipo: 'jornada' };
  }

  return { tipo: 'pratica' };
}
```

- [ ] **Step 4: Rodar os testes de `roteamento.test.ts` e confirmar que passam**

Run: `npx vitest run src/lib/checkin/roteamento.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/checkin/roteamento.ts src/lib/checkin/roteamento.test.ts
git commit -m "feat: adicionar proximaAcaoEscolhida e o resultado guardar a decidirProximaEtapaCheckin"
```

(`tsc --noEmit` continua reportando erro em `src/app/checkin/actions.ts` neste ponto — resolvido na Task 6, próxima.)

---

### Task 6: Reescrever `submeterCheckin`

**Files:**
- Modify: `src/app/checkin/actions.ts`

**Interfaces:**
- Consumes: `derivarHumor`, `derivarImagemCorporal`, `derivarComida` (Task 3); `decidirRecomendacaoComProtecao` (Task 4); `decidirProximaEtapaCheckin` (Task 5, assinatura nova); `EstadoGeral`, `AlimentacaoPercebida`, `ProximaAcaoEscolhida` (Task 2).
- Produces: `CheckinCompletoAnswers` (tipo exportado) e `submeterCheckin(answers: CheckinCompletoAnswers): Promise<{ tipo: 'guardado' } | void>`. Consumida pela Task 7 (`CheckinFormClient.tsx`).

- [ ] **Step 1: Substituir todo o conteúdo do arquivo**

```tsx
'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { derivarHumor, derivarImagemCorporal, derivarComida } from '@/lib/checkin/derivacoes';
import { decidirRecomendacaoComProtecao } from '@/lib/checkin/recommend';
import { decidirProximaEtapaCheckin } from '@/lib/checkin/roteamento';
import { formatDateISO } from '@/lib/date';
import type { EstadoGeral, AlimentacaoPercebida, ProximaAcaoEscolhida } from '@/lib/supabase/types';

export interface CheckinCompletoAnswers {
  estadoGeral: EstadoGeral;
  emocaoEspecifica: string;
  intensidade: number;
  confortoCorporal: number;
  gatilhoLocal: string | null;
  gatilhoPensamento: string | null;
  gatilhoEmocaoDepois: string | null;
  alimentacaoPercebida: AlimentacaoPercebida;
  fatores: string[];
  anotacao?: string;
  proximaAcao: ProximaAcaoEscolhida;
}

export async function submeterCheckin(
  answers: CheckinCompletoAnswers
): Promise<{ tipo: 'guardado' } | void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const hojeISO = formatDateISO(new Date());

  const { data: checkinExistente } = await supabase
    .from('checkins')
    .select('id')
    .eq('usuaria_id', user.id)
    .eq('data', hojeISO)
    .maybeSingle();

  if (checkinExistente) {
    redirect('/progresso');
  }

  const humor = derivarHumor(answers.estadoGeral, answers.intensidade);
  const imagemCorporal = derivarImagemCorporal(answers.confortoCorporal);
  const comida = derivarComida(answers.alimentacaoPercebida);

  const { data: regras } = await supabase
    .from('regras_recomendacao')
    .select('*')
    .eq('ativa', true);

  const recomendacao = decidirRecomendacaoComProtecao(
    { humor, imagemCorporal, comida, alimentacaoPercebida: answers.alimentacaoPercebida },
    regras ?? []
  );

  const { data: checkin, error } = await supabase
    .from('checkins')
    .insert({
      usuaria_id: user.id,
      data: hojeISO,
      humor,
      imagem_corporal: imagemCorporal,
      comida,
      texto_livre: answers.anotacao ?? null,
      sinal_seguranca: recomendacao.tipo === 'sinal_seguranca',
      estado_geral: answers.estadoGeral,
      emocao_especifica: answers.emocaoEspecifica,
      intensidade: answers.intensidade,
      alimentacao_percebida: answers.alimentacaoPercebida,
      gatilho_local: answers.gatilhoLocal,
      gatilho_pensamento: answers.gatilhoPensamento,
      gatilho_emocao_depois: answers.gatilhoEmocaoDepois,
      fatores: answers.fatores.length > 0 ? answers.fatores : null,
      proxima_acao: answers.proximaAcao,
    })
    .select()
    .single();

  if (error || !checkin) {
    throw new Error('Não foi possível salvar o check-in. Tente novamente.');
  }

  // A partir daqui, o check-in já está salvo no Supabase, independente da
  // saída escolhida (segurança, guardar, ou prática/jornada).

  if (recomendacao.tipo === 'sinal_seguranca') {
    redirect('/seguranca');
  }

  if (answers.proximaAcao === 'guardar') {
    return { tipo: 'guardado' };
  }

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
    proximaAcaoEscolhida: answers.proximaAcao,
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

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros — este era o último arquivo pendente das Tasks 2 e 5.

- [ ] **Step 3: Verificar lint**

Run: `npx eslint src/app/checkin/actions.ts`
Expected: sem erros.

- [ ] **Step 4: Rodar a suíte de testes completa**

Run: `npx vitest run`
Expected: todos os testes passando.

- [ ] **Step 5: Commit**

```bash
git add src/app/checkin/actions.ts
git commit -m "feat: reescrever submeterCheckin para o modelo emocional completo"
```

---

### Task 7: Reescrever `CheckinFormClient.tsx` — assistente de 8 etapas

**Files:**
- Modify: `src/app/checkin/CheckinFormClient.tsx`

**Interfaces:**
- Consumes: `submeterCheckin`, `type CheckinCompletoAnswers` (Task 6) de `./actions`; `Escala`, `Botao` (`@/app/components/Escala`, `@/app/components/Botao`, já existentes); `EstadoGeral`, `AlimentacaoPercebida`, `ProximaAcaoEscolhida` (Task 2).

- [ ] **Step 1: Substituir todo o conteúdo do arquivo**

```tsx
'use client';

import { useState } from 'react';
import { submeterCheckin } from './actions';
import Escala from '@/app/components/Escala';
import Botao from '@/app/components/Botao';
import type { EstadoGeral, AlimentacaoPercebida } from '@/lib/supabase/types';

type Etapa =
  | 'estado_geral'
  | 'emocao'
  | 'intensidade'
  | 'corpo'
  | 'gatilhos'
  | 'alimentacao'
  | 'contexto'
  | 'proxima_acao'
  | 'guardado';

const QUADRANTES: { valor: EstadoGeral; titulo: string; descricao: string }[] = [
  { valor: 'alta_energia_desconforto', titulo: 'Energia alta, desconforto', descricao: 'Ansiedade, irritação, tensão, sobrecarga' },
  { valor: 'alta_energia_conforto', titulo: 'Energia alta, conforto', descricao: 'Entusiasmo, inspiração, alegria, animação' },
  { valor: 'baixa_energia_desconforto', titulo: 'Energia baixa, desconforto', descricao: 'Tristeza, solidão, cansaço, desânimo' },
  { valor: 'baixa_energia_conforto', titulo: 'Energia baixa, conforto', descricao: 'Calma, segurança, serenidade, satisfação' },
];

const EMOCOES_POR_QUADRANTE: Record<EstadoGeral, { palavra: string; explicacao: string }[]> = {
  alta_energia_desconforto: [
    { palavra: 'Ansiosa', explicacao: 'Uma sensação de alerta ou preocupação com o que pode vir.' },
    { palavra: 'Apreensiva', explicacao: 'Um receio sobre algo que ainda não aconteceu.' },
    { palavra: 'Assustada', explicacao: 'Uma reação forte a algo que pareceu ameaçador.' },
    { palavra: 'Sobrecarregada', explicacao: 'A sensação de ter mais do que dá conta agora.' },
    { palavra: 'Irritada', explicacao: 'Um incômodo que pede espaço.' },
    { palavra: 'Frustrada', explicacao: 'Quando algo não saiu como você esperava.' },
  ],
  baixa_energia_desconforto: [
    { palavra: 'Insegura', explicacao: 'Uma dúvida sobre si mesma ou sobre a situação.' },
    { palavra: 'Decepcionada', explicacao: 'Quando a realidade ficou aquém do que você esperava.' },
    { palavra: 'Triste', explicacao: 'Uma sensação de perda ou vazio.' },
    { palavra: 'Solitária', explicacao: 'A sensação de estar sozinha, mesmo que não esteja.' },
    { palavra: 'Cansada', explicacao: 'Pouca energia para continuar agora.' },
    { palavra: 'Desanimada', explicacao: 'Falta de ânimo para seguir em frente.' },
  ],
  baixa_energia_conforto: [
    { palavra: 'Tranquila', explicacao: 'Uma sensação de paz, sem pressa.' },
    { palavra: 'Aliviada', explicacao: 'Quando um peso parece ter diminuído.' },
    { palavra: 'Esperançosa', explicacao: 'Uma expectativa gentil de que as coisas podem melhorar.' },
  ],
  alta_energia_conforto: [
    { palavra: 'Animada', explicacao: 'Energia boa, com vontade de agir.' },
    { palavra: 'Inspirada', explicacao: 'Uma ideia ou vontade que te move.' },
    { palavra: 'Confiante', explicacao: 'Uma sensação de segurança em si mesma.' },
  ],
};

const LOCAIS_GATILHO = ['Redes sociais', 'Diante do espelho', 'Em fotografias', 'Ao experimentar roupas', 'Após um comentário', 'Outra situação'];

const OPCOES_ALIMENTACAO: { valor: AlimentacaoPercebida; rotulo: string }[] = [
  { valor: 'tranquila', rotulo: 'Tranquila' },
  { valor: 'satisfeita', rotulo: 'Satisfeita' },
  { valor: 'indiferente', rotulo: 'Indiferente' },
  { valor: 'ansiosa', rotulo: 'Ansiosa' },
  { valor: 'culpada', rotulo: 'Culpada' },
  { valor: 'confusa', rotulo: 'Confusa' },
  { valor: 'vontade_punir', rotulo: 'Com vontade de me punir' },
  { valor: 'prefiro_nao_responder', rotulo: 'Prefiro não responder' },
];

const FATORES_DISPONIVEIS = [
  'Sono', 'Redes sociais', 'Estudos', 'Trabalho', 'Exercício', 'Ciclo menstrual',
  'Comentários sobre aparência', 'Relacionamento', 'Família', 'Alimentação',
  'Situação social', 'Fotografia', 'Roupa', 'Espelho',
];

export default function CheckinFormClient() {
  const [etapa, setEtapa] = useState<Etapa>('estado_geral');

  const [estadoGeral, setEstadoGeral] = useState<EstadoGeral | null>(null);
  const [emocaoEspecifica, setEmocaoEspecifica] = useState<string | null>(null);
  const [intensidade, setIntensidade] = useState<number | null>(null);
  const [confortoCorporal, setConfortoCorporal] = useState<number | null>(null);

  const [gatilhoAconteceu, setGatilhoAconteceu] = useState<boolean | null>(null);
  const [gatilhoLocal, setGatilhoLocal] = useState('');
  const [gatilhoPensamento, setGatilhoPensamento] = useState('');
  const [gatilhoEmocaoDepois, setGatilhoEmocaoDepois] = useState('');

  const [alimentacaoPercebida, setAlimentacaoPercebida] = useState<AlimentacaoPercebida | null>(null);

  const [fatores, setFatores] = useState<string[]>([]);
  const [fatorOutro, setFatorOutro] = useState('');
  const [anotacao, setAnotacao] = useState('');

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function alternarFator(fator: string) {
    setFatores((atual) =>
      atual.includes(fator) ? atual.filter((f) => f !== fator) : [...atual, fator]
    );
  }

  async function handleProximaAcao(acao: 'guardar' | 'entender' | 'pratica_rapida') {
    if (!estadoGeral || !emocaoEspecifica || intensidade === null || confortoCorporal === null || !alimentacaoPercebida) {
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      const resultado = await submeterCheckin({
        estadoGeral,
        emocaoEspecifica,
        intensidade,
        confortoCorporal,
        gatilhoLocal: gatilhoAconteceu ? gatilhoLocal || null : null,
        gatilhoPensamento: gatilhoAconteceu ? gatilhoPensamento || null : null,
        gatilhoEmocaoDepois: gatilhoAconteceu ? gatilhoEmocaoDepois || null : null,
        alimentacaoPercebida,
        fatores: fatorOutro.trim() ? [...fatores, fatorOutro.trim()] : fatores,
        anotacao: anotacao.trim() || undefined,
        proximaAcao: acao,
      });
      if (resultado?.tipo === 'guardado') {
        setEtapa('guardado');
      }
    } catch {
      setErro('Algo deu errado ao salvar seu check-in. Tente novamente.');
      setEnviando(false);
    }
  }

  if (etapa === 'estado_geral') {
    return (
      <main className="mx-auto max-w-md space-y-6 p-6">
        <h1 className="font-display text-2xl text-texto">Como você está se sentindo hoje?</h1>
        <p className="text-sm text-texto-suave">
          Não existe emoção errada — cada uma traz uma informação. Escolha o que mais se aproxima de agora.
        </p>
        <div className="space-y-3">
          {QUADRANTES.map((q) => (
            <button
              key={q.valor}
              type="button"
              onClick={() => {
                setEstadoGeral(q.valor);
                setEtapa('emocao');
              }}
              className="block w-full rounded-2xl border border-borda bg-superficie p-4 text-left transition-colors hover:bg-fundo"
            >
              <p className="font-display text-base text-texto">{q.titulo}</p>
              <p className="text-sm text-texto-suave">{q.descricao}</p>
            </button>
          ))}
        </div>
      </main>
    );
  }

  if (etapa === 'emocao' && estadoGeral) {
    return (
      <main className="mx-auto max-w-md space-y-6 p-6">
        <h1 className="font-display text-2xl text-texto">Qual dessas palavras combina mais?</h1>
        <div className="space-y-3">
          {EMOCOES_POR_QUADRANTE[estadoGeral].map((e) => (
            <button
              key={e.palavra}
              type="button"
              onClick={() => {
                setEmocaoEspecifica(e.palavra);
                setEtapa('intensidade');
              }}
              className="block w-full rounded-2xl border border-borda bg-superficie p-4 text-left transition-colors hover:bg-fundo"
            >
              <p className="font-display text-base text-texto">{e.palavra}</p>
              <p className="text-sm text-texto-suave">{e.explicacao}</p>
            </button>
          ))}
        </div>
      </main>
    );
  }

  if (etapa === 'intensidade') {
    return (
      <main className="mx-auto max-w-md space-y-6 p-6">
        <h1 className="font-display text-2xl text-texto">Com que intensidade você sente isso?</h1>
        <p className="text-sm text-texto-suave">1 é bem sutil, 5 é bem intenso.</p>
        <Escala valor={intensidade} onChange={setIntensidade} />
        <Botao disabled={intensidade === null} onClick={() => setEtapa('corpo')}>
          Continuar
        </Botao>
      </main>
    );
  }

  if (etapa === 'corpo') {
    return (
      <main className="mx-auto max-w-md space-y-6 p-6">
        <h1 className="font-display text-2xl text-texto">Como está sua relação com o seu corpo hoje?</h1>
        <p className="text-sm text-texto-suave">1 é bem desconfortável, 5 é bem confortável.</p>
        <Escala valor={confortoCorporal} onChange={setConfortoCorporal} />
        <Botao disabled={confortoCorporal === null} onClick={() => setEtapa('gatilhos')}>
          Continuar
        </Botao>
      </main>
    );
  }

  if (etapa === 'gatilhos') {
    return (
      <main className="mx-auto max-w-md space-y-6 p-6">
        <h1 className="font-display text-2xl text-texto">Aconteceu alguma comparação?</h1>
        <p className="text-sm text-texto-suave">Essa etapa é opcional — pode pular se preferir.</p>
        <div className="flex gap-3">
          <Botao
            variante={gatilhoAconteceu === true ? 'primaria' : 'secundaria'}
            onClick={() => setGatilhoAconteceu(true)}
          >
            Sim
          </Botao>
          <Botao
            variante={gatilhoAconteceu === false ? 'primaria' : 'secundaria'}
            onClick={() => setGatilhoAconteceu(false)}
          >
            Não
          </Botao>
        </div>

        {gatilhoAconteceu && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-texto">Onde aconteceu?</p>
              <div className="flex flex-wrap gap-2">
                {LOCAIS_GATILHO.map((local) => (
                  <button
                    key={local}
                    type="button"
                    onClick={() => setGatilhoLocal(local)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      gatilhoLocal === local ? 'border-acao bg-acao text-white' : 'border-borda bg-superficie text-texto-suave'
                    }`}
                  >
                    {local}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-texto" htmlFor="gatilho-pensamento">
                Qual pensamento apareceu? (opcional)
              </label>
              <textarea
                id="gatilho-pensamento"
                value={gatilhoPensamento}
                onChange={(e) => setGatilhoPensamento(e.target.value)}
                className="w-full rounded-2xl border border-borda bg-superficie p-3 text-texto"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-texto" htmlFor="gatilho-emocao">
                Qual emoção veio depois? (opcional)
              </label>
              <textarea
                id="gatilho-emocao"
                value={gatilhoEmocaoDepois}
                onChange={(e) => setGatilhoEmocaoDepois(e.target.value)}
                className="w-full rounded-2xl border border-borda bg-superficie p-3 text-texto"
                rows={2}
              />
            </div>
          </div>
        )}

        <Botao disabled={gatilhoAconteceu === null} onClick={() => setEtapa('alimentacao')}>
          Continuar
        </Botao>
      </main>
    );
  }

  if (etapa === 'alimentacao') {
    return (
      <main className="mx-auto max-w-md space-y-6 p-6">
        <h1 className="font-display text-2xl text-texto">Como você se sentiu em relação à alimentação hoje?</h1>
        <p className="text-sm text-texto-suave">Sem contar calorias, sem classificar alimentos — só como você se sentiu.</p>
        <div className="space-y-3">
          {OPCOES_ALIMENTACAO.map((o) => (
            <button
              key={o.valor}
              type="button"
              onClick={() => {
                setAlimentacaoPercebida(o.valor);
                setEtapa('contexto');
              }}
              className="block w-full rounded-2xl border border-borda bg-superficie p-4 text-left text-texto transition-colors hover:bg-fundo"
            >
              {o.rotulo}
            </button>
          ))}
        </div>
      </main>
    );
  }

  if (etapa === 'contexto') {
    return (
      <main className="mx-auto max-w-md space-y-6 p-6">
        <h1 className="font-display text-2xl text-texto">Algo disso fez parte do seu dia?</h1>
        <p className="text-sm text-texto-suave">Selecione quantos quiser — também é opcional.</p>
        <div className="flex flex-wrap gap-2">
          {FATORES_DISPONIVEIS.map((fator) => (
            <button
              key={fator}
              type="button"
              onClick={() => alternarFator(fator)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                fatores.includes(fator) ? 'border-acao bg-acao text-white' : 'border-borda bg-superficie text-texto-suave'
              }`}
            >
              {fator}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <label className="text-sm text-texto" htmlFor="fator-outro">
            Outro fator (opcional)
          </label>
          <input
            id="fator-outro"
            value={fatorOutro}
            onChange={(e) => setFatorOutro(e.target.value)}
            className="w-full rounded-2xl border border-borda bg-superficie p-3 text-texto"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-texto" htmlFor="anotacao">
            Espaço livre, se quiser escrever mais (opcional — não é analisado nem monitorado)
          </label>
          <textarea
            id="anotacao"
            value={anotacao}
            onChange={(e) => setAnotacao(e.target.value)}
            className="w-full rounded-2xl border border-borda bg-superficie p-3 text-texto"
            rows={3}
          />
        </div>
        <Botao onClick={() => setEtapa('proxima_acao')}>Continuar</Botao>
      </main>
    );
  }

  if (etapa === 'proxima_acao') {
    return (
      <main className="mx-auto max-w-md space-y-6 p-6">
        <h1 className="font-display text-2xl text-texto">O que você quer fazer agora?</h1>
        {erro && <p className="text-sm text-alerta">{erro}</p>}
        <div className="space-y-3">
          <Botao disabled={enviando} onClick={() => handleProximaAcao('guardar')}>
            Apenas guardar este momento
          </Botao>
          <Botao variante="secundaria" disabled={enviando} onClick={() => handleProximaAcao('entender')}>
            Entender melhor o que aconteceu
          </Botao>
          <Botao variante="secundaria" disabled={enviando} onClick={() => handleProximaAcao('pratica_rapida')}>
            Fazer uma prática rápida agora
          </Botao>
        </div>
      </main>
    );
  }

  // etapa === 'guardado'
  return (
    <main className="mx-auto max-w-md space-y-4 p-6 text-center">
      <p className="text-3xl">🌿</p>
      <h1 className="font-display text-2xl text-texto">Seu momento foi guardado</h1>
      <p className="text-sm text-texto-suave">
        Obrigada por se dar esse espaço hoje. Você pode ver seu progresso quando quiser.
      </p>
      <a
        href="/progresso"
        className="block w-full rounded-2xl bg-acao p-3 text-center font-medium text-white transition-colors hover:bg-acao/90"
      >
        Ver meu progresso
      </a>
    </main>
  );
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Verificar lint**

Run: `npx eslint src/app/checkin/CheckinFormClient.tsx`
Expected: sem erros.

- [ ] **Step 4: Rodar a suíte de testes completa**

Run: `npx vitest run`
Expected: todos os testes passando (nenhum novo teste de UI — o assistente não tem lógica pura própria, tudo que decide já foi testado nas Tasks 3-5).

- [ ] **Step 5: Verificar visualmente**

Com `npm run dev`, percorra o assistente completo pelo menos duas vezes: uma escolhendo "apenas guardar" (deve mostrar a confirmação sem sair da página) e outra escolhendo "prática rápida" ou "entender melhor" (deve redirecionar para `/pratica/[id]` ou `/jornada-atividade/[id]`, como o check-in fazia antes). Teste também "vontade de me punir" na etapa de alimentação — deve ir direto para `/seguranca`, não importa o que seria escolhido na etapa 8 (a etapa de próxima ação nem deveria ser alcançável nesse caso, já que a alimentação é a etapa anterior).

- [ ] **Step 6: Commit**

```bash
git add src/app/checkin/CheckinFormClient.tsx
git commit -m "feat: reescrever CheckinFormClient como assistente de 8 etapas"
```

---

### Task 8: Verificação final

**Files:**
- Nenhum arquivo novo — só verificação.

- [ ] **Step 1: Suíte de testes completa**

Run: `npx vitest run`
Expected: todos os testes passando, incluindo os novos de `derivacoes.test.ts`, os testes estendidos de `recommend.test.ts` e `roteamento.test.ts`.

- [ ] **Step 2: Tipos e lint em todo o projeto**

Run: `npx tsc --noEmit`
Expected: sem erros.

Run: `npx eslint src`
Expected: sem erros.

- [ ] **Step 3: Build de produção**

Run: `npm run build`
Expected: build limpo.

- [ ] **Step 4: Confirmar que a migration da Task 1 já rodou**

Pergunte ao humano se `0004_checkin_emocional.sql` já foi executada no Supabase real (Task 1, Step 2) antes de considerar o fluxo pronto para teste end-to-end — sem isso, o `insert` em `submeterCheckin` falha em produção mesmo com o código correto.

- [ ] **Step 5: Passagem manual pelo fluxo completo**

Com a migration rodada e `npm run dev`, confirme: check-in completo até "apenas guardar" grava e mostra confirmação; check-in completo até "prática rápida" grava e redireciona para uma prática; "vontade de me punir" vai direto para `/seguranca`; o restante do app (login, jornadas, progresso, biblioteca de práticas) continua funcionando exatamente como antes.

- [ ] **Step 6: Commit (se houver algo a corrigir) ou encerrar**

Se a verificação revelar algo a ajustar, corrija e commit. Se tudo estiver limpo, esta tarefa não gera commit próprio — é a validação de que as Tasks 1-7 estão prontas para a revisão final.
