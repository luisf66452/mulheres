# Espaço "Preciso de ajuda agora" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evoluir `/seguranca` (Seção 7 do design `docs/superpowers/specs/2026-08-24-evolucao-rose-design.md`) para funcionar mesmo sem sessão autenticada, exibir só contatos com fonte oficial verificada, e ganhar pontos de entrada visíveis em Home, check-in e Perfil via um componente reaproveitável.

**Architecture:** `/seguranca` continua sendo a única rota (server component). Ela resolve o país por prioridade — perfil confirmado da conta, senão seleção manual via querystring `?pais=PT|BR` escolhida por um client component (`SeletorPaisSeguranca`) — e busca `recursos_seguranca` filtrando por `fonte`/`verificado_em` preenchidos. Um bloco de orientação fixo (texto + número de emergência local + link `tel:`) nunca depende dessa consulta: os números vêm de um mapa hardcoded em `src/lib/perfil/emergenciaLocal.ts`, garantindo resiliência mesmo se a tabela estiver vazia ou a query falhar. `src/proxy.ts` passa a tratar `/seguranca` como rota pública (sem gate de login nem de onboarding). Um novo componente `AvisoSeguranca` — wrapper fino sobre o `CardAtencaoSeguranca` já existente, variante `destacado={false}` — vira o ponto de entrada reaproveitado em Home, Perfil e check-in, sem duplicar `detectarSinalDeAtencao`.

**Tech Stack:** Next.js (App Router, server components + 1 client component), Supabase (Postgres + PostgREST + RLS), TypeScript, Vitest + Testing Library.

## Global Constraints

- A Rose não é terapia, não diagnostica, não substitui acompanhamento profissional (regra transversal do design).
- Nenhuma análise nova de texto livre: a heurística `detectarSinalDeAtencao` e a rota estruturada `sinal_seguranca` permanecem exatamente como estão — este plano não as toca.
- `/seguranca` funciona sempre gratuito e sem exigir login (tabela "Planos e acesso" do design).
- Um recurso de `recursos_seguranca` só é exibido como confirmado quando `fonte` **e** `verificado_em` estiverem preenchidos (Seção 1 do design).
- Links de discagem são sempre `<a href="tel:...">` — toque para ligar, nunca chamada automática.
- Migrations novas: `supabase migration new <nome>` (nunca nome manual), idempotentes (`if not exists` / `drop policy if exists`), `notify pgrst, 'reload schema';` ao final.
- RLS: nunca usar `auth.role()` em policy nova; nunca `SECURITY DEFINER` para contornar RLS.
- Nunca inventar `fonte`/número de telefone sem confirmação em fonte oficial (governo/saúde) — se um contato do seed atual não puder ser confirmado, ele fica documentado como pendência, não como confirmado.
- Mobile-first, acolhedor, sem cores/mensagens punitivas; vocabulário nunca usa "bom"/"ruim"/"normal"/"anormal" nem faz diagnóstico.
- Preservar PWA, Web Push, jornadas, sessões, progresso, check-in existentes — nenhuma mudança fora do escopo da Seção 7.

---

## Pesquisa de fontes oficiais (feita nesta fase de planejamento)

Pesquisa via WebSearch por fontes oficiais de governo/saúde de Portugal e Brasil para as linhas de apoio já cadastradas em `supabase/seed_recursos_seguranca_pt.sql` e `supabase/seed.sql`. Todas as 6 linhas com número de telefone específico puderam ser confirmadas — nenhuma pendência de contato ficou em aberto.

| País | Recurso (linha no seed) | Fonte oficial confirmada | URL | `verificado_em` |
|---|---|---|---|---|
| PT | Linha Nacional de Prevenção do Suicídio (1411) | SNS24 — Linha nacional de prevenção do suicídio | https://www.sns24.gov.pt/servico/linha-nacional-de-prevencao-do-suicidio/ | 2026-08-24 |
| PT | SNS 24 — aconselhamento de saúde e psicológico (808 24 24 24) | Portal gov.pt — Contactos de emergência em Portugal | https://www.gov.pt/guias/contactos-de-emergencia-em-portugal | 2026-08-24 |
| PT | Apoio a crianças e adolescentes (116 111) | Portal gov.pt — Contactos de emergência em Portugal | https://www.gov.pt/guias/contactos-de-emergencia-em-portugal | 2026-08-24 |
| PT | Em caso de risco imediato (112) | Portal gov.pt — Contactos de emergência em Portugal | https://www.gov.pt/guias/contactos-de-emergencia-em-portugal | 2026-08-24 |
| BR | Apoio emocional gratuito — CVV (188) | CVV — Centro de Valorização da Vida (operador oficial do serviço, em convênio com o Ministério da Saúde desde 2015) | https://cvv.org.br/ligue-188/ | 2026-08-24 |
| BR | Em caso de risco imediato — SAMU (192) | Ministério da Saúde — SAMU 192 | https://www.gov.br/saude/pt-br/composicao/saes/samu-192 | 2026-08-24 |

Observação sobre a fonte do CVV: `cvv.org.br` não é um domínio `.gov`, mas é o site oficial da própria entidade que opera a linha 188 — mesmo padrão de fonte já aceito para o mesmo contato em `docs/EVIDENCE.md` (linha 42), que já documentava esse número antes desta branch. Não existe alternativa em domínio `.gov.br` que substitua a página oficial do operador do serviço.

**Sem pendência:** as duas linhas "introdutórias" de cada país (`'Não está sozinha'` em PT e `'Você não está sozinha'` em BR) não fazem nenhuma alegação factual verificável (não citam número, serviço ou horário) — são texto de acolhimento. Este plano as substitui pelo bloco de orientação fixo do componente (ver Task 5) em vez de tentar arranjar uma "fonte" artificial para uma frase de acolhimento. Elas continuam existindo na tabela sem `fonte`/`verificado_em` (não são apagadas — só deixam de aparecer na consulta filtrada, conforme a Seção 1 do design manda para contatos não confirmados).

---

## File Structure

```
supabase/migrations/20260824150000_recursos_seguranca_fonte_verificado.sql   [novo] coluna fonte/verificado_em, RLS pública, backfill
supabase/seed_recursos_seguranca_pt.sql                                      [modificado] fonte/verificado_em nos inserts PT
supabase/seed.sql                                                            [modificado] fonte/verificado_em nos inserts BR
docs/EVIDENCE.md                                                             [modificado] registra a reverificação de fontes (Seção 7)
src/lib/supabase/types.ts                                                    [modificado] RecursoSeguranca ganha fonte/verificado_em
src/lib/perfil/emergenciaLocal.ts                                            [novo] números de emergência fixos por país (não vêm do banco)
src/lib/perfil/emergenciaLocal.test.ts                                       [novo]
src/app/components/seguranca/SeletorPaisSeguranca.tsx                        [novo] client component — seleção manual de país
src/app/components/seguranca/SeletorPaisSeguranca.test.tsx                   [novo]
src/app/components/seguranca/AvisoSeguranca.tsx                              [novo] wrapper de CardAtencaoSeguranca — ponto de entrada compacto
src/app/components/seguranca/AvisoSeguranca.test.tsx                         [novo]
src/app/seguranca/page.tsx                                                   [modificado] funciona sem sessão, filtra recursos confirmados, bloco fixo
src/app/seguranca/page.test.tsx                                              [novo]
src/proxy.ts                                                                 [modificado] /seguranca em ROTAS_PUBLICAS
src/proxy.test.ts                                                            [modificado] novo teste
src/app/page.tsx                                                             [modificado] AvisoSeguranca na Home
src/app/perfil/page.tsx                                                      [modificado] AvisoSeguranca em Perfil
src/app/checkin/page.tsx                                                     [modificado] AvisoSeguranca no fluxo de check-in
```

