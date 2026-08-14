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

export async function atualizarFotoPerfil(fotoUrl: string | null): Promise<{ erro?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // O upload em si já passou pelas policies de Storage (RLS restringe cada
  // usuária à sua própria pasta) — aqui só confirmamos que a URL recebida
  // aponta para dentro da pasta desta usuária no bucket "avatares", em vez de
  // aceitar qualquer URL arbitrária vinda do cliente.
  if (fotoUrl !== null) {
    const prefixoEsperado = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatares/${user.id}/`;
    if (!fotoUrl.startsWith(prefixoEsperado)) {
      return { erro: 'URL de foto inválida.' };
    }
  }

  const { error } = await supabase.from('perfis').update({ foto_url: fotoUrl }).eq('id', user.id);

  if (error) {
    return { erro: 'Não foi possível salvar sua foto agora. Tente novamente.' };
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
