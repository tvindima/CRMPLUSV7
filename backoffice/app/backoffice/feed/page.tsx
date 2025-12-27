'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import { BackofficeLayout } from "@/components/BackofficeLayout";
import { ToastProvider } from "../../../backoffice/components/ToastProvider";
import { BellIcon } from "@heroicons/react/24/outline";

type FeedItem = {
  id: number;
  actor: string;
  avatar?: string | null;
  action: string;
  reference?: string | null;
  created_at: string;
};

function FeedRow({ item }: { item: FeedItem }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#1F1F22] bg-[#0F0F10] px-4 py-3 text-white">
      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#0B0B0D]">
        {item.avatar ? (
          <Image src={item.avatar} alt={item.actor} width={48} height={48} className="h-12 w-12 object-cover" />
        ) : (
          <span className="text-sm text-[#C5C5C5]">{item.actor.slice(0, 2).toUpperCase()}</span>
        )}
      </div>
      <div className="flex flex-1 flex-col">
        <p className="text-sm">
          <span className="font-semibold">{item.actor}</span> {item.action}
        </p>
        {item.reference && <p className="text-xs text-[#C5C5C5]">{item.reference}</p>}
      </div>
      <div className="text-xs text-[#C5C5C5]">{item.created_at}</div>
    </div>
  );
}

export default function FeedsPage() {
  return (
    <ToastProvider>
      <FeedsInner />
    </ToastProvider>
  );
}

function FeedsInner() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    try {
      // TODO: Implementar quando endpoint /api/feed estiver disponível
      // const response = await fetch('/api/feed');
      // const data = await response.json();
      // setItems(data);
      setItems([]);
    } catch (error) {
      console.error("Erro ao carregar feed:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BackofficeLayout title="Activity Feed">
      {loading ? (
        <div className="py-12 text-center text-[#999]">A carregar atividades...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-[#23232B] bg-[#0F0F12] p-12 text-center">
          <BellIcon className="mx-auto h-12 w-12 text-[#555]" />
          <p className="mt-4 text-[#999]">Nenhuma atividade recente</p>
          <p className="mt-2 text-xs text-[#666]">
            As atividades da equipa aparecerão aqui
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <FeedRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </BackofficeLayout>
  );
}
