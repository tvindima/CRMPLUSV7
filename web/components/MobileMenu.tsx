'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MortgageSimulator } from './MortgageSimulator';
import { TaxCalculator } from './TaxCalculator';

interface MobileMenuProps {
  links: Array<{ href: string; label: string }>;
}

export default function MobileMenu({ links }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showMortgageSimulator, setShowMortgageSimulator] = useState(false);
  const [showTaxCalculator, setShowTaxCalculator] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Verificar se utilizador está logado
    const checkAuth = () => {
      const clientUser = localStorage.getItem('client_user');
      setIsLoggedIn(!!clientUser);
    };
    
    checkAuth();
    window.addEventListener('authChange', checkAuth);
    window.addEventListener('storage', checkAuth);
    
    return () => {
      window.removeEventListener('authChange', checkAuth);
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex flex-col items-center justify-center gap-1.5 p-2 md:hidden"
        aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={isOpen}
      >
        <span
          className={`h-0.5 w-6 bg-white transition-all duration-300 ${
            isOpen ? 'translate-y-2 rotate-45' : ''
          }`}
        />
        <span
          className={`h-0.5 w-6 bg-white transition-all duration-300 ${
            isOpen ? 'opacity-0' : ''
          }`}
        />
        <span
          className={`h-0.5 w-6 bg-white transition-all duration-300 ${
            isOpen ? '-translate-y-2 -rotate-45' : ''
          }`}
        />
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Panel */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-[280px] transform border-l border-[#2A2A2E] bg-[#0B0B0D] transition-transform duration-300 md:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Close Button */}
        <div className="flex items-center justify-between border-b border-[#2A2A2E] px-4 py-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#E10600]">
            Menu
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#2A2A2E]"
            aria-label="Fechar menu"
          >
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex h-[calc(100%-60px)] flex-col overflow-y-auto pb-20">
          {/* Navigation Links */}
          <nav className="flex flex-col gap-0.5 p-3">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-[#E10600] text-white'
                      : 'text-[#C5C5C5] hover:bg-[#2A2A2E] hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Ferramentas Section - Visível para utilizadores logados */}
          {isLoggedIn && (
            <div className="border-t border-[#2A2A2E] p-3">
              <span className="mb-2 block px-3 text-xs font-semibold uppercase tracking-wider text-[#7A7A7A]">
                Ferramentas
              </span>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowMortgageSimulator(true);
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#C5C5C5] transition hover:bg-[#2A2A2E] hover:text-white"
              >
                <svg className="h-5 w-5 text-[#E10600]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Simulador de Prestação
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowTaxCalculator(true);
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#C5C5C5] transition hover:bg-[#2A2A2E] hover:text-white"
              >
                <svg className="h-5 w-5 text-[#E10600]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Calculadora de IMT
              </button>
            </div>
          )}
        </div>

        {/* Login Button - Fixed at bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-[#2A2A2E] bg-[#0B0B0D] p-3">
          <button
            onClick={() => {
              setIsOpen(false);
              // Dispara evento para abrir modal de autenticação
              window.dispatchEvent(new Event('openAuthModal'));
            }}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-[#E10600] bg-[#E10600] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#E10600]/90"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            {isLoggedIn ? 'Minha Conta' : 'Entrar'}
          </button>
        </div>
      </div>

      {/* Modal Simulador de Prestação */}
      {showMortgageSimulator && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowMortgageSimulator(false)}
        >
          <div 
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <MortgageSimulator onClose={() => setShowMortgageSimulator(false)} />
          </div>
        </div>
      )}

      {/* Modal Calculadora IMT */}
      {showTaxCalculator && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowTaxCalculator(false)}
        >
          <div 
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <TaxCalculator onClose={() => setShowTaxCalculator(false)} />
          </div>
        </div>
      )}
    </>
  );
}
