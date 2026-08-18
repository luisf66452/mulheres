import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SessaoClient from './SessaoClient';
import { buscarJornadaPorSlug, buscarSessaoPorId } from '@/lib/jornadas-conteudo/dados';

// Não clicamos em "Concluir sessão": esse botão chama uma Server Action real
// (concluirSessaoJornadaConteudo), que depende de cookies()/Supabase fora de
// um request real — este teste cobre só a renderização e a navegação entre
// etapas, que é puramente client-side.
describe('SessaoClient', () => {
  const jornada = buscarJornadaPorSlug('imagem-corporal')!;
  const sessao = buscarSessaoPorId(jornada, 'imagem-corporal-m1-s1')!;

  it('renderiza a etapa "entenda em 1 minuto" com o conteúdo real da sessão, sem placeholder', () => {
    render(<SessaoClient jornadaSlug={jornada.slug} jornadaTitulo={jornada.titulo} sessao={sessao} />);
    expect(screen.getByText(sessao.titulo)).toBeTruthy();
    expect(screen.getByText('Entenda em 1 minuto')).toBeTruthy();
    expect(screen.getByText(sessao.entendaEm1Minuto)).toBeTruthy();
    expect(screen.queryByText(/Conteúdo a ser adicionado/i)).toBeNull();
  });

  it('avança pelos passos da prática guiada até o fechamento', () => {
    render(<SessaoClient jornadaSlug={jornada.slug} jornadaTitulo={jornada.titulo} sessao={sessao} />);

    fireEvent.click(screen.getByText('Começar prática'));
    expect(screen.getByText(sessao.praticaGuiada[0])).toBeTruthy();

    for (let i = 1; i < sessao.praticaGuiada.length; i++) {
      fireEvent.click(screen.getByText('Próximo passo'));
      expect(screen.getByText(sessao.praticaGuiada[i])).toBeTruthy();
    }

    fireEvent.click(screen.getByText('Continuar'));
    if (sessao.reflexao) {
      expect(screen.getByText(sessao.reflexao)).toBeTruthy();
      fireEvent.click(screen.getByText('Continuar'));
    }

    expect(screen.getByText('Leve com você')).toBeTruthy();
    expect(screen.getByText(sessao.leveComVoce)).toBeTruthy();
    expect(screen.getByText('Concluir sessão')).toBeTruthy();
  });

  it('mostra o aviso de segurança quando a sessão tem um', () => {
    const sessaoComAviso = buscarSessaoPorId(jornada, 'imagem-corporal-m4-s4')!;
    expect(sessaoComAviso.avisoSeguranca).toBeDefined();
    render(
      <SessaoClient jornadaSlug={jornada.slug} jornadaTitulo={jornada.titulo} sessao={sessaoComAviso} />
    );
    expect(screen.getByText(sessaoComAviso.avisoSeguranca!)).toBeTruthy();
  });
});
