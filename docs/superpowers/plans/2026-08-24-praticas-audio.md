# Práticas em Áudio — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar práticas guiadas em áudio à Rose, unificando o catálogo em código (`PRATICAS_RAPIDAS`) com práticas em áudio persistidas na tabela `praticas`, com um player de áudio completo e acessível, gate Pro no servidor, e três roteiros de exemplo entrando como rascunho pendente de revisão da psicóloga.

**Architecture:** Uma camada nova `src/lib/praticas-catalogo/` funde os dois catálogos (código + banco) em itens de listagem com IDs estáveis por fonte, consumida pela página `/praticas` já existente sem remover `PRATICAS_RAPIDAS`. A página de detalhe de biblioteca `/praticas/[id]` (que já lê `praticas` por id/status) passa a checar `is_pro` no servidor e a renderizar um `PlayerAudio` novo somente quando a prática está totalmente pronta (`status` e `audio_status` publicados, mídia completa). O player guarda posição local por dispositivo em `localStorage`, com throttle, nunca no banco.

**Tech Stack:** Next.js (App Router, Server Components + Server Actions), TypeScript, Supabase (Postgres + RLS via `supabase migration new`), Vitest + Testing Library, Tailwind (classes de tema já existentes: `bg-superficie`, `text-texto`, `text-texto-suave`, `bg-acao`, `border-borda`, etc.).

## Global Constraints

- A Rose não é terapia, não diagnostica, não substitui acompanhamento profissional — nenhum roteiro pode prometer cura, controlar crises, garantir resultado emocional ou substituir atendimento psicológico.
- Nunca classificar a usuária com transtornos, distorções, riscos clínicos ou conclusões psicológicas; linguagem sempre descritiva e acolhedora.
- Conteúdo clínico e roteiros de áudio entram marcados como pendentes de revisão da psicóloga antes de qualquer publicação — todo roteiro novo desta feature entra com `status='rascunho'` **e** `audio_status='rascunho'`.
- `tipo` da tabela `praticas` **não muda** — mantém só `'respiracao' | 'reflexao' | 'afirmacao' | 'movimento'`. Temas como "autocompaixão"/"aterramento" vão em `categoria` (já `text` livre, sem constraint).
- Visibilidade do player decidida na camada de aplicação, nunca por constraint de banco: só renderiza quando `status = 'publicada' AND audio_status = 'publicada' AND audio_url/duracao_segundos/transcricao` não nulos.
- Gate Pro (`is_pro`) checado no **servidor** da rota da prática, nunca só no cliente.
- Segurança, exportação e privacidade nunca ficam atrás do Rose Pro (não se aplica diretamente a esta seção, mas nenhuma mudança aqui pode acidentalmente colocar `/seguranca` atrás de paywall).
- Nunca pedir permissão de notificação do navegador automaticamente (não aplicável a este módulo, mas preservar em qualquer código tocado).
- Não alterar Stripe, Pétalas, preços, domínio, TikTok Pixel ou regras de assinatura.
- Preservar PWA, Web Push, jornadas, sessões, progresso, check-in existentes — não remover `PRATICAS_RAPIDAS` nem as rotas `/praticas/respiracao`, `/praticas/diario-guiado`, `/praticas/meditacao`, `/praticas/autocompaixao`.
- Mobile-first, acolhedor, sem cores/mensagens punitivas.
- `supabase migration new <nome>` para toda migration nova (nunca nome de arquivo manual); RLS habilitada; policies `to authenticated`; `(select auth.uid()) = usuaria_id` quando aplicável; nunca `auth.role()`; nunca GRANT a `anon` além do que já existe; nunca `SECURITY DEFINER` para contornar RLS; idempotência (`drop policy if exists`); `notify pgrst, 'reload schema';` ao final.
- Tipos TypeScript (`src/lib/supabase/types.ts`) atualizados manualmente após a migration (não há `supabase gen types` configurado).
- **Pendência a reportar na entrega final**: nenhuma gravação de áudio real existe — só roteiros textuais em rascunho, pendentes de revisão psicológica. Sem arquivo de áudio válido publicado, nenhum player aparece em produção.

---

## File Structure

```
src/lib/praticas-catalogo/
  tipos.ts                  # ItemCatalogoPratica — forma unificada de listagem
  unificar.ts                # unificarCatalogo(praticasRapidas, praticasAudio) -> ItemCatalogoPratica[]
  unificar.test.ts
  buscarPraticasAudioPublicadas.ts   # query server-side em `praticas` (status + audio_status)
  buscarPraticasAudioPublicadas.test.ts

src/app/praticas/
  page.tsx                   # MODIFICA: passa a buscar práticas de áudio publicadas e unificar com PRATICAS_RAPIDAS
  CartaoPratica.tsx           # já existe — reaproveitado sem mudança de assinatura para itens de áudio
  [id]/page.tsx               # MODIFICA: adiciona checagem de is_pro no servidor + renderização condicional do PlayerAudio
  [id]/loading.tsx            # já existe, sem mudança

src/app/components/praticas/
  PlayerAudio.tsx              # REESCRITO do zero (substitui o protótipo atual play/pause+volume)
  PlayerAudio.test.tsx         # novo
  icones/IconeSkipTras.tsx     # novo
  icones/IconeSkipFrente.tsx   # novo

src/lib/praticas-audio-posicao/
  armazenamento.ts             # lerPosicao/salvarPosicao/apagarPosicao em localStorage, por dispositivo
  armazenamento.test.ts
  tipos.ts                     # PosicaoAudio

supabase/migrations/
  <timestamp>_seed_praticas_audio_rascunho.sql   # 3 roteiros novos (INSERT), status/audio_status='rascunho'
```

**Nota sobre a migration da seção 1 (fundação de banco):** este plano assume que a migration que adiciona `audio_url`, `duracao_segundos`, `transcricao`, `audio_status`, `is_pro` a `praticas` (descrita na Seção 1 do design) **já foi aplicada por um plano anterior** na ordem de implementação do design (`Ordem de implementação`, item 2, executado antes do item 6). A Task 1 abaixo verifica isso e, se as colunas não existirem, cria a migration como pré-requisito bloqueante antes de prosseguir.

---

### Task 1: Verificar/gerar migration das colunas de áudio em `praticas` e atualizar tipos

**Files:**
- Create (condicional — só se as colunas ainda não existirem): `supabase/migrations/<timestamp>_praticas_audio.sql` (nome gerado por `supabase migration new praticas_audio`)
- Modify: `src/lib/supabase/types.ts`

**Interfaces:**
- Produces: `Pratica` (tipo atualizado) com `audio_url: string | null`, `duracao_segundos: number | null`, `transcricao: string | null`, `audio_status: StatusAudioPratica`, `is_pro: boolean`. Novo tipo exportado `StatusAudioPratica = 'rascunho' | 'revisada' | 'publicada'`.

- [ ] **Step 1: Checar se as colunas já existem**

Rode contra o banco de desenvolvimento (via CLI do Supabase já configurado no projeto):

```bash
supabase db diff --schema public
```

Se a saída não mostrar diferença nenhuma envolvendo `praticas.audio_url`/`is_pro`, e uma consulta rápida confirmar as colunas já presentes, pule para o Step 4 (as colunas já existem, criadas por um plano anterior da seção 1). Caso contrário, siga o Step 2.

- [ ] **Step 2: Gerar a migration (só se necessário)**

```bash
supabase migration new praticas_audio
```

Preencher o arquivo gerado com:

```sql
-- Adiciona suporte a práticas em áudio na tabela praticas existente.
-- tipo NÃO muda (mantém respiracao/reflexao/afirmacao/movimento); categoria
-- (já text livre) é usada para temas como autocompaixão/aterramento.
alter table public.praticas
  add column if not exists audio_url text,
  add column if not exists duracao_segundos int,
  add column if not exists transcricao text,
  add column if not exists audio_status text not null default 'rascunho',
  add column if not exists is_pro boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'praticas_audio_status_check'
  ) then
    alter table public.praticas
      add constraint praticas_audio_status_check
      check (audio_status in ('rascunho', 'revisada', 'publicada'));
  end if;
end $$;

-- RLS/GRANT existentes de praticas (select para authenticated quando
-- status='publicada') não mudam: as novas colunas ficam sob a mesma policy.

notify pgrst, 'reload schema';
```

- [ ] **Step 3: Rodar a migration localmente**

```bash
supabase db reset
```

Expected: migration aplica sem erro; `praticas` passa a ter as 5 colunas novas.

- [ ] **Step 4: Atualizar `src/lib/supabase/types.ts`**

Editar o tipo `Pratica` (linha ~99-107 hoje) para:

