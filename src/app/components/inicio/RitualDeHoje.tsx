import Link from 'next/link';
import Cartao from '@/app/components/Cartao';

function IconeCoracao() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M12 20.5s-7.5-4.6-10-9.3C.6 8.2 2 5 5.3 5c2 0 3.4 1.1 4.2 2.3C10.3 6.1 11.7 5 13.7 5 17 5 18.4 8.2 22 11.2c-2.5 4.7-10 9.3-10 9.3z" />
    </svg>
  );
}

export default function RitualDeHoje({ jaFezCheckinHoje }: { jaFezCheckinHoje: boolean }) {
  if (jaFezCheckinHoje) {
    return (
      <Cartao className="space-y-2 text-center">
        <p className="text-3xl">🌸</p>
        <p className="font-display text-lg text-texto">Ritual de hoje concluído</p>
        <p className="text-sm text-texto-suave">Volte amanhã para continuar sua sequência.</p>
      </Cartao>
    );
  }

  return (
    <Link
      href="/checkin"
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-acao p-4 text-base font-medium text-white transition-colors hover:bg-acao/90"
    >
      <IconeCoracao />
      Fazer check-in
    </Link>
  );
}
