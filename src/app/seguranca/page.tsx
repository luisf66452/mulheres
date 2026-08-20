import { createSupabaseServerClient } from '@/lib/supabase/server';
import NotificacaoPetalas from '@/app/components/clube-rose/NotificacaoPetalas';
import type { RecursoSeguranca } from '@/lib/supabase/types';

export default async function SegurancaPage({
  searchParams,
}: {
  searchParams: Promise<{ petalas?: string }>;
}) {
  const { petalas } = await searchParams;
  const petalasGanhas = petalas ? Number.parseInt(petalas, 10) : 0;
  const supabase = await createSupabaseServerClient();

  // Recursos de segurança são específicos por país (números de telefone e
  // serviços diferentes) — nunca misturar recursos de países diferentes numa
  // mesma apresentação. Usa o país do perfil da usuária; se ela não estiver
  // autenticada (ex.: link acessado fora de uma sessão) ou o país do perfil
  // não tiver recursos cadastrados ainda, cai para 'PT' (mercado do teste
  // inicial da Rose) e, por fim, para 'BR'.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let paisUsuaria: string | null = null;
  if (user) {
    const { data: perfil } = await supabase.from('perfis').select('pais').eq('id', user.id).maybeSingle();
    paisUsuaria = perfil?.pais ?? null;
  }

  const paisesParaTentar = [paisUsuaria, 'PT', 'BR'].filter(
    (pais, indice, lista): pais is string => pais !== null && lista.indexOf(pais) === indice
  );

  let recursos: RecursoSeguranca[] | null = null;
  for (const pais of paisesParaTentar) {
    const { data } = await supabase.from('recursos_seguranca').select('*').eq('pais', pais).order('ordem');
    if (data && data.length > 0) {
      recursos = data;
      break;
    }
  }

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
