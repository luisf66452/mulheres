import Link from 'next/link';
import Cartao from '@/app/components/Cartao';

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
    <Cartao className="space-y-3">
      <p className="font-display text-lg text-texto">Ritual de hoje</p>
      <p className="text-sm text-texto-suave">
        Reserve alguns minutos para o seu check-in diário — humor, corpo e alimentação.
      </p>
      <Link
        href="/checkin"
        className="block w-full rounded-2xl bg-acao p-3 text-center font-medium text-white transition-colors hover:bg-acao/90"
      >
        Começar agora
      </Link>
    </Cartao>
  );
}
