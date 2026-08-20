# Spec — Jornada estruturada de módulos psicoeducativos

Status: implementado nesta branch (`jornada-estruturada-modulos-psicoeducativos`). Conteúdo clínico aguardando validação da psicóloga (ver `docs/EVIDENCE.md`).

## Contexto

O app tem dois sistemas de "Jornadas" não integrados: o Sistema A (Supabase, real, com progresso e recompensas de pétalas já funcionando) e o Sistema B (biblioteca estática em TypeScript, mockada, sem persistência real). Esta spec cobre a adição de 9 novos módulos psicoeducativos **dentro do Sistema A**, decisão confirmada explicitamente pelo usuário — não se discute mais qual sistema usar.

## Decisão de arquitetura

Os 9 módulos formam **uma jornada de 9 dias** em `jornadas`/`jornada_atividades` (cabe no `check (duracao_dias between 7 and 21)` já existente). Cada dia = um módulo completo. Isso reaproveita 100% do fluxo de progresso e recompensas já testado (`registrarSessaoJornada`, `sessaoJornadaPrimeiraConclusao`, `jornadaCompleta`) em vez de criar um sistema de recompensas paralelo.

## O que foi adicionado e por quê

### 1. Conteúdo estruturado compatível (`supabase/migrations/0029_jornada_modulos_estruturados.sql`)

Renumerada de 0026 para 0029 durante a validação técnica: a branch `experiencia-completa` já havia ocupado 0026–0028 (recompensa "viagem surpresa", idempotência de push, progresso da biblioteca estática de jornadas) em produção antes desta migração ser escrita. Reconciliado via `supabase migration fetch` + comparação com o worktree dessa branch — ver relatório de validação técnica.

- `jornada_atividades.conteudo_estruturado jsonb` + `schema_version smallint`, ambos nuláveis, com uma constraint garantindo que os dois andam juntos (`(nulo, nulo)` ou `(preenchido, preenchido)`).
- `conteudo` (texto) **não foi alterado nem removido**. Jornadas antigas continuam com `conteudo_estruturado is null` e o app renderiza exatamente como antes (`AntesDepoisAtividade`).
- Validação de estrutura em TypeScript: `src/lib/jornadas-modulos/tipos.ts` (interface `ModuloEstruturadoV1`) + `src/lib/jornadas-modulos/validarModulo.ts` (validador em runtime, usado ao carregar a atividade — se o JSON estiver inválido, cai no fallback de texto simples em vez de quebrar a página).

### 2. Respostas como documento, não EAV (`jornada_respostas_modulo`)

Uma linha por `(user_id, atividade_id)` — `unique (user_id, atividade_id)` permite upsert do rascunho sem duplicar. Colunas: `id, user_id, jornada_usuario_id, atividade_id, sessao_id (opcional), schema_version, respostas (jsonb), created_at, updated_at`. `respostas` segue `RespostaModuloV1` (`{ schemaVersion, valores: Record<campoId, valor>, finalizadoEm }`).

Persistência: autosave debounced (800ms) a cada mudança de campo + save explícito ao avançar de etapa + save final antes de registrar a sessão — sobrevive a atualização de página porque a página busca a resposta salva no server component (`page.tsx`) e hidrata o componente client com ela.

### 3. RLS e privacidade

- RLS habilitada; policies de `select`/`insert`/`update` restritas a `(select auth.uid()) = user_id` (padrão recomendado atual do Supabase — `select` em vez de chamar `auth.uid()` direto, por performance).
- `UPDATE` tem `USING` e `WITH CHECK`.
- Sem policy de `delete`; sem `grant` para `anon` (fica sem nenhum acesso à tabela via Data API).
- Trigger `verificar_propriedade_resposta_modulo`: a policy de RLS sozinha só confere `user_id` — sem o trigger, uma usuária poderia anexar sua resposta a um `jornada_usuario_id` alheio caso adivinhasse o id. O trigger valida que `jornada_usuario_id` pertence a `user_id` e que `atividade_id` pertence à jornada dessa inscrição.
- Funções internas (`verificar_propriedade_resposta_modulo`, `set_updated_at_jornada_respostas_modulo`) têm `execute` revogado de `public/anon/authenticated`, seguindo o padrão de hardening já usado em `0025_security_hardening_internal_functions.sql`.
- Testes de RLS: `supabase/tests/jornada_respostas_modulo_rls.test.sql` (pgTAP), cobrindo os 4 cenários exigidos. **Não pôde ser executado neste ambiente** (sem Docker/Postgres local disponível) — ver seção de limitações no relatório final.

### 4. Feedback determinístico, não-clínico

`src/lib/jornadas-modulos/avaliarFeedback.ts`: motor de regras explícitas (`condicoes` em AND, primeira regra que bate vence, senão usa o texto `padrao`). Por design, as regras só podem referenciar campos estruturados (`escolha_unica`, `multipla_escolha`, `escala`) — nunca interpretam o conteúdo de um campo de texto livre. Nenhuma IA generativa é usada para gerar ou interpretar feedback. A UI sempre permite continuar, editar campos e pular os opcionais (nenhum campo obrigatório bloqueia além dos marcados como tal no conteúdo do módulo).

### 5. Triagem por palavras-chave (complementar, não clínica)

`src/lib/jornadas-modulos/deteccaoAtencao.ts`: lista de termos (risco de vida, automutilação, violência/abuso, comportamento de risco alimentar), normalização de maiúsculas/acentos via `normalize('NFD')`, roda inteiramente no client sobre o texto já digitado (nenhuma chamada de rede, nenhum log do texto). Quando um termo bate em um campo listado em `camposParaTriagem` do módulo, o `CardAtencaoSeguranca` muda para um estado "destacado" com uma frase deixando claro que não é uma avaliação nem diagnóstico. O acesso a `/seguranca` fica sempre visível no card, independente da varredura ter batido ou não — e o módulo nunca é bloqueado.

### 6. Progresso e recompensas

`registrarSessaoJornada`, `sessaoJornadaPrimeiraConclusao` e `jornadaCompleta` não foram alterados. `ModuloEstruturadoAtividade` termina chamando a mesma função de sempre com `(sensacaoAntes, sensacaoDepois)` — a idempotência (constraint `sessoes_checkin_unico`, chave de "primeira conclusão" por `jornada_atividade_id`) já existia e continua valendo sem mudança nenhuma.

## O que NÃO foi feito (fora de escopo, por instrução explícita)

- Sistema B não foi tocado nem unificado com o Sistema A.
- Nenhuma interpretação de texto livre por IA generativa.
- Nenhuma tentativa de "prever crise com certeza" — a triagem é sempre apresentada como heurística complementar.

## Conteúdo dos 9 módulos

Ver `docs/EVIDENCE.md` para a tabela completa de referências científicas, aplicação e limitações. Resumo dos temas: (1) Entendendo minhas emoções, (2) Pensamentos não são fatos, (3) Autocompaixão e autocrítica, (4) Ansiedade, preocupação e ruminação, (5) Perfeccionismo e medo de falhar, (6) Imagem corporal além da aparência, (7) Limites e comunicação assertiva, (8) Hábitos e autocuidado possível, (9) Prevenção de recaídas e plano pessoal.
