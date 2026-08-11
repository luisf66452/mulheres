# Experiência completa (progresso, histórico, biblioteca) — Design

**Data:** 2026-08-11
**Status:** Aprovado para planejamento de implementação
**Depende de:** MVP, Jornadas Guiadas, identidade visual "Manhã de Domingo" (branch anterior) e a tela inicial com paleta rosa queimado/lilás/creme (branch `experiencia-completa`, commit `e715423`).

## 1. Contexto

Nota sobre paleta: esta mensagem do humano pediu "manter bege, marrom e terracota", mas duas mensagens antes disso ele confirmou explicitamente, por uma pergunta de múltipla escolha, trocar para rosa queimado/lilás/creme — e isso já está implementado na tela inicial. Entendo a frase como uma referência solta ao estilo "acolhedor e terroso" em geral, não como uma reversão da decisão explícita. Sigo com a paleta rosa queimado/lilás/creme já confirmada; se essa leitura estiver errada, é só avisar.

Este desenho expande o app com quatro peças que dependem só de dados que já existem no Supabase — nenhuma tabela, coluna ou política nova:

1. **Sequência atual e melhor sequência** (streak atual, já existe parcialmente; streak recorde, novo).
2. **Gráfico de evolução** de humor, imagem corporal e relação com a comida.
3. **Histórico de check-ins e rituais**.
4. **Biblioteca de práticas** navegável livremente, fora do fluxo obrigatório de check-in.

## 2. Regras de produto confirmadas

- As 4 abas da navegação inferior continuam exatamente as mesmas: Início, Jornadas, Progresso, Perfil. Nenhuma aba nova.
- O fluxo de check-in → prática recomendada (ou atividade de jornada) continua **byte-idêntico** — nenhuma lógica de `checkin/actions.ts`, `pratica/[id]`, `jornada-atividade/[id]` ou das regras de recomendação muda.
- **Biblioteca de práticas** ganha rotas próprias (`/praticas`, `/praticas/[id]`), acessadas a partir de um link dentro da aba Jornadas — não é uma aba nova, e é **somente leitura**: mostra o conteúdo da prática, mas não inicia o fluxo de sensação antes/depois nem grava `sessoes` (essa gravação é sempre atrelada a um `checkin_id`, que só existe dentro do fluxo de check-in — misturar os dois fluxos correria o risco real de gravar uma sessão órfã ou duplicada).
- Nenhuma migration, tabela, coluna, policy ou GRANT novo. Todas as leituras usam RLS já existente (`auth.uid() = usuaria_id` para dados da própria usuária; `status = 'publicada'` para conteúdo curado).
- Zero dado fictício: se não houver registros suficientes, a tela mostra um estado vazio honesto, nunca um placeholder que pareça dado real.
- Gráfico só mostra tendência (linha) com 2 ou mais check-ins. Com 0, convite pra começar. Com 1, mensagem incentivando a continuar (não dá pra traçar tendência com um ponto só).
- Plural correto em toda contagem de dias: "1 dia seguido" / "2 dias seguidos" / "0 dias seguidos" — nunca o placeholder preguiçoso `dia(s)` que já existe hoje em `/progresso` e na tela inicial (ambos corrigidos como parte deste trabalho).
- Estados de carregamento, erro e vazio são obrigatórios nas telas **novas** desta spec (biblioteca, histórico, gráfico, melhor sequência). Não é um retrofit das telas antigas já revisadas — isso ficaria fora de escopo e arriscaria regressão em código que já funciona.

## 3. Modelo de dados usado (confirmado direto nas migrations, nada presumido)

Nenhuma tabela nova. Campos relevantes, todos já existentes:

