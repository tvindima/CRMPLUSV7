/**
 * LeadsScreen V4 - Fiel ao mockup
 * Avatar real, tabs, cards com foto, última interação, status badges
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type RootStackParamList = {
  NewLead: undefined;
  LeadDetail: { id: number };
  [key: string]: any;
};

type TabType = 'progress' | 'new' | 'converted';

interface Lead {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  status: string;
  budget?: number;
  origin?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  property_interest?: string;
  property_location?: string;
  avatar_url?: string;
  last_contact?: string;
  last_contact_type?: string;
  scheduled_time?: string;
}

interface AgentProfile {
  photo?: string;
  avatar_url?: string;
}

const TABS: { label: string; value: TabType }[] = [
  { label: 'Em Progresso', value: 'progress' },
  { label: 'Novos', value: 'new' },
  { label: 'Convertidos', value: 'converted' },
];

export default function LeadsScreenV4() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<{ params?: { refresh?: number } }, 'params'>>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('progress');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);

  useEffect(() => {
    loadAgentProfile();
  }, []);

  useEffect(() => {
    loadLeads();
  }, [activeTab]);

  // ✅ NOVO: Recarregar quando voltar de NewLead
  useFocusEffect(
    React.useCallback(() => {
      if (route.params?.refresh) {
        loadLeads(); // Chama função existente que faz GET /mobile/leads
        
        // Limpar parâmetro para não recarregar múltiplas vezes
        navigation.setParams({ refresh: undefined } as any);
      }
    }, [route.params?.refresh])
  );

  const loadAgentProfile = async () => {
    try {
      // Use dashboard stats to get agent_id, then load agent details
      const statsResponse = await apiService.get<any>('/mobile/dashboard/stats');
      if (statsResponse?.agent_id) {
        try {
          const agentResponse = await apiService.get<any>(`/agents/${statsResponse.agent_id}`);
          if (agentResponse) {
            setAgentProfile({
              photo: agentResponse.photo,
              avatar_url: agentResponse.avatar_url,
            });
          }
        } catch (agentError) {
          console.log('Could not load agent profile');
        }
      }
    } catch (error) {
      console.error('Error loading agent profile:', error);
    }
  };

  const loadLeads = async () => {
    try {
      setLoading(true);
      let statusFilter = '';
      switch (activeTab) {
        case 'new':
          statusFilter = '&status=new';
          break;
        case 'converted':
          statusFilter = '&status=converted';
          break;
        case 'progress':
          statusFilter = '&status=contacted,qualified,negotiation';
          break;
      }
      const response = await apiService.get<any>(`/mobile/leads?my_leads=true${statusFilter}`);
      setLeads(response.items || response || []);
    } catch (error) {
      console.error('Error loading leads:', error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeads();
    setRefreshing(false);
  };

  const getAvatarUrl = () => {
    if (agentProfile?.photo) return agentProfile.photo;
    if (agentProfile?.avatar_url?.startsWith('/')) {
      // Usar URL do web Vercel para avatares públicos
      return `https://web-nymbcws7r-toinos-projects.vercel.app${agentProfile.avatar_url}`;
    }
    return agentProfile?.avatar_url || null;
  };

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'new':
        return { label: 'Novo', color: '#00d9ff', bg: '#00d9ff20' };
      case 'contacted':
        return { label: 'Em Contacto', color: '#8b5cf6', bg: '#8b5cf620' };
      case 'qualified':
        return { label: 'Qualificado', color: '#10b981', bg: '#10b98120' };
      case 'negotiation':
        return { label: 'Em Negociação', color: '#f59e0b', bg: '#f59e0b20' };
      case 'converted':
        return { label: 'Convertido', color: '#10b981', bg: '#10b98120' };
      case 'lost':
        return { label: 'Perdido', color: '#ef4444', bg: '#ef444420' };
      default:
        return { label: status || 'N/A', color: '#6b7280', bg: '#6b728020' };
    }
  };

  const getLastContactInfo = (lead: Lead) => {
    const hours = Math.floor(Math.random() * 72) + 1; // Mock - em produção vem da API
    if (hours < 24) return { text: `Ligou há ${hours}h`, icon: 'call-outline' as const };
    const days = Math.floor(hours / 24);
    return { text: `Emailed há ${days}d`, icon: 'mail-outline' as const };
  };

  const formatBudget = (budget?: number) => {
    if (!budget) return '';
    return `€${Math.round(budget / 1000)}k`;
  };

  const avatarUrl = getAvatarUrl();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leads</Text>
        <View style={styles.headerRight}>
          {/* Botão para Os Meus Clientes */}
          <TouchableOpacity 
            style={styles.clientsButton}
            onPress={() => navigation.navigate('Clients')}
          >
            <Ionicons name="people" size={22} color="#00d9ff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Perfil')}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <LinearGradient colors={['#00d9ff', '#d946ef']} style={styles.avatarGradient}>
                <Text style={styles.avatarInitial}>{user?.name?.[0] || 'A'}</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            style={[styles.tab, activeTab === tab.value && styles.tabActive]}
            onPress={() => setActiveTab(tab.value)}
          >
            <Text style={[styles.tabText, activeTab === tab.value && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* + Novo Lead Button */}
      <TouchableOpacity
        style={styles.newLeadButton}
        onPress={() => navigation.navigate('NewLead')}
      >
        <LinearGradient
          colors={['#00d9ff', '#0099cc']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.newLeadGradient}
        >
          <Ionicons name="add" size={20} color="#ffffff" />
          <Text style={styles.newLeadText}>Novo Lead</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Leads List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00d9ff" />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#00d9ff" style={{ marginTop: 40 }} />
        ) : leads.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#6b7280" />
            <Text style={styles.emptyText}>Sem leads nesta categoria</Text>
          </View>
        ) : (
          leads.map((lead) => {
            const statusConfig = getStatusConfig(lead.status);
            const lastContact = getLastContactInfo(lead);
            
            return (
              <TouchableOpacity
                key={lead.id}
                style={styles.leadCard}
                onPress={() => navigation.navigate('LeadDetail', { id: lead.id })}
              >
                {/* Avatar */}
                <View style={styles.leadAvatar}>
                  {lead.avatar_url ? (
                    <Image source={{ uri: lead.avatar_url }} style={styles.leadAvatarImage} />
                  ) : (
                    <LinearGradient
                      colors={['#374151', '#1f2937']}
                      style={styles.leadAvatarPlaceholder}
                    >
                      <Text style={styles.leadAvatarInitial}>{lead.name?.[0] || '?'}</Text>
                    </LinearGradient>
                  )}
                  {/* Cyan ring for new/active */}
                  {lead.status === 'new' && <View style={styles.leadAvatarRing} />}
                </View>

                {/* Lead Info */}
                <View style={styles.leadInfo}>
                  <View style={styles.leadHeader}>
                    <Text style={styles.leadName} numberOfLines={1}>{lead.name}</Text>
                    {lead.scheduled_time && (
                      <Text style={styles.scheduledTime}>{lead.scheduled_time}</Text>
                    )}
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                      <Text style={[styles.statusText, { color: statusConfig.color }]}>
                        {statusConfig.label}
                      </Text>
                    </View>
                  </View>

                  {/* Property interest */}
                  <Text style={styles.leadProperty} numberOfLines={1}>
                    {lead.property_interest || 'Apartamento'}
                  </Text>
                  <Text style={styles.leadLocation} numberOfLines={1}>
                    {lead.property_location || 'Lisboa'}
                  </Text>

                  {/* Meta row: last contact + budget */}
                  <View style={styles.leadMeta}>
                    <View style={styles.lastContactContainer}>
                      <View style={[styles.statusDot, { backgroundColor: '#00d9ff' }]} />
                      <Text style={styles.lastContactText}>{lastContact.text}</Text>
                      <Ionicons name={lastContact.icon} size={12} color="#9ca3af" />
                    </View>
                    <View style={styles.budgetContainer}>
                      <Text style={styles.budgetText}>{formatBudget(lead.budget) || '€2 11h'}</Text>
                      <Ionicons name="chatbubble-outline" size={12} color="#9ca3af" />
                    </View>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#00d9ff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clientsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a1f2e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00d9ff33',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#d946ef',
  },
  avatarGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#2a2f3e',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  newLeadButton: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  newLeadGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  newLeadText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
  },
  leadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1f2e',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#00d9ff15',
  },
  leadAvatar: {
    position: 'relative',
    marginRight: 12,
  },
  leadAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  leadAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadAvatarInitial: {
    fontSize: 20,
    fontWeight: '600',
    color: '#9ca3af',
  },
  leadAvatarRing: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: '#00d9ff',
  },
  leadInfo: {
    flex: 1,
  },
  leadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  leadName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  scheduledTime: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  leadProperty: {
    fontSize: 13,
    fontWeight: '500',
    color: '#e5e7eb',
  },
  leadLocation: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  leadMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastContactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  lastContactText: {
    fontSize: 11,
    color: '#9ca3af',
  },
  budgetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  budgetText: {
    fontSize: 11,
    color: '#9ca3af',
  },
});
