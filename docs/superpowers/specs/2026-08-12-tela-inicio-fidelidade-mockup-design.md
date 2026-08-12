# Tela de Início — Fidelidade visual ao mockup de referência — Design

**Data:** 2026-08-12
**Status:** Aprovado para planejamento de implementação
**Depende de:** `2026-08-12-tela-inicio-visual-design.md` (já implementada — este documento é um refinamento sobre ela, não uma reconstrução), check-in emocional (`2026-08-12-checkin-emocional-design.md`), Jornadas Guiadas.

## 1. Contexto

A tela de início já passou por um redesenho visual anterior (spec `2026-08-12-tela-inicio-visual-design.md`, já implementado em `src/app/page.tsx` + `src/app/components/inicio/*`): seletor de humor, sequência com pontinhos, cartão de jornada em andamento, botão de check-in e navegação inferior de 5 abas já existem.

A usuária forneceu um novo mockup de referência (print) com fidelidade visual mais específica: carinhas com expressão nos círculos de humor, ordem "melhor → pior" da esquerda para a direita, cartão de sequência com ilustração de rosa em vaso, botão de check-in isolado (sem texto acima), sino de notificação no cabeçalho e tratamento de safe-area para iPhone/Android. Este documento cobre só os ajustes de fidelidade — a estrutura de dados e as rotas já implementadas na rodada anterior permanecem.

**Limitação assumida:** sem acesso aos valores de pixel exatos do mockup — cores e proporções são aproximações sobre os tokens já existentes.

## 2. Fora de escopo

- Redesenho de Jornadas, Práticas, Progresso e Perfil — só Início e navegação inferior compartilhada.
- Nova tabela ou coluna no banco — nenhuma mudança de schema nesta rodada.
- Central de notificações real — o sino linka para `/settings` (única funcionalidade relacionada a notificações hoje).
- Dark mode.

## 3. Decisões confirmadas com a usuária

1. **Ordem do seletor de humor**: reordenar para bater com a referência (Muito bem → Muito mal, melhor à esquerda), ajustando a tabela interna `humor → EstadoGeral` para que o significado emocional não regrida (só a numeração/ordem visual inverte).
2. **Ilustração da rosa**: não existe asset no projeto — será um SVG desenhado à mão, no mesmo padrão dos outros ilustrações inline do app (sem PNG novo).
3. **Sino de notificação**: linka para `/settings` (tela de lembretes já existente).
4. **Botão de check-in**: simplificado — remove título/descrição do cartão `RitualDeHoje`, fica só o botão grande.

## 4. Sistema de tokens — ajuste

Tokens de fundo/superfície/texto/borda mantidos como estão (`globals.css`): já são equivalentes aos hex do mockup (creme, branco quente, marrom-vinho, bordô).

Os 5 tokens de humor (`--color-humor-1..5`) são **redefinidos** — hoje vão de azul (baixo) a rosa (alto); passam a ir de verde (Muito bem) a rosa queimado (Muito mal), reaproveitando tons já usados em outras partes do sistema onde possível:

| Token | Hex novo | Nível | Observação |
|---|---|---|---|
| `--color-humor-1` | `#91B99A` (verde suave) | Muito bem | novo tom |
| `--color-humor-2` | `#E5BB70` (ocre) | Bem | novo tom |
| `--color-humor-3` | `#B9A6D4` (lilás) | Neutro | = `--color-destaque` já existente |
| `--color-humor-4` | `#D98779` (coral suave) | Mal | novo tom |
| `--color-humor-5` | `#B8697A` (rosa queimado) | Muito mal | = `--color-acao` já existente |

Único consumidor desses tokens hoje é `SeletorHumor.tsx` — confirmar em implementação que nenhum outro componente depende dos valores antigos antes de trocar.

## 5. Mudanças de componente

### `humorInicial.ts` — inversão da tabela de mapeamento
Numeração do humor passa a representar "1 = melhor, 5 = pior" (antes era o oposto). Nova tabela, preservando o significado emocional de cada extremo:

| `humorInicial` novo | Rótulo | `EstadoGeral` |
|---|---|---|
| 1 | Muito bem | `alta_energia_conforto` |
| 2 | Bem | `alta_energia_conforto` |
| 3 | Neutro | `baixa_energia_conforto` |
| 4 | Mal | `baixa_energia_desconforto` |
| 5 | Muito mal | `baixa_energia_desconforto` |

Validação (`validarHumorParam`) não muda — continua aceitando só inteiros 1-5. Testes de `humorInicial.test.ts` são reescritos para a nova tabela (mesma cobertura: os 5 valores válidos + valores inválidos).

### `SeletorHumor.tsx` — carinhas, ordem e seleção visual
Vira client component (`'use client'`). Lista `NIVEIS` reordenada com os novos rótulos/cores (tabela da Seção 4). Cada círculo ganha uma expressão facial simples em SVG inline (dois pontos para os olhos + um traço de boca — curva para cima nos positivos, reta no neutro, curva para baixo nos negativos), sem emoji do sistema.

Ao tocar: `onClick` marca `selecionado` no estado local, aplica `ring-2 ring-acao` + leve `scale-110` (transição 150-250ms via classe Tailwind `transition-transform duration-200`), depois navega para `/checkin?humor=N` (via `router.push`, com um pequeno atraso — `setTimeout` ~180ms — só o suficiente para a animação ser percebida antes da troca de rota). Continua sendo a mesma entrada alternativa para o fluxo de check-in já existente, sem duplicar lógica.

