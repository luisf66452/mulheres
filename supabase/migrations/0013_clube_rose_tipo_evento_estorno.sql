-- 0013_clube_rose_tipo_evento_estorno.sql
-- Adiciona o valor 'estorno_resgate' ao enum tipo_evento_petalas, usado pela
-- Fase 1 (parte 2) do Clube Rose: quando uma administradora recusa ou cancela
-- um pedido de resgate já debitado, o saldo é devolvido por uma NOVA
-- transação no livro-caixa (nunca apagando/editando a transação de débito
-- original), e essa transação precisa de um tipo_evento próprio.
--
-- Em migração separada de propósito: Postgres não permite usar um valor de
-- enum recém-adicionado na mesma transação/migração em que ele foi criado
-- (ALTER TYPE ... ADD VALUE só fica "pronto para uso" após o commit).

alter type tipo_evento_petalas add value if not exists 'estorno_resgate';
