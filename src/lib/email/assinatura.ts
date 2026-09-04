import { obterResend } from './client';

const REMETENTE =
  process.env.EMAIL_REMETENTE_ASSINATURA ?? process.env.EMAIL_REMETENTE_EBOOK ?? 'Rose <onboarding@resend.dev>';

// Disparado pelo webhook do Stripe (checkout.session.completed,
// metadata.origem === 'assinatura_landing') assim que a conta é criada (ou
// reaproveitada) e o perfil promovido a premium. Igual a
// enviarEmailDownloadEbook: retorna boolean em vez de lançar — falha no
// envio não deve derrubar o processamento do webhook, só fica registrada no
// log pra acompanhamento manual.
export async function enviarEmailAcessoAssinatura(destinatario: string, urlAcesso: string): Promise<boolean> {
  const resend = obterResend();
  if (!resend) {
    console.error('[email/assinatura] Resend não configurado (RESEND_API_KEY ausente), e-mail não enviado.');
    return false;
  }

  const { error } = await resend.emails.send({
    from: REMETENTE,
    to: destinatario,
    subject: 'Sua assinatura Rose Pro está ativa 🌷',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #3a2e2e;">
        <h1 style="font-size: 20px;">Sua assinatura foi ativada!</h1>
        <p>Obrigada por assinar o <strong>Rose Pro</strong>. Use o link abaixo para acessar sua conta:</p>
        <p style="margin: 24px 0;">
          <a href="${urlAcesso}" style="background: #d6336c; color: #ffffff; padding: 12px 20px; border-radius: 16px; text-decoration: none; font-weight: 600;">
            Acessar minha conta
          </a>
        </p>
        <p style="font-size: 13px; color: #6b5b5b;">
          Se o botão não funcionar, copie e cole este link no navegador:<br />
          <a href="${urlAcesso}">${urlAcesso}</a>
        </p>
        <p style="font-size: 13px; color: #6b5b5b;">
          Se o link não funcionar ou já tiver expirado, entre em <a href="https://app.exemplo.com/login">app.exemplo.com/login</a>
          com o mesmo e-mail desta compra — a gente te envia um novo código de acesso na hora.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error('[email/assinatura] falha ao enviar e-mail de acesso', { message: error.message, destinatario });
    return false;
  }

  return true;
}
