'use client';

import { useState, useEffect, useRef } from 'react';
import { BackofficeLayout } from "@/components/BackofficeLayout";
import { ToastProvider, useToast } from "../../../../backoffice/components/ToastProvider";
import { Upload, Save, Image as ImageIcon, Palette, Type, Eye } from 'lucide-react';

interface BrandingSettings {
  agency_name: string;
  agency_slogan: string;
  agency_logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  background_secondary: string;
  text_color: string;
  text_muted: string;
  border_color: string;
  accent_color: string;
}

const defaultSettings: BrandingSettings = {
  agency_name: '',
  agency_slogan: '',
  agency_logo_url: null,
  primary_color: '#E10600',
  secondary_color: '#C5C5C5',
  background_color: '#0B0B0D',
  background_secondary: '#1A1A1F',
  text_color: '#FFFFFF',
  text_muted: '#9CA3AF',
  border_color: '#2A2A2E',
  accent_color: '#E10600'
};

// Presets de temas
const themePresets = [
  {
    name: 'Escuro Vermelho',
    colors: {
      primary_color: '#E10600',
      secondary_color: '#C5C5C5',
      background_color: '#0B0B0D',
      background_secondary: '#1A1A1F',
      text_color: '#FFFFFF',
      text_muted: '#9CA3AF',
      border_color: '#2A2A2E',
      accent_color: '#E10600'
    }
  },
  {
    name: 'Escuro Dourado',
    colors: {
      primary_color: '#D4AF37',
      secondary_color: '#C5C5C5',
      background_color: '#0D0D0D',
      background_secondary: '#1A1A1A',
      text_color: '#FFFFFF',
      text_muted: '#9CA3AF',
      border_color: '#2A2A2A',
      accent_color: '#D4AF37'
    }
  },
  {
    name: 'Escuro Azul',
    colors: {
      primary_color: '#3B82F6',
      secondary_color: '#CBD5E1',
      background_color: '#0F172A',
      background_secondary: '#1E293B',
      text_color: '#F1F5F9',
      text_muted: '#94A3B8',
      border_color: '#334155',
      accent_color: '#3B82F6'
    }
  },
  {
    name: 'Claro Elegante',
    colors: {
      primary_color: '#1E40AF',
      secondary_color: '#475569',
      background_color: '#FFFFFF',
      background_secondary: '#F8FAFC',
      text_color: '#0F172A',
      text_muted: '#64748B',
      border_color: '#E2E8F0',
      accent_color: '#1E40AF'
    }
  },
  {
    name: 'Claro Quente',
    colors: {
      primary_color: '#B45309',
      secondary_color: '#78716C',
      background_color: '#FFFBEB',
      background_secondary: '#FEF3C7',
      text_color: '#1C1917',
      text_muted: '#78716C',
      border_color: '#FDE68A',
      accent_color: '#B45309'
    }
  }
];

