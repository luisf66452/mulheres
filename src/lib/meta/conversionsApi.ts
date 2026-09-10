// Envia eventos de conversão direto do servidor para a Meta (Conversions
// API) — complementa o Meta Pixel do navegador (ver src/lib/meta/eventos.ts),
// que só dispara se a usuária aceitar cookies de marketing e não tiver
// bloqueador de anúncios/rastreamento. Sem essa camada, uma venda real podia
// nunca chegar à Meta se o navegador da cliente não cooperasse. `eventId`
// deve ser o mesmo usado na chamada equivalente do fbq() no navegador (ver
// rastrearEvento) — é o que permite a Meta deduplicar o mesmo evento quando
// os dois caminhos disparam.
//
// Segue a mesma política de privacidade do pixel do navegador: nenhum dado
// pessoal (email, telefone, nome) é enviado, só os parâmetros mínimos de
// conversão.

const VERSAO_GRAPH_API = 'v21.0';

type EventoConversionsApi = {
  nomeEvento: string;
  eventId: string;
  value?: number;
  currency?: string;
  urlOrigem?: string;
};

export async function enviarEventoConversionsApi(evento: EventoConversionsApi): Promise<void> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const tokenAcesso = process.env.META_CONVERSIONS_API_TOKEN;

  if (!pixelId || !tokenAcesso) {
    // Sem configuração, o evento simplesmente não é enviado por este canal
    // — o webhook do Stripe continua funcionando normalmente.
    return;
  }

  try {
    const resposta = await fetch(`https://graph.facebook.com/${VERSAO_GRAPH_API}/${pixelId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: tokenAcesso,
        data: [
          {
            event_name: evento.nomeEvento,
            event_time: Math.floor(Date.now() / 1000),
            event_id: evento.eventId,
            action_source: 'website',
            event_source_url: evento.urlOrigem,
            custom_data: {
              value: evento.value,
              currency: evento.currency,
            },
          },
        ],
      }),
    });

    if (!resposta.ok) {
      const corpo = await resposta.text();
      console.error('[meta/conversionsApi] Meta recusou o evento', {
        status: resposta.status,
        corpo,
        nomeEvento: evento.nomeEvento,
      });
    }
  } catch (erro) {
    console.error('[meta/conversionsApi] falha ao enviar evento', {
      message: erro instanceof Error ? erro.message : 'erro desconhecido',
      nomeEvento: evento.nomeEvento,
    });
  }
}
