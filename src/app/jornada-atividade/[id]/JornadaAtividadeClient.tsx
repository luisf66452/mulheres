'use client';

import { registrarSessaoJornada } from './actions';
import { salvarRespostaModulo } from './respostasActions';
import AntesDepoisAtividade from '@/app/components/AntesDepoisAtividade';
import ModuloEstruturadoAtividade from '@/app/components/jornadas-modulos/ModuloEstruturadoAtividade';
import type { JornadaAtividade } from '@/lib/supabase/types';
import type { ModuloEstruturadoV1, RespostaModuloV1 } from '@/lib/jornadas-modulos/tipos';

export default function JornadaAtividadeClient({
  atividade,
  checkinId,
  moduloEstruturado,
  jornadaUsuarioId,
  respostaInicial,
}: {
  atividade: JornadaAtividade;
  checkinId: string;
  moduloEstruturado: ModuloEstruturadoV1 | null;
  jornadaUsuarioId: string | null;
  respostaInicial: RespostaModuloV1 | null;
}) {
  const aoFinalizar = (sensacaoAntes: number, sensacaoDepois: number) =>
    registrarSessaoJornada({
      checkinId,
      jornadaAtividadeId: atividade.id,
      sensacaoAntes,
      sensacaoDepois,
    });

  if (moduloEstruturado && jornadaUsuarioId) {
    return (
      <ModuloEstruturadoAtividade
        titulo={atividade.titulo}
        modulo={moduloEstruturado}
        respostaInicial={respostaInicial}
        aoFinalizar={aoFinalizar}
        salvarRascunho={(respostas) =>
          salvarRespostaModulo({
            atividadeId: atividade.id,
            jornadaUsuarioId,
            respostas,
          })
        }
      />
    );
  }

  return <AntesDepoisAtividade titulo={atividade.titulo} conteudo={atividade.conteudo} aoFinalizar={aoFinalizar} />;
}
