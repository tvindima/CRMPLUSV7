'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import { BackofficeLayout } from "@/backoffice/components/BackofficeLayout";
import { ToastProvider, useToast } from "../../../backoffice/components/ToastProvider";

type FeedItem = {
  id: number;
  actor: string;
  avatar?: string | null;
  action: string;
  reference?: string | null;
  created_at: string;
};

const mockFeed: FeedItem[] = [
  {
    id: 1,
    actor: "Pedro Olaio",
    avatar: "/renders/avatars/pedro.png",
    action: "editou o imóvel JR1044",
    reference: "JR1044",
    created_at: "há 3 min",
  },
  {
    id: 2,
    actor: "Pedro Olaio",
    avatar: null,
    action: "adicionou JR1050 — Nova lead atribuída",
    reference: "JR1050",
    created_at: "Ontem às 14:02",
  },
];

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
  const toast = useToast();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: substituir mockFeed pela resposta real do endpoint /feed quando estiver disponível
    setItems(mockFeed);
    setLoading(false);
  }, []);

  return (
    <BackofficeLayout title="Activity Feed">
      {loading && <p className="text-sm text-[#C5C5C5]">A carregar feed...</p>}
      {!loading && (
        <div className="space-y-3">
          {items.map((item) => (
            <FeedRow key={item.id} item={item} />
          ))}
        </div>
      )}
      <p className="mt-2 text-xs text-[#C5C5C5]">
        TODO: integrar feed real (endpoint /feed) e avatares reais. Mock baseado no render 17/18.
      </p>
    </BackofficeLayout>
  );
}
