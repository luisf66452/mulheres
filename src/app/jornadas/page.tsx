import { redirect } from 'next/navigation';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import CabecalhoJornadas from '@/app/components/jornadas/CabecalhoJornadas';
import CartaoJornada from '@/app/components/jornadas/CartaoJornada';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { listarJornadas, contarSessoes } from '@/lib/jornadas-conteudo/dados';
import { contarConcluidasPorJornada, calcularPercentualConcluido } from '@/lib/jornadas-conteudo/progresso';

export default async function JornadasPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const jornadas = listarJornadas();
  const concluidasPorJornada = await contarConcluidasPorJornada(supabase, user.id);

  return (
    <main className="mx-auto max-w-md space-y-6 px-4 pt-6 pb-24 md:pb-8">
      <CabecalhoJornadas />

      <div className="space-y-4">
        {jornadas.map((jornada) => {
          const total = contarSessoes(jornada);
          const concluidas = concluidasPorJornada.get(jornada.slug) ?? 0;
          return (
            <CartaoJornada
              key={jornada.id}
              jornada={jornada}
              progressoPercentual={calcularPercentualConcluido(concluidas, total)}
            />
          );
        })}
      </div>

      <NavegacaoInferior />
    </main>
  );
}
