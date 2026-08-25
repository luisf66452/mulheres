# Onboarding personalizado — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar, ao fim do onboarding atual (18+ → nome → termos/dados sensíveis → país), três micro-etapas opcionais de personalização — objetivos, temas sensíveis, lembrete — e mover para o fim delas o disparo do evento `CompleteRegistration` (TikTok Pixel), preservando o comportamento de quem já concluiu o onboarding antigo e oferecendo edição/dispensa posterior em `/perfil`.

**Architecture:** Reaproveita a máquina de estados client-side já existente em `OnboardingClient.tsx` (troca de `etapa` via `useState`), o padrão de server action com admin client já usado por `confirmarPais` (colunas sem GRANT de UPDATE direto) e o padrão de coluna gravável diretamente pela usuária já usado por `horario_preferido_notificacao`. Três componentes de seleção (`SeletorObjetivos`, `SeletorTemasSensiveis`, `SeletorLembrete`) são compartilhados entre o wizard de onboarding e uma nova tela de edição em `/perfil/personalizacao`, evitando duas implementações da mesma UI/validação.

**Tech Stack:** Next.js (App Router, Server Actions), React (client components, `useState`/`useTransition`), Supabase (`@supabase/supabase-js`, RLS + admin/service-role client), Vitest + Testing Library.

## Pré-requisito

Este plano assume que a **Seção 1 (fundação de banco)** do design já foi implementada e mergeada em um PR anterior: migration aplicando

```sql
alter table public.perfis
  add column if not exists objetivos text[] not null default '{}',
  add column if not exists temas_sensiveis text[] not null default '{}',
  add column if not exists onboarding_extra_concluido_em timestamptz,
  add column if not exists onboarding_extra_dispensado_em timestamptz;
```

sem GRANT de UPDATE dessas 4 colunas para `authenticated` (mesmo padrão de `pais`/`plano`), e que `src/lib/supabase/types.ts` já tem o tipo `Perfil` atualizado com:

```ts
objetivos: string[];
temas_sensiveis: string[];
onboarding_extra_concluido_em: string | null;
onboarding_extra_dispensado_em: string | null;
```

Nenhuma task deste plano recria essas colunas ou o GRANT. Se ao rodar `pnpm typecheck` (ou equivalente) essas propriedades não existirem em `Perfil`, pare e confirme que o PR da Seção 1 foi de fato mergeado antes de continuar.

## Global Constraints

- A Rose não é terapia, não diagnostica — nenhuma tela desta feature pode sugerir avaliação clínica.
- Nunca pedir permissão de notificação do navegador automaticamente — a etapa de lembrete **nunca** chama `Notification.requestPermission()` (isso só acontece em `inscreverPush()`, atrás do botão "Ativar notificações" em `/perfil/notificacoes`, fora do escopo deste plano).
- `objetivos` e `temas_sensiveis` são validados no servidor contra listas fechadas — nunca strings arbitrárias do cliente.
- `objetivos`/`temas_sensiveis`/`onboarding_extra_concluido_em`/`onboarding_extra_dispensado_em` só são graváveis via server action com `createSupabaseAdminClient()` (sem GRANT de UPDATE direto) — mesmo padrão de `confirmarPais`. `horario_preferido_notificacao` continua gravável pelo client autenticado normal (já tem GRANT, migração 0033).
- "Prefiro decidir depois" (objetivos) e "prefiro não responder" (temas sensíveis) nunca entram nos arrays gravados — produzem array vazio; a etapa fica registrada como respondida só via `onboarding_extra_concluido_em`.
- Não alterar Stripe, Pétalas, preços, domínio, ou a implementação do TikTok Pixel em si (`src/lib/tiktok/eventos.ts`, `TikTokCompleteRegistration.tsx`) — só o ponto do fluxo que decide *quando* redirecionar para `/?cadastro=concluido`.
- Mobile-first, acolhedor — reaproveitar exatamente o estilo visual já usado na etapa de país (`border-acao bg-acao/10` quando selecionado, `border-borda bg-superficie` quando não) para manter consistência.
- TDD: cada task escreve o teste antes da implementação (red → green) e roda a suíte antes de commitar.

---

## File Structure

```
src/lib/perfil/
  personalizacao.ts            (NOVO) constantes fechadas + normalização pura (objetivos/temas)
  personalizacao.test.ts       (NOVO)

src/app/onboarding/
  actions.ts                   (MODIFICADO) confirmarPais para de redirecionar; + salvarObjetivos,
                                 salvarTemasSensiveis, concluirPersonalizacao, dispensarPersonalizacao
  actions.test.ts              (MODIFICADO) 2 testes existentes ajustados + testes novos
  OnboardingClient.tsx          (MODIFICADO) novas etapas 'objetivos' | 'temas' | 'lembrete'
  OnboardingClient.test.tsx    (MODIFICADO) novos testes de transição
  page.tsx                     (MODIFICADO) busca onboarding_extra_concluido_em, novo prop

src/app/components/personalizacao/
  SeletorObjetivos.tsx          (NOVO) compartilhado onboarding + /perfil/personalizacao
  SeletorObjetivos.test.tsx     (NOVO)
  SeletorTemasSensiveis.tsx     (NOVO)
  SeletorTemasSensiveis.test.tsx (NOVO)
  SeletorLembrete.tsx           (NOVO)
  SeletorLembrete.test.tsx      (NOVO)

src/app/perfil/
  page.tsx                      (MODIFICADO) busca os 2 timestamps, renderiza banner + item de menu
  BannerPersonalizacao.tsx      (NOVO)
  BannerPersonalizacao.test.tsx (NOVO)

src/app/perfil/personalizacao/
  page.tsx                      (NOVO) tela de edição, reaproveita os 3 seletores
  PersonalizacaoForm.tsx        (NOVO)
  PersonalizacaoForm.test.tsx   (NOVO)
```

---

### Task 1: Constantes fechadas e normalização pura

**Files:**
- Create: `src/lib/perfil/personalizacao.ts`
- Test: `src/lib/perfil/personalizacao.test.ts`

**Interfaces:**
- Produces: `OBJETIVOS`, `OBJETIVO_IDS`, `type ObjetivoId`, `OBJETIVO_SENTINELA`, `normalizarObjetivosParaGravar(selecionados: ObjetivoId[]): ObjetivoId[]`, `validarObjetivos(valores: string[]): valores is ObjetivoId[]`, `TEMAS_SENSIVEIS`, `TEMA_SENSIVEL_IDS`, `type TemaSensivelId`, `TEMA_SENSIVEL_SENTINELA_SKIP`, `TEMA_SENSIVEL_EXCLUSIVOS`, `normalizarTemasParaGravar(selecionados: TemaSensivelId[]): TemaSensivelId[]`, `validarTemasSensiveis(valores: string[]): valores is TemaSensivelId[]`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/perfil/personalizacao.test.ts
import { describe, it, expect } from 'vitest';
import {
  OBJETIVOS,
  OBJETIVO_IDS,
  OBJETIVO_SENTINELA,
  normalizarObjetivosParaGravar,
  validarObjetivos,
  TEMAS_SENSIVEIS,
  TEMA_SENSIVEL_IDS,
  TEMA_SENSIVEL_SENTINELA_SKIP,
  TEMA_SENSIVEL_EXCLUSIVOS,
  normalizarTemasParaGravar,
  validarTemasSensiveis,
} from './personalizacao';

describe('personalizacao — objetivos', () => {
  it('tem exatamente as 7 opções do enunciado, na ordem, com "prefiro decidir depois" por último', () => {
    expect(OBJETIVOS.map((o) => o.rotulo)).toEqual([
      'Fortalecer minha autoestima',
      'Cuidar da minha relação com o corpo',
      'Ter uma relação mais tranquila com a comida',
      'Praticar autocompaixão',
      'Lidar melhor com a comparação',
      'Criar um ritual diário de cuidado',
      'Prefiro decidir depois',
    ]);
    expect(OBJETIVO_SENTINELA).toBe('decidir_depois');
    expect(OBJETIVO_IDS).toContain(OBJETIVO_SENTINELA);
  });

  it('validarObjetivos aceita só ids da lista fechada', () => {
    expect(validarObjetivos(['fortalecer_autoestima', 'criar_ritual_diario'])).toBe(true);
    expect(validarObjetivos(['fortalecer_autoestima', 'qualquer-coisa'])).toBe(false);
    expect(validarObjetivos([])).toBe(true);
  });

  it('normalizarObjetivosParaGravar remove o sentinela e mantém o resto', () => {
    expect(normalizarObjetivosParaGravar(['fortalecer_autoestima', 'criar_ritual_diario'])).toEqual([
      'fortalecer_autoestima',
      'criar_ritual_diario',
    ]);
  });

  it('normalizarObjetivosParaGravar grava array vazio quando o sentinela foi escolhido, mesmo junto com outros', () => {
    expect(normalizarObjetivosParaGravar(['fortalecer_autoestima', 'decidir_depois'])).toEqual([]);
    expect(normalizarObjetivosParaGravar(['decidir_depois'])).toEqual([]);
    expect(normalizarObjetivosParaGravar([])).toEqual([]);
  });
});