- `checkins`: `usuaria_id`, `data` (date, único por usuária+dia), `humor`/`imagem_corporal`/`comida` (smallint 1-5), `criado_em`.
- `sessoes`: `checkin_id`, `usuaria_id`, `pratica_id` (nullable) **ou** `jornada_atividade_id` (nullable) — nunca os dois ao mesmo tempo (constraint `sessoes_uma_fonte_de_atividade`), `criado_em`.
- `praticas`: `categoria`, `tipo`, `titulo`, `conteudo`, `status`. RLS já libera `select` pra qualquer usuária autenticada quando `status = 'publicada'` — mesma política que a tela `/jornadas` já usa hoje pra jornadas.
- `jornadas` / `jornada_atividades`: usados só para resolver o título de uma atividade de jornada no histórico (join simples).

## 4. Lógica pura nova (testável)

Seguindo o padrão já usado em `calcularProgresso7Dias`, `calcularProgressoJornada`, etc.

### `calcularMelhorSequencia` — adicionada a `src/lib/progress/streak.ts`
```ts
function calcularMelhorSequencia(datasCheckin: string[]): number
```
Maior sequência de dias corridos com check-in em toda a história da usuária (não só os últimos 7 dias). Datas duplicadas são ignoradas (defensivo — a constraint `unique(usuaria_id, data)` já impede duplicata real). Lista vazia retorna 0.

### `formatarSequencia` — adicionada a `src/lib/progress/streak.ts`
```ts
function formatarSequencia(dias: number): string
```
`0` → `"0 dias seguidos"`, `1` → `"1 dia seguido"`, `N` → `"N dias seguidos"`. Usada em toda contagem de dias consecutivos do app (sequência atual e melhor sequência), substituindo o `dia(s)` que existe hoje em `/progresso` e em `SequenciaDias.tsx`.

### `decidirEstadoGrafico` — `src/lib/grafico/estado.ts`
```ts
function decidirEstadoGrafico(quantidadeCheckins: number): 'sem_dados' | 'poucos_dados' | 'com_tendencia'
```
`0` → `sem_dados`, `1` → `poucos_dados`, `2+` → `com_tendencia`. Centraliza a regra de "só mostra tendência com 2+ check-ins" num lugar só, testável sem precisar renderizar nada.

### `calcularPontosLinha` — `src/lib/grafico/pontos.ts`
```ts
function calcularPontosLinha(
  valores: number[],
  largura: number,
  altura: number
): { x: number; y: number }[]
```
Converte uma lista de valores na escala 1–5 em coordenadas SVG (X igualmente espaçado, Y invertido e escalado de `[1,5]` para `[altura,0]`). Pura, sem depender de DOM — testável isoladamente com valores conhecidos (ex.: todos os valores em 5 devem virar todos os pontos no topo; todos em 1, todos embaixo).

## 5. Telas e rotas

### `/praticas` (nova) — Biblioteca de práticas
Lista todas as práticas com `status = 'publicada'` (mesma query que `/jornadas` já faz para jornadas), agrupadas por `categoria` — um cabeçalho por valor distinto de `categoria`, na ordem em que aparecem na consulta (sem ordenação especial; não há uma taxonomia fixa de categorias no schema hoje). Cada item linka para `/praticas/[id]`. Estado vazio se não houver nenhuma publicada; estado de erro se a consulta falhar; `loading.tsx` próprio.

### `/praticas/[id]` (nova) — Leitura de uma prática
Mostra `titulo` e `conteudo` da prática (só leitura — sem escala de sensação, sem gravação de sessão). 404 (`notFound()`, reaproveitando o `not-found.tsx` que já existe) se o id não existir ou não estiver publicada. `loading.tsx` próprio.

### `/jornadas` (modificada) — ganha um link
Abaixo da lista de jornadas já existente, um cartão/link "Biblioteca de práticas" levando para `/praticas`. Nenhuma mudança na lógica de jornadas em si.

