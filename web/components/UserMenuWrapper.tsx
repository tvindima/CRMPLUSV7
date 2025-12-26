"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

interface UserData {
  email: string;
  name: string;
}

export function UserMenuWrapper() {
  const [user, setUser] = useState<UserData | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    const handleStorageChange = () => {
      const userData = localStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
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
    localStorage.removeItem("user");
    setUser(null);
    setShowDropdown(false);
    window.dispatchEvent(new Event("authChange"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (mode === "register") {
        const newUser = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem("user", JSON.stringify(newUser));
        setUser({ name: newUser.name, email: newUser.email });
      } else {
        const savedUser = localStorage.getItem("user");
        if (!savedUser) {
          throw new Error("Utilizador não encontrado. Registe-se primeiro.");
        }
        const parsed = JSON.parse(savedUser);
        setUser({ name: parsed.name, email: parsed.email });
      }

      setShowAuthModal(false);
      setFormData({ name: "", email: "", password: "", phone: "" });
      window.dispatchEvent(new Event("authChange"));
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro");
    } finally {
      setLoading(false);
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
            className="w-full max-w-md rounded-2xl bg-[#151518] p-6 shadow-xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                {mode === "login" ? "Entrar na conta" : "Criar conta"}
              </h2>
              <button onClick={() => setShowAuthModal(false)} className="text-[#C5C5C5] hover:text-white">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6 flex rounded-lg bg-[#0B0B0D] p-1">
              <button
                onClick={() => setMode("login")}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition ${
                  mode === "login" ? "bg-[#E10600] text-white" : "text-[#C5C5C5]"
                }`}
              >
                Entrar
              </button>
              <button
                onClick={() => setMode("register")}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition ${
                  mode === "register" ? "bg-[#E10600] text-white" : "text-[#C5C5C5]"
                }`}
              >
                Registar
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-500">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="mb-1 block text-sm text-[#C5C5C5]">Nome</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-[#2A2A2E] bg-[#0B0B0D] px-3 py-2 text-white outline-none focus:border-[#E10600]"
                  />
                </div>
              )}

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

              {mode === "register" && (
                <div>
                  <label className="mb-1 block text-sm text-[#C5C5C5]">Telefone (opcional)</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg border border-[#2A2A2E] bg-[#0B0B0D] px-3 py-2 text-white outline-none focus:border-[#E10600]"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#E10600] py-3 font-semibold text-white transition hover:bg-[#C10500] disabled:opacity-50"
              >
                {loading ? "A processar..." : mode === "login" ? "Entrar" : "Criar conta"}
              </button>
            </form>

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
    </>
  );
}

export default UserMenuWrapper;
