import { describe, it, expect } from 'vitest';
import { escolherFeedback } from './avaliarFeedback';

const moduloBase = {
  feedback: {
    padrao: 'Obrigada por compartilhar. Cada passo de observação já é um passo de cuidado.',
    regras: [
      {
        id: 'intensidade-alta',
        condicoes: [{ campoId: 'intensidade', operador: 'maior_ou_igual' as const, valor: 8 }],
        texto: 'Essa intensidade alta faz sentido diante do que você descreveu.',
      },
      {
        id: 'emocao-raiva',
        condicoes: [{ campoId: 'emocao', operador: 'igual' as const, valor: 'raiva' }],
        texto: 'A raiva costuma aparecer quando um limite importante foi ultrapassado.',
      },
      {
        id: 'combinada',
        condicoes: [
          { campoId: 'emocao', operador: 'igual' as const, valor: 'medo' },
          { campoId: 'intensidade', operador: 'maior_ou_igual' as const, valor: 5 },
        ],
        texto: 'Medo intenso é o corpo tentando te proteger de algo que parece ameaçador.',
      },
    ],
  },
};

describe('escolherFeedback', () => {
  it('retorna o texto padrão quando nenhuma regra bate', () => {
    const texto = escolherFeedback(moduloBase, { intensidade: 2, emocao: 'tristeza' });
    expect(texto).toBe(moduloBase.feedback.padrao);
  });

  it('retorna a primeira regra cuja condição única bate', () => {
    const texto = escolherFeedback(moduloBase, { intensidade: 9, emocao: 'tristeza' });
    expect(texto).toBe('Essa intensidade alta faz sentido diante do que você descreveu.');
  });

  it('respeita a ordem das regras quando mais de uma poderia bater', () => {
    const texto = escolherFeedback(moduloBase, { intensidade: 9, emocao: 'raiva' });
    expect(texto).toBe('Essa intensidade alta faz sentido diante do que você descreveu.');
  });

  it('exige todas as condições (AND) de uma regra combinada', () => {
    expect(escolherFeedback(moduloBase, { emocao: 'medo', intensidade: 2 })).toBe(moduloBase.feedback.padrao);
    expect(escolherFeedback(moduloBase, { emocao: 'medo', intensidade: 6 })).toBe(
      'Medo intenso é o corpo tentando te proteger de algo que parece ameaçador.'
    );
  });

  it('operador "preenchido" trata string vazia e array vazio como não preenchido', () => {
    const modulo = {
      feedback: {
        padrao: 'padrao',
        regras: [
          { id: 'r1', condicoes: [{ campoId: 'necessidade', operador: 'preenchido' as const }], texto: 'preencheu' },
        ],
      },
    };
    expect(escolherFeedback(modulo, { necessidade: '' })).toBe('padrao');
    expect(escolherFeedback(modulo, { necessidade: [] })).toBe('padrao');
    expect(escolherFeedback(modulo, { necessidade: 'descanso' })).toBe('preencheu');
  });
});
