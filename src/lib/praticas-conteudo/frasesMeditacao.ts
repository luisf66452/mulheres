// Frases curtas e acolhedoras mostradas durante a meditação, trocando a
// cada INTERVALO_TROCA_FRASE_S. Texto de apoio enquanto não existe áudio
// guiado real (ver `midia.url` em `dados.ts`).

export const FRASES_MEDITACAO: string[] = [
  'Perceba o ar entrando e saindo, sem pressa.',
  'Solte um pouco mais os ombros a cada expiração.',
  'Você não precisa fazer nada além de estar aqui.',
  'Se a mente vagar, isso é normal — volte gentilmente para a respiração.',
  'Sinta o peso do seu corpo apoiado, sustentado.',
  'Está tudo bem simplesmente estar presente agora.',
  'Cada momento de presença é um cuidado que você oferece a si mesma.',
  'Aos poucos, permita-se desacelerar.',
];

export const INTERVALO_TROCA_FRASE_S = 40;

export function obterIndiceFrase(segundosDecorridos: number, totalFrases: number): number {
  return Math.floor(segundosDecorridos / INTERVALO_TROCA_FRASE_S) % totalFrases;
}
