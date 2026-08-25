// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ContinuarPraticaLocalClient from './ContinuarPraticaLocalClient';
import { chaveRascunhoPratica } from '@/lib/praticas-progresso/chaveLocal';

const USUARIA_ID = 'usuaria-1';

function dataDeHoje(): string {
  return new Date().toISOString().slice(0, 10);
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('ContinuarPraticaLocalClient', () => {
  it('não renderiza nada quando não há nenhum rascunho local', async () => {
    const { container } = render(<ContinuarPraticaLocalClient usuariaId={USUARIA_ID} />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('não renderiza nada quando o rascunho salvo só tem respostas vazias', async () => {
    window.localStorage.setItem(chaveRascunhoPratica('diario', USUARIA_ID, dataDeHoje()), JSON.stringify(['', '']));
    const { container } = render(<ContinuarPraticaLocalClient usuariaId={USUARIA_ID} />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('mostra um card para o Diário guiado quando há um rascunho com conteúdo', async () => {
    window.localStorage.setItem(
      chaveRascunhoPratica('diario', USUARIA_ID, dataDeHoje()),
      JSON.stringify(['Hoje eu senti...', ''])
    );
    render(<ContinuarPraticaLocalClient usuariaId={USUARIA_ID} />);
    await waitFor(() => expect(screen.getByText('Diário guiado')).toBeInTheDocument());
    expect(screen.getByRole('link')).toHaveAttribute('href', '/praticas/diario-guiado');
  });

  it('mostra um card para Autocompaixão quando há um rascunho com conteúdo', async () => {
    window.localStorage.setItem(
      chaveRascunhoPratica('autocompaixao', USUARIA_ID, dataDeHoje()),
      JSON.stringify(['Fui gentil comigo quando...'])
    );
    render(<ContinuarPraticaLocalClient usuariaId={USUARIA_ID} />);
    await waitFor(() => expect(screen.getByText('Autocompaixão')).toBeInTheDocument());
    expect(screen.getByRole('link')).toHaveAttribute('href', '/praticas/autocompaixao');
  });

  it('não mistura rascunhos de outra usuária (chave inclui usuariaId)', async () => {
    window.localStorage.setItem(
      chaveRascunhoPratica('diario', 'outra-usuaria', dataDeHoje()),
      JSON.stringify(['texto de outra pessoa'])
    );
    const { container } = render(<ContinuarPraticaLocalClient usuariaId={USUARIA_ID} />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
