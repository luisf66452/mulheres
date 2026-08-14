import { describe, it, expect, beforeEach } from 'vitest';
import { registrarConclusao, listarConclusoesDoDia, listarTodasConclusoes } from './armazenamento';

describe('registrarConclusao / listarConclusoesDoDia', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('registra uma conclusão e permite listá-la no dia', () => {
    registrarConclusao({
      praticaId: 'respiracao',
      usuariaId: 'u1',
      concluidaEm: '2026-08-13T10:00:00.000Z',
      duracaoMinutos: 3,
    });
    expect(listarConclusoesDoDia('u1', '2026-08-13')).toHaveLength(1);
  });

  it('não duplica quando a mesma conclusão é registrada duas vezes seguidas (duplo toque)', () => {
    registrarConclusao({
      praticaId: 'respiracao',
      usuariaId: 'u1',
      concluidaEm: '2026-08-13T10:00:00.000Z',
      duracaoMinutos: 3,
    });
    registrarConclusao({
      praticaId: 'respiracao',
      usuariaId: 'u1',
      concluidaEm: '2026-08-13T10:00:02.000Z',
      duracaoMinutos: 3,
    });
    expect(listarConclusoesDoDia('u1', '2026-08-13')).toHaveLength(1);
  });

  it('permite duas conclusões da mesma prática fora da janela de idempotência', () => {
    registrarConclusao({
      praticaId: 'respiracao',
      usuariaId: 'u1',
      concluidaEm: '2026-08-13T10:00:00.000Z',
      duracaoMinutos: 3,
    });
    registrarConclusao({
      praticaId: 'respiracao',
      usuariaId: 'u1',
      concluidaEm: '2026-08-13T18:00:00.000Z',
      duracaoMinutos: 3,
    });
    expect(listarConclusoesDoDia('u1', '2026-08-13')).toHaveLength(2);
  });

  it('não mistura conclusões de usuárias diferentes', () => {
    registrarConclusao({
      praticaId: 'respiracao',
      usuariaId: 'u1',
      concluidaEm: '2026-08-13T10:00:00.000Z',
      duracaoMinutos: 3,
    });
    registrarConclusao({
      praticaId: 'respiracao',
      usuariaId: 'u2',
      concluidaEm: '2026-08-13T10:00:00.000Z',
      duracaoMinutos: 3,
    });
    expect(listarConclusoesDoDia('u1', '2026-08-13')).toHaveLength(1);
    expect(listarConclusoesDoDia('u2', '2026-08-13')).toHaveLength(1);
  });
});

describe('listarTodasConclusoes', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('soma conclusões de dias diferentes para a mesma usuária', () => {
    registrarConclusao({
      praticaId: 'respiracao',
      usuariaId: 'u1',
      concluidaEm: '2026-08-10T10:00:00.000Z',
      duracaoMinutos: 3,
    });
    registrarConclusao({
      praticaId: 'meditacao',
      usuariaId: 'u1',
      concluidaEm: '2026-08-11T10:00:00.000Z',
      duracaoMinutos: 5,
    });
    expect(listarTodasConclusoes('u1')).toHaveLength(2);
  });

  it('não inclui conclusões de outras usuárias', () => {
    registrarConclusao({
      praticaId: 'respiracao',
      usuariaId: 'u1',
      concluidaEm: '2026-08-10T10:00:00.000Z',
      duracaoMinutos: 3,
    });
    registrarConclusao({
      praticaId: 'respiracao',
      usuariaId: 'u2',
      concluidaEm: '2026-08-10T10:00:00.000Z',
      duracaoMinutos: 3,
    });
    expect(listarTodasConclusoes('u1')).toHaveLength(1);
  });

  it('retorna lista vazia quando não há nenhuma conclusão registrada', () => {
    expect(listarTodasConclusoes('u1')).toHaveLength(0);
  });

  it('não inclui conclusões de usuárias com IDs que começam com o mesmo prefixo (ex: u1 vs u12)', () => {
    registrarConclusao({
      praticaId: 'respiracao',
      usuariaId: 'u1',
      concluidaEm: '2026-08-10T10:00:00.000Z',
      duracaoMinutos: 3,
    });
    registrarConclusao({
      praticaId: 'meditacao',
      usuariaId: 'u12',
      concluidaEm: '2026-08-10T11:00:00.000Z',
      duracaoMinutos: 5,
    });
    expect(listarTodasConclusoes('u1')).toHaveLength(1);
  });
});
