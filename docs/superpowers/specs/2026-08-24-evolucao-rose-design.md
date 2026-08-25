# Evolução da Rose — Fase 2 (design)

Data: 2026-08-24
Status: aprovado para plano de implementação

## Objetivo

Adicionar sete funcionalidades à Rose, reaproveitando arquitetura, tabelas e componentes existentes, sem duplicar sistemas já presentes:

1. Resumo semanal pessoal sem diagnóstico
2. Práticas em áudio
3. Espaço "Preciso de ajuda agora"
4. Onboarding personalizado
5. Sequência gentil
6. Favoritos e "Continuar de onde parei"
7. Exportação das reflexões e do progresso

## Regras transversais (não negociáveis)

- A Rose não é terapia, não diagnostica, não substitui acompanhamento profissional.
- Nunca classificar a usuária com transtornos, distorções, riscos clínicos ou conclusões psicológicas.
- Proibido: "você melhorou", "você piorou", "isso significa que", "a causa é", previsões emocionais, "bom"/"ruim"/"normal"/"anormal".
- Linguagem sempre descritiva: "nos seus registros", "nesta semana", "você registrou", "apareceu com mais frequência".
- Sem chatbot terapêutico, sem LLM analisando reflexões, sem envio de dados emocionais a serviços externos.
- Segurança, exportação e privacidade nunca ficam atrás do Rose Pro.
- Nunca pedir permissão de notificação do navegador automaticamente — só por ação explícita da usuária.
- Não alterar Stripe, Pétalas, preços, domínio, TikTok Pixel ou regras de assinatura (exceção pontual: mover o *momento* em que o evento `CompleteRegistration` já existente dispara dentro do fluxo de onboarding — ver seção 4; a implementação do pixel em si não é tocada).
- Preservar PWA, Web Push, jornadas, sessões, progresso, check-in existentes.
- Mobile-first, acolhedor, sem cores/mensagens punitivas.
- Conteúdo clínico e roteiros de áudio entram marcados como pendentes de revisão da psicóloga antes de qualquer publicação.

## Planos e acesso

| Feature | Acesso |
|---|---|
| Resumo semanal completo | Rose Pro (free vê prévia) |
| Biblioteca de áudios | Rose Pro, com 1 prática gratuita de demonstração |
| "Preciso de ajuda agora" | Sempre gratuito, mesmo sem login |
| Onboarding personalizado | Todas |
| Sequência gentil | Todas |
| Favoritos / continuar | Todas, respeitando paywall do conteúdo original |
| Exportação de dados | Todas, sempre gratuito |

---

## 1. Fundação de banco (migrations, RLS, tipos)

### Tabela nova: `favoritos`

```
id uuid pk default gen_random_uuid()
usuaria_id uuid not null references public.perfis(id) on delete cascade
pratica_id uuid references public.praticas(id) on delete cascade
sessao_id text
criado_em timestamptz not null default now()
check ( (pratica_id is not null) <> (sessao_id is not null) )  -- exatamente um dos dois
```

- Índices únicos parciais: `unique (usuaria_id, pratica_id) where pratica_id is not null` e `unique (usuaria_id, sessao_id) where sessao_id is not null`.
- `sessao_id` fica `text` sem FK (o catálogo de sessões de jornada vive em código, não em tabela — mesmo padrão de `sessoes_jornadas_conteudo_progresso.sessao_id`); existência validada no servidor contra o catálogo em código.
- RLS habilitada. Policies `to authenticated`: `select`, `insert`, `delete`, todas com `(select auth.uid()) = usuaria_id`. Sem policy de `update` (não é necessária). GRANT: `select, insert, delete` para `authenticated`; nada para `anon`.

### Tabela nova: `exportacoes_dados` (interna)

```
id uuid pk default gen_random_uuid()
usuaria_id uuid not null references public.perfis(id) on delete cascade
tipo text not null check (tipo in ('json','csv'))
criado_em timestamptz not null default now()
```

- Só registra que uma exportação ocorreu — nunca o conteúdo.
- RLS habilitada, **sem policies para `authenticated`**. GRANT revogado de `anon` e `authenticated`. Escrita exclusivamente via admin client (service role) no servidor, dentro da própria rota de exportação — nunca a partir de input do cliente.

### Alterações em `praticas`

