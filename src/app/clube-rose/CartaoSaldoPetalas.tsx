import Cartao from '@/app/components/Cartao';
import IlustracaoFlorCabecalho from '@/app/components/jornadas/ilustracoes/IlustracaoFlorCabecalho';

export default function CartaoSaldoPetalas({ saldo }: { saldo: number }) {
  return (
    <Cartao className="relative overflow-hidden text-center">
      <IlustracaoFlorCabecalho className="pointer-events-none absolute -top-2 -right-2 h-16 w-16 opacity-80" />
      <p className="text-sm text-texto-suave">Seu saldo de Pétalas</p>
      <p className="font-display text-4xl text-acao">{saldo.toLocaleString('pt-BR')}</p>
      <p className="mx-auto mt-2 max-w-xs text-sm text-texto-suave">
        Cada pequena prática é uma forma de cuidar de você.
      </p>
      <a
        href="#maneiras-de-ganhar"
        className="mt-4 inline-block rounded-2xl border border-borda px-4 py-2 text-sm font-medium text-texto-suave transition-colors hover:bg-fundo"
      >
        Ver como ganhar
      </a>
    </Cartao>
  );
}
