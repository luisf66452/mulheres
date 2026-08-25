-- 20260825000730_recursos_seguranca_verificacao.sql
-- Colunas de verificação de fonte para public.recursos_seguranca (seção 7 do
-- design "Evolução da Rose Fase 2" — espaço "Preciso de ajuda agora"). Um
-- recurso só deve ser exibido como "confirmado" em produção quando `fonte` e
-- `verificado_em` estiverem preenchidos com uma fonte oficial verificada —
-- essa verificação é feita na fase de implementação da seção 7 (fora deste
-- plano), pesquisando fontes oficiais de governo/saúde de PT e BR.
-- Contatos ainda não verificáveis nesta fase permanecem na tabela para
-- referência/revisão futura, mas a query de exibição (aplicação, seção 7)
-- filtra por `fonte is not null and verificado_em is not null` — por isso
-- as colunas são nullable, não not null.
alter table public.recursos_seguranca
  add column if not exists fonte text,
  add column if not exists verificado_em date;

comment on column public.recursos_seguranca.fonte is
  'Nome da fonte oficial (ex.: "Ministério da Saúde", "CVV") que confirma este contato. Nulo = ainda não verificado, não deve ser exibido como recurso confirmado.';

comment on column public.recursos_seguranca.verificado_em is
  'Data em que a fonte foi conferida. Nulo = ainda não verificado.';

-- RLS e GRANT de public.recursos_seguranca (0001_init.sql) preservados sem
-- mudança: "qualquer usuaria autenticada le recursos de seguranca" continua
-- valendo para a linha inteira, incluindo as novas colunas.

notify pgrst, 'reload schema';
