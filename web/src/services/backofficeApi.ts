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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
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
  return request(qs ? `/properties/?${qs}` : "/properties/");
}

export async function getBackofficeProperty(id: number): Promise<BackofficeProperty> {
  return request(`/properties/${id}`);
}

export async function createBackofficeProperty(
  payload: BackofficePropertyPayload,
  files?: File[]
): Promise<BackofficeProperty> {
  const created = await request<BackofficeProperty>(`/properties/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
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
  const updated = await request<BackofficeProperty>(`/properties/${id}`, {
    method: "PUT",
    body: JSON.stringify(mergedPayload),
  });
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
  const res = await fetch(`${API_BASE}/properties/${id}/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Upload falhou (${res.status}): ${body}`);
  }
  return (await res.json()) as { uploaded: number; urls: string[] };
}

// TODO: implementar endpoints reais para leads, agentes, equipas, relatórios, agenda, automação quando expostos.
