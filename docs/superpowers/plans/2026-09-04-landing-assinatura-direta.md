# Landing page de assinatura direta (`/assinatura`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deixar a pessoa assinar o Rose Pro (plano mensal) direto por uma landing page pública (`/assinatura`), sem quiz e sem login prévio, com criação de conta automática após o pagamento.

**Architecture:** Landing pública (Server + Client Component) → nova rota de Checkout sem autenticação (espelha `/api/stripe/checkout-ebook`) → webhook do Stripe ganha um ramo novo que cria/reaproveita a conta via `auth.admin.generateLink`, promove o perfil a `premium` e envia o link de acesso por e-mail (Resend) → página de confirmação que só consulta o Stripe (sem esperar o webhook).

**Tech Stack:** Next.js App Router, TypeScript, Stripe SDK, Supabase (`@supabase/supabase-js` admin client), Resend, Vitest + Testing Library.

## Global Constraints

- Sem plano anual nesta landing — só o mensal (`obterPriceId('mensal')`).
- Sem exigir login nem senha em nenhum momento do funil desta landing.
- Sem cupom promocional (`?promo=`) nesta página.
- Reaproveitar identidade visual existente: tokens (`bg-acao`, `text-texto`, `text-texto-suave`, `font-display`, `border-borda`, `bg-superficie`), `IlustracaoBotanica`, `RosasDecorativas`, `SeloProvaSocial`, `Botao`.
- Moeda/locale fixos em BRL (`obterMoedaELocaleDoPais('BR')`) — não há perfil/país detectável nesta rota.
- Toda função de e-mail (`src/lib/email/*`) retorna `boolean` e nunca lança — falha de e-mail não pode derrubar o webhook.
- Falha ao consultar/gerar dado externo (Stripe, Resend, Supabase Auth) é sempre logada com `console.error` e um prefixo `[modulo/arquivo]`, seguindo o padrão já usado em todo o projeto.

---

## Task 1: E-mail de acesso da assinatura

**Files:**
- Create: `src/lib/email/assinatura.ts`
- Test: `src/lib/email/assinatura.test.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces: `enviarEmailAcessoAssinatura(destinatario: string, urlAcesso: string): Promise<boolean>` — usado pelo webhook (Task 3).

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/lib/email/assinatura.test.ts`:

```ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { enviarEmailAcessoAssinatura } from './assinatura';
import { obterResend } from './client';

vi.mock('./client', () => ({
  obterResend: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(obterResend).mockReset();
});

describe('enviarEmailAcessoAssinatura', () => {
  it('envia o e-mail com o link de acesso e retorna true', async () => {
    const send = vi.fn(async () => ({ data: { id: 'email-1' }, error: null }));
    vi.mocked(obterResend).mockReturnValue({ emails: { send } } as never);

    const resultado = await enviarEmailAcessoAssinatura(
      'cliente@exemplo.com',
      'https://app.exemplo.com/auth/callback?token=abc'
    );

    expect(resultado).toBe(true);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'cliente@exemplo.com',
        subject: expect.any(String),
        html: expect.stringContaining('https://app.exemplo.com/auth/callback?token=abc'),
      })
    );
  });

  it('retorna false e loga quando o Resend não está configurado', async () => {
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(obterResend).mockReturnValue(null);

    const resultado = await enviarEmailAcessoAssinatura('cliente@exemplo.com', 'https://app.exemplo.com/link');

    expect(resultado).toBe(false);
    spyConsole.mockRestore();
  });

  it('retorna false e loga quando o Resend retorna erro', async () => {
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    const send = vi.fn(async () => ({ data: null, error: { message: 'falha simulada' } }));
    vi.mocked(obterResend).mockReturnValue({ emails: { send } } as never);

    const resultado = await enviarEmailAcessoAssinatura('cliente@exemplo.com', 'https://app.exemplo.com/link');

    expect(resultado).toBe(false);
    spyConsole.mockRestore();
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/lib/email/assinatura.test.ts`
Expected: FAIL com "Failed to resolve import './assinatura'" (o arquivo ainda não existe).

- [ ] **Step 3: Implementar `src/lib/email/assinatura.ts`**

