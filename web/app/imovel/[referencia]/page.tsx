import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { getPropertyByReference, getAgentById, Property, Agent } from "../../../src/services/publicApi";
import { PropertyGallery } from "../../../components/PropertyGallery";
import { PropertyMap } from "../../../components/PropertyMap";
import { AgentContactCard } from "../../../components/AgentContactCard";
import { PropertyVideo } from "../../../components/PropertyVideo";
import { FavoriteButton } from "../../../components/FavoriteButton";
import { LeadContactForm } from "../../../components/LeadContactForm";
import { PropertyTools } from "../../../components/PropertyTools";
import { getPropertyGallery, getPropertyCover } from "../../../src/utils/placeholders";
import { getSiteUrl } from "../../../src/lib/siteUrl";

const siteUrl = getSiteUrl();

type Props = { params: { referencia: string } };

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const ref = decodeURIComponent(params.referencia);
  const property = await getPropertyByReference(ref);

  if (!property) {
    return {
      title: "Imóvel não encontrado",
      description: "O imóvel que procura não está disponível.",
    };
  }

  const price = property.price
    ? `${property.price.toLocaleString("pt-PT")} €`
    : "Preço sob consulta";

  const location = property.location ||
    [property.municipality, property.parish].filter(Boolean).join(", ") ||
    "Portugal";

  const title = `${property.property_type || "Imóvel"} ${property.typology || ""} - ${location}`.trim();
  const description = property.description
    ? property.description.substring(0, 155) + "..."
    : `${property.business_type || "Venda"} de ${property.property_type || "imóvel"} ${property.typology || ""} em ${location}. ${price}. ${property.usable_area ? `Área útil: ${property.usable_area}m²` : ""}`.trim();

  const coverImage = getPropertyCover(property);

  return {
    title,
    description,
    keywords: [
      property.property_type || "imóvel",
      property.typology || "",
      property.business_type || "venda",
      property.municipality || "",
      property.parish || "",
      "Portugal",
      "Imóveis Mais",
    ].filter(Boolean),
    openGraph: {
      title,
      description,
      type: "website",
      url: `${siteUrl}/imovel/${encodeURIComponent(ref)}`,
      images: [
        {
          url: coverImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "pt_PT",
      siteName: "Imóveis Mais",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [coverImage],
    },
    alternates: {
      canonical: `${siteUrl}/imovel/${encodeURIComponent(ref)}`,
    },
  };
}

// Get the property's assigned agent by agent_id
async function getPropertyAgent(agentId: number | null | undefined): Promise<Agent | null> {
  if (!agentId) {
    return null;
  }
  try {
    return await getAgentById(agentId);
  } catch {
    return null;
  }
}

export default async function ImovelDetail({ params }: Props) {
  const ref = decodeURIComponent(params.referencia);
  const property = await getPropertyByReference(ref);

  if (!property) {
    notFound();
  }

  const images = getPropertyGallery(property);
  const agent = await getPropertyAgent(property.agent_id);
  
  // Debug: Force agent in development/staging if property has agent_id but agent is null
  if (property.agent_id && !agent) {
    console.error('[ImovelDetail] Property has agent_id but no agent found:', {
      property_id: property.id,
      reference: property.reference,
      agent_id: property.agent_id
    });
  }

  const price = property.price
    ? property.price.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })
    : "Preço sob consulta";

  const fullLocation = property.location ||
    [property.municipality, property.parish].filter(Boolean).join(", ") ||
    "Localização reservada";

  // Structured Data JSON-LD for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": property.business_type?.toLowerCase() === "arrendamento" ? "RentAction" : "Product",
    "name": property.title || `${property.property_type} ${property.typology}`,
    "description": property.description || `${property.business_type} de ${property.property_type} em ${fullLocation}`,
    "image": images.length > 0 ? images : [],
    "offers": {
      "@type": "Offer",
      "price": property.price || 0,
      "priceCurrency": "EUR",
      "availability": property.status?.toUpperCase() === "AVAILABLE" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": property.price || 0,
        "priceCurrency": "EUR"
      }
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": property.municipality,
      "addressRegion": property.parish,
      "addressCountry": "PT"
    },
    "floorSize": {
      "@type": "QuantitativeValue",
      "value": property.usable_area || property.area,
      "unitCode": "MTK"
    },
    "numberOfRooms": property.bedrooms,
    "numberOfBathroomsTotal": property.bathrooms
  };

  // Breadcrumbs Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Início",
        "item": siteUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Imóveis",
        "item": `${siteUrl}/imoveis`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": property.title || property.reference,
        "item": `${siteUrl}/imovel/${property.reference}`
      }
    ]
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="space-y-8 max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }} itemScope itemType="https://schema.org/BreadcrumbList">
          <Link href="/" className="hover:text-white" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            <span itemProp="name">Início</span>
            <meta itemProp="position" content="1" />
          </Link>
          <span>/</span>
          <Link href="/imoveis" className="hover:text-white" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            <span itemProp="name">Imóveis</span>
            <meta itemProp="position" content="2" />
          </Link>
          <span>/</span>
          <span className="text-white" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            <span itemProp="name">{property.title || property.reference}</span>
            <meta itemProp="position" content="3" />
          </span>
        </nav>

      {/* Main Grid - Stack em mobile, side-by-side em desktop */}
      <div className="grid items-start justify-items-center gap-6 lg:gap-8 lg:grid-cols-[1fr_380px] lg:justify-items-start">
        {/* Left Column - Property Details */}
        <div className="space-y-8">
          {/* Gallery */}
          <PropertyGallery images={images} title={property.title} />

          {/* Title and Price */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                {property.reference && (
                  <span className="mb-2 inline-block rounded px-3 py-1 text-sm font-bold uppercase tracking-wider ring-1" style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)', color: 'var(--color-primary)', borderColor: 'color-mix(in srgb, var(--color-primary) 30%, transparent)' }}>
                    {property.reference}
                  </span>
                )}
                {property.status?.toUpperCase() === 'RESERVED' && (
                  <span className="ml-2 inline-block rounded-full bg-yellow-600/90 px-4 py-1.5 text-sm font-bold text-white shadow-lg">
                    ⚠️ RESERVADO
                  </span>
                )}
                {property.status?.toUpperCase() === 'SOLD' && (
                  <span className="ml-2 inline-block rounded-full bg-gray-700/90 px-4 py-1.5 text-sm font-bold text-white shadow-lg">
                    ✓ VENDIDO
                  </span>
                )}
                <p className="text-sm uppercase tracking-[0.2em]" style={{ color: 'var(--color-primary)' }}>
                  {property.business_type || "Venda"}
                </p>
                <h1 className="text-xl font-semibold text-white sm:text-2xl md:text-4xl">
                  {property.property_type || "Imóvel"} {property.typology}
                </h1>
                <p className="mt-2 text-lg" style={{ color: 'var(--color-text-muted)' }}>{fullLocation}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-white sm:text-2xl md:text-3xl">{price}</p>
                {property.usable_area && property.price && (
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    {Math.round(property.price / property.usable_area).toLocaleString("pt-PT")} €/m²
                  </p>
                )}
              </div>
            </div>

            {/* Quick Info Pills */}
            <div className="flex flex-wrap gap-3">
              {property.typology && (
                <span className="rounded-full px-4 py-2 text-sm font-semibold" style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)', color: 'var(--color-primary)' }}>
                  {property.typology}
                </span>
              )}
              {property.usable_area && (
                <span className="rounded-full px-4 py-2 text-sm" style={{ backgroundColor: 'var(--color-background-secondary)', color: 'var(--color-text-muted)' }}>
                  {property.usable_area} m² úteis
                </span>
              )}
              {property.area && property.area !== property.usable_area && (
                <span className="rounded-full px-4 py-2 text-sm" style={{ backgroundColor: 'var(--color-background-secondary)', color: 'var(--color-text-muted)' }}>
                  {property.area} m² brutos
                </span>
              )}
              {property.energy_certificate && (
                <span className="rounded-full px-4 py-2 text-sm" style={{ backgroundColor: 'var(--color-background-secondary)', color: 'var(--color-text-muted)' }}>
                  Cert. Energético: {property.energy_certificate}
                </span>
              )}
              {property.condition && (
                <span className="rounded-full px-4 py-2 text-sm" style={{ backgroundColor: 'var(--color-background-secondary)', color: 'var(--color-text-muted)' }}>
                  {property.condition}
                </span>
              )}
            </div>

            {/* Ferramentas do Cliente */}
            <PropertyTools 
              property={{
                id: property.id,
                referencia: property.reference || `${property.id}`,
                titulo: property.title ?? undefined,
                preco: property.price || 0,
                tipologia: property.typology ?? undefined,
                area_util: property.usable_area ?? undefined,
                area_bruta: property.area ?? undefined,
                quartos: property.bedrooms ?? undefined,
                casas_banho: property.bathrooms ?? undefined,
                localizacao: fullLocation,
                imagem: images[0],
                tipo_negocio: property.business_type ?? undefined,
                tipo_imovel: property.property_type ?? undefined,
                certificado_energetico: property.energy_certificate ?? undefined,
              }}
              price={property.price || 0}
            />
          </div>

          {/* Description */}
          {property.description && (
            <div className="space-y-3 rounded-2xl p-6 ring-1" style={{ backgroundColor: 'var(--color-background-secondary)', borderColor: 'var(--color-border)' }}>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Descrição</h2>
              <p className="whitespace-pre-line" style={{ color: 'var(--color-text-muted)' }}>{property.description}</p>
            </div>
          )}

          {/* Observations */}
          {property.observations && (
            <div className="space-y-3 rounded-2xl p-6 ring-1" style={{ backgroundColor: 'var(--color-background-secondary)', borderColor: 'var(--color-border)' }}>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Observações</h2>
              <p className="whitespace-pre-line" style={{ color: 'var(--color-text-muted)' }}>{property.observations}</p>
            </div>
          )}

          {/* Details Table */}
          <div className="rounded-2xl p-6 ring-1" style={{ backgroundColor: 'var(--color-background-secondary)', borderColor: 'var(--color-border)' }}>
            <h2 className="mb-4 text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Detalhes do Imóvel</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailRow label="Referência" value={property.reference || property.title} />
              <DetailRow label="Tipo de Imóvel" value={property.property_type} />
              <DetailRow label="Tipologia" value={property.typology} />
              <DetailRow label="Negócio" value={property.business_type} />
              <DetailRow label="Área Útil" value={property.usable_area ? `${property.usable_area} m²` : null} />
              <DetailRow label="Área Bruta" value={property.area ? `${property.area} m²` : null} />
              <DetailRow label="Quartos" value={property.bedrooms !== null && property.bedrooms !== undefined ? String(property.bedrooms) : null} />
              <DetailRow label="Casas de Banho" value={property.bathrooms !== null && property.bathrooms !== undefined ? String(property.bathrooms) : null} />
              <DetailRow label="Lugares de Garagem" value={property.parking_spaces !== null && property.parking_spaces !== undefined ? String(property.parking_spaces) : null} />
              <DetailRow label="Estado" value={property.condition} />
              <DetailRow label="Cert. Energético" value={property.energy_certificate} />
              <DetailRow label="Concelho" value={property.municipality} />
              <DetailRow label="Freguesia" value={property.parish} />
              <DetailRow label="Status" value={property.status} />
            </div>
          </div>

          {/* Map Section */}
          <div className="rounded-2xl p-6 ring-1" style={{ backgroundColor: 'var(--color-background-secondary)', borderColor: 'var(--color-border)' }}>
            <PropertyMap
              location={property.location || ""}
              municipality={property.municipality}
              parish={property.parish}
            />
          </div>
        </div>

        {/* Right Column - Agent & Actions */}
        <div className="space-y-6">
          {/* Sticky Container */}
          <div className="lg:sticky lg:top-24">
            {/* Agent Card */}
            <AgentContactCard agent={agent} propertyTitle={property.title} />

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <FavoriteButton propertyId={property.id} propertyTitle={property.title} />
              
              {/* ✅ Video do imóvel (se disponível) */}
              <PropertyVideo
                videoUrl={property.video_url}
                propertyTitle={property.title}
              />

              <button className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ring-1 transition" style={{ backgroundColor: 'color-mix(in srgb, var(--color-background) 70%, transparent)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Partilhar imóvel
              </button>

              <button className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ring-1 transition" style={{ backgroundColor: 'color-mix(in srgb, var(--color-background) 70%, transparent)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Imprimir ficha
              </button>
            </div>

            {/* Lead Contact Form */}
            <div className="mt-6">
              <LeadContactForm 
                propertyId={property.id}
                propertyReference={property.reference || `ID-${property.id}`}
                propertyTitle={property.title}
              />
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--color-border)' }}>
      <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{value}</span>
    </div>
  );
}
