import IlustracaoFlorCabecalho from '@/app/components/jornadas/ilustracoes/IlustracaoFlorCabecalho';

export default function CabecalhoPraticas() {
  return (
    <header className="relative pr-14">
      <IlustracaoFlorCabecalho className="pointer-events-none absolute -top-1 right-0 h-14 w-14" />
      <h1 className="font-display text-3xl text-texto">Práticas</h1>
      <p className="mt-1 text-sm text-texto-suave">Atividades rápidas para cuidar de você hoje</p>
    </header>
  );
}
