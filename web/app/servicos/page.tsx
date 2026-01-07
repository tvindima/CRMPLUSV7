export default function ServicosPage() {
  return (
    <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.2em]" style={{ color: 'var(--color-primary)' }}>Serviços</p>
          <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-text)' }}>O que fazemos</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>TODO: Substituir por layout definitivo quando existirem renders oficiais.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {["Consultoria", "Gestão de Arrendamento", "Promoção", "Avaliação"].map((svc) => (
            <div key={svc} className="rounded-2xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background-secondary)' }}>
              <p className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>{svc}</p>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Descrição breve do serviço.</p>
            </div>
          ))}
        </div>
    </div>
  );
}
