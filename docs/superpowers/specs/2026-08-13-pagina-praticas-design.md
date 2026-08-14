# Página Práticas — Design

**Data:** 2026-08-13
**Status:** Aprovado para planejamento de implementação
**Depende de:** identidade visual burnt-rose/creme já em produção, padrão `jornadas-conteudo` (`src/lib/jornadas-conteudo/{tipos,dados}.ts`), `NavegacaoInferior`, `CabecalhoJornadas`/`CartaoJornada`, `Cartao`/`Botao`.
**Referência visual:** mockup fornecido pela usuária (screenshot anexado no pedido) — reproduzido com alta fidelidade.

## 1. Contexto

O app já tem uma rota `/praticas` funcional, mas ela é uma biblioteca genérica de conteúdo textual (`src/app/praticas/page.tsx`, agrupada por categoria, lendo da tabela Supabase `praticas`). Essa tela não corresponde ao mockup: a usuária quer 4 práticas rápidas fixas (Respiração, Diário guiado, Meditação, Exercício de autocompaixão), cada uma abrindo uma experiência interativa própria (cronômetro, passos, escrita), não um texto estático.

Esta rodada substitui o conteúdo de `/praticas` pela nova experiência e cria 4 subpáginas com fluxos reais. Segue o mesmo padrão já usado em `/jornadas`: cabeçalho com ilustração + título serifado, cartões pastel com ilustração, dados de conteúdo centralizados e desacoplados do Supabase (trocáveis depois sem reescrever componentes).

## 2. Fora de escopo

- **Rota `/praticas/[id]` e `CartaoPratica.tsx` (biblioteca antiga por Supabase):** não são apagadas nem alteradas. Deixam de ter link de entrada a partir de `/praticas` (que passa a ser só as 4 práticas fixas), mas continuam funcionando se acessadas diretamente — nenhum dado do Supabase é destruído. Não há mais nenhum outro lugar do app que linke para essa rota.
- **Rota `/pratica/[id]` (singular) — fluxo de prática recomendada pelo check-in:** intocada. Usa a tabela `sessoes`/`praticas` de forma diferente (antes/depois com `Escala`) e não se sobrepõe às 4 práticas novas.
- **Migração de banco para as 4 práticas novas:** nenhuma. Conclusões são registradas numa camada local isolada (Seção 8), preparada para trocar por Supabase depois, seguindo o mesmo comentário-guia já usado em `jornadas-conteudo/dados.ts` ("quando o conteúdo real existir no Supabase, esta é a única peça que precisa ser trocada").
- **Áudio real da meditação:** nenhum arquivo é baixado ou inventado. O player fica pronto para receber uma URL (Seção 9.3), mas funciona só com cronômetro + texto até lá.
- **Ilustração botânica do cabeçalho:** reaproveita `IlustracaoFlorCabecalho.tsx` (mesma já usada em `/jornadas`), não é criada uma nova arte.

## 3. Estrutura de rotas e arquivos

```
src/app/praticas/
  page.tsx                        → substituída (cabeçalho + 4 cartões)
  [id]/page.tsx                   → mantida, sem link de entrada (Seção 2)
  respiracao/page.tsx             → nova
  diario-guiado/page.tsx          → nova
  meditacao/page.tsx              → nova
  autocompaixao/page.tsx          → nova

src/app/components/praticas/
  CabecalhoPraticas.tsx           → cabeçalho (título + subtítulo + ilustração)
  CartaoPraticaRapida.tsx         → cartão da lista (genérico, dirigido por dados)
  icones/                         → ícones dos 4 círculos (SVG inline, mesmo padrão da NavegacaoInferior)
    IconeRespiracao.tsx, IconeDiario.tsx, IconeMeditacao.tsx, IconeAutocompaixao.tsx
  CabecalhoPratica.tsx            → cabeçalho das subpáginas (voltar + título + duração)
  Cronometro.tsx                  → cronômetro regressivo reaproveitável (respiração/meditação)
  IndicadorEtapas.tsx             → indicador "passo X de N" (diário/autocompaixão)
  ControlesSessao.tsx             → botões Começar/Pausar/Continuar/Reiniciar
  TelaConclusao.tsx               → mensagem final + registrar conclusão
  PlayerAudio.tsx                 → player reaproveitável (Seção 9.3)

src/lib/praticas-conteudo/
  tipos.ts                        → modelo de dados das 4 práticas (Seção 4)
  dados.ts                        → as 4 práticas, dados fixos centralizados

src/lib/praticas-progresso/
  tipos.ts, armazenamento.ts      → camada de conclusão local (Seção 8)

src/lib/persistencia-local/
  usePersistedState.ts            → hook genérico de rascunho em localStorage (Seção 8.1)
```

