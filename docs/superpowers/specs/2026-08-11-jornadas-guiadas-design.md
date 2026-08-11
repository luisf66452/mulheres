# Jornadas Guiadas — Design

**Data:** 2026-08-11
**Status:** Aprovado para planejamento de implementação
**Depende de:** MVP já implementado (Tasks 1-18 do plano `2026-08-10-ritual-diario-mvp.md`)

## 1. Contexto

Este é o primeiro de vários sub-projetos que expandem o app além do MVP original (ver visão completa na conversa que originou este desenho — 11 áreas de funcionalidade, das quais Jornadas Guiadas é a peça estrutural da qual mais outras dependem: onboarding personalizado, tela inicial, acompanhamento de evolução e o sistema de assinatura real).

**Fora de escopo neste sub-projeto** (ficam para depois, cada um com seu próprio desenho):
- Onboarding personalizado / recomendação automática de jornada — por enquanto a usuária escolhe manualmente.
- Bloqueio real free/premium — todo o conteúdo publicado fica acessível a qualquer usuária autenticada, igual ao restante do app durante o beta.
- Tela inicial (dashboard) — o ponto de entrada continua sendo `/checkin`, como hoje.
- Tela de celebração ao concluir uma jornada — a usuária só vê o status "Concluída" se voltar em `/jornadas`.
- Variações de conteúdo por intensidade/estado emocional — a atividade do dia é sempre o conteúdo fixo escrito pela psicóloga; a única adaptação real ao estado emocional continua sendo o desvio para a tela de segurança quando há sinal.

## 2. Regras de produto confirmadas

- Quando a usuária tem uma jornada ativa, a atividade do dia **substitui** a prática recomendada pelas regras — mas o check-in estruturado continua acontecendo todo dia normalmente.
- Sinal de segurança sempre tem prioridade: se o check-in disparar o sinal, vai para `/seguranca` como hoje, e o dia da jornada **não é consumido** (nada foi concluído).
- A usuária escolhe manualmente a jornada numa tela `/jornadas`, entre as jornadas publicadas.
- Apenas **uma jornada ativa por vez**. Trocar de jornada pausa a atual e ativa a nova, sem confirmação — o progresso de cada uma fica salvo e é retomado de onde parou se ela voltar depois.
- O progresso avança **por conclusão, não por calendário**: "dia N" é a N-ésima atividade que ela completou, não importa quantos dias de calendário passaram entre uma sessão e outra. Sem mensagens de "você perdeu sua sequência".
- V1 tem 3-4 jornadas completas (7-21 dias cada, conteúdo revisado pela psicóloga), em vez de todas as 8 ideias com pouco conteúdo.

## 3. Modelo de dados

### `jornadas` (nova tabela)
Curadoria da psicóloga, mesmo padrão de `praticas`.

```sql
create table public.jornadas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text not null,
  duracao_dias smallint not null check (duracao_dias between 7 and 21),
  status text not null default 'rascunho' check (status in ('rascunho', 'revisada', 'publicada')),
  criado_em timestamptz not null default now()
);
```

### `jornada_atividades` (nova tabela)
O conteúdo de cada dia de cada jornada.

```sql
create table public.jornada_atividades (
  id uuid primary key default gen_random_uuid(),
  jornada_id uuid not null references public.jornadas(id) on delete cascade,
  numero_dia smallint not null,
  titulo text not null,
  conteudo text not null,
  criado_em timestamptz not null default now(),
  unique (jornada_id, numero_dia)
);
```

### `jornadas_usuarias` (nova tabela)
Progresso de cada usuária em cada jornada que já começou.

```sql
create table public.jornadas_usuarias (
  id uuid primary key default gen_random_uuid(),
  usuaria_id uuid not null references public.perfis(id) on delete cascade,
  jornada_id uuid not null references public.jornadas(id) on delete cascade,
  dias_completados smallint not null default 0,
  status text not null default 'em_andamento' check (status in ('em_andamento', 'pausada', 'concluida')),
  iniciada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now(),
  concluida_em timestamptz,
  unique (usuaria_id, jornada_id)
);

-- Só uma jornada "em_andamento" por usuária ao mesmo tempo, garantido pelo banco.
create unique index jornadas_usuarias_uma_ativa_por_usuaria
  on public.jornadas_usuarias (usuaria_id)
  where status = 'em_andamento';
```

### Alteração em `sessoes` (já existe)
```sql
alter table public.sessoes alter column pratica_id drop not null;
alter table public.sessoes add column jornada_atividade_id uuid references public.jornada_atividades(id);
alter table public.sessoes add constraint sessoes_uma_fonte_de_atividade
  check (
    (pratica_id is not null and jornada_atividade_id is null) or
    (pratica_id is null and jornada_atividade_id is not null)
  );

-- Garante idempotência: no máximo uma sessão por check-in, mesmo sob requisições
-- concorrentes (double-click, retry de rede). Fecha também uma race condition que
-- já existia no fluxo de prática avulsa (Task 11), não só nas jornadas.
alter table public.sessoes add constraint sessoes_checkin_unico unique (checkin_id);
```

### RLS e GRANTs
Mesmo padrão do resto do schema (e da correção que fizemos essa semana — desta vez os GRANTs entram desde o início):

