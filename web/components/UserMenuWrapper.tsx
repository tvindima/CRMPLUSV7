"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { MortgageSimulator } from "./MortgageSimulator";
import { TaxCalculator } from "./TaxCalculator";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://crmplusv7-production.up.railway.app";

interface UserData {
  id?: number;
  email: string;
  name: string;
  phone?: string;
  assigned_agent_name?: string;
}

interface Agent {
  id: number;
  name: string;
  avatar_url?: string;
  specialty?: string;
}

export function UserMenuWrapper() {
  const [user, setUser] = useState<UserData | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [registerStep, setRegisterStep] = useState(1); // 1: dados, 2: qualificação, 3: agente
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    interest_type: "compra" as "compra" | "arrendamento",
    client_type: "pontual" as "investidor" | "pontual",
    has_agent: false,
    selected_agent_id: null as number | null,
  });
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showMortgageSimulator, setShowMortgageSimulator] = useState(false);
  const [showTaxCalculator, setShowTaxCalculator] = useState(false);

  useEffect(() => {
    // Verificar se há cliente guardado (migrar de "user" para "client_user")
    let clientData = localStorage.getItem("client_user");
    if (!clientData) {
      // Migrar dados antigos se existirem
      const oldUserData = localStorage.getItem("user");
      if (oldUserData) {
        localStorage.setItem("client_user", oldUserData);
        localStorage.removeItem("user");
        clientData = oldUserData;
      }
    }
    
    if (clientData) {
      try {
        setUser(JSON.parse(clientData));
      } catch (e) {
        localStorage.removeItem("client_user");
        localStorage.removeItem("client_token");
      }
    }

    const handleStorageChange = () => {
      const clientData = localStorage.getItem("client_user");
      if (clientData) {
        try {
          setUser(JSON.parse(clientData));
        } catch (e) {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    // Listener para abrir modal de autenticação (disparado pelo MobileMenu)
    const handleOpenAuthModal = () => {
      setShowAuthModal(true);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("authChange", handleStorageChange);
    window.addEventListener("openAuthModal", handleOpenAuthModal);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authChange", handleStorageChange);
      window.removeEventListener("openAuthModal", handleOpenAuthModal);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("client_user");
    localStorage.removeItem("client_token");
    localStorage.removeItem("user"); // limpar dados antigos também
    setUser(null);
    setShowDropdown(false);
    window.dispatchEvent(new Event("authChange"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "register") {
        // Registar novo cliente via API
        const response = await fetch(`${API_BASE}/website/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            phone: formData.phone || undefined,
            interest_type: formData.interest_type,
            client_type: formData.interest_type === "compra" ? formData.client_type : "arrendamento",
            selected_agent_id: formData.selected_agent_id,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Erro ao registar");
        }

        const data = await response.json();
        
        // Guardar token e dados do cliente
        localStorage.setItem("client_token", data.access_token);
        localStorage.setItem("client_user", JSON.stringify(data.client));
        setUser(data.client);
      } else {
        // Login via API
        const response = await fetch(`${API_BASE}/website/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Email ou password incorretos");
        }

        const data = await response.json();
        
        // Guardar token e dados do cliente
        localStorage.setItem("client_token", data.access_token);
        localStorage.setItem("client_user", JSON.stringify(data.client));
        setUser(data.client);
      }

      setShowAuthModal(false);
      resetForm();
      window.dispatchEvent(new Event("authChange"));
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      phone: "",
      interest_type: "compra",
      client_type: "pontual",
      has_agent: false,
      selected_agent_id: null,
    });
    setRegisterStep(1);
    setAgents([]);
  };

  const fetchAgents = async (interestType: string) => {
    try {
      const response = await fetch(`${API_BASE}/website/auth/agents?interest_type=${interestType}`);
      if (response.ok) {
        const data = await response.json();
        setAgents(data);
      }
    } catch (error) {
      console.error("Erro ao carregar agentes:", error);
    }
  };

  const handleNextStep = () => {
    if (registerStep === 1) {
      // Validar dados básicos
      if (!formData.name || !formData.email || !formData.password) {
        setError("Preencha todos os campos obrigatórios");
        return;
      }
      if (formData.password.length < 6) {
        setError("A password deve ter pelo menos 6 caracteres");
        return;
      }
      setError("");
      setRegisterStep(2);
    } else if (registerStep === 2) {
      // Carregar agentes e passar para passo 3
      fetchAgents(formData.interest_type);
      setRegisterStep(3);
    }
  };

  const handlePrevStep = () => {
    setError("");
    if (registerStep > 1) {
      setRegisterStep(registerStep - 1);
    }
  };

  if (user) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 rounded-full bg-[#E10600] px-3 py-1.5 text-sm text-white transition hover:bg-[#C10500]"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-[#E10600]">
            {user.name.charAt(0).toUpperCase()}
          </span>
          <span className="hidden md:block">{user.name.split(" ")[0]}</span>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDropdown && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
            <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-[#2A2A2E] bg-[#1A1A1E] p-2 shadow-xl">
              <div className="border-b border-[#2A2A2E] px-3 py-2 mb-2">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-[#7A7A7A]">{user.email}</p>
              </div>
              <Link
                href="/favoritos"
                className="flex items-center gap-2 rounded px-3 py-2 text-sm text-[#C5C5C5] transition hover:bg-[#2A2A2E] hover:text-white"
                onClick={() => setShowDropdown(false)}
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                Os meus favoritos
              </Link>
              <Link
                href="/comparar"
                className="flex items-center gap-2 rounded px-3 py-2 text-sm text-[#C5C5C5] transition hover:bg-[#2A2A2E] hover:text-white"
                onClick={() => setShowDropdown(false)}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                Comparar imóveis
              </Link>
              <Link
                href="/pesquisas"
                className="flex items-center gap-2 rounded px-3 py-2 text-sm text-[#C5C5C5] transition hover:bg-[#2A2A2E] hover:text-white"
                onClick={() => setShowDropdown(false)}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Pesquisas guardadas
              </Link>
              <Link
                href="/alertas"
                className="flex items-center gap-2 rounded px-3 py-2 text-sm text-[#C5C5C5] transition hover:bg-[#2A2A2E] hover:text-white"
                onClick={() => setShowDropdown(false)}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Alertas de imóveis
              </Link>
              <hr className="my-2 border-[#2A2A2E]" />
              <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#7A7A7A]">Ferramentas</p>
              <button
                onClick={() => {
                  setShowDropdown(false);
                  setShowMortgageSimulator(true);
                }}
                className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-[#C5C5C5] transition hover:bg-[#2A2A2E] hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Simulador de Prestação
              </button>
              <button
                onClick={() => {
                  setShowDropdown(false);
                  setShowTaxCalculator(true);
                }}
                className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-[#C5C5C5] transition hover:bg-[#2A2A2E] hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Calculadora de IMT
              </button>
              <hr className="my-2 border-[#2A2A2E]" />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-red-400 transition hover:bg-[#2A2A2E]"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Terminar sessão
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowAuthModal(true)}
        className="flex items-center gap-2 rounded-full border border-[#E10600] px-4 py-1.5 text-sm text-[#E10600] transition hover:bg-[#E10600] hover:text-white"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="hidden md:block">Entrar</span>
      </button>

      {showAuthModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/80 p-4 overflow-y-auto"
          style={{ zIndex: 99999 }}
          onClick={() => setShowAuthModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#151518] p-6 shadow-xl my-auto max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                {mode === "login" ? "Entrar na conta" : 
                  registerStep === 1 ? "Criar conta" :
                  registerStep === 2 ? "Sobre si" :
                  "Escolha o seu agente"
                }
              </h2>
              <button onClick={() => { setShowAuthModal(false); resetForm(); }} className="text-[#C5C5C5] hover:text-white">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {mode === "login" && (
              <div className="mb-6 flex rounded-lg bg-[#0B0B0D] p-1">
                <button
                  onClick={() => { setMode("login"); resetForm(); }}
                  className="flex-1 rounded-md px-4 py-2 text-sm font-semibold transition bg-[#E10600] text-white"
                >
                  Entrar
                </button>
                <button
                  onClick={() => { setMode("register"); resetForm(); }}
                  className="flex-1 rounded-md px-4 py-2 text-sm font-semibold transition text-[#C5C5C5]"
                >
                  Registar
                </button>
              </div>
            )}

            {mode === "register" && (
              <div className="mb-6 flex items-center justify-center gap-2">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`h-2 w-8 rounded-full transition ${
                      step === registerStep ? "bg-[#E10600]" :
                      step < registerStep ? "bg-[#E10600]/50" : "bg-[#2A2A2E]"
                    }`}
                  />
                ))}
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-500">
                {error}
              </div>
            )}

            {/* LOGIN FORM */}
            {mode === "login" && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-[#C5C5C5]">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-[#2A2A2E] bg-[#0B0B0D] px-3 py-2 text-white outline-none focus:border-[#E10600]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#C5C5C5]">Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-lg border border-[#2A2A2E] bg-[#0B0B0D] px-3 py-2 text-white outline-none focus:border-[#E10600]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-[#E10600] py-3 font-semibold text-white transition hover:bg-[#C10500] disabled:opacity-50"
                >
                  {loading ? "A processar..." : "Entrar"}
                </button>
                <p className="text-center text-sm text-[#7A7A7A]">
                  Não tem conta?{" "}
                  <button type="button" onClick={() => { setMode("register"); resetForm(); }} className="text-[#E10600] hover:underline">
                    Registar
                  </button>
                </p>
              </form>
            )}

            {/* REGISTER STEP 1: Dados básicos */}
            {mode === "register" && registerStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-[#C5C5C5]">Nome completo *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-[#2A2A2E] bg-[#0B0B0D] px-3 py-2 text-white outline-none focus:border-[#E10600]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#C5C5C5]">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-[#2A2A2E] bg-[#0B0B0D] px-3 py-2 text-white outline-none focus:border-[#E10600]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#C5C5C5]">Password *</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-lg border border-[#2A2A2E] bg-[#0B0B0D] px-3 py-2 text-white outline-none focus:border-[#E10600]"
                  />
                  <p className="mt-1 text-xs text-[#7A7A7A]">Mínimo 6 caracteres</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#C5C5C5]">Telefone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg border border-[#2A2A2E] bg-[#0B0B0D] px-3 py-2 text-white outline-none focus:border-[#E10600]"
                    placeholder="Opcional"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full rounded-lg bg-[#E10600] py-3 font-semibold text-white transition hover:bg-[#C10500]"
                >
                  Continuar
                </button>
                <p className="text-center text-sm text-[#7A7A7A]">
                  Já tem conta?{" "}
                  <button type="button" onClick={() => { setMode("login"); resetForm(); }} className="text-[#E10600] hover:underline">
                    Entrar
                  </button>
                </p>
              </div>
            )}

            {/* REGISTER STEP 2: Qualificação */}
            {mode === "register" && registerStep === 2 && (
              <div className="space-y-5">
                <div>
                  <label className="mb-3 block text-sm font-medium text-white">O que procura?</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, interest_type: "compra" })}
                      className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition ${
                        formData.interest_type === "compra"
                          ? "border-[#E10600] bg-[#E10600]/10"
                          : "border-[#2A2A2E] bg-[#0B0B0D] hover:border-[#3A3A3E]"
                      }`}
                    >
                      <span className="text-2xl">🏠</span>
                      <span className={`text-sm font-medium ${formData.interest_type === "compra" ? "text-white" : "text-[#C5C5C5]"}`}>
                        Comprar
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, interest_type: "arrendamento" })}
                      className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition ${
                        formData.interest_type === "arrendamento"
                          ? "border-[#E10600] bg-[#E10600]/10"
                          : "border-[#2A2A2E] bg-[#0B0B0D] hover:border-[#3A3A3E]"
                      }`}
                    >
                      <span className="text-2xl">🔑</span>
                      <span className={`text-sm font-medium ${formData.interest_type === "arrendamento" ? "text-white" : "text-[#C5C5C5]"}`}>
                        Arrendar
                      </span>
                    </button>
                  </div>
                </div>

                {formData.interest_type === "compra" && (
                  <div>
                    <label className="mb-3 block text-sm font-medium text-white">Como se identifica?</label>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, client_type: "investidor" })}
                        className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${
                          formData.client_type === "investidor"
                            ? "border-[#E10600] bg-[#E10600]/10"
                            : "border-[#2A2A2E] bg-[#0B0B0D] hover:border-[#3A3A3E]"
                        }`}
                      >
                        <span className="text-2xl">💼</span>
                        <div>
                          <p className={`font-medium ${formData.client_type === "investidor" ? "text-white" : "text-[#C5C5C5]"}`}>
                            Investidor
                          </p>
                          <p className="text-xs text-[#7A7A7A]">
                            Faço investimentos imobiliários com alguma regularidade
                          </p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, client_type: "pontual" })}
                        className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${
                          formData.client_type === "pontual"
                            ? "border-[#E10600] bg-[#E10600]/10"
                            : "border-[#2A2A2E] bg-[#0B0B0D] hover:border-[#3A3A3E]"
                        }`}
                      >
                        <span className="text-2xl">🏡</span>
                        <div>
                          <p className={`font-medium ${formData.client_type === "pontual" ? "text-white" : "text-[#C5C5C5]"}`}>
                            Compra pontual
                          </p>
                          <p className="text-xs text-[#7A7A7A]">
                            Procuro casa para habitar ou investimento ocasional
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="flex-1 rounded-lg border border-[#2A2A2E] py-3 font-semibold text-[#C5C5C5] transition hover:bg-[#1A1A1E]"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex-1 rounded-lg bg-[#E10600] py-3 font-semibold text-white transition hover:bg-[#C10500]"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}

            {/* REGISTER STEP 3: Escolha de agente */}
            {mode === "register" && registerStep === 3 && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-3 block text-sm font-medium text-white">
                    Já trabalha com algum dos nossos agentes?
                  </label>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, has_agent: false, selected_agent_id: null })}
                      className={`rounded-xl border p-3 text-sm font-medium transition ${
                        !formData.has_agent
                          ? "border-[#E10600] bg-[#E10600]/10 text-white"
                          : "border-[#2A2A2E] bg-[#0B0B0D] text-[#C5C5C5] hover:border-[#3A3A3E]"
                      }`}
                    >
                      Não, atribuam-me um
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, has_agent: true })}
                      className={`rounded-xl border p-3 text-sm font-medium transition ${
                        formData.has_agent
                          ? "border-[#E10600] bg-[#E10600]/10 text-white"
                          : "border-[#2A2A2E] bg-[#0B0B0D] text-[#C5C5C5] hover:border-[#3A3A3E]"
                      }`}
                    >
                      Sim, escolher
                    </button>
                  </div>

                  {formData.has_agent && agents.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {agents.map((agent) => (
                        <button
                          key={agent.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, selected_agent_id: agent.id })}
                          className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                            formData.selected_agent_id === agent.id
                              ? "border-[#E10600] bg-[#E10600]/10"
                              : "border-[#2A2A2E] bg-[#0B0B0D] hover:border-[#3A3A3E]"
                          }`}
                        >
                          {agent.avatar_url ? (
                            <img 
                              src={agent.avatar_url} 
                              alt={agent.name} 
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E10600] text-white font-semibold">
                              {agent.name.charAt(0)}
                            </div>
                          )}
                          <span className={`font-medium ${formData.selected_agent_id === agent.id ? "text-white" : "text-[#C5C5C5]"}`}>
                            {agent.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {!formData.has_agent && (
                    <p className="text-sm text-[#7A7A7A] text-center py-2">
                      Será atribuído um agente especializado automaticamente
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="flex-1 rounded-lg border border-[#2A2A2E] py-3 font-semibold text-[#C5C5C5] transition hover:bg-[#1A1A1E]"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={loading || (formData.has_agent && !formData.selected_agent_id)}
                    className="flex-1 rounded-lg bg-[#E10600] py-3 font-semibold text-white transition hover:bg-[#C10500] disabled:opacity-50"
                  >
                    {loading ? "A criar conta..." : "Criar conta"}
                  </button>
                </div>
              </form>
            )}

            <p className="mt-4 text-center text-xs text-[#7A7A7A]">
              Ao continuar, aceita os nossos{" "}
              <Link href="/termos" className="text-[#E10600] hover:underline">
                Termos de Serviço
              </Link>{" "}
              e{" "}
              <Link href="/privacidade" className="text-[#E10600] hover:underline">
                Política de Privacidade
              </Link>
              .
            </p>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Simulador de Prestação */}
      {showMortgageSimulator && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 flex items-center justify-center bg-black/80 p-4 overflow-y-auto"
          style={{ zIndex: 99999 }}
          onClick={() => setShowMortgageSimulator(false)}
        >
          <div 
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <MortgageSimulator onClose={() => setShowMortgageSimulator(false)} />
          </div>
        </div>,
        document.body
      )}

      {/* Modal Calculadora IMT */}
      {showTaxCalculator && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 flex items-center justify-center bg-black/80 p-4 overflow-y-auto"
          style={{ zIndex: 99999 }}
          onClick={() => setShowTaxCalculator(false)}
        >
          <div 
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <TaxCalculator onClose={() => setShowTaxCalculator(false)} />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default UserMenuWrapper;