## 4. Modelo de dados de conteúdo

Mesmo espírito de `jornadas-conteudo`: tipos ricos, preparados para vídeo/áudio/imagem/dificuldade/premium, mas só os 4 registros fixos de hoje têm dados preenchidos.

```ts
// src/lib/praticas-conteudo/tipos.ts
export type CategoriaPratica = 'respiracao' | 'diario' | 'meditacao' | 'autocompaixao';
export type CorCartaoPratica = 'salvia' | 'pessego' | 'lilas' | 'rosa';
export type NivelDificuldade = 'iniciante' | 'intermediario' | 'avancado';

export interface MidiaPratica {
  tipo: 'audio' | 'video' | 'imagem' | null;
  url: string | null;       // preenchido futuramente
  miniaturaUrl: string | null;
}

export interface PraticaRapida {
  id: string;                // slug: 'respiracao' | 'diario-guiado' | 'meditacao' | 'autocompaixao'
  categoria: CategoriaPratica;
  titulo: string;
  descricaoCurta: string;    // texto do cartão
  duracaoMinutos: number;
  duracaoLabel: string;      // "3 min" já formatado, evita repetir formatação
  corCartao: CorCartaoPratica;
  nivel: NivelDificuldade;
  premium: boolean;
  midia: MidiaPratica;
  gratuita: boolean;
}
```

`dados.ts` exporta `PRATICAS_RAPIDAS: PraticaRapida[]` com os 4 registros (cores/duração/textos exatamente como no mockup) e um helper `obterPraticaPorId(id)`. Adicionar uma 5ª prática no futuro é só um novo item no array + uma rota nova reaproveitando os componentes de Seção 3 — nenhum componente existente muda.

## 5. Sistema visual — tokens (nenhum token novo)

A paleta do mockup já existe quase 1:1 no `@theme` de `globals.css`:

| Papel no mockup | Hex do mockup | Token existente | Hex do token |
|---|---|---|---|
| Fundo geral creme | `#FFF8F1` | `--color-fundo` | `#FBF6F0` |
| Bordô/ação | `#842B55` | `--color-acao` | `#B8697A` |
| Texto principal | `#422D35` | `--color-texto` | `#453C42` |
| Texto secundário | `#8B747C` | `--color-texto-suave` | `#8C7F87` |
| Borda | `#E8D9D0` | `--color-borda` | `#E8DDD9` |
| Verde-sálvia claro (fundo) | `#E6E8D6` | `--color-salvia-suave` | `#DDE5D4` |
| Verde ícone | `#9AA178` | `--color-salvia` | `#8FA888` |
| Pêssego claro (fundo) | `#F7DED0` | `--color-pessego-suave` | `#F3CFC1` |
| Pêssego ícone | `#D99572` | `--color-pessego` | `#E8B894` |
| Lilás claro (fundo) | `#E8DDEC` | `--color-lilas-suave` | `#D8CCE2` |
| Lilás ícone | `#9C82A8` | `--color-destaque` | `#B9A6D4` |
| Rosa claro (fundo) | `#F1D5D4` | `--color-creme-rosado` | `#F4D9D2` |
| Rosa ícone | `#B66F79` | `--color-acao` | `#B8697A` |

Os valores da usuária são "aproximações" (ela mesma escreveu isso no pedido); a diferença é imperceptível a olho nu e manter os tokens existentes evita duas fontes de verdade para a mesma cor. **Nenhum token novo é criado.** A cápsula de duração de cada cartão usa a mesma cor de fundo do cartão em opacidade maior (ex. `bg-salvia/20`), não um token à parte.

## 6. Página `/praticas` — cabeçalho e lista

