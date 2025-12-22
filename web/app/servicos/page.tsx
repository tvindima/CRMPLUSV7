export default function ServicosPage() {
  return (
    <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.2em] text-[#E10600]">Serviços</p>
          <h1 className="text-3xl font-semibold">O que fazemos</h1>
          <p className="text-sm text-[#C5C5C5]">TODO: Substituir por layout definitivo quando existirem renders oficiais.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {["Consultoria", "Gestão de Arrendamento", "Promoção", "Avaliação"].map((svc) => (
            <div key={svc} className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-4">
              <p className="text-lg font-semibold">{svc}</p>
              <p className="text-sm text-[#C5C5C5]">Descrição breve do serviço.</p>
            </div>
          ))}
        </div>
    </div>
  );
}
