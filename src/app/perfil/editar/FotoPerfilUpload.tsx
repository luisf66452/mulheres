'use client';

import { useRef, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { validarArquivoFoto, extensaoPorTipo } from '@/lib/perfil/foto';
import AvatarPerfil from '@/app/components/perfil/AvatarPerfil';
import Botao from '@/app/components/Botao';
import { atualizarFotoPerfil } from './actions';

export default function FotoPerfilUpload({
  usuariaId,
  nome,
  fotoUrlAtual,
}: {
  usuariaId: string;
  nome: string | null;
  fotoUrlAtual: string | null;
}) {
  const [fotoUrl, setFotoUrl] = useState(fotoUrlAtual);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSelecionarArquivo(event: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];
    event.target.value = '';
    if (!arquivo) return;

    const erroValidacao = validarArquivoFoto(arquivo);
    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    setErro(null);
    setEnviando(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const caminho = `${usuariaId}/avatar.${extensaoPorTipo(arquivo.type)}`;

      const { error: erroUpload } = await supabase.storage
        .from('avatares')
        .upload(caminho, arquivo, { upsert: true, contentType: arquivo.type });

      if (erroUpload) {
        setErro('Não foi possível enviar a foto agora. Tente novamente.');
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatares').getPublicUrl(caminho);
      // Evita que o navegador mostre a imagem antiga em cache no mesmo caminho.
      const urlComVersao = `${publicUrl}?v=${Date.now()}`;

      const resultado = await atualizarFotoPerfil(urlComVersao);
      if (resultado.erro) {
        setErro(resultado.erro);
        return;
      }

      setFotoUrl(urlComVersao);
    } finally {
      setEnviando(false);
    }
  }

  async function handleRemover() {
    setErro(null);
    setEnviando(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.storage
        .from('avatares')
        .remove(['jpg', 'jpeg', 'png', 'webp'].map((ext) => `${usuariaId}/avatar.${ext}`));

      const resultado = await atualizarFotoPerfil(null);
      if (resultado.erro) {
        setErro(resultado.erro);
        return;
      }
      setFotoUrl(null);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <AvatarPerfil nome={nome} fotoUrl={fotoUrl} tamanho={96} />

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleSelecionarArquivo}
        className="hidden"
        id="foto-perfil-input"
      />

      <div className="flex gap-3">
        <Botao
          type="button"
          variante="secundaria"
          disabled={enviando}
          onClick={() => inputRef.current?.click()}
        >
          {enviando ? 'Enviando...' : fotoUrl ? 'Trocar foto' : 'Adicionar foto (opcional)'}
        </Botao>
        {fotoUrl && (
          <Botao type="button" variante="secundaria" disabled={enviando} onClick={handleRemover}>
            Remover
          </Botao>
        )}
      </div>

      {erro && (
        <p role="alert" className="text-sm text-alerta">
          {erro}
        </p>
      )}
      <p className="text-center text-xs text-texto-suave">
        Totalmente opcional — sem foto, mostramos suas iniciais.
      </p>
    </div>
  );
}