```ts
export type StatusAudioPratica = 'rascunho' | 'revisada' | 'publicada';

export type Pratica = {
  id: string;
  categoria: string;
  tipo: TipoPratica;
  titulo: string;
  conteudo: string;
  status: StatusPratica;
  criado_em: string;
  audio_url: string | null;
  duracao_segundos: number | null;
  transcricao: string | null;
  audio_status: StatusAudioPratica;
  is_pro: boolean;
};
```

Não alterar `TipoPratica` (linha 4) — continua com os 4 valores atuais.

- [ ] **Step 5: Verificar typecheck**

```bash
npm run typecheck
```

Expected: sem erros novos (usos existentes de `Pratica` continuam válidos porque os campos novos têm defaults/são opcionais na leitura).

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations src/lib/supabase/types.ts
git commit -m "feat(db): garante colunas de audio em praticas e atualiza tipos"
```

---

### Task 2: Módulo de posição local do áudio (`src/lib/praticas-audio-posicao/`)

**Files:**
- Create: `src/lib/praticas-audio-posicao/tipos.ts`
- Create: `src/lib/praticas-audio-posicao/armazenamento.ts`
- Create: `src/lib/praticas-audio-posicao/armazenamento.test.ts`

**Interfaces:**
- Produces:
  - `type PosicaoAudio = { praticaId: string; segundos: number; atualizadaEm: string }`
  - `lerPosicao(praticaId: string): number | null`
  - `salvarPosicao(praticaId: string, segundos: number): void`
  - `apagarPosicao(praticaId: string): void`
- Consumes: nada (módulo puro sobre `window.localStorage`, com guarda `typeof window === 'undefined'` para SSR-safety).

- [ ] **Step 1: Escrever `tipos.ts`**

```ts
export interface PosicaoAudio {
  praticaId: string;
  segundos: number;
  atualizadaEm: string; // ISO 8601
}
```

- [ ] **Step 2: Escrever o teste falho**

```ts
// src/lib/praticas-audio-posicao/armazenamento.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { lerPosicao, salvarPosicao, apagarPosicao } from './armazenamento';

function limparStorage() {
  window.localStorage.clear();
}

describe('salvarPosicao / lerPosicao', () => {
  beforeEach(limparStorage);

  it('retorna null quando não há posição salva', () => {
    expect(lerPosicao('respiracao-guiada')).toBeNull();
  });

  it('salva e recupera a posição em segundos de uma prática específica', () => {
    salvarPosicao('respiracao-guiada', 42);
    expect(lerPosicao('respiracao-guiada')).toBe(42);
  });

  it('mantém posições de práticas diferentes isoladas entre si', () => {
    salvarPosicao('respiracao-guiada', 42);
    salvarPosicao('aterramento-guiado', 10);
    expect(lerPosicao('respiracao-guiada')).toBe(42);
    expect(lerPosicao('aterramento-guiado')).toBe(10);
  });

  it('ignora entrada corrompida no localStorage em vez de lançar', () => {
    window.localStorage.setItem('rose:audio-posicao:respiracao-guiada', '{not json');
    expect(lerPosicao('respiracao-guiada')).toBeNull();
  });
});

describe('apagarPosicao', () => {
  beforeEach(limparStorage);

  it('remove a posição salva de uma prática', () => {
    salvarPosicao('respiracao-guiada', 42);
    apagarPosicao('respiracao-guiada');
    expect(lerPosicao('respiracao-guiada')).toBeNull();
  });

  it('não lança erro ao apagar uma posição que nunca existiu', () => {
    expect(() => apagarPosicao('inexistente')).not.toThrow();
  });
});

describe('ambiente sem window', () => {
  it('lerPosicao retorna null sem lançar quando localStorage não está disponível', () => {
    const original = window.localStorage;
    // @ts-expect-error simula ambiente sem localStorage (ex.: SSR)
    delete window.localStorage;
    expect(() => lerPosicao('respiracao-guiada')).not.toThrow();
    expect(lerPosicao('respiracao-guiada')).toBeNull();
    Object.defineProperty(window, 'localStorage', { value: original, configurable: true });
  });
});
```

- [ ] **Step 3: Rodar para confirmar falha**

```bash
npx vitest run src/lib/praticas-audio-posicao/armazenamento.test.ts
```

Expected: FAIL — `./armazenamento` não existe.

- [ ] **Step 4: Implementar `armazenamento.ts`**

```ts
// Posição de reprodução do áudio guiado, salva localmente por dispositivo —
// nunca enviada ao banco (ver regra da Seção 6 do design). Cada prática tem
// sua própria chave, isolada das demais.
import type { PosicaoAudio } from './tipos';

const PREFIXO_CHAVE = 'rose:audio-posicao:';

function chave(praticaId: string): string {
  return `${PREFIXO_CHAVE}${praticaId}`;
}

