import { createSupabaseServerClient } from '@/lib/supabase/server';
import AtivarJornadaButton from './AtivarJornadaButton';

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
    <main className="mx-auto max-w-md space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Jornadas</h1>
      {(jornadas ?? []).map((jornada) => {
        const progresso = progressoPorJornada.get(jornada.id);
        return (
          <div key={jornada.id} className="space-y-2 rounded border p-4">
            <h2 className="text-xl font-semibold">{jornada.titulo}</h2>
            <p>{jornada.descricao}</p>
            <p className="text-sm text-gray-600">
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
          </div>
        );
      })}
    </main>
  );
}