```tsx
<main className="mx-auto max-w-md space-y-6 px-4 pt-6 pb-24 md:pb-8">
  <CabecalhoPraticas />
  <div className="space-y-2.5">
    {PRATICAS_RAPIDAS.map((pratica) => <CartaoPraticaRapida key={pratica.id} pratica={pratica} />)}
  </div>
  <NavegacaoInferior />
</main>
```

`CabecalhoPraticas` replica `CabecalhoJornadas` (`src/app/components/jornadas/CabecalhoJornadas.tsx`), trocando só título/subtítulo: `<h1 className="font-display text-3xl text-texto">Práticas</h1>`, subtítulo `text-sm text-texto-suave`, `IlustracaoFlorCabecalho` posicionada `absolute -top-1 right-0 h-14 w-14` num `header` com `pr-14`.

`CartaoPraticaRapida` — um único componente dirigido pelos dados, evita repetir 4 cartões quase-idênticos:

```tsx
<Link
  href={`/praticas/${pratica.id}`}
  aria-label={`${pratica.titulo}, ${pratica.duracaoLabel}. ${pratica.descricaoCurta}`}
  className={`flex items-center gap-3 rounded-[28px] border border-borda/50 ${FUNDOS[pratica.corCartao]}
    px-4 py-3.5 transition-transform active:scale-[0.98]
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60 focus-visible:ring-offset-2 focus-visible:ring-offset-fundo`}
>
  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${CIRCULOS[pratica.corCartao]}`}>
    <Icone aria-hidden="true" className="h-5 w-5 text-fundo" />
  </span>
  <span className="min-w-0 flex-1">
    <span className="block font-display text-base text-texto">{pratica.titulo}</span>
    <span className="block truncate text-sm text-texto-suave">{pratica.descricaoCurta}</span>
  </span>
  <span className={`shrink-0 rounded-full ${CAPSULAS[pratica.corCartao]} px-2.5 py-1 text-xs font-medium text-texto`}>
    {pratica.duracaoLabel}
  </span>
  <ChevronDireita aria-hidden="true" className="h-4 w-4 shrink-0 text-texto-suave" />
</Link>
```

Notas de fidelidade/robustez pedidas explicitamente no pedido:
- `min-w-0` + `truncate` na descrição evita que ela empurre a cápsula de duração para fora do cartão em telas de 360px — em vez de vazar, trunca com reticências (título "Exercício de autocompaixão" não trunca: é curto o bastante em `text-base` para caber em 360px sem quebrar layout, testado na Seção 12).
- Toda a área é um único `<Link>` (não uma div com onClick) — clicável e focável por teclado nativamente, sem JS extra.
- `active:scale-[0.98]` é a "resposta visual discreta ao toque" pedida, mesmo padrão já usado em `CartaoJornada`.
- Ícone é `aria-hidden`; o nome acessível do link vem do `aria-label` (título + duração + descrição), então leitor de tela não lê o ícone como conteúdo solto.

## 7. Navegação inferior — círculo ativo bordô

O mockup mostra o item ativo com um **círculo bordô preenchido atrás do ícone** e o rótulo em bordô — hoje `NavegacaoInferior` só troca a cor do texto/ícone (`text-acao`), sem círculo. Essa mudança é no componente **compartilhado**, então afeta a aparência do item ativo em todas as páginas (Início, Jornadas, Progresso, Perfil), não só Práticas — é o comportamento correto, já que o mockup mostra o mesmo padrão de navegação para o app inteiro, não algo exclusivo desta tela.

```tsx
<span className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${ativo ? 'bg-acao' : ''}`}>
  <Icone ativo={ativo} className={ativo ? 'text-fundo' : 'text-texto-suave'} />
</span>
```

Cada ícone (`IconeInicio`, `IconeJornada`, etc.) passa a aceitar `className` além de `ativo`, para herdar a cor certa dentro ou fora do círculo (hoje usam `stroke="currentColor"` direto no `<svg>`, então basta adicionar `className` ao elemento). Também é portado o ajuste de safe-area do worktree `ritual-diario-mvp` (`pb-[env(safe-area-inset-bottom)]` no `<nav>`), já que o pedido exige respeitar a área segura do iPhone/Android e essa correção já existe pronta em outra branch.

