'use client';

import { useState, useEffect } from 'react';
import {
  Car, Home, Briefcase, Box, Bed, Tag, DollarSign, Ruler, 
  List, Clipboard, Map, Eye, FileText, Settings, Leaf, 
  Users, Calendar, Check, Package, Folder
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://crmplusv7-production.up.railway.app';

// Mapeamento de ícones
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  tag: Tag,
  home: Home,
  car: Car,
  currency: DollarSign,
  ruler: Ruler,
  list: List,
  clipboard: Clipboard,
  map: Map,
  eye: Eye,
  text: FileText,
  settings: Settings,
  leaf: Leaf,
  users: Users,
  calendar: Calendar,
  check: Check,
  package: Package,
  box: Box,
  bed: Bed,
  briefcase: Briefcase,
  folder: Folder,
};

interface FieldOption {
  value: string;
  label: string;
}

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'textarea' | 'checkbox' | 'date' | 'currency' | 'file';
  required: boolean;
  options: FieldOption[];
  placeholder: string;
  help_text: string;
  unit: string;
  min_value: number | null;
  max_value: number | null;
  section: string;
  order: number;
  depends_on: string | null;
  api_field: string;
}

interface FormSection {
  key: string;
  label: string;
  icon: string;
}

interface FormConfig {
  sector: string;
  sections: FormSection[];
  fields: FormField[];
  fields_by_section: Record<string, FormField[]>;
}

