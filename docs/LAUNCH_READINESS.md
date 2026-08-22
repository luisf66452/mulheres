# Rose — Launch Readiness (Tarefa 13)

Data: 2026-08-18
Base: commit `4da7036` (pré-Tarefa 13) → ver commit final desta tarefa no histórico do `master`.

Este documento é o checklist objetivo de prontidão do Rose para **beta fechado** e para **lançamento público**. Não contém segredos. Sempre que algo aqui ficar desatualizado, atualize este arquivo junto da mudança.

---

## ✅ Pronto

- **Build / tipos / lint / testes**: `npm run build`, `npx tsc --noEmit`, `npm run lint` e `npm test` passam. 567 testes em 91 arquivos. Lint só com os 4 warnings pré-existentes de `<img>` (não bloqueantes).
- **Env vars de produção (Vercel)**: as 5 variáveis que faltavam em Production (`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_MENSAL`, `STRIPE_PRICE_ID_ANUAL`) foram copiadas do ambiente Preview (mesmas chaves de **teste**, nada live) — com autorização explícita do responsável, pois é uma alteração de configuração de conta. `NEXT_PUBLIC_SITE_URL` foi adicionada como fallback.
- **URL base do app**: nova função central `src/lib/site-url.ts` (`obterUrlBaseDoRequest`) resolve a URL a partir do próprio request (`origin`/`host` headers), funcionando automaticamente em development, preview e production sem precisar de configuração por ambiente. As rotas `/api/stripe/checkout` e `/api/stripe/portal` foram migradas para usá-la — antes caíam silenciosamente em `http://localhost:3000` em produção por falta da env var (bug real, corrigido). Os fluxos de magic link e exclusão de conta já usavam o mesmo padrão via `headers()`.
- **Magic link — rate limit amigável**: `enviarLinkMagico` (login) e `enviarConfirmacaoExclusao` (exclusão de conta) agora detectam status 429 / código `over_email_send_rate_limit` do Supabase e mostram "Aguarde alguns segundos antes de pedir outro link." em vez de vazar o erro técnico do Supabase.
- **Stripe — webhook**: idempotente (tabela `stripe_eventos_processados`), só promove `plano = 'premium'` quando `payment_status === 'paid'` (ou via `customer.subscription.updated` com status ativo), nunca a partir da rota de checkout. Erros retornam mensagens seguras, sem detalhe interno ao cliente.
- **Stripe — planos**: price IDs vêm só de env vars (`STRIPE_PRICE_ID_MENSAL/ANUAL`), nada hardcoded no código. `/premium` e `/perfil/assinatura` degradam honestamente quando Stripe não está configurado (não prometem cobrança que não existe).
- **Storage (avatares)**: bucket público com limite de 2MB, apenas `image/jpeg|png|webp`, RLS por pasta (`{usuaria_id}/...`) — uma usuária não consegue escrever/ler fora da própria pasta. Validação client-side espelha o limite do bucket.
- **Exclusão de conta**: autenticada, id sempre da sessão (nunca do corpo da requisição), cancela assinatura Stripe ativa antes de apagar, remove arquivos de avatar do Storage, e só então apaga o usuário via `service_role`.
- **Privacidade**: página `/privacidade` não faz alegação de certificação jurídica (não diz "100% LGPD/GDPR compliant"), explica coleta, retenção, direitos, e deixa claro que o app não é terapia/diagnóstico, com link para `/seguranca`.
- **Limites clínicos / risco**: `/seguranca` é 100% orientada por dados (tabela `recursos_seguranca`), sem prometer "uma psicóloga vai te contatar" nem qualquer monitoramento humano automático que não existe.
- **Analytics**: confirmado que não existe nenhum provedor de analytics/tracking hoje (nenhuma referência a GA/PostHog/Pixel/etc. no código) — nada foi adicionado, conforme instrução de não escolher fornecedor sozinho.
- **Cron de notificações**: protegido por `CRON_SECRET` (Bearer token), calcula janela de envio e dia da semana no fuso horário de cada usuária (correção já feita na Tarefa 12), respeita `preferencias_notificacoes`.
- **Error handling**: `error.tsx` e `not-found.tsx` globais com identidade visual do Rose (nunca a tela crua de erro do Next). Rotas de API sempre retornam JSON com mensagem amigável, nunca stack trace ao cliente.
- **Cabeçalhos de segurança**: adicionados `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy` restritiva — sem CSP rígida (evita quebrar Stripe/Supabase sem testes extensivos).
- **Dependências**: `npm audit` sem vulnerabilidades. Atualizações de patch aplicadas com segurança: `next` 16.3.0→16.3.1, `eslint-config-next` 16.3.0→16.3.1, `@supabase/supabase-js` 2.112.2→2.112.3, `vitest` 4.1.10→4.1.11. Majors (`typescript` 5→7, `eslint` 9→10, `@types/node` 20→26) deliberadamente não tocados — fora de escopo do lançamento.
- **Deployment**: projeto Vercel `luis-ferreira-s-projects1/mulheres` linkado corretamente; sem domínio customizado (esperado — arquitetura de URL já preparada para receber um sem mudança de código).

