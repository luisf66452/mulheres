'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Botao from '@/app/components/Botao';
import SeloProvaSocial from '@/app/components/inicio/SeloProvaSocial';

const BENEFICIOS = [
  'Histórico completo de check-ins e progresso',
  'Insights semanais sobre seus padrões',
  'Biblioteca completa de práticas',
  'Todas as jornadas guiadas',
  'Recompensas exclusivas no Clube Rose',
];

export default function OfertaRosePro({ precoMensal = null }: { precoMensal?: string | null }) {
  const router = useRouter();
  const tituloRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const overflowAnterior = document.body.style.overflow;
    const fecharComEscape = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        router.replace('/', { scroll: false });
      }
    };

    document.body.style.overflow = 'hidden';
    tituloRef.current?.focus();
    document.addEventListener('keydown', fecharComEscape);

    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener('keydown', fecharComEscape);
    };
  }, [router]);

  function verPlanos() {
    router.replace('/perfil/assinatura');
  }

  function continuarGratis() {
    router.replace('/', { scroll: false });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-texto/45 p-4 backdrop-blur-[2px]">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="oferta-rose-pro-titulo"
        aria-describedby="oferta-rose-pro-descricao"
        className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-borda bg-superficie p-6 shadow-[0_18px_50px_rgba(69,60,66,0.24)]"
      >
        <div aria-hidden="true" className="absolute -top-14 -right-12 h-36 w-36 rounded-full bg-lilas-suave/70" />
        <div aria-hidden="true" className="absolute -bottom-16 -left-12 h-36 w-36 rounded-full bg-creme-rosado/65" />

        <div className="relative space-y-5">
          <span className="inline-flex rounded-full bg-acao/10 px-3 py-1 text-xs font-semibold tracking-wide text-acao uppercase">
            Rose Pro
          </span>

          <div className="space-y-2">
            <h1
              id="oferta-rose-pro-titulo"
              ref={tituloRef}
              tabIndex={-1}
              className="font-display text-2xl text-texto outline-none"
            >
              Quer viver a experiência completa da Rose?
            </h1>
            <p id="oferta-rose-pro-descricao" className="text-sm leading-relaxed text-texto-suave">
              Com o Rose Pro, você aprofunda seu cuidado com acesso a todos os conteúdos e acompanha
              sua evolução por completo.
            </p>
            {precoMensal && (
              <p className="text-sm font-semibold text-texto">A partir de {precoMensal}/mês</p>
            )}
          </div>

          <SeloProvaSocial />

          <ul className="space-y-2.5 text-sm text-texto">
            {BENEFICIOS.map((beneficio) => (
              <li key={beneficio} className="flex items-start gap-2.5">
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-salvia-suave text-xs text-texto"
                >
                  ✓
                </span>
                <span>{beneficio}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-2.5">
            <Botao type="button" onClick={verPlanos}>
              Ver planos do Rose Pro
            </Botao>
            <Botao type="button" variante="secundaria" onClick={continuarGratis}>
              Continuar gratuitamente
            </Botao>
          </div>

          <p className="text-center text-xs text-texto-suave">
            Ver os planos não gera nenhuma cobrança. Cancele quando quiser, sem multa.
          </p>
        </div>
      </section>
    </div>
  );
}
