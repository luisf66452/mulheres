'use client';

import { useState, useTransition } from 'react';
import Botao from '@/app/components/Botao';

type Formato = 'json' | 'csv';

const NOME_PADRAO: Record<Formato, string> = {
  json: 'rose-meus-dados.json',
  csv: 'rose-meus-dados.zip',
};

async function baixarExportacao(formato: Formato): Promise<string | null> {
  const resposta = await fetch(`/api/exportar/${formato}`, { cache: 'no-store' });

  if (!resposta.ok) {
    return 'Não foi possível exportar seus dados agora. Tente novamente.';
  }

  const disposicao = resposta.headers.get('content-disposition') ?? '';
  const nomeCasado = disposicao.match(/filename="([^"]+)"/);
  const nomeArquivo = nomeCasado?.[1] ?? NOME_PADRAO[formato];

  const blob = await resposta.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(url);
  return null;
}

export default function ExportarDadosBotao() {
  const [erro, setErro] = useState<string | null>(null);
  const [formatoEmAndamento, setFormatoEmAndamento] = useState<Formato | null>(null);
  const [exportando, startTransition] = useTransition();

  function handleExportar(formato: Formato) {
    setErro(null);
    setFormatoEmAndamento(formato);
    startTransition(async () => {
      const mensagemErro = await baixarExportacao(formato);
      setErro(mensagemErro);
    });
  }

  return (
    <div className="space-y-2">
      <Botao
        variante="secundaria"
        type="button"
        onClick={() => handleExportar('json')}
        disabled={exportando}
      >
        {exportando && formatoEmAndamento === 'json' ? 'Preparando...' : 'Baixar em JSON'}
      </Botao>
      <Botao
        variante="secundaria"
        type="button"
        onClick={() => handleExportar('csv')}
        disabled={exportando}
      >
        {exportando && formatoEmAndamento === 'csv' ? 'Preparando...' : 'Baixar em CSV (.zip)'}
      </Botao>
      {erro && (
        <p role="alert" className="text-sm text-alerta">
          {erro}
        </p>
      )}
    </div>
  );
}
