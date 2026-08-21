import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import CabecalhoJornadas from '@/app/components/jornadas/CabecalhoJornadas';
import CartaoJornada from '@/app/components/jornadas/CartaoJornada';
import { listarJornadas } from '@/lib/jornadas-conteudo/dados';
import {
  calcularEstadosSessoes,
  calcularPercentualConcluido,
  carregarProgressoJornada,
} from '@/lib/jornadas-conteudo/progresso';

export default async function JornadasPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const jornadas = listarJornadas();

  const jornadasComPercentual = await Promise.all(
    jornadas.map(async (jornada) => {
      const progresso = await carregarProgressoJornada(supabase, user.id, jornada.slug);
      const estados = calcularEstadosSessoes(jornada, progresso);
      const percentualConcluido = calcularPercentualConcluido(jornada, estados);
      return { jornada, percentualConcluido };
    })
  );

  return (
    <main className="mx-auto max-w-md space-y-6 px-4 pt-6 pb-24 md:pb-8">
      <CabecalhoJornadas />

      <div className="space-y-4">
        {jornadasComPercentual.map(({ jornada, percentualConcluido }) => (
          <CartaoJornada key={jornada.id} jornada={jornada} percentualConcluido={percentualConcluido} />
        ))}
      </div>

      <NavegacaoInferior />
    </main>
  );
}
