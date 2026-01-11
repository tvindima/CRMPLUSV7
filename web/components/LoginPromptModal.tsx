"use client";

import { createPortal } from "react-dom";
import { useTerminology } from "@/contexts/TerminologyContext";

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolName: string;
}

export function LoginPromptModal({ isOpen, onClose, toolName }: LoginPromptModalProps) {
  const { terms } = useTerminology();
  
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
        className="relative w-full max-w-md rounded-2xl p-8 shadow-2xl text-center"
        style={{
          backgroundColor: 'var(--color-background-secondary)',
          borderColor: 'var(--color-border)',
          borderWidth: '1px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ícone */}
        <div 
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
          style={{
            background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--color-primary) 20%, transparent), color-mix(in srgb, var(--color-primary) 5%, transparent))',
          }}
        >
          <svg 
            className="h-10 w-10" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: 'var(--color-primary)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        {/* Título */}
        <h2 
          className="mb-2 text-2xl font-bold"
          style={{ color: 'var(--color-text)' }}
        >
          Área de Cliente
        </h2>
        
        {/* Descrição */}
        <p 
          className="mb-6"
          style={{ color: 'var(--color-text-muted)' }}
        >
          O <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>{toolName}</span> é uma ferramenta exclusiva para clientes registados.
        </p>

        {/* Benefícios */}
        <div 
          className="mb-8 rounded-xl p-4 text-left"
          style={{ backgroundColor: 'var(--color-background)' }}
        >
          <p 
            className="mb-3 text-sm font-semibold"
            style={{ color: 'var(--color-text)' }}
          >
            Registe-se gratuitamente e tenha acesso a:
          </p>
          <ul 
            className="space-y-2 text-sm"
            style={{ color: 'var(--color-text-muted)' }}
          >
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
              Comparador de {terms.itemsCapitalized} (até 5)
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
              Alertas de novos {terms.items}
            </li>
          </ul>
        </div>

        {/* Botões */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleLogin}
            className="w-full rounded-full py-3 font-semibold text-white transition"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Entrar ou Criar Conta
          </button>
          <button
            onClick={onClose}
            className="w-full rounded-full py-3 text-sm transition"
            style={{
              borderColor: 'var(--color-border)',
              borderWidth: '1px',
              color: 'var(--color-text-muted)',
            }}
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
