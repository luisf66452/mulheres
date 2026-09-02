# Funil de venda avulsa do ebook "Rose Reset 21 dias" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vender o ebook "Rose Reset 21 dias" avulso, via `/ebook`, com checkout Stripe one-time sem conta e download liberado por signed URL após confirmação de pagamento.

**Architecture:** Rota nova e isolada (`/ebook`, `/ebook/obrigado`, `/api/stripe/checkout-ebook`), sem tocar no funil de assinatura existente. Reaproveita `obterStripe`, `obterMoedaELocaleDoPais`, `formatarPrecoExibicao` e `obterUrlBaseDoRequest` já existentes. PDF fica num bucket privado do Supabase Storage (`ebooks`); o download é liberado só depois de confirmar `payment_status === 'paid'` direto no Stripe.

**Tech Stack:** Next.js (App Router, Server + Client Components), Stripe SDK (`mode: 'payment'`), Supabase Storage (bucket privado + `createSignedUrl`), Vitest (`@vitest-environment node` para rotas de API).

## Global Constraints

- Nunca criar conta/perfil como parte da compra do ebook — fluxo 100% sem autenticação.
- Nunca modificar `/comecar`, `/login`, `/api/stripe/checkout`, `/api/stripe/webhook` ou qualquer arquivo do funil de assinatura existente.
- Moeda/preço do ebook: mesma lógica de exibição de `formatarPrecoExibicao`/`obterMoedaELocaleDoPais` do funil de assinatura — sem valor fixo hardcoded no código, sempre lido do Stripe.
- Price ID do ebook vem de `process.env.STRIPE_PRICE_ID_EBOOK` — se ausente, a funcionalidade degrada honestamente (503 na API, página `/ebook` sem preço/CTA funcional), nunca quebra o build.
- Bucket `ebooks` no Supabase Storage é privado (`public: false`) — nenhuma policy de leitura pública; acesso só via `createSupabaseAdminClient()` no server.
- Todo texto de UI em português, seguindo o tom das páginas existentes (`/comecar/resultado`).
- Testes de rota de API usam `@vitest-environment node` e mockam `@/lib/stripe/client`, `@/lib/supabase/admin`, `@/lib/site-url` (mesmo padrão de `checkout/route.test.ts`).

---

### Task 1: `STRIPE_PRICE_ID_EBOOK` — env vars e helper de configuração

**Files:**
- Modify: `.env.example:26` (depois de `STRIPE_PRICE_ID_ANUAL`)
- Modify: `.env.local.example:12` (depois de `STRIPE_PRICE_ID_ANUAL`)
- Modify: `src/lib/stripe/planos.ts` (adicionar `obterPriceIdEbook` e `ebookConfigurado`)
- Test: `src/lib/stripe/planos.test.ts`

**Interfaces:**
- Produces: `obterPriceIdEbook(): string | null` — lê `process.env.STRIPE_PRICE_ID_EBOOK`, retorna `null` se ausente.
- Produces: `ebookConfigurado(): boolean` — `true` só se `STRIPE_SECRET_KEY` e `STRIPE_PRICE_ID_EBOOK` estiverem setados.

- [ ] **Step 1: Escrever os testes que falham**

Adicionar ao final de `src/lib/stripe/planos.test.ts` (checar o arquivo primeiro para seguir o padrão de import/describe já usado nele):

```typescript
describe('obterPriceIdEbook', () => {
  it('retorna o price id do ebook quando STRIPE_PRICE_ID_EBOOK está configurado', () => {
    vi.stubEnv('STRIPE_PRICE_ID_EBOOK', 'price_ebook_teste');
    expect(obterPriceIdEbook()).toBe('price_ebook_teste');
  });

  it('retorna null quando STRIPE_PRICE_ID_EBOOK não está configurado', () => {
    vi.stubEnv('STRIPE_PRICE_ID_EBOOK', '');
    expect(obterPriceIdEbook()).toBeNull();
  });
});

describe('ebookConfigurado', () => {
  it('retorna true quando STRIPE_SECRET_KEY e STRIPE_PRICE_ID_EBOOK estão presentes', () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_teste');
    vi.stubEnv('STRIPE_PRICE_ID_EBOOK', 'price_ebook_teste');
    expect(ebookConfigurado()).toBe(true);
  });

  it('retorna false quando STRIPE_PRICE_ID_EBOOK está ausente', () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_teste');
    vi.stubEnv('STRIPE_PRICE_ID_EBOOK', '');
    expect(ebookConfigurado()).toBe(false);
  });

  it('retorna false quando STRIPE_SECRET_KEY está ausente', () => {
    vi.stubEnv('STRIPE_SECRET_KEY', '');
    vi.stubEnv('STRIPE_PRICE_ID_EBOOK', 'price_ebook_teste');
    expect(ebookConfigurado()).toBe(false);
  });
});
```

