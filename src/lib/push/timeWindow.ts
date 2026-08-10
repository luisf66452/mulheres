export function estaNaJanelaDeEnvio(horarioPreferido: string | null, agora: Date): boolean {
  if (!horarioPreferido) return false;
  const [horaPreferida] = horarioPreferido.split(':').map(Number);
  return agora.getHours() === horaPreferida;
}
