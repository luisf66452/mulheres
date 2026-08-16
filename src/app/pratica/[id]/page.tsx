import { createSupabaseServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import PraticaClient from './PraticaClient';
import NotificacaoPetalas from '@/app/components/clube-rose/NotificacaoPetalas';
import NotificacaoLimitePetalas from '@/app/components/clube-rose/NotificacaoLimitePetalas';

export default async function PraticaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ checkin?: string; petalas?: string; limitePetalas?: string }>;
}) {
  const { id } = await params;
  const { checkin, petalas, limitePetalas } = await searchParams;
  const petalasGanhas = petalas ? Number.parseInt(petalas, 10) : 0;
  const mostrarLimiteAtingido = limitePetalas === '1';
  const supabase = await createSupabaseServerClient();

  const { data: pratica } = await supabase
    .from('praticas')
    .select('*')
    .eq('id', id)
    .eq('status', 'publicada')
    .single();

  if (!pratica || !checkin) {
    notFound();
  }

  return (
    <>
      {mostrarLimiteAtingido ? (
        <NotificacaoLimitePetalas />
      ) : (
        petalasGanhas > 0 && <NotificacaoPetalas quantidade={petalasGanhas} />
      )}
      <PraticaClient pratica={pratica} checkinId={checkin} />
    </>
  );
}
