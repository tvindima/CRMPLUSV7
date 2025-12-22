/**
 * Tela de Leads do Agente
 * App B2E - Uso exclusivo de agentes imobiliários Imóveis Mais
 * Pipeline de leads atribuídos ao agente autenticado
 */

import React, { useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  RefreshControl,
  Linking,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';
import type { Lead } from '../types';

export default function LeadsScreen({ navigation }: any) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const statusFilters = [
    { label: 'Todos', value: null },
    { label: 'Novos', value: 'new' },
    { label: 'Contactados', value: 'contacted' },
    { label: 'Qualificados', value: 'qualified' },
    { label: 'Convertidos', value: 'converted' },
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: Colors.light.info,
      contacted: Colors.light.warning,
      qualified: Colors.light.primary,
      converted: Colors.light.success,
      lost: Colors.light.error,
    };
    return colors[status] || Colors.light.textSecondary;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      new: 'Novo',
      contacted: 'Contactado',
      qualified: 'Qualificado',
      converted: 'Convertido',
      lost: 'Perdido',
    };
    return labels[status] || status;
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    Linking.openURL(`whatsapp://send?phone=${cleanPhone}`);
  };

  const LeadCard = ({ item }: { item: Lead }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('LeadDetails', { id: item.id })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>
        <Text style={styles.cardDate}>
          {new Date(item.created_at).toLocaleDateString('pt-PT')}
        </Text>
      </View>

      {item.email && (
        <Text style={styles.cardInfo}>📧 {item.email}</Text>
      )}
      {item.phone && (
        <Text style={styles.cardInfo}>📱 {item.phone}</Text>
      )}

      {item.message && (
        <Text style={styles.cardMessage} numberOfLines={2}>
          💬 {item.message}
        </Text>
      )}

      <View style={styles.cardActions}>
        {item.phone && (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleCall(item.phone!)}
            >
              <Text style={styles.actionButtonText}>📞 Ligar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleWhatsApp(item.phone!)}
            >
              <Text style={styles.actionButtonText}>💬 WhatsApp</Text>
            </TouchableOpacity>
          </>
        )}
        {item.email && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEmail(item.email!)}
          >
            <Text style={styles.actionButtonText}>📧 Email</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Status Filters */}
      <View style={styles.filtersContainer}>
        {statusFilters.map((filter) => (
          <TouchableOpacity
            key={filter.label}
            style={[
              styles.filterChip,
              statusFilter === filter.value && styles.filterChipActive,
            ]}
            onPress={() => setStatusFilter(filter.value)}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === filter.value && styles.filterChipTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Leads List */}
      <FlatList
        data={leads}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <LeadCard item={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {}}
            colors={[Colors.light.primary]}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>👤</Text>
              <Text style={styles.emptyTitle}>Nenhum lead</Text>
              <Text style={styles.emptySubtitle}>
                Os leads aparecem aqui quando gerados
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  filtersContainer: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Colors.light.surface,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
  },
  filterChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterChipText: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.text,
    fontWeight: Typography.weights.medium,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: Spacing.md,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  cardHeader: {
    marginBottom: Spacing.md,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  cardTitle: {
    flex: 1,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.text,
    marginRight: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: Typography.sizes.xs,
    color: '#fff',
    fontWeight: Typography.weights.semibold,
  },
  cardDate: {
    fontSize: Typography.sizes.xs,
    color: Colors.light.textSecondary,
  },
  cardInfo: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
  },
  cardMessage: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.text,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  actionButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyText: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
});