Adicionar `obterPriceIdEbook` e `ebookConfigurado` ao import existente do topo do arquivo de teste.

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npx vitest run src/lib/stripe/planos.test.ts`
Expected: FAIL com "obterPriceIdEbook is not a function" (ou erro de import)

- [ ] **Step 3: Implementar em `src/lib/stripe/planos.ts`**

Adicionar ao final do arquivo, depois de `stripeConfigurado`:

```typescript
// Price avulso (one-time) do ebook — separado dos price ids de assinatura
// (STRIPE_PRICE_ID_MENSAL/ANUAL) porque é um mode: 'payment', não
// 'subscription'. Mesmo padrão de degradar honestamente (null) quando não
// configurado, em vez de lançar.
export function obterPriceIdEbook(): string | null {
  return process.env.STRIPE_PRICE_ID_EBOOK ?? null;
}

export function ebookConfigurado(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID_EBOOK);
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npx vitest run src/lib/stripe/planos.test.ts`
Expected: PASS

- [ ] **Step 5: Adicionar a env var aos arquivos de exemplo**

Em `.env.example`, depois da linha `STRIPE_PRICE_ID_ANUAL=coloque-o-price-id-anual-aqui`:

```
STRIPE_PRICE_ID_EBOOK=coloque-o-price-id-do-ebook-aqui
```

Em `.env.local.example`, depois da linha `STRIPE_PRICE_ID_ANUAL=`:

```
STRIPE_PRICE_ID_EBOOK=
```

- [ ] **Step 6: Commit**

```bash
git add .env.example .env.local.example src/lib/stripe/planos.ts src/lib/stripe/planos.test.ts
git commit -m "feat(ebook): adiciona STRIPE_PRICE_ID_EBOOK e helpers de configuração

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Bucket privado `ebooks` no Supabase Storage

**Files:**
- Create: `supabase/migrations/20260902120000_bucket_ebooks.sql`

**Interfaces:**
- Produces: bucket `ebooks` (privado, `application/pdf`, limite 10MB) — usado por Task 4 via `createSupabaseAdminClient().storage.from('ebooks')`.

- [ ] **Step 1: Escrever a migration**

```sql
-- 20260902120000_bucket_ebooks.sql
-- Bucket privado para o PDF do ebook "Rose Reset 21 dias" — diferente do
-- bucket 'avatares' (público), este nunca tem leitura pública: o download só
-- é liberado via signed URL de curta duração, depois que o pagamento é
-- confirmado no Stripe (ver /ebook/obrigado). Upload do PDF em si é manual,
-- via Supabase Studio — fora do escopo desta migration.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ebooks', 'ebooks', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;

-- Nenhuma policy de storage.objects criada de propósito: sem policy de
-- select/insert/update/delete, só o service role (que ignora RLS) acessa o
-- bucket. Isso é intencional — o app nunca deixa a usuária final escrever ou
-- listar objetos deste bucket diretamente.
```

- [ ] **Step 2: Rodar a suíte de testes de banco (se houver comando local configurado)**

Run: `npx supabase db reset` (ou o comando de reset local já usado no projeto — checar `package.json` / `README.md` para o script exato antes de rodar)
Expected: migration aplica sem erro, bucket `ebooks` aparece em `storage.buckets`

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260902120000_bucket_ebooks.sql
git commit -m "feat(ebook): cria bucket privado 'ebooks' no Supabase Storage

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: `POST /api/stripe/checkout-ebook`

**Files:**
- Create: `src/app/api/stripe/checkout-ebook/route.ts`
- Test: `src/app/api/stripe/checkout-ebook/route.test.ts`

**Interfaces:**
- Consumes: `obterStripe()` de `@/lib/stripe/client`; `obterPriceIdEbook()`, `obterMoedaELocaleDoPais()`, `obterUnitAmountNaMoeda()` de `@/lib/stripe/planos` (Task 1); `obterUrlBaseDoRequest()` de `@/lib/site-url`.
- Produces: `POST` handler que retorna `{ url: string }` (200) ou `{ erro: string }` (400/503/500) — consumido pelo botão em `EbookClient` (Task 5).

