import { NextRequest, NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://crmplusv7-production.up.railway.app';

export async function GET(request: NextRequest) {
  try {
    // Obter tenant slug do header ou hostname
    const headersList = headers();
    const host = headersList.get('host') || '';
    
    // Extrair slug do subdomínio ou usar header X-Tenant-Slug
    let tenantSlug = headersList.get('x-tenant-slug') || '';
    
    if (!tenantSlug) {
      // Tentar extrair do hostname (ex: luisgaspar.crmplusv7.com -> luisgaspar)
      const hostParts = host.split('.');
      if (hostParts.length >= 3) {
        tenantSlug = hostParts[0];
      }
    }

    // Fazer request ao backend para obter config do tenant
    const response = await fetch(`${API_BASE}/api/v1/tenant/config`, {
      headers: {
        'X-Tenant-Slug': tenantSlug,
        'Host': host,
      },
      cache: 'no-store',
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    // Se não conseguir obter do backend, retornar config default
    return NextResponse.json({
      id: 0,
      slug: tenantSlug || 'default',
      name: 'CRM Plus',
      sector: 'real_estate',
      plan: 'basic',
      primary_color: '#E10600',
      secondary_color: '#C5C5C5',
      logo_url: null,
      features: [],
      max_agents: 10,
      max_properties: 100,
    });
  } catch (error) {
    console.error('Error fetching tenant config:', error);
    
    // Retornar config default em caso de erro
    return NextResponse.json({
      id: 0,
      slug: 'default',
      name: 'CRM Plus',
      sector: 'real_estate',
      plan: 'basic',
      primary_color: '#E10600',
      secondary_color: '#C5C5C5',
      logo_url: null,
      features: [],
      max_agents: 10,
      max_properties: 100,
    });
  }
}
