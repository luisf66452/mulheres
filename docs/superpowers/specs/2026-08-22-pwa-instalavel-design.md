# Rose como PWA instalável — design

## Contexto

A Rose é um Next.js 16 (App Router) com Supabase (auth/dados) e Stripe (assinaturas reais em produção). Objetivo: tornar a Rose instalável no Android (Chrome) e no iPhone/iPad (Safari, via "Adicionar à Tela de Início"), com ícone, nome "Rose", abertura em modo `standalone`, botão de instalação, instruções para iOS, e uma base de service worker compatível com Web Push futuro — sem tocar em Stripe, Supabase, ou fazer cache de qualquer coisa autenticada/sensível.

Fora de escopo nesta tarefa: publicação em App Store/Google Play (será só uma análise separada, sem implementação).

## Auditoria (estado antes desta mudança)

Já existia uma implementação PWA parcial, de um commit anterior (`b8dbe85 feat: make the app an installable PWA`), incompleta e com placeholders:

- `public/manifest.json` — campos básicos OK, mas sem ícone `maskable`.
- `public/sw.js` — só lida com `push`/`notificationclick`; sem cache, sem versionamento, sem estratégia de fetch.
- `public/icons/icon-192.png` e `icon-512.png` — quadrados **pretos sólidos** (placeholder, não é o logotipo da Rose).
- `src/app/favicon.ico` — favicon **padrão do Vercel/Next.js** (círculo preto + triângulo), nunca substituído.
- `public/next.svg`, `vercel.svg`, `globe.svg`, `file.svg`, `window.svg` — sobras do scaffold `create-next-app`, não referenciadas em nenhum lugar do código.
- Nenhum registro de service worker no cliente fora do fluxo de push (`src/lib/push/subscribe.ts` registra `/sw.js` sob demanda, ao inscrever notificações).
- Nenhum componente de instalação, nenhuma instrução iOS.
- `src/proxy.ts` (middleware de auth) já exclui do gate de autenticação: `_next/static`, `_next/image`, `favicon.ico`, `manifest.json`, `icons`, e extensões de imagem — ponto de partida seguro.
- Logotipo oficial: não havia nenhum arquivo de logotipo no repositório. O usuário forneceu um PNG (rosa ilustrada, fundo transparente, 1254×1254) gerado no ChatGPT em 2026-08-22, autorizando seu uso como logotipo oficial da Rose.

## Decisões de arquitetura

### 1. Logotipo e ícones

- Fonte única versionada: `src/assets/logo-rose-fonte.png` (cópia do arquivo fornecido pelo usuário).
- Gerados a partir dela, por script Python/PIL executado uma vez (não é dependência de build do projeto):
  - `public/icons/icon-192.png`, `public/icons/icon-512.png` — rosa com ~10% de margem, fundo `#FBF6F0` (cor de fundo do app), sem transparência (PNG opaco — evita ícones "flutuando" em fundos escuros de lançadores Android).
  - `public/icons/icon-512-maskable.png` — mesma arte, rosa ocupando a "safe zone" central de 40% recomendada pela spec `maskable`, fundo `#FBF6F0` preenchendo todo o quadrado.
  - `src/app/apple-icon.png` (180×180, fundo opaco) — convenção de arquivo do Next.js, gera automaticamente `<link rel="apple-touch-icon">`.
  - `src/app/icon.png` (512×512, fundo opaco) — convenção de arquivo do Next.js, gera automaticamente `<link rel="icon">` para abas/bookmarks.
  - `src/app/favicon.ico` (multi-resolução 16/32/48) — substitui o favicon padrão do Vercel.
- Removidos: `public/icons/icon-192.png`/`icon-512.png` antigos (pretos), `src/app/favicon.ico` antigo, `public/next.svg`, `public/vercel.svg`, `public/globe.svg`, `public/file.svg`, `public/window.svg`.

### 2. Manifest

- `public/manifest.json` (estático) substituído por `src/app/manifest.ts` (convenção recomendada pela doc oficial do Next.js 16 — gerado em build, tipado via `MetadataRoute.Manifest`).
- Conteúdo: `name: "Rose"`, `short_name: "Rose"`, `description` (a mesma já usada em `metadata`), `start_url: "/"`, `display: "standalone"`, `scope: "/"`, `background_color`/`theme_color: "#FBF6F0"`, `icons` com os três arquivos gerados (`any` 192/512 + `maskable` 512).
- `layout.tsx` não precisa mais referenciar `manifest: "/manifest.json"` manualmente — a rota `app/manifest.ts` é detectada automaticamente pelo Next; adiciono `metadata.appleWebApp` (`capable: true`, `title: "Rose"`, `statusBarStyle` coerente com o tema claro) para os metadados específicos de iOS que não vêm do manifest.

### 3. Service worker (`public/sw.js`, reescrito)