describe('personalizacao — temas sensíveis', () => {
  it('tem exatamente as 6 opções do enunciado, na ordem', () => {
    expect(TEMAS_SENSIVEIS.map((t) => t.rotulo)).toEqual([
      'Corpo e aparência',
      'Alimentação',
      'Comparação',
      'Autocrítica',
      'Nenhum desses',
      'Prefiro não responder',
    ]);
    expect(TEMA_SENSIVEL_SENTINELA_SKIP).toBe('prefiro_nao_responder');
    expect(TEMA_SENSIVEL_EXCLUSIVOS).toEqual(['nenhum_desses', 'prefiro_nao_responder']);
  });

  it('validarTemasSensiveis aceita só ids da lista fechada', () => {
    expect(validarTemasSensiveis(['corpo_aparencia', 'nenhum_desses'])).toBe(true);
    expect(validarTemasSensiveis(['corpo_aparencia', 'outro'])).toBe(false);
  });

  it('normalizarTemasParaGravar mantém "nenhum desses" no array — não é um sentinela de pular', () => {
    expect(normalizarTemasParaGravar(['nenhum_desses'])).toEqual(['nenhum_desses']);
  });

  it('normalizarTemasParaGravar grava array vazio quando "prefiro não responder" foi escolhido', () => {
    expect(normalizarTemasParaGravar(['prefiro_nao_responder'])).toEqual([]);
    expect(normalizarTemasParaGravar(['corpo_aparencia', 'prefiro_nao_responder'])).toEqual([]);
  });

  it('normalizarTemasParaGravar mantém seleção normal intacta', () => {
    expect(normalizarTemasParaGravar(['corpo_aparencia', 'comparacao'])).toEqual(['corpo_aparencia', 'comparacao']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/perfil/personalizacao.test.ts`
Expected: FAIL — `Cannot find module './personalizacao'`.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/perfil/personalizacao.ts
// Listas fechadas de objetivos e temas sensíveis do onboarding personalizado
// (design: docs/superpowers/specs/2026-08-24-evolucao-rose-design.md, seção 2).
// Gravadas em perfis.objetivos / perfis.temas_sensiveis (text[]) só via server
// action com admin client — ver src/app/onboarding/actions.ts. Nunca aceitar
// string arbitrária do cliente: toda escrita passa por validarObjetivos /
// validarTemasSensiveis primeiro.

export const OBJETIVOS = [
  { id: 'fortalecer_autoestima', rotulo: 'Fortalecer minha autoestima' },
  { id: 'cuidar_relacao_corpo', rotulo: 'Cuidar da minha relação com o corpo' },
  { id: 'relacao_tranquila_comida', rotulo: 'Ter uma relação mais tranquila com a comida' },
  { id: 'praticar_autocompaixao', rotulo: 'Praticar autocompaixão' },
  { id: 'lidar_comparacao', rotulo: 'Lidar melhor com a comparação' },
  { id: 'criar_ritual_diario', rotulo: 'Criar um ritual diário de cuidado' },
  { id: 'decidir_depois', rotulo: 'Prefiro decidir depois' },
] as const;

export type ObjetivoId = (typeof OBJETIVOS)[number]['id'];
export const OBJETIVO_IDS: ObjetivoId[] = OBJETIVOS.map((o) => o.id) as ObjetivoId[];

// Escolher este item substitui qualquer outra seleção (ver SeletorObjetivos)
// e nunca entra no array gravado — a etapa fica registrada como respondida
// só pelo timestamp onboarding_extra_concluido_em, não pelo conteúdo do array.
export const OBJETIVO_SENTINELA: ObjetivoId = 'decidir_depois';

export function validarObjetivos(valores: string[]): valores is ObjetivoId[] {
  return valores.every((v) => (OBJETIVO_IDS as string[]).includes(v));
}

export function normalizarObjetivosParaGravar(selecionados: ObjetivoId[]): ObjetivoId[] {
  if (selecionados.includes(OBJETIVO_SENTINELA)) return [];
  return selecionados;
}

export const TEMAS_SENSIVEIS = [
  { id: 'corpo_aparencia', rotulo: 'Corpo e aparência' },
  { id: 'alimentacao', rotulo: 'Alimentação' },
  { id: 'comparacao', rotulo: 'Comparação' },
  { id: 'autocritica', rotulo: 'Autocrítica' },
  { id: 'nenhum_desses', rotulo: 'Nenhum desses' },
  { id: 'prefiro_nao_responder', rotulo: 'Prefiro não responder' },
] as const;

export type TemaSensivelId = (typeof TEMAS_SENSIVEIS)[number]['id'];
export const TEMA_SENSIVEL_IDS: TemaSensivelId[] = TEMAS_SENSIVEIS.map((t) => t.id) as TemaSensivelId[];

// "prefiro não responder" nunca entra no array gravado (regra do design).
// "nenhum desses" É gravado — é uma resposta legítima ("nenhum destes temas
// é sensível para mim"), só é exclusiva com as outras opções na UI.
export const TEMA_SENSIVEL_SENTINELA_SKIP: TemaSensivelId = 'prefiro_nao_responder';
export const TEMA_SENSIVEL_EXCLUSIVOS: TemaSensivelId[] = ['nenhum_desses', 'prefiro_nao_responder'];

export function validarTemasSensiveis(valores: string[]): valores is TemaSensivelId[] {
  return valores.every((v) => (TEMA_SENSIVEL_IDS as string[]).includes(v));
}

export function normalizarTemasParaGravar(selecionados: TemaSensivelId[]): TemaSensivelId[] {
  if (selecionados.includes(TEMA_SENSIVEL_SENTINELA_SKIP)) return [];
  return selecionados;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/perfil/personalizacao.test.ts`
Expected: PASS (9 testes).

- [ ] **Step 5: Commit**

```bash
git add src/lib/perfil/personalizacao.ts src/lib/perfil/personalizacao.test.ts
git commit -m "feat(onboarding): constantes fechadas e normalização de objetivos/temas sensíveis"
```

---

### Task 2: Server actions — salvar objetivos/temas, concluir e dispensar; `confirmarPais` para de redirecionar

**Files:**
- Modify: `src/app/onboarding/actions.ts`
- Modify: `src/app/onboarding/actions.test.ts`

**Interfaces:**
- Consumes: `validarObjetivos`, `normalizarObjetivosParaGravar`, `validarTemasSensiveis`, `normalizarTemasParaGravar` de `@/lib/perfil/personalizacao` (Task 1); `createSupabaseAdminClient` de `@/lib/supabase/admin` (já existe).
- Produces: `confirmarPais(paisEscolhido: string): Promise<{ erro?: string }>` (agora **nunca** redireciona em sucesso — só retorna `{}`); `salvarObjetivos(selecionados: string[]): Promise<{ erro?: string }>`; `salvarTemasSensiveis(selecionados: string[]): Promise<{ erro?: string }>`; `concluirPersonalizacao(horarioLembrete: string | null): Promise<{ erro?: string }>` (redireciona para `/?cadastro=concluido` em sucesso); `dispensarPersonalizacao(): Promise<{ erro?: string }>`.

- [ ] **Step 1: Write the failing tests (ajusta os 2 existentes que dependiam do redirect de sucesso, adiciona os novos)**

Primeiro, ajuste os dois testes existentes que hoje esperam `NEXT_REDIRECT:/` em sucesso — com a mudança, sucesso não redireciona mais:

```ts
// src/app/onboarding/actions.test.ts
// Substituir o teste "em confirmação legítima, escreve só {pais, pais_confirmado_em}..."
// (linhas ~87-101 do arquivo atual) por:
it('em confirmação legítima, escreve só {pais, pais_confirmado_em} e NÃO redireciona mais — quem decide o próximo passo é o client', async () => {
  const fake = criarSupabaseFake({ pais_confirmado_em: null });
  vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);
  const admin = criarAdminFake();
  vi.mocked(createSupabaseAdminClient).mockReturnValue(admin as never);

  const resultado = await confirmarPais('PT');

  expect(resultado).toEqual({});
  expect(admin.update).toHaveBeenCalledTimes(1);
  const payload = admin.update.mock.calls[0][0] as Record<string, unknown>;
  expect(Object.keys(payload).sort()).toEqual(['pais', 'pais_confirmado_em'].sort());
  expect(payload.pais).toBe('PT');
  expect('plano' in payload).toBe(false);
  expect('role' in payload).toBe(false);
});

// Substituir o teste "a atualização é sempre filtrada pelo id da própria usuária autenticada"
// (linhas ~103-112 do arquivo atual) por:
it('a atualização é sempre filtrada pelo id da própria usuária autenticada', async () => {
  const fake = criarSupabaseFake({ pais_confirmado_em: null });
  vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);
  const admin = criarAdminFake();
  vi.mocked(createSupabaseAdminClient).mockReturnValue(admin as never);

  await confirmarPais('BR');

  expect(admin.eq).toHaveBeenCalled();
});
```

O teste `'não sobrescreve uma confirmação já existente — redireciona sem chamar o admin client'` (linhas ~78-85) **continua igual** — esse caso (país já confirmado antes) ainda redireciona para `/`, não muda.

Agora adicione, no fim do arquivo, testes para as 4 actions novas:

```ts
import {
  confirmarPais,
  salvarObjetivos,
  salvarTemasSensiveis,
  concluirPersonalizacao,
  dispensarPersonalizacao,
} from './actions';

describe('salvarObjetivos', () => {
  it('rejeita objetivo fora da lista fechada, sem chamar o admin client', async () => {
    const fake = criarSupabaseFake(null);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);
    const adminSpy = vi.mocked(createSupabaseAdminClient);

    const resultado = await salvarObjetivos(['objetivo-inventado']);

    expect(resultado.erro).toBeDefined();
    expect(adminSpy).not.toHaveBeenCalled();
  });

  it('grava array vazio quando o sentinela "decidir_depois" foi escolhido', async () => {
    const fake = criarSupabaseFake(null);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);
    const admin = criarAdminFake();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(admin as never);

    await salvarObjetivos(['fortalecer_autoestima', 'decidir_depois']);

    expect(admin.update).toHaveBeenCalledWith({ objetivos: [] });
  });

  it('grava a seleção normalizada quando válida', async () => {
    const fake = criarSupabaseFake(null);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);
    const admin = criarAdminFake();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(admin as never);

    const resultado = await salvarObjetivos(['fortalecer_autoestima', 'criar_ritual_diario']);

    expect(resultado).toEqual({});
    expect(admin.update).toHaveBeenCalledWith({ objetivos: ['fortalecer_autoestima', 'criar_ritual_diario'] });
    expect(admin.eq).toHaveBeenCalledWith('id', USUARIA_ID);
  });
});

describe('salvarTemasSensiveis', () => {
  it('rejeita tema fora da lista fechada, sem chamar o admin client', async () => {
    const fake = criarSupabaseFake(null);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);
    const adminSpy = vi.mocked(createSupabaseAdminClient);

    const resultado = await salvarTemasSensiveis(['tema-inventado']);

    expect(resultado.erro).toBeDefined();
    expect(adminSpy).not.toHaveBeenCalled();
  });

  it('grava array vazio quando "prefiro_nao_responder" foi escolhido', async () => {
    const fake = criarSupabaseFake(null);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);
    const admin = criarAdminFake();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(admin as never);

    await salvarTemasSensiveis(['prefiro_nao_responder']);

    expect(admin.update).toHaveBeenCalledWith({ temas_sensiveis: [] });
  });

  it('mantém "nenhum_desses" no array gravado — não é sentinela de pular', async () => {
    const fake = criarSupabaseFake(null);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);
    const admin = criarAdminFake();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(admin as never);

    await salvarTemasSensiveis(['nenhum_desses']);

    expect(admin.update).toHaveBeenCalledWith({ temas_sensiveis: ['nenhum_desses'] });
  });
});

describe('concluirPersonalizacao', () => {
  it('sem horário: não toca preferencias/horario, só marca onboarding_extra_concluido_em e redireciona', async () => {
    const fake = criarSupabaseFake(null);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);
    const admin = criarAdminFake();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(admin as never);

    await expect(concluirPersonalizacao(null)).rejects.toThrow('NEXT_REDIRECT:/?cadastro=concluido');

    expect(fake.from).not.toHaveBeenCalledWith('perfis'); // nenhum update via client autenticado
    expect(admin.update).toHaveBeenCalledWith(
      expect.objectContaining({ onboarding_extra_concluido_em: expect.any(String) })
    );
  });

  it('com horário: grava horario_preferido_notificacao pelo client autenticado (sem admin) e depois marca conclusão', async () => {
    const eq = vi.fn(async () => ({ error: null }));
    const update = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ update }));
    const getUser = vi.fn(async () => ({ data: { user: { id: USUARIA_ID } } }));
    const fakeAutenticado = { from, auth: { getUser } };
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fakeAutenticado as never);
    const admin = criarAdminFake();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(admin as never);

    await expect(concluirPersonalizacao('08:00')).rejects.toThrow('NEXT_REDIRECT:/?cadastro=concluido');

    expect(update).toHaveBeenCalledWith({ horario_preferido_notificacao: '08:00' });
    expect(admin.update).toHaveBeenCalledWith(
      expect.objectContaining({ onboarding_extra_concluido_em: expect.any(String) })
    );
  });
});

describe('dispensarPersonalizacao', () => {
  it('grava só onboarding_extra_dispensado_em via admin client', async () => {
    const fake = criarSupabaseFake(null);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);
    const admin = criarAdminFake();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(admin as never);

    const resultado = await dispensarPersonalizacao();

    expect(resultado).toEqual({});
    const payload = admin.update.mock.calls[0][0] as Record<string, unknown>;
    expect(Object.keys(payload)).toEqual(['onboarding_extra_dispensado_em']);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/app/onboarding/actions.test.ts`
Expected: FAIL — `salvarObjetivos`/`salvarTemasSensiveis`/`concluirPersonalizacao`/`dispensarPersonalizacao` não exportados; os 2 testes ajustados falham porque `confirmarPais` ainda redireciona em sucesso.

- [ ] **Step 3: Write the implementation**

```ts
// src/app/onboarding/actions.ts
'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { normalizarNome } from '@/lib/perfil/nome';
import type { PaisSuportado } from '@/lib/perfil/pais';
import { PAISES_SUPORTADOS } from '@/lib/perfil/pais';
import {
  validarObjetivos,
  normalizarObjetivosParaGravar,
  validarTemasSensiveis,
  normalizarTemasParaGravar,
} from '@/lib/perfil/personalizacao';

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

  // Não redireciona aqui — quem chama decide se ainda falta a etapa de país
  // (ver OnboardingClient) antes de mandar a usuária para o app.
  return {};
}

// `pais` só é gravável pelo client autenticado através desta action com
// service role (ver migração 0012_perfis_trava_colunas_sensiveis.sql: a
// coluna é deliberadamente excluída do GRANT de UPDATE direto do PostgREST,
// para não reabrir a superfície de auto-alteração que aquela migração
// fechou). A action valida a lista de países suportados e nunca sobrescreve
// uma confirmação que já existe.
export async function confirmarPais(paisEscolhido: string): Promise<{ erro?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  if (!PAISES_SUPORTADOS.includes(paisEscolhido as PaisSuportado)) {
    return { erro: 'País não suportado.' };
  }
  const pais = paisEscolhido as PaisSuportado;

  const { data: perfilAtual } = await supabase
    .from('perfis')
    .select('pais_confirmado_em')
    .eq('id', user.id)
    .single();

  // Já confirmado antes — não sobrescreve silenciosamente (mesmo se a
  // usuária, por algum motivo, reenviar este formulário de novo).
  if (perfilAtual?.pais_confirmado_em) {
    redirect('/');
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { erro: 'Não foi possível confirmar o país agora. Tente novamente.' };
  }

  const { error } = await admin
    .from('perfis')
    .update({ pais, pais_confirmado_em: new Date().toISOString() })
    .eq('id', user.id);

  if (error) {
    console.error('[confirmarPais] erro ao atualizar perfis:', {
      userId: user.id,
      code: error.code,
      message: error.message,
    });
    return { erro: 'Não foi possível confirmar o país agora. Tente novamente.' };
  }

  // País deixou de ser a última etapa do onboarding: a partir desta mudança
  // (design seção 2), a personalização (objetivos/temas/lembrete) vem em
  // seguida, dentro do mesmo OnboardingClient. Quem decide para onde ir a
  // partir daqui é o client (avança para a etapa 'objetivos', ou pula direto
  // para '/' se personalizacaoJaConcluida). O evento CompleteRegistration do
  // TikTok Pixel passou a disparar só ao final dessa nova etapa — ver
  // concluirPersonalizacao, abaixo, que é quem agora redireciona para
  // '/?cadastro=concluido'.
  return {};
}

/**
 * Grava perfis.objetivos — validado contra a lista fechada em
 * src/lib/perfil/personalizacao.ts. "Prefiro decidir depois" nunca entra no
 * array (normalizarObjetivosParaGravar grava '{}' nesse caso). Sem GRANT de
 * UPDATE direto para essa coluna — escreve via admin client, mesmo padrão de
 * confirmarPais. Pode ser chamada de novo a qualquer momento (edição
 * posterior em /perfil/personalizacao) — sempre substitui o array inteiro.
 */
export async function salvarObjetivos(selecionados: string[]): Promise<{ erro?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  if (!validarObjetivos(selecionados)) {
    return { erro: 'Seleção de objetivos inválida.' };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { erro: 'Não foi possível salvar seus objetivos agora. Tente novamente.' };
  }

  const { error } = await admin
    .from('perfis')
    .update({ objetivos: normalizarObjetivosParaGravar(selecionados) })
    .eq('id', user.id);

  if (error) {
    console.error('[salvarObjetivos] erro ao atualizar perfis:', {
      userId: user.id,
      code: error.code,
      message: error.message,
    });
    return { erro: 'Não foi possível salvar seus objetivos agora. Tente novamente.' };
  }

  return {};
}

/**
 * Grava perfis.temas_sensiveis — mesmo padrão de salvarObjetivos.
 * "Prefiro não responder" nunca entra no array; "nenhum desses" entra (é uma
 * resposta legítima, só exclusiva na UI — ver SeletorTemasSensiveis).
 */
export async function salvarTemasSensiveis(selecionados: string[]): Promise<{ erro?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  if (!validarTemasSensiveis(selecionados)) {
    return { erro: 'Seleção de temas sensíveis inválida.' };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { erro: 'Não foi possível salvar seus temas agora. Tente novamente.' };
  }

  const { error } = await admin
    .from('perfis')
    .update({ temas_sensiveis: normalizarTemasParaGravar(selecionados) })
    .eq('id', user.id);

  if (error) {
    console.error('[salvarTemasSensiveis] erro ao atualizar perfis:', {
      userId: user.id,
      code: error.code,
      message: error.message,
    });
    return { erro: 'Não foi possível salvar seus temas agora. Tente novamente.' };
  }

  return {};
}

/**
 * Última etapa do onboarding personalizado. `horarioLembrete` é `null`
 * quando a usuária escolheu "não quero lembretes agora" (nenhuma preferência
 * é gravada nesse caso — comportamento distinto de gravar uma string vazia).
 * Quando não-nulo, grava horario_preferido_notificacao pelo client
 * autenticado normal (coluna já tem GRANT de UPDATE — migração 0033, mesmo
 * caminho de salvarHorarioPreferido em src/app/settings/actions.ts). Em
 * seguida marca onboarding_extra_concluido_em (admin client, sem GRANT
 * direto) e redireciona para '/?cadastro=concluido' — único ponto do app,
 * a partir desta mudança, em que a Home dispara o evento CompleteRegistration
 * (ver TikTokCompleteRegistration.tsx, não alterado por este plano).
 */
export async function concluirPersonalizacao(horarioLembrete: string | null): Promise<{ erro?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  if (horarioLembrete !== null) {
    const { error: erroHorario } = await supabase
      .from('perfis')
      .update({ horario_preferido_notificacao: horarioLembrete })
      .eq('id', user.id);

    if (erroHorario) {
      console.error('[concluirPersonalizacao] erro ao salvar horário preferido:', {
        userId: user.id,
        code: erroHorario.code,
        message: erroHorario.message,
      });
      return { erro: 'Não foi possível salvar seu lembrete agora. Tente novamente.' };
    }
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { erro: 'Não foi possível concluir a personalização agora. Tente novamente.' };
  }

  const { error } = await admin
    .from('perfis')
    .update({ onboarding_extra_concluido_em: new Date().toISOString() })
    .eq('id', user.id);

  if (error) {
    console.error('[concluirPersonalizacao] erro ao marcar conclusão:', {
      userId: user.id,
      code: error.code,
      message: error.message,
    });
    return { erro: 'Não foi possível concluir a personalização agora. Tente novamente.' };
  }

  redirect('/?cadastro=concluido');
}

/**
 * Usada só pelo banner dispensável em /perfil (usuárias antigas, que já
 * passaram pelo onboarding antes dessa etapa existir). Grava só
 * onboarding_extra_dispensado_em — nunca onboarding_extra_concluido_em, que
 * fica reservado para quem de fato passou pela etapa (mesmo escolhendo
 * "prefiro decidir depois"/"prefiro não responder" em tudo).
 */
export async function dispensarPersonalizacao(): Promise<{ erro?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { erro: 'Não autenticada.' };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { erro: 'Não foi possível agora. Tente novamente.' };
  }

  const { error } = await admin
    .from('perfis')
    .update({ onboarding_extra_dispensado_em: new Date().toISOString() })
    .eq('id', user.id);

  if (error) {
    console.error('[dispensarPersonalizacao] erro ao atualizar perfis:', {
      userId: user.id,
      code: error.code,
      message: error.message,
    });
    return { erro: 'Não foi possível dispensar agora. Tente novamente.' };
  }

  return {};
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/app/onboarding/actions.test.ts`
Expected: PASS (todos os testes, existentes e novos).

- [ ] **Step 5: Commit**

```bash
git add src/app/onboarding/actions.ts src/app/onboarding/actions.test.ts
git commit -m "feat(onboarding): server actions de objetivos/temas/lembrete; confirmarPais para de redirecionar"
```

---

### Task 3: `SeletorObjetivos` (componente compartilhado)

**Files:**
- Create: `src/app/components/personalizacao/SeletorObjetivos.tsx`
- Test: `src/app/components/personalizacao/SeletorObjetivos.test.tsx`

**Interfaces:**
- Consumes: `OBJETIVOS`, `OBJETIVO_SENTINELA`, `type ObjetivoId` de `@/lib/perfil/personalizacao` (Task 1); `Botao` de `@/app/components/Botao`.
- Produces: `export default function SeletorObjetivos({ selecaoInicial, onSalvar, aoSalvarComSucesso, rotuloBotao }: { selecaoInicial: ObjetivoId[]; onSalvar: (selecionados: ObjetivoId[]) => Promise<{ erro?: string }>; aoSalvarComSucesso?: () => void; rotuloBotao?: string })`. `aoSalvarComSucesso` é chamado só quando `onSalvar` resolve sem `erro` — o wizard de onboarding usa isso para avançar de etapa; a tela de edição em `/perfil` não passa esse prop e o componente mostra "Salvo." inline em vez disso.

- [ ] **Step 1: Write the failing test**

```tsx
// src/app/components/personalizacao/SeletorObjetivos.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import SeletorObjetivos from './SeletorObjetivos';

const onSalvar = vi.fn(async (selecionados: string[]) => {
  void selecionados;
  return {};
});

beforeEach(() => {
  onSalvar.mockClear();
});

describe('SeletorObjetivos', () => {
  it('mostra as 7 opções, nenhuma selecionada por padrão', () => {
    render(<SeletorObjetivos selecaoInicial={[]} onSalvar={onSalvar} />);
    expect(screen.getByRole('button', { name: 'Fortalecer minha autoestima' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(screen.getByRole('button', { name: 'Prefiro decidir depois' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('permite multi-seleção de objetivos normais', () => {
    render(<SeletorObjetivos selecaoInicial={[]} onSalvar={onSalvar} />);
    fireEvent.click(screen.getByRole('button', { name: 'Fortalecer minha autoestima' }));
    fireEvent.click(screen.getByRole('button', { name: 'Praticar autocompaixão' }));

    expect(screen.getByRole('button', { name: 'Fortalecer minha autoestima' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Praticar autocompaixão' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('escolher "prefiro decidir depois" limpa qualquer seleção anterior e é exclusivo', () => {
    render(<SeletorObjetivos selecaoInicial={[]} onSalvar={onSalvar} />);
    fireEvent.click(screen.getByRole('button', { name: 'Fortalecer minha autoestima' }));
    fireEvent.click(screen.getByRole('button', { name: 'Prefiro decidir depois' }));

    expect(screen.getByRole('button', { name: 'Fortalecer minha autoestima' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(screen.getByRole('button', { name: 'Prefiro decidir depois' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('escolher um objetivo normal depois de "prefiro decidir depois" desmarca o sentinela', () => {
    render(<SeletorObjetivos selecaoInicial={[]} onSalvar={onSalvar} />);
    fireEvent.click(screen.getByRole('button', { name: 'Prefiro decidir depois' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fortalecer minha autoestima' }));

    expect(screen.getByRole('button', { name: 'Prefiro decidir depois' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Fortalecer minha autoestima' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('o botão de continuar nunca fica desabilitado — a etapa é sempre opcional', () => {
    render(<SeletorObjetivos selecaoInicial={[]} onSalvar={onSalvar} />);
    expect(screen.getByRole('button', { name: /continuar/i })).toBeEnabled();
  });

  it('ao confirmar, chama onSalvar com a seleção atual e depois aoSalvarComSucesso', async () => {
    const aoSalvarComSucesso = vi.fn();
    render(<SeletorObjetivos selecaoInicial={[]} onSalvar={onSalvar} aoSalvarComSucesso={aoSalvarComSucesso} />);

    fireEvent.click(screen.getByRole('button', { name: 'Fortalecer minha autoestima' }));
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

    await waitFor(() => {
      expect(onSalvar).toHaveBeenCalledWith(['fortalecer_autoestima']);
      expect(aoSalvarComSucesso).toHaveBeenCalledTimes(1);
    });
  });

  it('em modo de edição (sem aoSalvarComSucesso), mostra confirmação "Salvo." em vez de avançar', async () => {
    render(<SeletorObjetivos selecaoInicial={[]} onSalvar={onSalvar} rotuloBotao="Salvar" />);

    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }));

    await waitFor(() => {
      expect(screen.getByText(/salvo/i)).toBeInTheDocument();
    });
  });

  it('mostra erro retornado por onSalvar sem travar a tela', async () => {
    onSalvar.mockResolvedValueOnce({ erro: 'Não foi possível salvar seus objetivos agora. Tente novamente.' });
    render(<SeletorObjetivos selecaoInicial={[]} onSalvar={onSalvar} />);

    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

    await waitFor(() => {
      expect(screen.getByText(/não foi possível salvar seus objetivos agora/i)).toBeInTheDocument();
    });
  });

  it('parte da seleção inicial informada (modo edição)', () => {
    render(<SeletorObjetivos selecaoInicial={['praticar_autocompaixao']} onSalvar={onSalvar} />);
    expect(screen.getByRole('button', { name: 'Praticar autocompaixão' })).toHaveAttribute('aria-pressed', 'true');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/app/components/personalizacao/SeletorObjetivos.test.tsx`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Write the implementation**

```tsx
// src/app/components/personalizacao/SeletorObjetivos.tsx
'use client';

import { useState, useTransition } from 'react';
import Botao from '@/app/components/Botao';
import { OBJETIVOS, OBJETIVO_SENTINELA, type ObjetivoId } from '@/lib/perfil/personalizacao';

export default function SeletorObjetivos({
  selecaoInicial,
  onSalvar,
  aoSalvarComSucesso,
  rotuloBotao = 'Continuar',
}: {
  selecaoInicial: ObjetivoId[];
  onSalvar: (selecionados: ObjetivoId[]) => Promise<{ erro?: string }>;
  aoSalvarComSucesso?: () => void;
  rotuloBotao?: string;
}) {
  const [selecionados, setSelecionados] = useState<ObjetivoId[]>(selecaoInicial);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [salvando, startTransition] = useTransition();

  function alternar(id: ObjetivoId) {
    setSalvo(false);
    if (id === OBJETIVO_SENTINELA) {
      setSelecionados((atual) => (atual.includes(id) ? [] : [id]));
      return;
    }
    setSelecionados((atual) => {
      const semSentinela = atual.filter((item) => item !== OBJETIVO_SENTINELA);
      return semSentinela.includes(id) ? semSentinela.filter((item) => item !== id) : [...semSentinela, id];
    });
  }

  function handleConfirmar() {
    setErro(null);
    setSalvo(false);
    startTransition(async () => {
      const resultado = await onSalvar(selecionados);
      if (resultado?.erro) {
        setErro(resultado.erro);
        return;
      }
      if (aoSalvarComSucesso) {
        aoSalvarComSucesso();
      } else {
        setSalvo(true);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        {OBJETIVOS.map((objetivo) => (
          <button
            key={objetivo.id}
            type="button"
            onClick={() => alternar(objetivo.id)}
            aria-pressed={selecionados.includes(objetivo.id)}
            className={`rounded-2xl border p-4 text-left font-medium transition-colors ${
              selecionados.includes(objetivo.id)
                ? 'border-acao bg-acao/10 text-texto'
                : 'border-borda bg-superficie text-texto-suave'
            }`}
          >
            {objetivo.rotulo}
          </button>
        ))}
      </div>

      {erro && <p className="text-alerta">{erro}</p>}
      {salvo && (
        <p role="status" className="text-sm text-acao">
          Salvo.
        </p>
      )}

      <Botao disabled={salvando} onClick={handleConfirmar}>
        {salvando ? 'Salvando...' : rotuloBotao}
      </Botao>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/app/components/personalizacao/SeletorObjetivos.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/components/personalizacao/SeletorObjetivos.tsx src/app/components/personalizacao/SeletorObjetivos.test.tsx
git commit -m "feat(onboarding): componente SeletorObjetivos compartilhado"
```

---

### Task 4: `SeletorTemasSensiveis` (componente compartilhado)

**Files:**
- Create: `src/app/components/personalizacao/SeletorTemasSensiveis.tsx`
- Test: `src/app/components/personalizacao/SeletorTemasSensiveis.test.tsx`

**Interfaces:**
- Consumes: `TEMAS_SENSIVEIS`, `TEMA_SENSIVEL_EXCLUSIVOS`, `type TemaSensivelId` de `@/lib/perfil/personalizacao` (Task 1); `Botao`.
- Produces: `export default function SeletorTemasSensiveis({ selecaoInicial, onSalvar, aoSalvarComSucesso, rotuloBotao }: { selecaoInicial: TemaSensivelId[]; onSalvar: (selecionados: TemaSensivelId[]) => Promise<{ erro?: string }>; aoSalvarComSucesso?: () => void; rotuloBotao?: string })`. Mesmo contrato de `SeletorObjetivos` (Task 3), mas com **dois** itens exclusivos ("Nenhum desses" e "Prefiro não responder") em vez de um.

- [ ] **Step 1: Write the failing test**

```tsx
// src/app/components/personalizacao/SeletorTemasSensiveis.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import SeletorTemasSensiveis from './SeletorTemasSensiveis';

const onSalvar = vi.fn(async (selecionados: string[]) => {
  void selecionados;
  return {};
});

beforeEach(() => {
  onSalvar.mockClear();
});

describe('SeletorTemasSensiveis', () => {
  it('mostra as 6 opções, nenhuma selecionada por padrão', () => {
    render(<SeletorTemasSensiveis selecaoInicial={[]} onSalvar={onSalvar} />);
    expect(screen.getByRole('button', { name: 'Corpo e aparência' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Prefiro não responder' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('permite multi-seleção de temas normais', () => {
    render(<SeletorTemasSensiveis selecaoInicial={[]} onSalvar={onSalvar} />);
    fireEvent.click(screen.getByRole('button', { name: 'Corpo e aparência' }));
    fireEvent.click(screen.getByRole('button', { name: 'Comparação' }));

    expect(screen.getByRole('button', { name: 'Corpo e aparência' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Comparação' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('"nenhum desses" é exclusivo — limpa outras seleções e é limpo por elas', () => {
    render(<SeletorTemasSensiveis selecaoInicial={[]} onSalvar={onSalvar} />);
    fireEvent.click(screen.getByRole('button', { name: 'Corpo e aparência' }));
    fireEvent.click(screen.getByRole('button', { name: 'Nenhum desses' }));

    expect(screen.getByRole('button', { name: 'Corpo e aparência' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Nenhum desses' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Alimentação' }));
    expect(screen.getByRole('button', { name: 'Nenhum desses' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Alimentação' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('"prefiro não responder" é exclusivo com "nenhum desses" e com os temas normais', () => {
    render(<SeletorTemasSensiveis selecaoInicial={[]} onSalvar={onSalvar} />);
    fireEvent.click(screen.getByRole('button', { name: 'Nenhum desses' }));
    fireEvent.click(screen.getByRole('button', { name: 'Prefiro não responder' }));

    expect(screen.getByRole('button', { name: 'Nenhum desses' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Prefiro não responder' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('ao confirmar, chama onSalvar com a seleção atual e depois aoSalvarComSucesso', async () => {
    const aoSalvarComSucesso = vi.fn();
    render(<SeletorTemasSensiveis selecaoInicial={[]} onSalvar={onSalvar} aoSalvarComSucesso={aoSalvarComSucesso} />);

    fireEvent.click(screen.getByRole('button', { name: 'Autocrítica' }));
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

    await waitFor(() => {
      expect(onSalvar).toHaveBeenCalledWith(['autocritica']);
      expect(aoSalvarComSucesso).toHaveBeenCalledTimes(1);
    });
  });

  it('mostra erro retornado por onSalvar sem travar a tela', async () => {
    onSalvar.mockResolvedValueOnce({ erro: 'Não foi possível salvar seus temas agora. Tente novamente.' });
    render(<SeletorTemasSensiveis selecaoInicial={[]} onSalvar={onSalvar} />);

    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

    await waitFor(() => {
      expect(screen.getByText(/não foi possível salvar seus temas agora/i)).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/app/components/personalizacao/SeletorTemasSensiveis.test.tsx`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Write the implementation**

```tsx
// src/app/components/personalizacao/SeletorTemasSensiveis.tsx
'use client';

import { useState, useTransition } from 'react';
import Botao from '@/app/components/Botao';
import { TEMAS_SENSIVEIS, TEMA_SENSIVEL_EXCLUSIVOS, type TemaSensivelId } from '@/lib/perfil/personalizacao';

export default function SeletorTemasSensiveis({
  selecaoInicial,
  onSalvar,
  aoSalvarComSucesso,
  rotuloBotao = 'Continuar',
}: {
  selecaoInicial: TemaSensivelId[];
  onSalvar: (selecionados: TemaSensivelId[]) => Promise<{ erro?: string }>;
  aoSalvarComSucesso?: () => void;
  rotuloBotao?: string;
}) {
  const [selecionados, setSelecionados] = useState<TemaSensivelId[]>(selecaoInicial);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [salvando, startTransition] = useTransition();

  function alternar(id: TemaSensivelId) {
    setSalvo(false);
    if (TEMA_SENSIVEL_EXCLUSIVOS.includes(id)) {
      setSelecionados((atual) => (atual.includes(id) ? [] : [id]));
      return;
    }
    setSelecionados((atual) => {
      const semExclusivos = atual.filter((item) => !TEMA_SENSIVEL_EXCLUSIVOS.includes(item));
      return semExclusivos.includes(id) ? semExclusivos.filter((item) => item !== id) : [...semExclusivos, id];
    });
  }

  function handleConfirmar() {
    setErro(null);
    setSalvo(false);
    startTransition(async () => {
      const resultado = await onSalvar(selecionados);
      if (resultado?.erro) {
        setErro(resultado.erro);
        return;
      }
      if (aoSalvarComSucesso) {
        aoSalvarComSucesso();
      } else {
        setSalvo(true);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        {TEMAS_SENSIVEIS.map((tema) => (
          <button
            key={tema.id}
            type="button"
            onClick={() => alternar(tema.id)}
            aria-pressed={selecionados.includes(tema.id)}
            className={`rounded-2xl border p-4 text-left font-medium transition-colors ${
              selecionados.includes(tema.id)
                ? 'border-acao bg-acao/10 text-texto'
                : 'border-borda bg-superficie text-texto-suave'
            }`}
          >
            {tema.rotulo}
          </button>
        ))}
      </div>

      {erro && <p className="text-alerta">{erro}</p>}
      {salvo && (
        <p role="status" className="text-sm text-acao">
          Salvo.
        </p>
      )}

      <Botao disabled={salvando} onClick={handleConfirmar}>
        {salvando ? 'Salvando...' : rotuloBotao}
      </Botao>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/app/components/personalizacao/SeletorTemasSensiveis.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/components/personalizacao/SeletorTemasSensiveis.tsx src/app/components/personalizacao/SeletorTemasSensiveis.test.tsx
git commit -m "feat(onboarding): componente SeletorTemasSensiveis compartilhado"
```

---

### Task 5: `SeletorLembrete` (componente compartilhado)

**Files:**
- Create: `src/app/components/personalizacao/SeletorLembrete.tsx`
- Test: `src/app/components/personalizacao/SeletorLembrete.test.tsx`

**Interfaces:**
- Consumes: `Botao`.
- Produces: `export default function SeletorLembrete({ horarioInicial, onSalvar, aoSalvarComSucesso, rotuloBotao }: { horarioInicial: string | null; onSalvar: (horario: string | null) => Promise<{ erro?: string }>; aoSalvarComSucesso?: () => void; rotuloBotao?: string })`. Chamar `onSalvar(null)` (via "não quero lembretes agora") nunca grava preferência ativa nem toca `Notification`.

**Nota de segurança comportamental:** este componente **não deve importar nem referenciar `Notification` em nenhum ponto** — a permissão do navegador só é pedida em `src/lib/push/subscribe.ts` (`inscreverPush`), atrás do botão explícito "Ativar notificações" em `/perfil/notificacoes`, fora do escopo desta etapa.

- [ ] **Step 1: Write the failing test**

```tsx
// src/app/components/personalizacao/SeletorLembrete.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import SeletorLembrete from './SeletorLembrete';

const onSalvar = vi.fn(async (horario: string | null) => {
  void horario;
  return {};
});

beforeEach(() => {
  onSalvar.mockClear();
});

describe('SeletorLembrete', () => {
  it('mostra um input de horário com valor padrão quando não há horário inicial', () => {
    render(<SeletorLembrete horarioInicial={null} onSalvar={onSalvar} />);
    expect(screen.getByLabelText(/horário/i)).toHaveValue('09:00');
  });

  it('parte do horário inicial informado (modo edição)', () => {
    render(<SeletorLembrete horarioInicial="19:30" onSalvar={onSalvar} />);
    expect(screen.getByLabelText(/horário/i)).toHaveValue('19:30');
  });

  it('confirmar com horário chama onSalvar com a string do horário', async () => {
    const aoSalvarComSucesso = vi.fn();
    render(<SeletorLembrete horarioInicial={null} onSalvar={onSalvar} aoSalvarComSucesso={aoSalvarComSucesso} />);

    fireEvent.change(screen.getByLabelText(/horário/i), { target: { value: '08:00' } });
    fireEvent.click(screen.getByRole('button', { name: /^(concluir|salvar)/i }));

    await waitFor(() => {
      expect(onSalvar).toHaveBeenCalledWith('08:00');
      expect(aoSalvarComSucesso).toHaveBeenCalledTimes(1);
    });
  });

  it('"não quero lembretes agora" chama onSalvar com null, nunca com uma string', async () => {
    const aoSalvarComSucesso = vi.fn();
    render(<SeletorLembrete horarioInicial={null} onSalvar={onSalvar} aoSalvarComSucesso={aoSalvarComSucesso} />);

    fireEvent.click(screen.getByRole('button', { name: /não quero lembretes agora/i }));

    await waitFor(() => {
      expect(onSalvar).toHaveBeenCalledWith(null);
      expect(aoSalvarComSucesso).toHaveBeenCalledTimes(1);
    });
  });

  it('nunca referencia a API Notification do navegador', () => {
    const codigoFonte = SeletorLembrete.toString();
    expect(codigoFonte).not.toMatch(/Notification/);
  });

  it('mostra erro retornado por onSalvar sem travar a tela', async () => {
    onSalvar.mockResolvedValueOnce({ erro: 'Não foi possível salvar seu lembrete agora. Tente novamente.' });
    render(<SeletorLembrete horarioInicial={null} onSalvar={onSalvar} />);

    fireEvent.click(screen.getByRole('button', { name: /^(concluir|salvar)/i }));

    await waitFor(() => {
      expect(screen.getByText(/não foi possível salvar seu lembrete agora/i)).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/app/components/personalizacao/SeletorLembrete.test.tsx`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Write the implementation**

```tsx
// src/app/components/personalizacao/SeletorLembrete.tsx
'use client';

import { useState, useTransition } from 'react';
import Botao from '@/app/components/Botao';

export default function SeletorLembrete({
  horarioInicial,
  onSalvar,
  aoSalvarComSucesso,
  rotuloBotao = 'Concluir',
}: {
  horarioInicial: string | null;
  onSalvar: (horario: string | null) => Promise<{ erro?: string }>;
  aoSalvarComSucesso?: () => void;
  rotuloBotao?: string;
}) {
  const [horario, setHorario] = useState(horarioInicial ?? '09:00');
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [salvando, startTransition] = useTransition();

  function confirmar(valor: string | null) {
    setErro(null);
    setSalvo(false);
    startTransition(async () => {
      const resultado = await onSalvar(valor);
      if (resultado?.erro) {
        setErro(resultado.erro);
        return;
      }
      if (aoSalvarComSucesso) {
        aoSalvarComSucesso();
      } else {
        setSalvo(true);
      }
    });
  }

  return (
    <div className="space-y-4">
      <label className="block text-texto">
        Horário preferido para lembretes
        <input
          type="time"
          value={horario}
          onChange={(e) => setHorario(e.target.value)}
          className="mt-1 block w-full rounded-2xl border border-borda bg-superficie p-3 text-texto"
        />
      </label>

      {erro && <p className="text-alerta">{erro}</p>}
      {salvo && (
        <p role="status" className="text-sm text-acao">
          Salvo.
        </p>
      )}

      <div className="flex flex-col gap-3">
        <Botao disabled={salvando} onClick={() => confirmar(horario)}>
          {salvando ? 'Salvando...' : rotuloBotao}
        </Botao>
        <Botao variante="secundaria" disabled={salvando} onClick={() => confirmar(null)}>
          Não quero lembretes agora
        </Botao>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/app/components/personalizacao/SeletorLembrete.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/components/personalizacao/SeletorLembrete.tsx src/app/components/personalizacao/SeletorLembrete.test.tsx
git commit -m "feat(onboarding): componente SeletorLembrete compartilhado, sem pedir permissão de notificação"
```

---

### Task 6: Ligar as 3 novas etapas em `OnboardingClient` e `page.tsx`

**Files:**
- Modify: `src/app/onboarding/page.tsx`
- Modify: `src/app/onboarding/OnboardingClient.tsx`
- Modify: `src/app/onboarding/OnboardingClient.test.tsx`

**Interfaces:**
- Consumes: `salvarObjetivos`, `salvarTemasSensiveis`, `concluirPersonalizacao` de `./actions` (Task 2); `SeletorObjetivos`, `SeletorTemasSensiveis`, `SeletorLembrete` de `@/app/components/personalizacao/*` (Tasks 3-5).
- Produces: `OnboardingClient` ganha o prop `personalizacaoJaConcluida: boolean`; `page.tsx` passa esse prop a partir de `perfis.onboarding_extra_concluido_em`.

- [ ] **Step 1: Write the failing tests**

```tsx
// Adicionar ao final de src/app/onboarding/OnboardingClient.test.tsx (mocks novos + testes novos).
// Ajustar o bloco vi.mock('./actions', ...) existente para incluir as novas actions:
vi.mock('./actions', () => ({
  registrarConsentimento: (nome?: string) => registrarConsentimento(nome),
  confirmarPais: (pais: string) => confirmarPais(pais),
  salvarObjetivos: (selecionados: string[]) => salvarObjetivos(selecionados),
  salvarTemasSensiveis: (selecionados: string[]) => salvarTemasSensiveis(selecionados),
  concluirPersonalizacao: (horario: string | null) => concluirPersonalizacao(horario),
}));

// Junto dos outros vi.fn() já declarados no topo do arquivo:
const salvarObjetivos = vi.fn(async (selecionados: string[]): Promise<{ erro?: string }> => {
  void selecionados;
  return {};
});
const salvarTemasSensiveis = vi.fn(async (selecionados: string[]): Promise<{ erro?: string }> => {
  void selecionados;
  return {};
});
const concluirPersonalizacao = vi.fn(async (horario: string | null): Promise<{ erro?: string }> => {
  void horario;
  return {};
});

// Junto do beforeEach existente:
beforeEach(() => {
  push.mockClear();
  registrarConsentimento.mockClear();
  confirmarPais.mockClear();
  salvarObjetivos.mockClear();
  salvarTemasSensiveis.mockClear();
  concluirPersonalizacao.mockClear();
});

// Novos testes:
describe('OnboardingClient — etapa de personalização (após país)', () => {
  it('após confirmar país com sucesso, avança para a etapa de objetivos em vez de terminar', async () => {
    render(
      <OnboardingClient consentimentoJaRegistrado={true} paisJaConfirmado={false} personalizacaoJaConcluida={false} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Brasil' }));
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    await waitFor(() => {
      expect(screen.getByText(/fortalecer minha autoestima/i)).toBeInTheDocument();
    });
    expect(push).not.toHaveBeenCalled();
  });

  it('percorre objetivos → temas → lembrete e conclui chamando concluirPersonalizacao', async () => {
    render(
      <OnboardingClient consentimentoJaRegistrado={true} paisJaConfirmado={false} personalizacaoJaConcluida={false} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Portugal' }));
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));
    await waitFor(() => expect(screen.getByText(/fortalecer minha autoestima/i)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /^continuar$/i }));
    await waitFor(() => expect(salvarObjetivos).toHaveBeenCalledWith([]));

    await waitFor(() => expect(screen.getByText(/corpo e aparência/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /^continuar$/i }));
    await waitFor(() => expect(salvarTemasSensiveis).toHaveBeenCalledWith([]));

    await waitFor(() => expect(screen.getByLabelText(/horário/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /^(concluir|salvar)/i }));
    await waitFor(() => expect(concluirPersonalizacao).toHaveBeenCalledWith('09:00'));
  });

  it('escolhendo "prefiro decidir depois"/"não quero lembretes agora" em tudo, ainda assim conclui a etapa', async () => {
    render(
      <OnboardingClient consentimentoJaRegistrado={true} paisJaConfirmado={false} personalizacaoJaConcluida={false} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Portugal' }));
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));
    await waitFor(() => expect(screen.getByText(/fortalecer minha autoestima/i)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Prefiro decidir depois' }));
    fireEvent.click(screen.getByRole('button', { name: /^continuar$/i }));
    await waitFor(() => expect(salvarObjetivos).toHaveBeenCalledWith(['decidir_depois']));

    await waitFor(() => expect(screen.getByText(/prefiro não responder/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Prefiro não responder' }));
    fireEvent.click(screen.getByRole('button', { name: /^continuar$/i }));
    await waitFor(() => expect(salvarTemasSensiveis).toHaveBeenCalledWith(['prefiro_nao_responder']));

    await waitFor(() => expect(screen.getByLabelText(/horário/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /não quero lembretes agora/i }));
    await waitFor(() => expect(concluirPersonalizacao).toHaveBeenCalledWith(null));
  });

  it('se a personalização já foi concluída antes, confirmar país manda direto para a home, sem repetir a etapa', async () => {
    render(
      <OnboardingClient consentimentoJaRegistrado={true} paisJaConfirmado={false} personalizacaoJaConcluida={true} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Brasil' }));
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/');
    });
    expect(screen.queryByText(/fortalecer minha autoestima/i)).not.toBeInTheDocument();
  });
});
```

Além disso, os 6 testes já existentes no arquivo precisam do novo prop obrigatório `personalizacaoJaConcluida` em cada `render(<OnboardingClient .../>)` — adicione `personalizacaoJaConcluida={false}` em cada um dos 6 `render(...)` já presentes no arquivo (todas as chamadas existentes de `render(<OnboardingClient consentimentoJaRegistrado={...} paisJaConfirmado={...} />)` passam a incluir o terceiro prop).

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/app/onboarding/OnboardingClient.test.tsx`
Expected: FAIL — TypeScript reclama do prop `personalizacaoJaConcluida` ausente e os testes novos não encontram os textos das novas etapas.

- [ ] **Step 3: Write the implementation**

```tsx
// src/app/onboarding/page.tsx
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import OnboardingClient from './OnboardingClient';

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: perfil } = await supabase
    .from('perfis')
    .select('consentimento_dados_sensiveis_em, pais_confirmado_em, onboarding_extra_concluido_em')
    .eq('id', user.id)
    .single();

  return (
    <OnboardingClient
      consentimentoJaRegistrado={Boolean(perfil?.consentimento_dados_sensiveis_em)}
      paisJaConfirmado={Boolean(perfil?.pais_confirmado_em)}
      personalizacaoJaConcluida={Boolean(perfil?.onboarding_extra_concluido_em)}
    />
  );
}
```

```tsx
// src/app/onboarding/OnboardingClient.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  registrarConsentimento,
  confirmarPais,
  salvarObjetivos,
  salvarTemasSensiveis,
  concluirPersonalizacao,
} from './actions';
import { sair } from '@/app/perfil/actions';
import Botao from '@/app/components/Botao';
import SeletorObjetivos from '@/app/components/personalizacao/SeletorObjetivos';
import SeletorTemasSensiveis from '@/app/components/personalizacao/SeletorTemasSensiveis';
import SeletorLembrete from '@/app/components/personalizacao/SeletorLembrete';
import { PAISES_SUPORTADOS, NOME_PAIS, type PaisSuportado } from '@/lib/perfil/pais';

type Etapa = 'perguntando' | 'confirmada' | 'negada' | 'pais' | 'objetivos' | 'temas' | 'lembrete';

export default function OnboardingClient({
  consentimentoJaRegistrado,
  paisJaConfirmado,
  personalizacaoJaConcluida,
}: {
  consentimentoJaRegistrado: boolean;
  paisJaConfirmado: boolean;
  personalizacaoJaConcluida: boolean;
}) {
  // Se o consentimento já existe (conta que já passou pelo onboarding antes
  // de pais_confirmado_em existir), pula direto para a etapa de país — nunca
  // repete a pergunta de maioridade nem os termos para quem já aceitou.
  const [etapaMaioridade, setEtapaMaioridade] = useState<Etapa>(
    consentimentoJaRegistrado ? 'pais' : 'perguntando'
  );
  const [saindo, startSaida] = useTransition();
  const router = useRouter();

  const [nome, setNome] = useState('');
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [aceitouDadosSensiveis, setAceitouDadosSensiveis] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, startTransition] = useTransition();

  const [paisEscolhido, setPaisEscolhido] = useState<PaisSuportado | null>(null);
  const [erroPais, setErroPais] = useState<string | null>(null);
  const [confirmandoPais, startConfirmacaoPais] = useTransition();

  const podeContinuar = aceitouTermos && aceitouDadosSensiveis;

  function handleContinuar() {
    setErro(null);
    startTransition(async () => {
      const resultado = await registrarConsentimento(nome);
      if (resultado?.erro) {
        setErro(resultado.erro);
        return;
      }
      if (paisJaConfirmado) {
        router.push('/');
      } else {
        setEtapaMaioridade('pais');
      }
    });
  }

  function handleConfirmarPais() {
    if (!paisEscolhido) return;
    setErroPais(null);
    startConfirmacaoPais(async () => {
      const resultado = await confirmarPais(paisEscolhido);
      if (resultado?.erro) {
        setErroPais(resultado.erro);
        return;
      }
      // País deixou de ser a última etapa: quem já concluiu a personalização
      // antes (edge case de revisitar /onboarding manualmente) vai direto
      // para a home; quem não concluiu segue para objetivos → temas →
      // lembrete.
      if (personalizacaoJaConcluida) {
        router.push('/');
      } else {
        setEtapaMaioridade('objetivos');
      }
    });
  }

  if (etapaMaioridade === 'negada') {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="font-display text-2xl text-texto">O Rose é para pessoas adultas</h1>
        <p className="text-texto-suave">
          Este app é destinado exclusivamente a maiores de 18 anos e não foi desenhado para o
          acompanhamento de menores de idade. Não vamos pedir nem guardar mais nenhuma informação sua.
        </p>
        <Botao
          type="button"
          variante="secundaria"
          disabled={saindo}
          onClick={() => startSaida(() => sair())}
        >
          {saindo ? 'Saindo…' : 'Sair'}
        </Botao>
      </main>
    );
  }

  if (etapaMaioridade === 'perguntando') {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
        <h1 className="font-display text-2xl text-texto">Antes de começar</h1>
        <p className="text-texto">
          O Rose é destinado exclusivamente a pessoas adultas. Você tem 18 anos ou mais?
        </p>
        <div className="flex w-full gap-3">
          <Botao type="button" variante="secundaria" onClick={() => setEtapaMaioridade('negada')} className="flex-1">
            Não
          </Botao>
          <Botao type="button" onClick={() => setEtapaMaioridade('confirmada')} className="flex-1">
            Sim, tenho 18+
          </Botao>
        </div>
      </main>
    );
  }

  if (etapaMaioridade === 'pais') {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
        <div className="space-y-2 text-center">
          <h1 className="font-display text-2xl text-texto">De qual país você está acessando?</h1>
          <p className="text-texto-suave">
            Usamos isso só para te mostrar os contatos de apoio corretos (como linhas de emergência)
            caso você precise. Você pode confirmar essa escolha nas configurações depois, mas ela não
            vai ser perguntada de novo automaticamente.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {PAISES_SUPORTADOS.map((pais) => (
            <button
              key={pais}
              type="button"
              onClick={() => setPaisEscolhido(pais)}
              aria-pressed={paisEscolhido === pais}
              className={`rounded-2xl border p-4 text-left font-medium transition-colors ${
                paisEscolhido === pais
                  ? 'border-acao bg-acao/10 text-texto'
                  : 'border-borda bg-superficie text-texto-suave'
              }`}
            >
              {NOME_PAIS[pais]}
            </button>
          ))}
        </div>

        {erroPais && <p className="text-alerta">{erroPais}</p>}

        <Botao disabled={!paisEscolhido || confirmandoPais} onClick={handleConfirmarPais}>
          {confirmandoPais ? 'Confirmando...' : 'Confirmar'}
        </Botao>
      </main>
    );
  }

  if (etapaMaioridade === 'objetivos') {
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

  if (etapaMaioridade === 'temas') {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
        <div className="space-y-2 text-center">
          <h1 className="font-display text-2xl text-texto">Algum desses temas é sensível para você?</h1>
          <p className="text-texto-suave">
            Isso nos ajuda a ter mais cuidado com a linguagem que usamos com você. Também pode ser
            mudado depois.
          </p>
        </div>
        <SeletorTemasSensiveis
          selecaoInicial={[]}
          onSalvar={salvarTemasSensiveis}
          aoSalvarComSucesso={() => setEtapaMaioridade('lembrete')}
        />
      </main>
    );
  }

  if (etapaMaioridade === 'lembrete') {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
        <div className="space-y-2 text-center">
          <h1 className="font-display text-2xl text-texto">Quer um lembrete diário?</h1>
          <p className="text-texto-suave">
            Escolha um horário confortável para o seu ritual. Nada é enviado automaticamente — isso só
            define sua preferência.
          </p>
        </div>
        <SeletorLembrete horarioInicial={null} onSalvar={concluirPersonalizacao} rotuloBotao="Concluir" />
      </main>
    );
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

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/app/onboarding/OnboardingClient.test.tsx`
Expected: PASS (existentes + novos).

- [ ] **Step 5: Commit**

```bash
git add src/app/onboarding/page.tsx src/app/onboarding/OnboardingClient.tsx src/app/onboarding/OnboardingClient.test.tsx
git commit -m "feat(onboarding): liga objetivos/temas/lembrete após país; CompleteRegistration passa a disparar ao final dessas etapas"
```

---

### Task 7: Tela de edição `/perfil/personalizacao`

**Files:**
- Create: `src/app/perfil/personalizacao/page.tsx`
- Create: `src/app/perfil/personalizacao/PersonalizacaoForm.tsx`
- Test: `src/app/perfil/personalizacao/PersonalizacaoForm.test.tsx`

**Interfaces:**
- Consumes: `salvarObjetivos`, `salvarTemasSensiveis` de `@/app/onboarding/actions` (Task 2, reaproveitadas sem duplicação); `SeletorObjetivos`, `SeletorTemasSensiveis`, `SeletorLembrete` (Tasks 3-5); `salvarHorarioPreferido` de `@/app/settings/actions` (já existe, mesmo caminho usado por `NotificacoesForm`) para o lembrete em modo edição (aqui não há `concluirPersonalizacao` porque a etapa já foi concluída — editar não deve reescrever `onboarding_extra_concluido_em`, que marca a *primeira* conclusão).
- Produces: `export default function PersonalizacaoForm({ objetivosIniciais, temasIniciais, horarioInicial }: { objetivosIniciais: string[]; temasIniciais: string[]; horarioInicial: string | null })`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/app/perfil/personalizacao/PersonalizacaoForm.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import PersonalizacaoForm from './PersonalizacaoForm';

const salvarObjetivos = vi.fn(async (selecionados: string[]) => {
  void selecionados;
  return {};
});
const salvarTemasSensiveis = vi.fn(async (selecionados: string[]) => {
  void selecionados;
  return {};
});
const salvarHorarioPreferido = vi.fn(async (horario: string) => {
  void horario;
});

vi.mock('@/app/onboarding/actions', () => ({
  salvarObjetivos: (selecionados: string[]) => salvarObjetivos(selecionados),
  salvarTemasSensiveis: (selecionados: string[]) => salvarTemasSensiveis(selecionados),
}));
vi.mock('@/app/settings/actions', () => ({
  salvarHorarioPreferido: (horario: string) => salvarHorarioPreferido(horario),
}));

beforeEach(() => {
  salvarObjetivos.mockClear();
  salvarTemasSensiveis.mockClear();
  salvarHorarioPreferido.mockClear();
});

describe('PersonalizacaoForm', () => {
  it('mostra as três seções, cada uma partindo dos valores já salvos', () => {
    render(
      <PersonalizacaoForm
        objetivosIniciais={['praticar_autocompaixao']}
        temasIniciais={['corpo_aparencia']}
        horarioInicial="18:00"
      />
    );

    expect(screen.getByRole('button', { name: 'Praticar autocompaixão' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Corpo e aparência' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText(/horário/i)).toHaveValue('18:00');
  });

  it('salvar objetivos chama salvarObjetivos (sem concluirPersonalizacao)', async () => {
    render(<PersonalizacaoForm objetivosIniciais={[]} temasIniciais={[]} horarioInicial={null} />);

    fireEvent.click(screen.getByRole('button', { name: 'Criar um ritual diário de cuidado' }));
    fireEvent.click(screen.getAllByRole('button', { name: /^salvar$/i })[0]);

    await waitFor(() => {
      expect(salvarObjetivos).toHaveBeenCalledWith(['criar_ritual_diario']);
    });
  });

  it('salvar lembrete usa salvarHorarioPreferido, não concluirPersonalizacao', async () => {
    render(<PersonalizacaoForm objetivosIniciais={[]} temasIniciais={[]} horarioInicial={null} />);

    fireEvent.change(screen.getByLabelText(/horário/i), { target: { value: '07:15' } });
    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i, hidden: true }));

    await waitFor(() => {
      expect(salvarHorarioPreferido).toHaveBeenCalledWith('07:15');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/app/perfil/personalizacao/PersonalizacaoForm.test.tsx`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Write the implementation**

