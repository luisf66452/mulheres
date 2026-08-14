'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  obterConfiguracoesDispositivo,
  salvarConfiguracoesDispositivo,
  CONFIGURACOES_PADRAO,
  type ConfiguracoesDispositivo,
  type TamanhoTexto,
} from '@/lib/perfil/configuracoesDispositivo';
import { atualizarPerfilCompleto } from '../editar/actions';

const FUSOS_HORARIOS = [
  { valor: 'America/Noronha', rotulo: 'Fernando de Noronha (UTC-2)' },
  { valor: 'America/Sao_Paulo', rotulo: 'Brasília (UTC-3)' },
  { valor: 'America/Manaus', rotulo: 'Manaus (UTC-4)' },
  { valor: 'America/Rio_Branco', rotulo: 'Acre (UTC-5)' },
];

const TAMANHOS: { id: TamanhoTexto; rotulo: string }[] = [
  { id: 'padrao', rotulo: 'Padrão' },
  { id: 'grande', rotulo: 'Grande' },
  { id: 'maior', rotulo: 'Maior' },
];

const CAMPO_CLASSE =
  'mt-1 block w-full rounded-2xl border border-borda bg-superficie p-3 text-texto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60';

function limparDadosTemporarios(usuariaId: string): number {
  const prefixosDaUsuaria = [
    `praticas:conclusoes:${usuariaId}:`,
    `conquistas:vistas:${usuariaId}`,
    `perfil:preferencias:${usuariaId}`,
    `perfil:notificacoes:${usuariaId}`,
  ];
  const chavesParaRemover: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const chave = window.localStorage.key(i);
    if (chave && prefixosDaUsuaria.some((prefixo) => chave.startsWith(prefixo))) {
      chavesParaRemover.push(chave);
    }
  }
  chavesParaRemover.forEach((chave) => window.localStorage.removeItem(chave));
  return chavesParaRemover.length;
}

