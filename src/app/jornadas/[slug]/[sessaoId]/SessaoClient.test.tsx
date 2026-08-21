import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import SessaoClient from './SessaoClient';
import type { Sessao, Modulo } from '@/lib/jornadas-conteudo/tipos';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

const sessaoBase: Sessao = {
  id: 'imagem-corporal-m1-s1',
  titulo: 'O que é imagem corporal',
  descricaoCurta: 'Diferença entre corpo e imagem corporal.',
  duracaoMinutos: 5,
  tipo: 'reflexao',
  entendaEm1Minuto: 'texto de exemplo',
  praticaGuiada: ['passo um', 'passo dois', 'passo três'],
  leveComVoce: 'frase final',
  fontesCientificas: [],
  revisaoStatus: 'pendente',
};

const modulo: Modulo = { id: 'imagem-corporal-m1', titulo: 'Relação com o próprio corpo', sessoes: [sessaoBase] };

describe('SessaoClient', () => {
  it('renderiza título, prática guiada e leve com você', () => {
    render(
      <SessaoClient
        sessao={sessaoBase}
        modulo={modulo}
        jornadaSlug="imagem-corporal"
        jornadaTitulo="Imagem corporal"
        proximaSessaoHref={null}
        onConcluir={async () => {}}
      />
    );
    expect(screen.getByRole('heading', { name: sessaoBase.titulo })).toBeInTheDocument();
    expect(screen.getByText('passo um')).toBeInTheDocument();
    expect(screen.getByText(sessaoBase.leveComVoce)).toBeInTheDocument();
  });

  it('não renderiza seção de reflexão quando ausente', () => {
    render(
      <SessaoClient
        sessao={sessaoBase}
        modulo={modulo}
        jornadaSlug="imagem-corporal"
        jornadaTitulo="Imagem corporal"
        proximaSessaoHref={null}
        onConcluir={async () => {}}
      />
    );
    expect(screen.queryByText(/reflexão/i)).not.toBeInTheDocument();
  });

  it('permite concluir sem preencher nenhum campo', async () => {
    const onConcluir = vi.fn().mockResolvedValue(undefined);
    render(
      <SessaoClient
        sessao={sessaoBase}
        modulo={modulo}
        jornadaSlug="imagem-corporal"
        jornadaTitulo="Imagem corporal"
        proximaSessaoHref={null}
        onConcluir={onConcluir}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /concluir/i }));
    await waitFor(() => expect(onConcluir).toHaveBeenCalledTimes(1));
  });

  it('mostra aviso de segurança quando presente', () => {
    render(
      <SessaoClient
        sessao={{ ...sessaoBase, avisoSeguranca: 'Se você notar sinais persistentes, procure ajuda profissional.' }}
        modulo={modulo}
        jornadaSlug="imagem-corporal"
        jornadaTitulo="Imagem corporal"
        proximaSessaoHref={null}
        onConcluir={async () => {}}
      />
    );
    expect(screen.getByText(/procure ajuda profissional/i)).toBeInTheDocument();
  });
});
