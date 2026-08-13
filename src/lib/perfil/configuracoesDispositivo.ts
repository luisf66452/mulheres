// Preferências exclusivas do dispositivo (não da conta) — de propósito não
// namespaced por usuária, seguindo a distinção pedida entre dados de conta
// (Supabase/perfis) e dados de aparelho (localStorage simples).

export type TamanhoTexto = 'padrao' | 'grande' | 'maior';

export interface ConfiguracoesDispositivo {
  sons: boolean;
  reproducaoAutomatica: boolean;
  reduzirAnimacoes: boolean;
  tamanhoTexto: TamanhoTexto;
}

export const CONFIGURACOES_PADRAO: ConfiguracoesDispositivo = {
  sons: true,
  reproducaoAutomatica: true,
  reduzirAnimacoes: false,
  tamanhoTexto: 'padrao',
};

const CHAVE = 'perfil:configuracoes-dispositivo';

export function obterConfiguracoesDispositivo(): ConfiguracoesDispositivo {
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    if (!bruto) return CONFIGURACOES_PADRAO;
    return { ...CONFIGURACOES_PADRAO, ...(JSON.parse(bruto) as Partial<ConfiguracoesDispositivo>) };
  } catch {
    return CONFIGURACOES_PADRAO;
  }
}

export function salvarConfiguracoesDispositivo(alteracoes: Partial<ConfiguracoesDispositivo>): void {
  try {
    const atuais = obterConfiguracoesDispositivo();
    window.localStorage.setItem(CHAVE, JSON.stringify({ ...atuais, ...alteracoes }));
  } catch {
    // localStorage indisponível — a preferência não persiste nesta sessão, mas o app não quebra
  }
}
