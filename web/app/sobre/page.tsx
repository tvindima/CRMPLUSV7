export default function SobrePage() {
  return (
    <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.2em] text-[#E10600]">Sobre</p>
          <h1 className="text-3xl font-semibold">Imóveis Mais</h1>
          <p className="text-sm text-[#C5C5C5]">TODO: Substituir por layout definitivo quando existirem renders oficiais.</p>
        </div>
        <div className="space-y-3 rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-6">
          <h2 className="text-xl font-semibold">Serviços</h2>
          <ul className="list-disc space-y-2 pl-4 text-sm text-[#C5C5C5]">
            <li>Compra e venda de imóveis.</li>
            <li>Arrendamento e gestão.</li>
            <li>Consultoria imobiliária e avaliação.</li>
          </ul>
        </div>
    </div>
  );
}
