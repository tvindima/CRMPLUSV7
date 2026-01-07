'use client';

import { useState, useEffect, useRef } from 'react';
import { BackofficeLayout } from "@/components/BackofficeLayout";
import { ToastProvider, useToast } from "../../../../backoffice/components/ToastProvider";
import { Upload, Save, Image as ImageIcon, Palette, Type } from 'lucide-react';

interface BrandingSettings {
  agency_name: string;
  agency_slogan: string;
  agency_logo_url: string | null;
  primary_color: string;
}

function BrandingForm() {
  const [settings, setSettings] = useState<BrandingSettings>({
    agency_name: '',
    agency_slogan: '',
    agency_logo_url: null,
    primary_color: '#E10600'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  
  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    try {
      const response = await fetch(`${API_URL}/public/branding`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching branding:', error);
      toast.push('Erro ao carregar configurações', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/settings/branding`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          agency_name: settings.agency_name,
          agency_slogan: settings.agency_slogan,
          agency_logo_url: settings.agency_logo_url,
          primary_color: settings.primary_color
        })
      });

      if (response.ok) {
        toast.push('Configurações guardadas com sucesso!', 'success');
      } else {
        const error = await response.json();
        toast.push(error.detail || 'Erro ao guardar', 'error');
      }
    } catch (error) {
      console.error('Error saving branding:', error);
      toast.push('Erro ao guardar configurações', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.push('Por favor selecione uma imagem', 'error');
      return;
    }

    // Validar tamanho (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.push('Imagem muito grande. Máximo 2MB', 'error');
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/admin/settings/branding/upload-logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({ ...prev, agency_logo_url: data.url }));
        toast.push('Logo carregado com sucesso!', 'success');
      } else {
        const error = await response.json();
        toast.push(error.detail || 'Erro ao carregar logo', 'error');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.push('Erro ao carregar logo', 'error');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Logo */}
      <div className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-6 text-white">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon className="w-5 h-5 text-[#E10600]" />
          <h2 className="text-lg font-semibold">Logo da Agência</h2>
        </div>
        
        <div className="flex items-start gap-6">
          {/* Preview */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 rounded-xl bg-[#1A1A1D] border border-[#2A2A2D] flex items-center justify-center overflow-hidden">
              {settings.agency_logo_url ? (
                <img 
                  src={settings.agency_logo_url} 
                  alt="Logo" 
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-center text-[#666]">
                  <ImageIcon className="w-8 h-8 mx-auto mb-1" />
                  <span className="text-xs">Sem logo</span>
                </div>
              )}
            </div>
          </div>

          {/* Upload */}
          <div className="flex-1 space-y-3">
            <p className="text-sm text-[#C5C5C5]">
              Carregue o logo da sua agência. Recomendado: PNG com fundo transparente, mínimo 200x200px.
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1D] hover:bg-[#252528] border border-[#2A2A2D] rounded-lg transition-colors disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'A carregar...' : 'Carregar Logo'}
            </button>

            {settings.agency_logo_url && (
              <div className="text-xs text-[#666] break-all">
                URL: {settings.agency_logo_url}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nome e Slogan */}
      <div className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-6 text-white">
        <div className="flex items-center gap-2 mb-4">
          <Type className="w-5 h-5 text-[#E10600]" />
          <h2 className="text-lg font-semibold">Identidade</h2>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm text-[#C5C5C5] mb-2">Nome da Agência</label>
            <input
              type="text"
              value={settings.agency_name}
              onChange={(e) => setSettings(prev => ({ ...prev, agency_name: e.target.value }))}
              className="w-full px-4 py-2 bg-[#1A1A1D] border border-[#2A2A2D] rounded-lg text-white focus:outline-none focus:border-[#E10600]"
              placeholder="Nome da agência"
            />
          </div>
          
          <div>
            <label className="block text-sm text-[#C5C5C5] mb-2">Slogan</label>
            <input
              type="text"
              value={settings.agency_slogan}
              onChange={(e) => setSettings(prev => ({ ...prev, agency_slogan: e.target.value }))}
              className="w-full px-4 py-2 bg-[#1A1A1D] border border-[#2A2A2D] rounded-lg text-white focus:outline-none focus:border-[#E10600]"
              placeholder="O seu slogan"
            />
          </div>
        </div>
      </div>

      {/* Cor Principal */}
      <div className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-6 text-white">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-[#E10600]" />
          <h2 className="text-lg font-semibold">Cor Principal</h2>
        </div>
        
        <div className="flex items-center gap-4">
          <input
            type="color"
            value={settings.primary_color}
            onChange={(e) => setSettings(prev => ({ ...prev, primary_color: e.target.value }))}
            className="w-12 h-12 rounded-lg cursor-pointer border-0"
          />
          <div>
            <input
              type="text"
              value={settings.primary_color}
              onChange={(e) => setSettings(prev => ({ ...prev, primary_color: e.target.value }))}
              className="px-4 py-2 bg-[#1A1A1D] border border-[#2A2A2D] rounded-lg text-white focus:outline-none focus:border-[#E10600] w-32"
              placeholder="#E10600"
            />
            <p className="text-xs text-[#666] mt-1">Código hexadecimal</p>
          </div>
          
          {/* Preview */}
          <div 
            className="ml-auto px-4 py-2 rounded-lg text-white font-medium"
            style={{ backgroundColor: settings.primary_color }}
          >
            Preview
          </div>
        </div>
      </div>

      {/* Botão Guardar */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-[#E10600] hover:bg-[#C10500] rounded-xl font-medium transition-colors disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'A guardar...' : 'Guardar Alterações'}
        </button>
      </div>
    </div>
  );
}

export default function BrandingPage() {
  return (
    <ToastProvider>
      <BackofficeLayout title="Branding Site">
        <BrandingForm />
      </BackofficeLayout>
    </ToastProvider>
  );
}