```tsx
// src/app/perfil/personalizacao/PersonalizacaoForm.tsx
'use client';

import SeletorObjetivos from '@/app/components/personalizacao/SeletorObjetivos';
import SeletorTemasSensiveis from '@/app/components/personalizacao/SeletorTemasSensiveis';
import SeletorLembrete from '@/app/components/personalizacao/SeletorLembrete';
import { salvarObjetivos, salvarTemasSensiveis } from '@/app/onboarding/actions';
import { salvarHorarioPreferido } from '@/app/settings/actions';
import type { ObjetivoId, TemaSensivelId } from '@/lib/perfil/personalizacao';

// Edição posterior (design seção 2, último item): reaproveita os mesmos
// componentes/validação/server actions do onboarding — nunca uma segunda
// implementação da mesma lógica. Diferença central em relação ao wizard: o
// lembrete aqui grava direto em horario_preferido_notificacao (mesma action
// que /perfil/notificacoes já usa) em vez de concluirPersonalizacao, porque
// editar não deve reescrever onboarding_extra_concluido_em — esse timestamp
// marca a primeira vez que a etapa foi respondida, não a última edição.
export default function PersonalizacaoForm({
  objetivosIniciais,
  temasIniciais,
  horarioInicial,
}: {
  objetivosIniciais: string[];
  temasIniciais: string[];
  horarioInicial: string | null;
}) {
  async function salvarLembreteComoEdicao(horario: string | null): Promise<{ erro?: string }> {
    if (horario === null) {
      return {};
    }
    await salvarHorarioPreferido(horario);
    return {};
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-display text-lg text-texto">Seus objetivos</h2>
        <SeletorObjetivos
          selecaoInicial={objetivosIniciais as ObjetivoId[]}
          onSalvar={salvarObjetivos}
          rotuloBotao="Salvar"
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg text-texto">Temas sensíveis</h2>
        <SeletorTemasSensiveis
          selecaoInicial={temasIniciais as TemaSensivelId[]}
          onSalvar={salvarTemasSensiveis}
          rotuloBotao="Salvar"
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg text-texto">Lembrete diário</h2>
        <SeletorLembrete
          horarioInicial={horarioInicial}
          onSalvar={salvarLembreteComoEdicao}
          rotuloBotao="Salvar"
        />
      </section>
    </div>
  );
}
```

