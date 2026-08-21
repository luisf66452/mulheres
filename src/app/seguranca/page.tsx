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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let paisConfirmado: string | null = null;
  if (user) {
    const { data: perfil } = await supabase
      .from('perfis')
      .select('pais, pais_confirmado_em')
      .eq('id', user.id)
      .maybeSingle();
    // Só usamos o país se a própria usuária já o confirmou explicitamente —
    // um valor de `pais` não confirmado é só o default da conta, não uma
    // informação em que vale a pena basear contatos de emergência.
    paisConfirmado = perfil?.pais_confirmado_em ? perfil.pais : null;
  }

  // Recursos de segurança são específicos por país (números de telefone e
  // serviços diferentes) — nunca misturar recursos de países diferentes numa
  // mesma apresentação. Sem confirmação de país, não escolhemos nenhum país
  // por conta própria: mostramos uma orientação neutra em vez de arriscar
  // apresentar o contato errado como se fosse certo.
  let recursos: RecursoSeguranca[] | null = null;
  if (paisConfirmado) {
    const { data } = await supabase
      .from('recursos_seguranca')
      .select('*')
      .eq('pais', paisConfirmado)
      .order('ordem');
    recursos = data ?? null;
  }

  return (
    <>
      {petalasGanhas > 0 && <NotificacaoPetalas quantidade={petalasGanhas} />}
      <main className="mx-auto max-w-md space-y-6 p-6">
        {!paisConfirmado && (
          <div className="space-y-2 rounded-2xl border border-alerta bg-alerta/10 p-4">
            <p className="text-texto">
              Ainda não sabemos de qual país você está acessando, então não podemos garantir que os
              contatos abaixo sejam os certos para você. Se você ou alguém perto de você está em risco
              imediato, ligue para o número de emergência local do seu país agora.
            </p>
            <a href="/onboarding" className="inline-block font-medium text-acao underline underline-offset-2">
              Confirmar meu país
            </a>
          </div>
        )}

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
