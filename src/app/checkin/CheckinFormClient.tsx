'use client';

import { useState } from 'react';
import { submeterCheckin } from './actions';
import Escala from '@/app/components/Escala';
import Botao from '@/app/components/Botao';
import type { EstadoGeral, AlimentacaoPercebida } from '@/lib/supabase/types';
import { estadoInicialParaHumor, type HumorInicial } from '@/lib/checkin/humorInicial';

type Etapa =
  | 'estado_geral'
  | 'emocao'
  | 'intensidade'
  | 'corpo'
  | 'gatilhos'
  | 'alimentacao'
  | 'contexto'
  | 'proxima_acao'
  | 'guardado';

const QUADRANTES: { valor: EstadoGeral; titulo: string; descricao: string }[] = [
  { valor: 'alta_energia_desconforto', titulo: 'Energia alta, desconforto', descricao: 'Ansiedade, irritação, tensão, sobrecarga' },
  { valor: 'alta_energia_conforto', titulo: 'Energia alta, conforto', descricao: 'Entusiasmo, inspiração, alegria, animação' },
  { valor: 'baixa_energia_desconforto', titulo: 'Energia baixa, desconforto', descricao: 'Tristeza, solidão, cansaço, desânimo' },
  { valor: 'baixa_energia_conforto', titulo: 'Energia baixa, conforto', descricao: 'Calma, segurança, serenidade, satisfação' },
];

const EMOCOES_POR_QUADRANTE: Record<EstadoGeral, { palavra: string; explicacao: string }[]> = {
  alta_energia_desconforto: [
    { palavra: 'Ansiosa', explicacao: 'Uma sensação de alerta ou preocupação com o que pode vir.' },
    { palavra: 'Apreensiva', explicacao: 'Um receio sobre algo que ainda não aconteceu.' },
    { palavra: 'Assustada', explicacao: 'Uma reação forte a algo que pareceu ameaçador.' },
    { palavra: 'Sobrecarregada', explicacao: 'A sensação de ter mais do que dá conta agora.' },
    { palavra: 'Irritada', explicacao: 'Um incômodo que pede espaço.' },
    { palavra: 'Frustrada', explicacao: 'Quando algo não saiu como você esperava.' },
  ],
  baixa_energia_desconforto: [
    { palavra: 'Insegura', explicacao: 'Uma dúvida sobre si mesma ou sobre a situação.' },
    { palavra: 'Decepcionada', explicacao: 'Quando a realidade ficou aquém do que você esperava.' },
    { palavra: 'Triste', explicacao: 'Uma sensação de perda ou vazio.' },
    { palavra: 'Solitária', explicacao: 'A sensação de estar sozinha, mesmo que não esteja.' },
    { palavra: 'Cansada', explicacao: 'Pouca energia para continuar agora.' },
    { palavra: 'Desanimada', explicacao: 'Falta de ânimo para seguir em frente.' },
  ],
  baixa_energia_conforto: [
    { palavra: 'Tranquila', explicacao: 'Uma sensação de paz, sem pressa.' },
    { palavra: 'Aliviada', explicacao: 'Quando um peso parece ter diminuído.' },
    { palavra: 'Esperançosa', explicacao: 'Uma expectativa gentil de que as coisas podem melhorar.' },
  ],
  alta_energia_conforto: [
    { palavra: 'Animada', explicacao: 'Energia boa, com vontade de agir.' },
    { palavra: 'Inspirada', explicacao: 'Uma ideia ou vontade que te move.' },
    { palavra: 'Confiante', explicacao: 'Uma sensação de segurança em si mesma.' },
  ],
};

const LOCAIS_GATILHO = ['Redes sociais', 'Diante do espelho', 'Em fotografias', 'Ao experimentar roupas', 'Após um comentário', 'Outra situação'];

const OPCOES_ALIMENTACAO: { valor: AlimentacaoPercebida; rotulo: string }[] = [
  { valor: 'tranquila', rotulo: 'Tranquila' },
  { valor: 'satisfeita', rotulo: 'Satisfeita' },
  { valor: 'indiferente', rotulo: 'Indiferente' },
  { valor: 'ansiosa', rotulo: 'Ansiosa' },
  { valor: 'culpada', rotulo: 'Culpada' },
  { valor: 'confusa', rotulo: 'Confusa' },
  { valor: 'vontade_punir', rotulo: 'Com vontade de me punir' },
  { valor: 'prefiro_nao_responder', rotulo: 'Prefiro não responder' },
];

