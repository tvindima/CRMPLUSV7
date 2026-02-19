/**
 * Utilitários para manipulação de URLs do Cloudinary
 */

/**
 * Adiciona transformação de remoção de fundo a uma URL do Cloudinary.
 * 
 * Transforma:
 * https://res.cloudinary.com/.../upload/v123/path/image.webp
 * Em:
 * https://res.cloudinary.com/.../upload/e_background_removal/v123/path/image.webp
 * 
 * @param url - URL original do Cloudinary
 * @returns URL com remoção de fundo aplicada, ou URL original se não for Cloudinary
 */
export function removeCloudinaryBackground(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // Verificar se é URL do Cloudinary
  if (!url.includes('res.cloudinary.com')) {
    return url; // Não é Cloudinary, retornar original
  }
  
  // Já tem transformação de remoção de fundo
  if (url.includes('e_background_removal') || url.includes('e_bgremoval')) {
    return url;
  }
  
  // Adicionar transformação após /upload/
  return url.replace('/upload/', '/upload/e_background_removal/');
}

/**
 * Aplica transformações adicionais a uma URL do Cloudinary.
 * 
 * @param url - URL original
 * @param transformations - String de transformações (ex: "w_500,h_500,c_fill")
 * @returns URL transformada
 */
export function applyCloudinaryTransformations(
  url: string | null | undefined,
  transformations: string
): string | null {
  if (!url) return null;
  
  if (!url.includes('res.cloudinary.com')) {
    return url;
  }
  
  return url.replace('/upload/', `/upload/${transformations}/`);
}

/**
 * Remove fundo branco e aplica otimizações em avatares.
 * 
 * Transformações aplicadas:
 * - e_background_removal: Remove fundo
 * - f_auto: Formato automático (WebP, AVIF)
 * - q_auto:best: Qualidade automática (melhor)
 * 
 * @param url - URL do avatar
 * @returns URL otimizada
 */
export function optimizeAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  if (!url.includes('res.cloudinary.com')) {
    return url;
  }
  
  // Remover margens transparentes e escalar mantendo proporção
  const transformations = 'e_trim,c_scale,h_600,f_auto,q_auto:best';
  
  // Se já tem transformações, não duplicar
  if (url.includes('f_auto') || url.includes('q_auto')) {
    return url;
  }
  
  return url.replace('/upload/', `/upload/${transformations}/`);
}

/**
 * Otimiza avatar de staff com remoção de fundo automática.
 * Usa Cloudinary AI para remover fundos não transparentes.
 * 
 * @param url - URL do avatar
 * @returns URL com remoção de fundo e otimizações
 */
export function optimizeStaffAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  if (!url.includes('res.cloudinary.com')) {
    return url;
  }
  
  // Transformações: remover fundo + redimensionar para altura uniforme (90%) + formato automático + qualidade
  // w_0.9 = 90% da largura original para uniformizar tamanhos
  const transformations = 'e_background_removal,c_scale,h_600,f_auto,q_auto:best';
  
  // Se já tem remoção de fundo, apenas adicionar redimensionamento
  if (url.includes('e_background_removal') || url.includes('e_bgremoval')) {
    return url.replace('/upload/', '/upload/c_scale,h_600,f_auto,q_auto:best/');
  }
  
  return url.replace('/upload/', `/upload/${transformations}/`);
}

/**
 * Remove camadas de overlay (watermark/logo) de uma URL Cloudinary.
 * Útil quando o backend já entrega a imagem com marca de água aplicada
 * e uma transformação adicional gera duplicação visual.
 */
export function stripCloudinaryOverlayLayers(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;

  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split('/').filter(Boolean);
    const uploadIndex = segments.indexOf('upload');
    if (uploadIndex === -1 || uploadIndex + 1 >= segments.length) return url;

    let versionIndex = -1;
    for (let i = uploadIndex + 1; i < segments.length; i += 1) {
      if (/^v\d+$/.test(segments[i])) {
        versionIndex = i;
        break;
      }
    }

    if (versionIndex === -1) return url;

    const before = segments.slice(0, uploadIndex + 1);
    const transforms = segments.slice(uploadIndex + 1, versionIndex);
    const after = segments.slice(versionIndex);

    let skipPositioning = false;
    const cleanedTransforms = transforms.filter((segment) => {
      const isOverlay = segment.includes('l_') || segment.includes('fl_layer_apply');
      if (isOverlay) {
        skipPositioning = true;
        return false;
      }

      if (skipPositioning && /^(g_|x_|y_|o_)/.test(segment)) {
        return false;
      }

      skipPositioning = false;
      return true;
    });

    parsed.pathname = `/${[...before, ...cleanedTransforms, ...after].join('/')}`;
    return parsed.toString();
  } catch {
    return url;
  }
}
