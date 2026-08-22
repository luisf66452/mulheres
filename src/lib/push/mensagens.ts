// Catálogo de mensagens por categoria. Tom: acolhedor, breve, nunca
// manipulador — proibido culpa/ameaça/vergonha/pressão. A rotação é
// determinística (hash da dedup_key) em vez de aleatória: a mesma pendência
// sempre produz a mesma escolha entre execuções do cron, o que também evita
// repetir a mesma frase em reenvios acidentais da mesma chave.
import type { CategoriaPushNotificacao } from '@/lib/supabase/types';

const MENSAGENS: Record<CategoriaPushNotificacao, string[]> = {
  sessao_abandonada: [
    'Sua sessão ficou pela metade. Você pode continuar de onde parou.',
    'Quando quiser, sua sessão está te esperando exatamente onde você deixou.',
  ],
  sessao_disponivel: [
    'Uma etapa da Rose está esperando por você 🌹',
    'Tem uma nova sessão disponível, no seu tempo.',
  ],
  praticas_pendente: [
    'Você começou uma reflexão ontem — ela ainda está guardada, esperando por você.',
    'Um exercício seu ficou pendente. Sem pressa, ele continua aí quando você quiser.',
  ],
  inatividade: [
    'Sentimos sua falta por aqui. A Rose continua te esperando, sem pressa.',
    'Faz um tempinho que você não passa por aqui. Quando quiser voltar, está tudo como você deixou.',
  ],
  continuidade: [
    'Uma nova etapa da sua jornada acabou de se abrir 🌹',
    'Você concluiu uma etapa importante — a próxima já está disponível para quando quiser.',
  ],
};

const TITULO = 'Rose';

function hashSimples(texto: string): number {
  let h = 0;
  for (let i = 0; i < texto.length; i++) {
    h = (h * 31 + texto.charCodeAt(i)) >>> 0;
  }
  return h;
}

export interface MensagemNotificacao {
  titulo: string;
  corpo: string;
}

/** Escolhe determinísticamente uma variação de mensagem a partir da dedup_key. */
export function escolherMensagem(categoria: CategoriaPushNotificacao, dedupKey: string): MensagemNotificacao {
  const variacoes = MENSAGENS[categoria];
  const indice = hashSimples(dedupKey) % variacoes.length;
  return { titulo: TITULO, corpo: variacoes[indice] };
}