function BrandingForm() {
  const [settings, setSettings] = useState<BrandingSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  
  // FIXED: Usar proxy routes com tenant isolation

  useEffect(() => {
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    try {
      // FIXED: Usar proxy route
      const response = await fetch(`/api/branding`);
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
      // FIXED: Usar proxy route
      const response = await fetch(`/api/branding`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
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

  const applyPreset = (preset: typeof themePresets[0]) => {
    setSettings(prev => ({ ...prev, ...preset.colors }));
    toast.push(`Tema "${preset.name}" aplicado. Clique em Guardar para confirmar.`, 'success');
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
      const formData = new FormData();
      formData.append('file', file);

      // FIXED: Usar proxy route
      const response = await fetch(`/api/branding/upload-logo`, {
        method: 'POST',
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
          <h2 className="text-lg font-semibold">Temas Pré-definidos</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {themePresets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="p-3 rounded-lg border border-[#2A2A2D] hover:border-[#E10600] transition-colors text-left"
              style={{ backgroundColor: preset.colors.background_color }}
            >
              <div className="flex gap-1 mb-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.colors.primary_color }} />
                <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.colors.background_secondary }} />
                <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.colors.text_color }} />
              </div>
              <span className="text-xs" style={{ color: preset.colors.text_color }}>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Cores do Tema */}
      <div className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-[#E10600]" />
            <h2 className="text-lg font-semibold">Cores Personalizadas</h2>
          </div>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1A1A1D] hover:bg-[#252528] border border-[#2A2A2D] rounded-lg text-sm"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Esconder Preview' : 'Ver Preview'}
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Cor Principal */}
          <div>
            <label className="block text-sm text-[#C5C5C5] mb-2">Cor Principal</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.primary_color}
                onChange={(e) => setSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                className="w-10 h-10 rounded cursor-pointer border-0"
              />
              <input
                type="text"
                value={settings.primary_color}
                onChange={(e) => setSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                className="flex-1 px-2 py-1 bg-[#1A1A1D] border border-[#2A2A2D] rounded text-sm"
              />
            </div>
          </div>

          {/* Cor Secundária */}
          <div>
            <label className="block text-sm text-[#C5C5C5] mb-2">Cor Secundária</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.secondary_color}
                onChange={(e) => setSettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                className="w-10 h-10 rounded cursor-pointer border-0"
              />
              <input
                type="text"
                value={settings.secondary_color}
                onChange={(e) => setSettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                className="flex-1 px-2 py-1 bg-[#1A1A1D] border border-[#2A2A2D] rounded text-sm"
              />
            </div>
          </div>

          {/* Fundo Principal */}
          <div>
            <label className="block text-sm text-[#C5C5C5] mb-2">Fundo Principal</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.background_color}
                onChange={(e) => setSettings(prev => ({ ...prev, background_color: e.target.value }))}
                className="w-10 h-10 rounded cursor-pointer border-0"
              />
              <input
                type="text"
                value={settings.background_color}
                onChange={(e) => setSettings(prev => ({ ...prev, background_color: e.target.value }))}
                className="flex-1 px-2 py-1 bg-[#1A1A1D] border border-[#2A2A2D] rounded text-sm"
              />
            </div>
          </div>

          {/* Fundo Secundário */}
          <div>
            <label className="block text-sm text-[#C5C5C5] mb-2">Fundo Cards</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.background_secondary}
                onChange={(e) => setSettings(prev => ({ ...prev, background_secondary: e.target.value }))}
                className="w-10 h-10 rounded cursor-pointer border-0"
              />
              <input
                type="text"
                value={settings.background_secondary}
                onChange={(e) => setSettings(prev => ({ ...prev, background_secondary: e.target.value }))}
                className="flex-1 px-2 py-1 bg-[#1A1A1D] border border-[#2A2A2D] rounded text-sm"
              />
            </div>
          </div>

          {/* Texto Principal */}
          <div>
            <label className="block text-sm text-[#C5C5C5] mb-2">Texto Principal</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.text_color}
                onChange={(e) => setSettings(prev => ({ ...prev, text_color: e.target.value }))}
                className="w-10 h-10 rounded cursor-pointer border-0"
              />
              <input
                type="text"
                value={settings.text_color}
                onChange={(e) => setSettings(prev => ({ ...prev, text_color: e.target.value }))}
                className="flex-1 px-2 py-1 bg-[#1A1A1D] border border-[#2A2A2D] rounded text-sm"
              />
            </div>
          </div>

          {/* Texto Secundário */}
          <div>
            <label className="block text-sm text-[#C5C5C5] mb-2">Texto Secundário</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.text_muted}
                onChange={(e) => setSettings(prev => ({ ...prev, text_muted: e.target.value }))}
                className="w-10 h-10 rounded cursor-pointer border-0"
              />
              <input
                type="text"
                value={settings.text_muted}
                onChange={(e) => setSettings(prev => ({ ...prev, text_muted: e.target.value }))}
                className="flex-1 px-2 py-1 bg-[#1A1A1D] border border-[#2A2A2D] rounded text-sm"
              />
            </div>
          </div>

          {/* Bordas */}
          <div>
            <label className="block text-sm text-[#C5C5C5] mb-2">Bordas</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.border_color}
                onChange={(e) => setSettings(prev => ({ ...prev, border_color: e.target.value }))}
                className="w-10 h-10 rounded cursor-pointer border-0"
              />
              <input
                type="text"
                value={settings.border_color}
                onChange={(e) => setSettings(prev => ({ ...prev, border_color: e.target.value }))}
                className="flex-1 px-2 py-1 bg-[#1A1A1D] border border-[#2A2A2D] rounded text-sm"
              />
            </div>
          </div>

          {/* Destaque */}
          <div>
            <label className="block text-sm text-[#C5C5C5] mb-2">Destaque/Hover</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.accent_color}
                onChange={(e) => setSettings(prev => ({ ...prev, accent_color: e.target.value }))}
                className="w-10 h-10 rounded cursor-pointer border-0"
              />
              <input
                type="text"
                value={settings.accent_color}
                onChange={(e) => setSettings(prev => ({ ...prev, accent_color: e.target.value }))}
                className="flex-1 px-2 py-1 bg-[#1A1A1D] border border-[#2A2A2D] rounded text-sm"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div 
            className="mt-6 p-6 rounded-xl border"
            style={{ 
              backgroundColor: settings.background_color,
              borderColor: settings.border_color
            }}
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: settings.text_color }}>
              Preview do Tema
            </h3>
            
            {/* Header mockup */}
            <div 
              className="p-4 rounded-lg mb-4 border"
              style={{ 
                backgroundColor: settings.background_secondary,
                borderColor: settings.border_color
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {settings.agency_logo_url ? (
                    <img src={settings.agency_logo_url} alt="" className="h-8 w-auto" />
                  ) : (
                    <div className="w-8 h-8 rounded" style={{ backgroundColor: settings.primary_color }} />
                  )}
                  <div>
                    <p style={{ color: settings.primary_color }} className="text-sm font-medium">
                      {settings.agency_name || 'Nome da Agência'}
                    </p>
                    <p style={{ color: settings.text_muted }} className="text-xs">
                      {settings.agency_slogan || 'Slogan'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span style={{ color: settings.secondary_color }} className="text-sm">Imóveis</span>
                  <span style={{ color: settings.secondary_color }} className="text-sm">Equipa</span>
                  <span style={{ color: settings.secondary_color }} className="text-sm">Contactos</span>
                </div>
              </div>
            </div>

            {/* Card mockup */}
            <div 
              className="p-4 rounded-lg border"
              style={{ 
                backgroundColor: settings.background_secondary,
                borderColor: settings.border_color
              }}
            >
              <div className="h-24 rounded-lg mb-3" style={{ backgroundColor: settings.border_color }} />
              <p style={{ color: settings.text_color }} className="font-medium">Moradia T3 em Lisboa</p>
              <p style={{ color: settings.text_muted }} className="text-sm">Lisboa, Portugal</p>
              <p style={{ color: settings.primary_color }} className="font-semibold mt-2">350.000 €</p>
            </div>
          </div>
        )}
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
