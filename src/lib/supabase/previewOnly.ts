// `VERCEL_ENV` é definida pela própria Vercel por deployment — 'production'
// nos deployments de produção, 'preview' nos de branch/PR, 'development'
// localmente. NÃO é `NEXT_PUBLIC_*`, então nunca é embutida no bundle do
// client, e não existe forma de uma requisição (header, query param, cookie)
// alterar esse valor: só a própria plataforma decide qual é.
//
// Usada para liberar, só nos deployments de Preview, a leitura de jornadas
// com status='rascunho' que a RLS normalmente bloqueia — nunca para
// autenticação (a usuária ainda precisa de sessão válida) nem para
// nenhuma escrita fora do próprio registro da usuária.
export function estaEmPreviewVercel(): boolean {
  return process.env.VERCEL_ENV === 'preview';
}
