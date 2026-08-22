'use client';

import { useEffect, useState, useTransition, type ReactNode } from 'react';
import {
  aplicarPreferenciasNoDocumento,
  obterConfiguracoesDispositivo,
  salvarConfiguracoesDispositivo,
  CONFIGURACOES_PADRAO,
  type ConfiguracoesDispositivo,
  type Tema,
  type TamanhoTexto,
} from '@/lib/perfil/configuracoesDispositivo';
import { FUSOS_HORARIOS, detectarFusoHorarioNavegador } from '@/lib/perfil/fusosHorarios';
import InstalarRose from '@/app/components/InstalarRose';
import { atualizarFusoHorario } from './actions';

const TAMANHOS: { id: TamanhoTexto; rotulo: string }[] = [
  { id: 'padrao', rotulo: 'Padrão' },
  { id: 'grande', rotulo: 'Grande' },
  { id: 'maior', rotulo: 'Maior' },
];

const TEMAS: { id: Tema; rotulo: string }[] = [
  { id: 'sistema', rotulo: 'Sistema' },
  { id: 'clara', rotulo: 'Clara' },
  { id: 'escura', rotulo: 'Escura' },
];

const CAMPO_CLASSE =
  'mt-1 block w-full rounded-2xl border border-borda bg-superficie p-3 text-texto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60';

const BOTAO_ESCOLHA_CLASSE = (ativo: boolean) =>
  `rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60 ${
    ativo ? 'border-acao bg-acao text-white' : 'border-borda text-texto-suave hover:bg-superficie'
  }`;

function rotuloFuso(valor: string): string {
  return FUSOS_HORARIOS.find((f) => f.valor === valor)?.rotulo ?? valor;
}

function limparDadosTemporarios(usuariaId: string): number {
  // Só chaves de cache local reconstruível (visto de conquistas, preferências
  // de conteúdo) — nunca dados reais da conta, que vivem no Supabase
  // (perfil, check-ins, jornadas, Pétalas, assinatura) e nunca as
  // preferências de aparência/acessibilidade desta tela, que a usuária
  // definiu de propósito para este dispositivo.
  const prefixosDaUsuaria = [
    `conquistas:vistas:${usuariaId}`,
    `perfil:preferencias:${usuariaId}`,
    // Chaves legadas: nada grava mais aqui (práticas concluídas e
    // preferências de notificação já vivem só no Supabase), mas removemos
    // com segurança caso ainda existam de uma versão antiga do app.
    `praticas:conclusoes:${usuariaId}:`,
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

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="font-display text-base text-texto">{titulo}</h2>
      {children}
    </div>
  );
}