---

### Task 1: Migration — `fonte`/`verificado_em`, leitura pública, backfill dos contatos confirmados

**Files:**
- Create: `supabase/migrations/20260824150000_recursos_seguranca_fonte_verificado.sql`
- Modify: `src/lib/supabase/types.ts:134-140`

**Interfaces:**
- Produces: coluna `recursos_seguranca.fonte text`, `recursos_seguranca.verificado_em date`; tipo `RecursoSeguranca` com os dois campos (`string | null`) — consumido pela Task 5 (`page.tsx`).

- [ ] **Step 1: Criar o arquivo de migration via CLI**

Run: `supabase migration new recursos_seguranca_fonte_verificado`

Isso gera um arquivo em `supabase/migrations/<timestamp>_recursos_seguranca_fonte_verificado.sql`. Use esse arquivo gerado (renomeie o caminho nos passos seguintes se o timestamp gerado for diferente de `20260824150000`).

- [ ] **Step 2: Escrever o conteúdo completo da migration**

```sql
-- 20260824150000_recursos_seguranca_fonte_verificado.sql
-- Seção 7 do design de evolução da Rose (2026-08-24-evolucao-rose-design.md):
-- o espaço "Preciso de ajuda agora" (/seguranca) passa a funcionar mesmo sem
-- sessão autenticada, e só exibe como "confirmado" um contato que tenha
-- fonte oficial verificada (fonte + verificado_em preenchidos).

alter table public.recursos_seguranca
  add column if not exists fonte text,
  add column if not exists verificado_em date;

-- recursos_seguranca é um catálogo de texto informativo público (nome de
-- linha de apoio, número, descrição) sem nenhuma coluna ligada a uma
-- usuária específica — nunca teve dado pessoal por trás do RLS. Antes desta
-- migration, a policy só liberava leitura para o papel `authenticated`, o
-- que forçava login para ver o espaço de segurança. Isso conflita
-- diretamente com o requisito da Seção 7 ("nunca depende de login para
-- exibir ajuda emergencial"): quando não há sessão, o cliente Supabase do
-- servidor (src/lib/supabase/server.ts) executa como o papel `anon`, então
-- a leitura precisa ficar aberta também para `anon`. Esta é uma exceção
-- deliberada e estreita à convenção geral de "nunca GRANT a anon" — ela
-- vale para tabelas com dados de usuária; aqui não há.
drop policy if exists "qualquer usuaria autenticada le recursos de seguranca" on public.recursos_seguranca;
drop policy if exists "leitura publica de recursos de seguranca" on public.recursos_seguranca;

create policy "leitura publica de recursos de seguranca"
  on public.recursos_seguranca for select
  using (true);

grant select on public.recursos_seguranca to anon;

-- Backfill dos contatos já confirmados em fontes oficiais (pesquisa
-- registrada em docs/superpowers/plans/2026-08-24-espaco-seguranca.md e em
-- docs/EVIDENCE.md). Update por pais+titulo é idempotente: rodar de novo só
-- reescreve os mesmos valores. As linhas introdutórias ("Não está
-- sozinha"/"Você não está sozinha") não fazem alegação factual verificável
-- e ficam de fora de propósito — continuam na tabela, só não aparecem na
-- consulta filtrada por fonte/verificado_em (ver src/app/seguranca/page.tsx).
update public.recursos_seguranca set
  fonte = 'SNS24 — Linha Nacional de Prevenção do Suicídio (https://www.sns24.gov.pt/servico/linha-nacional-de-prevencao-do-suicidio/)',
  verificado_em = '2026-08-24'
where pais = 'PT' and titulo = 'Linha Nacional de Prevenção do Suicídio';

update public.recursos_seguranca set
  fonte = 'Portal gov.pt — Contactos de emergência em Portugal (https://www.gov.pt/guias/contactos-de-emergencia-em-portugal)',
  verificado_em = '2026-08-24'
where pais = 'PT' and titulo = 'SNS 24 — aconselhamento de saúde e psicológico';

update public.recursos_seguranca set
  fonte = 'Portal gov.pt — Contactos de emergência em Portugal (https://www.gov.pt/guias/contactos-de-emergencia-em-portugal)',
  verificado_em = '2026-08-24'
where pais = 'PT' and titulo = 'Apoio a crianças e adolescentes';

update public.recursos_seguranca set
  fonte = 'Portal gov.pt — Contactos de emergência em Portugal (https://www.gov.pt/guias/contactos-de-emergencia-em-portugal)',
  verificado_em = '2026-08-24'
where pais = 'PT' and titulo = 'Em caso de risco imediato';

update public.recursos_seguranca set
  fonte = 'CVV — Centro de Valorização da Vida (https://cvv.org.br/ligue-188/)',
  verificado_em = '2026-08-24'
where pais = 'BR' and titulo = 'Apoio emocional gratuito';

update public.recursos_seguranca set
  fonte = 'Ministério da Saúde — SAMU 192 (https://www.gov.br/saude/pt-br/composicao/saes/samu-192)',
  verificado_em = '2026-08-24'
where pais = 'BR' and titulo = 'Em caso de risco imediato';

notify pgrst, 'reload schema';
```

- [ ] **Step 3: Atualizar o tipo TypeScript `RecursoSeguranca`**

Em `src/lib/supabase/types.ts`, localizar (linhas 134-140):

```ts
export type RecursoSeguranca = {
  id: string;
  pais: string;
  titulo: string;
  corpo: string;
  ordem: number;
};
```

Substituir por:

```ts
export type RecursoSeguranca = {
  id: string;
  pais: string;
  titulo: string;
  corpo: string;
  ordem: number;
  fonte: string | null;
  verificado_em: string | null;
};
```

- [ ] **Step 4: Aplicar localmente e verificar**

Run: `supabase db reset` (ou `supabase migration up`, conforme o fluxo local do projeto)

Verifique com uma consulta rápida que as 6 linhas confirmadas têm `fonte`/`verificado_em` preenchidos e que as 2 linhas introdutórias continuam `null`:

