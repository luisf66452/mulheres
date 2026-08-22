'use client';

import { useEffect, useState, useTransition } from 'react';
import { inscreverPush } from '@/lib/push/subscribe';
import { salvarHorarioPreferido } from '@/app/settings/actions';
import type { NotificacoesPreferencias } from '@/lib/perfil/notificacoesPreferencias';
import {
  salvarPreferenciasNotificacao,
  pausarNotificacoes,
  reativarNotificacoes,
  removerDispositivo,
  enviarNotificacaoTeste,
} from './actions';

const DIAS_SEMANA = [
  { id: 0, rotulo: 'D' },
  { id: 1, rotulo: 'S' },
  { id: 2, rotulo: 'T' },
  { id: 3, rotulo: 'Q' },
  { id: 4, rotulo: 'Q' },
  { id: 5, rotulo: 'S' },
  { id: 6, rotulo: 'S' },
];

type PermissaoNotificacao = 'granted' | 'denied' | 'default' | 'indisponivel';

interface Dispositivo {
  id: string;
  userAgent: string | null;
  criadoEm: string;
}

function alternarDia(dias: number[], dia: number): number[] {
  return dias.includes(dia) ? dias.filter((d) => d !== dia) : [...dias, dia].sort();
}

/** Nome curto e amigável a partir do user-agent bruto, só pra usuária reconhecer o dispositivo. */
function nomearDispositivo(userAgent: string | null): string {
  if (!userAgent) return 'Dispositivo';
  if (/iphone|ipad/i.test(userAgent)) return 'iPhone/iPad';
  if (/android/i.test(userAgent)) return 'Android';
  if (/macintosh/i.test(userAgent)) return 'Mac';
  if (/windows/i.test(userAgent)) return 'Windows';
  return 'Navegador';
}

