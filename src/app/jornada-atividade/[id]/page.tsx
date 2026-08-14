import { createSupabaseServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import JornadaAtividadeClient from './JornadaAtividadeClient';
import NotificacaoPetalas from '@/app/components/clube-rose/NotificacaoPetalas';

export default async function JornadaAtividadePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ checkin?: string; petalas?: string }>;
}) {
  const { id } = await params;
  const { checkin, petalas } = await searchParams;
  const petalasGanhas = petalas ? Number.parseInt(petalas, 10) : 0;
  const supabase = await createSupabaseServerClient();

  const { data: atividade } = await supabase
    .from('jornada_atividades')
    .select('*')
    .eq('id', id)
    .single();

  if (!atividade || !checkin) {
    notFound();
  }

  return (
    <>
      {petalasGanhas > 0 && <NotificacaoPetalas quantidade={petalasGanhas} />}
      <JornadaAtividadeClient atividade={atividade} checkinId={checkin} />
    </>
  );
}
