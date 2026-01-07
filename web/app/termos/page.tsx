export default function TermosPage() {
  return (
    <div className="space-y-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em]" style={{ color: 'var(--color-primary)' }}>Termos</p>
          <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-text)' }}>Termos e Condições</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>TODO: Substituir por layout definitivo quando existirem renders oficiais.</p>
        </div>
        <div className="space-y-3 rounded-2xl border p-6 text-sm" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background-secondary)', color: 'var(--color-text-muted)' }}>
          <p>1. Introdução</p>
          <p>2. Condições de uso</p>
          <p>3. Limitações de responsabilidade</p>
        </div>
    </div>
  );
}
