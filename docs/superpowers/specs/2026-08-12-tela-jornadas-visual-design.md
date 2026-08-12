# Tela de Jornadas — Redesenho visual — Design

**Data:** 2026-08-12
**Status:** Aprovado para planejamento de implementação
**Depende de:** identidade visual burnt-rose/lilás/creme já em produção, redesenho visual da tela de início (`2026-08-12-tela-inicio-visual-design.md`), Jornadas Guiadas (modelo de dados já existente).

## 1. Contexto

A tela de início já recebeu um redesenho visual completo, com uma identidade rica (ilustrações SVG, cartões com hierarquia clara, navegação de 5 abas). A tela de Jornadas (`/jornadas`) ainda está no estado anterior: funcional, usando os tokens certos de cor/tipografia, mas visualmente é uma lista plana de cartões idênticos, sem hierarquia entre "a jornada que a usuária está fazendo agora" e "as outras jornadas disponíveis", sem ilustração nenhuma, e com um link "Biblioteca de práticas" no rodapé que hoje é redundante — já existe a aba **Práticas** na navegação inferior.

Esta rodada redesenha `/jornadas` para ter a mesma riqueza visual da início: uma seção de destaque para a jornada em andamento (card grande, com progresso, ilustração e CTA principal) e uma seção de exploração com cartões mais informativos e ilustrados para as demais jornadas.

**Limitação assumida (mesma da tela de início):** não há acesso a valores de pixel exatos de um mockup — este design é proposto a partir da identidade visual já estabelecida, sem uma referência visual específica desta vez. Ajustes finos ficam para depois da checagem visual no navegador.

## 2. Fora de escopo

- Qualquer mudança na lógica de dados já existente: `AtivarJornadaButton`, `ativarJornada` (Server Action), `decidirTrocaDeJornada`, `BarraProgressoJornada`. Todos continuam exatamente como estão — esta rodada é puramente visual/estrutural na página `/jornadas`.
- Conceito real de "módulo" no banco de dados — módulo e sessão são **calculados** a partir do `numero_dia` já existente, não um dado novo (ver Seção 4).
- Duração real por atividade — o "tempo estimado" é um texto fixo (`~5 minutos`), consistente com a premissa do app inteiro (ritual diário de 5 minutos), não um campo novo.
- Estado "bloqueada" para jornadas — não existe bloqueio de jornada hoje (todo o conteúdo fica liberado no beta, decisão já registrada no spec do MVP). Só os estados que já existem de verdade entram nesta rodada: disponível, pausada ("iniciada"), concluída.
- Curadoria manual de ilustração/cor por jornada — as 5 ilustrações são atribuídas automaticamente por um hash determinístico do ID da jornada (Seção 6), sem exigir trabalho extra da psicóloga parceira no Supabase Studio.
- Redesenho de Práticas, Progresso e Perfil — seguem para rodadas futuras.

## 3. Sistema de tokens — extensão

Tokens atuais mantidos como estão (incluindo os 5 tokens de humor adicionados na rodada da início). Dois tokens novos, usados só nas ilustrações desta tela:

| Token | Hex aproximado | Uso |
|---|---|---|
| `--color-pessego` | `#E8B894` (pêssego suave) | Ilustração "sol" |
| `--color-salvia` | `#8FA888` (verde sálvia suave) | Ilustração "folha" |

## 4. Cálculo de módulo e sessão (lógica pura)

Nova função pura, sem mudança de banco:

```
calcularModuloSessao(numeroDia: number): { modulo: number; sessao: number }
modulo = ceil(numeroDia / 7)
sessao = ((numeroDia - 1) % 7) + 1
```

Exemplo: dia 10 → Módulo 2, Sessão 3. Dia 1 → Módulo 1, Sessão 1. Dia 7 → Módulo 1, Sessão 7. Dia 8 → Módulo 2, Sessão 1.

Usada só para exibição ("Módulo 2 · Sessão 3") — não afeta `numero_dia`, que continua sendo a chave real usada em toda a lógica de progresso/recomendação já existente.

