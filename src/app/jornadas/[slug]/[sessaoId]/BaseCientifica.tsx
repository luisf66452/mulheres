import type { IdReferenciaCientifica } from '@/lib/jornadas-conteudo/referencias';
import { buscarReferencia } from '@/lib/jornadas-conteudo/referencias';

// Seção recolhível, fechada por padrão — a base científica fica disponível
// para quem quiser conferir, mas não compete visualmente com o conteúdo
// principal da sessão. <details>/<summary> nativo garante operação por
// teclado (Enter/Espaço no summary) sem JS adicional.
export default function BaseCientifica({ ids }: { ids: IdReferenciaCientifica[] }) {
  if (ids.length === 0) return null;

  const referencias = ids.map((id) => buscarReferencia(id));

  return (
    <details className="rounded-2xl border border-borda/70 bg-fundo p-4">
      <summary className="cursor-pointer text-sm font-medium text-texto-suave focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60 focus-visible:ring-offset-2">
        Base científica
      </summary>
      <div className="mt-3 space-y-4">
        {referencias.map((referencia) => (
          <div key={referencia.id} className="space-y-1 border-t border-borda/50 pt-3 first:border-t-0 first:pt-0">
            <p className="text-sm font-medium text-texto">{referencia.titulo}</p>
            <p className="text-xs text-texto-suave">
              {referencia.autoresOuInstituicao} · {referencia.tipoEstudo}
            </p>
            <p className="text-sm leading-relaxed text-texto-suave">{referencia.resumoSimples}</p>
            <p className="text-xs leading-relaxed text-texto-suave">
              <span className="font-medium">Limitações:</span> {referencia.limitacoes}
            </p>
            <a
              href={referencia.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs text-texto-suave underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60 focus-visible:ring-offset-2"
            >
              Ver fonte original ↗
            </a>
          </div>
        ))}
      </div>
    </details>
  );
}
