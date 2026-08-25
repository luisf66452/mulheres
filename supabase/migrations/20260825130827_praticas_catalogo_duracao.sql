-- 20260825130827_praticas_catalogo_duracao.sql
-- Achado "Important" da revisão final da branch: buscarPraticasAudioPublicadas
-- (listagem de /praticas) consultava a tabela BASE public.praticas, cuja RLS
-- (ver migração 20260825060150_praticas_rls_is_pro.sql) nega a linha inteira
-- para usuária free quando is_pro = true. Resultado: nenhuma prática de
-- áudio Pro aparecia sequer como teaser na listagem — diferente do padrão já
-- usado em /favoritos e /praticas/[id], que leem de public.praticas_catalogo
-- (sempre legível, metadado seguro) justamente para mostrar título/duração
-- mesmo de conteúdo Pro.
--
-- Falta só `duracao_segundos` na view para a listagem poder formatar o rótulo
-- de duração do teaser sem tocar na tabela base. Esse campo é seguro de
-- expor (não é conteúdo em si, só um número) — continuam de fora
-- `conteudo`/`audio_url`/`transcricao`, que exigem o gate de plano.

create or replace view public.praticas_catalogo as
select
  id,
  categoria,
  tipo,
  titulo,
  status,
  audio_status,
  is_pro,
  criado_em,
  duracao_segundos
from public.praticas
where status = 'publicada';

-- Mesmo comentário da migração original: de propósito SEM security_invoker
-- (roda com privilégio do dono, não sujeito à RLS de public.praticas) e o
-- GRANT abaixo é o único controle de acesso da view.
grant select on public.praticas_catalogo to authenticated;

notify pgrst, 'reload schema';
