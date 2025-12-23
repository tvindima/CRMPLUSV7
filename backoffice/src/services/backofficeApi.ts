export type BackofficeProperty = {
  id: number;
  reference: string;
  title: string;
  business_type: string | null;
  property_type: string | null;
  typology: string | null;
  description: string | null;
  observations: string | null;
  price: number | null;
  usable_area: number | null;
  land_area: number | null;
  location: string | null;
  municipality: string | null;
  parish: string | null;
  condition: string | null;
  energy_certificate: string | null;
  status: string | null;
  agent_id: number | null;
  images: string[] | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type BackofficePropertyPayload = Omit<BackofficeProperty, "id" | "created_at" | "updated_at">;

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://crmplusv7-production.up.railway.app";
// Para chamadas que precisam de autenticação por cookie, usa proxy local
const API_PROXY = "/api";

async function request<T>(path: string, init?: RequestInit, useProxy = false): Promise<T> {
  const base = useProxy ? API_PROXY : API_BASE;
  const res = await fetch(`${base}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    credentials: useProxy ? "include" : "same-origin",
    ...init,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Erro ${res.status}: ${body}`);
  }
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return (await res.json()) as T;
  }
  return (await res.text()) as T;
}

export async function getBackofficeProperties(params?: {
  limit?: number;
  skip?: number;
  search?: string;
  status?: string;
}): Promise<BackofficeProperty[]> {
  const query = new URLSearchParams();
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.skip) query.set("skip", String(params.skip));
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  const qs = query.toString();
  return request(qs ? `/properties/?${qs}` : "/properties/", undefined, true);
}

// ==========================
// Pré-Angariações (admin)
// ==========================
export type PreAngariacaoListItem = {
  id: number;
  referencia_interna?: string | null;
  proprietario_nome: string;
  morada?: string | null;
  status: string;
  progresso: number;
  created_at: string;
  agent_id?: number;
};

export async function getPreAngariacoes(params?: {
  status?: string;
  agent_id?: number;
  limit?: number;
  skip?: number;
}): Promise<PreAngariacaoListItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.agent_id) searchParams.set('agent_id', String(params.agent_id));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.skip) searchParams.set('skip', String(params.skip));
  const qs = searchParams.toString();
  const url = qs ? `/pre-angariacoes/?${qs}` : '/pre-angariacoes/';
  // Usar proxy para enviar cookies de sessão admin
  return request(url, undefined, true);
}

export async function getBackofficeProperty(id: number): Promise<BackofficeProperty> {
  return request(`/properties/${id}`);
}

export async function createBackofficeProperty(
  payload: BackofficePropertyPayload,
  files?: File[]
): Promise<BackofficeProperty> {
  // Criar propriedade via proxy local
  const res = await fetch('/api/properties/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Erro ao criar propriedade: ${error}`);
  }
  
  const created = await res.json() as BackofficeProperty;
  
  // Se houver imagens para upload, enviar via proxy local
  if (files && files.length > 0) {
    const uploadRes = await uploadPropertyImages(created.id, files);
    created.images = uploadRes.urls;
  }
  
  return created;
}

export async function updateBackofficeProperty(
  id: number,
  payload: Partial<BackofficePropertyPayload>,
  files?: File[],
  imagesToKeep?: string[]
): Promise<BackofficeProperty> {
  const mergedPayload = { ...payload } as any;
  if (imagesToKeep !== undefined) mergedPayload.images = imagesToKeep;
  
  // Atualizar via proxy local
  const res = await fetch(`/api/properties/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mergedPayload),
    credentials: 'include',
  });
  
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Erro ao atualizar propriedade: ${error}`);
  }
  
  const updated = await res.json() as BackofficeProperty;
  
  // Se houver novas imagens, fazer upload
  if (files && files.length > 0) {
    const uploadRes = await uploadPropertyImages(id, files);
    updated.images = uploadRes.urls;
  }
  
  return updated;
}

export async function deleteBackofficeProperty(id: number): Promise<void> {
  await request(`/properties/${id}`, { method: "DELETE" });
}

export async function uploadPropertyImages(
  id: number,
  files: File[]
): Promise<{ uploaded: number; urls: string[] }> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  
  // FIXME: Vercel Free tem limite de 4.5MB no body, então fazemos upload DIRETO para Railway
  // para evitar 403 Forbidden ao enviar múltiplas imagens grandes
  const railwayUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
  
  try {
    // Obter token da sessão
    console.log('[Upload] Obtendo token de autenticação...');
    const tokenRes = await fetch('/api/auth/token', {
      credentials: 'include',
    });
    
    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      console.error('[Upload] Erro ao obter token:', tokenRes.status, errorText);
      throw new Error('Não autenticado. Faça login novamente.');
    }
    
    const { token } = await tokenRes.json();
    console.log('[Upload] Token obtido. Enviando', files.length, 'arquivo(s) para Railway...');
    
    // Upload direto para Railway (bypass Vercel proxy)
    const uploadUrl = `${railwayUrl}/properties/${id}/upload`;
    console.log('[Upload] URL:', uploadUrl);
    
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (!res.ok) {
      const body = await res.text();
      console.error('[Upload] Erro no upload:', res.status, body);
      throw new Error(`Upload falhou (${res.status}): ${body}`);
    }
    
    const result = await res.json();
    console.log('[Upload] Sucesso!', result);
    return result as { uploaded: number; urls: string[] };
    
  } catch (error: any) {
    console.error('[Upload] Exceção capturada:', error);
    
    // Se for erro de rede (fetch failed), dar mensagem mais clara
    if (error.message?.includes('fetch')) {
      throw new Error(`Erro de conexão. Verifique se Railway está online: ${railwayUrl}`);
    }
    
    throw error;
  }
}

