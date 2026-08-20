'use client';

// Acesso aos recursos de segurança, sempre visível dentro de um módulo com
// campos de texto livre — independente de qualquer varredura por palavras-chave.
// `destacado` liga um estilo mais visível quando a varredura (heurística, não
// clínica — ver deteccaoAtencao.ts) encontrou um termo de atenção em algum
// campo. Nunca bloqueia a continuação do módulo.
export default function CardAtencaoSeguranca({ destacado }: { destacado: boolean }) {
  return (
    <div
      className={`space-y-2 rounded-2xl border p-4 text-sm transition-colors ${
        destacado ? 'border-alerta bg-alerta/10' : 'border-borda bg-superficie'
      }`}
    >
      {destacado && (
        <p className="font-medium text-texto">
          Percebemos palavras que podem indicar que algo mais sério está acontecendo. Isso não é uma
          avaliação nem um diagnóstico — só um lembrete gentil de que você não precisa passar por isso sozinha.
        </p>
      )}
      <p className="text-texto-suave">
        Se em algum momento você precisar de mais apoio do que este exercício pode oferecer, os recursos de
        segurança do app estão sempre disponíveis.
      </p>
      <a href="/seguranca" className="inline-block font-medium text-acao underline underline-offset-2">
        Ver recursos de apoio
      </a>
    </div>
  );
}
