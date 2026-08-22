# Rose como PWA instalável Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar a Rose instalável como PWA no Android (Chrome) e iPhone/iPad (Safari), com ícone/nome corretos, modo `standalone`, botão de instalação, instruções iOS, e um service worker seguro que nunca cacheia nada autenticado/sensível.

**Architecture:** Ícones gerados uma vez por script Python a partir do logotipo fornecido pelo usuário; manifest via `src/app/manifest.ts` (convenção Next.js 16); service worker reescrito com fetch-allowlist restrita a assets estáticos versionados; hook + componente React para o fluxo de instalação (Android via `beforeinstallprompt`, iOS via instruções estáticas), com dois pontos de entrada (banner na Início, item fixo em Configurações).

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, Vitest + Testing Library, Service Worker API nativa (sem biblioteca PWA externa).

## Global Constraints

- Não alterar nenhuma chave, conta, webhook, produto, preço ou configuração da Stripe.
- Não substituir Stripe Checkout por pagamento da Apple/Google.
- Não alterar configurações do Supabase.
- Não quebrar login, cadastro, recuperação de senha, callback de auth, onboarding, jornadas, assinaturas.
- Não cachear páginas autenticadas, dados pessoais, rotas `/api/*`, callbacks Supabase, rotas Stripe (checkout/webhook/sucesso/cancelamento), nem requisições não-GET.
- Não usar pacotes PWA de terceiros (`next-pwa` ou similares) — service worker escrito à mão.
- Logotipo oficial: `src/assets/logo-rose-fonte.png` (fonte da rosa fornecida pelo usuário em 2026-08-22) — nenhum outro logotipo é inventado.
- Preservar design/identidade visual atual (cores de `src/app/globals.css`: `--color-fundo #FBF6F0`, `--color-acao #B8697A`, etc.).
- Manter, sem alteração de comportamento, os handlers `push` e `notificationclick` já existentes em `public/sw.js`.
- Ter uma estratégia clara de versionamento/limpeza de cache (sem acumular assets com hash indefinidamente).
- URLs relativas apenas — nenhum domínio hardcoded no manifest ou componentes.
- Não alterar configuração externa da Vercel/Supabase/Stripe sem autorização explícita do usuário.

---

## Task 1: Copiar o logotipo fonte para o repositório

**Files:**
- Create: `src/assets/logo-rose-fonte.png` (binário, cópia de `C:\Users\luis ferreira\Downloads\ChatGPT Image 22_08_2026, 16_03_00.png`)

**Interfaces:**
- Produces: um arquivo PNG RGBA 1254×1254 em `src/assets/logo-rose-fonte.png`, usado como entrada pelo script de geração de ícones da Task 2.

- [ ] **Step 1: Criar o diretório e copiar o arquivo**

```bash
mkdir -p src/assets
cp "C:\Users\luis ferreira\Downloads\ChatGPT Image 22_08_2026, 16_03_00.png" "src/assets/logo-rose-fonte.png"
```

- [ ] **Step 2: Confirmar dimensões e canal alfa**

```bash
python3 -c "from PIL import Image; im = Image.open('src/assets/logo-rose-fonte.png'); print(im.size, im.mode)"
```

Expected: `(1254, 1254) RGBA`

- [ ] **Step 3: Commit**

```bash
git add src/assets/logo-rose-fonte.png
git commit -m "chore(pwa): adiciona logotipo oficial da Rose como fonte para os icones"
```

---

## Task 2: Script de geração dos ícones PWA

**Files:**
- Create: `scripts/gerar-icones-pwa.py`
- Produces (executado, não versionado como parte desta task — os PNGs resultantes são versionados na Task 3): `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/icon-512-maskable.png`, `src/app/icon.png`, `src/app/apple-icon.png`, `src/app/favicon.ico`

**Interfaces:**
- Consumes: `src/assets/logo-rose-fonte.png` (Task 1).
- Produces: os 6 arquivos de ícone acima, todos derivados da mesma fonte, usados pelo manifest (Task 3) e pelas convenções de arquivo do Next.js (Task 4).

- [ ] **Step 1: Escrever o script**

