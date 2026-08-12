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

Se a usuária já fez o check-in hoje, este card **não aparece** — mesma condição já usada por `RitualDeHoje` para trocar para o estado "concluído" (ver correção abaixo em `RitualDeHoje.tsx`). Em vez dele, mantém-se o resumo do dia já feito.

### `/checkin` (`page.tsx`, Server Component) — leitura e validação de `humor`
A página servidora (não o client) lê `searchParams.humor`, valida e repassa o resultado já validado como prop `humorInicial: 1 | 2 | 3 | 4 | 5 | null` para `CheckinFormClient` — o client component não lê a URL diretamente.

Validação: o valor só é aceito se for um **inteiro** entre 1 e 5 (`Number.isInteger` após `Number(...)`, string com um único parâmetro). Qualquer outro valor (`"3.5"`, `"abc"`, `"0"`, `"6"`, múltiplos valores, ausente) resulta em `humorInicial = null`, e o fluxo se comporta exatamente como hoje (começa em `estado_geral`) — nunca lança erro nem quebra a página.

### `CheckinFormClient.tsx` — prop `humorInicial`
Recebe `humorInicial: 1 | 2 | 3 | 4 | 5 | null` como prop. Quando não-nulo, a etapa inicial já é `emocao` (pulando `estado_geral`), com o quadrante pré-selecionado por esta heurística (documentada em comentário no código, por não ser uma correspondência exata):

| `humorInicial` | Quadrante (`EstadoGeral`) |
|---|---|
| 1 | `baixa_energia_desconforto` |
| 2 | `baixa_energia_desconforto` |
| 3 | `baixa_energia_conforto` |
| 4 | `alta_energia_conforto` |
| 5 | `alta_energia_conforto` |

Com `humorInicial: null`, o comportamento atual (começar em `estado_geral`) não muda. A função pura que faz esse mapeamento (`humor` → `EstadoGeral` inicial) fica isolada e testada (ver Seção 6).

### `SequenciaDias.tsx` — pontinhos em vez de barras
Mesma lógica de dados (`Progresso7Dias`), troca só a apresentação: 7 círculos pequenos (`rounded-full`), preenchidos em `destaque` quando completos, com uma ilustração floral simples em SVG ao lado (decorativa, `aria-hidden`), no espírito do que já existe em `FundoDecorativo.tsx`.

### `ConteudoRecomendado.tsx` → `JornadaEmAndamento.tsx` (renomeado)
Passa a buscar a jornada ativa da usuária em vez da lista de práticas soltas: `jornadas_usuarias` filtrado por `status = 'em_andamento'`, **ordenado por `atualizada_em` desc, `limit(1)`** — se a usuária tiver mais de uma jornada em andamento (hoje o schema permite), só a mais recentemente atualizada aparece no card; as demais só ficam visíveis em `/jornadas`. Join simples com `jornadas` para título/duração.

Renderiza: miniatura ilustrativa (SVG), título da jornada, subtítulo/descrição curta, `BarraProgressoJornada` (componente já existente).

**Link para a atividade do dia:** o card busca a atividade cujo `numero_dia` corresponde a `dias_completados + 1` da jornada em `jornada_atividades` (mesmo cálculo já usado como fonte de verdade em `/jornadas` / `AtivarJornadaButton`) e linka para `/jornada-atividade/[id]` com o **ID real dessa atividade** — nunca o ID da jornada. Se essa atividade não existir (schema inconsistente, jornada concluída mas `status` não atualizado, etc.), o card faz **fallback** para `/jornadas/[jornadaId]`... como a rota de jornada individual não existe hoje, o fallback é `/jornadas` (lista geral) — nunca renderiza um link quebrado.

A rota `/jornada-atividade/[id]` exige o parâmetro de busca `?checkin=<id>` (o ID do check-in de hoje) — sem ele, a página chama `notFound()`. Por isso o link do card só aponta para `/jornada-atividade/[id]?checkin=<id>` quando já existe um check-in de hoje; se a atividade existe mas a usuária ainda não fez o check-in hoje, o link vai para `/checkin` em vez disso (é o check-in que, ao ser concluído, redireciona para a atividade da jornada). Além disso, se a usuária já fez o check-in de hoje, não há "atividade do dia" para continuar agora — o link vai direto para `/jornadas`, sem sequer precisar resolver a atividade.

