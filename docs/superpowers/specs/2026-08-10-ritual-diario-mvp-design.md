# Ritual Diário — MVP de app para autoestima, imagem corporal e relação com a comida

**Data:** 2026-08-10
**Status:** Aprovado para planejamento de implementação

## 1. Visão geral

Ajudar mulheres jovens adultas brasileiras (20-35 anos) a cuidar da relação com autoestima, imagem corporal e alimentação através de um hábito diário curto (~5 minutos), seguro e guiado por conteúdo com autoria clínica visível — sem prometer terapia ou diagnóstico.

## 2. Público-alvo e posicionamento

**Público-alvo:** mulheres de 20-35 anos, no Brasil, em português.

**Diferencial:**
1. **Cultura brasileira** — linguagem e realidade da mulher brasileira, não é tradução de app americano.
2. **Autoria clínica visível** — práticas criadas/revisadas por uma psicóloga parceira, funcionando como selo de confiança.
3. **Simplicidade radical** — um ritual de 5 minutos por dia, sem inchar com features.

O app não é terapia, não faz diagnóstico e não substitui acompanhamento profissional.

## 3. Fora de escopo nesta primeira versão

- Terapia, diagnóstico ou triagem clínica.
- Comunidade/rede social entre usuárias.
- Contagem de calorias ou métricas de peso/corpo.
- App nativo nas lojas (fica para depois da validação via PWA).
- IA generativa tomando decisões clínicas — toda recomendação é 100% baseada em regras revisadas pela psicóloga.
- Cobrança/checkout real (ver seção 10).
- Lembrete por e-mail (ver seção 8) — fica para versão futura.
- Prática alternativa à recomendação principal — fica para versão futura.
- Escalonamento automático ou contato ativo em casos de sinal de segurança (ver seção 6).

## 4. Fluxo do produto (ritual diário)

1. **Abertura** — o app verifica se a usuária já fez o check-in hoje; se sim, mostra o progresso em vez de repetir.
2. **Check-in estruturado** — três perguntas rápidas em escala/opções fixas (não texto livre): humor, imagem corporal, relação com a comida hoje. Um campo opcional de texto livre é oferecido para desabafo, com aviso claro e visível **antes** de a usuária escrever, informando que esse texto não é analisado nem monitorado no MVP.
3. **Avaliação por regras:**
   - **Sinal de segurança / necessidade de apoio detectado** (com base só nas respostas estruturadas — o texto livre nunca é interpretado) → a usuária não recebe a prática comum do dia. Em vez disso, vê uma tela de acolhimento (ver seção 6).
   - **Sem sinal de segurança** → o app recomenda **uma** prática principal, escolhida por regra fixa revisada pela psicóloga (sem alternativa no MVP).
4. **Prática guiada** — conteúdo curto (respiração, reflexão, afirmação ou movimento consciente), texto e/ou áudio, ~5 minutos.
5. **Registro final** — "como você se sente agora?", captura simples de antes/depois.
6. **Progresso** — free: últimos 7 dias (sequência, resumo simples). Premium: histórico completo + insights semanais. Todos os insights são **apenas descritivos e acolhedores** (ex: "você registrou bem-estar em 5 dos últimos 7 dias"), nunca causais ou clínicos (nunca do tipo "seus dias ruins são causados por X").

## 5. Modelo de dados (conceitual)

- `usuarias` — conta, plano (free/premium), data de criação.
- `checkins` — usuária, data, humor, imagem corporal, comida, texto livre opcional, flag de sinal de segurança.
- `praticas` — biblioteca de práticas (categoria, tipo, conteúdo, status de revisão: rascunho/revisada/publicada).
- `regras_recomendacao` — mapeamento condição do check-in → prática principal (inclui a regra especial de sinal de segurança).
- `sessoes` — qual prática foi feita, sensação registrada depois.
- `recursos_seguranca` — conteúdo estático de apoio, configurável por país (campo `pais`, iniciando com Brasil).
- `intencao_pagamento` — plano/preço hipotético escolhido pela usuária (sem transação real associada).
- `acessos_administrativos` — log de qualquer consulta pontual a dados individuais (quem acessou, quando, motivo).

## 6. Segurança e sinalização de necessidade de apoio

- O resultado do check-in nunca é chamado de "diagnóstico" ou "detecção clínica" em nenhum lugar do produto — os termos usados são **"sinal de segurança"** ou **"necessidade de apoio"**.
- A detecção é baseada em regras sobre as respostas estruturadas do check-in (os limites exatos são definidos pela psicóloga parceira, não é uma decisão técnica). O campo de texto livre nunca é analisado nem monitorado no MVP, e isso é informado claramente à usuária antes de ela escrever.
- Quando o sinal é disparado, a tela de acolhimento usa linguagem gentil e sem julgamento, e apresenta:
  - **CVV 188** como apoio emocional gratuito (não como serviço de emergência).
  - Orientação de que, em risco imediato, a usuária deve procurar **SAMU 192, uma UPA, pronto-socorro ou hospital**.
- Os recursos de apoio são configuráveis por país, começando pelo Brasil, para permitir expansão futura.
- O check-in continua sendo salvo normalmente, com uma flag de sinal de segurança que armazena **apenas o mínimo necessário** (booleano + data + qual check-in gerou), sem dados adicionais de perfilamento.
- Não há contato ativo da equipe com a usuária além do que é mostrado na tela (sem ligação, sem e-mail automático), e não há lógica de escalonamento automático no MVP (ex: acionar algo diferente após múltiplos dias de sinal seguidos).