```ts
import { obterResend } from './client';

const REMETENTE =
  process.env.EMAIL_REMETENTE_ASSINATURA ?? process.env.EMAIL_REMETENTE_EBOOK ?? 'Rose <onboarding@resend.dev>';

// Disparado pelo webhook do Stripe (checkout.session.completed,
// metadata.origem === 'assinatura_landing') assim que a conta é criada (ou
// reaproveitada) e o perfil promovido a premium. Igual a
// enviarEmailDownloadEbook: retorna boolean em vez de lançar — falha no
// envio não deve derrubar o processamento do webhook, só fica registrada no
// log pra acompanhamento manual.
export async function enviarEmailAcessoAssinatura(destinatario: string, urlAcesso: string): Promise<boolean> {
  const resend = obterResend();
  if (!resend) {
    console.error('[email/assinatura] Resend não configurado (RESEND_API_KEY ausente), e-mail não enviado.');
    return false;
  }

  const { error } = await resend.emails.send({
    from: REMETENTE,
    to: destinatario,
    subject: 'Sua assinatura Rose Pro está ativa 🌷',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #3a2e2e;">
        <h1 style="font-size: 20px;">Sua assinatura foi ativada!</h1>
        <p>Obrigada por assinar o <strong>Rose Pro</strong>. Use o link abaixo para acessar sua conta:</p>
        <p style="margin: 24px 0;">
          <a href="${urlAcesso}" style="background: #d6336c; color: #ffffff; padding: 12px 20px; border-radius: 16px; text-decoration: none; font-weight: 600;">
            Acessar minha conta
          </a>
        </p>
        <p style="font-size: 13px; color: #6b5b5b;">
          Se o botão não funcionar, copie e cole este link no navegador:<br />
          <a href="${urlAcesso}">${urlAcesso}</a>
        </p>
        <p style="font-size: 13px; color: #6b5b5b;">
          Se o link não funcionar ou já tiver expirado, entre em <a href="https://app.exemplo.com/login">app.exemplo.com/login</a>
          com o mesmo e-mail desta compra — a gente te envia um novo código de acesso na hora.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error('[email/assinatura] falha ao enviar e-mail de acesso', { message: error.message, destinatario });
    return false;
  }

  return true;
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run src/lib/email/assinatura.test.ts`
Expected: PASS (3 testes)

- [ ] **Step 5: Documentar a variável de ambiente opcional**

Em `.env.example`, logo abaixo da linha `EMAIL_REMETENTE_EBOOK=...`, adicionar:

```
# Remetente do e-mail de acesso pós-compra da landing /assinatura. Opcional
# — sem esta variável, usa o mesmo remetente do e-mail do ebook.
EMAIL_REMETENTE_ASSINATURA=Rose <onboarding@resend.dev>
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/email/assinatura.ts src/lib/email/assinatura.test.ts .env.example
git commit -m "feat(assinatura): adiciona e-mail de acesso pos-compra da landing"
```

---

## Task 2: Rota pública de checkout da assinatura

**Files:**
- Create: `src/app/api/stripe/checkout-assinatura/route.ts`
- Test: `src/app/api/stripe/checkout-assinatura/route.test.ts`

**Interfaces:**
- Consumes: `obterStripe()` de `@/lib/stripe/client`; `obterMoedaELocaleDoPais`, `obterPriceId`, `obterUnitAmountNaMoeda` de `@/lib/stripe/planos`; `obterUrlBaseDoRequest()` de `@/lib/site-url`.
- Produces: `POST` que retorna `{ url: string }` (200) ou `{ erro: string }` (503/500) — consumido pelo `AssinaturaClient` (Task 4).

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/app/api/stripe/checkout-assinatura/route.test.ts`:

```ts
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

const PRECO_MENSAL = {
  currency: 'brl',
  unit_amount: 3999,
  currency_options: { brl: { unit_amount: 3999 }, eur: { unit_amount: 999 } },
};

function criarStripeFake(opts: {
  createCheckoutSession?: () => unknown;
  retrievePrice?: () => unknown;
}) {
  return {
    checkout: {
      sessions: {
        create: vi.fn(
          opts.createCheckoutSession ?? (async () => ({ url: 'https://checkout.stripe.com/sessao-assinatura' }))
        ),
      },
    },
    prices: {
      retrieve: vi.fn(async () => (opts.retrievePrice ? opts.retrievePrice() : PRECO_MENSAL)),
    },
  };
}

beforeEach(() => {
  vi.mocked(obterStripe).mockReset();
  vi.stubEnv('STRIPE_PRICE_ID_MENSAL', 'price_mensal_teste');
});

