'use client';

import { useEffect, useState } from 'react';

const ROTULOS: Record<string, string> = {
  granted: 'Concedida',
  denied: 'Bloqueada',
  default: 'Ainda não solicitada',
  indisponivel: 'Não suportada neste navegador',
};

export default function PermissoesConcedidas() {
  const [permissao, setPermissao] = useState('default');

  useEffect(() => {
    const suportado = typeof window !== 'undefined' && 'Notification' in window;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPermissao(suportado ? Notification.permission : 'indisponivel');
  }, []);

  return (
    <div className="flex items-center justify-between text-sm text-texto">
      <span>Notificações</span>
      <span className="text-texto-suave">{ROTULOS[permissao]}</span>
    </div>
  );
}
