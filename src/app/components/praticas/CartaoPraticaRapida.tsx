import Link from 'next/link';
import type { PraticaRapida, CorCartaoPratica } from '@/lib/praticas-conteudo/tipos';
import IconeRespiracao from './icones/IconeRespiracao';
import IconeDiario from './icones/IconeDiario';
import IconeMeditacao from './icones/IconeMeditacao';
import IconeAutocompaixao from './icones/IconeAutocompaixao';
import IconeSeta from './icones/IconeSeta';

const ICONES: Record<PraticaRapida['categoria'], typeof IconeRespiracao> = {
  respiracao: IconeRespiracao,
  diario: IconeDiario,
  meditacao: IconeMeditacao,
  autocompaixao: IconeAutocompaixao,
};

const FUNDOS: Record<CorCartaoPratica, string> = {
  salvia: 'bg-salvia-suave',
  pessego: 'bg-pessego-suave',
  lilas: 'bg-lilas-suave',
  rosa: 'bg-creme-rosado',
};

const CIRCULOS: Record<CorCartaoPratica, string> = {
  salvia: 'bg-salvia',
  pessego: 'bg-pessego',
  lilas: 'bg-destaque',
  rosa: 'bg-acao',
};

const CAPSULAS: Record<CorCartaoPratica, string> = {
  salvia: 'bg-salvia/25',
  pessego: 'bg-pessego/25',
  lilas: 'bg-destaque/25',
  rosa: 'bg-acao/15',
};

export default function CartaoPraticaRapida({ pratica }: { pratica: PraticaRapida }) {
  const Icone = ICONES[pratica.categoria];
  return (
    <Link
      href={`/praticas/${pratica.id}`}
      aria-label={`${pratica.titulo}, ${pratica.duracaoLabel}. ${pratica.descricaoCurta}`}
      className={`flex items-center gap-3 rounded-[28px] border border-borda/50 ${FUNDOS[pratica.corCartao]} px-4 py-3.5 transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60 focus-visible:ring-offset-2 focus-visible:ring-offset-fundo`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${CIRCULOS[pratica.corCartao]}`}
      >
        <Icone className="text-fundo" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-base text-texto">{pratica.titulo}</span>
        <span className="line-clamp-2 text-sm leading-snug text-texto-suave">{pratica.descricaoCurta}</span>
      </span>
      <span
        className={`shrink-0 rounded-full ${CAPSULAS[pratica.corCartao]} px-2.5 py-1 text-xs font-medium text-texto`}
      >
        {pratica.duracaoLabel}
      </span>
      <IconeSeta className="shrink-0 text-texto-suave" />
    </Link>
  );
}
