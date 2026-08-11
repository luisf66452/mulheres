import { HTMLAttributes } from 'react';

export default function Cartao({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl bg-superficie p-4 shadow-[0_2px_8px_rgba(74,63,53,0.08)] ${className}`}
      {...props}
    />
  );
}
