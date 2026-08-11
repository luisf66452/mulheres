# Check-in Emocional (modelo rico, 8 etapas) — Design

**Data:** 2026-08-12
**Status:** Aprovado para planejamento de implementação
**Depende de:** MVP, Jornadas Guiadas, identidade visual, tela inicial, experiência completa (PR #2, branch `experiencia-completa`).
**Sub-projeto 1 de 7** da expansão completa descrita na mensagem do humano de 2026-08-12 ("transformar o aplicativo... experiência completa"). Os demais 6 sub-projetos (Progresso com calendário emocional, Jornada "Reconstruindo minha relação com o corpo", Jardim Interior, Apoio agora, Rede de segurança, Perfil expandido) ficam para specs próprias, depois deste.

## 1. Contexto

O check-in atual pergunta três números soltos (humor, imagem corporal, comida, 1-5) sem contexto emocional. Este desenho substitui a UI por um assistente de 8 etapas (mapa de emoções, palavra específica, intensidade, corpo, gatilhos de comparação, alimentação percebida, contexto, próxima ação) — mas **preserva o motor de recomendação, a sequência e o gráfico de evolução exatamente como estão**, através de mapeamentos determinísticos que continuam alimentando `humor`/`imagem_corporal`/`comida` com os mesmos números de sempre.

## 2. Regras de produto confirmadas

- `humor`, `imagem_corporal`, `comida`, `texto_livre`, `sinal_seguranca` continuam existindo com os mesmos tipos e o mesmo significado — `avaliarCheckin`, `calcularProgresso7Dias`, `calcularMelhorSequencia`, `GraficoEvolucao` e `regras_recomendacao` não são alterados nesta spec.
- `texto_livre` é reaproveitado como a anotação da etapa 7 — nenhum campo duplicado, registros antigos continuam válidos (o campo já era opcional).
- "Com vontade de se punir" (etapa 6) **sempre** aciona o fluxo de segurança — via checagem explícita no código, não por inferência de faixa numérica em `regras_recomendacao` (que pode mudar no futuro sem essa garantia).
- Etapa 8 (próxima ação): "apenas guardar" salva e mostra confirmação, sem rotear para prática/jornada; "entender melhor" e "prática rápida" seguem para o roteamento existente (jornada ativa com atividade do dia disponível vence; senão, prática recomendada) — a spec não distingue destino entre essas duas, ambas levam ao mesmo lugar que o check-in leva hoje. Sinal de segurança sempre vence sobre qualquer escolha de próxima ação.
- Nenhuma tabela é removida ou recriada. `checkins` ganha colunas novas (nullable, registros antigos ficam com elas em branco) e uma mudança de constraint (`comida` deixa de ser `not null`, ver Seção 3).

## 3. Modelo de dados

### Migration `0004_checkin_emocional.sql`

```sql
-- Estende checkins com o modelo emocional rico. Os campos legados (humor,
-- imagem_corporal, comida, texto_livre, sinal_seguranca) continuam exatamente
-- como estão -- o motor de recomendação, a sequência e o gráfico de evolução
-- dependem deles sem nenhuma mudança de código. Registros antigos ficam com
-- as colunas novas em null, o que é esperado e não afeta nada existente.

alter table public.checkins add column estado_geral text
  check (estado_geral in ('alta_energia_desconforto', 'alta_energia_conforto', 'baixa_energia_desconforto', 'baixa_energia_conforto'));

alter table public.checkins add column emocao_especifica text;

alter table public.checkins add column intensidade smallint
  check (intensidade between 1 and 5);

alter table public.checkins add column alimentacao_percebida text
  check (alimentacao_percebida in ('tranquila', 'satisfeita', 'indiferente', 'confusa', 'ansiosa', 'culpada', 'vontade_punir', 'prefiro_nao_responder'));

alter table public.checkins add column gatilho_local text;
alter table public.checkins add column gatilho_pensamento text;
alter table public.checkins add column gatilho_emocao_depois text;

alter table public.checkins add column fatores text[];

alter table public.checkins add column proxima_acao text
  check (proxima_acao in ('guardar', 'entender', 'pratica_rapida'));

-- Única mudança de constraint em coluna existente: "prefiro não responder"
-- na etapa de alimentação precisa gravar null em vez de inventar uma nota.
-- Não afeta linhas existentes (todas já têm um valor 1-5 gravado).
alter table public.checkins alter column comida drop not null;
```

Nenhum GRANT novo — `checkins` já tem `select, insert` para `authenticated` desde a Task 17 do MVP, e GRANTs são por tabela, não por coluna. Nenhuma policy nova — a policy existente (`auth.uid() = usuaria_id`) já cobre as colunas novas.

### Tipos TypeScript (`src/lib/supabase/types.ts`)

```ts
export type EstadoGeral =
  | 'alta_energia_desconforto'
  | 'alta_energia_conforto'
  | 'baixa_energia_desconforto'
  | 'baixa_energia_conforto';

export type AlimentacaoPercebida =
  | 'tranquila' | 'satisfeita' | 'indiferente' | 'confusa'
  | 'ansiosa' | 'culpada' | 'vontade_punir' | 'prefiro_nao_responder';

export type ProximaAcaoEscolhida = 'guardar' | 'entender' | 'pratica_rapida';
```
`Checkin` ganha os campos novos como opcionais (`estado_geral?: EstadoGeral | null`, etc.), e `comida: number` vira `comida: number | null`.

## 4. Lógica pura nova (testável)

### `derivarHumor` — `src/lib/checkin/derivacoes.ts`
```ts
function derivarHumor(estadoGeral: EstadoGeral, intensidade: number): number
```
Tabela exata (confirmada pelo humano):
| Quadrante | Intensidade | `humor` |
|---|---|---|
| confortável (`*_conforto`) | alta (4-5) | 5 |
| confortável | baixa (1-2) | 4 |
| — | neutra (3) | 3 |
| desconfortável (`*_desconforto`) | baixa (1-2) | 2 |
| desconfortável | alta (4-5) | 1 |

O caso "neutro" é a intensidade exatamente 3, independente do quadrante — não existe um quinto quadrante "neutro" nesta versão, então essa linha é resolvida pela intensidade sozinha.

### `derivarImagemCorporal` — mesmo arquivo
```ts
function derivarImagemCorporal(confortoCorporal: number): number
```
A pergunta da etapa 4 é desenhada como uma escala de **conforto** (1 = muito desconfortável, 5 = muito confortável) — a mesma direção que `imagem_corporal` já tem hoje (5 = relação mais confortável). Por isso a função é a identidade (`(v) => v`), mas existe como função nomeada e testada para deixar essa direção documentada e travada: se algum dia a UI for reformulada como escala de desconforto, o ponto de conversão já existe e o teste (`derivarImagemCorporal(5)` deve ser `5`, não `1`) pega a inversão errada imediatamente.

### `derivarComida` — mesmo arquivo
```ts
function derivarComida(alimentacaoPercebida: AlimentacaoPercebida): number | null
```
Tabela exata (confirmada pelo humano):
| Resposta | `comida` |
|---|---|
| `tranquila` | 5 |
| `satisfeita` | 5 |
| `indiferente` | 4 |
| `confusa` | 3 |
| `ansiosa` | 2 |
| `culpada` | 2 |
| `vontade_punir` | 1 |
| `prefiro_nao_responder` | `null` |

### `decidirRecomendacaoComProtecao` — `src/lib/checkin/recommend.ts` (nova função no arquivo existente, `avaliarCheckin` não muda)
```ts
function decidirRecomendacaoComProtecao(
  answers: { humor: number; imagemCorporal: number; comida: number | null; alimentacaoPercebida: AlimentacaoPercebida },
  regras: RegraRecomendacao[]
): Recomendacao
```
Se `alimentacaoPercebida === 'vontade_punir'`, retorna `{ tipo: 'sinal_seguranca' }` imediatamente, **sem consultar `regras`** — essa é a garantia estrutural pedida, independente de qualquer faixa numérica cadastrada. Caso contrário, delega para `avaliarCheckin` (inalterada), usando `comida ?? 3` só para fins de comparação de faixa (3 = nem favorece nem penaliza; o valor gravado no banco continua sendo o `null` real, esta substituição nunca é persistida).

### `decidirProximaEtapaCheckin` — `src/lib/checkin/roteamento.ts` (estende a função existente)
```ts
function decidirProximaEtapaCheckin(params: {
  recomendacao: Recomendacao;
  proximaAcaoEscolhida: ProximaAcaoEscolhida;
  jornadaAtiva: { jornadaId: string; diasCompletados: number } | null;
  atividadeDoDiaExiste: boolean;
}): { tipo: 'seguranca' } | { tipo: 'guardar' } | { tipo: 'jornada' } | { tipo: 'pratica' }
```
Ordem de decisão: sinal de segurança sempre primeiro (como hoje); depois, se `proximaAcaoEscolhida === 'guardar'`, retorna `{ tipo: 'guardar' }` sem olhar jornada/prática; senão (`'entender'` ou `'pratica_rapida'`), usa exatamente a mesma lógica que já existe (jornada ativa com atividade do dia vence; senão prática). O parâmetro novo é obrigatório — todo chamador precisa passar a escolha da usuária.

## 5. Telas e fluxo

**`/checkin` (reescrita)** — assistente de 8 etapas em `CheckinFormClient.tsx`, um estado por etapa (`'estado_geral' | 'emocao' | 'intensidade' | 'corpo' | 'gatilhos' | 'alimentacao' | 'contexto' | 'proxima_acao'`), navegação só para frente (sem voltar nesta versão — YAGNI, pode virar pedido futuro). Etapas 5 (gatilhos) e 7 (contexto/anotação) são explicitamente marcadas como opcionais na UI, com um jeito claro de pular.

Etapa 8 tem 3 botões (guardar / entender melhor / prática rápida). Ao escolher, `submeterCheckin` grava o check-in completo (todas as colunas novas + os três valores derivados) e usa `decidirRecomendacaoComProtecao` + `decidirProximaEtapaCheckin` para decidir o destino:
- `seguranca` → redireciona para `/seguranca`, como hoje.
- `guardar` → **não redireciona** — a própria `CheckinFormClient` mostra um estado final de confirmação acolhedora ("Seu momento foi guardado 🌿", com um link para `/progresso`), sem sair da página.
- `jornada` / `pratica` → redireciona para `/jornada-atividade/[id]` ou `/pratica/[id]`, exatamente como hoje.

## 6. Testes

- **`derivacoes.test.ts`** — as 5 linhas de `derivarHumor` (incluindo intensidade 3 em cada quadrante, todas devem dar 3); `derivarImagemCorporal` identidade nos extremos (1→1, 5→5) e no meio (3→3); as 8 linhas de `derivarComida`, incluindo `prefiro_nao_responder` → `null`.
- **`recommend.test.ts`** (estende o existente) — `decidirRecomendacaoComProtecao`: `vontade_punir` retorna sinal de segurança mesmo com regras que not matcheriam risco nenhum (prova que não depende das regras); `comida: null` com `alimentacaoPercebida` diferente de `vontade_punir` usa 3 na comparação sem lançar erro; delega corretamente para `avaliarCheckin` no caso normal.
- **`roteamento.test.ts`** (estende o existente) — as 4 combinações de `proximaAcaoEscolhida` × jornada ativa/não, mais o caso de segurança vencendo mesmo com `proximaAcaoEscolhida: 'pratica_rapida'` e jornada disponível.
- **Salvamento das 7 etapas de dados**: verificação manual contra o Supabase real (mesmo padrão já usado nas rodadas anteriores) — não é testável em unidade pura porque envolve `insert` real.

## 7. Fora de escopo

- Editar ou voltar etapas do check-in depois de avançar.
- A tela "entender melhor" ter um conteúdo diferente da prática recomendada normal (fica igual por ora, ver Seção 2).
- Qualquer coisa dos outros 6 sub-projetos (calendário emocional, jornada nova completa, Jardim Interior, Apoio agora, rede de segurança, perfil expandido) — cada um recebe sua própria spec depois deste.
- Alterar `regras_recomendacao` ou seu conteúdo — a curadoria de limiares continua sendo trabalho da psicóloga, fora do código.
