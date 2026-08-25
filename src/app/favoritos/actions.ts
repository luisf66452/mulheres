'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { buscarSessaoEmQualquerJornada } from '@/lib/jornadas-conteudo/dados';

export type TipoFavorito = 'pratica' | 'sessao';

/**
 * Marca uma prática ou sessão como favorita. Nunca confia só na FK/catálogo:
 * antes de inserir, confirma no servidor que a prática existe e está
 * publicada (praticas.status = 'publicada'), ou que a sessão existe no
 * catálogo de jornadas-conteudo (código, sem tabela). Um erro 23505
 * (violação do índice único parcial) é tratado como sucesso idempotente —
 * favoritar algo já favoritado nunca deve virar erro visível para a
 * usuária.
 */
export async function favoritar(tipo: TipoFavorito, id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  if (tipo === 'pratica') {
    const { data: pratica } = await supabase
      .from('praticas')
      .select('id')
      .eq('id', id)
      .eq('status', 'publicada')
      .maybeSingle();

    if (!pratica) {
      throw new Error('Esta prática não está disponível para favoritar.');
    }

    const { error } = await supabase
      .from('favoritos')
      .insert({ usuaria_id: user.id, pratica_id: id, sessao_id: null });

    if (error && error.code !== '23505') {
      throw new Error('Não foi possível favoritar esta prática agora.');
    }
  } else {
    if (!buscarSessaoEmQualquerJornada(id)) {
      throw new Error('Esta sessão não está disponível para favoritar.');
    }

    const { error } = await supabase
      .from('favoritos')
      .insert({ usuaria_id: user.id, pratica_id: null, sessao_id: id });

    if (error && error.code !== '23505') {
      throw new Error('Não foi possível favoritar esta sessão agora.');
    }
  }

  revalidatePath('/favoritos');
}

/** Remove um favorito. RLS já garante que só a própria linha da usuária pode ser afetada. */
export async function desfavoritar(tipo: TipoFavorito, id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const coluna = tipo === 'pratica' ? 'pratica_id' : 'sessao_id';

  const { error } = await supabase.from('favoritos').delete().eq('usuaria_id', user.id).eq(coluna, id);

  if (error) {
    throw new Error('Não foi possível remover este favorito agora.');
  }

  revalidatePath('/favoritos');
}
