import { createSupabaseServerClient } from '@/lib/supabase/server';
import { calcularProgresso7Dias } from '@/lib/progress/streak';

export default async function ProgressoPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: checkins } = await supabase
    .from('checkins')
    .select('data')
    .eq('usuaria_id', user!.id);

  const progresso = calcularProgresso7Dias((checkins ?? []).map((c) => c.data), new Date());

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Seu progresso</h1>

      <p>
        Você completou o ritual em <strong>{progresso.diasCompletos} de 7</strong> dias esta semana.
      </p>

      {progresso.diasConsecutivosAtuais > 0 && (
        <p>Você está em uma sequência de {progresso.diasConsecutivosAtuais} dia(s) seguidos. 🌱</p>
      )}

      <div className="flex gap-2">
        {progresso.ultimos7Dias.map((dia) => (
          <div
            key={dia.data}
            className={`h-10 w-10 rounded-full ${dia.completou ? 'bg-black' : 'bg-gray-200'}`}
            title={dia.data}
          />
        ))}
      </div>

      <p className="text-sm text-gray-600">
        Este resumo é só um retrato acolhedor da sua semana — ele não tira conclusões sobre o motivo
        dos seus dias serem como foram.
      </p>

      <a href="/checkin" className="block w-full rounded border p-3 text-center">
        Voltar ao início
      </a>
    </main>
  );
}
