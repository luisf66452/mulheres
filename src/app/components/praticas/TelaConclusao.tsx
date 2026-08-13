import Link from 'next/link';
import Botao from '@/app/components/Botao';

export default function TelaConclusao({
  titulo,
  mensagem,
  onRepetir,
  linkRotulo = 'Voltar para Práticas',
  linkHref = '/praticas',
}: {
  titulo: string;
  mensagem: string;
  onRepetir?: () => void;
  linkRotulo?: string;
  linkHref?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="space-y-4 rounded-3xl border border-borda/60 bg-superficie p-6 text-center"
    >
      <h2 className="font-display text-xl text-texto">{titulo}</h2>
      <p className="text-sm text-texto-suave">{mensagem}</p>
      <div className="space-y-2">
        {onRepetir && (
          <Botao type="button" variante="secundaria" onClick={onRepetir}>
            Repetir prática
          </Botao>
        )}
        <Link
          href={linkHref}
          className="block w-full rounded-2xl bg-acao p-3 text-center font-medium text-white transition-colors hover:bg-acao/90"
        >
          {linkRotulo}
        </Link>
      </div>
    </div>
  );
}
