'use client';

import { useRouter } from 'next/navigation';
import Botao from '@/app/components/Botao';

// Mostrado quando a usuária volta do Stripe com ?checkout=sucesso (ver
// /api/stripe/checkout). Só apresentação — quem confirma o pagamento e
// dispara o Purchase do TikTok Pixel é o TikTokPurchase, renderizado junto.
export default function ModalAgradecimento() {
  const router = useRouter();

  function continuar() {
    router.replace('/perfil/assinatura', { scroll: false });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-texto/40 p-4">
      <div className="w-full max-w-sm space-y-4 rounded-2xl bg-superficie p-6 text-center shadow-[0_8px_24px_rgba(74,63,53,0.16)]">
        <p className="font-display text-xl text-texto">Seja muito bem-vinda ao Rose Pro</p>
        <p className="text-sm text-texto-suave">
          Obrigada por confiar na Rose e caminhar com a gente. Agora você tem acesso a todas as
          jornadas guiadas, à biblioteca completa de práticas e ao seu histórico inteiro de
          progresso.
        </p>
        <Botao type="button" onClick={continuar}>
          Começar a explorar
        </Botao>
      </div>
    </div>
  );
}
