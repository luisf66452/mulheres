export default function IlustracaoBotanica() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="ilustracao-cluster absolute -top-2 -right-2 w-64 sm:w-80 md:w-[26rem]">
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
      <div className="ilustracao-cluster absolute -bottom-2 -left-2 w-44 sm:w-56 md:w-64">
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
