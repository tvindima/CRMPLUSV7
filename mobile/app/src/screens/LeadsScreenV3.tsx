/**
 * LeadsScreen - Redesigned to match mockup
 * Com tabs: Todos, Novos, Em Contacto, Agendados, Convertidos
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { apiService } from '../services/api';

type RootStackParamList = {
  NewLead: undefined;
  LeadDetail: { id: number };
  [key: string]: any;
};

type LeadStatus = 'all' | 'new' | 'contacted' | 'scheduled' | 'converted';

interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  budget?: number;
  origin?: string;
  created_at: string;
}

const TABS: { label: string; value: LeadStatus }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Novos', value: 'new' },
  { label: 'Em Contacto', value: 'contacted' },
  { label: 'Agendados', value: 'scheduled' },
  { label: 'Convertidos', value: 'converted' },
];

export default function LeadsScreenV3() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<LeadStatus>('all');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLeads();
  }, [activeTab]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const status = activeTab === 'all' ? undefined : activeTab;
      const response = await apiService.get<any>(
        `/mobile/leads${status ? `?status=${status}` : '?my_leads=true'}`
      );
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return '#00d9ff';
      case 'contacted':
        return '#8b5cf6';
      case 'scheduled':
        return '#d946ef';
      case 'converted':
        return '#10b981';
      default:
        return '#9ca3af';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return 'Novo';
      case 'contacted':
        return 'Em Contacto';
      case 'scheduled':
        return 'Agendado';
      case 'converted':
        return 'Convertido';
      default:
        return status;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leads</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('NewLead')}
        >
          <Ionicons name="add-circle" size={32} color="#00d9ff" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            style={[styles.tab, activeTab === tab.value && styles.tabActive]}
            onPress={() => setActiveTab(tab.value)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.value && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Leads List */}
      <ScrollView
        style={styles.leadsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00d9ff"
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00d9ff" />
          </View>
        ) : leads.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#6b7280" />
            <Text style={styles.emptyStateText}>Sem leads nesta categoria</Text>
            <Text style={styles.emptyStateSubtext}>
              Adicione novos leads para começar
            </Text>
          </View>
        ) : (
          leads.map((lead) => (
            <TouchableOpacity
              key={lead.id}
              style={styles.leadCard}
              onPress={() =>
                navigation.navigate('LeadDetail', { id: lead.id })
              }
            >
              <View style={styles.leadHeader}>
                <View style={styles.leadAvatar}>
                  <Ionicons name="person" size={24} color="#00d9ff" />
                </View>
                <View style={styles.leadInfo}>
                  <Text style={styles.leadName}>{lead.name}</Text>
                  <Text style={styles.leadContact}>{lead.email}</Text>
                  <Text style={styles.leadContact}>{lead.phone}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${getStatusColor(lead.status)}20` },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(lead.status) },
                    ]}
                  >
                    {getStatusLabel(lead.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.leadFooter}>
                {lead.budget && (
                  <View style={styles.leadMetric}>
                    <Ionicons name="cash-outline" size={16} color="#9ca3af" />
                    <Text style={styles.leadMetricText}>
                      {lead.budget.toLocaleString('pt-PT', {
                        style: 'currency',
                        currency: 'EUR',
                        maximumFractionDigits: 0,
                      })}
                    </Text>
                  </View>
                )}
                {lead.origin && (
                  <View style={styles.leadMetric}>
                    <Ionicons name="location-outline" size={16} color="#9ca3af" />
                    <Text style={styles.leadMetricText}>{lead.origin}</Text>
                  </View>
                )}
                <View style={styles.leadMetric}>
                  <Ionicons name="time-outline" size={16} color="#9ca3af" />
                  <Text style={styles.leadMetricText}>
                    {new Date(lead.created_at).toLocaleDateString('pt-PT')}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
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
    fontWeight: '800',
    color: '#ffffff',
  },
  addButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    maxHeight: 60,
    marginBottom: 16,
  },
  tabsContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1a1f2e',
    borderWidth: 1,
    borderColor: '#374151',
  },
  tabActive: {
    backgroundColor: '#00d9ff20',
    borderColor: '#00d9ff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  tabTextActive: {
    color: '#00d9ff',
  },
  leadsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  leadCard: {
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#00d9ff40',
  },
  leadHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  leadAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00d9ff20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#00d9ff40',
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  leadContact: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  leadFooter: {
    flexDirection: 'row',
    gap: 16,
  },
  leadMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  leadMetricText: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  },
});
