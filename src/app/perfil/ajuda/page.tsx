import Link from 'next/link';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import CabecalhoSubpagina from '@/app/components/perfil/CabecalhoSubpagina';

const PERGUNTAS = [
  {
    pergunta: 'O Rose substitui terapia ou acompanhamento médico?',
    resposta:
      'Não. O Rose é um espaço de autocuidado e apoio emocional, mas não faz diagnóstico, não trata condições de saúde e não substitui psicoterapia ou qualquer acompanhamento profissional. Se você está em crise ou precisa de ajuda imediata, veja os recursos de segurança abaixo.',
  },
  {
    pergunta: 'Como funcionam as Pétalas?',
    resposta:
      'Você ganha Pétalas ao concluir check-ins, práticas e jornadas. Elas podem ser trocadas por recompensas no Clube Rose. Todo pedido de resgate passa por uma análise antes de ser entregue — você acompanha o status no histórico.',
  },
  {
    pergunta: 'Posso exportar ou apagar meus dados?',
    resposta:
      'Sim. Em Perfil → Privacidade você pode exportar todos os seus dados ou solicitar a exclusão definitiva da sua conta.',
  },
  {
    pergunta: 'Meus check-ins são vistos por alguém da equipe?',
    resposta:
      'Por padrão, não. Veja os detalhes completos na Política de Privacidade.',
  },
];

export default function AjudaPage() {
  return (
    <main className="mx-auto max-w-md space-y-6 px-4 pt-6 pb-[calc(6rem_+_env(safe-area-inset-bottom))] md:pb-8">
      <CabecalhoSubpagina titulo="Ajuda e suporte" subtitulo="Perguntas frequentes e como falar com a gente" />

      <div className="space-y-2 rounded-2xl border border-alerta/40 bg-superficie p-4">
        <p className="font-display text-base text-texto">Precisa de ajuda agora?</p>
        <p className="text-sm text-texto-suave">
          Se você está passando por uma crise ou pensando em se machucar, o Rose não é o lugar certo para
          esse momento — procure ajuda imediata.
        </p>
        <Link
          href="/seguranca"
          className="inline-block text-sm font-medium text-acao underline underline-offset-2"
        >
          Ver recursos de apoio e emergência
        </Link>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-lg text-texto">Perguntas frequentes</h2>
        <div className="space-y-2">
          {PERGUNTAS.map((item) => (
            <details
              key={item.pergunta}
              className="group rounded-2xl border border-borda/60 bg-superficie p-4"
            >
              <summary className="cursor-pointer font-medium text-texto marker:content-none">
                {item.pergunta}
              </summary>
              <p className="mt-2 text-sm text-texto-suave">{item.resposta}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="space-y-2 rounded-2xl border border-borda/60 bg-superficie p-4">
        <p className="font-display text-base text-texto">Fale com a gente</p>
        <p className="text-sm text-texto-suave">
          Dúvidas, problemas técnicos ou qualquer outro assunto: escreva para{' '}
          <a href="mailto:almeidaferreiraluisgustavo@gmail.com" className="underline">
            almeidaferreiraluisgustavo@gmail.com
          </a>
          . Respondemos em até alguns dias úteis.
        </p>
      </section>

      <section className="space-y-1 text-sm text-texto-suave">
        <Link href="/privacidade" className="block underline underline-offset-2">
          Política de Privacidade e Termos de Uso
        </Link>
      </section>

      <NavegacaoInferior />
    </main>
  );
}