```tsx
// src/app/perfil/personalizacao/page.tsx
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import CabecalhoSubpagina from '@/app/components/perfil/CabecalhoSubpagina';
import PersonalizacaoForm from './PersonalizacaoForm';

export default async function PersonalizacaoPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: perfil } = await supabase
    .from('perfis')
    .select('objetivos, temas_sensiveis, horario_preferido_notificacao')
    .eq('id', user.id)
    .single();

  return (
    <main className="mx-auto max-w-md space-y-6 px-4 pt-6 pb-24 md:pb-8">
      <CabecalhoSubpagina
        titulo="Personalize sua experiência"
        subtitulo="Você pode mudar essas respostas quando quiser"
      />
      <PersonalizacaoForm
        objetivosIniciais={perfil?.objetivos ?? []}
        temasIniciais={perfil?.temas_sensiveis ?? []}
        horarioInicial={perfil?.horario_preferido_notificacao ?? null}
      />
      <NavegacaoInferior />
    </main>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/app/perfil/personalizacao/PersonalizacaoForm.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/perfil/personalizacao/page.tsx src/app/perfil/personalizacao/PersonalizacaoForm.tsx src/app/perfil/personalizacao/PersonalizacaoForm.test.tsx
git commit -m "feat(perfil): tela de edição de objetivos/temas/lembrete reaproveitando os seletores do onboarding"
```