**Correção de revisão — dia exibido nunca passa da duração da jornada:** ao calcular qual dia mostrar no card "Sua jornada atual" (Seção 6.1), o valor de entrada de `calcularModuloSessao` é `Math.min(dias_completados + 1, duracao_dias)`, não `dias_completados + 1` puro. Isso evita mostrar, por exemplo, "Sessão 8" numa jornada de 7 dias quando `dias_completados` já bateu ou passou `duracao_dias` (jornada concluída ou schema inconsistente). Essa é só a fórmula de **exibição** — a busca da atividade real em `jornada_atividades` (Seção 5) continua usando `dias_completados + 1` sem capping, porque é isso que corretamente resulta em "não encontrada" quando a jornada já acabou.

## 5. Refatoração: helper compartilhado de jornada ativa + link

A início (`src/app/page.tsx`) já busca a jornada ativa mais recente, a atividade do dia, e resolve o link com `resolverHrefAtividadeDoDia` (que exige o `checkin` de hoje). A tela de Jornadas precisa exatamente da mesma informação para o botão "Continuar jornada" do card principal — mas com uma diferença de comportamento importante quando não há atividade para o dia (ver correção abaixo). Em vez de duplicar essa sequência de queries nas duas páginas, ela é extraída para um helper de servidor único:

```ts
// src/lib/jornadas/buscarJornadaAtivaParaExibir.ts
async function buscarJornadaAtivaParaExibir(
  supabase, usuariaId: string, checkinHojeId: string | null
): Promise<{
  jornada: Jornada;
  progresso: JornadaUsuaria;
  linkAtividade: ResultadoLinkAtividade; // ver definição abaixo
} | null>
```

Internamente: busca as `jornadas_usuarias` com `status = 'em_andamento'`, aplica `escolherJornadaAtivaMaisRecente` (já existente, sem mudança), busca a jornada e a atividade do dia (`numero_dia = dias_completados + 1`, sem capping — ver Seção 4), e resolve o link.

**Correção de revisão — `resolverHrefAtividadeDoDia` deixa de retornar só uma `string`.** Hoje ela colapsa o caso "sem atividade" dentro do próprio `href` (`'/jornadas'`), o que funciona bem para o card pequeno da início (onde `/jornadas` é um destino legítimo — "veja suas jornadas"), mas não serve para o card principal da própria tela `/jornadas` (linkar para `/jornadas` a partir de `/jornadas` só recarregaria a mesma tela). A função é renomeada para `resolverLinkAtividadeDoDia` e passa a retornar um tipo com três casos, deixando cada página decidir como renderizar o caso "indisponível":

```ts
// src/lib/jornadas/emAndamento.ts
export type ResultadoLinkAtividade =
  | { tipo: 'atividade'; href: string }
  | { tipo: 'checkin'; href: string }
  | { tipo: 'indisponivel' };

export function resolverLinkAtividadeDoDia(
  atividadeId: string | null,
  checkinHojeId: string | null
): ResultadoLinkAtividade {
  if (!atividadeId) return { tipo: 'indisponivel' };
  return checkinHojeId
    ? { tipo: 'atividade', href: `/jornada-atividade/${atividadeId}?checkin=${checkinHojeId}` }
    : { tipo: 'checkin', href: '/checkin' };
}
```

**Cada consumidor mapeia o caso `indisponivel` à sua própria UI, preservando o comportamento já existente onde já existe:**

- **Início** (`src/app/page.tsx`, dentro de `JornadaEmAndamentoInfo`): `tipo === 'indisponivel'` vira `href: '/jornadas'` — exatamente a `string` que já era produzida antes desta refatoração. `tipo === 'atividade'` ou `'checkin'` vira `href: resultado.href` — também idêntico a antes. O componente `JornadaEmAndamento.tsx` não muda nada; só a montagem do `href` em `page.tsx` passa a fazer essa checagem explícita. **Este mapeamento precisa ser validado explicitamente antes de considerar a tarefa concluída** (checklist na Seção 10): mesmo comportamento de check-in, atividade recomendada e links de hoje, byte a byte.
- **Jornadas** (card "Sua jornada atual", Seção 6.1): `tipo === 'indisponivel'` **não mostra o botão "Continuar jornada"** — em vez dele, uma mensagem acolhedora (ex.: *"O próximo conteúdo dessa jornada ainda está sendo preparado."*) ocupa o lugar do botão. `tipo === 'atividade'` ou `'checkin'` mostra o botão normalmente, linkando para `resultado.href`.

