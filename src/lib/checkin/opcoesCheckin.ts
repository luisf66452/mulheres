import type { EstadoGeral } from '@/lib/supabase/types';

// Listas fechadas de emoção específica e fatores oferecidas na UI de
// check-in (src/app/checkin/CheckinFormClient.tsx). Extraídas para cá para
// que outros módulos (ex. src/lib/progress/resumoSemanal.ts) possam validar
// contra os mesmos valores fechados sem duplicá-los — em especial para nunca
// tratar como "tema em destaque" um valor de texto livre (ex. o campo
// "outro fator" do check-in), que não passa por nenhuma lista fechada.
export const EMOCOES_POR_QUADRANTE: Record<EstadoGeral, { palavra: string; explicacao: string }[]> = {
  alta_energia_desconforto: [
    { palavra: 'Ansiosa', explicacao: 'Uma sensação de alerta ou preocupação com o que pode vir.' },
    { palavra: 'Apreensiva', explicacao: 'Um receio sobre algo que ainda não aconteceu.' },
    { palavra: 'Assustada', explicacao: 'Uma reação forte a algo que pareceu ameaçador.' },
    { palavra: 'Sobrecarregada', explicacao: 'A sensação de ter mais do que dá conta agora.' },
    { palavra: 'Irritada', explicacao: 'Um incômodo que pede espaço.' },
    { palavra: 'Frustrada', explicacao: 'Quando algo não saiu como você esperava.' },
  ],
  baixa_energia_desconforto: [
    { palavra: 'Insegura', explicacao: 'Uma dúvida sobre si mesma ou sobre a situação.' },
    { palavra: 'Decepcionada', explicacao: 'Quando a realidade ficou aquém do que você esperava.' },
    { palavra: 'Triste', explicacao: 'Uma sensação de perda ou vazio.' },
    { palavra: 'Solitária', explicacao: 'A sensação de estar sozinha, mesmo que não esteja.' },
    { palavra: 'Cansada', explicacao: 'Pouca energia para continuar agora.' },
    { palavra: 'Desanimada', explicacao: 'Falta de ânimo para seguir em frente.' },
  ],
  baixa_energia_conforto: [
    { palavra: 'Tranquila', explicacao: 'Uma sensação de paz, sem pressa.' },
    { palavra: 'Aliviada', explicacao: 'Quando um peso parece ter diminuído.' },
    { palavra: 'Esperançosa', explicacao: 'Uma expectativa gentil de que as coisas podem melhorar.' },
  ],
  alta_energia_conforto: [
    { palavra: 'Animada', explicacao: 'Energia boa, com vontade de agir.' },
    { palavra: 'Inspirada', explicacao: 'Uma ideia ou vontade que te move.' },
    { palavra: 'Confiante', explicacao: 'Uma sensação de segurança em si mesma.' },
  ],
};

export const FATORES_DISPONIVEIS = [
  'Sono', 'Redes sociais', 'Estudos', 'Trabalho', 'Exercício', 'Ciclo menstrual',
  'Comentários sobre aparência', 'Relacionamento', 'Família', 'Alimentação',
  'Situação social', 'Fotografia', 'Roupa', 'Espelho',
];