---

### Task 8: Banner dispensável em `/perfil` + item de menu

**Files:**
- Create: `src/app/components/personalizacao/BannerPersonalizacao.tsx`
- Test: `src/app/components/personalizacao/BannerPersonalizacao.test.tsx`
- Modify: `src/app/perfil/page.tsx`

**Interfaces:**
- Consumes: `dispensarPersonalizacao` de `@/app/onboarding/actions` (Task 2).
- Produces: `export default function BannerPersonalizacao({ aoDispensar }: { aoDispensar: () => void })` — componente puramente de apresentação/interação; a decisão de *renderizar ou não* o banner (baseada nos dois timestamps nulos) fica no server component `/perfil/page.tsx`, não dentro do banner.

- [ ] **Step 1: Write the failing test**

```tsx
// src/app/components/personalizacao/BannerPersonalizacao.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import BannerPersonalizacao from './BannerPersonalizacao';

const dispensarPersonalizacao = vi.fn(async () => ({}));
vi.mock('@/app/onboarding/actions', () => ({
  dispensarPersonalizacao: () => dispensarPersonalizacao(),
}));

beforeEach(() => {
  dispensarPersonalizacao.mockClear();
});

describe('BannerPersonalizacao', () => {
  it('mostra o convite e um link para /perfil/personalizacao', () => {
    render(<BannerPersonalizacao aoDispensar={() => {}} />);
    expect(screen.getByText(/personalize sua experiência/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /personalizar agora/i })).toHaveAttribute(
      'href',
      '/perfil/personalizacao'
    );
  });

  it('dispensar chama dispensarPersonalizacao e depois aoDispensar', async () => {
    const aoDispensar = vi.fn();
    render(<BannerPersonalizacao aoDispensar={aoDispensar} />);

    fireEvent.click(screen.getByRole('button', { name: /agora não/i }));

    await waitFor(() => {
      expect(dispensarPersonalizacao).toHaveBeenCalledTimes(1);
      expect(aoDispensar).toHaveBeenCalledTimes(1);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/app/components/personalizacao/BannerPersonalizacao.test.tsx`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Write the implementation**

