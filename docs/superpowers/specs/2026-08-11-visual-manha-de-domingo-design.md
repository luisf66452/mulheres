# Identidade visual "Manhã de Domingo" — Design

**Data:** 2026-08-11
**Status:** Aprovado para planejamento de implementação
**Depende de:** MVP + Jornadas Guiadas já implementados e em produção.

## 1. Contexto

O app inteiro hoje usa apenas o Tailwind padrão (preto/branco/cinza, sem tokens próprios) — visualmente é um wireframe funcional, não um produto acabado. O objetivo deste sub-projeto é dar ao app uma identidade visual própria, escolhida para uma finalidade específica: fazer a usuária se sentir num lugar seguro e caloroso o suficiente pra se abrir sobre autoestima, imagem corporal e relação com a comida — não um app clínico, não um app "de bem-estar" genérico.

A direção foi escolhida por brainstorm visual (três direções mockadas: "Manhã de Domingo", "Entre Amigas", "Jardim Interno") e aprovada: **Manhã de Domingo** — aconchego caseiro, tom de caderno pessoal, cores terrosas e quentes, sem pressa.

**Achado durante a exploração do código, fora do escopo original mas relevante:** `src/app/page.tsx` nunca foi substituído — é literalmente o template padrão do `create-next-app`. Isso explica o mistério das capturas de tela anteriores ("apareceu o template padrão do Next.js") — não era cache do Vercel, é a rota `/` renderizando o template de verdade para qualquer usuária autenticada e com onboarding concluído (o `proxy.ts` só redireciona usuárias deslogadas ou sem consentimento; quem já passou por isso cai direto no template). Este desenho inclui a correção: `/` redireciona para `/checkin`, mesmo padrão de ponto de entrada já usado no resto do app.

## 2. Fora de escopo

- **Dark mode** — o boilerplate de `prefers-color-scheme: dark` deixado pelo template é removido; o app passa a ter um único tema (claro). Pode virar um sub-projeto próprio depois, se fizer sentido.
- **Novos ícones de PWA** — os ícones sólidos gerados na Task 13 do MVP continuam como estão nesta rodada; re-gerá-los na nova paleta é um ajuste pequeno e separado.
- **Mudança de copy/conteúdo** — só tratamento visual. Os textos existentes nas telas não mudam de redação (a curadoria de conteúdo já segue o tom certo, ex.: mensagens de segurança, textos de jornada).
- **Animação orquestrada** — nada de sequência de entrada de página ou scroll-reveal. Só transições discretas de hover/press nos elementos interativos (ver Seção 5).
- **Onboarding personalizado, dashboard, e as outras áreas ainda não construídas** da visão original de 11 itens — seguem fora de escopo, como já registrado no desenho de Jornadas Guiadas.

## 3. Sistema de tokens

### Cor
| Token | Hex | Uso |
|---|---|---|
| `fundo` | `#EDE6DC` | Fundo de página (oat/parchment quente) |
| `superficie` | `#FAF7F2` | Cartões, inputs, superfícies elevadas |
| `texto` | `#4A3F35` | Texto principal (marrom quente escuro, nunca preto puro) |
| `texto-suave` | `#8B6F5C` | Texto secundário, legendas, texto de apoio |
| `destaque` | `#C97B63` | Terracota-rosado — usado com moderação: streak preenchido, indicadores ativos, ênfase pontual |
| `acao` | `#7C8B6F` | Verde salvia — botões primários e CTAs |
| `borda` | `#DDD2C4` | Bordas e divisores suaves |
| `alerta` | `#A65A48` | Tela de segurança — terracota mais escuro e sóbrio, nunca vermelho de alarme |

### Tipografia
- **Display** (títulos, headings): **Fraunces** — serifa quente, arredondada, com peso editorial, evocando um caderno pessoal. Usada com moderação — só títulos, nunca corpo de texto.
- **Corpo/interface**: **Inter** — sans-serif humanista, alta legibilidade em telas pequenas, usada em parágrafos, labels, botões, inputs.
- Ambas carregadas via `next/font/google`, substituindo as fontes Geist do template padrão.

### Layout
- Cartões com cantos bem arredondados (`rounded-2xl`, ~16px).
- Sombras suaves e quentes (nunca cinza puro) — `shadow` customizado com tinta marrom em baixa opacidade.
- Respiro generoso entre seções; divisores por espaçamento, não por linhas.
- Mobile-first, largura de conteúdo máxima ~28rem (`max-w-md`), consistente com o que já existe.