- `jornadas`, `jornada_atividades`: são tabelas de conteúdo curado pela psicóloga, só leitura pelo app — mesmo padrão de `praticas`. Política de `select` para `authenticated`, restrita a jornadas com `status = 'publicada'` (`jornada_atividades` filtra via subquery na jornada pai). `GRANT SELECT` apenas — nenhum grant de escrita para `authenticated` nessas duas (a curadoria acontece fora do app, como já acontece com `praticas`).
- `jornadas_usuarias`: é a tabela de progresso da própria usuária — política de `select`/`insert`/`update` para `authenticated`, restrita a `auth.uid() = usuaria_id`. `GRANT SELECT, INSERT, UPDATE` para `authenticated`.
- A nova coluna `jornada_atividade_id` em `sessoes` não precisa de grant próprio — grants em Postgres são por tabela, não por coluna, e `sessoes` já tem os grants corretos desde o MVP original.

## 4. Lógica pura (testável)

Três funções novas, seguindo o padrão já estabelecido (`avaliarCheckin`, `calcularProgresso7Dias`, `estaNaJanelaDeEnvio`) de extrair decisões de `Server Actions` para funções puras testáveis isoladamente.

### `calcularProgressoJornada` — `src/lib/jornadas/progresso.ts`
```ts
function calcularProgressoJornada(
  diasCompletados: number,
  duracaoDias: number
): { novoDiasCompletados: number; jornadaConcluida: boolean }
```
Incrementa `diasCompletados` em 1, **limitado a `duracaoDias`** (nunca ultrapassa, mesmo se chamada de novo com o valor já no máximo — idempotente por construção). Retorna se esse incremento conclui a jornada.

### `decidirProximaEtapaCheckin` — `src/lib/checkin/roteamento.ts`
```ts
function decidirProximaEtapaCheckin(params: {
  recomendacao: Recomendacao; // já existe, de avaliarCheckin
  jornadaAtiva: { jornadaId: string; diasCompletados: number } | null;
  atividadeDoDiaExiste: boolean;
}): { tipo: 'seguranca' } | { tipo: 'jornada' } | { tipo: 'pratica' }
```
Centraliza a decisão que hoje está espalhada em `submeterCheckin`: sinal de segurança sempre vence; sem sinal, jornada ativa com atividade disponível vence a prática normal; jornada ativa **sem** conteúdo pro dia (caso defensivo — não deveria acontecer se só publicarmos jornadas completas) cai de volta pra prática, em vez de travar o check-in.

### `decidirTrocaDeJornada` — `src/lib/jornadas/troca.ts`
```ts
function decidirTrocaDeJornada(params: {
  jornadaAtivaAtual: { id: string; jornadaId: string } | null;
  jornadaAlvoId: string;
  progressoExistenteNoAlvo: { id: string; diasCompletados: number } | null;
}): {
  pausar: { id: string } | null;
  ativar: { id: string; diasCompletados: number } | 'criar_nova';
}
```
Decide as atualizações necessárias ao trocar de jornada: pausa a atual (se houver), e ativa a nova — retomando `diasCompletados` salvo se ela já tinha começado essa jornada antes (nunca reseta pra 0 numa jornada retomada), ou criando um registro novo do zero se for a primeira vez.

## 5. Telas e fluxo

**`/jornadas` (nova)** — lista jornadas publicadas com estado por usuária (Não iniciada / Em andamento — dia X de Y / Pausada — dia X de Y / Concluída). Botão "Começar"/"Continuar" chama a Server Action que usa `decidirTrocaDeJornada` + persiste.

**`submeterCheckin` (modificada)** — depois de rodar `avaliarCheckin` como hoje, busca a jornada ativa da usuária (se houver) e se a atividade do dia existe, monta os parâmetros de `decidirProximaEtapaCheckin` e redireciona conforme o resultado.

**`/jornada-atividade/[id]` (nova)** — mesma estrutura de antes/depois de `/pratica/[id]`; ao concluir, insere em `sessoes` com `jornada_atividade_id` (não `pratica_id`), chama `calcularProgressoJornada` e persiste o novo `dias_completados` — e, se `jornadaConcluida`, marca `status = 'concluida'` e grava `concluida_em = now()`. Extraio a lógica de UI antes/depois num componente compartilhado entre essa tela e `/pratica/[id]`, em vez de duplicar.

Depois de concluir, redireciona para `/progresso`, igual ao fluxo de prática avulsa hoje.

## 6. Testes

- **`progresso.test.ts`** — dia do meio, último dia, chamada repetida com `diasCompletados` já no máximo (não ultrapassa `duracaoDias`), jornada de 7 dias vs 21 dias.
- **`roteamento.test.ts`** — sinal de segurança tem prioridade mesmo com jornada ativa; jornada ativa com atividade disponível vence a prática; jornada ativa **sem** atividade cadastrada cai pra prática (caso de conteúdo ausente); sem jornada ativa, comportamento idêntico ao atual.
- **`troca.test.ts`** — primeira jornada (sem jornada ativa anterior); trocar de uma jornada ativa para outra nova (pausa a atual, cria a nova com `diasCompletados = 0`); retomar uma jornada pausada anteriormente (preserva o `diasCompletados` salvo, não reseta).
- **Requisições simultâneas:** não é testável com um teste unitário puro em JS — a garantia real é a constraint `unique(checkin_id)` em `sessoes` a nível de banco, que faz a segunda tentativa de gravar sessão pro mesmo check-in falhar de forma atômica, independente de qualquer race condition na aplicação. Isso fica documentado aqui como a proteção efetiva; a verificação prática (como em tarefas anteriores que dependem de um projeto Supabase ao vivo) acontece manualmente contra o banco real na fase de implementação.

## 7. Conteúdo (fora do desenho técnico, nota para a fase de implementação)

3-4 jornadas completas precisam de conteúdo real revisado pela psicóloga antes de `status = 'publicada'` — mesmo padrão de `rascunho` usado no seed de práticas (Task 4). Isso é trabalho de curadoria de conteúdo, não parte deste desenho técnico.
