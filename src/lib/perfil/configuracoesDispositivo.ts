// Preferências exclusivas do dispositivo (não da conta): aparência e
// acessibilidade locais, que não precisam — e não deveriam, por privacidade e
// simplicidade — ir para o Supabase. Namespaced por usuária para não vazar/
// colidir entre contas diferentes usadas no mesmo navegador (ex.: duas
// pessoas compartilhando um tablet). "sons" e "reprodução automática de
// áudio" foram removidos: o Rose hoje não tem nenhum som nem áudio com
// autoplay (todo `midia.url` do catálogo de práticas é null), então esses
// toggles não tinham nenhum efeito real — ver Tarefa 11.

export type TamanhoTexto = 'padrao' | 'grande' | 'maior';
export type Tema = 'sistema' | 'clara' | 'escura';

export interface ConfiguracoesDispositivo {
  reduzirAnimacoes: boolean;
  tamanhoTexto: TamanhoTexto;
  tema: Tema;
}

export const CONFIGURACOES_PADRAO: ConfiguracoesDispositivo = {
  reduzirAnimacoes: false,
  tamanhoTexto: 'padrao',
  tema: 'sistema',
};

const PREFIXO_CHAVE = 'perfil:configuracoes-dispositivo';

// "convidada" cobre o caso de ainda não haver sessão resolvida (ex.: tela de
// login) — as preferências de aparência/acessibilidade fazem sentido mesmo
// antes de entrar, e não guardam nada sensível.
function construirChave(usuariaId: string | null): string {
  return `${PREFIXO_CHAVE}:${usuariaId ?? 'convidada'}`;
}

export function obterConfiguracoesDispositivo(usuariaId: string | null): ConfiguracoesDispositivo {
  try {
    const bruto = window.localStorage.getItem(construirChave(usuariaId));
    if (!bruto) return CONFIGURACOES_PADRAO;
    return { ...CONFIGURACOES_PADRAO, ...(JSON.parse(bruto) as Partial<ConfiguracoesDispositivo>) };
  } catch {
    return CONFIGURACOES_PADRAO;
  }
}

export function salvarConfiguracoesDispositivo(
  usuariaId: string | null,
  alteracoes: Partial<ConfiguracoesDispositivo>
): ConfiguracoesDispositivo {
  const proximas = { ...obterConfiguracoesDispositivo(usuariaId), ...alteracoes };
  try {
    window.localStorage.setItem(construirChave(usuariaId), JSON.stringify(proximas));
  } catch {
    // localStorage indisponível — a preferência não persiste nesta sessão, mas o app não quebra
  }
  return proximas;
}

// Único ponto que escreve os atributos no elemento raiz — todo CSS que reage
// a tamanho de texto/redução de animações/tema fica centralizado em
// globals.css, em vez de espalhado componente por componente.
export function aplicarPreferenciasNoDocumento(config: ConfiguracoesDispositivo): void {
  if (typeof document === 'undefined') return;
  const raiz = document.documentElement;

  raiz.dataset.tamanhoTexto = config.tamanhoTexto;

  if (config.reduzirAnimacoes) {
    raiz.dataset.reduzirAnimacoes = 'true';
  } else {
    delete raiz.dataset.reduzirAnimacoes;
  }

  if (config.tema === 'sistema') {
    delete raiz.dataset.tema;
  } else {
    raiz.dataset.tema = config.tema;
  }
}
