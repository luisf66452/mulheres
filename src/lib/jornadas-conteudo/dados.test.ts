import { describe, expect, it } from 'vitest';
import {
  JORNADAS,
  contarModulos,
  contarSessoes,
  listarSessoesEmOrdem,
  buscarSessaoPorId,
  buscarSessaoEmQualquerJornada,
} from './dados';
import { REFERENCIAS } from './referencias';

const PROIBIDAS_ALIMENTACAO =
  /\bcaloria|\bimc\b|\bpeso ideal\b|\bemagrec|comida (boa|ruim|limpa|suja)|\bjejum prolongado\b(?!.{0,60}(procure|profissional|orienta))/i;

describe('estrutura das jornadas', () => {
  it('tem exatamente 4 jornadas', () => {
    expect(JORNADAS).toHaveLength(4);
  });

  it('totais de módulos e sessões por jornada', () => {
    const esperado: Record<string, { modulos: number; sessoes: number }> = {
      'imagem-corporal': { modulos: 6, sessoes: 24 },
      autocompaixao: { modulos: 7, sessoes: 21 },
      comparacao: { modulos: 6, sessoes: 18 },
      'alimentacao-emocional': { modulos: 7, sessoes: 20 },
    };
    JORNADAS.forEach((j) => {
      expect(contarModulos(j)).toBe(esperado[j.slug].modulos);
      expect(contarSessoes(j)).toBe(esperado[j.slug].sessoes);
    });
  });

  it('26 módulos e 83 sessões no total', () => {
    const totalModulos = JORNADAS.reduce((t, j) => t + contarModulos(j), 0);
    const totalSessoes = JORNADAS.reduce((t, j) => t + contarSessoes(j), 0);
    expect(totalModulos).toBe(26);
    expect(totalSessoes).toBe(83);
  });

  it('todos os ids de sessão são únicos', () => {
    const ids = JORNADAS.flatMap((j) => listarSessoesEmOrdem(j).map((s) => s.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('nenhuma sessão tem título genérico "Sessão N"', () => {
    JORNADAS.forEach((j) =>
      listarSessoesEmOrdem(j).forEach((s) => {
        expect(s.titulo).not.toMatch(/^Sessão \d+$/);
      })
    );
  });

  it('nenhum campo obrigatório vazio ou placeholder', () => {
    JORNADAS.forEach((j) =>
      listarSessoesEmOrdem(j).forEach((s) => {
        expect(s.titulo.length).toBeGreaterThan(0);
        expect(s.descricaoCurta.length).toBeGreaterThan(0);
        expect(s.entendaEm1Minuto.length).toBeGreaterThan(0);
        expect(s.praticaGuiada.length).toBeGreaterThanOrEqual(3);
        expect(s.praticaGuiada.length).toBeLessThanOrEqual(5);
        expect(s.leveComVoce.length).toBeGreaterThan(0);
        expect(s.leveComVoce).not.toMatch(/Conteúdo a ser adicionado/i);
        expect(s.fontesCientificas.length).toBeGreaterThanOrEqual(1);
      })
    );
  });

  it('duração entre 5 e 8 minutos em todas as sessões', () => {
    JORNADAS.forEach((j) =>
      listarSessoesEmOrdem(j).forEach((s) => {
        expect(s.duracaoMinutos).toBeGreaterThanOrEqual(5);
        expect(s.duracaoMinutos).toBeLessThanOrEqual(8);
      })
    );
  });

  it('toda fonte citada existe em REFERENCIAS', () => {
    JORNADAS.forEach((j) =>
      listarSessoesEmOrdem(j).forEach((s) => {
        s.fontesCientificas.forEach((id) => {
          expect(REFERENCIAS[id]).toBeDefined();
        });
      })
    );
  });

  it('todas as sessões começam com revisão pendente e sem revisor', () => {
    JORNADAS.forEach((j) =>
      listarSessoesEmOrdem(j).forEach((s) => {
        expect(s.revisaoStatus).toBe('pendente');
        expect(s.revisadoPor).toBeUndefined();
        expect(s.revisadoEm).toBeUndefined();
      })
    );
  });

  it('nenhuma linguagem proibida de dieta/peso na jornada de alimentação emocional', () => {
    const jornada = JORNADAS.find((j) => j.slug === 'alimentacao-emocional')!;
    listarSessoesEmOrdem(jornada).forEach((s) => {
      const texto = [s.entendaEm1Minuto, ...s.praticaGuiada, s.reflexao ?? '', s.leveComVoce].join(' ');
      expect(texto).not.toMatch(PROIBIDAS_ALIMENTACAO);
    });
  });

  it('sessões sensíveis de alimentação emocional têm aviso de segurança', () => {
    const jornada = JORNADAS.find((j) => j.slug === 'alimentacao-emocional')!;
    const sensiveis = listarSessoesEmOrdem(jornada).filter((s) =>
      /perda de controle|restri(ç|c)ão|vômito|laxante|desmaio|compensa/i.test(
        [s.titulo, s.entendaEm1Minuto].join(' ')
      )
    );
    expect(sensiveis.length).toBeGreaterThan(0);
    sensiveis.forEach((s) => expect(s.avisoSeguranca).toBeTruthy());
  });

  it('buscarSessaoPorId encontra a primeira e a última sessão de cada jornada', () => {
    JORNADAS.forEach((j) => {
      const sessoes = listarSessoesEmOrdem(j);
      expect(buscarSessaoPorId(j.slug, sessoes[0].id)?.sessao.id).toBe(sessoes[0].id);
      expect(buscarSessaoPorId(j.slug, sessoes[sessoes.length - 1].id)?.sessao.id).toBe(
        sessoes[sessoes.length - 1].id
      );
    });
  });

  it('buscarSessaoEmQualquerJornada encontra uma sessão sem precisar do slug da jornada', () => {
    const jornada = JORNADAS[0];
    const sessoes = listarSessoesEmOrdem(jornada);
    const encontrada = buscarSessaoEmQualquerJornada(sessoes[0].id);
    expect(encontrada?.jornada.slug).toBe(jornada.slug);
    expect(encontrada?.sessao.id).toBe(sessoes[0].id);
  });

  it('buscarSessaoEmQualquerJornada retorna undefined para um id inexistente', () => {
    expect(buscarSessaoEmQualquerJornada('id-que-nao-existe')).toBeUndefined();
  });
});
