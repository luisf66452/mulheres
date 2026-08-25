'use client';

import { useRef, useState } from 'react';
import type { PraticaRapida } from '@/lib/praticas-conteudo/tipos';
import { PERGUNTAS_DIARIO_GUIADO } from '@/lib/praticas-conteudo/perguntasDiarioGuiado';
import { usePersistedState } from '@/lib/persistencia-local/usePersistedState';
import { registrarConclusao } from '@/lib/praticas-progresso/armazenamento';
import { chaveRascunhoPratica } from '@/lib/praticas-progresso/chaveLocal';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import IndicadorEtapas from '@/app/components/praticas/IndicadorEtapas';
import TelaConclusao from '@/app/components/praticas/TelaConclusao';
import Botao from '@/app/components/Botao';

function dataDeHoje(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function DiarioGuiadoClient({
  pratica,
  usuariaId,
}: {
  pratica: PraticaRapida;
  usuariaId: string;
}) {
  const chave = chaveRascunhoPratica('diario', usuariaId, dataDeHoje());
  const [respostas, setRespostas, limparRespostas] = usePersistedState<string[]>(
    chave,
    PERGUNTAS_DIARIO_GUIADO.map(() => '')
  );
  const [etapa, setEtapa] = useState(0);
  const [concluido, setConcluido] = useState(false);
  const registradoRef = useRef(false);

  const totalEtapas = PERGUNTAS_DIARIO_GUIADO.length;
  const ultimaEtapa = etapa === totalEtapas - 1;

  function atualizarResposta(texto: string) {
    const proximas = [...respostas];
    proximas[etapa] = texto;
    setRespostas(proximas);
  }

  function limparRespostaAtual() {
    const confirmado = window.confirm('Tem certeza que quer apagar o que você escreveu nesta etapa?');
    if (!confirmado) return;
    const proximas = [...respostas];
    proximas[etapa] = '';
    setRespostas(proximas);
  }

  function concluirReflexao() {
    if (registradoRef.current) return;
    registradoRef.current = true;
    void registrarConclusao(createSupabaseBrowserClient(), {
      praticaId: pratica.id,
      usuariaId,
      concluidaEm: new Date().toISOString(),
      duracaoMinutos: pratica.duracaoMinutos,
    }).catch(() => {
      // Sem Pétalas envolvidas aqui — se a gravação falhar (rede etc.), a
      // conquista de práticas rápidas pode ficar um pouco atrasada, mas o
      // fluxo da prática em si não deve travar por isso.
    });
    limparRespostas();
    setConcluido(true);
  }

  if (concluido) {
    return (
      <TelaConclusao
        titulo="Reflexão concluída"
        mensagem="Obrigada por se dedicar um tempo para se ouvir hoje. Essas respostas ficam só entre você e você mesma."
      />
    );
  }

  return (
    <div className="space-y-5">
      <IndicadorEtapas etapaAtual={etapa + 1} totalEtapas={totalEtapas} />
      <div className="space-y-3">
        <p className="font-display text-lg text-texto">{PERGUNTAS_DIARIO_GUIADO[etapa]}</p>
        <textarea
          value={respostas[etapa]}
          onChange={(evento) => atualizarResposta(evento.target.value)}
          rows={6}
          placeholder="Escreva à vontade..."
          aria-label={PERGUNTAS_DIARIO_GUIADO[etapa]}
          className="w-full resize-none rounded-2xl border border-borda bg-superficie p-4 text-texto placeholder:text-texto-suave/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60"
        />
        {respostas[etapa].length > 0 && (
          <button
            type="button"
            onClick={limparRespostaAtual}
            className="text-xs font-medium text-texto-suave underline-offset-2 hover:underline"
          >
            Limpar resposta
          </button>
        )}
      </div>
      <div className="flex gap-3">
        {etapa > 0 && (
          <Botao type="button" variante="secundaria" onClick={() => setEtapa(etapa - 1)} className="flex-1">
            Voltar
          </Botao>
        )}
        {ultimaEtapa ? (
          <Botao type="button" onClick={concluirReflexao} className="flex-1">
            Concluir reflexão
          </Botao>
        ) : (
          <Botao type="button" onClick={() => setEtapa(etapa + 1)} className="flex-1">
            Continuar
          </Botao>
        )}
      </div>
    </div>
  );
}
