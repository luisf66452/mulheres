// src/app/api/exportar/[formato]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { coletarDadosExportaveis, type PacoteExportado } from '@/lib/exportacao/coletarDados';
import { paraCsv } from '@/lib/exportacao/csv';
import { criarZip } from '@/lib/exportacao/zip';

type Formato = 'json' | 'csv';

function formatoValido(valor: string): valor is Formato {
  return valor === 'json' || valor === 'csv';
}

function montarZipDeCsvs(pacote: PacoteExportado): Uint8Array {
  return criarZip([
    {
      nome: 'checkins.csv',
      conteudo: paraCsv(pacote.checkins, [
        'id', 'data', 'humor', 'imagem_corporal', 'comida', 'texto_livre', 'sinal_seguranca',
        'estado_geral', 'emocao_especifica', 'intensidade', 'alimentacao_percebida',
        'gatilho_local', 'gatilho_pensamento', 'gatilho_emocao_depois', 'fatores', 'proxima_acao', 'criado_em',
      ]),
    },
    {
      nome: 'reflexoes.csv',
      conteudo: paraCsv(pacote.jornada_respostas_modulo, [
        'id', 'jornada_usuario_id', 'atividade_id', 'sessao_id', 'schema_version', 'respostas', 'created_at', 'updated_at',
      ]),
    },
    {
      nome: 'praticas.csv',
      conteudo: paraCsv(pacote.praticas.praticas_avulsas_concluidas, [
        'id', 'pratica_id', 'concluida_em', 'duracao_minutos',
      ]),
    },
    {
      nome: 'jornadas.csv',
      conteudo: paraCsv(pacote.jornadas, [
        'id', 'jornada_id', 'dias_completados', 'status', 'iniciada_em', 'atualizada_em', 'concluida_em',
      ]),
    },
    {
      nome: 'favoritos.csv',
      conteudo: paraCsv(pacote.favoritos, [
        'id', 'pratica_id', 'sessao_id', 'criado_em',
      ]),
    },
  ]);
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ formato: string }> }) {
  const { formato } = await params;

  if (!formatoValido(formato)) {
    return NextResponse.json({ erro: 'Formato de exportação inválido.' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ erro: 'Sessão expirada. Faça login novamente.' }, { status: 401 });
  }

  const resultado = await coletarDadosExportaveis(supabase, {
    id: user.id,
    email: user.email ?? null,
    criado_em: user.created_at,
  });

  if (resultado.erro || !resultado.pacote) {
    return NextResponse.json(
      { erro: resultado.erro ?? 'Não foi possível preparar seus dados agora. Tente novamente.' },
      { status: 500 }
    );
  }

  const dataArquivo = new Date().toISOString().slice(0, 10);
  const extensao = formato === 'json' ? 'json' : 'zip';
  const nomeArquivo = `rose-meus-dados-${dataArquivo}.${extensao}`;

  const corpo: string | Uint8Array =
    formato === 'json' ? JSON.stringify(resultado.pacote, null, 2) : montarZipDeCsvs(resultado.pacote);
  const contentType = formato === 'json' ? 'application/json' : 'application/zip';

  // Registro de auditoria — só usuaria_id + tipo, nunca o conteúdo. Melhor
  // esforço: mesmo padrão de "não bloquear a operação principal por uma
  // falha secundária" já usado em src/app/api/perfil/excluir-conta/route.ts
  // para o cancelamento de assinatura Stripe. A tabela não tem policy nem
  // GRANT para `authenticated` — só o admin client (service role) escreve.
  const supabaseAdmin = createSupabaseAdminClient();
  if (supabaseAdmin) {
    const { error: erroRegistro } = await supabaseAdmin
      .from('exportacoes_dados')
      .insert({ usuaria_id: user.id, tipo: formato });
    if (erroRegistro) {
      console.error('[exportacao] Falha ao registrar auditoria da exportação', {
        code: erroRegistro.code,
        message: erroRegistro.message,
      });
    }
  } else {
    console.error('[exportacao] Admin client indisponível — exportação servida sem registro de auditoria.');
  }

  return new NextResponse(corpo as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${nomeArquivo}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