### `/progresso` (modificada) — vira a aba "seus dados"
Mantém a sequência de 7 dias (`ProgressoBlobs`, já existe) e ganha, na ordem:
1. **Melhor sequência** — usa `calcularMelhorSequencia` + `formatarSequencia` sobre todos os check-ins da usuária.
2. **Gráfico de evolução** — humor, imagem corporal e comida ao longo do tempo (últimos até 30 check-ins, mais recentes primeiro na consulta, revertidos para ordem cronológica antes de plotar). Três linhas, uma por dimensão, mesma escala 1–5. Usa `decidirEstadoGrafico` + `calcularPontosLinha`.
3. **Histórico** — lista dos últimos até 20 check-ins (mais recentes primeiro) com data, os três valores, e o que foi feito naquele dia (join com `sessoes` → `praticas.titulo` ou `jornada_atividades.titulo`; "Nenhuma atividade registrada" se a sessão não existir, o que pode acontecer se o check-in disparou o sinal de segurança).

Todas as três seções novas têm estado de carregamento (`loading.tsx` da rota), erro (mensagem honesta se a consulta falhar) e vazio (mensagem convidando a fazer o primeiro check-in).

## 6. Componentes novos

- `src/app/praticas/CartaoPratica.tsx` — item da lista da biblioteca.
- `src/app/progresso/MelhorSequencia.tsx`
- `src/app/progresso/GraficoEvolucao.tsx` — recebe os check-ins já ordenados, decide o estado, desenha o SVG.
- `src/app/progresso/Historico.tsx` — recebe a lista já montada (check-in + descrição do ritual feito).

Nenhuma biblioteca de gráficos nova — o SVG é desenhado à mão com `calcularPontosLinha`, no mesmo espírito dos outros componentes de assinatura visual já existentes no app (nenhuma dependência nova no `package.json`).

`NavegacaoInferior.tsx` (já existe) ganha uma pequena extensão: a aba "Jornada" passa a ficar ativa também em `/praticas` e `/praticas/[id]`, não só em `/jornadas`, já que a biblioteca é alcançada a partir dessa aba.

## 7. Segurança e RLS

Nenhuma policy nova é necessária — todas as consultas novas replicam exatamente o padrão de acesso que as telas já revisadas usam:
- `checkins` e `sessoes`: sempre filtradas por `.eq('usuaria_id', user!.id)` no código **e** protegidas por RLS (`auth.uid() = usuaria_id`) no banco — mesmo padrão duplo (app + RLS) já usado em `/progresso` e `/checkin`.
- `praticas` e `jornadas`: `.eq('status', 'publicada')`, mesmo padrão que `/jornadas` e o roteamento de check-in já usam — RLS permite a qualquer usuária autenticada, não há dado de outra usuária envolvido nessas duas tabelas.

## 8. Testes

- **`streak.test.ts`** (estende o arquivo existente) — `calcularMelhorSequencia`: sem check-ins (0), um check-in isolado (1), sequência quebrada por um dia faltando, sequência recorde no meio do histórico maior que a sequência atual, datas fora de ordem. `formatarSequencia`: 0, 1, 2, 10.
- **`estado.test.ts`** — `decidirEstadoGrafico`: 0, 1, 2, 30.
- **`pontos.test.ts`** — `calcularPontosLinha`: lista vazia, um valor, todos os valores iguais (linha reta), valores no mínimo e no máximo da escala (extremos nas bordas do SVG), espaçamento igual em X para N pontos.
- Telas (`/praticas`, `/praticas/[id]`, seções novas de `/progresso`): sem teste automatizado de UI (o projeto não tem suíte de regressão visual) — verificação via `tsc`/`eslint` + checagem manual no navegador, mesmo padrão já estabelecido no resto do projeto.

## 9. Fora de escopo

- Paginação do histórico (fica limitado às últimas 20 entradas nesta rodada).
- Filtros no gráfico (por período, por dimensão) — mostra sempre os últimos 30 check-ins.
- Retrofit de estados de carregamento/erro nas telas já existentes e já revisadas (`/checkin`, `/pratica/[id]`, `/jornada-atividade/[id]`, `/seguranca`, `/settings`, `/premium`, `/privacidade`).
- Edição ou exclusão de check-ins/sessões pela usuária.
- Qualquer mudança de schema, migration, policy ou GRANT.
