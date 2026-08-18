import RosaBotanica from '@/app/components/ilustracoes/RosaBotanica';

// Mantido como um wrapper fino (em vez de trocar todos os call sites) porque
// "flor de cabeçalho" já é um conceito de posicionamento usado em 8 telas —
// só a ilustração em si deixa de ser um círculo de elipses idênticas e passa
// a ser a rosa botânica compartilhada, sem caule (o espaço de canto de
// cabeçalho é pequeno demais para caule/folhas lerem bem).
export default function IlustracaoFlorCabecalho({ className }: { className?: string }) {
  return <RosaBotanica tamanho="media" comCaule={false} className={className} />;
}
