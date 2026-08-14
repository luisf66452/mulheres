import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import CabecalhoJornadas from '@/app/components/jornadas/CabecalhoJornadas';
import CartaoJornada from '@/app/components/jornadas/CartaoJornada';
import { listarJornadas } from '@/lib/jornadas-conteudo/dados';

export default function JornadasPage() {
  const jornadas = listarJornadas();

  return (
    <main className="mx-auto max-w-md space-y-6 px-4 pt-6 pb-24 md:pb-8">
      <CabecalhoJornadas />

      <div className="space-y-4">
        {jornadas.map((jornada) => (
          <CartaoJornada key={jornada.id} jornada={jornada} />
        ))}
      </div>

      <NavegacaoInferior />
    </main>
  );
}
