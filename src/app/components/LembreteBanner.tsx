export default function LembreteBanner({ jaFezCheckinHoje }: { jaFezCheckinHoje: boolean }) {
  if (jaFezCheckinHoje) return null;

  return (
    <div className="rounded bg-yellow-100 p-3 text-sm">
      Você ainda não fez seu ritual hoje. Que tal 5 minutinhos agora? 🌿
    </div>
  );
}
