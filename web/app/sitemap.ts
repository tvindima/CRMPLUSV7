import { MetadataRoute } from 'next';
import { getProperties } from '../src/services/publicApi';
import { getSiteUrl } from '../src/lib/siteUrl';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  
  // Páginas estáticas
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/imoveis`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/imoveis/venda`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/imoveis/arrendamento`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/agentes`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contactos`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/avaliacao-imovel`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/quero-comprar-casa`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/quero-vender-casa`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/investimento-imobiliario`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Páginas dinâmicas de propriedades
  let propertyPages: MetadataRoute.Sitemap = [];
  
  try {
    const properties = await getProperties(500);
    
    // Apenas propriedades AVAILABLE (não reservadas/vendidas)
    const availableProperties = properties.filter(
      p => p.status?.toUpperCase() === 'AVAILABLE'
    );
    
    propertyPages = availableProperties.map(property => ({
      url: `${baseUrl}/imovel/${encodeURIComponent(property.reference || property.title || '')}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error('[sitemap] Error fetching properties:', error);
  }

  return [...staticPages, ...propertyPages];
}
