import { NextRequest, NextResponse } from "next/server";

interface ExtractedData {
  titulo?: string;
  preco?: number;
  tipologia?: string;
  area_util?: number;
  quartos?: number;
  casas_banho?: number;
  localizacao?: string;
  tipo_negocio?: string;
  tipo_imovel?: string;
  fonte?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL é obrigatório" }, { status: 400 });
    }

    // Validar URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "URL inválido" }, { status: 400 });
    }

    let html: string | null = null;
    
    // Lista de proxies para tentar
    const proxyAttempts = [
      // Tentativa 1: Direto com headers completos
      async () => {
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "pt-PT,pt;q=0.9,en;q=0.8",
            "Cache-Control": "no-cache",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "cross-site",
          },
          redirect: "follow",
        });
        if (response.ok) return await response.text();
        return null;
      },
      // Tentativa 2: Via proxy corsproxy.io
      async () => {
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl, {
          headers: { "Accept": "text/html" },
        });
        if (response.ok) return await response.text();
        return null;
      },
      // Tentativa 3: Via proxy api.codetabs.com
      async () => {
        const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        if (response.ok) return await response.text();
        return null;
      },
      // Tentativa 4: Via thingproxy
      async () => {
        const proxyUrl = `https://thingproxy.freeboard.io/fetch/${url}`;
        const response = await fetch(proxyUrl);
        if (response.ok) return await response.text();
        return null;
      },
    ];

    // Tentar cada proxy até um funcionar
    for (const attempt of proxyAttempts) {
      try {
        html = await attempt();
        if (html && html.length > 1000) break;
      } catch (e) {
        continue;
      }
    }

    // Se nenhum proxy funcionou
    if (!html || html.length < 1000) {
      return NextResponse.json({
        success: false,
        error: "Este site tem proteção anti-scraping. Por favor, preencha os dados manualmente.",
        showForm: true,
      });
    }

    const urlLower = url.toLowerCase();

    let data: ExtractedData;

    // Extrair dados baseado no portal
    if (urlLower.includes("idealista.pt") || urlLower.includes("idealista.com")) {
      data = extractFromIdealista(html, url);
    } else if (urlLower.includes("imovirtual.com")) {
      data = extractFromImovirtual(html, url);
    } else if (urlLower.includes("casasapo.pt") || urlLower.includes("casa.sapo.pt")) {
      data = extractFromCasaSapo(html, url);
    } else if (urlLower.includes("supercasa.pt")) {
      data = extractFromSupercasa(html, url);
    } else if (urlLower.includes("remax.pt")) {
      data = extractFromRemax(html, url);
    } else if (urlLower.includes("era.pt")) {
      data = extractFromEra(html, url);
    } else if (urlLower.includes("century21.pt")) {
      data = extractFromCentury21(html, url);
    } else if (urlLower.includes("kwportugal.pt") || urlLower.includes("kw.com")) {
      data = extractFromKW(html, url);
    } else {
      data = extractGeneric(html, url);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Erro ao fazer scraping:", error);
    return NextResponse.json(
      { error: "Erro ao analisar o link. Tente novamente." },
      { status: 500 }
    );
  }
}

