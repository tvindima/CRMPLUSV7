/**
 * Leads Screen Redesign - Match com Design Fornecido
 * 3 tabs: Em Progresso | Novos | Convertidos
 * Cards modernos com avatar circular, status badge, última atividade
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
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, radius, textStyles } from '../theme';
import { apiService } from '../services/api';

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
type TabFilter = 'progress' | 'new' | 'converted';

interface Lead {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  property_title?: string;
  property_location?: string;
  status: LeadStatus;
  source?: string;
  last_contact?: string;
  created_at: string;
}

export default function LeadsScreenV2({ navigation }: any) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabFilter>('progress');
  const [leads, setLeads] = useState<Lead[]>([]);

  const loadLeads = async () => {
    try {
      console.log('[LEADS] Carregando leads...');
      const response = await apiService.get<any>('/mobile/leads?per_page=50');
      setLeads(response.items || []);
    } catch (error) {
      console.error('[LEADS] ❌ Erro ao carregar leads:', error);
      setLeads([]);
    }
  };

  const refreshLeads = async () => {
    setRefreshing(true);
    await loadLeads();
    setRefreshing(false);
  };

  useEffect(() => {
    loadLeads().finally(() => setLoading(false));
  }, []);

  const filteredLeads = leads.filter((lead) => {
    if (activeTab === 'new') return lead.status === 'new';
    if (activeTab === 'converted') return lead.status === 'converted';
    // Em Progresso: contacted ou qualified
    return lead.status === 'contacted' || lead.status === 'qualified';
  });

  const getStatusColor = (status: LeadStatus): string => {
    const colorMap: Record<LeadStatus, string> = {
      new: colors.brand.magenta,
      contacted: colors.brand.cyan,
      qualified: colors.brand.purple,
      converted: colors.success.primary,
      lost: colors.error.primary,
    };
    return colorMap[status] || colors.text.tertiary;
  };

  const getStatusLabel = (status: LeadStatus): string => {
    const labelMap: Record<LeadStatus, string> = {
      new: 'Novo',
      contacted: 'Em Contacto',
      qualified: 'Qualificado',
      converted: 'Convertido',
      lost: 'Perdido',
    };
    return labelMap[status] || status;
  };

  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Hoje';
    if (days === 1) return 'há 1d';
    if (days < 7) return `há ${days}d`;
    if (days < 30) return `há ${Math.floor(days / 7)}sem`;
    return `há ${Math.floor(days / 30)}m`;
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    Linking.openURL(`whatsapp://send?phone=+351${cleanPhone}`);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leads</Text>
        <TouchableOpacity style={styles.avatarButton} onPress={() => navigation.navigate('Perfil')}>
          <LinearGradient
            colors={[colors.brand.cyan, colors.brand.purple]}
            style={styles.avatarGradient}
          >
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
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
          style={[styles.tab, activeTab === 'converted' && styles.tabActive]}
          onPress={() => setActiveTab('converted')}
        >
          <Text style={[styles.tabText, activeTab === 'converted' && styles.tabTextActive]}>
            Convertidos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Botão Novo Lead */}
      <TouchableOpacity
        style={styles.newLeadButton}
        onPress={() => navigation.navigate('NewLead')}
      >
        <LinearGradient
          colors={[colors.brand.cyan, colors.brand.purple]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.newLeadGradient}
        >
          <Text style={styles.newLeadIcon}>+</Text>
          <Text style={styles.newLeadText}>Novo Lead</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Lista de Leads */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshLeads}
            tintColor={colors.brand.cyan}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredLeads.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>Nenhum lead</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'new' && 'Nenhum lead novo no momento'}
              {activeTab === 'converted' && 'Ainda não há leads convertidos'}
              {activeTab === 'progress' && 'Nenhum lead em progresso'}
            </Text>
          </View>
        ) : (
          filteredLeads.map((lead) => (
            <TouchableOpacity
              key={lead.id}
              style={styles.leadCard}
              onPress={() => navigation.navigate('LeadDetail', { id: lead.id })}
            >
              <LinearGradient
                colors={[colors.card.primary, colors.card.secondary + '60']}
                style={styles.leadCardGradient}
              >
                {/* Avatar & Info */}
                <View style={styles.leadHeader}>
                  <LinearGradient
                    colors={[colors.brand.cyan, colors.brand.purple]}
                    style={styles.leadAvatar}
                  >
                    <Text style={styles.leadAvatarText}>{getInitials(lead.name)}</Text>
                  </LinearGradient>
                  <View style={styles.leadInfo}>
                    <Text style={styles.leadName}>{lead.name}</Text>
                    <Text style={styles.leadProperty} numberOfLines={1}>
                      {lead.property_title || 'Sem propriedade associada'}
                    </Text>
                    {lead.property_location && (
                      <Text style={styles.leadLocation}>{lead.property_location}</Text>
                    )}
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(lead.status) + '30' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(lead.status) }]}>
                      {getStatusLabel(lead.status)}
                    </Text>
                  </View>
                </View>

                {/* Última Atividade */}
                <View style={styles.leadFooter}>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityIcon}>📧</Text>
                    <Text style={styles.activityText}>
                      Emailed {getTimeAgo(lead.last_contact || lead.created_at)}
                    </Text>
                  </View>
                  {lead.phone && (
                    <View style={styles.contactButtons}>
                      <TouchableOpacity
                        style={styles.contactButton}
                        onPress={() => handleCall(lead.phone!)}
                      >
                        <Text style={styles.contactIcon}>📞</Text>
                        <Text style={styles.contactTime}>{lead.phone.substring(0, 9)}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.contactButton}
                        onPress={() => handleWhatsApp(lead.phone!)}
                      >
                        <Text style={styles.contactIcon}>💬</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary + '20',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.brand.cyan,
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
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
  newLeadButton: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  newLeadGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  newLeadIcon: {
    fontSize: 20,
    color: colors.text.primary,
    fontWeight: '700',
  },
  newLeadText: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  leadCard: {
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  leadCardGradient: {
    padding: spacing.md,
  },
  leadHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  leadAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  leadAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  leadInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  leadName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  leadProperty: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  leadLocation: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  leadFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.primary + '15',
  },
  activityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  activityIcon: {
    fontSize: 14,
  },
  activityText: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.background.secondary,
  },
  contactIcon: {
    fontSize: 14,
  },
  contactTime: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