Nenhuma outra função pura já testada (`escolherJornadaAtivaMaisRecente`) muda de assinatura. O teste existente de `resolverHrefAtividadeDoDia` em `emAndamento.test.ts` é atualizado para o novo nome/retorno de `resolverLinkAtividadeDoDia`.

## 6. Estrutura da tela `/jornadas`

Duas seções, nesta ordem, dentro do mesmo `<main>` (mesmo `max-w-md`, mesmo `pb-24` para não ficar atrás da navegação):

### 6.1 "Sua jornada atual"

**Com jornada em andamento** (helper da Seção 5 retorna não-nulo): card grande e destacado (`Cartao`, mas com padding maior e talvez um leve gradiente de fundo usando `--color-destaque` em baixa opacidade, no espírito de `FundoDecorativo.tsx`), contendo:

- Ilustração floral/abstrata no topo do card (SVG, `aria-hidden`, na cor `--color-acao`).
- Nome da jornada (`font-display text-xl`).
- "Módulo {modulo} · Sessão {sessao}" — calculado a partir de `Math.min(dias_completados + 1, duracao_dias)` (ver correção na Seção 4), usando a função da Seção 4. Sempre mostrada (o capping garante um valor válido mesmo quando a jornada já está no fim).
- Barra de progresso (`BarraProgressoJornada`, sem mudança) + percentual textual ao lado (`{Math.round(dias_completados / duracao_dias * 100)}%`).
- "Próxima sessão: ~5 minutos" (texto fixo) — só aparece junto do botão "Continuar jornada" (ver abaixo); no caso `indisponivel`, some junto com o botão, já que não há uma "próxima sessão" pronta para indicar tempo.
- **Botão principal ou mensagem, conforme `linkAtividade.tipo`** (ver correção na Seção 5):
  - `'atividade'` ou `'checkin'`: botão "Continuar jornada" (`Botao` variante primária), linkando para `linkAtividade.href`.
  - `'indisponivel'`: **sem botão** — em seu lugar, uma mensagem acolhedora (ex.: *"O próximo conteúdo dessa jornada ainda está sendo preparado — volte em breve."*), para nunca oferecer uma ação que só recarregaria a própria tela.
- Mensagem curta e acolhedora abaixo do botão/mensagem de indisponibilidade (texto fixo, ex.: *"Um passo de cada vez — você está indo bem."*), no mesmo tom das mensagens já usadas em `MensagemAcolhedora.tsx`.

**Sem jornada em andamento** (helper retorna nulo) — dois sub-estados, calculados a partir das mesmas jornadas/progressos já buscados na página:

- **Há pelo menos uma jornada publicada que a usuária ainda não concluiu** (sem registro em `jornadas_usuarias`, ou registro com `status != 'concluida'`): recomenda a primeira dessas por ordem de `criado_em`. Card acolhedor com o nome/descrição curta dessa jornada e um botão **"Começar uma jornada"** que chama `ativarJornada` (via `AtivarJornadaButton`, reaproveitado) para essa jornada — mesmo mecanismo de ativação já existente, incluindo o caso dela estar `pausada` (o botão reativa a partir de onde parou).
- **Todas as jornadas publicadas já foram concluídas pela usuária**: card de conquista ("Você concluiu todas as suas jornadas disponíveis!" ou tom equivalente ao resto do app) com um botão **"Revisitar jornada"** que chama `ativarJornada` (mesmo componente `AtivarJornadaButton`) para a jornada mais antiga por `criado_em` — reativa exatamente como qualquer revisão feita a partir da lista abaixo. **Correção de revisão:** este card não usa emoji (🌸 ou qualquer outro) — usa uma das 5 ilustrações SVG do sistema (Seção 7), por exemplo a "flor", mantendo consistência visual com o resto da tela em vez de misturar emoji com ilustração vetorial.
- **Nenhuma jornada publicada existe** (`jornadas` vazio): a seção inteira não aparece — mesmo padrão de "não renderizar card vazio" já usado em outros lugares do app.

