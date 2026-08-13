import Link from 'next/link';
import type { Jornada, JornadaCorCartao } from '@/lib/jornadas-conteudo/tipos';
import { contarModulos, contarSessoes } from '@/lib/jornadas-conteudo/dados';
import { MAPA_ILUSTRACOES_POR_SLUG } from './ilustracoes';
import BarraProgressoPercentual from './BarraProgressoPercentual';

const FUNDOS: Record<JornadaCorCartao, string> = {
  pessego: 'bg-pessego-suave',
  'creme-rosado': 'bg-creme-rosado',
  lilas: 'bg-lilas-suave',
  salvia: 'bg-salvia-suave',
};

export default function CartaoJornada({ jornada }: { jornada: Jornada }) {
  const Ilustracao = MAPA_ILUSTRACOES_POR_SLUG[jornada.slug];
  const modulos = contarModulos(jornada);
  const sessoes = contarSessoes(jornada);

  return (
    <Link
      href={`/jornadas/${jornada.slug}`}
      aria-label={`${jornada.titulo}, ${modulos} módulos, ${sessoes} sessões, ${jornada.progressoPercentual}% concluído`}
      className={`relative block min-h-[180px] overflow-hidden rounded-3xl border border-borda/60 ${FUNDOS[jornada.corCartao]} p-5 shadow-[0_2px_8px_rgba(74,63,53,0.08)] transition-transform duration-200 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60 focus-visible:ring-offset-2 focus-visible:ring-offset-fundo`}
    >
      <div className="relative z-10 flex h-full flex-col justify-between gap-6 pr-[38%]">
        <div>
          <h2 className="font-display text-xl text-texto">{jornada.titulo}</h2>
          <p className="mt-1 text-sm text-texto-suave">
            {modulos} módulos • {sessoes} sessões
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BarraProgressoPercentual percentual={jornada.progressoPercentual} className="flex-1" />
          <span className="text-xs font-medium text-texto" aria-hidden="true">
            {jornada.progressoPercentual}%
          </span>
        </div>
      </div>
      {Ilustracao && (
        <Ilustracao className="pointer-events-none absolute inset-y-0 right-0 h-full w-[42%]" />
      )}
    </Link>
  );
}
