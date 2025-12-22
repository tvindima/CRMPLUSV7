'use client';

import { useState } from "react";
import { BackofficeLayout } from "@/backoffice/components/BackofficeLayout";
import { CalculatorIcon } from "@heroicons/react/24/outline";

export default function ExpensesCalculatorPage() {
  const [propertyValue, setPropertyValue] = useState("");
  const [results, setResults] = useState<{
    imt: number;
    stampDuty: number;
    registration: number;
    notary: number;
    total: number;
  } | null>(null);

  function calculate() {
    const value = parseFloat(propertyValue.replace(/\s/g, ""));
    if (isNaN(value) || value <= 0) {
      alert("Insira um valor válido");
      return;
    }

    // Simplified IMT calculation (this would need proper tax brackets)
    let imt = 0;
    if (value <= 92407) {
      imt = 0;
    } else if (value <= 126403) {
      imt = value * 0.02;
    } else if (value <= 172348) {
      imt = value * 0.05;
    } else if (value <= 287213) {
      imt = value * 0.07;
    } else {
      imt = value * 0.08;
    }

    const stampDuty = value * 0.008; // 0.8%
    const registration = 250; // Fixed fee
    const notary = 300; // Approximate

    setResults({
      imt: Math.round(imt),
      stampDuty: Math.round(stampDuty),
      registration,
      notary,
      total: Math.round(imt + stampDuty + registration + notary),
    });
  }

  return (
    <BackofficeLayout title="Calculadora de Despesas">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-[#E10600]/10 p-3">
              <CalculatorIcon className="h-6 w-6 text-[#E10600]" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">Calculadora de Despesas</h1>
              <p className="text-sm text-[#999]">Estimar custos de aquisição de imóvel</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Input */}
          <div className="rounded-xl border border-[#23232B] bg-[#0F0F12] p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#888]">
              Dados do Imóvel
            </h3>

            <div>
              <label className="block text-sm text-[#999]">Valor de Compra (€) *</label>
              <input
                type="text"
                value={propertyValue}
                onChange={(e) => setPropertyValue(e.target.value)}
                className="mt-2 w-full rounded-lg border border-[#23232B] bg-[#0a0a0f] px-4 py-3 text-xl text-white placeholder-[#555] focus:border-[#E10600]/50 focus:outline-none"
                placeholder="300.000"
              />
            </div>

            <button
              onClick={calculate}
              className="mt-4 w-full rounded-lg bg-[#E10600] px-4 py-3 text-sm font-medium text-white transition-all hover:bg-[#c00500]"
            >
              Calcular Despesas
            </button>
          </div>

          {/* Results */}
          {results && (
            <div className="rounded-xl border border-[#23232B] bg-[#0F0F12] p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#888]">
                Estimativa de Despesas
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-[#0a0a0f] p-4">
                  <span className="text-[#ccc]">IMT (Imposto Municipal)</span>
                  <span className="font-semibold text-white">{results.imt.toLocaleString('pt-PT')} €</span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-[#0a0a0f] p-4">
                  <span className="text-[#ccc]">Imposto do Selo</span>
                  <span className="font-semibold text-white">{results.stampDuty.toLocaleString('pt-PT')} €</span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-[#0a0a0f] p-4">
                  <span className="text-[#ccc]">Registo Predial</span>
                  <span className="font-semibold text-white">{results.registration.toLocaleString('pt-PT')} €</span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-[#0a0a0f] p-4">
                  <span className="text-[#ccc]">Notário</span>
                  <span className="font-semibold text-white">{results.notary.toLocaleString('pt-PT')} €</span>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-lg bg-gradient-to-r from-[#E10600]/20 to-[#ff4d7a]/20 p-4 ring-1 ring-[#E10600]/30">
                  <span className="font-semibold text-white">TOTAL ESTIMADO</span>
                  <span className="text-2xl font-bold text-[#E10600]">{results.total.toLocaleString('pt-PT')} €</span>
                </div>
              </div>

              <p className="mt-4 text-xs text-[#666]">
                * Valores aproximados. Para cálculo exato consulte o seu advogado ou solicitador.
              </p>
            </div>
          )}

          {/* Info */}
          <div className="rounded-xl border border-[#23232B]/50 bg-[#0F0F12]/50 p-4">
            <h4 className="mb-2 text-sm font-semibold text-white">Despesas Incluídas:</h4>
            <ul className="space-y-1 text-sm text-[#999]">
              <li>• IMT - Imposto Municipal sobre Transmissões (varia conforme valor)</li>
              <li>• Imposto do Selo - 0.8% sobre o valor do imóvel</li>
              <li>• Registo Predial - Taxa fixa aproximada</li>
              <li>• Notário - Escritura e outros serviços</li>
            </ul>
          </div>
        </div>
      </div>
    </BackofficeLayout>
  );
}
