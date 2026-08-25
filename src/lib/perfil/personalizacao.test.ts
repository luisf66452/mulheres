import { describe, it, expect } from 'vitest';
import {
  OBJETIVOS,
  OBJETIVO_IDS,
  OBJETIVO_SENTINELA,
  normalizarObjetivosParaGravar,
  validarObjetivos,
  TEMAS_SENSIVEIS,
  TEMA_SENSIVEL_IDS,
  TEMA_SENSIVEL_SENTINELA_SKIP,
  TEMA_SENSIVEL_EXCLUSIVOS,
  normalizarTemasParaGravar,
  validarTemasSensiveis,
} from './personalizacao';

describe('personalizacao — objetivos', () => {
  it('tem exatamente as 7 opções do enunciado, na ordem, com "prefiro decidir depois" por último', () => {
    expect(OBJETIVOS.map((o) => o.rotulo)).toEqual([
      'Fortalecer minha autoestima',
      'Cuidar da minha relação com o corpo',
      'Ter uma relação mais tranquila com a comida',
      'Praticar autocompaixão',
      'Lidar melhor com a comparação',
      'Criar um ritual diário de cuidado',
      'Prefiro decidir depois',
    ]);
    expect(OBJETIVO_SENTINELA).toBe('decidir_depois');
    expect(OBJETIVO_IDS).toContain(OBJETIVO_SENTINELA);
  });

  it('validarObjetivos aceita só ids da lista fechada', () => {
    expect(validarObjetivos(['fortalecer_autoestima', 'criar_ritual_diario'])).toBe(true);
    expect(validarObjetivos(['fortalecer_autoestima', 'qualquer-coisa'])).toBe(false);
    expect(validarObjetivos([])).toBe(true);
  });

  it('normalizarObjetivosParaGravar remove o sentinela e mantém o resto', () => {
    expect(normalizarObjetivosParaGravar(['fortalecer_autoestima', 'criar_ritual_diario'])).toEqual([
      'fortalecer_autoestima',
      'criar_ritual_diario',
    ]);
  });

  it('normalizarObjetivosParaGravar grava array vazio quando o sentinela foi escolhido, mesmo junto com outros', () => {
    expect(normalizarObjetivosParaGravar(['fortalecer_autoestima', 'decidir_depois'])).toEqual([]);
    expect(normalizarObjetivosParaGravar(['decidir_depois'])).toEqual([]);
    expect(normalizarObjetivosParaGravar([])).toEqual([]);
  });
});

describe('personalizacao — temas sensíveis', () => {
  it('tem exatamente as 6 opções do enunciado, na ordem', () => {
    expect(TEMAS_SENSIVEIS.map((t) => t.rotulo)).toEqual([
      'Corpo e aparência',
      'Alimentação',
      'Comparação',
      'Autocrítica',
      'Nenhum desses',
      'Prefiro não responder',
    ]);
    expect(TEMA_SENSIVEL_SENTINELA_SKIP).toBe('prefiro_nao_responder');
    expect(TEMA_SENSIVEL_EXCLUSIVOS).toEqual(['nenhum_desses', 'prefiro_nao_responder']);
  });

  it('validarTemasSensiveis aceita só ids da lista fechada', () => {
    expect(validarTemasSensiveis(['corpo_aparencia', 'nenhum_desses'])).toBe(true);
    expect(validarTemasSensiveis(['corpo_aparencia', 'outro'])).toBe(false);
  });

  it('normalizarTemasParaGravar mantém "nenhum desses" no array — não é um sentinela de pular', () => {
    expect(normalizarTemasParaGravar(['nenhum_desses'])).toEqual(['nenhum_desses']);
  });

  it('normalizarTemasParaGravar grava array vazio quando "prefiro não responder" foi escolhido', () => {
    expect(normalizarTemasParaGravar(['prefiro_nao_responder'])).toEqual([]);
    expect(normalizarTemasParaGravar(['corpo_aparencia', 'prefiro_nao_responder'])).toEqual([]);
  });

  it('normalizarTemasParaGravar mantém seleção normal intacta', () => {
    expect(normalizarTemasParaGravar(['corpo_aparencia', 'comparacao'])).toEqual(['corpo_aparencia', 'comparacao']);
  });
});
