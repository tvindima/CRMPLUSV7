'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BackofficeLayout } from "@/components/BackofficeLayout";
import { PlusIcon, UserIcon } from "@heroicons/react/24/outline";

type Client = {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
  tipo_cliente?: string;
  created_at: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://crmplusv7-production.up.railway.app';

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch(`${API_URL}/clients/?limit=100`);
        if (response.ok) {
          const data = await response.json();
          setClients(data.items || []);
        }
      } catch (error) {
        console.error('Erro ao carregar clientes:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchClients();
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
                  <h3 className="font-medium text-white">{client.nome}</h3>
                  <p className="text-sm text-[#999]">{client.email || client.telefone}</p>
                </div>
                <span className="text-xs text-[#666]">{client.tipo_cliente || 'lead'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </BackofficeLayout>
  );
}
