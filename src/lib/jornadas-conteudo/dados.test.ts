import { describe, it, expect } from 'vitest';
import { JORNADAS, contarModulos, contarSessoes, listarSessoesEmOrdem } from './dados';
import { REFERENCIAS_CIENTIFICAS } from './referencias';

const TODAS_SESSOES = JORNADAS.flatMap((jornada) => listarSessoesEmOrdem(jornada));
const TOTAL_MODULOS = JORNADAS.reduce((total, jornada) => total + contarModulos(jornada), 0);
const TOTAL_SESSOES = JORNADAS.reduce((total, jornada) => total + contarSessoes(jornada), 0);

describe('estrutura das jornadas', () => {
  it('tem exatamente 4 jornadas', () => {
    expect(JORNADAS).toHaveLength(4);
  });

  it('tem exatamente 26 módulos no total', () => {
    expect(TOTAL_MODULOS).toBe(26);
  });

  it('tem exatamente 83 sessões no total', () => {
    expect(TOTAL_SESSOES).toBe(83);
    expect(TODAS_SESSOES).toHaveLength(83);
  });

  it('tem a contagem correta de módulos e sessões por jornada', () => {
    const resumo = JORNADAS.map((j) => ({
      slug: j.slug,
      modulos: contarModulos(j),
      sessoes: contarSessoes(j),
    }));
    expect(resumo).toEqual([
      { slug: 'imagem-corporal', modulos: 6, sessoes: 24 },
      { slug: 'autocompaixao', modulos: 7, sessoes: 21 },
      { slug: 'comparacao', modulos: 6, sessoes: 18 },
      { slug: 'alimentacao-emocional', modulos: 7, sessoes: 20 },
    ]);
  });

  it('não tem nenhum id de jornada, módulo ou sessão duplicado', () => {
    const idsJornadas = JORNADAS.map((j) => j.id);
    expect(new Set(idsJornadas).size).toBe(idsJornadas.length);

    const idsModulos = JORNADAS.flatMap((j) => j.modulos.map((m) => m.id));
    expect(new Set(idsModulos).size).toBe(idsModulos.length);

    const idsSessoes = TODAS_SESSOES.map((s) => s.id);
    expect(new Set(idsSessoes).size).toBe(idsSessoes.length);
  });
});

describe('conteúdo de cada sessão', () => {
  it('nenhuma sessão tem título, descrição, duração ou conteúdo vazio/ausente', () => {
    for (const sessao of TODAS_SESSOES) {
      expect(sessao.titulo.trim().length, `sessão ${sessao.id} sem título`).toBeGreaterThan(0);
      expect(sessao.descricaoCurta.trim().length, `sessão ${sessao.id} sem descrição`).toBeGreaterThan(0);
      expect(sessao.duracaoMinutos, `sessão ${sessao.id} sem duração`).not.toBeNull();
      expect(sessao.entendaEm1Minuto.trim().length, `sessão ${sessao.id} sem "entenda em 1 minuto"`).toBeGreaterThan(0);
      expect(sessao.praticaGuiada.length, `sessão ${sessao.id} sem prática guiada`).toBeGreaterThan(0);
      expect(sessao.leveComVoce.trim().length, `sessão ${sessao.id} sem fechamento`).toBeGreaterThan(0);
    }
  });

  it('nenhuma sessão tem duração fora da faixa de 5 a 8 minutos', () => {
    for (const sessao of TODAS_SESSOES) {
      expect(sessao.duracaoMinutos, sessao.id).toBeGreaterThanOrEqual(5);
      expect(sessao.duracaoMinutos, sessao.id).toBeLessThanOrEqual(8);
    }
  });

  it('nenhuma sessão contém o texto genérico "Conteúdo a ser adicionado"', () => {
    for (const sessao of TODAS_SESSOES) {
      const textoCompleto = JSON.stringify(sessao);
      expect(textoCompleto).not.toMatch(/conte[uú]do a ser adicionado/i);
    }
  });

  it('nenhuma sessão tem título genérico do tipo "Sessão N"', () => {
    for (const sessao of TODAS_SESSOES) {
      expect(sessao.titulo).not.toMatch(/^Sessão \d+$/i);
    }
  });

  it('todas as sessões têm ao menos uma referência científica válida (E1-E10)', () => {
    for (const sessao of TODAS_SESSOES) {
      expect(sessao.fontesCientificas.length, `sessão ${sessao.id} sem fonte científica`).toBeGreaterThan(0);
      for (const idReferencia of sessao.fontesCientificas) {
        expect(REFERENCIAS_CIENTIFICAS[idReferencia], `${sessao.id} referencia ${idReferencia} inexistente`).toBeDefined();
      }
    }
  });

  it('todas as sessões estão marcadas como revisaoStatus pendente (nenhuma revisão humana real ainda aconteceu)', () => {
    for (const sessao of TODAS_SESSOES) {
      expect(sessao.revisaoStatus, sessao.id).toBe('pendente');
      expect(sessao.revisadoPor, sessao.id).toBeUndefined();
      expect(sessao.revisadoEm, sessao.id).toBeUndefined();
    }
  });

  it('sessões sobre restrição/compulsão/compensação alimentar têm aviso de segurança', () => {
    const sessoesComTemaSensivel = [
      'alimentacao-emocional-m3-s3',
      'alimentacao-emocional-m4-s3',
      'alimentacao-emocional-m5-s1',
      'alimentacao-emocional-m5-s2',
      'alimentacao-emocional-m5-s3',
      'alimentacao-emocional-m7-s2',
    ];
    for (const id of sessoesComTemaSensivel) {
      const sessao = TODAS_SESSOES.find((s) => s.id === id);
      expect(sessao, id).toBeDefined();
      expect(sessao?.avisoSeguranca?.trim().length ?? 0, id).toBeGreaterThan(0);
    }
  });

  it('a sessão de observação corporal opcional (imagem-corporal-m4-s4) tem aviso de segurança explícito', () => {
    const sessao = TODAS_SESSOES.find((s) => s.id === 'imagem-corporal-m4-s4');
    expect(sessao?.avisoSeguranca?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it('nenhum texto de sessão usa linguagem de dieta/peso proibida (calorias, IMC, peso, jejum, "comida boa/ruim")', () => {
    const termosProibidos = [
      /\bcaloria/i,
      /\bimc\b/i,
      /\bpeso ideal\b/i,
      /\bemagrec/i,
      /\bcomida (boa|ruim|limpa)\b/i,
      /\bjejum prolongado\b(?!.{0,40}(procure|profissional|orienta))/i,
    ];
    for (const sessao of TODAS_SESSOES) {
      const textoCompleto = [
        sessao.titulo,
        sessao.descricaoCurta,
        sessao.entendaEm1Minuto,
        ...sessao.praticaGuiada,
        sessao.reflexao ?? '',
        sessao.leveComVoce,
      ].join(' \n ');
      for (const termo of termosProibidos) {
        expect(textoCompleto, `${sessao.id} contém termo proibido ${termo}`).not.toMatch(termo);
      }
    }
  });
});
