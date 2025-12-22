'use client';

import { useState } from "react";
import { BackofficeLayout } from "@/backoffice/components/BackofficeLayout";
import { BanknotesIcon } from "@heroicons/react/24/outline";

export default function CreditSimulatorPage() {
  const [loanAmount, setLoanAmount] = useState("");
  const [years, setYears] = useState("30");
  const [interestRate, setInterestRate] = useState("4.5");
  const [results, setResults] = useState<{
    monthlyPayment: number;
    totalPayment: number;
    totalInterest: number;
  } | null>(null);

  function calculate() {
    const amount = parseFloat(loanAmount.replace(/\s/g, ""));
    const rate = parseFloat(interestRate) / 100 / 12; // Monthly rate
    const months = parseInt(years) * 12;

    if (isNaN(amount) || isNaN(rate) || isNaN(months) || amount <= 0 || months <= 0) {
      alert("Preencha todos os campos com valores válidos");
      return;
    }

    // Monthly payment formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
    const monthlyPayment = amount * (rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
    const totalPayment = monthlyPayment * months;
    const totalInterest = totalPayment - amount;

    setResults({
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalPayment: Math.round(totalPayment * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
    });
  }

  return (
    <BackofficeLayout title="Simulador de Crédito">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-[#E10600]/10 p-3">
              <BanknotesIcon className="h-6 w-6 text-[#E10600]" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">Simulador de Crédito Habitação</h1>
              <p className="text-sm text-[#999]">Estimar prestação mensal e custo total</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Input */}
          <div className="rounded-xl border border-[#23232B] bg-[#0F0F12] p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#888]">
              Dados do Empréstimo
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#999]">Valor a Financiar (€) *</label>
                <input
                  type="text"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-[#23232B] bg-[#0a0a0f] px-4 py-3 text-xl text-white placeholder-[#555] focus:border-[#E10600]/50 focus:outline-none"
                  placeholder="250.000"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm text-[#999]">Prazo (anos) *</label>
                  <input
                    type="number"
                    value={years}
                    onChange={(e) => setYears(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-[#23232B] bg-[#0a0a0f] px-4 py-3 text-white placeholder-[#555] focus:border-[#E10600]/50 focus:outline-none"
                    placeholder="30"
                    min="1"
                    max="40"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#999]">Taxa de Juro Anual (%) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-[#23232B] bg-[#0a0a0f] px-4 py-3 text-white placeholder-[#555] focus:border-[#E10600]/50 focus:outline-none"
                    placeholder="4.5"
                    min="0"
                    max="20"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={calculate}
              className="mt-4 w-full rounded-lg bg-[#E10600] px-4 py-3 text-sm font-medium text-white transition-all hover:bg-[#c00500]"
            >
              Simular Crédito
            </button>
          </div>

          {/* Results */}
          {results && (
            <div className="rounded-xl border border-[#23232B] bg-[#0F0F12] p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#888]">
                Resultado da Simulação
              </h3>

              <div className="space-y-3">
                <div className="rounded-lg bg-gradient-to-r from-[#E10600]/20 to-[#ff4d7a]/20 p-5 ring-1 ring-[#E10600]/30">
                  <p className="mb-1 text-xs uppercase tracking-wider text-[#999]">Prestação Mensal</p>
                  <p className="text-3xl font-bold text-[#E10600]">
                    {results.monthlyPayment.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} €
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-[#0a0a0f] p-4">
                  <span className="text-[#ccc]">Total a Pagar</span>
                  <span className="font-semibold text-white">
                    {results.totalPayment.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} €
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-[#0a0a0f] p-4">
                  <span className="text-[#ccc]">Total de Juros</span>
                  <span className="font-semibold text-orange-400">
                    {results.totalInterest.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} €
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-[#0a0a0f] p-4">
                  <span className="text-[#ccc]">Número de Prestações</span>
                  <span className="font-semibold text-white">{parseInt(years) * 12} meses</span>
                </div>
              </div>

              <p className="mt-4 text-xs text-[#666]">
                * Simulação indicativa. Valores finais dependem da aprovação do banco e condições específicas.
              </p>
            </div>
          )}

          {/* Info */}
          <div className="rounded-xl border border-[#23232B]/50 bg-[#0F0F12]/50 p-4">
            <h4 className="mb-2 text-sm font-semibold text-white">Informações:</h4>
            <ul className="space-y-1 text-sm text-[#999]">
              <li>• Simulação baseada em sistema de prestações constantes (Tabela Price)</li>
              <li>• Não inclui seguros obrigatórios (vida, multirriscos)</li>
              <li>• Não inclui comissões bancárias ou despesas processuais</li>
              <li>• Taxa de juro considerada fixa durante todo o período</li>
            </ul>
          </div>
        </div>
      </div>
    </BackofficeLayout>
  );
}
