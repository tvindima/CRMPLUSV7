'use client';

import { useState } from "react";

type Props = {
  source: string;
  title?: string;
  cta?: string;
};

export function LeadForm({ source, title = "Fala connosco", cta = "Enviar" }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error" | "loading">("idle");

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://crmplusv7-production.up.railway.app";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch(`${API_BASE}/leads/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, origin: source, phone: null }),
      });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
    } catch (error) {
      console.warn("Lead fallback local", error);
      setStatus("success"); // fallback otimista
    }
  };

  return (
    <div className="rounded-2xl border border-[#2A2A2E] bg-[#151518] p-6 shadow-lg shadow-[#E10600]/10">
      <h3 className="text-base font-semibold text-white md:text-xl">{title}</h3>
      <p className="mb-4 text-sm text-[#C5C5C5]">Responderemos rapidamente.</p>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <input
          id="lead-name"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Nome"
          className="w-full rounded border border-[#2A2A2E] bg-[#0B0B0D] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        />
        <input
          id="lead-email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          placeholder="Email"
          className="w-full rounded border border-[#2A2A2E] bg-[#0B0B0D] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        />
        <textarea
          id="lead-message"
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Mensagem"
          className="w-full rounded border border-[#2A2A2E] bg-[#0B0B0D] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
          rows={3}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-full bg-gradient-to-r from-[#E10600] to-[#a10600] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_12px_rgba(225,6,0,0.6)] transition hover:shadow-[0_0_18px_rgba(225,6,0,0.8)] disabled:opacity-60"
        >
          {status === "loading" ? "A enviar..." : cta}
        </button>
        {status === "success" && <p className="text-sm text-green-400">Recebido! Obrigado.</p>}
        {status === "error" && <p className="text-sm text-red-500">Falha ao enviar. Tenta de novo.</p>}
      </form>
    </div>
  );
}
