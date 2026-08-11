import { ButtonHTMLAttributes } from 'react';

type BotaoProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: 'primaria' | 'secundaria';
};

export default function Botao({ variante = 'primaria', className = '', ...props }: BotaoProps) {
  const base =
    'w-full rounded-2xl p-3 text-center font-medium transition-colors disabled:opacity-40';
  const estilos =
    variante === 'primaria'
      ? 'bg-acao text-white hover:bg-acao/90'
      : 'border border-borda text-texto-suave hover:bg-superficie';
  return <button className={`${base} ${estilos} ${className}`} {...props} />;
}