describe('POST /api/stripe/checkout-assinatura', () => {
  it('cria a Checkout Session em mode subscription, sem customer, e retorna a url', async () => {
    const stripeFake = criarStripeFake({});
    vi.mocked(obterStripe).mockReturnValue(stripeFake as never);

    const resposta = await POST();
    const corpo = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(corpo.url).toBe('https://checkout.stripe.com/sessao-assinatura');
    expect(stripeFake.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        line_items: [{ price: 'price_mensal_teste', quantity: 1 }],
        currency: 'brl',
        success_url: 'https://app.exemplo.com/assinatura/obrigado?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'https://app.exemplo.com/assinatura',
        metadata: { origem: 'assinatura_landing' },
      })
    );
    expect(stripeFake.checkout.sessions.create).not.toHaveBeenCalledWith(
      expect.objectContaining({ customer: expect.anything() })
    );
  });

  it('retorna 503 quando Stripe não está configurado', async () => {
    vi.mocked(obterStripe).mockReturnValue(null);

    const resposta = await POST();

    expect(resposta.status).toBe(503);
  });

  it('retorna 503 quando STRIPE_PRICE_ID_MENSAL não está configurado', async () => {
    vi.stubEnv('STRIPE_PRICE_ID_MENSAL', '');
    vi.mocked(obterStripe).mockReturnValue(criarStripeFake({}) as never);

    const resposta = await POST();

    expect(resposta.status).toBe(503);
  });

  it('recusa o checkout quando o Price não tem currency_options para a moeda esperada', async () => {
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    const stripeFake = criarStripeFake({
      retrievePrice: () => ({ currency: 'eur', unit_amount: 999, currency_options: { eur: { unit_amount: 999 } } }),
    });
    vi.mocked(obterStripe).mockReturnValue(stripeFake as never);

    const resposta = await POST();
    const corpo = await resposta.json();

    expect(resposta.status).toBe(503);
    expect(corpo.erro).toBeTruthy();
    expect(stripeFake.checkout.sessions.create).not.toHaveBeenCalled();
    spyConsole.mockRestore();
  });

  it('retorna 500 quando a criação da sessão falha no Stripe', async () => {
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    const stripeFake = criarStripeFake({
      createCheckoutSession: async () => {
        throw new Error('falha de rede');
      },
    });
    vi.mocked(obterStripe).mockReturnValue(stripeFake as never);

    const resposta = await POST();

    expect(resposta.status).toBe(500);
    spyConsole.mockRestore();
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/app/api/stripe/checkout-assinatura/route.test.ts`
Expected: FAIL com "Failed to resolve import './route'" (o arquivo ainda não existe).

- [ ] **Step 3: Implementar `src/app/api/stripe/checkout-assinatura/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { obterStripe } from '@/lib/stripe/client';
import { obterMoedaELocaleDoPais, obterPriceId, obterUnitAmountNaMoeda } from '@/lib/stripe/planos';
import { obterUrlBaseDoRequest } from '@/lib/site-url';

// Cria uma Checkout Session de assinatura (mode: 'subscription') sem
// autenticação, para a landing pública /assinatura (tráfego de anúncio que
// já quer assinar direto, sem passar pelo quiz/login antes). Diferente de
// /api/stripe/checkout (exige usuária logada, cria Customer vinculado à
// conta): aqui não existe conta ainda — o Stripe Checkout coleta o e-mail
// nativamente e o webhook cria a conta depois do pagamento confirmado (ver
// /api/stripe/webhook, metadata.origem === 'assinatura_landing').
export async function POST() {
  const stripe = obterStripe();
  if (!stripe) {
    return NextResponse.json({ erro: 'Assinatura ainda não está disponível.' }, { status: 503 });
  }

  const priceId = obterPriceId('mensal');
  if (!priceId) {
    return NextResponse.json({ erro: 'Assinatura ainda não está disponível.' }, { status: 503 });
  }

  const { moeda, locale } = obterMoedaELocaleDoPais('BR');
  const siteUrl = await obterUrlBaseDoRequest();

  try {
    // Os Prices são multimoeda (currency_options) — confirma que o Price
    // realmente tem a moeda esperada ANTES de criar a sessão, mesmo cuidado
    // de /api/stripe/checkout e /api/stripe/checkout-ebook.
    const price = await stripe.prices.retrieve(priceId, { expand: ['currency_options'] });
    const unitAmount = obterUnitAmountNaMoeda(price, moeda);
    if (unitAmount === null) {
      console.error('[stripe/checkout-assinatura] price sem currency_options para a moeda esperada', {
        priceId,
        moeda,
      });
      return NextResponse.json({ erro: 'Assinatura ainda não está disponível nessa moeda.' }, { status: 503 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      currency: moeda,
      locale,
      success_url: `${siteUrl}/assinatura/obrigado?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/assinatura`,
      metadata: { origem: 'assinatura_landing' },
    });

    if (!session.url) {
      return NextResponse.json({ erro: 'Não foi possível iniciar a assinatura agora.' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (erro) {
    console.error('[stripe/checkout-assinatura] falha ao criar sessão de checkout', {
      message: erro instanceof Error ? erro.message : 'erro desconhecido',
    });
    return NextResponse.json(
      { erro: 'Não foi possível iniciar a assinatura agora. Tente novamente.' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run src/app/api/stripe/checkout-assinatura/route.test.ts`
Expected: PASS (5 testes)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/stripe/checkout-assinatura
git commit -m "feat(assinatura): adiciona checkout publico de assinatura sem login"
```

---

## Task 3: Webhook — cria conta e promove a premium para a landing

**Files:**
- Modify: `src/app/api/stripe/webhook/route.ts:80-114` (bloco `if (!usuariaId)`)
- Modify: `src/app/api/stripe/webhook/route.test.ts`

**Interfaces:**
- Consumes: `enviarEmailAcessoAssinatura` (Task 1); `obterUrlBaseDoRequest` de `@/lib/site-url`; `adminClient.auth.admin.generateLink({ type, email, options: { redirectTo } })` retornando `{ data: { user: { id } | null, properties: { action_link } } | null, error }`.

- [ ] **Step 1: Escrever os testes que falham**

Em `src/app/api/stripe/webhook/route.test.ts`, adicionar os mocks novos no topo do arquivo (junto aos `vi.mock` existentes):

```ts
vi.mock('@/lib/email/assinatura', () => ({
  enviarEmailAcessoAssinatura: vi.fn(async () => true),
}));

vi.mock('@/lib/site-url', () => ({
  obterUrlBaseDoRequest: vi.fn(async () => 'https://app.exemplo.com'),
}));
```

E os imports correspondentes logo abaixo dos já existentes:

```ts
import { enviarEmailAcessoAssinatura } from '@/lib/email/assinatura';
```

Substituir a função `criarAdminClienteFake` inteira por esta versão (adiciona `auth.admin.generateLink` sem mudar o comportamento de `from` já existente):

```ts
function criarAdminClienteFake(opts: {
  erroIdempotencia?: ErroSimulado;
  erroUpdatePerfil?: ErroSimulado;
  linhasAtualizadas?: Array<{ id: string }> | null;
  generateLinkResultado?: {
    data: { user: { id: string } | null; properties?: { action_link: string } } | null;
    error: ErroSimulado;
  };
}) {
  const chamadasUpdate: unknown[] = [];

  return {
    auth: {
      admin: {
        generateLink: vi.fn(
          async () =>
            opts.generateLinkResultado ?? {
              data: { user: { id: 'user-nova' }, properties: { action_link: 'https://app.exemplo.com/auth/callback?token=abc' } },
              error: null,
            }
        ),
      },
    },
    from: vi.fn((tabela: string) => {
      if (tabela === 'stripe_eventos_processados') {
        return {
          insert: vi.fn(async () => ({ error: opts.erroIdempotencia ?? null })),
        };
      }

      if (tabela === 'perfis') {
        return {
          update: vi.fn((payload: unknown) => {
            chamadasUpdate.push(payload);
            return {
              eq: vi.fn(() => ({
                select: vi.fn(async () => ({
                  data: opts.linhasAtualizadas ?? [{ id: 'user-1' }],
                  error: opts.erroUpdatePerfil ?? null,
                })),
              })),
            };
          }),
        };
      }

      throw new Error(`tabela inesperada em teste: ${tabela}`);
    }),
    __chamadasUpdate: chamadasUpdate,
  };
}
```

Adicionar a fixture e o `describe` novos no fim do arquivo, antes do último `});` de fechamento do `describe('POST /api/stripe/webhook', ...)`:

```ts
const EVENTO_CHECKOUT_ASSINATURA_LANDING = {
  id: 'evt_checkout_assinatura',
  type: 'checkout.session.completed',
  data: {
    object: {
      metadata: { origem: 'assinatura_landing' },
      client_reference_id: null,
      customer: 'cus_nova',
      subscription: 'sub_nova',
      payment_status: 'paid',
      customer_details: { email: 'cliente@exemplo.com' },
    },
  },
};
```

```ts
  describe('checkout.session.completed com origem assinatura_landing', () => {
    it('gera o link de acesso, promove o perfil a premium e envia o e-mail', async () => {
      const stripeFake = criarStripeFake(EVENTO_CHECKOUT_ASSINATURA_LANDING);
      const adminFake = criarAdminClienteFake({});
      vi.mocked(obterStripe).mockReturnValue(stripeFake as never);
      vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);

      const resposta = await POST(criarRequisicao());
      const corpo = await resposta.json();

      expect(resposta.status).toBe(200);
      expect(corpo).toEqual({ recebido: true, duplicado: false });
      expect(adminFake.auth.admin.generateLink).toHaveBeenCalledWith({
        type: 'magiclink',
        email: 'cliente@exemplo.com',
        options: { redirectTo: 'https://app.exemplo.com/auth/callback' },
      });
      expect(adminFake.__chamadasUpdate).toEqual([
        {
          stripe_customer_id: 'cus_nova',
          stripe_subscription_id: 'sub_nova',
          plano: 'premium',
          assinatura_status: 'active',
        },
      ]);
      expect(enviarEmailAcessoAssinatura).toHaveBeenCalledWith(
        'cliente@exemplo.com',
        'https://app.exemplo.com/auth/callback?token=abc'
      );
    });

    it('não atualiza o perfil nem envia e-mail quando generateLink falha', async () => {
      const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
      const stripeFake = criarStripeFake(EVENTO_CHECKOUT_ASSINATURA_LANDING);
      const adminFake = criarAdminClienteFake({
        generateLinkResultado: { data: null, error: { message: 'falha simulada do Supabase' } },
      });
      vi.mocked(obterStripe).mockReturnValue(stripeFake as never);
      vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);
      vi.mocked(enviarEmailAcessoAssinatura).mockClear();

      const resposta = await POST(criarRequisicao());

      expect(resposta.status).toBe(200);
      expect(adminFake.__chamadasUpdate).toHaveLength(0);
      expect(enviarEmailAcessoAssinatura).not.toHaveBeenCalled();
      spyConsole.mockRestore();
    });

    it('loga mas não falha quando o envio do e-mail de acesso falha', async () => {
      const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
      const stripeFake = criarStripeFake(EVENTO_CHECKOUT_ASSINATURA_LANDING);
      const adminFake = criarAdminClienteFake({});
      vi.mocked(obterStripe).mockReturnValue(stripeFake as never);
      vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);
      vi.mocked(enviarEmailAcessoAssinatura).mockResolvedValueOnce(false);

      const resposta = await POST(criarRequisicao());

      expect(resposta.status).toBe(200);
      // O perfil já foi promovido a premium mesmo com falha no e-mail.
      expect(adminFake.__chamadasUpdate).toHaveLength(1);
      spyConsole.mockRestore();
    });
  });
```

- [ ] **Step 2: Rodar os testes novos e confirmar que falham**

Run: `npx vitest run src/app/api/stripe/webhook/route.test.ts`
Expected: FAIL nos 3 testes novos (o webhook ainda trata todo `!usuariaId` como o fluxo do ebook — `generateLink` nunca é chamado, `enviarEmailAcessoAssinatura` nunca é chamado).

- [ ] **Step 3: Implementar o ramo novo em `src/app/api/stripe/webhook/route.ts`**

No topo do arquivo, adicionar os imports:

```ts
import { enviarEmailAcessoAssinatura } from '@/lib/email/assinatura';
import { obterUrlBaseDoRequest } from '@/lib/site-url';
```

Substituir o bloco `if (!usuariaId) { ... }` (linhas 89-114 hoje) por:

```ts
        if (!usuariaId) {
          if (pagamentoConfirmado && !duplicado) {
            const emailCliente = session.customer_details?.email ?? session.customer_email;
            if (!emailCliente) {
              console.error(
                '[stripe/webhook] checkout.session.completed sem e-mail do cliente para processar compra sem conta',
                { sessionId: session.id }
              );
            } else if (session.metadata?.origem === 'assinatura_landing') {
              // Assinatura vendida direto pela landing pública /assinatura,
              // sem login prévio (ver /api/stripe/checkout-assinatura). Não
              // existe usuaria_id na Checkout Session porque a usuária ainda
              // não existia quando a sessão foi criada — cria (ou reaproveita)
              // a conta aqui, via generateLink, e promove a premium.
              const siteUrl = await obterUrlBaseDoRequest();
              const { data: linkData, error: erroLink } = await adminClient.auth.admin.generateLink({
                type: 'magiclink',
                email: emailCliente,
                options: { redirectTo: `${siteUrl}/auth/callback` },
              });

              if (erroLink || !linkData?.user) {
                console.error('[stripe/webhook] falha ao gerar link de acesso para assinatura sem conta', {
                  sessionId: session.id,
                  emailCliente,
                  message: erroLink?.message,
                });
              } else {
                const { data: atualizadoNovo, error: erroUpdatePerfilNovo } = await adminClient
                  .from('perfis')
                  .update({
                    stripe_customer_id: customerId,
                    stripe_subscription_id: subscriptionId ?? null,
                    plano: 'premium' as const,
                    assinatura_status: 'active',
                  })
                  .eq('id', linkData.user.id)
                  .select('id');

                if (erroUpdatePerfilNovo || !atualizadoNovo || atualizadoNovo.length === 0) {
                  console.error('[stripe/webhook] falha ao promover perfil criado via assinatura_landing', {
                    sessionId: session.id,
                    usuariaId: linkData.user.id,
                    message: erroUpdatePerfilNovo?.message,
                  });
                }

                const enviado = await enviarEmailAcessoAssinatura(
                  emailCliente,
                  linkData.properties?.action_link ?? ''
                );
                if (!enviado) {
                  console.error('[stripe/webhook] falha ao enviar e-mail de acesso da assinatura', {
                    sessionId: session.id,
                    emailCliente,
                  });
                }
              }
            } else {
              const urlDownload = await gerarUrlDownloadEbook(adminClient, SEGUNDOS_EXPIRACAO_SIGNED_URL_EMAIL);
              if (!urlDownload) {
                console.error('[stripe/webhook] não foi possível gerar o link do ebook para o e-mail', {
                  sessionId: session.id,
                });
              } else {
                const enviado = await enviarEmailDownloadEbook(emailCliente, urlDownload);
                if (!enviado) {
                  console.error('[stripe/webhook] falha ao enviar e-mail do ebook', {
                    sessionId: session.id,
                    emailCliente,
                  });
                }
              }
            }
          }
          break;
        }
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npx vitest run src/app/api/stripe/webhook/route.test.ts`
Expected: PASS (todos os testes, os 8 anteriores + os 3 novos)

- [ ] **Step 5: Rodar a suíte inteira do projeto para checar por regressão**

Run: `npx vitest run`
Expected: PASS em todos os arquivos de teste

- [ ] **Step 6: Commit**

```bash
git add src/app/api/stripe/webhook/route.ts src/app/api/stripe/webhook/route.test.ts
git commit -m "feat(assinatura): webhook cria conta e ativa premium para landing publica"
```

---

## Task 4: Botão de assinar (Client Component)

**Files:**
- Create: `src/app/assinatura/AssinaturaClient.tsx`
- Test: `src/app/assinatura/AssinaturaClient.test.tsx`

**Interfaces:**
- Consumes: `POST /api/stripe/checkout-assinatura` (Task 2), retornando `{ url }` ou `{ erro }`.
- Produces: componente `<AssinaturaClient precoExibicao={string | null} />` — consumido pela landing (Task 5).

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/app/assinatura/AssinaturaClient.test.tsx`:

```tsx
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AssinaturaClient from './AssinaturaClient';

beforeEach(() => {
  global.fetch = vi.fn();
});

describe('AssinaturaClient', () => {
  it('redireciona para a url de checkout quando a API retorna sucesso', async () => {
    const originalLocation = window.location;
    // @ts-expect-error -- substituição controlada só para este teste, restaurada no final
    delete window.location;
    window.location = { ...originalLocation, href: '' } as unknown as (string & Location);

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://checkout.stripe.com/sessao-assinatura' }),
    } as Response);

    render(<AssinaturaClient precoExibicao="R$ 39,99" />);
    fireEvent.click(screen.getByRole('button', { name: /assinar agora/i }));

    await waitFor(() => {
      expect(window.location.href).toBe('https://checkout.stripe.com/sessao-assinatura');
    });
    expect(global.fetch).toHaveBeenCalledWith('/api/stripe/checkout-assinatura', expect.objectContaining({ method: 'POST' }));

    window.location = originalLocation as unknown as (string & Location);
  });

  it('mostra mensagem de erro quando a API falha', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ erro: 'Assinatura ainda não está disponível.' }),
    } as Response);

    render(<AssinaturaClient precoExibicao="R$ 39,99" />);
    fireEvent.click(screen.getByRole('button', { name: /assinar agora/i }));

    expect(await screen.findByText('Assinatura ainda não está disponível.')).toBeInTheDocument();
  });

  it('desabilita o botão enquanto a compra está em andamento', async () => {
    let resolverFetch: (value: unknown) => void = () => {};
    vi.mocked(global.fetch).mockReturnValue(
      new Promise((resolve) => {
        resolverFetch = resolve;
      }) as never
    );

    render(<AssinaturaClient precoExibicao="R$ 39,99" />);
    const botao = screen.getByRole('button', { name: /assinar agora/i });
    fireEvent.click(botao);

    expect(botao).toBeDisabled();

    resolverFetch({ ok: true, json: async () => ({ url: 'https://checkout.stripe.com/x' }) });
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/app/assinatura/AssinaturaClient.test.tsx`
Expected: FAIL com "Failed to resolve import './AssinaturaClient'" (o arquivo ainda não existe).

- [ ] **Step 3: Implementar `src/app/assinatura/AssinaturaClient.tsx`**

```tsx
'use client';

import { useState } from 'react';
import Botao from '@/app/components/Botao';

export default function AssinaturaClient({ precoExibicao }: { precoExibicao: string | null }) {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function assinar() {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await fetch('/api/stripe/checkout-assinatura', { method: 'POST' });
      const corpo = await resposta.json();
      if (!resposta.ok || !corpo.url) {
        setErro(corpo.erro ?? 'Não foi possível iniciar a assinatura agora.');
        setCarregando(false);
        return;
      }
      window.location.href = corpo.url;
    } catch {
      setErro('Não foi possível iniciar a assinatura agora. Tente novamente.');
      setCarregando(false);
    }
  }

  return (
    <div className="space-y-3">
      {precoExibicao && (
        <p className="text-center font-display text-3xl font-medium tracking-tight text-texto tabular-nums">
          {precoExibicao}
          <span className="text-sm font-sans font-normal text-texto-suave"> /mês</span>
        </p>
      )}
      <Botao type="button" onClick={assinar} disabled={carregando}>
        {carregando ? 'Abrindo pagamento...' : 'Assinar agora'}
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

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run src/app/assinatura/AssinaturaClient.test.tsx`
Expected: PASS (3 testes)

- [ ] **Step 5: Commit**

```bash
git add src/app/assinatura/AssinaturaClient.tsx src/app/assinatura/AssinaturaClient.test.tsx
git commit -m "feat(assinatura): adiciona botao de assinar da landing publica"
```

---

## Task 5: Landing page `/assinatura`

**Files:**
- Create: `src/app/assinatura/page.tsx`

**Interfaces:**
- Consumes: `AssinaturaClient` (Task 4); `obterStripe`, `stripeConfigurado`, `obterMoedaELocaleDoPais`, `obterPriceId`, `buscarPrecoExibicao` de `@/lib/stripe/planos`/`@/lib/stripe/client`; `IlustracaoBotanica`, `RosasDecorativas` de `@/app/components/decoracao`; `SeloProvaSocial` de `@/app/components/inicio`.

- [ ] **Step 1: Implementar `src/app/assinatura/page.tsx`**

Server Component simples — sem teste dedicado (mesmo padrão de `src/app/ebook/page.tsx` e `src/app/comecar/resultado/page.tsx`, cuja lógica de preço/checkout já é coberta pelos testes das Tasks 2 e 4; a página em si só compõe UI estática).

```tsx
import IlustracaoBotanica from '@/app/components/decoracao/IlustracaoBotanica';
import RosasDecorativas from '@/app/components/decoracao/RosasDecorativas';
import SeloProvaSocial from '@/app/components/inicio/SeloProvaSocial';
import { obterStripe } from '@/lib/stripe/client';
import { buscarPrecoExibicao, obterMoedaELocaleDoPais, obterPriceId, stripeConfigurado } from '@/lib/stripe/planos';
import AssinaturaClient from './AssinaturaClient';

// Sem isso, Next.js prerenderia esta página estática no build e o preço
// exibido ficaria congelado no valor de build time — mesmo cuidado de
// /comecar/resultado/page.tsx e /ebook/page.tsx.
export const revalidate = 3600;

const VANTAGENS = [
  'Todas as jornadas guiadas, no seu ritmo',
  'Biblioteca completa de práticas de autocuidado',
  'Insights semanais sobre seus padrões',
  'Conteúdos novos toda semana',
  'Recompensas exclusivas no Clube Rose',
];

// Destino direto para tráfego de anúncio: sem quiz, sem login, só a decisão
// de assinar. Ver docs/superpowers/specs/2026-09-04-landing-assinatura-direta-design.md.
export default async function AssinaturaPage() {
  let precoExibicao: string | null = null;

  if (stripeConfigurado()) {
    const stripe = obterStripe();
    if (stripe) {
      const { moeda } = obterMoedaELocaleDoPais('BR');
      precoExibicao = await buscarPrecoExibicao(stripe, obterPriceId('mensal'), moeda);
    }
  }

  return (
    <main className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 overflow-hidden p-6">
      <div className="resultado-decoracao">
        <IlustracaoBotanica tamanho="compacto" />
        <RosasDecorativas tamanho="compacto" />
      </div>

      <div className="relative flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-creme-rosado/60 px-3.5 py-1.5 text-xs font-semibold text-acao">
          🌷 Rose Pro
        </span>
      </div>

      <div className="relative space-y-2.5">
        <h1 className="text-center font-display text-[1.75rem] font-medium leading-tight tracking-tight text-texto sm:text-3xl">
          Sua transformação começa hoje
        </h1>
        <p className="text-center leading-relaxed text-texto-suave">
          Jornadas guiadas, práticas diárias de autocuidado e uma comunidade que te acompanha — tudo em um só lugar.
        </p>
      </div>

      <div className="relative flex justify-center">
        <SeloProvaSocial animado icone="♥" texto="+500 mulheres já assinam o Rose Pro" />
      </div>

      <div className="relative space-y-2.5 rounded-2xl border border-borda bg-superficie/70 p-4">
        <p className="text-center text-sm font-semibold text-texto">Assinando o Rose Pro, você tem:</p>
        <ul className="space-y-2 text-sm text-texto">
          {VANTAGENS.map((vantagem) => (
            <li key={vantagem} className="flex items-start gap-2.5">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-salvia-suave text-xs text-texto"
              >
                ✓
              </span>
              <span className="leading-snug">{vantagem}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative space-y-3 rounded-2xl border border-acao/25 bg-creme-rosado/35 p-4">
        <AssinaturaClient precoExibicao={precoExibicao} />
        <p className="text-center text-xs text-texto-suave">
          Preço de referência para o Brasil. Cancele quando quiser, sem multa.
        </p>
      </div>

      <p className="relative text-center text-xs text-texto-suave">
        Já assina o Rose Pro? <a href="/login" className="font-medium text-acao underline">Entrar na minha conta</a>
      </p>
    </main>
  );
}
```

- [ ] **Step 2: Verificar visualmente no navegador**

Run: `npm run dev` e abrir `http://localhost:3000/assinatura`.
Expected: página carrega sem erros no console, mostra preço real (ou nada, se Stripe não configurado localmente), botão "Assinar agora" clicável.

- [ ] **Step 3: Commit**

```bash
git add src/app/assinatura/page.tsx
git commit -m "feat(assinatura): adiciona landing publica de assinatura direta"
```

---

## Task 6: Página de confirmação `/assinatura/obrigado`

**Files:**
- Create: `src/app/assinatura/obrigado/page.tsx`
- Test: `src/app/assinatura/obrigado/page.test.tsx`

**Interfaces:**
- Consumes: `obterStripe()` de `@/lib/stripe/client` (`stripe.checkout.sessions.retrieve(sessionId)`).

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/app/assinatura/obrigado/page.test.tsx`:

```tsx
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AssinaturaObrigadoPage from './page';
import { obterStripe } from '@/lib/stripe/client';

vi.mock('@/lib/stripe/client', () => ({
  obterStripe: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(obterStripe).mockReset();
});

describe('/assinatura/obrigado', () => {
  it('mostra a confirmação e o aviso de e-mail quando o pagamento está confirmado', async () => {
    vi.mocked(obterStripe).mockReturnValue({
      checkout: { sessions: { retrieve: vi.fn(async () => ({ payment_status: 'paid' })) } },
    } as never);

    const jsx = await AssinaturaObrigadoPage({ searchParams: Promise.resolve({ session_id: 'cs_pago' }) });
    render(jsx);

    expect(screen.getByText(/assinatura foi confirmada/i)).toBeInTheDocument();
    expect(screen.getByText(/verifique seu e-mail/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /entrar/i })).toHaveAttribute('href', '/login');
  });

  it('mostra mensagem genérica quando não há session_id', async () => {
    const jsx = await AssinaturaObrigadoPage({ searchParams: Promise.resolve({}) });
    render(jsx);

    expect(screen.getByText(/não encontramos sua compra/i)).toBeInTheDocument();
    expect(obterStripe).not.toHaveBeenCalled();
  });

  it('mostra mensagem genérica quando o pagamento não está confirmado', async () => {
    vi.mocked(obterStripe).mockReturnValue({
      checkout: { sessions: { retrieve: vi.fn(async () => ({ payment_status: 'unpaid' })) } },
    } as never);

    const jsx = await AssinaturaObrigadoPage({ searchParams: Promise.resolve({ session_id: 'cs_pendente' }) });
    render(jsx);

    expect(screen.getByText(/não encontramos sua compra/i)).toBeInTheDocument();
  });

  it('mostra mensagem genérica quando a consulta ao Stripe falha', async () => {
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(obterStripe).mockReturnValue({
      checkout: {
        sessions: {
          retrieve: vi.fn(async () => {
            throw new Error('falha de rede');
          }),
        },
      },
    } as never);

    const jsx = await AssinaturaObrigadoPage({ searchParams: Promise.resolve({ session_id: 'cs_erro' }) });
    render(jsx);

    expect(screen.getByText(/não encontramos sua compra/i)).toBeInTheDocument();
    spyConsole.mockRestore();
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/app/assinatura/obrigado/page.test.tsx`
Expected: FAIL com "Failed to resolve import './page'" (o arquivo ainda não existe).

- [ ] **Step 3: Implementar `src/app/assinatura/obrigado/page.tsx`**

```tsx
import { obterStripe } from '@/lib/stripe/client';

async function confirmarPagamento(sessionId: string): Promise<boolean> {
  const stripe = obterStripe();
  if (!stripe) return false;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session.payment_status === 'paid';
  } catch (erro) {
    console.error('[assinatura/obrigado] falha ao consultar a sessão de checkout', {
      message: erro instanceof Error ? erro.message : 'erro desconhecido',
    });
    return false;
  }
}

export default async function AssinaturaObrigadoPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  const confirmado = sessionId ? await confirmarPagamento(sessionId) : false;

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
      <h1 className="font-display text-2xl font-medium text-texto">Sua assinatura foi confirmada!</h1>
      <p className="text-texto-suave">
        Verifique seu e-mail: te enviamos um link para acessar sua conta do Rose Pro.
      </p>
      <div className="mt-4 space-y-2 rounded-2xl border border-borda bg-superficie/70 p-4 text-sm text-texto-suave">
        <p>Não recebeu o e-mail ainda? Você também pode entrar com o mesmo e-mail usado na compra.</p>
        <a href="/login" className="font-medium text-acao underline">
          Entrar na minha conta
        </a>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run src/app/assinatura/obrigado/page.test.tsx`
Expected: PASS (4 testes)

- [ ] **Step 5: Rodar a suíte inteira do projeto e o typecheck**

Run: `npx vitest run`
Expected: PASS em todos os arquivos de teste

Run: `npx tsc --noEmit`
Expected: sem erros de tipo

- [ ] **Step 6: Verificar visualmente o fluxo completo no navegador**

Run: `npm run dev`, abrir `http://localhost:3000/assinatura`, clicar em "Assinar agora", completar um pagamento de teste no Stripe (modo teste), confirmar que cai em `/assinatura/obrigado` com a mensagem de sucesso.

Depois, no Stripe CLI (`stripe listen --forward-to localhost:3000/api/stripe/webhook`) ou no painel do Stripe (modo teste), confirmar que o evento `checkout.session.completed` foi processado sem erro 500, e checar no Supabase Studio que uma nova linha em `auth.users`/`perfis` foi criada com `plano = 'premium'`. Checar também se o e-mail chegou (ou ficou logado, se Resend não estiver configurado localmente) com o link de acesso — e testar manualmente se clicar no link realmente loga (ver nota abaixo).

**Nota de risco conhecida:** o fluxo de login do projeto usa PKCE (`@supabase/ssr`), que normalmente exige que o link de confirmação seja aberto no mesmo navegador que iniciou o pedido (ver comentário em `src/app/auth/callback/page.tsx:7-12`). Como o magic link aqui é gerado no servidor (dentro do webhook, sem navegador de origem), é possível que a troca de sessão falhe dependendo de como o Supabase trata links gerados via `generateLink`. Se isso acontecer, `/auth/callback` já degrada com segurança: mostra erro e redireciona para `/login`, onde a cliente consegue entrar normalmente com o e-mail da compra (rede de segurança já prevista na spec). Documentar o resultado real desse teste manual — se o link falhar sistematicamente, considerar como follow-up trocar o link por um código/OTP enviado por e-mail em vez do link clicável.

- [ ] **Step 7: Commit**

```bash
git add src/app/assinatura/obrigado
git commit -m "feat(assinatura): adiciona pagina de confirmacao da landing publica"
```

---

## Self-Review Notes

- **Cobertura da spec:** hero/benefícios/preço/CTA da landing (Task 5), checkout sem login (Task 2), criação de conta + promoção a premium + e-mail (Task 3), confirmação (Task 6), rede de segurança via `/login` (Task 6, mencionado no texto da página). Fora de escopo (anual, cupom, senha) não implementado, conforme spec.
- **Tipos consistentes:** `AssinaturaClient({ precoExibicao: string | null })` (Task 4) é o mesmo tipo produzido por `buscarPrecoExibicao` e consumido em `page.tsx` (Task 5). `enviarEmailAcessoAssinatura(destinatario: string, urlAcesso: string): Promise<boolean>` (Task 1) tem a mesma assinatura usada no webhook (Task 3). Nome de metadata `'assinatura_landing'` usado de forma idêntica na rota de checkout (Task 2) e no webhook (Task 3).
- **Risco isolado:** a incerteza sobre o comportamento exato do magic link gerado via `generateLink` fica isolada na Task 6 (verificação manual), sem bloquear nenhuma outra task — mesmo que o link falhe, o resto do fluxo (pagamento, criação de conta, promoção a premium, login alternativo) continua funcionando.
