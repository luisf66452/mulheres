-- 0012_perfis_trava_colunas_sensiveis.sql
-- Achado crítico da auditoria de segurança do Clube Rose (2026-08-15): o GRANT
-- original em 0001_init.sql ("grant select, update on public.perfis to
-- authenticated") libera UPDATE na tabela inteira. A RLS policy "usuaria
-- atualiza proprio perfil" só restringe QUAL LINHA (auth.uid() = id), não quais
-- colunas — então qualquer usuária autenticada podia rodar
-- `supabase.from('perfis').update({ plano: 'premium' }).eq('id', meuId)`
-- diretamente do navegador e se autopromover a Pro, sem pagar, derrubando o
-- gate de recompensas exclusivas (src/app/clube-rose/actions.ts confia em
-- perfis.plano). Nenhum código legítimo escreve em `plano` hoje (não há
-- integração de pagamento real ainda), então essa coluna deve ficar travada
-- para o client até existir um caminho de escrita via service role (webhook
-- do Stripe, Fase 4).
--
-- Fix: revoga o UPDATE amplo e concede de novo só nas colunas que o código do
-- app legitimamente escreve como o próprio usuário (perfil/editar, onboarding,
-- settings). `plano`, `pais`, `criado_em` e `id` ficam de fora — só a service
-- role (que ignora GRANT/RLS) pode alterá-las.

revoke update on public.perfis from authenticated;

grant update (
  nome,
  frase_pessoal,
  faixa_etaria,
  fuso_horario,
  idioma,
  foto_url,
  horario_preferido_notificacao,
  consentimento_dados_sensiveis_em
) on public.perfis to authenticated;

-- Defesa em profundidade: a policy original só tinha `using`, sem `with check`.
-- Para UPDATE, `using` sozinho restringe quais linhas existentes podem ser
-- alvo, mas sem `with check` o Postgres reaplica o mesmo `using` como check
-- implícito — nesse caso já era equivalente. Tornamos explícito mesmo assim,
-- para deixar claro que a linha resultante também precisa pertencer à usuária
-- (relevante se o filtro de `using` mudar no futuro).
drop policy "usuaria atualiza proprio perfil" on public.perfis;

create policy "usuaria atualiza proprio perfil"
  on public.perfis for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