```sql
select pais, titulo, fonte, verificado_em from public.recursos_seguranca order by pais, ordem;
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros novos relacionados a `RecursoSeguranca`.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260824150000_recursos_seguranca_fonte_verificado.sql src/lib/supabase/types.ts
git commit -m "feat(seguranca): coluna fonte/verificado_em, leitura publica e backfill de contatos confirmados"
```

---

### Task 2: Atualizar os seeds de desenvolvimento com `fonte`/`verificado_em`

**Files:**
- Modify: `supabase/seed_recursos_seguranca_pt.sql`
- Modify: `supabase/seed.sql:32-38`
- Modify: `docs/EVIDENCE.md:38-47`

**Interfaces:**
- Consumes: nenhuma (dados estáticos).
- Produces: seeds locais consistentes com o backfill de produção da Task 1 (mesmos valores de `fonte`/`verificado_em`), para que `supabase db reset` local já reflita o comportamento final.

- [ ] **Step 1: Reescrever `supabase/seed_recursos_seguranca_pt.sql`**

```sql
-- Recursos de segurança para Portugal (público inicial de testes da Rose).
-- Números conferidos em fontes oficiais antes de usar:
--   - Linha Nacional de Prevenção do Suicídio (1411): SNS24
--     https://www.sns24.gov.pt/servico/linha-nacional-de-prevencao-do-suicidio/
--   - Emergência (112), SNS 24 (808 24 24 24), Linha de Apoio à Criança (116 111):
--     https://www.gov.pt/guias/contactos-de-emergencia-em-portugal
--
-- `fonte`/`verificado_em` seguem os mesmos valores do backfill de produção
-- em supabase/migrations/20260824150000_recursos_seguranca_fonte_verificado.sql
-- — só recursos com os dois preenchidos aparecem em /seguranca (Seção 7 do
-- design de evolução da Rose). A linha introdutória ("Não está sozinha")
-- fica sem fonte de propósito: não é um contato verificável, e o texto de
-- acolhimento equivalente agora vem do bloco fixo do componente da página.
--
-- Mesmo padrão de supabase/seed.sql: linhas com `pais = 'BR'` continuam
-- existindo e não são alteradas por este arquivo — cada país tem seu próprio
-- conjunto de recursos, nunca misturados numa mesma apresentação.
insert into public.recursos_seguranca (pais, titulo, corpo, ordem, fonte, verificado_em) values
  ('PT', 'Não está sozinha',
   'O que você está sentindo importa. Isso não é uma emergência, mas merece atenção e cuidado.', 0,
   null, null),
  ('PT', 'Linha Nacional de Prevenção do Suicídio',
   'A Linha 1411 oferece apoio telefónico gratuito e confidencial, 24 horas por dia, para pensamentos suicidas ou comportamentos autolesivos, em articulação com o SNS 24. Ligue 1411.', 1,
   'SNS24 — Linha Nacional de Prevenção do Suicídio (https://www.sns24.gov.pt/servico/linha-nacional-de-prevencao-do-suicidio/)', '2026-08-24'),
  ('PT', 'SNS 24 — aconselhamento de saúde e psicológico',
   'O SNS 24 (808 24 24 24) presta aconselhamento clínico, incluindo apoio psicológico, 24 horas por dia. Não é um serviço de emergência, mas está disponível para conversar a qualquer hora.', 2,
   'Portal gov.pt — Contactos de emergência em Portugal (https://www.gov.pt/guias/contactos-de-emergencia-em-portugal)', '2026-08-24'),
  ('PT', 'Apoio a crianças e adolescentes',
   'A Linha de Apoio à Criança (116 111) é um serviço gratuito e permanente para crianças e adolescentes falarem sobre o que os preocupa.', 3,
   'Portal gov.pt — Contactos de emergência em Portugal (https://www.gov.pt/guias/contactos-de-emergencia-em-portugal)', '2026-08-24'),
  ('PT', 'Em caso de risco imediato',
   'Se você ou alguém perto de você está em risco imediato, ligue 112 (número europeu de emergência) ou procure o serviço de urgência mais próximo.', 4,
   'Portal gov.pt — Contactos de emergência em Portugal (https://www.gov.pt/guias/contactos-de-emergencia-em-portugal)', '2026-08-24');
```

- [ ] **Step 2: Reescrever o bloco de `recursos_seguranca` (BR) em `supabase/seed.sql`**

Localizar (linhas 32-38):

```sql
insert into public.recursos_seguranca (pais, titulo, corpo, ordem) values
  ('BR', 'Você não está sozinha',
   'O que você está sentindo importa. Isso não é uma emergência, mas merece atenção e cuidado.', 0),
  ('BR', 'Apoio emocional gratuito',
   'O CVV (Centro de Valorização da Vida) oferece apoio emocional gratuito e sigiloso, 24h por dia, pelo telefone 188, ou pelo chat em cvv.org.br. Não é um serviço de emergência — é alguém disposto a te ouvir.', 1),
  ('BR', 'Em caso de risco imediato',
   'Se você ou alguém perto de você está em risco imediato, procure o SAMU (192), uma UPA, um pronto-socorro ou hospital mais próximo.', 2);
```

Substituir por:

```sql
-- `fonte`/`verificado_em` seguem os mesmos valores do backfill de produção
-- em supabase/migrations/20260824150000_recursos_seguranca_fonte_verificado.sql
-- — só recursos com os dois preenchidos aparecem em /seguranca (Seção 7 do
-- design de evolução da Rose). A linha introdutória ("Você não está
-- sozinha") fica sem fonte de propósito: não é um contato verificável.
insert into public.recursos_seguranca (pais, titulo, corpo, ordem, fonte, verificado_em) values
  ('BR', 'Você não está sozinha',
   'O que você está sentindo importa. Isso não é uma emergência, mas merece atenção e cuidado.', 0,
   null, null),
  ('BR', 'Apoio emocional gratuito',
   'O CVV (Centro de Valorização da Vida) oferece apoio emocional gratuito e sigiloso, 24h por dia, pelo telefone 188, ou pelo chat em cvv.org.br. Não é um serviço de emergência — é alguém disposto a te ouvir.', 1,
   'CVV — Centro de Valorização da Vida (https://cvv.org.br/ligue-188/)', '2026-08-24'),
  ('BR', 'Em caso de risco imediato',
   'Se você ou alguém perto de você está em risco imediato, procure o SAMU (192), uma UPA, um pronto-socorro ou hospital mais próximo.', 2,
   'Ministério da Saúde — SAMU 192 (https://www.gov.br/saude/pt-br/composicao/saes/samu-192)', '2026-08-24');
```

- [ ] **Step 3: Registrar a reverificação em `docs/EVIDENCE.md`**

Localizar a seção `### Recursos por país (recursos_seguranca)` (linhas 38-47) e acrescentar, ao final dela:

