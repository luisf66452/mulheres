import { obterIniciais } from '@/lib/perfil/iniciais';

export default function AvatarPerfil({
  nome,
  tamanho = 88,
}: {
  nome: string | null;
  tamanho?: number;
}) {
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
