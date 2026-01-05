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
  
  // Apenas otimizações de formato e qualidade
  // Fundo já foi removido permanentemente das imagens originais
  const transformations = 'f_auto,q_auto:best';
  
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
