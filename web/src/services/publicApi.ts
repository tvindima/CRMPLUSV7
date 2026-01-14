export type Property = {
	id: number;
	reference?: string | null;
	title?: string | null;
	business_type?: string | null;
	property_type?: string | null;
	typology?: string | null;
	description?: string | null;
	observations?: string | null;
	price?: number | null;
	usable_area?: number | null;
	land_area?: number | null;
	area?: number | null;
	location?: string | null;
	municipality?: string | null;
	parish?: string | null;
	condition?: string | null;
	energy_certificate?: string | null;
	status?: string | null;
	agent_id?: number | null;
	images?: string[] | null;
	is_published?: number | null;
	is_featured?: number | null;
	latitude?: number | null;
	longitude?: number | null;
	bedrooms?: number | null;
	bathrooms?: number | null;
	parking_spaces?: number | null;
	video_url?: string | null;
	created_at?: string | null;
	updated_at?: string | null;
	view_count_7d?: number | null;
	views_last_7_days?: number | null;
	weekly_views?: number | null;
};

export type Agent = {
	id: number;
	name: string;
	email: string;
	phone?: string | null;
	avatar_url?: string | null;
	photo?: string | null;
	license_ami?: string | null;
	nif?: string | null;
	address?: string | null;
	bio?: string | null;
	instagram?: string | null;
	facebook?: string | null;
	linkedin?: string | null;
	twitter?: string | null;
	tiktok?: string | null;
	whatsapp?: string | null;
	team?: string | null;
	team_id?: number | null;
	agency_id?: number | null;
};

export type StaffMember = {
	id: number;
	name: string;
	role: string;
	phone?: string | null;
	email?: string | null;
	avatar_url?: string | null;
	works_for_agent_id?: number | null;
};

type PropertyResponse = Property & {
	images?: (string | null)[] | null;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://crmplusv7-production.up.railway.app").replace(/\/$/, "");

async function fetchJson<T>(path: string): Promise<T> {
	const res = await fetch(`${API_BASE}${path}`, { next: { revalidate: 30 } });
	if (!res.ok) {
		throw new Error(`Erro ao chamar ${path}: ${res.status}`);
	}
	return res.json() as Promise<T>;
}

function normalizeMediaUrl(url?: string | null): string | null {
	if (!url) return null;
	if (url.startsWith("http://") || url.startsWith("https://")) return url;
	if (url.startsWith("/media")) return `${API_BASE}${url}`;
	return url;
}

function normalizeVideoUrl(url?: string | null): string | null {
	if (!url) return null;
	const studioMatch = url.match(/studio\.youtube\.com\/video\/([a-zA-Z0-9_-]+)/);
	if (studioMatch) {
		const id = studioMatch[1];
		return `https://www.youtube.com/watch?v=${id}`;
	}
	const looksValid =
		url.includes("youtube.com") ||
		url.includes("youtu.be") ||
		url.includes("vimeo.com") ||
		/\.(mp4|webm|ogg)(\?|$)/i.test(url);
	return looksValid ? normalizeMediaUrl(url) : null;
}

function parseBedroomsFromTypology(typology?: string | null, fallback?: number | null): number | null {
	if (fallback !== undefined && fallback !== null) return fallback;
	const match = typology?.match(/T(\d+)/i);
	return match ? parseInt(match[1], 10) : null;
}

function normalizeProperty(property: PropertyResponse): Property {
	const images = (property.images || [])
		.map((img) => normalizeMediaUrl(img))
		.filter((img): img is string => !!img);

	return {
		...property,
		images,
		video_url: normalizeVideoUrl(property.video_url),
		bedrooms: parseBedroomsFromTypology(property.typology, property.bedrooms),
		area: property.area ?? property.usable_area ?? null,
	};
}

function clampLimit(limit: number, max = 500): number {
	return Math.max(1, Math.min(limit, max));
}

export async function getProperties(limit = 500): Promise<Property[]> {
	const pageSize = clampLimit(limit);
	const all: Property[] = [];
	let skip = 0;

	try {
		for (;;) {
			const batch = await fetchJson<PropertyResponse[]>(`/properties/?is_published=1&skip=${skip}&limit=${pageSize}`);
			if (!Array.isArray(batch) || batch.length === 0) break;

			all.push(...batch.map(normalizeProperty));
			if (batch.length < pageSize || all.length >= limit) break;
			skip += pageSize;
		}
	} catch (err) {
		console.error("[API] Backend connection failed:", err);
	}

	return all.slice(0, limit);
}

export async function getPropertyByReference(reference: string): Promise<Property | null> {
	const properties = await getProperties(500);
	const target = reference.toLowerCase();
	return (
		properties.find(
			(p) => p.reference?.toLowerCase() === target || p.title?.toLowerCase() === target
		) || null
	);
}

export async function getAgents(limit = 50): Promise<Agent[]> {
	try {
		return await fetchJson<Agent[]>(`/agents/?limit=${clampLimit(limit, 200)}`);
	} catch (err) {
		console.error("[API] Failed to fetch agents:", err);
		return [];
	}
}

export async function getAgentById(agentId: number): Promise<Agent | null> {
	try {
		return await fetchJson<Agent>(`/agents/${agentId}`);
	} catch (err) {
		console.error(`[API] Agent ${agentId} not found in backend:`, err);
		return null;
	}
}

export async function getStaff(): Promise<StaffMember[]> {
	try {
		return await fetchJson<StaffMember[]>("/agents/staff");
	} catch (err) {
		console.error("[API] Failed to fetch staff:", err);
		return [];
	}
}
