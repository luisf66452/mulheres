'use client';

import { useEffect, useRef, useState } from 'react';
import IconePlay from './icones/IconePlay';
import IconePausa from './icones/IconePausa';
import IconeSkipTras from './icones/IconeSkipTras';
import IconeSkipFrente from './icones/IconeSkipFrente';
import { lerPosicao, salvarPosicao, apagarPosicao } from '@/lib/praticas-audio-posicao/armazenamento';

export interface PlayerAudioProps {
  praticaId: string;
  url: string;
  titulo: string;
  duracaoSegundosConhecida: number;
  transcricao: string;
  concluida?: boolean;
}

const VELOCIDADES = [0.75, 1, 1.25, 1.5] as const;
type Velocidade = (typeof VELOCIDADES)[number];

const INTERVALO_SALVAMENTO_MS = 4000;

function formatarTempo(segundosTotal: number): string {
  const segundosInteiros = Math.max(0, Math.floor(segundosTotal));
  const minutos = Math.floor(segundosInteiros / 60);
  const segundos = segundosInteiros % 60;
  return `${minutos}:${segundos.toString().padStart(2, '0')}`;
}

export default function PlayerAudio({
  praticaId,
  url,
  titulo,
  duracaoSegundosConhecida,
  transcricao,
  concluida = false,
}: PlayerAudioProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ultimoSalvamentoRef = useRef(0);

  const [tocando, setTocando] = useState(false);
  const [tempoAtual, setTempoAtual] = useState(0);
  const [duracao, setDuracao] = useState(duracaoSegundosConhecida);
  const [velocidade, setVelocidade] = useState<Velocidade>(1);
  const [erroCarregamento, setErroCarregamento] = useState(false);

  // Retoma posição salva ao montar (ou apaga, se a prática já foi concluída).
  useEffect(() => {
    if (concluida) {
      apagarPosicao(praticaId);
      return;
    }
    const posicaoSalva = lerPosicao(praticaId);
    if (posicaoSalva !== null && audioRef.current) {
      audioRef.current.currentTime = posicaoSalva;
      setTempoAtual(posicaoSalva);
    }
    // Roda só na montagem — mudanças posteriores de `concluida` são tratadas
    // separadamente, e `praticaId` não muda depois de montado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Media Session API — atrás de feature-detection, com cleanup no
  // desmontar. Permite controlar play/pause/skip pelos controles do SO.
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({ title: titulo });

    navigator.mediaSession.setActionHandler('play', () => audioRef.current?.play());
    navigator.mediaSession.setActionHandler('pause', () => audioRef.current?.pause());
    navigator.mediaSession.setActionHandler('seekbackward', () => aplicarSkip(-10));
    navigator.mediaSession.setActionHandler('seekforward', () => aplicarSkip(10));

    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titulo]);

  function alternarReproducao() {
    const audio = audioRef.current;
    if (!audio) return;
    if (tocando) {
      audio.pause();
    } else {
      audio.play();
    }
  }

  function aplicarSkip(deltaSegundos: number) {
    const audio = audioRef.current;
    if (!audio) return;
    const alvo = Math.min(Math.max(audio.currentTime + deltaSegundos, 0), duracao);
    audio.currentTime = alvo;
    setTempoAtual(alvo);
    salvarPosicaoComThrottle(alvo, true);
  }

  function salvarPosicaoComThrottle(segundos: number, forcar = false) {
    const agora = Date.now();
    if (!forcar && agora - ultimoSalvamentoRef.current < INTERVALO_SALVAMENTO_MS) return;
    ultimoSalvamentoRef.current = agora;
    salvarPosicao(praticaId, segundos);
  }

  function aoAtualizarTempo(segundos: number) {
    setTempoAtual(segundos);
    salvarPosicaoComThrottle(segundos);
  }

  function aoMudarVelocidade(valor: string) {
    const nova = Number(valor) as Velocidade;
    setVelocidade(nova);
    if (audioRef.current) audioRef.current.playbackRate = nova;
  }

  function aoTerminarAudio() {
    setTocando(false);
    apagarPosicao(praticaId);
  }

  return (
    <div className="space-y-3 rounded-2xl border border-borda/60 bg-superficie px-4 py-3.5">
      <audio
        ref={audioRef}
        src={url}
        data-testid="elemento-audio"
        preload="metadata"
        autoPlay={false}
        onPlay={() => setTocando(true)}
        onPause={() => setTocando(false)}
        onEnded={aoTerminarAudio}
        onError={() => setErroCarregamento(true)}
        onLoadedMetadata={(evento) => {
          const duracaoReal = evento.currentTarget.duration;
          if (Number.isFinite(duracaoReal) && duracaoReal > 0) setDuracao(duracaoReal);
        }}
        onTimeUpdate={(evento) => aoAtualizarTempo(evento.currentTarget.currentTime)}
      />

      {erroCarregamento ? (
        <p role="alert" className="text-sm text-texto-suave">
          Não foi possível carregar este áudio agora. Tente novamente em instantes.
        </p>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => aplicarSkip(-10)}
              aria-label="Voltar 10 segundos"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-texto transition-colors hover:bg-fundo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60"
            >
              <IconeSkipTras />
            </button>

            <button
              type="button"
              onClick={alternarReproducao}
              aria-label={tocando ? `Pausar áudio de ${titulo}` : `Tocar áudio de ${titulo}`}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-acao text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60 focus-visible:ring-offset-2"
            >
              {tocando ? <IconePausa /> : <IconePlay />}
            </button>

            <button
              type="button"
              onClick={() => aplicarSkip(10)}
              aria-label="Avançar 10 segundos"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-texto transition-colors hover:bg-fundo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60"
            >
              <IconeSkipFrente />
            </button>

            <span className="shrink-0 text-xs tabular-nums text-texto-suave">
              {formatarTempo(tempoAtual)} / {formatarTempo(duracao)}
            </span>
          </div>

          <input
            type="range"
            role="slider"
            min={0}
            max={duracao}
            step={1}
            value={tempoAtual}
            aria-label="Posição no áudio"
            aria-valuemin={0}
            aria-valuemax={duracao}
            aria-valuenow={tempoAtual}
            aria-valuetext={`${formatarTempo(tempoAtual)} de ${formatarTempo(duracao)}`}
            onChange={(evento) => {
              const novoTempo = Number(evento.target.value);
              if (audioRef.current) audioRef.current.currentTime = novoTempo;
              setTempoAtual(novoTempo);
              salvarPosicaoComThrottle(novoTempo, true);
            }}
            className="w-full accent-acao"
          />

          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs text-texto-suave">
              Velocidade
              <select
                value={velocidade}
                aria-label="Velocidade de reprodução"
                onChange={(evento) => aoMudarVelocidade(evento.target.value)}
                className="rounded-lg border border-borda/60 bg-fundo px-2 py-1 text-xs text-texto"
              >
                {VELOCIDADES.map((v) => (
                  <option key={v} value={v}>
                    {v}x
                  </option>
                ))}
              </select>
            </label>
          </div>
        </>
      )}

      <details className="text-sm text-texto-suave">
        <summary className="cursor-pointer font-medium text-texto">Ver transcrição</summary>
        <p className="mt-2 whitespace-pre-line">{transcricao}</p>
      </details>
    </div>
  );
}