interface DynamicFormFieldsProps {
  sector: string;
  values: Record<string, any>;
  onChange: (name: string, value: any) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

export function DynamicFormFields({
  sector,
  values,
  onChange,
  errors = {},
  disabled = false,
}: DynamicFormFieldsProps) {
  const [config, setConfig] = useState<FormConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch(`${API_URL}/platform/form-fields/${sector}`);
        if (response.ok) {
          const data = await response.json();
          setConfig(data);
          // Expandir todas as seções por defeito
          const expanded: Record<string, boolean> = {};
          data.sections.forEach((s: FormSection) => {
            expanded[s.key] = true;
          });
          setExpandedSections(expanded);
        }
      } catch (error) {
        console.error('Error loading form config:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [sector]);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const renderField = (field: FormField) => {
    // Verificar dependência
    if (field.depends_on && !values[field.depends_on]) {
      return null;
    }

    const error = errors[field.name];
    const baseInputClass = `w-full px-4 py-2 bg-background border rounded-lg text-white focus:outline-none focus:border-primary ${
      error ? 'border-danger' : 'border-border'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;

    const value = values[field.name] ?? '';

    switch (field.type) {
      case 'text':
      case 'date':
        return (
          <div key={field.name} className="space-y-1">
            <label className="block text-sm text-text-muted">
              {field.label}
              {field.required && <span className="text-danger ml-1">*</span>}
            </label>
            <div className="relative">
              <input
                type={field.type === 'date' ? 'date' : 'text'}
                value={value}
                onChange={(e) => onChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                disabled={disabled}
                className={baseInputClass}
              />
              {field.unit && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">
                  {field.unit}
                </span>
              )}
            </div>
            {field.help_text && (
              <p className="text-xs text-text-muted">{field.help_text}</p>
            )}
            {error && <p className="text-xs text-danger">{error}</p>}
          </div>
        );

      case 'number':
      case 'currency':
        return (
          <div key={field.name} className="space-y-1">
            <label className="block text-sm text-text-muted">
              {field.label}
              {field.required && <span className="text-danger ml-1">*</span>}
            </label>
            <div className="relative">
              {field.type === 'currency' && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                  €
                </span>
              )}
              <input
                type="number"
                value={value}
                onChange={(e) => onChange(field.name, e.target.value ? parseFloat(e.target.value) : null)}
                placeholder={field.placeholder}
                disabled={disabled}
                min={field.min_value ?? undefined}
                max={field.max_value ?? undefined}
                className={`${baseInputClass} ${field.type === 'currency' ? 'pl-8' : ''} ${field.unit ? 'pr-12' : ''}`}
              />
              {field.unit && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">
                  {field.unit}
                </span>
              )}
            </div>
            {field.help_text && (
              <p className="text-xs text-text-muted">{field.help_text}</p>
            )}
            {error && <p className="text-xs text-danger">{error}</p>}
          </div>
        );

      case 'select':
        return (
          <div key={field.name} className="space-y-1">
            <label className="block text-sm text-text-muted">
              {field.label}
              {field.required && <span className="text-danger ml-1">*</span>}
            </label>
            <select
              value={value}
              onChange={(e) => onChange(field.name, e.target.value)}
              disabled={disabled}
              className={baseInputClass}
            >
              <option value="">Selecionar...</option>
              {field.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {field.help_text && (
              <p className="text-xs text-text-muted">{field.help_text}</p>
            )}
            {error && <p className="text-xs text-danger">{error}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.name} className="space-y-1 col-span-2">
            <label className="block text-sm text-text-muted">
              {field.label}
              {field.required && <span className="text-danger ml-1">*</span>}
            </label>
            <textarea
              value={value}
              onChange={(e) => onChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              disabled={disabled}
              rows={4}
              className={baseInputClass}
            />
            {field.help_text && (
              <p className="text-xs text-text-muted">{field.help_text}</p>
            )}
            {error && <p className="text-xs text-danger">{error}</p>}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.name} className="flex items-center gap-3">
            <input
              type="checkbox"
              id={field.name}
              checked={!!value}
              onChange={(e) => onChange(field.name, e.target.checked)}
              disabled={disabled}
              className="w-5 h-5 rounded border-border bg-background text-primary focus:ring-primary"
            />
            <label htmlFor={field.name} className="text-sm text-white">
              {field.label}
            </label>
            {field.help_text && (
              <span className="text-xs text-text-muted">({field.help_text})</span>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-8 text-text-muted">
        Erro ao carregar configuração do formulário
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {config.sections.map((section) => {
        const sectionFields = config.fields_by_section[section.key] || [];
        if (sectionFields.length === 0) return null;

        const Icon = ICON_MAP[section.icon] || Tag;
        const isExpanded = expandedSections[section.key];

        // Separar checkboxes dos outros campos
        const checkboxFields = sectionFields.filter(f => f.type === 'checkbox');
        const otherFields = sectionFields.filter(f => f.type !== 'checkbox');

        return (
          <div key={section.key} className="bg-background-secondary rounded-xl border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection(section.key)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-background/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-white">{section.label}</h3>
                <span className="text-xs text-text-muted">
                  ({sectionFields.length} {sectionFields.length === 1 ? 'campo' : 'campos'})
                </span>
              </div>
              <svg
                className={`w-5 h-5 text-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isExpanded && (
              <div className="px-6 pb-6 pt-2">
                {/* Campos normais em grid */}
                {otherFields.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {otherFields.map(renderField)}
                  </div>
                )}

                {/* Checkboxes em linha */}
                {checkboxFields.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-4 border-t border-border">
                    {checkboxFields.map(renderField)}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Hook para usar os campos do formulário
export function useFormFields(sector: string) {
  const [config, setConfig] = useState<FormConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch(`${API_URL}/platform/form-fields/${sector}`);
        if (response.ok) {
          setConfig(await response.json());
        }
      } catch (error) {
        console.error('Error loading form config:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [sector]);

  // Criar objeto inicial com valores padrão
  const getInitialValues = (): Record<string, any> => {
    if (!config) return {};
    
    const values: Record<string, any> = {};
    config.fields.forEach(field => {
      if (field.type === 'checkbox') {
        values[field.name] = false;
      } else if (field.type === 'number' || field.type === 'currency') {
        values[field.name] = null;
      } else {
        values[field.name] = '';
      }
    });
    return values;
  };

  // Validar valores
  const validate = (values: Record<string, any>): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    if (!config) return errors;

    config.fields.forEach(field => {
      const value = values[field.name];
      
      if (field.required) {
        if (value === null || value === undefined || value === '') {
          errors[field.name] = `${field.label} é obrigatório`;
        }
      }

      if (field.min_value !== null && typeof value === 'number' && value < field.min_value) {
        errors[field.name] = `Valor mínimo: ${field.min_value}`;
      }

      if (field.max_value !== null && typeof value === 'number' && value > field.max_value) {
        errors[field.name] = `Valor máximo: ${field.max_value}`;
      }
    });

    return errors;
  };

  // Converter para payload da API
  const toApiPayload = (values: Record<string, any>): Record<string, any> => {
    if (!config) return values;

    const payload: Record<string, any> = {};
    
    config.fields.forEach(field => {
      const apiKey = field.api_field || field.name;
      payload[apiKey] = values[field.name];
    });

    return payload;
  };

  return {
    config,
    loading,
    getInitialValues,
    validate,
    toApiPayload,
  };
}
