'use client';

import Image from "next/image";
import { BackofficeLayout } from "@/backoffice/components/BackofficeLayout";
import { ToastProvider } from "../../../backoffice/components/ToastProvider";

export default function OnboardingPage() {
  return (
    <ToastProvider>
      <BackofficeLayout title="Sessão / Onboarding">
        <Image src="/renders/39.png" alt="Sessão terminada/onboarding render" width={1920} height={1080} className="w-full rounded-2xl" />
      </BackofficeLayout>
    </ToastProvider>
  );
}
