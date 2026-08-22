export type Plano = 'free' | 'premium';
export type PapelUsuaria = 'usuaria' | 'admin';
export type StatusPratica = 'rascunho' | 'revisada' | 'publicada';
export type TipoPratica = 'respiracao' | 'reflexao' | 'afirmacao' | 'movimento';
export type FaixaEtaria = '18-24' | '25-34' | '35-44' | '45-54' | '55+';

export type Perfil = {
  id: string;
  nome: string | null;
  plano: Plano;
  // Só gravável pela service role (ver migração 0016) — nenhuma usuária
  // consegue se autopromover a admin através do client.
  role: PapelUsuaria;
  pais: string;
  horario_preferido_notificacao: string | null;
  consentimento_dados_sensiveis_em: string | null;
  // Nulo até a usuária confirmar explicitamente o próprio país (ver
  // onboarding e proxy.ts) — nunca inferido nem alterado silenciosamente.
  pais_confirmado_em: string | null;
  criado_em: string;
  frase_pessoal: string | null;
  faixa_etaria: FaixaEtaria | null;
  fuso_horario: string;
  idioma: string;
  foto_url: string | null;
  // Preenchidos só pelo webhook do Stripe (service role) — ver migração 0019.
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  assinatura_status: string | null;
  assinatura_periodo_fim: string | null;
};

export type PreferenciasNotificacao = {
  usuaria_id: string;
  lembrete_checkin: boolean;
  lembrete_jornada: boolean;
  lembrete_praticas: boolean;
  avisos_novidades: boolean;
  resumo_semanal: boolean;
  lembrete_inatividade: boolean;
  // 'HH:MM:SS', sempre hora local da usuária — mesma convenção de
  // perfis.horario_preferido_notificacao.
  horario_silencio_inicio: string;
  horario_silencio_fim: string;
  // Data (YYYY-MM-DD, fuso da usuária) até a qual nenhum lembrete deve sair.
  // Null = não pausada.
  pausada_ate: string | null;
  dias_semana: number[];
  atualizada_em: string;
};