// Extração do Idealista
function extractFromIdealista(html: string, url: string): ExtractedData {
  const data: ExtractedData = { fonte: "Idealista" };

  // Título - várias tentativas
  const titlePatterns = [
    /<h1[^>]*class="[^"]*main-info__title[^"]*"[^>]*>([^<]+)/i,
    /<span[^>]*class="[^"]*main-info__title-main[^"]*"[^>]*>([^<]+)/i,
    /<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i,
    /<title>([^<]+)/i,
  ];
  for (const pattern of titlePatterns) {
    const match = html.match(pattern);
    if (match) {
      data.titulo = match[1].trim().replace(/ - Idealista.*$/i, "").replace(/&quot;/g, '"');
      break;
    }
  }

  // Preço - várias formas
  const pricePatterns = [
    /<span[^>]*class="[^"]*info-data-price[^"]*"[^>]*>([^<]+)/i,
    /(\d{1,3}(?:[.,]\d{3})*)\s*€/,
    /"price"\s*:\s*"?(\d+)/i,
  ];
  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match) {
      const priceStr = match[1].replace(/[.,\s]/g, "").replace(/€/g, "");
      const price = parseInt(priceStr);
      if (price > 0) {
        data.preco = price;
        break;
      }
    }
  }

  // Tipologia
  const typoMatch = html.match(/\b(T\d+)\b/i);
  if (typoMatch) data.tipologia = typoMatch[1].toUpperCase();

  // Área
  const areaPatterns = [
    /(\d+)\s*m²/,
    /(\d+)\s*m&sup2;/i,
    /"size"\s*:\s*"?(\d+)/i,
  ];
  for (const pattern of areaPatterns) {
    const match = html.match(pattern);
    if (match) {
      data.area_util = parseInt(match[1]);
      break;
    }
  }

  // Quartos
  const roomsPatterns = [
    /(\d+)\s*quarto/i,
    /(\d+)\s*habitac/i,
    /"numberOfRooms"\s*:\s*"?(\d+)/i,
  ];
  for (const pattern of roomsPatterns) {
    const match = html.match(pattern);
    if (match) {
      data.quartos = parseInt(match[1]);
      break;
    }
  }

  // WCs
  const bathPatterns = [
    /(\d+)\s*(?:casa[s]?\s*de\s*banho|wc|bathroom)/i,
    /"numberOfBathroomsTotal"\s*:\s*"?(\d+)/i,
  ];
  for (const pattern of bathPatterns) {
    const match = html.match(pattern);
    if (match) {
      data.casas_banho = parseInt(match[1]);
      break;
    }
  }

  // Localização
  const locPatterns = [
    /<span[^>]*class="[^"]*main-info__title-minor[^"]*"[^>]*>([^<]+)/i,
    /<meta[^>]*property="og:locality"[^>]*content="([^"]+)"/i,
    /"addressLocality"\s*:\s*"([^"]+)"/i,
  ];
  for (const pattern of locPatterns) {
    const match = html.match(pattern);
    if (match) {
      data.localizacao = match[1].trim();
      break;
    }
  }

  // Tipo de negócio
  if (url.includes("/arrendar/") || url.includes("/alugar/") || html.toLowerCase().includes("arrendamento")) {
    data.tipo_negocio = "Arrendamento";
  } else {
    data.tipo_negocio = "Venda";
  }

  // Tipo de imóvel
  if (html.match(/moradia|vivenda|casa\s+(?:de|para)/i)) data.tipo_imovel = "Moradia";
  else if (html.match(/apartamento|andar|flat/i)) data.tipo_imovel = "Apartamento";
  else if (html.match(/terreno|lote/i)) data.tipo_imovel = "Terreno";
  else if (html.match(/loja|comercial/i)) data.tipo_imovel = "Loja";
  else if (html.match(/escritório|office/i)) data.tipo_imovel = "Escritório";
  else if (html.match(/armazém|warehouse/i)) data.tipo_imovel = "Armazém";
  else if (html.match(/quinta|herdade/i)) data.tipo_imovel = "Quinta";

  return data;
}