## ⚠️ Necessita ação antes do beta

- **Verificação manual do Supabase Auth (Site URL / Redirect URLs)**: não consegui inspecionar/confirmar programaticamente a configuração em Authentication → URL Configuration no dashboard do Supabase — a CLI (`supabase`) não está autenticada nesta sessão (exigiria `supabase login` interativo ou `SUPABASE_ACCESS_TOKEN`, que não temos). **Ação recomendada**: confirmar manualmente que a Site URL e a lista de Redirect URLs incluem o(s) domínio(s) de produção/preview atuais (`https://mulheres-git-master-luis-ferreira-s-projects1.vercel.app` e afins) — sem isso, o magic link pode redirecionar para a URL errada.
- **Supabase Advisors (Security/Performance)**: mesma limitação de acesso acima — não foi possível rodar os Advisors. Recomenda-se rodar manualmente no dashboard antes do beta.
- **Schema remoto real**: não há acesso direto ao Postgres (sem connection string/senha) nem à Management API nesta sessão, então a verificação do schema foi feita por leitura das migrations locais (`0005`–`0024`, já confirmadas aplicadas segundo o estado informado da Tarefa 12), não por introspecção ao vivo. Recomenda-se uma conferência pontual via SQL Editor do Supabase antes do beta, focada em `handle_new_user`, RLS de `perfis`/`clube_rose_*`, e grants do webhook Stripe.
- **QA end-to-end com conta descartável**: não foi possível completar (login por magic link exige acesso a uma caixa de e-mail real, que não está disponível nesta sessão). Recomenda-se um teste manual único, com conta de teste, percorrendo: cadastro → perfil → check-in → prática → jornada → progresso → notificações → Clube Rose → Premium (Stripe Test Mode).
- **Fluxo Stripe Test Mode completo (checkout → pagamento → webhook → Premium → portal → cancelamento)**: não executado nesta sessão pelos mesmos motivos (depende de sessão autenticada de uma usuária real). Ambiente está pronto tecnicamente (env vars agora presentes em produção, webhook idempotente, price IDs configurados) — falta só a execução manual com cartão de teste do Stripe.
- **Responsividade visual (screenshots em 375/390/430/desktop, temas claro/escuro)**: não foi possível renderizar visualmente o app nesta sessão (o preview local não consegue carregar segredos reais — bloqueio de segurança do próprio ambiente de execução do agente). Build estático e SSR passaram sem erro para todas as rotas listadas nas Fases 22/41, o que indica ausência de erros de renderização, mas a inspeção visual fina (overflow, texto grande, redução de animação) fica pendente de um teste manual rápido.

## 🛑 Necessita ação antes do lançamento público

- **Revisão jurídica da Política de Privacidade/Termos**: o texto atual é cauteloso (não alega certificação LGPD/GDPR), mas precisa de validação por advogado(a) antes de abrir para o público geral — isto nunca foi feito por um profissional jurídico nesta tarefa nem antes dela, pelo que se sabe.
- **Revisão clínica do conteúdo**: qualquer novo texto relacionado a bem-estar emocional, ou mudança de critério de risco, precisa passar pela psicóloga responsável. Nada de conteúdo clínico foi alterado nesta tarefa — apenas auditado.
- **Stripe Live**: as chaves em produção continuam de **teste**. Trocar para live é uma decisão de negócio + operacional que não foi e não deve ser feita automaticamente.
- **Domínio próprio**: não existe domínio customizado configurado — não bloqueia beta técnico, mas provavelmente é desejável antes de lançamento público amplo.
- **Canal de suporte dedicado**: hoje o único canal é o e-mail pessoal do fundador (`rosewomand123@gmail.com`), o que é aceitável para beta mas talvez não escale para lançamento público — decisão operacional, não técnica.

---

## Notas de acesso desta execução

Esta tarefa rodou de forma autônoma (Vercel CLI, Supabase CLI, gh CLI, npm), mas encontrou três limitações reais de acesso que impediram alguns itens acima:

1. **Supabase CLI sem login** (`supabase login` é interativo, não roda sem supervisão) → sem acesso à Management API, Advisors, ou inspeção direta do Auth/schema remoto.
2. **Ambiente de execução redige valores de env vars sensíveis** ao tentar baixá-los para arquivo local (`vercel env pull`) — impede rodar o app localmente contra o Supabase/Stripe reais para QA visual/funcional nesta sessão. Isso é uma proteção de segurança do próprio ambiente, não um bug.
3. **Sem acesso a caixa de e-mail** para completar o fluxo de magic link de ponta a ponta (necessário tanto para QA de conta nova quanto para o fluxo Premium Test Mode).

Nenhuma dessas limitações bloqueou o restante do trabalho — todo o resto da Tarefa 13 foi concluído.