## 8. Persistência local (isolada, preparada para Supabase)

Sem tabela nova no banco nesta rodada (Seção 2). Duas necessidades distintas:

### 8.1 Rascunho de texto (diário guiado, autocompaixão)

`src/lib/persistencia-local/usePersistedState.ts` — hook genérico client-side:

```ts
function usePersistedState<T>(chave: string, valorInicial: T): [T, (v: T) => void, () => void]
```

Salva em `localStorage` a cada mudança (debounce leve de 400ms), lê no mount. `chave` inclui o `usuaria_id` (recebido como prop vinda do server component, via `supabase.auth.getUser()` — mesmo padrão já usado em todo o app) para nunca misturar respostas de usuárias diferentes no mesmo navegador: `praticas:diario:{usuariaId}:{data-de-hoje}`. Terceiro retorno (`limpar`) apaga a chave — usado ao concluir ou descartar.

### 8.2 Registro de conclusão

`src/lib/praticas-progresso/armazenamento.ts` — interface isolada, comentário-guia igual ao de `jornadas-conteudo/dados.ts` apontando onde trocar por Supabase depois:

```ts
export interface ConclusaoPratica {
  praticaId: string;
  usuariaId: string;
  concluidaEm: string;      // ISO
  duracaoMinutos: number;
}
export function registrarConclusao(c: ConclusaoPratica): void
export function listarConclusoesDoDia(usuariaId: string, data: string): ConclusaoPratica[]
```

Chave de armazenamento inclui `praticaId + usuariaId + data + hash simples` para idempotência: se o botão "Concluir" for tocado duas vezes ou a página recarregada logo após concluir, `registrarConclusao` verifica se já existe uma entrada equivalente nos últimos 5 segundos antes de duplicar (evita o duplo-toque/refresh pedido explicitamente). Não se conecta à tabela `sessoes` existente porque ela tem `checkin_id` `NOT NULL UNIQUE` (uma sessão por check-in do dia) — não comporta múltiplas práticas avulsas no mesmo dia; mexer nesse schema está fora de escopo (Seção 2).

## 9. As 4 práticas

Todas as subpáginas seguem: server component (`page.tsx`) busca `usuaria_id` via `supabase.auth.getUser()` e o registro de `PraticaRapida` via `obterPraticaPorId`, chama `notFound()` se o slug não existir (nunca 404 "cru": os 4 slugs do enunciado sempre existem em `dados.ts`), e passa para um client component (`*Client.tsx`) que roda o fluxo. Cabeçalho comum (`CabecalhoPratica`): botão voltar (`router.back()` ou `Link href="/praticas"`), título, descrição curta, cápsula de duração — reaproveitado nas 4.

### 9.1 Respiração (`/praticas/respiracao`)

Estados: `introducao → em-andamento (inspire/expire) → pausado → concluido`. Ciclo fixo 4s inspire / 6s expire, repetido até completar 3 minutos (`Cronometro` conduz o tempo total; o ciclo inspire/expire é só uma animação de UI sincronizada por `setInterval`/`requestAnimationFrame`, não afeta a contagem regressiva). Círculo/flor via CSS `transform: scale()` com `transition` lenta (4s/6s conforme a fase), cores `salvia`/`acao`; `motion-reduce:` remove a transição de escala (mostra só o texto da instrução, sem animação), seguindo a mesma convenção já usada em `BarraProgressoPercentual`. Pausar congela o cronômetro e a animação; reiniciar zera para `introducao`. Ao concluir, mensagem acolhedora + `registrarConclusao` (uma vez, guardado num `ref` para não duplicar em re-render) + opção "Repetir".

### 9.2 Diário guiado (`/praticas/diario-guiado`)

`IndicadorEtapas` (1 de 4 → 4 de 4) + `<textarea>` por pergunta (as 4 do enunciado) + `usePersistedState` por resposta. "Voltar"/"Continuar" navegam entre etapas sem perder texto (fica tudo no mesmo estado local do client component, salvo a cada etapa). "Concluir reflexão" na última etapa grava `registrarConclusao` e limpa o rascunho (`limpar()` do hook) — mensagem final acolhedora. Se a usuária tentar sair (navegar para outra rota) com texto não salvo na etapa atual: como o autosave já grava a cada mudança, não há "descarte" real a confirmar dentro do fluxo normal; a confirmação pedida no enunciado se aplica ao caso explícito de a usuária apagar manualmente uma resposta já escrita (botão "Limpar resposta" nesta etapa, com `confirm` nativo simples antes de apagar).

