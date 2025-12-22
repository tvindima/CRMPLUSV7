'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// Função para normalizar nome (remover acentos e caracteres especiais)
function normalizeForFilename(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/\s+/g, "-"); // Espaços por hífens
}

type Agent = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  team?: string | null;
};

type Props = {
  agent: Agent | null;
  propertyTitle: string;
};

export function AgentContactCard({ agent, propertyTitle }: Props) {
  const [showContactForm, setShowContactForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    
    // Simulate sending
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setSending(false);
    setSent(true);
    setTimeout(() => {
      setShowContactForm(false);
      setSent(false);
      setFormData({ name: '', email: '', phone: '', message: '' });
    }, 2000);
  };

  if (!agent) {
    return (
      <div className="rounded-2xl bg-[#151518] p-6 ring-1 ring-[#1F1F22]">
        <h3 className="mb-2 text-sm font-semibold text-white">Consultor Responsável</h3>
        <p className="text-sm text-[#C5C5C5]">
          Informação temporariamente indisponível.
        </p>
        <Link
          href="/contactos"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#E10600] hover:underline"
        >
          Contactar agência
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl bg-[#151518] p-6 ring-1 ring-[#1F1F22]">
      <Link href={`/agentes/${normalizeForFilename(agent.name)}`} className="flex items-center gap-4 transition hover:opacity-80">
        <div className="relative h-16 w-16 overflow-hidden rounded-full bg-[#0B0B0D]">
          <Image 
            src={agent.avatar || `/avatars/${normalizeForFilename(agent.name)}.png`} 
            alt={agent.name} 
            fill 
            className="object-cover" 
          />
        </div>
        <div className="flex-1">
          <p className="text-lg font-semibold text-white hover:text-[#E10600]">{agent.name}</p>
          <p className="text-sm text-[#C5C5C5]">Consultor Imobiliário</p>
          {agent.team && <p className="text-xs text-[#E10600]">Equipa {agent.team}</p>}
        </div>
      </Link>

      <div className="space-y-2 text-sm">
        {agent.email && (
          <a
            href={`mailto:${agent.email}?subject=Interesse no imóvel: ${propertyTitle}`}
            className="flex items-center gap-2 text-[#C5C5C5] hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {agent.email}
          </a>
        )}
        {agent.phone && (
          <a
            href={`tel:${agent.phone}`}
            className="flex items-center gap-2 text-[#C5C5C5] hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {agent.phone}
          </a>
        )}
      </div>

      <div className="grid gap-2">
        {agent.phone && (
          <a
            href={`tel:${agent.phone}`}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#E10600] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#c10500]"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Ligar agora
          </a>
        )}
        
        {agent.phone && (
          <a
            href={`https://wa.me/${agent.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Tenho interesse no imóvel: ${propertyTitle}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#20bd5a]"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </a>
        )}

        <button
          onClick={() => setShowContactForm(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#0B0B0D] px-4 py-3 text-sm font-semibold text-white ring-1 ring-[#2A2A2E] transition hover:ring-[#E10600]"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Enviar mensagem
        </button>
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setShowContactForm(false)}>
          <div
            className="w-full max-w-md rounded-2xl bg-[#151518] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Contactar {agent.name}</h3>
              <button onClick={() => setShowContactForm(false)} className="text-[#C5C5C5] hover:text-white">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {sent ? (
              <div className="py-8 text-center">
                <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="mt-4 text-white">Mensagem enviada com sucesso!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="contact-name" className="mb-1 block text-sm text-[#C5C5C5]">Nome</label>
                  <input
                    type="text"
                    id="contact-name"
                    name="name"
                    autoComplete="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-[#2A2A2E] bg-[#0B0B0D] px-3 py-2 text-white outline-none focus:border-[#E10600]"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="mb-1 block text-sm text-[#C5C5C5]">Email</label>
                  <input
                    type="email"
                    id="contact-email"
                    name="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-[#2A2A2E] bg-[#0B0B0D] px-3 py-2 text-white outline-none focus:border-[#E10600]"
                  />
                </div>
                <div>
                  <label htmlFor="contact-phone" className="mb-1 block text-sm text-[#C5C5C5]">Telefone</label>
                  <input
                    type="tel"
                    id="contact-phone"
                    name="phone"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg border border-[#2A2A2E] bg-[#0B0B0D] px-3 py-2 text-white outline-none focus:border-[#E10600]"
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="mb-1 block text-sm text-[#C5C5C5]">Mensagem</label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={`Tenho interesse no imóvel: ${propertyTitle}`}
                    className="w-full rounded-lg border border-[#2A2A2E] bg-[#0B0B0D] px-3 py-2 text-white outline-none focus:border-[#E10600]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full rounded-lg bg-[#E10600] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#c10500] disabled:opacity-50"
                >
                  {sending ? 'A enviar...' : 'Enviar mensagem'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
