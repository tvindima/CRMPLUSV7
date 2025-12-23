/**
 * HomeScreen V4 - Dashboard fiel ao mockup
 * Avatar real, tabs, botão + Novo Lead, Próximas Visitas, Imóveis em Destaque
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

interface DashboardStats {
  visits_today?: number;
  tasks_today?: number;
  new_leads?: number;
  leads?: number;
  properties: number;
}

interface AgentProfile {
  photo?: string;
  avatar_url?: string;
  name?: string;
}

interface UpcomingVisit {
  id: number;
  scheduled_date: string;
  lead_name?: string;
  client_name?: string;
  property_title?: string;
  property_location?: string;
  status?: string;
}

interface FeaturedProperty {
  id: number;
  title?: string;
  reference?: string;
  location?: string;
  municipality?: string;
  price: number;
  image_url?: string;
  images?: string[];
}

type TabType = 'progress' | 'new' | 'complete';

export default function HomeScreenV4({ navigation }: any) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('progress');
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    visits_today: 0,
    new_leads: 0,
    properties: 0,
  });
  const [upcomingVisits, setUpcomingVisits] = useState<UpcomingVisit[]>([]);
  const [featuredProperties, setFeaturedProperties] = useState<FeaturedProperty[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadAgentProfile(),
        loadStats(),
        loadUpcomingVisits(),
        loadFeaturedProperties(),
      ]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAgentProfile = async () => {
    try {
      // Try to get agent profile with photo - use dashboard stats which includes agent_id
      const statsResponse = await apiService.get<any>('/mobile/dashboard/stats');
      if (statsResponse?.agent_id) {
        // Get agent details
        try {
          const agentResponse = await apiService.get<any>(`/agents/${statsResponse.agent_id}`);
          if (agentResponse) {
            setAgentProfile({
              photo: agentResponse.photo,
              avatar_url: agentResponse.avatar_url,
              name: agentResponse.name,
            });
          }
        } catch (agentError) {
          console.log('Could not load agent profile, using fallback');
        }
      }
    } catch (error) {
      console.error('Error loading agent profile:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiService.get<DashboardStats>('/mobile/dashboard/stats');
      setStats(response);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadUpcomingVisits = async () => {
    try {
      const response = await apiService.get<UpcomingVisit[]>('/mobile/visits/upcoming?limit=3');
      setUpcomingVisits(response || []);
    } catch (error) {
      console.error('Error loading visits:', error);
      setUpcomingVisits([]);
    }
  };

  const loadFeaturedProperties = async () => {
    try {
      const response = await apiService.get<any>('/mobile/properties?per_page=3&sort=price_desc&my_properties=true');
      setFeaturedProperties(response.items || response || []);
    } catch (error) {
      console.error('Error loading properties:', error);
      setFeaturedProperties([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom Dia';
    if (hour < 18) return 'Boa Tarde';
    return 'Boa Noite';
  };

  const getFirstName = () => {
    return user?.name?.split(' ')[0] || 'Agente';
  };

  const getAvatarUrl = () => {
    if (agentProfile?.photo) return agentProfile.photo;
    if (agentProfile?.avatar_url) {
      // If it's a relative path, prepend API base URL
      if (agentProfile.avatar_url.startsWith('/')) {
        return `https://crmplusv7-production.up.railway.app${agentProfile.avatar_url}`;
      }
      return agentProfile.avatar_url;
    }
    return null;
  };

  const getVisitStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'scheduled': return '#00d9ff';
      case 'confirmed': return '#10b981';
      case 'completed': return '#8b5cf6';
      default: return '#00d9ff';
    }
  };

  const getVisitStatusLabel = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'scheduled': return 'Novo';
      case 'confirmed': return 'Contactado';
      case 'completed': return 'Visitado há a';
      default: return status || 'Novo';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00d9ff" />
      </View>
    );
  }

  const avatarUrl = getAvatarUrl();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00d9ff" />
        }
      >
        {/* Header with Avatar */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{getFirstName()}</Text>
          </View>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={() => navigation.navigate('Perfil')}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <LinearGradient
                colors={['#00d9ff', '#8b5cf6', '#d946ef']}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarInitial}>{getFirstName()[0]}</Text>
              </LinearGradient>
            )}
            {/* Glow effect */}
            <View style={styles.avatarGlow} />
          </TouchableOpacity>
        </View>

        {/* Tabs: Em Progresso | Novos | Completos */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'progress' && styles.tabActive]}
            onPress={() => setActiveTab('progress')}
          >
            <Text style={[styles.tabText, activeTab === 'progress' && styles.tabTextActive]}>
              Em Progresso
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'new' && styles.tabActive]}
            onPress={() => setActiveTab('new')}
          >
            <Text style={[styles.tabText, activeTab === 'new' && styles.tabTextActive]}>
              Novos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'complete' && styles.tabActive]}
            onPress={() => setActiveTab('complete')}
          >
            <Text style={[styles.tabText, activeTab === 'complete' && styles.tabTextActive]}>
              Completos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigation.navigate('Agenda')}
          >
            <LinearGradient
              colors={['rgba(0,217,255,0.15)', 'rgba(0,217,255,0.05)']}
              style={styles.statGradient}
            >
              <Text style={styles.statValue}>{stats.tasks_today || stats.visits_today || 0}</Text>
              <Text style={styles.statLabel}>Visitas{'\n'}Hoje</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigation.navigate('Leads')}
          >
            <LinearGradient
              colors={['rgba(139,92,246,0.15)', 'rgba(139,92,246,0.05)']}
              style={styles.statGradient}
            >
              <Text style={[styles.statValue, { color: '#8b5cf6' }]}>
                {stats.new_leads || stats.leads || 0}
              </Text>
              <Text style={styles.statLabel}>Novos{'\n'}Leads</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigation.navigate('Propriedades')}
          >
            <LinearGradient
              colors={['rgba(217,70,239,0.15)', 'rgba(217,70,239,0.05)']}
              style={styles.statGradient}
            >
              <Text style={[styles.statValue, { color: '#d946ef' }]}>{stats.properties}</Text>
              <Text style={styles.statLabel}>Imóveis</Text>
              <Ionicons name="home" size={16} color="#d946ef" style={{ marginTop: 4 }} />
            </LinearGradient>
          </TouchableOpacity>
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

        {/* Próximas Visitas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próximas Visitas</Text>

          {upcomingVisits.length === 0 ? (
            <View style={styles.emptyVisits}>
              <Ionicons name="calendar-outline" size={32} color="#6b7280" />
              <Text style={styles.emptyText}>Sem visitas agendadas</Text>
            </View>
          ) : (
            upcomingVisits.map((visit) => (
              <TouchableOpacity key={visit.id} style={styles.visitCard}>
                {/* Property thumbnail */}
                <View style={styles.visitThumbnail}>
                  <Image
                    source={{ uri: 'https://placehold.co/80x60/1a1f2e/00d9ff?text=Casa' }}
                    style={styles.visitImage}
                  />
                </View>
                <View style={styles.visitInfo}>
                  <View style={styles.visitHeader}>
                    <Text style={styles.visitTitle} numberOfLines={1}>
                      {visit.property_title || 'Imóvel'}
                    </Text>
                    <Text style={styles.visitTime}>
                      {new Date(visit.scheduled_date).toLocaleTimeString('pt-PT', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <Text style={styles.visitLocation} numberOfLines={1}>
                    {visit.property_location}
                  </Text>
                  <View style={styles.visitMeta}>
                    <View style={styles.visitMetaItem}>
                      <View style={[styles.statusDot, { backgroundColor: getVisitStatusColor(visit.status) }]} />
                      <Text style={styles.visitMetaText}>Emailed há 2d</Text>
                      <Ionicons name="mail-outline" size={12} color="#9ca3af" />
                    </View>
                    <View style={styles.visitBadge}>
                      <Text style={[styles.visitBadgeText, { color: getVisitStatusColor(visit.status) }]}>
                        {getVisitStatusLabel(visit.status)}
                      </Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Imóveis em Destaque */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Imóveis em Destaque</Text>

          {featuredProperties.map((property) => {
            const imageUrl = property.image_url || 
              (property.images && property.images[0]) || 
              'https://placehold.co/400x200/1a1f2e/00d9ff?text=Imóvel';
            
            return (
              <TouchableOpacity
                key={property.id}
                style={styles.propertyCard}
                onPress={() => navigation.navigate('PropertyDetail', { id: property.id })}
              >
                <Image source={{ uri: imageUrl }} style={styles.propertyImage} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.9)']}
                  style={styles.propertyOverlay}
                >
                  <View style={styles.propertyInfo}>
                    <Text style={styles.propertyTitle}>
                      {property.title || 'Imóvel'}
                    </Text>
                    <Text style={styles.propertyLocation}>
                      {property.location || property.municipality || 'Lisboa'}
                    </Text>
                    <Text style={styles.propertyPrice}>
                      € {property.price?.toLocaleString('pt-PT')}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>

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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0e1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: '#9ca3af',
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#00d9ff',
  },
  avatarGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  avatarGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#d946ef40',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
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
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#00d9ff30',
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#00d9ff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 16,
  },
  newLeadButton: {
    marginHorizontal: 20,
    marginBottom: 24,
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
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  emptyVisits: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  visitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#00d9ff20',
  },
  visitThumbnail: {
    width: 64,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  visitImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2a2f3e',
  },
  visitInfo: {
    flex: 1,
  },
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  visitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  visitTime: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
  },
  visitLocation: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  visitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  visitMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  visitMetaText: {
    fontSize: 11,
    color: '#9ca3af',
  },
  visitBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#00d9ff15',
    borderRadius: 4,
  },
  visitBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  propertyCard: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  propertyImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2a2f3e',
  },
  propertyOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingTop: 40,
  },
  propertyInfo: {
    flexDirection: 'column',
  },
  propertyTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  propertyLocation: {
    fontSize: 14,
    color: '#e5e7eb',
    marginBottom: 2,
  },
  propertyPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00d9ff',
  },
});
