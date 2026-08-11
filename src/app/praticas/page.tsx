import { createSupabaseServerClient } from '@/lib/supabase/server';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import CartaoPratica from './CartaoPratica';
import type { Pratica } from '@/lib/supabase/types';

function agruparPorCategoria(praticas: Pratica[]): [string, Pratica[]][] {
  const grupos = new Map<string, Pratica[]>();
  for (const pratica of praticas) {
    const grupo = grupos.get(pratica.categoria) ?? [];
    grupo.push(pratica);
    grupos.set(pratica.categoria, grupo);
  }
  return Array.from(grupos.entries());
}

export default async function PraticasPage() {
  const supabase = await createSupabaseServerClient();

  const { data: praticas, error } = await supabase
    .from('praticas')
    .select('*')
    .eq('status', 'publicada')
    .order('criado_em');

  return (
    <main className="mx-auto max-w-md space-y-6 p-6 pb-24 md:pb-6">
      <h1 className="font-display text-2xl text-texto">Biblioteca de práticas</h1>

      {error && (
        <p className="text-sm text-alerta">
          Não foi possível carregar as práticas agora. Tente novamente em instantes.
        </p>
      )}

      {!error && (praticas ?? []).length === 0 && (
        <p className="text-sm text-texto-suave">Ainda não há práticas publicadas.</p>
      )}

      {!error &&
        agruparPorCategoria(praticas ?? []).map(([categoria, itens]) => (
          <div key={categoria} className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-destaque">{categoria}</p>
            <div className="space-y-3">
              {itens.map((pratica) => (
                <CartaoPratica key={pratica.id} pratica={pratica} />
              ))}
            </div>
          </div>
        ))}

      <NavegacaoInferior />
    </main>
  );
}
