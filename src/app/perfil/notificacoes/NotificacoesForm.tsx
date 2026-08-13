'use client';

import { useEffect, useState, useTransition } from 'react';
import { inscreverPush } from '@/lib/push/subscribe';
import { salvarHorarioPreferido } from '@/app/settings/actions';
import {
  obterNotificacoesPreferencias,
  salvarNotificacoesPreferencias,
  NOTIFICACOES_PADRAO,
  type NotificacoesPreferencias,
} from '@/lib/perfil/notificacoesPreferencias';

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
  usuariaId,
  horarioAtual,
}: {
  usuariaId: string;
  horarioAtual: string | null;
}) {
  const [permissao, setPermissao] = useState<PermissaoNotificacao>('default');
  const [preferencias, setPreferencias] = useState<NotificacoesPreferencias>(NOTIFICACOES_PADRAO);
  const [horario, setHorario] = useState(horarioAtual ?? '09:00');
  const [statusAtivacao, setStatusAtivacao] = useState<string | null>(null);
  const [ativando, startTransitionAtivar] = useTransition();
  const [salvandoHorario, startTransitionHorario] = useTransition();
  const [horarioSalvo, setHorarioSalvo] = useState(false);

  useEffect(() => {
    const suportado = typeof window !== 'undefined' && 'Notification' in window;
    // Lê o estado real da permissão do navegador e as preferências locais —
    // sistemas externos ao React, por isso a sincronização acontece só
    // depois de montar no cliente (mesmo padrão de usePersistedState).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPermissao(suportado ? (Notification.permission as PermissaoNotificacao) : 'indisponivel');
    setPreferencias(obterNotificacoesPreferencias(usuariaId));
  }, [usuariaId]);

  function atualizarPreferencia(alteracoes: Partial<NotificacoesPreferencias>) {
    const proximas = { ...preferencias, ...alteracoes };
    setPreferencias(proximas);
    salvarNotificacoesPreferencias(usuariaId, alteracoes);
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

  const notificacoesAtivas = permissao === 'granted';

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
              Ative as notificações para receber lembretes de check-in, jornadas e práticas.
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
          <p role="status" className="mt-2 text-sm text-acao">
            {statusAtivacao}
          </p>
        )}
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

      <p className="text-xs text-texto-suave">
        O envio automático de lembretes ainda está em construção — hoje só o horário preferido é usado
        pelo envio geral do app. As demais preferências acima ficam salvas para quando os lembretes
        específicos estiverem prontos.
      </p>
    </div>
  );
}
