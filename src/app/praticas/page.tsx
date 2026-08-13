import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import CabecalhoPraticas from '@/app/components/praticas/CabecalhoPraticas';
import CartaoPraticaRapida from '@/app/components/praticas/CartaoPraticaRapida';
import { PRATICAS_RAPIDAS } from '@/lib/praticas-conteudo/dados';

export default function PraticasPage() {
  return (
    <main className="mx-auto max-w-md space-y-6 px-4 pt-6 pb-24 md:pb-8">
      <CabecalhoPraticas />
      <div className="space-y-2.5">
        {PRATICAS_RAPIDAS.map((pratica) => (
          <CartaoPraticaRapida key={pratica.id} pratica={pratica} />
        ))}
      </div>
      <NavegacaoInferior />
    </main>
  );
}
