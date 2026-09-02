# Funil de venda avulsa do ebook "Rose Reset 21 dias"

## Contexto

O app já vende uma assinatura (Rose Pro) via um funil dedicado: `/comecar` (quiz) → `/comecar/resultado` (oferta) → `/login` (conta) → checkout autenticado ([checkout/route.ts](../../../src/app/api/stripe/checkout/route.ts)). Esse funil pede compromisso alto (criar conta) antes de qualquer compra.

A Rose quer vender também um ebook avulso, "Rose Reset 21 dias" (PDF já pronto), como produto de entrada mais barato e de menor compromisso — sem competir com a oferta de assinatura na mesma tela, para não parecer que está empurrando duas ofertas ao mesmo tempo.

## Escopo

Um funil novo e isolado, `/ebook`, para compra avulsa sem necessidade de conta. Reaproveita a infraestrutura Stripe existente (moeda/locale por país, padrão de Checkout Session), mas com `mode: 'payment'` em vez de `mode: 'subscription'`, e sem autenticação.

Fora de escopo: qualquer mudança no funil de assinatura existente (`/comecar`, `/login`, `/api/stripe/checkout`); criação de conta como parte da compra do ebook; nutrição por email/whatsapp pós-compra (fica para um projeto futuro); tabela de banco para registrar a compra (o Stripe já é a fonte de verdade — não há dado de usuária para associar, já que a compra é sem conta).

## Funil (visão geral)

```
anúncio / rede social
  → /ebook                        (landing page de vendas, sem quiz, sem login)
  → botão "Quero o ebook" → POST /api/stripe/checkout-ebook
  → Stripe Checkout (mode: payment, sem customer vinculado a conta)
  → /ebook/obrigado?session_id=... → confirma pagamento no Stripe → libera download
```

## `/ebook` — landing page de vendas

Server Component simples, independente das rotas de `/comecar`. Conteúdo: imagem/personagem da Rose, copy de venda (dor → promessa → o que tem dentro do ebook), preço (via `formatarPrecoExibicao`, mesma lógica de exibição do funil de assinatura), botão único "Quero o ebook" que chama a API de checkout.

Nunca menciona a assinatura Rose Pro — a página é sobre uma única decisão de compra.

## `POST /api/stripe/checkout-ebook`

Nova rota de API, sem autenticação (diferente de `/api/stripe/checkout`, que exige usuária logada). Cria uma Checkout Session avulsa:

- `mode: 'payment'` (não `'subscription'`)
- `line_items`: um único Price avulso, novo, criado no painel do Stripe (env var `STRIPE_PRICE_ID_EBOOK`, seguindo o padrão de `STRIPE_PRICE_ID_MENSAL`/`STRIPE_PRICE_ID_ANUAL` em [planos.ts](../../../src/lib/stripe/planos.ts))
- moeda/locale: mesma lógica de `obterMoedaELocaleDoPais`, mas como não há perfil (sem conta), usa o país detectado pelo Stripe automaticamente ou fallback fixo (BR/`brl`) — sem tentar geolocalizar no server
- `success_url`: `${siteUrl}/ebook/obrigado?session_id={CHECKOUT_SESSION_ID}`
- `cancel_url`: `${siteUrl}/ebook`
- sem `customer`, sem `client_reference_id`, sem metadata de usuária (não existe)

Se `STRIPE_PRICE_ID_EBOOK` não estiver configurado, retorna 503 (mesmo padrão de "produto ainda não disponível" usado em `planos.ts`).

## `/ebook/obrigado` — confirmação + download

Server Component. Lê `session_id` da query string:

- Sem `session_id`: mensagem genérica ("não encontramos sua compra"), sem detalhes técnicos.
- Com `session_id`: chama `stripe.checkout.sessions.retrieve(sessionId)`. Se `payment_status !== 'paid'`, mesma mensagem genérica. Se `'paid'`: gera uma signed URL de curta duração (10 min) do bucket privado `ebooks` via `createSupabaseAdminClient().storage.from('ebooks').createSignedUrl(...)`, e mostra o botão de download.

Não há checagem de "dono" da sessão (diferente de `confirmar-pagamento/route.ts`, que compara `usuaria_id`) porque não existe usuária autenticada — o próprio `session_id` do Stripe (imprevisível, gerado pelo Stripe) já é a prova de posse suficiente para este caso de uso de baixo valor.

Abaixo do bloco de download, um segundo bloco visualmente separado ("Gostou? Conheça o Rose Pro") com um link para `/comecar` ou `/login` — convite leve, não obrigatório, só depois que o download já foi liberado.

## Armazenamento do PDF

Bucket novo no Supabase Storage, **privado** (diferente do bucket `avatares`, que é público):

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ebooks', 'ebooks', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;
```

Sem policy de leitura pública — só o service role (admin client, usado no server) acessa, via `createSignedUrl`. Upload do PDF é manual (Supabase Studio), fora do escopo de código.

## Fora de escopo / decisões conscientes

- Sem tabela de banco para registrar a compra — o Stripe é a única fonte de verdade; não há usuária/perfil para associar.
- Sem criação de conta como parte da compra — fricção mínima, coerente com a decisão de "landing page direta" (não reaproveitar o quiz de `/comecar`).
- Sem nutrição por email/whatsapp pós-compra — fica para um projeto futuro, quando houver captura de lead avaliada separadamente.
- Sem checagem de "dono" da sessão em `/ebook/obrigado` — aceitável porque não há conta para comparar, e o `session_id` já não é adivinhável.
