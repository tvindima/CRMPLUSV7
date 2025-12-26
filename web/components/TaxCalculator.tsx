"use client";

import { useState } from "react";

// Configuração IMT 2025
const imtConfig = {
  impostoSelo: 0.008,
  escaloes: {
    habitacao_propria_permanente: [
      { limite: 101917, taxa: 0, parcela: 0 },
      { limite: 139412, taxa: 0.02, parcela: 2038.34 },
      { limite: 190086, taxa: 0.05, parcela: 6220.70 },
      { limite: 316772, taxa: 0.07, parcela: 10022.42 },
      { limite: 633453, taxa: 0.08, parcela: 13190.14 },
      { limite: 1102920, taxa: 0.06, parcela: 0, taxaUnica: true },
      { limite: Infinity, taxa: 0.075, parcela: 0, taxaUnica: true },
    ],
    habitacao_secundaria: [
      { limite: 101917, taxa: 0.01, parcela: 0 },
      { limite: 139412, taxa: 0.02, parcela: 1019.17 },
      { limite: 190086, taxa: 0.05, parcela: 5201.53 },
      { limite: 316772, taxa: 0.07, parcela: 9003.25 },
      { limite: 607528, taxa: 0.08, parcela: 12170.97 },
      { limite: 1102920, taxa: 0.06, parcela: 0, taxaUnica: true },
      { limite: Infinity, taxa: 0.075, parcela: 0, taxaUnica: true },
    ],
    comercial: [
      { limite: 101917, taxa: 0.065, parcela: 0, taxaUnica: true },
      { limite: Infinity, taxa: 0.075, parcela: 0, taxaUnica: true },
    ],
    terreno: [
      { limite: Infinity, taxa: 0.065, parcela: 0, taxaUnica: true },
    ],
  },
};

type TipoImovel = "habitacao" | "comercial" | "terreno";
type FinalidadeHabitacao = "propria_permanente" | "secundaria";

interface TaxCalculatorProps {
  valorImovel?: number;
  onClose?: () => void;
}

