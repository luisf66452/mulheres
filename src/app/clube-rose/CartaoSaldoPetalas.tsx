import Cartao from '@/app/components/Cartao';
import IlustracaoFlorCabecalho from '@/app/components/jornadas/ilustracoes/IlustracaoFlorCabecalho';
import { LIMITE_PETALAS_GRATUITO } from '@/lib/clube-rose/config';

export default function CartaoSaldoPetalas({ saldo, ehPremium }: { saldo: number; ehPremium: boolean }) {
  const noTetoGratuito = !ehPremium && saldo >= LIMITE_PETALAS_GRATUITO;

  return (
    <Cartao className="relative overflow-hidden text-center">
      <IlustracaoFlorCabecalho className="pointer-events-none absolute -top-2 -right-2 h-16 w-16 opacity-80" />
      <p className="text-sm text-texto-suave">Seu saldo de Pétalas</p>
      <p className="font-display text-4xl text-acao">{saldo.toLocaleString('pt-BR')}</p>
      <p className="mx-auto mt-2 max-w-xs text-sm text-texto-suave">
        Cada pequena prática é uma forma de cuidar de você.
      </p>
      {noTetoGratuito && (
        <p className="mx-auto mt-2 max-w-xs text-xs text-texto-suave">
          Você atingiu o limite gratuito de Pétalas.{' '}
          <a href="/premium" className="underline">
            Vire Premium
          </a>{' '}
          para continuar ganhando.
        </p>
      )}
      <a
        href="#maneiras-de-ganhar"
        className="mt-4 inline-block rounded-2xl border border-borda px-4 py-2 text-sm font-medium text-texto-suave transition-colors hover:bg-fundo"
      >
        Ver como ganhar
      </a>
    </Cartao>
  );
}
