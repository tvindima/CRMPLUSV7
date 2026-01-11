/**
 * ClientsScreen - Ecrã de gestão de clientes do agente
 * 
 * Features:
 * - Lista de clientes com filtros por tipo
 * - Aniversários próximos em destaque
 * - Criação manual de clientes
 * - Edição de ficha de cliente
 * - Campo de notas editável
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://crmplusv7-production.up.railway.app';

// CRITICAL: Detectar tenant a partir do domínio (web) ou env var (nativo)
function getTenantSlug(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('imoveismais')) return 'imoveismais';
    if (hostname.includes('luiscarlosgaspar') || hostname.includes('luisgaspar')) return 'luisgaspar';
  }
  const envSlug = process.env.EXPO_PUBLIC_TENANT_SLUG || '';
  return envSlug === 'luis-gaspar' ? 'luisgaspar' : envSlug;
}
const TENANT_SLUG = getTenantSlug();

// Helper para obter headers com tenant
const getHeaders = (token?: string): Record<string, string> => {
  const headers: Record<string, string> = { 'Accept': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (TENANT_SLUG) headers['X-Tenant-Slug'] = TENANT_SLUG;
  return headers;
};

// Tipos de cliente
const CLIENT_TYPES = [
  { id: 'todos', label: 'Todos', icon: 'people', color: '#00d9ff' },
  { id: 'vendedor', label: 'Vendedores', icon: 'home', color: '#34C759' },
  { id: 'comprador', label: 'Compradores', icon: 'cart', color: '#007AFF' },
  { id: 'investidor', label: 'Investidores', icon: 'trending-up', color: '#fbbf24' },
  { id: 'arrendatario', label: 'Arrendatários', icon: 'key', color: '#8b5cf6' },
  { id: 'senhorio', label: 'Senhorios', icon: 'business', color: '#f97316' },
  { id: 'lead', label: 'Leads', icon: 'person-add', color: '#666' },
];

interface Client {
  id: number | string;  // Pode ser "lead_123" para leads do site
  agent_id: number;
  client_type: string;
  origin: string;
  nome: string;
  nif?: string;
  cc?: string;
  cc_validade?: string;
  data_nascimento?: string;
  email?: string;
  telefone?: string;
  telefone_alt?: string;
  morada?: string;
  codigo_postal?: string;
  localidade?: string;
  notas?: string;
  tags?: string[];
  created_at?: string;
  angariacao_id?: number;
  source_type?: string;  // "client" ou "website_lead"
  lead_id?: number;      // ID original da lead (se veio do site)
  status?: string;       // Status da lead (NEW, CONTACTED, etc.)
}

interface ClientFormData {
  nome: string;
  client_type: string;
  nif: string;
  cc: string;
  data_nascimento: string;
  email: string;
  telefone: string;
  telefone_alt: string;
  morada: string;
  codigo_postal: string;
  localidade: string;
  notas: string;
}

const ClientsScreen: React.FC = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState('todos');
  
  // Modals
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showClientDetailModal, setShowClientDetailModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState<ClientFormData>({
    nome: '',
    client_type: 'lead',
    nif: '',
    cc: '',
    data_nascimento: '',
    email: '',
    telefone: '',
    telefone_alt: '',
    morada: '',
    codigo_postal: '',
    localidade: '',
    notas: '',
  });
  const [saving, setSaving] = useState(false);

  // Fetch clients (incluindo leads do site)
  const fetchClients = useCallback(async () => {
    if (!user?.agent_id) return;
    
    try {
      const params = new URLSearchParams({
        agent_id: user.agent_id.toString(),
        include_leads: 'true',
      });
      
      if (selectedType !== 'todos') {
        params.append('client_type', selectedType);
      }
      if (searchText) {
        params.append('search', searchText);
      }
      
      // Usar endpoint que inclui leads do site
      // FIXED: Usar headers com X-Tenant-Slug
      const response = await fetch(`${API_URL}/clients/with-leads?${params}`, {
        headers: getHeaders(),
      });
      
      if (response.ok) {
        const data = await response.json();
        setClients(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  }, [user?.agent_id, selectedType, searchText]);

  // Fetch birthdays
  const fetchBirthdays = useCallback(async () => {
    if (!user?.agent_id) return;
    
    try {
      // FIXED: Usar headers com X-Tenant-Slug
      const response = await fetch(
        `${API_URL}/clients/birthdays?agent_id=${user.agent_id}&days_ahead=7`,
        { headers: getHeaders() }
      );
      
      if (response.ok) {
        const data = await response.json();
        setBirthdays(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching birthdays:', error);
    }
  }, [user?.agent_id]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!user?.agent_id) return;
    
    try {
      // FIXED: Usar headers com X-Tenant-Slug
      const response = await fetch(
        `${API_URL}/clients/stats?agent_id=${user.agent_id}`,
        { headers: getHeaders() }
      );
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [user?.agent_id]);

  // Load all data
  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchClients(), fetchBirthdays(), fetchStats()]);
    setLoading(false);
  }, [fetchClients, fetchBirthdays, fetchStats]);

  // Refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    fetchClients();
  }, [selectedType, searchText]);

  // Create client
  const handleCreateClient = async () => {
    if (!formData.nome.trim()) {
      Alert.alert('Erro', 'O nome é obrigatório');
      return;
    }
    if (!formData.telefone.trim()) {
      Alert.alert('Erro', 'O telefone é obrigatório');
      return;
    }
    
    setSaving(true);
    try {
      const body = {
        nome: formData.nome,
        client_type: formData.client_type,
        origin: 'manual',
        nif: formData.nif || null,
        cc: formData.cc || null,
        data_nascimento: formData.data_nascimento || null,
        email: formData.email || null,
        telefone: formData.telefone,
        telefone_alt: formData.telefone_alt || null,
        morada: formData.morada || null,
        codigo_postal: formData.codigo_postal || null,
        localidade: formData.localidade || null,
        notas: formData.notas || null,
      };
      
      const response = await fetch(
        `${API_URL}/clients/?agent_id=${user?.agent_id}`,
        {
          method: 'POST',
          headers: getHeaders('application/json'),
          body: JSON.stringify(body),
        }
      );
      
      if (response.ok) {
        Alert.alert('Sucesso', 'Cliente criado com sucesso');
        setShowNewClientModal(false);
        resetForm();
        loadData();
      } else {
        const error = await response.json();
        Alert.alert('Erro', error.detail || 'Erro ao criar cliente');
      }
    } catch (error) {
      console.error('Error creating client:', error);
      Alert.alert('Erro', 'Erro de rede');
    } finally {
      setSaving(false);
    }
  };

  // Convert website lead to client
  const convertLeadToClient = async (lead: Client): Promise<number | null> => {
    if (!user?.agent_id) return null;
    
    try {
      // Criar cliente a partir da lead
      const body = {
        nome: formData.nome,
        client_type: formData.client_type,
        origin: 'website',
        email: formData.email || null,
        telefone: formData.telefone || null,
        telefone_alt: formData.telefone_alt || null,
        morada: formData.morada || null,
        codigo_postal: formData.codigo_postal || null,
        localidade: formData.localidade || null,
        notas: formData.notas || null,
        lead_id: lead.lead_id,  // Referência à lead original
      };
      
      const params = new URLSearchParams({
        agent_id: user.agent_id.toString(),
      });
      
      const response = await fetch(
        `${API_URL}/clients/?${params}`,
        {
          method: 'POST',
          headers: getHeaders('application/json'),
          body: JSON.stringify(body),
        }
      );
      
      if (response.ok) {
        const newClient = await response.json();
        return newClient.id;
      }
      return null;
    } catch (error) {
      console.error('Error converting lead to client:', error);
      return null;
    }
  };

  // Update client
  const handleUpdateClient = async () => {
    if (!selectedClient) return;
    
    setSaving(true);
    try {
      // Se for lead do site, converter primeiro para cliente
      if (selectedClient.source_type === 'website_lead') {
        const newClientId = await convertLeadToClient(selectedClient);
        if (newClientId) {
          Alert.alert('Sucesso', 'Lead convertida em cliente com sucesso');
          setShowClientDetailModal(false);
          setSelectedClient(null);
          loadData();
        } else {
          Alert.alert('Erro', 'Erro ao converter lead em cliente');
        }
        return;
      }
      
      // Atualizar cliente normal
      const body = {
        nome: formData.nome,
        client_type: formData.client_type,
        nif: formData.nif || null,
        cc: formData.cc || null,
        data_nascimento: formData.data_nascimento || null,
        email: formData.email || null,
        telefone: formData.telefone,
        telefone_alt: formData.telefone_alt || null,
        morada: formData.morada || null,
        codigo_postal: formData.codigo_postal || null,
        localidade: formData.localidade || null,
        notas: formData.notas || null,
      };
      
      const response = await fetch(
        `${API_URL}/clients/${selectedClient.id}`,
        {
          method: 'PUT',
          headers: getHeaders('application/json'),
          body: JSON.stringify(body),
        }
      );
      
      if (response.ok) {
        Alert.alert('Sucesso', 'Cliente atualizado com sucesso');
        setShowClientDetailModal(false);
        setSelectedClient(null);
        loadData();
      } else {
        const error = await response.json();
        Alert.alert('Erro', error.detail || 'Erro ao atualizar cliente');
      }
    } catch (error) {
      console.error('Error updating client:', error);
      Alert.alert('Erro', 'Erro de rede');
    } finally {
      setSaving(false);
    }
  };

  // Delete client
  const handleDeleteClient = () => {
    if (!selectedClient) return;
    
    // Não permitir eliminar leads do site diretamente
    if (selectedClient.source_type === 'website_lead') {
      Alert.alert(
        'Lead do Site',
        'Esta é uma lead do site. Para remover, gerencie pelo backoffice na seção de Leads.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    Alert.alert(
      'Eliminar Cliente',
      `Tem certeza que deseja eliminar ${selectedClient.nome}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(
                `${API_URL}/clients/${selectedClient.id}`,
                { method: 'DELETE', headers: getHeaders() }
              );
              
              if (response.ok) {
                Alert.alert('Sucesso', 'Cliente removido');
                setShowClientDetailModal(false);
                setSelectedClient(null);
                loadData();
              }
            } catch (error) {
              console.error('Error deleting client:', error);
            }
          },
        },
      ]
    );
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      nome: '',
      client_type: 'lead',
      nif: '',
      cc: '',
      data_nascimento: '',
      email: '',
      telefone: '',
      telefone_alt: '',
      morada: '',
      codigo_postal: '',
      localidade: '',
      notas: '',
    });
  };

  // Open client detail
  const openClientDetail = (client: Client) => {
    setSelectedClient(client);
    setFormData({
      nome: client.nome,
      client_type: client.client_type,
      nif: client.nif || '',
      cc: client.cc || '',
      data_nascimento: client.data_nascimento || '',
      email: client.email || '',
      telefone: client.telefone || '',
      telefone_alt: client.telefone_alt || '',
      morada: client.morada || '',
      codigo_postal: client.codigo_postal || '',
      localidade: client.localidade || '',
      notas: client.notas || '',
    });
    setShowClientDetailModal(true);
  };

  // Get type info
  const getTypeInfo = (type: string) => {
    return CLIENT_TYPES.find(t => t.id === type) || CLIENT_TYPES[0];
  };

  // Format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-PT');
  };

  // Render birthday card
  const renderBirthdayCard = () => {
    if (birthdays.length === 0) return null;
    
    return (
      <View style={styles.birthdayCard}>
        <View style={styles.birthdayHeader}>
          <Text style={styles.birthdayTitle}>🎂 Aniversários Esta Semana</Text>
        </View>
        {birthdays.slice(0, 3).map((client, idx) => (
          <TouchableOpacity
            key={client.id}
            style={styles.birthdayItem}
            onPress={() => openClientDetail(client)}
          >
            <View style={styles.birthdayInfo}>
              <Text style={styles.birthdayName}>{client.nome}</Text>
              <Text style={styles.birthdayDate}>
                {client.days_until_birthday === 0 ? 'Hoje!' :
                 client.days_until_birthday === 1 ? 'Amanhã' :
                 `Em ${client.days_until_birthday} dias`} • {client.age} anos
              </Text>
            </View>
            <View style={styles.birthdayActions}>
              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => {/* Open phone */}}
              >
                <Ionicons name="call" size={18} color="#34C759" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Render client item
  const renderClientItem = ({ item }: { item: Client }) => {
    const typeInfo = getTypeInfo(item.client_type);
    const isWebsiteLead = item.source_type === 'website_lead';
    
    return (
      <TouchableOpacity
        style={[styles.clientCard, isWebsiteLead && styles.clientCardLead]}
        onPress={() => openClientDetail(item)}
      >
        <View style={[styles.clientAvatar, { backgroundColor: typeInfo.color + '20' }]}>
          <Ionicons name={typeInfo.icon as any} size={24} color={typeInfo.color} />
        </View>
        <View style={styles.clientInfo}>
          <View style={styles.clientNameRow}>
            <Text style={styles.clientName}>{item.nome}</Text>
            {isWebsiteLead && (
              <View style={styles.websiteLeadBadge}>
                <Text style={styles.websiteLeadBadgeText}>Site</Text>
              </View>
            )}
          </View>
          <Text style={styles.clientType}>
            {typeInfo.label} • {
              isWebsiteLead ? 'Lead do Site' : 
              item.origin === 'angariacao' ? 'Via Angariação' : 
              item.origin === 'website' ? 'Site' : 'Manual'
            }
          </Text>
          {item.telefone && (
            <Text style={styles.clientContact}>📱 {item.telefone}</Text>
          )}
          {isWebsiteLead && item.status && (
            <Text style={[styles.clientContact, { color: '#f59e0b' }]}>
              Estado: {item.status}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>
    );
  };

  // Render filter chips
  const renderFilterChips = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filtersContainer}
    >
      {CLIENT_TYPES.map(type => (
        <TouchableOpacity
          key={type.id}
          style={[
            styles.filterChip,
            selectedType === type.id && styles.filterChipActive,
            selectedType === type.id && { backgroundColor: type.color + '20', borderColor: type.color },
          ]}
          onPress={() => setSelectedType(type.id)}
        >
          <Ionicons 
            name={type.icon as any} 
            size={16} 
            color={selectedType === type.id ? type.color : '#888'} 
          />
          <Text style={[
            styles.filterChipText,
            selectedType === type.id && { color: type.color },
          ]}>
            {type.label}
            {stats && type.id !== 'todos' && (
              <Text> ({stats.by_type?.[type.id] || 0})</Text>
            )}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // Render form field
  const renderFormField = (
    label: string, 
    value: string, 
    onChange: (text: string) => void,
    options?: { 
      keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
      multiline?: boolean;
      placeholder?: string;
    }
  ) => (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={[styles.formInput, options?.multiline && styles.formInputMultiline]}
        value={value}
        onChangeText={onChange}
        keyboardType={options?.keyboardType || 'default'}
        multiline={options?.multiline}
        numberOfLines={options?.multiline ? 4 : 1}
        placeholder={options?.placeholder}
        placeholderTextColor="#666"
      />
    </View>
  );

  // Render type selector
  const renderTypeSelector = () => (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>Tipo de Cliente *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.typeSelector}>
          {CLIENT_TYPES.filter(t => t.id !== 'todos').map(type => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeOption,
                formData.client_type === type.id && styles.typeOptionActive,
                formData.client_type === type.id && { borderColor: type.color },
              ]}
              onPress={() => setFormData({ ...formData, client_type: type.id })}
            >
              <Ionicons 
                name={type.icon as any} 
                size={20} 
                color={formData.client_type === type.id ? type.color : '#666'} 
              />
              <Text style={[
                styles.typeOptionText,
                formData.client_type === type.id && { color: type.color },
              ]}>
                {type.label.replace('es', '').replace('dor', 'dor')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  // New Client Modal
  const renderNewClientModal = () => (
    <Modal
      visible={showNewClientModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowNewClientModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowNewClientModal(false)}>
            <Text style={styles.modalCancel}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Novo Cliente</Text>
          <TouchableOpacity onPress={handleCreateClient} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color="#00d9ff" />
            ) : (
              <Text style={styles.modalSave}>Guardar</Text>
            )}
          </TouchableOpacity>
        </View>
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView style={styles.modalContent}>
            {renderTypeSelector()}
            
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Dados Pessoais</Text>
              {renderFormField('Nome Completo *', formData.nome, 
                (text) => setFormData({ ...formData, nome: text }))}
              
              <View style={styles.formRow}>
                {renderFormField('NIF', formData.nif, 
                  (text) => setFormData({ ...formData, nif: text }),
                  { keyboardType: 'numeric' })}
                {renderFormField('Nº CC', formData.cc, 
                  (text) => setFormData({ ...formData, cc: text }))}
              </View>
              
              {renderFormField('Data de Nascimento', formData.data_nascimento, 
                (text) => setFormData({ ...formData, data_nascimento: text }),
                { placeholder: 'DD/MM/AAAA' })}
            </View>
            
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Contactos</Text>
              {renderFormField('Telefone *', formData.telefone, 
                (text) => setFormData({ ...formData, telefone: text }),
                { keyboardType: 'phone-pad' })}
              {renderFormField('Telefone Alternativo', formData.telefone_alt, 
                (text) => setFormData({ ...formData, telefone_alt: text }),
                { keyboardType: 'phone-pad' })}
              {renderFormField('Email', formData.email, 
                (text) => setFormData({ ...formData, email: text }),
                { keyboardType: 'email-address' })}
            </View>
            
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Morada</Text>
              {renderFormField('Morada', formData.morada, 
                (text) => setFormData({ ...formData, morada: text }))}
              <View style={styles.formRow}>
                {renderFormField('Código Postal', formData.codigo_postal, 
                  (text) => setFormData({ ...formData, codigo_postal: text }))}
                {renderFormField('Localidade', formData.localidade, 
                  (text) => setFormData({ ...formData, localidade: text }))}
              </View>
            </View>
            
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Notas</Text>
              {renderFormField('Notas / Observações', formData.notas, 
                (text) => setFormData({ ...formData, notas: text }),
                { multiline: true, placeholder: 'Adicione notas relevantes sobre o cliente...' })}
            </View>
            
            <View style={{ height: 50 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );

  // Client Detail Modal
  const renderClientDetailModal = () => {
    if (!selectedClient) return null;
    const typeInfo = getTypeInfo(selectedClient.client_type);
    
    return (
      <Modal
        visible={showClientDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowClientDetailModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowClientDetailModal(false)}>
              <Text style={styles.modalCancel}>Fechar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Ficha de Cliente</Text>
            <TouchableOpacity onPress={handleUpdateClient} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#00d9ff" />
              ) : (
                <Text style={styles.modalSave}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
          
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <ScrollView style={styles.modalContent}>
              {/* Header do cliente */}
              <View style={styles.detailHeader}>
                <View style={[styles.detailAvatar, { backgroundColor: typeInfo.color + '20' }]}>
                  <Ionicons name={typeInfo.icon as any} size={40} color={typeInfo.color} />
                </View>
                <Text style={styles.detailName}>{selectedClient.nome}</Text>
                <View style={[styles.detailBadge, { backgroundColor: typeInfo.color + '20' }]}>
                  <Text style={[styles.detailBadgeText, { color: typeInfo.color }]}>
                    {typeInfo.label}
                  </Text>
                </View>
                {selectedClient.source_type === 'website_lead' && (
                  <View style={styles.websiteLeadInfoBanner}>
                    <Ionicons name="globe-outline" size={16} color="#f59e0b" />
                    <Text style={styles.websiteLeadInfoText}>
                      Lead do Site • {selectedClient.status || 'Nova'}
                    </Text>
                  </View>
                )}
                {selectedClient.origin === 'angariacao' && (
                  <Text style={styles.detailOrigin}>Via Angariação</Text>
                )}
              </View>
              
              {/* Banner de conversão para leads do site */}
              {selectedClient.source_type === 'website_lead' && (
                <View style={styles.convertBanner}>
                  <Ionicons name="information-circle" size={20} color="#f59e0b" />
                  <Text style={styles.convertBannerText}>
                    Esta é uma lead do site. Ao guardar, será convertida em cliente.
                  </Text>
                </View>
              )}
              
              {/* Quick Actions */}
              <View style={styles.quickActions}>
                <TouchableOpacity style={styles.quickActionBtn}>
                  <Ionicons name="call" size={24} color="#34C759" />
                  <Text style={styles.quickActionText}>Ligar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionBtn}>
                  <Ionicons name="mail" size={24} color="#007AFF" />
                  <Text style={styles.quickActionText}>Email</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionBtn}>
                  <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                  <Text style={styles.quickActionText}>WhatsApp</Text>
                </TouchableOpacity>
              </View>
              
              {/* Form editável */}
              {renderTypeSelector()}
              
              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>Dados Pessoais</Text>
                {renderFormField('Nome Completo *', formData.nome, 
                  (text) => setFormData({ ...formData, nome: text }))}
                
                <View style={styles.formRow}>
                  {renderFormField('NIF', formData.nif, 
                    (text) => setFormData({ ...formData, nif: text }),
                    { keyboardType: 'numeric' })}
                  {renderFormField('Nº CC', formData.cc, 
                    (text) => setFormData({ ...formData, cc: text }))}
                </View>
                
                {renderFormField('Data de Nascimento', formData.data_nascimento, 
                  (text) => setFormData({ ...formData, data_nascimento: text }),
                  { placeholder: 'DD/MM/AAAA' })}
              </View>
              
              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>Contactos</Text>
                {renderFormField('Telefone *', formData.telefone, 
                  (text) => setFormData({ ...formData, telefone: text }),
                  { keyboardType: 'phone-pad' })}
                {renderFormField('Telefone Alternativo', formData.telefone_alt, 
                  (text) => setFormData({ ...formData, telefone_alt: text }),
                  { keyboardType: 'phone-pad' })}
                {renderFormField('Email', formData.email, 
                  (text) => setFormData({ ...formData, email: text }),
                  { keyboardType: 'email-address' })}
              </View>
              
              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>Morada</Text>
                {renderFormField('Morada', formData.morada, 
                  (text) => setFormData({ ...formData, morada: text }))}
                <View style={styles.formRow}>
                  {renderFormField('Código Postal', formData.codigo_postal, 
                    (text) => setFormData({ ...formData, codigo_postal: text }))}
                  {renderFormField('Localidade', formData.localidade, 
                    (text) => setFormData({ ...formData, localidade: text }))}
                </View>
              </View>
              
              {/* Notas - Campo destacado */}
              <View style={styles.formSection}>
                <View style={styles.notesSectionHeader}>
                  <Text style={styles.formSectionTitle}>📝 Notas</Text>
                </View>
                <TextInput
                  style={styles.notesInput}
                  value={formData.notas}
                  onChangeText={(text) => setFormData({ ...formData, notas: text })}
                  multiline
                  numberOfLines={6}
                  placeholder="Adicione notas relevantes sobre o cliente...&#10;&#10;Ex: Preferências, histórico de contacto, observações importantes..."
                  placeholderTextColor="#555"
                  textAlignVertical="top"
                />
              </View>
              
              {/* Info de criação */}
              <View style={styles.infoSection}>
                <Text style={styles.infoText}>
                  Cliente criado em {formatDate(selectedClient.created_at)}
                </Text>
              </View>
              
              {/* Botão eliminar */}
              <TouchableOpacity 
                style={styles.deleteBtn}
                onPress={handleDeleteClient}
              >
                <Ionicons name="trash" size={20} color="#FF3B30" />
                <Text style={styles.deleteBtnText}>Eliminar Cliente</Text>
              </TouchableOpacity>
              
              <View style={{ height: 50 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00d9ff" />
        <Text style={styles.loadingText}>A carregar clientes...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1a1f2e', '#0a0e1a']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>👥 Os Meus Clientes</Text>
          <TouchableOpacity 
            style={styles.addBtn}
            onPress={() => {
              resetForm();
              setShowNewClientModal(true);
            }}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {/* Stats */}
        {stats && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total || 0}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#34C759' }]}>{stats.vendedores || 0}</Text>
              <Text style={styles.statLabel}>Vendedores</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#007AFF' }]}>{stats.compradores || 0}</Text>
              <Text style={styles.statLabel}>Compradores</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#fbbf24' }]}>{stats.investidores || 0}</Text>
              <Text style={styles.statLabel}>Investidores</Text>
            </View>
          </View>
        )}
        
        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar por nome, NIF ou telefone..."
            placeholderTextColor="#666"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>
      </LinearGradient>
      
      {/* Filters */}
      {renderFilterChips()}
      
      {/* Content */}
      <FlatList
        data={clients}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderClientItem}
        ListHeaderComponent={renderBirthdayCard}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={60} color="#333" />
            <Text style={styles.emptyText}>Nenhum cliente encontrado</Text>
            <Text style={styles.emptySubtext}>
              {searchText ? 'Tente uma pesquisa diferente' : 'Adicione o seu primeiro cliente'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00d9ff" />
        }
      />
      
      {/* Modals */}
      {renderNewClientModal()}
      {renderClientDetailModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0e1a',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
  },
  header: {
    padding: 16,
    paddingTop: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00d9ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00d9ff',
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1f2e',
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: '#fff',
    fontSize: 15,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1f2e',
    borderWidth: 1,
    borderColor: '#333',
    marginRight: 8,
  },
  filterChipActive: {
    borderWidth: 1,
  },
  filterChipText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  birthdayCard: {
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  birthdayHeader: {
    marginBottom: 12,
  },
  birthdayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fbbf24',
  },
  birthdayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  birthdayInfo: {
    flex: 1,
  },
  birthdayName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  birthdayDate: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  birthdayActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0a0e1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  clientCardLead: {
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  clientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clientInfo: {
    flex: 1,
  },
  clientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  websiteLeadBadge: {
    backgroundColor: '#f59e0b20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  websiteLeadBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#f59e0b',
  },
  clientType: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  clientContact: {
    fontSize: 13,
    color: '#00d9ff',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#0a0e1a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  modalCancel: {
    fontSize: 16,
    color: '#888',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00d9ff',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formSection: {
    marginBottom: 24,
  },
  formSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#00d9ff',
    marginBottom: 12,
  },
  formField: {
    marginBottom: 12,
    flex: 1,
  },
  formLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: '#1a1f2e',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  formInputMultiline: {
    height: 100,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  typeOption: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1a1f2e',
    minWidth: 80,
  },
  typeOptionActive: {
    backgroundColor: '#1a1f2e',
    borderWidth: 2,
  },
  typeOptionText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1a1f2e',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  datePickerText: {
    color: '#fff',
    fontSize: 15,
  },
  // Detail modal
  detailHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 20,
  },
  detailAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  detailBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  detailBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  detailOrigin: {
    fontSize: 13,
    color: '#888',
    marginTop: 8,
  },
  websiteLeadInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f59e0b15',
    borderRadius: 20,
  },
  websiteLeadInfoText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500',
  },
  convertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f59e0b15',
    borderWidth: 1,
    borderColor: '#f59e0b40',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    marginHorizontal: 16,
  },
  convertBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#f59e0b',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 24,
  },
  quickActionBtn: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#1a1f2e',
    minWidth: 70,
  },
  quickActionText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  notesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notesInput: {
    backgroundColor: '#1a1f2e',
    borderRadius: 10,
    padding: 14,
    color: '#fff',
    fontSize: 15,
    minHeight: 150,
    borderWidth: 1,
    borderColor: '#00d9ff33',
    textAlignVertical: 'top',
  },
  infoSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF3B30',
    marginTop: 10,
  },
  deleteBtnText: {
    fontSize: 15,
    color: '#FF3B30',
    fontWeight: '500',
  },
});

export default ClientsScreen;
