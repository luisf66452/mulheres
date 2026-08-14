// Dados fixos e centralizados das 4 práticas rápidas. Quando o conteúdo
// real existir no Supabase, esta é a única peça que precisa ser trocada
// por uma consulta — os componentes consomem só os tipos de `./tipos`,
// nunca este array diretamente por nome.
import type { PraticaRapida } from './tipos';

export const PRATICAS_RAPIDAS: PraticaRapida[] = [
  {
    id: 'respiracao',
    categoria: 'respiracao',
    titulo: 'Respiração',
    descricaoCurta: 'Respire fundo e reconecte-se.',
    duracaoMinutos: 3,
    duracaoLabel: '3 min',
    corCartao: 'salvia',
    nivel: 'iniciante',
    premium: false,
    gratuita: true,
    midia: { tipo: null, url: null, miniaturaUrl: null },
  },
  {
    id: 'diario-guiado',
    categoria: 'diario',
    titulo: 'Diário guiado',
    descricaoCurta: 'Escreva, sinta e se conheça melhor.',
    duracaoMinutos: 5,
    duracaoLabel: '5 min',
    corCartao: 'pessego',
    nivel: 'iniciante',
    premium: false,
    gratuita: true,
    midia: { tipo: null, url: null, miniaturaUrl: null },
  },
  {
    id: 'meditacao',
    categoria: 'meditacao',
    titulo: 'Meditação',
    descricaoCurta: 'Acalme a mente e encontre presença.',
    duracaoMinutos: 8,
    duracaoLabel: '8 min',
    corCartao: 'lilas',
    nivel: 'iniciante',
    premium: false,
    gratuita: true,
    // >>> Adicionar aqui a URL do áudio guiado real (Supabase Storage/CDN) quando existir. <<<
    midia: { tipo: null, url: null, miniaturaUrl: null },
  },
  {
    id: 'autocompaixao',
    categoria: 'autocompaixao',
    titulo: 'Exercício de autocompaixão',
    descricaoCurta: 'Pratique gentileza e cuidado consigo.',
    duracaoMinutos: 5,
    duracaoLabel: '5 min',
    corCartao: 'rosa',
    nivel: 'iniciante',
    premium: false,
    gratuita: true,
    midia: { tipo: null, url: null, miniaturaUrl: null },
  },
];

export function obterPraticaPorId(id: string): PraticaRapida | undefined {
  return PRATICAS_RAPIDAS.find((pratica) => pratica.id === id);
}
