import { ButtonHTMLAttributes } from 'react';

type BotaoProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: 'primaria' | 'secundaria' | 'roxa';
};

export default function Botao({ variante = 'primaria', className = '', ...props }: BotaoProps) {
  const base =
    'w-full rounded-2xl p-3 text-center font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none';
  const estilos =
    variante === 'primaria'
      ? 'bg-acao text-white hover:bg-acao/90'
      : variante === 'roxa'
        ? 'bg-[#7C5A9E] text-white hover:bg-[#6A4A8B]'
        : 'border border-borda text-texto-suave hover:bg-superficie';
  return <button className={`${base} ${estilos} ${className}`} {...props} />;
}
