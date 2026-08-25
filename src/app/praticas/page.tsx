import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import CabecalhoPraticas from '@/app/components/praticas/CabecalhoPraticas';
import CartaoItemCatalogo from '@/app/components/praticas/CartaoItemCatalogo';
import { PRATICAS_RAPIDAS } from '@/lib/praticas-conteudo/dados';
import { unificarCatalogo } from '@/lib/praticas-catalogo/unificar';
import { buscarPraticasAudioPublicadas } from '@/lib/praticas-catalogo/buscarPraticasAudioPublicadas';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function PraticasPage() {
  const supabase = await createSupabaseServerClient();
  const praticasAudio = await buscarPraticasAudioPublicadas(supabase);
  const itens = unificarCatalogo(PRATICAS_RAPIDAS, praticasAudio);

  return (
    <main className="mx-auto max-w-md space-y-6 px-4 pt-6 pb-[calc(6rem_+_env(safe-area-inset-bottom))] md:pb-8">
      <CabecalhoPraticas />
      <div className="space-y-2.5">
        {itens.map((item) => (
          <CartaoItemCatalogo key={item.id} item={item} />
        ))}
      </div>
      <NavegacaoInferior />
    </main>
  );
}