export default function ConfiguracoesForm({
  usuariaId,
  nomeAtual,
  frasePessoalAtual,
  faixaEtariaAtual,
  fusoHorarioAtual,
  versaoApp,
}: {
  usuariaId: string;
  nomeAtual: string | null;
  frasePessoalAtual: string | null;
  faixaEtariaAtual: string | null;
  fusoHorarioAtual: string;
  versaoApp: string;
}) {
  const [fusoHorario, setFusoHorario] = useState(fusoHorarioAtual);
  const [salvandoFuso, startTransitionFuso] = useTransition();
  const [fusoSalvo, setFusoSalvo] = useState(false);
  const [erroFuso, setErroFuso] = useState<string | null>(null);

  const [dispositivo, setDispositivo] = useState<ConfiguracoesDispositivo>(CONFIGURACOES_PADRAO);
  const [carregado, setCarregado] = useState(false);
  const [confirmandoLimpeza, setConfirmandoLimpeza] = useState(false);
  const [mensagemLimpeza, setMensagemLimpeza] = useState<string | null>(null);

  useEffect(() => {
    // Sincroniza com o localStorage do dispositivo (sistema externo) só
    // depois de montar no cliente, mesmo padrão de usePersistedState.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDispositivo(obterConfiguracoesDispositivo());
    setCarregado(true);
  }, []);

  function atualizarDispositivo(alteracoes: Partial<ConfiguracoesDispositivo>) {
    const proximas = { ...dispositivo, ...alteracoes };
    setDispositivo(proximas);
    salvarConfiguracoesDispositivo(alteracoes);
  }

  function handleSalvarFuso() {
    setErroFuso(null);
    setFusoSalvo(false);
    startTransitionFuso(async () => {
      const resultado = await atualizarPerfilCompleto({
        nome: nomeAtual ?? '',
        frasePessoal: frasePessoalAtual ?? '',
        faixaEtaria: faixaEtariaAtual ?? '',
        fusoHorario,
        idioma: 'pt-BR',
      });
      if (resultado.erros || resultado.erroGeral) {
        setErroFuso(resultado.erroGeral ?? 'Não foi possível salvar o fuso horário.');
        return;
      }
      setFusoSalvo(true);
      setTimeout(() => setFusoSalvo(false), 3000);
    });
  }

  function handleLimpar() {
    const removidas = limparDadosTemporarios(usuariaId);
    setMensagemLimpeza(
      removidas > 0
        ? 'Dados temporários limpos. Suas preferências salvas na sua conta não foram afetadas.'
        : 'Não havia dados temporários para limpar.'
    );
    setConfirmandoLimpeza(false);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="block text-texto">
          Idioma
          <select value="pt-BR" disabled className={`${CAMPO_CLASSE} opacity-70`}>
            <option value="pt-BR">Português (Brasil)</option>
          </select>
        </label>

        <label className="block text-texto">
          Fuso horário
          <select
            value={fusoHorario}
            onChange={(e) => setFusoHorario(e.target.value)}
            className={CAMPO_CLASSE}
          >
            {FUSOS_HORARIOS.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.rotulo}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={handleSalvarFuso}
          disabled={salvandoFuso}
          className="w-full rounded-2xl border border-borda p-3 text-center font-medium text-texto-suave transition-colors hover:bg-fundo disabled:opacity-40"
        >
          {salvandoFuso ? 'Salvando...' : 'Salvar fuso horário'}
        </button>
        {fusoSalvo && (
          <p role="status" className="text-sm text-acao">
            Fuso horário salvo.
          </p>
        )}
        {erroFuso && (
          <p role="alert" className="text-sm text-alerta">
            {erroFuso}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-borda bg-superficie p-4">
        <p className="text-sm text-texto">
          <span className="font-medium">Tema visual</span>{' '}
          <span className="text-texto-suave">— Em breve</span>
        </p>
      </div>

      {carregado && (
        <div className="space-y-3">
          <label className="flex items-center justify-between gap-3 text-texto">
            Sons
            <input
              type="checkbox"
              checked={dispositivo.sons}
              onChange={(e) => atualizarDispositivo({ sons: e.target.checked })}
              className="h-4 w-4 accent-acao"
            />
          </label>
          <label className="flex items-center justify-between gap-3 text-texto">
            Reprodução automática de áudio
            <input
              type="checkbox"
              checked={dispositivo.reproducaoAutomatica}
              onChange={(e) => atualizarDispositivo({ reproducaoAutomatica: e.target.checked })}
              className="h-4 w-4 accent-acao"
            />
          </label>
          <label className="flex items-center justify-between gap-3 text-texto">
            Reduzir animações
            <input
              type="checkbox"
              checked={dispositivo.reduzirAnimacoes}
              onChange={(e) => atualizarDispositivo({ reduzirAnimacoes: e.target.checked })}
              className="h-4 w-4 accent-acao"
            />
          </label>

          <fieldset className="space-y-2">
            <legend className="font-display text-base text-texto">Tamanho do texto</legend>
            <div className="flex gap-2">
              {TAMANHOS.map((opcao) => {
                const ativo = dispositivo.tamanhoTexto === opcao.id;
                return (
                  <button
                    key={opcao.id}
                    type="button"
                    aria-pressed={ativo}
                    onClick={() => atualizarDispositivo({ tamanhoTexto: opcao.id })}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60 ${
                      ativo ? 'border-acao bg-acao text-white' : 'border-borda text-texto-suave hover:bg-superficie'
                    }`}
                  >
                    {opcao.rotulo}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>
      )}

      <p className="text-xs text-texto-suave">
        Também respeitamos a configuração de redução de movimento do seu sistema operacional,
        independente do que estiver marcado aqui.
      </p>

      <div className="space-y-2 rounded-2xl border border-borda bg-superficie p-4">
        <p className="font-display text-base text-texto">Limpar dados temporários</p>
        <p className="text-sm text-texto-suave">
          Remove apenas o cache local desta conta neste dispositivo (práticas rápidas concluídas,
          conquistas vistas, preferências e notificações salvas localmente). Não apaga nada da sua
          conta no servidor.
        </p>
        {!confirmandoLimpeza ? (
          <button
            type="button"
            onClick={() => setConfirmandoLimpeza(true)}
            className="text-sm font-medium text-acao underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60"
          >
            Limpar dados temporários
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleLimpar}
              className="rounded-2xl bg-acao px-4 py-2 text-sm font-medium text-white hover:bg-acao/90"
            >
              Confirmar limpeza
            </button>
            <button
              type="button"
              onClick={() => setConfirmandoLimpeza(false)}
              className="rounded-2xl border border-borda px-4 py-2 text-sm font-medium text-texto-suave hover:bg-fundo"
            >
              Cancelar
            </button>
          </div>
        )}
        {mensagemLimpeza && (
          <p role="status" className="text-sm text-acao">
            {mensagemLimpeza}
          </p>
        )}
      </div>

      <div className="text-center text-xs text-texto-suave">Rose · versão {versaoApp}</div>
    </div>
  );
}
