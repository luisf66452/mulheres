-- Recursos de segurança para Portugal (público inicial de testes da Rose).
-- Números conferidos em fontes oficiais antes de usar:
--   - Linha Nacional de Prevenção do Suicídio (1411): SNS24
--     https://www.sns24.gov.pt/servico/linha-nacional-de-prevencao-do-suicidio/
--   - Emergência (112), SNS 24 (808 24 24 24), Linha de Apoio à Criança (116 111):
--     https://www.gov.pt/guias/contactos-de-emergencia-em-portugal
--
-- Mesmo padrão de supabase/seed.sql: linhas com `pais = 'BR'` continuam
-- existindo e não são alteradas por este arquivo — cada país tem seu próprio
-- conjunto de recursos, nunca misturados numa mesma apresentação.
insert into public.recursos_seguranca (pais, titulo, corpo, ordem) values
  ('PT', 'Não está sozinha',
   'O que você está sentindo importa. Isso não é uma emergência, mas merece atenção e cuidado.', 0),
  ('PT', 'Linha Nacional de Prevenção do Suicídio',
   'A Linha 1411 oferece apoio telefónico gratuito e confidencial, 24 horas por dia, para pensamentos suicidas ou comportamentos autolesivos, em articulação com o SNS 24. Ligue 1411.', 1),
  ('PT', 'SNS 24 — aconselhamento de saúde e psicológico',
   'O SNS 24 (808 24 24 24) presta aconselhamento clínico, incluindo apoio psicológico, 24 horas por dia. Não é um serviço de emergência, mas está disponível para conversar a qualquer hora.', 2),
  ('PT', 'Apoio a crianças e adolescentes',
   'A Linha de Apoio à Criança (116 111) é um serviço gratuito e permanente para crianças e adolescentes falarem sobre o que os preocupa.', 3),
  ('PT', 'Em caso de risco imediato',
   'Se você ou alguém perto de você está em risco imediato, ligue 112 (número europeu de emergência) ou procure o serviço de urgência mais próximo.', 4);