- [ ] **Step 1: Escrever os testes que falham**

```typescript
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { obterStripe } from '@/lib/stripe/client';

vi.mock('@/lib/stripe/client', () => ({
  obterStripe: vi.fn(),
}));

vi.mock('@/lib/site-url', () => ({
  obterUrlBaseDoRequest: vi.fn(async () => 'https://app.exemplo.com'),
}));

function criarStripeFake(opts: {
  createCheckoutSession?: () => unknown;
  retrievePrice?: () => unknown;
}) {
  return {
    checkout: {
      sessions: {
        create: vi.fn(opts.createCheckoutSession ?? (async () => ({ url: 'https://checkout.stripe.com/sessao-ebook' }))),
      },
    },
    prices: {
      retrieve: vi.fn(
        opts.retrievePrice ??
          (async () => ({
            currency: 'brl',
            unit_amount: 2700,
            currency_options: { brl: { unit_amount: 2700 }, eur: { unit_amount: 499 } },
          }))
      ),
    },
  };
}

beforeEach(() => {
  vi.mocked(obterStripe).mockReset();
  vi.stubEnv('STRIPE_PRICE_ID_EBOOK', 'price_ebook_teste');
});

describe('POST /api/stripe/checkout-ebook', () => {
  it('cria a Checkout Session em mode payment, sem customer, e retorna a url', async () => {
    const stripeFake = criarStripeFake({});
    vi.mocked(obterStripe).mockReturnValue(stripeFake as never);

    const resposta = await POST(new Request('http://localhost/api/stripe/checkout-ebook', { method: 'POST' }));
    const corpo = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(corpo.url).toBe('https://checkout.stripe.com/sessao-ebook');
    expect(stripeFake.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        line_items: [{ price: 'price_ebook_teste', quantity: 1 }],
        success_url: 'https://app.exemplo.com/ebook/obrigado?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'https://app.exemplo.com/ebook',
      })
    );
    expect(stripeFake.checkout.sessions.create).not.toHaveBeenCalledWith(
      expect.objectContaining({ customer: expect.anything() })
    );
  });

  it('retorna 503 quando Stripe não está configurado', async () => {
    vi.mocked(obterStripe).mockReturnValue(null);

    const resposta = await POST(new Request('http://localhost/api/stripe/checkout-ebook', { method: 'POST' }));

    expect(resposta.status).toBe(503);
  });

  it('retorna 503 quando STRIPE_PRICE_ID_EBOOK não está configurado', async () => {
    vi.stubEnv('STRIPE_PRICE_ID_EBOOK', '');
    vi.mocked(obterStripe).mockReturnValue(criarStripeFake({}) as never);

    const resposta = await POST(new Request('http://localhost/api/stripe/checkout-ebook', { method: 'POST' }));

    expect(resposta.status).toBe(503);
  });

  it('retorna 500 quando a criação da sessão falha no Stripe', async () => {
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    const stripeFake = criarStripeFake({
      createCheckoutSession: async () => {
        throw new Error('falha de rede');
      },
    });
    vi.mocked(obterStripe).mockReturnValue(stripeFake as never);

    const resposta = await POST(new Request('http://localhost/api/stripe/checkout-ebook', { method: 'POST' }));

    expect(resposta.status).toBe(500);
    spyConsole.mockRestore();
  });
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npx vitest run src/app/api/stripe/checkout-ebook/route.test.ts`
Expected: FAIL (módulo `./route` não existe)