- `CACHE_NAME = 'rose-static-v1'` (versionado; bump manual a cada mudança de estratégia de cache).
- `install`: `self.skipWaiting()`. Não pré-cacheia nada (evita prometer offline que não existe).
- `activate`: apaga qualquer cache cujo nome comece com `rose-static-` e seja diferente do atual; `self.clients.claim()`.
- `fetch`:
  - Ignora (não chama `respondWith`) qualquer request que não seja `GET`.
  - Ignora (passa direto pra rede) qualquer request cuja URL comece com `/api/`, `/auth/`, `/checkout`, `/sucesso`, `/cancelado`, `/login`, `/onboarding`, ou que não seja `same-origin` (cobre Stripe/Supabase, que são chamados por URL absoluta de outro domínio, e qualquer rota de app que possa ter dado sensível).
  - Para o resto: se a URL é um asset estático versionado (`/_next/static/`, `/icons/`, `/apple-icon`, `/icon`, `/favicon.ico`) → estratégia **stale-while-revalidate** limitada a esse cache nomeado (serve do cache se existir, busca na rede em paralelo e atualiza o cache) — nunca serve HTML de página nem resposta com corpo potencialmente sensível.
  - Qualquer outra navegação (HTML) → sempre rede, sem cache. Isso garante que nenhuma página autenticada é servida do cache.
- Mantém, inalterados, os handlers `push` e `notificationclick` já existentes.
- Isso satisfaz "estratégia de atualização/limpeza para não acumular assets com hash indefinidamente" (o `activate` limpa versões antigas do cache nomeado a cada deploy que muda `CACHE_NAME`, e dentro da mesma versão o cache é só de assets imutáveis por hash — não cresce sem limite porque só guarda o necessário para os assets referenciados na versão atual).

### 4. Registro do service worker

- Novo componente cliente `src/app/components/RegistrarServiceWorker.tsx`, montado no `layout.tsx` (ao lado de `AplicarPreferenciasDispositivo`).
- Registra `navigator.serviceWorker.register('/sw.js')` apenas se `process.env.NODE_ENV === 'production'` e `'serviceWorker' in navigator`, dentro de `window.addEventListener('load', ...)`.
- `src/lib/push/subscribe.ts` continua registrando sob demanda (idempotente — `register()` com o mesmo `scriptURL` reaproveita o registro existente).

### 5. Componente/hook de instalação

- `src/lib/pwa/usePwaInstall.ts`: hook que expõe `{ podeInstalar, éIOS, éStandalone, instalar(), dispensar() }`.
  - Captura `beforeinstallprompt` (com `preventDefault()`), guarda o evento em estado.
  - Detecta `standalone` via `window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true`.
  - Detecta iOS/iPadOS via `navigator.platform`/`navigator.userAgent` (cobrindo iPad que se reporta como Mac com touch).
  - `dispensar()` grava `localStorage.setItem('rose-pwa-dispensado', '1')`.
- `src/app/components/InstalarRose.tsx`: componente de UI usando o hook.
  - Se `éStandalone` → não renderiza nada.
  - Android/Chrome com prompt disponível → botão "Instalar Rose", chama `instalar()`.
  - iOS, fora do modo standalone → bloco com passo a passo (Compartilhar → Adicionar à Tela de Início → Adicionar), sem prompt automático (não existe no iOS).
  - Se dispensado (`localStorage`) → não renderiza (até a usuária limpar o storage).
  - Acessível: marcação semântica (`<section aria-label="Instalar a Rose">`, `<ol>` para os passos), botão de fechar com `aria-label="Dispensar aviso de instalação"`, foco visível herdado do design system existente.
- Pontos de entrada:
  - Item permanente em `src/app/perfil/configuracoes/ConfiguracoesForm.tsx` (ou seção nova ao lado, dependendo da estrutura) — sempre visível quando aplicável.
  - Banner discreto no layout autenticado principal (não em `/login`, `/onboarding`, `/checkout*`, `/sucesso`, `/cancelado`).

### 6. Domínio/produção

- Nenhuma URL de domínio é hardcoded — manifest e componentes usam apenas caminhos relativos.
- Vou verificar (sem alterar) se há domínio de produção configurado na Vercel e reportar no final quais URLs precisam ser autorizadas no Supabase Auth e no Stripe quando esse domínio for confirmado. Nenhuma mudança em painéis externos sem autorização explícita prévia.

## Testes

- Teste de unidade para `usePwaInstall` (detecção de iOS/standalone, captura do evento `beforeinstallprompt`, dispensa via localStorage) com jsdom/vitest.
- Teste de render para `InstalarRose` (não renderiza em standalone; mostra instruções iOS; mostra botão Android quando prompt disponível).
- Teste que `src/app/manifest.ts` retorna os campos obrigatórios (`name`, `short_name`, `display: 'standalone'`, ícones com os tamanhos certos).
- Teste (leitura estática do arquivo) garantindo que o `sw.js` contém as exclusões de rota esperadas (`/api/`, `/auth/`, `/checkout`, `/login`, `/onboarding`) — proteção contra regressão que volte a cachear rota sensível.
- Rodar toda a suíte existente (`npm test`), `npm run lint`, `tsc`/typecheck, e `npm run build` — sem novos warnings.

## Erros e limites conhecidos

- QA autenticado completo (login real, checkout Stripe real) só é possível manualmente no preview — vou documentar exatamente o que falta testar manualmente se não houver credenciais de teste disponíveis no ambiente de execução do agente.
- Não implemento páginas offline nem pré-cache de rota alguma — só o necessário para instalabilidade e updates seguros.