Cada botão de humor tem `aria-label` descritivo (ex. "Muito bem") já que o ícone é decorativo (`aria-hidden` no SVG da carinha).

### `SequenciaDias.tsx` — reescrita do conteúdo do cartão principal
Mantém a fonte de dados (`Progresso7Dias`, `calcularProgresso7Dias`). Novo conteúdo, lado esquerdo do cartão:
- Título dinâmico: `${diasConsecutivosAtuais} dias de sequência` (usa `formatarSequencia` existente ou equivalente para singular/plural e caso zero — "Comece sua sequência hoje" quando `diasConsecutivosAtuais === 0`).
- Subtítulo fixo: "Continue assim! Você está cuidando de você." (some quando a sequência é zero, sem soar destoante).
- Pontinhos: mesma lógica de 7 dias, mas sem as letras de dia da semana abaixo — só os 7 círculos (preenchido em `--color-acao`/bordô quando completo, contorno em `--color-borda` quando não).

Lado direito: nova ilustração SVG inline de rosa crescendo em vaso pequeno (substitui o SVG decorativo genérico atual), proporção que não comprime o texto à esquerda (ilustração com largura fixa ~64-72px, texto em `flex-1 min-w-0`).

O link "Ver meu progresso" abaixo do cartão é mantido (funcionalidade existente, não aparece no mockup mas não há razão para removê-la — fica como está, fora do cartão).

### `JornadaEmAndamento.tsx` — círculo rosa-claro
Troca só a cor de fundo do círculo da ilustração (hoje lilás `#B9A6D4` translúcido) para um rosa-claro (ex. `--color-humor-5`/`#B8697A` em baixa opacidade, ou um novo tom rosa-claro dedicado se a mistura não ficar legível — decidir durante implementação por inspeção visual). Ilustração interna e demais dados/roteamento não mudam.

### `RitualDeHoje.tsx` — botão isolado
Estado "ainda não fez check-in hoje" perde o título "Ritual de hoje" e o parágrafo descritivo — fica só o botão grande full-width (`bg-acao`, texto claro, `rounded-2xl`, ícone de coração contornado à esquerda do texto "Fazer check-in"). Deixa de usar `Cartao` como wrapper (o botão em si já tem o estilo de "cartão de ação"). Estado "já concluído hoje" não muda (continua com o cartão de resumo existente — situação que o mockup não cobre, mas que já existe e não deve ser removida).

### `Saudacao.tsx` — fallback de nome e sino
Fallback quando `nome` for `null` passa de "Bom dia" (sem nome) para "Bom dia, Sofia" (nome temporário, conforme pedido). Adiciona botão circular (`rounded-full`, `border border-borda`, `bg-superficie`) com ícone de sino SVG inline no canto direito do cabeçalho, `aria-label="Ver lembretes"`, link para `/settings`. Cabeçalho vira `flex items-center justify-between` para acomodar saudação + botão.

### `NavegacaoInferior.tsx` — safe area
Adiciona `style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}` (ou classe Tailwind arbitrária `pb-[env(safe-area-inset-bottom)]`) no `<nav>`. `src/app/layout.tsx` ganha `viewport-fit=cover` no export `viewport` (Next.js 16 usa `generateViewport`/`viewport` export, não a tag `<meta>` manual — confirmar API exata em implementação). `<main>` na página de início ajusta o `pb-24` atual se necessário para não esconder conteúdo atrás da barra com a inset somada.

### `page.tsx` — reordenação
Nova ordem: `Saudacao` → (`SeletorHumor` **ou** `ResumoDoDia`, conforme `jaFezCheckinHoje`, como já é hoje) → `SequenciaDias` → `JornadaEmAndamento` → `RitualDeHoje` (botão) → `MensagemAcolhedora` → `NavegacaoInferior`. `MensagemAcolhedora` sai de entre `SequenciaDias` e `JornadaEmAndamento` e passa para depois do botão de check-in — não aparece no mockup, mas continua existindo, só reposicionada para não quebrar o ritmo visual dos cartões principais.

## 6. Responsivo e acessibilidade

- `max-w-md` no `<main>` (já existente) cobre 360-430px; sem moldura de dispositivo em desktop (comportamento já atual, mantido).
- Todos os alvos de toque (círculos de humor, botão de check-in, sino, itens da nav) mantêm no mínimo ~44px de área de toque.
- Ícones decorativos com `aria-hidden="true"`; botões/links com `aria-label` quando o texto visível não for suficiente (sino, círculos de humor).
- Animações de seleção/toque respeitam `prefers-reduced-motion` (usar a mesma abordagem já usada em `globals.css` para as ilustrações do login — desativar transform/transition quando reduzido).

## 7. Verificação

- `tsc --noEmit` e `eslint` limpos.
- `npm run test` (Vitest) limpo, incluindo:
  - `humorInicial.test.ts` reescrito para a nova tabela (5 valores válidos + casos inválidos, mesma cobertura de antes);
  - qualquer teste existente que dependa da ordem/cores antigas dos tokens de humor (buscar antes de alterar).
- `npm run build` limpo.
- Checagem visual manual no navegador (dev server) em 360px, 390px e 430px de largura: seletor de humor (ordem, carinhas, seleção ao tocar), cartão de sequência (com 0 dias e com sequência ativa), cartão de jornada, botão de check-in isolado, sino no cabeçalho, navegação inferior com safe-area (emular notch se possível), e o estado "já fez check-in hoje" (sem seletor de humor nem botão, com resumo do dia).
- Comparação lado a lado com a imagem de referência fornecida pela usuária.
