import { createSupabaseServerClient } from '@/lib/supabase/server';
import AtivarJornadaButton from './AtivarJornadaButton';
import Cartao from '@/app/components/Cartao';
import BarraProgressoJornada from '@/app/components/BarraProgressoJornada';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';

export default async function JornadasPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: jornadas } = await supabase
    .from('jornadas')
    .select('*')
    .eq('status', 'publicada');

  const { data: progressos } = await supabase
    .from('jornadas_usuarias')
    .select('*')
    .eq('usuaria_id', user!.id);

  const progressoPorJornada = new Map((progressos ?? []).map((p) => [p.jornada_id, p]));

  return (
    <main className="mx-auto max-w-md space-y-6 p-6 pb-24 md:pb-6">
      <h1 className="font-display text-2xl text-texto">Jornadas</h1>
      {(jornadas ?? []).map((jornada) => {
        const progresso = progressoPorJornada.get(jornada.id);
        return (
          <Cartao key={jornada.id} className="space-y-3">
            <h2 className="font-display text-xl text-texto">{jornada.titulo}</h2>
            <p className="text-texto">{jornada.descricao}</p>
            {progresso && (
              <BarraProgressoJornada
                diasCompletados={progresso.dias_completados}
                duracaoDias={jornada.duracao_dias}
              />
            )}
            <p className="text-sm text-texto-suave">
              {progresso?.status === 'em_andamento' &&
                `Em andamento — dia ${progresso.dias_completados} de ${jornada.duracao_dias}`}
              {progresso?.status === 'pausada' &&
                `Pausada — dia ${progresso.dias_completados} de ${jornada.duracao_dias}`}
              {progresso?.status === 'concluida' && 'Concluída'}
              {!progresso && `${jornada.duracao_dias} dias`}
            </p>
            <AtivarJornadaButton
              jornadaId={jornada.id}
              jaAtiva={progresso?.status === 'em_andamento' || progresso?.status === 'concluida'}
              label={progresso ? 'Continuar' : 'Começar'}
            />
          </Cartao>
        );
      })}
      <NavegacaoInferior />
    </main>
  );
}
