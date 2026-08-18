'use client';

import type { IdReferenciaCientifica } from '@/lib/jornadas-conteudo/tipos';
import { listarReferencias } from '@/lib/jornadas-conteudo/referencias';

// Seção recolhível, fechada por padrão — a base científica está disponível
// para quem quiser ver, mas não compete com o conteúdo principal da sessão.
export default function BaseCientifica({ ids }: { ids: IdReferenciaCientifica[] }) {
  const referencias = listarReferencias(ids);

  if (referencias.length === 0) return null;

  return (
    <details className="rounded-2xl border border-borda/70 bg-fundo p-4">
      <summary className="cursor-pointer text-sm font-medium text-texto-suave">Base científica</summary>
      <div className="mt-3 space-y-3">
        {referencias.map((referencia) => (
          <div key={referencia.id} className="space-y-0.5">
            <p className="text-sm text-texto">{referencia.resumoSimples}</p>
            <a
              href={referencia.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-texto-suave underline underline-offset-2"
            >
              {referencia.titulo}
            </a>
          </div>
        ))}
      </div>
    </details>
  );
}
