import { obterResend } from './client';

const REMETENTE = process.env.EMAIL_REMETENTE_EBOOK ?? 'Rose <onboarding@resend.dev>';

// Backup do link gerado em /ebook/obrigado (ver src/lib/stripe/ebook.ts) —
// disparado pelo webhook do Stripe assim que o pagamento é confirmado, para
// a cliente ter como recuperar o download mesmo se sair da página antes de
// clicar (fechou a aba, o redirect do Stripe falhou, etc.). Retorna boolean
// em vez de lançar erro: falha no envio não deve derrubar o processamento do
// webhook, só fica registrada no log pra acompanhamento manual.
export async function enviarEmailDownloadEbook(destinatario: string, urlDownload: string): Promise<boolean> {
  const resend = obterResend();
  if (!resend) {
    console.error('[email/ebook] Resend não configurado (RESEND_API_KEY ausente), e-mail não enviado.');
    return false;
  }

  const { error } = await resend.emails.send({
    from: REMETENTE,
    to: destinatario,
    subject: 'Seu ebook Rose Reset 21 dias está pronto 🌷',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #3a2e2e;">
        <h1 style="font-size: 20px;">Sua compra foi confirmada!</h1>
        <p>Obrigada por comprar o <strong>Rose Reset 21 dias</strong>. Seu ebook já está pronto para baixar:</p>
        <p style="margin: 24px 0;">
          <a href="${urlDownload}" style="background: #d6336c; color: #ffffff; padding: 12px 20px; border-radius: 16px; text-decoration: none; font-weight: 600;">
            Baixar meu ebook
          </a>
        </p>
        <p style="font-size: 13px; color: #6b5b5b;">
          Se o botão não funcionar, copie e cole este link no navegador:<br />
          <a href="${urlDownload}">${urlDownload}</a>
        </p>
        <p style="font-size: 13px; color: #6b5b5b;">
          Este link tem validade de alguns dias. Se expirar antes de você conseguir baixar, responda este
          e-mail que reenviamos um novo.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error('[email/ebook] falha ao enviar e-mail do ebook', { message: error.message, destinatario });
    return false;
  }

  return true;
}
