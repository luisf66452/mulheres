import IlustracaoFlorCabecalho from '@/app/components/jornadas/ilustracoes/IlustracaoFlorCabecalho';

export default function CabecalhoProgresso() {
  return (
    <header className="relative pr-14">
      <IlustracaoFlorCabecalho className="pointer-events-none absolute -top-1 right-0 h-14 w-14" />
      <h1 className="font-display text-3xl text-texto">Progresso</h1>
      <p className="mt-1 text-sm text-texto-suave">Acompanhe sua jornada de bem-estar</p>
    </header>
  );
}
