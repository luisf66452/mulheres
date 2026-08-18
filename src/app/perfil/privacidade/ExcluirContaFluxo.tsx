'use client';

import { useState, useTransition } from 'react';
import Botao from '@/app/components/Botao';
import { enviarConfirmacaoExclusao } from './actions';

const FRASE_CONFIRMACAO = 'EXCLUIR';

type Etapa = 'inicial' | 'explicacao' | 'confirmar-frase' | 'aguardando-email';

export default function ExcluirContaFluxo() {
  const [etapa, setEtapa] = useState<Etapa>('inicial');
  const [frase, setFrase] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [emailEnviado, setEmailEnviado] = useState<string | null>(null);
  const [enviando, startTransition] = useTransition();

  function handleEnviarConfirmacao() {
    setErro(null);
    startTransition(async () => {
      const resultado = await enviarConfirmacaoExclusao();
      if (resultado.erro) {
        setErro(resultado.erro);
        return;
      }
      setEmailEnviado(resultado.emailEnviado ?? null);
      setEtapa('aguardando-email');
    });
  }

  if (etapa === 'inicial') {
    return (
      <button
        type="button"
        onClick={() => setEtapa('explicacao')}
        className="text-sm font-medium text-alerta underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60"
      >
        Excluir minha conta
      </button>
    );
  }

  if (etapa === 'explicacao') {
    return (
      <div className="space-y-3 rounded-2xl border border-alerta/40 bg-superficie p-4">
        <p className="font-display text-base text-texto">Excluir minha conta</p>
        <p className="text-sm text-texto-suave">
          Esta ação é permanente. Seus dados pessoais e seu histórico no Rose — perfil, check-ins,
          jornadas, práticas, Pétalas e recompensas — serão excluídos. Não é possível desfazer.
        </p>
        <div className="flex gap-3">
          <Botao variante="secundaria" type="button" onClick={() => setEtapa('confirmar-frase')}>
            Entendi, continuar
          </Botao>
          <Botao variante="secundaria" type="button" onClick={() => setEtapa('inicial')}>
            Cancelar
          </Botao>
        </div>
      </div>
    );
  }

  if (etapa === 'confirmar-frase') {
    return (
      <div className="space-y-3 rounded-2xl border border-alerta/40 bg-superficie p-4">
        <label className="block text-texto">
          Digite <strong>{FRASE_CONFIRMACAO}</strong> para confirmar
          <input
            type="text"
            value={frase}
            onChange={(e) => setFrase(e.target.value)}
            className="mt-1 block w-full rounded-2xl border border-borda bg-superficie p-3 text-texto"
          />
        </label>
        {erro && (
          <p role="alert" className="text-sm text-alerta">
            {erro}
          </p>
        )}
        <div className="flex gap-3">
          <Botao
            type="button"
            disabled={frase !== FRASE_CONFIRMACAO || enviando}
            onClick={handleEnviarConfirmacao}
          >
            {enviando ? 'Enviando...' : 'Enviar link de confirmação'}
          </Botao>
          <Botao variante="secundaria" type="button" onClick={() => setEtapa('inicial')}>
            Cancelar
          </Botao>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-2xl border border-borda bg-superficie p-4">
      <p role="status" className="text-sm text-texto">
        Enviamos um link de confirmação para <strong>{emailEnviado}</strong>. Abra-o para concluir a
        exclusão — por segurança, a exclusão só acontece depois que você confirmar por lá.
      </p>
    </div>
  );
}
