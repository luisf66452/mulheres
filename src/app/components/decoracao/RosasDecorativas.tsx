// Rosas em SVG (não dependem de imagem carregando) para preencher os cantos
// que a IlustracaoBotanica não cobre (superior-esquerdo e inferior-direito) e
// reforçar a marca — a arte em PNG existente é um aquarela bem clarinho e
// passa despercebida à primeira vista, então essas rosas dão um acento mais
// visível sem competir com o texto.
// `tamanho="compacto"` reduz as dimensões para telas com mais conteúdo (ex.:
// o quiz em /comecar).
function Rosa({ className, girar = 0 }: { className?: string; girar?: number }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <g fill="var(--color-acao)" transform={`rotate(${girar} 50 50)`}>
        {[0, 60, 120, 180, 240, 300].map((angulo) => (
          <ellipse key={angulo} cx="50" cy="34" rx="15" ry="22" transform={`rotate(${angulo} 50 50)`} />
        ))}
        <circle cx="50" cy="50" r="9" />
      </g>
    </svg>
  );
}

export default function RosasDecorativas({ tamanho = 'padrao' }: { tamanho?: 'padrao' | 'compacto' }) {
  const compacto = tamanho === 'compacto';

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <Rosa
        className={`absolute -top-6 -left-8 opacity-[0.14] ${compacto ? 'w-16 sm:w-20' : 'w-28 sm:w-36'}`}
        girar={-12}
      />
      <Rosa
        className={`absolute top-1/4 -left-10 opacity-[0.10] ${compacto ? 'w-10 sm:w-12' : 'w-16 sm:w-20'}`}
        girar={20}
      />
      <Rosa
        className={`absolute -bottom-8 -right-10 opacity-[0.14] ${compacto ? 'w-20 sm:w-24' : 'w-32 sm:w-40'}`}
        girar={8}
      />
      <Rosa
        className={`absolute bottom-1/4 -right-6 opacity-[0.10] ${compacto ? 'w-10 sm:w-12' : 'w-16 sm:w-20'}`}
        girar={-25}
      />
    </div>
  );
}
