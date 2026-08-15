'use client';

import { useRef, useState } from 'react';
import type { PraticaRapida } from '@/lib/praticas-conteudo/tipos';
import { ETAPAS_AUTOCOMPAIXAO } from '@/lib/praticas-conteudo/etapasAutocompaixao';
import { usePersistedState } from '@/lib/persistencia-local/usePersistedState';
import { registrarConclusao } from '@/lib/praticas-progresso/armazenamento';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import IndicadorEtapas from '@/app/components/praticas/IndicadorEtapas';
import TelaConclusao from '@/app/components/praticas/TelaConclusao';
import Botao from '@/app/components/Botao';

function dataDeHoje(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AutocompaixaoClient({
  pratica,
  usuariaId,
}: {
  pratica: PraticaRapida;
  usuariaId: string;
}) {
  const chave = `praticas:autocompaixao:${usuariaId}:${dataDeHoje()}`;
  const [respostas, setRespostas, limparRespostas] = usePersistedState<string[]>(
    chave,
    ETAPAS_AUTOCOMPAIXAO.map(() => '')
  );
  const [etapa, setEtapa] = useState(0);
  const [concluido, setConcluido] = useState(false);
  const registradoRef = useRef(false);

  const totalEtapas = ETAPAS_AUTOCOMPAIXAO.length;
  const etapaAtual = ETAPAS_AUTOCOMPAIXAO[etapa];
  const ultimaEtapa = etapa === totalEtapas - 1;

  function atualizarResposta(texto: string) {
    const proximas = [...respostas];
    proximas[etapa] = texto;
    setRespostas(proximas);
  }

  function concluirExercicio() {
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
        titulo="Exercício concluído"
        mensagem="Que bom que você reservou esse tempo para si. Volte a essas palavras sempre que precisar."
      />
    );
  }

  return (
    <div className="space-y-5">
      <IndicadorEtapas etapaAtual={etapa + 1} totalEtapas={totalEtapas} />
      <div className="space-y-3">
        <p className="font-display text-lg text-texto">{etapaAtual.titulo}</p>
        {etapaAtual.texto && <p className="text-sm text-texto-suave">{etapaAtual.texto}</p>}
        {etapaAtual.pergunta && (
          <>
            <p className="text-sm text-texto-suave">{etapaAtual.pergunta}</p>
            <textarea
              value={respostas[etapa]}
              onChange={(evento) => atualizarResposta(evento.target.value)}
              rows={5}
              placeholder="Escreva à vontade..."
              aria-label={etapaAtual.pergunta}
              className="w-full resize-none rounded-2xl border border-borda bg-superficie p-4 text-texto placeholder:text-texto-suave/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60"
            />
          </>
        )}
      </div>
      <div className="flex gap-3">
        {etapa > 0 && (
          <Botao type="button" variante="secundaria" onClick={() => setEtapa(etapa - 1)} className="flex-1">
            Voltar
          </Botao>
        )}
        {ultimaEtapa ? (
          <Botao type="button" onClick={concluirExercicio} className="flex-1">
            Concluir exercício
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
