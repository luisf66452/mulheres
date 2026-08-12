# Tela de Início — Redesenho visual a partir de mockup — Design

**Data:** 2026-08-12
**Status:** Aprovado para planejamento de implementação
**Depende de:** identidade visual burnt-rose/lilás/creme já em produção (substituiu "Manhã de Domingo" — ver commit `e715423`), check-in emocional (`2026-08-12-checkin-emocional-design.md`), Jornadas Guiadas.

## 1. Contexto

A usuária forneceu um mockup visual (print de referência) da tela de início com layout e paleta específicos: saudação com nome, seletor de humor por carinhas coloridas, card de sequência de 7 dias com pontinhos e ilustração floral, card "Continue sua jornada", botão grande "Fazer check-in" e navegação inferior com **5** abas (Início, Jornadas, Práticas, Progresso, Perfil).

O app já tem uma tela de início funcional (`src/app/page.tsx` + `src/app/components/inicio/*`) construída sobre o sistema de tokens burnt-rose/lilás/creme (`globals.css`), mas com layout e paleta diferentes do mockup: sem seletor de humor, sequência em barras (não pontinhos), sem card de jornada em andamento, botão de texto genérico, e navegação inferior com só 4 abas (Jornadas engloba Práticas).

**Limitação assumida:** não há acesso aos valores de pixel exatos do mockup — as cores abaixo são uma aproximação percebida, construída sobre os tokens existentes (que já foram escolhidos numa direção rosa/lilás compatível com a referência). Ajustes finos de tom ficam para depois da checagem visual no navegador.

## 2. Fora de escopo

- Fotos reais nos cards (miniatura da jornada, ilustração floral) — tudo é ilustração/SVG, como já é o padrão do app (sem banco de imagens).
- Redesenho de Jornadas, Práticas, Progresso e Perfil — só a tela de Início e a navegação inferior compartilhada nesta rodada. As outras telas seguem com o visual atual até suas próprias rodadas.
- Dark mode, animação orquestrada — já fora de escopo desde a identidade visual base.
- Mudança no modelo de dados de check-in (`estado_geral`, quadrantes) — o seletor de humor da início é uma **entrada alternativa** para o fluxo existente, não um novo modelo de dados.

## 3. Sistema de tokens — extensão

Tokens atuais (`globals.css`) mantidos como estão: `fundo` `#FBF6F0`, `superficie` `#FFFDFB`, `texto` `#453C42`, `texto-suave` `#8C7F87`, `destaque` `#B9A6D4`, `acao` `#B8697A`, `borda` `#E8DDD9`, `alerta` `#8B4C5C`.

Novos tokens para o seletor de humor (5 níveis, cada um com cor própria, como no mockup — paleta suave, não saturada, coerente com o restante do app):

| Token | Hex aproximado | Uso |
|---|---|---|
| `--color-humor-1` | `#A9B7D4` (azul acinzentado suave) | Muito baixo |
| `--color-humor-2` | `#9FC2B0` (verde-água suave) | Baixo |
| `--color-humor-3` | `#E3C77A` (amarelo suave) | Bem |
| `--color-humor-4` | `#E3A26F` (laranja suave) | Alto |
| `--color-humor-5` | `#D48CA6` (rosa suave, ecoa `acao`) | Muito alto |

Essas cores são só para os círculos do seletor — não entram no restante do sistema de tokens.

## 4. Mudanças de componente

### `SeletorHumor.tsx` (novo, em `components/inicio/`)
Card no topo da tela: "Como você está se sentindo hoje?" + 5 botões circulares coloridos com rótulo abaixo (Muito baixo / Baixo / Bem / Alto / Muito alto). Ao tocar em um nível, navega para `/checkin?humor=<1-5>`.

Se a usuária já fez o check-in hoje, este card não aparece (mesma condição hoje usada por `RitualDeHoje`) — em vez dele, mantém-se o resumo do dia já feito.

### `CheckinFormClient.tsx` — leitura do parâmetro `humor`
Ao montar com `?humor=<1-5>` na URL, pula a etapa `estado_geral` e entra direto em `emocao`, com o quadrante pré-selecionado por esta heurística (documentada em comentário no código, por não ser uma correspondência exata):

| `humor` | Quadrante (`EstadoGeral`) |
|---|---|
| 1 | `baixa_energia_desconforto` |
| 2 | `baixa_energia_desconforto` |
| 3 | `baixa_energia_conforto` |
| 4 | `alta_energia_conforto` |
| 5 | `alta_energia_conforto` |

Sem o parâmetro, o comportamento atual (começar em `estado_geral`) não muda.

### `SequenciaDias.tsx` — pontinhos em vez de barras
Mesma lógica de dados (`Progresso7Dias`), troca só a apresentação: 7 círculos pequenos (`rounded-full`), preenchidos em `destaque` quando completos, com uma ilustração floral simples em SVG ao lado (decorativa, `aria-hidden`), no espírito do que já existe em `FundoDecorativo.tsx`.

### `ConteudoRecomendado.tsx` → `JornadaEmAndamento.tsx` (renomeado)
Passa a buscar a jornada ativa da usuária (`jornadas_usuarias` com `status = 'em_andamento'`, join simples com `jornadas` para título/duração) em vez da lista de práticas soltas. Renderiza: miniatura ilustrativa (SVG), título da jornada, subtítulo/descrição curta, `BarraProgressoJornada` (componente já existente). Link para `/jornada-atividade/[id]` da atividade do dia atual, na mesma lógica já usada em `/jornadas`. Se não há jornada ativa, o card não aparece (mesmo padrão de "não mostrar card vazio" já usado em `ConteudoRecomendado`).

### `RitualDeHoje.tsx` — botão
Texto do botão principal passa de "Começar agora" para "Fazer check-in", com ícone de coração (SVG inline, no padrão dos ícones já usados em `NavegacaoInferior.tsx`), mantendo o componente `Botao`/estilo de pílula grande já usado.

### `NavegacaoInferior.tsx` — 5 abas
Adiciona um item "Práticas" (`/praticas`) separado de "Jornadas" (`/jornadas`), com ícone próprio. Os 4 itens existentes mantêm seus ícones e lógica de rota ativa; só muda a lista `ITENS` e o `prefixosAtivos` de Jornadas (deixa de incluir `/praticas`).

### `Saudacao.tsx` — nome da usuária
Passa a receber `nome: string | null` como prop (buscado em `perfis.nome` pela página servidora) e renderizar "Bom dia, {nome}" — sem nome, mantém só "Bom dia" (comportamento atual).

## 5. Modelo de dados

Nova migration `supabase/migrations/0005_nome_perfil.sql`: adiciona coluna `nome text` (nullable) em `perfis`. Sem alteração de RLS (já coberta pelas políticas existentes de leitura/escrita do próprio perfil).

`Onboarding` (`src/app/onboarding/page.tsx` + `actions.ts`) ganha um campo de texto para o nome, salvo junto com o consentimento em `registrarConsentimento`. Campo opcional — não bloqueia o "Continuar" (evita fricção extra no onboarding, que já tem 2 checkboxes obrigatórios).

## 6. Verificação

Mesmo processo já estabelecido no projeto:
- `tsc --noEmit` e `eslint` limpos.
- `npm run test` (Vitest) limpo — nenhuma mudança na lógica pura de recomendação/streak, mas a nova heurística de mapeamento humor→quadrante ganha teste próprio.
- `npm run build` limpo.
- Checagem visual manual no navegador (dev server): tela de início (com e sem check-in feito hoje, com e sem jornada ativa), fluxo de toque numa carinha até a etapa `emocao` do check-in, navegação inferior nas 5 rotas.
