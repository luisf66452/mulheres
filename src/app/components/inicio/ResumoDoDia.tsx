import type { Checkin } from '@/lib/supabase/types';

export default function ResumoDoDia({ checkinHoje }: { checkinHoje: Checkin | null }) {
  if (!checkinHoje) {
    return (
      <p className="text-sm text-texto-suave">
        Você ainda não fez seu check-in hoje — ele leva menos de 2 minutos.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-texto-suave">
      <span>
        Humor: <strong className="text-texto">{checkinHoje.humor}/5</strong>
      </span>
      <span>
        Corpo: <strong className="text-texto">{checkinHoje.imagem_corporal}/5</strong>
      </span>
      <span>
        Comida: <strong className="text-texto">{checkinHoje.comida}/5</strong>
      </span>
    </div>
  );
}