### 9.3 Meditação (`/praticas/meditacao`)

Introdução → "Começar meditação" → `Cronometro` regressivo de 8 minutos com Pausar/Continuar/Reiniciar, frases curtas trocando a cada ~40s (lista fixa em `dados.ts`), animação extremamente discreta (leve pulsação de opacidade num círculo de fundo, `motion-reduce:` desativa). `PlayerAudio` é renderizado sempre, mas em **modo texto-apenas** enquanto `pratica.midia.url` for `null` (estado atual dos dados) — sem player quebrado, sem URL falsa, só o cronômetro + frases. A prop `midia.url` em `praticas-conteudo/dados.ts` é o **local único e comentado** para eu adicionar depois o arquivo/URL real de áudio; quando preenchido, `PlayerAudio` passa a mostrar controles reais (play/pause/continuar/volume/duração) via `<audio>` nativo. Ao terminar, mensagem final + `registrarConclusao`.

### 9.4 Autocompaixão (`/praticas/autocompaixao`)

Mesmo esqueleto do diário (`IndicadorEtapas`, autosave, Voltar/Continuar), 4 etapas com os textos exatos do enunciado (2 são só leitura, 2 têm `<textarea>` de reflexão). "Concluir exercício" grava conclusão + mensagem final. Nenhum texto do fluxo se apresenta como substituto de terapia/diagnóstico (frases fixas revisadas para tom de autocuidado, não clínico).

## 10. Acessibilidade e estado

- Todo cartão/botão é `<Link>`/`<button>` nativo (foco e Enter/Space funcionam sem JS extra); `focus-visible:ring-2 ring-acao/60` visível em todos.
- Cronômetros usam `aria-live="off"` no número regressivo (não anunciam segundo a segundo) e um `aria-live="polite"` só na transição de instrução ("Inspire"/"Expire devagar") e no estado final ("Prática concluída").
- Estado de cada prática (`introducao/em-andamento/pausado/concluido`, etapa atual, respostas) fica em `useState` do client component + espelhado no `localStorage` (rascunhos) — se a usuária sair da tela sem querer e voltar, respostas de diário/autocompaixão são restauradas; cronômetro de respiração/meditação reinicia do zero (não dá para persistir "tempo restante" de forma confiável entre navegações sem introduzir complexidade desproporcional ao pedido — reiniciar é o comportamento seguro e é o que já é pedido explicitamente como opção "reiniciar").
- `prefers-reduced-motion`: seguido via `motion-reduce:` (Tailwind) nas transições/animações novas, mesma convenção do resto do projeto.

## 11. Modelo de dados — resumo

Nenhuma migration. Nenhuma tabela nova. Tudo novo é TypeScript (`praticas-conteudo`, `praticas-progresso`) + `localStorage`, isolado e comentado para troca futura por Supabase.

## 12. Verificação

- `npx tsc --noEmit`, `npm run lint`, `npm run build` limpos.
- `npm run test`: testes novos para `usePersistedState` (grava/lê/limpa, escopo por chave), `armazenamento.ts` (registra, lista do dia, não duplica em toque duplo/reload dentro da janela de idempotência), lógica pura do ciclo de respiração (duração total bate 3 min dado o ciclo 4/6s) e da rotação de frases da meditação.
- Checagem manual no navegador, larguras 360/390/430px: os 4 cartões, cada subpágina completa (começar/pausar/continuar/reiniciar onde aplicável; concluir), autosave do diário e autocompaixão sobrevivendo a reload, navegação inferior com Práticas ativa (círculo bordô) em todas as 5 abas, título "Exercício de autocompaixão" não estourando o cartão em 360px, `prefers-reduced-motion` no respiração/meditação.
- Comparação lado a lado com o mockup anexado: posição/tamanho do cabeçalho e ilustração, cores de cada cartão, tamanho dos círculos de ícone, cápsulas de duração, posição da seta, espaçamento entre cartões.
