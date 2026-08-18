'use client';

import { useState, useTransition } from 'react';
import Botao from '@/app/components/Botao';
import { exportarMeusDados } from './actions';

export default function ExportarDadosBotao() {
  const [erro, setErro] = useState<string | null>(null);
  const [exportando, startTransition] = useTransition();

  function handleExportar() {
    setErro(null);
    startTransition(async () => {
      const resultado = await exportarMeusDados();
      if (resultado.erro || !resultado.dados) {
        setErro(resultado.erro ?? 'Não foi possível exportar seus dados agora.');
        return;
      }

      const blob = new Blob([resultado.dados], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rose-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="space-y-2">
      <Botao variante="secundaria" type="button" onClick={handleExportar} disabled={exportando}>
        {exportando ? 'Preparando...' : 'Baixar meus dados'}
      </Botao>
      {erro && (
        <p role="alert" className="text-sm text-alerta">
          {erro}
        </p>
      )}
    </div>
  );
}