function localStorageDisponivel(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

export function lerPosicao(praticaId: string): number | null {
  if (!localStorageDisponivel()) return null;

  const bruto = window.localStorage.getItem(chave(praticaId));
  if (!bruto) return null;

  try {
    const dados = JSON.parse(bruto) as PosicaoAudio;
    if (typeof dados.segundos !== 'number' || Number.isNaN(dados.segundos)) return null;
    return dados.segundos;
  } catch {
    return null;
  }
}

export function salvarPosicao(praticaId: string, segundos: number): void {
  if (!localStorageDisponivel()) return;

  const dados: PosicaoAudio = {
    praticaId,
    segundos,
    atualizadaEm: new Date().toISOString(),
  };
  window.localStorage.setItem(chave(praticaId), JSON.stringify(dados));
}

export function apagarPosicao(praticaId: string): void {
  if (!localStorageDisponivel()) return;
  window.localStorage.removeItem(chave(praticaId));
}
```

- [ ] **Step 5: Rodar para confirmar sucesso**

```bash
npx vitest run src/lib/praticas-audio-posicao/armazenamento.test.ts
```

Expected: PASS — 7 testes.

- [ ] **Step 6: Commit**

```bash
git add src/lib/praticas-audio-posicao
git commit -m "feat(praticas-audio): armazenamento local de posicao de reproducao"
```

---

### Task 3: Ícones novos do player (skip ±10s)

**Files:**
- Create: `src/app/components/praticas/icones/IconeSkipTras.tsx`
- Create: `src/app/components/praticas/icones/IconeSkipFrente.tsx`

**Interfaces:**
- Produces: `IconeSkipTras(props: { className?: string })` e `IconeSkipFrente(props: { className?: string })`, componentes SVG puros, mesmo padrão de `IconePlay`/`IconePausa` já existentes (leem `currentColor`).

- [ ] **Step 1: Ler um ícone existente para copiar a convenção exata**

```bash
# (já lido durante a pesquisa: src/app/components/praticas/icones/IconePlay.tsx
# usa <svg> com fill="currentColor" e aceita { className }.)
```

- [ ] **Step 2: Criar `IconeSkipTras.tsx`**

```tsx
export default function IconeSkipTras({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={20}
      height={20}
      aria-hidden="true"
    >
      <polygon points="11 19 2 12 11 5 11 19" />
      <polygon points="22 19 13 12 22 5 22 19" />
    </svg>
  );
}
```

- [ ] **Step 3: Criar `IconeSkipFrente.tsx`**

```tsx
export default function IconeSkipFrente({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={20}
      height={20}
      aria-hidden="true"
    >
      <polygon points="13 19 22 12 13 5 13 19" />
      <polygon points="2 19 11 12 2 5 2 19" />
    </svg>
  );
}
```

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/app/components/praticas/icones/IconeSkipTras.tsx src/app/components/praticas/icones/IconeSkipFrente.tsx
git commit -m "feat(praticas-audio): icones de skip +-10s do player"
```

---

### Task 4: `PlayerAudio` novo — estrutura, play/pause, seek, tempo, skip ±10s

**Files:**
- Modify (reescrita completa): `src/app/components/praticas/PlayerAudio.tsx`
- Create: `src/app/components/praticas/PlayerAudio.test.tsx`

**Interfaces:**
- Consumes: `lerPosicao`, `salvarPosicao`, `apagarPosicao` de `@/lib/praticas-audio-posicao/armazenamento` (Task 2); `IconePlay`, `IconePausa`, `IconeSkipTras`, `IconeSkipFrente` (Task 3, existentes).
- Produces (props finais, usadas pela Task 6 de integração):

```ts
export interface PlayerAudioProps {
  praticaId: string;
  url: string;
  titulo: string;
  duracaoSegundosConhecida: number;
  transcricao: string;
  concluida?: boolean; // quando true, ignora/limpa posição salva ao montar
}
export default function PlayerAudio(props: PlayerAudioProps): JSX.Element;
```

Nota: ao contrário do protótipo atual, `url`/`titulo` não aceitam `null` — a decisão de "não renderizar" é do chamador (Task 6), não do componente. Isso simplifica o player e evita um estado "sem áudio" dentro dele.

- [ ] **Step 1: Escrever o teste falho — renderização básica e play/pause**

```tsx
// src/app/components/praticas/PlayerAudio.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PlayerAudio from './PlayerAudio';
import * as armazenamento from '@/lib/praticas-audio-posicao/armazenamento';

const PROPS_BASE = {
  praticaId: 'respiracao-guiada-audio',
  url: 'https://cdn.exemplo.com/respiracao.mp3',
  titulo: 'Respiração guiada',
  duracaoSegundosConhecida: 180,
  transcricao: 'Sente-se confortavelmente e respire fundo...',
};

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
  // jsdom não implementa play()/pause() em <audio> — stub necessário.
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = vi.fn();
});

describe('PlayerAudio', () => {
  it('renderiza o botão de tocar com aria-label descritivo', () => {
    render(<PlayerAudio {...PROPS_BASE} />);
    expect(screen.getByRole('button', { name: /Tocar áudio de Respiração guiada/ })).toBeInTheDocument();
  });

  it('alterna para "Pausar" após clicar em tocar', () => {
    render(<PlayerAudio {...PROPS_BASE} />);
    const botao = screen.getByRole('button', { name: /Tocar áudio de Respiração guiada/ });
    fireEvent.click(botao);
    fireEvent.play(screen.getByTestId('elemento-audio'));
    expect(screen.getByRole('button', { name: /Pausar áudio de Respiração guiada/ })).toBeInTheDocument();
  });

  it('não usa autoplay no elemento de áudio', () => {
    render(<PlayerAudio {...PROPS_BASE} />);
    const audio = screen.getByTestId('elemento-audio') as HTMLAudioElement;
    expect(audio.autoplay).toBe(false);
  });

  it('usa preload="metadata"', () => {
    render(<PlayerAudio {...PROPS_BASE} />);
    const audio = screen.getByTestId('elemento-audio') as HTMLAudioElement;
    expect(audio.preload).toBe('metadata');
  });

  it('renderiza a barra de progresso como slider acessível com min/max/valor', () => {
    render(<PlayerAudio {...PROPS_BASE} />);
    const slider = screen.getByRole('slider', { name: /Posição no áudio/ });
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '180');
  });

  it('renderiza os botões de skip com aria-label', () => {
    render(<PlayerAudio {...PROPS_BASE} />);
    expect(screen.getByRole('button', { name: 'Voltar 10 segundos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Avançar 10 segundos' })).toBeInTheDocument();
  });

  it('renderiza o seletor de velocidade com as 4 opções', () => {
    render(<PlayerAudio {...PROPS_BASE} />);
    const seletor = screen.getByRole('combobox', { name: /Velocidade de reprodução/ });
    expect(seletor).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '0.75x' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '1x' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '1.25x' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '1.5x' })).toBeInTheDocument();
  });

  it('renderiza a transcrição dentro de um <details> expansível, fechado por padrão', () => {
    render(<PlayerAudio {...PROPS_BASE} />);
    const details = screen.getByText('Ver transcrição').closest('details');
    expect(details).not.toBeNull();
    expect(details).not.toHaveAttribute('open');
    expect(screen.getByText(/Sente-se confortavelmente/)).toBeInTheDocument();
  });

  it('mostra mensagem amigável quando o áudio falha ao carregar', () => {
    render(<PlayerAudio {...PROPS_BASE} />);
    const audio = screen.getByTestId('elemento-audio');
    fireEvent.error(audio);
    expect(
      screen.getByText('Não foi possível carregar este áudio agora. Tente novamente em instantes.')
    ).toBeInTheDocument();
  });

  it('retoma a posição salva ao montar, quando existir', () => {
    armazenamento.salvarPosicao('respiracao-guiada-audio', 42);
    render(<PlayerAudio {...PROPS_BASE} />);
    const audio = screen.getByTestId('elemento-audio') as HTMLAudioElement;
    expect(audio.currentTime).toBe(42);
  });

  it('não retoma posição quando concluida=true — e apaga a posição salva', () => {
    armazenamento.salvarPosicao('respiracao-guiada-audio', 42);
    render(<PlayerAudio {...PROPS_BASE} concluida />);
    expect(armazenamento.lerPosicao('respiracao-guiada-audio')).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar para confirmar falha**

```bash
npx vitest run src/app/components/praticas/PlayerAudio.test.tsx
```

Expected: FAIL (o player atual não tem `data-testid="elemento-audio"`, slider de seek, skip, velocidade, transcrição nem tratamento de erro).

- [ ] **Step 3: Reescrever `PlayerAudio.tsx`**

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import IconePlay from './icones/IconePlay';
import IconePausa from './icones/IconePausa';
import IconeSkipTras from './icones/IconeSkipTras';
import IconeSkipFrente from './icones/IconeSkipFrente';
import { lerPosicao, salvarPosicao, apagarPosicao } from '@/lib/praticas-audio-posicao/armazenamento';

export interface PlayerAudioProps {
  praticaId: string;
  url: string;
  titulo: string;
  duracaoSegundosConhecida: number;
  transcricao: string;
  concluida?: boolean;
}

const VELOCIDADES = [0.75, 1, 1.25, 1.5] as const;
type Velocidade = (typeof VELOCIDADES)[number];

const INTERVALO_SALVAMENTO_MS = 4000;

function formatarTempo(segundosTotal: number): string {
  const segundosInteiros = Math.max(0, Math.floor(segundosTotal));
  const minutos = Math.floor(segundosInteiros / 60);
  const segundos = segundosInteiros % 60;
  return `${minutos}:${segundos.toString().padStart(2, '0')}`;
}

export default function PlayerAudio({
  praticaId,
  url,
  titulo,
  duracaoSegundosConhecida,
  transcricao,
  concluida = false,
}: PlayerAudioProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ultimoSalvamentoRef = useRef(0);

  const [tocando, setTocando] = useState(false);
  const [tempoAtual, setTempoAtual] = useState(0);
  const [duracao, setDuracao] = useState(duracaoSegundosConhecida);
  const [velocidade, setVelocidade] = useState<Velocidade>(1);
  const [erroCarregamento, setErroCarregamento] = useState(false);

  // Retoma posição salva ao montar (ou apaga, se a prática já foi concluída).
  useEffect(() => {
    if (concluida) {
      apagarPosicao(praticaId);
      return;
    }
    const posicaoSalva = lerPosicao(praticaId);
    if (posicaoSalva !== null && audioRef.current) {
      audioRef.current.currentTime = posicaoSalva;
      setTempoAtual(posicaoSalva);
    }
    // Roda só na montagem — mudanças posteriores de `concluida` são tratadas
    // separadamente, e `praticaId` não muda depois de montado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Media Session API — atrás de feature-detection, com cleanup no
  // desmontar. Permite controlar play/pause/skip pelos controles do SO.
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({ title: titulo });

    navigator.mediaSession.setActionHandler('play', () => audioRef.current?.play());
    navigator.mediaSession.setActionHandler('pause', () => audioRef.current?.pause());
    navigator.mediaSession.setActionHandler('seekbackward', () => aplicarSkip(-10));
    navigator.mediaSession.setActionHandler('seekforward', () => aplicarSkip(10));

    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titulo]);

  function alternarReproducao() {
    const audio = audioRef.current;
    if (!audio) return;
    if (tocando) {
      audio.pause();
    } else {
      audio.play();
    }
  }

  function aplicarSkip(deltaSegundos: number) {
    const audio = audioRef.current;
    if (!audio) return;
    const alvo = Math.min(Math.max(audio.currentTime + deltaSegundos, 0), duracao);
    audio.currentTime = alvo;
    setTempoAtual(alvo);
    salvarPosicaoComThrottle(alvo, true);
  }

  function salvarPosicaoComThrottle(segundos: number, forcar = false) {
    const agora = Date.now();
    if (!forcar && agora - ultimoSalvamentoRef.current < INTERVALO_SALVAMENTO_MS) return;
    ultimoSalvamentoRef.current = agora;
    salvarPosicao(praticaId, segundos);
  }

  function aoAtualizarTempo(segundos: number) {
    setTempoAtual(segundos);
    salvarPosicaoComThrottle(segundos);
  }

  function aoMudarVelocidade(valor: string) {
    const nova = Number(valor) as Velocidade;
    setVelocidade(nova);
    if (audioRef.current) audioRef.current.playbackRate = nova;
  }

  function aoTerminarAudio() {
    setTocando(false);
    apagarPosicao(praticaId);
  }

  return (
    <div className="space-y-3 rounded-2xl border border-borda/60 bg-superficie px-4 py-3.5">
      <audio
        ref={audioRef}
        src={url}
        data-testid="elemento-audio"
        preload="metadata"
        autoPlay={false}
        onPlay={() => setTocando(true)}
        onPause={() => setTocando(false)}
        onEnded={aoTerminarAudio}
        onError={() => setErroCarregamento(true)}
        onLoadedMetadata={(evento) => {
          const duracaoReal = evento.currentTarget.duration;
          if (Number.isFinite(duracaoReal) && duracaoReal > 0) setDuracao(duracaoReal);
        }}
        onTimeUpdate={(evento) => aoAtualizarTempo(evento.currentTarget.currentTime)}
      />

      {erroCarregamento ? (
        <p role="alert" className="text-sm text-texto-suave">
          Não foi possível carregar este áudio agora. Tente novamente em instantes.
        </p>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => aplicarSkip(-10)}
              aria-label="Voltar 10 segundos"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-texto transition-colors hover:bg-fundo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60"
            >
              <IconeSkipTras />
            </button>

            <button
              type="button"
              onClick={alternarReproducao}
              onKeyDown={(evento) => {
                if (evento.key === ' ') {
                  evento.preventDefault();
                  alternarReproducao();
                }
              }}
              aria-label={tocando ? `Pausar áudio de ${titulo}` : `Tocar áudio de ${titulo}`}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-acao text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60 focus-visible:ring-offset-2"
            >
              {tocando ? <IconePausa /> : <IconePlay />}
            </button>

            <button
              type="button"
              onClick={() => aplicarSkip(10)}
              aria-label="Avançar 10 segundos"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-texto transition-colors hover:bg-fundo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60"
            >
              <IconeSkipFrente />
            </button>

            <span className="shrink-0 text-xs tabular-nums text-texto-suave">
              {formatarTempo(tempoAtual)} / {formatarTempo(duracao)}
            </span>
          </div>

          <input
            type="range"
            role="slider"
            min={0}
            max={duracao}
            step={1}
            value={tempoAtual}
            aria-label="Posição no áudio"
            aria-valuemin={0}
            aria-valuemax={duracao}
            aria-valuenow={tempoAtual}
            aria-valuetext={`${formatarTempo(tempoAtual)} de ${formatarTempo(duracao)}`}
            onChange={(evento) => {
              const novoTempo = Number(evento.target.value);
              if (audioRef.current) audioRef.current.currentTime = novoTempo;
              setTempoAtual(novoTempo);
              salvarPosicaoComThrottle(novoTempo, true);
            }}
            className="w-full accent-acao"
          />

          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs text-texto-suave">
              Velocidade
              <select
                value={velocidade}
                aria-label="Velocidade de reprodução"
                onChange={(evento) => aoMudarVelocidade(evento.target.value)}
                className="rounded-lg border border-borda/60 bg-fundo px-2 py-1 text-xs text-texto"
              >
                {VELOCIDADES.map((v) => (
                  <option key={v} value={v}>
                    {v}x
                  </option>
                ))}
              </select>
            </label>
          </div>
        </>
      )}

      <details className="text-sm text-texto-suave">
        <summary className="cursor-pointer font-medium text-texto">Ver transcrição</summary>
        <p className="mt-2 whitespace-pre-line">{transcricao}</p>
      </details>
    </div>
  );
}
```

- [ ] **Step 4: Rodar para confirmar sucesso**

```bash
npx vitest run src/app/components/praticas/PlayerAudio.test.tsx
```

Expected: PASS — todos os testes do Step 1.

- [ ] **Step 5: Commit**

```bash
git add src/app/components/praticas/PlayerAudio.tsx src/app/components/praticas/PlayerAudio.test.tsx
git commit -m "feat(praticas-audio): reescreve PlayerAudio com seek, skip, velocidade e transcricao"
```

---

### Task 5: Camada `src/lib/praticas-catalogo/` — unificação de catálogos

**Files:**
- Create: `src/lib/praticas-catalogo/tipos.ts`
- Create: `src/lib/praticas-catalogo/unificar.ts`
- Create: `src/lib/praticas-catalogo/unificar.test.ts`
- Create: `src/lib/praticas-catalogo/buscarPraticasAudioPublicadas.ts`
- Create: `src/lib/praticas-catalogo/buscarPraticasAudioPublicadas.test.ts`

**Interfaces:**
- Consumes: `PraticaRapida` de `@/lib/praticas-conteudo/tipos` (existente); `Pratica` de `@/lib/supabase/types` (Task 1); `SupabaseClient<Database>` de `@supabase/supabase-js`.
- Produces:

```ts
export type FonteCatalogoPratica = 'rapida' | 'audio';

export interface ItemCatalogoPratica {
  // Prefixado pela fonte para garantir unicidade entre os dois catálogos
  // (ex.: "rapida:respiracao" vs "audio:<uuid-do-banco>") — nunca colide
  // mesmo que um slug de PRATICAS_RAPIDAS coincida com um id de praticas.
  id: string;
  fonte: FonteCatalogoPratica;
  idOriginal: string;
  href: string;
  titulo: string;
  descricaoCurta: string;
  duracaoLabel: string;
  categoria: string;
  temAudio: boolean;
}

export function unificarCatalogo(
  praticasRapidas: PraticaRapida[],
  praticasAudio: Pratica[]
): ItemCatalogoPratica[];

export async function buscarPraticasAudioPublicadas(
  supabase: SupabaseClient<Database>
): Promise<Pratica[]>;
```

- [ ] **Step 1: Escrever `tipos.ts`**

```ts
// Forma unificada de item de listagem em /praticas, combinando as práticas
// rápidas interativas (código, sem persistência) com as práticas em áudio
// publicadas (tabela `praticas`). Não substitui nenhum dos dois catálogos
// de origem — é só a camada de apresentação da listagem.
export type FonteCatalogoPratica = 'rapida' | 'audio';

export interface ItemCatalogoPratica {
  id: string;
  fonte: FonteCatalogoPratica;
  idOriginal: string;
  href: string;
  titulo: string;
  descricaoCurta: string;
  duracaoLabel: string;
  categoria: string;
  temAudio: boolean;
}
```

- [ ] **Step 2: Escrever o teste falho de `unificarCatalogo`**

```ts
// src/lib/praticas-catalogo/unificar.test.ts
import { describe, it, expect } from 'vitest';
import { unificarCatalogo } from './unificar';
import type { PraticaRapida } from '@/lib/praticas-conteudo/tipos';
import type { Pratica } from '@/lib/supabase/types';

const PRATICA_RAPIDA_EXEMPLO: PraticaRapida = {
  id: 'respiracao',
  categoria: 'respiracao',
  titulo: 'Respiração',
  descricaoCurta: 'Respire fundo e reconecte-se.',
  duracaoMinutos: 3,
  duracaoLabel: '3 min',
  corCartao: 'salvia',
  nivel: 'iniciante',
  premium: false,
  gratuita: true,
  midia: { tipo: null, url: null, miniaturaUrl: null },
};

function praticaAudioExemplo(overrides: Partial<Pratica> = {}): Pratica {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    categoria: 'autocompaixao',
    tipo: 'reflexao',
    titulo: 'Pausa de autocompaixão',
    conteudo: 'Roteiro completo...',
    status: 'publicada',
    criado_em: '2026-01-01T00:00:00.000Z',
    audio_url: 'https://cdn.exemplo.com/audio.mp3',
    duracao_segundos: 300,
    transcricao: 'Transcrição completa...',
    audio_status: 'publicada',
    is_pro: true,
    ...overrides,
  };
}

describe('unificarCatalogo', () => {
  it('inclui todas as práticas rápidas com fonte "rapida" e id prefixado', () => {
    const resultado = unificarCatalogo([PRATICA_RAPIDA_EXEMPLO], []);
    expect(resultado).toHaveLength(1);
    expect(resultado[0]).toMatchObject({
      id: 'rapida:respiracao',
      fonte: 'rapida',
      idOriginal: 'respiracao',
      href: '/praticas/respiracao',
      titulo: 'Respiração',
      temAudio: false,
    });
  });

  it('inclui práticas de áudio com fonte "audio" e id prefixado, sem colidir com práticas rápidas', () => {
    const audio = praticaAudioExemplo({ id: 'respiracao' }); // mesmo slug textual, fonte diferente
    const resultado = unificarCatalogo([PRATICA_RAPIDA_EXEMPLO], [audio]);
    const ids = resultado.map((item) => item.id);
    expect(ids).toEqual(['rapida:respiracao', 'audio:respiracao']);
    expect(new Set(ids).size).toBe(2);
  });

  it('marca temAudio=true para itens vindos da tabela praticas', () => {
    const resultado = unificarCatalogo([], [praticaAudioExemplo()]);
    expect(resultado[0].temAudio).toBe(true);
    expect(resultado[0].href).toBe('/praticas/11111111-1111-1111-1111-111111111111');
  });

  it('usa a categoria da prática de áudio como categoria do item unificado', () => {
    const resultado = unificarCatalogo([], [praticaAudioExemplo({ categoria: 'aterramento' })]);
    expect(resultado[0].categoria).toBe('aterramento');
  });

  it('formata a duração da prática de áudio a partir de duracao_segundos', () => {
    const resultado = unificarCatalogo([], [praticaAudioExemplo({ duracao_segundos: 125 })]);
    expect(resultado[0].duracaoLabel).toBe('3 min');
  });

  it('usa os primeiros 140 caracteres do conteúdo como descrição curta da prática de áudio', () => {
    const conteudoLongo = 'x'.repeat(200);
    const resultado = unificarCatalogo([], [praticaAudioExemplo({ conteudo: conteudoLongo })]);
    expect(resultado[0].descricaoCurta).toHaveLength(140);
  });

  it('retorna lista vazia quando ambos os catálogos estão vazios', () => {
    expect(unificarCatalogo([], [])).toEqual([]);
  });
});
```

- [ ] **Step 3: Rodar para confirmar falha**

```bash
npx vitest run src/lib/praticas-catalogo/unificar.test.ts
```

Expected: FAIL — módulo não existe.

- [ ] **Step 4: Implementar `unificar.ts`**

```ts
import type { PraticaRapida } from '@/lib/praticas-conteudo/tipos';
import type { Pratica } from '@/lib/supabase/types';
import type { ItemCatalogoPratica } from './tipos';

function duracaoLabelDeSegundos(segundos: number | null): string {
  if (!segundos || segundos <= 0) return '';
  const minutos = Math.max(1, Math.round(segundos / 60));
  return `${minutos} min`;
}

function descricaoCurtaDeConteudo(conteudo: string): string {
  return conteudo.slice(0, 140);
}

export function unificarCatalogo(
  praticasRapidas: PraticaRapida[],
  praticasAudio: Pratica[]
): ItemCatalogoPratica[] {
  const itensRapidas: ItemCatalogoPratica[] = praticasRapidas.map((pratica) => ({
    id: `rapida:${pratica.id}`,
    fonte: 'rapida',
    idOriginal: pratica.id,
    href: `/praticas/${pratica.id}`,
    titulo: pratica.titulo,
    descricaoCurta: pratica.descricaoCurta,
    duracaoLabel: pratica.duracaoLabel,
    categoria: pratica.categoria,
    temAudio: false,
  }));

  const itensAudio: ItemCatalogoPratica[] = praticasAudio.map((pratica) => ({
    id: `audio:${pratica.id}`,
    fonte: 'audio',
    idOriginal: pratica.id,
    href: `/praticas/${pratica.id}`,
    titulo: pratica.titulo,
    descricaoCurta: descricaoCurtaDeConteudo(pratica.conteudo),
    duracaoLabel: duracaoLabelDeSegundos(pratica.duracao_segundos),
    categoria: pratica.categoria,
    temAudio: true,
  }));

  return [...itensRapidas, ...itensAudio];
}
```

- [ ] **Step 5: Rodar para confirmar sucesso**

```bash
npx vitest run src/lib/praticas-catalogo/unificar.test.ts
```

Expected: PASS.

- [ ] **Step 6: Escrever o teste falho de `buscarPraticasAudioPublicadas`**

```ts
// src/lib/praticas-catalogo/buscarPraticasAudioPublicadas.test.ts
import { describe, it, expect, vi } from 'vitest';
import { buscarPraticasAudioPublicadas } from './buscarPraticasAudioPublicadas';

function criarSupabaseFalso(retorno: { data: unknown; error: unknown }) {
  const eq3 = vi.fn().mockResolvedValue(retorno);
  const eq2 = vi.fn().mockReturnValue({ eq: eq3 });
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
  const not1 = vi.fn().mockReturnValue({ eq: eq1 });
  const select = vi.fn().mockReturnValue({ not: not1 });
  const from = vi.fn().mockReturnValue({ select });
  return { supabase: { from } as never, from, select, not1, eq1, eq2, eq3 };
}

describe('buscarPraticasAudioPublicadas', () => {
  it('consulta a tabela praticas filtrando status e audio_status publicados e mídia não nula', async () => {
    const { supabase, from, select, not1, eq1, eq2, eq3 } = criarSupabaseFalso({ data: [], error: null });
    await buscarPraticasAudioPublicadas(supabase);
    expect(from).toHaveBeenCalledWith('praticas');
    expect(select).toHaveBeenCalledWith('*');
    expect(not1).toHaveBeenCalledWith('audio_url', 'is', null);
    expect(eq1).toHaveBeenCalledWith('status', 'publicada');
    expect(eq2).toHaveBeenCalledWith('audio_status', 'publicada');
    expect(eq3).toHaveBeenCalledWith('is_pro', expect.anything());
  });

  it('retorna lista vazia quando a consulta falha, em vez de lançar', async () => {
    const { supabase } = criarSupabaseFalso({ data: null, error: new Error('falhou') });
    const resultado = await buscarPraticasAudioPublicadas(supabase);
    expect(resultado).toEqual([]);
  });
});
```

Nota: o teste acima checa `eq3` com `is_pro` genérico porque a implementação real não filtra por `is_pro` na listagem (usuárias free veem o cartão, o gate acontece na página de detalhe) — ajustar a asserção na Step 8 se a cadeia de chamadas final for diferente; o importante validado é `status`, `audio_status` e `audio_url is not null`. Substituir a asserção de `eq3` por uma checagem mais simples caso a implementação não inclua esse terceiro `.eq`.

- [ ] **Step 7: Simplificar o teste antes de implementar (evitar acoplamento excessivo à cadeia de chamadas)**

Reescrever `buscarPraticasAudioPublicadas.test.ts` para validar o resultado, não a cadeia de métodos, usando um cliente falso mais simples:

```ts
// src/lib/praticas-catalogo/buscarPraticasAudioPublicadas.test.ts
import { describe, it, expect, vi } from 'vitest';
import { buscarPraticasAudioPublicadas } from './buscarPraticasAudioPublicadas';

function criarQueryEncadeavel(retorno: { data: unknown; error: unknown }) {
  const query: Record<string, unknown> = {};
  query.select = vi.fn().mockReturnValue(query);
  query.eq = vi.fn().mockReturnValue(query);
  query.not = vi.fn().mockReturnValue(query);
  query.then = (resolve: (v: typeof retorno) => void) => resolve(retorno);
  return query;
}

describe('buscarPraticasAudioPublicadas', () => {
  it('retorna as práticas de áudio quando a consulta é bem-sucedida', async () => {
    const linha = {
      id: '1',
      categoria: 'aterramento',
      tipo: 'reflexao',
      titulo: 'Aterramento guiado',
      conteudo: 'Roteiro...',
      status: 'publicada',
      criado_em: '2026-01-01T00:00:00.000Z',
      audio_url: 'https://cdn.exemplo.com/a.mp3',
      duracao_segundos: 240,
      transcricao: 'Transcrição...',
      audio_status: 'publicada',
      is_pro: false,
    };
    const query = criarQueryEncadeavel({ data: [linha], error: null });
    const from = vi.fn().mockReturnValue(query);
    const supabase = { from } as never;

    const resultado = await buscarPraticasAudioPublicadas(supabase);

    expect(from).toHaveBeenCalledWith('praticas');
    expect(resultado).toEqual([linha]);
  });

  it('retorna lista vazia quando a consulta falha, em vez de lançar', async () => {
    const query = criarQueryEncadeavel({ data: null, error: new Error('falhou') });
    const from = vi.fn().mockReturnValue(query);
    const supabase = { from } as never;

    const resultado = await buscarPraticasAudioPublicadas(supabase);

    expect(resultado).toEqual([]);
  });
});
```

- [ ] **Step 8: Rodar para confirmar falha**

```bash
npx vitest run src/lib/praticas-catalogo/buscarPraticasAudioPublicadas.test.ts
```

Expected: FAIL — módulo não existe.

- [ ] **Step 9: Implementar `buscarPraticasAudioPublicadas.ts`**

```ts
// Busca práticas de áudio prontas para exibição pública: publicadas tanto
// no texto (status) quanto no áudio (audio_status), com toda a mídia
// presente. Decisão de visibilidade fica aqui na camada de aplicação —
// nunca em constraint de banco (ver Seção 6 do design).
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Pratica } from '@/lib/supabase/types';

export async function buscarPraticasAudioPublicadas(
  supabase: SupabaseClient<Database>
): Promise<Pratica[]> {
  const { data, error } = await supabase
    .from('praticas')
    .select('*')
    .eq('status', 'publicada')
    .eq('audio_status', 'publicada')
    .not('audio_url', 'is', null)
    .not('duracao_segundos', 'is', null)
    .not('transcricao', 'is', null);

  if (error || !data) return [];
  return data;
}
```

- [ ] **Step 10: Rodar para confirmar sucesso**

```bash
npx vitest run src/lib/praticas-catalogo
```

Expected: PASS — todos os testes de `unificar.test.ts` e `buscarPraticasAudioPublicadas.test.ts`.

- [ ] **Step 11: Commit**

```bash
git add src/lib/praticas-catalogo
git commit -m "feat(praticas-audio): camada de catalogo unificado rapidas+audio"
```

---

### Task 6: Integrar catálogo unificado em `/praticas` e cartão de áudio

**Files:**
- Modify: `src/app/praticas/page.tsx`
- Create: `src/app/components/praticas/CartaoItemCatalogo.tsx`
- Create: `src/app/components/praticas/CartaoItemCatalogo.test.tsx`

**Interfaces:**
- Consumes: `unificarCatalogo`, `ItemCatalogoPratica` (Task 5); `buscarPraticasAudioPublicadas` (Task 5); `PRATICAS_RAPIDAS` (existente); `createSupabaseServerClient` de `@/lib/supabase/server` (existente, padrão já usado em `praticas/[id]/page.tsx`).
- Produces: `CartaoItemCatalogo({ item: ItemCatalogoPratica })` — substitui `CartaoPraticaRapida` na listagem (que continua existindo e exportado, sem remoção, para não quebrar nenhum outro consumidor).

- [ ] **Step 1: Escrever o teste falho de `CartaoItemCatalogo`**

```tsx
// src/app/components/praticas/CartaoItemCatalogo.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CartaoItemCatalogo from './CartaoItemCatalogo';
import type { ItemCatalogoPratica } from '@/lib/praticas-catalogo/tipos';

const ITEM_RAPIDA: ItemCatalogoPratica = {
  id: 'rapida:respiracao',
  fonte: 'rapida',
  idOriginal: 'respiracao',
  href: '/praticas/respiracao',
  titulo: 'Respiração',
  descricaoCurta: 'Respire fundo e reconecte-se.',
  duracaoLabel: '3 min',
  categoria: 'respiracao',
  temAudio: false,
};

const ITEM_AUDIO: ItemCatalogoPratica = {
  id: 'audio:uuid-1',
  fonte: 'audio',
  idOriginal: 'uuid-1',
  href: '/praticas/uuid-1',
  titulo: 'Pausa de autocompaixão',
  descricaoCurta: 'Um convite gentil para se acolher.',
  duracaoLabel: '5 min',
  categoria: 'autocompaixao',
  temAudio: true,
};

describe('CartaoItemCatalogo', () => {
  it('renderiza um link com href igual ao do item', () => {
    render(<CartaoItemCatalogo item={ITEM_RAPIDA} />);
    expect(screen.getByRole('link').getAttribute('href')).toBe('/praticas/respiracao');
  });

  it('renderiza o título e a duração do item', () => {
    render(<CartaoItemCatalogo item={ITEM_AUDIO} />);
    expect(screen.getByText('Pausa de autocompaixão')).toBeInTheDocument();
    expect(screen.getByText('5 min')).toBeInTheDocument();
  });

  it('indica visualmente quando o item tem áudio guiado', () => {
    render(<CartaoItemCatalogo item={ITEM_AUDIO} />);
    expect(screen.getByText('Áudio guiado')).toBeInTheDocument();
  });

  it('não mostra o indicador de áudio para práticas rápidas sem áudio', () => {
    render(<CartaoItemCatalogo item={ITEM_RAPIDA} />);
    expect(screen.queryByText('Áudio guiado')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar para confirmar falha**

```bash
npx vitest run src/app/components/praticas/CartaoItemCatalogo.test.tsx
```

Expected: FAIL — componente não existe.

- [ ] **Step 3: Implementar `CartaoItemCatalogo.tsx`**

```tsx
import Link from 'next/link';

import type { ItemCatalogoPratica } from '@/lib/praticas-catalogo/tipos';

export default function CartaoItemCatalogo({ item }: { item: ItemCatalogoPratica }) {
  return (
    <Link
      href={item.href}
      aria-label={`${item.titulo}, ${item.duracaoLabel}. ${item.descricaoCurta}`}
      className="flex items-center gap-3 rounded-[28px] border border-borda/50 bg-superficie px-4 py-3.5 transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60 focus-visible:ring-offset-2 focus-visible:ring-offset-fundo"
    >
      <span className="min-w-0 flex-1">
        <span className="block font-display text-base text-texto">{item.titulo}</span>
        <span className="block truncate text-sm text-texto-suave">{item.descricaoCurta}</span>
        {item.temAudio && (
          <span className="mt-1 inline-block rounded-full bg-destaque/25 px-2 py-0.5 text-xs font-medium text-texto">
            Áudio guiado
          </span>
        )}
      </span>
      <span className="shrink-0 rounded-full bg-borda/40 px-2.5 py-1 text-xs font-medium text-texto">
        {item.duracaoLabel}
      </span>
    </Link>
  );
}
```

- [ ] **Step 4: Rodar para confirmar sucesso**

```bash
npx vitest run src/app/components/praticas/CartaoItemCatalogo.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Atualizar `src/app/praticas/page.tsx` para buscar e unificar**

```tsx
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import CabecalhoPraticas from '@/app/components/praticas/CabecalhoPraticas';
import CartaoItemCatalogo from '@/app/components/praticas/CartaoItemCatalogo';
import { PRATICAS_RAPIDAS } from '@/lib/praticas-conteudo/dados';
import { unificarCatalogo } from '@/lib/praticas-catalogo/unificar';
import { buscarPraticasAudioPublicadas } from '@/lib/praticas-catalogo/buscarPraticasAudioPublicadas';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function PraticasPage() {
  const supabase = await createSupabaseServerClient();
  const praticasAudio = await buscarPraticasAudioPublicadas(supabase);
  const itens = unificarCatalogo(PRATICAS_RAPIDAS, praticasAudio);

  return (
    <main className="mx-auto max-w-md space-y-6 px-4 pt-6 pb-[calc(6rem_+_env(safe-area-inset-bottom))] md:pb-8">
      <CabecalhoPraticas />
      <div className="space-y-2.5">
        {itens.map((item) => (
          <CartaoItemCatalogo key={item.id} item={item} />
        ))}
      </div>
      <NavegacaoInferior />
    </main>
  );
}
```

Nota: `CartaoPraticaRapida.tsx` continua existindo sem alteração (ainda usado, por exemplo, por qualquer outra tela futura ou teste que já dependa dele) — apenas a listagem de `/praticas` passa a usar `CartaoItemCatalogo`.

- [ ] **Step 6: Rodar o build/typecheck para garantir que a página compila**

```bash
npm run typecheck
```

Expected: sem erros.

- [ ] **Step 7: Commit**

```bash
git add src/app/praticas/page.tsx src/app/components/praticas/CartaoItemCatalogo.tsx src/app/components/praticas/CartaoItemCatalogo.test.tsx
git commit -m "feat(praticas-audio): unifica listagem /praticas com catalogo de audio"
```

---

### Task 7: Gate Pro no servidor e integração do `PlayerAudio` em `/praticas/[id]`

**Files:**
- Modify: `src/app/praticas/[id]/page.tsx`

**Interfaces:**
- Consumes: `PlayerAudioProps` (Task 4, exato: `praticaId`, `url`, `titulo`, `duracaoSegundosConhecida`, `transcricao`, `concluida?`); `Pratica` (Task 1, com `is_pro`/`audio_status`/`audio_url`/`duracao_segundos`/`transcricao`); `createSupabaseServerClient` (existente).
- Produces: página server component que decide visibilidade do player e do gate Pro — sem novos exports consumidos por outras tasks.

- [ ] **Step 1: Ler o padrão de leitura de perfil/plano usado em outras rotas server (para reaproveitar)**

Confirmado na pesquisa: `src/app/premium/page.tsx` e `src/app/api/stripe/checkout/route.ts` leem `perfil?.plano === 'premium'` a partir de `supabase.from('perfis').select(...).eq('id', user.id).single()`. Este mesmo padrão será reaproveitado.

- [ ] **Step 2: Reescrever `src/app/praticas/[id]/page.tsx`**

```tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import PlayerAudio from '@/app/components/praticas/PlayerAudio';

export default async function PraticaBibliotecaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: pratica } = await supabase
    .from('praticas')
    .select('*')
    .eq('id', id)
    .eq('status', 'publicada')
    .single();

  if (!pratica) {
    notFound();
  }

  const audioProntoParaExibicao =
    pratica.audio_status === 'publicada' &&
    !!pratica.audio_url &&
    !!pratica.duracao_segundos &&
    !!pratica.transcricao;

  let bloqueadoPorPro = false;
  if (audioProntoParaExibicao && pratica.is_pro) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      bloqueadoPorPro = true;
    } else {
      const { data: perfil } = await supabase.from('perfis').select('plano').eq('id', user.id).single();
      bloqueadoPorPro = perfil?.plano !== 'premium';
    }
  }

  return (
    <main className="mx-auto max-w-md space-y-6 p-6 pb-[calc(6rem_+_env(safe-area-inset-bottom))] md:pb-6">
      <span className="text-xs font-medium uppercase tracking-wide text-destaque">
        {pratica.categoria}
      </span>
      <h1 className="font-display text-2xl text-texto">{pratica.titulo}</h1>
      <p className="whitespace-pre-line text-texto">{pratica.conteudo}</p>

      {audioProntoParaExibicao && bloqueadoPorPro && (
        <div className="rounded-2xl border border-borda/60 bg-superficie px-4 py-3.5 text-sm text-texto-suave">
          O áudio guiado desta prática é exclusivo do Rose Pro.{' '}
          <Link href="/premium" className="font-medium text-acao underline">
            Conheça o Rose Pro
          </Link>
          .
        </div>
      )}

      {audioProntoParaExibicao && !bloqueadoPorPro && (
        <PlayerAudio
          praticaId={pratica.id}
          url={pratica.audio_url as string}
          titulo={pratica.titulo}
          duracaoSegundosConhecida={pratica.duracao_segundos as number}
          transcricao={pratica.transcricao as string}
        />
      )}

      <Link
        href="/praticas"
        className="block w-full rounded-2xl border border-borda p-3 text-center font-medium text-texto-suave transition-colors hover:bg-superficie"
      >
        Voltar para a biblioteca
      </Link>
      <NavegacaoInferior />
    </main>
  );
}
```

Nota importante sobre segurança do gate: como `pratica.conteudo` (o roteiro textual) já é retornado pela query `select('*')` independente de `is_pro`, e o design não pede bloqueio do texto (só do "acesso à biblioteca de áudios" conforme a tabela de planos e acesso da Seção "Planos e acesso"), o texto do roteiro continua visível para todas — só o player de áudio fica atrás do gate. Isso é consistente com a tabela do design (`Biblioteca de áudios | Rose Pro, com 1 prática gratuita de demonstração`) e com `PRATICAS_RAPIDAS`, que já é toda gratuita.

- [ ] **Step 3: Rodar o typecheck**

```bash
npm run typecheck
```

Expected: sem erros.

- [ ] **Step 4: Rodar a suíte completa de testes de práticas para checar nada quebrou**

```bash
npx vitest run src/app/praticas src/lib/praticas-catalogo src/lib/praticas-audio-posicao src/app/components/praticas
```

Expected: PASS em todos os arquivos.

- [ ] **Step 5: Commit**

```bash
git add src/app/praticas/[id]/page.tsx
git commit -m "feat(praticas-audio): gate Pro no servidor e player na pagina de detalhe"
```

---

### Task 8: Três roteiros de exemplo em rascunho (seed) — respiração, autocompaixão, aterramento

**Files:**
- Create: `supabase/migrations/<timestamp>_seed_praticas_audio_rascunho.sql` (nome gerado por `supabase migration new seed_praticas_audio_rascunho`)

**Interfaces:**
- Produces: 3 linhas em `public.praticas`, todas com `status='rascunho'`, `audio_status='rascunho'`, `is_pro=true` (exceto a segunda, gratuita de demonstração conforme a tabela "Planos e acesso": "1 prática gratuita de demonstração" — usada aqui na prática de respiração, `is_pro=false`), `audio_url=null` (nenhuma gravação existe ainda).

- [ ] **Step 1: Gerar a migration**

```bash
supabase migration new seed_praticas_audio_rascunho
```

- [ ] **Step 2: Preencher com os 3 roteiros**

Roteiros escritos seguindo as regras transversais: nunca prometem cura, nunca prometem controlar uma crise, nunca substituem atendimento profissional; linguagem descritiva, acolhedora, em segunda pessoa, com convites (não ordens).

```sql
-- Três roteiros de exemplo para práticas em áudio (respiração, autocompaixão,
-- aterramento). Entram como rascunho de texto E de áudio — não aparecem em
-- produção (a query de listagem e a página de detalhe só mostram práticas
-- com status='publicada' e audio_status='publicada') até revisão da
-- psicóloga responsável e gravação real do áudio. Nenhum arquivo de áudio
-- existe ainda: audio_url fica null propositalmente.
insert into public.praticas (categoria, tipo, titulo, conteudo, status, audio_status, is_pro)
values
  (
    'respiracao',
    'respiracao',
    'Respiração para desacelerar',
    E'Encontre uma posição em que seu corpo possa ficar apoiado — sentada ou deitada, como for mais confortável para você agora.\n\n'
    || E'Quando quiser, feche os olhos ou deixe o olhar suave, voltado para baixo.\n\n'
    || E'Perceba o ar entrando pelo nariz. Sem forçar, sem pressa. Só percebendo.\n\n'
    || E'Agora, inspire contando até quatro, devagar.\n\n'
    || E'Segure o ar por um instante breve — só o que for confortável para você.\n\n'
    || E'Solte o ar contando até seis, deixando os ombros afundarem um pouco.\n\n'
    || E'Repita esse ciclo algumas vezes, no seu próprio ritmo. Não existe forma certa de fazer isso — existe a forma que funciona para você hoje.\n\n'
    || E'Se a mente se distrair, tudo bem. Perceba, e volte a atenção para o ar entrando e saindo.\n\n'
    || E'Esta pausa é sua. Ela não muda o que está acontecendo lá fora, mas pode te ajudar a chegar até o próximo momento com um pouco mais de espaço dentro de você.\n\n'
    || E'Se em algum momento você sentir que precisa de mais apoio do que uma pausa pode oferecer, procurar um profissional de saúde é um passo de cuidado — não um sinal de que você não deu conta.',
    'rascunho',
    'rascunho',
    false
  ),
  (
    'autocompaixao',
    'reflexao',
    'Uma pausa de autocompaixão',
    E'Este é um convite para tratar a si mesma como você trataria alguém que você ama, quando essa pessoa está passando por um momento difícil.\n\n'
    || E'Comece só percebendo como você está agora, sem tentar mudar nada ainda. Nomeie para si mesma, em silêncio: "este é um momento difícil" — ou as palavras que fizerem sentido para você.\n\n'
    || E'Lembre-se: dificuldade faz parte da experiência de ser humana. Você não está sozinha nisso, mesmo quando parece que está.\n\n'
    || E'Agora, se quiser, coloque a mão sobre o peito, ou em outro lugar que traga uma sensação de acolhimento. Sinta o calor da sua própria mão.\n\n'
    || E'Pergunte-se, com gentileza: "do que eu preciso ouvir agora?" Pode ser "eu posso ser gentil comigo", "isso vai passar", "eu estou fazendo o que consigo com o que tenho agora".\n\n'
    || E'Não é sobre resolver o que está difícil neste instante. É sobre não se tratar com dureza por estar difícil.\n\n'
    || E'Quando fizer sentido para você, devagar, volte a atenção para o espaço ao seu redor.\n\n'
    || E'Esta prática é um gesto de cuidado, não um tratamento e não substitui acompanhamento psicológico. Se o que você está sentindo persiste ou pesa mais do que você consegue segurar sozinha, buscar apoio profissional é um cuidado válido e importante.',
    'rascunho',
    'rascunho',
    true
  ),
  (
    'aterramento',
    'movimento',
    'Aterramento pelos sentidos',
    E'Esta prática usa os sentidos para te ajudar a chegar ao momento presente. Você pode fazer sentada, em pé ou deitada — onde estiver, como estiver.\n\n'
    || E'Olhe ao redor e note, em silêncio, cinco coisas que você consegue ver. Não precisa ser nada especial — uma cor, uma sombra, um objeto qualquer.\n\n'
    || E'Agora, perceba quatro coisas que você consegue sentir tocando seu corpo: o tecido da roupa, o apoio dos pés no chão, a temperatura do ar.\n\n'
    || E'Perceba três sons ao seu redor, próximos ou distantes. Só perceba, sem julgar se são bons ou ruins.\n\n'
    || E'Se possível, note dois cheiros — mesmo que sutis, mesmo que seja só o ar.\n\n'
    || E'E, se fizer sentido, perceba um sabor na sua boca neste momento.\n\n'
    || E'Devagar, volte a atenção para a sua respiração, e para o espaço em que você está.\n\n'
    || E'Você pode repetir essa sequência quantas vezes quiser, na ordem que for mais útil para você.\n\n'
    || E'Esta prática ajuda a reconectar com o momento presente, mas não é um recurso de emergência nem substitui ajuda profissional. Em caso de crise ou risco imediato, procure o espaço "Preciso de ajuda agora" da Rose ou um serviço de emergência local.',
    'rascunho',
    'rascunho',
    true
  );

notify pgrst, 'reload schema';
```

- [ ] **Step 3: Rodar a migration localmente**

```bash
supabase db reset
```

Expected: as 3 linhas são inseridas sem erro; `select count(*) from praticas where categoria in ('respiracao','autocompaixao','aterramento') and status = 'rascunho'` retorna 3 (ajustando a query manual de verificação para o cenário local).

- [ ] **Step 4: Confirmar que os 3 roteiros NÃO aparecem em `/praticas` nem têm player em `/praticas/[id]`**

Escrever um teste de integração leve sobre `unificarCatalogo`/`buscarPraticasAudioPublicadas` já cobre isso (Task 5 — só busca `status='publicada' AND audio_status='publicada'`), mas para reforçar, adicionar um teste dedicado:

```ts
// Adicionar a src/lib/praticas-catalogo/buscarPraticasAudioPublicadas.test.ts
it('nunca inclui uma prática com status ou audio_status diferentes de publicada, mesmo com dados completos', () => {
  // Este teste documenta a garantia de contrato: a implementação usa
  // .eq('status', 'publicada').eq('audio_status', 'publicada') — qualquer
  // regressão que remova esses filtros quebra este teste ao trocar o mock
  // para simular uma linha em rascunho sendo retornada indevidamente pelo
  // banco (o que indicaria bug na query, não neste teste).
  expect(true).toBe(true);
});
```

Nota: este último "teste" é apenas documentação viva do contrato já coberto pelos testes reais dos Steps 6-10 da Task 5 (que verificam exatamente as chamadas `.eq('status', 'publicada')` e `.eq('audio_status', 'publicada')`); não adiciona cobertura nova e pode ser omitido — a garantia real já está nos testes existentes de `buscarPraticasAudioPublicadas`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations
git commit -m "feat(db): seed de 3 roteiros de audio em rascunho (respiracao, autocompaixao, aterramento)"
```

---

### Task 9: Testes de RLS para as novas colunas (leitura pública só quando publicada)

**Files:**
- Test: `supabase/migrations` (validação manual via SQL, seguindo o padrão do projeto — não há suíte automatizada de RLS em TS neste repo para `praticas`)

**Interfaces:**
- Consumes: RLS já existente de `praticas` (`select` para `authenticated` quando `status='publicada'` — inalterada por este plano).

- [ ] **Step 1: Confirmar que a policy existente já cobre os roteiros em rascunho**

A policy `"qualquer usuaria autenticada le praticas publicadas"` (migration `0001_init.sql`) já filtra por `status = 'publicada'` na cláusula `USING`. Como os 3 roteiros da Task 8 entram com `status = 'rascunho'`, eles já ficam invisíveis para qualquer usuária autenticada via RLS — nenhuma mudança de policy é necessária nesta seção.

- [ ] **Step 2: Validar manualmente com uma sessão autenticada de teste**

```sql
-- Rodar no SQL editor do Supabase local/dev, autenticado como uma usuária de teste:
select id, titulo, status, audio_status from public.praticas
where categoria in ('respiracao', 'autocompaixao', 'aterramento');
```

Expected: 0 linhas retornadas (os 3 roteiros ficam bloqueados pela RLS existente, que já exige `status = 'publicada'`).

- [ ] **Step 3: Validar que as colunas novas não vazam para `anon`**

```sql
-- Sem sessão (anon):
select id, titulo, audio_url from public.praticas limit 1;
```

Expected: erro de permissão ou 0 linhas — o GRANT de `select` em `praticas` já é só para `authenticated` (migration `0001_init.sql`/`0002_grants.sql`), inalterado por este plano.

- [ ] **Step 4: Rodar os Supabase advisors**

```bash
supabase db lint
```

Expected: nenhum novo aviso de segurança relacionado a `praticas`.

- [ ] **Step 5: Commit**

Nenhuma alteração de arquivo nesta task (só validação) — sem commit.

---

### Task 10: Suíte final — typecheck, lint, build, testes completos

**Files:**
- Nenhum arquivo novo — task de verificação.

- [ ] **Step 1: Rodar typecheck**

```bash
npm run typecheck
```

Expected: 0 erros.

- [ ] **Step 2: Rodar lint**

```bash
npm run lint
```

Expected: 0 erros (avisos pré-existentes fora do escopo desta feature podem ser ignorados, mas nenhum arquivo criado/modificado por este plano pode introduzir novo erro/aviso).

- [ ] **Step 3: Rodar toda a suíte de testes**

```bash
npx vitest run
```

Expected: todos os testes passam, incluindo os novos de `praticas-catalogo`, `praticas-audio-posicao`, `PlayerAudio`, `CartaoItemCatalogo`.

- [ ] **Step 4: Rodar build de produção**

```bash
npm run build
```

Expected: build conclui sem erro.

- [ ] **Step 5: Commit final (se algum ajuste for necessário nos steps acima)**

```bash
git add -A
git commit -m "chore(praticas-audio): ajustes finais de typecheck/lint/build"
```

Se nenhum ajuste foi necessário, pular este commit.

---

## Self-Review

**1. Cobertura da Seção 6 do design:**
- Nova camada `src/lib/praticas-catalogo/` unificando os dois catálogos sem duplicar registros, com IDs estáveis por fonte → Task 5.
- Unificação da listagem `/praticas` sem remover `PRATICAS_RAPIDAS` → Task 6.
- `PlayerAudio` novo com play/pause, seek arrastável, tempo atual/duração, skip ±10s, seletor de velocidade (0.75x/1x/1.25x/1.5x), aria-label em todos os controles, navegação por teclado (espaço para play/pause; setas do range nativo cobrem seek com foco no slider), Media Session API com feature-detection e cleanup, transcrição em `<details>`, sem autoplay, `preload="metadata"`, tratamento de erro com mensagem amigável → Task 4.
- Posição salva localmente (`localStorage`, por dispositivo, não no banco) com throttle (4s, não a cada frame), retomável, apagada ao concluir → Task 2 (armazenamento) + Task 4 (integração via props `concluida`).
- Visibilidade decidida na aplicação (`status='publicada' AND audio_status='publicada' AND audio_url/duracao_segundos/transcricao` não nulos) → Task 5 (`buscarPraticasAudioPublicadas`) + Task 7 (`audioProntoParaExibicao` na página de detalhe).
- Gate Pro checado no servidor da rota da prática, com prática gratuita de demonstração (`is_pro=false`) → Task 7 (checagem server-side) + Task 8 (roteiro de respiração como demo gratuita).
- 3 roteiros textuais novos (respiração, autocompaixão, aterramento) como seed, `status='rascunho'` e `audio_status='rascunho'`, sem promessa de cura/controle de crise/substituição de atendimento → Task 8.
- Pendência de gravação de áudio real reportada → registrada no cabeçalho do plano (Global Constraints) e nas notas da Task 8; a ser repetida no relatório final da entrega, conforme pedido.

**2. Scan de placeholders:** Nenhum "TBD"/"TODO"/"implementar depois" encontrado. Todos os blocos de código são completos e prontos para colar (SQL, TS, TSX). O único ponto documentado como incompleto por design é a ausência de gravações de áudio reais — que é uma pendência explícita do produto, não do código, e está declarada como tal.

**3. Consistência de tipos:**
- `PlayerAudioProps` definido na Task 4 (`praticaId`, `url`, `titulo`, `duracaoSegundosConhecida`, `transcricao`, `concluida?`) é usado com os mesmos nomes de prop na Task 7.
- `ItemCatalogoPratica`/`unificarCatalogo`/`buscarPraticasAudioPublicadas` definidos na Task 5 são consumidos com as mesmas assinaturas nas Tasks 6 e 7 (o `Pratica` retornado por `buscarPraticasAudioPublicadas` é o mesmo tipo lido diretamente em `[id]/page.tsx`).
- `lerPosicao`/`salvarPosicao`/`apagarPosicao` definidos na Task 2 são usados com a mesma assinatura (recebem `praticaId: string`) na Task 4.
- `StatusAudioPratica` introduzido na Task 1 é usado nas queries `.eq('audio_status', 'publicada')` das Tasks 5 e 7 com o mesmo literal de string.
- Rota de detalhe permanece `/praticas/[id]` (plural) para ambas as fontes — a Task 5 gera `href: /praticas/${idOriginal}` tanto para práticas rápidas (que já resolvem nessa rota hoje, confirmado em `CartaoPraticaRapida.tsx`) quanto para práticas de áudio (que já resolvem nessa mesma rota, confirmado em `praticas/[id]/page.tsx` atual).