```markdown
**Reverificação de 2026-08-24 (Seção 7 — "Preciso de ajuda agora" sem login):** todas as 6 linhas com número específico acima foram reconfirmadas nas mesmas fontes e passaram a ter `fonte`/`verificado_em` preenchidos em `recursos_seguranca` (ver `supabase/migrations/20260824150000_recursos_seguranca_fonte_verificado.sql`). Fonte do CVV — **cvv.org.br** — não é domínio `.gov`, mas é o site oficial da entidade que opera a linha 188, em convênio com o Ministério da Saúde desde 2015; não existe página `.gov.br` alternativa que substitua a página oficial do operador do serviço. As linhas introdutórias ("Não está sozinha" / "Você não está sozinha") não fazem alegação factual verificável e ficam sem `fonte` de propósito — não aparecem mais na consulta de `/seguranca`, que agora filtra por `fonte is not null and verificado_em is not null`.
```

- [ ] **Step 4: Aplicar o seed localmente e verificar**

Run: `supabase db reset`
Expected: sem erro de SQL; `select count(*) from public.recursos_seguranca where fonte is not null;` retorna `6`.

- [ ] **Step 5: Commit**

```bash
git add supabase/seed_recursos_seguranca_pt.sql supabase/seed.sql docs/EVIDENCE.md
git commit -m "docs(seguranca): fonte/verificado_em nos seeds e reverificacao registrada em EVIDENCE.md"
```

---

### Task 3: `src/lib/perfil/emergenciaLocal.ts` — números de emergência fixos por país

**Files:**
- Create: `src/lib/perfil/emergenciaLocal.ts`
- Test: `src/lib/perfil/emergenciaLocal.test.ts`

**Interfaces:**
- Consumes: `PaisSuportado`, `PAISES_SUPORTADOS` de `src/lib/perfil/pais.ts`.
- Produces: `NUMERO_EMERGENCIA_LOCAL: Record<PaisSuportado, { numero: string; rotulo: string }>` — consumido por `src/app/seguranca/page.tsx` (Task 5). Nunca depende de banco: é a peça central da resiliência exigida pela Seção 7 ("se a consulta a `recursos_seguranca` falhar ou vier vazia, a tela ainda mostra a orientação genérica").

- [ ] **Step 1: Escrever o teste (falha por o módulo não existir ainda)**

```ts
// src/lib/perfil/emergenciaLocal.test.ts
import { describe, it, expect } from 'vitest';
import { NUMERO_EMERGENCIA_LOCAL } from './emergenciaLocal';
import { PAISES_SUPORTADOS } from './pais';

describe('NUMERO_EMERGENCIA_LOCAL', () => {
  it('tem uma entrada para todo país suportado', () => {
    for (const pais of PAISES_SUPORTADOS) {
      expect(NUMERO_EMERGENCIA_LOCAL[pais]).toBeDefined();
      expect(NUMERO_EMERGENCIA_LOCAL[pais].numero.length).toBeGreaterThan(0);
      expect(NUMERO_EMERGENCIA_LOCAL[pais].rotulo.length).toBeGreaterThan(0);
    }
  });

  it('PT aponta para o 112 (número europeu de emergência)', () => {
    expect(NUMERO_EMERGENCIA_LOCAL.PT.numero).toBe('112');
  });

  it('BR aponta para o 192 (SAMU)', () => {
    expect(NUMERO_EMERGENCIA_LOCAL.BR.numero).toBe('192');
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/lib/perfil/emergenciaLocal.test.ts`
Expected: FAIL — `Cannot find module './emergenciaLocal'`.

- [ ] **Step 3: Implementar `src/lib/perfil/emergenciaLocal.ts`**

```ts
import type { PaisSuportado } from './pais';

// Números de emergência locais, fixos aqui no código (nunca vêm do banco).
// Existem para que o bloco de orientação de /seguranca nunca dependa de uma
// consulta ao Supabase — mesmo que a tabela recursos_seguranca esteja vazia
// ou a consulta falhe, este mapa continua disponível (Seção 7 do design de
// evolução da Rose: "resiliente... a tela ainda mostra a orientação
// genérica de emergência local").
//
// Números conferidos em 2026-08-24 nas mesmas fontes oficiais usadas para
// popular recursos_seguranca (ver
// docs/superpowers/plans/2026-08-24-espaco-seguranca.md):
//   PT: Portal gov.pt — Contactos de emergência em Portugal
//       https://www.gov.pt/guias/contactos-de-emergencia-em-portugal
//   BR: Ministério da Saúde — SAMU 192
//       https://www.gov.br/saude/pt-br/composicao/saes/samu-192
export const NUMERO_EMERGENCIA_LOCAL: Record<PaisSuportado, { numero: string; rotulo: string }> = {
  PT: { numero: '112', rotulo: '112 — Emergência (número europeu)' },
  BR: { numero: '192', rotulo: '192 — SAMU (emergência médica)' },
};
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run src/lib/perfil/emergenciaLocal.test.ts`
Expected: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add src/lib/perfil/emergenciaLocal.ts src/lib/perfil/emergenciaLocal.test.ts
git commit -m "feat(seguranca): numeros de emergencia locais fixos, independentes de banco"
```

---

### Task 4: `SeletorPaisSeguranca` — seleção manual de país sem sessão

**Files:**
- Create: `src/app/components/seguranca/SeletorPaisSeguranca.tsx`
- Test: `src/app/components/seguranca/SeletorPaisSeguranca.test.tsx`

**Interfaces:**
- Consumes: `PAISES_SUPORTADOS`, `NOME_PAIS`, `PaisSuportado` de `src/lib/perfil/pais.ts`; `useRouter` de `next/navigation`.
- Produces: componente `SeletorPaisSeguranca` (client, sem props) que navega para `/seguranca?pais=PT` ou `/seguranca?pais=BR` ao clicar — consumido por `src/app/seguranca/page.tsx` (Task 5). Não persiste nada no perfil (a pessoa pode não ter conta) — é só uma escolha de exibição para esta visita.

- [ ] **Step 1: Escrever o teste (falha por o componente não existir ainda)**

```tsx
// src/app/components/seguranca/SeletorPaisSeguranca.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SeletorPaisSeguranca from './SeletorPaisSeguranca';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

beforeEach(() => {
  replace.mockClear();
});