```
+ audio_url text
+ duracao_segundos int
+ transcricao text
+ audio_status text not null default 'rascunho' check (audio_status in ('rascunho','revisada','publicada'))
+ is_pro boolean not null default false
```

- **`tipo` não é alterado** — mantém os 4 valores atuais (`respiracao`,`reflexao`,`afirmacao`,`movimento`). Temas como "autocompaixão"/"aterramento" são `categoria` (já é `text` livre, sem constraint), não `tipo`.
- Visibilidade do player decidida na camada de aplicação, não por constraint de banco: só renderiza quando `status = 'publicada' AND audio_status = 'publicada' AND audio_url/duracao_segundos/transcricao` não nulos. Isso permite rascunhos com dados parciais.
- RLS/GRANT existentes (`select` para `authenticated` quando `status='publicada'`) preservados sem mudança.

### Alterações em `recursos_seguranca`

```
+ fonte text
+ verificado_em date
```

- Um recurso só é exibido como "confirmado" em produção quando `fonte` e `verificado_em` estiverem preenchidos com uma fonte oficial verificada nesta fase. Contatos não verificáveis nesta fase permanecem na tabela (para referência/revisão futura) mas a query de exibição filtra por `fonte is not null and verificado_em is not null`.

### Alterações em `perfis`

```
+ objetivos text[] not null default '{}'
+ temas_sensiveis text[] not null default '{}'
+ onboarding_extra_concluido_em timestamptz
+ onboarding_extra_dispensado_em timestamptz
```

- `objetivos` e `temas_sensiveis` são dados sensíveis: validados no servidor contra listas fechadas (as opções literais do enunciado), nunca strings arbitrárias.
- **Sem GRANT de UPDATE direto** nessas colunas via PostgREST (mesmo padrão de trava de `pais`/`plano`). Escrita só via server action dedicada, usando admin client, que também permite apagar (gravar `'{}'`) ou alterar a qualquer momento.
- `onboarding_extra_concluido_em`: preenchido só quando a usuária efetivamente conclui a etapa (mesmo que escolhendo "prefiro decidir depois"/"prefiro não responder" em algum campo — a etapa foi respondida).
- `onboarding_extra_dispensado_em`: preenchido só quando uma usuária antiga dispensa o banner em Perfil sem preencher nada. Distinto de conclusão real.
- Lembrete reaproveita `preferencias_notificacoes` + `horario_preferido_notificacao` já existentes — nenhuma coluna nova.

### Convenções (seguidas em todas as migrations novas)

- `supabase migration new <nome>` para cada migration (nunca nome manual).
- RLS habilitada em toda tabela nova; policies `to authenticated`; `(select auth.uid()) = usuaria_id`; UPDATE (quando existir) com `USING` e `WITH CHECK`; nunca `auth.role()`; nunca GRANT a `anon`; nunca `SECURITY DEFINER` para contornar RLS.
- Tipos TypeScript (`src/lib/supabase/types.ts`) atualizados manualmente após cada migration (não há `supabase gen types` configurado no projeto — padrão confirmado na auditoria).
- Idempotência (`drop policy if exists`, `create table if not exists`) e `notify pgrst, 'reload schema';` ao final, seguindo o padrão das migrations recentes.

---

## 2. Onboarding personalizado

- Preserva as etapas atuais (18+, nome, consentimento dados sensíveis, termos/privacidade, país) sem alteração de comportamento.
- Novo passo na máquina de estados de `OnboardingClient.tsx`, após `pais`: objetivos → temas sensíveis → lembrete, só para quem ainda não tem `onboarding_extra_concluido_em`.
- **Fluxo de conclusão alterado**: `confirmarPais()` deixa de redirecionar para `/?cadastro=concluido`; passa a avançar para a etapa de personalização. O evento `CompleteRegistration` (já existente) dispara só ao final dessa etapa — seja concluindo normalmente, seja escolhendo "prefiro decidir depois" em tudo.
- Objetivos: multi-seleção opcional das 7 opções do enunciado. Temas sensíveis: multi-seleção opcional das 6 opções do enunciado. "Prefiro decidir depois"/"prefiro não responder" **nunca** entram nos arrays — gravam array vazio; o fato de a etapa ter sido respondida/pulada fica só no timestamp de conclusão, não no conteúdo do array.
- Lembrete: escolha de horário reaproveitando `preferencias_notificacoes`/`horario_preferido_notificacao`; opção "não quero lembretes agora" não grava preferência ativa. Não solicita permissão de notificação do navegador nesta etapa.
- Progresso salvo por etapa (mesmo padrão do onboarding atual), idempotente (nunca sobrescreve silenciosamente uma resposta já dada, exceto edição explícita).
- Usuárias antigas: banner dispensável em `/perfil` ("Personalize sua experiência"), visível enquanto **ambos** `onboarding_extra_concluido_em` e `onboarding_extra_dispensado_em` forem nulos. Dispensar grava só `onboarding_extra_dispensado_em`. Edição continua sempre acessível em Perfil independente do estado dos dois campos.
- Edição posterior: seção em Perfil reaproveitando os mesmos componentes/validação/server action.

