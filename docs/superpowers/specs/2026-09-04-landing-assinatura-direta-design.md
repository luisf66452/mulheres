# Landing page de assinatura direta (`/assinatura`)

## Contexto

O único jeito de assinar o Rose Pro hoje é o funil `/comecar` (quiz) → `/comecar/resultado` (oferta) → `/login` (cria conta) → checkout autenticado ([checkout/route.ts](../../../src/app/api/stripe/checkout/route.ts)). Esse funil pede compromisso alto (responder o quiz, criar conta) antes de chegar no pagamento — adequado para tráfego que ainda está descobrindo o produto, mas ruim para tráfego pago (anúncios) que já vem com intenção de compra e só quer assinar.

Falta um destino direto: pessoa clica no anúncio, vê a oferta, assina, pronto — sem quiz, sem precisar logar antes.

## Escopo

Uma landing page nova e isolada, `/assinatura`, para assinar o Rose Pro (plano mensal) sem conta prévia. Reaproveita a infraestrutura Stripe existente (Checkout Session, `planos.ts`) e a identidade visual do funil de resultado (`ResultadoClient.tsx`, ilustrações, selo de prova social), mas com um checkout público (sem autenticação) e criação de conta **depois** do pagamento — diferente do funil `/comecar`, que cria conta **antes**.

Fora de escopo: mudanças no funil `/comecar`/`/login`/`/api/stripe/checkout` existente; plano anual nesta landing (só mensal, decisão consciente para reduzir fricção de escolha); cupom promocional (`?promo=`) nesta página; qualquer nutrição por e-mail além do e-mail de acesso à conta.

## Funil (visão geral)

```
anúncio
  → /assinatura                          (landing de vendas, sem quiz, sem login)
  → botão "Assinar agora" → POST /api/stripe/checkout-assinatura
  → Stripe Checkout (mode: subscription, sem customer vinculado a conta)
  → webhook checkout.session.completed:
      - cria conta (auth.admin.createUser) se e-mail ainda não tem uma
      - promove perfil a premium
      - gera magic link e envia por e-mail (Resend)
  → /assinatura/obrigado?session_id=...   (confirma pagamento, orienta a checar o e-mail)
```

## `/assinatura` — landing page de vendas

Server Component, independente das rotas de `/comecar`. Busca o preço mensal real via `stripe.prices.retrieve` em BRL (mesmo padrão de `comecar/resultado/page.tsx`: sem país detectado, moeda fixa BRL, `revalidate` para não travar no build). Passa o preço formatado para um Client Component com o botão de compra.

Conteúdo reaproveitando tokens visuais existentes (`bg-acao`, `text-texto`, `text-texto-suave`, `font-display`) e componentes de `src/app/components/decoracao/` (`IlustracaoBotanica`, `RosasDecorativas`) e `SeloProvaSocial`: hero com a proposta de valor do Rose Pro, lista de benefícios (mesmo conteúdo já usado em `ResultadoClient.tsx`/`perfil/assinatura`), card de preço (só mensal, sem comparação com anual), botão único "Assinar agora".

Nunca menciona o quiz ou pede pra responder perguntas — é uma decisão de compra direta.

## `POST /api/stripe/checkout-assinatura`

Nova rota de API, sem autenticação (diferente de `/api/stripe/checkout`, que exige usuária logada). Espelha a estrutura de [checkout-ebook/route.ts](../../../src/app/api/stripe/checkout-ebook/route.ts):

- `mode: 'subscription'`
- `line_items`: um único item, `obterPriceId('mensal')`
- moeda/locale fixos: `obterMoedaELocaleDoPais('BR')` (sem perfil pra detectar país), com a mesma checagem de `obterUnitAmountNaMoeda` antes de criar a sessão, pra nunca cobrar em moeda diferente da exibida
- `success_url`: `${siteUrl}/assinatura/obrigado?session_id={CHECKOUT_SESSION_ID}`
- `cancel_url`: `${siteUrl}/assinatura`
- `metadata: { origem: 'assinatura_landing' }` — mesma convenção já usada pelo bump do ebook (`origem: 'ebook_bump'`) pra o webhook (e o painel do Stripe) identificarem a origem da venda
- sem `customer`, sem `client_reference_id` — não existe usuária ainda; o Stripe Checkout coleta o e-mail nativamente

Se `STRIPE_PRICE_ID_MENSAL` não estiver configurado, retorna 503 (mesmo padrão de "produto indisponível" das outras rotas).

## Webhook — criação de conta pós-pagamento

