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
