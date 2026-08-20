-- 0026_viagem_surpresa_rose.sql
-- Renumerada de 0023 para 0026: a branch master já tinha ocupado 0023
-- (resgates_recompensas_revisado_por_set_null) e 0024
-- (handle_new_user_search_path), ambas já aplicadas em produção — para
-- evitar colisão de numeração quando as branches convergirem, esta e as
-- duas migrations seguintes desta rodada passam a usar 0026-0028.
-- Atualiza o conteúdo editorial da recompensa 'presente_especial_rose' para a
-- nova apresentação "Viagem surpresa Rose" — não cria nem apaga linha, só
-- atualiza os campos de apresentação de um registro já existente (migração
-- 0014). Idempotente: pode rodar de novo sem efeito colateral, porque sempre
-- escreve o mesmo valor final em vez de incrementar/acumular algo.
--
-- Deliberadamente NÃO muda custo, estoque, requer_premium, tem_valor_financeiro
-- nem status — tudo isso continua exigindo autorização explícita separada.
-- status continua 'futura': não existe regulamento, orçamento, disponibilidade
-- nem validação jurídica/operacional para permitir resgate ainda.
update recompensas_catalogo
set
  nome = 'Viagem surpresa Rose',
  descricao = 'Uma viagem para um destino surpresa escolhido pela equipe Rose. Datas, condições, elegibilidade e detalhes serão divulgados antes da campanha.',
  mensagem = 'O destino é surpresa. A experiência será escolhida com carinho pela equipe Rose.',
  tipo = 'experiencia',
  atualizada_em = now()
where chave = 'presente_especial_rose';
