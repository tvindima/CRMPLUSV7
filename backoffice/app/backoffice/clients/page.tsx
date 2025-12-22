'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BackofficeLayout } from "@/backoffice/components/BackofficeLayout";
import { PlusIcon, UserIcon } from "@heroicons/react/24/outline";

type Client = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  type: 'buyer' | 'seller' | 'both';
  createdAt: string;
};

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch clients from API
    setLoading(false);
  }, []);

  return (
    <BackofficeLayout title="Clientes">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Clientes</h1>
          <p className="text-sm text-[#999]">Gerir compradores e vendedores</p>
        </div>
        <button
          onClick={() => router.push("/backoffice/clients/new")}
          className="flex items-center gap-2 rounded-lg bg-[#E10600] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#c00500]"
        >
          <PlusIcon className="h-4 w-4" />
          Novo Cliente
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-[#999]">A carregar clientes...</div>
      ) : clients.length === 0 ? (
        <div className="rounded-xl border border-[#23232B] bg-[#0F0F12] p-12 text-center">
          <UserIcon className="mx-auto h-12 w-12 text-[#555]" />
          <p className="mt-4 text-[#999]">Nenhum cliente encontrado</p>
          <button
            onClick={() => router.push("/backoffice/clients/new")}
            className="mt-4 text-sm text-[#E10600] hover:underline"
          >
            Adicionar primeiro cliente
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((client) => (
            <div
              key={client.id}
              className="rounded-xl border border-[#23232B] bg-[#0F0F12] p-4 transition-all hover:border-[#E10600]/30"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white">{client.name}</h3>
                  <p className="text-sm text-[#999]">{client.email || client.phone}</p>
                </div>
                <span className="text-xs text-[#666]">{client.type}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </BackofficeLayout>
  );
}
