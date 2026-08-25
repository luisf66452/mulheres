import Link from 'next/link';
import type { ItemDistribuicao, ResumoSemanal } from '@/lib/progress/resumoSemanal';

const AVISO_LEGAL =
  'Este resumo descreve apenas o que você registrou e não representa diagnóstico ou avaliação clínica.';

function ListaDistribuicao({ titulo, itens }: { titulo: string; itens: ItemDistribuicao[] }) {
  const itensComRegistro = itens.filter((item) => item.quantidade > 0);
  if (itensComRegistro.length === 0) {
    return null;
  }
  return (
    <div>
      <p className="font-medium text-texto">{titulo}</p>
      <ul className="mt-1 space-y-0.5 text-texto-suave">
        {itensComRegistro.map((item) => (
          <li key={item.rotulo}>
            {item.rotulo}: {item.quantidade}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ResumoSemanalPessoal({
  resumo,
  ehPremium,
}: {
  resumo: ResumoSemanal;
  ehPremium: boolean;
}) {
  return (
    <div className="space-y-3 rounded-2xl bg-superficie p-4 shadow-[0_2px_8px_rgba(74,63,53,0.08)]">
      <h2 className="font-display text-lg text-texto">Seu resumo da semana</h2>
      <p className="text-xs text-texto-suave">{AVISO_LEGAL}</p>

      {!resumo.temRegistros ? (
        <p className="text-sm text-texto-suave">{resumo.mensagem}</p>
      ) : ehPremium ? (
        <div className="space-y-3 text-sm text-texto">
          <p>{resumo.mensagem}</p>
          <ListaDistribuicao titulo="Humor nos seus registros" itens={resumo.distribuicaoHumor} />
          <ListaDistribuicao titulo="Imagem corporal nos seus registros" itens={resumo.distribuicaoImagemCorporal} />
          <ListaDistribuicao titulo="Alimentação nos seus registros" itens={resumo.distribuicaoAlimentacao} />
        </div>
      ) : (
        <div className="space-y-2 text-sm text-texto">
          <p>Você fez check-in em {resumo.diasComCheckin} dos 7 dias desta semana, nos seus registros.</p>
          <p className="text-texto-suave">
            O resumo completo, com distribuição de humor, imagem corporal, alimentação e comparação com a
            semana anterior, é parte do Rose Pro.
          </p>
          <Link
            href="/premium"
            className="block w-full rounded-2xl border border-borda p-3 text-center font-medium text-texto-suave transition-colors hover:bg-fundo"
          >
            Conhecer o Rose Pro
          </Link>
        </div>
      )}
    </div>
  );
}
