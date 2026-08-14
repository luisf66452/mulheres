'use client';

import { useEffect, useState } from 'react';
import {
  obterPreferencias,
  salvarPreferencias,
  PREFERENCIAS_PADRAO,
  type PreferenciasUsuaria,
  type Tema,
  type DuracaoPreferida,
  type HorarioUso,
  type TomLinguagem,
} from '@/lib/perfil/preferencias';

const TEMAS: { id: Tema; rotulo: string }[] = [
  { id: 'imagem_corporal', rotulo: 'Imagem corporal' },
  { id: 'autocompaixao', rotulo: 'Autocompaixão' },
  { id: 'comparacao', rotulo: 'Comparação' },
  { id: 'alimentacao_emocional', rotulo: 'Alimentação emocional' },
  { id: 'ansiedade_regulacao', rotulo: 'Ansiedade e regulação emocional' },
  { id: 'autoestima', rotulo: 'Autoestima' },
];

const OBJETIVOS = [
  { id: 'reduzir_ansiedade', rotulo: 'Reduzir ansiedade no dia a dia' },
  { id: 'melhorar_autoestima', rotulo: 'Melhorar minha autoestima' },
  { id: 'criar_rotina', rotulo: 'Criar uma rotina de autocuidado' },
  { id: 'entender_alimentacao', rotulo: 'Entender melhor minha relação com a comida' },
  { id: 'praticar_autocompaixao', rotulo: 'Praticar mais autocompaixão' },
];

const TIPOS_CONTEUDO = [
  { id: 'respiracao', rotulo: 'Respiração' },
  { id: 'reflexao', rotulo: 'Reflexões escritas' },
  { id: 'afirmacao', rotulo: 'Afirmações' },
  { id: 'movimento', rotulo: 'Movimento' },
];

const DURACOES: { id: DuracaoPreferida; rotulo: string }[] = [
  { id: 'curta', rotulo: 'Até 5 min' },
  { id: 'media', rotulo: '5–15 min' },
  { id: 'longa', rotulo: '15+ min' },
];

const HORARIOS: { id: HorarioUso; rotulo: string }[] = [
  { id: 'manha', rotulo: 'Manhã' },
  { id: 'tarde', rotulo: 'Tarde' },
  { id: 'noite', rotulo: 'Noite' },
];

const TONS: { id: TomLinguagem; rotulo: string }[] = [
  { id: 'acolhedor', rotulo: 'Acolhedor' },
  { id: 'direto', rotulo: 'Direto e objetivo' },
];

function alternarItem<T extends string>(lista: T[], item: T): T[] {
  return lista.includes(item) ? lista.filter((x) => x !== item) : [...lista, item];
}

function GrupoCheckbox<T extends string>({
  titulo,
  opcoes,
  selecionados,
  aoAlternar,
}: {
  titulo: string;
  opcoes: { id: T; rotulo: string }[];
  selecionados: T[];
  aoAlternar: (id: T) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="font-display text-base text-texto">{titulo}</legend>
      <div className="space-y-2">
        {opcoes.map((opcao) => (
          <label key={opcao.id} className="flex items-center gap-3 text-texto">
            <input
              type="checkbox"
              checked={selecionados.includes(opcao.id)}
              onChange={() => aoAlternar(opcao.id)}
              className="h-4 w-4 accent-acao"
            />
            {opcao.rotulo}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function GrupoSegmentado<T extends string>({
  titulo,
  opcoes,
  valor,
  aoSelecionar,
}: {
  titulo: string;
  opcoes: { id: T; rotulo: string }[];
  valor: T | null;
  aoSelecionar: (id: T) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="font-display text-base text-texto">{titulo}</legend>
      <div className="flex flex-wrap gap-2">
        {opcoes.map((opcao) => {
          const ativo = valor === opcao.id;
          return (
            <button
              key={opcao.id}
              type="button"
              aria-pressed={ativo}
              onClick={() => aoSelecionar(opcao.id)}
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
  );
}

export default function PreferenciasForm({ usuariaId }: { usuariaId: string }) {
  const [preferencias, setPreferencias] = useState<PreferenciasUsuaria>(PREFERENCIAS_PADRAO);
  const [carregado, setCarregado] = useState(false);
  const [atualizado, setAtualizado] = useState(false);

  useEffect(() => {
    // Sincroniza com o localStorage (sistema externo) só depois de montar no
    // cliente, para o primeiro render bater com o do servidor — mesmo padrão
    // de src/lib/persistencia-local/usePersistedState.ts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreferencias(obterPreferencias(usuariaId));
    setCarregado(true);
  }, [usuariaId]);

  function atualizar(alteracoes: Partial<PreferenciasUsuaria>) {
    const proximas = { ...preferencias, ...alteracoes };
    setPreferencias(proximas);
    salvarPreferencias(usuariaId, proximas);
    setAtualizado(true);
    setTimeout(() => setAtualizado(false), 2000);
  }

  if (!carregado) {
    return <p className="text-texto-suave">Carregando preferências...</p>;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-texto-suave">
        Essas escolhas nos ajudam a personalizar suas jornadas e práticas no futuro. Elas não fazem
        nenhum diagnóstico — são só suas preferências.
      </p>

      <GrupoCheckbox
        titulo="Temas de maior interesse"
        opcoes={TEMAS}
        selecionados={preferencias.temas}
        aoAlternar={(id) => atualizar({ temas: alternarItem(preferencias.temas, id) })}
      />

      <GrupoCheckbox
        titulo="Seus objetivos no app"
        opcoes={OBJETIVOS}
        selecionados={preferencias.objetivos}
        aoAlternar={(id) => atualizar({ objetivos: alternarItem(preferencias.objetivos, id) })}
      />

      <GrupoCheckbox
        titulo="Tipos de conteúdo preferidos"
        opcoes={TIPOS_CONTEUDO}
        selecionados={preferencias.tiposConteudo}
        aoAlternar={(id) => atualizar({ tiposConteudo: alternarItem(preferencias.tiposConteudo, id) })}
      />

      <GrupoSegmentado
        titulo="Duração preferida das práticas"
        opcoes={DURACOES}
        valor={preferencias.duracaoPreferida}
        aoSelecionar={(id) => atualizar({ duracaoPreferida: id })}
      />

      <GrupoCheckbox
        titulo="Horários em que costuma usar o app"
        opcoes={HORARIOS}
        selecionados={preferencias.horariosUso}
        aoAlternar={(id) => atualizar({ horariosUso: alternarItem(preferencias.horariosUso, id) })}
      />

      <GrupoSegmentado
        titulo="Tom de linguagem preferido"
        opcoes={TONS}
        valor={preferencias.tom}
        aoSelecionar={(id) => atualizar({ tom: id })}
      />

      <GrupoCheckbox
        titulo="Temas para tratar com mais cuidado"
        opcoes={TEMAS}
        selecionados={preferencias.temasCuidado}
        aoAlternar={(id) => atualizar({ temasCuidado: alternarItem(preferencias.temasCuidado, id) })}
      />

      <p role="status" className={`text-sm text-acao transition-opacity ${atualizado ? 'opacity-100' : 'opacity-0'}`}>
        Preferências atualizadas.
      </p>
    </div>
  );
}