- [ ] **Step 3: Implementar `src/app/api/stripe/checkout-ebook/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import { obterStripe } from '@/lib/stripe/client';
import { obterMoedaELocaleDoPais, obterPriceIdEbook } from '@/lib/stripe/planos';
import { obterUrlBaseDoRequest } from '@/lib/site-url';

// Cria uma Checkout Session avulsa (mode: 'payment') para o ebook "Rose
// Reset 21 dias" — sem autenticação, sem Customer vinculado a conta,
// diferente de /api/stripe/checkout (assinatura, exige usuária logada). Não
// há país confirmado (sem perfil), então usa o fallback padrão de
// obterMoedaELocaleDoPais (Portugal/EUR) — o Stripe Checkout também detecta
// o país do cartão e pode ajustar a exibição por conta própria.
export async function POST() {
  const stripe = obterStripe();
  if (!stripe) {
    return NextResponse.json({ erro: 'Loja ainda não está disponível.' }, { status: 503 });
  }

  const priceId = obterPriceIdEbook();
  if (!priceId) {
    return NextResponse.json({ erro: 'O ebook ainda não está disponível.' }, { status: 503 });
  }

  const { locale } = obterMoedaELocaleDoPais(null);
  const siteUrl = await obterUrlBaseDoRequest();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      locale,
      success_url: `${siteUrl}/ebook/obrigado?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/ebook`,
    });

    if (!session.url) {
      return NextResponse.json({ erro: 'Não foi possível iniciar a compra agora.' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (erro) {
    console.error('[stripe/checkout-ebook] falha ao criar sessão de checkout', {
      message: erro instanceof Error ? erro.message : 'erro desconhecido',
    });
    return NextResponse.json({ erro: 'Não foi possível iniciar a compra agora. Tente novamente.' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npx vitest run src/app/api/stripe/checkout-ebook/route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/stripe/checkout-ebook/route.ts src/app/api/stripe/checkout-ebook/route.test.ts
git commit -m "feat(ebook): cria rota de checkout avulso do ebook, sem autenticação

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: Helper `obterDownloadEbook` (confirma pagamento + gera signed URL)

**Files:**
- Create: `src/lib/stripe/ebook.ts`
- Test: `src/lib/stripe/ebook.test.ts`

**Interfaces:**
- Consumes: `Stripe` (instância, passada como parâmetro — mesmo padrão de `buscarPrecoDetalhado` em `planos.ts`, que recebe `stripe` em vez de chamar `obterStripe()` internamente, facilitando teste); `createSupabaseAdminClient()` de `@/lib/supabase/admin`.
- Produces: `obterDownloadEbook(stripe: Stripe, sessionId: string): Promise<{ confirmado: boolean; urlDownload: string | null }>` — consumido pela página `/ebook/obrigado` (Task 6).

- [ ] **Step 1: Escrever os testes que falham**

```typescript
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { obterDownloadEbook } from './ebook';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

vi.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: vi.fn(),
}));

function criarStripeFake(session: { payment_status: string }) {
  return {
    checkout: {
      sessions: { retrieve: vi.fn(async () => session) },
    },
  };
}

function criarAdminFake(signedUrlResultado: { data: { signedUrl: string } | null; error: unknown }) {
  return {
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: vi.fn(async () => signedUrlResultado),
      })),
    },
  };
}

beforeEach(() => {
  vi.mocked(createSupabaseAdminClient).mockReset();
});

describe('obterDownloadEbook', () => {
  it('retorna confirmado=true e a signed url quando o pagamento está pago', async () => {
    const stripeFake = criarStripeFake({ payment_status: 'paid' });
    const adminFake = criarAdminFake({ data: { signedUrl: 'https://storage.exemplo.com/assinada' }, error: null });
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);

    const resultado = await obterDownloadEbook(stripeFake as never, 'cs_teste_pago');

    expect(resultado).toEqual({ confirmado: true, urlDownload: 'https://storage.exemplo.com/assinada' });
  });

  it('retorna confirmado=false quando o pagamento não está pago', async () => {
    const stripeFake = criarStripeFake({ payment_status: 'unpaid' });

    const resultado = await obterDownloadEbook(stripeFake as never, 'cs_teste_nao_pago');

    expect(resultado).toEqual({ confirmado: false, urlDownload: null });
  });

  it('retorna confirmado=false quando o Stripe lança erro ao buscar a sessão (session_id inválido/forjado)', async () => {
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    const stripeFake = { checkout: { sessions: { retrieve: vi.fn(async () => { throw new Error('No such checkout session'); }) } } };

    const resultado = await obterDownloadEbook(stripeFake as never, 'cs_forjado');

    expect(resultado).toEqual({ confirmado: false, urlDownload: null });
    spyConsole.mockRestore();
  });

  it('retorna confirmado=true mas urlDownload=null quando pago mas a signed url falha', async () => {
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    const stripeFake = criarStripeFake({ payment_status: 'paid' });
    const adminFake = criarAdminFake({ data: null, error: { message: 'objeto não encontrado' } });
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);

    const resultado = await obterDownloadEbook(stripeFake as never, 'cs_teste_pago');

    expect(resultado).toEqual({ confirmado: true, urlDownload: null });
    spyConsole.mockRestore();
  });
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npx vitest run src/lib/stripe/ebook.test.ts`
Expected: FAIL (módulo `./ebook` não existe)

- [ ] **Step 3: Implementar `src/lib/stripe/ebook.ts`**

```typescript
import type Stripe from 'stripe';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const NOME_ARQUIVO_EBOOK = 'rose-reset-21-dias.pdf';
const SEGUNDOS_EXPIRACAO_SIGNED_URL = 600; // 10 minutos

