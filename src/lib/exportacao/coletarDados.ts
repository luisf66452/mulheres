import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Database,
  Checkin,
  Sessao,
  JornadaUsuaria,
  JornadaRespostaModulo,
  ConclusaoPraticaConteudo,
  SessaoJornadaConteudoProgresso,
  Favorito,
  TransacaoPetalas,
  ResgateDesafioSemanal,
  ResgateRecompensa,
  PreferenciasNotificacao,
  IntencaoPagamento,
} from '@/lib/supabase/types';

export type ContaExportavel = { id: string; email: string | null; criado_em: string };

export type PerfilExportavel = {
  nome: string | null;
  plano: string;
  pais: string;
  frase_pessoal: string | null;
  faixa_etaria: string | null;
  fuso_horario: string;
  idioma: string;
  foto_url: string | null;
  horario_preferido_notificacao: string | null;
  assinatura_status: string | null;
  assinatura_periodo_fim: string | null;
  criado_em: string;
};

export type PacoteExportado = {
  exportado_em: string;
  conta: ContaExportavel;
  perfil: PerfilExportavel | null;
  checkins: Checkin[];
  jornadas: JornadaUsuaria[];
  jornada_respostas_modulo: JornadaRespostaModulo[];
  praticas: {
    sessoes: Sessao[];
    praticas_avulsas_concluidas: ConclusaoPraticaConteudo[];
    sessoes_jornadas_conteudo_progresso: SessaoJornadaConteudoProgresso[];
  };
  favoritos: Favorito[];
  petalas: { saldo: number; transacoes: TransacaoPetalas[] };
  recompensas: {
    resgates: ResgateRecompensa[];
    desafios_semanais_concluidos: ResgateDesafioSemanal[];
  };
  notificacoes: PreferenciasNotificacao | null;
  intencao_pagamento: IntencaoPagamento[];
};

export type UsuariaAutenticada = { id: string; email: string | null; criado_em: string };

export type ResultadoColeta = { erro?: string; pacote?: PacoteExportado };

// Só os campos com sentido para a própria usuária ver de novo no export. De
// propósito fora: role (papel interno), stripe_customer_id e
// stripe_subscription_id (identificadores internos de cobrança, sem
// utilidade para a usuária e fora do escopo do que ela preencheu/gerou
// diretamente).
function perfilExportavel(perfil: Record<string, unknown> | null): PerfilExportavel | null {
  if (!perfil) return null;
  return {
    nome: perfil.nome as string | null,
    plano: perfil.plano as string,
    pais: perfil.pais as string,
    frase_pessoal: perfil.frase_pessoal as string | null,
    faixa_etaria: perfil.faixa_etaria as string | null,
    fuso_horario: perfil.fuso_horario as string,
    idioma: perfil.idioma as string,
    foto_url: perfil.foto_url as string | null,
    horario_preferido_notificacao: perfil.horario_preferido_notificacao as string | null,
    assinatura_status: perfil.assinatura_status as string | null,
    assinatura_periodo_fim: perfil.assinatura_periodo_fim as string | null,
    criado_em: perfil.criado_em as string,
  };
}

