export type Plano = 'free' | 'premium';
export type StatusPratica = 'rascunho' | 'revisada' | 'publicada';
export type TipoPratica = 'respiracao' | 'reflexao' | 'afirmacao' | 'movimento';
export type FaixaEtaria = '18-24' | '25-34' | '35-44' | '45-54' | '55+';

export type Perfil = {
  id: string;
  nome: string | null;
  plano: Plano;
  pais: string;
  horario_preferido_notificacao: string | null;
  consentimento_dados_sensiveis_em: string | null;
  criado_em: string;
  frase_pessoal: string | null;
  faixa_etaria: FaixaEtaria | null;
  fuso_horario: string;
  idioma: string;
};

export type EstadoGeral =
  | 'alta_energia_desconforto'
  | 'alta_energia_conforto'
  | 'baixa_energia_desconforto'
  | 'baixa_energia_conforto';

export type AlimentacaoPercebida =
  | 'tranquila'
  | 'satisfeita'
  | 'indiferente'
  | 'confusa'
  | 'ansiosa'
  | 'culpada'
  | 'vontade_punir'
  | 'prefiro_nao_responder';

export type ProximaAcaoEscolhida = 'guardar' | 'entender' | 'pratica_rapida';

export type Checkin = {
  id: string;
  usuaria_id: string;
  data: string; // YYYY-MM-DD
  humor: number;
  imagem_corporal: number;
  comida: number | null;
  texto_livre: string | null;
  sinal_seguranca: boolean;
  estado_geral: EstadoGeral | null;
  emocao_especifica: string | null;
  intensidade: number | null;
  alimentacao_percebida: AlimentacaoPercebida | null;
  gatilho_local: string | null;
  gatilho_pensamento: string | null;
  gatilho_emocao_depois: string | null;
  fatores: string[] | null;
  proxima_acao: ProximaAcaoEscolhida | null;
  criado_em: string;
};

export type CheckinResumo = Pick<Checkin, 'id' | 'data' | 'humor' | 'imagem_corporal' | 'comida'>;

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
  pratica_id: string | null;
  jornada_atividade_id: string | null;
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

export type AcessoAdministrativo = {
  id: string;
  usuaria_id: string;
  acessado_por: string;
  motivo: string;
  criado_em: string;
};

export type StatusJornada = 'rascunho' | 'revisada' | 'publicada';
export type StatusJornadaUsuaria = 'em_andamento' | 'pausada' | 'concluida';

export type Jornada = {
  id: string;
  titulo: string;
  descricao: string;
  duracao_dias: number;
  status: StatusJornada;
  criado_em: string;
};

export type JornadaAtividade = {
  id: string;
  jornada_id: string;
  numero_dia: number;
  titulo: string;
  conteudo: string;
  criado_em: string;
};

export type JornadaUsuaria = {
  id: string;
  usuaria_id: string;
  jornada_id: string;
  dias_completados: number;
  status: StatusJornadaUsuaria;
  iniciada_em: string;
  atualizada_em: string;
  concluida_em: string | null;
};

export type TipoEventoPetalas =
  | 'checkin_diario'
  | 'pratica_primeira_conclusao'
  | 'sessao_jornada_primeira_conclusao'
  | 'jornada_completa'
  | 'desafio_semanal'
  | 'resgate_recompensa';

export type CarteiraPetalas = {
  usuaria_id: string;
  saldo: number;
  atualizada_em: string;
};

export type TransacaoPetalas = {
  id: string;
  usuaria_id: string;
  tipo_evento: TipoEventoPetalas;
  referencia_id: string;
  quantidade: number;
  saldo_resultante: number;
  criado_em: string;
};

export type ResgateDesafioSemanal = {
  id: string;
  usuaria_id: string;
  semana_inicio: string; // YYYY-MM-DD
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
      acessos_administrativos: { Row: AcessoAdministrativo; Insert: Omit<AcessoAdministrativo, 'id' | 'criado_em'>; Update: Partial<AcessoAdministrativo>; Relationships: [] };
      jornadas: { Row: Jornada; Insert: Partial<Jornada>; Update: Partial<Jornada>; Relationships: [] };
      jornada_atividades: { Row: JornadaAtividade; Insert: Omit<JornadaAtividade, 'id' | 'criado_em'>; Update: Partial<JornadaAtividade>; Relationships: [] };
      jornadas_usuarias: {
        Row: JornadaUsuaria;
        Insert: Pick<JornadaUsuaria, 'usuaria_id' | 'jornada_id'> & Partial<Omit<JornadaUsuaria, 'usuaria_id' | 'jornada_id'>>;
        Update: Partial<JornadaUsuaria>;
        Relationships: [];
      };
      carteiras_petalas: {
        Row: CarteiraPetalas;
        Insert: Pick<CarteiraPetalas, 'usuaria_id'> & Partial<Omit<CarteiraPetalas, 'usuaria_id'>>;
        Update: Partial<CarteiraPetalas>;
        Relationships: [];
      };
      transacoes_petalas: {
        Row: TransacaoPetalas;
        Insert: Omit<TransacaoPetalas, 'id' | 'criado_em'>;
        Update: Partial<TransacaoPetalas>;
        Relationships: [];
      };
      resgates_desafio_semanal: {
        Row: ResgateDesafioSemanal;
        Insert: Omit<ResgateDesafioSemanal, 'id' | 'criado_em'>;
        Update: Partial<ResgateDesafioSemanal>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      conceder_petalas: {
        Args: {
          p_usuaria_id: string;
          p_tipo_evento: TipoEventoPetalas;
          p_referencia_id: string;
          p_quantidade: number;
        };
        Returns: { concedido: boolean; saldo: number }[];
      };
    };
  };
}