export type StripeEventoProcessado = {
  id: string;
  tipo: string;
  processado_em: string;
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
  user_agent: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type CategoriaPushNotificacao =
  | 'sessao_abandonada'
  | 'sessao_disponivel'
  | 'praticas_pendente'
  | 'inatividade'
  | 'continuidade';

export type StatusPushNotificacao = 'pendente' | 'processando' | 'enviada' | 'cancelada' | 'falha';

export type PushNotificacao = {
  id: string;
  usuaria_id: string;
  categoria: CategoriaPushNotificacao;
  dedup_key: string;
  titulo: string | null;
  corpo: string | null;
  url: string | null;
  tag: string | null;
  status: StatusPushNotificacao;
  tentativas: number;
  agendado_para: string;
  enviado_em: string | null;
  criado_em: string;
};

export type PushEnvio = {
  id: string;
  usuaria_id: string;
  tipo: 'checkin' | 'jornada' | 'praticas' | 'resumo_semanal' | 'teste';
  data_local: string;
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
  // Conteúdo estruturado de um módulo psicoeducativo (ver
  // src/lib/jornadas-modulos/tipos.ts). Nulo nas atividades antigas, que
  // continuam usando só `conteudo` texto — ver AntesDepoisAtividade.
  conteudo_estruturado: unknown | null;
  schema_version: number | null;
  criado_em: string;
};

export type JornadaRespostaModulo = {
  id: string;
  user_id: string;
  jornada_usuario_id: string;
  atividade_id: string;
  sessao_id: string | null;
  schema_version: number;
  // RespostaModuloV1 (ver src/lib/jornadas-modulos/tipos.ts), armazenado como
  // jsonb — pode conter dados psicológicos sensíveis, nunca logar o conteúdo.
  respostas: unknown;
  created_at: string;
  updated_at: string;
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
  | 'resgate_recompensa'
  | 'estorno_resgate';

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

export type StatusResgateRecompensa =
  | 'solicitado'
  | 'em_analise'
  | 'aprovado'
  | 'entregue'
  | 'recusado'
  | 'cancelado';

export type ResgateRecompensa = {
  id: string;
  usuaria_id: string;
  recompensa_chave: string;
  criado_em: string;
  status: StatusResgateRecompensa;
  observacao_admin: string | null;
  revisado_por: string | null;
  revisado_em: string | null;
  atualizada_em: string;
};

export type TipoRecompensa = 'digital' | 'personalizacao' | 'conteudo' | 'experiencia' | 'futura';
export type StatusRecompensaCatalogo = 'ativa' | 'pausada' | 'futura';

export type ConclusaoPraticaConteudo = {
  id: string;
  usuaria_id: string;
  pratica_id: string;
  concluida_em: string;
  duracao_minutos: number;
};

export type SessaoJornadaConteudoProgresso = {
  id: string;
  usuaria_id: string;
  jornada_slug: string;
  sessao_id: string;
  iniciada_em: string;
  concluida_em: string | null;
};

export type RecompensaCatalogo = {
  chave: string;
  nome: string;
  descricao: string;
  mensagem: string;
  tipo: TipoRecompensa;
  custo: number;
  requer_premium: boolean;
  tem_valor_financeiro: boolean;
  estoque: number | null;
  status: StatusRecompensaCatalogo;
  criado_em: string;
  atualizada_em: string;
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
      jornada_respostas_modulo: {
        Row: JornadaRespostaModulo;
        Insert: Omit<JornadaRespostaModulo, 'id' | 'created_at' | 'updated_at' | 'sessao_id'> &
          Partial<Pick<JornadaRespostaModulo, 'sessao_id'>>;
        Update: Partial<Omit<JornadaRespostaModulo, 'id' | 'user_id' | 'jornada_usuario_id' | 'atividade_id'>>;
        Relationships: [];
      };
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
      resgates_recompensas: {
        Row: ResgateRecompensa;
        Insert: Omit<ResgateRecompensa, 'id' | 'criado_em'>;
        Update: Partial<ResgateRecompensa>;
        Relationships: [];
      };
      recompensas_catalogo: {
        Row: RecompensaCatalogo;
        Insert: Partial<RecompensaCatalogo> & { chave: string };
        Update: Partial<RecompensaCatalogo>;
        Relationships: [];
      };
      conclusoes_praticas_conteudo: {
        Row: ConclusaoPraticaConteudo;
        Insert: Omit<ConclusaoPraticaConteudo, 'id'> & { id?: string };
        Update: Partial<ConclusaoPraticaConteudo>;
        Relationships: [];
      };
      stripe_eventos_processados: {
        Row: StripeEventoProcessado;
        Insert: Omit<StripeEventoProcessado, 'processado_em'> & { processado_em?: string };
        Update: Partial<StripeEventoProcessado>;
        Relationships: [];
      };
      preferencias_notificacoes: {
        Row: PreferenciasNotificacao;
        Insert: Pick<PreferenciasNotificacao, 'usuaria_id'> & Partial<Omit<PreferenciasNotificacao, 'usuaria_id'>>;
        Update: Partial<PreferenciasNotificacao>;
        Relationships: [];
      };
      sessoes_jornadas_conteudo_progresso: {
        Row: SessaoJornadaConteudoProgresso;
        Insert: Omit<SessaoJornadaConteudoProgresso, 'id' | 'iniciada_em' | 'concluida_em'> &
          Partial<Pick<SessaoJornadaConteudoProgresso, 'id' | 'iniciada_em' | 'concluida_em'>>;
        Update: Partial<SessaoJornadaConteudoProgresso>;
        Relationships: [];
      };
      push_notificacoes: {
        Row: PushNotificacao;
        Insert: Omit<PushNotificacao, 'id' | 'criado_em' | 'status' | 'tentativas' | 'enviado_em'> &
          Partial<Pick<PushNotificacao, 'status' | 'tentativas' | 'enviado_em'>>;
        Update: Partial<PushNotificacao>;
        Relationships: [];
      };
      push_envios: {
        Row: PushEnvio;
        Insert: Omit<PushEnvio, 'id' | 'criado_em'> & { id?: string };
        Update: Partial<PushEnvio>;
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
        Returns: { concedido: boolean; saldo: number; limite_gratuito_atingido: boolean }[];
      };
      resgatar_recompensa: {
        Args: {
          p_usuaria_id: string;
          p_recompensa_chave: string;
        };
        Returns: { resgatado: boolean; saldo: number | null; motivo: string | null }[];
      };
      revisar_resgate: {
        Args: {
          p_admin_id: string;
          p_resgate_id: string;
          p_novo_status: Exclude<StatusResgateRecompensa, 'solicitado'>;
          p_observacao?: string | null;
        };
        Returns: { atualizado: boolean; motivo: string | null }[];
      };
      conceder_desafio_semanal: {
        Args: {
          p_usuaria_id: string;
          p_semana_inicio: string;
          p_quantidade: number;
        };
        Returns: { concedido: boolean; saldo: number; limite_gratuito_atingido: boolean }[];
      };
    };
  };
}
