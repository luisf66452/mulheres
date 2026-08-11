import { createSupabaseServerClient } from '@/lib/supabase/server';
import { calcularProgresso7Dias } from '@/lib/progress/streak';
import ProgressoBlobs from '@/app/components/ProgressoBlobs';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';

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
    <main className="mx-auto max-w-md space-y-6 p-6 pb-24 md:pb-6">
      <h1 className="font-display text-2xl text-texto">Seu progresso</h1>

      <p className="text-texto">
        Você completou o ritual em <strong>{progresso.diasCompletos} de 7</strong> dias esta semana.
      </p>

      {progresso.diasConsecutivosAtuais > 0 && (
        <p className="text-texto">
          Você está em uma sequência de {progresso.diasConsecutivosAtuais} dia(s) seguidos. 🌱
        </p>
      )}

      <ProgressoBlobs
        dias={progresso.ultimos7Dias.map((dia) => ({ rotulo: dia.data, completo: dia.completou }))}
      />

      <p className="text-sm text-texto-suave">
        Este resumo é só um retrato acolhedor da sua semana — ele não tira conclusões sobre o motivo
        dos seus dias serem como foram.
      </p>

      <a
        href="/checkin"
        className="block w-full rounded-2xl border border-borda p-3 text-center font-medium text-texto-suave transition-colors hover:bg-superficie"
      >
        Voltar ao início
      </a>
      <NavegacaoInferior />
    </main>
  );
}
