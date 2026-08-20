import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ModuloEstruturadoAtividade from './ModuloEstruturadoAtividade';
import { modulo1EntendendoEmocoes } from '@/lib/jornadas-modulos/conteudo/modulo1EntendendoEmocoes';

function setup() {
  const aoFinalizar = vi.fn().mockResolvedValue(undefined);
  const salvarRascunho = vi.fn().mockResolvedValue({ ok: true });
  render(
    <ModuloEstruturadoAtividade
      titulo="Dia 1: Entendendo minhas emoções"
      modulo={modulo1EntendendoEmocoes}
      respostaInicial={null}
      aoFinalizar={aoFinalizar}
      salvarRascunho={salvarRascunho}
    />
  );
  return { aoFinalizar, salvarRascunho };
}

describe('ModuloEstruturadoAtividade', () => {
  it('fluxo completo: antes -> aprender -> exercicio -> revisao -> depois -> finalizar', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { aoFinalizar, salvarRascunho } = setup();

    // Etapa "antes": escolhe sensação e continua.
    fireEvent.click(screen.getByText('3'));
    fireEvent.click(screen.getByText('Continuar'));

    // Etapa "aprender": mostra objetivo/explicação/exemplo, avança para o exercício.
    expect(screen.getByText(modulo1EntendendoEmocoes.objetivo)).toBeTruthy();
    fireEvent.click(screen.getByText('Ir para o exercício'));

    // Etapa "exercicio": campo obrigatório vazio mantém o botão desabilitado.
    const botaoContinuarExercicio = screen.getByText('Continuar') as HTMLButtonElement;
    expect(botaoContinuarExercicio.disabled).toBe(true);

    fireEvent.change(screen.getByPlaceholderText(/recebi uma mensagem/i), {
      target: { value: 'Tive uma discussão com uma amiga.' },
    });
    fireEvent.click(screen.getByText('Tristeza'));
    fireEvent.click(screen.getByText('6'));
    fireEvent.click(screen.getByText('Não percebi nenhuma sensação clara'));
    fireEvent.click(screen.getByText('Ainda não sei identificar'));

    await vi.waitFor(() => {
      expect((screen.getByText('Continuar') as HTMLButtonElement).disabled).toBe(false);
    });

    fireEvent.click(screen.getByText('Continuar'));

    // Etapa "revisao": mostra o feedback correspondente à regra de "necessidade não sei".
    await waitFor(() => {
      expect(
        screen.getByText(/tudo bem não saber ainda/i)
      ).toBeTruthy();
    });
    expect(screen.getByText(modulo1EntendendoEmocoes.acaoPratica)).toBeTruthy();
    fireEvent.click(screen.getByText('Continuar'));

    // Etapa "depois": escolhe sensação final e finaliza.
    fireEvent.click(screen.getByText('4'));
    fireEvent.click(screen.getByText('Finalizar'));

    await waitFor(() => {
      expect(aoFinalizar).toHaveBeenCalledWith(3, 4);
    });

    // A resposta foi persistida ao menos uma vez ao longo do fluxo (autosave + saves explícitos).
    expect(salvarRascunho).toHaveBeenCalled();
    const ultimaChamada = salvarRascunho.mock.calls.at(-1)![0];
    expect(ultimaChamada.valores.situacao).toBe('Tive uma discussão com uma amiga.');
    expect(ultimaChamada.finalizadoEm).not.toBeNull();

    vi.useRealTimers();
  });

  it('mostra o card de segurança quando um campo de texto livre bate um termo de atenção', async () => {
    setup();

    fireEvent.click(screen.getByText('2'));
    fireEvent.click(screen.getByText('Continuar'));
    fireEvent.click(screen.getByText('Ir para o exercício'));

    expect(screen.queryByText(/Percebemos palavras que podem indicar/i)).toBeFalsy();

    fireEvent.change(screen.getByPlaceholderText(/recebi uma mensagem/i), {
      target: { value: 'Hoje eu só queria morrer, não aguento mais viver assim.' },
    });

    expect(screen.getByText(/Percebemos palavras que podem indicar/i)).toBeTruthy();
    // O link de apoio continua acessível e o módulo não fica bloqueado.
    expect(screen.getByRole('link', { name: 'Ver recursos de apoio' }).getAttribute('href')).toBe('/seguranca');
  });

  it('hidrata valores a partir de respostaInicial (sobrevive a atualização de página)', () => {
    const aoFinalizar = vi.fn();
    const salvarRascunho = vi.fn().mockResolvedValue({ ok: true });
    render(
      <ModuloEstruturadoAtividade
        titulo="Dia 1"
        modulo={modulo1EntendendoEmocoes}
        respostaInicial={{
          schemaVersion: 1,
          valores: { situacao: 'Rascunho salvo antes de recarregar a página.' },
          finalizadoEm: null,
        }}
        aoFinalizar={aoFinalizar}
        salvarRascunho={salvarRascunho}
      />
    );

    fireEvent.click(screen.getByText('3'));
    fireEvent.click(screen.getByText('Continuar'));
    fireEvent.click(screen.getByText('Ir para o exercício'));

    expect(screen.getByDisplayValue('Rascunho salvo antes de recarregar a página.')).toBeTruthy();
  });
});