```python
"""Gera todos os icones do PWA da Rose a partir do logotipo oficial.

Uso: python3 scripts/gerar-icones-pwa.py
Fonte: src/assets/logo-rose-fonte.png (RGBA, fundo transparente)
"""
from pathlib import Path
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
FONTE = RAIZ / "src" / "assets" / "logo-rose-fonte.png"
COR_FUNDO = (251, 246, 240, 255)  # --color-fundo (#FBF6F0)


def compor_sobre_fundo(logo: Image.Image, tamanho: int, escala_logo: float) -> Image.Image:
    """Centraliza o logo (redimensionado por escala_logo) sobre um quadrado
    opaco de fundo #FBF6F0. escala_logo=1.0 preenche o quadrado inteiro;
    valores menores deixam margem."""
    tela = Image.new("RGBA", (tamanho, tamanho), COR_FUNDO)
    lado_logo = int(tamanho * escala_logo)
    logo_redimensionado = logo.resize((lado_logo, lado_logo), Image.LANCZOS)
    offset = ((tamanho - lado_logo) // 2, (tamanho - lado_logo) // 2)
    tela.paste(logo_redimensionado, offset, logo_redimensionado)
    return tela.convert("RGB")


def main() -> None:
    logo = Image.open(FONTE).convert("RGBA")

    # Icones "any": ~10% de margem (escala 0.8 = 80% do quadrado ocupado).
    icon_192 = compor_sobre_fundo(logo, 192, 0.8)
    icon_192.save(RAIZ / "public" / "icons" / "icon-192.png")

    icon_512 = compor_sobre_fundo(logo, 512, 0.8)
    icon_512.save(RAIZ / "public" / "icons" / "icon-512.png")

    # Maskable: safe zone da spec eh circulo central de 80% do lado (40% de
    # raio) - usamos escala 0.6 pra rosa nunca encostar na borda de corte.
    icon_512_maskable = compor_sobre_fundo(logo, 512, 0.6)
    icon_512_maskable.save(RAIZ / "public" / "icons" / "icon-512-maskable.png")

    # Icone de aba do navegador (convencao app/icon.png do Next.js).
    icon_tab = compor_sobre_fundo(logo, 512, 0.8)
    icon_tab.save(RAIZ / "src" / "app" / "icon.png")

    # Apple touch icon: iOS aplica cantos arredondados sozinho, sem
    # transparencia (fundo opaco obrigatorio).
    apple_icon = compor_sobre_fundo(logo, 180, 0.78)
    apple_icon.save(RAIZ / "src" / "app" / "apple-icon.png")

    # Favicon multi-resolucao.
    favicon_base = compor_sobre_fundo(logo, 256, 0.8)
    favicon_base.save(
        RAIZ / "src" / "app" / "favicon.ico",
        sizes=[(16, 16), (32, 32), (48, 48), (256, 256)],
    )

    print("Icones gerados a partir de", FONTE)


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Executar o script**

```bash
python3 scripts/gerar-icones-pwa.py
```

Expected: imprime `Icones gerados a partir de ...` sem erro; os 6 arquivos passam a existir.

- [ ] **Step 3: Verificar visualmente e por tamanho que os ícones não são placeholders**

```bash
python3 -c "
from PIL import Image
for f in ['public/icons/icon-192.png','public/icons/icon-512.png','public/icons/icon-512-maskable.png','src/app/icon.png','src/app/apple-icon.png']:
    im = Image.open(f)
    colors = im.getcolors(maxcolors=1000000)
    print(f, im.size, im.mode, 'cores unicas:', len(colors) if colors else '>1000000')
"
```

Expected: cada arquivo com centenas/milhares de cores únicas (não 1 cor sólida como os placeholders antigos).

- [ ] **Step 4: Commit**

```bash
git add scripts/gerar-icones-pwa.py public/icons/icon-192.png public/icons/icon-512.png public/icons/icon-512-maskable.png src/app/icon.png src/app/apple-icon.png src/app/favicon.ico
git commit -m "feat(pwa): gera icones do app a partir do logotipo oficial da Rose"
```

---

## Task 3: Manifest via `src/app/manifest.ts`

**Files:**
- Create: `src/app/manifest.ts`
- Create: `src/app/manifest.test.ts`
- Delete: `public/manifest.json`

**Interfaces:**
- Consumes: ícones gerados na Task 2 (`/icons/icon-192.png`, `/icons/icon-512.png`, `/icons/icon-512-maskable.png` — caminhos públicos, servidos de `public/icons/`).
- Produces: rota `/manifest.webmanifest` servida automaticamente pelo Next.js a partir deste arquivo; usada pela Task 4 (o Next injeta o `<link rel="manifest">` sozinho, sem precisar declarar em `metadata`).

- [ ] **Step 1: Escrever o teste**

```ts
// src/app/manifest.test.ts
import { describe, expect, it } from 'vitest';
import manifest from './manifest';