// Confirma no Stripe (fonte de verdade) que a Checkout Session foi paga e,
// se sim, gera uma signed URL de curta duração para o PDF no bucket privado
// 'ebooks'. Não há usuária/conta para checar posse da sessão — diferente de
// /api/stripe/confirmar-pagamento (funil de assinatura) — porque o
// session_id do Stripe já não é adivinhável, o que é prova de posse
// suficiente para este produto de baixo valor sem conta.
export async function obterDownloadEbook(
  stripe: Stripe,
  sessionId: string
): Promise<{ confirmado: boolean; urlDownload: string | null }> {
  let confirmado: boolean;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    confirmado = session.payment_status === 'paid';
  } catch (erro) {
    console.error('[stripe/ebook] falha ao consultar a sessão de checkout', {
      message: erro instanceof Error ? erro.message : 'erro desconhecido',
    });
    return { confirmado: false, urlDownload: null };
  }

  if (!confirmado) {
    return { confirmado: false, urlDownload: null };
  }

  const adminClient = createSupabaseAdminClient();
  if (!adminClient) {
    console.error('[stripe/ebook] admin client indisponível ao gerar signed url');
    return { confirmado: true, urlDownload: null };
  }

  const { data, error } = await adminClient.storage
    .from('ebooks')
    .createSignedUrl(NOME_ARQUIVO_EBOOK, SEGUNDOS_EXPIRACAO_SIGNED_URL);

  if (error || !data) {
    console.error('[stripe/ebook] falha ao gerar signed url', {
      message: error instanceof Error ? error.message : String(error),
    });
    return { confirmado: true, urlDownload: null };
  }

  return { confirmado: true, urlDownload: data.signedUrl };
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npx vitest run src/lib/stripe/ebook.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/stripe/ebook.ts src/lib/stripe/ebook.test.ts
git commit -m "feat(ebook): adiciona obterDownloadEbook (confirma pagamento + signed url)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: Página `/ebook` (landing de vendas)

**Files:**
- Create: `public/rose-ebook-capa.png` (mover de `rose_sem_depoimento.png`, na raiz do repo, já fornecido)
- Create: `src/app/ebook/page.tsx` (Server Component — busca preço)
- Create: `src/app/ebook/EbookClient.tsx` (Client Component — botão + chamada à API)
- Test: `src/app/ebook/EbookClient.test.tsx`

**Interfaces:**
- Consumes: `obterStripe()`, `buscarPrecoExibicao()`, `obterMoedaELocaleDoPais()`, `obterPriceIdEbook()`, `ebookConfigurado()` de `@/lib/stripe/planos`/`@/lib/stripe/client` (Task 1); componente `Botao` de `@/app/components/Botao`.
- Produces: rota `/ebook` navegável; `EbookClient` consome `POST /api/stripe/checkout-ebook` (Task 3) e faz `window.location.href = url` no sucesso.

- [ ] **Step 1: Mover a imagem da Rose para `public/`**

```bash
git mv rose_sem_depoimento.png public/rose-ebook-capa.png
```

(Se `git mv` falhar por o arquivo estar untracked, usar `mv` do shell e depois `git add public/rose-ebook-capa.png`.)

- [ ] **Step 2: Escrever o teste que falha para `EbookClient`**

```typescript
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EbookClient from './EbookClient';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

beforeEach(() => {
  mockPush.mockReset();
  global.fetch = vi.fn();
});

describe('EbookClient', () => {
  it('redireciona para a url de checkout quando a API retorna sucesso', async () => {
    const originalLocation = window.location;
    // @ts-expect-error -- substituição controlada só para este teste, restaurada no final
    delete window.location;
    window.location = { ...originalLocation, href: '' } as Location;

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://checkout.stripe.com/sessao-ebook' }),
    } as Response);

    render(<EbookClient precoExibicao="R$ 27,00" />);
    fireEvent.click(screen.getByRole('button', { name: /quero o ebook/i }));

    await waitFor(() => {
      expect(window.location.href).toBe('https://checkout.stripe.com/sessao-ebook');
    });

    window.location = originalLocation;
  });

  it('mostra mensagem de erro quando a API falha', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ erro: 'O ebook ainda não está disponível.' }),
    } as Response);

    render(<EbookClient precoExibicao="R$ 27,00" />);
    fireEvent.click(screen.getByRole('button', { name: /quero o ebook/i }));

    expect(await screen.findByText('O ebook ainda não está disponível.')).toBeInTheDocument();
  });

  it('desabilita o botão enquanto a compra está em andamento', async () => {
    let resolverFetch: (value: unknown) => void = () => {};
    vi.mocked(global.fetch).mockReturnValue(
      new Promise((resolve) => {
        resolverFetch = resolve;
      }) as never
    );

    render(<EbookClient precoExibicao="R$ 27,00" />);
    const botao = screen.getByRole('button', { name: /quero o ebook/i });
    fireEvent.click(botao);

    expect(botao).toBeDisabled();

    resolverFetch({ ok: true, json: async () => ({ url: 'https://checkout.stripe.com/x' }) });
  });
});
```

