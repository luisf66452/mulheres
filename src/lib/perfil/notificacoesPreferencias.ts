// Camada temporária baseada em localStorage — mesma justificativa de
// src/lib/praticas-progresso/armazenamento.ts: os toggles granulares abaixo
// ainda não têm coluna própria no Supabase (só horario_preferido_notificacao
// existe hoje em perfis, gravado por atualizarHorarioNotificacao). Quando
// existir uma tabela própria, só este arquivo precisa ser trocado.

export interface NotificacoesPreferencias {
  lembreteCheckin: boolean;
  lembreteJornada: boolean;
  lembretePraticas: boolean;
  avisosNovidades: boolean;
  resumoSemanal: boolean;
  diasSemana: number[]; // 0 = domingo … 6 = sábado
}

export const NOTIFICACOES_PADRAO: NotificacoesPreferencias = {
  lembreteCheckin: true,
  lembreteJornada: true,
  lembretePraticas: true,
  avisosNovidades: false,
  resumoSemanal: true,
  diasSemana: [0, 1, 2, 3, 4, 5, 6],
};

function chave(usuariaId: string): string {
  return `perfil:notificacoes:${usuariaId}`;
}

export function obterNotificacoesPreferencias(usuariaId: string): NotificacoesPreferencias {
  try {
    const bruto = window.localStorage.getItem(chave(usuariaId));
    if (!bruto) return NOTIFICACOES_PADRAO;
    return { ...NOTIFICACOES_PADRAO, ...(JSON.parse(bruto) as Partial<NotificacoesPreferencias>) };
  } catch {
    return NOTIFICACOES_PADRAO;
  }
}

export function salvarNotificacoesPreferencias(
  usuariaId: string,
  alteracoes: Partial<NotificacoesPreferencias>
): void {
  try {
    const atuais = obterNotificacoesPreferencias(usuariaId);
    window.localStorage.setItem(chave(usuariaId), JSON.stringify({ ...atuais, ...alteracoes }));
  } catch {
    // localStorage indisponível — a preferência não persiste nesta sessão, mas o app não quebra
  }
}