Em [webhook/route.ts](../../../src/app/api/stripe/webhook/route.ts), o caso `checkout.session.completed` já tem um ramo para `!usuariaId` (compra sem conta vinculada), hoje usado só pelo ebook. Adiciono, dentro desse ramo, uma checagem específica para `session.metadata?.origem === 'assinatura_landing'` — o comportamento atual (envio do link do ebook) continua exatamente igual para qualquer outro caso sem `usuariaId`.

Quando `origem === 'assinatura_landing'` e `payment_status === 'paid'` e não é reentrega duplicada:

1. Pega o e-mail: `session.customer_details?.email ?? session.customer_email`. Sem e-mail, loga erro e para (mesmo padrão de log do ramo do ebook) — sem e-mail não há como criar conta nem avisar a cliente.
2. Verifica se já existe usuária com esse e-mail (`adminClient.auth.admin.listUsers` filtrando por e-mail, ou tratando o erro "already registered" de `createUser`) — necessário porque o Stripe pode reentregar o evento e `duplicado` já cobre reentrega do mesmo evento, mas não cobre a cliente comprar de novo com o mesmo e-mail depois de já ter conta.
3. Se não existe: cria via `adminClient.auth.admin.createUser({ email, email_confirm: true })`. O trigger `on_auth_user_created` já existente cria a linha em `perfis` automaticamente (plano `free` por default) — não precisa inserir manualmente.
4. Atualiza `perfis` (pelo `id` da usuária recém-criada, ou já existente) com `stripe_customer_id`, `stripe_subscription_id` e `plano: 'premium'`/`assinatura_status: 'active'` — mesmos campos que o ramo autenticado já atualiza logo abaixo no mesmo handler.
5. Gera o link de acesso: `adminClient.auth.admin.generateLink({ type: 'magiclink', email, options: { redirectTo: `${siteUrl}/auth/callback` } })`.
6. Envia por e-mail via Resend, novo template `src/lib/email/assinatura.ts` (mesmo padrão de `email/ebook.ts`: função que retorna `boolean`, nunca lança — falha de e-mail não derruba o webhook). O e-mail explica que a assinatura foi ativada e traz o link de acesso, **e também menciona que dá pra entrar a qualquer momento em `/login` com o mesmo e-mail** — rede de segurança caso o link falhe.

Se a usuária já existia (passo 2), pula a criação de conta mas ainda atualiza o perfil e envia o e-mail de acesso — cobre o caso de alguém com conta free assinando direto pela landing em vez de ir por `/perfil/assinatura`.

Falha ao gerar ou enviar o magic link é só logada (`console.error`), não interrompe o webhook — a promoção a premium (passo 4) já aconteceu, e o acesso via `/login` continua funcionando independentemente do e-mail.

Os eventos `customer.subscription.created`/`.updated` que chegam em seguida encontram o perfil normalmente pelo `stripe_customer_id` já setado no passo 4 (o match desses handlers é por `stripe_customer_id`, não por metadata — ver `webhook/route.ts:154`), então o ciclo de vida normal da assinatura (renovação, cancelamento) funciona sem mudança nenhuma nesses handlers.

## `/assinatura/obrigado` — confirmação

Server Component, mesmo padrão de `ebook/obrigado/page.tsx`. Lê `session_id` da query:

- Sem `session_id`, ou `payment_status !== 'paid'` ao consultar `stripe.checkout.sessions.retrieve`: mensagem genérica, sem detalhes técnicos.
- Pagamento confirmado: mensagem de boas-vindas ao Rose Pro + aviso "Te enviamos um e-mail com o link de acesso" + link secundário e sempre visível para `/login`, caso o e-mail demore ou não chegue.

Não faz polling nem espera o webhook rodar antes de mostrar a confirmação — o webhook processa a criação de conta de forma assíncrona; a página só confirma o pagamento (consultando o Stripe diretamente, igual ao ebook) e orienta sobre o e-mail.

## Fora de escopo / decisões conscientes

- Sem plano anual nesta landing — reduz fricção de decisão para tráfego de anúncio; quem quiser anual pode ir por `/perfil/assinatura` depois de logar.
- Sem cupom promocional (`?promo=`) — pode ser adicionado depois seguindo o mesmo padrão de `/api/stripe/checkout`, se houver necessidade.
- Sem exigir senha em nenhum momento — acesso só por link mágico ou pelo login por código já existente (`/login`), que já é robusto e testado.
- Sem tentar sincronizar `subscription_data.metadata.usuaria_id` na criação da Checkout Session (a usuária ainda não existe nesse momento) — não é necessário porque os handlers de `customer.subscription.*` já casam por `stripe_customer_id`, não por metadata.
