/**
 * Dashboard do Agente Imobiliário
 * App B2E - Uso exclusivo de agentes imobiliários Imóveis Mais
 * Mostra KPIs pessoais, próximas visitas e ações rápidas do agente
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, Image } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useAgent } from '../contexts/AgentContext';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';
import { visitsService, type UpcomingVisit } from '../services/visits';
import { apiService } from '../services/api';

interface DashboardStats {
  properties: number;
  leads: number;
  visits: number;
  conversions: number;
}

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const { agentProfile, loadAgentData } = useAgent();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    properties: 0,
    leads: 0,
    visits: 0,
    conversions: 0,
  });
  const [upcomingVisits, setUpcomingVisits] = useState<UpcomingVisit[]>([]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const loadUpcomingVisits = async () => {
    try {
      const visits = await visitsService.getUpcoming(5);
      setUpcomingVisits(visits);
    } catch (error: any) {
      console.error('Erro ao carregar próximas visitas:', error);
      if (error.status !== 401) { // Não mostrar erro se for 401 (interceptor vai lidar)
        Alert.alert('Erro', 'Não foi possível carregar as próximas visitas');
      }
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiService.get<DashboardStats>('/mobile/dashboard/stats');
      setStats(response);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      // Manter valores default em caso de erro
    }
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadUpcomingVisits(),
        loadAgentData(),
      ]);
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getAvatarUrl = () => {
    const avatarCandidate = agentProfile?.photo || agentProfile?.avatar_url || user?.avatar_url;
    if (!avatarCandidate) return null;
    if (avatarCandidate.startsWith('/')) {
      // Avatar servido via web público (mesma lógica do ProfileScreenV3)
      return `https://web-nymbcws7r-toinos-projects.vercel.app${avatarCandidate}`;
    }
    return avatarCandidate;
  };

  const avatarUrl = getAvatarUrl();

  const StatCard = ({ 
    label, 
    value, 
    color, 
    icon 
  }: { 
    label: string; 
    value: number; 
    color: string; 
    icon: string;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );

  const VisitCard = ({ visit }: { visit: UpcomingVisit }) => {
    const visitDate = new Date(visit.scheduled_at);
    const time = visitDate.toLocaleTimeString('pt-PT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return (
      <TouchableOpacity 
        style={styles.visitCard}
        onPress={() => navigation.navigate('VisitDetails', { id: visit.id })}
      >
        <View style={styles.visitTime}>
          <Text style={styles.visitTimeText}>{time}</Text>
        </View>
        <View style={styles.visitInfo}>
          <Text style={styles.visitProperty} numberOfLines={1}>
            {visit.property_title}
          </Text>
          {visit.lead_name && (
            <Text style={styles.visitLead}>👤 {visit.lead_name}</Text>
          )}
          {visit.property_reference && (
            <Text style={styles.visitReference}>Ref: {visit.property_reference}</Text>
          )}
        </View>
        <View style={[styles.visitStatusBadge, styles[`visitStatus_${visit.status}`]]}>
          <Text style={styles.visitStatusText}>
            {visit.status === 'scheduled' ? '📅' : '✓'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={refreshData}
          colors={[Colors.light.primary]}
        />
      }
    >
      {/* Greeting */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>{user?.name || 'Agente'}!</Text>
        </View>
        <TouchableOpacity style={styles.avatar}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsContainer}>
        <StatCard
          label="Minhas Angariações"
          value={stats.properties}
          color={Colors.light.primary}
          icon="🏠"
        />
        <StatCard
          label="Meus Leads"
          value={stats.leads}
          color={Colors.light.success}
          icon="👤"
        />
        <StatCard
          label="Visitas Hoje"
          value={stats.visits}
          color={Colors.light.warning}
          icon="📅"
        />
        <StatCard
          label="Conversões"
          value={stats.conversions}
          color={Colors.light.info}
          icon="✨"
        />
      </View>

      {/* Upcoming Visits */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Próximas Visitas</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Agenda')}>
            <Text style={styles.sectionLink}>Ver todas ›</Text>
          </TouchableOpacity>
        </View>

        {upcomingVisits.length > 0 ? (
          upcomingVisits.map((visit) => (
            <VisitCard key={visit.id} visit={visit} />
          ))
        ) : (
          <View style={styles.emptyVisits}>
            <Text style={styles.emptyVisitsIcon}>📅</Text>
            <Text style={styles.emptyVisitsText}>
              Nenhuma visita agendada para hoje
            </Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ações Rápidas</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Propriedades')}
          >
            <Text style={styles.actionIcon}>🏠</Text>
            <Text style={styles.actionText}>Propriedades</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Leads')}
          >
            <Text style={styles.actionIcon}>👤</Text>
            <Text style={styles.actionText}>Leads</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionIcon}>📅</Text>
            <Text style={styles.actionText}>Agendar Visita</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionText}>Relatórios</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.light.surface,
    ...Shadows.sm,
  },
  greeting: {
    fontSize: Typography.sizes.md,
    color: Colors.light.textSecondary,
  },
  userName: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.light.text,
    marginTop: Spacing.xs,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    ...Shadows.sm,
  },
  statIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.textSecondary,
    marginTop: Spacing.xs,
  },
  section: {
    padding: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.light.text,
  },
  sectionLink: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.primary,
    fontWeight: Typography.weights.semibold,
  },
  visitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  visitTime: {
    backgroundColor: Colors.light.primary + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
  },
  visitTimeText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.light.primary,
  },
  visitInfo: {
    flex: 1,
  },
  visitProperty: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.text,
  },
  visitLead: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  visitAction: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visitActionText: {
    color: '#fff',
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
  emptyVisits: {
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  emptyVisitsIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyVisitsText: {
    fontSize: Typography.sizes.md,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.light.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.md,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  actionText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.light.text,
    textAlign: 'center',
  },
});
