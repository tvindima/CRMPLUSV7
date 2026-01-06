'use client';

export default function BillingPage() {
  const invoices = [
    { id: 'INV-2026-001', tenant: 'Imóveis Mais', amount: 99, status: 'paid', date: '2026-01-01' },
    { id: 'INV-2026-002', tenant: 'Luis Carlos Gaspar Team', amount: 99, status: 'paid', date: '2026-01-01' },
    { id: 'INV-2025-024', tenant: 'Imóveis Mais', amount: 99, status: 'paid', date: '2025-12-01' },
    { id: 'INV-2025-023', tenant: 'Luis Carlos Gaspar Team', amount: 99, status: 'paid', date: '2025-12-01' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Faturação</h1>
        <p className="text-white/50 text-sm mt-1">Gestão de pagamentos e subscrições</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-[#111] border border-[#222] rounded-xl p-6">
          <div className="text-white/40 text-sm mb-1">MRR</div>
          <div className="text-3xl font-bold text-green-400">€198</div>
        </div>
        <div className="bg-[#111] border border-[#222] rounded-xl p-6">
          <div className="text-white/40 text-sm mb-1">Tenants Ativos</div>
          <div className="text-3xl font-bold">2</div>
        </div>
        <div className="bg-[#111] border border-[#222] rounded-xl p-6">
          <div className="text-white/40 text-sm mb-1">Pagamentos Pendentes</div>
          <div className="text-3xl font-bold text-yellow-400">0</div>
        </div>
        <div className="bg-[#111] border border-[#222] rounded-xl p-6">
          <div className="text-white/40 text-sm mb-1">ARR</div>
          <div className="text-3xl font-bold">€2,376</div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#222]">
          <h2 className="font-semibold">Faturas Recentes</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-white/40 border-b border-[#222]">
              <th className="px-6 py-3">Fatura</th>
              <th className="px-6 py-3">Tenant</th>
              <th className="px-6 py-3">Valor</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Data</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-[#222] hover:bg-white/5">
                <td className="px-6 py-4 font-mono text-sm">{inv.id}</td>
                <td className="px-6 py-4">{inv.tenant}</td>
                <td className="px-6 py-4 font-semibold">€{inv.amount}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    inv.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                    inv.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-white/50">{inv.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
