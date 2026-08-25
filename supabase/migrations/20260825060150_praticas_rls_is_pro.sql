-- 20260825060150_praticas_rls_is_pro.sql
-- Achado crítico da revisão final da branch "Evolução da Rose Fase 2": a
-- policy de SELECT original em public.praticas (0001_init.sql) libera a
-- linha inteira — incluindo `conteudo`, `audio_url`, `transcricao` e
-- `duracao_segundos` — para QUALQUER usuária autenticada, sem checar
-- `is_pro` (coluna adicionada por 20260825000415_praticas_audio.sql). Uma
-- usuária free conseguiria ler o conteúdo completo de uma prática Pro direto
-- via PostgREST (`select conteudo from praticas where is_pro = true`),
-- contornando o gate server-side de /praticas/[id]/page.tsx.
--
-- Correção preventiva: ainda não existe nenhuma prática is_pro = true
-- publicada em produção — não há vazamento ativo a corrigir.
--
-- Postgres RLS é por LINHA, não por coluna condicionada a um valor como
-- "plano" — então a estratégia é:
--   1) Trocar a policy de SELECT em praticas para exigir plano premium
--      quando is_pro = true (bloqueia a linha inteira para free).
--   2) Expor os metadados sempre seguros (título, categoria, is_pro, etc. —
--      nunca conteudo/audio_url/transcricao/duracao_segundos) através de uma
--      VIEW nova, praticas_catalogo, legível por qualquer autenticada
--      independente do plano — título/categoria de conteúdo Pro pode ser
--      mostrado como teaser (ex.: card "Conteúdo Pro" em /favoritos).

-- 1) RLS: substitui a policy de SELECT em public.praticas.
drop policy if exists "qualquer usuaria autenticada le praticas publicadas" on public.praticas;

create policy "qualquer usuaria autenticada le praticas publicadas nao pro ou premium"
  on public.praticas for select
  using (
    (select auth.role()) = 'authenticated'
    and status = 'publicada'
    and (
      not is_pro
      or exists (
        select 1
        from public.perfis
        where id = (select auth.uid())
          and plano = 'premium'
      )
    )
  );

-- 2) View de catálogo: só metadado, nunca conteúdo protegido. Idempotente.
create or replace view public.praticas_catalogo as
select
  id,
  categoria,
  tipo,
  titulo,
  status,
  audio_status,
  is_pro,
  criado_em
from public.praticas
where status = 'publicada';

-- De propósito SEM security_invoker: esta view roda com os privilégios do
-- dono (a migração), que não está sujeito à RLS de public.praticas — então
-- praticas_catalogo enxerga todas as linhas publicadas, inclusive is_pro =
-- true, e devolve metadado (nunca conteúdo) pra qualquer autenticada
-- independente do plano. Isso é o comportamento desejado (teaser), não um
-- contorno acidental da policy do passo 1. O GRANT abaixo é o único controle
-- de acesso da view — sem GRANT a anon, só authenticated.
grant select on public.praticas_catalogo to authenticated;

notify pgrst, 'reload schema';
