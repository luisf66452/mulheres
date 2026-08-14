'use client';

import { useRef, useState } from 'react';
import IconePlay from './icones/IconePlay';
import IconePausa from './icones/IconePausa';

export default function PlayerAudio({ url, titulo }: { url: string | null; titulo: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [tocando, setTocando] = useState(false);
  const [volume, setVolume] = useState(1);
  const [duracaoSegundos, setDuracaoSegundos] = useState<number | null>(null);

  if (!url) {
    return (
      <p className="rounded-2xl border border-borda/60 bg-superficie px-4 py-3 text-center text-sm text-texto-suave">
        Áudio guiado em breve — por enquanto, siga pelo cronômetro e pelas orientações no texto.
      </p>
    );
  }

  function alternarReproducao() {
    const audio = audioRef.current;
    if (!audio) return;
    if (tocando) {
      audio.pause();
    } else {
      audio.play();
    }
  }

  const duracaoFormatada =
    duracaoSegundos !== null
      ? `${Math.floor(duracaoSegundos / 60)}:${Math.floor(duracaoSegundos % 60)
          .toString()
          .padStart(2, '0')}`
      : null;

  return (
    <div className="rounded-2xl border border-borda/60 bg-superficie px-4 py-3">
      <audio
        ref={audioRef}
        src={url}
        onPlay={() => setTocando(true)}
        onPause={() => setTocando(false)}
        onEnded={() => setTocando(false)}
        onLoadedMetadata={(evento) => setDuracaoSegundos(evento.currentTarget.duration)}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={alternarReproducao}
          aria-label={tocando ? `Pausar áudio de ${titulo}` : `Tocar áudio de ${titulo}`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-acao text-white"
        >
          {tocando ? <IconePausa /> : <IconePlay />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          aria-label="Volume do áudio"
          onChange={(evento) => {
            const novoVolume = Number(evento.target.value);
            setVolume(novoVolume);
            if (audioRef.current) audioRef.current.volume = novoVolume;
          }}
          className="flex-1"
        />
        {duracaoFormatada && <span className="shrink-0 text-xs text-texto-suave">{duracaoFormatada}</span>}
      </div>
    </div>
  );
}
