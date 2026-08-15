// Fallback de streaming raiz: cobre qualquer rota que ainda não tenha seu
// próprio loading.tsx (ex.: /checkin, /jornadas, /clube-rose, /progresso)
// enquanto o Server Component da página resolve. Mesmo padrão neutro de
// src/app/praticas/loading.tsx — sem título fixo, porque este arquivo serve
// de fallback para rotas muito diferentes entre si.
export default function CarregandoApp() {
  return (
    <main
      className="mx-auto max-w-md space-y-6 p-6 pb-[calc(6rem_+_env(safe-area-inset-bottom))] md:pb-6"
      aria-hidden="true"
    >
      <div className="h-8 w-32 animate-pulse rounded-full bg-borda/60" />
      <div className="h-24 animate-pulse rounded-[28px] bg-borda/40" />
      <div className="space-y-2.5">
        {Array.from({ length: 3 }, (_, indice) => (
          <div key={indice} className="h-[76px] animate-pulse rounded-[28px] bg-borda/40" />
        ))}
      </div>
    </main>
  );
}
