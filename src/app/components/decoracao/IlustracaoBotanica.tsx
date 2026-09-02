// Ilustração botânica animada nos cantos superior-direito e inferior-esquerdo.
// `tamanho="compacto"` reduz as dimensões para telas com mais conteúdo (ex.:
// o quiz em /comecar), onde a versão cheia usada no /login competiria com o
// texto e os botões.
export default function IlustracaoBotanica({
  tamanho = 'padrao',
}: {
  tamanho?: 'padrao' | 'compacto';
}) {
  const largurasSuperiorDireita =
    tamanho === 'compacto' ? 'w-40 sm:w-52 md:w-60' : 'w-72 sm:w-96 md:w-[30rem]';
  const largurasInferiorEsquerda = tamanho === 'compacto' ? 'w-32 sm:w-40 md:w-44' : 'w-52 sm:w-64 md:w-72';

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className={`ilustracao-cluster absolute -top-2 -right-2 ${largurasSuperiorDireita}`}>
        <img
          src="/ilustracao-superior-direita-base.png"
          alt=""
          className="ilustracao-camada ilustracao-camada-caule ilustracao-cresce-direita w-full h-auto"
        />
        <img
          src="/ilustracao-superior-direita-flor.png"
          alt=""
          className="ilustracao-camada ilustracao-camada-flor ilustracao-desabrocha-direita absolute inset-0 w-full h-auto"
        />
      </div>
      <div className={`ilustracao-cluster absolute -bottom-2 -left-2 ${largurasInferiorEsquerda}`}>
        <img
          src="/ilustracao-inferior-esquerda-base.png"
          alt=""
          className="ilustracao-camada ilustracao-camada-caule ilustracao-cresce-esquerda w-full h-auto"
        />
        <img
          src="/ilustracao-inferior-esquerda-flor.png"
          alt=""
          className="ilustracao-camada ilustracao-camada-flor ilustracao-desabrocha-esquerda absolute inset-0 w-full h-auto"
        />
      </div>
    </div>
  );
}
