import type { Metadata } from 'next';
import { Lora, Manrope } from 'next/font/google';
import { obterStripe } from '@/lib/stripe/client';
import {
  buscarPrecoDetalhado,
  buscarPrecoExibicao,
  ebookConfigurado,
  obterMoedaELocaleDoPais,
  obterPriceId,
  obterPriceIdEbook,
} from '@/lib/stripe/planos';
import EbookClient from './EbookClient';
import EbookViewContent from './EbookViewContent';
import RamoFloral from './RamoFloral';

const lora = Lora({
  variable: '--eb-font-serif',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const manrope = Manrope({
  variable: '--eb-font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

// Revalida a cada hora — sem isso, Next.js prerenderia esta página estática
// no build e o preço exibido ficaria congelado no valor de build time,
// mesmo que o Price no Stripe (ou STRIPE_PRICE_ID_EBOOK) mude depois.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Guia Rose — 21 dias pra sair do piloto automático | Ebook por R$ 19,99',
  description:
    'Um guia diário, direto ao ponto: 5 a 10 minutos por dia pra voltar a se sentir em casa no seu corpo. 21 práticas, acesso imediato, pagamento único de R$ 19,99.',
  openGraph: {
    title: 'Guia Rose — 21 dias pra sair do piloto automático',
    description:
      '5 a 10 minutos por dia pra voltar a se sentir em casa no seu corpo. 21 práticas, acesso imediato, pagamento único.',
    type: 'website',
    images: ['/rose-ebook-capa.png'],
  },
  twitter: {
    card: 'summary_large_image',
  },
};

const DIAS_DO_GUIA = Array.from({ length: 21 }, (_, indice) => indice + 1);
const CORES_DO_RASTREADOR = ['var(--eb-rose-burnt)', 'var(--eb-blush)', 'color-mix(in srgb, var(--eb-bordo) 60%, transparent)'];

const PILHA_DE_VALOR = [
  '21 práticas guiadas de 5 a 10 minutos',
  '21 páginas de journaling',
  '62 páginas de conteúdo direto ao ponto',
  'Avaliação inicial e final',
  '3 fases progressivas',
  '4 caminhos personalizados',
  'Tracker emocional de 7 dias',
  'Cartão SOS para momentos difíceis',
  'Mapa e vocabulário emocional',
  'Revisões semanais',
  'Plano de continuidade de 30 dias',
  '8 Cartões Rose',
  'Roteiro para 7 áudios guiados',
  'Certificado de conclusão',
];

const FASES = [
  {
    numero: 1,
    titulo: 'Dias 1–7 — Entenda',
    texto: 'Observe pensamentos, emoções, autocobrança e padrões com mais clareza.',
  },
  {
    numero: 2,
    titulo: 'Dias 8–14 — Cuide',
    texto: 'Construa uma rotina mais gentil com limites, pausas e pequenas ações.',
  },
  {
    numero: 3,
    titulo: 'Dias 15–21 — Recomece',
    texto: 'Fortaleça autoestima, identidade, objetivos e próximos passos.',
  },
];

const AUTORIDADE = [
  { icone: '🤍', texto: 'Marca dedicada ao bem-estar feminino' },
  { icone: '🛡️', texto: 'Conteúdo validado por psicóloga' },
  { icone: '⚕️', texto: 'Criado por profissional da saúde' },
];

const FAQ = [
  {
    pergunta: 'Quanto tempo por dia eu preciso?',
    resposta:
      'De 5 a 10 minutos. Cada dia traz uma prática curta e direta ao ponto, pensada pra caber na rotina real.',
  },
  {
    pergunta: 'E se eu pular um dia?',
    resposta:
      'Sem culpa. É só voltar no dia seguinte, de onde parou. O guia foi feito pra acompanhar o seu ritmo, não pra cobrar você.',
  },
  {
    pergunta: 'Como recebo o acesso?',
    resposta: 'O acesso é liberado na hora, direto após a confirmação do pagamento, no email informado na compra.',
  },
  {
    pergunta: 'É uma assinatura?',
    resposta: 'Não. O valor de R$ 19,99 é um pagamento único e o acesso é pra sempre.',
  },
  {
    pergunta: 'Preciso imprimir?',
    resposta:
      'Não. O PDF pode ser lido e preenchido no celular, tablet ou computador. Se preferir escrever à mão, também pode imprimir as páginas de prática.',
  },
  {
    pergunta: 'O Guia Rose substitui terapia?',
    resposta:
      'Não. É um recurso educativo de autocuidado e reflexão. Ele não oferece diagnóstico, tratamento ou acompanhamento psicológico e não substitui cuidados profissionais.',
  },
];

// Sem conta/país confirmado nesta rota (compra sem login) — mesma decisão
// já usada em /comecar/resultado: exibe o preço em BRL como padrão. O
// Stripe Checkout ainda pode ajustar a cobrança pelo país real do cartão.
export default async function EbookPage() {
  let precoExibicao: string | null = null;
  let precoBumpExibicao: string | null = null;
  let precoBumpValor: number | null = null;

  if (ebookConfigurado()) {
    const stripe = obterStripe();
    if (stripe) {
      const { moeda } = obterMoedaELocaleDoPais('BR');
      precoExibicao = await buscarPrecoExibicao(stripe, obterPriceIdEbook(), moeda);

      // Order bump: assinatura Rose Pro junto com o ebook (ver EbookClient e
      // /api/stripe/checkout-ebook). Indisponível (price não configurado)
      // não bloqueia a página — só some o bump.
      const bumpDetalhado = await buscarPrecoDetalhado(stripe, obterPriceId('mensal'), moeda);
      if (bumpDetalhado) {
        precoBumpExibicao = bumpDetalhado.formatado;
        precoBumpValor = bumpDetalhado.unitAmount / 100;
      }
    }
  }

  const precoFormatado = precoExibicao ?? 'R$ 19,99';

  return (
    <main
      className={`${lora.variable} ${manrope.variable} pagina-ebook relative overflow-x-hidden bg-[var(--eb-cream)] pb-24 font-[family-name:var(--eb-font-sans)] text-[var(--eb-ink)] lg:pb-0`}
    >
      <EbookViewContent />

      {/* 1. HERO */}
      <section className="relative overflow-hidden bg-[var(--eb-blush)]/70 px-6 py-16 sm:py-20">
        <RamoFloral className="pointer-events-none absolute -top-4 right-2 w-24 opacity-40 sm:w-32" />
        <RamoFloral className="pointer-events-none absolute -bottom-6 -left-6 w-28 opacity-30 sm:w-36" espelhado />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div className="ebook-anim space-y-6 text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold tracking-[0.08em] text-[var(--eb-bordo)] uppercase shadow-sm">
              ✨ Guia Rose · Ebook
            </span>
            <h1 className="font-[family-name:var(--eb-font-serif)] text-4xl leading-[1.08] font-medium tracking-tight text-[var(--eb-ink)] sm:text-5xl lg:text-6xl">
              21 dias pra sair do <span className="text-[var(--eb-bordo)]">piloto automático</span>
            </h1>
            <p className="mx-auto max-w-md text-lg leading-relaxed text-[var(--eb-ink)]/80 lg:mx-0">
              Um guia diário, direto ao ponto — 5 a 10 minutos por dia pra voltar a se sentir em casa no seu corpo.
              Sem dieta, sem cobrança, sem recomeço toda segunda-feira.
            </p>
            <ul className="mx-auto max-w-md space-y-2.5 text-left">
              {[
                'Uma prática guiada por dia, sem enrolação',
                'PDF pra ler no celular ou imprimir, no seu ritmo',
                'Acesso liberado na hora, direto após o pagamento',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--eb-bordo)] text-xs text-white"
                  >
                    ✓
                  </span>
                  <span className="text-[var(--eb-ink)]/85">{item}</span>
                </li>
              ))}
            </ul>

            <div
              className="ebook-anim-delay mx-auto max-w-sm space-y-4 rounded-[1.5rem] bg-white p-6 text-center shadow-lg lg:mx-0"
              style={{ animationDelay: '0.25s' }}
            >
              <div>
                <p className="font-[family-name:var(--eb-font-serif)] text-2xl font-semibold text-[var(--eb-ink)] sm:text-3xl">
                  Tudo por apenas <span className="text-[var(--eb-bordo)]">{precoFormatado}</span>
                </p>
                <p className="mt-1 text-sm text-[var(--eb-ink)]/60">
                  Pagamento único · acesso pra sempre — menos de R$ 0,96 por dia
                </p>
              </div>
              <EbookClient
                precoExibicao={null}
                location="hero"
                mostrarBump={Boolean(precoBumpExibicao)}
                precoBumpExibicao={precoBumpExibicao}
                precoBumpValor={precoBumpValor}
              />
              <p className="flex items-center justify-center gap-1.5 text-xs text-[var(--eb-ink)]/55">
                🛡️ Pagamento seguro pela Stripe
              </p>
            </div>
          </div>

          <div className="ebook-anim-delay flex justify-center" style={{ animationDelay: '0.25s' }}>
            <img
              src="/rose-ebook-capa.png"
              alt="Capa do ebook Guia Rose: 21 dias pra sair do piloto automático"
              className="w-64 rounded-2xl shadow-2xl sm:w-80"
            />
          </div>
        </div>
      </section>

      {/* 2. IDENTIFICAÇÃO */}
      <section className="bg-[var(--eb-cream)] px-6 py-16 text-center sm:py-20">
        <div className="mx-auto max-w-3xl space-y-6">
          <blockquote className="font-[family-name:var(--eb-font-serif)] text-2xl leading-snug font-medium text-[var(--eb-ink)] sm:text-3xl">
            Você se compara. Evita o espelho.{' '}
            <span className="text-[var(--eb-bordo)]">Sabe que precisa se cuidar — só não sabe por onde começar.</span>
          </blockquote>
          <p className="text-[var(--eb-ink)]/70">Comece aqui, no dia 1, exatamente como você está agora.</p>

          <div className="mx-auto max-w-xl space-y-4 rounded-2xl border border-[var(--eb-rose-burnt)]/30 bg-white p-6">
            <div className="flex flex-wrap justify-center gap-1.5" aria-hidden="true">
              {DIAS_DO_GUIA.map((dia) => (
                <span
                  key={dia}
                  className="ebook-ponto h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor: CORES_DO_RASTREADOR[dia % CORES_DO_RASTREADOR.length],
                    animationDelay: `${dia * 0.035}s`,
                  }}
                />
              ))}
            </div>
            <p className="font-[family-name:var(--eb-font-serif)] text-lg text-[var(--eb-ink)]">
              21 dias. 21 práticas. Uma de cada vez.
            </p>
            <p className="text-sm text-[var(--eb-ink)]/60">Pulou um dia? Sem culpa — é só voltar amanhã de onde parou.</p>
          </div>
        </div>
      </section>

      {/* 3. PILHA DE VALOR */}
      <section className="bg-[var(--eb-blush)]/70 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h2 className="font-[family-name:var(--eb-font-serif)] text-3xl font-medium text-[var(--eb-ink)] sm:text-4xl">
              O que você recebe no Guia Rose
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[var(--eb-ink)]/70">
              Não é um PDF pra ler e esquecer. É uma jornada pra preencher, praticar e acompanhar durante 21 dias.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PILHA_DE_VALOR.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm">
                <span aria-hidden="true" className="mt-0.5 text-[var(--eb-bordo)]">
                  ✓
                </span>
                <span className="text-sm text-[var(--eb-ink)]">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 mx-auto max-w-sm space-y-3 text-center">
            <EbookClient precoExibicao={null} location="valor" />
            <p className="text-xs text-[var(--eb-ink)]/55">Pagamento único · acesso imediato</p>
          </div>
        </div>
      </section>

      {/* 4. COMO FUNCIONA */}
      <section className="bg-[var(--eb-cream)] px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="font-[family-name:var(--eb-font-serif)] text-3xl font-medium text-[var(--eb-ink)] sm:text-4xl">
            21 dias divididos em três fases
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {FASES.map((fase) => (
              <div key={fase.numero} className="rounded-2xl bg-[var(--eb-blush)] p-6 text-left">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--eb-bordo)] font-[family-name:var(--eb-font-serif)] text-white">
                  {fase.numero}
                </span>
                <p className="mt-4 font-[family-name:var(--eb-font-serif)] text-lg font-medium text-[var(--eb-ink)]">
                  {fase.titulo}
                </p>
                <p className="mt-1.5 text-sm text-[var(--eb-ink)]/70">{fase.texto}</p>
              </div>
            ))}
          </div>

          <p className="mt-8 flex items-center justify-center gap-2 font-semibold text-[var(--eb-bordo)]">
            🕐 Todos os dias: conteúdo curto + reflexão + exercício + pequena ação.
          </p>
        </div>
      </section>

      {/* 5. AUTORIDADE */}
      <section className="bg-[var(--eb-blush)]/70 px-6 py-16 text-center sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-[family-name:var(--eb-font-serif)] text-3xl font-medium text-[var(--eb-ink)] sm:text-4xl">
            Criado com cuidado. Validado com responsabilidade.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[var(--eb-ink)]/75">
            O Guia Rose é uma experiência da Rose, uma marca dedicada ao autocuidado e ao bem-estar emocional
            feminino. O projeto é liderado por uma profissional da área da saúde e o conteúdo foi revisado e
            validado com a colaboração de uma psicóloga.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {AUTORIDADE.map((item) => (
              <div key={item.texto} className="rounded-2xl bg-white p-6 shadow-sm">
                <span aria-hidden="true" className="text-2xl">
                  {item.icone}
                </span>
                <p className="mt-3 text-sm font-medium text-[var(--eb-ink)]">{item.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. OFERTA FINAL */}
      <section className="bg-[var(--eb-wine)] px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl rounded-[2rem] bg-[var(--eb-cream)] p-8 text-center shadow-2xl sm:p-12">
          <h2 className="font-[family-name:var(--eb-font-serif)] text-3xl font-medium text-[var(--eb-ink)] sm:text-4xl">
            Comece hoje os seus 21 dias
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[var(--eb-ink)]/70">
            Você não precisa mudar tudo de uma vez. Só precisa de um primeiro passo — e ele leva 5 minutos.
          </p>
          <p className="mt-6 font-[family-name:var(--eb-font-serif)] text-5xl font-semibold text-[var(--eb-bordo)] sm:text-6xl">
            {precoFormatado}
          </p>
          <p className="mt-1 text-sm text-[var(--eb-ink)]/60">Pagamento único · acesso pra sempre</p>

          <div className="mt-6">
            <EbookClient
              precoExibicao={null}
              location="oferta-final"
              className="ebook-cta-glow w-full rounded-full bg-[var(--eb-bordo)] px-8 py-4 text-center text-sm font-bold tracking-wide text-white uppercase shadow-lg shadow-[var(--eb-bordo)]/25 transition-all hover:-translate-y-0.5 hover:bg-[var(--eb-wine)] disabled:pointer-events-none disabled:opacity-40"
            />
          </div>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-[var(--eb-ink)]/55">
            🛡️ Pagamento seguro pela Stripe
          </p>
        </div>
      </section>

      {/* 7. FAQ */}
      <section className="bg-[var(--eb-cream)] px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-[family-name:var(--eb-font-serif)] text-3xl font-medium text-[var(--eb-ink)] sm:text-4xl">
            Perguntas frequentes
          </h2>
          <div className="mt-8 space-y-3">
            {FAQ.map((item) => (
              <details key={item.pergunta} className="group rounded-2xl bg-[var(--eb-blush)] p-5">
                <summary className="cursor-pointer list-none font-medium text-[var(--eb-ink)] marker:content-['']">
                  <span className="flex items-center justify-between gap-3">
                    {item.pergunta}
                    <span aria-hidden="true" className="text-[var(--eb-bordo)] transition-transform group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-sm text-[var(--eb-ink)]/75">{item.resposta}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 8. RODAPÉ */}
      <footer className="bg-[var(--eb-blush)]/80 px-6 py-12 text-center">
        <p className="font-[family-name:var(--eb-font-serif)] text-lg text-[var(--eb-bordo)]">
          Rose — Autocuidado, clareza emocional e pequenos recomeços.
        </p>
        <nav className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-[var(--eb-ink)]/70">
          <a href="#" className="hover:text-[var(--eb-bordo)]">
            Termos de uso
          </a>
          <a href="#" className="hover:text-[var(--eb-bordo)]">
            Política de privacidade
          </a>
          <a href="#" className="hover:text-[var(--eb-bordo)]">
            Política de reembolso
          </a>
          <a href="#" className="hover:text-[var(--eb-bordo)]">
            Contato
          </a>
        </nav>
        <p className="mx-auto mt-6 max-w-xl text-xs text-[var(--eb-ink)]/60">
          O Guia Rose é um produto educativo de bem-estar e autocuidado. Não substitui acompanhamento médico,
          psicológico ou outros cuidados profissionais.
        </p>
      </footer>

      {/* 9. CTA FIXO MOBILE */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-4 border-t border-[var(--eb-rose-burnt)]/25 bg-[var(--eb-cream)]/95 px-5 py-3 backdrop-blur lg:hidden">
        <p className="text-sm">
          Guia Rose — <span className="font-bold text-[var(--eb-bordo)]">{precoFormatado}</span>
        </p>
        <EbookClient
          precoExibicao={null}
          location="sticky-mobile"
          rotulo="Começar agora"
          className="ebook-cta-glow shrink-0 rounded-full bg-[var(--eb-bordo)] px-5 py-2.5 text-xs font-bold tracking-wide text-white uppercase shadow-md transition-all hover:bg-[var(--eb-wine)] disabled:pointer-events-none disabled:opacity-40"
        />
      </div>

      <style>{`
        .pagina-ebook {
          --eb-blush: #f9edef;
          --eb-cream: #fff9f8;
          --eb-rose-burnt: #c96a87;
          --eb-bordo: #8f274d;
          --eb-wine: #641d38;
          --eb-ink: #442d35;
        }
        @keyframes eb-drift-up {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes eb-bloom-sway {
          0%, 100% { transform: rotate(-2.5deg) scale(1); }
          50% { transform: rotate(2.5deg) scale(1.04); }
        }
        @keyframes eb-pulse-soft {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 0.85; }
        }
        @keyframes eb-glow-cta {
          0%, 100% { box-shadow: 0 10px 30px -8px rgba(143, 39, 77, 0.45); }
          50% { box-shadow: 0 14px 40px -6px rgba(143, 39, 77, 0.65); }
        }
        .pagina-ebook .ebook-anim { animation: eb-drift-up 0.9s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .pagina-ebook .ebook-anim-delay { animation: eb-drift-up 0.9s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .pagina-ebook .animate-bloom { animation: eb-bloom-sway 7s ease-in-out infinite; }
        .pagina-ebook .ebook-ponto { animation: eb-pulse-soft 4.5s ease-in-out infinite; }
        .pagina-ebook .ebook-cta-glow { animation: eb-glow-cta 3s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .pagina-ebook .ebook-anim,
          .pagina-ebook .ebook-anim-delay,
          .pagina-ebook .animate-bloom,
          .pagina-ebook .ebook-ponto,
          .pagina-ebook .ebook-cta-glow {
            animation: none;
          }
        }
      `}</style>
    </main>
  );
}
