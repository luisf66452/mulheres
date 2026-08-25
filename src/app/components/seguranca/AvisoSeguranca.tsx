// Ponto de entrada compacto para o espaço de segurança (Seção 7 do design de
// evolução da Rose), reaproveitado em Home, Perfil e no fluxo de check-in.
// É um wrapper fino sobre o CardAtencaoSeguranca já existente — usa a
// variante `destacado={false}`, que já é o estilo discreto/compacto do
// card — nunca reimplementa o texto ou o estilo, e nunca chama
// detectarSinalDeAtencao (essa heurística continua exclusiva dos módulos de
// texto livre, ver src/lib/jornadas-modulos/deteccaoAtencao.ts). Fora de um
// módulo, não existe nenhum sinal de atenção para detectar — este
// componente só oferece o acesso, sempre no mesmo estado discreto.
import CardAtencaoSeguranca from '@/app/components/jornadas-modulos/CardAtencaoSeguranca';

export default function AvisoSeguranca() {
  return <CardAtencaoSeguranca destacado={false} />;
}