describe('SeletorPaisSeguranca', () => {
  it('mostra um botão para cada país suportado', () => {
    render(<SeletorPaisSeguranca />);
    expect(screen.getByRole('button', { name: 'Portugal' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Brasil' })).toBeTruthy();
  });

  it('ao escolher Portugal, navega para /seguranca?pais=PT', () => {
    render(<SeletorPaisSeguranca />);
    fireEvent.click(screen.getByRole('button', { name: 'Portugal' }));
    expect(replace).toHaveBeenCalledWith('/seguranca?pais=PT');
  });

  it('ao escolher Brasil, navega para /seguranca?pais=BR', () => {
    render(<SeletorPaisSeguranca />);
    fireEvent.click(screen.getByRole('button', { name: 'Brasil' }));
    expect(replace).toHaveBeenCalledWith('/seguranca?pais=BR');
  });

  it('marca o botão escolhido com aria-pressed', () => {
    render(<SeletorPaisSeguranca />);
    const botaoPT = screen.getByRole('button', { name: 'Portugal' }) as HTMLButtonElement;
    expect(botaoPT.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(botaoPT);
    expect(botaoPT.getAttribute('aria-pressed')).toBe('true');
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/app/components/seguranca/SeletorPaisSeguranca.test.tsx`
Expected: FAIL — `Cannot find module './SeletorPaisSeguranca'`.

- [ ] **Step 3: Implementar `SeletorPaisSeguranca.tsx`**

```tsx
'use client';

// Seleção manual de país para quem chega em /seguranca sem sessão (ou com
// sessão mas sem país confirmado ainda) — Seção 7 do design de evolução da
// Rose: "sem sessão, mostra seleção manual PT/BR e orientação genérica —
// nunca depende de login para exibir ajuda emergencial". Não persiste nada
// em nenhum perfil (pode nem existir uma conta); é só uma escolha de
// exibição para esta visita, feita via querystring.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PAISES_SUPORTADOS, NOME_PAIS, type PaisSuportado } from '@/lib/perfil/pais';

export default function SeletorPaisSeguranca() {
  const router = useRouter();
  const [paisEscolhido, setPaisEscolhido] = useState<PaisSuportado | null>(null);

  function escolher(pais: PaisSuportado) {
    setPaisEscolhido(pais);
    router.replace(`/seguranca?pais=${pais}`);
  }

  return (
    <div className="space-y-3 rounded-2xl border border-borda bg-superficie p-4">
      <p className="text-texto">
        Ainda não sabemos de qual país você está acessando. Escolha abaixo para ver os contatos de apoio
        certos para você.
      </p>
      <div className="flex flex-col gap-2">
        {PAISES_SUPORTADOS.map((pais) => (
          <button
            key={pais}
            type="button"
            onClick={() => escolher(pais)}
            aria-pressed={paisEscolhido === pais}
            className={`rounded-2xl border p-3 text-left font-medium transition-colors ${
              paisEscolhido === pais ? 'border-acao bg-acao/10 text-texto' : 'border-borda text-texto-suave'
            }`}
          >
            {NOME_PAIS[pais]}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run src/app/components/seguranca/SeletorPaisSeguranca.test.tsx`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
git add src/app/components/seguranca/SeletorPaisSeguranca.tsx src/app/components/seguranca/SeletorPaisSeguranca.test.tsx
git commit -m "feat(seguranca): selecao manual de pais para acesso sem sessao"
```

---

### Task 5: `AvisoSeguranca` — ponto de entrada compacto reaproveitável

**Files:**
- Create: `src/app/components/seguranca/AvisoSeguranca.tsx`
- Test: `src/app/components/seguranca/AvisoSeguranca.test.tsx`

**Interfaces:**
- Consumes: `CardAtencaoSeguranca` de `src/app/components/jornadas-modulos/CardAtencaoSeguranca.tsx` (já existente, sem alteração nele).
- Produces: componente `AvisoSeguranca` (sem props) — consumido pela Task 8 (Home, Perfil, check-in). Não chama `detectarSinalDeAtencao` em nenhum momento — essa heurística continua exclusiva dos módulos de texto livre.

- [ ] **Step 1: Escrever o teste (falha por o componente não existir ainda)**

```tsx
// src/app/components/seguranca/AvisoSeguranca.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AvisoSeguranca from './AvisoSeguranca';

describe('AvisoSeguranca', () => {
  it('mostra um link para /seguranca', () => {
    render(<AvisoSeguranca />);
    expect(screen.getByRole('link', { name: 'Ver recursos de apoio' }).getAttribute('href')).toBe(
      '/seguranca'
    );
  });

  it('é a variante compacta — não mostra o texto de alerta "destacado" do CardAtencaoSeguranca', () => {
    render(<AvisoSeguranca />);
    expect(screen.queryByText(/Percebemos palavras que podem indicar/i)).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/app/components/seguranca/AvisoSeguranca.test.tsx`
Expected: FAIL — `Cannot find module './AvisoSeguranca'`.

- [ ] **Step 3: Implementar `AvisoSeguranca.tsx`**

```tsx
// Ponto de entrada compacto para o espaço de segurança (Seção 7 do design de
// evolução da Rose), reaproveitado em Home, Perfil e no fluxo de check-in.
// É um wrapper fino sobre o CardAtencaoSeguranca já existente — usa a
// variante `destacado={false}`, que já é o estilo discreto/compacto do
// card — nunca reimplementa o texto ou o estilo, e nunca chama
// detectarSinalDeAtencao (essa heurística continua exclusiva dos módulos de
// texto livre, ver src/lib/jornadas-modulos/deteccaoAtencao.ts). Fora de um
// módulo, não existe nenhum sinal de atenção para detectar — este
// componente só oferece o acesso, sempre no mesmo estado discreto.
import CardAtencaoSeguranca from '@/app/components/jornadas-modulos/CardAtencaoSeguranca';

export default function AvisoSeguranca() {
  return <CardAtencaoSeguranca destacado={false} />;
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run src/app/components/seguranca/AvisoSeguranca.test.tsx`
Expected: PASS (2 testes).

- [ ] **Step 5: Commit**

```bash
git add src/app/components/seguranca/AvisoSeguranca.tsx src/app/components/seguranca/AvisoSeguranca.test.tsx
git commit -m "feat(seguranca): componente AvisoSeguranca reaproveitavel como ponto de entrada"
```

---

### Task 6: Reescrever `src/app/seguranca/page.tsx` — funciona sem sessão, filtra confirmados, bloco fixo

**Files:**
- Modify: `src/app/seguranca/page.tsx`
- Test: `src/app/seguranca/page.test.tsx`

**Interfaces:**
- Consumes: `NUMERO_EMERGENCIA_LOCAL` (Task 3), `SeletorPaisSeguranca` (Task 4), `PAISES_SUPORTADOS`/`PaisSuportado` de `src/lib/perfil/pais.ts`, `RecursoSeguranca` (Task 1), `createSupabaseServerClient` de `src/lib/supabase/server.ts`, `NotificacaoPetalas` de `src/app/components/clube-rose/NotificacaoPetalas.tsx` (já existente, sem alteração).
- Produces: `SegurancaPage` (default export, server component) aceitando `searchParams: Promise<{ petalas?: string; pais?: string }>` — o novo parâmetro `pais` é consumido pelo próprio componente (setado pelo `SeletorPaisSeguranca` via navegação).

- [ ] **Step 1: Escrever os testes (falham por o comportamento novo não existir ainda)**

```tsx
// src/app/seguranca/page.test.tsx
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SegurancaPage from './page';
import type { RecursoSeguranca } from '@/lib/supabase/types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock('@/lib/supabase/server', () => ({ createSupabaseServerClient: vi.fn() }));

import { createSupabaseServerClient } from '@/lib/supabase/server';

type RecursoFake = Pick<RecursoSeguranca, 'id' | 'titulo' | 'corpo' | 'ordem'>;

function criarSupabaseFake(opcoes: {
  usuario?: { id: string } | null;
  perfil?: { pais: string; pais_confirmado_em: string | null } | null;
  recursos?: RecursoFake[];
  erroRecursos?: boolean;
}) {
  const { usuario = null, perfil = null, recursos = [], erroRecursos = false } = opcoes;
  const chamadasRecursos: { metodo: string; args: unknown[] }[] = [];

  return {
    client: {
      auth: { getUser: vi.fn(async () => ({ data: { user: usuario } })) },
      from: vi.fn((tabela: string) => {
        if (tabela === 'perfis') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({ data: perfil })),
              })),
            })),
          };
        }
        if (tabela === 'recursos_seguranca') {
          const query = {
            select: vi.fn(() => query),
            eq: vi.fn((...args: unknown[]) => {
              chamadasRecursos.push({ metodo: 'eq', args });
              return query;
            }),
            not: vi.fn((...args: unknown[]) => {
              chamadasRecursos.push({ metodo: 'not', args });
              return query;
            }),
            order: vi.fn(async () =>
              erroRecursos ? { data: null, error: new Error('falhou') } : { data: recursos, error: null }
            ),
          };
          return query;
        }
        throw new Error(`tabela inesperada no teste: ${tabela}`);
      }),
    },
    chamadasRecursos,
  };
}

describe('SegurancaPage', () => {
  it('funciona sem sessão: mostra o seletor de país quando não há usuária e nenhum ?pais= foi escolhido', async () => {
    const { client } = criarSupabaseFake({ usuario: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);

    const jsx = await SegurancaPage({ searchParams: Promise.resolve({}) });
    render(jsx);

    expect(screen.getByRole('button', { name: 'Portugal' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Brasil' })).toBeTruthy();
    expect(screen.getByText('A Rose não acompanha emergências em tempo real.')).toBeTruthy();
  });

  it('sem sessão, mas com ?pais=BR: usa o país da querystring e mostra o número de emergência do Brasil', async () => {
    const { client } = criarSupabaseFake({
      usuario: null,
      recursos: [{ id: 'r1', titulo: 'Apoio emocional gratuito', corpo: 'Ligue 188.', ordem: 1 }],
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);

    const jsx = await SegurancaPage({ searchParams: Promise.resolve({ pais: 'BR' }) });
    render(jsx);

    expect(screen.queryByRole('button', { name: 'Portugal' })).toBeNull();
    expect(screen.getByText('Apoio emocional gratuito')).toBeTruthy();
    const linkTel = screen.getByRole('link', { name: /192/ });
    expect(linkTel.getAttribute('href')).toBe('tel:192');
  });

  it('com sessão e país confirmado no perfil: usa o país da conta e ignora um ?pais= diferente na querystring', async () => {
    const { client } = criarSupabaseFake({
      usuario: { id: 'u1' },
      perfil: { pais: 'PT', pais_confirmado_em: '2026-01-01T00:00:00Z' },
      recursos: [{ id: 'r1', titulo: 'Linha Nacional de Prevenção do Suicídio', corpo: 'Ligue 1411.', ordem: 1 }],
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);

    const jsx = await SegurancaPage({ searchParams: Promise.resolve({ pais: 'BR' }) });
    render(jsx);

    expect(screen.getByText('Linha Nacional de Prevenção do Suicídio')).toBeTruthy();
    const linkTel = screen.getByRole('link', { name: /112/ });
    expect(linkTel.getAttribute('href')).toBe('tel:112');
  });

  it('com sessão mas sem país confirmado: cai para o seletor manual, igual a uma visita sem sessão', async () => {
    const { client } = criarSupabaseFake({
      usuario: { id: 'u1' },
      perfil: { pais: 'BR', pais_confirmado_em: null },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);

    const jsx = await SegurancaPage({ searchParams: Promise.resolve({}) });
    render(jsx);

    expect(screen.getByRole('button', { name: 'Portugal' })).toBeTruthy();
  });

  it('a consulta filtra por fonte e verificado_em preenchidos (contatos não verificados não devem aparecer)', async () => {
    const { client, chamadasRecursos } = criarSupabaseFake({ usuario: null, recursos: [] });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);

    await SegurancaPage({ searchParams: Promise.resolve({ pais: 'PT' }) });

    const metodosNot = chamadasRecursos.filter((c) => c.metodo === 'not').map((c) => c.args);
    expect(metodosNot).toContainEqual(['fonte', 'is', null]);
    expect(metodosNot).toContainEqual(['verificado_em', 'is', null]);
  });

  it('resiliente quando a consulta falha: ainda mostra a orientação fixa e o número de emergência', async () => {
    const { client } = criarSupabaseFake({ usuario: null, erroRecursos: true });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);

    const jsx = await SegurancaPage({ searchParams: Promise.resolve({ pais: 'PT' }) });
    render(jsx);

    expect(screen.getByText('A Rose não acompanha emergências em tempo real.')).toBeTruthy();
    expect(screen.getByRole('link', { name: /112/ }).getAttribute('href')).toBe('tel:112');
  });

  it('resiliente quando a consulta vem vazia: ainda mostra a orientação fixa', async () => {
    const { client } = criarSupabaseFake({ usuario: null, recursos: [] });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);

    const jsx = await SegurancaPage({ searchParams: Promise.resolve({ pais: 'BR' }) });
    render(jsx);

    expect(screen.getByText('A Rose não acompanha emergências em tempo real.')).toBeTruthy();
    expect(screen.getByRole('link', { name: /192/ }).getAttribute('href')).toBe('tel:192');
  });

  it('mostra o botão "Voltar ao app"', async () => {
    const { client } = criarSupabaseFake({ usuario: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);

    const jsx = await SegurancaPage({ searchParams: Promise.resolve({ pais: 'PT' }) });
    render(jsx);

    expect(screen.getByRole('link', { name: 'Voltar ao app' })).toBeTruthy();
  });
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npx vitest run src/app/seguranca/page.test.tsx`
Expected: FAIL (a página atual redireciona/renderiza diferente do esperado; `SeletorPaisSeguranca`/número de emergência ainda não existem no `page.tsx`).

- [ ] **Step 3: Reescrever `src/app/seguranca/page.tsx`**

```tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import NotificacaoPetalas from '@/app/components/clube-rose/NotificacaoPetalas';
import SeletorPaisSeguranca from '@/app/components/seguranca/SeletorPaisSeguranca';
import { PAISES_SUPORTADOS, type PaisSuportado } from '@/lib/perfil/pais';
import { NUMERO_EMERGENCIA_LOCAL } from '@/lib/perfil/emergenciaLocal';
import type { RecursoSeguranca } from '@/lib/supabase/types';

function paisValido(valor: string | undefined): PaisSuportado | null {
  if (!valor) return null;
  return (PAISES_SUPORTADOS as readonly string[]).includes(valor) ? (valor as PaisSuportado) : null;
}

export default async function SegurancaPage({
  searchParams,
}: {
  searchParams: Promise<{ petalas?: string; pais?: string }>;
}) {
  const { petalas, pais: paisParam } = await searchParams;
  const petalasGanhas = petalas ? Number.parseInt(petalas, 10) : 0;
  const supabase = await createSupabaseServerClient();

  // Este espaço precisa funcionar mesmo sem sessão — quem está buscando
  // ajuda agora não pode ficar preso a um redirect de login. Não há gate de
  // autenticação nesta rota (ver src/proxy.ts, que trata /seguranca como
  // pública); getUser() aqui só decide QUAL país usar.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let paisDaConta: PaisSuportado | null = null;
  if (user) {
    const { data: perfil } = await supabase
      .from('perfis')
      .select('pais, pais_confirmado_em')
      .eq('id', user.id)
      .maybeSingle();
    // Só usamos o país se a própria usuária já o confirmou explicitamente —
    // um valor de `pais` não confirmado é só o default da conta, não uma
    // informação em que vale a pena basear contatos de emergência.
    paisDaConta = perfil?.pais_confirmado_em ? paisValido(perfil.pais) : null;
  }

  // Sem conta, ou com conta mas país ainda não confirmado: cai para a
  // seleção manual (?pais=PT|BR, escolhida no client por
  // SeletorPaisSeguranca). O país da conta sempre tem prioridade sobre a
  // querystring quando os dois existem — nunca deixamos uma querystring
  // antiga sobrepor um país já confirmado no perfil.
  const paisEfetivo = paisDaConta ?? paisValido(paisParam);

  // Consulta resiliente: só recursos com fonte oficial verificada aparecem
  // como confirmados (Seção 1 do design — fonte E verificado_em precisam
  // dos dois preenchidos). Se a consulta falhar ou vier vazia, `recursos`
  // fica [] e a tela continua funcional — o bloco de orientação fixo abaixo
  // nunca depende deste resultado.
  let recursos: RecursoSeguranca[] = [];
  if (paisEfetivo) {
    const { data, error } = await supabase
      .from('recursos_seguranca')
      .select('*')
      .eq('pais', paisEfetivo)
      .not('fonte', 'is', null)
      .not('verificado_em', 'is', null)
      .order('ordem');
    if (!error && data) {
      recursos = data;
    }
  }

  const emergenciaLocal = paisEfetivo ? NUMERO_EMERGENCIA_LOCAL[paisEfetivo] : null;

  return (
    <>
      {petalasGanhas > 0 && <NotificacaoPetalas quantidade={petalasGanhas} />}
      <main className="mx-auto max-w-md space-y-6 p-6">
        <div className="space-y-2 rounded-2xl border border-alerta bg-alerta/10 p-4">
          <p className="font-medium text-texto">A Rose não acompanha emergências em tempo real.</p>
          <p className="text-texto">
            Se você ou alguém perto de você está em risco imediato, ligue agora para o número de
            emergência do seu país{emergenciaLocal ? ':' : '.'}
          </p>
          {emergenciaLocal && (
            <a
              href={`tel:${emergenciaLocal.numero}`}
              className="inline-block font-display text-2xl text-acao underline underline-offset-4"
            >
              {emergenciaLocal.rotulo}
            </a>
          )}
        </div>

        {!paisEfetivo && <SeletorPaisSeguranca />}

        {recursos.map((recurso) => (
          <div key={recurso.id} className="space-y-1 border-l-4 border-alerta pl-4">
            <h2 className="font-display text-xl text-texto">{recurso.titulo}</h2>
            <p className="text-texto">{recurso.corpo}</p>
          </div>
        ))}

        <a
          href="/"
          className="block w-full rounded-2xl border border-borda p-3 text-center font-medium text-texto-suave transition-colors hover:bg-superficie"
        >
          Voltar ao app
        </a>
      </main>
    </>
  );
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npx vitest run src/app/seguranca/page.test.tsx`
Expected: PASS (8 testes).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add src/app/seguranca/page.tsx src/app/seguranca/page.test.tsx
git commit -m "feat(seguranca): /seguranca funciona sem sessao, filtra contatos confirmados e ganha bloco fixo de emergencia"
```

---

### Task 7: `src/proxy.ts` — `/seguranca` vira rota pública

**Files:**
- Modify: `src/proxy.ts:4-25`
- Modify: `src/proxy.test.ts`

**Interfaces:**
- Consumes: nenhuma nova.
- Produces: `ROTAS_PUBLICAS` inclui `/seguranca` — nenhuma outra função muda de assinatura.

- [ ] **Step 1: Escrever o teste (falha por a rota ainda não ser pública)**

Em `src/proxy.test.ts`, adicionar dentro do `describe('proxy (middleware)', ...)`, depois do teste `'redireciona para /login quando não há sessão em rota protegida'`:

```ts
  it('permite acesso sem sessão a /seguranca — o espaço "Preciso de ajuda agora" nunca pode depender de login', async () => {
    vi.mocked(createServerClient).mockReturnValue(criarSupabaseFake(null) as never);
    const request = new NextRequest('https://rose.exemplo.com/seguranca');

    const resposta = await proxy(request);

    expect(resposta.headers.get('location')).toBeNull();
  });

  it('permite acesso a /seguranca mesmo autenticada sem consentimento/país confirmados (não força /onboarding)', async () => {
    vi.mocked(createServerClient).mockReturnValue(
      criarSupabaseFake({ id: 'u1' }, { consentimento_dados_sensiveis_em: null, pais_confirmado_em: null }) as never
    );
    const request = new NextRequest('https://rose.exemplo.com/seguranca');

    const resposta = await proxy(request);

    expect(resposta.headers.get('location')).toBeNull();
  });
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/proxy.test.ts`
Expected: FAIL nos 2 testes novos — `resposta.headers.get('location')` contém `/login` ou `/onboarding`.

- [ ] **Step 3: Adicionar `/seguranca` a `ROTAS_PUBLICAS`**

Em `src/proxy.ts`, dentro do array `ROTAS_PUBLICAS` (linhas 4-25), adicionar ao final, antes do fechamento `];`:

```ts
  // O espaço "Preciso de ajuda agora" (Seção 7 do design de evolução da
  // Rose) precisa funcionar mesmo sem sessão e mesmo para quem ainda não
  // completou o onboarding — quem está buscando ajuda agora não pode ficar
  // preso a um redirect de login ou de confirmação de país. A própria
  // página (src/app/seguranca/page.tsx) já lida com os dois casos (sem
  // usuária, ou usuária sem país confirmado) mostrando a seleção manual de
  // país em vez de dados que ainda não existem.
  '/seguranca',
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npx vitest run src/proxy.test.ts`
Expected: PASS (todos os testes, incluindo os 2 novos).

- [ ] **Step 5: Commit**

```bash
git add src/proxy.ts src/proxy.test.ts
git commit -m "fix(proxy): /seguranca acessivel sem sessao e sem onboarding concluido"
```

---

### Task 8: Pontos de entrada — Home, Perfil e fluxo de check-in

**Files:**
- Modify: `src/app/page.tsx:1-97`
- Modify: `src/app/perfil/page.tsx:1-75`
- Modify: `src/app/checkin/page.tsx:1-59`

**Interfaces:**
- Consumes: `AvisoSeguranca` (Task 5).
- Produces: nenhuma nova — só inserção de JSX.

- [ ] **Step 1: Adicionar `AvisoSeguranca` na Home**

Em `src/app/page.tsx`, adicionar o import:

```tsx
import AvisoSeguranca from '@/app/components/seguranca/AvisoSeguranca';
```

E inserir o componente logo antes de `<NavegacaoInferior />` (depois de `<MensagemAcolhedora />`):

```tsx
      <MensagemAcolhedora />

      <AvisoSeguranca />

      <NavegacaoInferior />
```

- [ ] **Step 2: Adicionar `AvisoSeguranca` em Perfil**

Em `src/app/perfil/page.tsx`, adicionar o import:

```tsx
import AvisoSeguranca from '@/app/components/seguranca/AvisoSeguranca';
```

E inserir logo depois do bloco de `erroPerfil` e antes do `<nav aria-label="Menu do perfil" ...>`:

```tsx
        {erroPerfil && (
          <div className="rounded-2xl border border-borda bg-superficie p-4 text-sm text-texto-suave">
            Não foi possível carregar todos os dados do seu perfil agora. Algumas informações podem
            aparecer incompletas.
          </div>
        )}

        <AvisoSeguranca />

        <nav aria-label="Menu do perfil" className="space-y-3">
```

- [ ] **Step 3: Adicionar `AvisoSeguranca` no fluxo de check-in**

Em `src/app/checkin/page.tsx`, adicionar o import:

```tsx
import AvisoSeguranca from '@/app/components/seguranca/AvisoSeguranca';
```

E inserir dentro do bloco de check-in ainda não feito, antes de `<CheckinFormClient .../>`:

```tsx
      ) : (
        <>
          <div className="mx-auto max-w-md px-6 pt-4">
            <AvisoSeguranca />
          </div>
          <CheckinFormClient humorInicial={humorInicial} />
        </>
      )}
```

(o restante do arquivo — `LembreteBanner`, o bloco `jaFezCheckinHoje` — não muda.)

- [ ] **Step 4: Typecheck e build**

Run: `npx tsc --noEmit`
Expected: sem erros.

Run: `npm run build`
Expected: build de produção conclui sem erros (confirma que as 3 páginas continuam renderizando como server components válidos com o novo import).

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/app/perfil/page.tsx src/app/checkin/page.tsx
git commit -m "feat(seguranca): pontos de entrada visiveis em Home, Perfil e check-in"
```

---

### Task 9: Verificação final

**Files:** nenhum arquivo novo — só execução e checklist.

- [ ] **Step 1: Suíte completa de testes**

Run: `npx vitest run`
Expected: todos os testes passam, incluindo os novos de `emergenciaLocal`, `SeletorPaisSeguranca`, `AvisoSeguranca`, `page.tsx` (seguranca) e `proxy.test.ts`.

- [ ] **Step 2: Typecheck, lint e build**

Run: `npx tsc --noEmit`
Run: `npm run lint`
Run: `npm run build`
Expected: sem erros em nenhum dos três.

- [ ] **Step 3: Self-review de cobertura da Seção 7**

Confirmar, um a um, contra a Seção 7 do design:

- [ ] `/seguranca` continua rota única (não foi criada nenhuma rota nova) — Task 6.
- [ ] Funciona sem sessão autenticada; com perfil e país confirmado usa o país da conta; sem sessão (ou sem país confirmado) mostra seleção manual PT/BR — Task 6 + Task 4.
- [ ] Pontos de entrada novos em Home, check-in, Perfil, via componente reaproveitável `AvisoSeguranca`, sem duplicar `detectarSinalDeAtencao` — Task 5 + Task 8 (confirmar: nenhum arquivo desta feature importa `detectarSinalDeAtencao`).
- [ ] Consulta filtra por `fonte is not null and verificado_em is not null` — Task 6, testado em `page.test.tsx`.
- [ ] Resiliente a falha/consulta vazia — Task 6, testado em `page.test.tsx`.
- [ ] Texto fixo "A Rose não acompanha emergências em tempo real" + orientação de emergência local + botão "Voltar ao app" — Task 6.
- [ ] Links de discagem via `<a href="tel:...">` — Task 6, testado em `page.test.tsx`.
- [ ] Pesquisa de fontes oficiais documentada, com pendências explícitas se houver — feita na abertura deste plano; sem pendência.

- [ ] **Step 4: QA manual (registrar no PR, não neste plano)**

No Preview: abrir `/seguranca` sem estar logada (aba anônima) e confirmar que aparece o seletor PT/BR; escolher um país e conferir o link `tel:`; logar com uma conta com país confirmado e conferir que `/seguranca` pula direto para os recursos daquele país; conferir os 3 pontos de entrada (Home, Perfil, check-in).

---

## Self-review

**Cobertura da Seção 7:** todos os itens do enunciado (rota única sem duplicar, funciona sem sessão, seleção manual PT/BR, pontos de entrada com `AvisoSeguranca` sem duplicar heurística, filtro `fonte`/`verificado_em`, resiliência a falha/vazio, texto fixo + botão "Voltar ao app", `tel:` sem discagem automática, pesquisa de fontes) têm uma task correspondente (Tasks 1–8) e um item de checklist na Task 9.

**Placeholder scan:** todo bloco de código deste plano contém conteúdo completo e real — nenhum "TBD", nenhuma fonte inventada, nenhum "adicionar validação apropriada" sem o código da validação. Os únicos valores condicionais são o timestamp exato gerado por `supabase migration new` (Task 1, Step 1), que é inerente à ferramenta, não um placeholder de conteúdo.

**Consistência de tipos:** `RecursoSeguranca` (Task 1) ganha `fonte`/`verificado_em` e é usado com esse formato em `page.tsx` (Task 6) e no teste (Task 6). `NUMERO_EMERGENCIA_LOCAL` (Task 3) é `Record<PaisSuportado, { numero, rotulo }>` e é consumido exatamente assim em `page.tsx`. `SeletorPaisSeguranca` (Task 4) não recebe props e navega para `/seguranca?pais=PT|BR`, formato que `page.tsx` (Task 6) lê via `searchParams.pais` e valida com `paisValido()`. `AvisoSeguranca` (Task 5) não recebe props e é importado sem props nas 3 páginas da Task 8.
