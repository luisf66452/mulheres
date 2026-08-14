import { createSupabaseServerClient } from '@/lib/supabase/server';
import NotificacaoPetalas from '@/app/components/clube-rose/NotificacaoPetalas';

export default async function SegurancaPage({
  searchParams,
}: {
  searchParams: Promise<{ petalas?: string }>;
}) {
  const { petalas } = await searchParams;
  const petalasGanhas = petalas ? Number.parseInt(petalas, 10) : 0;
  const supabase = await createSupabaseServerClient();
  const { data: recursos } = await supabase
    .from('recursos_seguranca')
    .select('*')
    .eq('pais', 'BR')
    .order('ordem');

  return (
    <>
      {petalasGanhas > 0 && <NotificacaoPetalas quantidade={petalasGanhas} />}
      <main className="mx-auto max-w-md space-y-6 p-6">
        {(recursos ?? []).map((recurso) => (
          <div key={recurso.id} className="space-y-1 border-l-4 border-alerta pl-4">
            <h2 className="font-display text-xl text-texto">{recurso.titulo}</h2>
            <p className="text-texto">{recurso.corpo}</p>
          </div>
        ))}

        <a
          href="/checkin"
          className="block w-full rounded-2xl border border-borda p-3 text-center font-medium text-texto-suave transition-colors hover:bg-superficie"
        >
          Voltar
        </a>
      </main>
    </>
  );
}
