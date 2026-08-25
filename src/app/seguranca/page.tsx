import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import NotificacaoPetalas from '@/app/components/clube-rose/NotificacaoPetalas';
import SeletorPaisSeguranca from '@/app/components/seguranca/SeletorPaisSeguranca';
import { PAISES_SUPORTADOS, type PaisSuportado } from '@/lib/perfil/pais';
import { NUMERO_EMERGENCIA_LOCAL } from '@/lib/perfil/emergenciaLocal';
import type { RecursoSeguranca } from '@/lib/supabase/types';

function paisValido(valor: string | undefined): PaisSuportado | null {
  if (!valor) return null;
  return (PAISES_SUPORTADOS as readonly string[]).includes(valor) ? (valor as PaisSuportado) : null;
}

export default async function SegurancaPage({
  searchParams,
}: {
  searchParams: Promise<{ petalas?: string; pais?: string }>;
}) {
  const { petalas, pais: paisParam } = await searchParams;
  const petalasGanhas = petalas ? Number.parseInt(petalas, 10) : 0;
  const supabase = await createSupabaseServerClient();

  // Este espaço precisa funcionar mesmo sem sessão — quem está buscando
  // ajuda agora não pode ficar preso a um redirect de login. Não há gate de
  // autenticação nesta rota (ver src/proxy.ts, que trata /seguranca como
  // pública); getUser() aqui só decide QUAL país usar.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let paisDaConta: PaisSuportado | null = null;
  if (user) {
    const { data: perfil } = await supabase
      .from('perfis')
      .select('pais, pais_confirmado_em')
      .eq('id', user.id)
      .maybeSingle();
    // Só usamos o país se a própria usuária já o confirmou explicitamente —
    // um valor de `pais` não confirmado é só o default da conta, não uma
    // informação em que vale a pena basear contatos de emergência.
    paisDaConta = perfil?.pais_confirmado_em ? paisValido(perfil.pais) : null;
  }

  // Sem conta, ou com conta mas país ainda não confirmado: cai para a
  // seleção manual (?pais=PT|BR, escolhida no client por
  // SeletorPaisSeguranca). O país da conta sempre tem prioridade sobre a
  // querystring quando os dois existem — nunca deixamos uma querystring
  // antiga sobrepor um país já confirmado no perfil.
  const paisEfetivo = paisDaConta ?? paisValido(paisParam);

  // Consulta resiliente: só recursos com fonte oficial verificada aparecem
  // como confirmados (Seção 1 do design — fonte E verificado_em precisam
  // dos dois preenchidos). Se a consulta falhar ou vier vazia, `recursos`
  // fica [] e a tela continua funcional — o bloco de orientação fixo abaixo
  // nunca depende deste resultado.
  //
  // Usa o admin client (service role) em vez do cliente autenticado: a
  // tabela não tem GRANT nem policy para `anon` (o projeto nunca concede
  // acesso a `anon`), então para uma visita sem sessão o cliente autenticado
  // normal não conseguiria ler nada. `recursos_seguranca` é um catálogo
  // público de texto informativo, sem dado pessoal — ler com o admin client
  // aqui é seguro e é o mesmo padrão já usado em outras rotas do projeto
  // para operações independentes de sessão (src/lib/supabase/admin.ts).
  // createSupabaseAdminClient() retorna null se as variáveis de ambiente do
  // service role estiverem ausentes — tratado como mais um caso de "consulta
  // indisponível", nunca como erro fatal da página.
  let recursos: RecursoSeguranca[] = [];
  if (paisEfetivo) {
    const admin = createSupabaseAdminClient();
    if (admin) {
      const { data, error } = await admin
        .from('recursos_seguranca')
        .select('*')
        .eq('pais', paisEfetivo)
        .not('fonte', 'is', null)
        .not('verificado_em', 'is', null)
        .order('ordem');
      if (!error && data) {
        recursos = data;
      }
    }
  }

  const emergenciaLocal = paisEfetivo ? NUMERO_EMERGENCIA_LOCAL[paisEfetivo] : null;

  return (
    <>
      {petalasGanhas > 0 && <NotificacaoPetalas quantidade={petalasGanhas} />}
      <main className="mx-auto max-w-md space-y-6 p-6">
        <div className="space-y-2 rounded-2xl border border-alerta bg-alerta/10 p-4">
          <p className="font-medium text-texto">A Rose não acompanha emergências em tempo real.</p>
          <p className="text-texto">
            Se você ou alguém perto de você está em risco imediato, ligue agora para o número de
            emergência do seu país{emergenciaLocal ? ':' : '.'}
          </p>
          {emergenciaLocal && (
            <a
              href={`tel:${emergenciaLocal.numero}`}
              className="inline-block font-display text-2xl text-acao underline underline-offset-4"
            >
              {emergenciaLocal.rotulo}
            </a>
          )}
        </div>

        {!paisEfetivo && <SeletorPaisSeguranca />}

        {recursos.map((recurso) => (
          <div key={recurso.id} className="space-y-1 border-l-4 border-alerta pl-4">
            <h2 className="font-display text-xl text-texto">{recurso.titulo}</h2>
            <p className="text-texto">{recurso.corpo}</p>
          </div>
        ))}

        <Link
          href="/"
          className="block w-full rounded-2xl border border-borda p-3 text-center font-medium text-texto-suave transition-colors hover:bg-superficie"
        >
          Voltar ao app
        </Link>
      </main>
    </>
  );
}