---

## 3. Sequência gentil

- `SequenciaDias.tsx` (Home) para de duplicar lógica própria e passa a consumir `descreverSequencia()` de `src/lib/progress/streak.ts`, unificando o texto exibido em Home e em `/progresso`.
- `descreverSequencia()` ganha novos parâmetros: dias ativos nos últimos 7 dias (array/booleanos) e se houve atividade hoje — necessários para diferenciar corretamente dia perdido, semana sem atividade e retorno após pausa (os parâmetros atuais, `diasConsecutivosAtuais`/`totalCheckins`, não bastam).
- Vocabulário: "Você cuidou de si em X dos últimos 7 dias", "Você pode recomeçar hoje" — nunca "perdeu"/"quebrou"/alertas vermelhos/chama quebrada/contagem regressiva.
- `MelhorSequencia` passa a exibir também um total acumulado (ex.: total de check-ins), não só a maior sequência consecutiva — atende "celebrar totais e marcos, não só dias consecutivos".
- Nenhuma mudança na lógica de cálculo técnico (`streak.ts` já calcula corretamente); mudança é de apresentação/texto/parâmetros. Pétalas e conquistas continuam intocadas.
- Testes: primeiro check-in, dias consecutivos, dia perdido, retorno após pausa, semana sem atividade, e um teste varrendo o texto gerado contra uma lista de vocabulário proibido.

---

## 4. Resumo semanal pessoal

- Módulo puro `src/lib/progress/resumoSemanal.ts`: recebe check-ins da semana selecionada e da anterior (já buscados por `/progresso`, reaproveitados — nenhuma query nova de check-ins), calcula:
  - Dias com check-in na semana.
  - Práticas/sessões concluídas **filtradas pelo período da semana selecionada** (não mais contagem total), respeitando o fuso horário da usuária (mesma lógica de fuso já usada em `/progresso`).
  - Tema/emoção em destaque: só quando a semana tem ≥3 check-ins **e** o mesmo item aparece ≥2 vezes; valores tipo "prefiro_nao_responder" excluídos do cômputo.
  - Distribuição descritiva de humor, imagem corporal e alimentação.
  - Comparação neutra com a semana anterior só quando ambas tiverem ≥3 check-ins.
  - Mensagem acolhedora não avaliativa; estado vazio para semanas sem registros.
- Select de check-ins ampliado para incluir `estado_geral`, `emocao_especifica`, `fatores` (além dos campos já buscados hoje).
- Componente `ResumoSemanalPessoal` (server, dentro de `/progresso`): aviso fixo "Este resumo descreve apenas o que você registrou e não representa diagnóstico ou avaliação clínica."; vocabulário proibido nunca aparece no código de geração de texto.
- Gate Pro: resumo completo exige `plano === 'premium'`; free vê prévia (mas o aviso legal aparece sempre, mesmo na prévia).
- Nenhum dado novo persistido — cálculo sob demanda.
- Testes: semana vazia, poucos registros, semana completa, comparação indisponível, comparação permitida, destaque de tema com critério de frequência, vocabulário proibido.

---

## 5. Favoritos e "Continuar de onde parei"

### Favoritos

- Server actions `favoritar(tipo, id)` / `desfavoritar(tipo, id)`.
- `favoritar` valida explicitamente no servidor que a prática existe **e** está `publicada` (não depende só da FK) antes do insert; erro `23505` (violação de unique) tratado como sucesso idempotente (índices parciais podem não funcionar como alvo explícito de upsert do PostgREST).
- Para `sessao_id`, valida contra o catálogo em código de `jornadas-conteudo` antes do insert.
- `BotaoFavorito` (client) com `aria-pressed`, nos cartões de prática e nas telas de sessão de jornada.
- Página `/favoritos`: resolve título/descrição via `praticas` (join) e catálogo em código (sessões). Item cujo conteúdo foi removido/despublicado: cartão discreto "Conteúdo indisponível" com opção de remover o favorito — nunca omitido silenciosamente nem quebra a página.
- Paywall de conteúdo Pro validado **também no servidor da rota do conteúdo** (não só visualmente no cartão) — favoritar nunca contorna o paywall.