### 6.2 "Explorar jornadas"

Lista das jornadas publicadas que **não** são a jornada em destaque da Seção 6.1 (se houver uma em destaque, ela some desta lista — sem repetição). Cada cartão:

- Ilustração própria (Seção 7), não repetida entre jornadas visíveis na mesma tela quando possível (ver determinismo na Seção 7).
- Título (`font-display`) e descrição curta.
- "{duracao_dias} dias" (já existente) — como proxy de "duração aproximada", já que não há estimativa em outra unidade.
- Quantidade de módulos: `ceil(duracao_dias / 7)`, mesma fórmula da Seção 4, texto tipo "{N} módulos".
- Estado + botão, conforme o registro em `jornadas_usuarias` da usuária para essa jornada (todos via `AtivarJornadaButton`, reaproveitado, só variando o `label`):
  - Sem registro → **disponível** → botão "Começar".
  - `status = 'pausada'` → **iniciada** → botão "Retomar".
  - `status = 'concluida'` → **concluída** → botão **"Revisitar jornada"**.
  - (Sem estado "bloqueada" nesta rodada — Seção 2.)

## 7. Ilustrações — atribuição determinística

5 ilustrações SVG simples (traço único, `aria-hidden`), cada uma com uma cor de destaque:

| Ilustração | Cor |
|---|---|
| Flor | `--color-acao` (rosa queimado) |
| Folha | `--color-salvia` (verde sálvia) |
| Onda | `--color-destaque` (lilás) |
| Sol | `--color-pessego` (pêssego) |
| Lua | `--color-destaque` em tom mais escuro (opacidade maior, sem novo token) |

Atribuição por hash simples e determinístico do `id` da jornada (soma dos code points do UUID, módulo 5) — mesma jornada sempre recebe a mesma ilustração entre renderizações, sem precisar de campo novo no banco:

```ts
function hashIlustracao(jornadaId: string): 0 | 1 | 2 | 3 | 4 {
  const soma = [...jornadaId].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return (soma % 5) as 0 | 1 | 2 | 3 | 4;
}
```

**Correção de revisão — resolução de colisão entre os cards visíveis.** Como o hash é só `soma % 5`, duas jornadas diferentes podem cair no mesmo índice — sem tratamento, isso faria duas jornadas na mesma tela mostrarem a mesma ilustração. A atribuição final não usa `hashIlustracao` isoladamente por jornada: usa uma função que recebe a lista de IDs **na ordem em que aparecem na tela** (jornada em destaque primeiro, se houver, depois "Explorar jornadas" na mesma ordem já usada — por `criado_em`) e resolve colisões deslocando para o próximo índice livre, deterministicamente:

```ts
function atribuirIlustracoes(jornadaIdsNaOrdemDeExibicao: string[]): Map<string, 0 | 1 | 2 | 3 | 4> {
  const usados = new Set<number>();
  const atribuicoes = new Map<string, 0 | 1 | 2 | 3 | 4>();

  for (const id of jornadaIdsNaOrdemDeExibicao) {
    let indice = hashIlustracao(id);

    if (usados.has(indice) && usados.size < 5) {
      for (let i = 1; i <= 5; i++) {
        const candidato = ((indice + i) % 5) as 0 | 1 | 2 | 3 | 4;
        if (!usados.has(candidato)) {
          indice = candidato;
          break;
        }
      }
    }

    usados.add(indice);
    atribuicoes.set(id, indice);
  }

  return atribuicoes;
}
```

Continua 100% determinística — a mesma lista de IDs na mesma ordem sempre produz a mesma atribuição, sem aleatoriedade. Quando há 5 ou menos jornadas visíveis, cada uma recebe uma ilustração diferente das demais (a colisão é sempre resolvida, porque sempre há um índice livre nesse caso). A partir da 6ª jornada visível (cenário raro, mas possível conforme o catálogo cresce), repetições voltam a acontecer — aceitável, já que "quando houver alternativas disponíveis" deixa de se aplicar. `hashIlustracao` continua exportada e testável isoladamente (mesmo ID sempre retorna o mesmo índice base); `atribuirIlustracoes` é a função usada de fato pela página.

