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
// pessoal (email, telefone, nome) é enviado — só client_ip_address e
// client_user_agent (metadados padrão de qualquer request HTTP, não PII no
// mesmo sentido) e os parâmetros mínimos de conversão. A própria Meta EXIGE
// pelo menos um dado de identificação do cliente: sem isso, ela recusa o
// evento com HTTP 400 ("Invalid parameter" / error_subcode 2804050) — não é
// opcional, foi confirmado testando contra a API real.

const VERSAO_GRAPH_API = 'v21.0';

type EventoConversionsApi = {
  nomeEvento: string;
  eventId: string;
  value?: number;
  currency?: string;
  urlOrigem?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
};

export async function enviarEventoConversionsApi(evento: EventoConversionsApi): Promise<void> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const tokenAcesso = process.env.META_CONVERSIONS_API_TOKEN;

  if (!pixelId || !tokenAcesso) {
    // Sem configuração, o evento simplesmente não é enviado por este canal
    // — o webhook do Stripe continua funcionando normalmente.
    return;
  }

  if (!evento.clientIpAddress && !evento.clientUserAgent) {
    // Sem nenhum dado de identificação do cliente a Meta recusa o evento de
    // qualquer forma (ver comentário acima) — evita a chamada fadada a
    // falhar e o log de erro correspondente.
    console.error('[meta/conversionsApi] evento sem client_ip_address/client_user_agent, não enviado', {
      nomeEvento: evento.nomeEvento,
      eventId: evento.eventId,
    });
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
            user_data: {
              client_ip_address: evento.clientIpAddress,
              client_user_agent: evento.clientUserAgent,
            },
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
