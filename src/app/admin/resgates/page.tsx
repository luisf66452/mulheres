import Link from 'next/link';
import { exigirAdmin } from '@/lib/admin/auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { RECOMPENSAS } from '@/lib/clube-rose/recompensas';
import LinhaResgate from './LinhaResgate';
import type { StatusResgateRecompensa } from '@/lib/supabase/types';

const STATUS_FILTRAVEIS: StatusResgateRecompensa[] = [
  'solicitado',
  'em_analise',
  'aprovado',
  'entregue',
  'recusado',
  'cancelado',
];

const ROTULOS_STATUS: Record<StatusResgateRecompensa, string> = {
  solicitado: 'Solicitado',
  em_analise: 'Em análise',
  aprovado: 'Aprovado',
  entregue: 'Entregue',
  recusado: 'Recusado',
  cancelado: 'Cancelado',
};

export default async function AdminResgatesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await exigirAdmin();
  const { status } = await searchParams;
  const filtro: StatusResgateRecompensa = STATUS_FILTRAVEIS.includes(status as StatusResgateRecompensa)
    ? (status as StatusResgateRecompensa)
    : 'solicitado';

  const adminClient = createSupabaseAdminClient();
  if (!adminClient) {
    return <p className="text-alerta">Erro interno: cliente administrativo indisponível.</p>;
  }

  const { data: resgates, error } = await adminClient
    .from('resgates_recompensas')
    .select('id, usuaria_id, recompensa_chave, status, observacao_admin, criado_em, revisado_em')
    .eq('status', filtro)
    .order('criado_em', { ascending: true });

  if (error) {
    return <p className="text-alerta">Não foi possível carregar os resgates agora.</p>;
  }

  const usuariaIds = Array.from(new Set((resgates ?? []).map((r) => r.usuaria_id)));
  const emailPorUsuaria = new Map<string, string>();
  await Promise.all(
    usuariaIds.map(async (id) => {
      const { data } = await adminClient.auth.admin.getUserById(id);
      if (data.user?.email) emailPorUsuaria.set(id, data.user.email);
    })
  );

  const nomePorChave = new Map(RECOMPENSAS.map((r) => [r.chave, r.nome]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-texto">Resgates de recompensas</h1>
        <p className="text-sm text-texto-suave">
          Nenhuma recompensa é entregue automaticamente — todo pedido passa por aqui antes.
        </p>
      </div>

      <nav className="flex flex-wrap gap-2">
        {STATUS_FILTRAVEIS.map((s) => (
          <Link
            key={s}
            href={`/admin/resgates?status=${s}`}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              filtro === s ? 'border-acao bg-acao text-white' : 'border-borda text-texto-suave hover:bg-superficie'
            }`}
          >
            {ROTULOS_STATUS[s]}
          </Link>
        ))}
      </nav>

      {(resgates ?? []).length === 0 ? (
        <p className="text-sm text-texto-suave">Nenhum pedido com status &quot;{ROTULOS_STATUS[filtro]}&quot;.</p>
      ) : (
        <ul className="space-y-3">
          {(resgates ?? []).map((resgate) => (
            <li key={resgate.id} className="space-y-3 rounded-2xl border border-borda bg-superficie p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-display text-base text-texto">
                    {nomePorChave.get(resgate.recompensa_chave) ?? resgate.recompensa_chave}
                  </p>
                  <p className="text-sm text-texto-suave">
                    {emailPorUsuaria.get(resgate.usuaria_id) ?? resgate.usuaria_id}
                  </p>
                  <p className="text-xs text-texto-suave">
                    Solicitado em {new Date(resgate.criado_em).toLocaleString('pt-BR')}
                  </p>
                  {resgate.observacao_admin && (
                    <p className="mt-1 text-xs text-texto-suave">Observação: {resgate.observacao_admin}</p>
                  )}
                </div>
              </div>
              <LinhaResgate resgateId={resgate.id} statusAtual={resgate.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
