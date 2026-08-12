import Link from 'next/link';
import Cartao from '@/app/components/Cartao';

const NIVEIS: { valor: 1 | 2 | 3 | 4 | 5; rotulo: string; cor: string }[] = [
  { valor: 1, rotulo: 'Muito baixo', cor: 'var(--color-humor-1)' },
  { valor: 2, rotulo: 'Baixo', cor: 'var(--color-humor-2)' },
  { valor: 3, rotulo: 'Bem', cor: 'var(--color-humor-3)' },
  { valor: 4, rotulo: 'Alto', cor: 'var(--color-humor-4)' },
  { valor: 5, rotulo: 'Muito alto', cor: 'var(--color-humor-5)' },
];

export default function SeletorHumor() {
  return (
    <Cartao className="space-y-4 text-center">
      <p className="font-display text-lg text-texto">Como você está se sentindo hoje?</p>
      <div className="flex justify-between gap-1">
        {NIVEIS.map((nivel) => (
          <Link
            key={nivel.valor}
            href={`/checkin?humor=${nivel.valor}`}
            className="flex flex-1 flex-col items-center gap-1.5 transition-transform hover:-translate-y-0.5"
          >
            <span
              aria-hidden="true"
              className="block h-10 w-10 rounded-full"
              style={{ backgroundColor: nivel.cor }}
            />
            <span className="text-[11px] leading-tight text-texto-suave">{nivel.rotulo}</span>
          </Link>
        ))}
      </div>
    </Cartao>
  );
}
