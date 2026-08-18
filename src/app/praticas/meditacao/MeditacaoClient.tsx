'use client';

import { useRef, useState } from 'react';
import type { PraticaRapida } from '@/lib/praticas-conteudo/tipos';
import { useCronometroRegressivo } from '@/lib/praticas-conteudo/useCronometroRegressivo';
import { FRASES_MEDITACAO, obterIndiceFrase } from '@/lib/praticas-conteudo/frasesMeditacao';
import { registrarConclusao } from '@/lib/praticas-progresso/armazenamento';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import Cronometro from '@/app/components/praticas/Cronometro';
import ControlesSessao from '@/app/components/praticas/ControlesSessao';
import TelaConclusao from '@/app/components/praticas/TelaConclusao';
import PlayerAudio from '@/app/components/praticas/PlayerAudio';
import Botao from '@/app/components/Botao';
import HaloMeditacao from '@/app/components/ilustracoes/praticas/HaloMeditacao';

const DURACAO_TOTAL_S = 8 * 60;

export default function MeditacaoClient({
  pratica,
  usuariaId,
}: {
  pratica: PraticaRapida;
  usuariaId: string;
}) {
  const [introducaoVisivel, setIntroducaoVisivel] = useState(true);
  const registradoRef = useRef(false);

  const cronometro = useCronometroRegressivo(DURACAO_TOTAL_S, () => {
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
  });

  function comecar() {
    setIntroducaoVisivel(false);
    registradoRef.current = false;
    cronometro.iniciar();
  }

  function reiniciar() {
    registradoRef.current = false;
    cronometro.reiniciar();
    setIntroducaoVisivel(true);
  }

  if (cronometro.estado === 'concluido') {
    return (
      <TelaConclusao
        titulo="Meditação concluída"
        mensagem="Você reservou um tempo só seu hoje. Leve essa presença para o resto do dia."
        onRepetir={reiniciar}
      />
    );
  }

  if (introducaoVisivel) {
    return (
      <div className="space-y-5 text-center">
        <div className="flex justify-center">
          <HaloMeditacao tamanho="pequena" className="opacity-80" />
        </div>
        <p className="text-sm text-texto-suave">
          Encontre uma posição confortável. Nos próximos 8 minutos, você só precisa estar presente — sem se
          cobrar por &quot;fazer certo&quot;.
        </p>
        <Botao type="button" onClick={comecar}>
          Começar meditação
        </Botao>
      </div>
    );
  }

  const indiceFrase = obterIndiceFrase(cronometro.segundosDecorridos, FRASES_MEDITACAO.length);

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <HaloMeditacao tamanho="media" />
      </div>
      <p aria-live="polite" className="min-h-12 text-texto-suave">
        {FRASES_MEDITACAO[indiceFrase]}
      </p>
      <Cronometro segundosRestantes={cronometro.segundosRestantes} duracaoTotalS={DURACAO_TOTAL_S} />
      <ControlesSessao
        estado={cronometro.estado}
        onPausar={cronometro.pausar}
        onContinuar={cronometro.continuar}
        onReiniciar={reiniciar}
      />
      <PlayerAudio url={pratica.midia.url} titulo={pratica.titulo} />
    </div>
  );
}
