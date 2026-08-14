import { obterIniciais } from '@/lib/perfil/iniciais';

export default function AvatarPerfil({
  nome,
  fotoUrl = null,
  tamanho = 88,
}: {
  nome: string | null;
  fotoUrl?: string | null;
  tamanho?: number;
}) {
  if (fotoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- avatar vem de URL dinâmica do Storage, sem domínio fixo configurável em next/image
      <img
        src={fotoUrl}
        alt=""
        aria-hidden="true"
        className="shrink-0 rounded-full border-4 border-superficie object-cover shadow-[0_2px_8px_rgba(74,63,53,0.12)]"
        style={{ width: tamanho, height: tamanho }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full border-4 border-superficie bg-lilas-suave font-display text-2xl text-acao shadow-[0_2px_8px_rgba(74,63,53,0.12)]"
      style={{ width: tamanho, height: tamanho }}
    >
      {obterIniciais(nome)}
    </span>
  );
}
