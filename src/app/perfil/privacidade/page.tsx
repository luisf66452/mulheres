import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import CabecalhoSubpagina from '@/app/components/perfil/CabecalhoSubpagina';
import PermissoesConcedidas from './PermissoesConcedidas';
import ExportarDadosBotao from './ExportarDadosBotao';
import ExcluirContaFluxo from './ExcluirContaFluxo';

const O_QUE_GUARDAMOS = [
  'Seu perfil: nome, frase pessoal, preferências de conta',
  'Seus check-ins diários (humor, imagem corporal, relação com a comida)',
  'Suas sessões de prática e jornadas',
  'Assinaturas de notificação deste dispositivo',
];

export default async function PrivacidadePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main className="mx-auto max-w-md space-y-6 px-4 pt-6 pb-24 md:pb-8">
      <CabecalhoSubpagina titulo="Privacidade e dados" subtitulo="Você controla seus dados no Rose" />

      <div className="rounded-2xl bg-superficie p-4 shadow-[0_2px_8px_rgba(74,63,53,0.08)]">
        <p className="font-display text-base text-texto">Seus dados</p>
        <p className="mt-1 text-sm text-texto-suave">
          O Rose guarda apenas os dados necessários para o funcionamento do app e para personalizar a
          sua experiência:
        </p>
        <ul className="mt-2 space-y-1.5 text-sm text-texto-suave">
          {O_QUE_GUARDAMOS.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-texto-suave">
          Seus check-ins e reflexões são privados — ninguém da nossa equipe acessa individualmente sem
          motivo registrado e permissão explícita.
        </p>
      </div>

      <div className="rounded-2xl border border-borda bg-superficie p-4">
        <p className="font-display text-base text-texto">Permissões</p>
        <div className="mt-2">
          <PermissoesConcedidas />
        </div>
      </div>

      <Link
        href="/privacidade"
        className="block rounded-2xl border border-borda bg-superficie p-4 text-sm font-medium text-acao transition-colors hover:bg-fundo"
      >
        Ler a Política de Privacidade e os Termos de Uso completos
      </Link>

      <div className="rounded-2xl border border-borda bg-superficie p-4">
        <p className="font-display text-base text-texto">Exportar e excluir</p>
        <p className="mt-1 text-sm text-texto-suave">
          Baixe uma cópia de tudo que guardamos sobre sua conta, ou peça a exclusão definitiva.
        </p>
        <div className="mt-3 space-y-4">
          <ExportarDadosBotao />
          <div className="border-t border-borda pt-4">
            <ExcluirContaFluxo />
          </div>
        </div>
      </div>

      <NavegacaoInferior />
    </main>
  );
}