// Extração do Imovirtual
function extractFromImovirtual(html: string, url: string): ExtractedData {
  const data: ExtractedData = { fonte: "Imovirtual" };

  const titleMatch = html.match(/<h1[^>]*>([^<]+)/i) || html.match(/<title>([^<]+)/i);
  if (titleMatch) data.titulo = titleMatch[1].trim().replace(/ \| Imovirtual.*$/i, "");

  const priceMatch = html.match(/(\d{1,3}(?:\s?\d{3})*)\s*€/) || html.match(/"price"\s*:\s*"?(\d+)/i);
  if (priceMatch) data.preco = parseInt(priceMatch[1].replace(/\s/g, ""));

  const typoMatch = html.match(/\b(T\d+)\b/i);
  if (typoMatch) data.tipologia = typoMatch[1].toUpperCase();

  const areaMatch = html.match(/(\d+)\s*m²/);
  if (areaMatch) data.area_util = parseInt(areaMatch[1]);

  const roomsMatch = html.match(/(\d+)\s*quarto/i);
  if (roomsMatch) data.quartos = parseInt(roomsMatch[1]);

  const bathMatch = html.match(/(\d+)\s*(?:casa[s]?\s*de\s*banho|wc)/i);
  if (bathMatch) data.casas_banho = parseInt(bathMatch[1]);

  data.tipo_negocio = url.includes("/arrendar") ? "Arrendamento" : "Venda";

  return data;
}

// Extração do Casa Sapo
function extractFromCasaSapo(html: string, url: string): ExtractedData {
  const data: ExtractedData = { fonte: "Casa Sapo" };

  const titleMatch = html.match(/<h1[^>]*>([^<]+)/i) || html.match(/<title>([^<]+)/i);
  if (titleMatch) data.titulo = titleMatch[1].trim();

  const priceMatch = html.match(/(\d{1,3}(?:[.,]\d{3})*)\s*€/);
  if (priceMatch) data.preco = parseInt(priceMatch[1].replace(/[.,]/g, ""));

  const typoMatch = html.match(/\b(T\d+)\b/i);
  if (typoMatch) data.tipologia = typoMatch[1].toUpperCase();

  const areaMatch = html.match(/(\d+)\s*m²/);
  if (areaMatch) data.area_util = parseInt(areaMatch[1]);

  const roomsMatch = html.match(/(\d+)\s*quarto/i);
  if (roomsMatch) data.quartos = parseInt(roomsMatch[1]);

  data.tipo_negocio = url.includes("/alugar") || url.includes("/arrendar") ? "Arrendamento" : "Venda";

  return data;
}

// Extração do Supercasa
function extractFromSupercasa(html: string, url: string): ExtractedData {
  const data: ExtractedData = { fonte: "Supercasa" };

  const titleMatch = html.match(/<h1[^>]*>([^<]+)/i) || html.match(/<title>([^<]+)/i);
  if (titleMatch) data.titulo = titleMatch[1].trim();

  const priceMatch = html.match(/(\d{1,3}(?:[.,]\d{3})*)\s*€/);
  if (priceMatch) data.preco = parseInt(priceMatch[1].replace(/[.,]/g, ""));

  const typoMatch = html.match(/\b(T\d+)\b/i);
  if (typoMatch) data.tipologia = typoMatch[1].toUpperCase();

  const areaMatch = html.match(/(\d+)\s*m²/);
  if (areaMatch) data.area_util = parseInt(areaMatch[1]);

  const roomsMatch = html.match(/(\d+)\s*quarto/i);
  if (roomsMatch) data.quartos = parseInt(roomsMatch[1]);

  data.tipo_negocio = url.includes("/arrendar") ? "Arrendamento" : "Venda";

  return data;
}

// Extração do Remax
function extractFromRemax(html: string, url: string): ExtractedData {
  const data: ExtractedData = { fonte: "RE/MAX" };

  const titleMatch = html.match(/<h1[^>]*>([^<]+)/i) || html.match(/<title>([^<]+)/i);
  if (titleMatch) data.titulo = titleMatch[1].trim();

  const priceMatch = html.match(/(\d{1,3}(?:[.,]\d{3})*)\s*€/);
  if (priceMatch) data.preco = parseInt(priceMatch[1].replace(/[.,]/g, ""));

  const typoMatch = html.match(/\b(T\d+)\b/i);
  if (typoMatch) data.tipologia = typoMatch[1].toUpperCase();

  const areaMatch = html.match(/(\d+)\s*m²/);
  if (areaMatch) data.area_util = parseInt(areaMatch[1]);

  const roomsMatch = html.match(/(\d+)\s*quarto/i);
  if (roomsMatch) data.quartos = parseInt(roomsMatch[1]);

  return data;
}

// Extração da ERA
function extractFromEra(html: string, url: string): ExtractedData {
  const data: ExtractedData = { fonte: "ERA" };

  const titleMatch = html.match(/<h1[^>]*>([^<]+)/i) || html.match(/<title>([^<]+)/i);
  if (titleMatch) data.titulo = titleMatch[1].trim();

  const priceMatch = html.match(/(\d{1,3}(?:[.,]\d{3})*)\s*€/);
  if (priceMatch) data.preco = parseInt(priceMatch[1].replace(/[.,]/g, ""));

  const typoMatch = html.match(/\b(T\d+)\b/i);
  if (typoMatch) data.tipologia = typoMatch[1].toUpperCase();

  const areaMatch = html.match(/(\d+)\s*m²/);
  if (areaMatch) data.area_util = parseInt(areaMatch[1]);

  const roomsMatch = html.match(/(\d+)\s*quarto/i);
  if (roomsMatch) data.quartos = parseInt(roomsMatch[1]);

  return data;
}

// Extração do Century 21
function extractFromCentury21(html: string, url: string): ExtractedData {
  const data: ExtractedData = { fonte: "Century 21" };

  const titleMatch = html.match(/<h1[^>]*>([^<]+)/i) || html.match(/<title>([^<]+)/i);
  if (titleMatch) data.titulo = titleMatch[1].trim();

  const priceMatch = html.match(/(\d{1,3}(?:[.,]\d{3})*)\s*€/);
  if (priceMatch) data.preco = parseInt(priceMatch[1].replace(/[.,]/g, ""));

  const typoMatch = html.match(/\b(T\d+)\b/i);
  if (typoMatch) data.tipologia = typoMatch[1].toUpperCase();

  const areaMatch = html.match(/(\d+)\s*m²/);
  if (areaMatch) data.area_util = parseInt(areaMatch[1]);

  const roomsMatch = html.match(/(\d+)\s*quarto/i);
  if (roomsMatch) data.quartos = parseInt(roomsMatch[1]);

  return data;
}

// Extração do KW
function extractFromKW(html: string, url: string): ExtractedData {
  const data: ExtractedData = { fonte: "Keller Williams" };

  const titleMatch = html.match(/<h1[^>]*>([^<]+)/i) || html.match(/<title>([^<]+)/i);
  if (titleMatch) data.titulo = titleMatch[1].trim();

  const priceMatch = html.match(/(\d{1,3}(?:[.,]\d{3})*)\s*€/);
  if (priceMatch) data.preco = parseInt(priceMatch[1].replace(/[.,]/g, ""));

  const typoMatch = html.match(/\b(T\d+)\b/i);
  if (typoMatch) data.tipologia = typoMatch[1].toUpperCase();

  const areaMatch = html.match(/(\d+)\s*m²/);
  if (areaMatch) data.area_util = parseInt(areaMatch[1]);

  const roomsMatch = html.match(/(\d+)\s*quarto/i);
  if (roomsMatch) data.quartos = parseInt(roomsMatch[1]);

  return data;
}

// Extração genérica usando meta tags e padrões comuns
function extractGeneric(html: string, url: string): ExtractedData {
  const data: ExtractedData = {};

  // Open Graph title
  const ogTitleMatch =
    html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i) ||
    html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:title"/i);
  if (ogTitleMatch) data.titulo = ogTitleMatch[1].trim();
  else {
    const titleMatch = html.match(/<title>([^<]+)/i);
    if (titleMatch) data.titulo = titleMatch[1].trim();
  }

  // Tentar extrair preço
  const priceMatch = html.match(/(\d{1,3}(?:[.,]\d{3})*)\s*€/);
  if (priceMatch) data.preco = parseInt(priceMatch[1].replace(/[.,]/g, ""));

  // Tipologia
  const typoMatch = html.match(/\b(T\d+)\b/i);
  if (typoMatch) data.tipologia = typoMatch[1].toUpperCase();

  // Área
  const areaMatch = html.match(/(\d+)\s*m²/);
  if (areaMatch) data.area_util = parseInt(areaMatch[1]);

  // Quartos
  const roomsMatch = html.match(/(\d+)\s*quarto/i);
  if (roomsMatch) data.quartos = parseInt(roomsMatch[1]);

  // Localização via Open Graph
  const locMatch = html.match(/<meta[^>]*property="og:locality"[^>]*content="([^"]+)"/i);
  if (locMatch) data.localizacao = locMatch[1].trim();

  // Detectar fonte pelo domínio
  try {
    const domain = new URL(url).hostname.replace("www.", "");
    data.fonte = domain.charAt(0).toUpperCase() + domain.slice(1).split(".")[0];
  } catch {}

  return data;
}
