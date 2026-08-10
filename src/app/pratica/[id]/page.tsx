import { createSupabaseServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import PraticaClient from './PraticaClient';

export default async function PraticaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ checkin?: string }>;
}) {
  const { id } = await params;
  const { checkin } = await searchParams;
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

  return <PraticaClient pratica={pratica} checkinId={checkin} />;
}
