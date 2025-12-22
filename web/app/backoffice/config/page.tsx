'use client';

import { BackofficeLayout } from "../../../backoffice/components/BackofficeLayout";
import { ToastProvider } from "../../../backoffice/components/ToastProvider";
import { DataTable } from "../../../backoffice/components/DataTable";

const mockLogs = [
  { id: 1, nome: "João Silva", acao: "editou o imóvel", referencia: "MB1018", data: "26/04/2024 10:00" },
  { id: 2, nome: "Pedro Olaio", acao: "adicionou lead", referencia: "JR1044", data: "25/04/2024 09:30" },
];

export default function ConfigPage() {
  return (
    <ToastProvider>
      <BackofficeLayout title="Configurações">
        <DataTable
          dense
          columns={["Nome", "Ação", "Referência", "Data"]}
          rows={mockLogs.map((log) => [log.nome, log.acao, log.referencia, log.data])}
        />
        <p className="mt-2 text-xs text-[#C5C5C5]">TODO: ligar ao log real quando o backend expuser endpoint.</p>
      </BackofficeLayout>
    </ToastProvider>
  );
}