```tsx
// src/app/components/personalizacao/BannerPersonalizacao.tsx
'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { dispensarPersonalizacao } from '@/app/onboarding/actions';

export default function BannerPersonalizacao({ aoDispensar }: { aoDispensar: () => void }) {
  const [dispensando, startTransition] = useTransition();

  function handleDispensar() {
    startTransition(async () => {
      await dispensarPersonalizacao();
      aoDispensar();
    });
  }

  return (
    <div className="rounded-2xl border border-borda bg-superficie p-4 space-y-3">
      <p className="text-sm text-texto">
        <span className="font-medium">Personalize sua experiência.</span> Conte seus objetivos e temas
        sensíveis para deixar seu ritual diário mais seu.
      </p>
      <div className="flex gap-3">
        <Link
          href="/perfil/personalizacao"
          className="flex-1 rounded-2xl bg-acao p-3 text-center text-sm font-medium text-white transition-colors hover:bg-acao/90"
        >
          Personalizar agora
        </Link>
        <button
          type="button"
          onClick={handleDispensar}
          disabled={dispensando}
          className="flex-1 rounded-2xl border border-borda p-3 text-center text-sm font-medium text-texto-suave transition-colors hover:bg-fundo disabled:opacity-40"
        >
          {dispensando ? 'Dispensando...' : 'Agora não'}
        </button>
      </div>
    </div>
  );
}
```