export default function ConfiguracoesForm({
  usuariaId,
  fusoHorarioAtual,
  versaoApp,
}: {
  usuariaId: string;
  fusoHorarioAtual: string;
  versaoApp: string;
}) {
  const [fusoHorario, setFusoHorario] = useState(fusoHorarioAtual);
  const [salvandoFuso, startTransitionFuso] = useTransition();
  const [fusoSalvo, setFusoSalvo] = useState(false);
  const [erroFuso, setErroFuso] = useState<string | null>(null);
  const [fusoSugerido, setFusoSugerido] = useState<string | null>(null);

  const [dispositivo, setDispositivo] = useState<ConfiguracoesDispositivo>(CONFIGURACOES_PADRAO);
  const [carregado, setCarregado] = useState(false);
  const [confirmandoLimpeza, setConfirmandoLimpeza] = useState(false);
  const [mensagemLimpeza, setMensagemLimpeza] = useState<string | null>(null);

  useEffect(() => {
    // Sincroniza com o localStorage do dispositivo (sistema externo) só
    // depois de montar no cliente, mesmo padrão de usePersistedState. Também
    // reaplica no <html> aqui (não só no bootstrap global de layout.tsx) para
    // esta tela ficar correta mesmo em navegação client-side entre contas
    // (logout/login sem recarregar a página).
    const config = obterConfiguracoesDispositivo(usuariaId);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDispositivo(config);
    aplicarPreferenciasNoDocumento(config);
    setCarregado(true);

    // Sugestão de fuso detectado pelo navegador: só informa, nunca
    // sobrescreve o valor salvo — a usuária precisa aplicar explicitamente.
    const detectado = detectarFusoHorarioNavegador();
    if (detectado && detectado !== fusoHorarioAtual) {
      setFusoSugerido(detectado);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuariaId]);

  function atualizarDispositivo(alteracoes: Partial<ConfiguracoesDispositivo>) {
    const proximas = salvarConfiguracoesDispositivo(usuariaId, alteracoes);
    setDispositivo(proximas);
    aplicarPreferenciasNoDocumento(proximas);
  }

  function salvarFuso(valor: string) {
    setErroFuso(null);
    setFusoSalvo(false);
    startTransitionFuso(async () => {
      const resultado = await atualizarFusoHorario(valor);
      if (resultado.erro) {
        setErroFuso(resultado.erro);
        return;
      }
      setFusoHorario(valor);
      setFusoSugerido(null);
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
      <Secao titulo="Conta">
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
          onClick={() => salvarFuso(fusoHorario)}
          disabled={salvandoFuso || fusoHorario === fusoHorarioAtual}
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
        {fusoSugerido && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-borda bg-fundo p-3 text-sm text-texto-suave">
            <span>
              Seu dispositivo indica o fuso <strong className="text-texto">{rotuloFuso(fusoSugerido)}</strong>.
            </span>
            <button
              type="button"
              onClick={() => salvarFuso(fusoSugerido)}
              disabled={salvandoFuso}
              className="shrink-0 font-medium text-acao underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60"
            >
              Usar
            </button>
          </div>
        )}

        <label className="block text-texto">
          Idioma
          <p className={`${CAMPO_CLASSE} text-texto-suave`}>Português</p>
          <p className="mt-1 text-xs text-texto-suave">O Rose está disponível em português por enquanto.</p>
        </label>
      </Secao>

      {carregado && (
        <Secao titulo="Aparência e acessibilidade">
          <fieldset className="space-y-2">
            <legend className="text-texto">Tema visual</legend>
            <div className="flex gap-2">
              {TEMAS.map((opcao) => (
                <button
                  key={opcao.id}
                  type="button"
                  aria-pressed={dispositivo.tema === opcao.id}
                  onClick={() => atualizarDispositivo({ tema: opcao.id })}
                  className={BOTAO_ESCOLHA_CLASSE(dispositivo.tema === opcao.id)}
                >
                  {opcao.rotulo}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-texto">Tamanho do texto</legend>
            <div className="flex gap-2">
              {TAMANHOS.map((opcao) => (
                <button
                  key={opcao.id}
                  type="button"
                  aria-pressed={dispositivo.tamanhoTexto === opcao.id}
                  onClick={() => atualizarDispositivo({ tamanhoTexto: opcao.id })}
                  className={BOTAO_ESCOLHA_CLASSE(dispositivo.tamanhoTexto === opcao.id)}
                >
                  {opcao.rotulo}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="flex items-center justify-between gap-3 text-texto">
            Reduzir animações
            <input
              type="checkbox"
              checked={dispositivo.reduzirAnimacoes}
              onChange={(e) => atualizarDispositivo({ reduzirAnimacoes: e.target.checked })}
              className="h-4 w-4 accent-acao"
            />
          </label>
          <p className="text-xs text-texto-suave">
            Também respeitamos a configuração de redução de movimento do seu sistema operacional,
            independente do que estiver marcado aqui.
          </p>
        </Secao>
      )}

      <Secao titulo="Armazenamento">
        <div className="space-y-2 rounded-2xl border border-borda bg-superficie p-4">
          <p className="font-display text-base text-texto">Limpar dados temporários</p>
          <p className="text-sm text-texto-suave">
            Remove só o cache local desta conta neste dispositivo (conquistas já vistas e preferências
            de conteúdo salvas localmente). Não apaga nada da sua conta no servidor — perfil, check-ins,
            jornadas, Pétalas, assinatura e suas preferências de aparência continuam intactos.
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
      </Secao>

      <Secao titulo="Sobre o Rose">
        <InstalarRose variante="compacto" />
        <p className="text-center text-xs text-texto-suave">Rose · versão {versaoApp}</p>
      </Secao>
    </div>
  );
}
