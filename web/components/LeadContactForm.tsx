"use client";

import { useState, FormEvent } from "react";
import { getApiUrl, getTenantSlugFromCookie } from "@/lib/tenant";

interface LeadContactFormProps {
  propertyId: number;
  propertyReference: string;
  propertyTitle: string | null;
}

type ActionType = "info_request" | "visit_request" | "contact";

export function LeadContactForm({ propertyId, propertyReference, propertyTitle }: LeadContactFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    actionType: "info_request" as ActionType,
    // Honeypot field (hidden from users, bots will fill it)
    website: ""
  });

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Honeypot check - if filled, it's a bot
    if (formData.website) {
      console.log("[LeadContactForm] Honeypot triggered - bot detected");
      setStatus("success"); // Fake success to fool bot
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch(`${getApiUrl()}/leads/from-website`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-Slug": getTenantSlugFromCookie(),
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
          property_id: propertyId,
          action_type: formData.actionType
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Erro ao enviar mensagem");
      }

      const data = await response.json();
      console.log("[LeadContactForm] Lead criada:", data);

      setStatus("success");
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({
          name: "",
          email: "",
          phone: "",
          message: "",
          actionType: "info_request",
          website: ""
        });
        setStatus("idle");
      }, 3000);

    } catch (error) {
      console.error("[LeadContactForm] Erro:", error);
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Erro ao enviar mensagem. Tente novamente.");
    }
  };

  const actionTypeLabels = {
    info_request: "Pedido de Informações",
    visit_request: "Agendar Visita",
    contact: "Contacto Geral"
  };

  if (status === "success") {
    return (
      <div className="rounded-2xl p-6 ring-1" style={{ backgroundColor: "color-mix(in srgb, #22c55e 10%, var(--color-background-secondary))", borderColor: "color-mix(in srgb, #22c55e 30%, transparent)" }}>
        <div className="flex items-start gap-3">
          <svg className="h-6 w-6 flex-shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Mensagem enviada com sucesso!</p>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
              Entraremos em contacto em breve. Obrigado pelo seu interesse!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-6 ring-1"
      style={{
        backgroundColor: "color-mix(in srgb, var(--color-primary) 8%, var(--color-background-secondary))",
        borderColor: "color-mix(in srgb, var(--color-primary) 25%, transparent)",
      }}
    >
      <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>Interessado neste imóvel?</h3>
      <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
        Preencha o formulário e entraremos em contacto consigo.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* Action Type */}
        <div>
          <label htmlFor="actionType" className="block text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
            Tipo de Pedido
          </label>
          <select
            id="actionType"
            value={formData.actionType}
            onChange={(e) => setFormData({ ...formData, actionType: e.target.value as ActionType })}
            className="mt-1 w-full rounded-lg px-4 py-2.5 text-sm ring-1 transition focus:outline-none focus:ring-2"
            style={{
              backgroundColor: "var(--color-background)",
              color: "var(--color-text)",
              borderColor: "var(--color-border)",
              outlineColor: "var(--color-primary)",
            }}
            required
          >
            <option value="info_request">Pedido de Informações</option>
            <option value="visit_request">Agendar Visita</option>
            <option value="contact">Contacto Geral</option>
          </select>
        </div>

        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
            Nome Completo <span style={{ color: "var(--color-primary)" }}>*</span>
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 w-full rounded-lg px-4 py-2.5 text-sm ring-1 transition focus:outline-none focus:ring-2"
            style={{
              backgroundColor: "var(--color-background)",
              color: "var(--color-text)",
              borderColor: "var(--color-border)",
            }}
            placeholder="Digite o seu nome"
            required
            minLength={3}
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
            Email <span style={{ color: "var(--color-primary)" }}>*</span>
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="mt-1 w-full rounded-lg px-4 py-2.5 text-sm ring-1 transition focus:outline-none focus:ring-2"
            style={{
              backgroundColor: "var(--color-background)",
              color: "var(--color-text)",
              borderColor: "var(--color-border)",
            }}
            placeholder="seu@email.com"
            required
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
            Telefone
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="mt-1 w-full rounded-lg px-4 py-2.5 text-sm ring-1 transition focus:outline-none focus:ring-2"
            style={{
              backgroundColor: "var(--color-background)",
              color: "var(--color-text)",
              borderColor: "var(--color-border)",
            }}
            placeholder="912 345 678"
            pattern="[0-9\s\+\-\(\)]+"
          />
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
            Mensagem
          </label>
          <textarea
            id="message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="mt-1 w-full rounded-lg px-4 py-2.5 text-sm ring-1 transition focus:outline-none focus:ring-2"
            style={{
              backgroundColor: "var(--color-background)",
              color: "var(--color-text)",
              borderColor: "var(--color-border)",
            }}
            placeholder={
              formData.actionType === "visit_request"
                ? "Gostaria de agendar uma visita ao imóvel..."
                : "Escreva a sua mensagem..."
            }
            rows={4}
          />
        </div>

        {/* Honeypot field - hidden from users */}
        <input
          type="text"
          name="website"
          value={formData.website}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          className="absolute -left-[9999px] h-0 w-0 opacity-0"
          tabIndex={-1}
          autoComplete="off"
        />

        {/* Error Message */}
        {status === "error" && (
          <div className="rounded-lg bg-red-500/10 p-3 ring-1 ring-red-500/30">
            <p className="text-sm text-red-400">{errorMessage}</p>
          </div>
        )}

        {/* Info Text */}
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          Ref: <span className="font-medium" style={{ color: "var(--color-text)" }}>{propertyReference}</span>
          {propertyTitle && ` - ${propertyTitle}`}
        </p>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={status === "submitting"}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {status === "submitting" ? (
            <>
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Enviando...
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {actionTypeLabels[formData.actionType]}
            </>
          )}
        </button>

        <p className="text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
          Ao enviar, aceita a nossa{" "}
          <a href="/privacidade" className="hover:underline" style={{ color: "var(--color-primary)" }}>
            Política de Privacidade
          </a>
        </p>
      </form>
    </div>
  );
}
