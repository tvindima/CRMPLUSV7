import { NextRequest, NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://crmplusv7-production.up.railway.app';
const PLATFORM_API = process.env.PLATFORM_API_URL || 'https://crmplusv7-production.up.railway.app';

export async function GET(request: NextRequest) {
  try {
    // 1. Tentar obter slug do cookie (definido pelo middleware)
    const cookieStore = cookies();
    let tenantSlug = cookieStore.get('tenant_slug')?.value || '';
    
    // 2. Fallback: header x-tenant-slug
    if (!tenantSlug) {
      const headersList = headers();
      tenantSlug = headersList.get('x-tenant-slug') || '';
    }
    
    // 3. Fallback: variável de ambiente (para deploys dedicados)
    if (!tenantSlug) {
      tenantSlug = process.env.TENANT_SLUG || '';
    }
    
    // 4. Fallback: extrair do hostname
    if (!tenantSlug) {
      const headersList = headers();
      const host = headersList.get('host') || '';
      const hostParts = host.split('.');
      
      // xxx.backoffice.crmplus.trioto.tech → xxx
      if (hostParts.length >= 4 && hostParts[1] === 'backoffice') {
        tenantSlug = hostParts[0];
      }
    }

    if (!tenantSlug) {
      // Sem tenant identificado - retornar config default
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

    // Buscar tenant da API de plataforma pelo slug
    const response = await fetch(`${PLATFORM_API}/platform/tenants/by-slug/${tenantSlug}`, {
      cache: 'no-store',
    });

    if (response.ok) {
      const tenant = await response.json();
      return NextResponse.json({
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        sector: tenant.sector || 'real_estate',
        plan: tenant.plan || 'basic',
        primary_color: tenant.primary_color || '#E10600',
        secondary_color: tenant.secondary_color || '#C5C5C5',
        logo_url: tenant.logo_url,
        features: tenant.features || [],
        max_agents: tenant.max_agents || 10,
        max_properties: tenant.max_properties || 100,
        is_trial: tenant.is_trial,
        trial_ends_at: tenant.trial_ends_at,
        schema_name: tenant.schema_name,
      });
    }

    // Tenant não encontrado
    return NextResponse.json({
      id: 0,
      slug: tenantSlug,
      name: 'Tenant não encontrado',
      sector: 'real_estate',
      plan: 'basic',
      primary_color: '#E10600',
      secondary_color: '#C5C5C5',
      logo_url: null,
      features: [],
      max_agents: 0,
      max_properties: 0,
      error: 'Tenant not found',
    }, { status: 404 });
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
