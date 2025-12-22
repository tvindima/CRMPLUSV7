/**
 * Dashboard do Agente Imobiliário — V2 com Design Neon Dark
 * PASSO 1 - Implementação com componentes base
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, textStyles, radius, glow } from '../theme';
import {
  ScreenWrapper,
  StatCard,
  VisitCard,
  type VisitCardData,
  LoadingState,
  EmptyState,
  ErrorState,
} from '../components';
import { visitsService, type UpcomingVisit } from '../services/visits';
import { apiService } from '../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DashboardStats {
  properties: number;
  leads: number;
  tasks_pending: number;
  tasks_today: number;
}

interface FeaturedProperty {
  id: number;
  title: string;
  location: string;
  price: number;
  image_url?: string;
}

type TabFilter = 'progress' | 'new' | 'completed';

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabFilter>('progress');
  const [stats, setStats] = useState<DashboardStats>({
    properties: 0,
    leads: 0,
    tasks_pending: 0,
    tasks_today: 0,
  });
  const [upcomingVisits, setUpcomingVisits] = useState<UpcomingVisit[]>([]);
  const [featuredProperties, setFeaturedProperties] = useState<FeaturedProperty[]>([]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom Dia';
    if (hour < 18) return 'Boa Tarde';
    return 'Boa Noite';
  };

  const getFirstName = () => {
    return user?.name?.split(' ')[0] || 'Agente';
  };

  const loadUpcomingVisits = async () => {
    try {
      console.log('[DASHBOARD] Carregando próximas visitas...');
      const visits = await visitsService.getUpcoming(5);
      console.log('[DASHBOARD] Visitas carregadas:', visits.length);
      setUpcomingVisits(visits);
    } catch (error: any) {
      console.error('[DASHBOARD] ❌ ERRO ao carregar próximas visitas:', error);
      // Deixar vazio em caso de erro
      setUpcomingVisits([]);
    }
  };

  const loadStats = async () => {
    try {
      console.log('[DASHBOARD] Carregando estatísticas...');
      const response = await apiService.get<DashboardStats>('/mobile/dashboard/stats');
      console.log('[DASHBOARD] Stats carregadas:', response);
      setStats(response);
    } catch (error: any) {
      console.error('[DASHBOARD] ❌ ERRO ao carregar estatísticas:', error);
      // NÃO USAR MOCK - mostrar erro
      throw error;
    }
  };

  const loadFeaturedProperties = async () => {
    try {
      console.log('[DASHBOARD] Carregando imóveis em destaque...');
      const response = await apiService.get<any>('/mobile/properties?per_page=3&sort=price_desc');
      const properties: FeaturedProperty[] = response.items?.map((p: any) => ({
        id: p.id,
        title: p.title || p.description?.substring(0, 50) || 'Imóvel',
        location: [p.municipality, p.location].filter(Boolean).join(', ') || 'Lisboa',
        price: p.price || 0,
        image_url: p.images?.[0]?.url || undefined,
      })) || [];
      setFeaturedProperties(properties.slice(0, 3));
    } catch (error: any) {
      console.error('[DASHBOARD] ❌ ERRO ao carregar imóveis destaque:', error);
      setFeaturedProperties([]);
    }
  };

  const loadData = async () => {
    try {
      console.log('[DASHBOARD] Iniciando carregamento de dados...');
      setError(null);
      await Promise.all([
        loadStats(),
        loadUpcomingVisits(),
        loadFeaturedProperties(),
      ]);
      console.log('[DASHBOARD] ✅ Todos os dados carregados com sucesso');
    } catch (error: any) {
      console.error('[DASHBOARD] ❌ Erro ao carregar dados:', error);
      setError(error.message || 'Erro ao carregar dados do dashboard');
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData().finally(() => setInitialLoading(false));
  }, []);

  if (initialLoading) {
    return (
      <ScreenWrapper>
        <LoadingState message="A carregar dashboard..." />
      </ScreenWrapper>
    );
  }

  if (error && stats.properties === 0 && upcomingVisits.length === 0) {
    return (
      <ScreenWrapper>
        <ErrorState
          message={error}
          onRetry={() => loadData().finally(() => setInitialLoading(false))}
        />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper noPadding>
      {/* Header Fixo */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <View style={styles.greetingSection}>
            <Text style={styles.greeting}>
              <Text style={styles.userNameGradient}>{getGreeting()}, </Text>
              <Text style={styles.userName}>{getFirstName()}</Text>
            </Text>
          </View>
          <TouchableOpacity style={styles.avatarButton} onPress={() => navigation.navigate('Perfil')}>
            <LinearGradient
              colors={[colors.brand.cyan, colors.brand.purple]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGradientBorder}
            >
              <View style={styles.avatarInner}>
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>
                    {user?.name?.charAt(0).toUpperCase() || 'A'}
                  </Text>
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshData}
            tintColor={colors.brand.cyan}
            colors={[colors.brand.cyan]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Tabs de Filtro */}
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
            style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
            onPress={() => setActiveTab('completed')}
          >
            <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
              Completos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Grid - 3 cards compactos */}
        <View style={styles.statsGrid}>
          <View style={styles.statCardWrapper}>
            <LinearGradient
              colors={[colors.brand.cyan, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statBorder}
            >
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{stats.tasks_today}</Text>
                <Text style={styles.statLabel}>Visitas{'\n'}Hoje</Text>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.statCardWrapper}>
            <LinearGradient
              colors={[colors.brand.magenta, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statBorder}
            >
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{stats.leads}</Text>
                <Text style={styles.statLabel}>Novos{'\n'}Leads</Text>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.statCardWrapper}>
            <LinearGradient
              colors={[colors.brand.cyan, colors.brand.purple]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statBorder}
            >
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{stats.properties}</Text>
                <Text style={styles.statLabel}>Imóveis{'\n'}🏠</Text>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Botão Novo Lead compacto */}
        <TouchableOpacity style={styles.newLeadButton} onPress={() => navigation.navigate('Leads')}>
          <Text style={styles.newLeadIcon}>+</Text>
          <Text style={styles.newLeadText}>Novo Lead</Text>
        </TouchableOpacity>

        {/* Próximas Visitas - máx 3 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próximas Visitas</Text>
          {upcomingVisits.length > 0 ? (
            upcomingVisits.slice(0, 3).map((visit) => (
              <VisitCard
                key={visit.id}
                visit={visit as VisitCardData}
                onPress={() => navigation.navigate('VisitDetails', { id: visit.id })}
              />
            ))
          ) : (
            <View style={styles.emptyVisits}>
              <Text style={styles.emptyVisitsText}>📅 Sem visitas agendadas</Text>
            </View>
          )}
        </View>

        {/* Imóveis em Destaque */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Imóveis em Destaque</Text>
          {featuredProperties.length > 0 ? (
            featuredProperties.map((property) => (
              <TouchableOpacity
                key={property.id}
                style={styles.propertyCard}
                onPress={() => navigation.navigate('Propriedades')}
              >
                <LinearGradient
                  colors={[colors.card.primary, colors.card.secondary + '80']}
                  style={styles.propertyCardGradient}
                >
                  {property.image_url && (
                    <Image source={{ uri: property.image_url }} style={styles.propertyImage} />
                  )}
                  {!property.image_url && (
                    <View style={styles.propertyImagePlaceholder}>
                      <Text style={styles.propertyImagePlaceholderText}>🏠</Text>
                    </View>
                  )}
                  <View style={styles.propertyInfo}>
                    <Text style={styles.propertyTitle} numberOfLines={1}>{property.title}</Text>
                    <Text style={styles.propertyLocation} numberOfLines={1}>{property.location}</Text>
                    <Text style={styles.propertyPrice}>
                      € {property.price.toLocaleString('pt-PT')}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyVisits}>
              <Text style={styles.emptyVisitsText}>🏘️ Sem imóveis disponíveis</Text>
            </View>
          )}
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  headerContainer: {
    backgroundColor: colors.background.primary,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary + '20',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  greetingSection: {
    flex: 1,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
  },
  userNameGradient: {
    color: colors.brand.cyan,
    fontWeight: '600',
  },
  userName: {
    color: colors.text.primary,
    fontWeight: '400',
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarGradientBorder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    fontSize: 18,
    color: colors.brand.cyan,
    fontWeight: '700',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingBottom: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.brand.cyan,
  },
  tabText: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.brand.cyan,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCardWrapper: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  statBorder: {
    padding: 2,
    borderRadius: radius.lg,
  },
  statContent: {
    backgroundColor: colors.card.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 85,
  },
  statValue: {
    fontSize: 38,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 13,
  },
  newLeadButton: {
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.brand.cyan,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
    backgroundColor: colors.brand.cyan + '05',
  },
  newLeadIcon: {
    fontSize: 20,
    color: colors.brand.cyan,
    fontWeight: '700',
  },
  newLeadText: {
    fontSize: 14,
    color: colors.brand.cyan,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptyVisits: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyVisitsText: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
  propertyCard: {
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  propertyCardGradient: {
    flexDirection: 'row',
    padding: spacing.sm,
    gap: spacing.sm,
  },
  propertyImage: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
  },
  propertyImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyImagePlaceholderText: {
    fontSize: 32,
  },
  propertyInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  propertyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  propertyLocation: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginBottom: 6,
  },
  propertyPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.brand.cyan,
  },
});