export function TaxCalculator({ valorImovel, onClose }: TaxCalculatorProps) {
  const [valor, setValor] = useState(valorImovel || 200000);
  const [tipoImovel, setTipoImovel] = useState<TipoImovel>("habitacao");
  const [finalidade, setFinalidade] = useState<FinalidadeHabitacao>("propria_permanente");

  // Selecionar escalões corretos
  const getEscaloes = () => {
    if (tipoImovel === "comercial") return imtConfig.escaloes.comercial;
    if (tipoImovel === "terreno") return imtConfig.escaloes.terreno;
    if (finalidade === "propria_permanente") return imtConfig.escaloes.habitacao_propria_permanente;
    return imtConfig.escaloes.habitacao_secundaria;
  };

  // Calcular IMT
  const calcularIMT = () => {
    const escaloes = getEscaloes();
    const escalao = escaloes.find((e) => valor <= e.limite) || escaloes[escaloes.length - 1];
    
    if (escalao.taxaUnica) {
      return valor * escalao.taxa;
    }
    return valor * escalao.taxa - escalao.parcela;
  };

  // Calcular Imposto de Selo
  const calcularIS = () => {
    return valor * imtConfig.impostoSelo;
  };

  const imt = Math.max(0, calcularIMT());
  const impostoSelo = calcularIS();
  const totalImpostos = imt + impostoSelo;
  const custoTotal = valor + totalImpostos;

  // Obter informação do escalão atual
  const getEscalaoInfo = () => {
    const escaloes = getEscaloes();
    const escalao = escaloes.find((e) => valor <= e.limite) || escaloes[escaloes.length - 1];
    return {
      taxa: (escalao.taxa * 100).toFixed(1),
      isento: escalao.taxa === 0,
    };
  };

  const escalaoInfo = getEscalaoInfo();

  return (
    <div className="rounded-2xl bg-[#151518] p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Calculadora de IMT</h2>
        {onClose && (
          <button onClick={onClose} className="text-[#7A7A7A] hover:text-white">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Tipo de Imóvel */}
        <div>
          <label className="mb-2 block text-sm text-[#C5C5C5]">Tipo de Imóvel</label>
          <div className="flex gap-2">
            <button
              onClick={() => setTipoImovel("habitacao")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                tipoImovel === "habitacao"
                  ? "bg-[#E10600] text-white"
                  : "bg-[#2A2A2E] text-[#C5C5C5] hover:bg-[#3A3A3E]"
              }`}
            >
              Habitação
            </button>
            <button
              onClick={() => setTipoImovel("comercial")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                tipoImovel === "comercial"
                  ? "bg-[#E10600] text-white"
                  : "bg-[#2A2A2E] text-[#C5C5C5] hover:bg-[#3A3A3E]"
              }`}
            >
              Comercial
            </button>
            <button
              onClick={() => setTipoImovel("terreno")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                tipoImovel === "terreno"
                  ? "bg-[#E10600] text-white"
                  : "bg-[#2A2A2E] text-[#C5C5C5] hover:bg-[#3A3A3E]"
              }`}
            >
              Terreno
            </button>
          </div>
        </div>

        {/* Finalidade (só para habitação) */}
        {tipoImovel === "habitacao" && (
          <div>
            <label className="mb-2 block text-sm text-[#C5C5C5]">Finalidade</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFinalidade("propria_permanente")}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  finalidade === "propria_permanente"
                    ? "bg-[#E10600] text-white"
                    : "bg-[#2A2A2E] text-[#C5C5C5] hover:bg-[#3A3A3E]"
                }`}
              >
                Própria Permanente
              </button>
              <button
                onClick={() => setFinalidade("secundaria")}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  finalidade === "secundaria"
                    ? "bg-[#E10600] text-white"
                    : "bg-[#2A2A2E] text-[#C5C5C5] hover:bg-[#3A3A3E]"
                }`}
              >
                Secundária/Investimento
              </button>
            </div>
          </div>
        )}

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

        {/* Resultado */}
        <div className="mt-6 rounded-xl bg-gradient-to-r from-[#E10600]/20 to-[#E10600]/5 p-5 border border-[#E10600]/30">
          <div className="mb-4 text-center">
            <p className="text-sm text-[#C5C5C5]">Total de Impostos</p>
            <p className="text-4xl font-bold text-white mt-1">
              {totalImpostos.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </p>
          </div>

          <div className="space-y-3">
            {/* IMT */}
            <div className="flex items-center justify-between rounded-lg bg-[#0B0B0D] p-4">
              <div>
                <p className="text-white font-medium">IMT</p>
                <p className="text-xs text-[#7A7A7A]">
                  {escalaoInfo.isento ? "Isento" : `Taxa: ${escalaoInfo.taxa}%`}
                </p>
              </div>
              <p className="text-xl font-bold text-white">
                {imt.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </p>
            </div>

            {/* Imposto de Selo */}
            <div className="flex items-center justify-between rounded-lg bg-[#0B0B0D] p-4">
              <div>
                <p className="text-white font-medium">Imposto de Selo</p>
                <p className="text-xs text-[#7A7A7A]">Taxa: 0,8%</p>
              </div>
              <p className="text-xl font-bold text-white">
                {impostoSelo.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </p>
            </div>

            {/* Custo Total */}
            <div className="flex items-center justify-between rounded-lg bg-[#E10600]/10 p-4 border border-[#E10600]/30">
              <div>
                <p className="text-white font-medium">Custo Total de Aquisição</p>
                <p className="text-xs text-[#7A7A7A]">Valor do imóvel + Impostos</p>
              </div>
              <p className="text-xl font-bold text-[#E10600]">
                {custoTotal.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </p>
            </div>
          </div>
        </div>

        {/* Notas */}
        <div className="space-y-1 text-xs text-[#7A7A7A]">
          <p>• Valores para Portugal Continental (2025)</p>
          <p>• Regiões Autónomas podem ter taxas diferentes</p>
          <p>• Isenções aplicáveis não são consideradas</p>
          <p>• Simulação indicativa, não vinculativa</p>
        </div>
      </div>
    </div>
  );
}
