import { exigirAdmin } from '@/lib/admin/auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import LinhaCatalogo from './LinhaCatalogo';

export default async function AdminRecompensasPage() {
  await exigirAdmin();

  const adminClient = createSupabaseAdminClient();
  if (!adminClient) {
    return <p className="text-alerta">Erro interno: cliente administrativo indisponível.</p>;
  }

  const { data: catalogo, error } = await adminClient
    .from('recompensas_catalogo')
    .select('chave, nome, custo, status, estoque, tem_valor_financeiro')
    .order('custo', { ascending: true });

  if (error) {
    return <p className="text-alerta">Não foi possível carregar o catálogo agora.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-texto">Catálogo de recompensas</h1>
        <p className="text-sm text-texto-suave">
          Recompensas marcadas como &quot;valor financeiro&quot; exigem revisão jurídica/fiscal antes de
          ficarem ativas.
        </p>
      </div>

      <ul className="space-y-3">
        {(catalogo ?? []).map((item) => (
          <LinhaCatalogo
            key={item.chave}
            chave={item.chave}
            nome={item.nome}
            custo={item.custo}
            status={item.status}
            estoque={item.estoque}
            temValorFinanceiro={item.tem_valor_financeiro}
          />
        ))}
      </ul>
    </div>
  );
}