describe('manifest da Rose', () => {
  it('declara nome, modo standalone e icones nos tamanhos certos', () => {
    const resultado = manifest();

    expect(resultado.name).toBe('Rose');
    expect(resultado.short_name).toBe('Rose');
    expect(resultado.display).toBe('standalone');
    expect(resultado.start_url).toBe('/');
    expect(resultado.scope).toBe('/');
    expect(resultado.background_color).toBe('#FBF6F0');
    expect(resultado.theme_color).toBe('#FBF6F0');

    const tamanhos = (resultado.icons ?? []).map((icone) => icone.sizes);
    expect(tamanhos).toContain('192x192');
    expect(tamanhos).toContain('512x512');

    const maskable = (resultado.icons ?? []).find((icone) => icone.purpose === 'maskable');
    expect(maskable?.sizes).toBe('512x512');
    expect(maskable?.src).toBe('/icons/icon-512-maskable.png');
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

```bash
npx vitest run src/app/manifest.test.ts
```

Expected: FAIL — `Cannot find module './manifest'`.

- [ ] **Step 3: Implementar `src/app/manifest.ts`**

```ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Rose',
    short_name: 'Rose',
    description:
      'Um ritual diário de 5 minutos para autoestima, imagem corporal e relação com a comida.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#FBF6F0',
    theme_color: '#FBF6F0',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icons/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

```bash
npx vitest run src/app/manifest.test.ts
```

Expected: PASS.

- [ ] **Step 5: Remover o manifest estático antigo**

```bash
git rm public/manifest.json
```

- [ ] **Step 6: Commit**

```bash
git add src/app/manifest.ts src/app/manifest.test.ts
git commit -m "feat(pwa): migra manifest para app/manifest.ts com icone maskable"
```

---

## Task 4: Metadados do layout raiz (iOS, favicon, remoção do scaffold)

**Files:**
- Modify: `src/app/layout.tsx`
- Delete: `public/next.svg`, `public/vercel.svg`, `public/globe.svg`, `public/file.svg`, `public/window.svg`
- Delete: `public/icons/icon-192.png`, `public/icons/icon-512.png` antigos (já foram sobrescritos na Task 2 — nada a fazer aqui além de confirmar)

**Interfaces:**
- Consumes: `src/app/icon.png`, `src/app/apple-icon.png`, `src/app/favicon.ico` (Task 2) — detectados automaticamente pelo Next via convenção de arquivo, não precisam de import.
- Produces: `<head>` com `<link rel="apple-touch-icon">`, `<link rel="icon">`, `<link rel="manifest">` (via `app/manifest.ts`), `apple-mobile-web-app-*` meta tags.

- [ ] **Step 1: Remover os SVGs de scaffold não usados**

```bash
grep -rl "next.svg\|vercel.svg\|globe.svg\|file.svg\|window.svg" src/ || echo "nenhuma referencia encontrada"
git rm public/next.svg public/vercel.svg public/globe.svg public/file.svg public/window.svg
```

Expected do `grep`: nenhuma referência (confirma que é seguro remover). Se aparecer alguma referência, não remova esse arquivo específico e investigue antes de continuar.

- [ ] **Step 2: Atualizar `metadata` e `viewport` em `src/app/layout.tsx`**

Substituir o bloco `export const metadata` e `export const viewport` por:

```ts
export const metadata: Metadata = {
  title: "Rose",
  description:
    "Um ritual diário de 5 minutos para autoestima, imagem corporal e relação com a comida.",
  appleWebApp: {
    capable: true,
    title: "Rose",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#FBF6F0",
  viewportFit: "cover",
};
```

(Remove o campo `manifest: "/manifest.json"` — a rota `app/manifest.ts` da Task 3 é detectada automaticamente pelo Next.js e injetada no `<head>` sem precisar disso.)

- [ ] **Step 3: Rodar o build para confirmar que o head é gerado sem erros**

```bash
npm run build
```

Expected: build conclui sem erro relacionado a `metadata`/`manifest`/`icon`.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx public/next.svg public/vercel.svg public/globe.svg public/file.svg public/window.svg
git commit -m "chore(pwa): metadados iOS no layout raiz e remocao das sobras do scaffold"
```

---

## Task 5: Service worker seguro e versionado

**Files:**
- Modify: `public/sw.js`
- Create: `src/lib/pwa/sw.contrato.test.ts`

**Interfaces:**
- Produces: `public/sw.js` com `CACHE_NAME`, handlers `install`/`activate`/`fetch`/`push`/`notificationclick`. Consumido pela Task 6 (registro no cliente).

- [ ] **Step 1: Escrever o teste de contrato (leitura estática do arquivo)**

Este teste não executa o service worker (isso exigiria um ambiente de Service Worker completo, fora do escopo do jsdom); ele garante, por inspeção do código-fonte, que as exclusões de segurança e o versionamento continuam presentes — proteção contra regressão.

```ts
// src/lib/pwa/sw.contrato.test.ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const codigoSw = readFileSync(resolve(__dirname, '../../../public/sw.js'), 'utf-8');

describe('contrato de seguranca do service worker', () => {
  it('declara um CACHE_NAME versionado', () => {
    expect(codigoSw).toMatch(/CACHE_NAME\s*=\s*['"]rose-static-v\d+['"]/);
  });

  it('ignora metodos diferentes de GET no fetch', () => {
    expect(codigoSw).toMatch(/request\.method\s*!==\s*['"]GET['"]/);
  });

  it('nunca intercepta rotas sensiveis', () => {
    for (const rota of ['/api/', '/auth/', '/checkout', '/login', '/onboarding']) {
      expect(codigoSw).toContain(rota);
    }
  });

  it('limpa caches antigos no activate', () => {
    expect(codigoSw).toMatch(/caches\.delete/);
    expect(codigoSw).toMatch(/addEventListener\(['"]activate['"]/);
  });

  it('mantem os handlers de push e notificationclick', () => {
    expect(codigoSw).toMatch(/addEventListener\(['"]push['"]/);
    expect(codigoSw).toMatch(/addEventListener\(['"]notificationclick['"]/);
    expect(codigoSw).toContain("clients.openWindow('/checkin')");
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

```bash
npx vitest run src/lib/pwa/sw.contrato.test.ts
```

Expected: FAIL nos testes de `CACHE_NAME`, `request.method`, rotas sensíveis e `caches.delete` (o `sw.js` atual só tem `push`/`notificationclick`).

- [ ] **Step 3: Reescrever `public/sw.js`**

```js
const CACHE_NAME = 'rose-static-v1';

// Prefixos de rota que nunca podem ser servidos do cache: autenticacao,
// APIs, e qualquer etapa de pagamento Stripe. Mantidos como passthrough
// total (a rede decide, sem cache), mesmo que a rede falhe.
const ROTAS_NUNCA_CACHEADAS = [
  '/api/',
  '/auth/',
  '/checkout',
  '/sucesso',
  '/cancelado',
  '/login',
  '/onboarding',
];

// Assets estaticos versionados por hash pelo Next.js: seguros para
// stale-while-revalidate porque uma mudanca de conteudo sempre vem com uma
// URL nova (o navegador nunca reusa hash antigo para conteudo novo).
const PREFIXOS_ESTATICOS_CACHEAVEIS = ['/_next/static/', '/icons/'];
const ARQUIVOS_ESTATICOS_CACHEAVEIS = ['/icon', '/apple-icon', '/favicon.ico'];

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(
        nomes
          .filter((nome) => nome.startsWith('rose-static-') && nome !== CACHE_NAME)
          .map((nome) => caches.delete(nome))
      )
    ).then(() => self.clients.claim())
  );
});

function ehAssetEstaticoCacheavel(url) {
  return (
    PREFIXOS_ESTATICOS_CACHEAVEIS.some((prefixo) => url.pathname.startsWith(prefixo)) ||
    ARQUIVOS_ESTATICOS_CACHEAVEIS.some((arquivo) => url.pathname.startsWith(arquivo))
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (ROTAS_NUNCA_CACHEADAS.some((rota) => url.pathname.startsWith(rota))) {
    return;
  }

  if (!ehAssetEstaticoCacheavel(url)) {
    // Navegacao/HTML e qualquer outra rota: sempre rede, nunca cache.
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const respostaCacheada = await cache.match(request);
      const buscaNaRede = fetch(request)
        .then((resposta) => {
          if (resposta.ok) {
            cache.put(request, resposta.clone());
          }
          return resposta;
        })
        .catch(() => respostaCacheada);

      return respostaCacheada || buscaNaRede;
    })
  );
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Rose', {
      body: data.body || 'Seu momento de cuidado de hoje está te esperando.',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/checkin'));
});
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

