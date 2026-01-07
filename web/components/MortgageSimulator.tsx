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
    <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--color-background-secondary)' }}>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>Simulador de Prestação</h2>
        {onClose && (
          <button onClick={onClose} style={{ color: 'var(--color-text-muted)' }}>
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Tipo de Habitação */}
        <div>
          <label className="mb-2 block text-sm" style={{ color: 'var(--color-text-muted)' }}>Tipo de Habitação</label>
          <div className="flex gap-2">
            <button
              onClick={() => setTipoHabitacao("hpp")}
              className="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition"
              style={{
                backgroundColor: tipoHabitacao === "hpp" ? 'var(--color-primary)' : 'var(--color-border)',
                color: tipoHabitacao === "hpp" ? 'white' : 'var(--color-text-muted)',
              }}
            >
              Própria Permanente
            </button>
            <button
              onClick={() => setTipoHabitacao("secundaria")}
              className="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition"
              style={{
                backgroundColor: tipoHabitacao === "secundaria" ? 'var(--color-primary)' : 'var(--color-border)',
                color: tipoHabitacao === "secundaria" ? 'white' : 'var(--color-text-muted)',
              }}
            >
              Secundária/Investimento
            </button>
          </div>
        </div>

        {/* Valor do Imóvel */}
        <div>
          <label className="mb-2 block text-sm" style={{ color: 'var(--color-text-muted)' }}>Valor do Imóvel</label>
          <div className="relative">
            <input
              type="number"
              value={valor}
              onChange={(e) => setValor(Number(e.target.value))}
              className="w-full rounded-lg px-4 py-3 pr-12 outline-none"
              style={{
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
              }}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }}>€</span>
          </div>
        </div>

        {/* Entrada */}
        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span style={{ color: 'var(--color-text-muted)' }}>Entrada</span>
            <span className="font-medium" style={{ color: 'var(--color-text)' }}>{entrada}% ({valorEntrada.toLocaleString("pt-PT")} €)</span>
          </div>
          <input
            type="range"
            min={entradaMinima}
            max={50}
            value={entrada}
            onChange={(e) => setEntrada(Number(e.target.value))}
            className="w-full"
            style={{ accentColor: 'var(--color-primary)' }}
          />
          <div className="mt-1 flex justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <span>Mín. {entradaMinima}%</span>
            <span>50%</span>
          </div>
        </div>

        {/* Prazo */}
        <div>
          <label className="mb-2 block text-sm" style={{ color: 'var(--color-text-muted)' }}>Prazo</label>
          <div className="flex gap-2">
            {mortgageConfig.prazosDisponiveis.map((p) => (
              <button
                key={p}
                onClick={() => setPrazo(p)}
                className="flex-1 rounded-lg px-3 py-2 text-sm font-medium transition"
                style={{
                  backgroundColor: prazo === p ? 'var(--color-primary)' : 'var(--color-border)',
                  color: prazo === p ? 'white' : 'var(--color-text-muted)',
                }}
              >
                {p} anos
              </button>
            ))}
          </div>
        </div>

        {/* Rendimento Mensal */}
        <div>
          <label className="mb-2 block text-sm" style={{ color: 'var(--color-text-muted)' }}>Rendimento Mensal do Agregado</label>
          <div className="relative">
            <input
              type="number"
              value={rendimentoMensal}
              onChange={(e) => setRendimentoMensal(Number(e.target.value))}
              className="w-full rounded-lg px-4 py-3 pr-12 outline-none"
              style={{
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
              }}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }}>€</span>
          </div>
        </div>

        {/* Resultado */}
        <div 
          className="mt-6 rounded-xl p-5"
          style={{
            background: 'linear-gradient(to right, color-mix(in srgb, var(--color-primary) 20%, transparent), color-mix(in srgb, var(--color-primary) 5%, transparent))',
            border: '1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)',
          }}
        >
          <div className="mb-4 text-center">
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Prestação Mensal Estimada</p>
            <p className="text-4xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>
              {prestacao.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-background)' }}>
              <p style={{ color: 'var(--color-text-muted)' }}>Valor Financiado</p>
              <p className="font-medium" style={{ color: 'var(--color-text)' }}>{valorFinanciado.toLocaleString("pt-PT")} €</p>
            </div>
            <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-background)' }}>
              <p style={{ color: 'var(--color-text-muted)' }}>Taxa Anual (TAEG)</p>
              <p className="font-medium" style={{ color: 'var(--color-text)' }}>{(taxaAnual * 100).toFixed(2)}%</p>
            </div>
            <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-background)' }}>
              <p style={{ color: 'var(--color-text-muted)' }}>Total de Juros</p>
              <p className="font-medium" style={{ color: 'var(--color-text)' }}>{totalJuros.toLocaleString("pt-PT", { maximumFractionDigits: 0 })} €</p>
            </div>
            <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-background)' }}>
              <p style={{ color: 'var(--color-text-muted)' }}>Total a Pagar</p>
              <p className="font-medium" style={{ color: 'var(--color-text)' }}>{totalPago.toLocaleString("pt-PT", { maximumFractionDigits: 0 })} €</p>
            </div>
          </div>

          {/* Taxa de Esforço */}
          <div className="mt-4 rounded-lg p-4" style={{ backgroundColor: 'var(--color-background)' }}>
            <div className="mb-2 flex justify-between">
              <span style={{ color: 'var(--color-text-muted)' }}>Taxa de Esforço</span>
              <span className={`font-medium ${risk.textColor}`}>{taxaEsforco.toFixed(1)}% - {risk.level}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
              <div
                className={`h-full ${risk.color} transition-all`}
                style={{ width: `${Math.min(taxaEsforco, 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Recomendado: até 30% do rendimento mensal
            </p>
          </div>
        </div>

        {/* Notas */}
        <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
          Simulação indicativa. Valores não vinculativos, sujeitos a análise de crédito.
          Euribor 12M: {(mortgageConfig.euribor * 100).toFixed(2)}% | Spread: {(mortgageConfig.spread[tipoHabitacao] * 100).toFixed(2)}%
        </p>
      </div>
    </div>
  );
}
