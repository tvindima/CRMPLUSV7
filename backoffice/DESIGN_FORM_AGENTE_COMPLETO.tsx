/**
 * FORMULÁRIO COMPLETO DE GESTÃO DE AGENTES
 * 
 * Features:
 * - Criação/edição de agentes
 * - Upload de avatar
 * - Upload de documentos (CC, contrato, certificações)
 * - Seleção de chefe de equipa
 * - Gestão de hierarquia
 * - Campos administrativos completos
 * 
 * TODO: Implementar no backoffice em app/backoffice/agentes/
 */

import { useState } from 'react'

interface AgentFormData {
  // Dados Básicos
  name: string
  email: string
  phone: string
  photo: string | null
  
  // Hierarquia
  team_leader_id: number | null
  role: 'agent' | 'team_leader' | 'manager' | 'admin'
  
  // Redes Sociais
  linkedin_url: string | null
  facebook_url: string | null
  instagram_url: string | null
  video_url: string | null
  
  // Documentos
  documents: {
    id_card: string | null          // CC digitalizado
    contract: string | null          // Contrato de trabalho
    certifications: string[]         // Certificações (AMI, etc)
    cv: string | null                // CV
  }
  
  // Dados Administrativos
  license_number: string | null      // Número AMI
  hire_date: string | null          // Data de contratação
  tax_id: string | null             // NIF
  address: string | null
  emergency_contact: string | null
  
  // Configurações
  is_active: boolean
  can_receive_leads: boolean
  max_properties: number | null
  commission_rate: number | null    // Percentagem de comissão
}

export default function AgentForm() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Gestão de Agentes</h1>
      
      {/* SECÇÃO 1: Dados Básicos */}
      <section className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Dados Básicos</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nome Completo *</label>
            <input 
              type="text" 
              className="w-full border rounded px-3 py-2"
              placeholder="Tiago Vindima"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Email *</label>
            <input 
              type="email" 
              className="w-full border rounded px-3 py-2"
              placeholder="tiago@imoveismais.pt"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Telefone *</label>
            <input 
              type="tel" 
              className="w-full border rounded px-3 py-2"
              placeholder="+351 912 345 678"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">NIF</label>
            <input 
              type="text" 
              className="w-full border rounded px-3 py-2"
              placeholder="123456789"
            />
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Morada</label>
          <input 
            type="text" 
            className="w-full border rounded px-3 py-2"
            placeholder="Rua Example, 123, Lisboa"
          />
        </div>
      </section>
      
      {/* SECÇÃO 2: Foto de Perfil */}
      <section className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Foto de Perfil</h2>
        
        <div className="flex items-center gap-6">
          <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-gray-400">Avatar</span>
          </div>
          
          <div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded mb-2">
              Fazer Upload
            </button>
            <p className="text-sm text-gray-500">
              Recomendado: 500x500px, fundo neutro, formato JPG/PNG
            </p>
          </div>
        </div>
      </section>
      
      {/* SECÇÃO 3: Hierarquia e Equipa */}
      <section className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Hierarquia e Equipa</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Função</label>
            <select className="w-full border rounded px-3 py-2">
              <option>Agente</option>
              <option>Chefe de Equipa</option>
              <option>Manager</option>
              <option>Administrador</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Chefe de Equipa</label>
            <select className="w-full border rounded px-3 py-2">
              <option value="">Nenhum (independente)</option>
              <option value="20">Nuno Faria</option>
              <option value="21">Pedro Olaio</option>
              <option value="35">Tiago Vindima</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Número AMI</label>
            <input 
              type="text" 
              className="w-full border rounded px-3 py-2"
              placeholder="AMI 12345"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Data de Contratação</label>
            <input 
              type="date" 
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>
      </section>
      
      {/* SECÇÃO 4: Documentos */}
      <section className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Documentos</h2>
        
        <div className="space-y-4">
          <div className="border-2 border-dashed rounded p-4">
            <label className="block text-sm font-medium mb-2">
              📄 Cartão de Cidadão (CC)
            </label>
            <input 
              type="file" 
              accept=".pdf,.jpg,.png"
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">PDF, JPG ou PNG - máx 5MB</p>
          </div>
          
          <div className="border-2 border-dashed rounded p-4">
            <label className="block text-sm font-medium mb-2">
              📝 Contrato de Trabalho
            </label>
            <input 
              type="file" 
              accept=".pdf"
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">PDF - máx 10MB</p>
          </div>
          
          <div className="border-2 border-dashed rounded p-4">
            <label className="block text-sm font-medium mb-2">
              🎓 Certificações (AMI, Formações, etc)
            </label>
            <input 
              type="file" 
              multiple
              accept=".pdf,.jpg,.png"
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">Múltiplos ficheiros permitidos</p>
          </div>
          
          <div className="border-2 border-dashed rounded p-4">
            <label className="block text-sm font-medium mb-2">
              📋 Curriculum Vitae (CV)
            </label>
            <input 
              type="file" 
              accept=".pdf,.doc,.docx"
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">PDF ou Word</p>
          </div>
        </div>
      </section>
      
      {/* SECÇÃO 5: Redes Sociais e Vídeo */}
      <section className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Presença Online</h2>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">LinkedIn</label>
            <input 
              type="url" 
              className="w-full border rounded px-3 py-2"
              placeholder="https://linkedin.com/in/..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Facebook</label>
            <input 
              type="url" 
              className="w-full border rounded px-3 py-2"
              placeholder="https://facebook.com/..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Instagram</label>
            <input 
              type="url" 
              className="w-full border rounded px-3 py-2"
              placeholder="https://instagram.com/..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Vídeo de Apresentação (YouTube)</label>
            <input 
              type="url" 
              className="w-full border rounded px-3 py-2"
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
        </div>
      </section>
      
      {/* SECÇÃO 6: Configurações */}
      <section className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Configurações</h2>
        
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input type="checkbox" className="w-4 h-4" />
            <span>Agente ativo (recebe leads)</span>
          </label>
          
          <label className="flex items-center gap-3">
            <input type="checkbox" className="w-4 h-4" />
            <span>Pode receber leads automaticamente</span>
          </label>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-2">Máx. Propriedades Simultâneas</label>
              <input 
                type="number" 
                className="w-full border rounded px-3 py-2"
                placeholder="50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Taxa de Comissão (%)</label>
              <input 
                type="number" 
                step="0.1"
                className="w-full border rounded px-3 py-2"
                placeholder="3.5"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Contacto de Emergência</label>
            <input 
              type="text" 
              className="w-full border rounded px-3 py-2"
              placeholder="Nome: João Silva, Tel: +351 912 345 678"
            />
          </div>
        </div>
      </section>
      
      {/* Botões de Ação */}
      <div className="flex gap-4">
        <button className="bg-blue-600 text-white px-6 py-3 rounded font-medium">
          Guardar Agente
        </button>
        <button className="bg-gray-200 text-gray-700 px-6 py-3 rounded font-medium">
          Cancelar
        </button>
      </div>
    </div>
  )
}
