import RosaBotanica from '@/app/components/ilustracoes/RosaBotanica';

const TAMANHOS = {
  pequena: { halo: 'h-20 w-20', nucleo: 'h-16 w-16', rosa: 'pequena' as const },
  media: { halo: 'h-32 w-32', nucleo: 'h-24 w-24', rosa: 'media' as const },
};

// Halo lilás/rosa com pétalas suaves ao redor, pulsando devagar — substitui
// o círculo lilás liso da meditação. A RosaBotanica pequena no centro é
// reaproveitada (sem caule) como o "miolo" do halo, em vez de desenhar outra
// flor do zero.
export default function HaloMeditacao({
  tamanho = 'media',
  className,
}: {
  tamanho?: keyof typeof TAMANHOS;
  className?: string;
}) {
  const t = TAMANHOS[tamanho];
  return (
    <div
      aria-hidden="true"
      className={['relative flex items-center justify-center', className ?? ''].filter(Boolean).join(' ')}
    >
      <div
        className={`halo-respira-anim absolute ${t.halo} rounded-full bg-lilas-suave motion-safe:animate-[halo-respira_6s_ease-in-out_infinite] motion-reduce:animate-none`}
      />
      <div
        className={`halo-respira-anim absolute ${t.nucleo} rounded-full bg-acao/15 motion-safe:animate-[halo-respira_6s_ease-in-out_infinite_0.5s] motion-reduce:animate-none`}
      />
      <RosaBotanica tamanho={t.rosa} comCaule={false} className="relative opacity-90" />
    </div>
  );
}
