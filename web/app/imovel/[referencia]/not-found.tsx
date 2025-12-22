import Link from "next/link";

export default function ImovelNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="space-y-6">
        <div className="text-8xl font-bold text-[#E10600]">404</div>
        <h1 className="text-xl font-semibold text-white md:text-3xl">Imóvel não encontrado</h1>
        <p className="max-w-md text-[#C5C5C5]">
          O imóvel que procura não existe ou foi removido da nossa base de dados.
          Pode ter sido vendido ou a referência pode estar incorreta.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Link
            href="/imoveis"
            className="rounded-lg bg-[#E10600] px-4 py-2.5 font-semibold text-white transition hover:bg-[#B80500] md:px-6 md:py-3"
          >
            Ver todos os imóveis
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-[#2A2A2E] bg-[#151518] px-4 py-2.5 font-semibold text-white transition hover:border-[#E10600] md:px-6 md:py-3"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