## 7. Curadoria de conteúdo clínico

- Toda prática e toda regra de recomendação passam por revisão da psicóloga parceira antes de ficarem ativas (status: rascunho / revisada / publicada).
- O texto dos recursos de segurança (linhas de apoio, orientação) também é revisado e aprovado por ela antes do lançamento do beta.
- No MVP, o conteúdo é gerenciado diretamente nas tabelas do Supabase (via Supabase Studio) — sem painel de CMS customizado nesta fase.

## 8. Notificações e lembretes

- Push nos dispositivos/navegadores que suportam (Android sempre; iOS 16.4+ se instalado na tela inicial), com pedido de permissão no onboarding e horário preferido configurável.
- **No MVP beta, o único fallback é um lembrete visual dentro do próprio app** (ex.: banner "você ainda não fez seu ritual hoje" ao abrir). Lembrete por e-mail fica para uma versão futura.

## 9. Privacidade e LGPD

- Consentimento explícito e específico para tratamento de dados sensíveis de saúde (LGPD Art. 11), coletado no onboarding, separado do aceite geral de termos de uso.
- Dados em trânsito e em repouso criptografados (padrão Supabase); acesso de cada usuária aos próprios dados isolado via Row Level Security.
- **Por padrão, nem a fundadora nem a psicóloga têm acesso a dados ou flags individuais de uma usuária específica.** Acesso pontual só ocorre com finalidade definida, permissão explícita e fica registrado em `acessos_administrativos` (quem acessou, quando, por quê).
- A psicóloga recebe prioritariamente dados agregados e anonimizados para avaliar o produto (ex: "X% das usuárias relataram melhora de humor após a prática"), sem identificar usuárias individualmente.
- A flag de sinal de segurança armazena apenas o mínimo necessário (ver seção 6), com o mesmo controle de acesso restrito.
- Usuária pode solicitar exportação ou exclusão dos seus dados; o processo pode ser manual no MVP (ex.: pedido por e-mail respondido em poucos dias), mas precisa existir desde o início.
- Retenção: dados mantidos enquanto a conta estiver ativa; ao excluir a conta, dados apagados ou anonimizados em até 30 dias.
- **Encarregado de dados (DPO):** não se assume automaticamente a obrigatoriedade de nomear um encarregado nesta fase. É preciso **verificar** se o projeto se enquadra como agente de tratamento de pequeno porte (regras simplificadas da ANPD). Independentemente do resultado dessa verificação, o MVP disponibiliza desde o lançamento do beta um canal de comunicação (e-mail dedicado) para solicitações sobre dados pessoais.

## 10. Monetização e intenção de pagamento

- **Free:** 1 check-in/dia + prática recomendada + progresso básico dos últimos 7 dias.
- **Premium:** histórico completo, insights semanais, biblioteca completa de práticas, jornadas guiadas, conteúdo aprofundado.
- Durante o beta (20-50 usuárias), todos os recursos ficam liberados gratuitamente.
- **Não há checkout nem cobrança real no MVP.** O modelo de dados prevê um campo de plano (free/premium) para ativação futura. Em vez de cobrança, o app registra a **intenção de pagamento**: uma tela pergunta à usuária qual plano/preço ela escolheria, e essa resposta é salva em `intencao_pagamento` como dado interno, sem transação associada.

## 11. Stack técnica

- **Frontend:** Next.js (App Router), configurado como PWA instalável (manifest + ícone + modo standalone), mobile-first, com caminho de migração futura para app nativo.
- **Dados/Auth:** Supabase (Postgres + Auth + Row Level Security por usuária).
- **Hospedagem:** Vercel.
- **Push:** Web Push API via service worker.

## 12. Métricas de sucesso e instrumentação do beta (20-50 usuárias)

- Check-in completo, prática completa, sessão registrada (sensação antes/depois).
- Sequência de dias consecutivos (streak) e retenção — indicador principal: % de usuárias com 4+ de 7 dias completos na primeira semana, e uso contínuo nas semanas seguintes.
- Resposta à tela de intenção de pagamento (plano/preço hipotético escolhido).
- Feedback qualitativo (pesquisa curta in-app ou entrevista) sobre utilidade, segurança e facilidade de uso.
- Contagem de vezes que o sinal de segurança foi acionado (apenas de forma agregada, sem identificar quem).

O MVP é considerado promissor se houver uso recorrente, relatos claros de valor, interesse real em assinar, e nenhum efeito negativo ou problema de segurança relatado.

## 13. Riscos e dependências

- **Conteúdo clínico depende da disponibilidade da psicóloga parceira** para revisar práticas, regras de recomendação e textos de segurança antes do lançamento do beta.
- **Enquadramento LGPD** (agente de pequeno porte) precisa de verificação antes do lançamento público mais amplo, mesmo que não bloqueie o beta fechado.
- **Suporte a push no iOS** é limitado a instalação na tela inicial (iOS 16.4+); parte das usuárias beta pode não receber notificações e depender só do lembrete visual in-app.

## 14. Próximos passos

Com esta spec aprovada, o próximo passo é criar um plano de implementação detalhado (via skill `writing-plans`) cobrindo: setup do projeto (Next.js + Supabase + Vercel + PWA), modelo de dados, fluxo de check-in e recomendação, tela de sinal de segurança, telas de prática e progresso, autenticação e RLS, notificações push, tela de intenção de pagamento, e instrumentação de métricas do beta.
