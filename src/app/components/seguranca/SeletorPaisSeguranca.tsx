'use client';

// Seleção manual de país para quem chega em /seguranca sem sessão (ou com
// sessão mas sem país confirmado ainda) — Seção 7 do design de evolução da
// Rose: "sem sessão, mostra seleção manual PT/BR e orientação genérica —
// nunca depende de login para exibir ajuda emergencial". Não persiste nada
// em nenhum perfil (pode nem existir uma conta); é só uma escolha de
// exibição para esta visita, feita via querystring.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PAISES_SUPORTADOS, NOME_PAIS, type PaisSuportado } from '@/lib/perfil/pais';

export default function SeletorPaisSeguranca() {
  const router = useRouter();
  const [paisEscolhido, setPaisEscolhido] = useState<PaisSuportado | null>(null);

  function escolher(pais: PaisSuportado) {
    setPaisEscolhido(pais);
    router.replace(`/seguranca?pais=${pais}`);
  }

  return (
    <div className="space-y-3 rounded-2xl border border-borda bg-superficie p-4">
      <p className="text-texto">
        Ainda não sabemos de qual país você está acessando. Escolha abaixo para ver os contatos de apoio
        certos para você.
      </p>
      <div className="flex flex-col gap-2">
        {PAISES_SUPORTADOS.map((pais) => (
          <button
            key={pais}
            type="button"
            onClick={() => escolher(pais)}
            aria-pressed={paisEscolhido === pais}
            className={`rounded-2xl border p-3 text-left font-medium transition-colors ${
              paisEscolhido === pais ? 'border-acao bg-acao/10 text-texto' : 'border-borda text-texto-suave'
            }`}
          >
            {NOME_PAIS[pais]}
          </button>
        ))}
      </div>
    </div>
  );
}
