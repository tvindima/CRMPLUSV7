export default function SobrePage() {
  return (
    <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.2em]" style={{ color: 'var(--color-primary)' }}>Sobre</p>
          <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-text)' }}>Imóveis Mais</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>TODO: Substituir por layout definitivo quando existirem renders oficiais.</p>
        </div>
        <div className="space-y-3 rounded-2xl border p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background-secondary)' }}>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>Serviços</h2>
          <ul className="list-disc space-y-2 pl-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            <li>Compra e venda de imóveis.</li>
            <li>Arrendamento e gestão.</li>
            <li>Consultoria imobiliária e avaliação.</li>
          </ul>
        </div>
    </div>
  );
}
