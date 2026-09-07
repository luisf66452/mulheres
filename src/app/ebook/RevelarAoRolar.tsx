'use client';

import { useEffect, useRef, useState } from 'react';

// Anima cada seção ao entrar na viewport (reaproveita a mesma animação
// eb-drift-up do hero). Renderiza sempre visível por padrão e só ativa a
// animação de entrada quando o IntersectionObserver dispara — assim, se o JS
// falhar ou demorar, o conteúdo nunca fica preso em opacity:0. O timeout de
// segurança cobre o caso raro do observer nunca disparar.
export default function RevelarAoRolar({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pronta, setPronta] = useState(false);
  const [animar, setAnimar] = useState(false);

  useEffect(() => {
    const elemento = ref.current;
    if (!elemento) return;

    const seguranca = setTimeout(() => {
      setAnimar(true);
      setPronta(true);
    }, 1200);

    const observer = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setAnimar(true);
          setPronta(true);
          observer.disconnect();
          clearTimeout(seguranca);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -80px 0px' },
    );
    observer.observe(elemento);

    return () => {
      observer.disconnect();
      clearTimeout(seguranca);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} ${animar ? 'ebook-anim' : pronta ? '' : 'opacity-0'}`}
    >
      {children}
    </div>
  );
}