export async function uploadPropertyVideo(
  id: number,
  videoFile: File
): Promise<{ 
  video_url: string; 
  message?: string;
  original_size_mb?: number;
  final_size_mb?: number;
}> {
  const formData = new FormData();
  formData.append("file", videoFile);
  
  const railwayUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
  
  try {
    console.log('[Video Upload] Obtendo token...');
    const tokenRes = await fetch('/api/auth/token', {
      credentials: 'include',
    });
    
    if (!tokenRes.ok) {
      throw new Error('Não autenticado. Faça login novamente.');
    }
    
    const { token } = await tokenRes.json();
    console.log('[Video Upload] Enviando vídeo para Railway...');
    
    const uploadUrl = `${railwayUrl}/properties/${id}/upload-video`;
    
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (!res.ok) {
      const body = await res.text();
      console.error('[Video Upload] Erro:', res.status, body);
      throw new Error(`Upload de vídeo falhou (${res.status}): ${body}`);
    }
    
    const result = await res.json();
    console.log('[Video Upload] Sucesso!', result);
    return result;
    
  } catch (error: any) {
    console.error('[Video Upload] Exceção:', error);
    throw error;
  }
}

// Agent types and endpoints
export type BackofficeAgent = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  team_id?: number | null;
  agency_id?: number | null;
  role?: string | null;
  status?: string | null;
};

export async function getBackofficeAgents(params?: {
  limit?: number;
  skip?: number;
  search?: string;
}): Promise<BackofficeAgent[]> {
  const query = new URLSearchParams();
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.skip) query.set("skip", String(params.skip));
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  return request(qs ? `/agents/?${qs}` : "/agents/");
}

export async function getBackofficeAgent(id: number): Promise<BackofficeAgent> {
  return request(`/agents/${id}`);
}

// Lead types and endpoints
export type LeadStatus = 
  | "new" 
  | "contacted" 
  | "qualified" 
  | "proposal_sent"
  | "visit_scheduled"
  | "negotiation"
  | "converted"
  | "lost";

export type LeadSource =
  | "website"
  | "phone"
  | "email"
  | "referral"
  | "social"
  | "manual"
  | "other";

export type BackofficeLead = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  origin?: string | null;
  source: LeadSource;
  property_id?: number | null;
  action_type?: string | null;
  status: LeadStatus;
  assigned_agent_id?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type BackofficeLeadPayload = {
  name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  origin?: string | null;
  source?: LeadSource;
  property_id?: number | null;
  action_type?: string | null;
  status?: LeadStatus;
  assigned_agent_id?: number | null;
};

export async function getBackofficeLeads(params?: {
  limit?: number;
  skip?: number;
  search?: string;
}): Promise<BackofficeLead[]> {
  const query = new URLSearchParams();
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.skip) query.set("skip", String(params.skip));
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  return request(qs ? `/leads/?${qs}` : "/leads/");
}

export async function getBackofficeLead(id: number): Promise<BackofficeLead> {
  return request(`/leads/${id}`);
}

export async function createBackofficeLead(payload: BackofficeLeadPayload): Promise<BackofficeLead> {
  return request(`/leads/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateBackofficeLead(
  id: number,
  payload: Partial<BackofficeLeadPayload>
): Promise<BackofficeLead> {
  return request(`/leads/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteBackofficeLead(id: number): Promise<BackofficeLead> {
  return request(`/leads/${id}`, { method: "DELETE" });
}

// Team types and endpoints
export type BackofficeTeam = {
  id: number;
  name: string;
  description?: string | null;
  manager_id?: number | null;  // Backend uses manager_id, not leader_id
  agency_id?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type BackofficeTeamPayload = {
  name: string;
  description?: string | null;
  manager_id?: number | null;  // Backend uses manager_id
};

export async function getBackofficeTeams(params?: {
  limit?: number;
  skip?: number;
  search?: string;
}): Promise<BackofficeTeam[]> {
  const query = new URLSearchParams();
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.skip) query.set("skip", String(params.skip));
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  return request(qs ? `/teams/?${qs}` : "/teams/");
}

export async function getBackofficeTeam(id: number): Promise<BackofficeTeam> {
  return request(`/teams/${id}`);
}

export async function createBackofficeTeam(payload: BackofficeTeamPayload): Promise<BackofficeTeam> {
  return request(`/teams/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateBackofficeTeam(
  id: number,
  payload: Partial<BackofficeTeamPayload>
): Promise<BackofficeTeam> {
  return request(`/teams/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteBackofficeTeam(id: number): Promise<BackofficeTeam> {
  return request(`/teams/${id}`, { method: "DELETE" });
}

// TODO: implementar endpoints reais para relatórios, agenda, automação quando expostos.