Se não há jornada ativa, o card não aparece (mesmo padrão de "não mostrar card vazio" já usado em `ConteudoRecomendado`).

### `RitualDeHoje.tsx` — botão e estado "já concluído hoje"
Texto do botão principal passa de "Começar agora" para "Fazer check-in", com ícone de coração (SVG inline, no padrão dos ícones já usados em `NavegacaoInferior.tsx`), mantendo o componente `Botao`/estilo de pílula grande já usado.

Confirmação explícita do comportamento já existente (para não regredir com as mudanças desta rodada): quando `jaFezCheckinHoje` é `true`, nem o `SeletorHumor` nem o botão "Fazer check-in" são renderizados em nenhum momento — a tela mostra só o estado "Ritual de hoje concluído" (já implementado) e o resumo do dia. Os dois componentes (`SeletorHumor` e o botão em `RitualDeHoje`) recebem a mesma prop `jaFezCheckinHoje` vinda da página servidora, sem lógica duplicada de checagem.

### `NavegacaoInferior.tsx` — 5 abas
Adiciona um item "Práticas" (`/praticas`) separado de "Jornadas" (`/jornadas`), com ícone próprio. Os 4 itens existentes mantêm seus ícones e lógica de rota ativa; só muda a lista `ITENS` e o `prefixosAtivos` de Jornadas (deixa de incluir `/praticas`).

### `Saudacao.tsx` — nome da usuária
Passa a receber `nome: string | null` como prop (buscado em `perfis.nome` pela página servidora) e renderizar "Bom dia, {nome}" — sem nome, mantém só "Bom dia" (comportamento atual).

## 5. Modelo de dados

Nova migration `supabase/migrations/0005_nome_perfil.sql`: adiciona coluna `nome text` (nullable) em `perfis`. Sem alteração de RLS (já coberta pelas políticas existentes de leitura/escrita do próprio perfil).

`Onboarding` (`src/app/onboarding/page.tsx` + `actions.ts`) ganha um campo de texto para o nome, salvo junto com o consentimento em `registrarConsentimento`. Campo opcional — não bloqueia o "Continuar" (evita fricção extra no onboarding, que já tem 2 checkboxes obrigatórios).

**Edição de nome para usuárias já existentes:** o onboarding só roda uma vez (gate do `middleware.ts`/`proxy.ts` por `consentimento_dados_sensiveis_em`), então quem já passou por ele — ou pulou o campo de nome ali — precisa de outro lugar para definir/editar o nome depois. `/perfil` (`page.tsx`) ganha um campo de nome editável (novo `actions.ts` em `/perfil`, ex. `atualizarNome(nome: string)`, seguindo o mesmo padrão Server Action + `revalidatePath`/redirect já usado em `onboarding/actions.ts` e `settings/actions.ts`), pré-preenchido com o valor atual de `perfis.nome`.

**Normalização:** em ambos os pontos de escrita (onboarding e edição em `/perfil`), o nome passa por `.trim()` antes de salvar; string vazia após o trim é salva como `null` (equivalente a "sem nome"), não como string vazia — evita `Saudacao` renderizar "Bom dia, " com espaço sobrando.

## 6. Verificação

Mesmo processo já estabelecido no projeto:
- `tsc --noEmit` e `eslint` limpos.
- `npm run test` (Vitest) limpo, incluindo testes novos para:
  - a função pura de mapeamento `humor → EstadoGeral` inicial (todos os 5 valores válidos, cobrindo a tabela da Seção 4);
  - a validação de `humor` a partir de `searchParams` na página de `/checkin` (inteiros 1-5 aceitos; `"0"`, `"6"`, `"3.5"`, `"abc"`, ausente, e múltiplos valores todos resultando em `humorInicial = null`);
  - a seleção da jornada ativa mais recente (`atualizada_em` desc) quando há mais de uma `em_andamento`;
  - o fallback do card de jornada para `/jornadas` quando a atividade do dia não é encontrada;
  - a normalização de nome (`trim()`, string vazia após trim vira `null`) nas duas Server Actions que gravam `perfis.nome`.
- `npm run build` limpo.
- Checagem visual manual no navegador (dev server): tela de início (com e sem check-in feito hoje, com e sem jornada ativa — inclusive com duas jornadas ativas ao mesmo tempo), fluxo de toque numa carinha até a etapa `emocao` do check-in, navegação inferior nas 5 rotas, edição de nome em `/perfil` para uma conta já onboardada.
