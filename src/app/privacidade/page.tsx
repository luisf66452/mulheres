export default function PrivacidadePage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="font-display text-2xl text-texto">Política de Privacidade e Termos de Uso</h1>

      <section className="space-y-2">
        <h2 className="font-display text-xl text-texto">O que coletamos</h2>
        <p className="text-texto">
          Coletamos seu e-mail para autenticação, e as respostas do seu check-in diário (humor,
          imagem corporal, relação com a comida, e um texto livre opcional). Esses são dados
          sensíveis de saúde nos termos da Lei Geral de Proteção de Dados (LGPD), e só os coletamos
          com seu consentimento explícito, dado no início do uso do app.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl text-texto">Como usamos e quem acessa</h2>
        <p className="text-texto">
          Seus dados individuais são usados para gerar sua recomendação diária e seu progresso
          pessoal. Por padrão, ninguém da nossa equipe visualiza dados ou respostas individuais de
          uma usuária específica. Qualquer acesso pontual só ocorre com finalidade definida,
          permissão explícita, e fica registrado internamente (quem acessou, quando, por quê). A
          psicóloga responsável pelo conteúdo do app recebe apenas dados agregados e anonimizados
          para avaliar o produto, nunca dados que identifiquem uma usuária específica.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl text-texto">O texto livre do check-in</h2>
        <p className="text-texto">
          O campo opcional de texto livre não é analisado nem monitorado nesta versão do app — é
          apenas armazenado como parte do seu diário pessoal.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl text-texto">Retenção e exclusão</h2>
        <p className="text-texto">
          Seus dados são mantidos enquanto sua conta estiver ativa. Ao excluir sua conta, seus dados
          são apagados ou anonimizados em até 30 dias.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl text-texto">Seus direitos</h2>
        <p className="text-texto">
          Você pode solicitar a exportação ou exclusão dos seus dados a qualquer momento, e pode
          tirar qualquer dúvida sobre como seus dados são tratados, escrevendo para{' '}
          <a href="mailto:almeidaferreiraluisgustavo@gmail.com" className="underline">
            almeidaferreiraluisgustavo@gmail.com
          </a>
          . Respondemos pedidos em até alguns dias úteis.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl text-texto">O que este app não é</h2>
        <p className="text-texto">
          Este app não é terapia, não faz diagnóstico e não substitui acompanhamento profissional de
          saúde física ou mental. Se você está em crise ou precisa de ajuda imediata, veja os{' '}
          <a href="/seguranca" className="underline">
            recursos de apoio e emergência
          </a>
          .
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl text-texto">Idade mínima</h2>
        <p className="text-texto">
          O Rose é destinado exclusivamente a pessoas adultas (18 anos ou mais), com foco em mulheres
          entre 18 e 35 anos. Não criamos nem mantemos contas de pessoas que se identificam como
          menores de idade, e não coletamos dados de saúde/emocionais de menores.
        </p>
      </section>
    </main>
  );
}
