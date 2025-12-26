/**
 * ✨ FASE 2: Cloudinary Upload Client-Side
 * Upload direto de fotos para Cloudinary (SEM passar pelo backend)
 * Performance: 5-10x mais rápido que server-side upload
 */

import { apiService } from './api';

export interface CloudinaryConfig {
  cloud_name: string;
  upload_preset: string;
  api_base_url: string;
  folder: string;
  max_file_size_mb: number;
  allowed_formats: string[];
}

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

class CloudinaryService {
  private config: CloudinaryConfig | null = null;

  /**
   * Obtém configuração do backend (1x no app startup)
   * Guardar em context/Redux para reutilizar
   */
  async getConfig(): Promise<CloudinaryConfig> {
    if (this.config) {
      return this.config;
    }

    console.log('[Cloudinary] 🔧 Obtendo configuração...');
    this.config = await apiService.get<CloudinaryConfig>('/mobile/cloudinary/upload-config');
    console.log('[Cloudinary] ✅ Config obtida:', this.config.upload_preset);
    
    return this.config;
  }

  /**
   * Upload direto de foto para Cloudinary (client-side)
   * 
   * @param imageUri - URI local da imagem (do Image Picker)
   * @param fileName - Nome do ficheiro (opcional)
   * @returns URL da foto no Cloudinary
   */
  async uploadPhoto(imageUri: string, fileName?: string): Promise<string> {
    const config = await this.getConfig();

    console.log('[Cloudinary] 📤 Uploading:', fileName || imageUri);

    // Criar FormData
    const formData = new FormData();

    // Adicionar foto
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg', // ou detectar do URI
      name: fileName || 'photo.jpg',
    } as any);

    // Adicionar configuração Cloudinary
    formData.append('upload_preset', config.upload_preset);
    formData.append('folder', config.folder);

    try {
      // Upload DIRETO para Cloudinary (SEM passar pelo backend)
      const response = await fetch(config.api_base_url, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Cloudinary] ❌ Upload failed:', errorText);
        throw new Error('Falha no upload da foto. Tente novamente.');
      }

      const result: CloudinaryUploadResult = await response.json();
      console.log('[Cloudinary] ✅ Upload success:', result.secure_url);

      return result.secure_url;
    } catch (error: any) {
      console.error('[Cloudinary] ❌ Error:', error);
      throw new Error(error.message || 'Erro ao fazer upload da foto.');
    }
  }

  /**
   * Upload múltiplas fotos em paralelo
   * 
   * @param imageUris - Array de URIs locais
   * @returns Array de URLs do Cloudinary
   */
  async uploadMultiplePhotos(imageUris: string[]): Promise<string[]> {
    console.log(`[Cloudinary] 📤 Uploading ${imageUris.length} photos...`);

    const uploadPromises = imageUris.map((uri, index) => 
      this.uploadPhoto(uri, `photo-${index + 1}.jpg`)
    );

    const urls = await Promise.all(uploadPromises);
    console.log(`[Cloudinary] ✅ ${urls.length} photos uploaded successfully`);

    return urls;
  }

  /**
   * Salvar URLs de fotos na propriedade (depois de upload para Cloudinary)
   * 
   * @param propertyId - ID da propriedade
   * @param photoUrls - URLs das fotos no Cloudinary
   * @returns Resposta do backend com total de fotos
   */
  async savePhotosToProperty(
    propertyId: number,
    photoUrls: string[]
  ): Promise<{ success: boolean; photos_uploaded: number; total_photos: number }> {
    console.log(`[Cloudinary] 💾 Salvando ${photoUrls.length} URLs no backend...`);

    const photos = photoUrls.map(url => ({ url }));
    
    const result = await apiService.post<{
      success: boolean;
      property_id: number;
      photos_uploaded: number;
      total_photos: number;
      urls: string[];
    }>(`/mobile/properties/${propertyId}/photos/bulk`, { photos });

    console.log(`[Cloudinary] ✅ Fotos salvas: ${result.photos_uploaded}/${result.total_photos}`);

    return {
      success: result.success,
      photos_uploaded: result.photos_uploaded,
      total_photos: result.total_photos,
    };
  }

  /**
   * Fluxo completo: Upload + Salvar no backend
   * 
   * @param propertyId - ID da propriedade
   * @param imageUris - URIs locais das fotos
   * @param onProgress - Callback de progresso (opcional)
   * @returns Total de fotos salvas
   */
  async uploadAndSavePhotos(
    propertyId: number,
    imageUris: string[],
    onProgress?: (uploaded: number, total: number) => void
  ): Promise<number> {
    console.log(`[Cloudinary] 🚀 Fluxo completo: ${imageUris.length} fotos`);

    // 1. Upload para Cloudinary (paralelo)
    const cloudinaryUrls: string[] = [];
    
    for (let i = 0; i < imageUris.length; i++) {
      const url = await this.uploadPhoto(imageUris[i], `photo-${i + 1}.jpg`);
      cloudinaryUrls.push(url);
      
      // Callback de progresso
      if (onProgress) {
        onProgress(i + 1, imageUris.length);
      }
    }

    // 2. Salvar URLs no backend
    const result = await this.savePhotosToProperty(propertyId, cloudinaryUrls);

    return result.total_photos;
  }

  /**
   * Upload genérico (imagem/PDF/etc) para Cloudinary
   */
  async uploadFile(fileUri: string, fileName: string, mimeType: string, base64Data?: string): Promise<string> {
    const config = await this.getConfig();

    console.log('[Cloudinary] 📤 Uploading file:', fileName, mimeType);

    // Web: blob:/file: URLs precisam ser convertidos para base64
    let dataUri = base64Data;
    if (!dataUri && fileUri && typeof window !== 'undefined' && fileUri.startsWith('blob:')) {
      const response = await fetch(fileUri);
      const blob = await response.blob();
      const b64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result as string;
          resolve(res.substring(res.indexOf(',') + 1));
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      dataUri = b64;
      mimeType = blob.type || mimeType;
    }

    const formData = new FormData();
    if (dataUri) {
      // Enviar como data URI (necessário para blob: URLs no web)
      formData.append('file', `data:${mimeType || 'application/octet-stream'};base64,${dataUri}`);
    } else {
      formData.append('file', {
        uri: fileUri,
        type: mimeType || 'application/octet-stream',
        name: fileName,
      } as any);
    }
    formData.append('upload_preset', config.upload_preset);
    formData.append('folder', config.folder);

    const response = await fetch(config.api_base_url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Cloudinary] ❌ Upload file failed:', errorText);
      throw new Error('Falha no upload do ficheiro. Tente novamente.');
    }

    const result: CloudinaryUploadResult = await response.json();
    console.log('[Cloudinary] ✅ File upload success:', result.secure_url);
    return result.secure_url;
  }
}

export const cloudinaryService = new CloudinaryService();
