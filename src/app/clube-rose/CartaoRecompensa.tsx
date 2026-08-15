'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cartao from '@/app/components/Cartao';
import Botao from '@/app/components/Botao';
import type { Recompensa } from '@/lib/clube-rose/recompensas';
import { resgatarRecompensa } from './actions';

type Estado =
  | 'em_breve'
  | 'sem_estoque'
  | 'em_analise'
  | 'aprovado'
  | 'resgatado'
  | 'continue_florescendo'
  | 'exclusivo_pro'
  | 'disponivel';

// statusResgate reflete o pedido mais recente desta usuária para esta
// recompensa (ou null se nunca pediu). 'recusado'/'cancelado' liberam nova
// tentativa (ver índice parcial resgates_recompensas_ativo_unico, 0015).
function calcularEstado(
  disponivel: boolean,
  semEstoque: boolean,
  statusResgate: string | null,
  saldo: number,
  custo: number,
  requerPremium: boolean,
  ehPremium: boolean
): Estado {
  if (statusResgate === 'entregue') return 'resgatado';
  if (statusResgate === 'aprovado') return 'aprovado';
  if (statusResgate === 'solicitado' || statusResgate === 'em_analise') return 'em_analise';
  if (!disponivel) return 'em_breve';
  if (semEstoque) return 'sem_estoque';
  if (saldo < custo) return 'continue_florescendo';
  if (requerPremium && !ehPremium) return 'exclusivo_pro';
  return 'disponivel';
}

export default function CartaoRecompensa({
  recompensa,
  custo,
  disponivel,
  requerPremium,
  semEstoque,
  saldo,
  ehPremium,
  statusResgate,
}: {
  recompensa: Recompensa;
  custo: number;
  disponivel: boolean;
  requerPremium: boolean;
  semEstoque: boolean;
  saldo: number;
  ehPremium: boolean;
  statusResgate: string | null;
}) {
  const router = useRouter();
  const estado = calcularEstado(disponivel, semEstoque, statusResgate, saldo, custo, requerPremium, ehPremium);
  const [modalAberto, setModalAberto] = useState(false);
  const [resgatando, setResgatando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [celebrando, setCelebrando] = useState(false);

  useEffect(() => {
    if (!celebrando) return;
    const timer = setTimeout(() => setCelebrando(false), 4000);
    return () => clearTimeout(timer);
  }, [celebrando]);

  const percentual = Math.min(100, Math.round((saldo / custo) * 100));
  const faltam = Math.max(0, custo - saldo);

  const MOTIVOS_ERRO: Record<string, string> = {
    recompensa_indisponivel: 'Esta recompensa não está disponível no momento.',
    sem_estoque: 'Esta recompensa está sem estoque no momento.',
    ja_resgatada: 'Você já tem um pedido em andamento para esta recompensa.',
    saldo_insuficiente: 'Seu saldo mudou e não é mais suficiente para esta recompensa.',
  };

  async function confirmarResgate() {
    setResgatando(true);
    setErro(null);
    const resultado = await resgatarRecompensa(recompensa.chave);
    setResgatando(false);

    if (!resultado.ok) {
      setErro(MOTIVOS_ERRO[resultado.motivo] ?? 'Não foi possível resgatar agora. Tente novamente em instantes.');
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
        <p className="shrink-0 font-display text-lg text-acao">{custo.toLocaleString('pt-BR')}</p>
      </div>

      {estado === 'em_breve' && (
        <span className="inline-block rounded-full bg-lilas-claro px-3 py-1 text-xs font-medium text-acao">
          {recompensa.mensagem}
        </span>
      )}

      {estado === 'sem_estoque' && (
        <span className="inline-block rounded-full bg-lilas-claro px-3 py-1 text-xs font-medium text-acao">
          Sem estoque no momento — volte em breve.
        </span>
      )}

      {estado !== 'em_breve' && estado !== 'sem_estoque' && (
        <>
          <div
            role="progressbar"
            aria-valuenow={Math.min(saldo, custo)}
            aria-valuemin={0}
            aria-valuemax={custo}
            aria-label={`${saldo} de ${custo} Pétalas`}
            className="h-2 w-full overflow-hidden rounded-full bg-borda/50"
          >
            <div className="h-full rounded-full bg-acao transition-all" style={{ width: `${percentual}%` }} />
          </div>
          <p className="text-xs text-texto-suave">
            Você possui {saldo.toLocaleString('pt-BR')} de {custo.toLocaleString('pt-BR')} Pétalas.
            {estado === 'continue_florescendo' && ` Faltam ${faltam.toLocaleString('pt-BR')} Pétalas para esta recompensa.`}
          </p>
        </>
      )}

      {estado === 'em_analise' && (
        <p className="text-sm font-medium text-acao">Pedido em análise — em breve você recebe uma resposta. 🌸</p>
      )}

      {estado === 'aprovado' && (
        <p className="text-sm font-medium text-acao">Aprovado — sua recompensa está sendo preparada. 🌸</p>
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
                Custo: {custo.toLocaleString('pt-BR')} Pétalas
              </p>
              <p className="text-sm text-texto-suave">
                Seu saldo atual: {saldo.toLocaleString('pt-BR')} Pétalas
              </p>
              <p className="text-sm text-texto-suave">
                Saldo depois do resgate: {(saldo - custo).toLocaleString('pt-BR')} Pétalas
              </p>
              <p className="text-xs text-texto-suave">
                Seu pedido passa por uma análise antes da entrega — você pode acompanhar o status no
                histórico.
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
