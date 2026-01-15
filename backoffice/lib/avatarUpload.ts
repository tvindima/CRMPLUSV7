import { API_BASE_URL, getTenantSlug } from '@/lib/api';

const AVATAR_SIZE = 512;
const AVATAR_QUALITY = 0.85;

async function getAuthToken(): Promise<string> {
  const res = await fetch('/api/auth/token', { credentials: 'include' });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || 'Não autenticado. Faça login novamente.');
  }
  const data = await res.json();
  return data.token as string;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Falha ao carregar imagem'));
    };
    img.src = objectUrl;
  });
}

export async function compressAvatar(file: File): Promise<File> {
  const img = await loadImage(file);
  const minSide = Math.min(img.width, img.height);
  const targetSize = Math.min(AVATAR_SIZE, minSide);

  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas indisponível');
  }

  const sx = Math.floor((img.width - minSide) / 2);
  const sy = Math.floor((img.height - minSide) / 2);
  ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetSize, targetSize);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((output) => {
      if (!output) {
        reject(new Error('Falha ao comprimir imagem'));
        return;
      }
      resolve(output);
    }, 'image/webp', AVATAR_QUALITY);
  });

  return new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), { type: 'image/webp' });
}

export async function uploadAgentAvatar(agentId: number, file: File): Promise<string> {
  const token = await getAuthToken();
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/agents/${agentId}/upload-photo`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Tenant-Slug': getTenantSlug(),
    },
    body: formData,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || 'Erro ao carregar avatar do agente.');
  }

  const data = await res.json();
  return data.photo as string;
}

export async function uploadStaffAvatar(userId: number, file: File): Promise<string> {
  const token = await getAuthToken();
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/admin/upload-staff-avatar/${userId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Tenant-Slug': getTenantSlug(),
    },
    body: formData,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || 'Erro ao carregar avatar do staff.');
  }

  const data = await res.json();
  return data.avatar_url as string;
}
