'use client';

export default function SupportPage() {
  const tickets = [
    // Mock - sem tickets
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Suporte</h1>
        <p className="text-white/50 text-sm mt-1">Tickets de suporte dos tenants</p>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-[#111] border border-[#222] rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">🎉</div>
          <div className="text-lg font-medium">Nenhum ticket pendente</div>
          <p className="text-white/50 text-sm mt-2">Todos os tenants estão satisfeitos!</p>
        </div>
      ) : (
        <div className="bg-[#111] border border-[#222] rounded-xl">
          {/* Tickets list would go here */}
        </div>
      )}
    </div>
  );
}