const FATORES_DISPONIVEIS = [
  'Sono', 'Redes sociais', 'Estudos', 'Trabalho', 'Exercício', 'Ciclo menstrual',
  'Comentários sobre aparência', 'Relacionamento', 'Família', 'Alimentação',
  'Situação social', 'Fotografia', 'Roupa', 'Espelho',
];

export default function CheckinFormClient({ humorInicial }: { humorInicial: HumorInicial | null }) {
  // Captura se o componente foi aberto pelo atalho de humor da tela de início
  // (prop não muda entre renders, então um const simples basta).
  const entrouViaHumorInicial = humorInicial !== null;

  const [etapa, setEtapa] = useState<Etapa>(humorInicial ? 'emocao' : 'estado_geral');

  const [estadoGeral, setEstadoGeral] = useState<EstadoGeral | null>(
    humorInicial ? estadoInicialParaHumor(humorInicial) : null
  );
  const [emocaoEspecifica, setEmocaoEspecifica] = useState<string | null>(null);
  const [intensidade, setIntensidade] = useState<number | null>(null);
  const [confortoCorporal, setConfortoCorporal] = useState<number | null>(null);

  const [gatilhoAconteceu, setGatilhoAconteceu] = useState<boolean | null>(null);
  const [gatilhoLocal, setGatilhoLocal] = useState('');
  const [gatilhoPensamento, setGatilhoPensamento] = useState('');
  const [gatilhoEmocaoDepois, setGatilhoEmocaoDepois] = useState('');

  const [alimentacaoPercebida, setAlimentacaoPercebida] = useState<AlimentacaoPercebida | null>(null);

  const [fatores, setFatores] = useState<string[]>([]);
  const [fatorOutro, setFatorOutro] = useState('');
  const [anotacao, setAnotacao] = useState('');

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function alternarFator(fator: string) {
    setFatores((atual) =>
      atual.includes(fator) ? atual.filter((f) => f !== fator) : [...atual, fator]
    );
  }

  async function handleProximaAcao(acao: 'guardar' | 'entender' | 'pratica_rapida') {
    if (!estadoGeral || !emocaoEspecifica || intensidade === null || confortoCorporal === null || !alimentacaoPercebida) {
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      const resultado = await submeterCheckin({
        estadoGeral,
        emocaoEspecifica,
        intensidade,
        confortoCorporal,
        gatilhoLocal: gatilhoAconteceu ? gatilhoLocal || null : null,
        gatilhoPensamento: gatilhoAconteceu ? gatilhoPensamento || null : null,
        gatilhoEmocaoDepois: gatilhoAconteceu ? gatilhoEmocaoDepois || null : null,
        alimentacaoPercebida,
        fatores: fatorOutro.trim() ? [...fatores, fatorOutro.trim()] : fatores,
        anotacao: anotacao.trim() || undefined,
        proximaAcao: acao,
      });
      if (resultado?.tipo === 'guardado') {
        setEtapa('guardado');
      }
    } catch {
      setErro('Algo deu errado ao salvar seu check-in. Tente novamente.');
      setEnviando(false);
    }
  }

  if (etapa === 'estado_geral') {
    return (
      <main className="mx-auto max-w-md space-y-6 p-6">
        <h1 className="font-display text-2xl text-texto">Como você está se sentindo hoje?</h1>
        <p className="text-sm text-texto-suave">
          Não existe emoção errada — cada uma traz uma informação. Escolha o que mais se aproxima de agora.
        </p>
        <div className="space-y-3">
          {QUADRANTES.map((q) => (
            <button
              key={q.valor}
              type="button"
              onClick={() => {
                setEstadoGeral(q.valor);
                setEtapa('emocao');
              }}
              className="block w-full rounded-2xl border border-borda bg-superficie p-4 text-left transition-colors hover:bg-fundo"
            >
              <p className="font-display text-base text-texto">{q.titulo}</p>
              <p className="text-sm text-texto-suave">{q.descricao}</p>
            </button>
          ))}
        </div>
      </main>
    );
  }

  if (etapa === 'emocao' && estadoGeral) {
    return (
      <main className="mx-auto max-w-md space-y-6 p-6">
        <h1 className="font-display text-2xl text-texto">Qual dessas palavras combina mais?</h1>
        <div className="space-y-3">
          {EMOCOES_POR_QUADRANTE[estadoGeral].map((e) => (
            <button
              key={e.palavra}
              type="button"
              onClick={() => {
                setEmocaoEspecifica(e.palavra);
                setEtapa('intensidade');
              }}
              className="block w-full rounded-2xl border border-borda bg-superficie p-4 text-left transition-colors hover:bg-fundo"
            >
              <p className="font-display text-base text-texto">{e.palavra}</p>
              <p className="text-sm text-texto-suave">{e.explicacao}</p>
            </button>
          ))}
        </div>
        {entrouViaHumorInicial && (
          <Botao
            variante="secundaria"
            onClick={() => {
              setEstadoGeral(null);
              setEtapa('estado_geral');
            }}
          >
            Nenhuma dessas — escolher outro estado
          </Botao>
        )}
      </main>
    );
  }

  if (etapa === 'intensidade') {
    return (
      <main className="mx-auto max-w-md space-y-6 p-6">
        <h1 className="font-display text-2xl text-texto">Com que intensidade você sente isso?</h1>
        <p className="text-sm text-texto-suave">1 é bem sutil, 5 é bem intenso.</p>
        <Escala valor={intensidade} onChange={setIntensidade} />
        <Botao disabled={intensidade === null} onClick={() => setEtapa('corpo')}>
          Continuar
        </Botao>
      </main>
    );
  }

  if (etapa === 'corpo') {
    return (
      <main className="mx-auto max-w-md space-y-6 p-6">
        <h1 className="font-display text-2xl text-texto">Como está sua relação com o seu corpo hoje?</h1>
        <p className="text-sm text-texto-suave">1 é bem desconfortável, 5 é bem confortável.</p>
        <Escala valor={confortoCorporal} onChange={setConfortoCorporal} />
        <Botao disabled={confortoCorporal === null} onClick={() => setEtapa('gatilhos')}>
          Continuar
        </Botao>
      </main>
    );
  }

  if (etapa === 'gatilhos') {
    return (
      <main className="mx-auto max-w-md space-y-6 p-6">
        <h1 className="font-display text-2xl text-texto">Aconteceu alguma comparação?</h1>
        <p className="text-sm text-texto-suave">Essa etapa é opcional — pode pular se preferir.</p>
        <div className="flex gap-3">
          <Botao
            variante={gatilhoAconteceu === true ? 'primaria' : 'secundaria'}
            onClick={() => setGatilhoAconteceu(true)}
          >
            Sim
          </Botao>
          <Botao
            variante={gatilhoAconteceu === false ? 'primaria' : 'secundaria'}
            onClick={() => setGatilhoAconteceu(false)}
          >
            Não
          </Botao>
        </div>

        {gatilhoAconteceu && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-texto">Onde aconteceu?</p>
              <div className="flex flex-wrap gap-2">
                {LOCAIS_GATILHO.map((local) => (
                  <button
                    key={local}
                    type="button"
                    onClick={() => setGatilhoLocal(local)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      gatilhoLocal === local ? 'border-acao bg-acao text-white' : 'border-borda bg-superficie text-texto-suave'
                    }`}
                  >
                    {local}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-texto" htmlFor="gatilho-pensamento">
                Qual pensamento apareceu? (opcional)
              </label>
              <textarea
                id="gatilho-pensamento"
                value={gatilhoPensamento}
                onChange={(e) => setGatilhoPensamento(e.target.value)}
                className="w-full rounded-2xl border border-borda bg-superficie p-3 text-texto"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-texto" htmlFor="gatilho-emocao">
                Qual emoção veio depois? (opcional)
              </label>
              <textarea
                id="gatilho-emocao"
                value={gatilhoEmocaoDepois}
                onChange={(e) => setGatilhoEmocaoDepois(e.target.value)}
                className="w-full rounded-2xl border border-borda bg-superficie p-3 text-texto"
                rows={2}
              />
            </div>
          </div>
        )}

        <Botao disabled={gatilhoAconteceu === null} onClick={() => setEtapa('alimentacao')}>
          Continuar
        </Botao>
      </main>
    );
  }

  if (etapa === 'alimentacao') {
    return (
      <main className="mx-auto max-w-md space-y-6 p-6">
        <h1 className="font-display text-2xl text-texto">Como você se sentiu em relação à alimentação hoje?</h1>
        <p className="text-sm text-texto-suave">Sem contar calorias, sem classificar alimentos — só como você se sentiu.</p>
        <div className="space-y-3">
          {OPCOES_ALIMENTACAO.map((o) => (
            <button
              key={o.valor}
              type="button"
              onClick={() => {
                setAlimentacaoPercebida(o.valor);
                setEtapa('contexto');
              }}
              className="block w-full rounded-2xl border border-borda bg-superficie p-4 text-left text-texto transition-colors hover:bg-fundo"
            >
              {o.rotulo}
            </button>
          ))}
        </div>
      </main>
    );
  }

  if (etapa === 'contexto') {
    return (
      <main className="mx-auto max-w-md space-y-6 p-6">
        <h1 className="font-display text-2xl text-texto">Algo disso fez parte do seu dia?</h1>
        <p className="text-sm text-texto-suave">Selecione quantos quiser — também é opcional.</p>
        <div className="flex flex-wrap gap-2">
          {FATORES_DISPONIVEIS.map((fator) => (
            <button
              key={fator}
              type="button"
              onClick={() => alternarFator(fator)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                fatores.includes(fator) ? 'border-acao bg-acao text-white' : 'border-borda bg-superficie text-texto-suave'
              }`}
            >
              {fator}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <label className="text-sm text-texto" htmlFor="fator-outro">
            Outro fator (opcional)
          </label>
          <input
            id="fator-outro"
            value={fatorOutro}
            onChange={(e) => setFatorOutro(e.target.value)}
            className="w-full rounded-2xl border border-borda bg-superficie p-3 text-texto"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-texto" htmlFor="anotacao">
            Espaço livre, se quiser escrever mais (opcional — não é analisado nem monitorado)
          </label>
          <textarea
            id="anotacao"
            value={anotacao}
            onChange={(e) => setAnotacao(e.target.value)}
            className="w-full rounded-2xl border border-borda bg-superficie p-3 text-texto"
            rows={3}
          />
        </div>
        <Botao onClick={() => setEtapa('proxima_acao')}>Continuar</Botao>
      </main>
    );
  }

  if (etapa === 'proxima_acao') {
    return (
      <main className="mx-auto max-w-md space-y-6 p-6">
        <h1 className="font-display text-2xl text-texto">O que você quer fazer agora?</h1>
        {erro && <p className="text-sm text-alerta">{erro}</p>}
        <div className="space-y-3">
          <Botao disabled={enviando} onClick={() => handleProximaAcao('guardar')}>
            Apenas guardar este momento
          </Botao>
          <Botao variante="secundaria" disabled={enviando} onClick={() => handleProximaAcao('entender')}>
            Entender melhor o que aconteceu
          </Botao>
          <Botao variante="secundaria" disabled={enviando} onClick={() => handleProximaAcao('pratica_rapida')}>
            Fazer uma prática rápida agora
          </Botao>
        </div>
      </main>
    );
  }

  // etapa === 'guardado'
  return (
    <main className="mx-auto max-w-md space-y-4 p-6 text-center">
      <p className="text-3xl">🌿</p>
      <h1 className="font-display text-2xl text-texto">Seu momento foi guardado</h1>
      <p className="text-sm text-texto-suave">
        Obrigada por se dar esse espaço hoje. Você pode ver seu progresso quando quiser.
      </p>
      <a
        href="/progresso"
        className="block w-full rounded-2xl bg-acao p-3 text-center font-medium text-white transition-colors hover:bg-acao/90"
      >
        Ver meu progresso
      </a>
    </main>
  );
}
