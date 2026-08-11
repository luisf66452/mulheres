export default function LembreteBanner({ jaFezCheckinHoje }: { jaFezCheckinHoje: boolean }) {
  if (jaFezCheckinHoje) return null;

  return (
    <div className="bg-destaque/15 p-3 text-sm text-texto">
      Você ainda não fez seu ritual hoje. Que tal 5 minutinhos agora? 🌿
    </div>
  );
}
