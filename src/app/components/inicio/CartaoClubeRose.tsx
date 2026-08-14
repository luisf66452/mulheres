import Link from 'next/link';
import Cartao from '@/app/components/Cartao';
import IlustracaoFlorCabecalho from '@/app/components/jornadas/ilustracoes/IlustracaoFlorCabecalho';

export default function CartaoClubeRose({ saldo }: { saldo: number }) {
  return (
    <Cartao className="relative overflow-hidden">
      <IlustracaoFlorCabecalho className="pointer-events-none absolute -top-2 -right-2 h-14 w-14 opacity-80" />
      <p className="text-sm text-texto-suave">Clube Rose</p>
      <p className="font-display text-2xl text-acao">{saldo.toLocaleString('pt-BR')} Pétalas</p>
      <p className="mt-1 max-w-[85%] text-sm text-texto-suave">
        Seu cuidado também pode florescer — acompanhe suas Pétalas e o que elas podem se tornar.
      </p>
      <Link
        href="/clube-rose"
        className="mt-3 inline-block rounded-2xl bg-acao px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-acao/90"
      >
        Conhecer o Clube Rose
      </Link>
    </Cartao>
  );
}
