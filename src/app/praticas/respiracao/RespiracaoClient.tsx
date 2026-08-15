'use client';

import { useRef, useState } from 'react';
import type { PraticaRapida } from '@/lib/praticas-conteudo/tipos';
import { useCronometroRegressivo } from '@/lib/praticas-conteudo/useCronometroRegressivo';
import { calcularFaseRespiracao, DURACAO_INSPIRAR_S, DURACAO_EXPIRAR_S } from '@/lib/praticas-conteudo/cicloRespiracao';
import { registrarConclusao } from '@/lib/praticas-progresso/armazenamento';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import Cronometro from '@/app/components/praticas/Cronometro';
import ControlesSessao from '@/app/components/praticas/ControlesSessao';
import TelaConclusao from '@/app/components/praticas/TelaConclusao';
import Botao from '@/app/components/Botao';

const DURACAO_TOTAL_S = 180;

export default function RespiracaoClient({
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
        titulo="Respiração concluída"
        mensagem="Muito bem. Alguns minutos de respiração consciente já fazem diferença no seu dia."
        onRepetir={reiniciar}
      />
    );
  }

  if (introducaoVisivel) {
    return (
      <div className="space-y-5 text-center">
        <p className="text-sm text-texto-suave">
          Uma pausa curta para respirar com atenção: inspire por 4 segundos, expire devagar por 6. Repita até
          completar 3 minutos.
        </p>
        <Botao type="button" onClick={comecar}>
          Começar
        </Botao>
      </div>
    );
  }

  const { fase } = calcularFaseRespiracao(cronometro.segundosDecorridos);
  const emExpansao = fase === 'inspire';

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div
          className={`h-40 w-40 rounded-full bg-salvia/40 transition-transform ease-in-out motion-reduce:transform-none ${
            emExpansao ? 'scale-100' : 'scale-75'
          }`}
          style={{ transitionDuration: `${emExpansao ? DURACAO_INSPIRAR_S : DURACAO_EXPIRAR_S}s` }}
        />
      </div>
      <p aria-live="polite" className="font-display text-xl text-texto">
        {fase === 'inspire' ? 'Inspire' : 'Expire devagar'}
      </p>
      <Cronometro segundosRestantes={cronometro.segundosRestantes} duracaoTotalS={DURACAO_TOTAL_S} />
      <ControlesSessao
        estado={cronometro.estado}
        onPausar={cronometro.pausar}
        onContinuar={cronometro.continuar}
        onReiniciar={reiniciar}
      />
    </div>
  );
}
