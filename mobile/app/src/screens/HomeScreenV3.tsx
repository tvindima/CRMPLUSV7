/**
 * HomeScreen - Dashboard redesigned to match mockup
 * 3 stat cards + upcoming visits + featured properties
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
  visits_today: number;
  new_leads: number;
  properties: number;
}

interface UpcomingVisit {
  id: number;
  scheduled_at: string;
  lead_name: string;
  property_title: string;
  property_location: string;
}

interface FeaturedProperty {
  id: number;
  title: string;
  location: string;
  price: number;
  image_url?: string;
}

export default function HomeScreenV2({ navigation }: any) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
      setUpcomingVisits(response);
    } catch (error) {
      console.error('Error loading visits:', error);
      setUpcomingVisits([]);
    }
  };

  const loadFeaturedProperties = async () => {
    try {
      // my_properties=true filtra apenas imóveis do agente logado
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00d9ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00d9ff"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{getFirstName()}</Text>
          </View>
          <TouchableOpacity style={styles.avatar}>
            <Ionicons name="person-circle-outline" size={40} color="#00d9ff" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {/* Visitas Hoje */}
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#00d9ff20', '#00d9ff10']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statGradient}
            >
              <View style={styles.statIconContainer}>
                <Ionicons name="calendar" size={24} color="#00d9ff" />
              </View>
              <Text style={styles.statValue}>{stats.visits_today}</Text>
              <Text style={styles.statLabel}>Visitas Hoje</Text>
            </LinearGradient>
          </View>

          {/* Novos Leads */}
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#8b5cf620', '#8b5cf610']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statGradient}
            >
              <View style={[styles.statIconContainer, { backgroundColor: '#8b5cf630' }]}>
                <Ionicons name="people" size={24} color="#8b5cf6" />
              </View>
              <Text style={styles.statValue}>{stats.new_leads}</Text>
              <Text style={styles.statLabel}>Novos Leads</Text>
            </LinearGradient>
          </View>

          {/* Propriedades */}
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#d946ef20', '#d946ef10']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statGradient}
            >
              <View style={[styles.statIconContainer, { backgroundColor: '#d946ef30' }]}>
                <Ionicons name="business" size={24} color="#d946ef" />
              </View>
              <Text style={styles.statValue}>{stats.properties}</Text>
              <Text style={styles.statLabel}>Propriedades</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Próximas Visitas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Próximas Visitas</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Agenda')}>
              <Text style={styles.seeAllText}>Ver Todas</Text>
            </TouchableOpacity>
          </View>

          {upcomingVisits.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#6b7280" />
              <Text style={styles.emptyStateText}>Sem visitas agendadas</Text>
            </View>
          ) : (
            upcomingVisits.map((visit) => (
              <TouchableOpacity
                key={visit.id}
                style={styles.visitCard}
                onPress={() => {
                  /* Navigate to visit detail */
                }}
              >
                <View style={styles.visitHeader}>
                  <View style={styles.visitTimeContainer}>
                    <Ionicons name="time-outline" size={20} color="#00d9ff" />
                    <Text style={styles.visitTime}>
                      {new Date(visit.scheduled_at).toLocaleTimeString('pt-PT', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <View style={styles.visitDateBadge}>
                    <Text style={styles.visitDateText}>
                      {new Date(visit.scheduled_at).toLocaleDateString('pt-PT', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </Text>
                  </View>
                </View>
                <Text style={styles.visitClient}>{visit.lead_name}</Text>
                <Text style={styles.visitProperty}>{visit.property_title}</Text>
                <Text style={styles.visitLocation}>{visit.property_location}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Imóveis em Destaque */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Imóveis em Destaque</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Propriedades')}>
              <Text style={styles.seeAllText}>Ver Todos</Text>
            </TouchableOpacity>
          </View>

          {featuredProperties.map((property) => (
            <TouchableOpacity
              key={property.id}
              style={styles.propertyCard}
              onPress={() => {
                /* Navigate to property detail */
              }}
            >
              <Image
                source={{
                  uri:
                    property.image_url ||
                    'https://placehold.co/400x250/1a1f2e/00d9ff?text=Imóvel',
                }}
                style={styles.propertyImage}
              />
              <View style={styles.propertyInfo}>
                <Text style={styles.propertyTitle} numberOfLines={2}>
                  {property.title}
                </Text>
                <Text style={styles.propertyLocation}>{property.location}</Text>
                <Text style={styles.propertyPrice}>
                  {property.price?.toLocaleString('pt-PT', {
                    style: 'currency',
                    currency: 'EUR',
                  })}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
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
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '500',
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#00d9ff40',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#00d9ff40',
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00d9ff30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  seeAllText: {
    fontSize: 14,
    color: '#00d9ff',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00d9ff40',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 12,
  },
  visitCard: {
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#00d9ff40',
  },
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  visitTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  visitTime: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00d9ff',
  },
  visitDateBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#374151',
  },
  visitDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
  },
  visitClient: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  visitProperty: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 4,
  },
  visitLocation: {
    fontSize: 13,
    color: '#9ca3af',
  },
  propertyCard: {
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#00d9ff40',
  },
  propertyImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#374151',
  },
  propertyInfo: {
    padding: 16,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  propertyLocation: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
  },
  propertyPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00d9ff',
  },
});