## 8. Remoção do link redundante

O link "Biblioteca de práticas" no rodapé de `/jornadas` é removido — a aba **Práticas** na navegação inferior já cobre essa necessidade.

## 9. Modelo de dados

Nenhuma migration nesta rodada. Todos os dados já existem (`jornadas`, `jornada_atividades`, `jornadas_usuarias`); os dois tokens de cor novos (Seção 3) são só CSS.

## 10. Verificação

Mesmo processo já estabelecido no projeto:
- `tsc --noEmit` e `eslint` limpos.
- `npm run test` limpo, incluindo testes novos para:
  - `calcularModuloSessao` (casos de borda: dia 1, múltiplo exato de 7, dia dentro do meio de um módulo).
  - O uso de `Math.min(dias_completados + 1, duracao_dias)` antes de chamar `calcularModuloSessao` no card "Sua jornada atual" — caso `dias_completados >= duracao_dias`, a sessão exibida nunca ultrapassa `duracao_dias`.
  - `resolverLinkAtividadeDoDia` (renomeada — substitui os testes existentes de `resolverHrefAtividadeDoDia`): os três casos (`atividade`, `checkin`, `indisponivel`), incluindo os valores de `href` exatos para os dois primeiros.
  - `hashIlustracao` (determinismo — mesmo ID sempre retorna o mesmo índice — e cobertura dos 5 valores possíveis com IDs de exemplo).
  - `atribuirIlustracoes` (colisão resolvida quando há índice livre; repetição aceita a partir de 6 jornadas; determinismo — mesma lista/ordem sempre produz a mesma atribuição).
  - `buscarJornadaAtivaParaExibir` fica como wiring fino sobre Supabase (mesmo padrão de `src/app/page.tsx`) — verificado manualmente, não por harness de integração mockado.
- **Validação explícita de que a início não mudou de comportamento** (correção de revisão): depois de `src/app/page.tsx` passar a consumir `resolverLinkAtividadeDoDia` (via `buscarJornadaAtivaParaExibir` ou diretamente) em vez do antigo `resolverHrefAtividadeDoDia`, confirmar caso a caso, comparando com o comportamento documentado/testado antes desta rodada (spec e plano da início, seção de correções do card de jornada):
  - Com atividade do dia disponível e check-in de hoje feito → `href` da início continua `/jornada-atividade/{atividadeId}?checkin={checkinId}` (igual a antes).
  - Sem check-in hoje → `href` da início continua `/checkin` (igual a antes).
  - Sem atividade do dia → `href` da início continua `/jornadas` (igual a antes — é aqui que início e Jornadas divergem de propósito: início ainda usa `/jornadas` como fallback válido, só a própria tela de Jornadas não pode).
  - `jaFezCheckinHoje` continua controlando a visibilidade do `SeletorHumor` e do botão "Fazer check-in" exatamente como antes — nada nessa refatoração toca essa flag.
  - A escolha da jornada mais recentemente atualizada (`escolherJornadaAtivaMaisRecente`) continua idêntica.
- `npm run build` limpo.
- Checagem visual manual no navegador: `/jornadas` com jornada em andamento (incluindo o caso raro de atividade indisponível para o dia — botão ausente, mensagem acolhedora no lugar), sem jornada em andamento (com pendentes), sem jornada em andamento (todas concluídas), sem nenhuma jornada publicada, e cada estado de cartão em "Explorar jornadas" (disponível, pausada, concluída). Confirmar que a jornada em destaque não se repete na lista de exploração, que as ilustrações não se repetem entre os cards visíveis (com 5 ou menos jornadas), e que o botão "Continuar jornada" leva ao lugar certo (atividade do dia, ou `/checkin` se ainda não fez o check-in hoje). Confirmar também, na tela de início, que o card "Continue sua jornada" continua se comportando exatamente como antes desta rodada.
