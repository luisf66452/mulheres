// Fallback de streaming para `/praticas` e para as subpáginas de prática
// (respiracao, diario-guiado, meditacao, autocompaixao) que ainda não têm
// seu próprio `loading.tsx` — o Next usa este arquivo do segmento pai
// enquanto o `page.tsx` do segmento filho resolve. Por isso o esqueleto
// fica neutro (sem título fixo de nenhuma tela específica).
export default function CarregandoPraticas() {
  return (
    <main
      className="mx-auto max-w-md space-y-6 p-6 pb-[calc(6rem_+_env(safe-area-inset-bottom))] md:pb-6"
      aria-hidden="true"
    >
      <div className="h-8 w-32 animate-pulse rounded-full bg-borda/60" />
      <div className="space-y-2.5">
        {Array.from({ length: 4 }, (_, indice) => (
          <div key={indice} className="h-[76px] animate-pulse rounded-[28px] bg-borda/40" />
        ))}
      </div>
    </main>
  );
}
