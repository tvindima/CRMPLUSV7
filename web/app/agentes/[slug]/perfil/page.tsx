import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getAgents } from "../../../../src/services/publicApi";
import { optimizeAvatarUrl } from "../../../../src/lib/cloudinary";

type Props = { params: { slug: string } };

// Normalize name for URL slug
function normalizeSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
}

export async function generateStaticParams() {
  try {
    const agents = await getAgents(50);
    return agents.map((agent) => ({
      slug: normalizeSlug(agent.name),
    }));
  } catch (error) {
    return [];
  }
}

export const revalidate = 3600;

export default async function AgentProfilePage({ params }: Props) {
  const agents = await getAgents(50);
  const normalizedSlug = normalizeSlug(decodeURIComponent(params.slug));
  const agent = agents.find((a) => normalizeSlug(a.name) === normalizedSlug);

  if (!agent) notFound();

  const avatarUrl = optimizeAvatarUrl(agent.photo) || agent.avatar || `/avatars/${normalizeSlug(agent.name)}.png`;

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Header */}
      <div 
        className="border-b"
        style={{ 
          borderColor: 'color-mix(in srgb, var(--color-border) 50%, transparent)',
          background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--color-primary) 10%, transparent), var(--color-background), var(--color-background))'
        }}
      >
        <div className="mx-auto max-w-4xl px-6 py-6">
          <Link
            href={`/agentes/${params.slug}`}
            className="inline-flex items-center gap-2 text-sm transition hover:text-white"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar aos imóveis de {agent.name.split(' ')[0]}
          </Link>
        </div>
      </div>

      {/* Profile Content */}
      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* Avatar e Info Principal */}
        <div className="flex flex-col items-center text-center">
          <div 
            className="relative h-40 w-40 overflow-hidden rounded-full border-4 md:h-52 md:w-52"
            style={{ borderColor: 'color-mix(in srgb, var(--color-primary) 30%, transparent)' }}
          >
            <Image
              src={avatarUrl}
              alt={agent.name}
              fill
              className="object-cover"
              sizes="208px"
              priority
            />
          </div>
          
          <h1 className="mt-6 text-3xl font-bold md:text-4xl">{agent.name}</h1>
          
          {agent.license_ami && (
            <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Licença AMI: <span className="font-semibold" style={{ color: 'var(--color-text-muted)' }}>{agent.license_ami}</span>
            </p>
          )}

          {/* Contactos */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm">
            {agent.phone && (
              <a
                href={`tel:${agent.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-2 transition"
                style={{ color: 'var(--color-text-muted)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {agent.phone}
              </a>
            )}
            <a
              href={`mailto:${agent.email}`}
              className="flex items-center gap-2 transition"
              style={{ color: 'var(--color-text-muted)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {agent.email}
            </a>
          </div>

          {/* Redes Sociais */}
          <div className="mt-6 flex items-center justify-center gap-4">
            {agent.whatsapp && (
              <a
                href={`https://wa.me/${agent.whatsapp.replace(/\D/g, '')}?text=Olá ${agent.name.split(' ')[0]}, vi o seu perfil no site Imóveis Mais e gostaria de mais informações.`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white transition hover:scale-110"
                title="WhatsApp"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            )}
            {agent.instagram && (
              <a
                href={agent.instagram.startsWith('http') ? agent.instagram : `https://instagram.com/${agent.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888] text-white transition hover:scale-110"
                title="Instagram"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            )}
            {agent.facebook && (
              <a
                href={agent.facebook.startsWith('http') ? agent.facebook : `https://facebook.com/${agent.facebook}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1877F2] text-white transition hover:scale-110"
                title="Facebook"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            )}
            {agent.linkedin && (
              <a
                href={agent.linkedin.startsWith('http') ? agent.linkedin : `https://linkedin.com/in/${agent.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0A66C2] text-white transition hover:scale-110"
                title="LinkedIn"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            )}
            {agent.twitter && (
              <a
                href={agent.twitter.startsWith('http') ? agent.twitter : `https://x.com/${agent.twitter.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white transition hover:scale-110"
                title="X (Twitter)"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            )}
            {agent.tiktok && (
              <a
                href={agent.tiktok.startsWith('http') ? agent.tiktok : `https://tiktok.com/@${agent.tiktok.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white transition hover:scale-110"
                title="TikTok"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            )}
          </div>
        </div>

        {/* Biografia */}
        {agent.bio && (
          <section className="mt-12">
            <div 
              className="rounded-2xl border p-6 md:p-8"
              style={{ 
                borderColor: 'var(--color-border)',
                background: 'linear-gradient(to bottom right, var(--color-background-secondary), var(--color-background))'
              }}
            >
              <h2 className="mb-4 text-xl font-semibold text-white">Sobre {agent.name.split(' ')[0]}</h2>
              <p className="whitespace-pre-line leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{agent.bio}</p>
            </div>
          </section>
        )}

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          {agent.whatsapp ? (
            <a
              href={`https://wa.me/${agent.whatsapp.replace(/\D/g, '')}?text=Olá ${agent.name.split(' ')[0]}, vi o seu perfil no site Imóveis Mais e gostaria de mais informações.`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#20BD5A] sm:w-auto"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Contactar via WhatsApp
            </a>
          ) : (
            <a
              href={`mailto:${agent.email}?subject=Contacto via Imóveis Mais`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition sm:w-auto"
              style={{ backgroundColor: 'var(--color-primary)' }}
              onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(0.85)'}
              onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Enviar Email
            </a>
          )}
          <Link href={`/agentes/${params.slug}`} legacyBehavior>
            <a
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border px-6 py-3 text-sm font-semibold transition sm:w-auto"
              style={{ 
                borderColor: 'var(--color-primary)',
                color: 'var(--color-primary)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-primary) 10%, transparent)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Ver Imóveis
            </a>            </a>          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer 
        className="border-t px-6 py-8 text-sm"
        style={{ 
          borderColor: 'color-mix(in srgb, var(--color-border) 50%, transparent)',
          backgroundColor: 'var(--color-background)',
          color: 'var(--color-text-muted)'
        }}
      >
        <div className="mx-auto flex max-w-4xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-white">Perfil de {agent.name}</p>
            <p>Imóveis Mais • Powered by CRM PLUS</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <Link href="/privacidade" className="hover:text-white">Privacidade</Link>
            <Link href="/contactos" className="hover:text-white">Contactos</Link>
            <Link href="/imoveis" className="hover:text-white">Ver todos os imóveis</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
