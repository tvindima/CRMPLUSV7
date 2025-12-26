"use client";

import { createPortal } from "react-dom";

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolName: string;
}

export function LoginPromptModal({ isOpen, onClose, toolName }: LoginPromptModalProps) {
  if (!isOpen) return null;

  const handleLogin = () => {
    onClose();
    // Disparar evento para abrir o modal de autenticação
    window.dispatchEvent(new Event("openAuthModal"));
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      
      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-2xl border border-[#2A2A2E] bg-[#151518] p-8 shadow-2xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ícone */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#E10600]/20 to-[#E10600]/5">
          <svg className="h-10 w-10 text-[#E10600]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        {/* Título */}
        <h2 className="mb-2 text-2xl font-bold text-white">
          Área de Cliente
        </h2>
        
        {/* Descrição */}
        <p className="mb-6 text-[#C5C5C5]">
          O <span className="font-semibold text-[#E10600]">{toolName}</span> é uma ferramenta exclusiva para clientes registados.
        </p>

        {/* Benefícios */}
        <div className="mb-8 rounded-xl bg-[#1C1C1F] p-4 text-left">
          <p className="mb-3 text-sm font-semibold text-white">
            Registe-se gratuitamente e tenha acesso a:
          </p>
          <ul className="space-y-2 text-sm text-[#C5C5C5]">
            <li className="flex items-center gap-2">
              <svg className="h-4 w-4 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Simulador de Prestação Mensal
            </li>
            <li className="flex items-center gap-2">
              <svg className="h-4 w-4 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Calculadora de IMT e Impostos
            </li>
            <li className="flex items-center gap-2">
              <svg className="h-4 w-4 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Comparador de Imóveis (até 5)
            </li>
            <li className="flex items-center gap-2">
              <svg className="h-4 w-4 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Guardar favoritos e pesquisas
            </li>
            <li className="flex items-center gap-2">
              <svg className="h-4 w-4 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Alertas de novos imóveis
            </li>
          </ul>
        </div>

        {/* Botões */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleLogin}
            className="w-full rounded-full bg-[#E10600] py-3 font-semibold text-white transition hover:bg-[#C10500]"
          >
            Entrar ou Criar Conta
          </button>
          <button
            onClick={onClose}
            className="w-full rounded-full border border-[#2A2A2E] py-3 text-sm text-[#7A7A7A] transition hover:border-[#3A3A3E] hover:text-white"
          >
            Talvez mais tarde
          </button>
        </div>
      </div>
    </div>
  );

  // Usar portal para renderizar fora do DOM tree normal
  if (typeof window !== "undefined") {
    return createPortal(modalContent, document.body);
  }

  return null;
}