```tsx
// src/app/perfil/page.tsx
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import Botao from '@/app/components/Botao';
import CabecalhoPerfil from '@/app/components/perfil/CabecalhoPerfil';
import CartaoMenuPerfil from '@/app/components/perfil/CartaoMenuPerfil';
import BannerPersonalizacaoPerfil from './BannerPersonalizacaoPerfil';
import IconePreferencias from '@/app/components/perfil/icones/IconePreferencias';
import IconeNotificacoes from '@/app/components/perfil/icones/IconeNotificacoes';
import IconeAssinatura from '@/app/components/perfil/icones/IconeAssinatura';
import IconePrivacidade from '@/app/components/perfil/icones/IconePrivacidade';
import IconeConfiguracoes from '@/app/components/perfil/icones/IconeConfiguracoes';
import IconeClubeRose from '@/app/components/perfil/icones/IconeClubeRose';
import IconeAjuda from '@/app/components/perfil/icones/IconeAjuda';
import { sair } from './actions';

const ITENS_MENU = [
  { href: '/clube-rose', rotulo: 'Clube Rose e recompensas', Icone: IconeClubeRose },
  { href: '/perfil/personalizacao', rotulo: 'Personalizar experiência', Icone: IconePreferencias },
  { href: '/perfil/preferencias', rotulo: 'Preferências', Icone: IconePreferencias },
  { href: '/perfil/notificacoes', rotulo: 'Notificações', Icone: IconeNotificacoes },
  { href: '/perfil/assinatura', rotulo: 'Minha assinatura', Icone: IconeAssinatura },
  { href: '/perfil/privacidade', rotulo: 'Privacidade', Icone: IconePrivacidade },
  { href: '/perfil/configuracoes', rotulo: 'Configurações', Icone: IconeConfiguracoes },
  { href: '/perfil/ajuda', rotulo: 'Ajuda e suporte', Icone: IconeAjuda },
] as const;

export default async function PerfilPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: perfil, error: erroPerfil } = await supabase
    .from('perfis')
    .select(
      'nome, frase_pessoal, foto_url, onboarding_extra_concluido_em, onboarding_extra_dispensado_em'
    )
    .eq('id', user.id)
    .single();

  const mostrarBannerPersonalizacao =
    !perfil?.onboarding_extra_concluido_em && !perfil?.onboarding_extra_dispensado_em;

  return (
    <main className="mx-auto max-w-md pb-[calc(6rem_+_env(safe-area-inset-bottom))] md:pb-8">
      <CabecalhoPerfil
        nome={perfil?.nome ?? null}
        frase={perfil?.frase_pessoal ?? null}
        fotoUrl={perfil?.foto_url ?? null}
      />

      <div className="space-y-6 px-4 pt-6">
        {erroPerfil && (
          <div className="rounded-2xl border border-borda bg-superficie p-4 text-sm text-texto-suave">
            Não foi possível carregar todos os dados do seu perfil agora. Algumas informações podem
            aparecer incompletas.
          </div>
        )}

        {mostrarBannerPersonalizacao && <BannerPersonalizacaoPerfil />}

        <nav aria-label="Menu do perfil" className="space-y-3">
          {ITENS_MENU.map((item) => (
            <CartaoMenuPerfil key={item.href} {...item} />
          ))}
        </nav>

        <form action={sair}>
          <Botao type="submit" variante="secundaria">
            Sair da conta
          </Botao>
        </form>
      </div>

      <NavegacaoInferior />
    </main>
  );
}
```

