'use client';

import { useEffect } from 'react';
import SeletorObjetivos from '@/app/components/personalizacao/SeletorObjetivos';
import SeletorTemasSensiveis from '@/app/components/personalizacao/SeletorTemasSensiveis';
import SeletorLembrete from '@/app/components/personalizacao/SeletorLembrete';
import { salvarObjetivos, salvarTemasSensiveis, dispensarPersonalizacao } from '@/app/onboarding/actions';
import { salvarHorarioPreferido } from '@/app/settings/actions';
import type { ObjetivoId, TemaSensivelId } from '@/lib/perfil/personalizacao';

// Edição posterior (design seção 2, último item): reaproveita os mesmos
// componentes/validação/server actions do onboarding — nunca uma segunda
// implementação da mesma lógica. Diferença central em relação ao wizard: o
// lembrete aqui grava direto em horario_preferido_notificacao (mesma action
// que /perfil/notificacoes já usa) em vez de concluirPersonalizacao, porque
// editar não deve reescrever onboarding_extra_concluido_em — esse timestamp
// marca a primeira vez que a etapa foi respondida, não a última edição.
export default function PersonalizacaoForm({
  objetivosIniciais,
  temasIniciais,
  horarioInicial,
  personalizacaoJaVista,
}: {
  objetivosIniciais: string[];
  temasIniciais: string[];
  horarioInicial: string | null;
  personalizacaoJaVista: boolean;
}) {
  useEffect(() => {
    // Visitar a tela de edição também deve fazer o banner de /perfil sumir —
    // sem isso, quem personaliza por aqui (em vez de pelo wizard) nunca
    // dispensa o banner. Reaproveita dispensarPersonalizacao: "vista/editada"
    // e "dispensada" cumprem o mesmo papel de não mostrar mais o banner.
    // Grava só na primeira visita — personalizacaoJaVista já cobre tanto
    // quem concluiu pelo wizard quanto quem já dispensou/visitou antes.
    if (!personalizacaoJaVista) {
      void dispensarPersonalizacao();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function salvarLembreteComoEdicao(horario: string | null): Promise<{ erro?: string }> {
    await salvarHorarioPreferido(horario);
    return {};
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-display text-lg text-texto">Seus objetivos</h2>
        <SeletorObjetivos
          selecaoInicial={objetivosIniciais as ObjetivoId[]}
          onSalvar={salvarObjetivos}
          rotuloBotao="Salvar"
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg text-texto">Temas sensíveis</h2>
        <SeletorTemasSensiveis
          selecaoInicial={temasIniciais as TemaSensivelId[]}
          onSalvar={salvarTemasSensiveis}
          rotuloBotao="Salvar"
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg text-texto">Lembrete diário</h2>
        <SeletorLembrete
          horarioInicial={horarioInicial}
          onSalvar={salvarLembreteComoEdicao}
          rotuloBotao="Salvar"
        />
      </section>
    </div>
  );
}