### Assinatura: progresso orgânico
O elemento único e memorável da identidade: indicadores de progresso deixam de ser barras/bolinhas geométricas de app corporativo e viram **manchinhas orgânicas** (formas de círculo levemente irregulares, como se desenhadas à mão) — usado especificamente para o streak semanal de 7 dias em `/progresso`.

Jornadas guiadas (7 a 21 dias) usam uma variação mais compacta do mesmo espírito — uma barra preenchida com cantos arredondados na cor `destaque`, em vez de renderizar até 21 manchinhas — para não sobrecarregar o cartão da lista de jornadas.

A assinatura fica reservada a esses dois lugares (progresso semanal e progresso de jornada). O seletor de escala 1-5 do check-in usa círculos simples (preenchido em `acao` quando selecionado) — não manchinhas — para manter a assinatura como o único elemento de destaque, em vez de repetir o mesmo efeito em todo lugar.

## 4. Componentes compartilhados novos

Para não duplicar a mesma sopa de classes Tailwind em ~12 telas, e para tornar o sistema de tokens realmente consistente, três componentes novos em `src/app/components/`:

- **`Botao.tsx`** — `variante: 'primaria' | 'secundaria'`. Primária: fundo `acao`, texto branco. Secundária: contorno `borda`, texto `texto-suave`. Estados `disabled` e `loading` (reaproveitando o texto "Enviando..." etc. já usado nas telas).
- **`Cartao.tsx`** — wrapper de superfície: fundo `superficie`, `rounded-2xl`, padding e sombra padrão.
- **`ProgressoBlobs.tsx`** — a assinatura: recebe uma lista de dias (`{ rotulo: string; completo: boolean }[]`) e renderiza as manchinhas orgânicas. Usado só em `/progresso`.
- **`BarraProgressoJornada.tsx`** — barra compacta preenchida, recebe `diasCompletados`/`duracaoDias`. Usado em `/jornadas`.

## 5. Escopo de telas

Todas recebem os tokens (cor/tipografia/layout) e, onde fizer sentido, os componentes compartilhados acima:

- `/` (`page.tsx`) — vira redirect para `/checkin` (correção de bug, ver Seção 1), sem UI própria.
- `layout.tsx` + `globals.css` — fundação: tokens, fontes, `lang="pt-BR"` (hoje incorretamente `"en"`), `themeColor` alinhado a `fundo`.
- `/login`
- `/onboarding`
- `/checkin` (`CheckinFormClient.tsx`)
- `/pratica/[id]` (`PraticaClient.tsx` + `AntesDepoisAtividade.tsx`, compartilhado com jornada-atividade)
- `/jornada-atividade/[id]` (`JornadaAtividadeClient.tsx`)
- `/jornadas` (`page.tsx` + `AtivarJornadaButton.tsx`)
- `/progresso`
- `/seguranca` — usa a cor `alerta`, mantendo o tom sóbrio e não-clínico já estabelecido no texto
- `/settings`
- `/premium`
- `/privacidade`
- `LembreteBanner.tsx` (banner de lembrete de push, componente compartilhado)

Transições discretas (`transition-colors`, leve mudança de opacidade/escala em hover e press) nos elementos interativos — botões, cartões clicáveis — como único uso de motion, aplicado via Tailwind, sem biblioteca de animação nova.

## 6. Verificação

Não há testes automatizados de aparência visual neste projeto (não há suíte de regressão visual configurada, e criar uma seria escopo desproporcional para uma primeira rodada de identidade visual). A verificação é:
- `tsc --noEmit` e `eslint` limpos em cada tarefa, como já é padrão no projeto.
- `npm run build` limpo ao final (garante que a troca de fontes e o redirect de `/` não quebram o build, como já aconteceu antes com o VAPID key).
- Checagem visual manual no navegador (dev server) tela por tela, cobrindo o fluxo completo — mesmo processo já usado nas rodadas de teste ao vivo do MVP e de Jornadas Guiadas.
- Nenhuma mudança de comportamento/lógica é esperada — só troca de classes/tokens e os 4 componentes novos. Onde uma tela tiver lógica (ex.: `CheckinFormClient.tsx`), a tarefa correspondente deve preservar o comportamento existente byte-a-byte fora das classes visuais.
