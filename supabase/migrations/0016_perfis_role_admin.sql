-- 0016_perfis_role_admin.sql
-- Papel administrativo mínimo, exigido pela Fase 1/Fase 7: revisar_resgate
-- (0017) e a futura área administrativa (Fase 7) precisam saber quem é
-- administradora. Modelado como uma coluna simples em vez de uma tabela de
-- papéis separada porque hoje só existe um papel elevado (admin); revisar se
-- o produto crescer para múltiplos papéis.
--
-- Importante: esta coluna fica DE FORA da lista de colunas liberadas para
-- UPDATE por 'authenticated' em 0012 (grant update (nome, frase_pessoal, ...)
-- on public.perfis to authenticated) — ou seja, nenhuma usuária consegue se
-- autopromover a admin através da aplicação. A única forma de conceder o
-- papel é a própria dona do projeto rodando um UPDATE direto no Supabase
-- Studio (ou um script com a service role key), nunca pelo client.

alter table perfis add column role text not null default 'usuaria' check (role in ('usuaria', 'admin'));
