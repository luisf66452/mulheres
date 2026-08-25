import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import PersonalizacaoForm from './PersonalizacaoForm';

const salvarObjetivos = vi.fn(async (selecionados: string[]) => {
  void selecionados;
  return {};
});
const salvarTemasSensiveis = vi.fn(async (selecionados: string[]) => {
  void selecionados;
  return {};
});
const salvarHorarioPreferido = vi.fn(async (horario: string) => {
  void horario;
});

vi.mock('@/app/onboarding/actions', () => ({
  salvarObjetivos: (selecionados: string[]) => salvarObjetivos(selecionados),
  salvarTemasSensiveis: (selecionados: string[]) => salvarTemasSensiveis(selecionados),
}));
vi.mock('@/app/settings/actions', () => ({
  salvarHorarioPreferido: (horario: string) => salvarHorarioPreferido(horario),
}));

beforeEach(() => {
  salvarObjetivos.mockClear();
  salvarTemasSensiveis.mockClear();
  salvarHorarioPreferido.mockClear();
});

describe('PersonalizacaoForm', () => {
  it('mostra as três seções, cada uma partindo dos valores já salvos', () => {
    render(
      <PersonalizacaoForm
        objetivosIniciais={['praticar_autocompaixao']}
        temasIniciais={['corpo_aparencia']}
        horarioInicial="18:00"
      />
    );

    expect(screen.getByRole('button', { name: 'Praticar autocompaixão' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Corpo e aparência' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText(/horário/i)).toHaveValue('18:00');
  });

  it('salvar objetivos chama salvarObjetivos (sem concluirPersonalizacao)', async () => {
    render(<PersonalizacaoForm objetivosIniciais={[]} temasIniciais={[]} horarioInicial={null} />);

    fireEvent.click(screen.getByRole('button', { name: 'Criar um ritual diário de cuidado' }));
    fireEvent.click(screen.getAllByRole('button', { name: /^salvar$/i })[0]);

    await waitFor(() => {
      expect(salvarObjetivos).toHaveBeenCalledWith(['criar_ritual_diario']);
    });
  });

  it('salvar lembrete usa salvarHorarioPreferido, não concluirPersonalizacao', async () => {
    render(<PersonalizacaoForm objetivosIniciais={[]} temasIniciais={[]} horarioInicial={null} />);

    fireEvent.change(screen.getByLabelText(/horário/i), { target: { value: '07:15' } });
    fireEvent.click(screen.getAllByRole('button', { name: /^salvar$/i })[2]);

    await waitFor(() => {
      expect(salvarHorarioPreferido).toHaveBeenCalledWith('07:15');
    });
  });
});
