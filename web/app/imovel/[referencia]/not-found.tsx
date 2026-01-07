import Link from "next/link";

export default function ImovelNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="space-y-6">
        <div className="text-8xl font-bold" style={{ color: 'var(--color-primary)' }}>404</div>
        <h1 className="text-xl font-semibold md:text-3xl" style={{ color: 'var(--color-text)' }}>Imóvel não encontrado</h1>
        <p className="max-w-md" style={{ color: 'var(--color-text-muted)' }}>
          O imóvel que procura não existe ou foi removido da nossa base de dados.
          Pode ter sido vendido ou a referência pode estar incorreta.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Link
            href="/imoveis"
            className="rounded-lg px-4 py-2.5 font-semibold text-white transition md:px-6 md:py-3"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Ver todos os imóveis
          </Link>
          <Link
            href="/"
            className="rounded-lg px-4 py-2.5 font-semibold transition md:px-6 md:py-3"
            style={{
              backgroundColor: 'var(--color-background-secondary)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
            }}
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
