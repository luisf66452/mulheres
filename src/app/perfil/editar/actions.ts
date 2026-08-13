'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { normalizarNome } from '@/lib/perfil/nome';
import { validarEdicaoPerfil, type DadosEdicaoPerfil } from '@/lib/perfil/validacaoPerfil';
import type { FaixaEtaria } from '@/lib/supabase/types';

export async function atualizarPerfilCompleto(
  dados: DadosEdicaoPerfil
): Promise<{ erros?: ReturnType<typeof validarEdicaoPerfil>; erroGeral?: string }> {
  const erros = validarEdicaoPerfil(dados);
  if (Object.keys(erros).length > 0) {
    return { erros };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { error } = await supabase
    .from('perfis')
    .update({
      nome: normalizarNome(dados.nome),
      frase_pessoal: dados.frasePessoal.trim() || null,
      faixa_etaria: (dados.faixaEtaria || null) as FaixaEtaria | null,
      fuso_horario: dados.fusoHorario,
      idioma: dados.idioma,
    })
    .eq('id', user.id);

  if (error) {
    return { erroGeral: 'Não foi possível salvar seu perfil agora. Tente novamente.' };
  }

  return {};
}

export async function solicitarTrocaEmail(novoEmail: string): Promise<{ erro?: string; sucesso?: boolean }> {
  const emailLimpo = novoEmail.trim();
  if (!emailLimpo || !emailLimpo.includes('@')) {
    return { erro: 'Digite um e-mail válido.' };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { error } = await supabase.auth.updateUser({ email: emailLimpo });

  if (error) {
    return { erro: 'Não foi possível iniciar a troca de e-mail. Tente novamente.' };
  }

  return { sucesso: true };
}
