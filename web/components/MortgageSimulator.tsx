"use client";

import { useState } from "react";

// Configuração de taxas (mesmo do mobile)
const mortgageConfig = {
  euribor: 0.025,
  spread: {
    hpp: 0.01,
    secundaria: 0.015,
  },
  entradaMinima: {
    hpp: 0.10,
    secundaria: 0.20,
  },
  prazosDisponiveis: [20, 25, 30, 35, 40],
  taxaEsforcoLimites: {
    confortavel: 0.30,
    aceitavel: 0.35,
    risco: 0.40,
  },
};

interface MortgageSimulatorProps {
  valorImovel?: number;
  onClose?: () => void;
}

export function MortgageSimulator({ valorImovel, onClose }: MortgageSimulatorProps) {
  const [valor, setValor] = useState(valorImovel || 200000);
  const [entrada, setEntrada] = useState(20);
  const [prazo, setPrazo] = useState(30);
  const [tipoHabitacao, setTipoHabitacao] = useState<"hpp" | "secundaria">("hpp");
  const [rendimentoMensal, setRendimentoMensal] = useState(2500);

  // Cálculos
  const valorEntrada = valor * (entrada / 100);
  const valorFinanciado = valor - valorEntrada;
  const taxaAnual = mortgageConfig.euribor + mortgageConfig.spread[tipoHabitacao];
  const taxaMensal = taxaAnual / 12;
  const numPrestacoes = prazo * 12;

  // Fórmula Price (Francesa)
  const prestacao =
    valorFinanciado * (taxaMensal / (1 - Math.pow(1 + taxaMensal, -numPrestacoes)));

  const totalPago = prestacao * numPrestacoes;
  const totalJuros = totalPago - valorFinanciado;
  const taxaEsforco = (prestacao / rendimentoMensal) * 100;

  const getRiskLevel = () => {
    const ratio = prestacao / rendimentoMensal;
    if (ratio <= mortgageConfig.taxaEsforcoLimites.confortavel) return { level: "Confortável", color: "bg-green-500", textColor: "text-green-400" };
    if (ratio <= mortgageConfig.taxaEsforcoLimites.aceitavel) return { level: "Aceitável", color: "bg-yellow-500", textColor: "text-yellow-400" };
    return { level: "Risco Elevado", color: "bg-red-500", textColor: "text-red-400" };
  };

  const risk = getRiskLevel();
  const entradaMinima = mortgageConfig.entradaMinima[tipoHabitacao] * 100;

  return (
    <div className="rounded-2xl bg-[#151518] p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Simulador de Prestação</h2>
        {onClose && (
          <button onClick={onClose} className="text-[#7A7A7A] hover:text-white">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Tipo de Habitação */}
        <div>
          <label className="mb-2 block text-sm text-[#C5C5C5]">Tipo de Habitação</label>
          <div className="flex gap-2">
            <button
              onClick={() => setTipoHabitacao("hpp")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                tipoHabitacao === "hpp"
                  ? "bg-[#E10600] text-white"
                  : "bg-[#2A2A2E] text-[#C5C5C5] hover:bg-[#3A3A3E]"
              }`}
            >
              Própria Permanente
            </button>
            <button
              onClick={() => setTipoHabitacao("secundaria")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                tipoHabitacao === "secundaria"
                  ? "bg-[#E10600] text-white"
                  : "bg-[#2A2A2E] text-[#C5C5C5] hover:bg-[#3A3A3E]"
              }`}
            >
              Secundária/Investimento
            </button>
          </div>
        </div>

        {/* Valor do Imóvel */}
        <div>
          <label className="mb-2 block text-sm text-[#C5C5C5]">Valor do Imóvel</label>
          <div className="relative">
            <input
              type="number"
              value={valor}
              onChange={(e) => setValor(Number(e.target.value))}
              className="w-full rounded-lg border border-[#2A2A2E] bg-[#0B0B0D] px-4 py-3 pr-12 text-white outline-none focus:border-[#E10600]"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7A7A7A]">€</span>
          </div>
        </div>

        {/* Entrada */}
        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-[#C5C5C5]">Entrada</span>
            <span className="text-white font-medium">{entrada}% ({valorEntrada.toLocaleString("pt-PT")} €)</span>
          </div>
          <input
            type="range"
            min={entradaMinima}
            max={50}
            value={entrada}
            onChange={(e) => setEntrada(Number(e.target.value))}
            className="w-full accent-[#E10600]"
          />
          <div className="mt-1 flex justify-between text-xs text-[#7A7A7A]">
            <span>Mín. {entradaMinima}%</span>
            <span>50%</span>
          </div>
        </div>

        {/* Prazo */}
        <div>
          <label className="mb-2 block text-sm text-[#C5C5C5]">Prazo</label>
          <div className="flex gap-2">
            {mortgageConfig.prazosDisponiveis.map((p) => (
              <button
                key={p}
                onClick={() => setPrazo(p)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  prazo === p
                    ? "bg-[#E10600] text-white"
                    : "bg-[#2A2A2E] text-[#C5C5C5] hover:bg-[#3A3A3E]"
                }`}
              >
                {p} anos
              </button>
            ))}
          </div>
        </div>

        {/* Rendimento Mensal */}
        <div>
          <label className="mb-2 block text-sm text-[#C5C5C5]">Rendimento Mensal do Agregado</label>
          <div className="relative">
            <input
              type="number"
              value={rendimentoMensal}
              onChange={(e) => setRendimentoMensal(Number(e.target.value))}
              className="w-full rounded-lg border border-[#2A2A2E] bg-[#0B0B0D] px-4 py-3 pr-12 text-white outline-none focus:border-[#E10600]"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7A7A7A]">€</span>
          </div>
        </div>

        {/* Resultado */}
        <div className="mt-6 rounded-xl bg-gradient-to-r from-[#E10600]/20 to-[#E10600]/5 p-5 border border-[#E10600]/30">
          <div className="mb-4 text-center">
            <p className="text-sm text-[#C5C5C5]">Prestação Mensal Estimada</p>
            <p className="text-4xl font-bold text-white mt-1">
              {prestacao.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg bg-[#0B0B0D] p-3">
              <p className="text-[#7A7A7A]">Valor Financiado</p>
              <p className="text-white font-medium">{valorFinanciado.toLocaleString("pt-PT")} €</p>
            </div>
            <div className="rounded-lg bg-[#0B0B0D] p-3">
              <p className="text-[#7A7A7A]">Taxa Anual (TAEG)</p>
              <p className="text-white font-medium">{(taxaAnual * 100).toFixed(2)}%</p>
            </div>
            <div className="rounded-lg bg-[#0B0B0D] p-3">
              <p className="text-[#7A7A7A]">Total de Juros</p>
              <p className="text-white font-medium">{totalJuros.toLocaleString("pt-PT", { maximumFractionDigits: 0 })} €</p>
            </div>
            <div className="rounded-lg bg-[#0B0B0D] p-3">
              <p className="text-[#7A7A7A]">Total a Pagar</p>
              <p className="text-white font-medium">{totalPago.toLocaleString("pt-PT", { maximumFractionDigits: 0 })} €</p>
            </div>
          </div>

          {/* Taxa de Esforço */}
          <div className="mt-4 rounded-lg bg-[#0B0B0D] p-4">
            <div className="mb-2 flex justify-between">
              <span className="text-[#7A7A7A]">Taxa de Esforço</span>
              <span className={`font-medium ${risk.textColor}`}>{taxaEsforco.toFixed(1)}% - {risk.level}</span>
            </div>
            <div className="h-2 rounded-full bg-[#2A2A2E] overflow-hidden">
              <div
                className={`h-full ${risk.color} transition-all`}
                style={{ width: `${Math.min(taxaEsforco, 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-[#7A7A7A]">
              Recomendado: até 30% do rendimento mensal
            </p>
          </div>
        </div>

        {/* Notas */}
        <p className="text-xs text-[#7A7A7A] text-center">
          Simulação indicativa. Valores não vinculativos, sujeitos a análise de crédito.
          Euribor 12M: {(mortgageConfig.euribor * 100).toFixed(2)}% | Spread: {(mortgageConfig.spread[tipoHabitacao] * 100).toFixed(2)}%
        </p>
      </div>
    </div>
  );
}
