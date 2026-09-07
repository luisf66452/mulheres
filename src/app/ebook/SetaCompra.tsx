// Seta grossa apontando pro botão de compra — reforça visualmente "clique
// aqui" nos CTAs principais, como em criativos de anúncio. Desenhada em duas
// camadas (halo branco por baixo, traço bordô por cima) como margem de
// segurança contra qualquer sobreposição com elementos da mesma cor.
// Puramente decorativa (aria-hidden); a animação de balanço é pausada via
// prefers-reduced-motion no <style> global de page.tsx.
export default function SetaCompra({ className }: { className?: string }) {
  const curva = 'M24 6 C 0 40, 10 66, 40 76';
  const ponta = '34,56 72,78 38,98';

  return (
    <svg
      viewBox="0 0 90 100"
      aria-hidden="true"
      overflow="visible"
      className={`ebook-seta overflow-visible ${className ?? ''}`}
    >
      <path d={curva} fill="none" stroke="white" strokeWidth="20" strokeLinecap="round" />
      <polygon points={ponta} fill="white" />

      <path d={curva} fill="none" stroke="var(--eb-bordo)" strokeWidth="13" strokeLinecap="round" />
      <polygon points={ponta} fill="var(--eb-bordo)" />
    </svg>
  );
}