export default function NotificacoesForm({
  horarioAtual,
  preferenciasIniciais,
  dispositivosIniciais,
}: {
  usuariaId: string;
  horarioAtual: string | null;
  preferenciasIniciais: NotificacoesPreferencias;
  dispositivosIniciais: Dispositivo[];
}) {
  const [permissao, setPermissao] = useState<PermissaoNotificacao>('default');
  const [preferencias, setPreferencias] = useState<NotificacoesPreferencias>(preferenciasIniciais);
  const [horario, setHorario] = useState(horarioAtual ?? '09:00');
  const [statusAtivacao, setStatusAtivacao] = useState<string | null>(null);
  const [ativando, startTransitionAtivar] = useTransition();
  const [salvandoHorario, startTransitionHorario] = useTransition();
  const [horarioSalvo, setHorarioSalvo] = useState(false);
  const [dispositivos, setDispositivos] = useState(dispositivosIniciais);
  const [statusTeste, setStatusTeste] = useState<string | null>(null);
  const [enviandoTeste, startTransitionTeste] = useTransition();
  const [pausando, startTransitionPausa] = useTransition();

  useEffect(() => {
    // Lê o estado real da permissão do navegador — sistema externo ao React,
    // por isso a sincronização acontece só depois de montar no cliente.
    const suportado = typeof window !== 'undefined' && 'Notification' in window;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPermissao(suportado ? (Notification.permission as PermissaoNotificacao) : 'indisponivel');
  }, []);

  function atualizarPreferencia(alteracoes: Partial<NotificacoesPreferencias>) {
    const proximas = { ...preferencias, ...alteracoes };
    setPreferencias(proximas);
    void salvarPreferenciasNotificacao(alteracoes);
  }

  function handleAtivar() {
    setStatusAtivacao(null);
    startTransitionAtivar(async () => {
      const resultado = await inscreverPush();
      if (resultado === 'inscrita') {
        setPermissao('granted');
        setStatusAtivacao('Notificações ativadas.');
      } else if (resultado === 'negado') {
        setPermissao('denied');
        setStatusAtivacao('Permissão negada. Você pode reativar nas configurações de notificação do navegador.');
      } else {
        setPermissao('indisponivel');
        setStatusAtivacao('Seu navegador não suporta notificações push agora.');
      }
    });
  }

  function handleSalvarHorario() {
    setHorarioSalvo(false);
    startTransitionHorario(async () => {
      await salvarHorarioPreferido(horario);
      setHorarioSalvo(true);
      setTimeout(() => setHorarioSalvo(false), 3000);
    });
  }

  function handleRemoverDispositivo(id: string) {
    setDispositivos((atual) => atual.filter((d) => d.id !== id));
    void removerDispositivo(id);
  }

  function handleEnviarTeste() {
    setStatusTeste(null);
    startTransitionTeste(async () => {
      const resultado = await enviarNotificacaoTeste();
      setStatusTeste(resultado.erro ?? 'Notificação de teste enviada.');
    });
  }

  function handlePausar() {
    startTransitionPausa(async () => {
      const resultado = await pausarNotificacoes(7);
      if (resultado.pausadaAte) {
        setPreferencias((atual) => ({ ...atual, pausadaAte: resultado.pausadaAte! }));
      }
    });
  }

  function handleReativar() {
    startTransitionPausa(async () => {
      await reativarNotificacoes();
      setPreferencias((atual) => ({ ...atual, pausadaAte: null }));
    });
  }

  const notificacoesAtivas = permissao === 'granted';
  const pausadaHoje = Boolean(preferencias.pausadaAte && preferencias.pausadaAte >= new Date().toISOString().slice(0, 10));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-borda bg-superficie p-4">
        {permissao === 'granted' && (
          <p className="text-sm text-texto">
            <span className="font-medium text-acao">Ativadas.</span> Este navegador está autorizado a
            enviar notificações.
          </p>
        )}
        {permissao === 'default' && (
          <div className="space-y-3">
            <p className="text-sm text-texto-suave">
              Quer receber lembretes delicados sobre sessões e tarefas que você deixou pendentes? Você
              decide o quê e quando — e pode desligar a qualquer momento.
            </p>
            <button
              type="button"
              onClick={handleAtivar}
              disabled={ativando}
              className="w-full rounded-2xl bg-acao p-3 text-center font-medium text-white transition-colors hover:bg-acao/90 disabled:opacity-40"
            >
              {ativando ? 'Ativando...' : 'Ativar notificações'}
            </button>
          </div>
        )}
        {permissao === 'denied' && (
          <div className="space-y-2 text-sm text-texto-suave">
            <p>
              As notificações estão bloqueadas nas configurações do seu navegador ou dispositivo — não é
              possível pedir permissão de novo por aqui.
            </p>
            <p>
              Para reativar: abra as configurações do site no seu navegador (geralmente tocando no ícone de
              cadeado ou &ldquo;ⓘ&rdquo; ao lado do endereço), procure por &ldquo;Notificações&rdquo; e mude
              para &ldquo;Permitir&rdquo;. Em alguns celulares isso fica em Configurações do sistema →
              Apps/Navegador → Notificações.
            </p>
          </div>
        )}
        {permissao === 'indisponivel' && (
          <p className="text-sm text-texto-suave">
            Seu navegador não suporta notificações push. Você ainda verá lembretes visuais dentro do
            app.
          </p>
        )}
        {statusAtivacao && (
          <p role="status" className="mt-2 text-sm text-acao">
            {statusAtivacao}
          </p>
        )}
      </div>

      {pausadaHoje && (
        <div className="rounded-2xl border border-borda bg-superficie p-4">
          <p className="text-sm text-texto-suave">
            Suas notificações estão pausadas até {preferencias.pausadaAte}.
          </p>
          <button
            type="button"
            onClick={handleReativar}
            disabled={pausando}
            className="mt-2 text-sm font-medium text-acao underline disabled:opacity-40"
          >
            Reativar agora
          </button>
        </div>
      )}

      <fieldset className="space-y-3" disabled={!notificacoesAtivas}>
        <legend className="font-display text-base text-texto">Lembretes</legend>
        {!notificacoesAtivas && (
          <p className="text-xs text-texto-suave">Ative as notificações acima para ligar estes lembretes.</p>
        )}
        {[
          { chave: 'lembreteCheckin' as const, rotulo: 'Lembrete diário de check-in' },
          { chave: 'lembreteJornada' as const, rotulo: 'Continuar uma jornada' },
          { chave: 'lembretePraticas' as const, rotulo: 'Práticas e reflexões pendentes' },
          { chave: 'lembreteInatividade' as const, rotulo: 'Quando eu sumir por alguns dias' },
          { chave: 'avisosNovidades' as const, rotulo: 'Novas jornadas e conteúdos' },
          { chave: 'resumoSemanal' as const, rotulo: 'Resumo semanal de progresso' },
        ].map((item) => (
          <label key={item.chave} className="flex items-center justify-between gap-3 text-texto">
            {item.rotulo}
            <input
              type="checkbox"
              checked={preferencias[item.chave]}
              onChange={(e) => atualizarPreferencia({ [item.chave]: e.target.checked })}
              className="h-4 w-4 accent-acao disabled:opacity-40"
            />
          </label>
        ))}
      </fieldset>

      <div className="space-y-2">
        <label className="block text-texto">
          Horário preferido
          <input
            type="time"
            value={horario}
            onChange={(e) => setHorario(e.target.value)}
            disabled={!notificacoesAtivas}
            className="mt-1 block w-full rounded-2xl border border-borda bg-superficie p-3 text-texto disabled:opacity-40"
          />
        </label>
        <button
          type="button"
          onClick={handleSalvarHorario}
          disabled={!notificacoesAtivas || salvandoHorario}
          className="w-full rounded-2xl border border-borda p-3 text-center font-medium text-texto-suave transition-colors hover:bg-fundo disabled:opacity-40"
        >
          {salvandoHorario ? 'Salvando...' : 'Salvar horário'}
        </button>
        {horarioSalvo && (
          <p role="status" className="text-sm text-acao">
            Horário salvo.
          </p>
        )}
      </div>

      <fieldset className="space-y-2" disabled={!notificacoesAtivas}>
        <legend className="font-display text-base text-texto">Dias da semana</legend>
        <div className="flex gap-2">
          {DIAS_SEMANA.map((dia) => {
            const ativo = preferencias.diasSemana.includes(dia.id);
            return (
              <button
                key={dia.id}
                type="button"
                aria-pressed={ativo}
                aria-label={`Dia ${dia.id}`}
                disabled={!notificacoesAtivas}
                onClick={() => atualizarPreferencia({ diasSemana: alternarDia(preferencias.diasSemana, dia.id) })}
                className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60 disabled:opacity-40 ${
                  ativo ? 'border-acao bg-acao text-white' : 'border-borda text-texto-suave'
                }`}
              >
                {dia.rotulo}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-2" disabled={!notificacoesAtivas}>
        <legend className="font-display text-base text-texto">Horário silencioso</legend>
        <p className="text-xs text-texto-suave">Nenhum lembrete chega nesse intervalo — reagendamos para depois.</p>
        <div className="flex gap-3">
          <label className="flex-1 text-sm text-texto">
            Início
            <input
              type="time"
              value={preferencias.horarioSilencioInicio}
              onChange={(e) => atualizarPreferencia({ horarioSilencioInicio: e.target.value })}
              disabled={!notificacoesAtivas}
              className="mt-1 block w-full rounded-2xl border border-borda bg-superficie p-3 text-texto disabled:opacity-40"
            />
          </label>
          <label className="flex-1 text-sm text-texto">
            Fim
            <input
              type="time"
              value={preferencias.horarioSilencioFim}
              onChange={(e) => atualizarPreferencia({ horarioSilencioFim: e.target.value })}
              disabled={!notificacoesAtivas}
              className="mt-1 block w-full rounded-2xl border border-borda bg-superficie p-3 text-texto disabled:opacity-40"
            />
          </label>
        </div>
      </fieldset>

      {!pausadaHoje && (
        <button
          type="button"
          onClick={handlePausar}
          disabled={!notificacoesAtivas || pausando}
          className="w-full rounded-2xl border border-borda p-3 text-center font-medium text-texto-suave transition-colors hover:bg-fundo disabled:opacity-40"
        >
          Pausar notificações por 7 dias
        </button>
      )}

      <div className="space-y-2">
        <button
          type="button"
          onClick={handleEnviarTeste}
          disabled={!notificacoesAtivas || enviandoTeste}
          className="w-full rounded-2xl border border-borda p-3 text-center font-medium text-texto-suave transition-colors hover:bg-fundo disabled:opacity-40"
        >
          {enviandoTeste ? 'Enviando...' : 'Enviar notificação de teste'}
        </button>
        {statusTeste && (
          <p role="status" className="text-sm text-acao">
            {statusTeste}
          </p>
        )}
      </div>

      {dispositivos.length > 0 && (
        <div className="space-y-2">
          <p className="font-display text-base text-texto">Dispositivos com notificações ativas</p>
          <ul className="space-y-2">
            {dispositivos.map((dispositivo) => (
              <li
                key={dispositivo.id}
                className="flex items-center justify-between rounded-2xl border border-borda bg-superficie p-3 text-sm text-texto"
              >
                {nomearDispositivo(dispositivo.userAgent)}
                <button
                  type="button"
                  onClick={() => handleRemoverDispositivo(dispositivo.id)}
                  className="text-xs font-medium text-texto-suave underline"
                >
                  Remover este dispositivo
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
