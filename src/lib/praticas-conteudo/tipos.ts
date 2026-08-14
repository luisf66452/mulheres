// Modelo de conteúdo das práticas rápidas (Respiração, Diário guiado,
// Meditação, Autocompaixão). Desacoplado do Supabase de propósito: quando
// existir conteúdo real no Supabase (vídeo/áudio/textos variados), só
// `dados.ts` precisa ser trocado por uma consulta — nenhum componente que
// consome `PraticaRapida` muda.

export type CategoriaPratica = 'respiracao' | 'diario' | 'meditacao' | 'autocompaixao';
export type CorCartaoPratica = 'salvia' | 'pessego' | 'lilas' | 'rosa';
export type NivelDificuldade = 'iniciante' | 'intermediario' | 'avancado';

export interface MidiaPratica {
  tipo: 'audio' | 'video' | 'imagem' | null;
  url: string | null;
  miniaturaUrl: string | null;
}

export interface PraticaRapida {
  id: string;
  categoria: CategoriaPratica;
  titulo: string;
  descricaoCurta: string;
  duracaoMinutos: number;
  duracaoLabel: string;
  corCartao: CorCartaoPratica;
  nivel: NivelDificuldade;
  premium: boolean;
  gratuita: boolean;
  midia: MidiaPratica;
}
