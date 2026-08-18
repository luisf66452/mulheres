'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { inscreverPush, desinscreverPush } from '@/lib/push/subscribe';
import { salvarHorarioPreferido } from '@/app/settings/actions';
import { horarioLocalDaJanela, horarioPreferidoParaJanela, ROTULO_POR_JANELA, type JanelaNotificacao } from '@/lib/push/janelas';
import type { NotificacoesPreferencias } from '@/lib/perfil/notificacoesPreferencias';
import RosaBotanica from '@/app/components/ilustracoes/RosaBotanica';
import { salvarPreferenciasNotificacao } from './actions';

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

function alternarDia(dias: number[], dia: number): number[] {
  return dias.includes(dia) ? dias.filter((d) => d !== dia) : [...dias, dia].sort();
}

export default function NotificacoesForm({
  horarioAtual,
  preferenciasIniciais,
}: {
  usuariaId: string;
  horarioAtual: string | null;
  preferenciasIniciais: NotificacoesPreferencias;
}) {
  const [permissao, setPermissao] = useState<PermissaoNotificacao>('default');
  const [preferencias, setPreferencias] = useState<NotificacoesPreferencias>(preferenciasIniciais);
  const [fusoHorario, setFusoHorario] = useState('America/Sao_Paulo');
  const [janela, setJanela] = useState<JanelaNotificacao>('manha');
  const [statusAtivacao, setStatusAtivacao] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [ativando, startTransitionAtivar] = useTransition();
  const [desativando, startTransitionDesativar] = useTransition();
  const [salvandoHorario, startTransitionHorario] = useTransition();
  const [horarioSalvo, setHorarioSalvo] = useState(false);
  const [testando, startTransitionTeste] = useTransition();
  const [statusTeste, setStatusTeste] = useState<string | null>(null);

  useEffect(() => {
    // Lê estado real do navegador (permissão + fuso horário) — sistemas
    // externos ao React, por isso só depois de montar no cliente.
    const suportado = typeof window !== 'undefined' && 'Notification' in window;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPermissao(suportado ? (Notification.permission as PermissaoNotificacao) : 'indisponivel');
    setFusoHorario(Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo');
    setJanela(horarioPreferidoParaJanela(horarioAtual, Intl.DateTimeFormat().resolvedOptions().timeZone));
  }, [horarioAtual]);

  const horariosLocaisPorJanela = useMemo(
    () => ({
      manha: horarioLocalDaJanela('manha', fusoHorario),
      noite: horarioLocalDaJanela('noite', fusoHorario),
    }),
    [fusoHorario]
  );

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
        setStatusAtivacao({ tipo: 'sucesso', texto: 'Notificações ativadas.' });
      } else if (resultado === 'negado') {
        setPermissao('denied');
        setStatusAtivacao({
          tipo: 'erro',
          texto: 'Permissão negada. Você pode reativar nas configurações de notificação do navegador.',
        });
      } else if (resultado === 'nao_suportado') {
        setPermissao('indisponivel');
        setStatusAtivacao({ tipo: 'erro', texto: 'Seu navegador não suporta notificações push agora.' });
      } else {
        setStatusAtivacao({
          tipo: 'erro',
          texto: 'Não foi possível ativar as notificações agora. Tente novamente em instantes.',
        });
      }
    });
  }

  function handleDesativar() {
    setStatusAtivacao(null);
    startTransitionDesativar(async () => {
      const ok = await desinscreverPush();
      if (ok) {
        setPermissao('default');
        setStatusAtivacao({ tipo: 'sucesso', texto: 'Notificações desativadas neste dispositivo.' });
      } else {
        setStatusAtivacao({ tipo: 'erro', texto: 'Não foi possível desativar agora. Tente novamente.' });
      }
    });
  }

  function handleSalvarHorario() {
    setHorarioSalvo(false);
    startTransitionHorario(async () => {
      await salvarHorarioPreferido(horariosLocaisPorJanela[janela], fusoHorario);
      setHorarioSalvo(true);
      setTimeout(() => setHorarioSalvo(false), 3000);
    });
  }

  function handleTeste() {
    setStatusTeste(null);
    startTransitionTeste(async () => {
      try {
        const resposta = await fetch('/api/push/teste', { method: 'POST' });
        const corpo = await resposta.json();
        setStatusTeste(
          resposta.ok
            ? 'Notificação de teste enviada — deve chegar em instantes.'
            : (corpo?.erro ?? 'Não foi possível enviar a notificação de teste.')
        );
      } catch {
        setStatusTeste('Não foi possível enviar a notificação de teste agora.');
      }
    });
  }

  const notificacoesAtivas = permissao === 'granted';

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-borda bg-superficie p-4">
        {permissao === 'granted' && (
          <div className="space-y-3">
            <p className="text-sm text-texto">
              <span className="font-medium text-acao">Ativadas.</span> Este navegador está autorizado a
              enviar notificações.
            </p>
            <button
              type="button"
              onClick={handleDesativar}
              disabled={desativando}
              className="text-sm font-medium text-texto-suave underline underline-offset-2 disabled:opacity-40"
            >
              {desativando ? 'Desativando...' : 'Desativar neste dispositivo'}
            </button>
          </div>
        )}
        {permissao === 'default' && (
          <div className="space-y-3">
            <p className="text-sm text-texto-suave">
              Ative as notificações para receber lembretes de check-in e da sua jornada.
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
          <p className="text-sm text-texto-suave">
            As notificações estão bloqueadas nas configurações do seu navegador ou dispositivo. Para
            ativar, permita notificações para este site nas configurações do sistema — não é possível
            pedir de novo por aqui.
          </p>
        )}
        {permissao === 'indisponivel' && (
          <p className="text-sm text-texto-suave">
            Seu navegador não suporta notificações push. Você ainda verá lembretes visuais dentro do
            app.
          </p>
        )}
        {statusAtivacao && (
          <p
            role="status"
            className={`mt-2 text-sm ${statusAtivacao.tipo === 'erro' ? 'text-alerta' : 'text-acao'}`}
          >
            {statusAtivacao.texto}
          </p>
        )}
      </div>

      <div className="space-y-2 rounded-2xl border border-borda/70 bg-fundo p-4">
        <p className="font-display text-sm text-texto">Como funciona</p>
        <p className="text-xs leading-relaxed text-texto-suave">
          Enviamos no máximo uma notificação por dia, numa das duas janelas abaixo — não é possível
          escolher um minuto exato, mas você escolhe se prefere de manhã ou à noite. O conteúdo muda
          conforme o que ainda está pendente no seu dia: sua jornada, o check-in, ou o resumo da semana.
        </p>
      </div>

      <div
        aria-hidden="true"
        className="flex items-center gap-3 rounded-2xl border border-borda/70 bg-superficie p-3"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-acao text-white">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-texto">Rose</p>
          <p className="truncate text-xs text-texto-suave">
            Seu momento de cuidado de hoje está te esperando.
          </p>
        </div>
      </div>

      <fieldset className="space-y-3" disabled={!notificacoesAtivas}>
        <legend className="font-display text-base text-texto">Lembretes</legend>
        {!notificacoesAtivas && (
          <p className="text-xs text-texto-suave">Ative as notificações acima para ligar estes lembretes.</p>
        )}
        {[
          { chave: 'lembreteCheckin' as const, rotulo: 'Lembrete diário de check-in' },
          { chave: 'lembreteJornada' as const, rotulo: 'Continuar uma jornada' },
          { chave: 'lembretePraticas' as const, rotulo: 'Práticas de autocuidado' },
          { chave: 'resumoSemanal' as const, rotulo: 'Resumo semanal de progresso (domingo)' },
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
        <label className="flex items-center justify-between gap-3 text-texto-suave">
          <span>
            Novas jornadas e conteúdos
            <span className="ml-2 rounded-full bg-borda/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-texto-suave">
              Indisponível
            </span>
          </span>
          <input type="checkbox" checked={false} disabled className="h-4 w-4 opacity-30" />
        </label>
        <p className="text-xs text-texto-suave">
          Ainda não enviamos avisos de novos conteúdos — só quando um lançamento de verdade acontecer,
          nunca como lembrete diário automático.
        </p>
      </fieldset>

      <div className="space-y-2">
        <p className="text-texto">Quando lembrar</p>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Janela de notificação">
          {(['manha', 'noite'] as const).map((opcao) => (
            <button
              key={opcao}
              type="button"
              role="radio"
              aria-checked={janela === opcao}
              disabled={!notificacoesAtivas}
              onClick={() => setJanela(opcao)}
              className={`rounded-2xl border p-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60 disabled:opacity-40 ${
                janela === opcao ? 'border-acao bg-acao/10 text-texto' : 'border-borda text-texto-suave'
              }`}
            >
              <span className="block text-sm font-medium">{ROTULO_POR_JANELA[opcao]}</span>
              <span className="block text-xs">~{horariosLocaisPorJanela[opcao]}</span>
            </button>
          ))}
        </div>
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

      {notificacoesAtivas && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleTeste}
            disabled={testando}
            className="w-full rounded-2xl border border-borda p-3 text-center font-medium text-texto-suave transition-colors hover:bg-fundo disabled:opacity-40"
          >
            {testando ? 'Enviando...' : 'Enviar notificação de teste'}
          </button>
          {statusTeste && (
            <p role="status" className="text-sm text-texto-suave">
              {statusTeste}
            </p>
          )}
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl border border-borda/60 bg-fundo p-4">
        <RosaBotanica
          tamanho="pequena"
          comCaule={false}
          className="pointer-events-none absolute -bottom-2 -right-2 opacity-[0.08]"
        />
        <p className="relative text-xs leading-relaxed text-texto-suave">
          Você pode mudar essas preferências quando quiser — nada aqui é permanente.
        </p>
      </div>
    </div>
  );
}
