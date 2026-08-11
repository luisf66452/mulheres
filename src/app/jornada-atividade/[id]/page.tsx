import { createSupabaseServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import JornadaAtividadeClient from './JornadaAtividadeClient';

export default async function JornadaAtividadePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ checkin?: string }>;
}) {
  const { id } = await params;
  const { checkin } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: atividade } = await supabase
    .from('jornada_atividades')
    .select('*')
    .eq('id', id)
    .single();

  if (!atividade || !checkin) {
    notFound();
  }

  return <JornadaAtividadeClient atividade={atividade} checkinId={checkin} />;
}