// Módulo canônico de coleta de dados exportáveis da própria usuária — usado
// tanto pela server action `exportarMeusDados` (src/app/perfil/privacidade/actions.ts)
// quanto pela rota de download `/api/exportar/[formato]`. SEMPRE recebe um
// cliente Supabase autenticado normal (RLS ativa) — nunca a service role. A
// RLS de cada tabela já garante `usuaria_id = auth.uid()` (ou `user_id`, no
// caso de jornada_respostas_modulo); os `.eq(...)` abaixo são defesa em
// profundidade, não a única barreira.
export async function coletarDadosExportaveis(
  supabase: SupabaseClient<Database>,
  usuaria: UsuariaAutenticada
): Promise<ResultadoColeta> {
  const usuariaId = usuaria.id;

  const [
    { data: perfil, error: erroPerfil },
    { data: checkins, error: erroCheckins },
    { data: sessoes, error: erroSessoes },
    { data: jornadasUsuarias, error: erroJornadasUsuarias },
    { data: respostasModulo, error: erroRespostasModulo },
    { data: conclusoesPraticas, error: erroConclusoes },
    { data: progressoConteudoJornadas, error: erroProgressoConteudo },
    { data: favoritos, error: erroFavoritos },
    { data: carteira, error: erroCarteira },
    { data: transacoesPetalas, error: erroTransacoes },
    { data: resgatesDesafio, error: erroResgatesDesafio },
    { data: resgatesRecompensas, error: erroResgatesRecompensas },
    { data: preferenciasNotificacoes, error: erroPreferencias },
    { data: intencaoPagamento, error: erroIntencao },
  ] = await Promise.all([
    supabase.from('perfis').select('*').eq('id', usuariaId).single(),
    supabase.from('checkins').select('*').eq('usuaria_id', usuariaId),
    supabase.from('sessoes').select('*').eq('usuaria_id', usuariaId),
    supabase.from('jornadas_usuarias').select('*').eq('usuaria_id', usuariaId),
    // jornada_respostas_modulo usa `user_id`, não `usuaria_id` (ver
    // supabase/migrations/0029_jornada_modulos_estruturados.sql) — única
    // tabela com esse nome de coluna diferente entre as buscadas aqui.
    supabase.from('jornada_respostas_modulo').select('*').eq('user_id', usuariaId),
    supabase.from('conclusoes_praticas_conteudo').select('*').eq('usuaria_id', usuariaId),
    supabase.from('sessoes_jornadas_conteudo_progresso').select('*').eq('usuaria_id', usuariaId),
    supabase.from('favoritos').select('*').eq('usuaria_id', usuariaId),
    supabase.from('carteiras_petalas').select('*').eq('usuaria_id', usuariaId).maybeSingle(),
    supabase.from('transacoes_petalas').select('*').eq('usuaria_id', usuariaId),
    supabase.from('resgates_desafio_semanal').select('*').eq('usuaria_id', usuariaId),
    supabase.from('resgates_recompensas').select('*').eq('usuaria_id', usuariaId),
    supabase.from('preferencias_notificacoes').select('*').eq('usuaria_id', usuariaId).maybeSingle(),
    supabase.from('intencao_pagamento').select('*').eq('usuaria_id', usuariaId),
  ]);

  const primeiroErro = [
    erroPerfil,
    erroCheckins,
    erroSessoes,
    erroJornadasUsuarias,
    erroRespostasModulo,
    erroConclusoes,
    erroProgressoConteudo,
    erroFavoritos,
    erroCarteira,
    erroTransacoes,
    erroResgatesDesafio,
    erroResgatesRecompensas,
    erroPreferencias,
    erroIntencao,
  ].find(Boolean);

  if (primeiroErro) {
    console.error('[exportacao] Falha ao coletar dados exportáveis', {
      code: primeiroErro.code,
      message: primeiroErro.message,
    });
    return { erro: 'Não foi possível preparar seus dados agora. Tente novamente.' };
  }

  const pacote: PacoteExportado = {
    exportado_em: new Date().toISOString(),
    conta: { id: usuaria.id, email: usuaria.email, criado_em: usuaria.criado_em },
    perfil: perfilExportavel(perfil),
    checkins: checkins ?? [],
    jornadas: jornadasUsuarias ?? [],
    jornada_respostas_modulo: respostasModulo ?? [],
    praticas: {
      sessoes: sessoes ?? [],
      praticas_avulsas_concluidas: conclusoesPraticas ?? [],
      sessoes_jornadas_conteudo_progresso: progressoConteudoJornadas ?? [],
    },
    favoritos: favoritos ?? [],
    petalas: {
      saldo: carteira?.saldo ?? 0,
      transacoes: transacoesPetalas ?? [],
    },
    recompensas: {
      resgates: resgatesRecompensas ?? [],
      desafios_semanais_concluidos: resgatesDesafio ?? [],
    },
    notificacoes: preferenciasNotificacoes ?? null,
    intencao_pagamento: intencaoPagamento ?? [],
  };

  return { pacote };
}
