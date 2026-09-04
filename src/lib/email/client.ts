import { Resend } from 'resend';

let instancia: Resend | null | undefined;

// Lazy singleton, mesmo padrão de obterStripe/createSupabaseAdminClient — sem
// RESEND_API_KEY configurada (ex.: ambiente local sem envio de e-mail),
// retorna null em vez de derrubar o app.
export function obterResend(): Resend | null {
  if (instancia !== undefined) return instancia;

  const apiKey = process.env.RESEND_API_KEY;
  instancia = apiKey ? new Resend(apiKey) : null;
  return instancia;
}