Checar `src/app/comecar/resultado/ResultadoClient.test.tsx` antes deste passo para confirmar o ambiente de teste (`@testing-library/react`, mocks de `next/navigation`) já configurado no projeto e ajustar imports se o padrão for ligeiramente diferente.

- [ ] **Step 3: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/app/ebook/EbookClient.test.tsx`
Expected: FAIL (módulo `./EbookClient` não existe)

- [ ] **Step 4: Implementar `src/app/ebook/EbookClient.tsx`**

```typescript
'use client';

import { useState } from 'react';
import Botao from '@/app/components/Botao';

export default function EbookClient({ precoExibicao }: { precoExibicao: string | null }) {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function comprar() {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await fetch('/api/stripe/checkout-ebook', { method: 'POST' });
      const corpo = await resposta.json();
      if (!resposta.ok || !corpo.url) {
        setErro(corpo.erro ?? 'Não foi possível iniciar a compra agora.');
        setCarregando(false);
        return;
      }
      window.location.href = corpo.url;
    } catch {
      setErro('Não foi possível iniciar a compra agora. Tente novamente.');
      setCarregando(false);
    }
  }

  return (
    <div className="space-y-3">
      <Botao type="button" onClick={comprar} disabled={carregando}>
        {carregando ? 'Abrindo pagamento...' : `Quero o ebook${precoExibicao ? ` — ${precoExibicao}` : ''}`}
      </Botao>
      {erro && (
        <p role="alert" className="text-center text-sm text-red-600">
          {erro}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Rodar o teste e confirmar que passa**

Run: `npx vitest run src/app/ebook/EbookClient.test.tsx`
Expected: PASS

- [ ] **Step 6: Implementar `src/app/ebook/page.tsx`**

```typescript
import { obterStripe } from '@/lib/stripe/client';
import { buscarPrecoExibicao, ebookConfigurado, obterMoedaELocaleDoPais, obterPriceIdEbook } from '@/lib/stripe/planos';
import EbookClient from './EbookClient';

// Sem conta/país confirmado nesta rota (compra sem login) — mesma decisão
// já usada em /comecar/resultado: exibe o preço em BRL como padrão. O
// Stripe Checkout ainda pode ajustar a cobrança pelo país real do cartão.
export default async function EbookPage() {
  let precoExibicao: string | null = null;

  if (ebookConfigurado()) {
    const stripe = obterStripe();
    if (stripe) {
      const { moeda } = obterMoedaELocaleDoPais('BR');
      precoExibicao = await buscarPrecoExibicao(stripe, obterPriceIdEbook(), moeda);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <img src="/rose-ebook-capa.png" alt="Capa do ebook Rose Reset 21 dias" className="mx-auto w-48 rounded-2xl shadow-lg" />

      <div className="space-y-2.5 text-center">
        <h1 className="font-display text-[1.75rem] font-medium leading-tight tracking-tight text-texto sm:text-3xl">
          Rose Reset: 21 dias para se reconectar com você mesma
        </h1>
        <p className="leading-relaxed text-texto-suave">
          Um guia passo a passo, direto ao ponto, para sair do piloto automático e recomeçar sua relação com o
          autocuidado — sem dieta, sem culpa, sem depender de mais ninguém.
        </p>
      </div>

      <div className="space-y-2 rounded-2xl border border-borda bg-superficie/70 p-4 text-sm text-texto">
        <p className="font-semibold">O que você recebe:</p>
        <ul className="space-y-1.5">
          <li>✓ 21 práticas guiadas, uma por dia</li>
          <li>✓ Formato PDF, leia no seu ritmo, no celular ou impresso</li>
          <li>✓ Acesso imediato após a compra</li>
        </ul>
      </div>

      <EbookClient precoExibicao={precoExibicao} />

      <p className="text-center text-xs text-texto-suave">Pagamento seguro. Acesso liberado na hora.</p>
    </main>
  );
}
```

- [ ] **Step 7: Verificação manual no navegador**

Rodar o dev server e visitar `/ebook`. Confirmar que a página renderiza sem erros mesmo com `STRIPE_PRICE_ID_EBOOK` ausente (preço aparece vazio, mas a página não quebra).

- [ ] **Step 8: Commit**

```bash
git add public/rose-ebook-capa.png src/app/ebook/page.tsx src/app/ebook/EbookClient.tsx src/app/ebook/EbookClient.test.tsx
git commit -m "feat(ebook): cria landing page de vendas em /ebook

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: Página `/ebook/obrigado` (confirmação + download)

**Files:**
- Create: `src/app/ebook/obrigado/page.tsx` (Server Component)
- Test: `src/app/ebook/obrigado/page.test.tsx`

**Interfaces:**
- Consumes: `obterStripe()` de `@/lib/stripe/client`; `obterDownloadEbook()` de `@/lib/stripe/ebook` (Task 4).
- Produces: rota `/ebook/obrigado?session_id=...` — destino do `success_url` criado em Task 3.

- [ ] **Step 1: Escrever o teste que falha**

Checar primeiro se existe algum teste de Server Component assíncrono no projeto (ex.: buscar por `page.test.tsx` dentro de `src/app/comecar/`) para confirmar o padrão de teste usado (provavelmente renderiza o resultado da função async diretamente, sem `render()` de testing-library, já que é Server Component puro). Ajustar a estrutura abaixo ao padrão encontrado; se não houver precedente direto, testar chamando a função da página como uma função async comum e inspecionando o JSX retornado com `@testing-library/react`'s `render` (Server Components async podem ser `await`ados e passados a `render` em Next.js + Vitest com `@vitejs/plugin-react`).

```typescript
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import EbookObrigadoPage from './page';
import { obterStripe } from '@/lib/stripe/client';
import { obterDownloadEbook } from '@/lib/stripe/ebook';

vi.mock('@/lib/stripe/client', () => ({
  obterStripe: vi.fn(),
}));

vi.mock('@/lib/stripe/ebook', () => ({
  obterDownloadEbook: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(obterStripe).mockReset();
  vi.mocked(obterDownloadEbook).mockReset();
});

describe('/ebook/obrigado', () => {
  it('mostra o link de download quando o pagamento está confirmado', async () => {
    vi.mocked(obterStripe).mockReturnValue({} as never);
    vi.mocked(obterDownloadEbook).mockResolvedValue({
      confirmado: true,
      urlDownload: 'https://storage.exemplo.com/assinada',
    });

    const jsx = await EbookObrigadoPage({ searchParams: Promise.resolve({ session_id: 'cs_pago' }) });
    render(jsx);

    const link = screen.getByRole('link', { name: /baixar meu ebook/i });
    expect(link).toHaveAttribute('href', 'https://storage.exemplo.com/assinada');
  });

  it('mostra mensagem genérica quando não há session_id', async () => {
    const jsx = await EbookObrigadoPage({ searchParams: Promise.resolve({}) });
    render(jsx);

    expect(screen.getByText(/não encontramos sua compra/i)).toBeInTheDocument();
    expect(obterDownloadEbook).not.toHaveBeenCalled();
  });

  it('mostra mensagem genérica quando o pagamento não está confirmado', async () => {
    vi.mocked(obterStripe).mockReturnValue({} as never);
    vi.mocked(obterDownloadEbook).mockResolvedValue({ confirmado: false, urlDownload: null });

    const jsx = await EbookObrigadoPage({ searchParams: Promise.resolve({ session_id: 'cs_nao_pago' }) });
    render(jsx);

    expect(screen.getByText(/não encontramos sua compra/i)).toBeInTheDocument();
  });

  it('mostra mensagem de contato quando confirmado mas a signed url falhou', async () => {
    vi.mocked(obterStripe).mockReturnValue({} as never);
    vi.mocked(obterDownloadEbook).mockResolvedValue({ confirmado: true, urlDownload: null });

    const jsx = await EbookObrigadoPage({ searchParams: Promise.resolve({ session_id: 'cs_pago' }) });
    render(jsx);

    expect(screen.getByText(/entre em contato/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/app/ebook/obrigado/page.test.tsx`
Expected: FAIL (módulo `./page` não existe)

- [ ] **Step 3: Implementar `src/app/ebook/obrigado/page.tsx`**

```typescript
import { obterStripe } from '@/lib/stripe/client';
import { obterDownloadEbook } from '@/lib/stripe/ebook';

export default async function EbookObrigadoPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  let confirmado = false;
  let urlDownload: string | null = null;

  if (sessionId) {
    const stripe = obterStripe();
    if (stripe) {
      const resultado = await obterDownloadEbook(stripe, sessionId);
      confirmado = resultado.confirmado;
      urlDownload = resultado.urlDownload;
    }
  }

  if (!confirmado) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="font-display text-2xl font-medium text-texto">Não encontramos sua compra</h1>
        <p className="text-texto-suave">
          Se você acabou de pagar, aguarde alguns segundos e recarregue a página. Se o problema continuar, entre em
          contato pelo email de suporte.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="font-display text-2xl font-medium text-texto">Sua compra foi confirmada!</h1>

      {urlDownload ? (
        <a
          href={urlDownload}
          className="w-full rounded-2xl bg-acao p-3 text-center font-medium text-white transition-colors hover:bg-acao/90"
        >
          Baixar meu ebook
        </a>
      ) : (
        <p className="text-texto-suave">
          Seu pagamento foi confirmado, mas não conseguimos gerar o link de download agora. Entre em contato pelo
          email de suporte que resolvemos rapidinho.
        </p>
      )}

      <div className="mt-4 space-y-2 rounded-2xl border border-borda bg-superficie/70 p-4 text-sm text-texto-suave">
        <p>Gostou? O Rose Pro leva sua transformação ainda mais longe, com jornadas guiadas todo dia.</p>
        <a href="/comecar" className="font-medium text-acao underline">
          Conhecer o Rose Pro
        </a>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run src/app/ebook/obrigado/page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/ebook/obrigado/page.tsx src/app/ebook/obrigado/page.test.tsx
git commit -m "feat(ebook): cria página /ebook/obrigado com confirmação e download

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 7: Verificação end-to-end manual

**Files:** nenhum arquivo novo — só verificação.

- [ ] **Step 1: Rodar a suíte completa**

Run: `npx vitest run`
Expected: todos os testes passam, incluindo os das Tasks 1-6

- [ ] **Step 2: Rodar o dev server e testar o fluxo com Stripe em modo teste**

Pré-requisito: usuário já deve ter criado o Price avulso no painel do Stripe (modo teste) e configurado `STRIPE_PRICE_ID_EBOOK` no `.env.local`, além de fazer upload manual do PDF (`rose-reset-21-dias.pdf`) no bucket `ebooks` via Supabase Studio.

1. Visitar `/ebook` — confirmar que o preço aparece e a imagem da Rose carrega.
2. Clicar em "Quero o ebook" — confirmar redirecionamento para o Checkout do Stripe.
3. Pagar com um cartão de teste do Stripe (ex.: `4242 4242 4242 4242`).
4. Confirmar redirecionamento para `/ebook/obrigado?session_id=...` com o link "Baixar meu ebook" funcional.
5. Clicar em "Cancelar" no Checkout (em uma segunda tentativa) — confirmar que volta para `/ebook`.
6. Visitar `/ebook/obrigado` sem `session_id` — confirmar a mensagem genérica "Não encontramos sua compra".

- [ ] **Step 3: Rodar lint/typecheck do projeto**

Run: `npm run lint` e `npm run build` (ou os comandos equivalentes já configurados em `package.json` — checar antes de rodar)
Expected: sem erros

## Self-Review Notes

- **Cobertura da spec**: bucket privado (Task 2), rota de checkout sem auth (Task 3), confirmação + signed URL (Task 4), landing page sem menção à assinatura (Task 5), página de obrigado com convite leve ao Pro (Task 6) — todas as seções da spec têm task correspondente.
- **Sem tabela de banco nova** — conforme decisão consciente da spec, não criada.
- **Consistência de tipos**: `obterDownloadEbook(stripe, sessionId): Promise<{ confirmado: boolean; urlDownload: string | null }>` é o mesmo shape usado em Task 4 (implementação) e Task 6 (consumo).
- **Nome do arquivo no bucket** (`rose-reset-21-dias.pdf`) é fixado como constante em `ebook.ts` — se o nome real do arquivo enviado ao Storage for diferente, ajustar `NOME_ARQUIVO_EBOOK` antes do deploy.