```bash
npx vitest run src/lib/pwa/sw.contrato.test.ts
```

Expected: PASS em todos os `it`.

- [ ] **Step 5: Commit**

```bash
git add public/sw.js src/lib/pwa/sw.contrato.test.ts
git commit -m "feat(pwa): service worker versionado com allowlist de cache seguro"
```

---

## Task 6: Registro do service worker (cliente, só produção)

**Files:**
- Create: `src/app/components/RegistrarServiceWorker.tsx`
- Create: `src/app/components/RegistrarServiceWorker.test.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `public/sw.js` (Task 5).
- Produces: componente `RegistrarServiceWorker` (default export, sem props), montado uma vez no layout raiz.

- [ ] **Step 1: Escrever o teste**

```tsx
// src/app/components/RegistrarServiceWorker.test.tsx
import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import RegistrarServiceWorker from './RegistrarServiceWorker';

describe('RegistrarServiceWorker', () => {
  const registerMock = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    registerMock.mockClear();
    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: { register: registerMock },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('registra /sw.js em producao, apos o load da pagina', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    render(<RegistrarServiceWorker />);

    window.dispatchEvent(new Event('load'));

    await waitFor(() => expect(registerMock).toHaveBeenCalledWith('/sw.js'));
  });

  it('nao registra fora de producao', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    render(<RegistrarServiceWorker />);

    window.dispatchEvent(new Event('load'));

    await new Promise((r) => setTimeout(r, 0));
    expect(registerMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

```bash
npx vitest run src/app/components/RegistrarServiceWorker.test.tsx
```

Expected: FAIL — `Cannot find module './RegistrarServiceWorker'`.

- [ ] **Step 3: Implementar o componente**

```tsx
'use client';

import { useEffect } from 'react';

// Registra o service worker so em producao (evita cache brigando com o
// Fast Refresh do `next dev`) e so depois do `load`, pra nao competir com o
// carregamento inicial da pagina por banda/CPU.
export default function RegistrarServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      return;
    }
    if (!('serviceWorker' in navigator)) {
      return;
    }

    function registrar() {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Falha de registro nao deve quebrar a navegacao normal do app.
      });
    }

    window.addEventListener('load', registrar);
    return () => window.removeEventListener('load', registrar);
  }, []);

  return null;
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

```bash
npx vitest run src/app/components/RegistrarServiceWorker.test.tsx
```

Expected: PASS nos dois `it`.

- [ ] **Step 5: Montar no layout raiz**

Em `src/app/layout.tsx`, adicionar o import e montar ao lado de `AplicarPreferenciasDispositivo`:

```tsx
import RegistrarServiceWorker from "./components/RegistrarServiceWorker";
```

```tsx
<body className="...">
  <AplicarPreferenciasDispositivo />
  <RegistrarServiceWorker />
  <TikTokPixel />
  <TikTokPageView />
  {children}
</body>
```

- [ ] **Step 6: Commit**

```bash
git add src/app/components/RegistrarServiceWorker.tsx src/app/components/RegistrarServiceWorker.test.tsx src/app/layout.tsx
git commit -m "feat(pwa): registra service worker no cliente apenas em producao"
```

---

## Task 7: Hook `usePwaInstall`

**Files:**
- Create: `src/lib/pwa/usePwaInstall.ts`
- Create: `src/lib/pwa/usePwaInstall.test.ts`

**Interfaces:**
- Produces:
  ```ts
  type ResultadoPwaInstall = {
    podeInstalar: boolean;
    ehIOS: boolean;
    ehStandalone: boolean;
    foiDispensado: boolean;
    instalar: () => Promise<void>;
    dispensar: () => void;
  };
  function usePwaInstall(): ResultadoPwaInstall;
  ```
  Consumido pela Task 8 (`InstalarRose.tsx`).

- [ ] **Step 1: Escrever o teste**

```ts
// src/lib/pwa/usePwaInstall.test.ts
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePwaInstall } from './usePwaInstall';

function dispararBeforeInstallPrompt() {
  const evento = new Event('beforeinstallprompt') as Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  };
  evento.prompt = vi.fn().mockResolvedValue(undefined);
  evento.userChoice = Promise.resolve({ outcome: 'accepted' });
  window.dispatchEvent(evento);
  return evento;
}

describe('usePwaInstall', () => {
  beforeEach(() => {
    window.localStorage.clear();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('comeca sem prompt de instalacao disponivel', () => {
    const { result } = renderHook(() => usePwaInstall());
    expect(result.current.podeInstalar).toBe(false);
  });

  it('fica instalavel apos beforeinstallprompt e chama prompt() ao instalar', async () => {
    const { result } = renderHook(() => usePwaInstall());
    let evento: ReturnType<typeof dispararBeforeInstallPrompt>;

    act(() => {
      evento = dispararBeforeInstallPrompt();
    });

    expect(result.current.podeInstalar).toBe(true);

    await act(async () => {
      await result.current.instalar();
    });

    expect(evento!.prompt).toHaveBeenCalledOnce();
  });

  it('detecta modo standalone via matchMedia', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: true }),
    });
    const { result } = renderHook(() => usePwaInstall());
    expect(result.current.ehStandalone).toBe(true);
  });

  it('dispensar() persiste em localStorage e reflete no proximo render', () => {
    const { result, rerender } = renderHook(() => usePwaInstall());

    act(() => {
      result.current.dispensar();
    });
    rerender();

    expect(result.current.foiDispensado).toBe(true);
    expect(window.localStorage.getItem('rose-pwa-dispensado')).toBe('1');
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

```bash
npx vitest run src/lib/pwa/usePwaInstall.test.ts
```

Expected: FAIL — `Cannot find module './usePwaInstall'`.

- [ ] **Step 3: Implementar o hook**

```ts
'use client';

import { useCallback, useEffect, useState } from 'react';

const CHAVE_DISPENSADO = 'rose-pwa-dispensado';

type EventoBeforeInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function detectarIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const ehIOSClassico = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ se reporta como "Macintosh" com suporte a touch.
  const ehIPadOSComoMac = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return ehIOSClassico || ehIPadOSComoMac;
}

function detectarStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const viaMatchMedia = window.matchMedia?.('(display-mode: standalone)').matches ?? false;
  const viaIOS = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return viaMatchMedia || viaIOS;
}

export function usePwaInstall() {
  const [eventoInstalacao, setEventoInstalacao] = useState<EventoBeforeInstallPrompt | null>(
    null
  );
  const [foiDispensado, setFoiDispensado] = useState(false);
  const [ehStandalone, setEhStandalone] = useState(false);
  const [ehIOS, setEhIOS] = useState(false);

  useEffect(() => {
    setFoiDispensado(window.localStorage.getItem(CHAVE_DISPENSADO) === '1');
    setEhStandalone(detectarStandalone());
    setEhIOS(detectarIOS());

    function aoCapturarPrompt(evento: Event) {
      evento.preventDefault();
      setEventoInstalacao(evento as EventoBeforeInstallPrompt);
    }

    function aoInstalar() {
      setEventoInstalacao(null);
      setEhStandalone(true);
    }

    window.addEventListener('beforeinstallprompt', aoCapturarPrompt);
    window.addEventListener('appinstalled', aoInstalar);
    return () => {
      window.removeEventListener('beforeinstallprompt', aoCapturarPrompt);
      window.removeEventListener('appinstalled', aoInstalar);
    };
  }, []);

  const instalar = useCallback(async () => {
    if (!eventoInstalacao) return;
    await eventoInstalacao.prompt();
    await eventoInstalacao.userChoice;
    setEventoInstalacao(null);
  }, [eventoInstalacao]);

  const dispensar = useCallback(() => {
    window.localStorage.setItem(CHAVE_DISPENSADO, '1');
    setFoiDispensado(true);
  }, []);

  return {
    podeInstalar: eventoInstalacao !== null,
    ehIOS,
    ehStandalone,
    foiDispensado,
    instalar,
    dispensar,
  };
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

```bash
npx vitest run src/lib/pwa/usePwaInstall.test.ts
```

Expected: PASS nos 4 `it`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pwa/usePwaInstall.ts src/lib/pwa/usePwaInstall.test.ts
git commit -m "feat(pwa): hook usePwaInstall para deteccao e fluxo de instalacao"
```

---

## Task 8: Componente `InstalarRose`

**Files:**
- Create: `src/app/components/InstalarRose.tsx`
- Create: `src/app/components/InstalarRose.test.tsx`

**Interfaces:**
- Consumes: `usePwaInstall()` (Task 7) — `{ podeInstalar, ehIOS, ehStandalone, foiDispensado, instalar, dispensar }`.
- Produces: `export default function InstalarRose({ variante }: { variante: 'banner' | 'compacto' })`, usado pela Task 9 em `page.tsx` (banner) e `ConfiguracoesForm.tsx` (compacto).

- [ ] **Step 1: Escrever o teste**

```tsx
// src/app/components/InstalarRose.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import InstalarRose from './InstalarRose';
import { usePwaInstall } from '@/lib/pwa/usePwaInstall';

vi.mock('@/lib/pwa/usePwaInstall', () => ({
  usePwaInstall: vi.fn(),
}));

const usePwaInstallMock = vi.mocked(usePwaInstall);

function mockar(sobrescreve: Partial<ReturnType<typeof usePwaInstall>>) {
  usePwaInstallMock.mockReturnValue({
    podeInstalar: false,
    ehIOS: false,
    ehStandalone: false,
    foiDispensado: false,
    instalar: vi.fn(),
    dispensar: vi.fn(),
    ...sobrescreve,
  });
}

describe('InstalarRose', () => {
  it('nao renderiza nada em modo standalone', () => {
    mockar({ ehStandalone: true, podeInstalar: true });
    const { container } = render(<InstalarRose variante="banner" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('nao renderiza nada se foi dispensado', () => {
    mockar({ foiDispensado: true, podeInstalar: true });
    const { container } = render(<InstalarRose variante="banner" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('mostra botao de instalar quando o prompt esta disponivel (Android)', () => {
    mockar({ podeInstalar: true });
    render(<InstalarRose variante="banner" />);
    expect(screen.getByRole('button', { name: /instalar rose/i })).toBeInTheDocument();
  });

  it('mostra instrucoes de iOS quando ehIOS e nao esta standalone', () => {
    mockar({ ehIOS: true });
    render(<InstalarRose variante="banner" />);
    expect(screen.getByText(/toque no botão compartilhar/i)).toBeInTheDocument();
    expect(screen.getByText(/adicionar à tela de início/i)).toBeInTheDocument();
  });

  it('nao renderiza nada quando nao ha prompt disponivel e nao e iOS', () => {
    mockar({});
    const { container } = render(<InstalarRose variante="banner" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('variante compacto nao mostra botao de dispensar', () => {
    mockar({ podeInstalar: true });
    render(<InstalarRose variante="compacto" />);
    expect(screen.queryByRole('button', { name: /dispensar/i })).not.toBeInTheDocument();
  });

  it('variante banner mostra botao de dispensar que chama dispensar()', () => {
    const dispensar = vi.fn();
    mockar({ podeInstalar: true, dispensar });
    render(<InstalarRose variante="banner" />);
    screen.getByRole('button', { name: /dispensar aviso de instalação/i }).click();
    expect(dispensar).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

```bash
npx vitest run src/app/components/InstalarRose.test.tsx
```

Expected: FAIL — `Cannot find module './InstalarRose'`.

- [ ] **Step 3: Implementar o componente**

```tsx
'use client';

import { usePwaInstall } from '@/lib/pwa/usePwaInstall';

export default function InstalarRose({ variante }: { variante: 'banner' | 'compacto' }) {
  const { podeInstalar, ehIOS, ehStandalone, foiDispensado, instalar, dispensar } =
    usePwaInstall();

  if (ehStandalone) return null;
  if (variante === 'banner' && foiDispensado) return null;
  if (!podeInstalar && !ehIOS) return null;

  return (
    <section
      aria-label="Instalar a Rose"
      className="space-y-3 rounded-2xl border border-borda bg-superficie p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-base text-texto">Instale a Rose no seu aparelho</p>
          <p className="text-sm text-texto-suave">
            Acesso rápido direto da tela inicial, como um app.
          </p>
        </div>
        {variante === 'banner' && (
          <button
            type="button"
            onClick={dispensar}
            aria-label="Dispensar aviso de instalação"
            className="shrink-0 rounded-full p-1 text-texto-suave hover:bg-fundo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60"
          >
            ✕
          </button>
        )}
      </div>

      {podeInstalar && (
        <button
          type="button"
          onClick={instalar}
          className="w-full rounded-2xl bg-acao px-4 py-3 text-center font-medium text-white hover:bg-acao/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60"
        >
          Instalar Rose
        </button>
      )}

      {ehIOS && (
        <ol className="list-decimal space-y-1 pl-5 text-sm text-texto-suave">
          <li>Abra a Rose no Safari.</li>
          <li>Toque no botão Compartilhar.</li>
          <li>Toque em &ldquo;Adicionar à Tela de Início&rdquo;.</li>
          <li>Ative &ldquo;Abrir como App&rdquo;, caso essa opção apareça.</li>
          <li>Toque em &ldquo;Adicionar&rdquo;.</li>
        </ol>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

```bash
npx vitest run src/app/components/InstalarRose.test.tsx
```

Expected: PASS nos 7 `it`.

- [ ] **Step 5: Commit**

```bash
git add src/app/components/InstalarRose.tsx src/app/components/InstalarRose.test.tsx
git commit -m "feat(pwa): componente InstalarRose com fluxo Android e instrucoes iOS"
```

---

## Task 9: Pontos de entrada (Início e Configurações)

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/perfil/configuracoes/ConfiguracoesForm.tsx`
- Modify: `src/app/perfil/configuracoes/ConfiguracoesForm.test.tsx` (adicionar um teste)

**Interfaces:**
- Consumes: `InstalarRose` (Task 8), variantes `'banner'` e `'compacto'`.

- [ ] **Step 1: Adicionar o banner na Início**

Em `src/app/page.tsx`, importar e renderizar entre `<Saudacao />` e o restante do conteúdo (não bloqueia nada, não aparece em `/login`/`/onboarding`/`/checkout*` porque esta página só é alcançada após autenticação e onboarding completos):

```tsx
import InstalarRose from '@/app/components/InstalarRose';
```

```tsx
<Saudacao nome={perfil?.nome ?? null} />

<InstalarRose variante="banner" />

{jaFezCheckinHoje ? <ResumoDoDia checkinHoje={checkinHoje} /> : <SeletorHumor />}
```

- [ ] **Step 2: Adicionar o item fixo em Configurações**

Em `src/app/perfil/configuracoes/ConfiguracoesForm.tsx`, importar e renderizar dentro da seção "Sobre o Rose" (antes da versão do app):

```tsx
import InstalarRose from '@/app/components/InstalarRose';
```

```tsx
<Secao titulo="Sobre o Rose">
  <InstalarRose variante="compacto" />
  <p className="text-center text-xs text-texto-suave">Rose · versão {versaoApp}</p>
</Secao>
```

- [ ] **Step 3: Escrever teste garantindo que o item aparece em Configurações**

Adicionar a `src/app/perfil/configuracoes/ConfiguracoesForm.test.tsx` (ao lado dos testes existentes — ler o arquivo antes para seguir o padrão de mocks já usado nele):

```tsx
it('renderiza o ponto de entrada de instalacao do PWA', () => {
  render(<ConfiguracoesForm usuariaId="user-1" fusoHorarioAtual="America/Sao_Paulo" versaoApp="1.0.0" />);
  expect(screen.getByLabelText('Instalar a Rose')).toBeInTheDocument();
});
```

Se o mock global de `usePwaInstall` não estiver configurado no arquivo de teste, adicionar o mesmo `vi.mock('@/lib/pwa/usePwaInstall', ...)` usado em `InstalarRose.test.tsx` (Task 8) com `podeInstalar: true` para que a seção renderize algo verificável.

- [ ] **Step 4: Rodar toda a suíte de testes**

```bash
npm test
```

Expected: todos os testes passam, incluindo os novos.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/app/perfil/configuracoes/ConfiguracoesForm.tsx src/app/perfil/configuracoes/ConfiguracoesForm.test.tsx
git commit -m "feat(pwa): pontos de entrada do fluxo de instalacao na Inicio e Configuracoes"
```

---

## Task 10: Verificação final — testes, lint, typecheck, build, QA no preview

**Files:** nenhum arquivo novo — só execução e, se necessário, correções pontuais nos arquivos já criados/modificados nas Tasks 1–9.

- [ ] **Step 1: Suíte completa de testes**

```bash
npm test
```

Expected: 0 falhas. Reportar a contagem total de testes passando.

- [ ] **Step 2: Lint**

```bash
npm run lint
```

Expected: 0 erros, sem novos warnings em relação ao estado antes desta branch.

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: 0 erros.

- [ ] **Step 4: Build de produção**

```bash
npm run build
```

Expected: build conclui com sucesso; conferir no output que `/manifest.webmanifest`, `/icon`, `/apple-icon` aparecem como rotas geradas.

- [ ] **Step 5: QA no preview (via ferramenta de browser)**

Com o servidor de dev/preview rodando:
1. Abrir `/manifest.webmanifest` diretamente e confirmar JSON com `name: "Rose"`, `display: "standalone"`, ícones 192/512/maskable.
2. Abrir `/icons/icon-192.png`, `/icons/icon-512.png`, `/icons/icon-512-maskable.png`, `/apple-icon.png`, `/icon` e confirmar que carregam (200) e mostram a rosa, não um quadrado preto.
3. Checar console do navegador por erros ao carregar a página (registro do service worker deve ficar em silêncio em dev, sem erros).
4. Navegar sem sessão (`/`) e confirmar redirect para `/login` intacto.
5. Se houver credenciais de teste disponíveis: logar, confirmar que o banner "Instalar Rose" aparece na Início (fora de standalone) e o item aparece em Perfil → Configurações; dispensar o banner e confirmar que ele some e não retorna ao recarregar.
6. Confirmar visualmente (`resize_window` mobile) que o layout do banner não quebra em largura pequena.
7. Confirmar que `/checkout`, `/api/*`, callbacks Supabase continuam respondendo normalmente (sem interferência do service worker) — verificar via `read_network_requests` que essas chamadas não aparecem como `(from ServiceWorker)`.

Documentar no relatório final qualquer item desta lista que não pôde ser executado por falta de credenciais, e por quê.

- [ ] **Step 6: Verificar (sem alterar) o domínio de produção configurado**

```bash
cat vercel.json 2>/dev/null
git remote -v
```

Não há CLI da Vercel autenticada disponível neste ambiente por padrão — se `vercel whoami`/`vercel project ls` não estiver autenticado, reportar isso e orientar o usuário a confirmar no painel da Vercel (Settings → Domains) qual é o domínio de produção, em vez de assumir um. Documentar no relatório final que URLs precisam ser adicionadas em Supabase Auth (Redirect URLs) e no Stripe (webhook endpoint / allowed redirect) assim que esse domínio for confirmado — sem alterar nenhum painel.

- [ ] **Step 7: Commit final (se Steps 1–4 exigiram correções)**

```bash
git add -A
git commit -m "fix(pwa): ajustes finais de lint/typecheck apos verificacao"
```

(Pular este commit se nada precisou ser corrigido.)