`/perfil/page.tsx` é um server component — `BannerPersonalizacao` precisa de estado local (esconder após dispensar) e por isso é envolvido por um pequeno client component dedicado, para não forçar `page.tsx` inteiro a virar `'use client'`:

```tsx
// src/app/perfil/BannerPersonalizacaoPerfil.tsx
'use client';

import { useState } from 'react';
import BannerPersonalizacao from '@/app/components/personalizacao/BannerPersonalizacao';

export default function BannerPersonalizacaoPerfil() {
  const [dispensado, setDispensado] = useState(false);
  if (dispensado) return null;
  return <BannerPersonalizacao aoDispensar={() => setDispensado(true)} />;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/app/components/personalizacao/BannerPersonalizacao.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/components/personalizacao/BannerPersonalizacao.tsx src/app/components/personalizacao/BannerPersonalizacao.test.tsx src/app/perfil/page.tsx src/app/perfil/BannerPersonalizacaoPerfil.tsx
git commit -m "feat(perfil): banner dispensável de personalização + item de menu para editar depois"
```

---

## Verificação final (rodar antes de abrir o PR)

```bash
pnpm vitest run
pnpm typecheck
pnpm lint
pnpm build
```

Todos os 4 devem passar limpos antes de considerar esta feature pronta.

---

## Self-review

**1. Cobertura da Seção 2 do design:**

- Preservar etapas atuais sem alteração de comportamento → Task 6 mantém `perguntando`/`confirmada`/`negada`/`pais` intactas, só adiciona etapas depois.
- Novo passo objetivos → temas → lembrete após `pais`, só para quem não tem `onboarding_extra_concluido_em` → Task 6 (`personalizacaoJaConcluida`).
- `confirmarPais()` para de redirecionar; avança para a nova etapa → Task 2 + Task 6.
- `CompleteRegistration` dispara só ao final da nova etapa, mesmo escolhendo tudo "decidir depois"/"prefiro não responder" → Task 2 (`concluirPersonalizacao` sempre redireciona para `/?cadastro=concluido`, alcançado em qualquer combinação de respostas) + teste dedicado em Task 6.
- 7 opções de objetivos / 6 de temas sensíveis, sentinelas nunca gravados → Task 1.
- Lembrete reaproveita `preferencias_notificacoes`/`horario_preferido_notificacao`, "não quero lembretes agora" não grava preferência ativa, nunca chama `Notification.requestPermission()` → Task 5 (teste explícito de ausência de `Notification` no código-fonte do componente).
- Server action de validação/gravação contra listas fechadas via admin client, permitindo alterar depois → Task 2 (`salvarObjetivos`/`salvarTemasSensiveis`) + Task 7 (reaproveitadas na edição).
- Banner dispensável em `/perfil`, visível só com os dois timestamps nulos, dispensar grava só `onboarding_extra_dispensado_em` → Task 8.
- Edição posterior em Perfil reaproveitando os mesmos componentes/validação/server action → Task 7 (importa `salvarObjetivos`/`salvarTemasSensiveis` de `@/app/onboarding/actions`, mesmos `Seletor*` de `@/app/components/personalizacao`).

**2. Scan de placeholders:** nenhum "TBD"/"implementar depois"/"similar à Task N" — todo código de cada step é mostrado por extenso, inclusive os dois testes existentes que precisaram ser reescritos em `actions.test.ts` (mostrados na íntegra, não como diff resumido).

**3. Consistência de nomes entre tasks:**
- `ObjetivoId`/`TemaSensivelId`/`OBJETIVO_SENTINELA`/`TEMA_SENSIVEL_SENTINELA_SKIP`/`TEMA_SENSIVEL_EXCLUSIVOS` (Task 1) usados com a mesma grafia em Tasks 2-4.
- `salvarObjetivos`/`salvarTemasSensiveis`/`concluirPersonalizacao`/`dispensarPersonalizacao` (Task 2) usados com a mesma assinatura em Tasks 6-8.
- `aoSalvarComSucesso`/`rotuloBotao`/`selecaoInicial`/`horarioInicial` mantidos idênticos entre os 3 componentes `Seletor*` (Tasks 3-5) e seus dois consumidores (`OnboardingClient` na Task 6, `PersonalizacaoForm` na Task 7).
- `personalizacaoJaConcluida` é o nome do prop tanto em `page.tsx` quanto em `OnboardingClient.tsx` (Task 6).

---
