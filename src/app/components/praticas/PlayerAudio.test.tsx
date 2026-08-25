import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PlayerAudio from './PlayerAudio';
import * as armazenamento from '@/lib/praticas-audio-posicao/armazenamento';

const PROPS_BASE = {
  praticaId: 'respiracao-guiada-audio',
  url: 'https://cdn.exemplo.com/respiracao.mp3',
  titulo: 'Respiração guiada',
  duracaoSegundosConhecida: 180,
  transcricao: 'Sente-se confortavelmente e respire fundo...',
};

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
  // jsdom não implementa play()/pause() em <audio> — stub necessário.
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = vi.fn();
});

describe('PlayerAudio', () => {
  it('renderiza o botão de tocar com aria-label descritivo', () => {
    render(<PlayerAudio {...PROPS_BASE} />);
    expect(screen.getByRole('button', { name: /Tocar áudio de Respiração guiada/ })).toBeInTheDocument();
  });

  it('alterna para "Pausar" após clicar em tocar', () => {
    render(<PlayerAudio {...PROPS_BASE} />);
    const botao = screen.getByRole('button', { name: /Tocar áudio de Respiração guiada/ });
    fireEvent.click(botao);
    fireEvent.play(screen.getByTestId('elemento-audio'));
    expect(screen.getByRole('button', { name: /Pausar áudio de Respiração guiada/ })).toBeInTheDocument();
  });

  it('não usa autoplay no elemento de áudio', () => {
    render(<PlayerAudio {...PROPS_BASE} />);
    const audio = screen.getByTestId('elemento-audio') as HTMLAudioElement;
    expect(audio.autoplay).toBe(false);
  });

  it('usa preload="metadata"', () => {
    render(<PlayerAudio {...PROPS_BASE} />);
    const audio = screen.getByTestId('elemento-audio') as HTMLAudioElement;
    expect(audio.preload).toBe('metadata');
  });

  it('renderiza a barra de progresso como slider acessível com min/max/valor', () => {
    render(<PlayerAudio {...PROPS_BASE} />);
    const slider = screen.getByRole('slider', { name: /Posição no áudio/ });
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '180');
  });

  it('renderiza os botões de skip com aria-label', () => {
    render(<PlayerAudio {...PROPS_BASE} />);
    expect(screen.getByRole('button', { name: 'Voltar 10 segundos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Avançar 10 segundos' })).toBeInTheDocument();
  });

  it('renderiza o seletor de velocidade com as 4 opções', () => {
    render(<PlayerAudio {...PROPS_BASE} />);
    const seletor = screen.getByRole('combobox', { name: /Velocidade de reprodução/ });
    expect(seletor).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '0.75x' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '1x' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '1.25x' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '1.5x' })).toBeInTheDocument();
  });

  it('renderiza a transcrição dentro de um <details> expansível, fechado por padrão', () => {
    render(<PlayerAudio {...PROPS_BASE} />);
    const details = screen.getByText('Ver transcrição').closest('details');
    expect(details).not.toBeNull();
    expect(details).not.toHaveAttribute('open');
    expect(screen.getByText(/Sente-se confortavelmente/)).toBeInTheDocument();
  });

  it('mostra mensagem amigável quando o áudio falha ao carregar', () => {
    render(<PlayerAudio {...PROPS_BASE} />);
    const audio = screen.getByTestId('elemento-audio');
    fireEvent.error(audio);
    expect(
      screen.getByText('Não foi possível carregar este áudio agora. Tente novamente em instantes.')
    ).toBeInTheDocument();
  });

  it('retoma a posição salva ao montar, quando existir', () => {
    armazenamento.salvarPosicao('respiracao-guiada-audio', 42);
    render(<PlayerAudio {...PROPS_BASE} />);
    const audio = screen.getByTestId('elemento-audio') as HTMLAudioElement;
    expect(audio.currentTime).toBe(42);
  });

  it('não retoma posição quando concluida=true — e apaga a posição salva', () => {
    armazenamento.salvarPosicao('respiracao-guiada-audio', 42);
    render(<PlayerAudio {...PROPS_BASE} concluida />);
    expect(armazenamento.lerPosicao('respiracao-guiada-audio')).toBeNull();
  });
});
