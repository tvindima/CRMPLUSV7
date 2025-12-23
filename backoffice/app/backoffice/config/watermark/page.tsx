'use client';

import { useState, useEffect, useRef } from 'react';
import { BackofficeLayout } from "@/backoffice/components/BackofficeLayout";
import { ToastProvider } from "../../../../backoffice/components/ToastProvider";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://crmplusv7-production.up.railway.app';

interface WatermarkSettings {
  watermark_enabled: boolean;
  watermark_image_url: string | null;
  watermark_opacity: number;
  watermark_scale: number;
  watermark_position: string;
}

export default function WatermarkSettingsPage() {
  const [settings, setSettings] = useState<WatermarkSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados locais para edição
  const [enabled, setEnabled] = useState(true);
  const [opacity, setOpacity] = useState(0.6);
  const [scale, setScale] = useState(0.15);
  const [position, setPosition] = useState('bottom-right');

  // Carregar settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${API_BASE}/admin/settings/watermark`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar configurações');
      }

      const data: WatermarkSettings = await response.json();
      setSettings(data);
      setEnabled(data.watermark_enabled);
      setOpacity(data.watermark_opacity);
      setScale(data.watermark_scale);
      setPosition(data.watermark_position);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`${API_BASE}/admin/settings/watermark`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          watermark_enabled: enabled,
          watermark_opacity: opacity,
          watermark_scale: scale,
          watermark_position: position,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao guardar configurações');
      }

      const data = await response.json();
      setSettings(data);
      setSuccess('✅ Configurações guardadas com sucesso!');
    } catch (err: any) {
      setError(err.message || 'Erro ao guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (file.type !== 'image/png') {
      setError('❌ Apenas ficheiros PNG são aceites (para transparência)');
      return;
    }

    // Validar tamanho
    if (file.size > 2 * 1024 * 1024) {
      setError('❌ Ficheiro muito grande. Máximo: 2MB');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);
      const token = localStorage.getItem('accessToken');

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/admin/settings/watermark/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erro ao carregar imagem');
      }

      const data = await response.json();
      setSuccess('✅ ' + data.message);
      fetchSettings(); // Recarregar settings
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar imagem');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = async () => {
    if (!confirm('Tem certeza que deseja remover a marca de água?')) return;

    try {
      setError(null);
      setSuccess(null);
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`${API_BASE}/admin/settings/watermark/image`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao remover imagem');
      }

      setSuccess('✅ Marca de água removida');
      fetchSettings();
    } catch (err: any) {
      setError(err.message || 'Erro ao remover');
    }
  };

  if (loading) {
    return (
      <ToastProvider>
        <BackofficeLayout title="Marca de Água">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#E10600]"></div>
          </div>
        </BackofficeLayout>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <BackofficeLayout title="Marca de Água">
        <div className="space-y-6 max-w-3xl">
          {/* Header */}
          <div className="rounded-lg border border-[#2A2A2E] bg-[#151518] p-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              💧 Configuração de Marca de Água
            </h2>
            <p className="mt-1 text-sm text-[#888]">
              Configure a marca de água aplicada automaticamente em todas as fotos de imóveis publicados no site.
            </p>
          </div>

          {/* Mensagens */}
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400">
              {success}
            </div>
          )}

          {/* Upload de Imagem */}
          <div className="rounded-lg border border-[#2A2A2E] bg-[#151518] p-4 space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              📤 Imagem da Marca de Água
            </h3>
            
            {settings?.watermark_image_url ? (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="relative bg-[#2A2A2E] p-4 rounded-lg">
                    <img 
                      src={settings.watermark_image_url} 
                      alt="Marca de água atual"
                      className="max-h-24 max-w-48 object-contain"
                      style={{ opacity: opacity }}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-green-400">✓ Imagem carregada</p>
                    <p className="text-xs text-[#888] mt-1 break-all">{settings.watermark_image_url}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-4 py-2 text-sm bg-[#E10600] hover:bg-[#ff1a0a] text-white rounded-lg transition disabled:opacity-50"
                  >
                    {uploading ? '⏳ A carregar...' : '🔄 Substituir Imagem'}
                  </button>
                  <button
                    onClick={handleDeleteImage}
                    className="px-4 py-2 text-sm border border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                  >
                    🗑️ Remover
                  </button>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-[#E10600]/40 rounded-lg p-8 text-center hover:border-[#E10600] hover:bg-[#E10600]/5 transition"
              >
                <div className="text-4xl mb-2">📷</div>
                <p className="text-sm text-[#E10600] font-semibold">
                  {uploading ? '⏳ A carregar...' : 'Clique para carregar PNG'}
                </p>
                <p className="text-xs text-[#888] mt-1">
                  Recomendado: Logo branco ou escuro com fundo transparente
                </p>
                <p className="text-xs text-[#666] mt-1">
                  Formato: PNG | Máximo: 2MB
                </p>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png"
              onChange={handleUploadImage}
              className="hidden"
            />
          </div>

          {/* Configurações */}
          <div className="rounded-lg border border-[#2A2A2E] bg-[#151518] p-4 space-y-5">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              ⚙️ Configurações
            </h3>

            {/* Ativar/Desativar */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-white font-medium">Marca de água ativa</label>
                <p className="text-xs text-[#888]">Aplicar marca de água em novas fotos</p>
              </div>
              <button
                onClick={() => setEnabled(!enabled)}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  enabled ? 'bg-[#E10600]' : 'bg-[#2A2A2E]'
                }`}
              >
                <span 
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    enabled ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Opacidade */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm text-white font-medium">Opacidade</label>
                <span className="text-sm text-[#E10600] font-mono">{Math.round(opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full h-2 bg-[#2A2A2E] rounded-lg appearance-none cursor-pointer slider-red"
              />
              <p className="text-xs text-[#888]">
                0% = invisível | 60% = recomendado | 100% = totalmente opaco
              </p>
            </div>

            {/* Tamanho */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm text-white font-medium">Tamanho</label>
                <span className="text-sm text-[#E10600] font-mono">{Math.round(scale * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.05"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full h-2 bg-[#2A2A2E] rounded-lg appearance-none cursor-pointer slider-red"
              />
              <p className="text-xs text-[#888]">
                Percentagem da largura da imagem (15% recomendado)
              </p>
            </div>

            {/* Posição */}
            <div className="space-y-2">
              <label className="text-sm text-white font-medium">Posição</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'top-left', label: '↖ Sup. Esq.' },
                  { value: 'top-right', label: '↗ Sup. Dir.' },
                  { value: 'center', label: '⊕ Centro' },
                  { value: 'bottom-left', label: '↙ Inf. Esq.' },
                  { value: 'bottom-right', label: '↘ Inf. Dir.' },
                ].map((pos) => (
                  <button
                    key={pos.value}
                    onClick={() => setPosition(pos.value)}
                    className={`px-3 py-2 text-xs rounded-lg border transition ${
                      position === pos.value
                        ? 'border-[#E10600] bg-[#E10600]/20 text-[#E10600]'
                        : 'border-[#2A2A2E] text-[#888] hover:border-[#444]'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          {settings?.watermark_image_url && (
            <div className="rounded-lg border border-[#2A2A2E] bg-[#151518] p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                👁️ Pré-visualização
              </h3>
              <div 
                className="relative bg-gradient-to-br from-[#2A2A2E] to-[#1A1A1E] rounded-lg overflow-hidden"
                style={{ aspectRatio: '16/9' }}
              >
                {/* Imagem de exemplo */}
                <div className="absolute inset-0 flex items-center justify-center text-[#444] text-6xl">
                  🏠
                </div>
                
                {/* Watermark preview */}
                {enabled && (
                  <div 
                    className={`absolute p-4 ${
                      position === 'top-left' ? 'top-0 left-0' :
                      position === 'top-right' ? 'top-0 right-0' :
                      position === 'bottom-left' ? 'bottom-0 left-0' :
                      position === 'bottom-right' ? 'bottom-0 right-0' :
                      'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                    }`}
                  >
                    <img 
                      src={settings.watermark_image_url} 
                      alt="Preview"
                      className="max-h-16 object-contain"
                      style={{ 
                        opacity: opacity,
                        width: `${scale * 300}px`,
                        maxWidth: '150px'
                      }}
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-[#888] text-center">
                Pré-visualização aproximada (a marca será proporcional ao tamanho real da imagem)
              </p>
            </div>
          )}

          {/* Botão Guardar */}
          <div className="flex justify-end gap-3">
            <button
              onClick={fetchSettings}
              className="px-6 py-2 text-sm border border-[#2A2A2E] text-[#888] hover:text-white hover:border-[#444] rounded-lg transition"
            >
              ↺ Cancelar
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-6 py-2 text-sm bg-[#E10600] hover:bg-[#ff1a0a] text-white rounded-lg transition disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  A guardar...
                </>
              ) : (
                '💾 Guardar Configurações'
              )}
            </button>
          </div>

          {/* Info */}
          <div className="rounded-lg border border-[#2A2A2E]/50 bg-[#0B0B0D] p-4 space-y-2">
            <h4 className="text-sm font-semibold text-[#888]">ℹ️ Informação</h4>
            <ul className="text-xs text-[#666] space-y-1">
              <li>• A marca de água é aplicada apenas em imagens novas (medium e large)</li>
              <li>• Thumbnails pequenos não recebem marca de água</li>
              <li>• Para atualizar imagens existentes, re-carregue as fotos do imóvel</li>
              <li>• Use um PNG com fundo transparente para melhor resultado</li>
            </ul>
          </div>
        </div>

        {/* CSS para sliders */}
        <style jsx>{`
          .slider-red::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #E10600;
            cursor: pointer;
          }
          .slider-red::-moz-range-thumb {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #E10600;
            cursor: pointer;
            border: none;
          }
        `}</style>
      </BackofficeLayout>
    </ToastProvider>
  );
}
