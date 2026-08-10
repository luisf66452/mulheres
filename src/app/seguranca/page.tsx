import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function SegurancaPage() {
  const supabase = await createSupabaseServerClient();
  const { data: recursos } = await supabase
    .from('recursos_seguranca')
    .select('*')
    .eq('pais', 'BR')
    .order('ordem');

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      {(recursos ?? []).map((recurso) => (
        <div key={recurso.id} className="space-y-1">
          <h2 className="text-xl font-semibold">{recurso.titulo}</h2>
          <p>{recurso.corpo}</p>
        </div>
      ))}

      <a href="/checkin" className="block w-full rounded border p-3 text-center">
        Voltar
      </a>
    </main>
  );
}
