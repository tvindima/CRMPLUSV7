'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BackofficeLayout } from '@/components/BackofficeLayout';
import { DynamicFormFields, useFormFields } from '@/components/DynamicFormFields';
import { useTenant } from '@/context/TenantContext';
import { useTerminology } from '@/context/TerminologyContext';
import { Upload, X, Image as ImageIcon, Save, ArrowLeft, Loader2 } from 'lucide-react';

interface ItemFormProps {
  mode: 'create' | 'edit';
  itemId?: number;
  initialData?: Record<string, any>;
  onSuccess?: (item: any) => void;
}

export function ItemForm({ mode, itemId, initialData, onSuccess }: ItemFormProps) {
  const router = useRouter();
  const { sector, tenant } = useTenant();
  const { term } = useTerminology();
  const { config, loading: configLoading, getInitialValues, validate, toApiPayload } = useFormFields(sector);
  
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [agents, setAgents] = useState<{id: number, name: string}[]>([]);

  // Carregar dados iniciais
  useEffect(() => {
    if (config && !initialData) {
      setFormData(getInitialValues());
    } else if (initialData) {
      setFormData(initialData);
      if (initialData.images) {
        setExistingImages(initialData.images);
      }
    }
  }, [config, initialData]);

  // Carregar agentes
  useEffect(() => {
    const loadAgents = async () => {
      try {
        const response = await fetch('/api/agents');
        if (response.ok) {
          const data = await response.json();
          setAgents(data.agents || data || []);
        }
      } catch (error) {
        console.error('Error loading agents:', error);
      }
    };
    loadAgents();
  }, []);

  // Cleanup preview URLs
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpar erro do campo
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValid = file.type.startsWith('image/');
      const isSmallEnough = file.size <= 10 * 1024 * 1024; // 10MB
      return isValid && isSmallEnough;
    });

    setImages(prev => [...prev, ...validFiles]);
    
    // Criar preview URLs
    const newUrls = validFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newUrls]);
  };

  const removeNewImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageUrl: string) => {
    setExistingImages(prev => prev.filter(url => url !== imageUrl));
    setImagesToRemove(prev => [...prev, imageUrl]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    // Validar
    const validationErrors = validate(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Verificar pelo menos 1 imagem
    if (images.length === 0 && existingImages.length === 0) {
      setSubmitError('Adicione pelo menos uma imagem');
      return;
    }

    setLoading(true);

    try {
      const payload = toApiPayload(formData);
      
      // Adicionar imagens existentes que não foram removidas
      payload.images = existingImages;

      // Endpoint baseado no modo
      const url = mode === 'create' 
        ? '/api/properties' 
        : `/api/properties/${itemId}`;
      
      const method = mode === 'create' ? 'POST' : 'PUT';

      // Criar item
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || error.message || 'Erro ao guardar');
      }

      const item = await response.json();

      // Upload de novas imagens
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach(file => formData.append('files', file));

        const uploadResponse = await fetch(`/api/properties/${item.id}/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          console.error('Error uploading images');
        }
      }

      // Sucesso
      if (onSuccess) {
        onSuccess(item);
      } else {
        router.push(`/backoffice/properties/${item.id}`);
      }
    } catch (error: any) {
      console.error('Error saving item:', error);
      setSubmitError(error.message || 'Erro ao guardar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (configLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {submitError && (
        <div className="p-4 rounded-lg bg-danger/10 border border-danger/30 text-danger">
          {submitError}
        </div>
      )}

      {/* Seleção de Agente */}
      <div className="bg-background-secondary rounded-xl border border-border p-6">
        <h3 className="font-semibold text-white mb-4">Responsável</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-text-muted mb-1">
              Agente <span className="text-danger">*</span>
            </label>
            <select
              value={formData.agent_id || ''}
              onChange={(e) => handleChange('agent_id', parseInt(e.target.value) || null)}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white focus:outline-none focus:border-primary"
              required
            >
              <option value="">Selecionar agente...</option>
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Campos Dinâmicos */}
      <DynamicFormFields
        sector={sector}
        values={formData}
        onChange={handleChange}
        errors={errors}
        disabled={loading}
      />

      {/* Upload de Imagens */}
      <div className="bg-background-secondary rounded-xl border border-border p-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-primary" />
          Imagens
        </h3>

        {/* Imagens existentes */}
        {existingImages.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-text-muted mb-2">Imagens atuais:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {existingImages.map((url, index) => (
                <div key={url} className="relative group">
                  <img
                    src={url}
                    alt={`Imagem ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(url)}
                    className="absolute top-1 right-1 p-1 bg-danger rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Novas imagens */}
        {previewUrls.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-text-muted mb-2">Novas imagens:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {previewUrls.map((url, index) => (
                <div key={url} className="relative group">
                  <img
                    src={url}
                    alt={`Nova imagem ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    className="absolute top-1 right-1 p-1 bg-danger rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload button */}
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
          <Upload className="w-8 h-8 text-text-muted mb-2" />
          <span className="text-sm text-text-muted">
            Clique para adicionar imagens
          </span>
          <span className="text-xs text-text-muted mt-1">
            PNG, JPG até 10MB
          </span>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Botões */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 text-text-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {mode === 'create' ? term('add_item', 'Adicionar') : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
