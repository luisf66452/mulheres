'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cartao from '@/app/components/Cartao';
import Botao from '@/app/components/Botao';
import type { Recompensa } from '@/lib/clube-rose/recompensas';
import { resgatarRecompensa } from './actions';

type Estado =
  | 'em_breve'
  | 'resgatado'
  | 'continue_florescendo'
  | 'exclusivo_pro'
  | 'disponivel';

function calcularEstado(recompensa: Recompensa, saldo: number, ehPremium: boolean, jaResgatada: boolean): Estado {
  if (!recompensa.resgatavel) return 'em_breve';
  if (jaResgatada) return 'resgatado';
  if (saldo < recompensa.custo) return 'continue_florescendo';
  if (!ehPremium) return 'exclusivo_pro';
  return 'disponivel';
}

export default function CartaoRecompensa({
  recompensa,
  saldo,
  ehPremium,
  jaResgatada,
}: {
  recompensa: Recompensa;
  saldo: number;
  ehPremium: boolean;
  jaResgatada: boolean;
}) {
  const router = useRouter();
  const estado = calcularEstado(recompensa, saldo, ehPremium, jaResgatada);
  const [modalAberto, setModalAberto] = useState(false);
  const [resgatando, setResgatando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [celebrando, setCelebrando] = useState(false);

  const percentual = Math.min(100, Math.round((saldo / recompensa.custo) * 100));
  const faltam = Math.max(0, recompensa.custo - saldo);

  async function confirmarResgate() {
    setResgatando(true);
    setErro(null);
    const resultado = await resgatarRecompensa(recompensa.chave);
    setResgatando(false);

    if (!resultado.ok) {
      setErro('Não foi possível resgatar agora. Tente novamente em instantes.');
      return;
    }

    setModalAberto(false);
    setCelebrando(true);
    router.refresh();
  }

  return (
    <Cartao className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-base text-texto">{recompensa.nome}</p>
          <p className="mt-1 text-sm text-texto-suave">{recompensa.descricao}</p>
        </div>
        <p className="shrink-0 font-display text-lg text-acao">{recompensa.custo.toLocaleString('pt-BR')}</p>
      </div>

      {estado === 'em_breve' && (
        <span className="inline-block rounded-full bg-lilas-claro px-3 py-1 text-xs font-medium text-acao">
          {recompensa.mensagem}
        </span>
      )}

      {estado !== 'em_breve' && (
        <>
          <div
            role="progressbar"
            aria-valuenow={Math.min(saldo, recompensa.custo)}
            aria-valuemin={0}
            aria-valuemax={recompensa.custo}
            aria-label={`${saldo} de ${recompensa.custo} Pétalas`}
            className="h-2 w-full overflow-hidden rounded-full bg-borda/50"
          >
            <div className="h-full rounded-full bg-acao transition-all" style={{ width: `${percentual}%` }} />
          </div>
          <p className="text-xs text-texto-suave">
            Você possui {saldo.toLocaleString('pt-BR')} de {recompensa.custo.toLocaleString('pt-BR')} Pétalas.
            {estado === 'continue_florescendo' &&
              ` Faltam ${faltam.toLocaleString('pt-BR')} Pétalas para esta recompensa.`}
          </p>
        </>
      )}

      {estado === 'resgatado' && (
        <p className="text-sm font-medium text-acao">Resgatado — já é seu. 🌸</p>
      )}

      {estado === 'continue_florescendo' && (
        <Botao variante="secundaria" disabled>
          Continue florescendo
        </Botao>
      )}

      {estado === 'exclusivo_pro' && (
        <div className="space-y-2">
          <span className="inline-block rounded-full bg-lilas-claro px-3 py-1 text-xs font-medium text-acao">
            Exclusivo Pro
          </span>
          <p className="text-sm text-texto-suave">
            Suas Pétalas estão guardadas. Assine o Rose Pro para desbloquear as recompensas e
            aproveitar tudo o que você conquistou.
          </p>
          <Link
            href="/premium"
            className="block w-full rounded-2xl bg-acao p-3 text-center text-sm font-medium text-white transition-colors hover:bg-acao/90"
          >
            Conhecer o Rose Pro
          </Link>
        </div>
      )}

      {estado === 'disponivel' && (
        <Botao onClick={() => setModalAberto(true)}>Resgatar recompensa</Botao>
      )}

      {celebrando && (
        <p
          role="status"
          aria-live="polite"
          className="notificacao-petalas rounded-2xl bg-lilas-claro p-3 text-center text-sm font-medium text-acao"
        >
          Uma nova conquista floresceu no seu caminho. 🌸
        </p>
      )}

      {modalAberto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Confirmar resgate de ${recompensa.nome}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-texto/40 p-6"
        >
          <Cartao className="w-full max-w-sm space-y-4">
            <div>
              <p className="font-display text-lg text-texto">{recompensa.nome}</p>
              <p className="mt-1 text-sm text-texto-suave">
                Custo: {recompensa.custo.toLocaleString('pt-BR')} Pétalas
              </p>
              <p className="text-sm text-texto-suave">
                Seu saldo atual: {saldo.toLocaleString('pt-BR')} Pétalas
              </p>
              <p className="text-sm text-texto-suave">
                Saldo depois do resgate: {(saldo - recompensa.custo).toLocaleString('pt-BR')} Pétalas
              </p>
            </div>

            {erro && <p className="text-sm text-alerta">{erro}</p>}

            <div className="flex gap-3">
              <Botao variante="secundaria" disabled={resgatando} onClick={() => setModalAberto(false)}>
                Agora não
              </Botao>
              <Botao disabled={resgatando} onClick={confirmarResgate}>
                {resgatando ? 'Resgatando…' : 'Confirmar resgate'}
              </Botao>
            </div>
          </Cartao>
        </div>
      )}
    </Cartao>
  );
}
