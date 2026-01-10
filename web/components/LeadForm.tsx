'use client';

import { useState } from "react";
import { getApiUrl, getTenantSlugFromCookie } from "@/lib/tenant";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch(`${getApiUrl()}/leads/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Tenant-Slug": getTenantSlugFromCookie(),
        },
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
    <div 
      className="rounded-2xl border p-6 shadow-lg"
      style={{
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-background-secondary)',
        boxShadow: '0 10px 15px -3px color-mix(in srgb, var(--color-primary) 10%, transparent)'
      }}
    >
      <h3 className="text-base font-semibold md:text-xl" style={{ color: 'var(--color-text)' }}>{title}</h3>
      <p className="mb-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>Responderemos rapidamente.</p>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <input
          id="lead-name"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Nome"
          className="w-full rounded px-3 py-2 text-sm outline-none"
          style={{
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-background)',
            color: 'var(--color-text)'
          }}
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
          className="w-full rounded px-3 py-2 text-sm outline-none"
          style={{
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-background)',
            color: 'var(--color-text)'
          }}
        />
        <textarea
          id="lead-message"
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Mensagem"
          className="w-full rounded px-3 py-2 text-sm outline-none"
          style={{
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-background)',
            color: 'var(--color-text)'
          }}
          rows={3}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-full px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60"
          style={{
            background: `linear-gradient(to right, var(--color-primary), color-mix(in srgb, var(--color-primary) 80%, black))`,
            boxShadow: '0 0 12px color-mix(in srgb, var(--color-primary) 60%, transparent)'
          }}
        >
          {status === "loading" ? "A enviar..." : cta}
        </button>
        {status === "success" && <p className="text-sm text-green-400">Recebido! Obrigado.</p>}
        {status === "error" && <p className="text-sm text-red-500">Falha ao enviar. Tenta de novo.</p>}
      </form>
    </div>
  );
}
