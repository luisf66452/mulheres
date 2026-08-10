export type Plano = 'free' | 'premium';
export type StatusPratica = 'rascunho' | 'revisada' | 'publicada';
export type TipoPratica = 'respiracao' | 'reflexao' | 'afirmacao' | 'movimento';

export type Perfil = {
  id: string;
  plano: Plano;
  pais: string;
  horario_preferido_notificacao: string | null;
  consentimento_dados_sensiveis_em: string | null;
  criado_em: string;
};

export type Checkin = {
  id: string;
  usuaria_id: string;
  data: string; // YYYY-MM-DD
  humor: number;
  imagem_corporal: number;
  comida: number;
  texto_livre: string | null;
  sinal_seguranca: boolean;
  criado_em: string;
};

export type Pratica = {
  id: string;
  categoria: string;
  tipo: TipoPratica;
  titulo: string;
  conteudo: string;
  status: StatusPratica;
  criado_em: string;
};

export type RegraRecomendacao = {
  id: string;
  humor_min: number;
  humor_max: number;
  imagem_corporal_min: number;
  imagem_corporal_max: number;
  comida_min: number;
  comida_max: number;
  eh_sinal_seguranca: boolean;
  categoria_pratica: string | null;
  prioridade: number;
  ativa: boolean;
};

export type Sessao = {
  id: string;
  checkin_id: string;
  usuaria_id: string;
  pratica_id: string;
  sensacao_antes: number | null;
  sensacao_depois: number | null;
  criado_em: string;
};

export type RecursoSeguranca = {
  id: string;
  pais: string;
  titulo: string;
  corpo: string;
  ordem: number;
};

export type IntencaoPagamento = {
  id: string;
  usuaria_id: string;
  plano_escolhido: string;
  preco_hipotetico: number | null;
  criado_em: string;
};

export type PushSubscriptionRow = {
  id: string;
  usuaria_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  criado_em: string;
};

export interface Database {
  public: {
    Tables: {
      perfis: { Row: Perfil; Insert: Partial<Perfil> & { id: string }; Update: Partial<Perfil>; Relationships: [] };
      checkins: { Row: Checkin; Insert: Omit<Checkin, 'id' | 'criado_em'>; Update: Partial<Checkin>; Relationships: [] };
      praticas: { Row: Pratica; Insert: Partial<Pratica>; Update: Partial<Pratica>; Relationships: [] };
      regras_recomendacao: { Row: RegraRecomendacao; Insert: Partial<RegraRecomendacao>; Update: Partial<RegraRecomendacao>; Relationships: [] };
      sessoes: { Row: Sessao; Insert: Omit<Sessao, 'id' | 'criado_em'>; Update: Partial<Sessao>; Relationships: [] };
      recursos_seguranca: { Row: RecursoSeguranca; Insert: Partial<RecursoSeguranca>; Update: Partial<RecursoSeguranca>; Relationships: [] };
      intencao_pagamento: { Row: IntencaoPagamento; Insert: Omit<IntencaoPagamento, 'id' | 'criado_em'>; Update: Partial<IntencaoPagamento>; Relationships: [] };
      push_subscriptions: { Row: PushSubscriptionRow; Insert: Omit<PushSubscriptionRow, 'id' | 'criado_em'>; Update: Partial<PushSubscriptionRow>; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