### Continuar de onde parei

- Card na Home, server component. Prioridade 1: sessão em `sessoes_jornadas_conteudo_progresso` com `iniciada_em is not null and concluida_em is null` — retoma essa mesma sessão. Prioridade 2: só se não houver sessão em andamento, busca a próxima sessão desbloqueada e ainda não concluída. Prioridade 3: se nada no sistema de jornadas, prática com progresso local recuperável (`src/lib/praticas-progresso/armazenamento.ts`, já existe, local por dispositivo). Se nenhum dos casos, não renderiza nada.
- Nenhuma nova fonte de verdade — tudo lido do que já existe.

---

## 6. Práticas em áudio

- Fonte canônica: tabela `praticas` (colunas da seção 1). `PRATICAS_RAPIDAS` continua existindo só como catálogo de práticas rápidas interativas (respiração guiada por cronômetro, diário guiado, etc.), sem registros duplicados.
- Nova camada `src/lib/praticas-catalogo/` unifica os dois catálogos para a listagem de `/praticas`, usando IDs estáveis por fonte (evita colisão/duplicação entre práticas de código e práticas do banco).
- `PlayerAudio` novo, construído do zero (o protótipo do worktree `experiencia-completa` só tem play/pause+volume — insuficiente e não reaproveitável para o requisito completo):
  - Play/pause, barra de progresso arrastável (seek), tempo atual/duração, skip ±10s, seletor de velocidade (0.75x/1x/1.25x/1.5x).
  - Todos os controles com `aria-label`; navegável por teclado (setas para seek com foco no slider, espaço para play/pause).
  - Media Session API atrás de feature-detection (`if ('mediaSession' in navigator)`), handlers limpos no cleanup do `useEffect` de desmontagem.
  - Transcrição em `<details>` expansível. Sem autoplay. `preload="metadata"`. Tratamento de erro de carregamento (`onError`) com mensagem amigável.
  - Posição salva localmente (por dispositivo, não no banco) com atualização controlada/throttled — não grava a cada frame; permite retomar; posição apagada quando a prática é marcada concluída.
- Roteiros textuais novos (respiração, autocompaixão, aterramento) entram com `status='rascunho'` **e** `audio_status='rascunho'` — nem texto nem áudio aparecem em produção antes de `revisada`/`publicada` pela psicóloga.
- Gate Pro: `is_pro` checado no servidor da rota da prática (não só no cliente); pode existir uma prática gratuita de demonstração (`is_pro = false`).
- **Pendência externa a ser reportada na entrega final**: nenhuma gravação de áudio real existe ainda — só roteiros textuais pendentes de revisão. Sem arquivo de áudio válido publicado, nenhum botão de player aparece em produção.

---

## 7. Espaço "Preciso de ajuda agora"

- Mantém `/seguranca` como única rota, evoluída (não duplicada).
- **Funciona mesmo sem sessão autenticada**: com perfil e país confirmado, usa o país da usuária; sem sessão, mostra seleção manual PT/BR e orientação genérica — nunca depende de login para exibir ajuda emergencial.
- Pontos de entrada visíveis adicionados: Home, fluxo de check-in, Perfil, e um componente reaproveitável `AvisoSeguranca` (variante compacta do `CardAtencaoSeguranca` já existente) em conteúdos com aviso de segurança — sem duplicar a lógica de detecção existente.
- Exibe **somente** contatos com `fonte` e `verificado_em` preenchidos (fonte oficial verificada nesta fase). Contatos ainda não verificáveis permanecem na tabela para revisão futura, mas não aparecem como recurso confirmado em produção.
- Texto fixo: "A Rose não acompanha emergências em tempo real" + orientação para emergência local em caso de perigo imediato. Botão "Voltar ao app".
- Links de discagem via `<a href="tel:...">` — toque para ligar, nunca chamada automática.
- Resiliente: se a consulta a `recursos_seguranca` falhar ou vier vazia para o país, a tela ainda mostra a orientação genérica de emergência local.
- Nenhuma análise nova de texto livre — heurística client-side (`detectarSinalDeAtencao`) e rota estruturada (`sinal_seguranca`) permanecem como estão.
- Verificação de fontes: pesquisa de fontes oficiais (governo/saúde) de PT e BR feita na fase de implementação, documentando `fonte`+`verificado_em` por contato; contato não confirmável fica sinalizado, não é apresentado como confirmado.

