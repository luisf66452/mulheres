-- 20260825131757_recursos_seguranca_fonte_verificado.sql
-- Seção 7 do design de evolução da Rose (2026-08-24-evolucao-rose-design.md):
-- o espaço "Preciso de ajuda agora" (/seguranca) passa a funcionar mesmo sem
-- sessão autenticada, e só exibe como "confirmado" um contato que tenha
-- fonte oficial verificada (fonte + verificado_em preenchidos).

alter table public.recursos_seguranca
  add column if not exists fonte text,
  add column if not exists verificado_em date;

-- recursos_seguranca continua com a policy/GRANT originais, restritos a
-- `authenticated` — o projeto nunca concede acesso a `anon` (regra
-- transversal do design). O requisito da Seção 7 ("/seguranca funciona
-- mesmo sem sessão") é resolvido na camada de aplicação, não no RLS: quando
-- não há usuária logada, src/app/seguranca/page.tsx lê esta tabela com o
-- admin client (service role, que ignora RLS — src/lib/supabase/admin.ts),
-- exatamente como outras rotas do projeto já fazem para operações que
-- precisam funcionar independente de sessão (ex.: src/app/api/perfil/excluir-conta/route.ts).
-- Nenhuma policy nem GRANT muda nesta migration.

-- Backfill dos contatos já confirmados em fontes oficiais (pesquisa
-- registrada em docs/superpowers/plans/2026-08-24-espaco-seguranca.md e em
-- docs/EVIDENCE.md). Update por pais+titulo é idempotente: rodar de novo só
-- reescreve os mesmos valores. As linhas introdutórias ("Não está
-- sozinha"/"Você não está sozinha") não fazem alegação factual verificável
-- e ficam de fora de propósito — continuam na tabela, só não aparecem na
-- consulta filtrada por fonte/verificado_em (ver src/app/seguranca/page.tsx).
update public.recursos_seguranca set
  fonte = 'SNS24 — Linha Nacional de Prevenção do Suicídio (https://www.sns24.gov.pt/servico/linha-nacional-de-prevencao-do-suicidio/)',
  verificado_em = '2026-08-24'
where pais = 'PT' and titulo = 'Linha Nacional de Prevenção do Suicídio';

update public.recursos_seguranca set
  fonte = 'Portal gov.pt — Contactos de emergência em Portugal (https://www.gov.pt/guias/contactos-de-emergencia-em-portugal)',
  verificado_em = '2026-08-24'
where pais = 'PT' and titulo = 'SNS 24 — aconselhamento de saúde e psicológico';

update public.recursos_seguranca set
  fonte = 'Portal gov.pt — Contactos de emergência em Portugal (https://www.gov.pt/guias/contactos-de-emergencia-em-portugal)',
  verificado_em = '2026-08-24'
where pais = 'PT' and titulo = 'Apoio a crianças e adolescentes';

update public.recursos_seguranca set
  fonte = 'Portal gov.pt — Contactos de emergência em Portugal (https://www.gov.pt/guias/contactos-de-emergencia-em-portugal)',
  verificado_em = '2026-08-24'
where pais = 'PT' and titulo = 'Em caso de risco imediato';

update public.recursos_seguranca set
  fonte = 'CVV — Centro de Valorização da Vida (https://cvv.org.br/ligue-188/)',
  verificado_em = '2026-08-24'
where pais = 'BR' and titulo = 'Apoio emocional gratuito';

update public.recursos_seguranca set
  fonte = 'Ministério da Saúde — SAMU 192 (https://www.gov.br/saude/pt-br/composicao/saes/samu-192)',
  verificado_em = '2026-08-24'
where pais = 'BR' and titulo = 'Em caso de risco imediato';

notify pgrst, 'reload schema';
