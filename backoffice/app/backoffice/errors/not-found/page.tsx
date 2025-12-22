'use client';

import Image from "next/image";
import { BackofficeLayout } from "@/backoffice/components/BackofficeLayout";
import { ToastProvider } from "../../../../backoffice/components/ToastProvider";

export default function NotFoundPage() {
  return (
    <ToastProvider>
      <BackofficeLayout title="404">
        <Image src="/renders/37.png" alt="Página não encontrada render" width={1920} height={1080} className="w-full rounded-2xl" />
      </BackofficeLayout>
    </ToastProvider>
  );
}