---

## 8. Exportação das reflexões e do progresso

- Extração da lógica atual de `exportarMeusDados` (`src/app/perfil/privacidade/actions.ts`) para um **módulo canônico único** (ex.: `src/lib/exportacao/coletarDados.ts`), reaproveitado tanto pela action existente quanto por uma nova rota de download autenticada — sem duas implementações paralelas.
- Módulo canônico ganha as tabelas que faltavam: `jornada_respostas_modulo`, `sessoes_jornadas_conteudo_progresso`, `favoritos` — sempre lidas com o cliente autenticado normal e RLS (`usuaria_id = user.id`), nunca service role.
- Formatos:
  - **JSON**: arquivo único, como hoje.
  - **CSV**: entregue como **ZIP** contendo arquivos separados por tabela — `checkins.csv`, `reflexoes.csv`, `praticas.csv`, `jornadas.csv`, `favoritos.csv` — nunca tabelas incompatíveis misturadas num único CSV.
- Nova rota autenticada de download (ex.: `/api/exportar/[formato]`) usa o módulo canônico para ler os dados (RLS, cliente autenticado) e retorna:
  - `Cache-Control: private, no-store`
  - `Content-Disposition: attachment; filename="rose-meus-dados-{data}.{ext}"`
  - `Content-Type` correto por formato (`application/json`, `application/zip`).
- Escape de CSV contra formula injection: prefixo `'` em valores que, **após remover espaços/tabulação/quebras de linha à esquerda**, começam com `=`, `+`, `-` ou `@`. Aspas duplicadas e quebras de linha dentro de células tratadas corretamente (aspas envolvendo o valor).
- Ao concluir uma exportação, a **própria rota** (server-side) grava uma linha em `exportacoes_dados` usando o **admin client** (a tabela não tem policy/GRANT para `authenticated` — só o servidor escreve) — nunca o conteúdo exportado, só `usuaria_id`+`tipo`.
- UI existente (`ExportarDadosBotao.tsx`) passa a chamar a nova rota em vez de gerar o Blob no cliente — mantém loading/erro amigável.
- Nunca inclui `role`, `stripe_customer_id`, `stripe_subscription_id`, `push_subscriptions` (endpoint/p256dh/auth), dados administrativos, ou dados de outra usuária.
- Testes: acesso sem login ao espaço de segurança (seção 7), fallback sem país, contatos não verificados não aparecem, headers de download corretos, conteúdo do ZIP (nomes/arquivos esperados), escape de formula injection com espaço/tab/quebra antes do caractere perigoso, e isolamento entre usuárias (A nunca recebe linha de B em nenhuma tabela nova).

---

## Ordem de implementação

1. Auditoria (concluída) e este design.
2. Migrations, RLS, GRANTs, tipos TS (seção 1).
3. Onboarding personalizado (seção 2).
4. Resumo semanal e sequência gentil (seções 3–4).
5. Favoritos e continuar (seção 5).
6. Infraestrutura e player de áudio (seção 6).
7. Evolução do espaço de segurança (seção 7).
8. Exportação de dados (seção 8).
9. Testes completos, RLS, typecheck, lint, build, advisors, QA manual.

## Verificação obrigatória antes do PR

- Testes unitários/componentes/integração (TDD: red → green por item).
- Testes de RLS com duas usuárias + sessão anônima.
- Typecheck, lint, build de produção.
- Supabase advisors (segurança e desempenho).
- QA manual no Preview (lista completa do enunciado original).

## Entrega

- PR aberto, sem merge, sem deploy automático.
- Lista de arquivos alterados, migrations aplicadas, tabelas/policies/GRANTs criados.
- Resultado de testes, typecheck, lint, build, advisors.
- Link do Preview.
- Pendências externas explícitas: gravações de áudio reais (nenhuma existe ainda) e revisão psicológica de todo conteúdo clínico/roteiros — nunca afirmar que os áudios estão prontos.
